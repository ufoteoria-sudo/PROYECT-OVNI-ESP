const axios = require('axios');

/**
 * Servicio de Datos Meteorológicos
 * Obtiene condiciones climáticas en tiempo real para validar avistamientos
 * 
 * API: OpenWeatherMap (gratuita hasta 1000 llamadas/día)
 * Obtener API key en: https://openweathermap.org/api
 */
class WeatherService {
  
  constructor() {
    this.apiKey = process.env.OPENWEATHER_API_KEY;
    this.baseUrl = 'https://api.openweathermap.org/data/2.5';
    
    // Cache de consultas (5 minutos)
    this.cache = new Map();
    this.cacheDuration = 5 * 60 * 1000;
  }

  /**
   * Verificar si el servicio está configurado
   */
  isConfigured() {
    return this.apiKey && this.apiKey !== 'your_openweather_api_key_here';
  }

  /**
   * Obtener condiciones climáticas actuales
   */
  async getCurrentWeather(latitude, longitude) {
    if (!this.isConfigured()) {
      return {
        error: 'OpenWeatherMap API key no configurada',
        configured: false,
        message: 'Para habilitar datos meteorológicos, configura OPENWEATHER_API_KEY en .env'
      };
    }

    try {
      const cacheKey = `current_${latitude}_${longitude}`;
      
      // Verificar cache
      if (this.cache.has(cacheKey)) {
        const cached = this.cache.get(cacheKey);
        if (Date.now() - cached.timestamp < this.cacheDuration) {
          return cached.data;
        }
      }

      const url = `${this.baseUrl}/weather`;
      const response = await axios.get(url, {
        params: {
          lat: latitude,
          lon: longitude,
          appid: this.apiKey,
          units: 'metric',
          lang: 'es'
        },
        timeout: 10000
      });

      const data = response.data;
      
      const weather = {
        source: 'OpenWeatherMap',
        queriedAt: new Date(),
        location: {
          latitude,
          longitude,
          name: data.name,
          country: data.sys.country
        },
        temperature: {
          current: data.main.temp,
          feels_like: data.main.feels_like,
          min: data.main.temp_min,
          max: data.main.temp_max,
          unit: '°C'
        },
        conditions: {
          main: data.weather[0].main.toLowerCase(),  // 'clouds', 'clear', 'rain', etc.
          description: data.weather[0].description,
          icon: data.weather[0].icon
        },
        clouds: {
          coverage: data.clouds.all,  // %
          type: this.getCloudType(data.clouds.all)
        },
        visibility: data.visibility,  // metros
        humidity: data.main.humidity,  // %
        pressure: data.main.pressure,  // hPa
        wind: {
          speed: data.wind.speed,  // m/s
          direction: data.wind.deg,  // grados
          gust: data.wind.gust || null  // m/s
        },
        precipitation: {
          rain_1h: data.rain?.['1h'] || 0,
          rain_3h: data.rain?.['3h'] || 0,
          snow_1h: data.snow?.['1h'] || 0,
          snow_3h: data.snow?.['3h'] || 0
        },
        sun: {
          sunrise: new Date(data.sys.sunrise * 1000),
          sunset: new Date(data.sys.sunset * 1000)
        },
        timestamp: new Date(data.dt * 1000)
      };

      // Análisis atmosférico
      weather.analysis = this.analyzeAtmosphericConditions(weather);

      // Guardar en cache
      this.cache.set(cacheKey, {
        timestamp: Date.now(),
        data: weather
      });

      return weather;

    } catch (error) {
      console.error('Error obteniendo datos meteorológicos:', error.message);
      return {
        error: 'Error al obtener datos meteorológicos',
        details: error.message
      };
    }
  }

  /**
   * Obtener condiciones climáticas históricas (5 días atrás máximo)
   */
  async getHistoricalWeather(latitude, longitude, timestamp) {
    if (!this.isConfigured()) {
      return {
        error: 'OpenWeatherMap API key no configurada',
        configured: false
      };
    }

    try {
      // OpenWeatherMap API gratuita solo permite datos actuales
      // Para históricos se requiere suscripción premium
      // Por ahora, retornar datos actuales si el timestamp es reciente (<5 días)
      
      const now = Date.now();
      const targetTime = new Date(timestamp).getTime();
      const daysDiff = (now - targetTime) / (1000 * 60 * 60 * 24);

      if (daysDiff < 1) {
        // Si es del último día, usar datos actuales
        return await this.getCurrentWeather(latitude, longitude);
      } else {
        return {
          error: 'Datos históricos no disponibles',
          message: 'La API gratuita solo proporciona datos actuales. Para históricos se requiere suscripción premium.',
          daysSince: Math.floor(daysDiff)
        };
      }

    } catch (error) {
      return {
        error: 'Error al obtener datos históricos',
        details: error.message
      };
    }
  }

  /**
   * Analizar condiciones atmosféricas relevantes para avistamientos
   */
  analyzeAtmosphericConditions(weather) {
    const analysis = {
      visibility_quality: 'unknown',
      likelihood_of_optical_phenomena: 'low',
      weather_explanation_probability: 'low',
      relevant_conditions: [],
      warnings: []
    };

    // Calidad de visibilidad
    if (weather.visibility >= 10000) {
      analysis.visibility_quality = 'excellent';
    } else if (weather.visibility >= 5000) {
      analysis.visibility_quality = 'good';
    } else if (weather.visibility >= 2000) {
      analysis.visibility_quality = 'moderate';
    } else if (weather.visibility >= 1000) {
      analysis.visibility_quality = 'poor';
    } else {
      analysis.visibility_quality = 'very_poor';
      analysis.warnings.push('Visibilidad muy reducida - dificulta identificación precisa');
    }

    // Cobertura nubosa
    if (weather.clouds.coverage > 80) {
      analysis.relevant_conditions.push('Cielo muy nublado');
      analysis.weather_explanation_probability = 'medium';
    } else if (weather.clouds.coverage > 50) {
      analysis.relevant_conditions.push('Cielo parcialmente nublado');
    } else if (weather.clouds.coverage < 20) {
      analysis.relevant_conditions.push('Cielo despejado - buena visibilidad');
    }

    // Fenómenos ópticos probables
    if (weather.clouds.coverage > 0 && weather.clouds.coverage < 50) {
      if (weather.conditions.main === 'clouds') {
        analysis.likelihood_of_optical_phenomena = 'medium';
        analysis.relevant_conditions.push('Condiciones para halos solares/lunares');
      }
    }

    // Precipitación
    if (weather.precipitation.rain_1h > 0) {
      analysis.relevant_conditions.push(`Lluvia: ${weather.precipitation.rain_1h}mm/h`);
      analysis.weather_explanation_probability = 'high';
      analysis.warnings.push('Precipitación puede causar reflejos y distorsiones');
    }

    if (weather.precipitation.snow_1h > 0) {
      analysis.relevant_conditions.push(`Nieve: ${weather.precipitation.snow_1h}mm/h`);
      analysis.likelihood_of_optical_phenomena = 'high';
      analysis.relevant_conditions.push('Cristales de hielo - posibles halos y pilares de luz');
    }

    // Niebla
    if (weather.visibility < 1000 && weather.humidity > 90) {
      analysis.relevant_conditions.push('Condiciones de niebla');
      analysis.weather_explanation_probability = 'very_high';
      analysis.warnings.push('Niebla causa distorsiones visuales y efectos ópticos');
    }

    // Viento
    if (weather.wind.speed > 10) {
      analysis.relevant_conditions.push(`Viento fuerte: ${weather.wind.speed}m/s`);
      analysis.warnings.push('Viento fuerte puede causar movimientos erráticos de objetos');
    }

    // Tormentas
    if (weather.conditions.main === 'thunderstorm') {
      analysis.relevant_conditions.push('Tormenta eléctrica activa');
      analysis.likelihood_of_optical_phenomena = 'very_high';
      analysis.weather_explanation_probability = 'very_high';
      analysis.warnings.push('Tormentas producen fenómenos luminosos (rayos, sprites, fuego de San Telmo)');
    }

    // Temperatura extrema
    if (weather.temperature.current < -10) {
      analysis.relevant_conditions.push('Temperatura muy baja');
      analysis.likelihood_of_optical_phenomena = 'high';
      analysis.warnings.push('Frío extremo favorece pilares de luz y cristales de hielo');
    }

    return analysis;
  }

  /**
   * Determinar tipo de nubes según cobertura
   */
  getCloudType(coverage) {
    if (coverage < 10) return 'clear';
    if (coverage < 30) return 'few';
    if (coverage < 60) return 'scattered';
    if (coverage < 90) return 'broken';
    return 'overcast';
  }

  /**
   * Limpiar cache antiguo
   */
  clearOldCache() {
    const now = Date.now();
    for (const [key, value] of this.cache.entries()) {
      if (now - value.timestamp > this.cacheDuration) {
        this.cache.delete(key);
      }
    }
  }
}

module.exports = new WeatherService();
