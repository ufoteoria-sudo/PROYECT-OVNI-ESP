const mongoose = require('mongoose');
require('dotenv').config();

const analysisSchema = new mongoose.Schema({}, { strict: false });
const Analysis = mongoose.model('Analysis', analysisSchema);

async function checkAnalysis() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Conectado a MongoDB\n');
    
    const analysis = await Analysis.findById('69109118ecf3a7dcff084058');
    
    if (!analysis) {
      console.log('❌ Análisis no encontrado');
      process.exit(1);
    }
    
    console.log('📊 ANÁLISIS:');
    console.log(`  ID: ${analysis._id}`);
    console.log(`  Archivo: ${analysis.fileName}`);
    console.log(`  Status: ${analysis.status}`);
    console.log(`  Tipo detectado: ${analysis.aiClassification?.type || 'N/A'}`);
    console.log(`  Confianza: ${analysis.aiClassification?.confidence || 'N/A'}%`);
    console.log('\n🌍 EXIF GPS:');
    if (analysis.exifData?.gps) {
      console.log(`  Latitud: ${analysis.exifData.gps.latitude}`);
      console.log(`  Longitud: ${analysis.exifData.gps.longitude}`);
      console.log(`  Altitud: ${analysis.exifData.gps.altitude || 'N/A'}`);
    } else {
      console.log('  No hay datos GPS');
    }
    
    console.log('\n🔍 VALIDACIÓN EXTERNA:');
    if (analysis.externalValidation) {
      console.log(`  Ejecutada: ${analysis.externalValidation.performed ? 'SÍ' : 'NO'}`);
      if (analysis.externalValidation.performed) {
        console.log(`  Timestamp: ${analysis.externalValidation.performedAt}`);
        console.log(`  Hay matches: ${analysis.externalValidation.hasMatches ? 'SÍ' : 'NO'}`);
        console.log(`  Total matches: ${analysis.externalValidation.matchCount || 0}`);
        console.log(`  Confianza: ${analysis.externalValidation.confidence || 0}%`);
        
        if (analysis.externalValidation.results) {
          console.log('\n  📡 Resultados:');
          console.log(`    Aircraft: ${analysis.externalValidation.results.aircraft?.length || 0}`);
          console.log(`    Satélites: ${analysis.externalValidation.results.satellites?.length || 0}`);
          
          if (analysis.externalValidation.results.aircraft?.length > 0) {
            console.log('\n  ✈️ Aviones detectados:');
            analysis.externalValidation.results.aircraft.slice(0, 3).forEach((a, i) => {
              console.log(`    ${i+1}. ${a.callsign || 'N/A'} - ${a.distance?.toFixed(2) || 'N/A'} km`);
            });
          }
        }
        
        if (analysis.externalValidation.error) {
          console.log(`\n  ⚠️ Error: ${analysis.externalValidation.error}`);
        }
      }
    } else {
      console.log('  No hay datos de validación externa');
    }
    
    await mongoose.connection.close();
    process.exit(0);
  } catch (err) {
    console.error('❌ Error:', err.message);
    process.exit(1);
  }
}

checkAnalysis();
