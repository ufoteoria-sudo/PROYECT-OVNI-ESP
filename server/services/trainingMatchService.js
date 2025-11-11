const sharp = require('sharp');
const path = require('path');
const TrainingImage = require('../models/TrainingImage');

/**
 * Servicio de Matching con Imágenes de Training
 * 
 * Compara una imagen subida con el dataset de training usando:
 * 1. Análisis visual: colores dominantes, histogramas, dimensiones
 * 2. Similitud textual: keywords, descripción, tipo
 * 3. Score combinado ponderado
 */

class TrainingMatchService {
  /**
   * Analiza imagen subida y busca matches en training
   * @param {string} imagePath - Ruta de la imagen subida
   * @param {object} exifData - Datos EXIF extraídos
   * @param {object} aiContext - Contexto del análisis AI (tags, descripción)
   * @returns {object} - { bestMatch, allMatches, matchFound }
   */
  static async findMatches(imagePath, exifData = {}, aiContext = {}) {
    try {
      console.log('🔍 TrainingMatchService: Iniciando búsqueda de matches...');

      // 1. Extraer características visuales de la imagen subida
      const visualFeatures = await this.extractVisualFeatures(imagePath);
      console.log('📊 Características visuales extraídas:', {
        dominantColors: visualFeatures.dominantColors.slice(0, 3),
        dimensions: visualFeatures.dimensions
      });

      // 2. Obtener todas las imágenes activas de training
      const trainingImages = await TrainingImage.find({ isActive: true })
        .select('category type model description keywords tags visualFeatures imageUrl')
        .lean();

      console.log(`📚 Comparando con ${trainingImages.length} imágenes de training...`);

      if (trainingImages.length === 0) {
        return {
          matchFound: false,
          bestMatch: null,
          allMatches: [],
          message: 'No hay imágenes de training disponibles'
        };
      }

      // 3. Calcular scores para cada imagen de training
      const matches = [];
      for (const trainingImg of trainingImages) {
        const score = await this.calculateMatchScore(
          visualFeatures,
          aiContext,
          trainingImg
        );

        if (score.total >= 40) { // Solo guardar matches con score >= 40%
          matches.push({
            trainingImageId: trainingImg._id,
            category: trainingImg.category,
            type: trainingImg.type,
            model: trainingImg.model,
            description: trainingImg.description,
            matchScore: Math.round(score.total),
            breakdown: score.breakdown,
            imageUrl: trainingImg.imageUrl
          });
        }
      }

      // 4. Ordenar por score descendente
      matches.sort((a, b) => b.matchScore - a.matchScore);

      const bestMatch = matches[0] || null;
      const matchFound = bestMatch && bestMatch.matchScore >= 60;

      console.log(`✅ Matches encontrados: ${matches.length}`);
      if (bestMatch) {
        console.log(`🎯 Mejor match: ${bestMatch.type} (${bestMatch.category}) - ${bestMatch.matchScore}%`);
      }

      return {
        matchFound,
        bestMatch,
        allMatches: matches.slice(0, 5), // Top 5 matches
        totalCandidates: trainingImages.length
      };

    } catch (error) {
      console.error('❌ Error en TrainingMatchService:', error);
      return {
        matchFound: false,
        bestMatch: null,
        allMatches: [],
        error: error.message
      };
    }
  }

  /**
   * Extrae características visuales de una imagen
   */
  static async extractVisualFeatures(imagePath) {
    try {
      const image = sharp(imagePath);
      const metadata = await image.metadata();
      const stats = await image.stats();

      // Colores dominantes (promedio de canales RGB)
      const dominantColors = stats.channels.map(channel => ({
        mean: Math.round(channel.mean),
        std: Math.round(channel.std),
        min: channel.min,
        max: channel.max
      }));

      // Dimensiones
      const dimensions = {
        width: metadata.width,
        height: metadata.height,
        aspectRatio: (metadata.width / metadata.height).toFixed(2)
      };

      // Brillo promedio (luminosidad)
      const brightness = Math.round(
        (dominantColors[0].mean + dominantColors[1].mean + dominantColors[2].mean) / 3
      );

      return {
        dominantColors,
        dimensions,
        brightness,
        format: metadata.format
      };

    } catch (error) {
      console.error('Error extrayendo características visuales:', error);
      return {
        dominantColors: [],
        dimensions: {},
        brightness: 0
      };
    }
  }

  /**
   * Calcula score de similitud entre imagen subida y training
   * @returns {object} - { total, breakdown: { visual, textual, context } }
   */
  static async calculateMatchScore(visualFeatures, aiContext, trainingImg) {
    const scores = {
      visual: 0,
      textual: 0,
      context: 0
    };

    // 1. SCORE VISUAL (50% del total)
    if (trainingImg.visualFeatures && visualFeatures.dominantColors.length > 0) {
      // Comparar colores dominantes (similaridad de RGB)
      if (trainingImg.visualFeatures.colors && trainingImg.visualFeatures.colors.length > 0) {
        const colorSimilarity = this.compareColors(
          visualFeatures.dominantColors,
          trainingImg.visualFeatures.colors
        );
        scores.visual += colorSimilarity * 0.6; // 30% del score total
      }

      // Comparar brillo
      const brightnessSimilarity = this.compareBrightness(
        visualFeatures.brightness,
        trainingImg.visualFeatures.brightness || 128
      );
      scores.visual += brightnessSimilarity * 0.2; // 10% del score total

      // Comparar aspect ratio
      const aspectRatioSimilarity = this.compareAspectRatio(
        visualFeatures.dimensions.aspectRatio,
        trainingImg.visualFeatures.aspectRatio || '1.0'
      );
      scores.visual += aspectRatioSimilarity * 0.2; // 10% del score total
    }

    // 2. SCORE TEXTUAL (40% del total)
    const textualContext = {
      keywords: [
        ...(aiContext.tags || []),
        ...(aiContext.description ? aiContext.description.toLowerCase().split(' ') : [])
      ],
      description: aiContext.description || ''
    };

    if (trainingImg.keywords && trainingImg.keywords.length > 0) {
      const keywordSimilarity = this.compareKeywords(
        textualContext.keywords,
        trainingImg.keywords
      );
      scores.textual += keywordSimilarity * 0.7; // 28% del score total
    }

    if (trainingImg.tags && trainingImg.tags.length > 0) {
      const tagSimilarity = this.compareKeywords(
        textualContext.keywords,
        trainingImg.tags
      );
      scores.textual += tagSimilarity * 0.3; // 12% del score total
    }

    // 3. SCORE CONTEXTUAL (10% del total)
    // Coincidencia de categorías sugeridas por AI
    if (aiContext.suggestedCategories && aiContext.suggestedCategories.includes(trainingImg.category)) {
      scores.context = 10; // 10% del score total
    }

    // Calcular total ponderado
    const total = (scores.visual * 0.5) + (scores.textual * 0.4) + (scores.context * 0.1);

    return {
      total: Math.min(100, total), // Cap a 100%
      breakdown: {
        visual: Math.round(scores.visual * 0.5),
        textual: Math.round(scores.textual * 0.4),
        context: Math.round(scores.context * 0.1)
      }
    };
  }

  /**
   * Compara colores dominantes (RGB similarity)
   */
  static compareColors(colors1, colors2) {
    if (!colors1 || !colors2 || colors1.length === 0 || colors2.length === 0) {
      return 0;
    }

    // Convertir colores2 (strings hex o nombres) a valores aproximados
    const color2Values = colors2.map(c => {
      if (typeof c === 'string') {
        // Mapeo simple de nombres de colores comunes a valores RGB
        const colorMap = {
          'rojo': 200, 'red': 200,
          'azul': 100, 'blue': 100,
          'verde': 100, 'green': 100,
          'amarillo': 200, 'yellow': 200,
          'blanco': 255, 'white': 255,
          'negro': 0, 'black': 0,
          'gris': 128, 'gray': 128, 'grey': 128,
          'naranja': 200, 'orange': 200,
          'plateado': 192, 'silver': 192,
          'dorado': 215, 'gold': 215
        };
        return colorMap[c.toLowerCase()] || 128;
      }
      return c;
    });

    // Calcular diferencia promedio entre colores
    const avgColor1 = colors1.reduce((sum, c) => sum + c.mean, 0) / colors1.length;
    const avgColor2 = color2Values.reduce((sum, c) => sum + c, 0) / color2Values.length;

    const difference = Math.abs(avgColor1 - avgColor2);
    const similarity = Math.max(0, 100 - (difference / 255 * 100));

    return similarity;
  }

  /**
   * Compara brillo de imágenes
   */
  static compareBrightness(brightness1, brightness2) {
    const difference = Math.abs(brightness1 - brightness2);
    const similarity = Math.max(0, 100 - (difference / 255 * 100));
    return similarity;
  }

  /**
   * Compara aspect ratio
   */
  static compareAspectRatio(ratio1, ratio2) {
    const r1 = parseFloat(ratio1);
    const r2 = parseFloat(ratio2);
    const difference = Math.abs(r1 - r2);
    const similarity = Math.max(0, 100 - (difference * 100));
    return Math.min(100, similarity);
  }

  /**
   * Compara keywords/tags usando coincidencia exacta y parcial
   */
  static compareKeywords(keywords1, keywords2) {
    if (!keywords1 || !keywords2 || keywords1.length === 0 || keywords2.length === 0) {
      return 0;
    }

    // Normalizar keywords (lowercase, trim)
    const k1 = keywords1.map(k => String(k).toLowerCase().trim()).filter(k => k.length > 2);
    const k2 = keywords2.map(k => String(k).toLowerCase().trim()).filter(k => k.length > 2);

    if (k1.length === 0 || k2.length === 0) {
      return 0;
    }

    // Contar coincidencias exactas
    let exactMatches = 0;
    let partialMatches = 0;

    k1.forEach(keyword1 => {
      k2.forEach(keyword2 => {
        if (keyword1 === keyword2) {
          exactMatches++;
        } else if (keyword1.includes(keyword2) || keyword2.includes(keyword1)) {
          partialMatches++;
        }
      });
    });

    // Score: coincidencias exactas valen más que parciales
    const score = ((exactMatches * 2) + partialMatches) / Math.max(k1.length, k2.length) * 50;

    return Math.min(100, score);
  }
}

module.exports = TrainingMatchService;
