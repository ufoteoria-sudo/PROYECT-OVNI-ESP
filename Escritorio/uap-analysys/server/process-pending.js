const mongoose = require('mongoose');
require('dotenv').config();

async function processPending() {
  try {
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/uap-db');
    console.log('✅ Conectado a MongoDB\n');
    
    const Analysis = require('./models/Analysis');
    const scientificComparisonService = require('./services/scientificComparisonService');
    const exifService = require('./services/exifService');
    
    const pending = await Analysis.findOne({ status: 'pending' });
    
    if (!pending) {
      console.log('❌ No hay análisis pendientes');
      process.exit(0);
    }
    
    console.log('📋 Procesando:', pending.fileName);
    console.log('📂 Ruta:', pending.filePath);
    console.log('🆔 ID:', pending._id);
    
    // 1. EXIF
    console.log('\n1️⃣ Extrayendo EXIF...');
    const exifResult = await exifService.extractExifData(pending.filePath);
    console.log('✅ EXIF extraído:', exifResult.success);
    
    // 2. Análisis científico
    console.log('\n2️⃣ Análisis científico...');
    const result = await scientificComparisonService.analyzeImageScientifically(
      pending.filePath,
      exifResult.data
    );
    
    console.log('\n✅ Resultado:', result.data.category, '-', result.data.confidence + '%');
    console.log('📋 Provider:', result.data.provider);
    console.log('📋 Model:', result.data.model);
    
    // 3. Guardar
    console.log('\n3️⃣ Guardando en BD...');
    pending.exifData = exifResult.data;
    pending.aiAnalysis = result.data;
    pending.status = 'completed';
    
    if (result.data.rawResponse?.bestMatch) {
      const bestMatch = result.data.rawResponse.bestMatch;
      pending.bestMatch = {
        objectId: bestMatch.objectId,
        category: bestMatch.category,
        matchPercentage: bestMatch.matchPercentage
      };
      
      pending.matchResults = result.data.rawResponse.allMatches || [];
    }
    
    await pending.save();
    console.log('✅ Guardado exitosamente\n');
    
    // Verificar
    const updated = await Analysis.findById(pending._id);
    console.log('🔍 Verificación:');
    console.log('   Estado:', updated.status);
    console.log('   Categoría:', updated.aiAnalysis?.category);
    console.log('   Confianza:', updated.aiAnalysis?.confidence + '%');
    
  } catch (error) {
    console.error('\n❌ ERROR:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
  
  process.exit(0);
}

processPending();
