const sharp = require('sharp');
const fs = require('fs').promises;
const path = require('path');

/**
 * Servicio de análisis visual REAL de imágenes
 * Detecta: objetos, colores, formas, luminosidad, distribución
 */

/**
 * Analiza visualmente una imagen y extrae características
 * @param {string} imagePath - Ruta de la imagen
 * @returns {Object} Características visuales detectadas
 */
async function analyzeImageVisually(imagePath) {
  try {
    console.log('📸 Iniciando análisis visual de imagen...');

    // Cargar imagen con sharp
    const image = sharp(imagePath);
    const metadata = await image.metadata();
    const { data, info } = await image
      .resize(800, 800, { fit: 'inside' }) // Reducir para análisis más rápido
      .raw()
      .toBuffer({ resolveWithObject: true });

    // 1. ANÁLISIS DE COMPOSICIÓN
    const composition = analyzeComposition(data, info);
    
    // 2. ANÁLISIS DE COLOR
    const colorAnalysis = analyzeColors(data, info);
    
    // 3. ANÁLISIS DE LUMINOSIDAD
    const luminosity = analyzeLuminosity(data, info);
    
    // 4. DETECCIÓN DE OBJETOS (básica)
    const objectDetection = detectObjects(data, info, composition);
    
    // 5. ANÁLISIS DE CIELO
    const skyAnalysis = analyzeSky(data, info, colorAnalysis);

    console.log('✅ Análisis visual completado');

    return {
      metadata: {
        width: metadata.width,
        height: metadata.height,
        format: metadata.format,
        space: metadata.space,
        hasAlpha: metadata.hasAlpha
      },
      composition,
      colorAnalysis,
      luminosity,
      objectDetection,
      skyAnalysis
    };

  } catch (error) {
    console.error('❌ Error en análisis visual:', error);
    return null;
  }
}

/**
 * Analiza la composición de la imagen (distribución de contenido)
 */
function analyzeComposition(buffer, info) {
  const { width, height, channels } = info;
  const totalPixels = width * height;
  
  // Dividir imagen en cuadrantes y analizar distribución
  const quadrants = {
    topLeft: { r: 0, g: 0, b: 0, count: 0 },
    topRight: { r: 0, g: 0, b: 0, count: 0 },
    bottomLeft: { r: 0, g: 0, b: 0, count: 0 },
    bottomRight: { r: 0, g: 0, b: 0, count: 0 },
    center: { r: 0, g: 0, b: 0, count: 0 }
  };

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = (y * width + x) * channels;
      const r = buffer[idx];
      const g = buffer[idx + 1];
      const b = buffer[idx + 2];

      // Determinar cuadrante
      let quadrant;
      const centerX = width / 2;
      const centerY = height / 2;
      const centerRadius = Math.min(width, height) / 4;

      // Centro
      if (Math.abs(x - centerX) < centerRadius && Math.abs(y - centerY) < centerRadius) {
        quadrant = 'center';
      } else if (y < centerY) {
        quadrant = x < centerX ? 'topLeft' : 'topRight';
      } else {
        quadrant = x < centerX ? 'bottomLeft' : 'bottomRight';
      }

      quadrants[quadrant].r += r;
      quadrants[quadrant].g += g;
      quadrants[quadrant].b += b;
      quadrants[quadrant].count++;
    }
  }

  // Promediar valores
  for (const q in quadrants) {
    if (quadrants[q].count > 0) {
      quadrants[q].r = Math.round(quadrants[q].r / quadrants[q].count);
      quadrants[q].g = Math.round(quadrants[q].g / quadrants[q].count);
      quadrants[q].b = Math.round(quadrants[q].b / quadrants[q].count);
    }
  }

  // Determinar si hay objeto central prominente (AJUSTADO para mayor sensibilidad)
  const centerBrightness = (quadrants.center.r + quadrants.center.g + quadrants.center.b) / 3;
  const avgBrightness = (
    (quadrants.topLeft.r + quadrants.topLeft.g + quadrants.topLeft.b) / 3 +
    (quadrants.topRight.r + quadrants.topRight.g + quadrants.topRight.b) / 3 +
    (quadrants.bottomLeft.r + quadrants.bottomLeft.g + quadrants.bottomLeft.b) / 3 +
    (quadrants.bottomRight.r + quadrants.bottomRight.g + quadrants.bottomRight.b) / 3
  ) / 4;

  // AJUSTADO: Umbral reducido de 30 a 20 para detectar objetos con menos contraste
  const hasCentralObject = Math.abs(centerBrightness - avgBrightness) > 20;

  return {
    quadrants,
    hasCentralObject,
    centralBrightness: centerBrightness,
    averagePeripheralBrightness: avgBrightness,
    centralContrast: Math.abs(centerBrightness - avgBrightness)
  };
}

/**
 * Analiza los colores dominantes
 */
function analyzeColors(buffer, info) {
  const { width, height, channels } = info;
  const totalPixels = width * height;
  
  let totalR = 0, totalG = 0, totalB = 0;
  let brightPixels = 0;
  let darkPixels = 0;
  let saturatedPixels = 0;

  // Histograma simple
  const colorBins = {
    red: 0,
    orange: 0,
    yellow: 0,
    green: 0,
    cyan: 0,
    blue: 0,
    purple: 0,
    white: 0,
    gray: 0,
    black: 0
  };

  for (let i = 0; i < buffer.length; i += channels) {
    const r = buffer[i];
    const g = buffer[i + 1];
    const b = buffer[i + 2];

    totalR += r;
    totalG += g;
    totalB += b;

    const brightness = (r + g + b) / 3;
    if (brightness > 200) brightPixels++;
    if (brightness < 50) darkPixels++;

    // Calcular saturación básica
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    const saturation = max === 0 ? 0 : (max - min) / max;
    if (saturation > 0.5) saturatedPixels++;

    // Clasificar color dominante
    if (brightness > 220 && saturation < 0.2) {
      colorBins.white++;
    } else if (brightness < 30) {
      colorBins.black++;
    } else if (saturation < 0.2) {
      colorBins.gray++;
    } else {
      // Color con saturación
      if (r > g && r > b) {
        colorBins.red++;
      } else if (g > r && g > b) {
        colorBins.green++;
      } else if (b > r && b > g) {
        colorBins.blue++;
      } else if (r > 200 && g > 200 && b < 100) {
        colorBins.yellow++;
      } else if (r > 200 && g < 150 && b > 150) {
        colorBins.purple++;
      }
    }
  }

  const avgR = Math.round(totalR / totalPixels);
  const avgG = Math.round(totalG / totalPixels);
  const avgB = Math.round(totalB / totalPixels);

  // Determinar color dominante
  let dominantColor = 'unknown';
  let maxCount = 0;
  for (const color in colorBins) {
    if (colorBins[color] > maxCount) {
      maxCount = colorBins[color];
      dominantColor = color;
    }
  }

  return {
    averageRGB: { r: avgR, g: avgG, b: avgB },
    dominantColor,
    colorDistribution: colorBins,
    brightPixelsPercent: (brightPixels / totalPixels) * 100,
    darkPixelsPercent: (darkPixels / totalPixels) * 100,
    saturatedPixelsPercent: (saturatedPixels / totalPixels) * 100
  };
}

/**
 * Analiza la luminosidad general
 */
function analyzeLuminosity(buffer, info) {
  const { width, height, channels } = info;
  const totalPixels = width * height;
  
  let totalBrightness = 0;
  let maxBrightness = 0;
  let minBrightness = 255;
  let brightSpots = 0; // Píxeles muy brillantes que podrían ser luces

  for (let i = 0; i < buffer.length; i += channels) {
    const r = buffer[i];
    const g = buffer[i + 1];
    const b = buffer[i + 2];
    const brightness = (r + g + b) / 3;

    totalBrightness += brightness;
    if (brightness > maxBrightness) maxBrightness = brightness;
    if (brightness < minBrightness) minBrightness = brightness;

    // Detectar puntos muy brillantes (posibles luces)
    if (brightness > 240) {
      brightSpots++;
    }
  }

  const avgBrightness = totalBrightness / totalPixels;
  const brightnessRange = maxBrightness - minBrightness;

  return {
    average: avgBrightness,
    max: maxBrightness,
    min: minBrightness,
    range: brightnessRange,
    brightSpotsPercent: (brightSpots / totalPixels) * 100,
    isDark: avgBrightness < 80,
    isBright: avgBrightness > 180,
    hasHighContrast: brightnessRange > 200
  };
}

/**
 * Detecta presencia de objetos (análisis básico de bordes/contraste)
 */
function detectObjects(buffer, info, composition) {
  const { width, height, channels } = info;
  
  // Análisis simplificado de bordes (Sobel-like)
  let edgePixels = 0;
  const threshold = 20; // AJUSTADO: Más sensible para imágenes pequeñas (era 30)

  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      const idx = (y * width + x) * channels;
      const current = (buffer[idx] + buffer[idx + 1] + buffer[idx + 2]) / 3;

      // Comparar con píxeles vecinos
      const right = (buffer[idx + channels] + buffer[idx + channels + 1] + buffer[idx + channels + 2]) / 3;
      const bottom = (buffer[idx + width * channels] + buffer[idx + width * channels + 1] + buffer[idx + width * channels + 2]) / 3;

      if (Math.abs(current - right) > threshold || Math.abs(current - bottom) > threshold) {
        edgePixels++;
      }
    }
  }

  const totalPixels = width * height;
  const edgePercent = (edgePixels / totalPixels) * 100;

  // AJUSTADO: Umbrales más bajos para detectar objetos en imágenes pequeñas
  return {
    hasDefinedObject: composition.hasCentralObject || edgePercent > 3, // era 5
    edgePixelsPercent: edgePercent,
    objectLikelihood: composition.hasCentralObject ? 'high' : edgePercent > 5 ? 'medium' : edgePercent > 2 ? 'low' : 'very_low',
    estimatedObjectCount: composition.hasCentralObject ? 1 : 0
  };
}

/**
 * Analiza si la imagen parece cielo
 */
function analyzeSky(buffer, info, colorAnalysis) {
  const { averageRGB, dominantColor, brightPixelsPercent, darkPixelsPercent } = colorAnalysis;

  // Cielo diurno: azul predominante, luminoso
  const isDaytimeSky = 
    averageRGB.b > averageRGB.r && 
    averageRGB.b > averageRGB.g && 
    averageRGB.b > 100 &&
    brightPixelsPercent > 30;

  // Cielo nocturno: oscuro, poco color
  const isNightSky = 
    darkPixelsPercent > 60 &&
    averageRGB.r < 80 &&
    averageRGB.g < 80 &&
    averageRGB.b < 80;

  // Cielo nublado: gris predominante
  const isCloudySky = 
    dominantColor === 'gray' || dominantColor === 'white' &&
    Math.abs(averageRGB.r - averageRGB.g) < 30 &&
    Math.abs(averageRGB.g - averageRGB.b) < 30;

  // Atardecer/amanecer: naranjas/rojos
  const isGoldenHour = 
    (averageRGB.r > averageRGB.b + 20 || averageRGB.r > 150) &&
    averageRGB.g > 100;

  return {
    appearsToBeSky: isDaytimeSky || isNightSky || isCloudySky || isGoldenHour,
    skyType: isDaytimeSky ? 'daytime' : isNightSky ? 'night' : isCloudySky ? 'cloudy' : isGoldenHour ? 'golden_hour' : 'unknown',
    confidence: (isDaytimeSky || isNightSky) ? 'high' : (isCloudySky || isGoldenHour) ? 'medium' : 'low',
    isDaytimeSky,
    isNightSky,
    isCloudySky,
    isGoldenHour
  };
}

module.exports = {
  analyzeImageVisually
};
