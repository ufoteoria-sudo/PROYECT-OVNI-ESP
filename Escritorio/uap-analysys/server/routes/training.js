const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs').promises;
const sharp = require('sharp');
const TrainingImage = require('../models/TrainingImage');
const auth = require('../middleware/auth');
const isAdmin = require('../middleware/isAdmin');
const AuditMiddleware = require('../middleware/audit');
const trainingLearningService = require('../services/trainingLearningService');

// Configuración de multer para subida de imágenes de entrenamiento
const storage = multer.diskStorage({
  destination: async (req, file, cb) => {
    const uploadPath = path.join(__dirname, '../uploads/training');
    try {
      await fs.mkdir(uploadPath, { recursive: true });
      cb(null, uploadPath);
    } catch (error) {
      cb(error);
    }
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'training-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB máximo
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|webp/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);

    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Solo se permiten imágenes (JPEG, PNG, WebP)'));
    }
  }
});

// ==================== CREAR IMAGEN DE ENTRENAMIENTO ====================
// POST /api/training - Subir nueva imagen de entrenamiento (ADMIN)
router.post('/', auth, isAdmin, upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No se proporcionó imagen' });
    }

    const {
      category,
      type,
      model,
      description,
      visualFeatures,
      technicalData,
      commonSightings,
      tags,
      keywords, // NUEVO: Keywords para matching textual
      notes,
      externalRefs
    } = req.body;

    // Validar campos requeridos (description ya no es requerido)
    if (!category || !type) {
      // Eliminar archivo subido si falta información
      await fs.unlink(req.file.path);
      return res.status(400).json({
        error: 'Faltan campos requeridos: category, type'
      });
    }

    const imageFilename = req.file.filename;
    const thumbnailFilename = 'thumb-' + imageFilename;
    const thumbnailPath = path.join(path.dirname(req.file.path), thumbnailFilename);

    // Generar thumbnail
    try {
      await sharp(req.file.path)
        .resize(300, 300, {
          fit: 'cover',
          position: 'center'
        })
        .jpeg({ quality: 80 })
        .toFile(thumbnailPath);
    } catch (error) {
      console.error('Error generando thumbnail:', error);
    }

    // Parsear JSON si vienen como strings
    const parsedVisualFeatures = typeof visualFeatures === 'string' 
      ? JSON.parse(visualFeatures) 
      : visualFeatures;

    const parsedTechnicalData = typeof technicalData === 'string'
      ? JSON.parse(technicalData)
      : technicalData;

    const parsedCommonSightings = typeof commonSightings === 'string'
      ? JSON.parse(commonSightings)
      : commonSightings;

    const parsedTags = typeof tags === 'string'
      ? JSON.parse(tags)
      : (Array.isArray(tags) ? tags : []);

    // NUEVO: Parsear keywords
    const parsedKeywords = typeof keywords === 'string'
      ? JSON.parse(keywords)
      : (Array.isArray(keywords) ? keywords : []);
    
    // Validar máximo 20 keywords
    if (parsedKeywords.length > 20) {
      await fs.unlink(req.file.path);
      return res.status(400).json({
        error: 'Máximo 20 palabras clave permitidas'
      });
    }

    const parsedExternalRefs = typeof externalRefs === 'string'
      ? JSON.parse(externalRefs)
      : externalRefs;

    // NUEVO: Extraer características visuales automáticamente
    console.log('🔍 Extrayendo características visuales de la imagen...');
    const autoExtractedFeatures = await trainingLearningService.extractBasicFeatures(req.file.path);
    
    // Combinar características proporcionadas manualmente con las auto-extraídas
    const finalVisualFeatures = {
      // Características manuales (si se proporcionaron)
      ...(parsedVisualFeatures || {}),
      // Características auto-extraídas (siempre)
      autoExtracted: {
        aspectRatio: autoExtractedFeatures.aspectRatio?.toFixed(2),
        dominantColors: autoExtractedFeatures.dominantColors,
        brightness: autoExtractedFeatures.brightness?.toFixed(2),
        contrast: autoExtractedFeatures.contrast?.toFixed(2),
        width: autoExtractedFeatures.width,
        height: autoExtractedFeatures.height
      }
    };

    console.log('✅ Características extraídas:', finalVisualFeatures.autoExtracted);

    // Crear registro de imagen de entrenamiento
    const trainingImage = new TrainingImage({
      category,
      type,
      model: model || null,
      description,
      imageUrl: imageFilename,
      thumbnailUrl: thumbnailFilename,
      visualFeatures: finalVisualFeatures,
      technicalData: parsedTechnicalData,
      commonSightings: parsedCommonSightings,
      tags: parsedTags,
      keywords: parsedKeywords, // NUEVO: Keywords para matching
      notes,
      externalRefs: parsedExternalRefs,
      uploadedBy: req.user._id,
      verified: true, // Auto-verificar si es admin
      verifiedBy: req.user._id,
      verifiedAt: new Date()
    });

    await trainingImage.save();

    // Log de auditoría
    await AuditMiddleware.logAdminAction(
      req.user._id,
      'training_upload',
      'TrainingImage',
      trainingImage._id,
      { category, type, description },
      req
    );

    res.status(201).json({
      message: 'Imagen de entrenamiento subida exitosamente',
      trainingImage
    });

  } catch (error) {
    console.error('Error subiendo imagen de entrenamiento:', error);
    
    // Intentar eliminar archivo si hubo error
    if (req.file && req.file.path) {
      try {
        await fs.unlink(req.file.path);
      } catch (unlinkError) {
        console.error('Error eliminando archivo:', unlinkError);
      }
    }

    res.status(500).json({
      error: 'Error subiendo imagen de entrenamiento',
      details: error.message
    });
  }
});

// ==================== LISTAR IMÁGENES DE ENTRENAMIENTO ====================
// GET /api/training - Listar todas las imágenes de entrenamiento
router.get('/', auth, async (req, res) => {
  try {
    const {
      category,
      isActive,
      verified,
      page = 1,
      limit = 20,
      sortBy = 'createdAt',
      order = 'desc'
    } = req.query;

    const query = {};

    if (category) query.category = category;
    if (isActive !== undefined) query.isActive = isActive === 'true';
    if (verified !== undefined) query.verified = verified === 'true';

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const sortOrder = order === 'desc' ? -1 : 1;

    const [images, total] = await Promise.all([
      TrainingImage.find(query)
        .sort({ [sortBy]: sortOrder })
        .skip(skip)
        .limit(parseInt(limit))
        .populate('uploadedBy', 'username email')
        .populate('verifiedBy', 'username email'),
      TrainingImage.countDocuments(query)
    ]);

    res.json({
      images,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages: Math.ceil(total / parseInt(limit))
      }
    });

  } catch (error) {
    console.error('Error listando imágenes de entrenamiento:', error);
    res.status(500).json({
      error: 'Error listando imágenes de entrenamiento',
      details: error.message
    });
  }
});

// ==================== OBTENER UNA IMAGEN ====================
// GET /api/training/:id - Obtener imagen específica
router.get('/:id', auth, async (req, res) => {
  try {
    const image = await TrainingImage.findById(req.params.id)
      .populate('uploadedBy', 'username email')
      .populate('verifiedBy', 'username email');

    if (!image) {
      return res.status(404).json({ error: 'Imagen de entrenamiento no encontrada' });
    }

    res.json(image);

  } catch (error) {
    console.error('Error obteniendo imagen de entrenamiento:', error);
    res.status(500).json({
      error: 'Error obteniendo imagen de entrenamiento',
      details: error.message
    });
  }
});

// ==================== ACTUALIZAR IMAGEN ====================
// PUT /api/training/:id - Actualizar imagen de entrenamiento (ADMIN)
router.put('/:id', auth, isAdmin, async (req, res) => {
  try {
    const {
      category,
      type,
      description,
      visualFeatures,
      technicalData,
      commonSightings,
      tags,
      notes,
      externalRefs,
      isActive,
      verified
    } = req.body;

    const image = await TrainingImage.findById(req.params.id);

    if (!image) {
      return res.status(404).json({ error: 'Imagen de entrenamiento no encontrada' });
    }

    // Actualizar campos
    if (category) image.category = category;
    if (type) image.type = type;
    if (description) image.description = description;
    if (visualFeatures) image.visualFeatures = visualFeatures;
    if (technicalData) image.technicalData = technicalData;
    if (commonSightings) image.commonSightings = commonSightings;
    if (tags) image.tags = tags;
    if (notes !== undefined) image.notes = notes;
    if (externalRefs) image.externalRefs = externalRefs;
    if (isActive !== undefined) image.isActive = isActive;
    if (verified !== undefined) {
      image.verified = verified;
      if (verified) {
        image.verifiedBy = req.user._id;
        image.verifiedAt = new Date();
      }
    }

    await image.save();

    // Log de auditoría
    await AuditMiddleware.logAdminAction(
      req.user._id,
      'training_update',
      'TrainingImage',
      image._id,
      { category: image.category, type: image.type },
      req
    );

    res.json({
      message: 'Imagen de entrenamiento actualizada exitosamente',
      trainingImage: image
    });

  } catch (error) {
    console.error('Error actualizando imagen de entrenamiento:', error);
    res.status(500).json({
      error: 'Error actualizando imagen de entrenamiento',
      details: error.message
    });
  }
});

// ==================== ELIMINAR IMAGEN ====================
// DELETE /api/training/:id - Eliminar imagen de entrenamiento (ADMIN)
router.delete('/:id', auth, isAdmin, async (req, res) => {
  try {
    const image = await TrainingImage.findById(req.params.id);

    if (!image) {
      return res.status(404).json({ error: 'Imagen de entrenamiento no encontrada' });
    }

    // Eliminar archivos físicos
    const imagePath = path.join(__dirname, '../uploads/training', image.imageUrl);
    const thumbnailPath = path.join(__dirname, '../uploads/training', image.thumbnailUrl);

    try {
      await fs.unlink(imagePath);
      if (image.thumbnailUrl) {
        await fs.unlink(thumbnailPath);
      }
    } catch (error) {
      console.error('Error eliminando archivos:', error);
    }

    await TrainingImage.findByIdAndDelete(req.params.id);

    // Log de auditoría
    await AuditMiddleware.logAdminAction(
      req.user._id,
      'training_delete',
      'TrainingImage',
      req.params.id,
      { category: image.category },
      req
    );

    res.json({ message: 'Imagen de entrenamiento eliminada exitosamente' });

  } catch (error) {
    console.error('Error eliminando imagen de entrenamiento:', error);
    res.status(500).json({
      error: 'Error eliminando imagen de entrenamiento',
      details: error.message
    });
  }
});

// ==================== CREAR DESDE ANÁLISIS ====================
// POST /api/training/from-analysis/:analysisId - Convertir análisis en imagen de entrenamiento (ADMIN)
router.post('/from-analysis/:analysisId', auth, isAdmin, async (req, res) => {
  try {
    const Analysis = require('../models/Analysis');
    const analysisId = req.params.analysisId;
    const { verifiedCategory, verifiedType, model, additionalNotes } = req.body;

    // Obtener el análisis
    const analysis = await Analysis.findById(analysisId);
    
    if (!analysis) {
      return res.status(404).json({ error: 'Análisis no encontrado' });
    }

    if (!analysis.filePath || analysis.fileType !== 'image') {
      return res.status(400).json({ error: 'Solo se pueden convertir análisis de imágenes' });
    }

    // Verificar que el análisis esté completado
    if (analysis.status !== 'completed') {
      return res.status(400).json({ error: 'Solo se pueden convertir análisis completados' });
    }

    // Determinar la categoría (usar la verificada por admin o la del análisis)
    const category = verifiedCategory || analysis.aiAnalysis?.category || 'unknown';
    const type = verifiedType || analysis.aiAnalysis?.objectDetails?.type || category;

    // Construir características visuales desde el análisis visual
    const visualFeatures = {};
    if (analysis.visualAnalysis) {
      visualFeatures.shape = analysis.visualAnalysis.shapeAnalysis?.shapeType;
      visualFeatures.lightPattern = analysis.visualAnalysis.lightPatterns?.pattern;
      
      if (analysis.visualAnalysis.colorProfile?.dominant) {
        visualFeatures.colors = [analysis.visualAnalysis.colorProfile.colorType];
      }
    }

    // Construir datos técnicos desde EXIF y análisis forense
    const technicalData = {};
    if (analysis.exifData) {
      if (analysis.exifData.gps) {
        technicalData.captureLocation = `${analysis.exifData.gps.latitude}, ${analysis.exifData.gps.longitude}`;
      }
      if (analysis.exifData.camera) {
        technicalData.capturedWith = `${analysis.exifData.camera.make} ${analysis.exifData.camera.model}`;
      }
    }

    // Datos de análisis forense
    const forensicData = {};
    if (analysis.forensicAnalysis) {
      forensicData.authenticityScore = 100 - (analysis.forensicAnalysis.manipulationScore || 0);
      forensicData.verdict = analysis.forensicAnalysis.verdict;
      forensicData.lightingConsistency = analysis.forensicAnalysis.lightingAnalysis?.inconsistencyScore;
      forensicData.noiseConsistency = analysis.forensicAnalysis.noiseAnalysis?.inconsistencyScore;
      forensicData.cloneDetection = analysis.forensicAnalysis.cloneDetection?.cloneScore;
      forensicData.edgeConsistency = analysis.forensicAnalysis.edgeConsistency?.inconsistencyScore;
    }

    // Construir descripción automática
    let description = `Imagen verificada del análisis #${analysisId}.\n`;
    description += `Clasificación IA: ${analysis.aiAnalysis?.category || 'N/A'} (${analysis.aiAnalysis?.confidence || 0}% confianza).\n`;
    
    if (analysis.visualAnalysis) {
      description += `Análisis visual: ${analysis.visualAnalysis.objectType?.category} (${analysis.visualAnalysis.objectType?.confidence || 0}% confianza).\n`;
    }
    
    if (analysis.forensicAnalysis) {
      description += `Análisis forense: ${forensicData.authenticityScore}% auténtica, veredicto: ${forensicData.verdict}.\n`;
    }

    if (additionalNotes) {
      description += `\nNotas del administrador: ${additionalNotes}`;
    }

    // Copiar imagen a carpeta de training
    const fs = require('fs').promises;
    const originalPath = analysis.filePath;
    const trainingDir = path.join(__dirname, '../uploads/training');
    await fs.mkdir(trainingDir, { recursive: true });

    const timestamp = Date.now();
    const ext = path.extname(originalPath);
    const newFilename = `training-${timestamp}-from-analysis${ext}`;
    const newPath = path.join(trainingDir, newFilename);
    
    // Copiar archivo
    await fs.copyFile(originalPath, newPath);

    // Generar thumbnail
    const thumbnailFilename = `thumb-${newFilename}`;
    const thumbnailPath = path.join(trainingDir, thumbnailFilename);
    
    try {
      await sharp(newPath)
        .resize(300, 300, {
          fit: 'cover',
          position: 'center'
        })
        .jpeg({ quality: 80 })
        .toFile(thumbnailPath);
    } catch (error) {
      console.error('Error generando thumbnail:', error);
    }

    // Crear tags automáticos
    const tags = [category, type];
    if (analysis.aiAnalysis?.category) tags.push(analysis.aiAnalysis.category);
    if (analysis.visualAnalysis?.objectType?.category) tags.push(analysis.visualAnalysis.objectType.category);
    if (analysis.exifData?.camera?.make) tags.push(analysis.exifData.camera.make.toLowerCase());
    
    // Eliminar duplicados
    const uniqueTags = [...new Set(tags)].filter(t => t && t !== 'unknown');

    // Crear imagen de entrenamiento
    const trainingImage = new TrainingImage({
      category: category,
      type: type,
      model: model || analysis.aiAnalysis?.objectDetails?.model,
      description: description,
      imageUrl: newFilename,
      thumbnailUrl: thumbnailFilename,
      visualFeatures: visualFeatures,
      technicalData: technicalData,
      tags: uniqueTags,
      uploadedBy: req.userId,
      source: 'user_contribution',
      verified: true, // Automáticamente verificada por admin
      verifiedBy: req.userId,
      verifiedAt: new Date(),
      notes: `Generado automáticamente desde análisis ${analysisId}.\nDatos forenses: ${JSON.stringify(forensicData, null, 2)}`,
      externalRefs: [
        {
          name: 'Análisis Original',
          url: `/analysis/${analysisId}`,
          type: 'internal'
        }
      ]
    });

    await trainingImage.save();

    // Actualizar el análisis para indicar que fue usado como training
    analysis.usedForTraining = true;
    analysis.trainingImageId = trainingImage._id;
    await analysis.save();

    res.status(201).json({
      message: 'Imagen de entrenamiento creada exitosamente desde análisis',
      trainingImage: {
        id: trainingImage._id,
        category: trainingImage.category,
        type: trainingImage.type,
        imageUrl: trainingImage.imageUrl,
        thumbnailUrl: trainingImage.thumbnailUrl,
        tags: trainingImage.tags,
        forensicData: forensicData
      },
      analysisId: analysisId
    });

  } catch (error) {
    console.error('Error creando imagen de entrenamiento desde análisis:', error);
    res.status(500).json({
      error: 'Error creando imagen de entrenamiento',
      details: error.message
    });
  }
});

// ==================== ESTADÍSTICAS ====================
// GET /api/training/stats/categories - Obtener estadísticas por categoría
router.get('/stats/categories', auth, async (req, res) => {
  try {
    const stats = await TrainingImage.getCategoryStats();
    
    res.json({
      stats,
      total: stats.reduce((sum, cat) => sum + cat.count, 0)
    });

  } catch (error) {
    console.error('Error obteniendo estadísticas:', error);
    res.status(500).json({
      error: 'Error obteniendo estadísticas',
      details: error.message
    });
  }
});

// ==================== BÚSQUEDA SIMILAR ====================
// POST /api/training/search/similar - Buscar imágenes similares
router.post('/search/similar', auth, async (req, res) => {
  try {
    const { category, tags } = req.body;

    if (!category) {
      return res.status(400).json({ error: 'Se requiere categoría' });
    }

    const similarImages = await TrainingImage.findSimilar(category, tags || []);

    res.json({
      count: similarImages.length,
      images: similarImages
    });

  } catch (error) {
    console.error('Error buscando imágenes similares:', error);
    res.status(500).json({
      error: 'Error buscando imágenes similares',
      details: error.message
    });
  }
});

// ============================================
// PROMOVER A BIBLIOTECA VISUAL
// ============================================

// POST /api/training/:id/promote-to-library - Promover imagen de entrenamiento a biblioteca visual (ADMIN)
router.post('/:id/promote-to-library', auth, isAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const UFODatabase = require('../models/UFODatabase');

    // Buscar imagen de entrenamiento
    const trainingImage = await TrainingImage.findById(id);
    
    if (!trainingImage) {
      return res.status(404).json({ error: 'Imagen de entrenamiento no encontrada' });
    }

    // Verificar si ya fue promovida
    if (trainingImage.promotedToLibrary) {
      return res.status(400).json({ 
        error: 'Esta imagen ya fue promovida a la biblioteca visual',
        libraryId: trainingImage.libraryEntryId
      });
    }

    // Mapear categoría de TrainingImage a UFODatabase
    const categoryMap = {
      'aircraft_commercial': 'aircraft',
      'aircraft_military': 'aircraft',
      'aircraft_private': 'aircraft',
      'helicopter': 'aircraft',
      'drone': 'drone',
      'balloon': 'balloon',
      'rocket': 'satellite',
      'satellite': 'satellite',
      'debris': 'satellite',
      'celestial': 'celestial',
      'natural': 'natural',
      'weather': 'natural',
      'atmospheric': 'natural',
      'bird': 'bird',
      'lens_flare': 'hoax',
      'reflection_glass': 'hoax',
      'reflection_vehicle': 'hoax',
      'artificial_light': 'hoax',
      'light_trail': 'hoax',
      'camera_artifact': 'hoax',
      'kite': 'unknown',
      'insect': 'bird',
      'unknown': 'unknown',
      'other': 'unknown'
    };

    const libraryCategory = categoryMap[trainingImage.category] || 'unknown';

    // Crear nombre descriptivo
    const name = trainingImage.model 
      ? `${trainingImage.type} (${trainingImage.model})`
      : trainingImage.type;

    // Mapear características
    const characteristics = {
      shape: trainingImage.visualFeatures?.shape || 'other',
      color: trainingImage.visualFeatures?.colors || [],
      size: trainingImage.visualFeatures?.size || 'desconocido',
      behavior: trainingImage.visualFeatures?.movementPattern || 'desconocido',
      speed: trainingImage.visualFeatures?.commonSpeed || 'desconocido',
      luminosity: trainingImage.visualFeatures?.lightPattern || 'desconocido'
    };

    // Crear patrones visuales para matching
    const visualPatterns = [
      trainingImage.category,
      trainingImage.type,
      ...(trainingImage.tags || []),
      ...(trainingImage.visualFeatures?.colors || [])
    ].filter(Boolean);

    // Crear entrada en UFODatabase
    const libraryEntry = new UFODatabase({
      name,
      category: libraryCategory,
      description: trainingImage.description || `${name} - Entrada promovida desde datos de entrenamiento`,
      characteristics,
      visualPatterns,
      images: [{
        url: trainingImage.imageUrl,
        description: trainingImage.description || name,
        isReference: true
      }],
      scientificName: trainingImage.technicalData?.manufacturer 
        ? `${trainingImage.technicalData.manufacturer} ${trainingImage.technicalData.model || trainingImage.type}`
        : undefined,
      altitude: trainingImage.visualFeatures?.commonAltitude,
      typicalLocations: trainingImage.commonSightings?.locations || [],
      timeOfDay: trainingImage.commonSightings?.timeOfDay || [],
      isVerified: trainingImage.verified || false,
      verificationSource: trainingImage.source || 'Training Data',
      externalLinks: trainingImage.externalRefs || []
    });

    await libraryEntry.save();

    // Actualizar TrainingImage con referencia
    trainingImage.promotedToLibrary = true;
    trainingImage.libraryEntryId = libraryEntry._id;
    await trainingImage.save();

    console.log(`✅ Imagen de entrenamiento ${id} promovida a biblioteca visual: ${libraryEntry._id}`);

    res.json({
      success: true,
      message: 'Imagen promovida exitosamente a la biblioteca visual',
      trainingImageId: trainingImage._id,
      libraryEntry: {
        id: libraryEntry._id,
        name: libraryEntry.name,
        category: libraryEntry.category,
        description: libraryEntry.description
      }
    });

  } catch (error) {
    console.error('❌ Error promoviendo a biblioteca:', error);
    res.status(500).json({
      error: 'Error al promover imagen a biblioteca visual',
      details: error.message
    });
  }
});

module.exports = router;
