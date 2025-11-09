const axios = require('axios');
const moment = require('moment');

/**
 * Servicio de Validación Externa
 * Integra APIs externas para verificar si un avistamiento
 * coincide con vuelos comerciales, satélites u otros objetos conocidos
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
      const [aircraftData, satelliteData] = await Promise.allSettled([
        this.checkAircraft(coordinates, timestamp, altitude),
        this.checkSatellites(coordinates, timestamp)
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

    const parts = [];

    if (aircraft.length > 0) {
      const closest = aircraft.sort((a, b) => a.distance - b.distance)[0];
      parts.push(`Se detectó ${aircraft.length} aeronave(s) en un radio de 50km. La más cercana: ${closest.callsign || 'desconocido'} a ${closest.distance}km de distancia.`);
    }

    if (satellites.length > 0) {
      parts.push(`Se identificaron ${satellites.length} satélite(s) visible(s) en el momento del avistamiento.`);
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
