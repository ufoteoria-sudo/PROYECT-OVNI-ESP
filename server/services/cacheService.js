const NodeCache = require('node-cache');

// Crear instancias de caché con diferentes TTL
const caches = {
  // Caché de corta duración (5 minutos) para datos que cambian frecuentemente
  short: new NodeCache({ stdTTL: 300, checkperiod: 60 }),
  
  // Caché de media duración (15 minutos) para patrones y estadísticas
  medium: new NodeCache({ stdTTL: 900, checkperiod: 120 }),
  
  // Caché de larga duración (1 hora) para datos que raramente cambian
  long: new NodeCache({ stdTTL: 3600, checkperiod: 300 }),
  
  // Caché para sesiones (30 minutos)
  session: new NodeCache({ stdTTL: 1800, checkperiod: 180 })
};

class CacheService {
  /**
   * Obtener valor de caché
   * @param {string} type - Tipo de caché (short, medium, long, session)
   * @param {string} key - Clave del valor
   * @returns {any} Valor almacenado o undefined
   */
  static get(type, key) {
    if (!caches[type]) {
      console.error(`Tipo de caché inválido: ${type}`);
      return undefined;
    }
    
    const value = caches[type].get(key);
    if (value !== undefined) {
      console.log(`✅ Cache HIT: ${type}/${key}`);
    } else {
      console.log(`❌ Cache MISS: ${type}/${key}`);
    }
    return value;
  }

  /**
   * Guardar valor en caché
   * @param {string} type - Tipo de caché (short, medium, long, session)
   * @param {string} key - Clave del valor
   * @param {any} value - Valor a almacenar
   * @param {number} ttl - TTL personalizado (opcional)
   * @returns {boolean} true si se guardó exitosamente
   */
  static set(type, key, value, ttl = null) {
    if (!caches[type]) {
      console.error(`Tipo de caché inválido: ${type}`);
      return false;
    }
    
    const success = ttl 
      ? caches[type].set(key, value, ttl)
      : caches[type].set(key, value);
    
    if (success) {
      console.log(`💾 Cache SET: ${type}/${key}`);
    }
    return success;
  }

  /**
   * Eliminar valor de caché
   * @param {string} type - Tipo de caché
   * @param {string} key - Clave del valor
   * @returns {number} Número de keys eliminadas
   */
  static del(type, key) {
    if (!caches[type]) {
      console.error(`Tipo de caché inválido: ${type}`);
      return 0;
    }
    
    const deleted = caches[type].del(key);
    if (deleted > 0) {
      console.log(`🗑️  Cache DEL: ${type}/${key}`);
    }
    return deleted;
  }

  /**
   * Eliminar múltiples keys de caché
   * @param {string} type - Tipo de caché
   * @param {string[]} keys - Array de claves
   * @returns {number} Número de keys eliminadas
   */
  static delMultiple(type, keys) {
    if (!caches[type]) {
      console.error(`Tipo de caché inválido: ${type}`);
      return 0;
    }
    
    const deleted = caches[type].del(keys);
    console.log(`🗑️  Cache DEL Multiple: ${type}/ (${deleted} keys)`);
    return deleted;
  }

  /**
   * Limpiar todo el caché de un tipo
   * @param {string} type - Tipo de caché
   */
  static flush(type) {
    if (!caches[type]) {
      console.error(`Tipo de caché inválido: ${type}`);
      return;
    }
    
    caches[type].flushAll();
    console.log(`🧹 Cache FLUSH: ${type}`);
  }

  /**
   * Limpiar todos los cachés
   */
  static flushAll() {
    Object.keys(caches).forEach(type => {
      caches[type].flushAll();
    });
    console.log('🧹 Cache FLUSH ALL');
  }

  /**
   * Obtener estadísticas de caché
   * @param {string} type - Tipo de caché (opcional)
   * @returns {object} Estadísticas
   */
  static getStats(type = null) {
    if (type) {
      if (!caches[type]) {
        console.error(`Tipo de caché inválido: ${type}`);
        return null;
      }
      return caches[type].getStats();
    }
    
    // Retornar stats de todos los cachés
    const stats = {};
    Object.keys(caches).forEach(cacheType => {
      stats[cacheType] = caches[cacheType].getStats();
    });
    return stats;
  }

  /**
   * Obtener o crear (si no existe)
   * @param {string} type - Tipo de caché
   * @param {string} key - Clave del valor
   * @param {function} fetchFunction - Función async para obtener el valor si no está en caché
   * @param {number} ttl - TTL personalizado (opcional)
   * @returns {Promise<any>} Valor del caché o resultado de fetchFunction
   */
  static async getOrSet(type, key, fetchFunction, ttl = null) {
    // Intentar obtener de caché
    const cachedValue = this.get(type, key);
    if (cachedValue !== undefined) {
      return cachedValue;
    }
    
    // Si no está en caché, ejecutar función de fetch
    try {
      const value = await fetchFunction();
      this.set(type, key, value, ttl);
      return value;
    } catch (error) {
      console.error(`Error en getOrSet para ${type}/${key}:`, error.message);
      throw error;
    }
  }

  /**
   * Invalidar caché relacionado a un usuario
   * @param {string} userId - ID del usuario
   */
  static invalidateUserCache(userId) {
    // Invalidar diferentes tipos de caché relacionados al usuario
    this.del('short', `user_uploads_${userId}`);
    this.del('short', `user_reports_${userId}`);
    this.del('short', `user_notifications_${userId}`);
    this.del('session', `user_profile_${userId}`);
    console.log(`🗑️  Invalidado caché de usuario: ${userId}`);
  }

  /**
   * Invalidar caché de análisis
   * @param {string} analysisId - ID del análisis (opcional)
   */
  static invalidateAnalysisCache(analysisId = null) {
    if (analysisId) {
      this.del('short', `analysis_${analysisId}`);
      this.del('short', `analysis_status_${analysisId}`);
    }
    
    // Invalidar cachés de patrones y estadísticas
    this.flush('medium');
    console.log('🗑️  Invalidado caché de análisis');
  }

  /**
   * Invalidar caché de reportes
   */
  static invalidateReportsCache() {
    this.flush('short');
    console.log('🗑️  Invalidado caché de reportes');
  }

  /**
   * Middleware para agregar funciones de caché a req
   */
  static middleware() {
    return (req, res, next) => {
      req.cache = {
        get: (type, key) => CacheService.get(type, key),
        set: (type, key, value, ttl) => CacheService.set(type, key, value, ttl),
        del: (type, key) => CacheService.del(type, key),
        getOrSet: (type, key, fetchFn, ttl) => CacheService.getOrSet(type, key, fetchFn, ttl)
      };
      next();
    };
  }
}

module.exports = CacheService;
