const Notification = require('../models/Notification');

/**
 * Servicio centralizado para crear y enviar notificaciones
 */
class NotificationService {
  
  /**
   * Notificar cuando un análisis se completa
   */
  static async notifyAnalysisCompleted(userId, analysisId, analysisData) {
    try {
      await Notification.createNotification({
        userId,
        type: 'analysis_completed',
        title: '✅ Análisis Completado',
        message: `Tu análisis de "${analysisData.fileName}" ha sido completado. Categoría: ${analysisData.category}`,
        relatedId: analysisId,
        relatedModel: 'Analysis',
        priority: 'medium',
        metadata: {
          fileName: analysisData.fileName,
          category: analysisData.category,
          confidence: analysisData.confidence
        }
      });
    } catch (error) {
      console.error('Error enviando notificación de análisis:', error);
    }
  }
  
  /**
   * Notificar cuando un reporte se genera
   */
  static async notifyReportGenerated(userId, reportId, reportData) {
    try {
      await Notification.createNotification({
        userId,
        type: 'report_generated',
        title: '📄 Reporte Generado',
        message: `Tu reporte "${reportData.title}" ha sido generado exitosamente y está listo para descargar.`,
        relatedId: reportId,
        relatedModel: 'Report',
        priority: 'high',
        metadata: {
          title: reportData.title,
          reportNumber: reportData.reportNumber
        }
      });
    } catch (error) {
      console.error('Error enviando notificación de reporte:', error);
    }
  }
  
  /**
   * Notificar alerta del sistema
   */
  static async notifySystemAlert(userId, title, message, priority = 'medium') {
    try {
      await Notification.createNotification({
        userId,
        type: 'system_alert',
        title,
        message,
        priority
      });
    } catch (error) {
      console.error('Error enviando alerta del sistema:', error);
    }
  }
  
  /**
   * Notificar mensaje de administrador
   */
  static async notifyAdminMessage(userId, title, message) {
    try {
      await Notification.createNotification({
        userId,
        type: 'admin_message',
        title: `👨‍💼 ${title}`,
        message,
        priority: 'high'
      });
    } catch (error) {
      console.error('Error enviando mensaje de admin:', error);
    }
  }
  
  /**
   * Notificar actualización de suscripción
   */
  static async notifySubscriptionUpdate(userId, message) {
    try {
      await Notification.createNotification({
        userId,
        type: 'subscription_update',
        title: '⭐ Actualización de Suscripción',
        message,
        priority: 'high'
      });
    } catch (error) {
      console.error('Error enviando notificación de suscripción:', error);
    }
  }
  
  /**
   * Notificar a todos los usuarios (broadcast)
   */
  static async notifyAllUsers(title, message, type = 'system_alert', priority = 'medium') {
    try {
      const User = require('../models/User');
      const users = await User.find({ isActive: true }, '_id');
      
      const notifications = users.map(user => ({
        userId: user._id,
        type,
        title,
        message,
        priority
      }));
      
      await Notification.insertMany(notifications);
      console.log(`Notificación enviada a ${users.length} usuarios`);
    } catch (error) {
      console.error('Error enviando notificación broadcast:', error);
    }
  }
  
  /**
   * Limpiar notificaciones antiguas (más de 30 días leídas)
   */
  static async cleanOldNotifications() {
    try {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      
      const result = await Notification.deleteMany({
        isRead: true,
        createdAt: { $lt: thirtyDaysAgo }
      });
      
      console.log(`Limpiadas ${result.deletedCount} notificaciones antiguas`);
      return result.deletedCount;
    } catch (error) {
      console.error('Error limpiando notificaciones:', error);
      return 0;
    }
  }
}

module.exports = NotificationService;
