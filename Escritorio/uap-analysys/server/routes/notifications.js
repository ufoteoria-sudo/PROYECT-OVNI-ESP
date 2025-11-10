const express = require('express');
const router = express.Router();
const Notification = require('../models/Notification');
const auth = require('../middleware/auth');

// Obtener todas las notificaciones del usuario
router.get('/', auth, async (req, res) => {
  try {
    const { page = 1, limit = 20, isRead, type } = req.query;
    
    const query = { userId: req.user._id };
    
    // Filtros opcionales
    if (isRead !== undefined) {
      query.isRead = isRead === 'true';
    }
    if (type) {
      query.type = type;
    }
    
    const notifications = await Notification.find(query)
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .populate('relatedId', 'fileName status category')
      .lean();
    
    const total = await Notification.countDocuments(query);
    
    res.json({
      notifications,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Error obteniendo notificaciones:', error);
    res.status(500).json({ error: 'Error del servidor' });
  }
});

// Obtener conteo de notificaciones no leídas
router.get('/unread-count', auth, async (req, res) => {
  try {
    const count = await Notification.getUnreadCount(req.user._id);
    res.json({ count });
  } catch (error) {
    console.error('Error obteniendo conteo:', error);
    res.status(500).json({ error: 'Error del servidor' });
  }
});

// Ruta alternativa con barra (alias)
router.get('/unread/count', auth, async (req, res) => {
  try {
    const count = await Notification.getUnreadCount(req.user._id);
    res.json({ count });
  } catch (error) {
    console.error('Error obteniendo conteo:', error);
    res.status(500).json({ error: 'Error del servidor' });
  }
});

// Marcar notificación como leída
router.put('/:id/read', auth, async (req, res) => {
  try {
    const notification = await Notification.findOneAndUpdate(
      { _id: req.params.id, userId: req.user._id },
      { isRead: true },
      { new: true }
    );
    
    if (!notification) {
      return res.status(404).json({ error: 'Notificación no encontrada' });
    }
    
    res.json({ notification });
  } catch (error) {
    console.error('Error marcando como leída:', error);
    res.status(500).json({ error: 'Error del servidor' });
  }
});

// Marcar múltiples notificaciones como leídas
router.put('/read-multiple', auth, async (req, res) => {
  try {
    const { notificationIds } = req.body;
    
    if (!notificationIds || !Array.isArray(notificationIds)) {
      return res.status(400).json({ error: 'IDs de notificaciones requeridos' });
    }
    
    await Notification.markAsRead(req.user._id, notificationIds);
    
    res.json({ message: 'Notificaciones marcadas como leídas' });
  } catch (error) {
    console.error('Error marcando notificaciones:', error);
    res.status(500).json({ error: 'Error del servidor' });
  }
});

// Marcar todas como leídas
router.put('/read-all', auth, async (req, res) => {
  try {
    await Notification.updateMany(
      { userId: req.user._id, isRead: false },
      { isRead: true }
    );
    
    res.json({ message: 'Todas las notificaciones marcadas como leídas' });
  } catch (error) {
    console.error('Error marcando todas como leídas:', error);
    res.status(500).json({ error: 'Error del servidor' });
  }
});

// Eliminar notificación
router.delete('/:id', auth, async (req, res) => {
  try {
    const notification = await Notification.findOneAndDelete({
      _id: req.params.id,
      userId: req.user._id
    });
    
    if (!notification) {
      return res.status(404).json({ error: 'Notificación no encontrada' });
    }
    
    res.json({ message: 'Notificación eliminada' });
  } catch (error) {
    console.error('Error eliminando notificación:', error);
    res.status(500).json({ error: 'Error del servidor' });
  }
});

// Eliminar todas las notificaciones leídas
router.delete('/read/clear', auth, async (req, res) => {
  try {
    await Notification.deleteMany({
      userId: req.user._id,
      isRead: true
    });
    
    res.json({ message: 'Notificaciones leídas eliminadas' });
  } catch (error) {
    console.error('Error eliminando notificaciones:', error);
    res.status(500).json({ error: 'Error del servidor' });
  }
});

// Crear notificación (para admin)
router.post('/send', auth, async (req, res) => {
  try {
    // Verificar que es admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'No autorizado' });
    }
    
    const { userId, type, title, message, priority, metadata } = req.body;
    
    if (!userId || !type || !title || !message) {
      return res.status(400).json({ error: 'Datos incompletos' });
    }
    
    const notification = await Notification.createNotification({
      userId,
      type,
      title,
      message,
      priority: priority || 'medium',
      metadata
    });
    
    res.status(201).json({ notification });
  } catch (error) {
    console.error('Error creando notificación:', error);
    res.status(500).json({ error: 'Error del servidor' });
  }
});

module.exports = router;
