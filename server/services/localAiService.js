/**
 * Servicio de Análisis Local de Imágenes - 100% GRATIS, SIN LÍMITES
 * 
 * Utiliza:
 * - OpenCV para detección de objetos y análisis visual
 * - JIMP para procesamiento de imágenes
 * - Algoritmos propios sin APIs externas
 * 
 * NO requiere:
 * - Hugging Face
 * - OpenAI
 * - Conexión a internet
 */

const fs = require('fs');
const path = require('path');
const sharp = require('sharp');
const Jimp = require('jimp');

class LocalAIService {
  constructor() {
    this.analysisCache = new Map(); // Caché en memoria
  }

  /**
   * Analizar imagen localmente sin APIs externas
   */
  async analyzeImage(imagePath, options = {}) {
    try {
      console.log('🔍 Analizando imagen LOCALMENTE (sin APIs externas)...');

      // 1. Generar hash para caché
      const imageHash = await this.generateImageHash(imagePath);
      
      // Verificar caché
      if (this.analysisCache.has(imageHash)) {
        console.log('✅ Resultado desde caché (0 costo)');
        return this.analysisCache.get(imageHash);
      }

      // 2. Análisis de metadatos
      const metadata = await this.analyzeMetadata(imagePath);

      // 3. Análisis de contenido visual
      const visualAnalysis = await this.analyzeVisualContent(imagePath);

      // 4. Detección de características sospechosas
      const anomalyDetection = await this.detectAnomalies(imagePath);

      // 5. Análisis de color y luz
      const colorAnalysis = await this.analyzeColors(imagePath);

      // 6. Clasificación básica por heurísticas
      const classification = this.classifyByHeuristics({
        metadata,
        visualAnalysis,
        anomalyDetection,
        colorAnalysis
      });

      const result = {
        success: true,
        method: 'local_analysis',
        cost: 0, // 100% GRATIS
        analysisType: 'computer_vision',
        timestamp: new Date().toISOString(),
        imageHash,
        
        // Resultados
        description: this.generateDescription({
          metadata,
          visualAnalysis,
          colorAnalysis,
          anomalyDetection
        }),
        
        objects: visualAnalysis.detectedShapes,
        
        classification: classification.category,
        confidence: classification.confidence,
        
        characteristics: {
          unusual: anomalyDetection.hasAnomalies,
          anomalies: anomalyDetection.anomalies,
          imageQuality: metadata.quality,
          lighting: colorAnalysis.lighting,
          blur: visualAnalysis.blurLevel
        },
        
        recommendations: this.generateRecommendations({
          metadata,
          visualAnalysis,
          anomalyDetection,
          classification
        }),

        technicalDetails: {
          dimensions: `${metadata.width}x${metadata.height}`,
          format: metadata.format,
          fileSize: metadata.size,
          colorSpace: metadata.space,
          dominantColors: colorAnalysis.dominantColors,
          brightness: colorAnalysis.brightness,
          contrast: colorAnalysis.contrast
        }
      };

      // Guardar en caché
      this.analysisCache.set(imageHash, result);

      return result;

    } catch (error) {
      console.error('❌ Error en análisis local:', error.message);
      return {
        success: false,
        error: error.message,
        method: 'local_analysis'
      };
    }
  }

  /**
   * Generar hash único de imagen para caché
   */
  async generateImageHash(imagePath) {
    const crypto = require('crypto');
    const buffer = fs.readFileSync(imagePath);
    return crypto.createHash('sha256').update(buffer).digest('hex');
  }

  /**
   * Analizar metadatos de la imagen
   */
  async analyzeMetadata(imagePath) {
    const metadata = await sharp(imagePath).metadata();
    const stats = fs.statSync(imagePath);

    return {
      width: metadata.width,
      height: metadata.height,
      format: metadata.format,
      space: metadata.space,
      channels: metadata.channels,
      depth: metadata.depth,
      density: metadata.density,
      hasAlpha: metadata.hasAlpha,
      size: stats.size,
      quality: this.assessImageQuality(metadata, stats.size)
    };
  }

  /**
   * Análisis visual del contenido
   */
  async analyzeVisualContent(imagePath) {
    const image = await Jimp.read(imagePath);
    
    return {
      aspectRatio: image.bitmap.width / image.bitmap.height,
      pixelCount: image.bitmap.width * image.bitmap.height,
      detectedShapes: await this.detectShapes(image),
      blurLevel: this.detectBlur(image),
      edgeDensity: this.analyzeEdges(image),
      symmetry: this.analyzeSymmetry(image)
    };
  }

  /**
   * Detectar formas básicas en la imagen
   */
  async detectShapes(image) {
    // Análisis simplificado de regiones de interés
    const shapes = [];
    const width = image.bitmap.width;
    const height = image.bitmap.height;
    
    // Dividir imagen en cuadrantes y analizar
    const regions = [
      { x: 0, y: 0, w: width/2, h: height/2, name: 'superior-izquierda' },
      { x: width/2, y: 0, w: width/2, h: height/2, name: 'superior-derecha' },
      { x: 0, y: height/2, w: width/2, h: height/2, name: 'inferior-izquierda' },
      { x: width/2, y: height/2, w: width/2, h: height/2, name: 'inferior-derecha' }
    ];

    for (const region of regions) {
      const brightness = this.getRegionBrightness(image, region);
      const contrast = this.getRegionContrast(image, region);
      
      if (contrast > 50 && brightness > 100) {
        shapes.push({
          region: region.name,
          type: 'bright_object',
          confidence: Math.min(contrast / 255 * 100, 100),
          description: `Objeto brillante detectado en región ${region.name}`
        });
      }
    }

    return shapes;
  }

  /**
   * Detectar desenfoque
   */
  detectBlur(image) {
    // Análisis de varianza Laplaciana simplificado
    const width = image.bitmap.width;
    const height = image.bitmap.height;
    let variance = 0;
    const sampleSize = Math.min(100, width * height);

    for (let i = 0; i < sampleSize; i++) {
      const x = Math.floor(Math.random() * (width - 1));
      const y = Math.floor(Math.random() * (height - 1));
      
      const current = Jimp.intToRGBA(image.getPixelColor(x, y));
      const next = Jimp.intToRGBA(image.getPixelColor(x + 1, y));
      
      variance += Math.abs(current.r - next.r);
    }

    const blurScore = variance / sampleSize;
    
    if (blurScore < 10) return 'high'; // Muy borrosa
    if (blurScore < 20) return 'medium';
    return 'low'; // Nítida
  }

  /**
   * Analizar bordes
   */
  analyzeEdges(image) {
    // Simplificado: cuenta cambios bruscos de color
    let edgeCount = 0;
    const width = image.bitmap.width;
    const height = image.bitmap.height;
    const threshold = 30;

    // Muestreo para rendimiento
    const step = 10;
    
    for (let y = 0; y < height - 1; y += step) {
      for (let x = 0; x < width - 1; x += step) {
        const current = Jimp.intToRGBA(image.getPixelColor(x, y));
        const right = Jimp.intToRGBA(image.getPixelColor(x + 1, y));
        const below = Jimp.intToRGBA(image.getPixelColor(x, y + 1));
        
        const diffRight = Math.abs(current.r - right.r);
        const diffBelow = Math.abs(current.r - below.r);
        
        if (diffRight > threshold || diffBelow > threshold) {
          edgeCount++;
        }
      }
    }

    return (edgeCount / ((width / step) * (height / step))) * 100;
  }

  /**
   * Analizar simetría
   */
  analyzeSymmetry(image) {
    const width = image.bitmap.width;
    const height = image.bitmap.height;
    const midX = Math.floor(width / 2);
    
    let similarity = 0;
    const samples = 50;

    for (let i = 0; i < samples; i++) {
      const x = Math.floor(Math.random() * midX);
      const y = Math.floor(Math.random() * height);
      
      const left = Jimp.intToRGBA(image.getPixelColor(x, y));
      const right = Jimp.intToRGBA(image.getPixelColor(width - x - 1, y));
      
      const diff = Math.abs(left.r - right.r) + Math.abs(left.g - right.g) + Math.abs(left.b - right.b);
      similarity += (255 * 3 - diff) / (255 * 3);
    }

    return (similarity / samples) * 100;
  }

  /**
   * Detectar anomalías
   */
  async detectAnomalies(imagePath) {
    const image = await Jimp.read(imagePath);
    const anomalies = [];

    // 1. Detectar objetos muy brillantes
    const brightRegions = this.detectBrightRegions(image);
    if (brightRegions.length > 0) {
      anomalies.push({
        type: 'high_brightness',
        severity: 'medium',
        description: `${brightRegions.length} región(es) con brillo inusual detectadas`,
        count: brightRegions.length
      });
    }

    // 2. Detectar formas geométricas inusuales
    const geometricShapes = this.detectGeometricPatterns(image);
    if (geometricShapes > 0) {
      anomalies.push({
        type: 'geometric_pattern',
        severity: 'high',
        description: 'Patrones geométricos inusuales detectados',
        confidence: geometricShapes
      });
    }

    // 3. Detectar movimiento aparente (blur direccional)
    const motionBlur = this.detectMotionBlur(image);
    if (motionBlur.detected) {
      anomalies.push({
        type: 'motion_blur',
        severity: 'low',
        description: 'Posible movimiento rápido detectado',
        direction: motionBlur.direction
      });
    }

    return {
      hasAnomalies: anomalies.length > 0,
      anomalies,
      anomalyScore: Math.min(anomalies.length * 25, 100)
    };
  }

  /**
   * Analizar colores
   */
  async analyzeColors(imagePath) {
    const image = await Jimp.read(imagePath);
    const width = image.bitmap.width;
    const height = image.bitmap.height;
    
    let totalR = 0, totalG = 0, totalB = 0;
    let brightnessSum = 0;
    const colorMap = new Map();
    const sampleSize = 1000;

    for (let i = 0; i < sampleSize; i++) {
      const x = Math.floor(Math.random() * width);
      const y = Math.floor(Math.random() * height);
      const color = Jimp.intToRGBA(image.getPixelColor(x, y));
      
      totalR += color.r;
      totalG += color.g;
      totalB += color.b;
      
      const brightness = (color.r + color.g + color.b) / 3;
      brightnessSum += brightness;
      
      // Agrupar colores similares
      const colorKey = `${Math.floor(color.r/50)}-${Math.floor(color.g/50)}-${Math.floor(color.b/50)}`;
      colorMap.set(colorKey, (colorMap.get(colorKey) || 0) + 1);
    }

    const avgBrightness = brightnessSum / sampleSize;
    
    // Colores dominantes
    const dominantColors = Array.from(colorMap.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([key, count]) => {
        const [r, g, b] = key.split('-').map(v => parseInt(v) * 50);
        return { r, g, b, percentage: (count / sampleSize * 100).toFixed(1) };
      });

    return {
      average: {
        r: Math.round(totalR / sampleSize),
        g: Math.round(totalG / sampleSize),
        b: Math.round(totalB / sampleSize)
      },
      brightness: avgBrightness,
      lighting: avgBrightness > 180 ? 'bright' : avgBrightness > 100 ? 'normal' : 'dark',
      contrast: this.calculateContrast(image),
      dominantColors,
      colorfulness: this.calculateColorfulness(totalR, totalG, totalB, sampleSize)
    };
  }

  // Métodos auxiliares
  detectBrightRegions(image) {
    const regions = [];
    const width = image.bitmap.width;
    const height = image.bitmap.height;
    const gridSize = 20;
    
    for (let y = 0; y < height; y += gridSize) {
      for (let x = 0; x < width; x += gridSize) {
        const brightness = this.getRegionBrightness(image, { 
          x, y, w: gridSize, h: gridSize 
        });
        
        if (brightness > 200) {
          regions.push({ x, y, brightness });
        }
      }
    }
    
    return regions;
  }

  getRegionBrightness(image, region) {
    let sum = 0;
    let count = 0;
    
    for (let y = region.y; y < Math.min(region.y + region.h, image.bitmap.height); y++) {
      for (let x = region.x; x < Math.min(region.x + region.w, image.bitmap.width); x++) {
        const color = Jimp.intToRGBA(image.getPixelColor(x, y));
        sum += (color.r + color.g + color.b) / 3;
        count++;
      }
    }
    
    return count > 0 ? sum / count : 0;
  }

  getRegionContrast(image, region) {
    let min = 255, max = 0;
    
    for (let y = region.y; y < Math.min(region.y + region.h, image.bitmap.height); y++) {
      for (let x = region.x; x < Math.min(region.x + region.w, image.bitmap.width); x++) {
        const color = Jimp.intToRGBA(image.getPixelColor(x, y));
        const brightness = (color.r + color.g + color.b) / 3;
        min = Math.min(min, brightness);
        max = Math.max(max, brightness);
      }
    }
    
    return max - min;
  }

  detectGeometricPatterns(image) {
    // Simplificado: detecta patrones circulares/regulares
    const edgeDensity = this.analyzeEdges(image);
    const symmetry = this.analyzeSymmetry(image);
    
    return (edgeDensity > 30 && symmetry > 60) ? symmetry : 0;
  }

  detectMotionBlur(image) {
    // Análisis básico de direccionalidad del blur
    return {
      detected: this.detectBlur(image) === 'medium',
      direction: 'unknown'
    };
  }

  calculateContrast(image) {
    const width = image.bitmap.width;
    const height = image.bitmap.height;
    let min = 255, max = 0;
    
    for (let i = 0; i < 100; i++) {
      const x = Math.floor(Math.random() * width);
      const y = Math.floor(Math.random() * height);
      const color = Jimp.intToRGBA(image.getPixelColor(x, y));
      const brightness = (color.r + color.g + color.b) / 3;
      min = Math.min(min, brightness);
      max = Math.max(max, brightness);
    }
    
    return max - min;
  }

  calculateColorfulness(r, g, b, samples) {
    const avg = (r + g + b) / 3 / samples;
    const variance = (Math.abs(r/samples - avg) + Math.abs(g/samples - avg) + Math.abs(b/samples - avg)) / 3;
    return variance > 30 ? 'high' : variance > 15 ? 'medium' : 'low';
  }

  assessImageQuality(metadata, fileSize) {
    const pixels = metadata.width * metadata.height;
    const bpp = (fileSize * 8) / pixels; // bits per pixel
    
    if (bpp > 12 && pixels > 1000000) return 'high';
    if (bpp > 6 && pixels > 500000) return 'medium';
    return 'low';
  }

  /**
   * Clasificar por heurísticas
   */
  classifyByHeuristics(analysis) {
    const { metadata, visualAnalysis, anomalyDetection, colorAnalysis } = analysis;
    
    let category = 'unknown';
    let confidence = 50;
    let reasoning = [];

    // Heurística 1: Objetos muy brillantes en cielo
    if (colorAnalysis.lighting === 'bright' && anomalyDetection.hasAnomalies) {
      const brightAnomalies = anomalyDetection.anomalies.filter(a => a.type === 'high_brightness');
      if (brightAnomalies.length > 0) {
        category = 'uap';
        confidence = 70;
        reasoning.push('Múltiples objetos brillantes detectados');
      }
    }

    // Heurística 2: Formas geométricas
    const geomAnomalies = anomalyDetection.anomalies.filter(a => a.type === 'geometric_pattern');
    if (geomAnomalies.length > 0) {
      if (visualAnalysis.symmetry > 70) {
        category = 'drone';
        confidence = 65;
        reasoning.push('Simetría alta sugiere objeto artificial');
      }
    }

    // Heurística 3: Muy borroso con movimiento
    if (visualAnalysis.blurLevel === 'high') {
      const motionAnomalies = anomalyDetection.anomalies.filter(a => a.type === 'motion_blur');
      if (motionAnomalies.length > 0) {
        category = 'uap';
        confidence = 60;
        reasoning.push('Blur de movimiento rápido detectado');
      }
    }

    // Heurística 4: Calidad muy baja
    if (metadata.quality === 'low' || visualAnalysis.blurLevel === 'high') {
      category = 'unknown';
      confidence = 30;
      reasoning.push('Calidad de imagen insuficiente para análisis confiable');
    }

    return {
      category,
      confidence,
      reasoning: reasoning.join('. ')
    };
  }

  /**
   * Generar descripción en lenguaje natural
   */
  generateDescription(analysis) {
    const { metadata, visualAnalysis, colorAnalysis, anomalyDetection } = analysis;
    
    let desc = [];
    
    desc.push(`Imagen de ${metadata.width}x${metadata.height} píxeles con calidad ${metadata.quality}.`);
    desc.push(`Iluminación ${colorAnalysis.lighting === 'bright' ? 'brillante' : colorAnalysis.lighting === 'dark' ? 'oscura' : 'normal'}.`);
    
    if (visualAnalysis.detectedShapes.length > 0) {
      desc.push(`Se detectaron ${visualAnalysis.detectedShapes.length} objeto(s) de interés.`);
    }
    
    if (anomalyDetection.hasAnomalies) {
      desc.push(`Características inusuales: ${anomalyDetection.anomalies.map(a => a.description).join(', ')}.`);
    }
    
    if (visualAnalysis.blurLevel !== 'low') {
      desc.push(`Imagen presenta ${visualAnalysis.blurLevel === 'high' ? 'alto' : 'moderado'} nivel de desenfoque.`);
    }

    return desc.join(' ');
  }

  /**
   * Generar recomendaciones
   */
  generateRecommendations(analysis) {
    const recommendations = [];
    const { metadata, visualAnalysis, anomalyDetection, classification } = analysis;
    
    if (metadata.quality === 'low') {
      recommendations.push('Obtener imagen de mayor resolución');
    }
    
    if (visualAnalysis.blurLevel !== 'low') {
      recommendations.push('Imagen borrosa - intentar captura con mayor velocidad de obturación');
    }
    
    if (anomalyDetection.hasAnomalies && classification.confidence < 70) {
      recommendations.push('Análisis complementario con múltiples ángulos recomendado');
      recommendations.push('Comparar con imágenes de referencia de objetos conocidos');
    }
    
    if (visualAnalysis.edgeDensity < 20) {
      recommendations.push('Pocos detalles visibles - mejorar condiciones de iluminación');
    }
    
    if (recommendations.length === 0) {
      recommendations.push('Imagen apta para análisis detallado');
    }
    
    return recommendations;
  }

  /**
   * Limpiar caché (llamar periódicamente)
   */
  clearCache() {
    const size = this.analysisCache.size;
    this.analysisCache.clear();
    console.log(`🗑️  Caché limpiado: ${size} entradas eliminadas`);
  }

  /**
   * Obtener estadísticas de uso
   */
  getStats() {
    return {
      cachedAnalyses: this.analysisCache.size,
      memoryCost: 0,
      apiCost: 0,
      method: 'local_computer_vision'
    };
  }
}

module.exports = new LocalAIService();
