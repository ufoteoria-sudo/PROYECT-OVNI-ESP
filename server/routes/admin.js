const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Analysis = require('../models/Analysis');
const Report = require('../models/Report');
const UFODatabase = require('../models/UFODatabase');
const auth = require('../middleware/auth');
const isAdmin = require('../middleware/isAdmin');

/**
 * RUTAS DE ADMINISTRACIÓN
 * Todas las rutas requieren autenticación + rol de administrador
 */

// Middleware: todas las rutas de admin requieren auth + isAdmin
router.use(auth);
router.use(isAdmin);

// ==================== DASHBOARD - ESTADÍSTICAS ====================
// GET /api/admin/stats
router.get('/stats', async (req, res) => {
  try {
    // Estadísticas generales
    const totalUsers = await User.countDocuments();
    const activeUsers = await User.countDocuments({ isActive: true });
    const adminUsers = await User.countDocuments({ role: 'admin' });
    
    const totalAnalyses = await Analysis.countDocuments();
    const completedAnalyses = await Analysis.countDocuments({ status: 'completed' });
    const pendingAnalyses = await Analysis.countDocuments({ status: { $in: ['pending', 'analyzing'] } });
    const errorAnalyses = await Analysis.countDocuments({ status: 'error' });
    
    const totalReports = await Report.countDocuments();
    const generatedReports = await Report.countDocuments({ status: 'generated' });
    
    const totalUFOObjects = await UFODatabase.countDocuments();
    const verifiedObjects = await UFODatabase.countDocuments({ isVerified: true });
    
    // Usuarios registrados en los últimos 30 días
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const newUsersLast30Days = await User.countDocuments({
      createdAt: { $gte: thirtyDaysAgo }
    });
    
    // Análisis por categoría
    const analysesByCategory = await Analysis.aggregate([
      { $match: { status: 'completed' } },
      { $group: { _id: '$aiAnalysis.category', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);
    
    // Análisis por fecha (últimos 7 días)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const analysesLast7Days = await Analysis.aggregate([
      { $match: { createdAt: { $gte: sevenDaysAgo } } },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          count: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]);
    
    // Usuarios más activos (top 5)
    const topUsers = await Analysis.aggregate([
      { $group: { _id: '$userId', analysisCount: { $sum: 1 } } },
      { $sort: { analysisCount: -1 } },
      { $limit: 5 },
      {
        $lookup: {
          from: 'users',
          localField: '_id',
          foreignField: '_id',
          as: 'user'
        }
      },
      { $unwind: '$user' },
      {
        $project: {
          username: '$user.username',
          email: '$user.email',
          analysisCount: 1
        }
      }
    ]);
    
    res.json({
      stats: {
        users: {
          total: totalUsers,
          active: activeUsers,
          admins: adminUsers,
          newLast30Days: newUsersLast30Days
        },
        analyses: {
          total: totalAnalyses,
          completed: completedAnalyses,
          pending: pendingAnalyses,
          errors: errorAnalyses,
          byCategory: analysesByCategory,
          last7Days: analysesLast7Days
        },
        reports: {
          total: totalReports,
          generated: generatedReports
        },
        ufoDatabase: {
          total: totalUFOObjects,
          verified: verifiedObjects
        },
        topUsers
      }
    });
    
  } catch (error) {
    console.error('Error al obtener estadísticas:', error);
    res.status(500).json({
      error: 'Error al obtener estadísticas',
      details: error.message
    });
  }
});

// ==================== GESTIÓN DE USUARIOS ====================

// GET /api/admin/users - Listar todos los usuarios
router.get('/users', async (req, res) => {
  try {
    const { page = 1, limit = 20, search, role, isActive } = req.query;
    
    // Construir filtro
    const filter = {};
    if (search) {
      filter.$or = [
        { username: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { firstName: { $regex: search, $options: 'i' } },
        { lastName: { $regex: search, $options: 'i' } }
      ];
    }
    if (role) filter.role = role;
    if (isActive !== undefined) filter.isActive = isActive === 'true';
    
    // Paginación
    const skip = (page - 1) * limit;
    
    const users = await User.find(filter)
      .select('-password')
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip(skip)
      .lean();
    
    // Añadir conteo de análisis por usuario
    for (let user of users) {
      user.analysisCount = await Analysis.countDocuments({ userId: user._id });
      user.reportCount = await Report.countDocuments({ userId: user._id });
    }
    
    const total = await User.countDocuments(filter);
    
    res.json({
      users,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(total / limit)
      }
    });
    
  } catch (error) {
    console.error('Error al listar usuarios:', error);
    res.status(500).json({
      error: 'Error al listar usuarios',
      details: error.message
    });
  }
});

// PUT /api/admin/users/:id - Actualizar usuario
router.put('/users/:id', async (req, res) => {
  try {
    const { role, isActive, subscription } = req.body;
    
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }
    
    // Actualizar campos permitidos
    if (role !== undefined) user.role = role;
    if (isActive !== undefined) user.isActive = isActive;
    if (subscription !== undefined) user.subscription = subscription;
    
    await user.save();
    
    res.json({
      message: 'Usuario actualizado exitosamente',
      user: {
        _id: user._id,
        username: user.username,
        email: user.email,
        role: user.role,
        isActive: user.isActive,
        subscription: user.subscription
      }
    });
    
  } catch (error) {
    console.error('Error al actualizar usuario:', error);
    res.status(500).json({
      error: 'Error al actualizar usuario',
      details: error.message
    });
  }
});

// DELETE /api/admin/users/:id - Eliminar usuario
router.delete('/users/:id', async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }
    
    // No permitir eliminar el último admin
    if (user.role === 'admin') {
      const adminCount = await User.countDocuments({ role: 'admin' });
      if (adminCount <= 1) {
        return res.status(400).json({
          error: 'No se puede eliminar el último administrador del sistema'
        });
      }
    }
    
    // Eliminar usuario y sus datos relacionados
    await Analysis.deleteMany({ userId: user._id });
    await Report.deleteMany({ userId: user._id });
    await User.deleteOne({ _id: user._id });
    
    res.json({
      message: 'Usuario y sus datos eliminados exitosamente'
    });
    
  } catch (error) {
    console.error('Error al eliminar usuario:', error);
    res.status(500).json({
      error: 'Error al eliminar usuario',
      details: error.message
    });
  }
});

// ==================== GESTIÓN DE ANÁLISIS ====================

// GET /api/admin/analyses - Ver todos los análisis
router.get('/analyses', async (req, res) => {
  try {
    const { page = 1, limit = 20, status, category } = req.query;
    
    const filter = {};
    if (status) filter.status = status;
    if (category) filter['aiAnalysis.category'] = category;
    
    const skip = (page - 1) * limit;
    
    const analyses = await Analysis.find(filter)
      .populate('userId', 'username email')
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip(skip)
      .lean();
    
    const total = await Analysis.countDocuments(filter);
    
    res.json({
      analyses,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(total / limit)
      }
    });
    
  } catch (error) {
    console.error('Error al listar análisis:', error);
    res.status(500).json({
      error: 'Error al listar análisis',
      details: error.message
    });
  }
});

// DELETE /api/admin/analyses/:id - Eliminar análisis
router.delete('/analyses/:id', async (req, res) => {
  try {
    const analysis = await Analysis.findById(req.params.id);
    if (!analysis) {
      return res.status(404).json({ error: 'Análisis no encontrado' });
    }
    
    // Eliminar reportes asociados
    await Report.deleteMany({ analysisId: analysis._id });
    
    // Eliminar análisis
    await Analysis.deleteOne({ _id: analysis._id });
    
    res.json({
      message: 'Análisis y reportes asociados eliminados exitosamente'
    });
    
  } catch (error) {
    console.error('Error al eliminar análisis:', error);
    res.status(500).json({
      error: 'Error al eliminar análisis',
      details: error.message
    });
  }
});

// ==================== GESTIÓN DE UFO DATABASE ====================

// GET /api/admin/ufo-database - Listar objetos
router.get('/ufo-database', async (req, res) => {
  try {
    const { page = 1, limit = 50, category, search, isVerified } = req.query;
    
    const filter = {};
    if (category) filter.category = category;
    if (isVerified !== undefined) filter.isVerified = isVerified === 'true';
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }
    
    const skip = (page - 1) * limit;
    
    const objects = await UFODatabase.find(filter)
      .sort({ frequency: -1, name: 1 })
      .limit(parseInt(limit))
      .skip(skip)
      .lean();
    
    const total = await UFODatabase.countDocuments(filter);
    
    res.json({
      objects,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(total / limit)
      }
    });
    
  } catch (error) {
    console.error('Error al listar UFO Database:', error);
    res.status(500).json({
      error: 'Error al listar objetos',
      details: error.message
    });
  }
});

// POST /api/admin/ufo-database - Crear objeto
router.post('/ufo-database', async (req, res) => {
  try {
    const {
      name,
      category,
      description,
      characteristics,
      visualPatterns,
      images,
      frequency,
      isVerified
    } = req.body;
    
    if (!name || !category) {
      return res.status(400).json({
        error: 'Nombre y categoría son requeridos'
      });
    }
    
    const object = new UFODatabase({
      name,
      category,
      description,
      characteristics,
      visualPatterns,
      images,
      frequency: frequency || 0,
      isVerified: isVerified || false,
      addedBy: req.userId
    });
    
    await object.save();
    
    res.status(201).json({
      message: 'Objeto creado exitosamente',
      object
    });
    
  } catch (error) {
    console.error('Error al crear objeto:', error);
    res.status(500).json({
      error: 'Error al crear objeto',
      details: error.message
    });
  }
});

// PUT /api/admin/ufo-database/:id - Actualizar objeto
router.put('/ufo-database/:id', async (req, res) => {
  try {
    const object = await UFODatabase.findById(req.params.id);
    if (!object) {
      return res.status(404).json({ error: 'Objeto no encontrado' });
    }
    
    const {
      name,
      category,
      description,
      characteristics,
      visualPatterns,
      images,
      frequency,
      isVerified
    } = req.body;
    
    // Actualizar campos
    if (name !== undefined) object.name = name;
    if (category !== undefined) object.category = category;
    if (description !== undefined) object.description = description;
    if (characteristics !== undefined) object.characteristics = characteristics;
    if (visualPatterns !== undefined) object.visualPatterns = visualPatterns;
    if (images !== undefined) object.images = images;
    if (frequency !== undefined) object.frequency = frequency;
    if (isVerified !== undefined) object.isVerified = isVerified;
    
    await object.save();
    
    res.json({
      message: 'Objeto actualizado exitosamente',
      object
    });
    
  } catch (error) {
    console.error('Error al actualizar objeto:', error);
    res.status(500).json({
      error: 'Error al actualizar objeto',
      details: error.message
    });
  }
});

// DELETE /api/admin/ufo-database/:id - Eliminar objeto
router.delete('/ufo-database/:id', async (req, res) => {
  try {
    const object = await UFODatabase.findById(req.params.id);
    if (!object) {
      return res.status(404).json({ error: 'Objeto no encontrado' });
    }
    
    await UFODatabase.deleteOne({ _id: object._id });
    
    res.json({
      message: 'Objeto eliminado exitosamente'
    });
    
  } catch (error) {
    console.error('Error al eliminar objeto:', error);
    res.status(500).json({
      error: 'Error al eliminar objeto',
      details: error.message
    });
  }
});

module.exports = router;
