const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const Usuario = require('../models/Usuario');
const { generarToken, authMiddleware } = require('../middleware/auth');
const { validarRegistro, validarLogin } = require('../middleware/validar');
const { enviarCorreo, plantillaVerificacion, plantillaRecuperacion } = require('../utils/mailer');

router.post('/registro', validarRegistro, async (req, res) => {
  try {
    const { email, password, nombre, rol } = req.body;
    const existe = await Usuario.findOne({ email });
    if (existe) {
      return res.status(400).json({ error: 'Email ya registrado' });
    }
    const datosUsuario = { email, password, nombre, rol };
    if (rol === 'institucion') {
      datosUsuario.institucion_id = req.body.institucion_id || email.split('@')[0] + '_' + Date.now();
    }
    datosUsuario.token_verificacion = crypto.randomBytes(32).toString('hex');
    const usuario = new Usuario(datosUsuario);
    await usuario.save();
    const token = generarToken(usuario);
    const urlVerificacion = `${req.protocol}://${req.get('host')}/api/auth/verificar/${usuario.token_verificacion}`;
    try {
      await enviarCorreo({
        to: usuario.email,
        subject: 'Verifica tu correo — MuralTech',
        html: plantillaVerificacion(usuario.nombre, urlVerificacion)
      });
    } catch (mailErr) {
      console.warn(`${process.env.NODE_NAME} correo no enviado:`, mailErr.message);
    }
    res.status(201).json({ token, usuario });
  } catch (err) {
    console.error(`${process.env.NODE_NAME} [POST /auth/registro] Error:`, err);
    res.status(500).json({ error: err.message });
  }
});

router.post('/login', validarLogin, async (req, res) => {
  try {
    const { email, password } = req.body;
    const usuario = await Usuario.findOne({ email });
    if (!usuario) {
      return res.status(401).json({ error: 'Credenciales inválidas' });
    }
    const coincide = await usuario.comparePassword(password);
    if (!coincide) {
      return res.status(401).json({ error: 'Credenciales inválidas' });
    }
    const token = generarToken(usuario);
    res.json({ token, usuario });
  } catch (err) {
    console.error(`${process.env.NODE_NAME} [POST /auth/login] Error:`, err);
    res.status(500).json({ error: err.message });
  }
});

router.get('/verificar/:token', async (req, res) => {
  try {
    const usuario = await Usuario.findOne({ token_verificacion: req.params.token });
    if (!usuario) {
      return res.status(400).json({ error: 'Token de verificación inválido o expirado' });
    }
    usuario.verificado = true;
    usuario.token_verificacion = '';
    await usuario.save();
    res.json({ mensaje: 'Correo verificado exitosamente' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/recuperar', async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ error: 'Email requerido' });
    const usuario = await Usuario.findOne({ email });
    if (!usuario) {
      return res.json({ mensaje: 'Si el correo existe, recibirás un enlace de recuperación' });
    }
    const token = crypto.randomBytes(32).toString('hex');
    usuario.token_recuperacion = token;
    usuario.token_recuperacion_expiracion = new Date(Date.now() + 3600000);
    await usuario.save();
    const urlRecuperacion = `${req.protocol}://${req.get('host')}/reset-password/${token}`;
    await enviarCorreo({
      to: usuario.email,
      subject: 'Recupera tu contraseña — MuralTech',
      html: plantillaRecuperacion(usuario.nombre, urlRecuperacion)
    });
    res.json({ mensaje: 'Si el correo existe, recibirás un enlace de recuperación' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/restablecer', async (req, res) => {
  try {
    const { token, password } = req.body;
    if (!token || !password) return res.status(400).json({ error: 'Token y contraseña requeridos' });
    if (password.length < 6) return res.status(400).json({ error: 'Mínimo 6 caracteres' });
    const usuario = await Usuario.findOne({
      token_recuperacion: token,
      token_recuperacion_expiracion: { $gt: new Date() }
    });
    if (!usuario) {
      return res.status(400).json({ error: 'Token inválido o expirado' });
    }
    usuario.password = password;
    usuario.token_recuperacion = '';
    usuario.token_recuperacion_expiracion = null;
    await usuario.save();
    res.json({ mensaje: 'Contraseña actualizada exitosamente' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/reenviar-verificacion', authMiddleware, async (req, res) => {
  try {
    const usuario = req.usuario;
    if (usuario.verificado) return res.status(400).json({ error: 'Ya estás verificado' });
    usuario.token_verificacion = crypto.randomBytes(32).toString('hex');
    await usuario.save();
    const urlVerificacion = `${req.protocol}://${req.get('host')}/api/auth/verificar/${usuario.token_verificacion}`;
    await enviarCorreo({
      to: usuario.email,
      subject: 'Verifica tu correo — MuralTech',
      html: plantillaVerificacion(usuario.nombre, urlVerificacion)
    });
    res.json({ mensaje: 'Correo de verificación reenviado' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/perfil', authMiddleware, async (req, res) => {
  res.json(req.usuario);
});

module.exports = router;
