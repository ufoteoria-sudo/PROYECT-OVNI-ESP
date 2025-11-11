/**
 * Script de prueba para el análisis forense de imágenes
 * Uso: node test-forensic-analysis.js <ruta-imagen>
 */

const forensicAnalysisService = require('./services/forensicAnalysisService');
const path = require('path');

async function testForensicAnalysis(imagePath) {
  console.log('\n🧪 ====== TEST DE ANÁLISIS FORENSE ======\n');
  console.log(`📁 Analizando: ${imagePath}\n`);
  
  try {
    const result = await forensicAnalysisService.analyzeImage(imagePath);
    
    console.log('\n📋 ====== RESULTADOS COMPLETOS ======\n');
    console.log(JSON.stringify(result, null, 2));
    
    console.log('\n🎯 ====== VEREDICTO ======');
    console.log(`Score de Manipulación: ${result.manipulationScore}/100`);
    console.log(`Veredicto: ${result.verdict}`);
    
    console.log('\n💡 Interpretación:');
    switch(result.verdict) {
      case 'LIKELY_AUTHENTIC':
        console.log('✅ La imagen parece auténtica (score < 20)');
        break;
      case 'POSSIBLY_AUTHENTIC':
        console.log('✅ Probablemente auténtica con mínimas inconsistencias (score 20-40)');
        break;
      case 'INCONCLUSIVE':
        console.log('⚠️ No se puede determinar con certeza (score 40-60)');
        break;
      case 'POSSIBLY_MANIPULATED':
        console.log('⚠️ Probablemente manipulada, múltiples inconsistencias (score 60-80)');
        break;
      case 'LIKELY_MANIPULATED':
        console.log('❌ Muy probablemente manipulada (score > 80)');
        break;
      default:
        console.log('❓ No se pudo analizar');
    }
    
    console.log('\n🔬 ====== DETALLES POR TÉCNICA ======\n');
    
    if (result.lightingAnalysis) {
      console.log('💡 ILUMINACIÓN:');
      console.log(`   Score: ${result.lightingAnalysis.inconsistencyScore}/100`);
      console.log(`   Dirección promedio: ${result.lightingAnalysis.averageDirection}°`);
      console.log(`   Desviación: ${result.lightingAnalysis.standardDeviation?.toFixed(2)}°`);
      console.log(`   Sospechoso: ${result.lightingAnalysis.isSuspicious ? '⚠️ SÍ' : '✅ NO'}\n`);
    }
    
    if (result.noiseAnalysis) {
      console.log('📊 RUIDO DIGITAL:');
      console.log(`   Score: ${result.noiseAnalysis.inconsistencyScore}/100`);
      console.log(`   Ruido promedio: ${result.noiseAnalysis.averageNoise?.toFixed(2)}`);
      console.log(`   Desviación: ${result.noiseAnalysis.standardDeviation?.toFixed(2)}`);
      console.log(`   Sospechoso: ${result.noiseAnalysis.isSuspicious ? '⚠️ SÍ' : '✅ NO'}\n`);
    }
    
    if (result.cloneDetection) {
      console.log('🔍 CLONACIÓN/COPIA-PEGA:');
      console.log(`   Score: ${result.cloneDetection.cloneScore}/100`);
      console.log(`   Regiones clonadas: ${result.cloneDetection.clonedRegions}`);
      console.log(`   Bloques analizados: ${result.cloneDetection.totalBlocks}`);
      console.log(`   Sospechoso: ${result.cloneDetection.isSuspicious ? '⚠️ SÍ' : '✅ NO'}`);
      
      if (result.cloneDetection.details && result.cloneDetection.details.length > 0) {
        console.log(`   Detalles de regiones clonadas:`);
        result.cloneDetection.details.forEach((detail, i) => {
          console.log(`     ${i+1}. Región 1: (${detail.block1.x}, ${detail.block1.y})`);
          console.log(`        Región 2: (${detail.block2.x}, ${detail.block2.y})`);
          console.log(`        Similitud: ${(detail.similarity * 100).toFixed(1)}%`);
        });
      }
      console.log('');
    }
    
    if (result.edgeConsistency) {
      console.log('✂️ CONSISTENCIA DE BORDES:');
      console.log(`   Score: ${result.edgeConsistency.inconsistencyScore}/100`);
      console.log(`   Densidad promedio: ${result.edgeConsistency.averageDensity?.toFixed(2)}`);
      console.log(`   Desviación: ${result.edgeConsistency.standardDeviation?.toFixed(2)}`);
      console.log(`   Sospechoso: ${result.edgeConsistency.isSuspicious ? '⚠️ SÍ' : '✅ NO'}\n`);
    }
    
    console.log(`⏱️ Tiempo de procesamiento: ${result.processingTime}s\n`);
    
    console.log('✅ Test completado exitosamente\n');
    
  } catch (error) {
    console.error('\n❌ ERROR en el análisis:');
    console.error(error);
    process.exit(1);
  }
}

// Obtener ruta de imagen desde argumentos
const imagePath = process.argv[2];

if (!imagePath) {
  console.error('❌ Error: Debes proporcionar la ruta de una imagen');
  console.error('Uso: node test-forensic-analysis.js <ruta-imagen>');
  console.error('\nEjemplo:');
  console.error('  node test-forensic-analysis.js uploads/analysis/imagen.jpg');
  process.exit(1);
}

// Ejecutar test
testForensicAnalysis(imagePath)
  .then(() => process.exit(0))
  .catch(err => {
    console.error('Error fatal:', err);
    process.exit(1);
  });
