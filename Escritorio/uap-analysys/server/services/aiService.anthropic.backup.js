const Anthropic = require('@anthropic-ai/sdk');
const fs = require('fs');
const path = require('path');

// Inicializar cliente de Anthropic
const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY || 'your-api-key-here',
});

/**
 * Analiza una imagen usando Claude Vision API
 * @param {string} filePath - Ruta completa del archivo de imagen
 * @param {Object} options - Opciones adicionales
 * @returns {Object} Resultado del análisis
 */
async function analyzeImage(filePath, options = {}) {
  try {
    // Verificar que la API key esté configurada
    if (!process.env.ANTHROPIC_API_KEY || process.env.ANTHROPIC_API_KEY === 'your-api-key-here') {
      return {
        success: false,
        error: 'API key de Claude no configurada. Configura ANTHROPIC_API_KEY en el archivo .env'
      };
    }

    // Leer archivo y convertir a base64
    const imageBuffer = fs.readFileSync(filePath);
    const base64Image = imageBuffer.toString('base64');
    
    // Determinar tipo MIME
    const ext = path.extname(filePath).toLowerCase();
    const mimeTypes = {
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.png': 'image/png',
      '.gif': 'image/gif',
      '.webp': 'image/webp'
    };
    const mediaType = mimeTypes[ext] || 'image/jpeg';

    // Prompt especializado para análisis UAP/OVNI
    const prompt = `Eres un experto analista de fenómenos aéreos no identificados (UAP/OVNI). Analiza esta imagen en detalle y proporciona:

1. DESCRIPCIÓN GENERAL: Describe qué ves en la imagen.
2. OBJETOS DETECTADOS: Lista todos los objetos visibles (ej: avión, ave, drone, luz, nube, etc.)
3. CARACTERÍSTICAS INUSUALES: ¿Hay algo anómalo o fuera de lo común?
4. POSIBLES EXPLICACIONES: Lista posibles explicaciones convencionales para los objetos visibles.
5. NIVEL DE CONFIANZA: Del 0 al 100, qué tan seguro estás de tu análisis.
6. CATEGORÍA SUGERIDA: Clasifica como: 
   - 'aircraft' (avión)
   - 'bird' (ave)
   - 'drone' (dron)
   - 'celestial' (objeto celeste: estrella, planeta, satélite)
   - 'balloon' (globo)
   - 'natural' (fenómeno natural: nube, rayo, etc.)
   - 'hoax' (falsificación evidente)
   - 'uap' (no identificado, sin explicación convencional)
   - 'unknown' (no se puede determinar)

7. RECOMENDACIONES: Qué información adicional sería útil para un análisis más completo.

Sé objetivo, científico y honesto. Si no puedes determinar algo, dilo claramente.`;

    // Llamar a Claude Vision API
    const message = await anthropic.messages.create({
      model: options.model || 'claude-3-5-sonnet-20241022',
      max_tokens: 2000,
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'image',
              source: {
                type: 'base64',
                media_type: mediaType,
                data: base64Image,
              },
            },
            {
              type: 'text',
              text: prompt
            }
          ],
        },
      ],
    });

    // Extraer respuesta
    const responseText = message.content[0].text;
    
    // Parsear respuesta para extraer información estructurada
    const analysisResult = parseClaudeResponse(responseText);
    
    return {
      success: true,
      data: {
        provider: 'claude',
        model: message.model,
        description: responseText,
        detectedObjects: analysisResult.objects,
        confidence: analysisResult.confidence,
        category: analysisResult.category,
        isUnusual: analysisResult.isUnusual,
        recommendations: analysisResult.recommendations,
        processedDate: new Date(),
        rawResponse: {
          id: message.id,
          role: message.role,
          content: message.content,
          usage: message.usage
        }
      }
    };

  } catch (error) {
    console.error('Error al analizar imagen con Claude:', error);
    
    return {
      success: false,
      error: error.message,
      details: error.error || null
    };
  }
}

/**
 * Parsea la respuesta de Claude para extraer información estructurada
 * @param {string} text - Texto de respuesta de Claude
 * @returns {Object} Datos estructurados
 */
function parseClaudeResponse(text) {
  const result = {
    objects: [],
    confidence: 50,
    category: 'unknown',
    isUnusual: false,
    recommendations: []
  };

  try {
    // Extraer objetos detectados
    const objectsMatch = text.match(/OBJETOS DETECTADOS[:\s]+(.*?)(?=\n\d+\.|$)/is);
    if (objectsMatch) {
      const objectsText = objectsMatch[1];
      const objects = objectsText.split(/[-•*]\s*/).filter(o => o.trim());
      result.objects = objects.map(o => o.trim().split('\n')[0]);
    }

    // Extraer nivel de confianza
    const confidenceMatch = text.match(/NIVEL DE CONFIANZA[:\s]+(\d+)/i);
    if (confidenceMatch) {
      result.confidence = parseInt(confidenceMatch[1]);
    }

    // Extraer categoría
    const categoryMatch = text.match(/CATEGORÍA SUGERIDA[:\s]+['\"]?(\w+)['\"]?/i);
    if (categoryMatch) {
      result.category = categoryMatch[1].toLowerCase();
    }

    // Detectar características inusuales
    const unusualMatch = text.match(/CARACTERÍSTICAS INUSUALES[:\s]+(.*?)(?=\n\d+\.|$)/is);
    if (unusualMatch) {
      const unusualText = unusualMatch[1].toLowerCase();
      result.isUnusual = !unusualText.includes('ninguna') && 
                         !unusualText.includes('no se observ') &&
                         !unusualText.includes('normal');
    }

    // Extraer recomendaciones
    const recoMatch = text.match(/RECOMENDACIONES[:\s]+(.*?)$/is);
    if (recoMatch) {
      const recoText = recoMatch[1];
      const recos = recoText.split(/[-•*]\s*/).filter(r => r.trim());
      result.recommendations = recos.map(r => r.trim().split('\n')[0]);
    }

  } catch (error) {
    console.error('Error al parsear respuesta:', error);
  }

  return result;
}

/**
 * Analiza múltiples imágenes en lote
 * @param {Array<string>} filePaths - Array de rutas de archivos
 * @param {Object} options - Opciones
 * @returns {Array<Object>} Resultados de análisis
 */
async function analyzeMultipleImages(filePaths, options = {}) {
  const results = [];
  
  for (const filePath of filePaths) {
    try {
      const result = await analyzeImage(filePath, options);
      results.push({
        filePath,
        ...result
      });
      
      // Esperar un poco entre llamadas para no sobrecargar la API
      if (options.delay) {
        await new Promise(resolve => setTimeout(resolve, options.delay));
      }
    } catch (error) {
      results.push({
        filePath,
        success: false,
        error: error.message
      });
    }
  }
  
  return results;
}

/**
 * Verifica si la API key está configurada
 * @returns {boolean}
 */
function isConfigured() {
  return process.env.ANTHROPIC_API_KEY && 
         process.env.ANTHROPIC_API_KEY !== 'your-api-key-here';
}

module.exports = {
  analyzeImage,
  analyzeMultipleImages,
  isConfigured
};
