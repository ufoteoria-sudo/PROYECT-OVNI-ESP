/**
 * Servicio de APIs Gratuitas para Rastreo de Vuelos
 * Alternativas 100% GRATIS a FlightRadar24
 */

const axios = require('axios');

class FreeFlightAPIs {
  
  constructor() {
    this.apis = {
      // 1. OpenSky Network - Completamente GRATIS
      opensky: 'https://opensky-network.org/api',
      
      // 2. ADS-B Exchange - GRATIS (datos crowdsourced)
      adsbexchange: 'https://globe.adsbexchange.com/globe_history',
      
      // 3. AviationStack - 100 req/mes GRATIS
      aviationstack: 'http://api.aviationstack.com/v1',
      
      // 4. FlightAware AeroAPI - Plan gratuito limitado
      flightaware: 'https://aeroapi.flightaware.com/aeroapi'
    };
  }

  /**
   * 1. OpenSky Network - Principal y completamente gratis
   * Sin límites, sin API key, datos en tiempo real
   */
  async getOpenSkyFlights(coordinates, radius = 0.5) {
    try {
      const { lat, lng } = coordinates;
      const latMin = lat - radius;
      const latMax = lat + radius;
      const lonMin = lng - radius;
      const lonMax = lng + radius;
      
      const url = `${this.apis.opensky}/states/all?lamin=${latMin}&lomin=${lonMin}&lamax=${latMax}&lomax=${lonMax}`;
      
      const response = await axios.get(url, {
        timeout: 10000,
        headers: { 'User-Agent': 'UAP-Analysis-System/2.0' }
      });

      if (!response.data || !response.data.states) {
        return { flights: [], source: 'OpenSky Network' };
      }

      const flights = response.data.states.map(state => ({
        callsign: (state[1] || 'Unknown').trim(),
        icao24: state[0],
        country: state[2],
        latitude: state[6],
        longitude: state[5],
        altitude: state[7] ? Math.round(state[7]) : null,
        velocity: state[9] ? Math.round(state[9] * 3.6) : null, // m/s a km/h
        heading: state[10],
        verticalRate: state[11],
        onGround: state[8],
        lastSeen: state[4]
      })).filter(f => f.latitude && f.longitude);

      return {
        flights,
        total: flights.length,
        source: 'OpenSky Network',
        free: true,
        noApiKeyNeeded: true
      };
      
    } catch (error) {
      console.error('Error OpenSky:', error.message);
      return { flights: [], error: error.message, source: 'OpenSky Network' };
    }
  }

  /**
   * 2. ADS-B Exchange - Alternativa gratuita con más cobertura
   * Datos crowdsourced, sin límites
   */
  async getADSBExchangeFlights(coordinates, timestamp) {
    try {
      // ADS-B Exchange usa archivos JSON históricos por fecha
      const date = new Date(timestamp);
      const dateStr = date.toISOString().split('T')[0]; // YYYY-MM-DD
      const hour = date.getUTCHours();
      
      // URL de datos históricos (últimas 24h disponibles gratis)
      const url = `${this.apis.adsbexchange}/${dateStr}/${hour}/traces.json`;
      
      const response = await axios.get(url, {
        timeout: 15000,
        headers: { 'User-Agent': 'UAP-Analysis-System/2.0' }
      });

      // Filtrar vuelos cercanos a las coordenadas
      const { lat, lng } = coordinates;
      const flights = [];

      if (response.data && Array.isArray(response.data)) {
        for (const aircraft of response.data) {
          if (aircraft.lat && aircraft.lon) {
            const distance = this.calculateDistance(lat, lng, aircraft.lat, aircraft.lon);
            
            if (distance <= 100) { // Dentro de 100km
              flights.push({
                callsign: aircraft.flight || 'Unknown',
                icao24: aircraft.hex,
                latitude: aircraft.lat,
                longitude: aircraft.lon,
                altitude: aircraft.alt_baro,
                velocity: aircraft.gs, // Ground speed
                heading: aircraft.track,
                distance: Math.round(distance * 100) / 100,
                source: 'ADS-B Exchange'
              });
            }
          }
        }
      }

      return {
        flights,
        total: flights.length,
        source: 'ADS-B Exchange',
        free: true,
        noApiKeyNeeded: true
      };
      
    } catch (error) {
      console.error('Error ADS-B Exchange:', error.message);
      return { flights: [], error: error.message, source: 'ADS-B Exchange' };
    }
  }

  /**
   * 3. AviationStack - 100 requests/mes GRATIS
   * Requiere API key gratuita: https://aviationstack.com/
   */
  async getAviationStackFlights(coordinates, apiKey = null) {
    if (!apiKey) {
      return {
        flights: [],
        message: 'AviationStack requiere API key gratuita (100 req/mes)',
        signupUrl: 'https://aviationstack.com/product',
        source: 'AviationStack'
      };
    }

    try {
      // AviationStack no soporta búsqueda por coordenadas directamente
      // Pero podemos buscar vuelos activos y filtrar
      const url = `${this.apis.aviationstack}/flights?access_key=${apiKey}&limit=100`;
      
      const response = await axios.get(url, { timeout: 10000 });

      if (!response.data || !response.data.data) {
        return { flights: [], source: 'AviationStack' };
      }

      const { lat, lng } = coordinates;
      const flights = [];

      for (const flight of response.data.data) {
        if (flight.live && flight.live.latitude && flight.live.longitude) {
          const distance = this.calculateDistance(
            lat, lng,
            flight.live.latitude,
            flight.live.longitude
          );

          if (distance <= 100) {
            flights.push({
              callsign: flight.flight.iata || flight.flight.icao,
              airline: flight.airline.name,
              latitude: flight.live.latitude,
              longitude: flight.live.longitude,
              altitude: flight.live.altitude,
              velocity: flight.live.speed_horizontal,
              heading: flight.live.direction,
              distance: Math.round(distance * 100) / 100,
              departure: flight.departure.airport,
              arrival: flight.arrival.airport,
              source: 'AviationStack'
            });
          }
        }
      }

      return {
        flights,
        total: flights.length,
        source: 'AviationStack',
        free: true,
        limitPerMonth: 100
      };
      
    } catch (error) {
      console.error('Error AviationStack:', error.message);
      return { flights: [], error: error.message, source: 'AviationStack' };
    }
  }

  /**
   * Método agregador - Consulta múltiples APIs gratuitas
   */
  async getAllFlights(coordinates, timestamp = new Date(), options = {}) {
    console.log('✈️ Consultando APIs gratuitas de vuelos...');

    const results = await Promise.allSettled([
      this.getOpenSkyFlights(coordinates),
      this.getADSBExchangeFlights(coordinates, timestamp),
      options.aviationStackKey ? this.getAviationStackFlights(coordinates, options.aviationStackKey) : null
    ].filter(Boolean));

    const allFlights = [];
    const sources = [];

    for (const result of results) {
      if (result.status === 'fulfilled' && result.value) {
        const data = result.value;
        if (data.flights && data.flights.length > 0) {
          allFlights.push(...data.flights);
          sources.push(data.source);
        }
      }
    }

    // Eliminar duplicados por ICAO24
    const uniqueFlights = this.deduplicateFlights(allFlights);

    return {
      flights: uniqueFlights,
      total: uniqueFlights.length,
      sources: sources,
      queriedAt: new Date(),
      allFree: true
    };
  }

  /**
   * Eliminar vuelos duplicados (mismo ICAO24)
   */
  deduplicateFlights(flights) {
    const seen = new Map();
    
    for (const flight of flights) {
      const key = flight.icao24 || flight.callsign;
      if (key && !seen.has(key)) {
        seen.set(key, flight);
      }
    }
    
    return Array.from(seen.values());
  }

  /**
   * Calcular distancia entre dos coordenadas (fórmula Haversine)
   */
  calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 6371; // Radio de la Tierra en km
    const dLat = this.toRad(lat2 - lat1);
    const dLon = this.toRad(lon2 - lon1);
    
    const a = 
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRad(lat1)) * Math.cos(this.toRad(lat2)) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  toRad(degrees) {
    return degrees * (Math.PI / 180);
  }

  /**
   * Instrucciones para obtener API keys gratuitas
   */
  getSetupInstructions() {
    return {
      'OpenSky Network': {
        free: true,
        noApiKey: true,
        url: 'https://opensky-network.org/',
        limits: 'Sin límites',
        status: '✅ Ya implementado'
      },
      'ADS-B Exchange': {
        free: true,
        noApiKey: true,
        url: 'https://globe.adsbexchange.com/',
        limits: 'Sin límites',
        status: '✅ Ya implementado'
      },
      'AviationStack': {
        free: true,
        requiresApiKey: true,
        url: 'https://aviationstack.com/product',
        steps: [
          '1. Crear cuenta gratis',
          '2. Copiar API key del dashboard',
          '3. Agregar AVIATIONSTACK_KEY en .env'
        ],
        limits: '100 requests/mes',
        status: '⚠️ Opcional'
      },
      'FlightAware': {
        free: 'Plan limitado',
        requiresApiKey: true,
        url: 'https://www.flightaware.com/commercial/aeroapi/',
        limits: 'Limitado',
        status: '❌ No recomendado'
      }
    };
  }
}

module.exports = new FreeFlightAPIs();
