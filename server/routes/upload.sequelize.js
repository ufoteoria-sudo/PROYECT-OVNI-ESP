const express = require('express');
const router = express.Router();
const multer = require('multer');
const upload = require('../config/multer');
const auth = require('../middleware/auth');
const { Analysis } = require('../config/db');
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

    const userId = req.user.userId;
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
    const analysis = await Analysis.create({
      userId,
      fileName: file.originalname,
      fileType,
      filePath: file.path,
      fileSize: file.size,
      uploadDate: new Date(),
      status: 'pending',
      metadata: {
        sightingContext: sightingContext || {}
      }
    });

    // Invalidar caché de análisis del usuario
    CacheService.invalidateAnalysisCache();
    CacheService.invalidateUserCache(userId);

    res.status(201).json({
      message: 'Archivo subido exitosamente.',
      analysis: {
        id: analysis.id,
        fileName: analysis.fileName,
        fileType: analysis.fileType,
        fileSize: analysis.fileSize,
        uploadDate: analysis.uploadDate,
        status: analysis.status,
        hasContext: !!sightingContext
      },
      image: {
        filename: file.filename,
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

// GET /api/uploads - Listar análisis del usuario
router.get('/', auth, async (req, res) => {
  try {
    const userId = req.user.userId;
    const { page = 1, limit = 20 } = req.query;
    
    const skip = (page - 1) * limit;
    
    const { count, rows: analyses } = await Analysis.findAndCountAll({
      where: { userId },
      order: [['createdAt', 'DESC']],
      limit: parseInt(limit),
      offset: parseInt(skip),
      attributes: ['id', 'fileName', 'fileType', 'fileSize', 'status', 'uploadDate', 'createdAt']
    });
    
    res.json({
      success: true,
      data: analyses,
      pagination: {
        total: count,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(count / limit)
      }
    });
  } catch (error) {
    console.error('Error listando uploads:', error);
    res.status(500).json({ error: 'Error al listar archivos.' });
  }
});

// GET /api/uploads/:id - Obtener análisis específico
router.get('/:id', auth, async (req, res) => {
  try {
    const userId = req.user.userId;
    const analysisId = req.params.id;
    
    const analysis = await Analysis.findByPk(analysisId);
    
    if (!analysis) {
      return res.status(404).json({ error: 'Análisis no encontrado.' });
    }
    
    // Verificar permisos
    if (req.user.role !== 'admin' && analysis.userId !== userId) {
      return res.status(403).json({ error: 'No tienes permisos para ver este análisis.' });
    }
    
    res.json({
      success: true,
      data: analysis
    });
  } catch (error) {
    console.error('Error obteniendo análisis:', error);
    res.status(500).json({ error: 'Error al obtener análisis.' });
  }
});

// DELETE /api/uploads/:id - Eliminar análisis
router.delete('/:id', auth, async (req, res) => {
  try {
    const userId = req.user.userId;
    const analysisId = req.params.id;
    
    const analysis = await Analysis.findByPk(analysisId);
    
    if (!analysis) {
      return res.status(404).json({ error: 'Análisis no encontrado.' });
    }
    
    // Verificar permisos
    if (req.user.role !== 'admin' && analysis.userId !== userId) {
      return res.status(403).json({ error: 'No tienes permisos para eliminar este análisis.' });
    }
    
    // Eliminar archivo del servidor
    if (analysis.filePath && fs.existsSync(analysis.filePath)) {
      fs.unlinkSync(analysis.filePath);
    }
    
    // Eliminar registro de BD
    await analysis.destroy();
    
    // Invalidar caché
    CacheService.invalidateAnalysisCache();
    CacheService.invalidateUserCache(userId);
    
    res.json({
      success: true,
      message: 'Análisis eliminado exitosamente.'
    });
  } catch (error) {
    console.error('Error eliminando análisis:', error);
    res.status(500).json({ error: 'Error al eliminar análisis.' });
  }
});

module.exports = router;
