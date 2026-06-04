const mongoose = require('mongoose');

const ofertaSchema = new mongoose.Schema({
  titulo: {
    type: String,
    required: true,
    trim: true
  },
  descripcion: {
    type: String,
    required: true
  },
  categoria: {
    type: String,
    required: true,
    enum: ['ventas', 'tecnologia', 'administracion', 'construccion', 'gastronomia', 'salud', 'educacion', 'logistica', 'diseno', 'atencion_al_cliente', 'produccion', 'otro']
  },
  salario_min: {
    type: Number,
    default: 0
  },
  salario_max: {
    type: Number,
    default: 0
  },
  modalidad: {
    type: String,
    enum: ['remoto', 'presencial', 'hibrido'],
    required: true
  },
  ubicacion: {
    type: String,
    default: ''
  },
  institucion_id: {
    type: String,
    required: true,
    index: true
  },
  institucion_nombre: {
    type: String,
    required: true
  },
  logo_url: {
    type: String,
    default: ''
  },
  activa: {
    type: Boolean,
    default: true
  },
  destacada: {
    type: Boolean,
    default: false
  },
  destacada_hasta: {
    type: Date,
    default: null
  },
  patrocinada: {
    type: Boolean,
    default: false
  }
}, { timestamps: true });

ofertaSchema.index({ categoria: 1, activa: 1 });
ofertaSchema.index({ destacada: -1, createdAt: -1 });

module.exports = mongoose.model('Oferta', ofertaSchema);
