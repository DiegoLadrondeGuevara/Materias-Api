const mongoose = require('mongoose');

const MateriaSchema = new mongoose.Schema({
  _id: {
    type: String,
    required: true, // aquí usamos el id como _id para búsquedas directas por id
    trim: true
  },
  nombre: {
    type: String,
    required: true,
    trim: true
  },
  categoria: {
    type: String,
    required: true,
    trim: true,
    index: true // índice para acelerar búsquedas por categoría
  },
  descripcion: {
    type: String,
    trim: true,
    default: ''
  },
  createdAt: {
    type: Date,
    default: () => new Date()
  }
});

// toJSON: renombrar _id -> id en las respuestas
MateriaSchema.method('toJSON', function() {
  const { _id, __v, ...obj } = this.toObject({ virtuals: true });
  obj.id = _id;
  return obj;
});

module.exports = mongoose.model('Materia', MateriaSchema);
