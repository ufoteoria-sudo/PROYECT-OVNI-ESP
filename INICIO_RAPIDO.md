# 🚀 Inicio Rápido - UAP Analysis System

## ⏱️ Tiempo estimado: 10 minutos

---

## 1️⃣ Verificar Requisitos (2 min)

```bash
# Node.js (v16 o superior)
node --version

# MongoDB (local o Atlas)
mongod --version
# O usar MongoDB Atlas: https://mongodb.com/cloud/atlas

# Python 3 (para servidor frontend)
python3 --version
```

---

## 2️⃣ Instalar Dependencias (3 min)

```bash
# Backend
cd server
npm install

# Esperar a que se instalen ~300 paquetes
# Debería mostrar: "found 0 vulnerabilities"
```

---

## 3️⃣ Configurar API Keys (3 min)

### Opción A: Asistente Interactivo (Recomendado)

```bash
cd server
node scripts/configureApiKeys.js
```

Sigue las instrucciones en pantalla para:
1. **Anthropic Claude** (OBLIGATORIA - $5/mes)
   - Ir a: https://console.anthropic.com
   - Crear cuenta → API Keys → Create Key
   - Copiar key que empieza con `sk-ant-`

2. **OpenWeatherMap** (GRATIS - 1000 req/día)
   - Ir a: https://openweathermap.org/api
   - Sign Up → API Keys → Generate
   - Copiar key (32 caracteres)

3. **N2YO** (GRATIS - 1000 req/hora)
   - Ir a: https://www.n2yo.com/api/
   - Register → Get API Key
   - Copiar key

4. **OpenAI** (Opcional - Pago)
   - Ir a: https://platform.openai.com
   - API Keys → Create new key
   - Copiar key que empieza con `sk-`

### Opción B: Manual

Editar `server/.env`:

```env
# Base de datos
MONGO_URI=mongodb://localhost:27017/uap-db
PORT=3000

# JWT
JWT_SECRET=tu_secret_muy_seguro_aqui_cambiar

# APIs (OBLIGATORIA)
ANTHROPIC_API_KEY=sk-ant-tu-key-aqui

# APIs (OPCIONALES pero recomendadas)
OPENWEATHER_API_KEY=tu-key-aqui
N2YO_API_KEY=tu-key-aqui
OPENAI_API_KEY=sk-tu-key-aqui
```

### Validar Configuración

```bash
node scripts/testApiKeys.js
```

Debería mostrar ✅ para todas las keys configuradas.

---

## 4️⃣ Poblar Base de Datos (1 min)

```bash
cd server

# 23 fenómenos atmosféricos
node scripts/seedAtmosphericPhenomena.js

# 1,064 objetos UFO históricos
node scripts/seedSpecificModels.js
```

Debería mostrar:
```
✅ 23 fenómenos agregados
✅ 1064 objetos agregados
```

---

## 5️⃣ Iniciar Servidores (1 min)

### Terminal 1: Backend

```bash
cd server
npm start
```

Esperar mensaje:
```
Servidor iniciado en puerto 3000
Conectado a MongoDB
```

### Terminal 2: Frontend

```bash
cd frontend
python3 -m http.server 8000
```

Esperar mensaje:
```
Serving HTTP on 0.0.0.0 port 8000...
```

---

## 6️⃣ Acceder al Sistema

1. Abrir navegador: **http://localhost:8000/dashboard.html**

2. **Registrarse**:
   - Username: `admin` (o cualquier nombre)
   - Email: `admin@example.com`
   - Password: `Admin1234!` (mínimo 8 caracteres, 1 mayúscula, 1 número)

3. Click en **"Registrarse"**

4. Automáticamente iniciará sesión → Dashboard

---

## 7️⃣ Realizar Primer Análisis

### Paso 1: Subir Imagen

1. Click en pestaña **"Uploads"** (sidebar)
2. Click en **"Subir Archivo"**
3. Seleccionar imagen (JPG/PNG/WEBP, máx 10MB)
4. *Opcional*: Agregar contexto:
   ```
   Ubicación: Ciudad, País
   Fecha: 2025-01-20
   Hora: 22:30
   Condiciones: Cielo despejado, sin nubes
   Descripción: Luz brillante moviéndose en zigzag
   ```
5. Click **"Subir"**

### Paso 2: Iniciar Análisis

1. Buscar imagen en tabla de uploads
2. Click en botón **🤖 Analizar** (azul)
3. Ver progreso en tiempo real:
   - Barra de progreso: 0% → 100%
   - Notificaciones: "Capa 1 completada", "Capa 2 completada"...
   - Tiempo estimado: 45-90 segundos

### Paso 3: Ver Resultados

1. Cuando llegue a 100%, click en **👁️ Ver Detalles** (verde)
2. Modal mostrará:
   - **Resumen Ejecutivo**: Categoría + Confianza
   - **9 Capas de Análisis**: Expandir/contraer cada una
   - **Recomendación Final**: Genuino/Probable/Dudoso/Falso

---

## 🎉 ¡Listo!

El sistema está completamente funcional. Ahora puedes:

- ✅ Subir más imágenes
- ✅ Ver análisis anteriores
- ✅ Explorar biblioteca de fenómenos
- ✅ Generar reportes
- ✅ (Admin) Agregar training data

---

## 📚 Documentación Completa

- **README.md** - Introducción y arquitectura
- **RESUMEN_FINAL_SISTEMA.md** - Documentación completa del sistema
- **RESULTADO_PRUEBAS.md** - Resultados de pruebas automatizadas
- **PROBAR_FRONTEND.md** - Guía detallada de pruebas frontend
- **API_KEYS_GUIDE.md** - Guía completa de API keys
- **WEBSOCKET_TEST.md** - Pruebas del sistema WebSocket

---

## 🐛 Solución de Problemas

### Error: "Cannot find module"
```bash
cd server
npm install
```

### Error: "MongoDB connection failed"
```bash
# Opción 1: Iniciar MongoDB local
sudo systemctl start mongodb

# Opción 2: Usar MongoDB Atlas
# Editar server/.env:
MONGO_URI=mongodb+srv://usuario:password@cluster.mongodb.net/uap-db
```

### Error: "Port 3000 already in use"
```bash
# Matar proceso en puerto 3000
pkill -f "node.*app.js"

# O usar otro puerto en server/.env:
PORT=3001
```

### Error: "Rate limit exceeded"
Esperar 15 minutos o usar otra IP. Los límites son:
- Auth: 5 req/15min por IP
- Uploads: 100 req/15min por IP

### Error: "Invalid API key"
```bash
# Re-configurar keys
cd server
node scripts/configureApiKeys.js

# Validar
node scripts/testApiKeys.js
```

### Frontend no carga (página en blanco)
1. Verificar que backend esté corriendo (puerto 3000)
2. Abrir consola del navegador (F12)
3. Buscar errores de CORS
4. Verificar que `API_URL` en dashboard.html sea `http://localhost:3000`

### WebSocket no conecta
1. Ver consola del navegador (F12)
2. Debería mostrar: "🔌 WebSocket conectado: <id>"
3. Si no conecta:
   ```bash
   # Reiniciar backend
   pkill -f "node.*app.js"
   cd server
   npm start
   ```

### Análisis tarda más de 2 minutos
Causas posibles:
- API de Claude lenta (depende de su servicio)
- APIs externas no responden (N2YO, OpenWeatherMap)
- Imagen muy grande (>5MB)

Solución:
- Esperar o cancelar (recargar página)
- Ver logs: `tail -f /tmp/uap-server.log`

---

## 🆘 Soporte

1. **Documentación**: Revisar archivos en `/docs`
2. **Logs del servidor**: `tail -f /tmp/uap-server.log`
3. **Logs del frontend**: Consola del navegador (F12)
4. **GitHub Issues**: https://github.com/ufoteoria-sudo/PROYECT-OVNI-ESP/issues

---

## 📞 Contacto

- **GitHub**: [@ufoteoria-sudo](https://github.com/ufoteoria-sudo)
- **Proyecto**: [PROYECT-OVNI-ESP](https://github.com/ufoteoria-sudo/PROYECT-OVNI-ESP)

---

<div align="center">

**🛸 UAP Analysis System v2.0 🛸**

Análisis científico de fenómenos aéreos no identificados

---

**¡Gracias por usar el sistema!**

</div>
