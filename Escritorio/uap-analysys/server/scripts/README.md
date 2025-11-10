# 🛠️ Scripts del Sistema UAP Analysis

Este directorio contiene scripts de utilidad para configuración, testing y mantenimiento del sistema.

## 📋 Lista de Scripts

### 🔑 Configuración de APIs

#### `configureApiKeys.js` ⭐ NUEVO
**Configuración interactiva de API keys**

```bash
node server/scripts/configureApiKeys.js
```

- Guía paso a paso para obtener cada API key
- Actualiza automáticamente `.env`
- Crea backups antes de modificar
- Soporte para OpenWeatherMap, N2YO y OpenAI
- **Uso recomendado**: Primera configuración o actualización de keys

#### `testApiKeys.js` ⭐ NUEVO
**Verificación de API keys**

```bash
# Probar todas las APIs
node server/scripts/testApiKeys.js

# Probar una específica
node server/scripts/testApiKeys.js openweathermap
node server/scripts/testApiKeys.js n2yo
node server/scripts/testApiKeys.js openai
```

- Verifica conexión real con cada API
- Valida formato de keys
- Muestra datos de ejemplo
- Detecta problemas (key inválida, límites, sin créditos)
- **Uso recomendado**: Después de configurar keys o si hay errores

---

### 👤 Gestión de Usuarios

#### `createAdmin.js`
**Crear usuario administrador**

```bash
node server/scripts/createAdmin.js
```

- Crea usuario admin con credenciales por defecto
- Email: `admin@uap.com`
- Password: `Admin123!`
- **Uso**: Solo una vez al inicializar la base de datos

---

### 🎯 Training y Datos

#### `create-training-templates.js`
**Crear plantillas de entrenamiento**

```bash
node server/scripts/create-training-templates.js
```

- Genera 50 plantillas de objetos conocidos
- Crea colección `trainingobjects` en MongoDB
- Incluye: aeronaves, celestes, globos, drones, meteoritos
- **Uso**: Inicialización de base de datos de training

#### `populate-training-data.js`
**Poblar datos de entrenamiento**

```bash
node server/scripts/populate-training-data.js
```

- Carga 1,064 objetos de UFODatabase
- Genera features científicas (morphology, colorHistogram, textureProfile)
- Inserta en colección `scientificobjects`
- **Tiempo**: ~2-3 segundos
- **Uso**: Inicialización de base de datos científica

---

### 🧪 Testing

#### `testAuth.sh`
**Probar sistema de autenticación**

```bash
bash server/scripts/testAuth.sh
```

- Prueba registro de usuario
- Prueba login
- Verifica tokens JWT
- **Uso**: Validar funcionamiento de auth

#### `testSystem.sh`
**Probar sistema completo**

```bash
bash server/scripts/testSystem.sh
```

- Prueba flujo completo: registro → login → upload → análisis
- Verifica todas las capas
- Muestra resultados colorizados
- **Uso**: Validación end-to-end

---

## 🚀 Guías de Uso

### Primera Configuración del Sistema

```bash
# 1. Instalar dependencias
cd server
npm install

# 2. Crear usuario admin
node scripts/createAdmin.js

# 3. Poblar base de datos
node scripts/create-training-templates.js
node scripts/populate-training-data.js

# 4. Configurar API keys (NUEVO)
node scripts/configureApiKeys.js

# 5. Verificar APIs (NUEVO)
node scripts/testApiKeys.js

# 6. Iniciar servidor
npm run dev
```

### Actualizar API Keys

```bash
# Configuración interactiva
node server/scripts/configureApiKeys.js

# Verificar
node server/scripts/testApiKeys.js

# Reiniciar servidor
cd server && npm run dev
```

### Validar Sistema

```bash
# Autenticación
bash server/scripts/testAuth.sh

# Sistema completo
bash server/scripts/testSystem.sh

# APIs
node server/scripts/testApiKeys.js

# Testing avanzado
python3 test/test_api_complete.py
```

---

## 📊 Estado de Funcionalidad

### ✅ Sin API Keys
- 8/9 capas funcionando (89%)
- Sistema totalmente operativo
- Funcionalidad básica completa

### ✅ Con OpenWeatherMap (GRATIS)
- 9/9 capas funcionando (100%)
- Datos meteorológicos reales
- 23 fenómenos atmosféricos detectables
- **Tiempo de configuración**: 5 minutos

### ✅ Con N2YO (GRATIS)
- Tracking de satélites en tiempo real
- Validación externa mejorada
- Capa 6 con datos precisos
- **Tiempo de configuración**: 3 minutos + email

### ⚪ Con OpenAI (PAGO - OPCIONAL)
- Análisis visual avanzado
- GPT-4 Vision para descripciones
- Mayor precisión en identificación
- **Costo**: ~$0.01 por análisis

---

## 🔧 Troubleshooting

### Scripts no ejecutables
```bash
chmod +x server/scripts/*.js
chmod +x server/scripts/*.sh
```

### Error: "Cannot find module 'dotenv'"
```bash
cd server
npm install
```

### Error: "MONGO_URI is not defined"
```bash
# Crear .env
cp server/.env.example server/.env

# Editar y agregar MongoDB URI
nano server/.env
```

### APIs no funcionan después de configurar
```bash
# 1. Verificar .env
cat server/.env | grep API_KEY

# 2. Probar conexión
node server/scripts/testApiKeys.js

# 3. Reiniciar servidor (IMPORTANTE)
# Ctrl+C en terminal del servidor
cd server && npm run dev
```

---

## 📚 Documentación Relacionada

- **Guía Rápida de APIs**: `docs/QUICKSTART_API_KEYS.md`
- **Configuración Detallada**: `docs/API_KEYS_SETUP.md`
- **Resultados de Pruebas**: `test/RESULTADO_PRUEBAS.md`
- **Probar Frontend**: `test/PROBAR_FRONTEND.md`
- **README Principal**: `README.md`

---

## 💡 Tips

1. **Prioridad de APIs**: 
   - ⭐ OpenWeatherMap (alta, gratis)
   - ⭐ N2YO (media, gratis)
   - ⚪ OpenAI (baja, pago)

2. **Backups automáticos**: 
   - `configureApiKeys.js` crea backup antes de modificar `.env`
   - Formato: `.env.backup.1699565432000`

3. **Testing gradual**:
   - Primero: `testApiKeys.js` (APIs)
   - Luego: `testAuth.sh` (Auth)
   - Después: `testSystem.sh` (Sistema)
   - Finalmente: `test_api_complete.py` (Completo)

4. **Reiniciar servidor**:
   - Siempre reiniciar después de cambiar `.env`
   - Las variables de entorno se cargan al inicio

---

## 🆘 Ayuda

```bash
# Ver ayuda de cualquier script
node server/scripts/[nombre-script].js --help

# Ver logs del servidor
cd server && npm run dev

# Ver estado de MongoDB
mongo --eval "db.adminCommand('listDatabases')"
```

**¿Problemas?** Revisa la documentación completa en `docs/`
