const express = require('express');
const router = express.Router();
const { User, Analysis } = require('../config/db');
const auth = require('../middleware/auth');
const isAdmin = require('../middleware/isAdmin');
const { Op } = require('sequelize');

// Obtener estadísticas del usuario (sin autenticación para WordPress)
router.get('/stats', async (req, res) => {
  try {
    const total = await Analysis.count();
    const completed = await Analysis.count({ where: { status: 'completed' } });
    const processing = await Analysis.count({ 
      where: { 
        status: { [Op.in]: ['pending', 'analyzing', 'uploading'] } 
      } 
    });
    
    res.json({
      success: true,
      data: {
        total: total,
        uploaded: total,
        completed: completed,
        processing: processing
      }
    });
  } catch (err) {
    console.error('Error obteniendo stats:', err);
    res.status(500).json({ 
      success: false,
      error: 'Error al obtener estadísticas.',
      data: { total: 0, uploaded: 0, completed: 0, processing: 0 }
    });
  }
});

// Obtener reportes del usuario (sin autenticación para WordPress)
router.get('/reports', async (req, res) => {
  try {
    const { page = 1, limit = 20, search = '', status = '', type = '' } = req.query;
    
    let where = {};
    
    if (search) {
      where = {
        [Op.or]: [
          { fileName: { [Op.iLike]: `%${search}%` } },
          { ['exifData.location.address']: { [Op.iLike]: `%${search}%` } }
        ]
      };
    }
    
    if (status) {
      where.status = status;
    }
    
    if (type) {
      where.fileType = type;
    }
    
    const skip = (page - 1) * limit;
    
    const { count, rows: reports } = await Analysis.findAndCountAll({
      where,
      order: [['createdAt', 'DESC']],
      limit: parseInt(limit),
      offset: parseInt(skip),
      attributes: ['id', 'fileName', 'fileType', 'status', 'createdAt', 'exifData', 'aiAnalysis'],
      raw: true
    });
    
    // Formatear respuesta
    const formattedReports = reports.map(report => ({
      _id: report.id,
      fileName: report.fileName,
      fileType: report.fileType || 'image',
      status: report.status || 'pending',
      createdAt: report.createdAt,
      imageUrl: `https://via.placeholder.com/60?text=${report.fileName}`,
      exifData: report.exifData,
      aiAnalysis: report.aiAnalysis
    }));
    
    res.json({
      success: true,
      data: formattedReports,
      pagination: {
        total: count,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(count / limit)
      }
    });
    
  } catch (err) {
    console.error('Error obteniendo reportes:', err);
    res.status(500).json({ 
      success: false,
      error: 'Error al obtener reportes.' 
    });
  }
});

// @route   GET /api/users
// @desc    Listar todos los usuarios
// @access  Private (Admin)
router.get('/', auth, isAdmin, async (req, res) => {
  try {
    const { page = 1, limit = 50, search = '' } = req.query;
    
    let where = {};
    if (search) {
      where = {
        [Op.or]: [
          { username: { [Op.iLike]: `%${search}%` } },
          { email: { [Op.iLike]: `%${search}%` } },
          { firstName: { [Op.iLike]: `%${search}%` } }
        ]
      };
    }
    
    const skip = (page - 1) * limit;
    
    const { count, rows: users } = await User.findAndCountAll({
      where,
      attributes: { exclude: ['password'] },
      order: [['createdAt', 'DESC']],
      limit: parseInt(limit),
      offset: parseInt(skip)
    });
    
    res.json({
      success: true,
      data: users,
      pagination: {
        total: count,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(count / limit)
      }
    });
  } catch (error) {
    console.error('Error listando usuarios:', error);
    res.status(500).json({ error: 'Error al listar usuarios.' });
  }
});

// @route   GET /api/users/:id
// @desc    Obtener usuario por ID
// @access  Private
router.get('/:id', auth, async (req, res) => {
  try {
    // Solo admin o el mismo usuario
    if (req.user.role !== 'admin' && req.user.userId !== req.params.id) {
      return res.status(403).json({ error: 'No tienes permisos para acceder a este usuario.' });
    }
    
    const user = await User.findByPk(req.params.id, {
      attributes: { exclude: ['password'] }
    });
    
    if (!user) {
      return res.status(404).json({ error: 'Usuario no encontrado.' });
    }
    
    res.json({
      success: true,
      data: user
    });
  } catch (error) {
    console.error('Error obteniendo usuario:', error);
    res.status(500).json({ error: 'Error al obtener usuario.' });
  }
});

// @route   POST /api/users
// @desc    Crear nuevo usuario
// @access  Private (Admin)
router.post('/', auth, isAdmin, async (req, res) => {
  try {
    const { username, email, password, firstName, lastName, role } = req.body;
    
    if (!username || !email || !password) {
      return res.status(400).json({ 
        error: 'Username, email y contraseña son obligatorios.' 
      });
    }
    
    // Verificar duplicados
    const existing = await User.findOne({
      where: {
        [Op.or]: [{ username }, { email: email.toLowerCase() }]
      }
    });
    
    if (existing) {
      return res.status(409).json({ 
        error: existing.email === email.toLowerCase() 
          ? 'El email ya está registrado.' 
          : 'El username ya está en uso.' 
      });
    }
    
    const bcrypt = require('bcryptjs');
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    
    const newUser = await User.create({
      username,
      email: email.toLowerCase(),
      password: hashedPassword,
      firstName: firstName || '',
      lastName: lastName || '',
      role: role || 'user'
    });
    
    res.status(201).json({
      success: true,
      message: 'Usuario creado exitosamente.',
      data: {
        id: newUser.id,
        username: newUser.username,
        email: newUser.email,
        role: newUser.role
      }
    });
  } catch (error) {
    console.error('Error creando usuario:', error);
    res.status(500).json({ error: 'Error al crear usuario.' });
  }
});

// @route   PUT /api/users/:id
// @desc    Actualizar usuario
// @access  Private (Admin o mismo usuario)
router.put('/:id', auth, async (req, res) => {
  try {
    // Solo admin o el mismo usuario
    if (req.user.role !== 'admin' && req.user.userId !== req.params.id) {
      return res.status(403).json({ error: 'No tienes permisos para actualizar este usuario.' });
    }
    
    const user = await User.findByPk(req.params.id);
    if (!user) {
      return res.status(404).json({ error: 'Usuario no encontrado.' });
    }
    
    const { username, email, firstName, lastName, profile } = req.body;
    
    // Verificar duplicados si cambia username o email
    if (username && username !== user.username) {
      const existing = await User.findOne({ where: { username } });
      if (existing) {
        return res.status(409).json({ error: 'El username ya está en uso.' });
      }
    }
    
    if (email && email.toLowerCase() !== user.email) {
      const existing = await User.findOne({ where: { email: email.toLowerCase() } });
      if (existing) {
        return res.status(409).json({ error: 'El email ya está registrado.' });
      }
    }
    
    // Actualizar
    await user.update({
      username: username || user.username,
      email: email ? email.toLowerCase() : user.email,
      firstName: firstName !== undefined ? firstName : user.firstName,
      lastName: lastName !== undefined ? lastName : user.lastName,
      profile: profile || user.profile
    });
    
    res.json({
      success: true,
      message: 'Usuario actualizado exitosamente.',
      data: {
        id: user.id,
        username: user.username,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        profile: user.profile
      }
    });
  } catch (error) {
    console.error('Error actualizando usuario:', error);
    res.status(500).json({ error: 'Error al actualizar usuario.' });
  }
});

// @route   DELETE /api/users/:id
// @desc    Eliminar usuario
// @access  Private (Admin)
router.delete('/:id', auth, isAdmin, async (req, res) => {
  try {
    const user = await User.findByPk(req.params.id);
    if (!user) {
      return res.status(404).json({ error: 'Usuario no encontrado.' });
    }
    
    await user.destroy();
    
    res.json({
      success: true,
      message: 'Usuario eliminado exitosamente.'
    });
  } catch (error) {
    console.error('Error eliminando usuario:', error);
    res.status(500).json({ error: 'Error al eliminar usuario.' });
  }
});

module.exports = router;
