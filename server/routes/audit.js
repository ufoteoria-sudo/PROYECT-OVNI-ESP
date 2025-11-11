const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const AuditLog = require('../models/AuditLog');

/**
 * RUTAS DE AUDITORÍA
 * Visualización y gestión de logs del sistema
 */

// ==================== OBTENER LOGS DEL USUARIO ====================
router.get('/my-activity', auth, async (req, res) => {
  try {
    const { page = 1, limit = 50, action, startDate, endDate } = req.query;
    
    const query = { userId: req.user._id };
    
    if (action) query.action = action;
    
    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = new Date(startDate);
      if (endDate) query.createdAt.$lte = new Date(endDate);
    }
    
    const logs = await AuditLog.find(query)
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .lean();
    
    const total = await AuditLog.countDocuments(query);
    
    res.json({
      logs,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages: Math.ceil(total / limit)
      }
    });
    
  } catch (error) {
    console.error('Error obteniendo logs:', error);
    res.status(500).json({ error: 'Error del servidor' });
  }
});

// ==================== ESTADÍSTICAS DE ACTIVIDAD ====================
router.get('/my-stats', auth, async (req, res) => {
  try {
    const { days = 30 } = req.query;
    
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(days));
    
    // Estadísticas por acción
    const actionStats = await AuditLog.aggregate([
      {
        $match: {
          userId: req.user._id,
          createdAt: { $gte: startDate }
        }
      },
      {
        $group: {
          _id: '$action',
          count: { $sum: 1 }
        }
      },
      {
        $sort: { count: -1 }
      }
    ]);
    
    // Actividad por día
    const dailyActivity = await AuditLog.aggregate([
      {
        $match: {
          userId: req.user._id,
          createdAt: { $gte: startDate }
        }
      },
      {
        $group: {
          _id: {
            $dateToString: {
              format: '%Y-%m-%d',
              date: '$createdAt'
            }
          },
          count: { $sum: 1 }
        }
      },
      {
        $sort: { _id: 1 }
      }
    ]);
    
    // Total de acciones
    const totalActions = await AuditLog.countDocuments({
      userId: req.user._id,
      createdAt: { $gte: startDate }
    });
    
    res.json({
      period: `${days} días`,
      totalActions,
      actionStats,
      dailyActivity
    });
    
  } catch (error) {
    console.error('Error obteniendo estadísticas:', error);
    res.status(500).json({ error: 'Error del servidor' });
  }
});

// ==================== TODOS LOS LOGS (ADMIN) ====================
router.get('/all', auth, async (req, res) => {
  try {
    // Verificar que es admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'No autorizado' });
    }
    
    const { page = 1, limit = 100, userId, action, resourceType, startDate, endDate } = req.query;
    
    const query = {};
    
    if (userId) query.userId = userId;
    if (action) query.action = action;
    if (resourceType) query.resourceType = resourceType;
    
    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = new Date(startDate);
      if (endDate) query.createdAt.$lte = new Date(endDate);
    }
    
    const logs = await AuditLog.find(query)
      .populate('userId', 'username email role')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .lean();
    
    const total = await AuditLog.countDocuments(query);
    
    res.json({
      logs,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages: Math.ceil(total / limit)
      }
    });
    
  } catch (error) {
    console.error('Error obteniendo logs:', error);
    res.status(500).json({ error: 'Error del servidor' });
  }
});

// ==================== ESTADÍSTICAS DEL SISTEMA (ADMIN) ====================
router.get('/system-stats', auth, async (req, res) => {
  try {
    // Verificar que es admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'No autorizado' });
    }
    
    const { days = 30 } = req.query;
    
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(days));
    
    // Total de logs
    const totalLogs = await AuditLog.countDocuments({
      createdAt: { $gte: startDate }
    });
    
    // Logs por acción
    const actionStats = await AuditLog.aggregate([
      { $match: { createdAt: { $gte: startDate } } },
      { $group: { _id: '$action', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 10 }
    ]);
    
    // Usuarios más activos
    const activeUsers = await AuditLog.aggregate([
      { $match: { createdAt: { $gte: startDate } } },
      { $group: { _id: '$userId', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 10 },
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
          count: 1
        }
      }
    ]);
    
    // Actividad por hora del día
    const hourlyActivity = await AuditLog.aggregate([
      { $match: { createdAt: { $gte: startDate } } },
      {
        $group: {
          _id: { $hour: '$createdAt' },
          count: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]);
    
    // Actividad diaria
    const dailyActivity = await AuditLog.aggregate([
      { $match: { createdAt: { $gte: startDate } } },
      {
        $group: {
          _id: {
            $dateToString: {
              format: '%Y-%m-%d',
              date: '$createdAt'
            }
          },
          count: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]);
    
    // Logs por estado
    const statusStats = await AuditLog.aggregate([
      { $match: { createdAt: { $gte: startDate } } },
      { $group: { _id: '$status', count: { $sum: 1 } } }
    ]);
    
    res.json({
      period: `${days} días`,
      totalLogs,
      actionStats,
      activeUsers,
      hourlyActivity,
      dailyActivity,
      statusStats
    });
    
  } catch (error) {
    console.error('Error obteniendo estadísticas del sistema:', error);
    res.status(500).json({ error: 'Error del servidor' });
  }
});

// ==================== LIMPIAR LOGS ANTIGUOS (ADMIN) ====================
router.delete('/cleanup', auth, async (req, res) => {
  try {
    // Verificar que es admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'No autorizado' });
    }
    
    const { daysToKeep = 90 } = req.body;
    
    const deletedCount = await AuditLog.cleanOldLogs(daysToKeep);
    
    res.json({
      message: `Limpiados ${deletedCount} logs antiguos`,
      deletedCount
    });
    
  } catch (error) {
    console.error('Error limpiando logs:', error);
    res.status(500).json({ error: 'Error del servidor' });
  }
});

module.exports = router;
