const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
const app = express();

const PORT = 3000;
const NODE_NAME = process.env.NODE_NAME || 'Nodo-Desconocido';

app.use(cors());
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

const MONGO_OPTIONS = {
  serverSelectionTimeoutMS: 5000,
  connectTimeoutMS: 10000,
  heartbeatFrequencyMS: 2000,
  w: 'majority',
  readPreference: 'primaryPreferred',
  retryWrites: true,
};

const MONGO_RETRY_INTERVAL = 3000;
const mongoURI = process.env.MONGO_URI || 'mongodb://localhost:27017/muraltech';

function conectarMongo() {
  mongoose.connect(mongoURI, MONGO_OPTIONS)
    .then(() => console.log(`${NODE_NAME} conectado a MongoDB (${mongoURI})`))
    .catch(err => {
      console.error(`${NODE_NAME} error de conexión a MongoDB:`, err.message);
      console.warn(`${NODE_NAME} reintentando en ${MONGO_RETRY_INTERVAL / 1000}s...`);
      setTimeout(conectarMongo, MONGO_RETRY_INTERVAL);
    });
}

conectarMongo();

mongoose.connection.on('disconnected', () => {
  console.warn(`${NODE_NAME} MongoDB desconectado, reconectando en ${MONGO_RETRY_INTERVAL / 1000}s...`);
  setTimeout(conectarMongo, MONGO_RETRY_INTERVAL);
});

mongoose.connection.on('reconnected', () => {
  console.log(`${NODE_NAME} MongoDB reconectado exitosamente`);
});

mongoose.connection.on('error', err => {
  console.error(`${NODE_NAME} Error en conexión MongoDB:`, err.message);
});

app.use('/api/auth', require('./routes/auth'));
app.use('/api/ofertas', require('./routes/ofertas'));
app.use('/api/interacciones', require('./routes/interacciones'));
app.use('/api/usuarios', require('./routes/usuarios'));
app.use('/api/guardados', require('./routes/guardados'));
app.use('/api/upload', require('./routes/upload'));

app.get('/api/status', (req, res) => {
  res.json({ nodo: NODE_NAME, online: true, timestamp: new Date().toISOString() });
});

app.get('/api/health', (req, res) => {
  const dbState = mongoose.connection.readyState;
  res.status(dbState === 1 ? 200 : 503).json({
    nodo: NODE_NAME,
    db: ['disconnected', 'connected', 'connecting', 'disconnecting'][dbState] || 'unknown',
    uptime: process.uptime()
  });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`${NODE_NAME} corriendo en puerto ${PORT}`);
});
