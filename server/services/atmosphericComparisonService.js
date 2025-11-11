const AtmosphericPhenomenon = require('../models/AtmosphericPhenomenon');

/**
 * Servicio de Comparación Atmosférica
 * Compara características visuales del avistamiento con fenómenos atmosféricos conocidos
 */
class AtmosphericComparisonService {

  /**
   * Comparar análisis con fenómenos atmosféricos
   */
  async compareWithAtmosphericPhenomena(visualAnalysis, weatherData, exifData) {
    try {
      const matches = [];
      
      // Obtener todos los fenómenos activos
      const phenomena = await AtmosphericPhenomenon.find({ isActive: true });

      for (const phenomenon of phenomena) {
        const score = this.calculateMatchScore(
          phenomenon,
          visualAnalysis,
          weatherData,
          exifData
        );

        if (score.total > 30) {  // Umbral de coincidencia significativa
          matches.push({
            phenomenon: {
              name: phenomenon.name,
              category: phenomenon.category,
              description: phenomenon.description,
              rarity: phenomenon.rarity
            },
            score: score.total,
            breakdown: score.breakdown,
            confidence: this.scoreToConfidence(score.total),
            explanation: this.generateExplanation(phenomenon, score)
          });
        }
      }

      // Ordenar por puntuación
      matches.sort((a, b) => b.score - a.score);

      return {
        totalMatches: matches.length,
        bestMatch: matches[0] || null,
        topMatches: matches.slice(0, 5),
        hasStrongMatch: matches.length > 0 && matches[0].score > 70,
        summary: this.generateSummary(matches)
      };

    } catch (error) {
      console.error('Error en comparación atmosférica:', error);
      return {
        error: 'Error al comparar con fenómenos atmosféricos',
        details: error.message
      };
    }
  }

  /**
   * Calcular puntuación de coincidencia
   */
  calculateMatchScore(phenomenon, visualAnalysis, weatherData, exifData) {
    const breakdown = {
      visual: 0,
      weather: 0,
      time: 0,
      location: 0
    };

    // 1. Comparación visual (40% del peso)
    if (visualAnalysis) {
      let visualScore = 0;

      // Forma
      if (phenomenon.visualCharacteristics.shape && visualAnalysis.objectType) {
        const shapes = this.mapCategoryToShape(visualAnalysis.objectType.category);
        if (shapes.includes(phenomenon.visualCharacteristics.shape)) {
          visualScore += 25;
        }
      }

      // Colores
      if (phenomenon.visualCharacteristics.colors && visualAnalysis.dominantColors) {
        const colorMatch = this.compareColors(
          phenomenon.visualCharacteristics.colors,
          visualAnalysis.dominantColors
        );
        visualScore += colorMatch * 25;  // 0-25 puntos
      }

      // Brillo
      if (phenomenon.visualCharacteristics.brightness && visualAnalysis.averageBrightness) {
        const brightnessMatch = this.compareBrightness(
          phenomenon.visualCharacteristics.brightness,
          visualAnalysis.averageBrightness
        );
        visualScore += brightnessMatch * 15;  // 0-15 puntos
      }

      // Textura
      if (phenomenon.visualCharacteristics.texture && visualAnalysis.texture) {
        if (phenomenon.visualCharacteristics.texture === visualAnalysis.texture) {
          visualScore += 15;
        }
      }

      breakdown.visual = Math.min(40, visualScore * 0.5);  // Normalizar a 40 puntos máximo
    }

    // 2. Comparación meteorológica (30% del peso)
    if (weatherData && !weatherData.error) {
      let weatherScore = 0;

      // Condiciones climáticas
      if (phenomenon.conditions.weather) {
        const weatherMatch = this.compareWeatherConditions(
          phenomenon.conditions.weather,
          weatherData.conditions.main
        );
        weatherScore += weatherMatch * 15;
      }

      // Cobertura nubosa
      if (phenomenon.category === 'cloud' || phenomenon.category === 'optical') {
        if (weatherData.clouds.coverage > 20) {
          weatherScore += 10;
        }
      }

      // Precipitación
      if (phenomenon.conditions.weather.includes('rainy') || 
          phenomenon.conditions.weather.includes('snowy')) {
        const hasPrecipitation = weatherData.precipitation.rain_1h > 0 || 
                                weatherData.precipitation.snow_1h > 0;
        if (hasPrecipitation) {
          weatherScore += 15;
        }
      }

      breakdown.weather = Math.min(30, weatherScore);
    }

    // 3. Comparación temporal (20% del peso)
    if (exifData && exifData.timestamp) {
      let timeScore = 0;
      const hour = new Date(exifData.timestamp).getHours();
      const timeOfDay = this.getTimeOfDay(hour);

      if (phenomenon.conditions.timeOfDay.includes(timeOfDay) || 
          phenomenon.conditions.timeOfDay.includes('any')) {
        timeScore += 20;
      }

      // Ajustar por hora específica para ciertos fenómenos
      if (phenomenon.category === 'aurora' && timeOfDay === 'night') {
        timeScore += 10;
      }
      if (phenomenon.name.includes('Pilar') && (timeOfDay === 'dawn' || timeOfDay === 'dusk')) {
        timeScore += 10;
      }

      breakdown.time = Math.min(20, timeScore);
    }

    // 4. Comparación geográfica y estacional (10% del peso)
    if (exifData) {
      let locationScore = 0;

      // Estacionalidad (simplificado - en producción usar fecha real)
      if (phenomenon.conditions.seasonality.includes('year-round')) {
        locationScore += 5;
      }

      // Región geográfica (simplificado)
      if (phenomenon.conditions.geographicRegions.includes('worldwide')) {
        locationScore += 5;
      }

      breakdown.location = Math.min(10, locationScore);
    }

    const total = breakdown.visual + breakdown.weather + breakdown.time + breakdown.location;

    return {
      total: Math.round(total),
      breakdown
    };
  }

  /**
   * Mapear categoría de objeto a formas posibles
   */
  mapCategoryToShape(category) {
    const mapping = {
      'celestial': ['circular', 'point'],
      'aircraft': ['irregular', 'streak'],
      'drone': ['circular', 'irregular'],
      'satellite': ['point', 'streak'],
      'bird': ['irregular'],
      'balloon': ['circular', 'oval'],
      'natural': ['irregular', 'varied']
    };
    return mapping[category] || ['irregular'];
  }

  /**
   * Comparar colores
   */
  compareColors(phenomenonColors, analysisColors) {
    if (!analysisColors || analysisColors.length === 0) return 0;

    const matches = phenomenonColors.filter(color => 
      analysisColors.some(ac => ac.toLowerCase().includes(color.toLowerCase()))
    );

    return matches.length / phenomenonColors.length;  // 0 a 1
  }

  /**
   * Comparar brillo
   */
  compareBrightness(phenomenonBrightness, analysisBrightness) {
    const brightnessMap = {
      'dim': { min: 0, max: 0.3 },
      'moderate': { min: 0.3, max: 0.6 },
      'bright': { min: 0.6, max: 0.85 },
      'very_bright': { min: 0.85, max: 1.0 },
      'variable': { min: 0, max: 1.0 }
    };

    const range = brightnessMap[phenomenonBrightness];
    if (!range) return 0;

    const normalized = analysisBrightness / 255;  // Normalizar a 0-1
    
    if (normalized >= range.min && normalized <= range.max) {
      return 1.0;
    } else {
      // Calcular distancia
      const distance = Math.min(
        Math.abs(normalized - range.min),
        Math.abs(normalized - range.max)
      );
      return Math.max(0, 1 - distance);
    }
  }

  /**
   * Comparar condiciones climáticas
   */
  compareWeatherConditions(phenomenonWeather, actualWeather) {
    // Mapeo de condiciones
    const weatherMap = {
      'clear': ['clear'],
      'cloudy': ['clouds', 'mist', 'fog'],
      'partly_cloudy': ['clouds'],
      'rainy': ['rain', 'drizzle'],
      'snowy': ['snow'],
      'stormy': ['thunderstorm'],
      'foggy': ['fog', 'mist']
    };

    for (const condition of phenomenonWeather) {
      const mappedConditions = weatherMap[condition] || [condition];
      if (mappedConditions.includes(actualWeather)) {
        return 1.0;
      }
    }

    return 0;
  }

  /**
   * Obtener momento del día
   */
  getTimeOfDay(hour) {
    if (hour >= 6 && hour < 8) return 'dawn';
    if (hour >= 8 && hour < 18) return 'day';
    if (hour >= 18 && hour < 20) return 'dusk';
    return 'night';
  }

  /**
   * Convertir puntuación a nivel de confianza
   */
  scoreToConfidence(score) {
    if (score >= 80) return 'very_high';
    if (score >= 60) return 'high';
    if (score >= 40) return 'medium';
    if (score >= 20) return 'low';
    return 'very_low';
  }

  /**
   * Generar explicación de la coincidencia
   */
  generateExplanation(phenomenon, score) {
    const parts = [];

    if (score.breakdown.visual > 15) {
      parts.push('Características visuales coinciden');
    }

    if (score.breakdown.weather > 15) {
      parts.push('Condiciones meteorológicas favorables');
    }

    if (score.breakdown.time > 10) {
      parts.push('Momento del día apropiado');
    }

    if (phenomenon.rarity === 'very_common' || phenomenon.rarity === 'common') {
      parts.push(`Es un fenómeno ${phenomenon.rarity === 'very_common' ? 'muy común' : 'común'}`);
    }

    return parts.join('. ') + '.';
  }

  /**
   * Generar resumen de coincidencias
   */
  generateSummary(matches) {
    if (matches.length === 0) {
      return 'No se encontraron coincidencias significativas con fenómenos atmosféricos conocidos.';
    }

    const best = matches[0];
    
    if (best.score > 70) {
      return `Alta probabilidad de ser: ${best.phenomenon.name}. ${best.phenomenon.description}`;
    } else if (best.score > 50) {
      return `Posible coincidencia con: ${best.phenomenon.name}. Se recomienda análisis adicional.`;
    } else {
      return `Coincidencia leve con fenómenos atmosféricos. El objeto podría requerir explicación alternativa.`;
    }
  }
}

module.exports = new AtmosphericComparisonService();
