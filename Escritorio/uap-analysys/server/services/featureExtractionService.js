const sharp = require('sharp');

/**
 * SERVICIO CIENTÍFICO DE EXTRACCIÓN DE CARACTERÍSTICAS
 * Basado en procesamiento de imágenes científico estándar
 * 
 * Extrae:
 * 1. Morfología: área, perímetro, forma, compacidad
 * 2. Histograma de color: distribución RGB normalizada
 * 3. Textura: entropía, desviación estándar, gradientes
 * 4. Bordes: Detección Sobel, densidad de bordes
 * 5. Momentos: centro de masa, excentricidad
 */

/**
 * Extrae todas las características científicas de una imagen
 * @param {string} imagePath - Ruta de la imagen
 * @returns {Object} Vector de características completo
 */
async function extractScientificFeatures(imagePath) {
  try {
    console.log('🔬 Extrayendo características científicas...');
    
    const image = sharp(imagePath);
    const metadata = await image.metadata();
    
    // Cargar imagen en buffer RGB
    const { data, info } = await image
      .resize(400, 400, { fit: 'inside', withoutEnlargement: true })
      .raw()
      .toBuffer({ resolveWithObject: true });
    
    // 1. MORFOLOGÍA - Análisis de forma y estructura
    const morphology = extractMorphology(data, info);
    
    // 2. HISTOGRAMA DE COLOR - Distribución estadística de colores
    const colorHistogram = extractColorHistogram(data, info);
    
    // 3. TEXTURA - Análisis de patrones
    const texture = extractTexture(data, info);
    
    // 4. BORDES - Detección de contornos
    const edges = extractEdges(data, info);
    
    // 5. MOMENTOS ESTADÍSTICOS - Distribución espacial
    const moments = extractMoments(data, info);
    
    // 6. CARACTERÍSTICAS GLOBALES
    const global = extractGlobalFeatures(data, info);
    
    console.log('✅ Características extraídas');
    
    return {
      morphology,
      colorHistogram,
      texture,
      edges,
      moments,
      global,
      metadata: {
        width: metadata.width,
        height: metadata.height,
        channels: info.channels
      }
    };
    
  } catch (error) {
    console.error('❌ Error extrayendo características:', error);
    return null;
  }
}

/**
 * 1. MORFOLOGÍA - Análisis cuantitativo de forma
 */
function extractMorphology(buffer, info) {
  const { width, height, channels } = info;
  
  // Binarización: separar objeto de fondo
  const threshold = 128;
  let objectPixels = 0;
  let backgroundPixels = 0;
  let perimeterPixels = 0;
  
  const binaryImage = new Uint8Array(width * height);
  
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = (y * width + x) * channels;
      const intensity = (buffer[idx] + buffer[idx + 1] + buffer[idx + 2]) / 3;
      
      const binaryIdx = y * width + x;
      binaryImage[binaryIdx] = intensity > threshold ? 1 : 0;
      
      if (binaryImage[binaryIdx] === 1) {
        objectPixels++;
      } else {
        backgroundPixels++;
      }
    }
  }
  
  // Calcular perímetro (píxeles en el borde del objeto)
  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      const idx = y * width + x;
      if (binaryImage[idx] === 1) {
        // Es objeto, verificar si está en borde
        const neighbors = [
          binaryImage[idx - 1],         // izquierda
          binaryImage[idx + 1],         // derecha
          binaryImage[idx - width],     // arriba
          binaryImage[idx + width]      // abajo
        ];
        if (neighbors.includes(0)) {
          perimeterPixels++;
        }
      }
    }
  }
  
  const totalPixels = width * height;
  const area = objectPixels / totalPixels; // Área relativa
  const perimeter = perimeterPixels / Math.sqrt(totalPixels); // Perímetro normalizado
  
  // Compacidad (circularidad): 4π*Area / Perimeter²
  // Valor cercano a 1 = circular, menor = irregular
  const compactness = perimeterPixels > 0 
    ? (4 * Math.PI * objectPixels) / (perimeterPixels * perimeterPixels)
    : 0;
  
  // Relación de aspecto (aproximada)
  const aspectRatio = width / height;
  
  return {
    area,                    // 0-1 (fracción de imagen ocupada)
    perimeter,              // Normalizado
    compactness,            // 0-1 (1 = círculo perfecto)
    aspectRatio,            // width/height
    objectPixelCount: objectPixels,
    perimeterPixelCount: perimeterPixels,
    fillRatio: objectPixels / totalPixels
  };
}

/**
 * 2. HISTOGRAMA DE COLOR - Distribución estadística RGB
 */
function extractColorHistogram(buffer, info) {
  const { width, height, channels } = info;
  const totalPixels = width * height;
  
  // Histogramas con 16 bins por canal (reducido para eficiencia)
  const bins = 16;
  const histR = new Array(bins).fill(0);
  const histG = new Array(bins).fill(0);
  const histB = new Array(bins).fill(0);
  
  let sumR = 0, sumG = 0, sumB = 0;
  let sumR2 = 0, sumG2 = 0, sumB2 = 0;
  
  for (let i = 0; i < buffer.length; i += channels) {
    const r = buffer[i];
    const g = buffer[i + 1];
    const b = buffer[i + 2];
    
    // Acumular para estadísticas
    sumR += r; sumG += g; sumB += b;
    sumR2 += r * r; sumG2 += g * g; sumB2 += b * b;
    
    // Asignar a bins
    const binR = Math.min(Math.floor(r / 256 * bins), bins - 1);
    const binG = Math.min(Math.floor(g / 256 * bins), bins - 1);
    const binB = Math.min(Math.floor(b / 256 * bins), bins - 1);
    
    histR[binR]++;
    histG[binG]++;
    histB[binB]++;
  }
  
  // Normalizar histogramas (convertir a probabilidad)
  const normHistR = histR.map(v => v / totalPixels);
  const normHistG = histG.map(v => v / totalPixels);
  const normHistB = histB.map(v => v / totalPixels);
  
  // Estadísticas de color
  const meanR = sumR / totalPixels;
  const meanG = sumG / totalPixels;
  const meanB = sumB / totalPixels;
  
  const stdR = Math.sqrt(sumR2 / totalPixels - meanR * meanR);
  const stdG = Math.sqrt(sumG2 / totalPixels - meanG * meanG);
  const stdB = Math.sqrt(sumB2 / totalPixels - meanB * meanB);
  
  return {
    histogramR: normHistR,
    histogramG: normHistG,
    histogramB: normHistB,
    meanR, meanG, meanB,
    stdR, stdG, stdB,
    // Dominancia de color (cual canal es más fuerte)
    dominantChannel: meanR > meanG && meanR > meanB ? 'R' : meanG > meanB ? 'G' : 'B'
  };
}

/**
 * 3. TEXTURA - Análisis de patrones y rugosidad
 */
function extractTexture(buffer, info) {
  const { width, height, channels } = info;
  const totalPixels = width * height;
  
  // Convertir a escala de grises
  const gray = new Float32Array(totalPixels);
  for (let i = 0; i < totalPixels; i++) {
    const idx = i * channels;
    gray[i] = (buffer[idx] + buffer[idx + 1] + buffer[idx + 2]) / 3;
  }
  
  // Calcular entropía (medida de aleatoriedad/complejidad)
  const histogram = new Array(256).fill(0);
  for (let i = 0; i < totalPixels; i++) {
    histogram[Math.floor(gray[i])]++;
  }
  
  let entropy = 0;
  for (let i = 0; i < 256; i++) {
    if (histogram[i] > 0) {
      const p = histogram[i] / totalPixels;
      entropy -= p * Math.log2(p);
    }
  }
  
  // Calcular energía (uniformidad)
  let energy = 0;
  for (let i = 0; i < 256; i++) {
    const p = histogram[i] / totalPixels;
    energy += p * p;
  }
  
  // Calcular contraste (varianza local)
  let contrast = 0;
  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      const idx = y * width + x;
      const center = gray[idx];
      const neighbors = [
        gray[idx - 1], gray[idx + 1],
        gray[idx - width], gray[idx + width]
      ];
      const localVariance = neighbors.reduce((sum, val) => sum + Math.pow(val - center, 2), 0) / 4;
      contrast += localVariance;
    }
  }
  contrast /= totalPixels;
  
  return {
    entropy,        // Alta = imagen compleja, baja = uniforme
    energy,         // Alta = uniforme, baja = variada
    contrast,       // Varianza local promedio
    smoothness: 1 - (1 / (1 + contrast)) // 0 = rugoso, 1 = suave
  };
}

/**
 * 4. BORDES - Detección de contornos con Sobel
 */
function extractEdges(buffer, info) {
  const { width, height, channels } = info;
  const totalPixels = width * height;
  
  // Convertir a escala de grises
  const gray = new Float32Array(totalPixels);
  for (let i = 0; i < totalPixels; i++) {
    const idx = i * channels;
    gray[i] = (buffer[idx] + buffer[idx + 1] + buffer[idx + 2]) / 3;
  }
  
  // Operadores Sobel
  const sobelX = [-1, 0, 1, -2, 0, 2, -1, 0, 1];
  const sobelY = [-1, -2, -1, 0, 0, 0, 1, 2, 1];
  
  let edgeStrength = 0;
  let edgeCount = 0;
  const edgeThreshold = 30;
  
  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      let gx = 0, gy = 0;
      
      // Convolución 3x3
      for (let ky = -1; ky <= 1; ky++) {
        for (let kx = -1; kx <= 1; kx++) {
          const idx = (y + ky) * width + (x + kx);
          const kernelIdx = (ky + 1) * 3 + (kx + 1);
          gx += gray[idx] * sobelX[kernelIdx];
          gy += gray[idx] * sobelY[kernelIdx];
        }
      }
      
      const magnitude = Math.sqrt(gx * gx + gy * gy);
      edgeStrength += magnitude;
      
      if (magnitude > edgeThreshold) {
        edgeCount++;
      }
    }
  }
  
  const avgEdgeStrength = edgeStrength / totalPixels;
  const edgeDensity = edgeCount / totalPixels;
  
  return {
    averageEdgeStrength: avgEdgeStrength,
    edgeDensity,                    // Fracción de píxeles que son bordes
    totalEdgeStrength: edgeStrength,
    hasStrongEdges: edgeDensity > 0.1  // >10% de píxeles son bordes
  };
}

/**
 * 5. MOMENTOS ESTADÍSTICOS - Distribución espacial
 */
function extractMoments(buffer, info) {
  const { width, height, channels } = info;
  
  // Calcular centro de masa (centroid)
  let sumX = 0, sumY = 0, sumIntensity = 0;
  
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = (y * width + x) * channels;
      const intensity = (buffer[idx] + buffer[idx + 1] + buffer[idx + 2]) / 3;
      
      sumX += x * intensity;
      sumY += y * intensity;
      sumIntensity += intensity;
    }
  }
  
  const centroidX = sumIntensity > 0 ? sumX / sumIntensity : width / 2;
  const centroidY = sumIntensity > 0 ? sumY / sumIntensity : height / 2;
  
  // Normalizar a 0-1
  const normalizedCentroidX = centroidX / width;
  const normalizedCentroidY = centroidY / height;
  
  // Calcular momentos de segundo orden (dispersión)
  let m20 = 0, m02 = 0, m11 = 0;
  
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = (y * width + x) * channels;
      const intensity = (buffer[idx] + buffer[idx + 1] + buffer[idx + 2]) / 3;
      
      const dx = x - centroidX;
      const dy = y - centroidY;
      
      m20 += dx * dx * intensity;
      m02 += dy * dy * intensity;
      m11 += dx * dy * intensity;
    }
  }
  
  if (sumIntensity > 0) {
    m20 /= sumIntensity;
    m02 /= sumIntensity;
    m11 /= sumIntensity;
  }
  
  // Excentricidad (qué tan "estirado" está el objeto)
  const eccentricity = m20 !== m02 
    ? Math.sqrt(1 - Math.min(m20, m02) / Math.max(m20, m02))
    : 0;
  
  return {
    centroidX: normalizedCentroidX,
    centroidY: normalizedCentroidY,
    moment20: m20,
    moment02: m02,
    moment11: m11,
    eccentricity,  // 0 = circular, cercano a 1 = muy alargado
    isCentered: Math.abs(normalizedCentroidX - 0.5) < 0.2 && Math.abs(normalizedCentroidY - 0.5) < 0.2
  };
}

/**
 * 6. CARACTERÍSTICAS GLOBALES - Propiedades generales
 */
function extractGlobalFeatures(buffer, info) {
  const { width, height, channels } = info;
  const totalPixels = width * height;
  
  // Brillo promedio
  let avgBrightness = 0;
  let avgSaturation = 0;
  
  for (let i = 0; i < buffer.length; i += channels) {
    const r = buffer[i];
    const g = buffer[i + 1];
    const b = buffer[i + 2];
    
    const brightness = (r + g + b) / 3;
    avgBrightness += brightness;
    
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    const saturation = max > 0 ? (max - min) / max : 0;
    avgSaturation += saturation;
  }
  
  avgBrightness /= totalPixels;
  avgSaturation /= totalPixels;
  
  return {
    averageBrightness: avgBrightness / 255,  // Normalizado 0-1
    averageSaturation: avgSaturation,         // 0-1
    isDark: avgBrightness < 85,
    isBright: avgBrightness > 170,
    isColorful: avgSaturation > 0.3
  };
}

/**
 * Calcula similitud entre dos vectores de características
 * Retorna score 0-100
 */
function calculateFeatureSimilarity(features1, features2) {
  if (!features1 || !features2) return 0;
  
  let totalScore = 0;
  let weights = 0;
  
  // 1. Similitud morfológica (20%)
  const morphWeight = 20;
  const morphScore = calculateMorphologySimilarity(features1.morphology, features2.morphology);
  totalScore += morphScore * morphWeight;
  weights += morphWeight;
  
  // 2. Similitud de histograma (30%)
  const histWeight = 30;
  const histScore = calculateHistogramSimilarity(features1.colorHistogram, features2.colorHistogram);
  totalScore += histScore * histWeight;
  weights += histWeight;
  
  // 3. Similitud de textura (20%)
  const textWeight = 20;
  const textScore = calculateTextureSimilarity(features1.texture, features2.texture);
  totalScore += textScore * textWeight;
  weights += textWeight;
  
  // 4. Similitud de bordes (15%)
  const edgeWeight = 15;
  const edgeScore = calculateEdgeSimilarity(features1.edges, features2.edges);
  totalScore += edgeScore * edgeWeight;
  weights += edgeWeight;
  
  // 5. Similitud de momentos (15%)
  const momentWeight = 15;
  const momentScore = calculateMomentSimilarity(features1.moments, features2.moments);
  totalScore += momentScore * momentWeight;
  weights += momentWeight;
  
  return Math.round(totalScore / weights);
}

// Funciones auxiliares de similitud
function calculateMorphologySimilarity(m1, m2) {
  const areaD = 1 - Math.abs(m1.area - m2.area);
  const compactD = 1 - Math.abs(m1.compactness - m2.compactness);
  const aspectD = 1 - Math.min(Math.abs(m1.aspectRatio - m2.aspectRatio) / 2, 1);
  return (areaD + compactD + aspectD) / 3 * 100;
}

function calculateHistogramSimilarity(h1, h2) {
  // Similitud de coseno entre histogramas
  const channels = ['histogramR', 'histogramG', 'histogramB'];
  let totalSim = 0;
  
  for (const ch of channels) {
    let dotProduct = 0;
    let mag1 = 0, mag2 = 0;
    
    for (let i = 0; i < h1[ch].length; i++) {
      dotProduct += h1[ch][i] * h2[ch][i];
      mag1 += h1[ch][i] * h1[ch][i];
      mag2 += h2[ch][i] * h2[ch][i];
    }
    
    const similarity = (mag1 > 0 && mag2 > 0) 
      ? dotProduct / (Math.sqrt(mag1) * Math.sqrt(mag2))
      : 0;
    
    totalSim += similarity;
  }
  
  return (totalSim / 3) * 100;
}

function calculateTextureSimilarity(t1, t2) {
  const entropyD = 1 - Math.abs(t1.entropy - t2.entropy) / 8;
  const energyD = 1 - Math.abs(t1.energy - t2.energy);
  const contrastD = 1 - Math.min(Math.abs(t1.contrast - t2.contrast) / 1000, 1);
  return (entropyD + energyD + contrastD) / 3 * 100;
}

function calculateEdgeSimilarity(e1, e2) {
  const densityD = 1 - Math.abs(e1.edgeDensity - e2.edgeDensity);
  const strengthD = 1 - Math.min(Math.abs(e1.averageEdgeStrength - e2.averageEdgeStrength) / 100, 1);
  return (densityD + strengthD) / 2 * 100;
}

function calculateMomentSimilarity(m1, m2) {
  const centroidD = 1 - Math.sqrt(
    Math.pow(m1.centroidX - m2.centroidX, 2) + 
    Math.pow(m1.centroidY - m2.centroidY, 2)
  );
  const eccentD = 1 - Math.abs(m1.eccentricity - m2.eccentricity);
  return (centroidD + eccentD) / 2 * 100;
}

module.exports = {
  extractScientificFeatures,
  calculateFeatureSimilarity
};
