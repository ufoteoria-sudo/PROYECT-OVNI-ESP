const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Analysis = require('../models/Analysis');
const aiService = require('../services/aiService');
const scientificComparisonService = require('../services/scientificComparisonService');
const exifService = require('../services/exifService');
const NotificationService = require('../services/notificationService');

// POST /api/analyze/:id - Iniciar análisis de una imagen/video
router.post('/:id', auth, async (req, res) => {
  try {
    const userId = req.userId;
    const userRole = req.userRole;
    const analysisId = req.params.id;

    // Obtener el análisis
    const analysis = await Analysis.findById(analysisId);

    if (!analysis) {
      return res.status(404).json({ error: 'Análisis no encontrado.' });
    }

    // Verificar permisos
    if (userRole !== 'admin' && analysis.userId.toString() !== userId) {
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
    analysis.status = 'analyzing';
    await analysis.save();

    // Iniciar análisis en background (no bloquear la respuesta)
    performAnalysis(analysisId).catch(err => {
      console.error('Error en análisis background:', err);
    });

    res.json({
      message: 'Análisis iniciado exitosamente.',
      analysisId: analysis._id,
      status: 'analyzing'
    });

  } catch (error) {
    console.error('Error al iniciar análisis:', error);
    if (error.kind === 'ObjectId') {
      return res.status(400).json({ error: 'ID de análisis inválido.' });
    }
    res.status(500).json({ error: 'Error al iniciar el análisis.' });
  }
});

// GET /api/analyze/:id/status - Obtener estado del análisis
router.get('/:id/status', auth, async (req, res) => {
  try {
    const userId = req.userId;
    const userRole = req.userRole;
    const analysisId = req.params.id;

    const analysis = await Analysis.findById(analysisId)
      .select('status aiAnalysis exifData matchResults bestMatch errorMessage fileName uploadDate createdAt fileType fileSize userId');

    if (!analysis) {
      return res.status(404).json({ error: 'Análisis no encontrado.' });
    }

    // Verificar permisos
    if (userRole !== 'admin' && analysis.userId.toString() !== userId) {
      return res.status(403).json({ error: 'No tienes permiso para ver este análisis.' });
    }

    res.json({
      status: analysis.status,
      fileName: analysis.fileName,
      uploadDate: analysis.uploadDate || analysis.createdAt,
      fileType: analysis.fileType,
      fileSize: analysis.fileSize,
      hasExifData: !!analysis.exifData && Object.keys(analysis.exifData).length > 0,
      hasAiAnalysis: !!analysis.aiAnalysis && !!analysis.aiAnalysis.category,
      hasMatches: analysis.matchResults && analysis.matchResults.length > 0,
      errorMessage: analysis.errorMessage,
      analysisData: {
        exifData: analysis.exifData, // ⚠️ IMPORTANTE: debe ser exifData, no exif
        aiAnalysis: analysis.aiAnalysis, // ⚠️ IMPORTANTE: debe ser aiAnalysis, no ai
        matchResults: analysis.matchResults,
        bestMatch: analysis.bestMatch
      }
    });

  } catch (error) {
    console.error('Error al obtener estado:', error);
    res.status(500).json({ error: 'Error al obtener el estado del análisis.' });
  }
});

// GET /api/analyze/config - Verificar configuración de API
router.get('/config', auth, async (req, res) => {
  try {
    const visualSystemReady = visualComparisonService.isConfigured();
    const aiSystemReady = aiService.isConfigured();
    
    res.json({
      analysisConfigured: visualSystemReady,
      provider: 'visual_comparison',
      aiBackup: aiSystemReady,
      message: 'Sistema de análisis por comparación visual activo. Base de datos de objetos conocidos cargada.',
      databaseObjects: await require('../models/UFODatabase').countDocuments({ isActive: true })
    });

  } catch (error) {
    console.error('Error al verificar configuración:', error);
    res.status(500).json({ error: 'Error al verificar configuración.' });
  }
});

/**
 * Función auxiliar para realizar el análisis completo
 * Se ejecuta en background
 */
async function performAnalysis(analysisId) {
  let analysis;
  
  try {
    analysis = await Analysis.findById(analysisId);
    if (!analysis) {
      console.error('Análisis no encontrado:', analysisId);
      return;
    }

    console.log(`Iniciando análisis completo de: ${analysis.fileName}`);

    // 1. Extraer datos EXIF (solo para imágenes)
    if (analysis.fileType === 'image') {
      console.log('Extrayendo datos EXIF...');
      const exifResult = await exifService.extractExifData(analysis.filePath);
      
      if (exifResult.success) {
        analysis.exifData = exifResult.data;
        console.log('Datos EXIF extraídos exitosamente');
      } else {
        console.log('No se pudieron extraer datos EXIF:', exifResult.error);
      }
    }

    // 2. Analizar con sistema de comparación CIENTÍFICA
    console.log('� Analizando con comparación científica...');
    const analysisResult = await scientificComparisonService.analyzeImageScientifically(
      analysis.filePath,
      analysis.exifData
    );
    
    if (analysisResult.success) {
      analysis.aiAnalysis = analysisResult.data;
      console.log(`✅ Análisis completado: ${analysisResult.data.category} (${analysisResult.data.confidence}%)`);
      
      // 3. Asignar mejor coincidencia
      if (analysisResult.data.rawResponse?.bestMatch) {
        const bestMatch = analysisResult.data.rawResponse.bestMatch;
        analysis.bestMatch = {
          objectId: bestMatch.objectId,
          category: bestMatch.category,
          matchPercentage: bestMatch.matchPercentage
        };
        
        // Guardar todos los matches
        analysis.matchResults = analysisResult.data.rawResponse.allMatches || [];
      }
    } else {
      // Fallback: análisis básico
      console.log('⚠️ Sistema de comparación falló, generando análisis básico...');
      analysis.aiAnalysis = {
        provider: 'basic',
        model: 'Basic Analysis',
        description: 'Análisis básico realizado. Los datos EXIF están disponibles.',
        detectedObjects: ['Objeto no identificado'],
        confidence: 30,
        category: 'unknown',
        isUnusual: true,
        unusualFeatures: ['Análisis automático no disponible'],
        recommendations: ['Análisis manual recomendado'],
        processedDate: new Date()
      };
    }

    // 4. Actualizar estado
    analysis.status = 'completed';
    analysis.errorMessage = null;
    
    await analysis.save();
    console.log(`✅ Análisis guardado: ${analysis.fileName}`);

    // 5. Enviar notificación al usuario
    await NotificationService.notifyAnalysisCompleted(
      analysis.userId,
      analysis._id,
      {
        fileName: analysis.fileName,
        category: analysis.aiAnalysis?.category || 'unknown',
        confidence: analysis.aiAnalysis?.confidence || 0
      }
    );

  } catch (error) {
    console.error('Error en análisis:', error);
    
    if (analysis) {
      analysis.status = 'error';
      analysis.errorMessage = error.message;
      await analysis.save();
    }
  }
}

module.exports = router;
