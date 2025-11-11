const fs = require('fs');
const path = require('path');
const UFODatabase = require('../models/UFODatabase');
const imageAnalysisService = require('./imageAnalysisService');

/**
 * Servicio de análisis visual basado en comparación con base de datos
 * VERSIÓN 2.0: Incluye análisis REAL de la imagen, no solo EXIF
 */

/**
 * Analiza una imagen comparándola con objetos conocidos
 * @param {string} filePath - Ruta de la imagen
 * @param {Object} exifData - Datos EXIF ya extraídos
 * @returns {Object} Resultado del análisis
 */
async function analyzeImageByComparison(filePath, exifData = {}) {
  try {
    console.log('🔍 Analizando imagen por comparación visual (v4.0 + Patterns)...');

    // 1. NUEVO: Análisis visual REAL de la imagen
    const visualAnalysis = await imageAnalysisService.analyzeImageVisually(filePath);
    console.log('📊 Análisis visual completado:', visualAnalysis ? '✓' : '✗');

    // 2. Extraer características básicas de EXIF
    const imageFeatures = await extractImageFeatures(filePath, exifData, visualAnalysis);
    console.log('📊 Características extraídas');

    // 3. Buscar coincidencias en la base de datos
    const matches = await findMatches(imageFeatures);
    console.log(`🎯 Encontradas ${matches.length} coincidencias potenciales`);

    // 3. Calcular mejor coincidencia
    const bestMatch = matches.length > 0 ? matches[0] : null;

    // 4. CRÍTICO: Si el mejor match tiene score muy bajo, posiblemente no hay objeto
    let category = 'unknown';
    let confidence = 20;
    let description = '';
    
    if (bestMatch && bestMatch.matchPercentage >= 50) {
      // Match confiable
      category = bestMatch.category;
      confidence = bestMatch.matchPercentage;
      description = generateDescription(imageFeatures, bestMatch);
    } else if (bestMatch && bestMatch.matchPercentage >= 30 && bestMatch.matchPercentage < 50) {
      // Match débil - mencionar incertidumbre
      category = bestMatch.category;
      confidence = bestMatch.matchPercentage;
      description = `Posible coincidencia con ${bestMatch.objectName} con baja confianza (${bestMatch.matchPercentage}%). ` +
                    `La imagen puede no contener objetos claros, o el objeto presente no coincide significativamente con la base de datos. ` +
                    generateDescription(imageFeatures, bestMatch);
    } else {
      // Sin matches confiables - probablemente imagen vacía o sin objetos conocidos
      category = 'unknown';
      confidence = 15;
      description = `No se detectaron objetos conocidos en la imagen con suficiente confianza. ` +
                    `Posibles razones: ` +
                    `1) La imagen muestra cielo vacío sin objetos. ` +
                    `2) El objeto presente no está en nuestra base de datos de ${await UFODatabase.countDocuments()} objetos conocidos. ` +
                    `3) La calidad de la imagen no permite identificación precisa. ` +
                    `Características detectadas: ${describeFeatures(imageFeatures)}`;
    }

    // 5. Actualizar estadísticas de matching (solo si confianza >= 50%)
    if (bestMatch && bestMatch.objectId && confidence >= 50) {
      await UFODatabase.findByIdAndUpdate(
        bestMatch.objectId,
        { $inc: { matchCount: 1 } }
      );
    }

    return {
      success: true,
      data: {
        provider: 'visual_comparison',
        model: 'Feature Matching v4.0 + Visual Patterns',
        description,
        detectedObjects: confidence >= 30 ? matches.slice(0, 3).map(m => m.objectName) : [],
        confidence,
        category,
        isUnusual: confidence < 60,
        unusualFeatures: getUnusualFeatures(imageFeatures, bestMatch),
        recommendations: generateRecommendations(imageFeatures, bestMatch, confidence),
        processedDate: new Date(),
        rawResponse: {
          imageFeatures,
          allMatches: matches,
          bestMatch,
          dbObjectCount: await UFODatabase.countDocuments()
        }
      }
    };

  } catch (error) {
    console.error('❌ Error en análisis por comparación:', error);
    return {
      success: false,
      error: `Error al analizar imagen: ${error.message}`
    };
  }
}

/**
 * Extrae características básicas de la imagen (EXIF + ANÁLISIS VISUAL)
 */
async function extractImageFeatures(filePath, exifData, visualAnalysis) {
  const stats = fs.statSync(filePath);
  const ext = path.extname(filePath).toLowerCase();

  // Características básicas extraíbles sin procesamiento de imagen complejo
  const features = {
    // Tiempo y ubicación (de EXIF)
    hasLocation: !!(exifData?.location?.latitude),
    hasTimestamp: !!exifData?.captureDate,
    timeOfDay: determineTimeOfDay(exifData?.captureDate),
    location: exifData?.location,
    captureDate: exifData?.captureDate,
    
    // Características del archivo
    fileSize: stats.size,
    fileType: ext,
    
    // Características de captura (de EXIF) - AMPLIADAS
    hasFlash: exifData?.flash || false,
    iso: exifData?.iso,
    exposureTime: exifData?.shutterSpeed,
    focalLength: exifData?.focalLength,
    aperture: exifData?.aperture,
    cameraModel: exifData?.cameraModel,
    lensMake: exifData?.lensMake,
    
    // Inferencias basadas en EXIF
    isNightShot: isNightPhotography(exifData),
    isLongExposure: isLongExposure(exifData),
    isZoomed: isZoomedPhoto(exifData),
    isWideLens: isWideLens(exifData),
    isMovingCamera: exifData?.isManipulated || false,
    
    // NUEVO: Características del análisis visual REAL
    visualAnalysis: visualAnalysis || null,
    hasVisualData: !!visualAnalysis,
    
    // Inferencias del análisis visual
    hasObjectInImage: visualAnalysis?.objectDetection?.hasDefinedObject || false,
    objectLikelihood: visualAnalysis?.objectDetection?.objectLikelihood || 'unknown',
    isSkyImage: visualAnalysis?.skyAnalysis?.appearsToBeSky || false,
    skyType: visualAnalysis?.skyAnalysis?.skyType || 'unknown',
    dominantColor: visualAnalysis?.colorAnalysis?.dominantColor || 'unknown',
    isDarkImage: visualAnalysis?.luminosity?.isDark || false,
    isBrightImage: visualAnalysis?.luminosity?.isBright || false,
    hasBrightSpots: visualAnalysis?.luminosity?.brightSpotsPercent > 1 || false,
    hasHighContrast: visualAnalysis?.luminosity?.hasHighContrast || false,
    hasCentralObject: visualAnalysis?.composition?.hasCentralObject || false,
    
    // NUEVO: Pasar datos EXIF completos para detección de manipulación
    exifData: exifData || {},
    
    // Contexto
    altitude: exifData?.location?.altitude || 'unknown',
    weather: 'unknown' // Podría integrarse con API de clima
  };

  return features;
}

/**
 * Determina la hora del día basándose en fecha de captura
 */
function determineTimeOfDay(captureDate) {
  if (!captureDate) return 'unknown';
  
  const date = new Date(captureDate);
  const hour = date.getHours();
  
  if (hour >= 6 && hour < 12) return 'amanecer';
  if (hour >= 12 && hour < 18) return 'día';
  if (hour >= 18 && hour < 21) return 'atardecer';
  return 'noche';
}

/**
 * Detecta si es fotografía nocturna
 */
function isNightPhotography(exifData) {
  if (!exifData) return false;
  
  // ISO alto + apertura grande = foto nocturna
  const highISO = exifData.iso && exifData.iso > 800;
  const timeOfDay = determineTimeOfDay(exifData.captureDate);
  
  return highISO || timeOfDay === 'noche';
}

/**
 * Detecta si es larga exposición
 */
function isLongExposure(exifData) {
  if (!exifData?.shutterSpeed) return false;
  
  // Parsear tiempo de exposición (ej: "1/60", "2s")
  const shutter = exifData.shutterSpeed;
  if (shutter.includes('s') && !shutter.includes('/')) {
    const seconds = parseFloat(shutter);
    return seconds >= 1;
  }
  
  if (shutter.includes('/')) {
    const [num, denom] = shutter.split('/').map(Number);
    return denom <= 10; // 1/10 o más lento
  }
  
  return false;
}

/**
 * Detecta si se usó zoom/teleobjetivo
 */
function isZoomedPhoto(exifData) {
  if (!exifData?.focalLength) return false;
  
  const focal = parseInt(exifData.focalLength);
  return focal > 100; // > 100mm = teleobjetivo
}

/**
 * Detecta si es lente gran angular
 */
function isWideLens(exifData) {
  if (!exifData?.focalLength) return false;
  
  const focal = parseInt(exifData.focalLength);
  return focal < 35; // < 35mm = gran angular
}

/**
 * Busca coincidencias en la base de datos
 */
async function findMatches(imageFeatures) {
  try {
    // Obtener todos los objetos activos
    const allObjects = await UFODatabase.find({ isActive: true });
    
    // Calcular score de similitud para cada objeto
    const scoredObjects = allObjects.map(obj => {
      const score = calculateSimilarityScore(imageFeatures, obj);
      return {
        objectId: obj._id,
        objectName: obj.name,
        category: obj.category,
        matchPercentage: score,
        matchReason: generateMatchReason(imageFeatures, obj, score),
        visualSimilarity: score
      };
    });

    // Ordenar por score y filtrar los que tienen score > 30
    return scoredObjects
      .filter(obj => obj.matchPercentage >= 30)
      .sort((a, b) => b.matchPercentage - a.matchPercentage)
      .slice(0, 5); // Top 5 coincidencias

  } catch (error) {
    console.error('Error al buscar coincidencias:', error);
    return [];
  }
}

/**
 * Calcula score de similitud entre características y objeto
 * VERSIÓN 4.0: Visual + VisualPatterns matching + EXIF + Context
 * Pesos: 40% Visual (incluyendo patterns), 25% EXIF, 20% Context, 15% Penalties
 */
function calculateSimilarityScore(features, object) {
  let score = 0;
  let maxScore = 0;

  // ========== ANÁLISIS VISUAL (40% del peso total) ==========
  
  // 1. CRÍTICO: ¿Hay objeto en la imagen? (peso: 25)
  maxScore += 25;
  if (features.hasVisualData) {
    if (features.hasObjectInImage) {
      // Hay objeto - todos los objetos físicos son candidatos
      if (object.category !== 'natural' || object.name.includes('Lens Flare') || object.name.includes('Orbe')) {
        score += 25;
      } else {
        score += 15; // Fenómenos naturales ambiguos
      }
    } else {
      // NO hay objeto claro - favorece cielo vacío o artefactos fotográficos
      if (object.category === 'natural' && (object.name.includes('Lens Flare') || object.name.includes('Orbe') || object.name.includes('Pixel'))) {
        score += 20;
      } else {
        score += 5; // Penalizar objetos físicos si no se ve nada
      }
    }
  } else {
    score += 12; // Sin análisis visual, neutral
  }

  // 2. Color dominante (peso: 15)
  maxScore += 15;
  if (features.dominantColor && features.dominantColor !== 'unknown') {
    const objectColors = object.characteristics?.color || [];
    // Mapeo de colores
    const colorMatch = {
      'white': ['blanco', 'plateado'],
      'gray': ['gris', 'negro'],
      'black': ['negro'],
      'red': ['rojo', 'naranja'],
      'orange': ['naranja', 'rojo'],
      'yellow': ['amarillo', 'dorado'],
      'green': ['verde'],
      'blue': ['azul'],
      'purple': ['púrpura', 'violeta']
    };

    const matchingColors = colorMatch[features.dominantColor] || [];
    const hasColorMatch = objectColors.some(color => 
      matchingColors.some(mc => color.toLowerCase().includes(mc))
    );

    if (hasColorMatch) {
      score += 15;
    } else if (features.dominantColor === 'blue' && object.category === 'celestial') {
      score += 10; // Cielo azul con objetos celestiales
    }
  }

  // 3. Tipo de cielo detectado (peso: 15)
  maxScore += 15;
  if (features.isSkyImage) {
    // Es imagen de cielo
    if (features.skyType === 'night' || features.isDarkImage) {
      // Cielo nocturno
      if (['celestial', 'satellite', 'uap', 'aircraft'].includes(object.category)) {
        score += 15;
      }
    } else if (features.skyType === 'daytime') {
      // Cielo diurno
      if (['aircraft', 'bird', 'balloon', 'natural'].includes(object.category)) {
        score += 15;
      }
    } else if (features.skyType === 'cloudy') {
      // Nublado - dificulta identificación
      if (object.category === 'natural' && object.name.includes('Nube')) {
        score += 15;
      } else {
        score += 7;
      }
    }
  } else {
    // NO es cielo - podría ser interior, objeto muy cercano, etc.
    if (['drone', 'natural'].includes(object.category)) {
      score += 10;
    }
  }

  // 4. Puntos brillantes (luces) (peso: 15)
  maxScore += 15;
  if (features.hasBrightSpots) {
    // Hay puntos brillantes - favorece objetos con luces
    if (['aircraft', 'drone', 'satellite', 'celestial'].includes(object.category)) {
      score += 15;
    } else if (object.category === 'balloon' && object.name.includes('Sky Lantern')) {
      score += 12;
    } else if (object.category === 'natural' && object.name.includes('Lens Flare')) {
      score += 10;
    }
  } else {
    // Sin luces brillantes
    if (['bird', 'natural', 'balloon'].includes(object.category) && !object.name.includes('Sky Lantern')) {
      score += 10;
    }
  }

  // 5. Objeto central prominente (peso: 10)
  maxScore += 10;
  if (features.hasCentralObject) {
    // Hay algo en el centro - favorece objetos únicos vs fenómenos
    if (['aircraft', 'drone', 'balloon', 'celestial', 'uap'].includes(object.category)) {
      score += 10;
    } else if (object.category === 'natural' && !object.name.includes('Nube')) {
      score += 5;
    }
  }

  // 5b. NUEVO: Visual Patterns Matching (peso: 20) - APROVECHA BD MASIVA
  maxScore += 20;
  if (features.hasVisualData && object.visualPatterns && object.visualPatterns.length > 0) {
    const imagePatterns = [];
    
    // Construir patrones de la imagen
    if (features.dominantColor && features.dominantColor !== 'unknown') {
      imagePatterns.push(features.dominantColor);
    }
    
    // Extraer shape del análisis visual si existe
    if (features.visualAnalysis?.composition?.hasCentralObject) {
      imagePatterns.push('central_object');
    }
    
    if (features.hasBrightSpots) {
      imagePatterns.push('bright_spots', 'luminous');
    }
    
    if (features.isDarkImage) {
      imagePatterns.push('dark', 'night');
    }
    
    if (features.hasHighContrast) {
      imagePatterns.push('high_contrast');
    }
    
    if (features.skyType && features.skyType !== 'unknown') {
      imagePatterns.push(features.skyType);
    }
    
    // Comparar patrones: contar coincidencias
    const matchingPatterns = object.visualPatterns.filter(pattern => 
      imagePatterns.some(ip => 
        ip.toLowerCase().includes(pattern.toLowerCase()) || 
        pattern.toLowerCase().includes(ip.toLowerCase())
      )
    );
    
    const patternMatchRatio = matchingPatterns.length / Math.max(object.visualPatterns.length, 1);
    score += Math.round(patternMatchRatio * 20);
  } else {
    score += 5; // Neutral si no hay patrones
  }

  // ========== DATOS EXIF (25% del peso total) ==========

  // 6. Coincidencia de tiempo del día (peso: 15)
  maxScore += 15;
  if (object.timeOfDay && object.timeOfDay.includes(features.timeOfDay)) {
    score += 15;
  } else if (features.timeOfDay === 'unknown') {
    score += 7;
  }

  // 7. ISO y condiciones de luz (peso: 10)
  maxScore += 10;
  if (features.iso) {
    if (features.iso > 1600 && ['celestial', 'satellite', 'uap'].includes(object.category)) {
      score += 10;
    } else if (features.iso < 400 && ['aircraft', 'bird', 'balloon'].includes(object.category)) {
      score += 10;
    } else {
      score += 5;
    }
  } else {
    score += 5;
  }

  // 8. Focal length (zoom) (peso: 10)
  maxScore += 10;
  if (features.isZoomed && ['aircraft', 'satellite', 'celestial', 'bird'].includes(object.category)) {
    score += 10;
  } else if (features.isWideLens && ['drone', 'balloon', 'natural'].includes(object.category)) {
    score += 10;
  } else {
    score += 5;
  }

  // 9. Larga exposición (peso: 5)
  maxScore += 5;
  if (features.isLongExposure && ['satellite', 'aircraft', 'celestial'].includes(object.category)) {
    score += 5;
  }

  // ========== CONTEXTO Y METADATA (20% del peso total) ==========

  // 10. Ubicación GPS (peso: 10)
  maxScore += 10;
  if (features.hasLocation) {
    score += 10; // Bonus por tener GPS (más confiable)
  } else {
    score += 3; // Sin GPS - menos confiable
  }

  // 11. Frecuencia del objeto (peso: 10)
  maxScore += 10;
  if (object.frequency) {
    score += Math.min(object.frequency / 10, 10);
  }

  // ========== PENALIZACIONES ==========

  // CRÍTICO: Si no hay objeto en imagen, penalizar objetos físicos fuertemente
  if (features.hasVisualData && !features.hasObjectInImage) {
    if (!['natural'].includes(object.category) || !object.name.includes('Lens Flare') && !object.name.includes('Orbe')) {
      score = score * 0.3; // Reducir 70% si es objeto físico pero no se ve nada
    }
  }

  // AMPLIADO: Detección de manipulación EXIF avanzada
  const exifData = features.exifData || {};
  
  if (!features.hasTimestamp && !features.cameraModel) {
    // Sin metadatos EXIF - posible edición/manipulación
    if (object.category === 'natural' && (object.name.includes('Lens Flare') || object.name.includes('Orbe'))) {
      score += 5; // Favorece artefactos artificiales
    } else {
      score = score * 0.9; // Penalizar 10% por falta de metadatos
    }
  }
  
  // NUEVO: Penalización basada en manipulationScore del EXIF
  if (exifData.manipulationScore && exifData.manipulationScore > 0) {
    const penaltyPercent = Math.min(exifData.manipulationScore / 100, 0.5); // Máximo 50% penalización
    score = score * (1 - penaltyPercent);
    
    // Si es imagen generada por IA, penalizar objetos reales
    if (exifData.isAIGenerated) {
      if (['aircraft', 'satellite', 'celestial'].includes(object.category)) {
        score = score * 0.2; // Reducir 80% para objetos reales
      } else if (object.category === 'hoax' || object.category === 'unknown') {
        score += 10; // Favorece hoax/unknown para imágenes AI
      }
    }
  }
  
  // NUEVO: Penalización por software de edición
  if (exifData.software) {
    const editingSoftware = ['photoshop', 'gimp', 'lightroom'];
    const softwareLower = exifData.software.toLowerCase();
    if (editingSoftware.some(s => softwareLower.includes(s))) {
      score = score * 0.85; // Penalizar 15% si fue editada
    }
  }

  // Normalizar score a 0-100
  const normalizedScore = Math.round((score / maxScore) * 100);
  
  return Math.min(Math.max(normalizedScore, 0), 95); // Entre 0-95%
}

/**
 * Genera razón de la coincidencia
 */
function generateMatchReason(features, object, score) {
  const reasons = [];
  
  if (object.timeOfDay && object.timeOfDay.includes(features.timeOfDay)) {
    reasons.push(`Compatible con hora de avistamiento (${features.timeOfDay})`);
  }
  
  if (features.isNightShot && ['celestial', 'satellite'].includes(object.category)) {
    reasons.push('Fotografía nocturna consistente con objeto celeste/satélite');
  }
  
  if (features.isLongExposure && ['satellite', 'aircraft'].includes(object.category)) {
    reasons.push('Larga exposición sugiere objeto en movimiento');
  }
  
  if (object.frequency > 70) {
    reasons.push('Objeto frecuentemente reportado');
  }
  
  if (reasons.length === 0) {
    reasons.push('Coincidencia basada en características generales');
  }
  
  return reasons.join('. ');
}

/**
 * Describe las características detectadas de la imagen
 */
function describeFeatures(features) {
  const parts = [];
  
  if (features.timeOfDay !== 'unknown') {
    parts.push(`momento del día: ${features.timeOfDay}`);
  }
  
  if (features.iso) {
    parts.push(`ISO ${features.iso}`);
  }
  
  if (features.focalLength) {
    parts.push(`focal ${features.focalLength}mm`);
  }
  
  if (features.isNightShot) {
    parts.push('fotografía nocturna');
  }
  
  if (features.isLongExposure) {
    parts.push('larga exposición');
  }
  
  if (features.isZoomed) {
    parts.push('con teleobjetivo');
  }
  
  if (features.hasLocation) {
    parts.push('con GPS');
  }
  
  return parts.length > 0 ? parts.join(', ') : 'sin características distintivas detectadas';
}

/**
 * Genera descripción del análisis
 */
function generateDescription(features, bestMatch) {
  if (!bestMatch) {
    return `Objeto no identificado capturado ${features.timeOfDay !== 'unknown' ? `durante ${features.timeOfDay}` : 'en momento desconocido'}. ` +
           `No se encontraron coincidencias claras en la base de datos. ` +
           `${features.hasLocation ? 'Cuenta con datos de ubicación GPS.' : 'Sin datos de ubicación.'} ` +
           `Se recomienda análisis adicional.`;
  }

  return `Posible coincidencia con ${bestMatch.objectName} (${bestMatch.category}). ` +
         `${bestMatch.matchReason} ` +
         `Confianza del ${bestMatch.matchPercentage}%. ` +
         `${features.hasLocation ? 'Incluye datos de geolocalización.' : ''}`;
}

/**
 * Identifica características inusuales
 */
function getUnusualFeatures(features, bestMatch) {
  const unusual = [];
  
  if (!bestMatch || bestMatch.matchPercentage < 60) {
    unusual.push('No se encontró coincidencia clara con objetos conocidos');
  }
  
  if (features.isLongExposure && features.isNightShot) {
    unusual.push('Foto nocturna de larga exposición - puede mostrar rastros de luz');
  }
  
  if (!features.hasLocation) {
    unusual.push('Sin datos de ubicación GPS');
  }
  
  if (!features.hasTimestamp) {
    unusual.push('Sin marca de tiempo de captura');
  }
  
  if (features.isMovingCamera) {
    unusual.push('Posible movimiento de cámara o manipulación detectada');
  }
  
  return unusual.length > 0 ? unusual : ['No se detectaron características inusuales'];
}

/**
 * Genera recomendaciones
 */
function generateRecommendations(features, bestMatch, confidence) {
  const recommendations = [];
  
  if (confidence < 50) {
    recommendations.push('Bajo nivel de confianza - Se requiere más información');
    recommendations.push('Considera capturar más fotos desde diferentes ángulos');
  }
  
  if (!features.hasLocation) {
    recommendations.push('Habilita GPS para futuras capturas');
  }
  
  if (features.isNightShot) {
    recommendations.push('Para objetos nocturnos, intenta usar trípode y menor ISO');
    recommendations.push('Verifica posición de planetas y satélites (ej: Stellarium)');
  }
  
  if (bestMatch && ['aircraft', 'satellite'].includes(bestMatch.category)) {
    recommendations.push('Verifica tráfico aéreo en FlightRadar24');
    recommendations.push('Consulta pases de satélites en HeavensAbove.com');
  }
  
  if (!bestMatch || confidence < 40) {
    recommendations.push('Considera compartir imagen con comunidad de análisis UAP');
    recommendations.push('Documenta condiciones de avistamiento (clima, hora exacta, duración)');
  }
  
  return recommendations;
}

/**
 * Verifica si el servicio está configurado
 */
function isConfigured() {
  return true; // Siempre disponible - no requiere configuración externa
}

module.exports = {
  analyzeImageByComparison,
  isConfigured
};
