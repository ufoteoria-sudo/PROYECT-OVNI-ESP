/**
 * Script de prueba para verificar análisis visual
 * Prueba la imagen "imagen ovni prueba.jpeg" que antes daba 52% avión
 */

const path = require('path');
const imageAnalysisService = require('./services/imageAnalysisService');
const scientificComparisonService = require('./services/scientificComparisonService');
const featureExtractionService = require('./services/featureExtractionService');
const mongoose = require('mongoose');
require('dotenv').config();

async function testVisualAnalysis() {
  try {
    // Conectar a MongoDB
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Conectado a MongoDB');

    // Buscar la imagen de prueba en uploads/images
    const fs = require('fs');
    const uploadsDir = path.join(__dirname, 'uploads', 'images');
    const files = fs.readdirSync(uploadsDir);
    
    // Buscar imagen ovni prueba
    const testImage = files.find(f => f.includes('imagen_ovni_prueba'));
    
    if (!testImage) {
      console.log('❌ No se encontró imagen_ovni_prueba.jpeg en uploads/images');
      console.log('Archivos disponibles:', files);
      process.exit(1);
    }

    const imagePath = path.join(uploadsDir, testImage);
    console.log(`\n🔍 Analizando: ${testImage}`);
    console.log('='.repeat(60));

    // 1. Análisis visual PURO
    console.log('\n📸 PASO 1: Análisis Visual de la Imagen');
    console.log('-'.repeat(60));
    const visualAnalysis = await imageAnalysisService.analyzeImageVisually(imagePath);
    
    console.log('\n📊 Resultados del análisis visual:');
    console.log('  • Objeto detectado:', visualAnalysis?.objectDetection?.hasDefinedObject ? '✅ SÍ' : '❌ NO');
    console.log('  • Probabilidad de objeto:', visualAnalysis?.objectDetection?.objectLikelihood || 'desconocida');
    console.log('  • Bordes detectados:', visualAnalysis?.objectDetection?.edgePixelsPercent ? `${visualAnalysis.objectDetection.edgePixelsPercent.toFixed(1)}%` : 'N/A');
    console.log('  • Tipo de cielo:', visualAnalysis?.skyAnalysis?.skyType || 'desconocido');
    console.log('  • Es cielo:', visualAnalysis?.skyAnalysis?.appearsToBeSky ? '✅ SÍ' : '❌ NO');
    console.log('  • Color dominante:', visualAnalysis?.colorAnalysis?.dominantColor || 'desconocido');
    console.log('  • Puntos brillantes:', visualAnalysis?.luminosity?.brightSpotsPercent ? `${visualAnalysis.luminosity.brightSpotsPercent.toFixed(2)}%` : 'N/A');
    console.log('  • Objeto central:', visualAnalysis?.composition?.hasCentralObject ? '✅ SÍ' : '❌ NO');
    console.log('  • Contraste central:', visualAnalysis?.composition?.centralContrast ? Math.round(visualAnalysis.composition.centralContrast) : 'N/A');
    console.log('  • Imagen oscura:', visualAnalysis?.luminosity?.isDark ? '✅ SÍ' : '❌ NO');
    console.log('  • Alto contraste:', visualAnalysis?.luminosity?.hasHighContrast ? '✅ SÍ' : '❌ NO');

    // 2. Análisis de comparación completo CIENTÍFICO
    console.log('\n\n🎯 PASO 2: Comparación Científica con Base de Datos');
    console.log('-'.repeat(60));
    
    const exifData = {}; // Sin EXIF (como imagen generada por IA)
    const result = await scientificComparisonService.analyzeImageScientifically(imagePath, exifData);

    console.log('\n📊 Resultados de la comparación:');
    console.log('  • Mejor coincidencia:', result.data?.bestMatch?.objectName || result.bestMatch?.objectName || 'Ninguna');
    console.log('  • Categoría:', result.data?.category || result.category || 'unknown');
    console.log('  • Confianza:', result.data?.confidence ? `${result.data.confidence}%` : (result.confidence ? `${result.confidence}%` : 'N/A'));
    console.log('  • Proveedor:', result.data?.provider || result.provider || 'N/A');
    console.log('  • Modelo:', result.data?.model || result.modelVersion || 'N/A');
    console.log('  • Descripción:', result.data?.description?.substring(0, 100) || 'N/A');

    console.log('\n🏆 Top 3 Coincidencias:');
    const matchResults = result.data?.rawResponse?.allMatches || result.matchResults || [];
    if (matchResults && matchResults.length > 0) {
      matchResults.slice(0, 3).forEach((match, i) => {
        console.log(`  ${i + 1}. ${match.objectName} (${match.category}): ${match.matchPercentage}%`);
        if (match.matchReasons) {
          console.log(`     Razones: ${match.matchReasons.join(', ')}`);
        }
      });
    } else {
      console.log('  No se encontraron coincidencias significativas');
    }

    // 3. VERIFICACIÓN CRÍTICA
    console.log('\n\n🔍 VERIFICACIÓN CRÍTICA:');
    console.log('='.repeat(60));
    
    const isAircraftMatch = (result.data?.category === 'aircraft' || result.category === 'aircraft') || 
                           (result.data?.bestMatch?.objectName?.toLowerCase().includes('avión')) ||
                           (result.data?.bestMatch?.objectName?.toLowerCase().includes('aircraft')) ||
                           (result.bestMatch?.objectName?.toLowerCase().includes('avión')) ||
                           (result.bestMatch?.objectName?.toLowerCase().includes('aircraft'));
    
    if (isAircraftMatch) {
      console.log('❌ FALLO: La imagen UFO sigue coincidiendo con AVIÓN');
      console.log('   Esto indica que el análisis visual NO está funcionando correctamente');
    } else {
      console.log('✅ ÉXITO: La imagen UFO NO coincide con avión');
      console.log('   El análisis visual está funcionando correctamente');
    }

    // Verificar penalizaciones
    if (!exifData.timestamp && !exifData.cameraModel) {
      console.log('✅ Imagen sin EXIF detectada (como imagen generada por IA)');
    }

    if (visualAnalysis?.objectDetection?.hasDefinedObject) {
      console.log('✅ Objeto detectado en la imagen visualmente');
    } else {
      console.log('⚠️  No se detectó objeto en la imagen');
    }

    console.log('\n' + '='.repeat(60));
    console.log('Prueba completada');
    console.log('='.repeat(60) + '\n');

    await mongoose.disconnect();
    process.exit(0);

  } catch (error) {
    console.error('❌ Error en la prueba:', error);
    process.exit(1);
  }
}

testVisualAnalysis();
