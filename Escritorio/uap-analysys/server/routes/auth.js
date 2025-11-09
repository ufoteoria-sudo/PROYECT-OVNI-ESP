const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const auth = require('../middleware/auth');

// Generar JWT Token
const generateToken = (userId, role) => {
  return jwt.sign(
    { userId, role },
    process.env.JWT_SECRET || 'uap-secret-key-2025',
    { expiresIn: '7d' } // Token válido por 7 días
  );
};

// @route   POST /api/auth/register
// @desc    Registrar nuevo usuario
// @access  Public
router.post('/register', async (req, res) => {
  try {
    const { username, email, password, firstName, lastName } = req.body;
    
    // Validaciones básicas
    if (!username || !email || !password) {
      return res.status(400).json({ 
        error: 'Username, email y contraseña son obligatorios.' 
      });
    }
    
    if (password.length < 6) {
      return res.status(400).json({ 
        error: 'La contraseña debe tener al menos 6 caracteres.' 
      });
    }
    
    // Verificar si el usuario ya existe
    const existingUser = await User.findOne({ 
      $or: [{ email }, { username }] 
    });
    
    if (existingUser) {
      if (existingUser.email === email) {
        return res.status(409).json({ error: 'El email ya está registrado.' });
      }
      if (existingUser.username === username) {
        return res.status(409).json({ error: 'El username ya está en uso.' });
      }
    }
    
    // Hash de la contraseña
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    
    // Crear nuevo usuario
    const newUser = new User({
      username,
      email,
      password: hashedPassword,
      firstName: firstName || '',
      lastName: lastName || '',
      role: 'user', // Por defecto es usuario normal
      subscription: {
        status: 'free',
        plan: 'free'
      }
    });
    
    await newUser.save();
    
    // Generar token
    const token = generateToken(newUser._id, newUser.role);
    
    // Responder con usuario y token (sin contraseña)
    res.status(201).json({
      message: 'Usuario registrado exitosamente.',
      token,
      user: {
        id: newUser._id,
        username: newUser.username,
        email: newUser.email,
        firstName: newUser.firstName,
        lastName: newUser.lastName,
        role: newUser.role,
        subscription: newUser.subscription
      }
    });
    
  } catch (error) {
    console.error('Error en registro:', error);
    if (error.code === 11000) {
      return res.status(409).json({ error: 'El email o username ya está registrado.' });
    }
    res.status(500).json({ error: 'Error al registrar usuario.' });
  }
});

// @route   POST /api/auth/login
// @desc    Login de usuario
// @access  Public
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    // Validaciones
    if (!email || !password) {
      return res.status(400).json({ 
        error: 'Email y contraseña son obligatorios.' 
      });
    }
    
    // Buscar usuario (puede ser email o username)
    const user = await User.findOne({
      $or: [{ email }, { username: email }]
    });
    
    if (!user) {
      return res.status(401).json({ 
        error: 'Credenciales inválidas.' 
      });
    }
    
    // Verificar contraseña
    const isMatch = await bcrypt.compare(password, user.password);
    
    if (!isMatch) {
      return res.status(401).json({ 
        error: 'Credenciales inválidas.' 
      });
    }
    
    // Verificar si el usuario está activo
    if (!user.isActive) {
      return res.status(403).json({ 
        error: 'Cuenta desactivada. Contacte al administrador.' 
      });
    }
    
    // Actualizar última conexión
    user.lastLogin = new Date();
    await user.save();
    
    // Generar token
    const token = generateToken(user._id, user.role);
    
    // Responder con usuario y token
    res.json({
      message: 'Login exitoso.',
      token,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        subscription: user.subscription,
        profile: user.profile
      }
    });
    
  } catch (error) {
    console.error('Error en login:', error);
    res.status(500).json({ error: 'Error al iniciar sesión.' });
  }
});

// @route   GET /api/auth/me
// @desc    Obtener datos del usuario autenticado
// @access  Private
router.get('/me', auth, async (req, res) => {
  try {
    const user = await User.findById(req.userId).select('-password');
    
    if (!user) {
      return res.status(404).json({ error: 'Usuario no encontrado.' });
    }
    
    res.json({ user });
    
  } catch (error) {
    console.error('Error al obtener usuario:', error);
    res.status(500).json({ error: 'Error al obtener datos del usuario.' });
  }
});

// @route   PUT /api/auth/change-password
// @desc    Cambiar contraseña del usuario autenticado
// @access  Private
router.put('/change-password', auth, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ 
        error: 'Contraseña actual y nueva contraseña son obligatorias.' 
      });
    }
    
    if (newPassword.length < 6) {
      return res.status(400).json({ 
        error: 'La nueva contraseña debe tener al menos 6 caracteres.' 
      });
    }
    
    const user = await User.findById(req.userId);
    
    // Verificar contraseña actual
    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      return res.status(401).json({ error: 'Contraseña actual incorrecta.' });
    }
    
    // Hash de la nueva contraseña
    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(newPassword, salt);
    
    await user.save();
    
    res.json({ message: 'Contraseña cambiada exitosamente.' });
    
  } catch (error) {
    console.error('Error al cambiar contraseña:', error);
    res.status(500).json({ error: 'Error al cambiar contraseña.' });
  }
});

module.exports = router;
