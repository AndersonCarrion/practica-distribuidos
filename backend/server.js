const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const app = express();

const PORT = 3000;
const NODE_NAME = process.env.NODE_NAME || 'Nodo-Desconocido';

app.use(cors());
app.use(express.json());

// Conexión al clúster de MongoDB en Docker
const mongoURI = 'mongodb://mongo1:27017,mongo2:27017,mongo3:27017/muro_distribuido?replicaSet=rs0';
mongoose.connect(mongoURI)
  .then(() => console.log(`${NODE_NAME} conectado a MongoDB Cluster`))
  .catch(err => console.error('Error de DB:', err));

const Mensaje = mongoose.model('Mensaje', new mongoose.Schema({
    nombre: String,
    texto: String,
    nodo_procesador: String,
    fecha: { type: Date, default: Date.now }
}));

app.get('/api/mensajes', async (req, res) => {
    try {
        const mensajes = await Mensaje.find().sort({ fecha: -1 });
        res.json({ mensajes, respondido_por: NODE_NAME });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.post('/api/mensajes', async (req, res) => {
    try {
        const nuevo = new Mensaje({
            nombre: req.body.nombre || 'Anónimo',
            texto: req.body.texto,
            nodo_procesador: NODE_NAME
        });
        await nuevo.save();
        res.status(201).json(nuevo);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.listen(PORT, '0.0.0.0', () => {
    console.log(`${NODE_NAME} corriendo en puerto ${PORT}`);
});