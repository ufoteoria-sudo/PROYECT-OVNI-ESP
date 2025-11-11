/**
 * Servicio de Cálculo de Confianza Ponderado v2.0
 * 
 * Fusiona 4 fuentes de información para calcular confianza final:
 * 1. Validación Externa (30%) - APIs: OpenSky, N2YO, SunCalc, Globos
 * 2. Análisis Visual (30%) - Deep Learning + Feature Detection
 * 3. Características de Imagen (20%) - Análisis técnico: EXIF
 * 4. Datos de Entrenamiento (20%) - Similitud con imágenes conocidas
 * 
 * Este sistema REEMPLAZA la confianza simple del AI/entrenamiento
 * para evitar falsos positivos (ej: "todo es Venus")
 */

class ConfidenceCalculatorService {
  
  /**
   * Calcular confianza ponderada final
   * 
   * @param {object} aiAnalysis - Análisis preliminar de IA
   * @param {object} externalValidation - Resultados de validación externa
   * @param {object} trainingEnhancement - Mejora con datos de entrenamiento
   * @param {object} exifData - Datos EXIF de la imagen
   * @param {object} visualAnalysis - Análisis visual avanzado (NUEVO)
   * @returns {object} Confianza ponderada + categoría ajustada + explicación
   */
  calculateWeightedConfidence(aiAnalysis, externalValidation, trainingEnhancement, exifData, visualAnalysis = null) {
    console.log('');
    console.log('🎯 CALCULANDO CONFIANZA PONDERADA v2.0...');
    console.log('═'.repeat(70));
    
    const result = {
      finalConfidence: 0,
      finalCategory: aiAnalysis.category || 'unknown',
      finalDescription: aiAnalysis.description || '',
      breakdown: {
        externalValidation: { score: 0, weight: 0.30, details: [] },
        visualAnalysis: { score: 0, weight: 0.30, details: [] },
        imageCharacteristics: { score: 0, weight: 0.20, details: [] },
        trainingData: { score: 0, weight: 0.20, details: [] }
      },
      adjustments: [],
      explanation: '',
      confidence_level: 'unknown'
    };

    // ===== 1. VALIDACIÓN EXTERNA (30%) =====
    const externalScore = this.calculateExternalValidationScore(
      aiAnalysis,
      externalValidation,
      result.breakdown.externalValidation.details
    );
    
    result.breakdown.externalValidation.score = externalScore;
    result.finalConfidence += externalScore * 0.30;
    
    console.log(`📊 Validación Externa: ${externalScore}/100 (peso: 30%)`);
    result.breakdown.externalValidation.details.forEach(d => console.log(`   • ${d}`));

    // ===== 2. ANÁLISIS VISUAL (30%) ===== [NUEVO]
    const visualScore = this.calculateVisualAnalysisScore(
      visualAnalysis,
      aiAnalysis,
      result.breakdown.visualAnalysis.details
    );
    
    result.breakdown.visualAnalysis.score = visualScore;
    result.finalConfidence += visualScore * 0.30;
    
    console.log(`🔬 Análisis Visual: ${visualScore}/100 (peso: 30%)`);
    result.breakdown.visualAnalysis.details.forEach(d => console.log(`   • ${d}`));

    // ===== 3. CARACTERÍSTICAS DE IMAGEN (20%) =====
    const imageScore = this.calculateImageCharacteristicsScore(
      exifData,
      aiAnalysis,
      result.breakdown.imageCharacteristics.details
    );
    
    result.breakdown.imageCharacteristics.score = imageScore;
    result.finalConfidence += imageScore * 0.20;
    
    console.log(`📷 Características de Imagen: ${imageScore}/100 (peso: 20%)`);
    result.breakdown.imageCharacteristics.details.forEach(d => console.log(`   • ${d}`));

    // ===== 4. DATOS DE ENTRENAMIENTO (20%) =====
    const trainingScore = this.calculateTrainingDataScore(
      trainingEnhancement,
      aiAnalysis,
      result.breakdown.trainingData.details
    );
    
    result.breakdown.trainingData.score = trainingScore;
    result.finalConfidence += trainingScore * 0.20;
    
    console.log(`🎓 Datos de Entrenamiento: ${trainingScore}/100 (peso: 20%)`);
    result.breakdown.trainingData.details.forEach(d => console.log(`   • ${d}`));

    // ===== REDONDEAR CONFIANZA FINAL =====
    result.finalConfidence = Math.round(result.finalConfidence);

    // ===== AJUSTES BASADOS EN EVIDENCIAS =====
    this.applyEvidenceBasedAdjustments(result, externalValidation, aiAnalysis);

    // ===== DETERMINAR NIVEL DE CONFIANZA =====
    if (result.finalConfidence >= 85) {
      result.confidence_level = 'very_high';
    } else if (result.finalConfidence >= 70) {
      result.confidence_level = 'high';
    } else if (result.finalConfidence >= 50) {
      result.confidence_level = 'medium';
    } else if (result.finalConfidence >= 30) {
      result.confidence_level = 'low';
    } else {
      result.confidence_level = 'very_low';
    }

    // ===== GENERAR EXPLICACIÓN =====
    result.explanation = this.generateExplanation(result);

    console.log('');
    console.log('═'.repeat(70));
    console.log(`✅ CONFIANZA FINAL: ${result.finalConfidence}% (${result.confidence_level.toUpperCase()})`);
    console.log(`📁 CATEGORÍA: ${result.finalCategory}`);
    console.log(`📝 ${result.explanation}`);
    console.log('═'.repeat(70));
    console.log('');

    return result;
  }

  /**
   * Calcular score de validación externa (0-100)
   * Mayor peso a coincidencias directas con objetos conocidos
   */
  calculateExternalValidationScore(aiAnalysis, externalValidation, details) {
    if (!externalValidation || !externalValidation.performed) {
      details.push('No hay datos GPS/timestamp - sin validación externa');
      return 0;
    }

    if (externalValidation.error) {
      details.push(`Error en validación: ${externalValidation.error}`);
      return 0;
    }

    let score = 0;
    const matches = externalValidation.results?.matches || [];
    const category = aiAnalysis.category || 'unknown';

    if (matches.length === 0) {
      details.push('No se encontraron objetos conocidos en la zona/hora');
      return 10; // Score bajo si no hay coincidencias
    }

    // Verificar tipos de coincidencias
    const aircraftMatches = matches.filter(m => m.type === 'aircraft');
    const satelliteMatches = matches.filter(m => m.type === 'satellite');
    const celestialMatches = matches.filter(m => m.type === 'celestial');
    const balloonMatches = matches.filter(m => m.type === 'balloon');

    // CASO 1: Categoría AI es aeronave
    if (category.includes('aircraft') || category === 'drone' || category === 'helicopter') {
      if (aircraftMatches.length > 0) {
        const closest = aircraftMatches.sort((a, b) => (a.distance || 999) - (b.distance || 999))[0];
        const distance = closest.distance || 50;
        
        if (distance < 10) {
          score = 95;
          details.push(`Aeronave muy cercana: ${closest.callsign || 'desconocido'} a ${distance}km`);
        } else if (distance < 30) {
          score = 80;
          details.push(`Aeronave cercana: ${closest.callsign || 'desconocido'} a ${distance}km`);
        } else {
          score = 60;
          details.push(`Aeronave en área: ${closest.callsign || 'desconocido'} a ${distance}km`);
        }
      } else {
        score = 15;
        details.push('Clasificado como aeronave pero NO hay vuelos en la zona');
      }
    }

    // CASO 2: Categoría AI es satélite
    else if (category === 'satellite') {
      if (satelliteMatches.length > 0) {
        score = 90;
        details.push(`${satelliteMatches.length} satélite(s) visible(s): ${satelliteMatches.map(s => s.name).join(', ')}`);
      } else {
        score = 20;
        details.push('Clasificado como satélite pero ninguno visible en ese momento');
      }
    }

    // CASO 3: Categoría AI es objeto celeste
    else if (category === 'celestial') {
      const visibleCelestial = celestialMatches.filter(c => c.visible === true || c.visible === 'possibly');
      
      if (visibleCelestial.length > 0) {
        // Verificar si es Luna o Sol (muy alta confianza)
        const isMoonOrSun = visibleCelestial.some(c => c.name === 'Luna' || c.name === 'Sol');
        
        if (isMoonOrSun) {
          score = 95;
          details.push(`Coincide con objeto celeste visible: ${visibleCelestial.map(c => c.name).join(', ')}`);
        } else {
          score = 70;
          details.push(`Posible objeto celeste: ${visibleCelestial.map(c => c.name).join(', ')}`);
        }
      } else {
        score = 25;
        details.push('Clasificado como celeste pero ningún objeto visible en ese momento');
      }
    }

    // CASO 4: Categoría AI es globo
    else if (category === 'balloon') {
      if (balloonMatches.length > 0) {
        score = 65; // Media-alta (globos son comunes pero no siempre detectables)
        details.push(`${balloonMatches.length} tipo(s) de globo posibles en la zona`);
      } else {
        score = 30;
        details.push('Clasificado como globo - posible pero sin confirmación externa');
      }
    }

    // CASO 5: Categoría desconocida o efectos ópticos
    else if (category === 'unknown' || category.includes('lens_flare') || category.includes('reflection')) {
      // Si hay objetos externos, sugerir reclasificación
      if (aircraftMatches.length > 0) {
        score = 70;
        details.push(`Categoría incierta pero hay ${aircraftMatches.length} aeronave(s) en zona - posible reclasificación`);
      } else if (celestialMatches.length > 0) {
        score = 65;
        details.push(`Categoría incierta pero hay objetos celestes visibles - posible reclasificación`);
      } else {
        score = 40;
        details.push('Categoría incierta y sin coincidencias externas claras');
      }
    }

    // CASO 6: Otras categorías
    else {
      if (matches.length > 0) {
        score = 50;
        details.push(`${matches.length} objeto(s) detectado(s) externamente pero categoría no coincide directamente`);
      } else {
        score = 30;
        details.push('Sin coincidencias externas relevantes para esta categoría');
      }
    }

    return Math.min(100, Math.max(0, score));
  }

  /**
   * Calcular score de análisis visual (0-100) [NUEVO]
   * Basado en detección de características visuales independientes de EXIF
   */
  calculateVisualAnalysisScore(visualAnalysis, aiAnalysis, details) {
    if (!visualAnalysis || visualAnalysis.error) {
      details.push('No se pudo realizar análisis visual');
      return 30; // Score base bajo
    }

    let score = 0;
    const category = aiAnalysis.category || 'unknown';

    // ===== FACTOR 1: Confianza del análisis visual =====
    if (visualAnalysis.objectType && visualAnalysis.objectType.confidence > 0) {
      const visualConfidence = visualAnalysis.objectType.confidence;
      score += visualConfidence * 0.4; // Hasta 40 puntos
      details.push(`Detección visual: ${visualAnalysis.objectType.category} (${visualConfidence}% confianza)`);
    }

    // ===== FACTOR 2: Coincidencia entre AI y análisis visual =====
    if (visualAnalysis.objectType) {
      const visualType = visualAnalysis.objectType.category;
      
      // Mapear categorías
      const categoryMatch = this.checkCategoryMatch(category, visualType);
      
      if (categoryMatch === 'exact') {
        score += 30;
        details.push(`Coincidencia EXACTA entre AI y análisis visual (+30)`);
      } else if (categoryMatch === 'partial') {
        score += 15;
        details.push(`Coincidencia parcial entre AI y análisis visual (+15)`);
      } else if (categoryMatch === 'conflict') {
        score -= 15;
        details.push(`⚠️ CONFLICTO: AI dice "${category}", visual dice "${visualType}" (-15)`);
      }
    }

    // ===== FACTOR 3: Patrones de luces detectados =====
    if (visualAnalysis.lightPatterns) {
      const pattern = visualAnalysis.lightPatterns.pattern;
      
      if (pattern === 'drone_multiple_lights' && category === 'drone') {
        score += 20;
        details.push(`Patrón de luces de DRON detectado (+20)`);
      } else if (pattern === 'aircraft_navigation_lights' && category.includes('aircraft')) {
        score += 20;
        details.push(`Luces de navegación de AVIÓN detectadas (+20)`);
      } else if (pattern === 'single_bright_light' && category === 'celestial') {
        score += 15;
        details.push(`Luz única brillante (compatible con celeste) (+15)`);
      } else if (pattern === 'drone_multiple_lights' && !category.includes('drone')) {
        details.push(`⚠️ Patrón de dron detectado pero AI no lo clasificó como dron`);
      }
    }

    // ===== FACTOR 4: Análisis de forma =====
    if (visualAnalysis.shapeAnalysis) {
      const shape = visualAnalysis.shapeAnalysis;
      
      // Objeto circular pequeño + categoría celestial
      if (shape.isCircular && shape.isSmallObject && category === 'celestial') {
        score += 10;
        details.push(`Forma circular pequeña (compatible con objeto celeste) (+10)`);
      }
      
      // Objeto alargado + categoría avión
      if (shape.shapeType === 'elongated_linear' && category.includes('aircraft')) {
        score += 10;
        details.push(`Forma alargada (compatible con aeronave) (+10)`);
      }
    }

    return Math.min(Math.max(Math.round(score), 0), 100);
  }

  /**
   * Verificar coincidencia entre categoría AI y tipo visual
   */
  checkCategoryMatch(aiCategory, visualType) {
    const matches = {
      'drone': ['drone'],
      'aircraft_commercial': ['aircraft'],
      'aircraft_military': ['aircraft'],
      'celestial': ['celestial'],
      'bird': ['bird'],
      'atmospheric': ['natural_phenomenon'],
      'weather': ['natural_phenomenon']
    };

    const aiTypes = matches[aiCategory] || [];
    
    if (aiTypes.includes(visualType)) {
      return 'exact';
    }
    
    // Coincidencias parciales
    if ((aiCategory.includes('aircraft') || aiCategory === 'drone') && visualType === 'aircraft') {
      return 'partial';
    }
    
    if (aiCategory === 'unknown' || visualType === 'unknown') {
      return 'neutral';
    }
    
    return 'conflict';
  }

  /**
   * Calcular score de características de imagen (0-100)
   * Basado en calidad de datos EXIF y análisis técnico
   */
  calculateImageCharacteristicsScore(exifData, aiAnalysis, details) {
    let score = 50; // Base neutral

    if (!exifData) {
      details.push('Sin datos EXIF disponibles');
      return 30;
    }

    // Factor 1: Datos GPS y timestamp (críticos para validación)
    if (exifData.location && exifData.location.latitude) {
      score += 15;
      details.push('Datos GPS disponibles (+15)');
    } else {
      score -= 10;
      details.push('Sin datos GPS (-10)');
    }

    if (exifData.captureDate || exifData.captureTime) {
      score += 10;
      details.push('Timestamp de captura disponible (+10)');
    } else {
      score -= 5;
      details.push('Sin timestamp de captura (-5)');
    }

    // Factor 2: Información de cámara (indica autenticidad)
    if (exifData.camera && exifData.cameraModel) {
      score += 10;
      details.push(`Cámara identificada: ${exifData.camera} ${exifData.cameraModel} (+10)`);
    } else {
      score -= 5;
      details.push('Sin datos de cámara (-5)');
    }

    // Factor 3: Configuración de captura (indica foto genuina vs editada)
    const hasCaptureSettings = exifData.iso || exifData.shutterSpeed || exifData.aperture || exifData.focalLength;
    if (hasCaptureSettings) {
      score += 10;
      details.push('Configuración de captura presente (+10)');
    } else {
      score -= 5;
      details.push('Sin configuración de captura (-5)');
    }

    // Factor 4: Detección de manipulación
    if (exifData.manipulationScore > 0) {
      const penalty = Math.min(30, Math.round(exifData.manipulationScore / 3));
      score -= penalty;
      details.push(`Indicios de manipulación: ${exifData.manipulationScore}/100 (-${penalty})`);
    } else {
      score += 5;
      details.push('Sin indicios de manipulación (+5)');
    }

    // Factor 5: Imagen generada por IA (penalización máxima)
    if (exifData.isAIGenerated) {
      score = 0;
      details.push('⚠️ IMAGEN GENERADA POR IA - Confianza NULA');
    }

    // Factor 6: Resolución de imagen
    if (exifData.imageWidth && exifData.imageHeight) {
      const megapixels = (exifData.imageWidth * exifData.imageHeight) / 1000000;
      if (megapixels >= 8) {
        score += 5;
        details.push(`Alta resolución: ${megapixels.toFixed(1)}MP (+5)`);
      } else if (megapixels < 2) {
        score -= 5;
        details.push(`Baja resolución: ${megapixels.toFixed(1)}MP (-5)`);
      }
    }

    return Math.min(100, Math.max(0, score));
  }

  /**
   * Calcular score de datos de entrenamiento (0-100)
   * Basado en similitud con imágenes conocidas
   */
  calculateTrainingDataScore(trainingEnhancement, aiAnalysis, details) {
    if (!trainingEnhancement || !trainingEnhancement.enhanced) {
      details.push('Sin datos de entrenamiento disponibles');
      return 30; // Score bajo si no hay entrenamiento
    }

    const trainingData = trainingEnhancement.enhancedAnalysis?.trainingData;
    
    if (!trainingData || !trainingData.available) {
      details.push('No hay imágenes de entrenamiento para esta categoría');
      return 25;
    }

    const matchCount = trainingData.matchCount || 0;
    const bestMatch = trainingData.bestMatch;

    if (matchCount === 0) {
      details.push('Sin coincidencias con imágenes de entrenamiento');
      return 20;
    }

    let score = 40; // Base si hay matches

    // Factor 1: Número de coincidencias
    if (matchCount >= 5) {
      score += 15;
      details.push(`${matchCount} imágenes de entrenamiento encontradas (+15)`);
    } else if (matchCount >= 3) {
      score += 10;
      details.push(`${matchCount} imágenes de entrenamiento encontradas (+10)`);
    } else {
      score += 5;
      details.push(`${matchCount} imagen(es) de entrenamiento encontrada(s) (+5)`);
    }

    // Factor 2: Confianza del mejor match
    if (bestMatch && bestMatch.confidence) {
      const matchConfidence = bestMatch.confidence;
      
      if (matchConfidence >= 80) {
        score += 30;
        details.push(`Alta similitud con "${bestMatch.type}": ${matchConfidence}% (+30)`);
      } else if (matchConfidence >= 60) {
        score += 20;
        details.push(`Similitud media con "${bestMatch.type}": ${matchConfidence}% (+20)`);
      } else if (matchConfidence >= 40) {
        score += 10;
        details.push(`Similitud baja con "${bestMatch.type}": ${matchConfidence}% (+10)`);
      } else {
        details.push(`Similitud muy baja: ${matchConfidence}%`);
      }
    }

    // Factor 3: Categoría consistente
    if (bestMatch && bestMatch.category === aiAnalysis.category) {
      score += 15;
      details.push('Categoría consistente con entrenamiento (+15)');
    } else if (bestMatch) {
      score -= 10;
      details.push(`Categoría NO coincide: AI dice "${aiAnalysis.category}" pero entrenamiento sugiere "${bestMatch.category}" (-10)`);
    }

    return Math.min(100, Math.max(0, score));
  }

  /**
   * Aplicar ajustes basados en evidencias contradictorias
   */
  applyEvidenceBasedAdjustments(result, externalValidation, aiAnalysis) {
    const matches = externalValidation?.results?.matches || [];
    
    // AJUSTE 1: Si AI dice "celestial" pero hay aeronaves cerca
    if (aiAnalysis.category === 'celestial') {
      const nearbyAircraft = matches.filter(m => m.type === 'aircraft' && m.distance < 20);
      
      if (nearbyAircraft.length > 0) {
        result.finalConfidence = Math.max(result.finalConfidence - 20, 30);
        result.adjustments.push(`Clasificado como celeste pero hay ${nearbyAircraft.length} aeronave(s) muy cerca (-20%)`);
        result.finalCategory = 'unknown';
        result.finalDescription = `Posible confusión: clasificado como ${aiAnalysis.category} pero hay aeronaves cercanas. Revisar manualmente.`;
      }
    }

    // AJUSTE 2: Si hay Luna/Sol visible y AI dice otra cosa
    const celestialMatches = matches.filter(m => m.type === 'celestial' && (m.name === 'Luna' || m.name === 'Sol'));
    if (celestialMatches.length > 0 && aiAnalysis.category !== 'celestial') {
      result.adjustments.push(`${celestialMatches[0].name} visible pero clasificado como ${aiAnalysis.category}`);
      // No ajustar automáticamente porque podría ser algo FRENTE a la Luna/Sol
    }

    // AJUSTE 3: Múltiples aeronaves pero clasificado como otra cosa
    const aircraftCount = matches.filter(m => m.type === 'aircraft').length;
    if (aircraftCount >= 5 && !aiAnalysis.category.includes('aircraft')) {
      result.adjustments.push(`${aircraftCount} aeronaves en zona - posible reclasificación necesaria`);
    }

    // AJUSTE 4: Confianza muy alta sin GPS
    if (result.finalConfidence > 70 && !externalValidation?.performed) {
      result.finalConfidence = Math.min(result.finalConfidence, 70);
      result.adjustments.push('Confianza limitada a 70% sin validación externa (falta GPS/timestamp)');
    }
  }

  /**
   * Generar explicación legible
   */
  generateExplanation(result) {
    const parts = [];
    
    const level = result.confidence_level;
    
    if (level === 'very_high') {
      parts.push('Identificación muy confiable.');
    } else if (level === 'high') {
      parts.push('Identificación confiable.');
    } else if (level === 'medium') {
      parts.push('Identificación posible pero requiere verificación.');
    } else if (level === 'low') {
      parts.push('Identificación incierta.');
    } else {
      parts.push('No se pudo identificar con confianza.');
    }

    // Agregar razones principales
    const breakdown = result.breakdown;
    const scores = [
      { name: 'validación externa', score: breakdown.externalValidation.score },
      { name: 'características de imagen', score: breakdown.imageCharacteristics.score },
      { name: 'datos de entrenamiento', score: breakdown.trainingData.score }
    ].sort((a, b) => b.score - a.score);

    if (scores[0].score >= 70) {
      parts.push(`Alta evidencia de ${scores[0].name} (${scores[0].score}/100).`);
    } else if (scores[0].score < 40) {
      parts.push(`Evidencia limitada en todas las fuentes.`);
    }

    // Agregar ajustes si los hay
    if (result.adjustments.length > 0) {
      parts.push('Ajustes aplicados por evidencias contradictorias.');
    }

    return parts.join(' ');
  }
}

module.exports = new ConfidenceCalculatorService();
