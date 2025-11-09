const mongoose = require('mongoose');
require('dotenv').config();

async function checkCompleted() {
  await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/uap-db');
  
  const Analysis = require('./models/Analysis');
  const completed = await Analysis.find({ status: 'completed' })
    .sort({ createdAt: -1 })
    .limit(3);
  
  console.log('✅ Análisis completados (últimos 3):\n');
  
  completed.forEach(a => {
    console.log('  📄 Archivo:', a.fileName);
    console.log('     Estado:', a.status);
    console.log('     Categoría:', a.aiAnalysis?.category || 'N/A');
    console.log('     Confianza:', (a.aiAnalysis?.confidence || 0) + '%');
    console.log('     Provider:', a.aiAnalysis?.provider || 'N/A');
    console.log('     Tiene EXIF:', !!a.exifData?.camera || !!a.exifData?.cameraModel);
    console.log('');
  });
  
  process.exit(0);
}

checkCompleted();
