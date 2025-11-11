const sharp = require('sharp');
const jimp = require('jimp');

/**
 * Servicio de Detección de Objetos usando análisis de imagen nativo
 * Alternativa a OpenCV usando Sharp + Jimp
 * 100% JavaScript, sin dependencias Python
 */

/**
 * Analiza una imagen para detectar objetos, formas y características
 * @param {string} filePath - Ruta de la imagen
 * @returns {Object} Análisis detallado
 */
async function analyzeImage(filePath) {
  try {
    console.log('🔍 Iniciando análisis de detección de objetos...');
    
    // Análisis paralelo con Sharp (metadata y stats) y Jimp (píxeles)
    const [sharpAnalysis, jimpAnalysis] = await Promise.all([
      analyzeWithSharp(filePath),
      analyzeWithJimp(filePath)
    ]);

    // Combinar resultados
    const combinedAnalysis = {
      ...sharpAnalysis,
      ...jimpAnalysis,
      timestamp: new Date(),
      filePath
    };

    // Calcular score de confianza basado en métricas objetivas
    const confidenceScore = calculateConfidence(combinedAnalysis);

    // Detectar anomalías
    const anomalies = detectAnomalies(combinedAnalysis);

    // Clasificar tipo de objeto probable
    const classification = classifyObject(combinedAnalysis);

    console.log('✅ Análisis completado:', {
      clasificacion: classification.category,
      confianza: confidenceScore,
      anomalias: anomalies.length
    });

    return {
      success: true,
      data: {
        // Metadata básica
        width: combinedAnalysis.width,
        height: combinedAnalysis.height,
        format: combinedAnalysis.format,
        hasAlpha: combinedAnalysis.hasAlpha,
        
        // Análisis de color
        dominantColors: combinedAnalysis.dominantColors,
        brightness: combinedAnalysis.brightness,
        contrast: combinedAnalysis.contrast,
        colorVariance: combinedAnalysis.colorVariance,
        
        // Detección de formas
        edges: combinedAnalysis.edges,
        shapes: combinedAnalysis.shapes,
        symmetry: combinedAnalysis.symmetry,
        
        // Características especiales
        hasMotionBlur: combinedAnalysis.motionBlur,
        hasNoise: combinedAnalysis.noise,
        sharpness: combinedAnalysis.sharpness,
        
        // Resultados finales
        classification: classification,
        confidenceScore: confidenceScore,
        anomalies: anomalies,
        
        // Detalles técnicos
        analysisMethod: 'sharp+jimp',
        processingTime: combinedAnalysis.processingTime
      }
    };

  } catch (error) {
    console.error('❌ Error en detección de objetos:', error.message);
    return {
      success: false,
      error: `Error en análisis: ${error.message}`
    };
  }
}

/**
 * Análisis con Sharp (rápido, metadata y stats)
 */
async function analyzeWithSharp(filePath) {
  const startTime = Date.now();
  
  const image = sharp(filePath);
  const metadata = await image.metadata();
  const stats = await image.stats();

  // Calcular brillo promedio
  const brightness = stats.channels.reduce((sum, ch) => sum + ch.mean, 0) / stats.channels.length;
  
  // Calcular contraste (desviación estándar promedio)
  const contrast = stats.channels.reduce((sum, ch) => sum + ch.stdev, 0) / stats.channels.length;

  // Detectar si tiene canal alpha (transparencia)
  const hasAlpha = metadata.channels === 4 || metadata.hasAlpha;

  return {
    width: metadata.width,
    height: metadata.height,
    format: metadata.format,
    hasAlpha: hasAlpha,
    brightness: Math.round(brightness),
    contrast: Math.round(contrast),
    channels: metadata.channels,
    processingTime: Date.now() - startTime
  };
}

/**
 * Análisis con Jimp (análisis de píxeles)
 */
async function analyzeWithJimp(filePath) {
  const image = await jimp.read(filePath);
  
  // Análisis de colores dominantes
  const dominantColors = extractDominantColors(image);
  
  // Detectar bordes/formas
  const edges = detectEdges(image);
  
  // Calcular varianza de color
  const colorVariance = calculateColorVariance(image);
  
  // Detectar simetría
  const symmetry = detectSymmetry(image);
  
  // Detectar desenfoque de movimiento
  const motionBlur = detectMotionBlur(image);
  
  // Detectar ruido
  const noise = detectNoise(image);
  
  // Calcular nitidez
  const sharpness = calculateSharpness(image);

  return {
    dominantColors,
    edges,
    colorVariance,
    symmetry,
    motionBlur,
    noise,
    sharpness,
    shapes: edges.shapesDetected || []
  };
}

/**
 * Extraer colores dominantes de la imagen
 */
function extractDominantColors(image) {
  const colors = {};
  const width = image.bitmap.width;
  const height = image.bitmap.height;
  const sampleSize = Math.max(1, Math.floor(width * height / 10000)); // Sample 1/10000 pixels

  for (let y = 0; y < height; y += sampleSize) {
    for (let x = 0; x < width; x += sampleSize) {
      const hex = image.getPixelColor(x, y);
      const rgba = jimp.intToRGBA(hex);
      
      // Agrupar colores similares (reducir a 16 colores base)
      const r = Math.floor(rgba.r / 64) * 64;
      const g = Math.floor(rgba.g / 64) * 64;
      const b = Math.floor(rgba.b / 64) * 64;
      const key = `rgb(${r},${g},${b})`;
      
      colors[key] = (colors[key] || 0) + 1;
    }
  }

  // Ordenar por frecuencia
  const sorted = Object.entries(colors)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([color, count]) => ({ color, frequency: count }));

  return sorted;
}

/**
 * Detectar bordes usando filtro Sobel simplificado
 */
function detectEdges(image) {
  const gray = image.clone().grayscale();
  const width = gray.bitmap.width;
  const height = gray.bitmap.height;
  
  let edgeCount = 0;
  const threshold = 30;
  
  // Sobel simplificado (muestreo cada 4 píxeles para velocidad)
  for (let y = 1; y < height - 1; y += 4) {
    for (let x = 1; x < width - 1; x += 4) {
      const gx = 
        -1 * jimp.intToRGBA(gray.getPixelColor(x - 1, y - 1)).r +
         1 * jimp.intToRGBA(gray.getPixelColor(x + 1, y - 1)).r +
        -2 * jimp.intToRGBA(gray.getPixelColor(x - 1, y)).r +
         2 * jimp.intToRGBA(gray.getPixelColor(x + 1, y)).r +
        -1 * jimp.intToRGBA(gray.getPixelColor(x - 1, y + 1)).r +
         1 * jimp.intToRGBA(gray.getPixelColor(x + 1, y + 1)).r;

      const gy = 
        -1 * jimp.intToRGBA(gray.getPixelColor(x - 1, y - 1)).r +
        -2 * jimp.intToRGBA(gray.getPixelColor(x, y - 1)).r +
        -1 * jimp.intToRGBA(gray.getPixelColor(x + 1, y - 1)).r +
         1 * jimp.intToRGBA(gray.getPixelColor(x - 1, y + 1)).r +
         2 * jimp.intToRGBA(gray.getPixelColor(x, y + 1)).r +
         1 * jimp.intToRGBA(gray.getPixelColor(x + 1, y + 1)).r;

      const magnitude = Math.sqrt(gx * gx + gy * gy);
      
      if (magnitude > threshold) {
        edgeCount++;
      }
    }
  }

  const edgeDensity = (edgeCount / ((width / 4) * (height / 4))) * 100;

  return {
    edgeCount,
    edgeDensity: Math.round(edgeDensity * 100) / 100,
    hasStrongEdges: edgeDensity > 15,
    shapesDetected: classifyShapes(edgeDensity)
  };
}

/**
 * Clasificar formas basadas en densidad de bordes
 */
function classifyShapes(edgeDensity) {
  const shapes = [];
  
  if (edgeDensity > 20) {
    shapes.push({ type: 'complex', confidence: 80 });
  } else if (edgeDensity > 10) {
    shapes.push({ type: 'defined', confidence: 70 });
  } else if (edgeDensity > 5) {
    shapes.push({ type: 'simple', confidence: 60 });
  } else {
    shapes.push({ type: 'minimal', confidence: 50 });
  }

  return shapes;
}

/**
 * Calcular varianza de color
 */
function calculateColorVariance(image) {
  const pixels = [];
  const width = image.bitmap.width;
  const height = image.bitmap.height;
  const sampleSize = Math.max(1, Math.floor(width * height / 5000));

  for (let y = 0; y < height; y += sampleSize) {
    for (let x = 0; x < width; x += sampleSize) {
      const rgba = jimp.intToRGBA(image.getPixelColor(x, y));
      pixels.push((rgba.r + rgba.g + rgba.b) / 3);
    }
  }

  const mean = pixels.reduce((a, b) => a + b, 0) / pixels.length;
  const variance = pixels.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / pixels.length;

  return Math.round(variance);
}

/**
 * Detectar simetría horizontal y vertical
 */
function detectSymmetry(image) {
  const width = image.bitmap.width;
  const height = image.bitmap.height;
  const sampleSize = 10; // Muestrear cada 10 píxeles

  let horizontalDiff = 0;
  let verticalDiff = 0;
  let samples = 0;

  // Simetría vertical (izquierda vs derecha)
  for (let y = 0; y < height; y += sampleSize) {
    for (let x = 0; x < width / 2; x += sampleSize) {
      const left = jimp.intToRGBA(image.getPixelColor(x, y));
      const right = jimp.intToRGBA(image.getPixelColor(width - x - 1, y));
      
      verticalDiff += Math.abs(left.r - right.r) + Math.abs(left.g - right.g) + Math.abs(left.b - right.b);
      samples++;
    }
  }

  // Simetría horizontal (arriba vs abajo)
  for (let y = 0; y < height / 2; y += sampleSize) {
    for (let x = 0; x < width; x += sampleSize) {
      const top = jimp.intToRGBA(image.getPixelColor(x, y));
      const bottom = jimp.intToRGBA(image.getPixelColor(x, height - y - 1));
      
      horizontalDiff += Math.abs(top.r - bottom.r) + Math.abs(top.g - bottom.g) + Math.abs(top.b - bottom.b);
    }
  }

  const maxDiff = 255 * 3 * samples;
  const verticalSymmetry = 100 - (verticalDiff / maxDiff * 100);
  const horizontalSymmetry = 100 - (horizontalDiff / maxDiff * 100);

  return {
    vertical: Math.max(0, Math.round(verticalSymmetry)),
    horizontal: Math.max(0, Math.round(horizontalSymmetry)),
    hasSymmetry: verticalSymmetry > 70 || horizontalSymmetry > 70
  };
}

/**
 * Detectar desenfoque de movimiento
 */
function detectMotionBlur(image) {
  // Análisis simple: calcular gradientes horizontales vs verticales
  const gray = image.clone().grayscale();
  const width = gray.bitmap.width;
  const height = gray.bitmap.height;
  
  let horizontalGradient = 0;
  let verticalGradient = 0;
  const sampleSize = 20;

  for (let y = 1; y < height - 1; y += sampleSize) {
    for (let x = 1; x < width - 1; x += sampleSize) {
      const center = jimp.intToRGBA(gray.getPixelColor(x, y)).r;
      const left = jimp.intToRGBA(gray.getPixelColor(x - 1, y)).r;
      const right = jimp.intToRGBA(gray.getPixelColor(x + 1, y)).r;
      const top = jimp.intToRGBA(gray.getPixelColor(x, y - 1)).r;
      const bottom = jimp.intToRGBA(gray.getPixelColor(x, y + 1)).r;

      horizontalGradient += Math.abs(right - left);
      verticalGradient += Math.abs(bottom - top);
    }
  }

  const ratio = horizontalGradient / (verticalGradient + 1);
  const hasMotionBlur = ratio > 1.3 || ratio < 0.7;

  return {
    detected: hasMotionBlur,
    direction: ratio > 1.3 ? 'horizontal' : ratio < 0.7 ? 'vertical' : 'none',
    intensity: Math.abs(ratio - 1) * 100
  };
}

/**
 * Detectar ruido en la imagen
 */
function detectNoise(image) {
  const gray = image.clone().grayscale();
  const width = gray.bitmap.width;
  const height = gray.bitmap.height;
  
  let noiseCount = 0;
  const sampleSize = 15;
  const threshold = 25;

  for (let y = 1; y < height - 1; y += sampleSize) {
    for (let x = 1; x < width - 1; x += sampleSize) {
      const center = jimp.intToRGBA(gray.getPixelColor(x, y)).r;
      const neighbors = [
        jimp.intToRGBA(gray.getPixelColor(x - 1, y)).r,
        jimp.intToRGBA(gray.getPixelColor(x + 1, y)).r,
        jimp.intToRGBA(gray.getPixelColor(x, y - 1)).r,
        jimp.intToRGBA(gray.getPixelColor(x, y + 1)).r
      ];

      const avgNeighbor = neighbors.reduce((a, b) => a + b, 0) / neighbors.length;
      
      if (Math.abs(center - avgNeighbor) > threshold) {
        noiseCount++;
      }
    }
  }

  const noiseLevel = (noiseCount / ((width / sampleSize) * (height / sampleSize))) * 100;

  return {
    detected: noiseLevel > 10,
    level: Math.round(noiseLevel * 100) / 100,
    severity: noiseLevel > 20 ? 'high' : noiseLevel > 10 ? 'medium' : 'low'
  };
}

/**
 * Calcular nitidez de la imagen
 */
function calculateSharpness(image) {
  const gray = image.clone().grayscale();
  const width = gray.bitmap.width;
  const height = gray.bitmap.height;
  
  let laplacian = 0;
  const sampleSize = 10;

  // Operador Laplaciano simplificado
  for (let y = 1; y < height - 1; y += sampleSize) {
    for (let x = 1; x < width - 1; x += sampleSize) {
      const center = jimp.intToRGBA(gray.getPixelColor(x, y)).r;
      const left = jimp.intToRGBA(gray.getPixelColor(x - 1, y)).r;
      const right = jimp.intToRGBA(gray.getPixelColor(x + 1, y)).r;
      const top = jimp.intToRGBA(gray.getPixelColor(x, y - 1)).r;
      const bottom = jimp.intToRGBA(gray.getPixelColor(x, y + 1)).r;

      const value = Math.abs(4 * center - left - right - top - bottom);
      laplacian += value;
    }
  }

  const sharpnessScore = laplacian / ((width / sampleSize) * (height / sampleSize));

  return {
    score: Math.round(sharpnessScore),
    isSharp: sharpnessScore > 15,
    quality: sharpnessScore > 25 ? 'excellent' : sharpnessScore > 15 ? 'good' : sharpnessScore > 8 ? 'fair' : 'poor'
  };
}

/**
 * Calcular score de confianza basado en métricas
 */
function calculateConfidence(analysis) {
  let score = 50; // Base score

  // Aumentar por buena calidad de imagen
  if (analysis.sharpness && analysis.sharpness.isSharp) score += 15;
  if (analysis.contrast > 50) score += 10;
  if (!analysis.noise || !analysis.noise.detected) score += 10;
  if (!analysis.motionBlur || !analysis.motionBlur.detected) score += 10;

  // Aumentar por características definidas
  if (analysis.edges && analysis.edges.hasStrongEdges) score += 10;
  if (analysis.colorVariance > 1000) score += 5;

  return Math.min(100, Math.max(0, Math.round(score)));
}

/**
 * Detectar anomalías en la imagen
 */
function detectAnomalies(analysis) {
  const anomalies = [];

  // Anomalías de calidad
  if (analysis.motionBlur && analysis.motionBlur.detected) {
    anomalies.push({
      type: 'motion_blur',
      severity: 'medium',
      description: `Desenfoque de movimiento detectado (dirección: ${analysis.motionBlur.direction})`
    });
  }

  if (analysis.noise && analysis.noise.detected) {
    anomalies.push({
      type: 'noise',
      severity: analysis.noise.severity,
      description: `Ruido detectado (nivel: ${analysis.noise.level}%)`
    });
  }

  if (analysis.sharpness && !analysis.sharpness.isSharp) {
    anomalies.push({
      type: 'low_sharpness',
      severity: 'low',
      description: `Imagen poco nítida (score: ${analysis.sharpness.score})`
    });
  }

  // Anomalías de contenido
  if (analysis.contrast < 20) {
    anomalies.push({
      type: 'low_contrast',
      severity: 'medium',
      description: 'Contraste muy bajo en la imagen'
    });
  }

  if (analysis.symmetry && analysis.symmetry.hasSymmetry) {
    anomalies.push({
      type: 'high_symmetry',
      severity: 'info',
      description: `Simetría inusual detectada (V:${analysis.symmetry.vertical}%, H:${analysis.symmetry.horizontal}%)`
    });
  }

  return anomalies;
}

/**
 * Clasificar el tipo de objeto basado en características
 */
function classifyObject(analysis) {
  const features = {
    brightness: analysis.brightness || 0,
    contrast: analysis.contrast || 0,
    edges: analysis.edges ? analysis.edges.edgeDensity : 0,
    symmetry: analysis.symmetry ? (analysis.symmetry.vertical + analysis.symmetry.horizontal) / 2 : 0,
    sharpness: analysis.sharpness ? analysis.sharpness.score : 0
  };

  // Reglas de clasificación basadas en características
  if (features.edges < 5 && features.contrast < 30) {
    return {
      category: 'celestial',
      confidence: 70,
      reason: 'Baja densidad de bordes y contraste bajo (posible objeto celestial)'
    };
  }

  if (features.edges > 20 && features.symmetry > 70) {
    return {
      category: 'aircraft',
      confidence: 75,
      reason: 'Alta simetría y bordes definidos (posible aeronave)'
    };
  }

  if (features.sharpness < 10 || (analysis.motionBlur && analysis.motionBlur.detected)) {
    return {
      category: 'motion',
      confidence: 65,
      reason: 'Movimiento o desenfoque detectado'
    };
  }

  if (features.contrast > 60 && features.edges > 15) {
    return {
      category: 'defined_object',
      confidence: 70,
      reason: 'Objeto con características bien definidas'
    };
  }

  // Clasificación por defecto
  return {
    category: 'unknown',
    confidence: 50,
    reason: 'No se pudo clasificar con certeza, requiere análisis adicional'
  };
}

module.exports = {
  analyzeImage
};
