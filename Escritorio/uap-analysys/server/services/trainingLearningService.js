const TrainingImage = require('../models/TrainingImage');
const sharp = require('sharp');
const fs = require('fs').promises;

/**
 * Servicio de Aprendizaje basado en Imágenes de Entrenamiento
 * 
 * Este servicio mejora el análisis comparando la imagen analizada
 * con las imágenes de entrenamiento cargadas por el administrador
 */
class TrainingLearningService {
  
  /**
   * Mejora el análisis usando imágenes de entrenamiento
   * 
   * @param {string} imagePath - Ruta de la imagen a analizar
   * @param {object} preliminaryAnalysis - Análisis preliminar del sistema
   * @param {object} exifData - Datos EXIF de la imagen
   * @returns {object} Análisis mejorado con datos de entrenamiento
   */
  async enhanceAnalysisWithTraining(imagePath, preliminaryAnalysis, exifData = null) {
    try {
      console.log('🎓 Iniciando mejora con datos de entrenamiento...');
      
      // 1. Obtener categoría preliminar
      const preliminaryCategory = preliminaryAnalysis?.category || 'unknown';
      const preliminaryConfidence = preliminaryAnalysis?.confidence || 0;
      
      console.log(`   Categoría preliminar: ${preliminaryCategory} (${preliminaryConfidence}%)`);

      // 2. Buscar imágenes de entrenamiento similares
      const trainingMatches = await this.findMatchingTrainingImages(
        preliminaryCategory,
        exifData
      );

      if (trainingMatches.length === 0) {
        console.log('   No hay imágenes de entrenamiento para esta categoría');
        return {
          enhanced: false,
          originalAnalysis: preliminaryAnalysis,
          trainingData: {
            available: false,
            matchCount: 0
          }
        };
      }

      console.log(`   Encontradas ${trainingMatches.length} imágenes de entrenamiento similares`);

      // 3. Comparar características visuales
      const visualComparison = await this.compareVisualFeatures(
        imagePath,
        trainingMatches
      );

      // 4. Calcular confianza mejorada
      const enhancedConfidence = this.calculateEnhancedConfidence(
        preliminaryConfidence,
        visualComparison,
        trainingMatches
      );

      // 5. Obtener mejor coincidencia
      const bestTrainingMatch = visualComparison.bestMatch;

      // 6. Actualizar estadísticas de uso
      if (bestTrainingMatch) {
        await this.updateTrainingImageUsage(bestTrainingMatch._id, enhancedConfidence > 70);
      }

      // 7. Construir análisis mejorado
      const enhancedAnalysis = {
        ...preliminaryAnalysis,
        confidence: enhancedConfidence,
        enhancedWithTraining: true,
        trainingData: {
          available: true,
          matchCount: trainingMatches.length,
          bestMatch: bestTrainingMatch ? {
            id: bestTrainingMatch._id,
            type: bestTrainingMatch.type,
            category: bestTrainingMatch.category,
            confidence: visualComparison.similarity,
            visualFeatures: bestTrainingMatch.visualFeatures,
            technicalData: bestTrainingMatch.technicalData
          } : null,
          allMatches: visualComparison.allMatches.slice(0, 5) // Top 5
        }
      };

      // 8. Agregar recomendaciones específicas basadas en entrenamiento
      if (bestTrainingMatch) {
        const recommendations = this.generateTrainingBasedRecommendations(
          bestTrainingMatch,
          enhancedConfidence
        );
        
        if (enhancedAnalysis.recommendations) {
          enhancedAnalysis.recommendations.unshift(...recommendations);
        } else {
          enhancedAnalysis.recommendations = recommendations;
        }
      }

      console.log(`✅ Análisis mejorado: ${enhancedAnalysis.category} (${enhancedConfidence}% de confianza)`);

      return {
        enhanced: true,
        originalAnalysis: preliminaryAnalysis,
        enhancedAnalysis,
        improvementDelta: enhancedConfidence - preliminaryConfidence
      };

    } catch (error) {
      console.error('Error en mejora con entrenamiento:', error);
      return {
        enhanced: false,
        originalAnalysis: preliminaryAnalysis,
        error: error.message
      };
    }
  }

  /**
   * Busca imágenes de entrenamiento que coincidan con la categoría
   */
  async findMatchingTrainingImages(category, exifData = null) {
    try {
      // Mapeo de categorías del análisis a categorías de entrenamiento
      const categoryMapping = {
        'aircraft': ['aircraft_commercial', 'aircraft_military', 'aircraft_private'],
        'aircraft_commercial': ['aircraft_commercial'],
        'aircraft_military': ['aircraft_military'],
        'drone': ['drone'],
        'helicopter': ['helicopter'],
        'balloon': ['balloon'],
        'satellite': ['satellite'],
        'bird': ['bird'],
        'natural': ['natural', 'atmospheric'],
        'celestial': ['celestial'],
        'lens_flare': ['lens_flare'],
        'weather': ['weather', 'atmospheric'],
        'unknown': ['unknown', 'other']
      };

      const mappedCategories = categoryMapping[category] || [category];

      // Buscar imágenes activas y verificadas
      const trainingImages = await TrainingImage.find({
        category: { $in: mappedCategories },
        isActive: true,
        verified: true
      })
      .sort({ 'usageStats.accuracy': -1, 'usageStats.matchCount': -1 })
      .limit(20);

      return trainingImages;

    } catch (error) {
      console.error('Error buscando imágenes de entrenamiento:', error);
      return [];
    }
  }

  /**
   * Compara características visuales de la imagen con las de entrenamiento
   * 
   * Nota: Esta es una implementación básica. Para producción se recomienda
   * usar un modelo de ML real (TensorFlow, PyTorch, etc.)
   */
  async compareVisualFeatures(imagePath, trainingImages) {
    try {
      // Extraer características básicas de la imagen analizada
      const imageFeatures = await this.extractBasicFeatures(imagePath);
      
      const comparisons = [];

      for (const trainingImg of trainingImages) {
        // Comparar características si existen
        const similarity = this.calculateFeatureSimilarity(
          imageFeatures,
          trainingImg.visualFeatures,
          trainingImg
        );

        comparisons.push({
          trainingImage: trainingImg,
          similarity,
          features: trainingImg.visualFeatures
        });
      }

      // Ordenar por similitud
      comparisons.sort((a, b) => b.similarity - a.similarity);

      return {
        bestMatch: comparisons[0]?.trainingImage || null,
        similarity: comparisons[0]?.similarity || 0,
        allMatches: comparisons.map(c => ({
          id: c.trainingImage._id,
          type: c.trainingImage.type,
          category: c.trainingImage.category,
          similarity: c.similarity,
          usageStats: c.trainingImage.usageStats
        }))
      };

    } catch (error) {
      console.error('Error comparando características visuales:', error);
      return {
        bestMatch: null,
        similarity: 0,
        allMatches: []
      };
    }
  }

  /**
   * Extrae características básicas de una imagen
   */
  async extractBasicFeatures(imagePath) {
    try {
      const metadata = await sharp(imagePath).metadata();
      const stats = await sharp(imagePath).stats();

      // Características básicas
      return {
        width: metadata.width,
        height: metadata.height,
        aspectRatio: metadata.width / metadata.height,
        format: metadata.format,
        channels: metadata.channels,
        dominantColors: this.extractDominantColors(stats),
        brightness: this.calculateBrightness(stats),
        contrast: this.calculateContrast(stats)
      };

    } catch (error) {
      console.error('Error extrayendo características:', error);
      return {};
    }
  }

  /**
   * Extrae colores dominantes de las estadísticas
   */
  extractDominantColors(stats) {
    const colors = [];
    
    if (stats.channels) {
      stats.channels.forEach((channel, index) => {
        const channelName = ['red', 'green', 'blue', 'alpha'][index];
        if (channelName !== 'alpha') {
          colors.push({
            channel: channelName,
            mean: channel.mean,
            std: channel.std
          });
        }
      });
    }

    return colors;
  }

  /**
   * Calcula el brillo promedio
   */
  calculateBrightness(stats) {
    if (!stats.channels || stats.channels.length < 3) return 0;
    
    const r = stats.channels[0].mean;
    const g = stats.channels[1].mean;
    const b = stats.channels[2].mean;
    
    // Fórmula de luminancia perceptual
    return (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  }

  /**
   * Calcula el contraste
   */
  calculateContrast(stats) {
    if (!stats.channels || stats.channels.length < 3) return 0;
    
    // Usar desviación estándar promedio como proxy de contraste
    const avgStd = stats.channels
      .slice(0, 3)
      .reduce((sum, ch) => sum + ch.std, 0) / 3;
    
    return avgStd / 255;
  }

  /**
   * Calcula similitud entre características
   */
  calculateFeatureSimilarity(imageFeatures, trainingFeatures, trainingImage) {
    let similarity = 50; // Base de 50%

    // Si no hay características de entrenamiento, usar solo estadísticas
    if (!trainingFeatures || Object.keys(trainingFeatures).length === 0) {
      // Usar estadísticas de uso como indicador
      const accuracy = trainingImage.usageStats?.accuracy || 0;
      const matchCount = trainingImage.usageStats?.matchCount || 0;
      
      return Math.min(50 + (accuracy * 0.3) + (Math.min(matchCount, 10) * 2), 90);
    }

    // Comparar aspect ratio si existe
    if (imageFeatures.aspectRatio && trainingFeatures.aspectRatio) {
      const aspectDiff = Math.abs(imageFeatures.aspectRatio - trainingFeatures.aspectRatio);
      similarity += (1 - Math.min(aspectDiff, 1)) * 10;
    }

    // Comparar colores dominantes
    if (imageFeatures.dominantColors && trainingFeatures.colors) {
      const colorMatch = this.compareColors(
        imageFeatures.dominantColors,
        trainingFeatures.colors
      );
      similarity += colorMatch * 15;
    }

    // Comparar brillo
    if (imageFeatures.brightness !== undefined && trainingFeatures.brightness) {
      const brightnessDiff = Math.abs(imageFeatures.brightness - parseFloat(trainingFeatures.brightness));
      similarity += (1 - brightnessDiff) * 10;
    }

    // Bonus por estadísticas de uso positivas
    if (trainingImage.usageStats) {
      const accuracyBonus = (trainingImage.usageStats.accuracy || 0) * 0.15;
      similarity += accuracyBonus;
    }

    return Math.min(Math.round(similarity), 95);
  }

  /**
   * Compara colores
   */
  compareColors(imageColors, trainingColors) {
    if (!Array.isArray(trainingColors) || trainingColors.length === 0) {
      return 0.5;
    }

    // Simplificación: contar coincidencias
    let matches = 0;
    const normalizedTrainingColors = trainingColors.map(c => c.toLowerCase());

    imageColors.forEach(colorData => {
      const channelName = colorData.channel;
      if (normalizedTrainingColors.includes(channelName) || 
          normalizedTrainingColors.includes(channelName + 'ish')) {
        matches++;
      }
    });

    return Math.min(matches / 3, 1);
  }

  /**
   * Calcula confianza mejorada
   */
  calculateEnhancedConfidence(originalConfidence, visualComparison, trainingMatches) {
    const similarity = visualComparison.similarity || 0;
    const matchCount = trainingMatches.length;
    const bestMatch = visualComparison.bestMatch;

    // Calcular peso del entrenamiento basado en cantidad de coincidencias
    const trainingWeight = Math.min(matchCount / 10, 0.5); // Máximo 50% de peso

    // Si hay una buena coincidencia, incrementar confianza
    let enhancedConfidence = originalConfidence;

    if (similarity > 70) {
      // Coincidencia fuerte: incremento significativo
      const increment = (similarity - 50) * trainingWeight;
      enhancedConfidence = Math.min(originalConfidence + increment, 95);
    } else if (similarity > 50) {
      // Coincidencia moderada: incremento menor
      const increment = (similarity - 30) * trainingWeight * 0.5;
      enhancedConfidence = Math.min(originalConfidence + increment, 85);
    }

    // Bonus por imagen de entrenamiento con alta precisión
    if (bestMatch && bestMatch.usageStats?.accuracy > 80) {
      enhancedConfidence += 5;
    }

    return Math.min(Math.round(enhancedConfidence), 95);
  }

  /**
   * Actualiza estadísticas de uso de imagen de entrenamiento
   */
  async updateTrainingImageUsage(trainingImageId, wasCorrect = true) {
    try {
      const trainingImage = await TrainingImage.findById(trainingImageId);
      if (!trainingImage) return;

      // Incrementar contador de uso
      await trainingImage.incrementUsage();

      // Actualizar precisión
      await trainingImage.updateAccuracy(wasCorrect);

      console.log(`   Estadísticas actualizadas para imagen de entrenamiento: ${trainingImage.type}`);

    } catch (error) {
      console.error('Error actualizando estadísticas de entrenamiento:', error);
    }
  }

  /**
   * Genera recomendaciones basadas en coincidencias de entrenamiento
   */
  generateTrainingBasedRecommendations(trainingMatch, confidence) {
    const recommendations = [];

    recommendations.push(
      `✅ COINCIDENCIA CON DATOS DE ENTRENAMIENTO: ${trainingMatch.type} (${confidence}% de confianza)`
    );

    if (trainingMatch.description) {
      recommendations.push(
        `📋 Descripción del objeto: ${trainingMatch.description.substring(0, 150)}...`
      );
    }

    if (trainingMatch.technicalData) {
      const tech = trainingMatch.technicalData;
      const specs = [];
      
      if (tech.manufacturer) specs.push(`Fabricante: ${tech.manufacturer}`);
      if (tech.model) specs.push(`Modelo: ${tech.model}`);
      if (tech.maxSpeed) specs.push(`Velocidad máx: ${tech.maxSpeed} km/h`);
      
      if (specs.length > 0) {
        recommendations.push(`🔧 Especificaciones: ${specs.join(', ')}`);
      }
    }

    if (trainingMatch.commonSightings) {
      const sightings = trainingMatch.commonSightings;
      if (sightings.timeOfDay && sightings.timeOfDay.length > 0) {
        recommendations.push(
          `⏰ Típicamente avistado: ${sightings.timeOfDay.join(', ')}`
        );
      }
    }

    if (trainingMatch.usageStats && trainingMatch.usageStats.accuracy > 80) {
      recommendations.push(
        `⭐ Esta coincidencia tiene ${trainingMatch.usageStats.accuracy}% de precisión basada en ${trainingMatch.usageStats.matchCount} análisis previos`
      );
    }

    return recommendations;
  }

  /**
   * Obtiene estadísticas del sistema de aprendizaje
   */
  async getTrainingStats() {
    try {
      const totalImages = await TrainingImage.countDocuments({ isActive: true });
      const verifiedImages = await TrainingImage.countDocuments({ isActive: true, verified: true });
      const categoryStats = await TrainingImage.getCategoryStats();
      
      const mostUsed = await TrainingImage.find({ isActive: true })
        .sort({ 'usageStats.matchCount': -1 })
        .limit(5)
        .select('type category usageStats');

      return {
        totalImages,
        verifiedImages,
        categoryStats,
        mostUsed,
        readyForUse: verifiedImages > 0
      };

    } catch (error) {
      console.error('Error obteniendo estadísticas:', error);
      return null;
    }
  }
}

module.exports = new TrainingLearningService();
