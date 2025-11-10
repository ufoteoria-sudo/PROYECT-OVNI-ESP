const express = require('express');
const router = express.Router();
const UFODatabase = require('../models/UFODatabase');
const AtmosphericPhenomenon = require('../models/AtmosphericPhenomenon');
const TrainingImage = require('../models/TrainingImage');
const auth = require('../middleware/auth');
const isAdmin = require('../middleware/isAdmin');
const multer = require('multer');
const sharp = require('sharp');
const path = require('path');
const fs = require('fs').promises;

/**
 * Ruta: /api/library
 * Endpoints para la biblioteca visual de fenómenos y objetos
 */

// ============================================
// FENÓMENOS ATMOSFÉRICOS
// ============================================

/**
 * GET /api/library/phenomena
 * Listar fenómenos atmosféricos con paginación y filtros
 */
router.get('/phenomena', async (req, res) => {
  try {
    const {
      page = 1,
      limit = 12,
      category,
      search,
      rarity,
      sortBy = 'name'
    } = req.query;

    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    // Construir filtro
    const filter = { isActive: true };
    
    if (category) {
      filter.category = category;
    }
    
    if (rarity) {
      filter.rarity = rarity;
    }
    
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { keywords: { $in: [new RegExp(search, 'i')] } }
      ];
    }

    // Ordenamiento
    let sort = {};
    switch (sortBy) {
      case 'name':
        sort = { name: 1 };
        break;
      case 'rarity':
        sort = { 'occurrenceConditions.frequency': -1 };
        break;
      case 'category':
        sort = { category: 1, name: 1 };
        break;
      default:
        sort = { name: 1 };
    }

    // Ejecutar query
    const phenomena = await AtmosphericPhenomenon
      .find(filter)
      .sort(sort)
      .skip(skip)
      .limit(parseInt(limit))
      .select('-scientificExplanation -photographyTips -__v');

    const total = await AtmosphericPhenomenon.countDocuments(filter);

    res.json({
      success: true,
      data: phenomena,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });

  } catch (error) {
    console.error('Error listando fenómenos:', error);
    res.status(500).json({
      success: false,
      error: 'Error al obtener fenómenos atmosféricos'
    });
  }
});

/**
 * GET /api/library/phenomena/:id
 * Obtener detalle de un fenómeno específico
 */
router.get('/phenomena/:id', async (req, res) => {
  try {
    const phenomenon = await AtmosphericPhenomenon.findById(req.params.id);
    
    if (!phenomenon) {
      return res.status(404).json({
        success: false,
        error: 'Fenómeno no encontrado'
      });
    }

    res.json({
      success: true,
      data: phenomenon
    });

  } catch (error) {
    console.error('Error obteniendo fenómeno:', error);
    res.status(500).json({
      success: false,
      error: 'Error al obtener detalles del fenómeno'
    });
  }
});

/**
 * GET /api/library/phenomena/categories
 * Obtener lista de categorías disponibles
 */
router.get('/phenomena/stats/categories', async (req, res) => {
  try {
    const categories = await AtmosphericPhenomenon.aggregate([
      { $match: { isActive: true } },
      {
        $group: {
          _id: '$category',
          count: { $sum: 1 }
        }
      },
      { $sort: { count: -1 } }
    ]);

    const categoryMap = {
      'optical': 'Fenómenos Ópticos',
      'meteorological': 'Meteorológicos',
      'astronomical': 'Astronómicos',
      'electrical': 'Eléctricos',
      'cloud': 'Formaciones Nubosas'
    };

    const result = categories.map(cat => ({
      value: cat._id,
      label: categoryMap[cat._id] || cat._id,
      count: cat.count
    }));

    res.json({
      success: true,
      data: result
    });

  } catch (error) {
    console.error('Error obteniendo categorías:', error);
    res.status(500).json({
      success: false,
      error: 'Error al obtener categorías'
    });
  }
});

// ============================================
// OBJETOS CIENTÍFICOS
// ============================================

/**
 * GET /api/library/objects
 * Listar objetos científicos con paginación y filtros
 */
router.get('/objects', async (req, res) => {
  try {
    const {
      page = 1,
      limit = 12,
      category,
      search,
      verified,
      isManualEntry,
      sortBy = 'name'
    } = req.query;

    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    // Construir filtro
    const filter = { isActive: true };
    
    if (category) {
      filter.category = category;
    }
    
    if (verified === 'true') {
      filter.isVerified = true;
    }

    if (isManualEntry !== undefined && isManualEntry !== '') {
      filter.isManualEntry = isManualEntry === 'true';
    }
    
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { visualPatterns: { $in: [new RegExp(search, 'i')] } }
      ];
    }

    // Ordenamiento
    let sort = {};
    switch (sortBy) {
      case 'name':
        sort = { name: 1 };
        break;
      case 'frequency':
        sort = { frequency: -1 };
        break;
      case 'category':
        sort = { category: 1, name: 1 };
        break;
      case 'recent':
        sort = { createdAt: -1 };
        break;
      default:
        sort = { name: 1 };
    }

    // Ejecutar query
    const objects = await UFODatabase
      .find(filter)
      .sort(sort)
      .skip(skip)
      .limit(parseInt(limit))
      .select('-scientificFeatures -__v');

    const total = await UFODatabase.countDocuments(filter);
    const totalPages = Math.ceil(total / parseInt(limit));

    res.json({
      success: true,
      data: objects,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages: totalPages,
        pages: totalPages
      }
    });

  } catch (error) {
    console.error('Error listando objetos:', error);
    res.status(500).json({
      success: false,
      error: 'Error al obtener objetos científicos'
    });
  }
});

/**
 * GET /api/library/objects/:id
 * Obtener detalle de un objeto específico
 */
router.get('/objects/:id', async (req, res) => {
  try {
    const object = await UFODatabase.findById(req.params.id);
    
    if (!object) {
      return res.status(404).json({
        success: false,
        error: 'Objeto no encontrado'
      });
    }

    res.json({
      success: true,
      data: object
    });

  } catch (error) {
    console.error('Error obteniendo objeto:', error);
    res.status(500).json({
      success: false,
      error: 'Error al obtener detalles del objeto'
    });
  }
});

/**
 * GET /api/library/objects/stats/categories
 * Obtener estadísticas de categorías de objetos
 */
router.get('/objects/stats/categories', async (req, res) => {
  try {
    const categories = await UFODatabase.aggregate([
      { $match: { isActive: true } },
      {
        $group: {
          _id: '$category',
          count: { $sum: 1 }
        }
      },
      { $sort: { count: -1 } }
    ]);

    const categoryMap = {
      'aircraft': '✈️ Aeronaves',
      'bird': '🦅 Aves',
      'drone': '🚁 Drones',
      'celestial': '🌟 Objetos Celestes',
      'balloon': '🎈 Globos',
      'satellite': '🛰️ Satélites',
      'natural': '🌿 Fenómenos Naturales',
      'debris': '🗑️ Basura Espacial',
      'uap': '🛸 UAP Reportados'
    };

    const result = categories.map(cat => ({
      value: cat._id,
      label: categoryMap[cat._id] || cat._id,
      count: cat.count,
      icon: categoryMap[cat._id]?.split(' ')[0] || '📦'
    }));

    res.json({
      success: true,
      data: result
    });

  } catch (error) {
    console.error('Error obteniendo categorías:', error);
    res.status(500).json({
      success: false,
      error: 'Error al obtener estadísticas'
    });
  }
});

/**
 * GET /api/library/stats
 * Estadísticas generales de la biblioteca
 */
router.get('/stats', async (req, res) => {
  try {
    const [
      totalPhenomena,
      totalObjects,
      phenomenaByCategory,
      objectsByCategory
    ] = await Promise.all([
      AtmosphericPhenomenon.countDocuments({ isActive: true }),
      UFODatabase.countDocuments({ isActive: true }),
      AtmosphericPhenomenon.aggregate([
        { $match: { isActive: true } },
        { $group: { _id: '$category', count: { $sum: 1 } } }
      ]),
      UFODatabase.aggregate([
        { $match: { isActive: true } },
        { $group: { _id: '$category', count: { $sum: 1 } } }
      ])
    ]);

    res.json({
      success: true,
      data: {
        phenomena: {
          total: totalPhenomena,
          byCategory: phenomenaByCategory
        },
        objects: {
          total: totalObjects,
          byCategory: objectsByCategory
        }
      }
    });

  } catch (error) {
    console.error('Error obteniendo estadísticas:', error);
    res.status(500).json({
      success: false,
      error: 'Error al obtener estadísticas'
    });
  }
});

// ============================================
// GESTIÓN MANUAL DE OBJETOS (ADMIN)
// ============================================

// Configuración de multer para subir imágenes de biblioteca
const storage = multer.diskStorage({
  destination: async function(req, file, cb) {
    const uploadPath = path.join(__dirname, '../uploads/library');
    await fs.mkdir(uploadPath, { recursive: true });
    cb(null, uploadPath);
  },
  filename: function(req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'library-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: function(req, file, cb) {
    const allowedTypes = /jpeg|jpg|png|webp/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    
    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Solo se permiten imágenes (JPG, PNG, WEBP)'));
    }
  }
});

/**
 * POST /api/library/manual
 * Crear objeto manual en biblioteca con imágenes
 */
router.post('/manual', auth, isAdmin, upload.array('images', 5), async (req, res) => {
  try {
    const {
      name,
      category,
      typology,
      description,
      characteristics,
      visualPatterns,
      keywords
    } = req.body;

    // Validar campos requeridos
    if (!name || !category || !description) {
      // Eliminar archivos subidos si hay error
      if (req.files) {
        for (const file of req.files) {
          await fs.unlink(file.path).catch(console.error);
        }
      }
      return res.status(400).json({
        error: 'Faltan campos requeridos: name, category, description'
      });
    }

    // Procesar imágenes subidas
    const manualImages = [];
    if (req.files && req.files.length > 0) {
      for (const file of req.files) {
        const filename = file.filename;
        const thumbnailFilename = 'thumb-' + filename;
        const thumbnailPath = path.join(path.dirname(file.path), thumbnailFilename);

        // Generar thumbnail
        try {
          await sharp(file.path)
            .resize(300, 300, { fit: 'cover', position: 'center' })
            .jpeg({ quality: 80 })
            .toFile(thumbnailPath);
        } catch (error) {
          console.error('Error generando thumbnail:', error);
        }

        manualImages.push({
          filename: filename,
          url: `/uploads/library/${filename}`,
          thumbnailUrl: `/uploads/library/${thumbnailFilename}`,
          description: file.originalname,
          uploadedAt: new Date()
        });
      }
    }

    // Parsear campos JSON si vienen como strings
    const parsedCharacteristics = typeof characteristics === 'string'
      ? JSON.parse(characteristics)
      : characteristics;

    const parsedVisualPatterns = typeof visualPatterns === 'string'
      ? JSON.parse(visualPatterns)
      : (Array.isArray(visualPatterns) ? visualPatterns : []);

    const parsedKeywords = typeof keywords === 'string'
      ? JSON.parse(keywords)
      : (Array.isArray(keywords) ? keywords : []);

    // Crear objeto en biblioteca
    const libraryObject = new UFODatabase({
      name,
      category,
      typology,
      description,
      characteristics: parsedCharacteristics,
      visualPatterns: parsedVisualPatterns,
      isManualEntry: true,
      uploadedBy: req.user._id,
      addedBy: req.user._id,
      manualImages: manualImages,
      isVerified: true,
      isActive: true
    });

    await libraryObject.save();

    // SINCRONIZACIÓN AUTOMÁTICA: Crear entrada en training
    if (manualImages.length > 0) {
      try {
        // Mapear categoría de biblioteca a categoría de training
        const categoryMap = {
          'aircraft': 'aircraft_commercial',
          'drone': 'drone',
          'satellite': 'satellite',
          'balloon': 'balloon',
          'celestial': 'celestial',
          'natural': 'natural',
          'bird': 'bird',
          'hoax': 'hoax'
        };

        const trainingCategory = categoryMap[category] || 'other';
        
        // Extraer keywords de descripción y características
        const descriptionWords = description.toLowerCase().split(/\s+/)
          .filter(word => word.length > 3)
          .slice(0, 10);
        
        const allKeywords = [
          ...parsedKeywords,
          ...parsedVisualPatterns,
          ...descriptionWords
        ].slice(0, 20); // Máximo 20

        // Construir visualFeatures desde characteristics
        const visualFeatures = {};
        if (parsedCharacteristics) {
          if (parsedCharacteristics.shape) visualFeatures.shape = parsedCharacteristics.shape;
          if (parsedCharacteristics.size) visualFeatures.size = parsedCharacteristics.size;
          if (parsedCharacteristics.speed) visualFeatures.commonSpeed = parsedCharacteristics.speed;
          if (parsedCharacteristics.luminosity) visualFeatures.lightPattern = parsedCharacteristics.luminosity;
          if (parsedCharacteristics.colors) {
            visualFeatures.colors = parsedCharacteristics.colors
              .split(',')
              .map(c => c.trim())
              .filter(c => c.length > 0);
          }
          if (parsedCharacteristics.behavior) visualFeatures.movementPattern = parsedCharacteristics.behavior;
        }

        // SINCRONIZACIÓN COMPLETA con training
        const trainingImage = new TrainingImage({
          category: trainingCategory,
          type: name,
          model: typology || '',
          description: description,
          keywords: allKeywords,
          tags: parsedVisualPatterns,
          visualFeatures: Object.keys(visualFeatures).length > 0 ? visualFeatures : undefined,
          imageUrl: manualImages[0].url,           // URL completa: /uploads/library/filename
          thumbnailUrl: manualImages[0].thumbnailUrl, // URL completa: /uploads/library/thumb-filename
          uploadedBy: req.user._id,
          verified: true,
          verifiedBy: req.user._id,
          verifiedAt: new Date(),
          source: 'manual_upload',
          promotedToLibrary: false,
          libraryEntryId: libraryObject._id
        });

        await trainingImage.save();
        
        // Vincular biblioteca con training bidireccionalmente
        libraryObject.linkedTrainingId = trainingImage._id;
        await libraryObject.save();

        console.log(`✅ Objeto sincronizado completamente con training: ${trainingImage._id}`);
        console.log(`   - Nombre: ${name}`);
        console.log(`   - Categoría: ${trainingCategory}`);
        console.log(`   - Keywords: ${allKeywords.length}`);
        console.log(`   - Visual patterns: ${parsedVisualPatterns.length}`);
        console.log(`   - Visual features: ${Object.keys(visualFeatures).length} campos`);
      } catch (syncError) {
        console.error('❌ Error sincronizando con training:', syncError);
        // No fallar toda la operación si falla la sincronización
      }
    }

    res.status(201).json({
      success: true,
      message: 'Objeto creado exitosamente en biblioteca',
      data: libraryObject
    });

  } catch (error) {
    console.error('Error creando objeto en biblioteca:', error);
    
    // Eliminar archivos si hay error
    if (req.files) {
      for (const file of req.files) {
        await fs.unlink(file.path).catch(console.error);
      }
    }
    
    res.status(500).json({
      error: 'Error al crear objeto en biblioteca'
    });
  }
});

/**
 * PUT /api/library/edit/:id
 * Editar CUALQUIER objeto en biblioteca (manual o existente) y agregar imágenes
 */
router.put('/edit/:id', auth, isAdmin, upload.array('newImages', 5), async (req, res) => {
  try {
    const { id } = req.params;
    const {
      name,
      category,
      typology,
      description,
      characteristics,
      visualPatterns,
      keywords
    } = req.body;

    const object = await UFODatabase.findById(id);
    
    if (!object) {
      // Eliminar archivos subidos si hay error
      if (req.files) {
        for (const file of req.files) {
          await fs.unlink(file.path).catch(console.error);
        }
      }
      return res.status(404).json({ error: 'Objeto no encontrado' });
    }

    // Construir registro de cambios
    const changes = [];
    if (name && name !== object.name) changes.push(`nombre: ${object.name} → ${name}`);
    if (category && category !== object.category) changes.push(`categoría: ${object.category} → ${category}`);
    if (typology && typology !== object.typology) changes.push(`tipología actualizada`);
    if (description && description !== object.description) changes.push('descripción actualizada');

    // Procesar nuevas imágenes si se subieron
    if (req.files && req.files.length > 0) {
      changes.push(`${req.files.length} imagen(es) agregada(s)`);
      
      // Inicializar manualImages si no existe
      if (!object.manualImages) {
        object.manualImages = [];
      }

      for (const file of req.files) {
        const filename = file.filename;
        const thumbnailFilename = 'thumb-' + filename;
        const thumbnailPath = path.join(path.dirname(file.path), thumbnailFilename);

        // Generar thumbnail
        try {
          await sharp(file.path)
            .resize(300, 300, { fit: 'cover', position: 'center' })
            .jpeg({ quality: 80 })
            .toFile(thumbnailPath);
        } catch (error) {
          console.error('Error generando thumbnail:', error);
        }

        object.manualImages.push({
          filename: filename,
          url: `/uploads/library/${filename}`,
          thumbnailUrl: `/uploads/library/${thumbnailFilename}`,
          description: file.originalname,
          uploadedAt: new Date()
        });
      }
    }

    // Actualizar campos
    if (name) object.name = name;
    if (category) object.category = category;
    if (typology) object.typology = typology;
    if (description) object.description = description;
    
    if (characteristics) {
      object.characteristics = typeof characteristics === 'string'
        ? JSON.parse(characteristics)
        : characteristics;
    }
    
    if (visualPatterns) {
      object.visualPatterns = typeof visualPatterns === 'string'
        ? JSON.parse(visualPatterns)
        : visualPatterns;
    }

    // Marcar como entrada manual si se están agregando datos
    if (!object.isManualEntry && (name || typology || req.files?.length > 0)) {
      object.isManualEntry = true;
      object.uploadedBy = req.user._id;
      changes.push('marcado como entrada manual');
    }

    // Agregar registro de edición
    if (!object.editHistory) {
      object.editHistory = [];
    }
    
    object.editHistory.push({
      editedBy: req.user._id,
      editedAt: new Date(),
      changes: changes.join(', ')
    });

    await object.save();

    // SINCRONIZACIÓN COMPLETA: Crear o actualizar training vinculado
    const parsedKeywords = typeof keywords === 'string'
      ? JSON.parse(keywords)
      : (Array.isArray(keywords) ? keywords : []);

    const parsedVisualPatterns = typeof visualPatterns === 'string'
      ? JSON.parse(visualPatterns)
      : (Array.isArray(visualPatterns) ? visualPatterns : []);

    const parsedCharacteristics = typeof characteristics === 'string'
      ? JSON.parse(characteristics)
      : (typeof characteristics === 'object' ? characteristics : {});

    // Sincronizar si hay imágenes O si ya existe un training vinculado
    if ((object.manualImages && object.manualImages.length > 0) || object.linkedTrainingId) {
      try {
        let trainingImage = null;
        
        // Buscar training vinculado existente
        if (object.linkedTrainingId) {
          trainingImage = await TrainingImage.findById(object.linkedTrainingId);
        }

        // Mapear categoría de biblioteca a categoría de training
        const categoryMap = {
          'Atmospheric': 'atmospheric',
          'Celestial': 'celestial',
          'Aerial': 'aircraft_commercial',
          'Technological': 'satellite',
          'Unknown': 'unknown'
        };
        const trainingCategory = categoryMap[category || object.category] || 'other';

        if (trainingImage) {
          // ✅ ACTUALIZAR TRAINING EXISTENTE CON TODOS LOS CAMPOS
          if (name) trainingImage.type = name;
          if (typology) trainingImage.model = typology;
          if (description) trainingImage.description = description;
          trainingImage.keywords = parsedKeywords;
          trainingImage.category = trainingCategory;
          trainingImage.tags = parsedVisualPatterns;

          // Sincronizar visualFeatures desde characteristics
          if (parsedCharacteristics && Object.keys(parsedCharacteristics).length > 0) {
            if (!trainingImage.visualFeatures) {
              trainingImage.visualFeatures = {};
            }
            if (parsedCharacteristics.shape) trainingImage.visualFeatures.shape = parsedCharacteristics.shape;
            if (parsedCharacteristics.size) trainingImage.visualFeatures.size = parsedCharacteristics.size;
            if (parsedCharacteristics.speed) trainingImage.visualFeatures.commonSpeed = parsedCharacteristics.speed;
            if (parsedCharacteristics.luminosity) trainingImage.visualFeatures.lightPattern = parsedCharacteristics.luminosity;
            if (parsedCharacteristics.colors) {
              trainingImage.visualFeatures.colors = parsedCharacteristics.colors
                .split(',')
                .map(c => c.trim())
                .filter(c => c.length > 0);
            }
            if (parsedCharacteristics.behavior) trainingImage.visualFeatures.movementPattern = parsedCharacteristics.behavior;
          }

          // Actualizar imagen principal si cambió
          if (object.manualImages && object.manualImages.length > 0) {
            trainingImage.imageUrl = object.manualImages[0].url;
            trainingImage.thumbnailUrl = object.manualImages[0].thumbnailUrl;
          }

          await trainingImage.save();
          console.log(`✅ Training actualizado completamente: ${trainingImage._id}`);
          
        } else if (object.manualImages && object.manualImages.length > 0) {
          // ✅ CREAR NUEVO TRAINING CON TODOS LOS CAMPOS
          const visualFeatures = {};
          if (parsedCharacteristics) {
            if (parsedCharacteristics.shape) visualFeatures.shape = parsedCharacteristics.shape;
            if (parsedCharacteristics.size) visualFeatures.size = parsedCharacteristics.size;
            if (parsedCharacteristics.speed) visualFeatures.commonSpeed = parsedCharacteristics.speed;
            if (parsedCharacteristics.luminosity) visualFeatures.lightPattern = parsedCharacteristics.luminosity;
            if (parsedCharacteristics.colors) {
              visualFeatures.colors = parsedCharacteristics.colors
                .split(',')
                .map(c => c.trim())
                .filter(c => c.length > 0);
            }
            if (parsedCharacteristics.behavior) visualFeatures.movementPattern = parsedCharacteristics.behavior;
          }

          trainingImage = new TrainingImage({
            category: trainingCategory,
            type: name || object.name,
            model: typology || '',
            description: description || object.description,
            keywords: parsedKeywords,
            tags: parsedVisualPatterns,
            visualFeatures: Object.keys(visualFeatures).length > 0 ? visualFeatures : undefined,
            imageUrl: object.manualImages[0].url,
            thumbnailUrl: object.manualImages[0].thumbnailUrl,
            uploadedBy: req.user._id,
            verified: true,
            verifiedBy: req.user._id,
            verifiedAt: new Date(),
            source: 'manual_upload',
            promotedToLibrary: false,
            libraryEntryId: object._id
          });
          await trainingImage.save();
          
          // Vincular bidireccionalmente
          object.linkedTrainingId = trainingImage._id;
          await object.save();
          
          console.log(`✅ Training creado y vinculado con todos los campos: ${trainingImage._id}`);
        }
      } catch (syncError) {
        console.error('❌ Error sincronizando con training:', syncError);
      }
    }

    res.json({
      success: true,
      message: 'Objeto actualizado exitosamente',
      data: object
    });

  } catch (error) {
    console.error('Error actualizando objeto:', error);
    
    // Eliminar archivos si hay error
    if (req.files) {
      for (const file of req.files) {
        await fs.unlink(file.path).catch(console.error);
      }
    }
    
    res.status(500).json({ error: 'Error al actualizar objeto' });
  }
});

/**
 * PUT /api/library/manual/:id
 * Actualizar objeto manual en biblioteca
 */
router.put('/manual/:id', auth, isAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const {
      name,
      category,
      typology,
      description,
      characteristics,
      visualPatterns,
      keywords
    } = req.body;

    const object = await UFODatabase.findById(id);
    
    if (!object) {
      return res.status(404).json({ error: 'Objeto no encontrado' });
    }

    // Construir registro de cambios
    const changes = [];
    if (name && name !== object.name) changes.push(`nombre: ${object.name} → ${name}`);
    if (category && category !== object.category) changes.push(`categoría: ${object.category} → ${category}`);
    if (description && description !== object.description) changes.push('descripción actualizada');

    // Actualizar campos
    if (name) object.name = name;
    if (category) object.category = category;
    if (typology) object.typology = typology;
    if (description) object.description = description;
    
    if (characteristics) {
      object.characteristics = typeof characteristics === 'string'
        ? JSON.parse(characteristics)
        : characteristics;
    }
    
    if (visualPatterns) {
      object.visualPatterns = typeof visualPatterns === 'string'
        ? JSON.parse(visualPatterns)
        : visualPatterns;
    }

    // Agregar registro de edición
    object.editHistory.push({
      editedBy: req.user._id,
      editedAt: new Date(),
      changes: changes.join(', ')
    });

    await object.save();

    // SINCRONIZACIÓN: Actualizar training vinculado si existe
    if (object.linkedTrainingId) {
      try {
        const trainingImage = await TrainingImage.findById(object.linkedTrainingId);
        if (trainingImage) {
          if (name) trainingImage.type = typology || name;
          if (description) trainingImage.description = description;
          if (keywords) {
            trainingImage.keywords = typeof keywords === 'string'
              ? JSON.parse(keywords)
              : keywords;
          }
          await trainingImage.save();
          console.log(`✅ Training actualizado: ${trainingImage._id}`);
        }
      } catch (syncError) {
        console.error('Error sincronizando actualización con training:', syncError);
      }
    }

    res.json({
      success: true,
      message: 'Objeto actualizado exitosamente',
      data: object
    });

  } catch (error) {
    console.error('Error actualizando objeto:', error);
    res.status(500).json({ error: 'Error al actualizar objeto' });
  }
});

/**
 * DELETE /api/library/manual/:id
 * Eliminar objeto manual de biblioteca
 */
router.delete('/manual/:id', auth, isAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    
    const object = await UFODatabase.findById(id);
    
    if (!object) {
      return res.status(404).json({ error: 'Objeto no encontrado' });
    }

    // Solo permitir eliminar entradas manuales
    if (!object.isManualEntry) {
      return res.status(403).json({
        error: 'Solo se pueden eliminar objetos creados manualmente'
      });
    }

    // Eliminar archivos de imágenes
    if (object.manualImages && object.manualImages.length > 0) {
      for (const img of object.manualImages) {
        const filePath = path.join(__dirname, '../uploads/library', img.filename);
        const thumbnailPath = path.join(__dirname, '../uploads/library', 'thumb-' + img.filename);
        
        await fs.unlink(filePath).catch(console.error);
        await fs.unlink(thumbnailPath).catch(console.error);
      }
    }

    // Eliminar training vinculado si existe
    if (object.linkedTrainingId) {
      try {
        await TrainingImage.findByIdAndDelete(object.linkedTrainingId);
        console.log(`✅ Training vinculado eliminado: ${object.linkedTrainingId}`);
      } catch (error) {
        console.error('Error eliminando training vinculado:', error);
      }
    }

    await UFODatabase.findByIdAndDelete(id);

    res.json({
      success: true,
      message: 'Objeto eliminado exitosamente'
    });

  } catch (error) {
    console.error('Error eliminando objeto:', error);
    res.status(500).json({ error: 'Error al eliminar objeto' });
  }
});

// Eliminar imagen individual de un objeto
router.delete('/objects/:objectId/images/:imageId', auth, isAdmin, async (req, res) => {
  try {
    const { objectId, imageId } = req.params;

    const object = await UFODatabase.findById(objectId);
    if (!object) {
      return res.status(404).json({ success: false, message: 'Objeto no encontrado' });
    }

    // Buscar la imagen en manualImages
    const imageIndex = object.manualImages.findIndex(img => img._id.toString() === imageId);
    
    if (imageIndex === -1) {
      return res.status(404).json({ success: false, message: 'Imagen no encontrada' });
    }

    const image = object.manualImages[imageIndex];

    // Eliminar archivos físicos
    const fs = require('fs');
    const path = require('path');
    
    try {
      if (image.url) {
        const filePath = path.join(__dirname, '..', image.url);
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
          console.log(`🗑️ Archivo eliminado: ${filePath}`);
        }
      }
      if (image.thumbnailUrl) {
        const thumbPath = path.join(__dirname, '..', image.thumbnailUrl);
        if (fs.existsSync(thumbPath)) {
          fs.unlinkSync(thumbPath);
          console.log(`🗑️ Thumbnail eliminado: ${thumbPath}`);
        }
      }
    } catch (fsError) {
      console.error('Error eliminando archivos físicos:', fsError);
    }

    // Remover imagen del array
    object.manualImages.splice(imageIndex, 1);
    await object.save();

    // Actualizar training vinculado si es necesario
    if (object.linkedTrainingId) {
      try {
        const training = await TrainingImage.findById(object.linkedTrainingId);
        if (training && object.manualImages.length > 0) {
          // Actualizar con la primera imagen disponible
          training.imageUrl = object.manualImages[0].url;
          training.thumbnailUrl = object.manualImages[0].thumbnailUrl;
          await training.save();
          console.log(`✅ Training actualizado con nueva imagen principal`);
        } else if (training && object.manualImages.length === 0 && !object.imageUrl) {
          // Si ya no hay imágenes, eliminar training
          await TrainingImage.findByIdAndDelete(object.linkedTrainingId);
          object.linkedTrainingId = null;
          await object.save();
          console.log(`✅ Training eliminado porque no quedan imágenes`);
        }
      } catch (error) {
        console.error('Error actualizando training:', error);
      }
    }

    res.json({
      success: true,
      message: 'Imagen eliminada correctamente',
      remainingImages: object.manualImages.length
    });

  } catch (error) {
    console.error('Error eliminando imagen:', error);
    res.status(500).json({ success: false, message: 'Error al eliminar imagen' });
  }
});

module.exports = router;
