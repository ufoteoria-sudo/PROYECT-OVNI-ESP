const mongoose = require('mongoose');
require('dotenv').config();

const analysisSchema = new mongoose.Schema({}, { strict: false });
const Analysis = mongoose.model('Analysis', analysisSchema);

async function findAnalysis() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Conectado a MongoDB\n');
    
    // Buscar análisis recientes
    const analyses = await Analysis.find()
      .sort({ createdAt: -1 })
      .limit(5)
      .select('_id filename status exifData.gps exifData.timestamp createdAt');
    
    console.log(`📊 Total análisis encontrados: ${analyses.length}\n`);
    
    analyses.forEach((analysis, idx) => {
      console.log(`Análisis ${idx + 1}:`);
      console.log(`  ID: ${analysis._id}`);
      console.log(`  Archivo: ${analysis.filename || 'N/A'}`);
      console.log(`  Status: ${analysis.status || 'N/A'}`);
      console.log(`  GPS: ${analysis.exifData?.gps ? 'SÍ' : 'NO'}`);
      if (analysis.exifData?.gps) {
        console.log(`    Lat: ${analysis.exifData.gps.latitude}`);
        console.log(`    Lon: ${analysis.exifData.gps.longitude}`);
      }
      console.log(`  Timestamp: ${analysis.exifData?.timestamp || 'N/A'}`);
      console.log('');
    });
    
    await mongoose.connection.close();
    process.exit(0);
  } catch (err) {
    console.error('❌ Error:', err.message);
    process.exit(1);
  }
}

findAnalysis();
