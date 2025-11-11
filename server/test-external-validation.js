/**
 * Script de prueba para validación externa
 * 
 * Demuestra cómo el sistema verifica avistamientos contra:
 * - Aeronaves (OpenSky Network)
 * - Satélites (N2YO - requiere API key)
 * - Objetos celestes (SunCalc - siempre disponible)
 */

require('dotenv').config();
const externalValidationService = require('./services/externalValidationService');

async function testValidation() {
  console.log('');
  console.log('═'.repeat(70));
  console.log('🛸 TEST DE VALIDACIÓN EXTERNA - SISTEMA UAP');
  console.log('═'.repeat(70));
  console.log('');

  // Caso 1: Madrid, España - Ahora mismo
  console.log('📍 CASO 1: Madrid, España - Timestamp actual');
  console.log('─'.repeat(70));
  
  const madridCoords = { lat: 40.4168, lng: -3.7038 };
  const now = new Date();
  
  console.log(`   Coordenadas: ${madridCoords.lat}, ${madridCoords.lng}`);
  console.log(`   Timestamp: ${now.toISOString()}`);
  console.log('');

  const result1 = await externalValidationService.validateSighting(
    madridCoords,
    now,
    null // sin altitud
  );

  console.log('');
  console.log('📊 RESULTADOS:');
  console.log('─'.repeat(70));
  console.log(`   Confianza: ${result1.confidence}%`);
  console.log(`   Coincidencias: ${result1.matches.length}`);
  console.log('');

  if (result1.matches.length > 0) {
    console.log('🎯 COINCIDENCIAS ENCONTRADAS:');
    result1.matches.forEach((match, i) => {
      console.log(`   ${i + 1}. [${match.type.toUpperCase()}] ${match.name || match.callsign}`);
      if (match.distance) console.log(`      Distancia: ${match.distance} km`);
      if (match.altitude) console.log(`      Altitud: ${match.altitude}${typeof match.altitude === 'number' ? 'm' : ''}`);
      if (match.note) console.log(`      Nota: ${match.note}`);
      console.log(`      Confianza: ${match.confidence}%`);
      console.log('');
    });
  } else {
    console.log('   ℹ️ No se encontraron coincidencias directas');
  }

  console.log('📝 RESUMEN:');
  console.log(`   ${result1.summary}`);
  console.log('');

  // Mostrar detalles de validaciones
  console.log('🔍 DETALLES POR FUENTE:');
  console.log('─'.repeat(70));

  if (result1.validations.aircraft) {
    console.log(`   ✈️  Aeronaves (OpenSky): ${result1.validations.aircraft.totalFound || 0} encontradas`);
  }

  if (result1.validations.satellites) {
    console.log(`   🛰️  Satélites (N2YO): ${result1.validations.satellites.totalFound || 0} visibles`);
    if (result1.validations.satellites.error) {
      console.log(`       ⚠️  ${result1.validations.satellites.error}`);
    }
  }

  if (result1.validations.celestial) {
    console.log(`   🌙 Objetos Celestes (SunCalc): ${result1.validations.celestial.totalFound || 0} visibles`);
    console.log(`       Día: ${result1.validations.celestial.isDaytime ? 'Sí' : 'No'}`);
    console.log(`       Noche: ${result1.validations.celestial.isNight ? 'Sí' : 'No'}`);
    if (result1.validations.celestial.sunTimes) {
      console.log(`       Amanecer: ${result1.validations.celestial.sunTimes.sunrise.toLocaleTimeString('es-ES')}`);
      console.log(`       Atardecer: ${result1.validations.celestial.sunTimes.sunset.toLocaleTimeString('es-ES')}`);
    }
  }

  console.log('');
  console.log('═'.repeat(70));
  console.log('');

  // Caso 2: Prueba nocturna (simulada)
  console.log('📍 CASO 2: Madrid - Horario nocturno (simulado)');
  console.log('─'.repeat(70));

  const nightTime = new Date();
  nightTime.setHours(23, 30, 0); // 23:30

  console.log(`   Timestamp: ${nightTime.toISOString()}`);
  console.log('');

  const result2 = await externalValidationService.validateSighting(
    madridCoords,
    nightTime,
    null
  );

  console.log('📊 RESULTADOS:');
  console.log('─'.repeat(70));
  console.log(`   Coincidencias: ${result2.matches.length}`);
  console.log('');

  if (result2.matches.length > 0) {
    console.log('🎯 OBJETOS CELESTES VISIBLES DE NOCHE:');
    result2.matches
      .filter(m => m.type === 'celestial')
      .forEach((match, i) => {
        console.log(`   ${i + 1}. ${match.name}`);
        if (match.altitude) console.log(`      Altitud: ${match.altitude}°`);
        if (match.phase) console.log(`      Fase: ${match.phase}`);
        if (match.illumination) console.log(`      Iluminación: ${match.illumination}`);
        console.log('');
      });
  }

  console.log('');
  console.log('═'.repeat(70));
  console.log('✅ TEST COMPLETADO');
  console.log('═'.repeat(70));
  console.log('');
  console.log('NOTAS:');
  console.log('- OpenSky Network: SIEMPRE disponible (no requiere API key)');
  console.log('- SunCalc: SIEMPRE disponible (cálculos astronómicos locales)');
  console.log('- N2YO Satélites: Requiere API key gratuita de https://www.n2yo.com/api/');
  console.log('  (Configura N2YO_API_KEY en .env para rastreo de ISS, Starlink, etc.)');
  console.log('');
}

// Ejecutar test
testValidation()
  .then(() => {
    console.log('');
    process.exit(0);
  })
  .catch(error => {
    console.error('❌ Error en test:', error);
    process.exit(1);
  });
