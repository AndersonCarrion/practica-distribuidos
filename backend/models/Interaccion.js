const mongoose = require('mongoose');

const interaccionSchema = new mongoose.Schema({
  oferta_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Oferta',
    required: true,
    index: true
  },
  usuario_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Usuario',
    required: true
  },
  usuario_nombre: {
    type: String,
    required: true
  },
  texto: {
    type: String,
    required: true,
    trim: true
  },
  tipo: {
    type: String,
    enum: ['pregunta', 'respuesta'],
    required: true
  },
  padre_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Interaccion',
    default: null
  }
}, { timestamps: true });

interaccionSchema.index({ oferta_id: 1, tipo: 1, createdAt: 1 });

module.exports = mongoose.model('Interaccion', interaccionSchema);
