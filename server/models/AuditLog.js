const mongoose = require('mongoose');

const auditLogSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  action: {
    type: String,
    required: true,
    enum: [
      // Autenticación
      'login', 'logout', 'register', 'password_change',
      // Análisis
      'analysis_upload', 'analysis_start', 'analysis_complete', 'analysis_delete',
      // Reportes
      'report_create', 'report_generate_pdf', 'report_download', 'report_delete',
      // Admin
      'user_create', 'user_update', 'user_delete', 'user_role_change',
      'ufo_object_create', 'ufo_object_update', 'ufo_object_delete',
      'admin_backup', 'admin_export',
      // Sistema
      'data_export', 'settings_change'
    ]
  },
  resourceType: {
    type: String,
    enum: ['User', 'Analysis', 'Report', 'UFODatabase', 'System', null],
    default: null
  },
  resourceId: {
    type: mongoose.Schema.Types.ObjectId,
    default: null
  },
  details: {
    type: mongoose.Schema.Types.Mixed,
    default: null
  },
  ipAddress: {
    type: String,
    default: null
  },
  userAgent: {
    type: String,
    default: null
  },
  status: {
    type: String,
    enum: ['success', 'failure', 'error'],
    default: 'success'
  },
  errorMessage: {
    type: String,
    default: null
  },
  metadata: {
    type: mongoose.Schema.Types.Mixed,
    default: null
  }
}, {
  timestamps: true
});

// Índices compuestos para consultas eficientes
auditLogSchema.index({ userId: 1, createdAt: -1 });
auditLogSchema.index({ action: 1, createdAt: -1 });
auditLogSchema.index({ resourceType: 1, resourceId: 1 });
auditLogSchema.index({ createdAt: -1 });

// Método estático para crear log
auditLogSchema.statics.log = async function(data) {
  try {
    const log = await this.create(data);
    return log;
  } catch (error) {
    console.error('Error creando log de auditoría:', error);
  }
};

// Método estático para obtener actividad reciente
auditLogSchema.statics.getRecentActivity = async function(userId, limit = 50) {
  try {
    const logs = await this.find({ userId })
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean();
    return logs;
  } catch (error) {
    console.error('Error obteniendo actividad reciente:', error);
    return [];
  }
};

// Método estático para estadísticas de actividad
auditLogSchema.statics.getActivityStats = async function(userId, days = 30) {
  try {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    
    const stats = await this.aggregate([
      {
        $match: {
          userId: mongoose.Types.ObjectId(userId),
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
    
    return stats;
  } catch (error) {
    console.error('Error obteniendo estadísticas de actividad:', error);
    return [];
  }
};

// Método estático para limpiar logs antiguos
auditLogSchema.statics.cleanOldLogs = async function(daysToKeep = 90) {
  try {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);
    
    const result = await this.deleteMany({
      createdAt: { $lt: cutoffDate }
    });
    
    console.log(`Limpiados ${result.deletedCount} logs antiguos`);
    return result.deletedCount;
  } catch (error) {
    console.error('Error limpiando logs antiguos:', error);
    return 0;
  }
};

const AuditLog = mongoose.model('AuditLog', auditLogSchema);

module.exports = AuditLog;
