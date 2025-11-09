const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Middleware para verificar token JWT
const auth = async (req, res, next) => {
  try {
    // Obtener token del header
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ error: 'No hay token, acceso denegado.' });
    }
    
    // Verificar token
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'uap-secret-key-2025');
    
    // Obtener usuario de la base de datos
    const user = await User.findById(decoded.userId).select('-password');
    
    if (!user) {
      return res.status(401).json({ error: 'Usuario no encontrado.' });
    }
    
    // Agregar datos del usuario al request (compatibilidad con código existente)
    req.userId = user._id.toString();
    req.userRole = user.role;
    req.user = user; // Objeto completo para nuevas rutas
    
    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ error: 'Token inválido.' });
    }
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Token expirado.' });
    }
    res.status(500).json({ error: 'Error al verificar autenticación.' });
  }
};

module.exports = auth;
