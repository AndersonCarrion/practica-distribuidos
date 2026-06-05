const express = require('express');
const router = express.Router();
const Interaccion = require('../models/Interaccion');
const Oferta = require('../models/Oferta');
const { authMiddleware } = require('../middleware/auth');
const { validarInteraccion } = require('../middleware/validar');

router.get('/:ofertaId', async (req, res) => {
  try {
    const interacciones = await Interaccion.find({ oferta_id: req.params.ofertaId })
      .sort({ createdAt: 1 })
      .lean();
    const preguntas = interacciones.filter(i => i.tipo === 'pregunta');
    const respuestas = interacciones.filter(i => i.tipo === 'respuesta');
    const hilo = preguntas.map(p => ({
      ...p,
      respuesta: respuestas.find(r => r.padre_id && r.padre_id.toString() === p._id.toString()) || null
    }));
    res.json(hilo);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/', authMiddleware, validarInteraccion, async (req, res) => {
  try {
    const { oferta_id, texto, tipo, padre_id } = req.body;
    const oferta = await Oferta.findById(oferta_id);
    if (!oferta) return res.status(404).json({ error: 'Oferta no encontrada' });
    if (tipo === 'respuesta' && !padre_id) {
      return res.status(400).json({ error: 'padre_id requerido para respuestas' });
    }
    if (tipo === 'respuesta') {
      const pregunta = await Interaccion.findById(padre_id);
      if (!pregunta || pregunta.tipo !== 'pregunta') {
        return res.status(400).json({ error: 'La respuesta debe vincularse a una pregunta válida' });
      }
      const yaRespondida = await Interaccion.findOne({ padre_id, tipo: 'respuesta' });
      if (yaRespondida) {
        return res.status(400).json({ error: 'Esta pregunta ya tiene una respuesta' });
      }
      if (req.usuario.rol !== 'institucion' || req.usuario.institucion_id !== oferta.institucion_id) {
        return res.status(403).json({ error: 'Solo la institución autora puede responder' });
      }
    }
    const interaccion = new Interaccion({
      oferta_id,
      usuario_id: req.usuario._id,
      usuario_nombre: req.usuario.nombre,
      texto,
      tipo,
      padre_id: padre_id || null
    });
    await interaccion.save();
    res.status(201).json(interaccion);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
