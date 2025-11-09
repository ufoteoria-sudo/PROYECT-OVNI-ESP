const OpenAI = require('openai');
const fs = require('fs');
const path = require('path');

/**
 * Servicio de análisis de imágenes usando Hugging Face Router (API compatible con OpenAI)
 * 100% GRATUITO - Solo necesitas token gratuito de https://huggingface.co/
 * Usa modelos open-source de alta calidad
 */

// Cliente OpenAI apuntando a Hugging Face Router
const client = new OpenAI({
  baseURL: "https://router.huggingface.co/v1",
  apiKey: process.env.HF_TOKEN || 'your-hf-token-here',
});

/**
 * Analiza una imagen usando modelos de visión de Hugging Face
 * @param {string} filePath - Ruta completa del archivo de imagen
 * @param {Object} options - Opciones adicionales
 * @returns {Object} Resultado del análisis
 */
async function analyzeImage(filePath, options = {}) {
  try {
    // Verificar que el token esté configurado
    if (!process.env.HF_TOKEN || process.env.HF_TOKEN === 'your-hf-token-here') {
      return {
        success: false,
        error: 'Token de Hugging Face no configurado. Obtén uno gratis en https://huggingface.co/settings/tokens'
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
    const mimeType = mimeTypes[ext] || 'image/jpeg';

    console.log('🤖 Analizando imagen con Hugging Face (via OpenAI API)...');

    // Prompt especializado para análisis UAP/OVNI
    const uapPrompt = `Eres un experto en análisis de fenómenos aéreos no identificados (UAP/OVNI). 

Analiza esta imagen cuidadosamente y proporciona:

1. DESCRIPCIÓN: Describe lo que ves en la imagen de forma detallada.
2. OBJETOS DETECTADOS: Lista todos los objetos visibles (formato: "objeto - confianza% - descripción")
3. CATEGORÍA: Clasifica la imagen en una de estas categorías:
   - aircraft (aeronave conocida)
   - bird (ave u otro animal volador)
   - drone (dron o UAV)
   - celestial (objeto celestial: estrella, planeta, meteoro)
   - balloon (globo o similar)
   - natural (fenómeno natural: nube, rayo, etc.)
   - hoax (posible fraude o edición)
   - uap (fenómeno aéreo no identificado genuino)
   - unknown (no se puede determinar)

4. CONFIANZA: Tu nivel de confianza en la clasificación (0-100%)
5. CARACTERÍSTICAS INUSUALES: ¿Hay algo inusual o anómalo? (SI/NO y detalles)
6. RECOMENDACIONES: Sugerencias para análisis adicional

Responde en formato JSON estructurado.`;

    // Llamada al modelo de visión
    const completion = await client.chat.completions.create({
      model: "meta-llama/Llama-3.2-11B-Vision-Instruct",
      messages: [
        {
          role: "user",
          content: [
            {
              type: "text",
              text: uapPrompt
            },
            {
              type: "image_url",
              image_url: {
                url: `data:${mimeType};base64,${base64Image}`
              }
            }
          ]
        }
      ],
      max_tokens: 2000,
      temperature: 0.7
    });

    const responseText = completion.choices[0].message.content;
    console.log('✅ Respuesta recibida de Hugging Face');
    console.log('📄 Contenido:', responseText.substring(0, 200) + '...');

    // Parsear la respuesta
    const analysis = parseAIResponse(responseText);

    return {
      success: true,
      data: {
        provider: 'huggingface',
        model: 'meta-llama/Llama-3.2-11B-Vision-Instruct',
        description: analysis.description,
        detectedObjects: analysis.objects,
        confidence: analysis.confidence,
        category: analysis.category,
        isUnusual: analysis.isUnusual,
        unusualFeatures: analysis.unusualFeatures,
        recommendations: analysis.recommendations,
        processedDate: new Date(),
        rawResponse: responseText
      }
    };

  } catch (error) {
    console.error('❌ Error en análisis de IA:', error.message);
    
    // Mensajes de error más descriptivos
    let errorMessage = error.message;
    if (error.message.includes('401') || error.message.includes('authentication')) {
      errorMessage = 'Token de Hugging Face inválido. Verifica tu HF_TOKEN en .env';
    } else if (error.message.includes('429') || error.message.includes('rate limit')) {
      errorMessage = 'Límite de peticiones alcanzado. Espera unos minutos e intenta de nuevo.';
    } else if (error.message.includes('model')) {
      errorMessage = 'Error con el modelo de IA. El servicio puede estar temporalmente no disponible.';
    }
    
    return {
      success: false,
      error: `Error al analizar imagen: ${errorMessage}`
    };
  }
}

/**
 * Parsea la respuesta del modelo de IA
 */
function parseAIResponse(responseText) {
  const result = {
    description: '',
    objects: [],
    confidence: 50,
    category: 'unknown',
    isUnusual: false,
    unusualFeatures: '',
    recommendations: []
  };

  try {
    // Intentar parsear como JSON si viene en ese formato
    if (responseText.trim().startsWith('{') || responseText.includes('"description"')) {
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        result.description = parsed.description || parsed.DESCRIPCION || '';
        result.confidence = parsed.confidence || parsed.CONFIANZA || 50;
        result.category = (parsed.category || parsed.CATEGORIA || 'unknown').toLowerCase();
        result.isUnusual = parsed.unusual || parsed.CARACTERISTICAS_INUSUALES?.includes('SI') || false;
        result.unusualFeatures = parsed.unusualFeatures || parsed.CARACTERISTICAS_INUSUALES || '';
        
        if (parsed.objects || parsed.OBJETOS_DETECTADOS) {
          result.objects = parsed.objects || parsed.OBJETOS_DETECTADOS;
        }
        if (parsed.recommendations || parsed.RECOMENDACIONES) {
          result.recommendations = parsed.recommendations || parsed.RECOMENDACIONES;
        }
      }
    } else {
      // Parseo de texto libre
      result.description = responseText;

      // Extraer descripción
      const descMatch = responseText.match(/DESCRIPCI[ÓO]N[:\s]+(.*?)(?=\n\d|\nOBJETOS|CATEGOR[ÍI]A|$)/is);
      if (descMatch) {
        result.description = descMatch[1].trim();
      }

      // Extraer objetos
      const objectsMatch = responseText.match(/OBJETOS DETECTADOS[:\s]+(.*?)(?=\n\d|\nCATEGOR[ÍI]A|$)/is);
      if (objectsMatch) {
        const objectLines = objectsMatch[1].split('\n').filter(line => line.trim());
        result.objects = objectLines.map(line => {
          const parts = line.split('-').map(p => p.trim());
          return {
            object: parts[0] || 'Objeto no especificado',
            confidence: parseInt(parts[1]) || 50,
            description: parts[2] || ''
          };
        });
      }

      // Extraer categoría
      const catMatch = responseText.match(/CATEGOR[ÍI]A[:\s]+(\w+)/i);
      if (catMatch) {
        result.category = catMatch[1].toLowerCase();
      }

      // Extraer confianza
      const confMatch = responseText.match(/CONFIANZA[:\s]+(\d+)/i);
      if (confMatch) {
        result.confidence = parseInt(confMatch[1]);
      }

      // Detectar características inusuales
      const unusualMatch = responseText.match(/CARACTER[ÍI]STICAS INUSUALES[:\s]+(.*?)(?=\n\d|\nRECOMENDACIONES|$)/is);
      if (unusualMatch) {
        const unusualText = unusualMatch[1].trim();
        result.isUnusual = unusualText.toLowerCase().includes('si') || unusualText.toLowerCase().includes('yes');
        result.unusualFeatures = unusualText;
      }

      // Extraer recomendaciones
      const recMatch = responseText.match(/RECOMENDACIONES[:\s]+(.*?)$/is);
      if (recMatch) {
        const recLines = recMatch[1].split('\n').filter(line => line.trim());
        result.recommendations = recLines.map(line => line.replace(/^[-•*]\s*/, '').trim());
      }
    }

    // Valores por defecto si no se extrajo nada
    if (!result.description) {
      result.description = responseText.substring(0, 500);
    }
    if (result.objects.length === 0) {
      result.objects.push({
        object: 'Análisis completado',
        confidence: result.confidence,
        description: 'Ver descripción completa'
      });
    }
    if (result.recommendations.length === 0) {
      result.recommendations.push('Revisar análisis completo en la descripción');
    }

  } catch (error) {
    console.error('Error parseando respuesta:', error.message);
    // Si falla el parseo, devolver el texto completo como descripción
    result.description = responseText;
    result.objects.push({
      object: 'Análisis textual',
      confidence: 50,
      description: 'Ver descripción completa'
    });
  }

  return result;
}

/**
 * Analiza múltiples imágenes (para comparación)
 */
async function analyzeMultipleImages(filePaths, options = {}) {
  const results = [];
  
  for (const filePath of filePaths) {
    const result = await analyzeImage(filePath, options);
    results.push({
      filePath,
      ...result
    });
  }
  
  return results;
}

/**
 * Verifica si el servicio está configurado correctamente
 */
function isConfigured() {
  const token = process.env.HF_TOKEN;
  return token && token !== 'your-hf-token-here' && token.length > 10;
}

module.exports = {
  analyzeImage,
  analyzeMultipleImages,
  isConfigured
};
