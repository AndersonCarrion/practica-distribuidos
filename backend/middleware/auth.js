const jwt = require('jsonwebtoken');
const Usuario = require('../models/Usuario');

const JWT_SECRET = process.env.JWT_SECRET || 'muraltech_secret_key_dev';

function generarToken(usuario) {
  return jwt.sign(
    { id: usuario._id, email: usuario.email, rol: usuario.rol, institucion_id: usuario.institucion_id },
    JWT_SECRET,
    { expiresIn: '7d' }
  );
}

async function authMiddleware(req, res, next) {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Token requerido' });
  }
  try {
    const token = header.split(' ')[1];
    const decoded = jwt.verify(token, JWT_SECRET);
    const usuario = await Usuario.findById(decoded.id);
    if (!usuario) {
      return res.status(401).json({ error: 'Usuario no encontrado' });
    }
    req.usuario = usuario;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Token inválido o expirado' });
  }
}

function soloInstitucion(req, res, next) {
  if (req.usuario.rol !== 'institucion') {
    return res.status(403).json({ error: 'Solo instituciones pueden realizar esta acción' });
  }
  next();
}

module.exports = { generarToken, authMiddleware, soloInstitucion, JWT_SECRET };
