# 🔄 Sincronización Biblioteca Visual ↔️ Sistema de Entrenamiento

## 📋 Resumen

El sistema sincroniza **automáticamente y bidireccionalmente** todos los datos entre:
- **Biblioteca Visual** (UFODatabase): Colección completa con toda la información
- **Sistema de Entrenamiento** (TrainingImage): Datos optimizados para algoritmos de IA

## 🎯 Campos Sincronizados

### **Información Básica**
| Campo Biblioteca | Campo Training | Descripción |
|-----------------|----------------|-------------|
| `name` | `type` | Nombre del objeto |
| `typology` | `model` | Subtipo/variante específica |
| `description` | `description` | Descripción detallada |
| `category` | `category` | Categoría (mapeada) |

### **Palabras Clave y Etiquetas**
| Campo Biblioteca | Campo Training | Descripción |
|-----------------|----------------|-------------|
| `keywords` | `keywords` | Palabras clave para búsqueda textual |
| `visualPatterns` | `tags` | Patrones visuales descriptivos |

### **Características Visuales**
| Campo Biblioteca | Campo Training | Mapeo |
|-----------------|----------------|-------|
| `characteristics.shape` | `visualFeatures.shape` | Forma del objeto |
| `characteristics.size` | `visualFeatures.size` | Tamaño aproximado |
| `characteristics.speed` | `visualFeatures.commonSpeed` | Velocidad típica |
| `characteristics.luminosity` | `visualFeatures.lightPattern` | Patrón de luminosidad |
| `characteristics.colors` | `visualFeatures.colors` | Array de colores |
| `characteristics.behavior` | `visualFeatures.movementPattern` | Patrón de movimiento |

### **Imágenes**
| Campo Biblioteca | Campo Training | Descripción |
|-----------------|----------------|-------------|
| `manualImages[0].url` | `imageUrl` | Imagen principal completa |
| `manualImages[0].thumbnailUrl` | `thumbnailUrl` | Miniatura optimizada |

### **Metadatos**
| Campo Biblioteca | Campo Training | Descripción |
|-----------------|----------------|-------------|
| `_id` | `libraryEntryId` | ID de entrada en biblioteca |
| - | `linkedTrainingId` | ID de training vinculado |
| `uploadedBy` | `uploadedBy` | Usuario que subió |
| - | `verified: true` | Automáticamente verificado |
| - | `source: 'manual_upload'` | Origen manual |

## 🔄 Flujo de Sincronización

### **1. Creación de Objeto Nuevo** (`POST /api/library/manual`)

```javascript
// Usuario crea objeto en biblioteca con:
{
  name: "Esfera Metálica",
  category: "Aerial",
  typology: "Objeto volador esférico",
  description: "Objeto esférico de apariencia metálica...",
  keywords: ["esfera", "metálica", "brillante"],
  visualPatterns: ["reflectante", "rotatorio"],
  characteristics: {
    shape: "Esférica",
    size: "Mediano (3-5m)",
    speed: "Rápido (500+ km/h)",
    luminosity: "Brillante",
    colors: "Plateado, blanco",
    behavior: "Movimiento errático"
  },
  images: [archivo1.jpg, archivo2.jpg]
}

// ✅ Sistema automáticamente:
// 1. Guarda en UFODatabase (biblioteca)
// 2. Procesa imágenes (original + thumbnail)
// 3. CREA TrainingImage sincronizado con:
//    - Todos los campos mapeados
//    - visualFeatures construido desde characteristics
//    - keywords + visualPatterns + palabras de descripción
//    - Imagen principal y thumbnail
//    - linkedTrainingId ↔️ libraryEntryId (vínculo bidireccional)
```

### **2. Edición de Objeto** (`PUT /api/library/edit/:id`)

```javascript
// Usuario edita objeto desde biblioteca visual:
{
  name: "Esfera Metálica Actualizada",
  characteristics: {
    size: "Grande (8-10m)",  // CAMBIO
    colors: "Plateado, azul" // CAMBIO
  }
}

// ✅ Sistema automáticamente:
// 1. Actualiza UFODatabase
// 2. BUSCA TrainingImage vinculado (si existe)
// 3. ACTUALIZA TrainingImage con:
//    - Nuevos valores de todos los campos
//    - visualFeatures.size = "Grande (8-10m)"
//    - visualFeatures.colors = ["Plateado", "azul"]
// 4. Si NO existe training, lo CREA con todos los datos
```

### **3. Agregar/Eliminar Imágenes**

```javascript
// Usuario agrega nuevas imágenes desde modal de edición:
// ✅ Sistema:
// 1. Guarda nuevas imágenes en /uploads/library/
// 2. ACTUALIZA TrainingImage.imageUrl con primera imagen
// 3. ACTUALIZA TrainingImage.thumbnailUrl

// Usuario elimina imagen:
// ✅ Sistema:
// 1. Elimina archivos físicos
// 2. Actualiza UFODatabase.manualImages
// 3. Si quedan imágenes: ACTUALIZA training con nueva imagen principal
// 4. Si NO quedan imágenes: ELIMINA training vinculado
```

### **4. Eliminación de Objeto** (`DELETE /api/library/manual/:id`)

```javascript
// Usuario elimina objeto:
// ✅ Sistema automáticamente:
// 1. ELIMINA TrainingImage vinculado
// 2. Elimina archivos físicos de imágenes
// 3. Elimina UFODatabase entry
```

## 🗺️ Mapeo de Categorías

```javascript
// Biblioteca → Training
{
  'Atmospheric': 'atmospheric',
  'Celestial': 'celestial',
  'Aerial': 'aircraft_commercial',
  'Technological': 'satellite',
  'Unknown': 'unknown'
}
```

## 📊 Ejemplo Completo de Sincronización

### **Entrada en Biblioteca Visual:**
```json
{
  "_id": "507f1f77bcf86cd799439011",
  "name": "Boeing 737-800",
  "category": "Aerial",
  "typology": "Avión comercial de fuselaje estrecho",
  "description": "Avión bimotor de corto y medio alcance...",
  "keywords": ["boeing", "737", "comercial", "bimotor"],
  "visualPatterns": ["alas bajas", "dos motores", "fuselaje cilíndrico"],
  "characteristics": {
    "shape": "Cilíndrica con alas",
    "size": "Grande (40m longitud)",
    "speed": "Subsónico (850 km/h)",
    "luminosity": "Luces de navegación",
    "colors": "Blanco, azul, rojo",
    "behavior": "Trayectoria recta y constante"
  },
  "manualImages": [
    {
      "url": "/uploads/library/boeing737-1234567890.jpg",
      "thumbnailUrl": "/uploads/library/thumb-boeing737-1234567890.jpg",
      "description": "Vista lateral"
    }
  ],
  "linkedTrainingId": "507f1f77bcf86cd799439012"
}
```

### **Entrada Sincronizada en Training:**
```json
{
  "_id": "507f1f77bcf86cd799439012",
  "category": "aircraft_commercial",
  "type": "Boeing 737-800",
  "model": "Avión comercial de fuselaje estrecho",
  "description": "Avión bimotor de corto y medio alcance...",
  "keywords": [
    "boeing", "737", "comercial", "bimotor",
    "alas", "motores", "fuselaje", "cilíndrico",
    "avión", "bimotor", "corto", "medio", "alcance"
  ],
  "tags": ["alas bajas", "dos motores", "fuselaje cilíndrico"],
  "visualFeatures": {
    "shape": "Cilíndrica con alas",
    "size": "Grande (40m longitud)",
    "commonSpeed": "Subsónico (850 km/h)",
    "lightPattern": "Luces de navegación",
    "colors": ["Blanco", "azul", "rojo"],
    "movementPattern": "Trayectoria recta y constante"
  },
  "imageUrl": "/uploads/library/boeing737-1234567890.jpg",
  "thumbnailUrl": "/uploads/library/thumb-boeing737-1234567890.jpg",
  "uploadedBy": "507f1f77bcf86cd799439013",
  "verified": true,
  "verifiedBy": "507f1f77bcf86cd799439013",
  "verifiedAt": "2025-11-09T22:00:00.000Z",
  "source": "manual_upload",
  "promotedToLibrary": false,
  "libraryEntryId": "507f1f77bcf86cd799439011"
}
```

## 🎯 Ventajas del Sistema

### **Para Usuarios:**
- ✅ **Edición única**: Edita una vez en biblioteca visual
- ✅ **Sincronización automática**: Training se actualiza solo
- ✅ **Sin duplicados**: Datos consistentes en ambos sistemas
- ✅ **Interface única**: Todo desde biblioteca visual

### **Para Algoritmos de IA:**
- ✅ **Datos estructurados**: `visualFeatures` optimizado para ML
- ✅ **Keywords enriquecidos**: Combina keywords + patterns + descripción
- ✅ **Imágenes optimizadas**: Thumbnails para procesamiento rápido
- ✅ **Metadatos completos**: Toda la información necesaria

### **Para el Sistema:**
- ✅ **Bidireccional**: Vínculo mediante `linkedTrainingId` ↔️ `libraryEntryId`
- ✅ **Robusto**: Maneja fallos de sincronización sin afectar operación principal
- ✅ **Logging detallado**: Mensajes con emojis para debugging
- ✅ **Actualización inteligente**: Solo sincroniza cuando hay cambios relevantes

## 🔍 Logs de Sincronización

```bash
# Creación exitosa:
✅ Objeto sincronizado completamente con training: 507f1f77bcf86cd799439012
   - Nombre: Boeing 737-800
   - Categoría: aircraft_commercial
   - Keywords: 15
   - Visual patterns: 3
   - Visual features: 6 campos

# Actualización exitosa:
✅ Training actualizado completamente: 507f1f77bcf86cd799439012

# Eliminación:
✅ Training vinculado eliminado: 507f1f77bcf86cd799439012

# Error (no crítico):
❌ Error sincronizando con training: [detalle del error]
```

## 🚀 Uso en Producción

1. **Crear objeto nuevo**: 
   - Dashboard → Gestión de Biblioteca → Agregar Objeto Manual
   - O: Biblioteca Visual → Click en tarjeta → Editar → Llenar formulario

2. **Editar objeto existente**:
   - Biblioteca Visual → Click en "Editar" en tarjeta
   - Modificar campos necesarios
   - Agregar/eliminar imágenes
   - Guardar → **Training se actualiza automáticamente**

3. **Verificar sincronización**:
   - Dashboard → Gestión de Training
   - Buscar por nombre del objeto
   - Verificar que todos los campos estén sincronizados

## 📝 Notas Técnicas

- **Transaccional**: Si falla la sincronización, NO falla la operación principal
- **Idempotente**: Múltiples llamadas producen el mismo resultado
- **Validado**: Todos los campos pasan validación de Mongoose
- **Optimizado**: Solo actualiza training si hay imágenes o ya existe vínculo
- **Extensible**: Fácil agregar nuevos campos de sincronización

---

**Última actualización**: 10 de noviembre de 2025
**Versión**: 2.0 - Sincronización completa con características visuales
