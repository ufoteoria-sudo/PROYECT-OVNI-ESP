const mongoose = require('mongoose');
require('dotenv').config();
const Analysis = require('./models/Analysis');

async function checkAnalysis() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Conectado a MongoDB');
    
    const analyses = await Analysis.find().limit(5).select('_id fileName status userId');
    console.log('\n📊 Análisis encontrados:', analyses.length);
    
    if (analyses.length > 0) {
      console.log('\n📄 Primer análisis:');
      console.log('ID:', analyses[0]._id);
      console.log('Archivo:', analyses[0].fileName);
      console.log('Status:', analyses[0].status);
      console.log('UserID:', analyses[0].userId);
    }
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

checkAnalysis();
