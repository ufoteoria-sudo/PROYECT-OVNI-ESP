const express = require('express');
const router = express.Router();
const multer = require('multer');
const upload = require('../config/multer');
const auth = require('../middleware/auth');
const Analysis = require('../models/Analysis');
const CacheService = require('../services/cacheService');
const path = require('path');
const fs = require('fs');

// POST /api/uploads - Subir archivo (imagen o video) CON contexto del avistamiento
router.post('/', auth, upload.single('file'), async (req, res) => {
  try {
    // Verificar que se subió un archivo
    if (!req.file) {
      return res.status(400).json({ error: 'No se ha proporcionado ningún archivo.' });
    }

    const userId = req.userId;
    const file = req.file;

    // Determinar tipo de archivo
    const fileType = file.mimetype.split('/')[0]; // 'image' o 'video'

    // NUEVO: Parsear contexto del avistamiento si existe
    let sightingContext = null;
    if (req.body.sightingContext) {
      try {
        sightingContext = JSON.parse(req.body.sightingContext);
      } catch (error) {
        console.error('Error al parsear contexto del avistamiento:', error);
        // No es crítico, continuar sin contexto
      }
    }

    // Crear registro en la base de datos
    const analysis = new Analysis({
      userId,
      fileName: file.originalname,
      fileType,
      filePath: file.path,
      fileSize: file.size,
      uploadDate: new Date(),
      status: 'pending',
      sightingContext: sightingContext || {} // Guardar contexto si existe
    });

    await analysis.save();

    // Invalidar caché de análisis del usuario
    CacheService.invalidateAnalysisCache();
    CacheService.invalidateUserCache(userId);

    res.status(201).json({
      message: 'Archivo subido exitosamente.',
      analysis: {
        id: analysis._id,
        fileName: analysis.fileName,
        fileType: analysis.fileType,
        fileSize: analysis.fileSize,
        uploadDate: analysis.uploadDate,
        status: analysis.status,
        hasContext: !!sightingContext
      },
      image: {
        filename: file.filename, // Nombre del archivo en el servidor
        path: file.path
      }
    });

  } catch (error) {
    console.error('Error al subir archivo:', error);
    
    // Si hay error, eliminar el archivo subido
    if (req.file) {
      fs.unlink(req.file.path, (err) => {
        if (err) console.error('Error al eliminar archivo:', err);
      });
    }

    res.status(500).json({ error: 'Error al subir el archivo.' });
  }
});

// GET /api/uploads - Obtener todos los uploads del usuario
router.get('/', auth, async (req, res) => {
  try {
    const userId = req.userId;
    const { status, fileType, limit = 50, offset = 0 } = req.query;

    // Construir filtro
    const filter = { userId };
    if (status) filter.status = status;
    if (fileType) filter.fileType = fileType;

    // Obtener análisis con paginación
    const analyses = await Analysis.find(filter)
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip(parseInt(offset))
      .select('-__v -filePath'); // No enviar ruta completa del archivo

    // Contar total
    const total = await Analysis.countDocuments(filter);

    res.json({
      analyses,
      pagination: {
        total,
        limit: parseInt(limit),
        offset: parseInt(offset),
        hasMore: total > (parseInt(offset) + parseInt(limit))
      }
    });

  } catch (error) {
    console.error('Error al obtener uploads:', error);
    res.status(500).json({ error: 'Error al obtener los uploads.' });
  }
});

// GET /api/uploads/:id - Obtener detalles de un análisis específico
router.get('/:id', auth, async (req, res) => {
  try {
    const userId = req.userId;
    const userRole = req.userRole;
    const analysisId = req.params.id;

    const analysis = await Analysis.findById(analysisId)
      .populate('userId', 'username email firstName lastName')
      .populate('matchResults.objectId');

    if (!analysis) {
      return res.status(404).json({ error: 'Análisis no encontrado.' });
    }

    // Verificar permisos: admin o dueño del análisis
    if (userRole !== 'admin' && analysis.userId._id.toString() !== userId) {
      return res.status(403).json({ error: 'No tienes permiso para ver este análisis.' });
    }

    // Incrementar vistas
    analysis.views += 1;
    await analysis.save();

    res.json(analysis);

  } catch (error) {
    console.error('Error al obtener análisis:', error);
    if (error.kind === 'ObjectId') {
      return res.status(400).json({ error: 'ID de análisis inválido.' });
    }
    res.status(500).json({ error: 'Error al obtener el análisis.' });
  }
});

// DELETE /api/uploads/:id - Eliminar un análisis y su archivo
router.delete('/:id', auth, async (req, res) => {
  try {
    const userId = req.userId;
    const userRole = req.userRole;
    const analysisId = req.params.id;

    const analysis = await Analysis.findById(analysisId);

    if (!analysis) {
      return res.status(404).json({ error: 'Análisis no encontrado.' });
    }

    // Verificar permisos: admin o dueño
    if (userRole !== 'admin' && analysis.userId.toString() !== userId) {
      return res.status(403).json({ error: 'No tienes permiso para eliminar este análisis.' });
    }

    // Eliminar archivo físico
    if (analysis.filePath && fs.existsSync(analysis.filePath)) {
      fs.unlink(analysis.filePath, (err) => {
        if (err) console.error('Error al eliminar archivo físico:', err);
      });
    }

    // Eliminar de la base de datos
    await Analysis.findByIdAndDelete(analysisId);

    res.json({ message: 'Análisis eliminado exitosamente.' });

  } catch (error) {
    console.error('Error al eliminar análisis:', error);
    if (error.kind === 'ObjectId') {
      return res.status(400).json({ error: 'ID de análisis inválido.' });
    }
    res.status(500).json({ error: 'Error al eliminar el análisis.' });
  }
});

// GET /api/uploads/:id/download - Descargar archivo original
router.get('/:id/download', auth, async (req, res) => {
  try {
    const userId = req.userId;
    const userRole = req.userRole;
    const analysisId = req.params.id;

    const analysis = await Analysis.findById(analysisId);

    if (!analysis) {
      return res.status(404).json({ error: 'Análisis no encontrado.' });
    }

    // Verificar permisos
    if (userRole !== 'admin' && analysis.userId.toString() !== userId) {
      return res.status(403).json({ error: 'No tienes permiso para descargar este archivo.' });
    }

    // Verificar que el archivo existe
    if (!fs.existsSync(analysis.filePath)) {
      return res.status(404).json({ error: 'Archivo no encontrado en el servidor.' });
    }

    // Enviar archivo
    res.download(analysis.filePath, analysis.fileName);

  } catch (error) {
    console.error('Error al descargar archivo:', error);
    res.status(500).json({ error: 'Error al descargar el archivo.' });
  }
});

// Manejo de errores de Multer
router.use((error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ error: 'El archivo es demasiado grande. Tamaño máximo: 50MB.' });
    }
    return res.status(400).json({ error: `Error al subir archivo: ${error.message}` });
  }
  
  if (error.message && error.message.includes('Tipo de archivo no permitido')) {
    return res.status(400).json({ error: error.message });
  }
  
  next(error);
});

module.exports = router;
