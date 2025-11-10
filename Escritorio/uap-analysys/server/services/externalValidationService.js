const axios = require('axios');
const moment = require('moment');
const SunCalc = require('suncalc');

/**
 * Servicio de Validación Externa
 * Integra APIs externas para verificar si un avistamiento
 * coincide con vuelos comerciales, satélites u otros objetos conocidos
 * 
 * ACTUALIZADO: Ahora incluye validación de objetos celestes (Luna, Sol, planetas)
 */
class ExternalValidationService {
  
  constructor() {
    // APIs disponibles
    this.apis = {
      opensky: 'https://opensky-network.org/api',          // Tráfico aéreo (GRATIS)
      n2yo: process.env.N2YO_API_KEY,                      // Satélites (requiere API key)
      celestrak: 'https://celestrak.org/NORAD/elements',   // TLE satélites (GRATIS)
      flightradar24: process.env.FLIGHTRADAR24_API_KEY     // Vuelos (requiere API key)
    };

    // Cache de resultados (5 minutos)
    this.cache = new Map();
    this.cacheDuration = 5 * 60 * 1000;
  }

  /**
   * Validación principal - coordina todas las fuentes
   */
  async validateSighting(coordinates, timestamp, altitude = null) {
    try {
      const results = {
        timestamp: timestamp,
        coordinates: coordinates,
        validations: {
          aircraft: null,
          satellites: null,
          celestial: null
        },
        matches: [],
        confidence: 0,
        summary: ''
      };

      // Validar en paralelo todas las fuentes
      const [aircraftData, satelliteData, celestialData, balloonData] = await Promise.allSettled([
        this.checkAircraft(coordinates, timestamp, altitude),
        this.checkSatellites(coordinates, timestamp),
        this.checkCelestialObjects(coordinates, timestamp),
        this.checkBalloons(coordinates, timestamp)
      ]);

      // Procesar resultados de aeronaves
      if (aircraftData.status === 'fulfilled' && aircraftData.value) {
        results.validations.aircraft = aircraftData.value;
        if (aircraftData.value.matches.length > 0) {
          results.matches.push(...aircraftData.value.matches.map(m => ({
            ...m,
            type: 'aircraft'
          })));
        }
      }

      // Procesar resultados de satélites
      if (satelliteData.status === 'fulfilled' && satelliteData.value) {
        results.validations.satellites = satelliteData.value;
        if (satelliteData.value.matches.length > 0) {
          results.matches.push(...satelliteData.value.matches.map(m => ({
            ...m,
            type: 'satellite'
          })));
        }
      }

      // Procesar resultados de objetos celestes
      if (celestialData.status === 'fulfilled' && celestialData.value) {
        results.validations.celestial = celestialData.value;
        if (celestialData.value.matches.length > 0) {
          results.matches.push(...celestialData.value.matches.map(m => ({
            ...m,
            type: 'celestial'
          })));
        }
      }

      // Procesar resultados de globos (NUEVO)
      if (balloonData.status === 'fulfilled' && balloonData.value) {
        results.validations.balloons = balloonData.value;
        if (balloonData.value.matches.length > 0) {
          results.matches.push(...balloonData.value.matches.map(m => ({
            ...m,
            type: 'balloon'
          })));
        }
      }

      // Calcular confianza de coincidencia
      results.confidence = this.calculateMatchConfidence(results.matches);
      results.summary = this.generateSummary(results.matches);

      return results;

    } catch (error) {
      console.error('Error en validación externa:', error);
      return {
        error: 'Error en validación externa',
        details: error.message
      };
    }
  }

  /**
   * Verificar tráfico aéreo (OpenSky Network)
   * API GRATUITA - Sin límites estrictos
   */
  async checkAircraft(coordinates, timestamp, altitude = null) {
    try {
      const cacheKey = `aircraft_${coordinates.lat}_${coordinates.lng}_${timestamp}`;
      
      // Verificar cache
      if (this.cache.has(cacheKey)) {
        const cached = this.cache.get(cacheKey);
        if (Date.now() - cached.timestamp < this.cacheDuration) {
          return cached.data;
        }
      }

      const { lat, lng } = coordinates;
      
      // Área de búsqueda: ±0.5 grados (~55km)
      const latMin = lat - 0.5;
      const latMax = lat + 0.5;
      const lonMin = lng - 0.5;
      const lonMax = lng + 0.5;

      // Timestamp en formato Unix
      const time = Math.floor(new Date(timestamp).getTime() / 1000);

      // Consultar OpenSky Network
      const url = `${this.apis.opensky}/states/all?time=${time}&lamin=${latMin}&lomin=${lonMin}&lamax=${latMax}&lomax=${lonMax}`;
      
      console.log(`🛩️  Consultando OpenSky Network: ${url}`);
      
      const response = await axios.get(url, {
        timeout: 10000,
        headers: {
          'User-Agent': 'UAP-Analysis-System/2.0'
        }
      });

      const matches = [];

      if (response.data && response.data.states) {
        // Procesar cada aeronave detectada
        for (const state of response.data.states) {
          const aircraft = this.parseOpenSkyState(state);
          
          // Calcular distancia al punto de avistamiento
          const distance = this.calculateDistance(
            lat, lng,
            aircraft.latitude, aircraft.longitude
          );

          // Considerar coincidencia si está a menos de 50km
          if (distance <= 50) {
            matches.push({
              source: 'OpenSky Network',
              callsign: aircraft.callsign,
              icao24: aircraft.icao24,
              origin: aircraft.origin_country,
              latitude: aircraft.latitude,
              longitude: aircraft.longitude,
              altitude: aircraft.altitude,
              velocity: aircraft.velocity,
              heading: aircraft.heading,
              distance: Math.round(distance * 100) / 100,
              timestamp: aircraft.time_position,
              confidence: this.calculateAircraftConfidence(distance, altitude, aircraft.altitude)
            });
          }
        }
      }

      const result = {
        source: 'OpenSky Network',
        queriedAt: new Date(),
        area: { latMin, latMax, lonMin, lonMax },
        matches: matches,
        totalFound: matches.length
      };

      // Guardar en cache
      this.cache.set(cacheKey, {
        timestamp: Date.now(),
        data: result
      });

      return result;

    } catch (error) {
      console.error('Error consultando OpenSky:', error.message);
      return {
        source: 'OpenSky Network',
        error: error.message,
        matches: []
      };
    }
  }

  /**
   * Verificar satélites visibles (N2YO API)
   * Requiere API key gratuita de https://www.n2yo.com/api/
   */
  async checkSatellites(coordinates, timestamp) {
    try {
      // Si no hay API key, intentar con Celestrak (limitado)
      if (!this.apis.n2yo || this.apis.n2yo === 'your_n2yo_api_key_here') {
        return this.checkSatellitesCelestrak(coordinates, timestamp);
      }

      const cacheKey = `satellites_${coordinates.lat}_${coordinates.lng}_${timestamp}`;
      
      // Verificar cache
      if (this.cache.has(cacheKey)) {
        const cached = this.cache.get(cacheKey);
        if (Date.now() - cached.timestamp < this.cacheDuration) {
          return cached.data;
        }
      }

      const { lat, lng } = coordinates;
      const altitude = 0; // Altitud del observador (nivel del mar)
      const searchRadius = 70; // Grados sobre el horizonte (70° = visible)
      const category = 0; // 0 = todos los satélites

      // Consultar N2YO API
      const url = `https://api.n2yo.com/rest/v1/satellite/above/${lat}/${lng}/${altitude}/${searchRadius}/${category}/&apiKey=${this.apis.n2yo}`;
      
      console.log(`🛰️  Consultando N2YO API para satélites visibles`);
      
      const response = await axios.get(url, {
        timeout: 10000
      });

      const matches = [];

      if (response.data && response.data.above) {
        for (const sat of response.data.above) {
          matches.push({
            source: 'N2YO',
            name: sat.satname,
            noradId: sat.satid,
            latitude: sat.satlat,
            longitude: sat.satlng,
            altitude: sat.satalt,
            azimuth: sat.sataz,
            elevation: sat.satel,
            rightAscension: sat.ra,
            declination: sat.dec,
            confidence: sat.satel > 30 ? 'high' : 'medium' // Mayor elevación = más visible
          });
        }
      }

      const result = {
        source: 'N2YO',
        queriedAt: new Date(),
        matches: matches,
        totalFound: matches.length
      };

      // Guardar en cache
      this.cache.set(cacheKey, {
        timestamp: Date.now(),
        data: result
      });

      return result;

    } catch (error) {
      console.error('Error consultando N2YO:', error.message);
      return {
        source: 'N2YO',
        error: error.message,
        matches: []
      };
    }
  }

  /**
   * Fallback: Verificar satélites con Celestrak (sin API key)
   * Limitado pero funcional
   */
  async checkSatellitesCelestrak(coordinates, timestamp) {
    try {
      // Por ahora retornar estructura básica
      // En producción, se podría descargar TLEs y calcular posiciones
      return {
        source: 'Celestrak (offline)',
        queriedAt: new Date(),
        matches: [],
        totalFound: 0,
        note: 'Se requiere API key de N2YO para tracking en tiempo real de satélites'
      };
    } catch (error) {
      return {
        source: 'Celestrak',
        error: error.message,
        matches: []
      };
    }
  }

  /**
   * Parsear estado de aeronave de OpenSky
   */
  parseOpenSkyState(state) {
    return {
      icao24: state[0],           // ICAO24 address
      callsign: state[1]?.trim(), // Callsign
      origin_country: state[2],   // Country
      time_position: state[3],    // Unix timestamp
      last_contact: state[4],     // Unix timestamp
      longitude: state[5],        // Longitude
      latitude: state[6],         // Latitude
      altitude: state[7],         // Barometric altitude (m)
      on_ground: state[8],        // On ground flag
      velocity: state[9],         // Velocity (m/s)
      heading: state[10],         // True track (degrees)
      vertical_rate: state[11],   // Vertical rate (m/s)
      sensors: state[12],         // Sensor IDs
      geo_altitude: state[13],    // Geometric altitude (m)
      squawk: state[14],          // Squawk code
      spi: state[15],             // Special position indicator
      position_source: state[16]  // Position source
    };
  }

  /**
   * Verificar objetos celestes (Luna, Sol, planetas) con SunCalc
   * Esta validación NO requiere API key
   */
  async checkCelestialObjects(coordinates, timestamp) {
    try {
      console.log('🌙 Calculando posición de objetos celestes...');

      const { lat, lng } = coordinates;
      const date = new Date(timestamp);
      
      const matches = [];

      // Calcular posición del Sol
      const sunPosition = SunCalc.getPosition(date, lat, lng);
      const sunAltitude = sunPosition.altitude * 180 / Math.PI; // Convertir a grados
      const sunAzimuth = sunPosition.azimuth * 180 / Math.PI;

      // Sol visible si está sobre el horizonte
      if (sunAltitude > -6) { // Incluir crepúsculo civil
        matches.push({
          name: 'Sol',
          type: 'star',
          altitude: sunAltitude.toFixed(2),
          azimuth: sunAzimuth.toFixed(2),
          visible: sunAltitude > 0,
          brightness: 'extremely_bright',
          confidence: sunAltitude > 0 ? 95 : 70,
          note: sunAltitude > 0 ? 'Visible en el cielo' : 'En crepúsculo'
        });
      }

      // Calcular posición de la Luna
      const moonPosition = SunCalc.getMoonPosition(date, lat, lng);
      const moonAltitude = moonPosition.altitude * 180 / Math.PI;
      const moonAzimuth = moonPosition.azimuth * 180 / Math.PI;
      const moonIllumination = SunCalc.getMoonIllumination(date);

      // Luna visible si está sobre el horizonte
      if (moonAltitude > 0) {
        const phase = this.getMoonPhaseName(moonIllumination.phase);
        const illumination = (moonIllumination.fraction * 100).toFixed(1);
        
        matches.push({
          name: 'Luna',
          type: 'moon',
          altitude: moonAltitude.toFixed(2),
          azimuth: moonAzimuth.toFixed(2),
          visible: true,
          phase: phase,
          illumination: illumination + '%',
          brightness: moonIllumination.fraction > 0.5 ? 'bright' : 'dim',
          confidence: 90,
          note: `Fase: ${phase}, Iluminación: ${illumination}%`
        });
      }

      // Calcular horarios de sol/luna
      const sunTimes = SunCalc.getTimes(date, lat, lng);
      const moonTimes = SunCalc.getMoonTimes(date, lat, lng);

      const isDaytime = date > sunTimes.sunrise && date < sunTimes.sunset;
      const isNight = date > sunTimes.night && date < sunTimes.nightEnd;

      // Venus es visible cerca del amanecer/atardecer
      const timeSinceSunset = (date - sunTimes.sunset) / (1000 * 60); // minutos
      const timeUntilSunrise = (sunTimes.sunrise - date) / (1000 * 60);

      // Venus visible en crepúsculo (90 min después de atardecer o antes de amanecer)
      if ((timeSinceSunset >= 0 && timeSinceSunset <= 90) || 
          (timeUntilSunrise >= 0 && timeUntilSunrise <= 90)) {
        matches.push({
          name: 'Venus',
          type: 'planet',
          altitude: null, // Requiere cálculos astronómicos más complejos
          azimuth: null,
          visible: 'possibly',
          brightness: 'very_bright',
          confidence: 60,
          note: 'Visible como "estrella vespertina" o "estrella matutina"'
        });
      }

      // Estrellas brillantes (Sirio, etc.) visibles de noche
      if (isNight) {
        matches.push({
          name: 'Estrellas brillantes',
          type: 'star',
          visible: 'possibly',
          brightness: 'bright',
          confidence: 50,
          note: 'Sirio, Canopus, Arturo u otras estrellas brillantes pueden ser visibles'
        });
      }

      const result = {
        source: 'SunCalc (Cálculo Astronómico)',
        queriedAt: new Date(),
        isDaytime,
        isNight,
        sunTimes: {
          sunrise: sunTimes.sunrise,
          sunset: sunTimes.sunset,
          solarNoon: sunTimes.solarNoon
        },
        moonTimes: {
          rise: moonTimes.rise,
          set: moonTimes.set
        },
        matches: matches,
        totalFound: matches.length
      };

      console.log(`   ✅ Encontrados ${matches.length} objetos celestes visibles`);

      return result;

    } catch (error) {
      console.error('Error calculando objetos celestes:', error.message);
      return {
        source: 'SunCalc',
        error: error.message,
        matches: []
      };
    }
  }

  /**
   * Verificar globos estratosféricos y aerostáticos
   * 
   * Utiliza base de datos local con lanzamientos de StratoCat
   * (stratocat.com mantiene registro histórico de globos estratosféricos)
   * 
   * NOTA: Por ahora implementación simplificada. En producción, se podría:
   * 1. Scrapear stratocat.com periódicamente
   * 2. Mantener base de datos local de lanzamientos
   * 3. Consultar API si está disponible
   */
  async checkBalloons(coordinates, timestamp) {
    try {
      console.log('🎈 Verificando globos estratosféricos/aerostáticos...');

      const { lat, lng } = coordinates;
      const date = new Date(timestamp);
      
      const matches = [];

      // Base de datos simplificada de lanzamientos conocidos
      // EN PRODUCCIÓN: Esto debería ser una base de datos MongoDB o scraping de stratocat.com
      const knownBalloonLaunches = [
        {
          name: 'Google Loon',
          type: 'Globo estratosférico',
          activeYears: [2013, 2014, 2015, 2016, 2017, 2018, 2019, 2020, 2021],
          regions: ['US', 'NZ', 'BR', 'AU'], // USA, Nueva Zelanda, Brasil, Australia
          altitude: 20000, // metros
          description: 'Globos de internet estratosférico de Google'
        },
        {
          name: 'Globo meteorológico',
          type: 'Globo meteorológico',
          activeYears: 'all', // Siempre activo
          regions: 'worldwide',
          altitude: 30000,
          frequency: 'daily', // Lanzamientos diarios en todo el mundo
          description: 'Globos meteorológicos lanzados por agencias meteorológicas (2 lanzamientos diarios por estación)'
        },
        {
          name: 'Globo científico',
          type: 'Globo estratosférico',
          activeYears: 'all',
          regions: 'worldwide',
          altitude: 40000,
          frequency: 'occasional',
          description: 'Globos científicos para investigación atmosférica'
        },
        {
          name: 'Project Stratos',
          type: 'Globo tripulado',
          activeYears: [2012],
          regions: ['US'],
          altitude: 39000,
          description: 'Salto de Felix Baumgartner desde la estratosfera'
        }
      ];

      // Verificar si hay globos activos en la fecha/región
      knownBalloonLaunches.forEach(balloon => {
        let isActive = false;
        
        // Verificar si está activo en el año
        if (balloon.activeYears === 'all') {
          isActive = true;
        } else if (Array.isArray(balloon.activeYears)) {
          isActive = balloon.activeYears.includes(date.getFullYear());
        }

        if (isActive) {
          // Los globos meteorológicos se lanzan diariamente en todo el mundo
          if (balloon.type === 'Globo meteorológico') {
            matches.push({
              name: balloon.name,
              type: balloon.type,
              altitude: balloon.altitude,
              description: balloon.description,
              frequency: 'Alta - 2 lanzamientos diarios por estación meteorológica',
              confidence: 50, // Confianza media porque son muy comunes
              note: 'Los globos meteorológicos son muy comunes y podrían explicar avistamientos a gran altura'
            });
          }
          
          // Globos científicos ocasionales
          if (balloon.type === 'Globo estratosférico' && balloon.frequency === 'occasional') {
            matches.push({
              name: balloon.name,
              type: balloon.type,
              altitude: balloon.altitude,
              description: balloon.description,
              confidence: 30, // Confianza baja (ocasional)
              note: 'Posible globo científico - verificar con autoridades aeronáuticas locales'
            });
          }
        }
      });

      console.log(`   ✅ Encontrados ${matches.length} tipos de globos posibles`);

      const result = {
        source: 'StratoCat / Base de Datos de Globos',
        queriedAt: new Date(),
        matches: matches,
        totalFound: matches.length,
        note: 'Datos de globos estratosféricos basados en registros históricos. Para verificación precisa, consultar con autoridades aeronáuticas locales o stratocat.com'
      };

      return result;

    } catch (error) {
      console.error('Error verificando globos:', error.message);
      return {
        source: 'Globos Estratosféricos',
        error: error.message,
        matches: []
      };
    }
  }

  /**
   * Obtener nombre de fase lunar
   */
  getMoonPhaseName(phase) {
    if (phase < 0.05) return 'Luna Nueva';
    if (phase < 0.2) return 'Creciente';
    if (phase < 0.3) return 'Cuarto Creciente';
    if (phase < 0.45) return 'Gibosa Creciente';
    if (phase < 0.55) return 'Luna Llena';
    if (phase < 0.7) return 'Gibosa Menguante';
    if (phase < 0.8) return 'Cuarto Menguante';
    if (phase < 0.95) return 'Menguante';
    return 'Luna Nueva';
  }

  /**
   * Calcular distancia entre dos coordenadas (fórmula Haversine)
   * Retorna distancia en kilómetros
   */
  calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 6371; // Radio de la Tierra en km
    const dLat = this.deg2rad(lat2 - lat1);
    const dLon = this.deg2rad(lon2 - lon1);
    
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(this.deg2rad(lat1)) * Math.cos(this.deg2rad(lat2)) *
      Math.sin(dLon/2) * Math.sin(dLon/2);
    
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    const distance = R * c;
    
    return distance;
  }

  deg2rad(deg) {
    return deg * (Math.PI/180);
  }

  /**
   * Calcular confianza de coincidencia con aeronave
   */
  calculateAircraftConfidence(distance, reportedAltitude, aircraftAltitude) {
    let confidence = 100;

    // Penalizar por distancia
    if (distance > 30) confidence -= 30;
    else if (distance > 10) confidence -= 15;
    else if (distance > 5) confidence -= 5;

    // Comparar altitudes si están disponibles
    if (reportedAltitude && aircraftAltitude) {
      const altDiff = Math.abs(reportedAltitude - aircraftAltitude);
      if (altDiff > 5000) confidence -= 20;
      else if (altDiff > 2000) confidence -= 10;
    }

    return Math.max(0, Math.min(100, confidence));
  }

  /**
   * Calcular confianza total de coincidencia
   */
  calculateMatchConfidence(matches) {
    if (matches.length === 0) return 0;

    // Tomar la coincidencia con mayor confianza
    const maxConfidence = matches.reduce((max, match) => {
      const conf = match.confidence;
      if (typeof conf === 'number') return Math.max(max, conf);
      if (conf === 'high') return Math.max(max, 85);
      if (conf === 'medium') return Math.max(max, 60);
      if (conf === 'low') return Math.max(max, 30);
      return max;
    }, 0);

    return maxConfidence;
  }

  /**
   * Generar resumen de coincidencias
   */
  generateSummary(matches) {
    if (matches.length === 0) {
      return 'No se encontraron coincidencias con objetos conocidos en bases de datos externas.';
    }

    const aircraft = matches.filter(m => m.type === 'aircraft');
    const satellites = matches.filter(m => m.type === 'satellite');
    const celestial = matches.filter(m => m.type === 'celestial');
    const balloons = matches.filter(m => m.type === 'balloon');

    const parts = [];

    if (aircraft.length > 0) {
      const closest = aircraft.sort((a, b) => a.distance - b.distance)[0];
      parts.push(`Se detectó ${aircraft.length} aeronave(s) en un radio de 50km. La más cercana: ${closest.callsign || 'desconocido'} a ${closest.distance}km de distancia.`);
    }

    if (satellites.length > 0) {
      parts.push(`Se identificaron ${satellites.length} satélite(s) visible(s) en el momento del avistamiento.`);
    }

    if (celestial.length > 0) {
      const visible = celestial.filter(c => c.visible === true || c.visible === 'possibly');
      if (visible.length > 0) {
        const names = visible.map(c => c.name).join(', ');
        parts.push(`Objetos celestes visibles: ${names}.`);
      }
    }

    if (balloons.length > 0) {
      parts.push(`Se identificaron ${balloons.length} tipo(s) de globos posibles (meteorológicos, científicos).`);
    }

    if (parts.length === 0) {
      return 'No se encontraron coincidencias claras, pero se detectaron objetos celestes en el área.';
    }

    return parts.join(' ');
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

module.exports = new ExternalValidationService();
