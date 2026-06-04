const mongoose = require('mongoose');

const guardadoSchema = new mongoose.Schema({
  usuario_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Usuario',
    required: true
  },
  oferta_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Oferta',
    required: true
  }
}, { timestamps: true });

guardadoSchema.index({ usuario_id: 1, oferta_id: 1 }, { unique: true });

module.exports = mongoose.model('Guardado', guardadoSchema);
