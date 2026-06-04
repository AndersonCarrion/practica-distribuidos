const mongoose = require('mongoose');

const seguidorSchema = new mongoose.Schema({
  usuario_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Usuario',
    required: true
  },
  institucion_id: {
    type: String,
    required: true
  }
}, { timestamps: true });

seguidorSchema.index({ usuario_id: 1, institucion_id: 1 }, { unique: true });

module.exports = mongoose.model('Seguidor', seguidorSchema);
