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

      // 7.5. Si hay una coincidencia fuerte, actualizar la descripción
      if (bestTrainingMatch && visualComparison.similarity > 70) {
        const originalDesc = enhancedAnalysis.description || '';
        enhancedAnalysis.description = `Identificado como ${bestTrainingMatch.type} con ${visualComparison.similarity}% de similitud basado en datos de entrenamiento. ${bestTrainingMatch.description || ''}`;
        
        // Actualizar categoría si es más específica
        if (bestTrainingMatch.category) {
          enhancedAnalysis.category = bestTrainingMatch.category;
        }
      }

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
        // Aeronaves
        'aircraft': ['aircraft_commercial', 'aircraft_military', 'aircraft_private'],
        'aircraft_commercial': ['aircraft_commercial'],
        'aircraft_military': ['aircraft_military'],
        'aircraft_private': ['aircraft_private'],
        'drone': ['drone'],
        'helicopter': ['helicopter'],
        'balloon': ['balloon'],
        'rocket': ['rocket'],
        
        // Espaciales
        'satellite': ['satellite'],
        'debris': ['debris'],
        'celestial': ['celestial'],
        
        // Naturales
        'bird': ['bird'],
        'natural': ['natural', 'atmospheric'],
        'weather': ['weather', 'atmospheric'],
        'atmospheric': ['atmospheric', 'natural', 'weather'],
        
        // Efectos ópticos
        'lens_flare': ['lens_flare', 'reflection_glass', 'reflection_vehicle', 'camera_artifact'],
        'reflection': ['reflection_glass', 'reflection_vehicle', 'lens_flare'],
        'reflection_glass': ['reflection_glass', 'reflection_vehicle'],
        'reflection_vehicle': ['reflection_vehicle', 'reflection_glass'],
        'artificial_light': ['artificial_light', 'light_trail'],
        'light_trail': ['light_trail', 'artificial_light'],
        'camera_artifact': ['camera_artifact', 'lens_flare'],
        
        // Otros
        'kite': ['kite'],
        'insect': ['insect'],
        'unknown': ['unknown', 'other'],
        'other': ['other', 'unknown']
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
   * NUEVO: Fusiona análisis visual + análisis textual de descripciones
   */
  async compareVisualFeatures(imagePath, trainingImages) {
    try {
      // Extraer características básicas de la imagen analizada
      const imageFeatures = await this.extractBasicFeatures(imagePath);
      
      const comparisons = [];

      for (const trainingImg of trainingImages) {
        // 1. SIMILITUD VISUAL (características de imagen)
        const visualSimilarity = this.calculateFeatureSimilarity(
          imageFeatures,
          trainingImg.visualFeatures,
          trainingImg
        );

        // 2. SIMILITUD TEXTUAL (análisis de descripción)
        const textualSimilarity = this.calculateTextualSimilarity(
          trainingImg.description,
          trainingImg.type,
          trainingImg.model,
          trainingImg.category
        );

        // 3. FUSIÓN: 70% visual + 30% textual
        const fusedSimilarity = (visualSimilarity * 0.7) + (textualSimilarity * 0.3);

        console.log(`   ${trainingImg.type}: Visual=${visualSimilarity}%, Text=${textualSimilarity}%, Fusión=${fusedSimilarity.toFixed(1)}%`);

        comparisons.push({
          trainingImage: trainingImg,
          similarity: Math.round(fusedSimilarity),
          visualScore: visualSimilarity,
          textualScore: textualSimilarity,
          features: trainingImg.visualFeatures
        });
      }

      // Ordenar por similitud fusionada
      comparisons.sort((a, b) => b.similarity - a.similarity);

      return {
        bestMatch: comparisons[0]?.trainingImage || null,
        similarity: comparisons[0]?.similarity || 0,
        allMatches: comparisons.map(c => ({
          id: c.trainingImage._id,
          type: c.trainingImage.type,
          model: c.trainingImage.model,
          category: c.trainingImage.category,
          similarity: c.similarity,
          visualScore: c.visualScore,
          textualScore: c.textualScore,
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
   * NUEVO: Calcula similitud basada en descripción textual
   * Analiza keywords, características mencionadas, contexto
   */
  calculateTextualSimilarity(description, type, model, category) {
    if (!description || description.trim().length < 10) {
      return 50; // Score neutro si no hay descripción
    }

    let score = 50; // Base
    const descLower = description.toLowerCase();

    // KEYWORDS DE ALTA RELEVANCIA
    const keywordGroups = {
      // Efectos ópticos (35 puntos)
      optical: {
        weight: 35,
        keywords: ['reflejo', 'reflection', 'cristal', 'glass', 'ventana', 'window', 
                  'parabrisas', 'windshield', 'espejo', 'mirror', 'lens', 'lente']
      },
      // Luces artificiales (35 puntos)
      lights: {
        weight: 35,
        keywords: ['luz', 'light', 'farola', 'streetlight', 'led', 'lámpara', 'lamp',
                  'edificio', 'building', 'torre', 'tower', 'artificial', 'iluminación']
      },
      // Características de forma (25 puntos)
      shape: {
        weight: 25,
        keywords: ['redondo', 'round', 'circular', 'elongado', 'triangular', 'rectangular',
                  'forma', 'shape', 'contorno', 'outline', 'silueta', 'silhouette']
      },
      // Movimiento (25 puntos)
      movement: {
        weight: 25,
        keywords: ['rápido', 'fast', 'lento', 'slow', 'estático', 'static', 'movimiento',
                  'movement', 'trayectoria', 'trajectory', 'velocidad', 'speed']
      },
      // Colores (20 puntos)
      colors: {
        weight: 20,
        keywords: ['blanco', 'white', 'rojo', 'red', 'verde', 'green', 'azul', 'blue',
                  'amarillo', 'yellow', 'naranja', 'orange', 'color', 'bright', 'brillante']
      },
      // Condiciones (15 puntos)
      conditions: {
        weight: 15,
        keywords: ['noche', 'night', 'día', 'day', 'nublado', 'cloudy', 'despejado', 'clear',
                  'oscuro', 'dark', 'claro', 'bright', 'crepúsculo', 'dusk']
      }
    };

    // Analizar cada grupo de keywords
    for (const [groupName, groupData] of Object.entries(keywordGroups)) {
      let matchCount = 0;
      for (const keyword of groupData.keywords) {
        if (descLower.includes(keyword)) {
          matchCount++;
        }
      }
      
      if (matchCount > 0) {
        // Bonus proporcional a coincidencias
        const bonus = Math.min((matchCount / groupData.keywords.length) * groupData.weight, groupData.weight);
        score += bonus;
      }
    }

    // BONUS: Si menciona el tipo/modelo específico
    if (type && descLower.includes(type.toLowerCase())) {
      score += 15;
    }
    if (model && descLower.includes(model.toLowerCase())) {
      score += 10;
    }

    // BONUS: Descripción larga y detallada (indica calidad)
    if (description.length > 200) {
      score += 10;
    } else if (description.length > 100) {
      score += 5;
    }

    // BONUS: Menciona características técnicas
    const technicalTerms = ['focal', 'iso', 'exposición', 'exposure', 'aperture', 'shutter', 
                           'mm', 'segundos', 'seconds', 'metros', 'meters'];
    const technicalMatches = technicalTerms.filter(term => descLower.includes(term)).length;
    if (technicalMatches > 0) {
      score += Math.min(technicalMatches * 3, 15);
    }

    return Math.min(Math.round(score), 95);
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
    let similarity = 40; // Base más baja para exigir coincidencias reales

    // Si no hay características auto-extraídas, usar solo estadísticas
    if (!trainingFeatures || !trainingFeatures.autoExtracted) {
      const accuracy = trainingImage.usageStats?.accuracy || 0;
      const matchCount = trainingImage.usageStats?.matchCount || 0;
      
      return Math.min(40 + (accuracy * 0.3) + (Math.min(matchCount, 10) * 2), 75);
    }

    const autoFeatures = trainingFeatures.autoExtracted;
    let totalWeight = 0;
    let matchedWeight = 0;

    // 1. ASPECT RATIO (peso: 20) - Muy importante para forma
    if (imageFeatures.aspectRatio && autoFeatures.aspectRatio) {
      totalWeight += 20;
      const imgRatio = parseFloat(imageFeatures.aspectRatio);
      const trainRatio = parseFloat(autoFeatures.aspectRatio);
      const ratioDiff = Math.abs(imgRatio - trainRatio);
      
      // Tolerancia: diferencia < 0.2 = match perfecto
      if (ratioDiff < 0.2) {
        matchedWeight += 20;
      } else if (ratioDiff < 0.5) {
        matchedWeight += 15;
      } else if (ratioDiff < 1.0) {
        matchedWeight += 10;
      } else {
        matchedWeight += 5;
      }
    }

    // 2. BRIGHTNESS (peso: 15) - Importante para iluminación
    if (imageFeatures.brightness !== undefined && autoFeatures.brightness) {
      totalWeight += 15;
      const imgBright = parseFloat(imageFeatures.brightness);
      const trainBright = parseFloat(autoFeatures.brightness);
      const brightDiff = Math.abs(imgBright - trainBright);
      
      // Tolerancia: diferencia < 0.1 = match muy bueno
      if (brightDiff < 0.1) {
        matchedWeight += 15;
      } else if (brightDiff < 0.2) {
        matchedWeight += 12;
      } else if (brightDiff < 0.3) {
        matchedWeight += 8;
      } else {
        matchedWeight += 4;
      }
    }

    // 3. CONTRAST (peso: 15) - Importante para textura
    if (imageFeatures.contrast !== undefined && autoFeatures.contrast) {
      totalWeight += 15;
      const imgContrast = parseFloat(imageFeatures.contrast);
      const trainContrast = parseFloat(autoFeatures.contrast);
      const contrastDiff = Math.abs(imgContrast - trainContrast);
      
      if (contrastDiff < 0.1) {
        matchedWeight += 15;
      } else if (contrastDiff < 0.2) {
        matchedWeight += 12;
      } else if (contrastDiff < 0.3) {
        matchedWeight += 8;
      } else {
        matchedWeight += 4;
      }
    }

    // 4. DOMINANT COLORS (peso: 25) - Muy importante
    if (imageFeatures.dominantColors && autoFeatures.dominantColors) {
      totalWeight += 25;
      const colorSimilarity = this.compareColorChannels(
        imageFeatures.dominantColors,
        autoFeatures.dominantColors
      );
      matchedWeight += colorSimilarity * 25;
    }

    // 5. SIZE SIMILARITY (peso: 10) - Resolución similar puede indicar equipo similar
    if (imageFeatures.width && autoFeatures.width && 
        imageFeatures.height && autoFeatures.height) {
      totalWeight += 10;
      const imgArea = imageFeatures.width * imageFeatures.height;
      const trainArea = autoFeatures.width * autoFeatures.height;
      const areaDiff = Math.abs(imgArea - trainArea) / Math.max(imgArea, trainArea);
      
      if (areaDiff < 0.2) {
        matchedWeight += 10;
      } else if (areaDiff < 0.5) {
        matchedWeight += 7;
      } else {
        matchedWeight += 4;
      }
    }

    // Calcular similitud final
    const calculatedSimilarity = totalWeight > 0 
      ? (matchedWeight / totalWeight) * 100
      : 40;

    // Bonus por estadísticas de uso positivas
    let finalSimilarity = calculatedSimilarity;
    if (trainingImage.usageStats && trainingImage.usageStats.accuracy > 70) {
      finalSimilarity += (trainingImage.usageStats.accuracy - 70) * 0.2;
    }

    // Bonus por muchos usos exitosos
    if (trainingImage.usageStats && trainingImage.usageStats.matchCount > 5) {
      finalSimilarity += Math.min(trainingImage.usageStats.matchCount, 20) * 0.5;
    }

    return Math.min(Math.round(finalSimilarity), 95);
  }

  /**
   * Compara canales de color
   */
  compareColorChannels(imageColors, trainingColors) {
    if (!Array.isArray(imageColors) || !Array.isArray(trainingColors)) {
      return 0.5;
    }

    let totalDiff = 0;
    let channelCount = 0;

    // Comparar cada canal RGB
    ['red', 'green', 'blue'].forEach(channel => {
      const imgChannel = imageColors.find(c => c.channel === channel);
      const trainChannel = trainingColors.find(c => c.channel === channel);

      if (imgChannel && trainChannel) {
        const meanDiff = Math.abs(imgChannel.mean - trainChannel.mean) / 255;
        totalDiff += meanDiff;
        channelCount++;
      }
    });

    if (channelCount === 0) return 0.5;

    // Invertir: menor diferencia = mayor similitud
    const avgDiff = totalDiff / channelCount;
    return Math.max(0, 1 - avgDiff);
  }

  /**
   * Calcula confianza mejorada
   */
  calculateEnhancedConfidence(originalConfidence, visualComparison, trainingMatches) {
    const similarity = visualComparison.similarity || 0;
    const matchCount = trainingMatches.length;
    const bestMatch = visualComparison.bestMatch;

    console.log(`   Similitud visual: ${similarity}%`);
    console.log(`   Imágenes de entrenamiento disponibles: ${matchCount}`);

    // Calcular peso del entrenamiento basado en cantidad y calidad
    const qualityWeight = similarity / 100; // 0 a 1
    const quantityWeight = Math.min(matchCount / 10, 1); // Máximo 1 con 10+ imágenes
    const trainingWeight = (qualityWeight * 0.7 + quantityWeight * 0.3); // Priorizar calidad

    console.log(`   Peso de entrenamiento: ${(trainingWeight * 100).toFixed(1)}%`);

    let enhancedConfidence = originalConfidence;

    // CASO 1: Coincidencia muy fuerte (>80%)
    if (similarity > 80) {
      const boost = 30 + (similarity - 80) * 0.5; // Boost de 30-40%
      enhancedConfidence = Math.min(originalConfidence + boost, 95);
      console.log(`   ✨ Coincidencia muy fuerte: +${boost.toFixed(1)}% confianza`);
    }
    // CASO 2: Coincidencia fuerte (70-80%)
    else if (similarity > 70) {
      const boost = 20 + (similarity - 70) * 0.8;
      enhancedConfidence = Math.min(originalConfidence + boost, 90);
      console.log(`   ✅ Coincidencia fuerte: +${boost.toFixed(1)}% confianza`);
    }
    // CASO 3: Coincidencia moderada-alta (60-70%)
    else if (similarity > 60) {
      const boost = 12 + (similarity - 60) * 0.8;
      enhancedConfidence = Math.min(originalConfidence + boost, 85);
      console.log(`   📊 Coincidencia moderada-alta: +${boost.toFixed(1)}% confianza`);
    }
    // CASO 4: Coincidencia moderada (50-60%)
    else if (similarity > 50) {
      const boost = 5 + (similarity - 50) * 0.7;
      enhancedConfidence = Math.min(originalConfidence + boost, 80);
      console.log(`   📈 Coincidencia moderada: +${boost.toFixed(1)}% confianza`);
    }
    // CASO 5: Coincidencia baja (<50%) - no mejorar mucho
    else {
      const boost = similarity * 0.1;
      enhancedConfidence = Math.min(originalConfidence + boost, 75);
      console.log(`   ⚠️ Coincidencia baja: +${boost.toFixed(1)}% confianza`);
    }

    // Bonus adicional por imagen con historial confiable
    if (bestMatch && bestMatch.usageStats) {
      const accuracy = bestMatch.usageStats.accuracy || 0;
      const matchCount = bestMatch.usageStats.matchCount || 0;
      
      if (accuracy > 80 && matchCount > 5) {
        const reliabilityBonus = 5;
        enhancedConfidence = Math.min(enhancedConfidence + reliabilityBonus, 95);
        console.log(`   ⭐ Bonus por historial confiable: +${reliabilityBonus}%`);
      }
    }

    // Si hay múltiples coincidencias fuertes, aumentar confianza
    const strongMatches = visualComparison.allMatches.filter(m => m.similarity > 70).length;
    if (strongMatches > 1) {
      const consensusBonus = Math.min(strongMatches * 2, 8);
      enhancedConfidence = Math.min(enhancedConfidence + consensusBonus, 95);
      console.log(`   🤝 Consenso de ${strongMatches} imágenes: +${consensusBonus}%`);
    }

    const finalConfidence = Math.min(Math.round(enhancedConfidence), 95);
    console.log(`   🎯 Confianza final: ${originalConfidence}% → ${finalConfidence}%`);

    return finalConfidence;
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
