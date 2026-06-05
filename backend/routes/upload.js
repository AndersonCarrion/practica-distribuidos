const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const Usuario = require('../models/Usuario');
const Oferta = require('../models/Oferta');
const { authMiddleware, soloInstitucion } = require('../middleware/auth');

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, '..', 'uploads'));
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `logo_${req.usuario._id}${ext}`);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 2 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowed = /jpeg|jpg|png|gif|webp|svg/;
    const ext = allowed.test(path.extname(file.originalname).toLowerCase());
    const mime = allowed.test(file.mimetype);
    if (ext && mime) return cb(null, true);
    cb(new Error('Solo imágenes (jpg, png, gif, webp, svg)'));
  }
});

router.post('/logo', authMiddleware, soloInstitucion, upload.single('logo'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'Archivo requerido' });
    const logo_url = `/uploads/${req.file.filename}`;
    await Usuario.findByIdAndUpdate(req.usuario._id, { logo_url });
    await Oferta.updateMany(
      { institucion_id: req.usuario.institucion_id },
      { logo_url }
    );
    res.json({ logo_url, mensaje: 'Logo actualizado en perfil y ofertas' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
