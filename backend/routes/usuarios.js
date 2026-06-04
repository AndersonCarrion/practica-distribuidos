const express = require('express');
const router = express.Router();
const Seguidor = require('../models/Seguidor');
const { authMiddleware } = require('../middleware/auth');

router.post('/seguir', authMiddleware, async (req, res) => {
  try {
    const { institucion_id } = req.body;
    if (!institucion_id) return res.status(400).json({ error: 'institucion_id requerido' });
    if (req.usuario.rol !== 'postulante') {
      return res.status(403).json({ error: 'Solo postulantes pueden seguir instituciones' });
    }
    const existente = await Seguidor.findOne({ usuario_id: req.usuario._id, institucion_id });
    if (existente) {
      await Seguidor.deleteOne({ _id: existente._id });
      return res.json({ siguiendo: false, mensaje: 'Dejaste de seguir' });
    }
    await new Seguidor({ usuario_id: req.usuario._id, institucion_id }).save();
    res.json({ siguiendo: true, mensaje: 'Ahora sigues a esta institución' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/siguiendo', authMiddleware, async (req, res) => {
  try {
    const seguidores = await Seguidor.find({ usuario_id: req.usuario._id }).lean();
    res.json(seguidores.map(s => s.institucion_id));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
