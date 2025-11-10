const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Analysis = require('../models/Analysis');
const auth = require('../middleware/auth');
const isAdmin = require('../middleware/isAdmin');

// Obtener estadísticas del usuario (sin autenticación para WordPress)
router.get('/stats', async (req, res) => {
  try {
    // En producción deberías obtener el userId del token o sesión
    // Por ahora devolvemos estadísticas agregadas
    
    const total = await Analysis.countDocuments();
    const completed = await Analysis.countDocuments({ status: 'completed' });
    const processing = await Analysis.countDocuments({ 
      status: { $in: ['pending', 'analyzing', 'uploading'] } 
    });
    
    res.json({
      success: true,
      data: {
        total: total,
        uploaded: total,
        completed: completed,
        processing: processing
      }
    });
  } catch (err) {
    console.error('Error obteniendo stats:', err);
    res.status(500).json({ 
      success: false,
      error: 'Error al obtener estadísticas.',
      data: { total: 26, uploaded: 26, completed: 26, processing: 0 } // Fallback
    });
  }
});

// Obtener reportes del usuario (sin autenticación para WordPress)
router.get('/reports', async (req, res) => {
  try {
    const { page = 1, limit = 20, search = '', status = '', type = '' } = req.query;
    
    const query = {};
    
    if (search) {
      query.$or = [
        { fileName: { $regex: search, $options: 'i' } },
        { 'exifData.location.address': { $regex: search, $options: 'i' } }
      ];
    }
    
    if (status) {
      query.status = status;
    }
    
    if (type) {
      query.fileType = type;
    }
    
    const skip = (page - 1) * limit;
    
    const reports = await Analysis.find(query)
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip(parseInt(skip))
      .select('fileName fileType status createdAt exifData.location aiAnalysis.confidence')
      .lean();
    
    const total = await Analysis.countDocuments(query);
    
    // Formatear respuesta
    const formattedReports = reports.map(report => ({
      _id: report._id,
      fileName: report.fileName,
      fileType: report.fileType || 'image',
      status: report.status || 'pending',
      createdAt: report.createdAt,
      imageUrl: `https://via.placeholder.com/60?text=${report.fileName}`,
      exifData: report.exifData,
      aiAnalysis: report.aiAnalysis
    }));
    
    res.json({
      success: true,
      data: formattedReports,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / limit)
      }
    });
    
  } catch (err) {
    console.error('Error obteniendo reportes:', err);
    res.status(500).json({ 
      success: false,
      error: 'Error al obtener reportes.' 
    });
  }
});

// Listar todos los usuarios (solo admin)
router.get('/', auth, isAdmin, async (req, res) => {
  try {
    const users = await User.find().sort({ createdAt: -1 });
    res.json(users);
  } catch (err) {
    res.status(500).json({ error: 'Error al obtener usuarios.' });
  }
});

// Obtener usuario por id (solo admin o el mismo usuario)
router.get('/:id', auth, async (req, res) => {
  try {
    // Solo admin o el mismo usuario puede ver los detalles
    if (req.userRole !== 'admin' && req.userId !== req.params.id) {
      return res.status(403).json({ error: 'No tienes permiso para ver este usuario.' });
    }
    
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ error: 'Usuario no encontrado.' });
    res.json(user);
  } catch (err) {
    // Manejar IDs inválidos
    if (err.name === 'CastError') {
      return res.status(400).json({ error: 'ID de usuario inválido.' });
    }
    res.status(500).json({ error: 'Error al obtener usuario.' });
  }
});

// Crear usuario (ruta pública comentada - usar /api/auth/register en su lugar)
// Los usuarios nuevos deben registrarse a través de /api/auth/register
// Esta ruta ahora solo para admin crear usuarios
router.post('/', auth, isAdmin, async (req, res) => {
  try {
    const { username, email } = req.body;
    if (!username || !email) {
      return res.status(400).json({ error: 'Usuario y email son obligatorios.' });
    }
    // Comprobar si ya existe el email
    const existe = await User.findOne({ email });
    if (existe) {
      return res.status(409).json({ error: 'El email ya está registrado.' });
    }
    const nuevo = new User({ username, email });
    await nuevo.save();
    res.status(201).json(nuevo);
  } catch (err) {
    // Manejo de error por índice único duplicado
    if (err.code === 11000) {
      return res.status(409).json({ error: 'El email ya está registrado.' });
    }
    res.status(500).json({ error: 'Error al crear usuario.' });
  }
});

// Actualizar usuario (solo admin o el mismo usuario)
router.put('/:id', auth, async (req, res) => {
  try {
    // Solo admin o el mismo usuario puede actualizar
    if (req.userRole !== 'admin' && req.userId !== req.params.id) {
      return res.status(403).json({ error: 'No tienes permiso para actualizar este usuario.' });
    }
    
    const { username, email } = req.body;
    if (!username || !email) {
      return res.status(400).json({ error: 'Usuario y email son obligatorios.' });
    }
    // Verificar email duplicado en otro documento
    const existe = await User.findOne({ email, _id: { $ne: req.params.id } });
    if (existe) {
      return res.status(409).json({ error: 'El email ya está registrado.' });
    }
    const actualizado = await User.findByIdAndUpdate(
      req.params.id,
      { username, email },
      { new: true, runValidators: true }
    );
    if (!actualizado) return res.status(404).json({ error: 'Usuario no encontrado.' });
    res.json(actualizado);
  } catch (err) {
    if (err.code === 11000) {
      return res.status(409).json({ error: 'El email ya está registrado.' });
    }
    if (err.name === 'CastError') {
      return res.status(400).json({ error: 'ID de usuario inválido.' });
    }
    res.status(500).json({ error: 'Error al editar usuario.' });
  }
});

// Borrar usuario (solo admin)
router.delete('/:id', auth, isAdmin, async (req, res) => {
  try {
    const borrado = await User.findByIdAndDelete(req.params.id);
    if (!borrado) return res.status(404).json({ error: 'Usuario no encontrado.' });
    res.json({ message: 'Usuario borrado correctamente.' });
  } catch (err) {
    if (err.name === 'CastError') {
      return res.status(400).json({ error: 'ID de usuario inválido.' });
    }
    res.status(500).json({ error: 'Error al borrar usuario.' });
  }
});

module.exports = router;
