const UFODatabase = require('../models/UFODatabase');
const featureExtractionService = require('./featureExtractionService');

/**
 * SERVICIO DE COMPARACIÓN CIENTÍFICA DE IMÁGENES
 * Proceso basado en extracción de características y similitud matemática
 */

/**
 * Analiza una imagen mediante comparación científica con base de datos
 * @param {string} filePath - Ruta de la imagen a analizar
 * @param {Object} exifData - Datos EXIF extraídos
 * @returns {Object} Resultado del análisis con matches ordenados por similitud
 */
async function analyzeImageScientifically(filePath, exifData = {}) {
  try {
    console.log('🔬 ANÁLISIS CIENTÍFICO DE IMAGEN');
    console.log('='.repeat(60));
    
    // PASO 1: Extracción de características de la imagen input
    console.log('\n📊 PASO 1: Extrayendo características científicas...');
    const inputFeatures = await featureExtractionService.extractScientificFeatures(filePath);
    
    if (!inputFeatures) {
      return {
        success: false,
        error: 'No se pudieron extraer características de la imagen'
      };
    }
    
    console.log('✅ Características extraídas:');
    console.log(`   - Morfología: área=${inputFeatures.morphology.area.toFixed(3)}, compacidad=${inputFeatures.morphology.compactness.toFixed(3)}`);
    console.log(`   - Color: R=${inputFeatures.colorHistogram.meanR.toFixed(1)}, G=${inputFeatures.colorHistogram.meanG.toFixed(1)}, B=${inputFeatures.colorHistogram.meanB.toFixed(1)}`);
    console.log(`   - Textura: entropía=${inputFeatures.texture.entropy.toFixed(2)}, contraste=${inputFeatures.texture.contrast.toFixed(2)}`);
    console.log(`   - Bordes: densidad=${(inputFeatures.edges.edgeDensity * 100).toFixed(1)}%`);
    console.log(`   - Momentos: centroid=(${inputFeatures.moments.centroidX.toFixed(2)}, ${inputFeatures.moments.centroidY.toFixed(2)})`);
    
    // PASO 2: Obtener objetos de la base de datos
    console.log('\n📚 PASO 2: Cargando base de datos...');
    const dbObjects = await UFODatabase.find({ isActive: true }).lean();
    console.log(`✅ Cargados ${dbObjects.length} objetos para comparación`);
    
    // PASO 3: Calcular similitud con cada objeto
    console.log('\n🔍 PASO 3: Calculando similitud matemática...');
    const comparisons = [];
    
    for (const obj of dbObjects) {
      // Si el objeto no tiene features precalculadas, usar valores por defecto
      const objFeatures = obj.scientificFeatures || generateDefaultFeatures(obj);
      
      // Calcular similitud matemática
      const similarity = featureExtractionService.calculateFeatureSimilarity(
        inputFeatures,
        objFeatures
      );
      
      comparisons.push({
        objectId: obj._id,
        objectName: obj.name,
        category: obj.category,
        similarityScore: similarity,
        description: obj.description,
        frequency: obj.frequency || 0
      });
    }
    
    // PASO 4: Ordenar por similitud
    comparisons.sort((a, b) => b.similarityScore - a.similarityScore);
    
    const topMatches = comparisons.slice(0, 10);
    console.log(`✅ Top 10 matches calculados`);
    console.log(`   Mejor match: ${topMatches[0].objectName} (${topMatches[0].similarityScore}%)`);
    
    // PASO 5: Determinar categoría y confianza
    const bestMatch = topMatches[0];
    const category = bestMatch.category;
    const confidence = bestMatch.similarityScore;
    
    // Bonus por coincidencia de EXIF (complementario)
    let exifBonus = 0;
    if (exifData.isManipulated) {
      exifBonus -= 5; // Penalizar manipulación
    }
    if (exifData.hasTimestamp && exifData.cameraModel) {
      exifBonus += 5; // Bonus por metadatos completos
    }
    
    const finalConfidence = Math.min(Math.max(confidence + exifBonus, 0), 99);
    
    // PASO 6: Generar descripción científica
    const description = generateScientificDescription(inputFeatures, bestMatch, finalConfidence);
    
    console.log('\n' + '='.repeat(60));
    console.log(`🎯 RESULTADO: ${bestMatch.objectName} (${finalConfidence}%)`);
    console.log('='.repeat(60));
    
    return {
      success: true,
      data: {
        provider: 'scientific_comparison',
        model: 'Feature Extraction + Mathematical Similarity v5.0',
        description,
        category,
        confidence: finalConfidence,
        bestMatch: {
          objectId: bestMatch.objectId,
          objectName: bestMatch.objectName,
          category: bestMatch.category,
          similarityScore: bestMatch.similarityScore,
          matchType: 'mathematical_similarity'
        },
        topMatches: topMatches.slice(0, 5).map(m => ({
          objectName: m.objectName,
          category: m.category,
          score: m.similarityScore
        })),
        scientificAnalysis: {
          inputFeatures: inputFeatures,
          morphologyMatch: calculateMorphologyMatch(inputFeatures, topMatches[0]),
          colorMatch: calculateColorMatch(inputFeatures, topMatches[0]),
          textureMatch: calculateTextureMatch(inputFeatures, topMatches[0]),
          edgeMatch: calculateEdgeMatch(inputFeatures, topMatches[0])
        },
        exifData: exifData,
        processedDate: new Date(),
        rawResponse: {
          allComparisons: comparisons,
          totalObjectsCompared: dbObjects.length
        }
      }
    };
    
  } catch (error) {
    console.error('❌ Error en análisis científico:', error);
    return {
      success: false,
      error: `Error en análisis: ${error.message}`
    };
  }
}

/**
 * Genera características por defecto basadas en metadatos del objeto
 * (Para objetos sin características precalculadas)
 * MEJORADO: Mayor diferenciación por categoría
 */
function generateDefaultFeatures(obj) {
  // Generar features sintéticas MUY DIFERENCIADAS por categoría y características
  const shape = obj.characteristics?.shape || 'irregular';
  const colors = obj.characteristics?.color || ['gray'];
  const luminosity = obj.characteristics?.luminosity || 'tenue';
  const category = obj.category;
  
  // MORFOLOGÍA - VALORES MUY ESPECÍFICOS POR CATEGORÍA
  const morphologyMap = {
    'celestial': { area: 0.05, compactness: 0.95, aspectRatio: 1.0, perimeter: 0.8 },      // Puntos muy compactos
    'satellite': { area: 0.08, compactness: 0.85, aspectRatio: 1.2, perimeter: 1.1 },      // Pequeños, algo alargados
    'aircraft': { area: 0.25, compactness: 0.35, aspectRatio: 3.5, perimeter: 5.0 },       // Grandes, MUY alargados
    'drone': { area: 0.15, compactness: 0.50, aspectRatio: 1.8, perimeter: 2.5 },          // Medianos, moderadamente alargados
    'balloon': { area: 0.30, compactness: 0.80, aspectRatio: 1.1, perimeter: 2.2 },        // Grandes, redondos
    'bird': { area: 0.12, compactness: 0.40, aspectRatio: 2.0, perimeter: 2.8 },           // Pequeños, con alas
    'natural': { area: 0.40, compactness: 0.20, aspectRatio: 1.5, perimeter: 8.0 },        // Irregulares, difusos
    'uap': { area: 0.20, compactness: 0.75, aspectRatio: 1.3, perimeter: 2.0 },            // Variables
    'hoax': { area: 0.22, compactness: 0.60, aspectRatio: 1.4, perimeter: 2.3 },           // Similar a UAP
    'unknown': { area: 0.18, compactness: 0.55, aspectRatio: 1.5, perimeter: 2.6 }         // Intermedios
  };
  
  // Ajustar según forma específica
  let morph = morphologyMap[category] || morphologyMap['unknown'];
  
  if (shape === 'circular' || shape === 'point') {
    morph = { ...morph, compactness: Math.max(morph.compactness, 0.85), aspectRatio: 1.0 };
  } else if (shape === 'cylindrical' || shape === 'rectangular') {
    morph = { ...morph, aspectRatio: Math.max(morph.aspectRatio, 2.5) };
  }
  
  // COLOR - MUY ESPECÍFICO POR CATEGORÍA Y COLOR
  const colorBaseMap = {
    'celestial': { meanR: 220, meanG: 230, meanB: 245, stdR: 15, stdG: 15, stdB: 15 },     // Azul claro/blanco
    'satellite': { meanR: 180, meanG: 190, meanB: 200, stdR: 20, stdG: 20, stdB: 20 },     // Gris claro
    'aircraft': { meanR: 140, meanG: 145, meanB: 150, stdR: 35, stdG: 35, stdB: 35 },      // Gris metálico
    'drone': { meanR: 100, meanG: 105, meanB: 110, stdR: 40, stdG: 40, stdB: 40 },         // Gris oscuro
    'balloon': { meanR: 200, meanG: 80, meanB: 80, stdR: 50, stdG: 30, stdB: 30 },         // Colores vivos (rojo default)
    'bird': { meanR: 80, meanG: 70, meanB: 65, stdR: 45, stdG: 40, stdB: 40 },             // Marrón/negro
    'natural': { meanR: 160, meanG: 180, meanB: 200, stdR: 60, stdG: 60, stdB: 60 },       // Azul cielo
    'uap': { meanR: 150, meanG: 150, meanB: 150, stdR: 50, stdG: 50, stdB: 50 },           // Gris neutro
    'hoax': { meanR: 130, meanG: 130, meanB: 130, stdR: 45, stdG: 45, stdB: 45 },          // Gris oscuro
    'unknown': { meanR: 120, meanG: 110, meanB: 115, stdR: 55, stdG: 50, stdB: 50 }        // Oscuro indefinido
  };
  
  let colorVals = colorBaseMap[category] || colorBaseMap['unknown'];
  
  // Ajustar si tiene color específico
  const primaryColor = colors[0]?.toLowerCase() || '';
  if (primaryColor.includes('blanco')) colorVals = { meanR: 240, meanG: 240, meanB: 240, stdR: 10, stdG: 10, stdB: 10 };
  else if (primaryColor.includes('negro')) colorVals = { meanR: 30, meanG: 30, meanB: 30, stdR: 20, stdG: 20, stdB: 20 };
  else if (primaryColor.includes('rojo')) colorVals = { meanR: 220, meanG: 50, meanB: 50, stdR: 30, stdG: 25, stdB: 25 };
  else if (primaryColor.includes('azul')) colorVals = { meanR: 50, meanG: 120, meanB: 220, stdR: 25, stdG: 30, stdB: 30 };
  else if (primaryColor.includes('verde')) colorVals = { meanR: 50, meanG: 200, meanB: 50, stdR: 25, stdG: 30, stdB: 25 };
  
  // TEXTURA - MUY DIFERENTE POR CATEGORÍA
  const textureMap = {
    'celestial': { entropy: 2.5, energy: 0.30, contrast: 20 },         // MUY uniforme, suave
    'satellite': { entropy: 3.2, energy: 0.22, contrast: 60 },         // Uniforme con algo de detalle
    'aircraft': { entropy: 5.8, energy: 0.09, contrast: 450 },         // Complejo, muchos detalles
    'drone': { entropy: 5.2, energy: 0.11, contrast: 320 },            // Detalles moderados
    'balloon': { entropy: 3.8, energy: 0.18, contrast: 100 },          // Relativamente suave
    'bird': { entropy: 4.5, energy: 0.14, contrast: 220 },             // Textura orgánica
    'natural': { entropy: 7.5, energy: 0.04, contrast: 800 },          // MUY complejo, irregular
    'uap': { entropy: 4.2, energy: 0.15, contrast: 180 },              // Variable
    'hoax': { entropy: 6.0, energy: 0.08, contrast: 400 },             // Similar a editado
    'unknown': { entropy: 5.0, energy: 0.10, contrast: 280 }           // Intermedio
  };
  
  const texture = textureMap[category] || textureMap['unknown'];
  
  // BORDES - ESPECÍFICO POR CATEGORÍA
  const edgeMap = {
    'celestial': { edgeDensity: 0.03, averageEdgeStrength: 15 },       // Casi sin bordes
    'satellite': { edgeDensity: 0.05, averageEdgeStrength: 25 },       // Pocos bordes
    'aircraft': { edgeDensity: 0.22, averageEdgeStrength: 70 },        // MUCHOS bordes definidos
    'drone': { edgeDensity: 0.16, averageEdgeStrength: 55 },           // Bordes moderados
    'balloon': { edgeDensity: 0.08, averageEdgeStrength: 30 },         // Pocos bordes (suave)
    'bird': { edgeDensity: 0.14, averageEdgeStrength: 50 },            // Bordes de silueta
    'natural': { edgeDensity: 0.25, averageEdgeStrength: 40 },         // Muchos bordes pero difusos
    'uap': { edgeDensity: 0.12, averageEdgeStrength: 45 },             // Variable
    'hoax': { edgeDensity: 0.18, averageEdgeStrength: 60 },            // Artificialmente alto
    'unknown': { edgeDensity: 0.15, averageEdgeStrength: 42 }          // Intermedio
  };
  
  const edges = edgeMap[category] || edgeMap['unknown'];
  
  // Ajustar bordes según luminosidad
  if (luminosity === 'brillante') {
    edges.edgeDensity *= 1.3;
    edges.averageEdgeStrength *= 1.2;
  }
  
  // MOMENTOS - ESPECÍFICO POR CATEGORÍA
  const momentMap = {
    'celestial': { eccentricity: 0.05, centroidX: 0.5, centroidY: 0.5 },    // Muy centrado, circular
    'satellite': { eccentricity: 0.20, centroidX: 0.48, centroidY: 0.50 },  // Ligeramente alargado
    'aircraft': { eccentricity: 0.75, centroidX: 0.50, centroidY: 0.48 },   // MUY alargado
    'drone': { eccentricity: 0.40, centroidX: 0.50, centroidY: 0.52 },      // Moderadamente alargado
    'balloon': { eccentricity: 0.15, centroidX: 0.50, centroidY: 0.45 },    // Casi circular
    'bird': { eccentricity: 0.60, centroidX: 0.48, centroidY: 0.50 },       // Alargado (alas)
    'natural': { eccentricity: 0.35, centroidX: 0.52, centroidY: 0.52 },    // Irregular
    'uap': { eccentricity: 0.45, centroidX: 0.50, centroidY: 0.50 },        // Variable
    'hoax': { eccentricity: 0.50, centroidX: 0.50, centroidY: 0.50 },       // Intermedio
    'unknown': { eccentricity: 0.55, centroidX: 0.48, centroidY: 0.48 }     // Variable
  };
  
  const moments = momentMap[category] || momentMap['unknown'];
  
  // GLOBAL - ESPECÍFICO POR CATEGORÍA
  const globalMap = {
    'celestial': { brightness: 0.85, saturation: 0.10 },        // Muy brillante, poco saturado
    'satellite': { brightness: 0.70, saturation: 0.15 },        // Brillante, poco saturado
    'aircraft': { brightness: 0.55, saturation: 0.25 },         // Medio, algo saturado
    'drone': { brightness: 0.45, saturation: 0.30 },            // Medio-oscuro
    'balloon': { brightness: 0.75, saturation: 0.70 },          // Brillante, MUY saturado
    'bird': { brightness: 0.35, saturation: 0.20 },             // Oscuro, poco saturado
    'natural': { brightness: 0.65, saturation: 0.35 },          // Variable
    'uap': { brightness: 0.50, saturation: 0.40 },              // Medio
    'hoax': { brightness: 0.48, saturation: 0.35 },             // Similar a editado
    'unknown': { brightness: 0.42, saturation: 0.32 }           // Oscuro indefinido
  };
  
  const global = globalMap[category] || globalMap['unknown'];
  
  // Generar histogramas sintéticos más realistas
  const histR = new Array(16).fill(0);
  const histG = new Array(16).fill(0);
  const histB = new Array(16).fill(0);
  
  const rBin = Math.min(Math.floor(colorVals.meanR / 16), 15);
  const gBin = Math.min(Math.floor(colorVals.meanG / 16), 15);
  const bBin = Math.min(Math.floor(colorVals.meanB / 16), 15);
  
  // Distribución gaussiana alrededor del color medio
  for (let i = -2; i <= 2; i++) {
    const weight = Math.exp(-(i*i) / 2) / Math.sqrt(2 * Math.PI);
    if (rBin + i >= 0 && rBin + i < 16) histR[rBin + i] = weight * 0.2;
    if (gBin + i >= 0 && gBin + i < 16) histG[gBin + i] = weight * 0.2;
    if (bBin + i >= 0 && bBin + i < 16) histB[bBin + i] = weight * 0.2;
  }
  
  return {
    morphology: {
      area: morph.area,
      perimeter: morph.perimeter,
      compactness: morph.compactness,
      aspectRatio: morph.aspectRatio
    },
    colorHistogram: {
      histogramR: histR,
      histogramG: histG,
      histogramB: histB,
      meanR: colorVals.meanR,
      meanG: colorVals.meanG,
      meanB: colorVals.meanB,
      stdR: colorVals.stdR,
      stdG: colorVals.stdG,
      stdB: colorVals.stdB
    },
    texture: {
      entropy: texture.entropy,
      energy: texture.energy,
      contrast: texture.contrast,
      smoothness: 1 - (1 / (1 + texture.contrast / 1000))
    },
    edges: {
      averageEdgeStrength: edges.averageEdgeStrength,
      edgeDensity: edges.edgeDensity,
      hasStrongEdges: edges.edgeDensity > 0.1
    },
    moments: {
      centroidX: moments.centroidX,
      centroidY: moments.centroidY,
      eccentricity: moments.eccentricity,
      isCentered: Math.abs(moments.centroidX - 0.5) < 0.15 && Math.abs(moments.centroidY - 0.5) < 0.15
    },
    global: {
      averageBrightness: global.brightness,
      averageSaturation: global.saturation,
      isDark: global.brightness < 0.4,
      isBright: global.brightness > 0.7,
      isColorful: global.saturation > 0.5
    }
  };
}

function generateScientificDescription(features, match, confidence) {
  let desc = `Análisis científico mediante extracción de características: `;
  
  if (confidence >= 70) {
    desc += `Coincidencia alta (${confidence}%) con ${match.objectName}. `;
  } else if (confidence >= 50) {
    desc += `Coincidencia moderada (${confidence}%) con ${match.objectName}. `;
  } else {
    desc += `Coincidencia baja (${confidence}%) con ${match.objectName}. `;
  }
  
  desc += `Características detectadas: `;
  desc += `morfología (área=${(features.morphology.area * 100).toFixed(1)}%, compacidad=${features.morphology.compactness.toFixed(2)}), `;
  desc += `color dominante RGB(${Math.round(features.colorHistogram.meanR)}, ${Math.round(features.colorHistogram.meanG)}, ${Math.round(features.colorHistogram.meanB)}), `;
  desc += `textura (entropía=${features.texture.entropy.toFixed(2)}), `;
  desc += `bordes (densidad=${(features.edges.edgeDensity * 100).toFixed(1)}%). `;
  
  return desc;
}

function calculateMorphologyMatch(features, match) {
  return 'Morfología: ' + JSON.stringify(features.morphology);
}

function calculateColorMatch(features, match) {
  return 'Color promedio RGB: ' + 
    `(${Math.round(features.colorHistogram.meanR)}, ` +
    `${Math.round(features.colorHistogram.meanG)}, ` +
    `${Math.round(features.colorHistogram.meanB)})`;
}

function calculateTextureMatch(features, match) {
  return `Entropía: ${features.texture.entropy.toFixed(2)}, Contraste: ${features.texture.contrast.toFixed(2)}`;
}

function calculateEdgeMatch(features, match) {
  return `Densidad de bordes: ${(features.edges.edgeDensity * 100).toFixed(1)}%`;
}

module.exports = {
  analyzeImageScientifically
};
