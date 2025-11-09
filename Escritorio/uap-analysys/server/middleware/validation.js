const { body, param, query, validationResult } = require('express-validator');

/**
 * Middleware de validación para diferentes rutas
 */
class ValidationMiddleware {
  
  /**
   * Manejar errores de validación
   */
  static handleValidationErrors(req, res, next) {
    const errors = validationResult(req);
    
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'Error de validación',
        details: errors.array()
      });
    }
    
    next();
  }
  
  /**
   * Validación para registro de usuario
   */
  static validateRegister() {
    return [
      body('username')
        .trim()
        .isLength({ min: 3, max: 30 })
        .withMessage('El nombre de usuario debe tener entre 3 y 30 caracteres')
        .matches(/^[a-zA-Z0-9_]+$/)
        .withMessage('El nombre de usuario solo puede contener letras, números y guiones bajos'),
      
      body('email')
        .trim()
        .isEmail()
        .withMessage('Email inválido')
        .normalizeEmail(),
      
      body('password')
        .isLength({ min: 8 })
        .withMessage('La contraseña debe tener al menos 8 caracteres')
        .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
        .withMessage('La contraseña debe contener al menos una mayúscula, una minúscula, un número y un carácter especial'),
      
      this.handleValidationErrors
    ];
  }
  
  /**
   * Validación para login
   */
  static validateLogin() {
    return [
      body('email')
        .trim()
        .isEmail()
        .withMessage('Email inválido')
        .normalizeEmail(),
      
      body('password')
        .notEmpty()
        .withMessage('La contraseña es requerida'),
      
      this.handleValidationErrors
    ];
  }
  
  /**
   * Validación para actualización de perfil
   */
  static validateProfileUpdate() {
    return [
      body('username')
        .optional()
        .trim()
        .isLength({ min: 3, max: 30 })
        .withMessage('El nombre de usuario debe tener entre 3 y 30 caracteres'),
      
      body('email')
        .optional()
        .trim()
        .isEmail()
        .withMessage('Email inválido')
        .normalizeEmail(),
      
      body('firstName')
        .optional()
        .trim()
        .isLength({ max: 50 })
        .withMessage('El nombre no puede tener más de 50 caracteres'),
      
      body('lastName')
        .optional()
        .trim()
        .isLength({ max: 50 })
        .withMessage('El apellido no puede tener más de 50 caracteres'),
      
      this.handleValidationErrors
    ];
  }
  
  /**
   * Validación para cambio de contraseña
   */
  static validatePasswordChange() {
    return [
      body('oldPassword')
        .notEmpty()
        .withMessage('La contraseña actual es requerida'),
      
      body('newPassword')
        .isLength({ min: 8 })
        .withMessage('La nueva contraseña debe tener al menos 8 caracteres')
        .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
        .withMessage('La nueva contraseña debe contener al menos una mayúscula, una minúscula, un número y un carácter especial'),
      
      this.handleValidationErrors
    ];
  }
  
  /**
   * Validación para IDs de MongoDB
   */
  static validateMongoId(field = 'id') {
    return [
      param(field)
        .isMongoId()
        .withMessage('ID inválido'),
      
      this.handleValidationErrors
    ];
  }
  
  /**
   * Validación para creación de reporte
   */
  static validateReportCreation() {
    return [
      body('analysisId')
        .isMongoId()
        .withMessage('ID de análisis inválido'),
      
      body('situation')
        .trim()
        .notEmpty()
        .withMessage('La situación es requerida')
        .isLength({ max: 500 })
        .withMessage('La situación no puede exceder 500 caracteres'),
      
      body('location')
        .trim()
        .notEmpty()
        .withMessage('La ubicación es requerida')
        .isLength({ max: 200 })
        .withMessage('La ubicación no puede exceder 200 caracteres'),
      
      body('datetime')
        .notEmpty()
        .withMessage('La fecha y hora son requeridas')
        .isISO8601()
        .withMessage('Formato de fecha inválido'),
      
      body('witnesses')
        .optional()
        .isInt({ min: 0, max: 1000 })
        .withMessage('Número de testigos inválido'),
      
      body('duration')
        .optional()
        .trim()
        .isLength({ max: 100 })
        .withMessage('La duración no puede exceder 100 caracteres'),
      
      this.handleValidationErrors
    ];
  }
  
  /**
   * Validación para paginación
   */
  static validatePagination() {
    return [
      query('page')
        .optional()
        .isInt({ min: 1 })
        .withMessage('Página debe ser un número mayor a 0'),
      
      query('limit')
        .optional()
        .isInt({ min: 1, max: 100 })
        .withMessage('Límite debe estar entre 1 y 100'),
      
      this.handleValidationErrors
    ];
  }
  
  /**
   * Validación para filtros de fecha
   */
  static validateDateFilters() {
    return [
      query('startDate')
        .optional()
        .isISO8601()
        .withMessage('Formato de fecha de inicio inválido'),
      
      query('endDate')
        .optional()
        .isISO8601()
        .withMessage('Formato de fecha de fin inválido'),
      
      this.handleValidationErrors
    ];
  }
  
  /**
   * Validación para objetos UFO
   */
  static validateUFOObject() {
    return [
      body('name')
        .trim()
        .notEmpty()
        .withMessage('El nombre es requerido')
        .isLength({ max: 100 })
        .withMessage('El nombre no puede exceder 100 caracteres'),
      
      body('category')
        .trim()
        .notEmpty()
        .withMessage('La categoría es requerida')
        .isIn(['celestial', 'aircraft', 'satellite', 'drone', 'balloon', 'bird', 'insect', 'natural', 'uap', 'unknown'])
        .withMessage('Categoría inválida'),
      
      body('description')
        .optional()
        .trim()
        .isLength({ max: 1000 })
        .withMessage('La descripción no puede exceder 1000 caracteres'),
      
      body('frequency')
        .optional()
        .isInt({ min: 0 })
        .withMessage('La frecuencia debe ser un número positivo'),
      
      body('isVerified')
        .optional()
        .isBoolean()
        .withMessage('isVerified debe ser un booleano'),
      
      this.handleValidationErrors
    ];
  }
  
  /**
   * Sanitizar entrada de texto para prevenir XSS
   */
  static sanitizeText(text) {
    if (typeof text !== 'string') return text;
    
    return text
      .replace(/[<>]/g, '') // Eliminar < y >
      .trim();
  }
  
  /**
   * Validar tipo de archivo
   */
  static validateFileType(allowedTypes = ['image/jpeg', 'image/png', 'image/jpg']) {
    return (req, res, next) => {
      if (!req.file) {
        return res.status(400).json({ error: 'No se ha subido ningún archivo' });
      }
      
      if (!allowedTypes.includes(req.file.mimetype)) {
        return res.status(400).json({
          error: 'Tipo de archivo no permitido',
          allowed: allowedTypes
        });
      }
      
      // Verificar tamaño (max 50MB)
      if (req.file.size > 50 * 1024 * 1024) {
        return res.status(400).json({ error: 'El archivo es demasiado grande (máximo 50MB)' });
      }
      
      next();
    };
  }
}

module.exports = ValidationMiddleware;
