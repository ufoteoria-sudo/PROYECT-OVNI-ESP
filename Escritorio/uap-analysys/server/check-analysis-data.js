const mongoose = require('mongoose');
require('dotenv').config();

async function checkAnalysisData() {
  await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/uap-db');
  
  const Analysis = require('./models/Analysis');
  const latest = await Analysis.findOne({ status: 'completed' })
    .sort({ createdAt: -1 });
  
  if (!latest) {
    console.log('❌ No hay análisis completados');
    process.exit(0);
  }
  
  console.log('📊 ÚLTIMO ANÁLISIS COMPLETADO');
  console.log('='.repeat(70));
  console.log('');
  console.log('🆔 ID:', latest._id);
  console.log('📄 Archivo:', latest.fileName);
  console.log('📂 Ruta:', latest.filePath);
  console.log('📅 Fecha:', latest.createdAt);
  console.log('👤 Usuario:', latest.userId);
  console.log('');
  
  console.log('🎯 ANÁLISIS IA');
  console.log('-'.repeat(70));
  if (latest.aiAnalysis) {
    console.log('Provider:', latest.aiAnalysis.provider);
    console.log('Model:', latest.aiAnalysis.model);
    console.log('Categoría:', latest.aiAnalysis.category);
    console.log('Confianza:', latest.aiAnalysis.confidence + '%');
    console.log('Descripción:', latest.aiAnalysis.description?.substring(0, 100));
  } else {
    console.log('❌ No hay datos de análisis IA');
  }
  console.log('');
  
  console.log('📸 DATOS EXIF');
  console.log('-'.repeat(70));
  if (latest.exifData) {
    console.log('Cámara:', latest.exifData.camera || 'N/A');
    console.log('Modelo:', latest.exifData.cameraModel || 'N/A');
    console.log('ISO:', latest.exifData.iso || 'N/A');
    console.log('Apertura:', latest.exifData.aperture || 'N/A');
    console.log('Obturador:', latest.exifData.shutterSpeed || 'N/A');
    console.log('Focal:', latest.exifData.focalLength || 'N/A');
    console.log('Fecha captura:', latest.exifData.captureDate || 'N/A');
    console.log('Software:', latest.exifData.software || 'N/A');
    console.log('GPS:', latest.exifData.location ? 'SÍ' : 'NO');
    console.log('Manipulada:', latest.exifData.isManipulated ? 'SÍ' : 'NO');
    console.log('Score autenticidad:', (100 - (latest.exifData.manipulationScore || 0)) + '/100');
    console.log('Total campos EXIF:', Object.keys(latest.exifData).length);
  } else {
    console.log('❌ No hay datos EXIF');
  }
  console.log('');
  
  console.log('🎯 MEJOR MATCH');
  console.log('-'.repeat(70));
  if (latest.bestMatch) {
    console.log('ObjectId:', latest.bestMatch.objectId);
    console.log('Categoría:', latest.bestMatch.category);
    console.log('Match %:', latest.bestMatch.matchPercentage);
  } else {
    console.log('❌ No hay mejor match');
  }
  console.log('');
  
  console.log('📋 MATCH RESULTS');
  console.log('-'.repeat(70));
  if (latest.matchResults && latest.matchResults.length > 0) {
    console.log('Total matches:', latest.matchResults.length);
    console.log('Top 3:');
    latest.matchResults.slice(0, 3).forEach((m, i) => {
      console.log(`  ${i+1}. ${m.objectName} (${m.category}) - ${m.matchPercentage}%`);
    });
  } else {
    console.log('❌ No hay match results');
  }
  
  console.log('');
  console.log('📊 ESTRUCTURA COMPLETA (JSON)');
  console.log('='.repeat(70));
  console.log(JSON.stringify({
    _id: latest._id,
    fileName: latest.fileName,
    fileType: latest.fileType,
    fileSize: latest.fileSize,
    status: latest.status,
    userId: latest.userId,
    hasExifData: !!latest.exifData,
    hasAiAnalysis: !!latest.aiAnalysis,
    hasBestMatch: !!latest.bestMatch,
    matchResultsCount: latest.matchResults?.length || 0,
    createdAt: latest.createdAt,
    updatedAt: latest.updatedAt
  }, null, 2));
  
  process.exit(0);
}

checkAnalysisData().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
