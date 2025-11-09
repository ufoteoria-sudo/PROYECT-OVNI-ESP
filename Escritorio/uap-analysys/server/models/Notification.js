const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  type: {
    type: String,
    enum: ['analysis_completed', 'report_generated', 'system_alert', 'admin_message', 'subscription_update'],
    required: true
  },
  title: {
    type: String,
    required: true,
    trim: true
  },
  message: {
    type: String,
    required: true,
    trim: true
  },
  relatedId: {
    type: mongoose.Schema.Types.ObjectId,
    // Puede ser un Analysis, Report, etc.
    default: null
  },
  relatedModel: {
    type: String,
    enum: ['Analysis', 'Report', 'User', null],
    default: null
  },
  isRead: {
    type: Boolean,
    default: false,
    index: true
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high'],
    default: 'medium'
  },
  metadata: {
    type: mongoose.Schema.Types.Mixed,
    default: null
  }
}, {
  timestamps: true
});

// Índices compuestos para consultas eficientes
notificationSchema.index({ userId: 1, isRead: 1, createdAt: -1 });
notificationSchema.index({ userId: 1, type: 1 });

// Método estático para crear notificación
notificationSchema.statics.createNotification = async function(data) {
  try {
    const notification = await this.create(data);
    return notification;
  } catch (error) {
    console.error('Error creando notificación:', error);
    throw error;
  }
};

// Método estático para marcar como leídas
notificationSchema.statics.markAsRead = async function(userId, notificationIds) {
  try {
    await this.updateMany(
      { 
        userId, 
        _id: { $in: notificationIds }
      },
      { isRead: true }
    );
  } catch (error) {
    console.error('Error marcando notificaciones como leídas:', error);
    throw error;
  }
};

// Método estático para obtener conteo de no leídas
notificationSchema.statics.getUnreadCount = async function(userId) {
  try {
    const count = await this.countDocuments({ userId, isRead: false });
    return count;
  } catch (error) {
    console.error('Error obteniendo conteo de no leídas:', error);
    return 0;
  }
};

const Notification = mongoose.model('Notification', notificationSchema);

module.exports = Notification;
