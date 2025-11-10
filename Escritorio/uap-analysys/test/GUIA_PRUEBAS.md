# 🧪 GUÍA DE PRUEBAS - Sistema UAP Analysis

## 📋 Objetivo
Verificar que todas las 9 capas de análisis funcionan correctamente con imágenes de prueba que contienen metadatos GPS y timestamp.

---

## 🖼️ Imágenes de Prueba Creadas

Se han generado 3 imágenes de prueba con metadatos EXIF completos:

### 1. Nueva York (test_uap_nyc.jpg)
- **Ubicación:** `/tmp/test_uap_nyc.jpg`
- **GPS:** 40.7128°N, 74.0060°W
- **Descripción:** Objeto luminoso en cielo nocturno
- **Timestamp:** 2025-11-09 19:32:13
- **Características:** Disco brillante con halo, estrellas de fondo

### 2. Madrid (test_uap_madrid.jpg)
- **Ubicación:** `/tmp/test_uap_madrid.jpg`
- **GPS:** 40.4168°N, 3.7038°W
- **Descripción:** Objeto circular brillante
- **Timestamp:** 2025-11-09 19:32:13
- **Características:** Similar a NYC, para comparación europea

### 3. Santiago de Chile (test_uap_chile.jpg)
- **Ubicación:** `/tmp/test_uap_chile.jpg`
- **GPS:** 33.4489°S, 70.6693°W
- **Descripción:** Formación de luces
- **Timestamp:** 2025-11-09 19:32:13
- **Características:** Hemisferio sur, para probar diferentes condiciones celestes

---

## 📝 Pasos para Realizar las Pruebas

### Paso 1: Acceder a la Interfaz Web
1. Abrir navegador en: http://localhost:3000
2. Si es la primera vez, crear usuario (o usar uno existente)
3. Hacer login con las credenciales

### Paso 2: Subir Imagen de Prueba
1. Ir a la sección de "Análisis" o "Subir Imagen"
2. Seleccionar una de las imágenes de prueba (ej: `/tmp/test_uap_nyc.jpg`)
3. Agregar título: "Prueba - Objeto luminoso NYC"
4. Descripción opcional: "Imagen de prueba para validar sistema"
5. Click en "Analizar" o "Subir"

### Paso 3: Verificar las 9 Capas de Análisis

#### ✅ Capa 1: Análisis EXIF
**Qué verificar:**
- ☑️ GPS extraído correctamente (40.7128, -74.006)
- ☑️ Timestamp correcto (2025-11-09)
- ☑️ Cámara: TestCamera, UAP Test Model
- ☑️ Configuración: ISO 800, f/2.8, 1/60s

**Esperado:**
```json
{
  "hasGPS": true,
  "location": {
    "latitude": 40.7128,
    "longitude": -74.006
  },
  "timestamp": "2025-11-09T19:32:13",
  "camera": "TestCamera",
  "model": "UAP Test Model"
}
```

#### ✅ Capa 2: Análisis Visual AI (OpenAI GPT-4 Vision)
**Qué verificar:**
- ☑️ Descripción del objeto (disco brillante, halo, etc.)
- ☑️ Categoría sugerida (unknown, celestial, atmospheric, etc.)
- ☑️ Nivel de confianza del análisis
- ☑️ Características detectadas (forma, color, brillo)

**Esperado:**
```json
{
  "category": "unknown" | "atmospheric" | "celestial",
  "confidence": 0.6 - 0.9,
  "description": "Objeto circular brillante...",
  "features": {
    "shape": "circular",
    "color": "bright_white/yellow",
    "movement": "static"
  }
}
```

#### ✅ Capa 3: Análisis Forense
**Qué verificar:**
- ☑️ Detección de manipulación (debería ser 0% - imagen limpia)
- ☑️ Análisis de compresión
- ☑️ Análisis de ruido y artefactos
- ☑️ Score de autenticidad (debería ser alto >80%)

**Esperado:**
```json
{
  "manipulationLikelihood": "low",
  "manipulationScore": 0.0 - 0.2,
  "authenticityScore": 0.8 - 1.0,
  "compressionAnalysis": {
    "quality": "high",
    "artifacts": "minimal"
  }
}
```

#### ✅ Capa 4: Comparación Científica
**Qué verificar:**
- ☑️ Búsqueda en UFODatabase (1,064+ objetos)
- ☑️ Coincidencias con objetos conocidos
- ☑️ Scoring de similitud
- ☑️ Top matches (si hay)

**Esperado:**
```json
{
  "totalMatches": 3-10,
  "bestMatch": {
    "name": "Venus" | "Jupiter" | "Drone" | "Aircraft",
    "similarity": 0.3 - 0.7,
    "category": "celestial" | "drone" | "aircraft"
  }
}
```

#### ✅ Capa 5: Mejora con Training
**Qué verificar:**
- ☑️ Sistema busca en casos de training previos
- ☑️ Ajuste de categoría si hay coincidencias
- ☑️ Aprendizaje de patrones

**Esperado:**
```json
{
  "trainingMatchFound": true | false,
  "categoryAdjusted": true | false,
  "confidence": 0.7 - 0.95
}
```

#### ✅ Capa 6: Validación Externa (APIs)

**6.1. SunCalc (Objetos Celestes)**
**Qué verificar:**
- ☑️ Posición del sol (azimuth, altitude)
- ☑️ Posición de la luna
- ☑️ Planetas visibles (Venus, Jupiter, Mars, Saturn)
- ☑️ Hora del día (day/night/twilight)

**Esperado:**
```json
{
  "celestialBodies": {
    "sun": { "altitude": -20, "visible": false },
    "moon": { "altitude": 30, "phase": 0.4, "visible": true },
    "planets": {
      "venus": { "visible": true, "magnitude": -4.2 },
      "jupiter": { "visible": true, "magnitude": -2.5 }
    }
  },
  "timeContext": "night"
}
```

**6.2. OpenSky Network (Tráfico Aéreo)**
**Qué verificar:**
- ☑️ Aeronaves en el área (radio 50km)
- ☑️ Altitud, velocidad, callsign
- ☑️ Distancia al punto de observación

**Esperado:**
```json
{
  "totalAircraft": 5-20,
  "nearbyAircraft": [
    {
      "callsign": "UAL123",
      "altitude": 10000,
      "velocity": 450,
      "distance": 15.2
    }
  ]
}
```

**6.3. N2YO (Satélites) - Si API key configurada**
**Qué verificar:**
- ☑️ Satélites visibles en el área
- ☑️ ISS, Starlink, etc.
- ☑️ Magnitud y visibilidad

**Esperado:**
```json
{
  "satellitesVisible": [
    {
      "name": "ISS",
      "magnitude": -3.5,
      "visible": true
    }
  ]
}
```

**6.4. StratoCat (Globos Estratosféricos)**
**Qué verificar:**
- ☑️ Globos lanzados en la región
- ☑️ Fecha de lanzamiento
- ☑️ Estado (activo/descendiendo)

#### ✅ Capa 7: Análisis Meteorológico (NUEVO)

**Qué verificar:**
- ☑️ Temperatura actual
- ☑️ Condiciones climáticas (clear, clouds, rain, etc.)
- ☑️ Cobertura de nubes (%)
- ☑️ Visibilidad (km)
- ☑️ Precipitación
- ☑️ **Análisis inteligente:**
  - visibility_quality: excellent/good/moderate/poor
  - likelihood_of_optical_phenomena: low/medium/high
  - weather_explanation_probability: low/high/very_high
  - relevant_conditions: [array]
  - warnings: [array]

**Esperado (si API key configurada):**
```json
{
  "weatherData": {
    "temperature": { "current": 15, "unit": "C" },
    "conditions": { "main": "Clear", "description": "clear sky" },
    "clouds": { "coverage": 10 },
    "visibility": 10000,
    "analysis": {
      "visibility_quality": "excellent",
      "likelihood_of_optical_phenomena": "low",
      "weather_explanation_probability": "low",
      "relevant_conditions": ["clear_sky", "good_visibility"],
      "warnings": []
    }
  }
}
```

**Si NO hay API key:**
```json
{
  "weatherData": null,
  "weatherNote": "OpenWeatherMap API key not configured"
}
```

#### ✅ Capa 8: Comparación Atmosférica (NUEVO)

**Qué verificar:**
- ☑️ Búsqueda en 23 fenómenos atmosféricos
- ☑️ Mejor coincidencia (bestMatch)
- ☑️ Score de similitud (0-100)
- ☑️ Top 5 coincidencias
- ☑️ **Ajuste automático de categoría** si score > 80

**Esperado:**
```json
{
  "atmosphericComparison": {
    "totalMatches": 5-15,
    "bestMatch": {
      "phenomenon": {
        "name": "Lens Flare" | "Reflejo en Ventana" | "Meteoro",
        "category": "reflection" | "meteor" | "optical",
        "rarity": "común" | "poco común"
      },
      "score": 45-85,
      "confidence": "medium" | "high",
      "explanation": "Coincide por forma circular brillante..."
    },
    "topMatches": [5 mejores],
    "hasStrongMatch": false | true
  }
}
```

**Si score > 80:**
- ☑️ Categoría ajustada automáticamente a "natural"
- ☑️ Confidence aumentada
- ☑️ Recomendación agregada

#### ✅ Capa 9: Cálculo de Confianza Ponderada

**Qué verificar:**
- ☑️ Confianza final (0.0 - 1.0)
- ☑️ Ponderación de todas las capas
- ☑️ Recomendaciones finales

**Esperado:**
```json
{
  "confidence": 0.65 - 0.85,
  "confidenceBreakdown": {
    "visualAI": 0.7,
    "forensic": 0.9,
    "scientific": 0.6,
    "external": 0.8,
    "weather": 0.7,
    "atmospheric": 0.6
  },
  "recommendations": [
    "Correlación con Venus visible en el área",
    "Condiciones atmosféricas favorables para fenómenos ópticos",
    "Posible reflejo o lens flare"
  ]
}
```

---

## 🎯 Criterios de Éxito

### ✅ Prueba Exitosa
- [ ] Todas las 9 capas ejecutan sin errores
- [ ] EXIF GPS y timestamp extraídos correctamente
- [ ] Análisis visual retorna descripción coherente
- [ ] Comparación científica encuentra objetos similares
- [ ] Validación externa consulta APIs correctamente
- [ ] **weatherData presente en respuesta** (si API key configurada)
- [ ] **atmosphericComparison presente con matches**
- [ ] Confianza final calculada correctamente
- [ ] Recomendaciones generadas con contexto

### ⚠️ Limitaciones Esperadas (Sin API Keys)
- `weatherData: null` - Normal si no hay OPENWEATHER_API_KEY
- `satellitesVisible: []` - Normal si no hay N2YO_API_KEY
- Sistema sigue funcionando con fallbacks

---

## 📊 Resultados Esperados por Imagen

### Test NYC (Nueva York)
- **Objetos celestes:** Luna visible, posiblemente Venus/Jupiter
- **Tráfico aéreo:** Alto (aeropuerto JFK/LaGuardia cercano)
- **Fenómenos atmosféricos:** Baja probabilidad (cielo nocturno claro)
- **Categoría probable:** celestial, atmospheric, unknown

### Test Madrid
- **Similar a NYC** pero con diferente tráfico aéreo europeo
- **Aeropuerto Barajas** cercano

### Test Chile (Hemisferio Sur)
- **Objetos celestes diferentes** (Cruz del Sur visible)
- **Tráfico aéreo:** Moderado
- **Condiciones meteorológicas:** Diferentes a hemisferio norte

---

## 🐛 Debugging

### Si algo falla:

**Ver logs del servidor:**
```bash
tail -100 /tmp/uap-server.log
```

**Verificar servidor corriendo:**
```bash
ps aux | grep "node.*app.js"
```

**Verificar MongoDB conectado:**
```bash
tail -20 /tmp/uap-server.log | grep MongoDB
```

**Ver análisis en consola del navegador:**
```
F12 → Console → Ver errores
```

---

## 📝 Notas Finales

1. **Tiempo de análisis:** 30-60 segundos por imagen (depende de OpenAI API)
2. **weatherData y atmosphericComparison:** Solo disponibles si la imagen tiene GPS
3. **Scoring atmosférico:** Threshold de 80 puntos para ajuste automático
4. **Training:** Sistema aprende con cada conversión a training

**¡El sistema está listo para pruebas!** 🚀
