const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Analysis = require('../models/Analysis');
const mongoose = require('mongoose');
const CacheService = require('../services/cacheService');

/**
 * RUTAS DE ANÁLISIS AVANZADO
 * Comparaciones, patrones y estadísticas avanzadas
 */

// ==================== COMPARAR MÚLTIPLES ANÁLISIS ====================
router.post('/compare', auth, async (req, res) => {
  try {
    const { analysisIds } = req.body;
    
    if (!analysisIds || !Array.isArray(analysisIds) || analysisIds.length < 2) {
      return res.status(400).json({
        error: 'Se requieren al menos 2 IDs de análisis para comparar'
      });
    }
    
    if (analysisIds.length > 10) {
      return res.status(400).json({
        error: 'Máximo 10 análisis por comparación'
      });
    }
    
    // Obtener análisis
    const analyses = await Analysis.find({
      _id: { $in: analysisIds },
      userId: req.user._id,
      status: 'completed'
    }).select('fileName aiAnalysis exifData bestMatch createdAt').lean();
    
    if (analyses.length < 2) {
      return res.status(404).json({
        error: 'No se encontraron suficientes análisis completados'
      });
    }
    
    // Análisis comparativo
    const comparison = {
      totalAnalyses: analyses.length,
      analyses: analyses.map(a => ({
        id: a._id,
        fileName: a.fileName,
        category: a.aiAnalysis?.category,
        confidence: a.aiAnalysis?.confidence,
        date: a.createdAt
      })),
      
      // Categorías comunes
      categories: [...new Set(analyses.map(a => a.aiAnalysis?.category).filter(Boolean))],
      
      // Promedio de confianza
      averageConfidence: analyses.reduce((sum, a) => sum + (a.aiAnalysis?.confidence || 0), 0) / analyses.length,
      
      // Ubicaciones (si tienen GPS)
      locations: analyses
        .filter(a => a.exifData?.gps)
        .map(a => ({
          id: a._id,
          fileName: a.fileName,
          lat: a.exifData.gps.latitude,
          lon: a.exifData.gps.longitude
        })),
      
      // Similitudes
      similarities: findSimilarities(analyses),
      
      // Diferencias
      differences: findDifferences(analyses)
    };
    
    res.json({ comparison });
    
  } catch (error) {
    console.error('Error en comparación:', error);
    res.status(500).json({ error: 'Error al comparar análisis' });
  }
});

// ==================== DETECTAR PATRONES ====================
router.get('/patterns', auth, async (req, res) => {
  try {
    const { days = 30, minOccurrences = 2, radiusKm = 10 } = req.query;
    
    // Crear clave de caché única para este usuario y parámetros
    const cacheKey = `patterns_${req.user._id}_${days}_${minOccurrences}_${radiusKm}`;
    
    // Intentar obtener de caché
    const cached = CacheService.get('medium', cacheKey);
    if (cached) {
      return res.json({ ...cached, fromCache: true });
    }
    
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(days));
    
    // Patrones por categoría
    const categoryPatterns = await Analysis.aggregate([
      {
        $match: {
          userId: req.user._id,
          status: 'completed',
          createdAt: { $gte: startDate }
        }
      },
      {
        $group: {
          _id: '$aiAnalysis.category',
          count: { $sum: 1 },
          avgConfidence: { $avg: '$aiAnalysis.confidence' },
          files: { $push: '$fileName' }
        }
      },
      {
        $match: {
          count: { $gte: parseInt(minOccurrences) }
        }
      },
      {
        $sort: { count: -1 }
      }
    ]);
    
    // Patrones por ubicación (si tienen GPS)
    const locationPatterns = await Analysis.aggregate([
      {
        $match: {
          userId: req.user._id,
          status: 'completed',
          'exifData.gps': { $exists: true },
          createdAt: { $gte: startDate }
        }
      },
      {
        $group: {
          _id: {
            lat: { $round: ['$exifData.gps.latitude', 1] },
            lon: { $round: ['$exifData.gps.longitude', 1] }
          },
          count: { $sum: 1 },
          files: { $push: '$fileName' }
        }
      },
      {
        $match: {
          count: { $gte: parseInt(minOccurrences) }
        }
      },
      {
        $sort: { count: -1 }
      }
    ]);
    
    // Patrones temporales (hora del día)
    const timePatterns = await Analysis.aggregate([
      {
        $match: {
          userId: req.user._id,
          status: 'completed',
          createdAt: { $gte: startDate }
        }
      },
      {
        $group: {
          _id: { $hour: '$createdAt' },
          count: { $sum: 1 }
        }
      },
      {
        $sort: { _id: 1 }
      }
    ]);
    
    // Objetos más identificados
    const objectPatterns = await Analysis.aggregate([
      {
        $match: {
          userId: req.user._id,
          status: 'completed',
          'bestMatch.category': { $exists: true },
          createdAt: { $gte: startDate }
        }
      },
      {
        $group: {
          _id: '$bestMatch.category',
          count: { $sum: 1 },
          avgMatchPercentage: { $avg: '$bestMatch.matchPercentage' }
        }
      },
      {
        $match: {
          count: { $gte: parseInt(minOccurrences) }
        }
      },
      {
        $sort: { count: -1 }
      }
    ]);
    
    const result = {
      period: `${days} días`,
      patterns: {
        byCategory: categoryPatterns.map(p => ({
          category: p._id,
          count: p.count,
          avgConfidence: Math.round(p.avgConfidence || 0)
        })),
        byLocation: locationPatterns.map(p => ({
          location: {
            type: 'Point',
            coordinates: [p._id.lon, p._id.lat]
          },
          count: p.count
        })),
        byTimeOfDay: timePatterns.map(p => ({
          hourRange: p._id,
          count: p.count
        })),
        topObjects: objectPatterns.map(p => ({
          object: p._id,
          count: p.count,
          avgMatch: Math.round(p.avgMatchPercentage || 0)
        }))
      },
      insights: generateInsights(categoryPatterns, locationPatterns, timePatterns, objectPatterns)
    };
    
    // Guardar en caché por 15 minutos
    CacheService.set('medium', cacheKey, result);
    
    res.json(result);
    
  } catch (error) {
    console.error('Error detectando patrones:', error);
    res.status(500).json({ error: 'Error al detectar patrones' });
  }
});

// ==================== ESTADÍSTICAS AVANZADAS ====================
router.get('/stats', auth, async (req, res) => {
  try {
    const { days = 30 } = req.query;
    
    // Crear clave de caché única
    const cacheKey = `stats_${req.user._id}_${days}`;
    
    // Intentar obtener de caché
    const cached = CacheService.get('medium', cacheKey);
    if (cached) {
      return res.json({ ...cached, fromCache: true });
    }
    
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(days));
    
    // Total de análisis
    const totalAnalyses = await Analysis.countDocuments({
      userId: req.user._id,
      createdAt: { $gte: startDate }
    });
    
    // Análisis completados
    const completedAnalyses = await Analysis.countDocuments({
      userId: req.user._id,
      status: 'completed',
      createdAt: { $gte: startDate }
    });
    
    // Contar UAPs detectados
    const uapCount = await Analysis.countDocuments({
      userId: req.user._id,
      status: 'completed',
      'aiAnalysis.category': 'uap',
      createdAt: { $gte: startDate }
    });
    
    // Promedio de confianza
    const confidenceAgg = await Analysis.aggregate([
      {
        $match: {
          userId: req.user._id,
          status: 'completed',
          'aiAnalysis.confidence': { $exists: true },
          createdAt: { $gte: startDate }
        }
      },
      {
        $group: {
          _id: null,
          avgConfidence: { $avg: '$aiAnalysis.confidence' }
        }
      }
    ]);
    const averageConfidence = confidenceAgg[0]?.avgConfidence || 0;
    
    // Análisis por estado
    const byStatus = await Analysis.aggregate([
      {
        $match: {
          userId: req.user._id,
          createdAt: { $gte: startDate }
        }
      },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);
    
    // Distribución de confianza
    const confidenceDistribution = await Analysis.aggregate([
      {
        $match: {
          userId: req.user._id,
          status: 'completed',
          'aiAnalysis.confidence': { $exists: true },
          createdAt: { $gte: startDate }
        }
      },
      {
        $bucket: {
          groupBy: '$aiAnalysis.confidence',
          boundaries: [0, 20, 40, 60, 80, 100],
          default: 'Other',
          output: {
            count: { $sum: 1 }
          }
        }
      },
      {
        $project: {
          _id: 0,
          min: '$_id',
          max: { $add: ['$_id', 20] },
          count: 1
        }
      }
    ]);
    
    // Distribución por hora del día
    const hourlyDistribution = await Analysis.aggregate([
      {
        $match: {
          userId: req.user._id,
          createdAt: { $gte: startDate }
        }
      },
      {
        $group: {
          _id: { $hour: '$createdAt' },
          count: { $sum: 1 }
        }
      },
      {
        $sort: { _id: 1 }
      }
    ]);
    
    // Categorías más frecuentes
    const topCategories = await Analysis.aggregate([
      {
        $match: {
          userId: req.user._id,
          status: 'completed',
          'aiAnalysis.category': { $exists: true },
          createdAt: { $gte: startDate }
        }
      },
      {
        $group: {
          _id: '$aiAnalysis.category',
          count: { $sum: 1 },
          avgConfidence: { $avg: '$aiAnalysis.confidence' }
        }
      },
      {
        $sort: { count: -1 }
      },
      {
        $limit: 10
      }
    ]);
    
    // Timeline de análisis
    const timeline = await Analysis.aggregate([
      {
        $match: {
          userId: req.user._id,
          createdAt: { $gte: startDate }
        }
      },
      {
        $group: {
          _id: {
            $dateToString: {
              format: '%Y-%m-%d',
              date: '$createdAt'
            }
          },
          count: { $sum: 1 }
        }
      },
      {
        $sort: { _id: 1 }
      }
    ]);
    
    const result = {
      period: `${days} días`,
      totalAnalyses,
      completedAnalyses,
      uapCount,
      averageConfidence: Math.round(averageConfidence),
      byStatus,
      confidenceDistribution,
      hourlyDistribution,
      topCategories,
      timeline
    };
    
    // Guardar en caché por 15 minutos
    CacheService.set('medium', cacheKey, result);
    
    res.json(result);
    
  } catch (error) {
    console.error('Error obteniendo estadísticas:', error);
    res.status(500).json({ error: 'Error al obtener estadísticas' });
  }
});

// ==================== ANÁLISIS SIMILARES ====================
router.get('/:id/similar', auth, async (req, res) => {
  try {
    const analysisId = req.params.id;
    
    // Obtener análisis de referencia
    const reference = await Analysis.findOne({
      _id: analysisId,
      userId: req.user._id,
      status: 'completed'
    }).lean();
    
    if (!reference) {
      return res.status(404).json({ error: 'Análisis no encontrado' });
    }
    
    // Buscar análisis similares por categoría
    const similarByCategory = await Analysis.find({
      userId: req.user._id,
      _id: { $ne: analysisId },
      status: 'completed',
      'aiAnalysis.category': reference.aiAnalysis?.category
    })
    .select('fileName aiAnalysis createdAt')
    .limit(10)
    .lean();
    
    // Buscar por ubicación cercana (si tiene GPS)
    let similarByLocation = [];
    if (reference.exifData?.gps) {
      similarByLocation = await Analysis.find({
        userId: req.user._id,
        _id: { $ne: analysisId },
        status: 'completed',
        'exifData.gps': { $exists: true }
      })
      .select('fileName aiAnalysis exifData createdAt')
      .limit(20)
      .lean()
      .then(analyses => {
        // Filtrar por distancia (aproximadamente 10km)
        return analyses
          .map(a => {
            const distance = calculateDistance(
              reference.exifData.gps.latitude,
              reference.exifData.gps.longitude,
              a.exifData.gps.latitude,
              a.exifData.gps.longitude
            );
            return { ...a, distance };
          })
          .filter(a => a.distance < 10)
          .sort((a, b) => a.distance - b.distance)
          .slice(0, 10);
      });
    }
    
    res.json({
      reference: {
        id: reference._id,
        fileName: reference.fileName,
        category: reference.aiAnalysis?.category,
        confidence: reference.aiAnalysis?.confidence
      },
      similar: {
        byCategory: similarByCategory,
        byLocation: similarByLocation
      }
    });
    
  } catch (error) {
    console.error('Error buscando similares:', error);
    res.status(500).json({ error: 'Error al buscar análisis similares' });
  }
});

// ==================== FUNCIONES AUXILIARES ====================

function findSimilarities(analyses) {
  const similarities = [];
  
  // Categorías comunes
  const categories = analyses.map(a => a.aiAnalysis?.category).filter(Boolean);
  const categoryCount = {};
  categories.forEach(c => categoryCount[c] = (categoryCount[c] || 0) + 1);
  
  Object.entries(categoryCount).forEach(([category, count]) => {
    if (count > 1) {
      similarities.push(`${count} análisis identificados como "${category}"`);
    }
  });
  
  // Confianza similar
  const confidences = analyses.map(a => a.aiAnalysis?.confidence).filter(Boolean);
  const avgConfidence = confidences.reduce((sum, c) => sum + c, 0) / confidences.length;
  const variance = confidences.reduce((sum, c) => sum + Math.pow(c - avgConfidence, 2), 0) / confidences.length;
  
  if (variance < 100) {
    similarities.push(`Confianza consistente (promedio: ${avgConfidence.toFixed(1)}%)`);
  }
  
  return similarities;
}

function findDifferences(analyses) {
  const differences = [];
  
  const categories = [...new Set(analyses.map(a => a.aiAnalysis?.category).filter(Boolean))];
  if (categories.length > 1) {
    differences.push(`Diferentes categorías detectadas: ${categories.join(', ')}`);
  }
  
  const confidences = analyses.map(a => a.aiAnalysis?.confidence).filter(Boolean);
  const minConfidence = Math.min(...confidences);
  const maxConfidence = Math.max(...confidences);
  
  if (maxConfidence - minConfidence > 30) {
    differences.push(`Gran variación en confianza: ${minConfidence}% - ${maxConfidence}%`);
  }
  
  return differences;
}

function generateInsights(categoryPatterns, locationPatterns, timePatterns, objectPatterns) {
  const insights = [];
  
  if (categoryPatterns.length > 0) {
    const top = categoryPatterns[0];
    insights.push(`Categoría más frecuente: ${top._id} (${top.count} veces)`);
  }
  
  if (locationPatterns.length > 0) {
    insights.push(`${locationPatterns.length} ubicaciones con múltiples avistamientos`);
  }
  
  if (timePatterns.length > 0) {
    const sorted = [...timePatterns].sort((a, b) => b.count - a.count);
    const peakHour = sorted[0]._id;
    insights.push(`Hora pico de análisis: ${peakHour}:00`);
  }
  
  if (objectPatterns.length > 0) {
    const top = objectPatterns[0];
    insights.push(`Objeto más identificado: ${top._id} (${top.count} veces)`);
  }
  
  return insights;
}

function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371; // Radio de la Tierra en km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}

module.exports = router;
