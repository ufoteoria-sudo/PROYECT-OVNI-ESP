const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const objectDetectionService = require('../services/objectDetectionService');
const aiService = require('../services/aiService');

// Configurar multer para pruebas
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = path.join(__dirname, '../uploads/test');
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    cb(null, `test-${Date.now()}${path.extname(file.originalname)}`);
  }
});

const upload = multer({ storage });

/**
 * POST /api/test/object-detection
 * Endpoint de prueba para testar detección de objetos standalone
 */
router.post('/object-detection', upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ 
        success: false, 
        error: 'No se subió ninguna imagen' 
      });
    }

    console.log('\n🧪 TEST: Detección de objetos standalone');
    console.log('Archivo:', req.file.filename);

    const result = await objectDetectionService.analyzeImage(req.file.path);

    // Limpiar archivo de prueba después del análisis
    setTimeout(() => {
      try {
        fs.unlinkSync(req.file.path);
      } catch (err) {
        console.error('Error limpiando archivo de prueba:', err);
      }
    }, 5000);

    res.json(result);

  } catch (error) {
    console.error('Error en test de detección:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * POST /api/test/llama-vision
 * Endpoint de prueba para testar Llama Vision standalone
 */
router.post('/llama-vision', upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ 
        success: false, 
        error: 'No se subió ninguna imagen' 
      });
    }

    console.log('\n🧪 TEST: Llama Vision standalone');
    console.log('Archivo:', req.file.filename);

    if (!aiService.isConfigured()) {
      return res.status(400).json({
        success: false,
        error: 'Llama Vision no está configurado. Necesitas HF_TOKEN en .env'
      });
    }

    const result = await aiService.analyzeImage(req.file.path);

    // Limpiar archivo de prueba después del análisis
    setTimeout(() => {
      try {
        fs.unlinkSync(req.file.path);
      } catch (err) {
        console.error('Error limpiando archivo de prueba:', err);
      }
    }, 5000);

    res.json(result);

  } catch (error) {
    console.error('Error en test de Llama Vision:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * POST /api/test/hybrid-analysis
 * Endpoint de prueba para comparar los 2 análisis lado a lado
 */
router.post('/hybrid-analysis', upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ 
        success: false, 
        error: 'No se subió ninguna imagen' 
      });
    }

    console.log('\n🧪 TEST: Análisis híbrido comparativo');
    console.log('Archivo:', req.file.filename);

    // Ejecutar ambos análisis en paralelo
    const [objectResult, llamaResult] = await Promise.all([
      objectDetectionService.analyzeImage(req.file.path),
      aiService.isConfigured() 
        ? aiService.analyzeImage(req.file.path)
        : Promise.resolve({ success: false, error: 'HF_TOKEN no configurado' })
    ]);

    // Limpiar archivo de prueba después del análisis
    setTimeout(() => {
      try {
        fs.unlinkSync(req.file.path);
      } catch (err) {
        console.error('Error limpiando archivo de prueba:', err);
      }
    }, 5000);

    // Comparar resultados
    const comparison = {
      success: true,
      timestamp: new Date(),
      filename: req.file.filename,
      results: {
        objectDetection: objectResult,
        llamaVision: llamaResult
      },
      comparison: {
        objectCategory: objectResult.success ? objectResult.data.classification.category : 'error',
        objectConfidence: objectResult.success ? objectResult.data.confidenceScore : 0,
        llamaCategory: llamaResult.success ? llamaResult.data.category : 'error',
        llamaConfidence: llamaResult.success ? llamaResult.data.confidence : 0,
        categoriesMatch: 
          objectResult.success && llamaResult.success &&
          (objectResult.data.classification.category === llamaResult.data.category ||
           (objectResult.data.classification.category === 'defined_object' && llamaResult.data.category !== 'natural')),
        averageConfidence: 
          objectResult.success && llamaResult.success
            ? Math.round((objectResult.data.confidenceScore + llamaResult.data.confidence) / 2)
            : 0
      }
    };

    res.json(comparison);

  } catch (error) {
    console.error('Error en test híbrido:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/test/status
 * Verificar estado de los servicios
 */
router.get('/status', (req, res) => {
  res.json({
    success: true,
    services: {
      objectDetection: {
        available: true,
        description: 'Detección de objetos con Sharp + Jimp',
        capabilities: [
          'Análisis de color',
          'Detección de bordes',
          'Análisis de textura',
          'Detección de simetría',
          'Cálculo de nitidez',
          'Detección de ruido y desenfoque'
        ]
      },
      llamaVision: {
        available: aiService.isConfigured(),
        description: 'Llama 3.2 Vision 11B vía Hugging Face',
        configured: aiService.isConfigured(),
        requiresToken: !aiService.isConfigured()
      },
      hybridAnalysis: {
        available: true,
        description: 'Análisis combinado OpenCV + Llama',
        scoringWeights: {
          objectDetection: '40%',
          scientificComparison: '40%',
          llamaVision: '20%'
        }
      }
    }
  });
});

module.exports = router;
