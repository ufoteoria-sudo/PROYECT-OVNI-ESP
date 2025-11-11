const mongoose = require('mongoose');
require('dotenv').config();

async function testEndpoint() {
  await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/uap-db');
  
  const Analysis = require('./models/Analysis');
  
  // Buscar el último análisis completado
  const analysis = await Analysis.findOne({ status: 'completed' })
    .sort({ createdAt: -1 })
    .select('status aiAnalysis exifData matchResults bestMatch errorMessage fileName uploadDate createdAt fileType fileSize userId');
  
  if (!analysis) {
    console.log('❌ No hay análisis completados');
    process.exit(0);
  }
  
  console.log('📊 SIMULANDO RESPUESTA DEL ENDPOINT /api/analyze/:id/status');
  console.log('='.repeat(70));
  console.log('');
  
  const response = {
    status: analysis.status,
    fileName: analysis.fileName,
    uploadDate: analysis.uploadDate || analysis.createdAt,
    fileType: analysis.fileType,
    fileSize: analysis.fileSize,
    hasExifData: !!analysis.exifData && Object.keys(analysis.exifData).length > 0,
    hasAiAnalysis: !!analysis.aiAnalysis && !!analysis.aiAnalysis.category,
    hasMatches: analysis.matchResults && analysis.matchResults.length > 0,
    errorMessage: analysis.errorMessage,
    analysisData: {
      exifData: analysis.exifData,
      aiAnalysis: analysis.aiAnalysis,
      matchResults: analysis.matchResults,
      bestMatch: analysis.bestMatch
    }
  };
  
  console.log('📋 RESPUESTA:');
  console.log(JSON.stringify(response, null, 2));
  
  console.log('');
  console.log('🔍 VERIFICACIONES:');
  console.log('  fileName:', response.fileName);
  console.log('  uploadDate:', response.uploadDate);
  console.log('  hasExifData:', response.hasExifData);
  console.log('  hasAiAnalysis:', response.hasAiAnalysis);
  console.log('  EXIF camera:', response.analysisData.exifData?.camera || 'N/A');
  console.log('  EXIF cameraModel:', response.analysisData.exifData?.cameraModel || 'N/A');
  console.log('  EXIF ISO:', response.analysisData.exifData?.iso || 'N/A');
  console.log('  AI category:', response.analysisData.aiAnalysis?.category || 'N/A');
  console.log('  AI confidence:', response.analysisData.aiAnalysis?.confidence || 'N/A');
  
  process.exit(0);
}

testEndpoint().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
