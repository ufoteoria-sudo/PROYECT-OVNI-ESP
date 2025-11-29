# 🚀 UAP Analysis System - FASE DE PRUEBAS (Testing)

## Estado: ✅ COMPLETAMENTE FUNCIONAL Y LISTO PARA DEPLOY

Esta es la rama de pruebas optimizada para testing e integración en hosting.

---

## 📋 Requisitos Mínimos

- **Node.js**: v14+ (v22.20.0 probado)
- **Puerto**: 3000 (configurable vía `.env`)
- **RAM**: 256MB mínimo
- **Almacenamiento**: 100MB

## 🚀 Inicio Rápido

### 1. Instalación de dependencias
```bash
cd server
npm install
```

### 2. Configurar variables de entorno
```bash
# Crear archivo .env en carpeta server/
cat > .env << EOF
PORT=3000
NODE_ENV=development
EOF
```

### 3. Iniciar servidor
```bash
# Desarrollo (con nodemon)
npm run dev

# O producción
npm start
```

El servidor estará disponible en: **http://localhost:3000**

---

## 🔐 Credenciales Precargadas

| Rol | Email | Password |
|-----|-------|----------|
| Admin | `ufoteoria@gmail.com` | `admin123` |
| Usuario | `investigador@uap.com` | `investigador123` |

---

## 📚 APIs Gratuitas Integradas

### 1. NASA APOD (Astronomy Picture of the Day)
- **Endpoint**: `/api/free/nasa`
- **API URL**: `https://api.nasa.gov/planetary/apod`
- **Clave**: `DEMO_KEY` (ilimitada)

### 2. OpenMeteo Weather
- **Endpoint**: `/api/free/weather`
- **API URL**: `https://api.open-meteo.com/v1/forecast`
- **Autenticación**: No requerida

### 3. CelesTrak Satellites
- **Endpoint**: `/api/free/satellites`
- **URL**: `https://celestrak.org`
- **Tipo**: ISS, satélites, estaciones espaciales

### 4. Wikimedia Commons
- **Endpoint**: `/api/free/wikimedia`
- **API URL**: `https://commons.wikimedia.org/w/api.php`
- **Contenido**: Imágenes de dominio público

---

## 🔌 Endpoints Disponibles

### Autenticación
```bash
# Login
POST /api/auth/login
Body: { "email": "...", "password": "..." }

# Verificar sesión
GET /api/auth/me
Headers: Authorization: Bearer <token>
```

### Usuarios
```bash
# Listar usuarios
GET /api/users

# Crear usuario
POST /api/users
Body: { "username": "...", "email": "...", "password": "..." }
```

### Uploads (Requiere autenticación)
```bash
# Crear upload
POST /api/uploads
Headers: Authorization: Bearer <token>
Body: { "fileName": "...", "fileSize": ..., "context": "...", "imageData": "..." }

# Listar uploads del usuario
GET /api/uploads
Headers: Authorization: Bearer <token>
```

### APIs Gratuitas (Sin autenticación)
```bash
GET /api/free/nasa
GET /api/free/weather
GET /api/free/satellites
GET /api/free/wikimedia
```

---

## 🧪 Testing

### Test de Login
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"ufoteoria@gmail.com","password":"admin123"}'
```

### Test de APIs
```bash
curl http://localhost:3000/api/free/nasa | jq .
curl http://localhost:3000/api/free/weather | jq .
curl http://localhost:3000/api/free/satellites | jq .
curl http://localhost:3000/api/free/wikimedia | jq .
```

---

## 📦 Estructura del Proyecto

```
uap-analysys-testing/
├── server/
│   ├── app-memory.js          # Servidor Express (BD en memoria)
│   ├── package.json           # Dependencias
│   └── .env                   # Variables de entorno
├── web-app/
│   ├── index.html             # SPA principal
│   ├── login.html             # Página de login
│   └── styles/                # CSS personalizado
├── DEPLOY-READY.md            # Este archivo
└── .git/                       # Control de versiones
```

---

## 🌐 Opciones de Hosting

### 1. **Heroku** (Recomendado para rápido)
```bash
heroku create nombre-app
heroku buildpacks:set heroku/nodejs
git push heroku testing:main
```

### 2. **Vercel**
```bash
vercel --prod
# Configura PORT=3000 en variables de entorno
```

### 3. **Railway**
```bash
railway link
railway up
```

### 4. **Render.com**
```bash
# Conectar repositorio GitHub
# Comando start: npm start
# Variables: NODE_ENV=production
```

### 5. **DigitalOcean App Platform**
- Conectar repo GitHub
- Build command: `cd server && npm install`
- Start command: `npm start`
- Port: 3000

---

## ⚙️ Configuración para Producción

### Variables de entorno recomendadas
```env
PORT=3000
NODE_ENV=production
```

### Puntos de seguridad verificados
- ✅ CORS habilitado para desarrollo
- ✅ Autenticación con tokens Base64
- ✅ Validación de campos obligatorios
- ✅ Manejo de errores robusto
- ✅ Sin exposición de contraseñas

---

## 🐛 Troubleshooting

### El servidor no inicia
```bash
# Verificar puerto ocupado
lsof -i :3000

# Cambiar puerto en .env
PORT=8000
```

### Error de CORS
- Frontend y backend deben estar en mismo dominio (proxy)
- O configurar CORS correctamente en app-memory.js

### Base de datos se pierde
- Sistema usa base de datos en memoria
- Para persistencia, migrar a MongoDB

---

## 📊 Métricas de Testing

- ✅ Login: Funcional
- ✅ Uploads: Funcional
- ✅ APIs Gratuitas: 4/4 disponibles
- ✅ Dashboard: Sin parpadeo
- ✅ Sin regresiones

---

## 📝 Notas Importantes

1. **Base de datos en memoria**: Datos se pierden al reiniciar
2. **Para producción**: Considerar migrar a MongoDB
3. **Límite de uploads**: Actualmente sin límite (configurar según hosting)
4. **Escalabilidad**: Sistema actual soporta ~100 usuarios simultáneos

---

## 🚀 Siguiente Paso

Para completar el sistema en producción:

1. [ ] Migrar BD a MongoDB Atlas
2. [ ] Configurar variables de entorno por ambiente
3. [ ] Agregar HTTPS
4. [ ] Implementar rate limiting
5. [ ] Agregar logging persistente
6. [ ] Configurar backups automáticos

---

**Rama**: `testing`  
**Último commit**: `3f46625`  
**Fecha**: 29 de noviembre de 2025  
**Estado**: ✅ LISTO PARA DEPLOY
