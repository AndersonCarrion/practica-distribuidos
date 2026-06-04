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

const mongoURI = 'mongodb://mongo1:27017,mongo2:27017,mongo3:27017/muraltech?replicaSet=rs0';
mongoose.connect(mongoURI)
  .then(() => console.log(`${NODE_NAME} conectado a MongoDB Cluster (muraltech)`))
  .catch(err => console.error('Error de DB:', err));

app.use('/api/auth', require('./routes/auth'));
app.use('/api/ofertas', require('./routes/ofertas'));
app.use('/api/interacciones', require('./routes/interacciones'));
app.use('/api/usuarios', require('./routes/usuarios'));
app.use('/api/guardados', require('./routes/guardados'));
app.use('/api/upload', require('./routes/upload'));

app.get('/api/status', (req, res) => {
  res.json({ nodo: NODE_NAME, online: true, timestamp: new Date().toISOString() });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`${NODE_NAME} corriendo en puerto ${PORT}`);
});
