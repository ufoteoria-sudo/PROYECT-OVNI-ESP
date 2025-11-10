/**
 * Script de prueba para el sistema de confianza ponderada
 * 
 * Este script simula un análisis completo con:
 * - Análisis preliminar de IA (clasificación inicial)
 * - Validación externa con APIs (aeronaves, satélites, celestiales, globos)
 * - Mejora con datos de entrenamiento
 * - Cálculo de confianza ponderada
 */

const confidenceCalculatorService = require('./services/confidenceCalculatorService');

// Simular diferentes escenarios de análisis

console.log('═══════════════════════════════════════════════════════════════');
console.log('PRUEBA 1: Imagen clasificada como "Venus" pero con aeronaves cercanas');
console.log('═══════════════════════════════════════════════════════════════\n');

const scenario1 = {
  aiAnalysis: {
    category: 'celestial',
    description: 'Posible planeta Venus observado al atardecer',
    confidence: 85,
    detectedObjects: ['punto luminoso', 'cielo crepuscular']
  },
  externalValidation: {
    performed: true,
    hasMatches: true,
    matchCount: 31,
    results: {
      validations: {
        aircraft: {
          count: 31,
          closestDistance: 8.63,
          withinRelevantDistance: 31
        },
        satellites: {
          count: 0
        },
        celestial: {
          visible: [],
          sun: { visible: false, altitude: -5 },
          moon: { visible: false, altitude: -10 }
        },
        balloons: {
          count: 0
        }
      },
      matches: [
        { type: 'aircraft', distance: 8.63, details: 'Vuelo comercial QFY73P' },
        { type: 'aircraft', distance: 12.4, details: 'Vuelo comercial RYR456' }
        // ... 29 aeronaves más
      ],
      confidence: 95
    }
  },
  trainingEnhancement: {
    enhanced: true,
    improvementDelta: 10,
    trainingMatchCount: 3
  },
  exifData: {
    location: {
      latitude: 40.416775,
      longitude: -3.703790
    },
    captureDate: new Date('2025-01-09T19:30:00'),
    camera: 'Canon',
    cameraModel: 'EOS 5D Mark IV',
    iso: 800,
    shutterSpeed: '1/200',
    aperture: 'f/4.0',
    isManipulated: false
  }
};

const result1 = confidenceCalculatorService.calculateWeightedConfidence(
  scenario1.aiAnalysis,
  scenario1.externalValidation,
  scenario1.trainingEnhancement,
  scenario1.exifData
);

console.log('📊 RESULTADOS:');
console.log(`   Confianza Original: ${scenario1.aiAnalysis.confidence}%`);
console.log(`   Confianza Final: ${result1.finalConfidence}%`);
console.log(`   Categoría Original: ${scenario1.aiAnalysis.category}`);
console.log(`   Categoría Final: ${result1.finalCategory}`);
console.log(`   Nivel: ${result1.confidence_level}`);
console.log('\n📝 DESGLOSE:');
console.log(`   - Validación Externa: ${result1.breakdown.externalValidation.score}/100 (peso: ${result1.breakdown.externalValidation.weight * 100}%)`);
console.log(`   - Características de Imagen: ${result1.breakdown.imageCharacteristics.score}/100 (peso: ${result1.breakdown.imageCharacteristics.weight * 100}%)`);
console.log(`   - Datos de Entrenamiento: ${result1.breakdown.trainingData.score}/100 (peso: ${result1.breakdown.trainingData.weight * 100}%)`);
console.log('\n⚙️ AJUSTES APLICADOS:');
result1.adjustments.forEach(adj => console.log(`   - ${adj}`));
console.log('\n💬 EXPLICACIÓN:');
console.log(`   ${result1.explanation}`);

console.log('\n\n═══════════════════════════════════════════════════════════════');
console.log('PRUEBA 2: Imagen genuina de la Luna con datos EXIF completos');
console.log('═══════════════════════════════════════════════════════════════\n');

const scenario2 = {
  aiAnalysis: {
    category: 'celestial',
    description: 'Luna en fase creciente',
    confidence: 90,
    detectedObjects: ['luna', 'cráteres visibles']
  },
  externalValidation: {
    performed: true,
    hasMatches: true,
    matchCount: 1,
    results: {
      validations: {
        aircraft: { count: 0 },
        satellites: { count: 0 },
        celestial: {
          visible: ['luna'],
          moon: { 
            visible: true, 
            altitude: 45.2, 
            phase: 'Cuarto Creciente',
            illumination: 52.3 
          }
        },
        balloons: { count: 0 }
      },
      matches: [
        { 
          type: 'celestial', 
          subtype: 'moon',
          altitude: 45.2,
          phase: 'Cuarto Creciente',
          details: 'Luna visible a 45.2° sobre horizonte' 
        }
      ],
      confidence: 95
    }
  },
  trainingEnhancement: {
    enhanced: true,
    improvementDelta: 5,
    trainingMatchCount: 8
  },
  exifData: {
    location: {
      latitude: 40.416775,
      longitude: -3.703790
    },
    captureDate: new Date('2025-01-09T23:30:00'),
    camera: 'Nikon',
    cameraModel: 'D850',
    iso: 400,
    shutterSpeed: '1/500',
    aperture: 'f/5.6',
    focalLength: '300mm',
    isManipulated: false
  }
};

const result2 = confidenceCalculatorService.calculateWeightedConfidence(
  scenario2.aiAnalysis,
  scenario2.externalValidation,
  scenario2.trainingEnhancement,
  scenario2.exifData
);

console.log('📊 RESULTADOS:');
console.log(`   Confianza Original: ${scenario2.aiAnalysis.confidence}%`);
console.log(`   Confianza Final: ${result2.finalConfidence}%`);
console.log(`   Categoría Original: ${scenario2.aiAnalysis.category}`);
console.log(`   Categoría Final: ${result2.finalCategory}`);
console.log(`   Nivel: ${result2.confidence_level}`);
console.log('\n📝 DESGLOSE:');
console.log(`   - Validación Externa: ${result2.breakdown.externalValidation.score}/100 (peso: ${result2.breakdown.externalValidation.weight * 100}%)`);
console.log(`   - Características de Imagen: ${result2.breakdown.imageCharacteristics.score}/100 (peso: ${result2.breakdown.imageCharacteristics.weight * 100}%)`);
console.log(`   - Datos de Entrenamiento: ${result2.breakdown.trainingData.score}/100 (peso: ${result2.breakdown.trainingData.weight * 100}%)`);
console.log('\n⚙️ AJUSTES APLICADOS:');
if (result2.adjustments.length > 0) {
  result2.adjustments.forEach(adj => console.log(`   - ${adj}`));
} else {
  console.log('   (ninguno)');
}
console.log('\n💬 EXPLICACIÓN:');
console.log(`   ${result2.explanation}`);

console.log('\n\n═══════════════════════════════════════════════════════════════');
console.log('PRUEBA 3: Imagen manipulada sin GPS');
console.log('═══════════════════════════════════════════════════════════════\n');

const scenario3 = {
  aiAnalysis: {
    category: 'aircraft_commercial',
    description: 'Avión comercial en vuelo',
    confidence: 75,
    detectedObjects: ['avión', 'cielo']
  },
  externalValidation: {
    performed: false,
    hasMatches: false
  },
  trainingEnhancement: {
    enhanced: false,
    reason: 'No hay datos de entrenamiento suficientes'
  },
  exifData: {
    // Sin GPS
    camera: 'Desconocida',
    isManipulated: true,
    manipulationScore: 85,
    manipulationDetails: 'Detección de clonación y alteración de metadatos'
  }
};

const result3 = confidenceCalculatorService.calculateWeightedConfidence(
  scenario3.aiAnalysis,
  scenario3.externalValidation,
  scenario3.trainingEnhancement,
  scenario3.exifData
);

console.log('📊 RESULTADOS:');
console.log(`   Confianza Original: ${scenario3.aiAnalysis.confidence}%`);
console.log(`   Confianza Final: ${result3.finalConfidence}%`);
console.log(`   Categoría Original: ${scenario3.aiAnalysis.category}`);
console.log(`   Categoría Final: ${result3.finalCategory}`);
console.log(`   Nivel: ${result3.confidence_level}`);
console.log('\n📝 DESGLOSE:');
console.log(`   - Validación Externa: ${result3.breakdown.externalValidation.score}/100 (peso: ${result3.breakdown.externalValidation.weight * 100}%)`);
console.log(`   - Características de Imagen: ${result3.breakdown.imageCharacteristics.score}/100 (peso: ${result3.breakdown.imageCharacteristics.weight * 100}%)`);
console.log(`   - Datos de Entrenamiento: ${result3.breakdown.trainingData.score}/100 (peso: ${result3.breakdown.trainingData.weight * 100}%)`);
console.log('\n⚙️ AJUSTES APLICADOS:');
result3.adjustments.forEach(adj => console.log(`   - ${adj}`));
console.log('\n💬 EXPLICACIÓN:');
console.log(`   ${result3.explanation}`);

console.log('\n\n═══════════════════════════════════════════════════════════════');
console.log('PRUEBA 4: Imagen generada por IA');
console.log('═══════════════════════════════════════════════════════════════\n');

const scenario4 = {
  aiAnalysis: {
    category: 'unknown',
    description: 'Objeto volador no identificado',
    confidence: 60,
    detectedObjects: ['objeto metálico', 'forma de platillo']
  },
  externalValidation: {
    performed: true,
    hasMatches: false,
    matchCount: 0,
    results: {
      validations: {
        aircraft: { count: 0 },
        satellites: { count: 0 },
        celestial: { visible: [] },
        balloons: { count: 0 }
      },
      matches: [],
      confidence: 0
    }
  },
  trainingEnhancement: {
    enhanced: false
  },
  exifData: {
    isAIGenerated: true,
    software: 'Stable Diffusion',
    manipulationScore: 100
  }
};

const result4 = confidenceCalculatorService.calculateWeightedConfidence(
  scenario4.aiAnalysis,
  scenario4.externalValidation,
  scenario4.trainingEnhancement,
  scenario4.exifData
);

console.log('📊 RESULTADOS:');
console.log(`   Confianza Original: ${scenario4.aiAnalysis.confidence}%`);
console.log(`   Confianza Final: ${result4.finalConfidence}%`);
console.log(`   Categoría Original: ${scenario4.aiAnalysis.category}`);
console.log(`   Categoría Final: ${result4.finalCategory}`);
console.log(`   Nivel: ${result4.confidence_level}`);
console.log('\n📝 DESGLOSE:');
console.log(`   - Validación Externa: ${result4.breakdown.externalValidation.score}/100 (peso: ${result4.breakdown.externalValidation.weight * 100}%)`);
console.log(`   - Características de Imagen: ${result4.breakdown.imageCharacteristics.score}/100 (peso: ${result4.breakdown.imageCharacteristics.weight * 100}%)`);
console.log(`   - Datos de Entrenamiento: ${result4.breakdown.trainingData.score}/100 (peso: ${result4.breakdown.trainingData.weight * 100}%)`);
console.log('\n⚙️ AJUSTES APLICADOS:');
result4.adjustments.forEach(adj => console.log(`   - ${adj}`));
console.log('\n💬 EXPLICACIÓN:');
console.log(`   ${result4.explanation}`);

console.log('\n\n═══════════════════════════════════════════════════════════════');
console.log('PRUEBA COMPLETADA - Sistema de Confianza Ponderada Funcional ✅');
console.log('═══════════════════════════════════════════════════════════════\n');
