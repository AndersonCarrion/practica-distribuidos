const { body, validationResult } = require('express-validator');

function manejarErrores(req, res, next) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errores: errors.array() });
  }
  next();
}

const validarRegistro = [
  body('email').isEmail().withMessage('Email inválido').normalizeEmail(),
  body('password').isLength({ min: 6 }).withMessage('Mínimo 6 caracteres'),
  body('nombre').trim().notEmpty().withMessage('Nombre requerido'),
  body('rol').isIn(['postulante', 'institucion']).withMessage('Rol inválido'),
  manejarErrores
];

const validarLogin = [
  body('email').isEmail().withMessage('Email inválido').normalizeEmail(),
  body('password').notEmpty().withMessage('Contraseña requerida'),
  manejarErrores
];

const validarOferta = [
  body('titulo').trim().notEmpty().withMessage('Título requerido'),
  body('descripcion').trim().notEmpty().withMessage('Descripción requerida'),
  body('categoria').isIn(['ventas', 'tecnologia', 'administracion', 'construccion', 'gastronomia', 'salud', 'educacion', 'logistica', 'diseno', 'atencion_al_cliente', 'produccion', 'otro']).withMessage('Categoría inválida'),
  body('salario_min').optional().isNumeric().withMessage('Salario mínimo debe ser numérico'),
  body('salario_max').optional().isNumeric().withMessage('Salario máximo debe ser numérico'),
  body('modalidad').isIn(['remoto', 'presencial', 'hibrido']).withMessage('Modalidad inválida'),
  body('ubicacion').optional().trim(),
  manejarErrores
];

const validarInteraccion = [
  body('oferta_id').isMongoId().withMessage('ID de oferta inválido'),
  body('texto').trim().notEmpty().withMessage('Texto requerido').isLength({ max: 500 }).withMessage('Máximo 500 caracteres'),
  body('tipo').isIn(['pregunta', 'respuesta']).withMessage('Tipo inválido'),
  body('padre_id').optional({ values: 'null' }).isMongoId().withMessage('ID de padre inválido'),
  manejarErrores
];

module.exports = { validarRegistro, validarLogin, validarOferta, validarInteraccion };
