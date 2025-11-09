# Sistema de Uploads - UAP Analysis

## Descripción General

Sistema completo de subida de archivos (imágenes y videos) con validación, almacenamiento y gestión.

## Características Implementadas

- ✅ Subida de imágenes (JPG, PNG, GIF, WEBP)
- ✅ Subida de videos (MP4, MOV, AVI, WEBM)
- ✅ Validación de tipos de archivo
- ✅ Límite de tamaño: 50MB
- ✅ Preview de archivos antes de subir
- ✅ Barra de progreso en tiempo real
- ✅ Almacenamiento organizado por tipo
- ✅ Gestión de archivos (listar, eliminar, descargar)
- ✅ Asociación con usuario autenticado

## Endpoints de API

### 1. Subir Archivo

**POST** `/api/uploads`

**Headers:**
```
Authorization: Bearer <token>
Content-Type: multipart/form-data
```

**Body (form-data):**
```
file: <archivo>
```

**Respuesta exitosa (201):**
```json
{
  "message": "Archivo subido exitosamente.",
  "analysis": {
    "id": "690f7a1b2c3d4e5f6g7h8i9j",
    "fileName": "avistamiento.jpg",
    "fileType": "image",
    "fileSize": 1234567,
    "uploadDate": "2025-11-08T20:30:00.000Z",
    "status": "pending"
  }
}
```

**Errores:**
- `400`: No se proporcionó archivo
- `400`: Tipo de archivo no permitido
- `400`: Archivo demasiado grande (> 50MB)
- `401`: No autenticado
- `500`: Error del servidor

### 2. Listar Uploads del Usuario

**GET** `/api/uploads`

**Headers:**
```
Authorization: Bearer <token>
```

**Query Parameters:**
- `status` (opcional): Filtrar por estado (pending, analyzing, completed, error)
- `fileType` (opcional): Filtrar por tipo (image, video)
- `limit` (opcional): Número de resultados (default: 50)
- `offset` (opcional): Paginación (default: 0)

**Respuesta:**
```json
{
  "analyses": [
    {
      "_id": "690f7a1b2c3d4e5f6g7h8i9j",
      "userId": "690f6b8a7b3ba123c95cef7d",
      "fileName": "avistamiento.jpg",
      "fileType": "image",
      "fileSize": 1234567,
      "uploadDate": "2025-11-08T20:30:00.000Z",
      "status": "pending",
      "views": 0,
      "createdAt": "2025-11-08T20:30:00.000Z"
    }
  ],
  "pagination": {
    "total": 15,
    "limit": 50,
    "offset": 0,
    "hasMore": false
  }
}
```

### 3. Obtener Detalles de un Análisis

**GET** `/api/uploads/:id`

**Headers:**
```
Authorization: Bearer <token>
```

**Respuesta:**
```json
{
  "_id": "690f7a1b2c3d4e5f6g7h8i9j",
  "userId": {
    "_id": "690f6b8a7b3ba123c95cef7d",
    "username": "demo",
    "email": "demo@uap.com",
    "firstName": "Demo",
    "lastName": "User"
  },
  "fileName": "avistamiento.jpg",
  "fileType": "image",
  "filePath": "/uploads/images/1699472400000-demo-avistamiento.jpg",
  "fileSize": 1234567,
  "uploadDate": "2025-11-08T20:30:00.000Z",
  "status": "pending",
  "views": 5,
  "exifData": {},
  "aiAnalysis": {},
  "matchResults": [],
  "createdAt": "2025-11-08T20:30:00.000Z",
  "updatedAt": "2025-11-08T20:35:00.000Z"
}
```

**Permisos:**
- Usuarios pueden ver sus propios análisis
- Admins pueden ver cualquier análisis

### 4. Eliminar Análisis

**DELETE** `/api/uploads/:id`

**Headers:**
```
Authorization: Bearer <token>
```

**Respuesta:**
```json
{
  "message": "Análisis eliminado exitosamente."
}
```

**Notas:**
- Elimina el registro de la base de datos
- Elimina el archivo físico del servidor
- Solo el dueño o un admin pueden eliminar

### 5. Descargar Archivo Original

**GET** `/api/uploads/:id/download`

**Headers:**
```
Authorization: Bearer <token>
```

**Respuesta:**
- Archivo descargable con nombre original

## Almacenamiento de Archivos

### Estructura de Directorios

```
server/
└── uploads/
    ├── images/
    │   ├── 1699472400000-user123-photo1.jpg
    │   └── 1699472500000-user456-photo2.png
    └── videos/
        ├── 1699472600000-user123-video1.mp4
        └── 1699472700000-user789-video2.mov
```

### Nomenclatura de Archivos

Formato: `{timestamp}-{userId}-{sanitizedFileName}`

Ejemplo:
- Original: `Mi Foto UAP (2025).jpg`
- Almacenado: `1699472400000-690f6b8a-Mi_Foto_UAP__2025_.jpg`

**Ventajas:**
- ✅ Nombres únicos (evita colisiones)
- ✅ Rastreables por usuario
- ✅ Ordenables por fecha
- ✅ Sanitizados (sin caracteres especiales)

## Frontend - Dashboard de Uploads

### Página: `dashboard.html` → Sección "Subir Análisis"

**Características:**

1. **Formulario de Upload**
   - Input de archivo con accept="image/*,video/*"
   - Preview automático al seleccionar
   - Información de tamaño y tipo
   - Botón de envío

2. **Preview de Archivos**
   - Imágenes: Muestra thumbnail
   - Videos: Reproductor integrado
   - Info: Nombre y tamaño formateado

3. **Barra de Progreso**
   - XMLHttpRequest con evento 'progress'
   - Actualización en tiempo real
   - Porcentaje visual

4. **Lista de Uploads**
   - Tabla con todos los archivos
   - Columnas: Archivo, Tipo, Tamaño, Estado, Fecha, Acciones
   - Botón de eliminar por fila
   - Auto-actualización después de upload

### Código de Ejemplo - Upload con JavaScript

```javascript
const fileInput = document.getElementById('fileInput');
const file = fileInput.files[0];
const token = localStorage.getItem('token');

const formData = new FormData();
formData.append('file', file);

const xhr = new XMLHttpRequest();

// Progreso
xhr.upload.addEventListener('progress', (e) => {
  if (e.lengthComputable) {
    const percent = (e.loaded / e.total) * 100;
    updateProgressBar(percent);
  }
});

// Completado
xhr.addEventListener('load', () => {
  if (xhr.status === 201) {
    const data = JSON.parse(xhr.responseText);
    console.log('Upload exitoso:', data);
  }
});

// Enviar
xhr.open('POST', 'http://localhost:3000/api/uploads');
xhr.setRequestHeader('Authorization', `Bearer ${token}`);
xhr.send(formData);
```

## Validaciones

### Backend (Multer)

**Tipos de archivo permitidos:**
```javascript
// Imágenes
'image/jpeg'
'image/jpg'
'image/png'
'image/gif'
'image/webp'

// Videos
'video/mp4'
'video/mpeg'
'video/quicktime' // .mov
'video/x-msvideo' // .avi
'video/webm'
```

**Límites:**
- Tamaño máximo: 50MB (50 * 1024 * 1024 bytes)
- Un archivo por petición

**Mensajes de error:**
```javascript
{
  "error": "Tipo de archivo no permitido: application/pdf. Solo se permiten imágenes (jpg, png, gif, webp) y videos (mp4, mov, avi, webm)."
}

{
  "error": "El archivo es demasiado grande. Tamaño máximo: 50MB."
}
```

### Frontend

**Input HTML:**
```html
<input 
  type="file" 
  accept="image/*,video/*"
  required
>
```

**Validación JavaScript:**
```javascript
if (file.size > 50 * 1024 * 1024) {
  alert('Archivo muy grande. Máximo: 50MB');
  return;
}
```

## Modelo de Datos - Analysis

```javascript
{
  userId: ObjectId,           // Referencia al usuario
  fileName: String,           // Nombre original
  fileType: String,           // 'image' o 'video'
  filePath: String,           // Ruta en servidor
  fileSize: Number,           // Tamaño en bytes
  uploadDate: Date,           // Fecha de subida
  status: String,             // pending, analyzing, completed, error
  exifData: Object,           // Datos EXIF (próximamente)
  aiAnalysis: Object,         // Análisis de IA (próximamente)
  matchResults: Array,        // Matches con UFODatabase (próximamente)
  bestMatch: Object,          // Mejor coincidencia (próximamente)
  views: Number,              // Contador de vistas
  isPublic: Boolean,          // Visibilidad
  createdAt: Date,            // Auto-generado
  updatedAt: Date             // Auto-generado
}
```

## Seguridad

### Implementado

- ✅ Autenticación requerida (middleware `auth`)
- ✅ Validación de tipos MIME
- ✅ Límite de tamaño de archivo
- ✅ Sanitización de nombres de archivo
- ✅ Permisos de acceso (dueño o admin)
- ✅ Archivos almacenados fuera de la raíz web
- ✅ No se expone la ruta real del archivo en la API

### Pendiente

- [ ] Escaneo antivirus de archivos
- [ ] Detección de imágenes duplicadas (hash)
- [ ] Watermarking de imágenes públicas
- [ ] Compresión automática de imágenes grandes
- [ ] Conversión de formatos no estándar
- [ ] Cuota de almacenamiento por usuario
- [ ] Rate limiting en uploads

## Testing

### Test Manual - Subir Imagen

**Usando Frontend:**
1. Login en `http://localhost:8000/login.html`
2. Ir a Dashboard → "Subir Análisis"
3. Clic en "Seleccionar archivo"
4. Elegir una imagen JPG o PNG
5. Ver preview automático
6. Clic en "Subir Archivo"
7. Observar barra de progreso
8. Ver mensaje de éxito
9. Verificar en la tabla de uploads

**Usando curl (no recomendado para imágenes):**
```bash
# Crear imagen de prueba
echo "fake image data" > test.jpg

# Intentar subir (fallará por no ser imagen real)
curl -X POST http://localhost:3000/api/uploads \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "file=@test.jpg"
```

### Test de Validaciones

**1. Archivo muy grande:**
```bash
# Crear archivo de 51MB
dd if=/dev/zero of=large.dat bs=1M count=51

# Intentar subir
curl -X POST http://localhost:3000/api/uploads \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "file=@large.dat"

# Resultado esperado: 400 - "El archivo es demasiado grande"
```

**2. Tipo no permitido:**
```bash
# Crear PDF
echo "fake pdf" > document.pdf

# Intentar subir
curl -X POST http://localhost:3000/api/uploads \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "file=@document.pdf"

# Resultado esperado: 400 - "Tipo de archivo no permitido"
```

**3. Sin token:**
```bash
curl -X POST http://localhost:3000/api/uploads \
  -F "file=@image.jpg"

# Resultado esperado: 401 - "No hay token"
```

## Próximas Funcionalidades

### Fase 4: Análisis con IA

- [ ] Extracción de datos EXIF
- [ ] Integración con Claude Vision API
- [ ] Detección de objetos en imágenes
- [ ] Matching con base de datos UFODatabase
- [ ] Puntuación de manipulación de imágenes
- [ ] Geocoding inverso de coordenadas

### Mejoras del Sistema de Uploads

- [ ] Drag & drop de archivos
- [ ] Upload múltiple (varios archivos a la vez)
- [ ] Compresión de imágenes antes de subir
- [ ] Generación de thumbnails
- [ ] Rotación automática según EXIF
- [ ] Editor de imágenes integrado
- [ ] Transcoding de videos a formatos estándar
- [ ] Generación de previews de videos

### Gestión Avanzada

- [ ] Álbumes/categorías de uploads
- [ ] Tags y búsqueda
- [ ] Compartir análisis con otros usuarios
- [ ] Exportar análisis en PDF
- [ ] Galería pública de análisis
- [ ] Comentarios en análisis
- [ ] Sistema de votación

## Comandos Útiles

### Iniciar Sistema

```bash
# Backend
cd server
npm run dev

# Frontend
cd frontend
python3 -m http.server 8000
```

### Ver Logs

```bash
# Logs del servidor
cd server
tail -f server.log

# Logs de uploads
tail -f nohup.out
```

### Limpiar Uploads

```bash
# Eliminar todos los archivos subidos
cd server
rm -rf uploads/images/*
rm -rf uploads/videos/*

# Mantener estructura
mkdir -p uploads/images uploads/videos
```

### Estadísticas de Almacenamiento

```bash
# Ver tamaño total de uploads
du -sh server/uploads/

# Contar archivos
find server/uploads/ -type f | wc -l

# Archivos más grandes
find server/uploads/ -type f -exec ls -lh {} \; | sort -k5 -hr | head -10
```

## Troubleshooting

### Error: "No se puede subir el archivo"

**Posibles causas:**
1. Directorio `uploads/` no existe
2. Sin permisos de escritura
3. Servidor no está corriendo
4. Token expirado

**Solución:**
```bash
# Crear directorios
mkdir -p server/uploads/images server/uploads/videos

# Dar permisos
chmod 755 server/uploads
chmod 755 server/uploads/images
chmod 755 server/uploads/videos

# Verificar servidor
curl http://localhost:3000/api/uploads
```

### Error: "Tipo de archivo no permitido"

**Causa:**
El tipo MIME del archivo no está en la lista permitida.

**Solución:**
Verificar que el archivo sea realmente una imagen o video. Los tipos permitidos están en `server/config/multer.js`.

### Error: "Archivo demasiado grande"

**Causa:**
El archivo excede el límite de 50MB.

**Solución:**
1. Comprimir la imagen antes de subir
2. Aumentar el límite en `server/config/multer.js`:
```javascript
limits: {
  fileSize: 100 * 1024 * 1024, // 100MB
}
```

---

**Fecha:** 8 de noviembre de 2025  
**Versión:** 1.0  
**Estado:** ✅ Completado - Fase 3 del Roadmap
