const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Analysis = require('../models/Analysis');
// const aiService = require('../services/aiService'); // DESHABILITADO: Usar SOLO matching con biblioteca
const localAiService = require('../services/localAiService'); // Análisis local GRATIS
const scientificComparisonService = require('../services/scientificComparisonService');
const exifService = require('../services/exifService');
const NotificationService = require('../services/notificationService');
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

    const analysis = await Analysis.findById(analysisId);

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
        exifData: analysis.exifData,
        aiAnalysis: analysis.aiAnalysis,
        visualAnalysis: analysis.visualAnalysis,
        forensicAnalysis: analysis.forensicAnalysis,
        scientificComparison: {
          totalMatches: analysis.matchResults ? analysis.matchResults.length : 0,
          bestMatch: analysis.bestMatch
        },
        trainingEnhancement: analysis.trainingEnhancement,
        externalValidation: analysis.externalValidation,
        weatherData: analysis.weatherData,
        atmosphericComparison: analysis.atmosphericComparison,
        confidence: analysis.aiAnalysis?.confidence,
        recommendations: analysis.aiAnalysis?.recommendations,
        confidenceBreakdown: analysis.confidenceBreakdown,
        confidenceAdjustments: analysis.confidenceAdjustments,
        confidenceExplanation: analysis.confidenceExplanation,
        matchResults: analysis.matchResults
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
    
    res.json({
      analysisConfigured: visualSystemReady,
      provider: 'visual_comparison + library_matching',
      aiBackup: false, // DESHABILITADO: Usar SOLO matching con biblioteca
      message: 'Sistema de análisis por comparación visual y matching de biblioteca activo. 1,064+ objetos conocidos cargados.',
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
    
    // Emitir evento de inicio
    WebSocketService.emitAnalysisStarted(analysisId, analysis.userId);
    WebSocketService.emitProgress(analysisId, 0, 'Iniciando análisis');

    // 1. Extraer datos EXIF (solo para imágenes)
    if (analysis.fileType === 'image') {
      console.log('Extrayendo datos EXIF...');
      WebSocketService.emitProgress(analysisId, 10, 'Capa 1: Extrayendo metadatos EXIF');
      
      const exifResult = await exifService.extractExifData(analysis.filePath);
      
      if (exifResult.success) {
        analysis.exifData = exifResult.data;
        console.log('Datos EXIF extraídos exitosamente');
        WebSocketService.emitLayerComplete(analysisId, 1, 'EXIF', { 
          hasGPS: !!exifResult.data.gpsLatitude,
          hasTimestamp: !!exifResult.data.timestamp 
        });
      } else {
        console.log('No se pudieron extraer datos EXIF:', exifResult.error);
      }
    }

    // 1.5. ANÁLISIS VISUAL AVANZADO (independiente de EXIF)
    console.log('🔬 Ejecutando análisis visual avanzado...');
    WebSocketService.emitProgress(analysisId, 20, 'Capa 2: Análisis visual avanzado');
    
    let visualAnalysis = null;
    try {
      visualAnalysis = await visualAnalysisService.analyzeVisualFeatures(analysis.filePath);
      analysis.visualAnalysis = visualAnalysis;
      console.log(`✅ Análisis visual completado: ${visualAnalysis.objectType.category} (${visualAnalysis.objectType.confidence}% confianza visual)`);
      
      WebSocketService.emitLayerComplete(analysisId, 2, 'Análisis Visual', {
        category: visualAnalysis.objectType.category,
        confidence: visualAnalysis.objectType.confidence
      });
    } catch (visualError) {
      console.error('⚠️ Error en análisis visual:', visualError.message);
    }

    // 1.6. ANÁLISIS FORENSE AVANZADO (detección de manipulación)
    console.log('🔬 Ejecutando análisis forense de imagen...');
    WebSocketService.emitProgress(analysisId, 30, 'Capa 3: Análisis forense');
    
    let forensicAnalysis = null;
    try {
      forensicAnalysis = await forensicAnalysisService.analyzeImage(analysis.filePath);
      analysis.forensicAnalysis = forensicAnalysis;
      console.log(`✅ Análisis forense completado: ${forensicAnalysis.verdict} (${forensicAnalysis.manipulationScore}/100 manipulación)`);
      
      WebSocketService.emitLayerComplete(analysisId, 3, 'Análisis Forense', {
        verdict: forensicAnalysis.verdict,
        manipulationScore: forensicAnalysis.manipulationScore
      });
    } catch (forensicError) {
      console.error('⚠️ Error en análisis forense:', forensicError.message);
    }

    // 1.7. ANÁLISIS LOCAL CON IA (100% GRATIS, SIN LÍMITES)
    console.log('🤖 Ejecutando análisis local de IA (OpenCV + JIMP)...');
    WebSocketService.emitProgress(analysisId, 35, 'Capa 3.5: Análisis IA local (gratis, sin límites)');
    
    let localAiAnalysis = null;
    try {
      localAiAnalysis = await localAiService.analyzeImage(analysis.filePath);
      analysis.localAiAnalysis = localAiAnalysis;
      
      if (localAiAnalysis.success) {
        console.log(`✅ Análisis IA local completado: ${localAiAnalysis.classification} (${localAiAnalysis.confidence}% confianza)`);
        console.log(`📊 Costooperación: $${localAiAnalysis.cost} - Método: ${localAiAnalysis.method}`);
        
        WebSocketService.emitLayerComplete(analysisId, '3.5', 'Análisis IA Local', {
          category: localAiAnalysis.classification,
          confidence: localAiAnalysis.confidence,
          cost: 0,
          objectsDetected: localAiAnalysis.objects?.length || 0
        });
      }
    } catch (localAiError) {
      console.error('⚠️ Error en análisis IA local:', localAiError.message);
      // No es crítico, continuar con otros análisis
    }

    // 2. Analizar con sistema de comparación CIENTÍFICA
    console.log('🔬 Analizando con comparación científica...');
    WebSocketService.emitProgress(analysisId, 40, 'Capa 4: Comparación científica (1,064 objetos)');
    
    const analysisResult = await scientificComparisonService.analyzeImageScientifically(
      analysis.filePath,
      analysis.exifData
    );
    
    let preliminaryAnalysis;
    
    if (analysisResult.success) {
      preliminaryAnalysis = analysisResult.data;
      console.log(`✅ Análisis completado: ${analysisResult.data.category} (${analysisResult.data.confidence}%)`);
      
      WebSocketService.emitLayerComplete(analysisId, 4, 'Comparación Científica', {
        category: analysisResult.data.category,
        confidence: analysisResult.data.confidence,
        matches: analysisResult.data.rawResponse?.allMatches?.length || 0
      });
      
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
      preliminaryAnalysis = {
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

    // 2.5. MEJORAR CON DATOS DE ENTRENAMIENTO
    console.log('🎓 Mejorando análisis con datos de entrenamiento...');
    WebSocketService.emitProgress(analysisId, 50, 'Capa 5: Mejora con entrenamiento');
    
    const trainingEnhancement = await trainingLearningService.enhanceAnalysisWithTraining(
      analysis.filePath,
      preliminaryAnalysis,
      analysis.exifData
    );

    // Usar análisis mejorado si está disponible
    if (trainingEnhancement.enhanced) {
      analysis.aiAnalysis = trainingEnhancement.enhancedAnalysis;
      console.log(`✨ Análisis mejorado con entrenamiento: confianza aumentada de ${trainingEnhancement.originalAnalysis.confidence}% a ${trainingEnhancement.enhancedAnalysis.confidence}%`);
      
      WebSocketService.emitLayerComplete(analysisId, 5, 'Training Enhancement', {
        enhanced: true,
        improvementDelta: trainingEnhancement.improvementDelta,
        matchCount: trainingEnhancement.enhancedAnalysis.trainingData?.matchCount || 0
      });
      
      // Guardar datos de mejora para auditoría
      analysis.trainingEnhancement = {
        enhanced: true,
        improvementDelta: trainingEnhancement.improvementDelta,
        trainingMatchCount: trainingEnhancement.enhancedAnalysis.trainingData?.matchCount || 0,
        enhancedAt: new Date()
      };
    } else {
      analysis.aiAnalysis = preliminaryAnalysis;
      console.log('ℹ️ No se pudo mejorar con datos de entrenamiento');
      
      WebSocketService.emitLayerComplete(analysisId, 5, 'Training Enhancement', {
        enhanced: false
      });
      
      analysis.trainingEnhancement = {
        enhanced: false,
        reason: trainingEnhancement.error || 'No hay datos de entrenamiento disponibles'
      };
    }

    // 3.5. VALIDACIÓN EXTERNA (si hay coordenadas GPS y timestamp)
    if (analysis.exifData?.location && (analysis.exifData.captureDate || analysis.exifData.captureTime)) {
      const { latitude, longitude, altitude } = analysis.exifData.location;
      const datetime = analysis.exifData.captureDate || analysis.exifData.captureTime;
      
      if (latitude && longitude && datetime) {
        console.log('🌍 Iniciando validación externa con APIs...');
        WebSocketService.emitProgress(analysisId, 60, 'Capa 6: Validación externa');
        console.log(`   Coordenadas: ${latitude}, ${longitude}`);
        console.log(`   Fecha/hora: ${datetime}`);
        
        try {
          const validationResult = await externalValidationService.validateSighting(
            { lat: latitude, lng: longitude },
            datetime,
            altitude
          );

          // Guardar resultados de validación externa
          analysis.externalValidation = {
            performed: true,
            performedAt: new Date(),
            coordinates: { latitude, longitude },
            timestamp: datetime,
            results: validationResult,
            hasMatches: validationResult.matches && validationResult.matches.length > 0,
            matchCount: validationResult.matches ? validationResult.matches.length : 0,
            confidence: validationResult.confidence || 0
          };

          WebSocketService.emitLayerComplete(analysisId, 6, 'Validación Externa', {
            matchCount: validationResult.matches ? validationResult.matches.length : 0,
            hasMatches: validationResult.matches && validationResult.matches.length > 0
          });

          // Si hay coincidencias, agregar a recomendaciones
          if (validationResult.matches && validationResult.matches.length > 0) {
            if (!analysis.aiAnalysis.recommendations) {
              analysis.aiAnalysis.recommendations = [];
            }
            
            const matchTypes = [...new Set(validationResult.matches.map(m => m.type))];
            analysis.aiAnalysis.recommendations.push(
              `VALIDACIÓN EXTERNA: Se detectaron ${validationResult.matches.length} coincidencia(s) con objetos conocidos: ${matchTypes.join(', ')}`
            );
          }

          console.log(`✅ Validación externa completada: ${validationResult.matchCount} coincidencias encontradas`);
        } catch (validationError) {
          console.error('❌ Error en validación externa:', validationError.message);
          analysis.externalValidation = {
            performed: true,
            performedAt: new Date(),
            error: validationError.message,
            hasMatches: false
          };
        }
      } else {
        console.log('ℹ️ No hay coordenadas GPS completas para validación externa');
      }
    } else {
      console.log('ℹ️ No hay datos de ubicación/fecha para validación externa');
    }

    // 3.6. ANÁLISIS METEOROLÓGICO Y ATMOSFÉRICO
    if (analysis.exifData?.location) {
      const { latitude, longitude } = analysis.exifData.location;
      
      if (latitude && longitude) {
        console.log('🌤️  Obteniendo datos meteorológicos...');
        WebSocketService.emitProgress(analysisId, 70, 'Capa 7: Análisis meteorológico');
        
        try {
          const weatherData = await weatherService.getCurrentWeather(latitude, longitude);
          
          if (!weatherData.error) {
            analysis.weatherData = weatherData;
            console.log(`✅ Datos meteorológicos obtenidos: ${weatherData.conditions.description}, ${weatherData.temperature.current}°C`);
            
            WebSocketService.emitLayerComplete(analysisId, 7, 'Análisis Meteorológico', {
              temperature: weatherData.temperature.current,
              conditions: weatherData.conditions.description
            });
            
            // Agregar análisis atmosférico a recomendaciones
            if (weatherData.analysis) {
              if (!analysis.aiAnalysis.recommendations) {
                analysis.aiAnalysis.recommendations = [];
              }
              
              if (weatherData.analysis.weather_explanation_probability === 'high' || 
                  weatherData.analysis.weather_explanation_probability === 'very_high') {
                analysis.aiAnalysis.recommendations.push(
                  `⚠️ ALERTA METEOROLÓGICA: Condiciones climáticas con alta probabilidad de explicar el avistamiento`
                );
              }
              
              if (weatherData.analysis.warnings.length > 0) {
                weatherData.analysis.warnings.forEach(warning => {
                  analysis.aiAnalysis.recommendations.push(`🌤️  ${warning}`);
                });
              }
            }
            
            // Comparar con fenómenos atmosféricos
            console.log('☁️  Comparando con fenómenos atmosféricos conocidos...');
            WebSocketService.emitProgress(analysisId, 80, 'Capa 8: Comparación atmosférica (23 fenómenos)');
            
            const atmosphericComparison = await atmosphericComparisonService.compareWithAtmosphericPhenomena(
              analysis.visualAnalysis,
              weatherData,
              analysis.exifData
            );
            
            if (!atmosphericComparison.error) {
              analysis.atmosphericComparison = atmosphericComparison;
              
              if (atmosphericComparison.hasStrongMatch) {
                const bestMatch = atmosphericComparison.bestMatch;
                console.log(`🌩️  COINCIDENCIA ATMOSFÉRICA FUERTE: ${bestMatch.phenomenon.name} (${bestMatch.score}% confianza)`);
                
                WebSocketService.emitLayerComplete(analysisId, 8, 'Comparación Atmosférica', {
                  phenomenon: bestMatch.phenomenon.name,
                  score: bestMatch.score,
                  hasStrongMatch: true
                });
                
                if (!analysis.aiAnalysis.recommendations) {
                  analysis.aiAnalysis.recommendations = [];
                }
                
                analysis.aiAnalysis.recommendations.unshift(
                  `☁️  FENÓMENO ATMOSFÉRICO: Alta probabilidad de ser "${bestMatch.phenomenon.name}" - ${bestMatch.phenomenon.description}`
                );
                
                // Si la coincidencia es muy fuerte, ajustar categoría
                if (bestMatch.score > 80) {
                  analysis.aiAnalysis.category = 'natural';
                  analysis.aiAnalysis.description = `Posible ${bestMatch.phenomenon.name}. ${bestMatch.explanation}`;
                }
              } else {
                console.log(`ℹ️ Comparación atmosférica: ${atmosphericComparison.totalMatches} coincidencias encontradas`);
                WebSocketService.emitLayerComplete(analysisId, 8, 'Comparación Atmosférica', {
                  matchCount: atmosphericComparison.totalMatches,
                  hasStrongMatch: false
                });
              }
            }
            
          } else {
            console.log('⚠️ Datos meteorológicos no disponibles:', weatherData.error);
          }
          
        } catch (weatherError) {
          console.error('❌ Error obteniendo datos meteorológicos:', weatherError.message);
        }
      }
    }

    // 3.7. CALCULAR CONFIANZA PONDERADA (fusionar todos los datos)
    console.log('🎯 Calculando confianza ponderada con todos los datos...');
    WebSocketService.emitProgress(analysisId, 90, 'Capa 9: Fusión de confianza');
    
    try {
      const weightedResult = confidenceCalculatorService.calculateWeightedConfidence(
        analysis.aiAnalysis,
        analysis.externalValidation || {},
        analysis.trainingEnhancement || {},
        analysis.exifData || {},
        analysis.visualAnalysis || null // NUEVO: incluir análisis visual
      );

      // Actualizar análisis con resultados ponderados
      const originalConfidence = analysis.aiAnalysis.confidence;
      const originalCategory = analysis.aiAnalysis.category;

      analysis.aiAnalysis.confidence = weightedResult.finalConfidence;
      analysis.aiAnalysis.category = weightedResult.finalCategory;
      
      WebSocketService.emitLayerComplete(analysisId, 9, 'Confianza Ponderada', {
        finalConfidence: weightedResult.finalConfidence,
        originalConfidence: originalConfidence,
        adjustments: weightedResult.adjustments
      });
      analysis.aiAnalysis.description = weightedResult.finalDescription;

      // Guardar desglose de confianza para auditoría
      analysis.confidenceBreakdown = weightedResult.breakdown;
      analysis.confidenceAdjustments = weightedResult.adjustments;
      analysis.confidenceExplanation = weightedResult.explanation;

      // Agregar explicación a recomendaciones
      if (!analysis.aiAnalysis.recommendations) {
        analysis.aiAnalysis.recommendations = [];
      }
      analysis.aiAnalysis.recommendations.push(
        `CONFIANZA PONDERADA: ${weightedResult.explanation}`
      );

      console.log(`🎯 Confianza ajustada: ${originalConfidence}% → ${weightedResult.finalConfidence}%`);
      if (originalCategory !== weightedResult.finalCategory) {
        console.log(`📝 Categoría ajustada: "${originalCategory}" → "${weightedResult.finalCategory}"`);
      }

    } catch (confidenceError) {
      console.error('❌ Error al calcular confianza ponderada:', confidenceError.message);
      // No bloquear el análisis si falla el cálculo de confianza
    }

    // 4. Actualizar estado
    analysis.status = 'completed';
    analysis.errorMessage = null;
    
    await analysis.save();
    console.log(`✅ Análisis guardado: ${analysis.fileName}`);
    
    // Emitir evento de análisis completado
    WebSocketService.emitProgress(analysisId, 100, 'Análisis completado');
    WebSocketService.emitAnalysisComplete(analysisId, {
      status: 'completed',
      confidence: analysis.aiAnalysis?.confidence || 0,
      category: analysis.aiAnalysis?.category || 'unknown'
    });

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
      
      // Emitir evento de error por WebSocket
      WebSocketService.emitAnalysisError(analysisId, {
        message: error.message,
        stack: error.stack
      });
    }
  }
}

module.exports = router;
