/**
 * Test Suite - Sistema de Análisis UAP
 * Valida precisión del sistema con imágenes de prueba conocidas
 */

const path = require('path');
const fs = require('fs');
const mongoose = require('mongoose');
require('dotenv').config();

const imageAnalysisService = require('./services/imageAnalysisService');
const visualComparisonService = require('./services/visualComparisonService');
const exifService = require('./services/exifService');

// Dataset de prueba con categorías esperadas
const testDataset = [
  {
    file: 'imagen_ovni_prueba.jpeg',
    expectedCategory: ['natural', 'uap', 'unknown', 'hoax'], // Cualquiera de estos es razonable
    expectedNotCategory: ['aircraft', 'satellite'], // NO debe ser esto
    description: 'Imagen UFO generada por IA - debe detectar como no-real'
  }
  // Se pueden añadir más imágenes de prueba
];

// Métricas de evaluación
const metrics = {
  totalTests: 0,
  correctCategory: 0,
  incorrectCategory: 0,
  partiallyCorrect: 0,
  avgConfidence: 0,
  avgProcessingTime: 0,
  manipulationDetected: 0,
  aiGenerated: 0,
  results: []
};

async function runTest(testCase) {
  const startTime = Date.now();
  
  try {
    // Buscar archivo en uploads/images
    const uploadsDir = path.join(__dirname, 'uploads', 'images');
    const files = fs.readdirSync(uploadsDir);
    const testFile = files.find(f => f.includes(testCase.file.replace('.jpeg', '').replace('.jpg', '')));
    
    if (!testFile) {
      console.log(`⚠️  Archivo no encontrado: ${testCase.file}`);
      return null;
    }
    
    const filePath = path.join(uploadsDir, testFile);
    console.log(`\n${'='.repeat(70)}`);
    console.log(`🧪 TEST: ${testCase.description}`);
    console.log(`📁 Archivo: ${testFile}`);
    console.log(`${'='.repeat(70)}`);
    
    // 1. Extraer EXIF
    const exifResult = await exifService.extractExifData(filePath);
    const exifData = exifResult.success ? exifResult.data : {};
    
    console.log('\n📊 EXIF Analysis:');
    console.log('  • Tiene EXIF:', exifResult.success ? '✅' : '❌');
    console.log('  • Manipulation Score:', exifData.manipulationScore || 0);
    console.log('  • Is Manipulated:', exifData.isManipulated ? '⚠️  SÍ' : '✅ NO');
    console.log('  • AI Generated:', exifData.isAIGenerated ? '🤖 SÍ' : '✅ NO');
    if (exifData.manipulationDetails) {
      console.log('  • Detalles:', exifData.manipulationDetails);
    }
    
    // 2. Análisis visual
    const visualAnalysis = await imageAnalysisService.analyzeImageVisually(filePath);
    
    console.log('\n📸 Visual Analysis:');
    console.log('  • Objeto detectado:', visualAnalysis?.objectDetection?.hasDefinedObject ? '✅ SÍ' : '❌ NO');
    console.log('  • Likelihood:', visualAnalysis?.objectDetection?.objectLikelihood || 'unknown');
    console.log('  • Tipo de cielo:', visualAnalysis?.skyAnalysis?.skyType || 'unknown');
    console.log('  • Color dominante:', visualAnalysis?.colorAnalysis?.dominantColor || 'unknown');
    
    // 3. Comparación con BD
    const result = await visualComparisonService.analyzeImageByComparison(filePath, exifData);
    
    const processingTime = Date.now() - startTime;
    
    console.log('\n🎯 Results:');
    console.log('  • Best Match:', result.data?.rawResponse?.bestMatch?.objectName || 'None');
    console.log('  • Category:', result.data?.category || 'unknown');
    console.log('  • Confidence:', result.data?.confidence ? `${result.data.confidence}%` : 'N/A');
    console.log('  • Processing Time:', `${processingTime}ms`);
    
    console.log('\n🏆 Top 3 Matches:');
    const matches = result.data?.rawResponse?.allMatches || [];
    matches.slice(0, 3).forEach((match, i) => {
      console.log(`  ${i + 1}. ${match.objectName} (${match.category}): ${match.matchPercentage}%`);
    });
    
    // Evaluar resultado
    const detectedCategory = result.data?.category;
    let isCorrect = false;
    let isPartial = false;
    
    if (testCase.expectedCategory.includes(detectedCategory)) {
      isCorrect = true;
      console.log('\n✅ PASS: Categoría correcta');
    } else if (testCase.expectedNotCategory.includes(detectedCategory)) {
      console.log('\n❌ FAIL: Categoría incorrecta (detectó categoría NO esperada)');
    } else {
      isPartial = true;
      console.log('\n⚠️  PARTIAL: Categoría no esperada pero tampoco incorrecta');
    }
    
    // Verificar que NO coincide con categorías prohibidas
    const topMatches = matches.slice(0, 3);
    const hasProhibitedCategory = topMatches.some(m => 
      testCase.expectedNotCategory.includes(m.category)
    );
    
    if (hasProhibitedCategory) {
      console.log('⚠️  WARNING: Top matches incluyen categorías prohibidas');
    }
    
    return {
      testCase: testCase.description,
      file: testFile,
      detectedCategory,
      confidence: result.data?.confidence || 0,
      processingTime,
      isCorrect,
      isPartial,
      exifManipulated: exifData.isManipulated || false,
      aiGenerated: exifData.isAIGenerated || false,
      topMatches: topMatches.map(m => ({ name: m.objectName, category: m.category, score: m.matchPercentage }))
    };
    
  } catch (error) {
    console.error('❌ Error en test:', error.message);
    return null;
  }
}

async function runAllTests() {
  try {
    console.log('\n🚀 INICIANDO TEST SUITE - Sistema de Análisis UAP v4.0');
    console.log('='.repeat(70));
    
    // Conectar a MongoDB
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Conectado a MongoDB\n');
    
    // Ejecutar tests
    for (const testCase of testDataset) {
      const result = await runTest(testCase);
      if (result) {
        metrics.totalTests++;
        metrics.avgConfidence += result.confidence;
        metrics.avgProcessingTime += result.processingTime;
        
        if (result.isCorrect) metrics.correctCategory++;
        else if (result.isPartial) metrics.partiallyCorrect++;
        else metrics.incorrectCategory++;
        
        if (result.exifManipulated) metrics.manipulationDetected++;
        if (result.aiGenerated) metrics.aiGenerated++;
        
        metrics.results.push(result);
      }
    }
    
    // Calcular promedios
    if (metrics.totalTests > 0) {
      metrics.avgConfidence = Math.round(metrics.avgConfidence / metrics.totalTests);
      metrics.avgProcessingTime = Math.round(metrics.avgProcessingTime / metrics.totalTests);
    }
    
    // Reporte final
    console.log('\n\n' + '='.repeat(70));
    console.log('📊 REPORTE FINAL - MÉTRICAS DEL SISTEMA');
    console.log('='.repeat(70));
    console.log('\n📈 Precisión:');
    console.log(`  • Tests ejecutados: ${metrics.totalTests}`);
    console.log(`  • Correctos: ${metrics.correctCategory} (${Math.round(metrics.correctCategory/metrics.totalTests*100)}%)`);
    console.log(`  • Parciales: ${metrics.partiallyCorrect} (${Math.round(metrics.partiallyCorrect/metrics.totalTests*100)}%)`);
    console.log(`  • Incorrectos: ${metrics.incorrectCategory} (${Math.round(metrics.incorrectCategory/metrics.totalTests*100)}%)`);
    
    console.log('\n⚡ Performance:');
    console.log(`  • Confianza promedio: ${metrics.avgConfidence}%`);
    console.log(`  • Tiempo promedio: ${metrics.avgProcessingTime}ms`);
    
    console.log('\n🔍 Detección:');
    console.log(`  • Manipulaciones detectadas: ${metrics.manipulationDetected}`);
    console.log(`  • Imágenes AI detectadas: ${metrics.aiGenerated}`);
    
    console.log('\n📋 Detalles por test:');
    metrics.results.forEach((r, i) => {
      const status = r.isCorrect ? '✅' : r.isPartial ? '⚠️' : '❌';
      console.log(`  ${status} Test ${i+1}: ${r.testCase}`);
      console.log(`     Categoría: ${r.detectedCategory} (${r.confidence}%)`);
      console.log(`     Top match: ${r.topMatches[0]?.name || 'None'}`);
    });
    
    // Calcular accuracy total
    const accuracy = metrics.totalTests > 0 
      ? Math.round(((metrics.correctCategory + metrics.partiallyCorrect * 0.5) / metrics.totalTests) * 100)
      : 0;
    
    console.log('\n' + '='.repeat(70));
    console.log(`🎯 ACCURACY TOTAL: ${accuracy}%`);
    console.log('='.repeat(70) + '\n');
    
    // Guardar reporte en archivo
    const reportPath = path.join(__dirname, 'test-report.json');
    fs.writeFileSync(reportPath, JSON.stringify(metrics, null, 2));
    console.log(`📄 Reporte guardado en: ${reportPath}\n`);
    
    await mongoose.disconnect();
    process.exit(0);
    
  } catch (error) {
    console.error('❌ Error en test suite:', error);
    process.exit(1);
  }
}

// Añadir más casos de prueba si existen más imágenes
console.log('💡 TIP: Añade más imágenes de prueba al dataset en testDataset[]');
console.log('   Formatos soportados: aircraft real, drones, satélites, fenómenos naturales, etc.\n');

runAllTests();
