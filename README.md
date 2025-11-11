# UAP Analysis System

Sistema integral de análisis de fenómenos aéreos no identificados (UAP) con arquitectura cliente-servidor, que combina análisis visual avanzado, validación científica y correlación con bases de datos de objetos conocidos.

## 🚀 Características Principales

### Sistema de Análisis (9 Capas)
- ✅ **Capa 1: Análisis EXIF** - Extracción de metadatos (GPS, timestamp, cámara)
- ✅ **Capa 2: Análisis Visual AI** - Detección de objetos con OpenAI GPT-4 Vision (opcional)
- ✅ **Capa 3: Análisis Forense** - Detección de manipulación y autenticidad
- ✅ **Capa 4: Comparación Científica** - Matching con 1,064 objetos conocidos (UFODatabase)
- ✅ **Capa 5: Training Enhancement** - Mejora con aprendizaje de casos anteriores
- ✅ **Capa 6: Validación Externa** - APIs de SunCalc, OpenSky, N2YO, StratoCat
- ✅ **Capa 7: Análisis Meteorológico** - OpenWeatherMap (opcional)
- ✅ **Capa 8: Comparación Atmosférica** - 23 fenómenos atmosféricos catalogados
- ✅ **Capa 9: Confianza Ponderada** - Fusión inteligente de todas las capas

### Sistema de Autenticación
- ✅ Autenticación JWT completa
- ✅ Control de acceso basado en roles (user/admin)
- ✅ Validación de emails con índice único
- ✅ Hash de contraseñas con bcrypt
- ✅ Protección de rutas con middleware

### Interfaz y APIs
- ✅ Interfaz responsive con Bootstrap 5
- ✅ API REST con Express y MongoDB
- ✅ Búsqueda en tiempo real
- ✅ Prevención de XSS

## 📊 Estado del Sistema

**Última validación**: 9 de noviembre de 2025  
**Resultado**: ✅ **8/9 capas operativas** (89% funcionalidad)  
**Tiempo de análisis**: 4-5 segundos  
**Base de datos**: 1,064 objetos conocidos

Ver resultados detallados en: [`test/RESULTADO_PRUEBAS.md`](test/RESULTADO_PRUEBAS.md)

## 📋 Requisitos previos

- Node.js (v14 o superior)
- MongoDB (local o Atlas)
- npm o yarn
- Python 3 (para scripts de prueba)

## 🔧 Instalación

### 1. Clonar el repositorio
```bash
git clone https://github.com/ufoteoria-sudo/PROYECT-OVNI-ESP.git
cd uap-analysys
```

### 2. Instalar dependencias del backend
```bash
cd server
npm install
```

### 3. Configurar variables de entorno
Editar el archivo `server/.env`:
```env
# Base de datos
MONGO_URI=mongodb://localhost:27017/uap-db

# Autenticación
JWT_SECRET=uap-secret-key-super-secure-2025-change-in-production

# Servidor
PORT=3000

# APIs Opcionales (para funcionalidad completa)
OPENAI_API_KEY=                    # Para análisis AI avanzado (Capa 2)
OPENWEATHERMAP_API_KEY=            # Para datos meteorológicos (Capas 7 y 8)
N2YO_API_KEY=                      # Para tracking de satélites (Capa 6)
```

Para MongoDB Atlas:
```env
MONGO_URI=mongodb+srv://usuario:password@cluster0.mongodb.net/uap-db?retryWrites=true&w=majority
```

⚠️ **IMPORTANTE**: Cambiar `JWT_SECRET` en producción a un valor aleatorio y seguro.

### 4. Iniciar MongoDB (si es local)
```bash
# Linux/Mac
sudo systemctl start mongod

# O usando mongod directamente
mongod --dbpath /path/to/data
```

## 🏃 Ejecutar el proyecto

### Crear usuario administrador (primera vez)
```bash
cd server
node scripts/createAdmin.js
```

Credenciales por defecto:
- Email: `admin@uap.com`
- Password: `Admin123!`

### Backend (modo desarrollo)
```bash
cd server
npm run dev
```

El servidor estará disponible en `http://localhost:3000`

### Backend (modo producción)
```bash
cd server
npm start
```

### Frontend
El frontend se sirve automáticamente desde Express en `http://localhost:3000`

Opción alternativa - Servidor HTTP simple:
```bash
# Desde la raíz del proyecto
python3 -m http.server 8000 --directory frontend
# Luego abrir http://localhost:8000
```

## 🧪 Ejecutar Pruebas

### Pruebas del sistema de análisis completo
```bash
cd test
python3 test_api_complete.py
```

Este script valida las 9 capas de análisis con imágenes de prueba generadas automáticamente.

### Tests de autenticación
```bash
cd server
./scripts/testAuth.sh
```

Verifica:
- ✅ Registro de usuarios
- ✅ Login y generación de JWT
- ✅ Protección de rutas
- ✅ Control de roles (user/admin)

## 📡 API Endpoints

### Autenticación (públicas)
| Método | Endpoint | Descripción |
|--------|----------|-------------|
| POST | `/api/auth/register` | Registrar nuevo usuario |
| POST | `/api/auth/login` | Iniciar sesión (obtener JWT) |

### Análisis de Imágenes (protegidas)
| Método | Endpoint | Descripción |
|--------|----------|-------------|
| POST | `/api/uploads` | Subir imagen para análisis |
| POST | `/api/analyze/:id` | Iniciar análisis completo (9 capas) |
| GET | `/api/analyze/:id/status` | Obtener estado y resultados del análisis |
| GET | `/api/analyze/config` | Verificar configuración del sistema |

### Usuarios (protegidas)
| Método | Endpoint | Descripción | Requiere |
|--------|----------|-------------|----------|
| GET | `/api/users` | Listar todos los usuarios | Admin |
| GET | `/api/users/:id` | Obtener usuario por ID | Admin o mismo usuario |
| POST | `/api/users` | Crear nuevo usuario | Admin |
| PUT | `/api/users/:id` | Actualizar usuario | Admin o mismo usuario |
| DELETE | `/api/users/:id` | Eliminar usuario | Admin |

### Ejemplo de flujo completo de análisis

#### 1. Login
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "admin@uap.com", "password": "Admin123!"}'
```

#### 2. Subir imagen
```bash
TOKEN="tu_token_jwt"
curl -X POST http://localhost:3000/api/uploads \
  -H "Authorization: Bearer $TOKEN" \
  -F "file=@/path/to/image.jpg"
```

Respuesta:
```json
{
  "message": "Imagen subida exitosamente.",
  "analysis": {
    "id": "6910e3c5549acfaa2b89f808",
    "fileName": "image.jpg",
    "status": "pending"
  }
}
```

#### 3. Iniciar análisis
```bash
ANALYSIS_ID="6910e3c5549acfaa2b89f808"
curl -X POST http://localhost:3000/api/analyze/$ANALYSIS_ID \
  -H "Authorization: Bearer $TOKEN"
```

#### 4. Consultar resultados (polling)
```bash
curl -X GET http://localhost:3000/api/analyze/$ANALYSIS_ID/status \
  -H "Authorization: Bearer $TOKEN"
```

Respuesta (cuando `status == "completed"`):
```json
{
  "status": "completed",
  "fileName": "image.jpg",
  "hasExifData": true,
  "hasAiAnalysis": true,
  "analysisData": {
    "exifData": {...},
    "aiAnalysis": {...},
    "visualAnalysis": {...},
    "forensicAnalysis": {...},
    "scientificComparison": {...},
    "trainingEnhancement": {...},
    "externalValidation": {...},
    "weatherData": {...},
    "atmosphericComparison": {...},
    "confidence": 75,
    "recommendations": [...]
  }
}
```

📖 **Documentación completa:**
- Autenticación: [docs/AUTHENTICATION.md](docs/AUTHENTICATION.md)
- Sistema de análisis: [docs/ANALYSIS_SYSTEM.md](docs/ANALYSIS_SYSTEM.md)
- APIs externas: [docs/EXTERNAL_APIS.md](docs/EXTERNAL_APIS.md)

## 🗂️ Estructura del proyecto

```
uap-analysys/
├── frontend/
│   └── index.html          # SPA con Bootstrap 5
├── server/
│   ├── app.js              # Configuración Express
│   ├── models/
│   │   ├── User.js         # Modelo de usuario
│   │   ├── Analysis.js     # Modelo de análisis
│   │   ├── Report.js       # Modelo de reportes
│   │   └── UFODatabase.js  # Base de datos de objetos conocidos (1,064 objetos)
│   ├── routes/
│   │   ├── auth.js         # Rutas de autenticación
│   │   ├── user.js         # Rutas de usuarios
│   │   ├── analyze.js      # Rutas de análisis (9 capas)
│   │   └── upload.js       # Subida de archivos
│   ├── services/
│   │   ├── exifService.js              # Capa 1: Extracción EXIF
│   │   ├── visualAnalysisService.js    # Capa 2: Análisis visual
│   │   ├── forensicAnalysisService.js  # Capa 3: Análisis forense
│   │   ├── scientificComparisonService.js # Capa 4: Comparación científica
│   │   ├── trainingLearningService.js  # Capa 5: Training enhancement
│   │   ├── externalValidationService.js # Capa 6: APIs externas
│   │   ├── weatherService.js           # Capa 7: Meteorología
│   │   ├── atmosphericComparisonService.js # Capa 8: Fenómenos atmosféricos
│   │   └── confidenceCalculatorService.js # Capa 9: Confianza ponderada
│   ├── middleware/
│   │   ├── auth.js         # Middleware JWT
│   │   └── isAdmin.js      # Middleware de roles
│   ├── scripts/
│   │   ├── createAdmin.js  # Script para crear admin
│   │   └── testAuth.sh     # Tests de autenticación
│   ├── .env                # Variables de entorno
│   └── package.json
├── test/
│   ├── test_api_complete.py     # Script de pruebas automáticas
│   ├── create_test_image.py     # Generador de imágenes con EXIF
│   ├── GUIA_PRUEBAS.md          # Guía de validación manual
│   └── RESULTADO_PRUEBAS.md     # Resultados de última validación
├── docs/
│   ├── AUTHENTICATION.md   # Documentación de autenticación
│   ├── ANALYSIS_SYSTEM.md  # Sistema de análisis (9 capas)
│   ├── EXTERNAL_APIS.md    # APIs externas y configuración
│   └── ROADMAP.md          # Plan de desarrollo
├── .github/
│   └── copilot-instructions.md
├── .gitignore
└── README.md
```

## 🛠️ Tecnologías utilizadas

### Backend
- **Node.js** + Express.js
- **MongoDB** / MongoDB Atlas (Mongoose ODM)
- **JWT** (jsonwebtoken) - Autenticación
- **bcryptjs** - Hash de contraseñas
- **Multer** - Subida de archivos
- **Sharp** - Procesamiento de imágenes
- **ExifParser** - Extracción de metadatos
- **SunCalc** - Cálculos astronómicos
- **Axios** - HTTP client para APIs externas
- **CORS** - Cross-Origin Resource Sharing
- **dotenv** - Variables de entorno

### Frontend
- HTML5 + CSS3
- JavaScript (Vanilla)
- Bootstrap 5
- Fetch API

### APIs Externas (opcionales)
- **OpenAI GPT-4 Vision** - Análisis visual avanzado
- **OpenWeatherMap** - Datos meteorológicos
- **OpenSky Network** - Tracking de aeronaves en tiempo real
- **N2YO** - Tracking de satélites
- **StratoCat** - Base de datos de globos estratosféricos

## � Configuración de APIs Externas

El sistema funciona sin API keys configuradas, pero con funcionalidad reducida (8/9 capas). Para activar todas las capas y mejorar la precisión:

### ⚡ Método Rápido (Recomendado)

**1. Configuración Interactiva:**
```bash
node server/scripts/configureApiKeys.js
```

Este script te guiará paso a paso para:
- Obtener cada API key (con enlaces directos)
- Actualizar automáticamente el archivo `.env`
- Crear backups de seguridad

**2. Verificar Configuración:**
```bash
node server/scripts/testApiKeys.js
```

**3. Reiniciar Servidor:**
```bash
cd server
npm run dev
```

### 📋 APIs Disponibles

#### OpenWeatherMap (GRATIS - ALTA PRIORIDAD) 🌤️
- **Activa**: Capas 7 (Meteorológica) y 8 (Atmosférica)
- **Límite**: 1,000 llamadas/día
- **Tiempo**: 5 minutos
- **Registro**: https://openweathermap.org/api

#### N2YO (GRATIS - MEDIA PRIORIDAD) 🛰️
- **Activa**: Capa 6 (Tracking satélites en tiempo real)
- **Límite**: 1,000 transacciones/hora
- **Tiempo**: 3 minutos
- **Registro**: https://www.n2yo.com/api/

#### OpenAI (PAGO - OPCIONAL) 🤖
- **Activa**: Capa 2 (Análisis visual avanzado con GPT-4 Vision)
- **Costo**: ~$0.01 por análisis
- **Tiempo**: 10 minutos
- **Registro**: https://platform.openai.com/api-keys

### 📚 Documentación Completa
- **Guía Rápida**: [`docs/QUICKSTART_API_KEYS.md`](docs/QUICKSTART_API_KEYS.md)
- **Configuración Detallada**: [`docs/API_KEYS_SETUP.md`](docs/API_KEYS_SETUP.md)
- **Scripts**: [`server/scripts/README.md`](server/scripts/README.md)

## �🔒 Seguridad

- ✅ Autenticación JWT con tokens de 7 días
- ✅ Hash de contraseñas con bcrypt (10 salt rounds)
- ✅ Control de acceso basado en roles (user/admin)
- ✅ Protección de rutas con middleware
- ✅ Validación de emails en cliente y servidor
- ✅ Índice único en MongoDB para prevenir duplicados
- ✅ Escape de HTML para prevenir XSS
- ✅ CORS configurado para desarrollo
- ✅ Variables de entorno para credenciales sensibles
- ✅ Contraseñas nunca expuestas en respuestas JSON
- ✅ Validación de tipos de archivo en uploads
- ✅ Límite de tamaño de archivos (10MB)

## 🐛 Solución de problemas

### El servidor no inicia
- Verificar que MongoDB esté ejecutándose
- Comprobar que el puerto 3000 esté disponible
- Revisar las credenciales en `.env`
- Verificar logs en `/tmp/uap-server.log` (si se inició con nohup)

### Error de conexión desde el frontend
- Verificar que el backend esté corriendo en `http://localhost:3000`
- Actualizar `API_URL` en `index.html` si es necesario
- Revisar CORS en `app.js`

### Email duplicado
- El sistema previene emails duplicados con status 409
- Verificar el índice único en MongoDB: `db.users.getIndexes()`

### Error en análisis (status="error")
- Ver `errorMessage` en la respuesta del análisis
- Revisar logs del servidor en `/tmp/uap-server.log`
- Verificar que la imagen tenga metadatos EXIF (GPS y timestamp)
- Comprobar que MongoDB esté conectado correctamente

### Capa 8 (Atmosférica) no funciona
- Requiere API key de OpenWeatherMap configurada
- Ver: [Configuración de APIs Externas](#-configuración-de-apis-externas)

## 📝 Scripts disponibles

```bash
# Backend
npm start                    # Inicia el servidor en producción
npm run dev                  # Inicia el servidor con nodemon (auto-reload)

# Configuración
node scripts/createAdmin.js  # Crea usuario administrador
node scripts/configureApiKeys.js  # ⭐ NUEVO: Configuración interactiva de API keys
node scripts/testApiKeys.js  # ⭐ NUEVO: Verificar conexión con APIs

# Testing
./scripts/testAuth.sh        # Tests de autenticación
./scripts/testSystem.sh      # Tests completos del sistema
python3 test/test_api_complete.py  # Tests del sistema de análisis (9 capas)

# Utilidades
python3 test/create_test_image.py  # Genera imágenes de prueba con EXIF
```

Ver documentación completa de scripts en: [`server/scripts/README.md`](server/scripts/README.md)

## 🧪 Testing

### Pruebas del sistema de análisis completo
```bash
cd test
python3 test_api_complete.py
```

**Valida**:
- ✅ Registro y autenticación de usuarios
- ✅ Subida de imágenes con EXIF
- ✅ Análisis completo de 9 capas
- ✅ Extracción de metadatos GPS y timestamp
- ✅ Validación externa con APIs
- ✅ Cálculo de confianza ponderada
- ✅ Tiempo de respuesta (<5 segundos)

**Output esperado**:
```
================================================================================
                            RESUMEN FINAL DE PRUEBAS                            
================================================================================

✓ Capa 1: EXIF
✓ Capa 2: Visual AI
✓ Capa 3: Forense
✓ Capa 4: Científica
✓ Capa 5: Training
✓ Capa 6: Externa
✓ Capa 7: Meteorológica
⚠ Capa 8: Atmosférica (requiere OpenWeatherMap API key)
✓ Capa 9: Confianza

Resultado: 8/9 capas validadas

⚠️  Sistema funcional con limitaciones menores
```

### Tests de autenticación
```bash
cd server
./scripts/testAuth.sh
```

Verifica:
- ✅ Registro de usuarios
- ✅ Login y generación de JWT
- ✅ Protección de rutas
- ✅ Control de roles (user/admin)
- ✅ Cambio de contraseña

### Tests completos del sistema
```bash
cd server
./scripts/testSystem.sh
```

Verifica:
- ✅ Servicios backend y frontend corriendo
- ✅ Todos los endpoints de autenticación
- ✅ Protección de rutas
- ✅ Archivos frontend disponibles
- ✅ Auto-inicia servicios si están detenidos

## 📊 Métricas del Sistema

### Rendimiento
- **Tiempo de análisis**: 4-5 segundos (imagen 800x600px)
- **Extracción EXIF**: <1 segundo
- **Comparación científica**: ~2 segundos (1,064 objetos)
- **Validación externa**: ~1 segundo
- **Cálculo de confianza**: <0.5 segundos

### Base de Datos
- **Objetos conocidos**: 1,064 (UFODatabase)
- **Fenómenos atmosféricos**: 23 tipos catalogados
- **Categorías**: celestial, satellite, aircraft, drone, balloon, bird, natural, UAP, hoax, unknown
- **Características por objeto**: morfología, color, textura, bordes, momentos

### Precisión
- **Tasa de éxito**: 89% de capas operativas (8/9)
- **Tiempo de respuesta**: 100% análisis <5 segundos
- **Cobertura de APIs**: 4 servicios externos integrados
- **Confianza promedio**: Ajustada según evidencias (0-100%)

## 🚧 Roadmap

Ver plan completo en: [`docs/ROADMAP.md`](docs/ROADMAP.md)

### ✅ Completado
- [x] Sistema de autenticación JWT
- [x] CRUD de usuarios con roles
- [x] Análisis EXIF completo (Capa 1)
- [x] Análisis visual avanzado (Capa 2)
- [x] Análisis forense (Capa 3)
- [x] Comparación científica con 1,064 objetos (Capa 4)
- [x] Training enhancement (Capa 5)
- [x] Validación externa (Capa 6)
- [x] Análisis meteorológico (Capa 7)
- [x] Comparación atmosférica con 23 fenómenos (Capa 8)
- [x] Confianza ponderada (Capa 9)
- [x] Sistema de pruebas automatizado

### 🔄 En progreso
- [ ] Optimización de frontend para mostrar todas las capas
- [ ] Dashboard con gráficos de confianza
- [ ] Visualización de fenómenos atmosféricos

### 📋 Pendiente
- [ ] Biblioteca visual de fenómenos
- [ ] Exportación de reportes PDF
- [ ] Sistema de notificaciones en tiempo real
- [ ] API de búsqueda avanzada de análisis
- [ ] Integración con más fuentes de datos

## 🤝 Contribuir

1. Fork el proyecto
2. Crear una rama para tu feature (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abrir un Pull Request

### Guidelines
- Seguir las convenciones de código existentes
- Agregar tests para nuevas funcionalidades
- Actualizar documentación cuando sea necesario
- Verificar que todos los tests pasen antes de PR

## 📄 Licencia

Este proyecto está bajo la Licencia MIT.

## 👥 Autores

- **ufoteoria-sudo** - [GitHub](https://github.com/ufoteoria-sudo)

## 🌟 Agradecimientos

- Proyecto desarrollado para el análisis científico de fenómenos aéreos no identificados
- Comunidad de investigadores UAP
- Contribuidores de bases de datos públicas (OpenSky, N2YO, StratoCat)
- APIs de código abierto (SunCalc)
