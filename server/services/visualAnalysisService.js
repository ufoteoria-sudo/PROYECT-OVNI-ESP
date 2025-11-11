/**
 * Servicio de Análisis Visual Avanzado
 * 
 * Implementa análisis de características visuales independiente de EXIF:
 * 1. Detección de patrones de luces (drones, aviones)
 * 2. Análisis de forma y estructura
 * 3. Perceptual hashing para similitud
 * 4. Detección de características específicas (hélices, alas, etc.)
 * 
 * Este servicio NO depende de GPS/timestamp y funciona incluso
 * con imágenes sin metadatos EXIF.
 */

const sharp = require('sharp');
const path = require('path');
const fs = require('fs').promises;

class VisualAnalysisService {
  
  /**
   * Analizar características visuales de una imagen
   * Independiente de EXIF - solo análisis de píxeles
   * 
   * @param {string} imagePath - Ruta de la imagen
   * @returns {object} Características visuales detectadas
   */
  async analyzeVisualFeatures(imagePath) {
    console.log('\n🔬 ANÁLISIS VISUAL AVANZADO');
    console.log('═'.repeat(60));
    
    try {
      const image = sharp(imagePath);
      const metadata = await image.metadata();
      
      console.log(`📊 Imagen: ${metadata.width}x${metadata.height}px`);
      
      // Redimensionar imagen grande para análisis más rápido
      const maxSize = 800;
      let processImage = image;
      if (metadata.width > maxSize || metadata.height > maxSize) {
        console.log(`⚡ Redimensionando imagen para análisis rápido (max ${maxSize}px)`);
        processImage = image.resize(maxSize, maxSize, { fit: 'inside' });
      }
      
      // Ejecutar análisis en paralelo con timeout
      const analysisPromises = [
        this.detectLightPatterns(imagePath),
        this.analyzeShape(imagePath),
        this.analyzeColorProfile(imagePath),
        this.detectEdges(imagePath),
        this.generatePerceptualHash(imagePath)
      ];
      
      // Agregar timeout de 10 segundos
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Análisis visual timeout (10s)')), 10000)
      );
      
      const [
        lightPatterns,
        shapeAnalysis,
        colorProfile,
        edgeDetection,
        perceptualHash
      ] = await Promise.race([
        Promise.all(analysisPromises),
        timeoutPromise
      ]);
      
      // Clasificar tipo de objeto basado en características visuales
      const objectType = this.classifyByVisualFeatures({
        lightPatterns,
        shapeAnalysis,
        colorProfile,
        edgeDetection
      });
      
      const result = {
        lightPatterns,
        shapeAnalysis,
        colorProfile,
        edgeDetection,
        perceptualHash,
        objectType,
        confidence: this.calculateVisualConfidence({
          lightPatterns,
          shapeAnalysis,
          objectType
        })
      };
      
      console.log('\n✅ ANÁLISIS VISUAL COMPLETADO');
      console.log(`   Tipo detectado: ${objectType.category} (${objectType.confidence}%)`);
      console.log(`   Confianza visual: ${result.confidence}%`);
      
      return result;
      
    } catch (error) {
      console.error('❌ Error en análisis visual:', error.message);
      return {
        error: error.message,
        lightPatterns: null,
        shapeAnalysis: null,
        colorProfile: null,
        objectType: { category: 'unknown', confidence: 0 }
      };
    }
  }
  
  /**
   * Detectar patrones de luces (característico de drones y aviones)
   * - Drones: luces intermitentes, patrón múltiple
   * - Aviones: luces de navegación (verde/rojo/blanco)
   * - Celestial: luz única, brillante, sin parpadeo
   */
  async detectLightPatterns(imagePath) {
    try {
      const image = sharp(imagePath);
      const { data, info } = await image
        .raw()
        .toBuffer({ resolveWithObject: true });
      
      const width = info.width;
      const height = info.height;
      const channels = info.channels;
      
      // Detectar puntos brillantes
      const brightSpots = [];
      const threshold = 200; // Umbral de brillo
      
      for (let y = 0; y < height; y += 5) { // Muestreo cada 5 píxeles
        for (let x = 0; x < width; x += 5) {
          const idx = (y * width + x) * channels;
          const r = data[idx];
          const g = data[idx + 1];
          const b = data[idx + 2];
          const brightness = (r + g + b) / 3;
          
          if (brightness > threshold) {
            brightSpots.push({ x, y, brightness, r, g, b });
          }
        }
      }
      
      // Analizar distribución de puntos brillantes
      const spotCount = brightSpots.length;
      const hasMultipleLights = spotCount > 3;
      const hasFewLights = spotCount >= 1 && spotCount <= 3;
      
      // Analizar colores de luces
      const colorAnalysis = this.analyzeLightColors(brightSpots);
      
      return {
        spotCount,
        hasMultipleLights,
        hasFewLights,
        brightSpots: brightSpots.slice(0, 10), // Top 10 más brillantes
        colorAnalysis,
        pattern: this.identifyLightPattern(spotCount, colorAnalysis)
      };
      
    } catch (error) {
      console.error('Error detectando patrones de luz:', error.message);
      return { spotCount: 0, pattern: 'unknown' };
    }
  }
  
  /**
   * Analizar colores de puntos luminosos
   */
  analyzeLightColors(brightSpots) {
    const colors = {
      white: 0,
      red: 0,
      green: 0,
      blue: 0,
      yellow: 0,
      multicolor: false
    };
    
    brightSpots.forEach(spot => {
      const { r, g, b } = spot;
      
      // Blanco (todos los canales altos)
      if (r > 200 && g > 200 && b > 200) {
        colors.white++;
      }
      // Rojo dominante
      else if (r > g + 50 && r > b + 50) {
        colors.red++;
      }
      // Verde dominante
      else if (g > r + 50 && g > b + 50) {
        colors.green++;
      }
      // Azul dominante
      else if (b > r + 50 && b > g + 50) {
        colors.blue++;
      }
      // Amarillo (rojo + verde)
      else if (r > 180 && g > 180 && b < 100) {
        colors.yellow++;
      }
    });
    
    // Detectar multicolor (característico de luces de navegación)
    const colorCount = [colors.red, colors.green, colors.blue, colors.yellow].filter(c => c > 0).length;
    colors.multicolor = colorCount >= 2;
    
    return colors;
  }
  
  /**
   * Identificar patrón de luces
   */
  identifyLightPattern(spotCount, colorAnalysis) {
    // Luces de navegación de avión (verde + rojo + blanco)
    if (colorAnalysis.multicolor && (colorAnalysis.red > 0 && colorAnalysis.green > 0)) {
      return 'aircraft_navigation_lights';
    }
    
    // Múltiples luces blancas (dron)
    if (spotCount >= 3 && colorAnalysis.white >= 2) {
      return 'drone_multiple_lights';
    }
    
    // Luz única brillante (celestial)
    if (spotCount === 1 && colorAnalysis.white > 0) {
      return 'single_bright_light';
    }
    
    // Luz roja/verde única (avión lejano)
    if (spotCount === 1 && (colorAnalysis.red > 0 || colorAnalysis.green > 0)) {
      return 'distant_aircraft';
    }
    
    return 'unknown_pattern';
  }
  
  /**
   * Analizar forma del objeto
   */
  async analyzeShape(imagePath) {
    try {
      const image = sharp(imagePath);
      
      // Convertir a escala de grises y detectar contornos
      const { data, info } = await image
        .greyscale()
        .normalize()
        .threshold(128) // Binarizar
        .raw()
        .toBuffer({ resolveWithObject: true });
      
      const width = info.width;
      const height = info.height;
      
      // Contar píxeles de objeto (blancos después de threshold)
      let objectPixels = 0;
      for (let i = 0; i < data.length; i++) {
        if (data[i] > 128) objectPixels++;
      }
      
      const totalPixels = width * height;
      const objectArea = objectPixels / totalPixels;
      
      // Calcular compacidad (círculo = 1, línea = 0)
      const compactness = this.calculateCompactness(data, width, height);
      
      // Detectar aspectos específicos
      const isCircular = compactness > 0.7;
      const isElongated = compactness < 0.3;
      const isSmallObject = objectArea < 0.05;
      
      return {
        objectArea,
        compactness,
        isCircular,
        isElongated,
        isSmallObject,
        shapeType: this.classifyShape(compactness, objectArea)
      };
      
    } catch (error) {
      console.error('Error analizando forma:', error.message);
      return { shapeType: 'unknown' };
    }
  }
  
  /**
   * Calcular compacidad de la forma
   */
  calculateCompactness(data, width, height) {
    // Simplificación: ratio área/perímetro
    let perimeter = 0;
    let area = 0;
    
    for (let y = 1; y < height - 1; y++) {
      for (let x = 1; x < width - 1; x++) {
        const idx = y * width + x;
        if (data[idx] > 128) {
          area++;
          // Es borde si algún vecino es negro
          const neighbors = [
            data[idx - 1], data[idx + 1],
            data[idx - width], data[idx + width]
          ];
          if (neighbors.some(n => n <= 128)) {
            perimeter++;
          }
        }
      }
    }
    
    if (perimeter === 0) return 0;
    
    // Normalizar: círculo perfecto = 1
    const circularity = (4 * Math.PI * area) / (perimeter * perimeter);
    return Math.min(circularity, 1);
  }
  
  /**
   * Clasificar forma
   */
  classifyShape(compactness, area) {
    if (compactness > 0.7) {
      return area > 0.1 ? 'large_circular' : 'small_circular';
    }
    if (compactness < 0.3) {
      return 'elongated_linear';
    }
    return 'irregular';
  }
  
  /**
   * Analizar perfil de color
   */
  async analyzeColorProfile(imagePath) {
    try {
      const { dominant } = await sharp(imagePath)
        .resize(100, 100, { fit: 'inside' })
        .stats();
      
      const r = Math.round(dominant.r);
      const g = Math.round(dominant.g);
      const b = Math.round(dominant.b);
      
      // Clasificar por color dominante
      const isDark = (r + g + b) / 3 < 50;
      const isBright = (r + g + b) / 3 > 200;
      const isGrayish = Math.abs(r - g) < 30 && Math.abs(g - b) < 30;
      
      return {
        dominant: { r, g, b },
        isDark,
        isBright,
        isGrayish,
        colorType: this.classifyColorType(r, g, b, isDark, isBright, isGrayish)
      };
      
    } catch (error) {
      console.error('Error analizando color:', error.message);
      return { colorType: 'unknown' };
    }
  }
  
  /**
   * Clasificar tipo de color
   */
  classifyColorType(r, g, b, isDark, isBright, isGrayish) {
    if (isDark) return 'night_sky';
    if (isBright && isGrayish) return 'daylight_sky';
    if (isBright) return 'bright_object';
    if (isGrayish) return 'neutral_gray';
    return 'colored_object';
  }
  
  /**
   * Detectar bordes (simplificado)
   */
  async detectEdges(imagePath) {
    try {
      const edgeBuffer = await sharp(imagePath)
        .greyscale()
        .convolve({
          width: 3,
          height: 3,
          kernel: [-1, -1, -1, -1, 8, -1, -1, -1, -1] // Laplaciano
        })
        .raw()
        .toBuffer();
      
      // Contar píxeles de borde
      let edgePixels = 0;
      for (let i = 0; i < edgeBuffer.length; i++) {
        if (edgeBuffer[i] > 50) edgePixels++;
      }
      
      const edgeDensity = edgePixels / edgeBuffer.length;
      
      return {
        edgeDensity,
        hasStrongEdges: edgeDensity > 0.1,
        edgeStrength: edgeDensity > 0.2 ? 'high' : edgeDensity > 0.05 ? 'medium' : 'low'
      };
      
    } catch (error) {
      console.error('Error detectando bordes:', error.message);
      return { edgeStrength: 'unknown' };
    }
  }
  
  /**
   * Generar hash perceptual para comparación
   */
  async generatePerceptualHash(imagePath) {
    try {
      // Reducir a 8x8 y convertir a escala de grises
      const { data } = await sharp(imagePath)
        .resize(8, 8, { fit: 'fill' })
        .greyscale()
        .raw()
        .toBuffer({ resolveWithObject: true });
      
      // Calcular promedio
      const average = data.reduce((sum, val) => sum + val, 0) / data.length;
      
      // Generar hash binario
      let hash = '';
      for (let i = 0; i < data.length; i++) {
        hash += data[i] > average ? '1' : '0';
      }
      
      return hash;
      
    } catch (error) {
      console.error('Error generando hash:', error.message);
      return null;
    }
  }
  
  /**
   * Clasificar tipo de objeto por características visuales
   */
  classifyByVisualFeatures({ lightPatterns, shapeAnalysis, colorProfile, edgeDetection }) {
    const scores = {
      drone: 0,
      aircraft: 0,
      celestial: 0,
      bird: 0,
      natural_phenomenon: 0,
      unknown: 0
    };
    
    // DRON: Múltiples luces, objeto pequeño
    if (lightPatterns.pattern === 'drone_multiple_lights') scores.drone += 40;
    if (lightPatterns.hasMultipleLights) scores.drone += 20;
    if (shapeAnalysis.isSmallObject) scores.drone += 15;
    
    // AVIÓN: Luces de navegación, forma alargada
    if (lightPatterns.pattern === 'aircraft_navigation_lights') scores.aircraft += 50;
    if (lightPatterns.colorAnalysis.multicolor) scores.aircraft += 20;
    if (shapeAnalysis.shapeType === 'elongated_linear') scores.aircraft += 15;
    
    // CELESTIAL: Luz única brillante, circular
    if (lightPatterns.pattern === 'single_bright_light') scores.celestial += 40;
    if (shapeAnalysis.isCircular && shapeAnalysis.isSmallObject) scores.celestial += 30;
    if (colorProfile.isBright) scores.celestial += 15;
    
    // AVE: Forma irregular, bordes definidos
    if (shapeAnalysis.shapeType === 'irregular') scores.bird += 20;
    if (edgeDetection.hasStrongEdges) scores.bird += 15;
    if (!lightPatterns.hasMultipleLights) scores.bird += 10;
    
    // FENÓMENO NATURAL: Forma irregular grande, sin luces
    if (shapeAnalysis.objectArea > 0.2) scores.natural_phenomenon += 25;
    if (!lightPatterns.hasFewLights && !lightPatterns.hasMultipleLights) scores.natural_phenomenon += 20;
    if (colorProfile.isGrayish) scores.natural_phenomenon += 15;
    
    // Encontrar máximo score
    const maxCategory = Object.keys(scores).reduce((a, b) => 
      scores[a] > scores[b] ? a : b
    );
    
    const confidence = Math.min(scores[maxCategory], 100);
    
    return {
      category: maxCategory,
      confidence,
      allScores: scores
    };
  }
  
  /**
   * Calcular confianza del análisis visual
   */
  calculateVisualConfidence({ lightPatterns, shapeAnalysis, objectType }) {
    let confidence = 0;
    
    // Confianza base por detección de características
    if (lightPatterns && lightPatterns.spotCount > 0) confidence += 20;
    if (shapeAnalysis && shapeAnalysis.shapeType !== 'unknown') confidence += 20;
    if (objectType && objectType.confidence > 0) confidence += objectType.confidence * 0.6;
    
    return Math.min(Math.round(confidence), 100);
  }
  
  /**
   * Comparar dos imágenes por similitud visual
   * Usando perceptual hash
   */
  compareImages(hash1, hash2) {
    if (!hash1 || !hash2) return 0;
    
    // Distancia de Hamming
    let differences = 0;
    for (let i = 0; i < Math.min(hash1.length, hash2.length); i++) {
      if (hash1[i] !== hash2[i]) differences++;
    }
    
    const similarity = 1 - (differences / hash1.length);
    return Math.round(similarity * 100);
  }
}

module.exports = new VisualAnalysisService();
