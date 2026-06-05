const express = require('express');
const router = express.Router();
const Guardado = require('../models/Guardado');
const Oferta = require('../models/Oferta');
const { authMiddleware } = require('../middleware/auth');

router.post('/', authMiddleware, async (req, res) => {
  try {
    const { oferta_id } = req.body;
    if (!oferta_id) return res.status(400).json({ error: 'oferta_id requerido' });
    const oferta = await Oferta.findById(oferta_id);
    if (!oferta) return res.status(404).json({ error: 'Oferta no encontrada' });
    const existente = await Guardado.findOne({ usuario_id: req.usuario._id, oferta_id });
    if (existente) {
      await Guardado.deleteOne({ _id: existente._id });
      return res.json({ guardado: false, mensaje: 'Oferta removida de guardados' });
    }
    await new Guardado({ usuario_id: req.usuario._id, oferta_id }).save();
    res.json({ guardado: true, mensaje: 'Oferta guardada' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/', authMiddleware, async (req, res) => {
  try {
    const guardados = await Guardado.find({ usuario_id: req.usuario._id }).lean();
    const ofertasIds = guardados.map(g => g.oferta_id);
    const ofertas = await Oferta.find({ _id: { $in: ofertasIds }, activa: true }).sort({ createdAt: -1 }).lean();
    res.json(ofertas);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/ids', authMiddleware, async (req, res) => {
  try {
    const guardados = await Guardado.find({ usuario_id: req.usuario._id }).lean();
    res.json(guardados.map(g => g.oferta_id.toString()));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
