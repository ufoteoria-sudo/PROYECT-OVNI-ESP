const AuditLog = require('../models/AuditLog');

/**
 * Middleware para registrar acciones en el sistema de auditoría
 */
class AuditMiddleware {
  
  /**
   * Crear middleware de auditoría para una acción específica
   */
  static audit(action, resourceType = null) {
    return async (req, res, next) => {
      // Guardar la respuesta original
      const originalJson = res.json.bind(res);
      
      // Interceptar la respuesta
      res.json = function(data) {
        // Determinar si fue exitoso basado en el código de estado
        const status = res.statusCode < 400 ? 'success' : 'failure';
        
        // Crear log de auditoría
        if (req.user) {
          AuditLog.log({
            userId: req.user._id,
            action,
            resourceType,
            resourceId: req.params.id || req.body._id || null,
            details: {
              method: req.method,
              path: req.path,
              params: req.params,
              query: req.query,
              body: sanitizeBody(req.body)
            },
            ipAddress: req.ip || req.connection.remoteAddress,
            userAgent: req.get('user-agent'),
            status,
            errorMessage: status === 'failure' ? data.error : null,
            metadata: {
              statusCode: res.statusCode,
              responseTime: Date.now() - req._startTime
            }
          }).catch(err => console.error('Error en log de auditoría:', err));
        }
        
        // Llamar a la respuesta original
        return originalJson(data);
      };
      
      // Guardar tiempo de inicio
      req._startTime = Date.now();
      
      next();
    };
  }
  
  /**
   * Registrar login exitoso
   */
  static async logLogin(userId, req, success = true) {
    try {
      await AuditLog.log({
        userId,
        action: 'login',
        resourceType: 'User',
        resourceId: userId,
        ipAddress: req.ip || req.connection.remoteAddress,
        userAgent: req.get('user-agent'),
        status: success ? 'success' : 'failure',
        details: {
          method: 'POST',
          path: '/api/auth/login'
        }
      });
    } catch (error) {
      console.error('Error registrando login:', error);
    }
  }
  
  /**
   * Registrar logout
   */
  static async logLogout(userId, req) {
    try {
      await AuditLog.log({
        userId,
        action: 'logout',
        resourceType: 'User',
        resourceId: userId,
        ipAddress: req.ip || req.connection.remoteAddress,
        userAgent: req.get('user-agent'),
        status: 'success'
      });
    } catch (error) {
      console.error('Error registrando logout:', error);
    }
  }
  
  /**
   * Registrar cambio de contraseña
   */
  static async logPasswordChange(userId, req, success = true) {
    try {
      await AuditLog.log({
        userId,
        action: 'password_change',
        resourceType: 'User',
        resourceId: userId,
        ipAddress: req.ip || req.connection.remoteAddress,
        userAgent: req.get('user-agent'),
        status: success ? 'success' : 'failure'
      });
    } catch (error) {
      console.error('Error registrando cambio de contraseña:', error);
    }
  }
  
  /**
   * Registrar acción de administrador
   */
  static async logAdminAction(userId, action, resourceType, resourceId, details, req) {
    try {
      await AuditLog.log({
        userId,
        action,
        resourceType,
        resourceId,
        details,
        ipAddress: req.ip || req.connection.remoteAddress,
        userAgent: req.get('user-agent'),
        status: 'success',
        metadata: {
          isAdminAction: true
        }
      });
    } catch (error) {
      console.error('Error registrando acción de admin:', error);
    }
  }
  
  /**
   * Registrar exportación de datos
   */
  static async logDataExport(userId, exportType, details, req) {
    try {
      await AuditLog.log({
        userId,
        action: 'data_export',
        resourceType: 'System',
        details: {
          exportType,
          ...details
        },
        ipAddress: req.ip || req.connection.remoteAddress,
        userAgent: req.get('user-agent'),
        status: 'success'
      });
    } catch (error) {
      console.error('Error registrando exportación:', error);
    }
  }
}

/**
 * Sanitizar body para no guardar información sensible
 */
function sanitizeBody(body) {
  if (!body) return {};
  
  const sanitized = { ...body };
  
  // Eliminar campos sensibles
  delete sanitized.password;
  delete sanitized.newPassword;
  delete sanitized.oldPassword;
  delete sanitized.token;
  
  return sanitized;
}

module.exports = AuditMiddleware;
