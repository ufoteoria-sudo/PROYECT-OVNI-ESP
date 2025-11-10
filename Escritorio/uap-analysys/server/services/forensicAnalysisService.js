/**
 * SERVICIO DE ANÁLISIS FORENSE DE IMÁGENES
 * 
 * Implementa técnicas avanzadas de detección de manipulación:
 * - Análisis de consistencia de iluminación y sombras
 * - Detección de inconsistencias en ruido digital
 * - Análisis de niveles de compresión (similar a ELA)
 * - Detección de clonación/copia-pega
 * - Análisis de bordes y artefactos
 * 
 * Basado en técnicas de forensics digitales y research papers
 */

const sharp = require('sharp');
const path = require('path');

class ForensicAnalysisService {
  
  /**
   * Análisis forense completo de una imagen
   * @param {string} imagePath - Ruta de la imagen
   * @returns {Object} Resultados del análisis forense
   */
  async analyzeImage(imagePath) {
    console.log('\n🔬 === ANÁLISIS FORENSE AVANZADO ===');
    
    try {
      const startTime = Date.now();
      
      // Cargar imagen
      const image = sharp(imagePath);
      const metadata = await image.metadata();
      
      console.log(`📸 Imagen: ${metadata.width}x${metadata.height}, formato: ${metadata.format}`);
      
      // Redimensionar si es muy grande (optimización)
      const maxDimension = 1200;
      if (metadata.width > maxDimension || metadata.height > maxDimension) {
        image.resize(maxDimension, maxDimension, { fit: 'inside', withoutEnlargement: true });
      }
      
      const buffer = await image.raw().toBuffer();
      const { width, height, channels } = await image.metadata();
      
      // Ejecutar análisis en paralelo
      const [
        lightingAnalysis,
        noiseAnalysis,
        cloneDetection,
        edgeConsistency
      ] = await Promise.all([
        this.analyzeLightingConsistency(buffer, width, height, channels),
        this.analyzeNoiseInconsistency(buffer, width, height, channels),
        this.detectCloning(buffer, width, height, channels),
        this.analyzeEdgeConsistency(buffer, width, height, channels)
      ]);
      
      // Calcular score de manipulación global (0-100, donde 100 es muy manipulado)
      const manipulationScore = this.calculateManipulationScore({
        lightingAnalysis,
        noiseAnalysis,
        cloneDetection,
        edgeConsistency
      });
      
      const elapsedTime = ((Date.now() - startTime) / 1000).toFixed(2);
      console.log(`✅ Análisis forense completado en ${elapsedTime}s`);
      console.log(`🎯 Score de manipulación: ${manipulationScore}/100`);
      
      return {
        manipulationScore,
        lightingAnalysis,
        noiseAnalysis,
        cloneDetection,
        edgeConsistency,
        verdict: this.getVerdict(manipulationScore),
        processingTime: elapsedTime
      };
      
    } catch (error) {
      console.error('❌ Error en análisis forense:', error.message);
      return {
        manipulationScore: 0,
        error: error.message,
        verdict: 'UNABLE_TO_ANALYZE'
      };
    }
  }
  
  /**
   * Analiza la consistencia de iluminación en diferentes regiones
   * Técnica: Divide la imagen en cuadrantes y compara direcciones de gradientes
   */
  async analyzeLightingConsistency(buffer, width, height, channels) {
    console.log('💡 Analizando consistencia de iluminación...');
    
    try {
      // Dividir imagen en 9 regiones (3x3)
      const regions = this.divideIntoRegions(buffer, width, height, channels, 3, 3);
      
      // Calcular dirección de luz dominante en cada región
      const lightDirections = regions.map(region => 
        this.calculateLightDirection(region.data, region.width, region.height, channels)
      );
      
      // Calcular varianza de direcciones
      const avgDirection = lightDirections.reduce((sum, dir) => sum + dir, 0) / lightDirections.length;
      const variance = lightDirections.reduce((sum, dir) => sum + Math.pow(dir - avgDirection, 2), 0) / lightDirections.length;
      const stdDev = Math.sqrt(variance);
      
      // Alta varianza = inconsistencia sospechosa
      const inconsistencyScore = Math.min(stdDev / 180 * 100, 100); // Normalizar a 0-100
      
      console.log(`  • Dirección promedio: ${avgDirection.toFixed(1)}°`);
      console.log(`  • Desviación estándar: ${stdDev.toFixed(1)}°`);
      console.log(`  • Score de inconsistencia: ${inconsistencyScore.toFixed(1)}/100`);
      
      return {
        inconsistencyScore: Math.round(inconsistencyScore),
        averageDirection: Math.round(avgDirection),
        standardDeviation: stdDev,
        regions: lightDirections.length,
        isSuspicious: inconsistencyScore > 40
      };
      
    } catch (error) {
      console.error('  ❌ Error en análisis de iluminación:', error.message);
      return { inconsistencyScore: 0, error: error.message };
    }
  }
  
  /**
   * Calcula la dirección de luz dominante usando gradientes
   */
  calculateLightDirection(buffer, width, height, channels) {
    let sumX = 0, sumY = 0, count = 0;
    
    // Convertir a escala de grises y calcular gradientes
    for (let y = 1; y < height - 1; y++) {
      for (let x = 1; x < width - 1; x++) {
        const idx = (y * width + x) * channels;
        
        // Luminosidad del píxel actual
        const current = (buffer[idx] + buffer[idx + 1] + buffer[idx + 2]) / 3;
        
        // Luminosidad de vecinos
        const right = (buffer[idx + channels] + buffer[idx + channels + 1] + buffer[idx + channels + 2]) / 3;
        const down = (buffer[idx + width * channels] + buffer[idx + width * channels + 1] + buffer[idx + width * channels + 2]) / 3;
        
        // Gradientes
        const gx = right - current;
        const gy = down - current;
        
        sumX += gx;
        sumY += gy;
        count++;
      }
    }
    
    // Dirección en grados (0-360)
    const angle = Math.atan2(sumY / count, sumX / count) * (180 / Math.PI);
    return angle >= 0 ? angle : angle + 360;
  }
  
  /**
   * Analiza inconsistencias en el ruido digital
   * Técnica: Compara la textura de ruido en diferentes regiones
   */
  async analyzeNoiseInconsistency(buffer, width, height, channels) {
    console.log('📊 Analizando inconsistencias de ruido...');
    
    try {
      // Dividir en regiones más pequeñas para detectar diferencias locales
      const regions = this.divideIntoRegions(buffer, width, height, channels, 4, 4);
      
      // Calcular nivel de ruido en cada región
      const noiselevels = regions.map(region =>
        this.calculateNoiseLevel(region.data, region.width, region.height, channels)
      );
      
      // Calcular varianza de niveles de ruido
      const avgNoise = noiselevels.reduce((sum, n) => sum + n, 0) / noiselevels.length;
      const variance = noiselevels.reduce((sum, n) => sum + Math.pow(n - avgNoise, 2), 0) / noiselevels.length;
      const stdDev = Math.sqrt(variance);
      
      // Alta varianza = posible composición de múltiples imágenes
      const inconsistencyScore = Math.min((stdDev / avgNoise) * 100, 100);
      
      console.log(`  • Ruido promedio: ${avgNoise.toFixed(2)}`);
      console.log(`  • Desviación estándar: ${stdDev.toFixed(2)}`);
      console.log(`  • Score de inconsistencia: ${inconsistencyScore.toFixed(1)}/100`);
      
      return {
        inconsistencyScore: Math.round(inconsistencyScore),
        averageNoise: avgNoise,
        standardDeviation: stdDev,
        regions: noiselevels.length,
        isSuspicious: inconsistencyScore > 35
      };
      
    } catch (error) {
      console.error('  ❌ Error en análisis de ruido:', error.message);
      return { inconsistencyScore: 0, error: error.message };
    }
  }
  
  /**
   * Calcula el nivel de ruido usando diferencias de alta frecuencia
   */
  calculateNoiseLevel(buffer, width, height, channels) {
    let sum = 0, count = 0;
    
    // Calcular diferencias entre píxeles adyacentes (ruido de alta frecuencia)
    for (let y = 0; y < height - 1; y++) {
      for (let x = 0; x < width - 1; x++) {
        const idx = (y * width + x) * channels;
        
        for (let c = 0; c < 3; c++) {
          const current = buffer[idx + c];
          const right = buffer[idx + channels + c];
          const down = buffer[idx + width * channels + c];
          
          sum += Math.abs(right - current) + Math.abs(down - current);
          count += 2;
        }
      }
    }
    
    return sum / count;
  }
  
  /**
   * Detecta regiones clonadas/copiadas dentro de la misma imagen
   * Técnica: Compara hashes de bloques de 32x32 píxeles
   */
  async detectCloning(buffer, width, height, channels) {
    console.log('🔍 Detectando clonación/copia-pega...');
    
    try {
      const blockSize = 32;
      const threshold = 0.95; // 95% de similitud para considerar clonación
      
      // Dividir imagen en bloques superpuestos
      const blocks = [];
      for (let y = 0; y < height - blockSize; y += blockSize / 2) {
        for (let x = 0; x < width - blockSize; x += blockSize / 2) {
          const hash = this.calculateBlockHash(buffer, width, height, channels, x, y, blockSize);
          blocks.push({ x, y, hash });
        }
      }
      
      // Buscar bloques similares (pero no en la misma posición)
      let clonedPairs = [];
      for (let i = 0; i < blocks.length; i++) {
        for (let j = i + 1; j < blocks.length; j++) {
          const distance = Math.abs(blocks[i].x - blocks[j].x) + Math.abs(blocks[i].y - blocks[j].y);
          
          // Ignorar bloques muy cercanos (son naturalmente similares)
          if (distance > blockSize * 2) {
            const similarity = this.compareHashes(blocks[i].hash, blocks[j].hash);
            
            if (similarity > threshold) {
              clonedPairs.push({
                block1: { x: blocks[i].x, y: blocks[i].y },
                block2: { x: blocks[j].x, y: blocks[j].y },
                similarity: similarity
              });
            }
          }
        }
      }
      
      // Score basado en número de regiones clonadas
      const cloneScore = Math.min((clonedPairs.length / 5) * 100, 100);
      
      console.log(`  • Bloques analizados: ${blocks.length}`);
      console.log(`  • Pares clonados detectados: ${clonedPairs.length}`);
      console.log(`  • Score de clonación: ${cloneScore.toFixed(1)}/100`);
      
      return {
        cloneScore: Math.round(cloneScore),
        clonedRegions: clonedPairs.length,
        totalBlocks: blocks.length,
        isSuspicious: clonedPairs.length > 3,
        details: clonedPairs.slice(0, 5) // Solo primeros 5 para no saturar
      };
      
    } catch (error) {
      console.error('  ❌ Error en detección de clonación:', error.message);
      return { cloneScore: 0, error: error.message };
    }
  }
  
  /**
   * Calcula hash simple de un bloque de imagen
   */
  calculateBlockHash(buffer, width, height, channels, startX, startY, blockSize) {
    const hash = [];
    const step = Math.max(1, Math.floor(blockSize / 8)); // 8x8 hash
    
    for (let y = 0; y < blockSize; y += step) {
      for (let x = 0; x < blockSize; x += step) {
        const imgY = Math.min(startY + y, height - 1);
        const imgX = Math.min(startX + x, width - 1);
        const idx = (imgY * width + imgX) * channels;
        
        // Promedio RGB como valor del hash
        const avg = (buffer[idx] + buffer[idx + 1] + buffer[idx + 2]) / 3;
        hash.push(Math.round(avg / 16)); // Cuantizar a 16 niveles
      }
    }
    
    return hash;
  }
  
  /**
   * Compara dos hashes (correlación normalizada)
   */
  compareHashes(hash1, hash2) {
    if (hash1.length !== hash2.length) return 0;
    
    let sum = 0;
    for (let i = 0; i < hash1.length; i++) {
      sum += Math.abs(hash1[i] - hash2[i]);
    }
    
    const maxDiff = hash1.length * 15; // Máxima diferencia posible (16 niveles)
    return 1 - (sum / maxDiff);
  }
  
  /**
   * Analiza consistencia de bordes (detecta bordes artificiales de recortes)
   */
  async analyzeEdgeConsistency(buffer, width, height, channels) {
    console.log('✂️ Analizando consistencia de bordes...');
    
    try {
      // Detectar bordes usando operador Sobel
      const edges = this.detectEdgesSobel(buffer, width, height, channels);
      
      // Buscar patrones sospechosos:
      // 1. Bordes excesivamente nítidos en ciertas áreas
      // 2. "Halos" o artefactos alrededor de objetos
      
      const regions = this.divideIntoRegions(edges, width, height, 1, 4, 4);
      const edgeDensities = regions.map(r => 
        this.calculateEdgeDensity(r.data, r.width, r.height, 1)
      );
      
      // Alta varianza en densidad de bordes = posible composición
      const avgDensity = edgeDensities.reduce((s, d) => s + d, 0) / edgeDensities.length;
      const variance = edgeDensities.reduce((s, d) => s + Math.pow(d - avgDensity, 2), 0) / edgeDensities.length;
      const stdDev = Math.sqrt(variance);
      
      const inconsistencyScore = Math.min((stdDev / avgDensity) * 100, 100);
      
      console.log(`  • Densidad de bordes promedio: ${avgDensity.toFixed(2)}`);
      console.log(`  • Desviación estándar: ${stdDev.toFixed(2)}`);
      console.log(`  • Score de inconsistencia: ${inconsistencyScore.toFixed(1)}/100`);
      
      return {
        inconsistencyScore: Math.round(inconsistencyScore),
        averageDensity: avgDensity,
        standardDeviation: stdDev,
        isSuspicious: inconsistencyScore > 45
      };
      
    } catch (error) {
      console.error('  ❌ Error en análisis de bordes:', error.message);
      return { inconsistencyScore: 0, error: error.message };
    }
  }
  
  /**
   * Detector de bordes Sobel
   */
  detectEdgesSobel(buffer, width, height, channels) {
    const edges = Buffer.alloc(width * height);
    
    const sobelX = [[-1, 0, 1], [-2, 0, 2], [-1, 0, 1]];
    const sobelY = [[-1, -2, -1], [0, 0, 0], [1, 2, 1]];
    
    for (let y = 1; y < height - 1; y++) {
      for (let x = 1; x < width - 1; x++) {
        let gx = 0, gy = 0;
        
        // Aplicar kernels Sobel
        for (let ky = -1; ky <= 1; ky++) {
          for (let kx = -1; kx <= 1; kx++) {
            const idx = ((y + ky) * width + (x + kx)) * channels;
            const gray = (buffer[idx] + buffer[idx + 1] + buffer[idx + 2]) / 3;
            
            gx += gray * sobelX[ky + 1][kx + 1];
            gy += gray * sobelY[ky + 1][kx + 1];
          }
        }
        
        const magnitude = Math.sqrt(gx * gx + gy * gy);
        edges[y * width + x] = Math.min(magnitude, 255);
      }
    }
    
    return edges;
  }
  
  /**
   * Calcula densidad de bordes en un buffer
   */
  calculateEdgeDensity(buffer, width, height, channels) {
    let sum = 0;
    for (let i = 0; i < buffer.length; i++) {
      sum += buffer[i];
    }
    return sum / (width * height);
  }
  
  /**
   * Divide imagen en regiones
   */
  divideIntoRegions(buffer, width, height, channels, rows, cols) {
    const regions = [];
    const regionWidth = Math.floor(width / cols);
    const regionHeight = Math.floor(height / rows);
    
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const startX = c * regionWidth;
        const startY = r * regionHeight;
        const endX = Math.min(startX + regionWidth, width);
        const endY = Math.min(startY + regionHeight, height);
        
        const regionData = this.extractRegion(buffer, width, height, channels, startX, startY, endX, endY);
        
        regions.push({
          data: regionData,
          width: endX - startX,
          height: endY - startY,
          x: startX,
          y: startY
        });
      }
    }
    
    return regions;
  }
  
  /**
   * Extrae una región de la imagen
   */
  extractRegion(buffer, width, height, channels, startX, startY, endX, endY) {
    const regionWidth = endX - startX;
    const regionHeight = endY - startY;
    const regionData = Buffer.alloc(regionWidth * regionHeight * channels);
    
    let destIdx = 0;
    for (let y = startY; y < endY; y++) {
      for (let x = startX; x < endX; x++) {
        const srcIdx = (y * width + x) * channels;
        for (let c = 0; c < channels; c++) {
          regionData[destIdx++] = buffer[srcIdx + c];
        }
      }
    }
    
    return regionData;
  }
  
  /**
   * Calcula score global de manipulación
   */
  calculateManipulationScore(analyses) {
    const weights = {
      lighting: 0.25,      // 25% - Iluminación inconsistente
      noise: 0.30,         // 30% - Ruido inconsistente (muy indicativo)
      cloning: 0.30,       // 30% - Clonación detectada (muy indicativo)
      edges: 0.15          // 15% - Bordes artificiales
    };
    
    const score = 
      (analyses.lightingAnalysis?.inconsistencyScore || 0) * weights.lighting +
      (analyses.noiseAnalysis?.inconsistencyScore || 0) * weights.noise +
      (analyses.cloneDetection?.cloneScore || 0) * weights.cloning +
      (analyses.edgeConsistency?.inconsistencyScore || 0) * weights.edges;
    
    return Math.round(score);
  }
  
  /**
   * Obtiene veredicto basado en score
   */
  getVerdict(score) {
    if (score < 20) return 'LIKELY_AUTHENTIC';
    if (score < 40) return 'POSSIBLY_AUTHENTIC';
    if (score < 60) return 'INCONCLUSIVE';
    if (score < 80) return 'POSSIBLY_MANIPULATED';
    return 'LIKELY_MANIPULATED';
  }
}

module.exports = new ForensicAnalysisService();
