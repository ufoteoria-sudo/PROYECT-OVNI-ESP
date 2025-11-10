/**
 * Servicio de Notificaciones WebSocket
 * Maneja emisión de eventos en tiempo real durante el análisis
 */

class WebSocketService {
  
  /**
   * Emitir evento de inicio de análisis
   */
  static emitAnalysisStarted(analysisId, userId) {
    if (!global.io) return;
    
    global.io.emit(`analysis:${analysisId}`, {
      type: 'started',
      analysisId,
      userId,
      timestamp: new Date(),
      message: 'Análisis iniciado'
    });

    console.log(`[WebSocket] Análisis iniciado: ${analysisId}`);
  }

  /**
   * Emitir evento de capa completada
   */
  static emitLayerComplete(analysisId, layerNumber, layerName, data = {}) {
    if (!global.io) return;
    
    global.io.emit(`analysis:${analysisId}`, {
      type: 'layer_complete',
      analysisId,
      layer: {
        number: layerNumber,
        name: layerName,
        data
      },
      timestamp: new Date(),
      message: `Capa ${layerNumber} (${layerName}) completada`
    });

    console.log(`[WebSocket] Capa ${layerNumber} completada: ${analysisId}`);
  }

  /**
   * Emitir progreso de análisis
   */
  static emitProgress(analysisId, progress, currentLayer) {
    if (!global.io) return;
    
    global.io.emit(`analysis:${analysisId}`, {
      type: 'progress',
      analysisId,
      progress, // 0-100
      currentLayer,
      timestamp: new Date()
    });
  }

  /**
   * Emitir evento de análisis completado
   */
  static emitAnalysisComplete(analysisId, result) {
    if (!global.io) return;
    
    global.io.emit(`analysis:${analysisId}`, {
      type: 'complete',
      analysisId,
      result: {
        status: result.status,
        confidence: result.confidence,
        layersCompleted: 9
      },
      timestamp: new Date(),
      message: 'Análisis completado exitosamente'
    });

    console.log(`[WebSocket] Análisis completado: ${analysisId}`);
  }

  /**
   * Emitir evento de error
   */
  static emitAnalysisError(analysisId, error) {
    if (!global.io) return;
    
    global.io.emit(`analysis:${analysisId}`, {
      type: 'error',
      analysisId,
      error: {
        message: error.message || 'Error desconocido',
        layer: error.layer || null
      },
      timestamp: new Date(),
      message: 'Error durante el análisis'
    });

    console.error(`[WebSocket] Error en análisis ${analysisId}:`, error.message);
  }

  /**
   * Emitir notificación general a un usuario
   */
  static emitUserNotification(userId, notification) {
    if (!global.io) return;
    
    global.io.emit(`user:${userId}`, {
      type: 'notification',
      notification,
      timestamp: new Date()
    });
  }

  /**
   * Emitir estadísticas del sistema
   */
  static emitSystemStats(stats) {
    if (!global.io) return;
    
    global.io.emit('system:stats', {
      type: 'stats',
      stats,
      timestamp: new Date()
    });
  }

  /**
   * Obtener número de clientes conectados
   */
  static getConnectedClients() {
    if (!global.io) return 0;
    return global.io.engine.clientsCount;
  }
}

module.exports = WebSocketService;
