require('dotenv').config();
require('express-async-errors'); // para manejar errores async sin try/catch everywhere

const express = require('express');
const mongoose = require('mongoose');
const morgan = require('morgan');
const helmet = require('helmet');
const cors = require('cors');

const Materia = require('./models/Materia');

const app = express();
const PORT = process.env.PORT || 3001;
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/materiasdb';

// middlewares
app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(morgan('dev'));

// conectar MongoDB
mongoose.set('strictQuery', true);
mongoose.connect(MONGODB_URI, { })
  .then(() => console.log('MongoDB conectado'))
  .catch(err => {
    console.error('Error conectando a MongoDB', err);
    process.exit(1);
  });

// --------- Rutas ----------

// Health check
app.get('/', (req, res) => res.json({ status: 'ok', service: 'materias' }));

/**
 * GET /materias
 * Opcional: ?categoria=Matematicas
 */
app.get('/materias', async (req, res) => {
  const { categoria, q, limit = 100, skip = 0 } = req.query;
  const filter = {};
  if (categoria) filter.categoria = categoria;
  if (q) filter.$or = [
    { nombre: { $regex: q, $options: 'i' } },
    { descripcion: { $regex: q, $options: 'i' } }
  ];

  const materias = await Materia.find(filter)
    .sort({ createdAt: -1 })
    .limit(Math.min(Number(limit) || 100, 1000))
    .skip(Number(skip) || 0)
    .exec();

  res.json({ count: materias.length, materias });
});

/**
 * POST /materias
 * Body:
 * {
 *   "id": "mat101",
 *   "nombre": "Matematica I",
 *   "categoria": "Matematicas",
 *   "descripcion": "Algebra basica..."
 * }
 */
app.post('/materias', async (req, res) => {
  const { id, nombre, categoria, descripcion } = req.body;

  // validaciones básicas
  if (!id || !nombre || !categoria) {
    return res.status(400).json({ error: 'Faltan campos obligatorios: id, nombre, categoria' });
  }
  // normalizar id (opcional)
  const normalizedId = String(id).trim();

  // verificar existencia
  const exists = await Materia.findById(normalizedId).exec();
  if (exists) {
    return res.status(409).json({ error: 'Materia con ese id ya existe' });
  }

  const materia = new Materia({
    _id: normalizedId,
    nombre: String(nombre).trim(),
    categoria: String(categoria).trim(),
    descripcion: descripcion ? String(descripcion).trim() : ''
  });

  await materia.save();

  return res.status(201).json({ message: 'Materia creada', materia });
});

/**
 * GET /materias/:id
 */
app.get('/materias/:id', async (req, res) => {
  const { id } = req.params;
  const materia = await Materia.findById(id).exec();
  if (!materia) return res.status(404).json({ error: 'Materia no encontrada' });
  res.json({ materia });
});

// ------------- manejo de errores -------------
app.use((err, req, res, next) => {
  console.error('Error no manejado:', err);
  // En dev podrías enviar err.message + stack, en prod enviar genérico
  res.status(500).json({ error: 'Error interno del servidor' });
});

// levantar servidor
app.listen(PORT, () => {
  console.log(`Servidor iniciado en http://localhost:${PORT}`);
});
