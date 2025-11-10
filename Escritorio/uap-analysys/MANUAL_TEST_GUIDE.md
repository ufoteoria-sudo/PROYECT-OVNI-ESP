# 🧪 Guía de Prueba Manual del Sistema Completo

## ✅ Estado del Sistema

- **Backend**: ✓ Corriendo en puerto 3000
- **Frontend**: ✓ Corriendo en puerto 8888  
- **Base de datos**: ✓ MongoDB Atlas conectado
- **Fix JavaScript**: ✓ Aplicado (funciones reorganizadas)

---

## 📋 Flujo de Prueba Integral

### 1️⃣ Acceder al Dashboard

```
URL: http://localhost:8888/dashboard.html
```

Inicia sesión con tu cuenta de administrador.

---

### 2️⃣ Subir y Analizar Imagen

1. En el dashboard, ve a la sección de **"Nuevo Análisis"**
2. Selecciona una imagen de prueba:
   - Puedes usar cualquier imagen del directorio `server/uploads/images/`
   - O sube una nueva imagen
3. Haz clic en **"Iniciar Análisis"**

---

### 3️⃣ Esperar Resultados del Análisis

El sistema ejecutará automáticamente:

- ✅ **Análisis Visual**: Patrones, formas, colores, hashing perceptual
- ✅ **Análisis Forense**: 
  - 🔬 Consistencia de iluminación (sombras)
  - 📊 Inconsistencias de ruido (compresión)
  - 🔍 Detección de clonación (copy-paste)
  - 🖼️ Consistencia de bordes (halos artificiales)
- ✅ **Análisis con IA**: Clasificación y detección de objetos
- ✅ **APIs Externas**: OpenSky, SatelliteCalc, SunCalc, N2YO

Tiempo estimado: **30-60 segundos**

---

### 4️⃣ Revisar Resultados del Análisis Forense

Una vez completado, abre los detalles del análisis y verifica:

#### Sección de Análisis Forense

Debería mostrar:

1. **Puntuación de Manipulación**: 0-100
2. **Veredicto**: 
   - `LIKELY_AUTHENTIC` (0-20)
   - `POSSIBLY_AUTHENTIC` (20-40)
   - `INCONCLUSIVE` (40-60)
   - `POSSIBLY_MANIPULATED` (60-80)
   - `LIKELY_MANIPULATED` (80-100)

3. **4 Tarjetas de Técnicas**:
   - 💡 **Iluminación**: Consistencia de sombras en 9 regiones
   - 📉 **Ruido**: Diferencias de compresión en 16 regiones
   - 🔄 **Clonación**: Bloques duplicados de 32x32 píxeles
   - 🖼️ **Bordes**: Halos y artefactos artificiales

---

### 5️⃣ Convertir a Training (PRUEBA PRINCIPAL)

**Este es el botón que acabamos de arreglar:**

1. En el modal de resultados del análisis, verifica que aparezca el botón:
   ```
   🗄️ Agregar a Training
   ```

2. **Condiciones para que aparezca**:
   - ✅ Eres administrador
   - ✅ El análisis está completado (`status: 'completed'`)
   - ✅ No se ha agregado a training previamente

3. Haz clic en **"Agregar a Training"**

4. Debería aparecer un **modal de confirmación** con:
   - Campo de selección: **Categoría Verificada**
   - Campo de texto: **Tipo/Modelo** (opcional)
   - Área de texto: **Notas** (opcional)
   - Alerta informativa: _"Incluirá datos forenses automáticamente"_

5. Selecciona una categoría (ej: `aircraft_commercial`)

6. Haz clic en **"Agregar"**

---

### 6️⃣ Verificar Conversión Exitosa

Deberías ver:

1. **Mensaje de éxito**: 
   ```
   ✅ Agregado a training: aircraft_commercial
   ```

2. El botón **"Agregar a Training"** desaparece (ya no se puede agregar dos veces)

3. La lista de análisis se recarga automáticamente

---

### 7️⃣ Verificar Datos en Training

Ve a la sección de **Training** en el dashboard:

1. Busca la imagen recién agregada
2. Abre los detalles
3. Verifica que contenga:
   - ✅ **Categoría**: La que seleccionaste
   - ✅ **Visual Features**: Datos del análisis visual
   - ✅ **Technical Data**: Datos EXIF
   - ✅ **Datos Forenses** en el campo `notes`:
     ```json
     {
       "authenticityScore": 85.5,
       "verdict": "LIKELY_AUTHENTIC",
       "lightingScore": 12.3,
       "noiseScore": 8.7,
       "cloningScore": 5.1,
       "edgeScore": 3.2
     }
     ```

---

## 🎯 Resultado Esperado

Si todos los pasos funcionan correctamente:

- ✅ El botón "Agregar a Training" responde al hacer clic
- ✅ El modal se abre correctamente
- ✅ La conversión se realiza sin errores
- ✅ Los datos forenses se incluyen automáticamente en la imagen de entrenamiento
- ✅ El sistema puede usar estos datos científicos para mejorar futuros análisis

---

## 🐛 Si algo falla

### Error: Botón no responde
```bash
# Verificar consola del navegador (F12)
# Debe mostrar logs de debug:
# "Usuario actual: {role: 'admin'}"
# "Es admin: true"
# "Análisis completado: true"
```

### Error: "Credenciales inválidas"
El usuario ya tiene sesión en el navegador, no debería ocurrir.

### Error: "Endpoint no encontrado"
```bash
# Verificar backend
ps aux | grep "node.*app.js"

# Reiniciar si es necesario
cd /home/roberto/Escritorio/uap-analysys/server
npm start
```

---

## 📊 Verificación Técnica (Opcional)

### Endpoint de Conversión

```bash
# Obtener ID de un análisis completado
ANALYSIS_ID="<id_del_análisis>"
TOKEN="<tu_token_de_sesión>"

# Convertir a training
curl -X POST "http://localhost:3000/api/training/from-analysis/$ANALYSIS_ID" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "verifiedCategory": "aircraft_commercial",
    "verifiedType": "Test",
    "additionalNotes": "Prueba manual"
  }'
```

### Verificar Training en DB

```bash
# Ver últimas imágenes de training
curl -s "http://localhost:3000/api/training?limit=5" \
  -H "Authorization: Bearer $TOKEN" | jq '.data[] | {category, verified, notes}'
```

---

## ✨ Características Implementadas

1. **Análisis Forense Completo**: 4 técnicas de detección de manipulación
2. **Integración Automática**: Los datos forenses se incluyen automáticamente
3. **UI Intuitiva**: Botón visible solo para admins en análisis completados
4. **Validaciones**: No permite duplicados, requiere autenticación
5. **Trazabilidad**: El análisis original queda marcado como `usedForTraining: true`

---

**¡El sistema está listo para pruebas!** 🚀
