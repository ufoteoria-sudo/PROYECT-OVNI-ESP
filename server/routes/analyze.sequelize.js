const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const { User, Analysis } = require('../config/db');
const localAiService = require('../services/localAiService');
const scientificComparisonService = require('../services/scientificComparisonService');
const exifService = require('../services/exifService');
const externalValidationService = require('../services/externalValidationService');
const trainingLearningService = require('../services/trainingLearningService');
const confidenceCalculatorService = require('../services/confidenceCalculatorService');
const visualAnalysisService = require('../services/visualAnalysisService');
const forensicAnalysisService = require('../services/forensicAnalysisService');
const weatherService = require('../services/weatherService');
const atmosphericComparisonService = require('../services/atmosphericComparisonService');
const WebSocketService = require('../services/websocketService');

// POST /api/analyze/:id - Iniciar análisis de una imagen/video
router.post('/:id', auth, async (req, res) => {
  try {
    const userId = req.user.userId;
    const userRole = req.user.role;
    const analysisId = req.params.id;

    // Obtener el análisis
    const analysis = await Analysis.findByPk(analysisId);

    if (!analysis) {
      return res.status(404).json({ error: 'Análisis no encontrado.' });
    }

    // Verificar permisos
    if (userRole !== 'admin' && analysis.userId !== userId) {
      return res.status(403).json({ error: 'No tienes permiso para analizar este archivo.' });
    }

    // Verificar que el archivo sea una imagen (por ahora solo imágenes)
    if (analysis.fileType !== 'image') {
      return res.status(400).json({ 
        error: 'Por ahora solo se pueden analizar imágenes. El análisis de videos estará disponible próximamente.' 
      });
    }

    // Verificar que no esté ya en proceso
    if (analysis.status === 'analyzing') {
      return res.status(400).json({ error: 'Este análisis ya está en proceso.' });
    }

    // Actualizar estado a "analyzing"
    await analysis.update({ status: 'analyzing' });

    // Iniciar análisis en background (no bloquear la respuesta)
    performAnalysis(analysisId).catch(err => {
      console.error('Error en análisis background:', err);
    });

    res.json({
      message: 'Análisis iniciado exitosamente.',
      analysisId: analysis.id,
      status: 'analyzing'
    });

  } catch (error) {
    console.error('Error al iniciar análisis:', error);
    res.status(500).json({ error: 'Error al iniciar el análisis.' });
  }
});

// GET /api/analyze/:id/status - Obtener estado del análisis
router.get('/:id/status', auth, async (req, res) => {
  try {
    const userId = req.user.userId;
    const userRole = req.user.role;
    const analysisId = req.params.id;

    const analysis = await Analysis.findByPk(analysisId);

    if (!analysis) {
      return res.status(404).json({ error: 'Análisis no encontrado.' });
    }

    // Verificar permisos
    if (userRole !== 'admin' && analysis.userId !== userId) {
      return res.status(403).json({ error: 'No tienes permiso para ver este análisis.' });
    }

    res.json({
      status: analysis.status,
      analysisId: analysis.id,
      fileName: analysis.fileName,
      fileType: analysis.fileType,
      uploadDate: analysis.uploadDate,
      ...(analysis.status === 'completed' && {
        analysisData: {
          exifData: analysis.exifData,
          aiAnalysis: analysis.aiAnalysis,
          visualAnalysis: analysis.visualAnalysis,
          forensicAnalysis: analysis.forensicAnalysis,
          scientificComparison: analysis.scientificComparison,
          trainingEnhancement: analysis.trainingEnhancement,
          externalValidation: analysis.externalValidation,
          weatherData: analysis.weatherData,
          atmosphericComparison: analysis.atmosphericComparison,
          confidence: analysis.confidence,
          recommendations: analysis.recommendations
        }
      }),
      ...(analysis.status === 'error' && {
        errorMessage: analysis.errorMessage
      })
    });

  } catch (error) {
    console.error('Error obteniendo estado:', error);
    res.status(500).json({ error: 'Error al obtener el estado del análisis.' });
  }
});

// GET /api/analyze/config - Obtener configuración del sistema
router.get('/config', async (req, res) => {
  try {
    res.json({
      analysisLayers: 9,
      supportedFormats: ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp'],
      maxFileSize: '50MB',
      analysisCapabilities: {
        exif: true,
        visualAI: true,
        forensic: true,
        scientificComparison: true,
        trainingEnhancement: true,
        externalValidation: true,
        weather: process.env.OPENWEATHER_API_KEY ? true : false,
        atmospheric: process.env.OPENWEATHER_API_KEY ? true : false
      },
      apiVersion: '1.0.0',
      status: 'operational'
    });
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener configuración.' });
  }
});

// Función para realizar análisis en background
async function performAnalysis(analysisId) {
  try {
    const analysis = await Analysis.findByPk(analysisId);
    if (!analysis) return;

    const filePath = analysis.filePath;

    // Capa 1: Extracción EXIF
    console.log('🔄 Capa 1: Extrayendo EXIF...');
    const exifData = await exifService.extractExif(filePath);
    await analysis.update({ exifData });

    // Capa 2: Análisis Visual (Matching con Biblioteca Local)
    console.log('🔄 Capa 2: Análisis Visual...');
    const aiAnalysis = await localAiService.analyzeImage(filePath);
    await analysis.update({ aiAnalysis });

    // Capa 3: Análisis Forense
    console.log('🔄 Capa 3: Análisis Forense...');
    const forensicAnalysis = await forensicAnalysisService.analyzeImage(filePath);
    await analysis.update({ forensicAnalysis });

    // Capa 4: Comparación Científica
    console.log('🔄 Capa 4: Comparación Científica...');
    const scientificComparison = await scientificComparisonService.compare(filePath);
    await analysis.update({ scientificComparison });

    // Capa 5: Training Enhancement
    console.log('🔄 Capa 5: Training Enhancement...');
    const trainingEnhancement = await trainingLearningService.enhance(analysis.id);
    await analysis.update({ trainingEnhancement });

    // Capa 6: Validación Externa
    console.log('🔄 Capa 6: Validación Externa...');
    const externalValidation = await externalValidationService.validate(exifData);
    await analysis.update({ externalValidation });

    // Capa 7: Análisis Meteorológico
    console.log('🔄 Capa 7: Análisis Meteorológico...');
    let weatherData = {};
    if (exifData.location && process.env.OPENWEATHER_API_KEY) {
      weatherData = await weatherService.getWeatherData(exifData.location);
    }
    await analysis.update({ weatherData });

    // Capa 8: Comparación Atmosférica
    console.log('🔄 Capa 8: Comparación Atmosférica...');
    const atmosphericComparison = await atmosphericComparisonService.compare(weatherData);
    await analysis.update({ atmosphericComparison });

    // Capa 9: Cálculo de Confianza
    console.log('🔄 Capa 9: Cálculo de Confianza...');
    const analysisComplete = await Analysis.findByPk(analysisId);
    const { confidence, recommendations } = await confidenceCalculatorService.calculate(analysisComplete);
    await analysis.update({ confidence, recommendations, status: 'completed' });

    console.log('✅ Análisis completado:', analysisId);
    if (global.io) {
      global.io.emit('analysis-completed', { analysisId, confidence });
    }

  } catch (error) {
    console.error('❌ Error en análisis:', error);
    const analysis = await Analysis.findByPk(analysisId);
    if (analysis) {
      await analysis.update({ 
        status: 'error', 
        errorMessage: error.message 
      });
    }
  }
}

module.exports = router;
