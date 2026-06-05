const express = require('express');
const router = express.Router();
const Oferta = require('../models/Oferta');
const { authMiddleware, soloInstitucion } = require('../middleware/auth');
const { validarOferta } = require('../middleware/validar');

router.get('/', async (req, res) => {
  try {
    const { page = 1, limit = 15, categoria, salario_min, salario_max, modalidad, orden, buscar } = req.query;
    const filtro = { activa: true };
    if (categoria) filtro.categoria = categoria;
    if (modalidad) filtro.modalidad = modalidad;
    if (salario_min) filtro.salario_min = { $gte: Number(salario_min) };
    if (salario_max) filtro.salario_max = { $lte: Number(salario_max) };
    if (buscar) {
      filtro.$or = [
        { titulo: { $regex: buscar, $options: 'i' } },
        { descripcion: { $regex: buscar, $options: 'i' } }
      ];
    }
    let sort = { destacada: -1, createdAt: -1 };
    if (orden === 'reciente') sort = { createdAt: -1 };
    if (orden === 'salario') sort = { salario_max: -1 };

    const skip = (Number(page) - 1) * Number(limit);
    const [ofertas, total] = await Promise.all([
      Oferta.find(filtro).sort(sort).skip(skip).limit(Number(limit)).lean(),
      Oferta.countDocuments(filtro)
    ]);
    res.json({
      ofertas,
      page: Number(page),
      limit: Number(limit),
      total,
      totalPages: Math.ceil(total / Number(limit))
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const oferta = await Oferta.findById(req.params.id).lean();
    if (!oferta) return res.status(404).json({ error: 'Oferta no encontrada' });
    res.json(oferta);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/', authMiddleware, soloInstitucion, validarOferta, async (req, res) => {
  try {
    const oferta = new Oferta({
      ...req.body,
      institucion_id: req.usuario.institucion_id,
      institucion_nombre: req.usuario.nombre,
      logo_url: req.usuario.logo_url || ''
    });
    await oferta.save();
    res.status(201).json(oferta);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/:id', authMiddleware, soloInstitucion, validarOferta, async (req, res) => {
  try {
    const oferta = await Oferta.findOne({ _id: req.params.id, institucion_id: req.usuario.institucion_id });
    if (!oferta) return res.status(404).json({ error: 'Oferta no encontrada o no autorizada' });
    Object.assign(oferta, req.body);
    await oferta.save();
    res.json(oferta);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/:id', authMiddleware, soloInstitucion, async (req, res) => {
  try {
    const oferta = await Oferta.findOneAndDelete({ _id: req.params.id, institucion_id: req.usuario.institucion_id });
    if (!oferta) return res.status(404).json({ error: 'Oferta no encontrada o no autorizada' });
    res.json({ mensaje: 'Oferta eliminada' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/:id/destacar', authMiddleware, soloInstitucion, async (req, res) => {
  try {
    const oferta = await Oferta.findOne({ _id: req.params.id, institucion_id: req.usuario.institucion_id });
    if (!oferta) return res.status(404).json({ error: 'Oferta no encontrada o no autorizada' });
    const horas = req.body.horas || 24;
    oferta.destacada = true;
    oferta.destacada_hasta = new Date(Date.now() + horas * 60 * 60 * 1000);
    await oferta.save();
    res.json({ mensaje: `Oferta destacada por ${horas} horas`, oferta });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/institucion/mis-ofertas', authMiddleware, soloInstitucion, async (req, res) => {
  try {
    const ofertas = await Oferta.find({ institucion_id: req.usuario.institucion_id }).sort({ createdAt: -1 }).lean();
    res.json(ofertas);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
