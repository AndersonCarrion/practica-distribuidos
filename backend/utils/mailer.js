const nodemailer = require('nodemailer');

const config = {
  host: process.env.SMTP_HOST || 'localhost',
  port: Number(process.env.SMTP_PORT) || 1025,
  secure: process.env.SMTP_SECURE === 'true',
};

if (process.env.SMTP_USER && process.env.SMTP_PASS) {
  config.auth = {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS
  };
}

const transporter = nodemailer.createTransport(config);

async function enviarCorreo({ to, subject, html }) {
  const from = process.env.SMTP_FROM || 'noreply@muraltech.local';
  
  if (!process.env.SMTP_HOST) {
    console.log(`\n[MAIL-SIMULADO] Para: ${to}`);
    console.log(`[MAIL-SIMULADO] Asunto: ${subject}`);
    console.log(`[MAIL-SIMULADO] Cuerpo:\n${html}\n`);
    return;
  }

  try {
    await transporter.sendMail({ from, to, subject, html });
  } catch (err) {
    console.error(`[MAIL-ERROR] Error enviando a ${to}:`, err.message);
    throw err;
  }
}

function plantillaVerificacion(nombre, url) {
  return `
    <h2>Bienvenido a MuralTech</h2>
    <p>Hola <strong>${nombre}</strong>,</p>
    <p>Verifica tu correo haciendo clic en el siguiente enlace:</p>
    <p><a href="${url}" style="display:inline-block;padding:12px 24px;background:#1a237e;color:white;text-decoration:none;border-radius:8px">Verificar correo</a></p>
    <p>O copia este enlace: ${url}</p>
    <p>Este enlace expira en 24 horas.</p>
  `;
}

function plantillaRecuperacion(nombre, url) {
  return `
    <h2>Recuperación de contraseña — MuralTech</h2>
    <p>Hola <strong>${nombre}</strong>,</p>
    <p>Recibimos una solicitud para restablecer tu contraseña.</p>
    <p><a href="${url}" style="display:inline-block;padding:12px 24px;background:#1a237e;color:white;text-decoration:none;border-radius:8px">Restablecer contraseña</a></p>
    <p>O copia este enlace: ${url}</p>
    <p>Este enlace expira en 1 hora. Si no solicitaste esto, ignora este correo.</p>
  `;
}

module.exports = { enviarCorreo, plantillaVerificacion, plantillaRecuperacion };
