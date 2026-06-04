const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const usuarioSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  password: {
    type: String,
    required: true,
    minlength: 6
  },
  nombre: {
    type: String,
    required: true,
    trim: true
  },
  rol: {
    type: String,
    enum: ['postulante', 'institucion'],
    default: 'postulante'
  },
  institucion_id: {
    type: String,
    unique: true,
    sparse: true,
    trim: true
  },
  logo_url: {
    type: String,
    default: ''
  },
  descripcion: {
    type: String,
    default: ''
  },
  verificado: {
    type: Boolean,
    default: false
  },
  token_verificacion: {
    type: String,
    default: ''
  },
  token_recuperacion: {
    type: String,
    default: ''
  },
  token_recuperacion_expiracion: {
    type: Date,
    default: null
  }
}, { timestamps: true });

usuarioSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 10);
  next();
});

usuarioSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

usuarioSchema.methods.toJSON = function () {
  const obj = this.toObject();
  delete obj.password;
  return obj;
};

module.exports = mongoose.model('Usuario', usuarioSchema);
