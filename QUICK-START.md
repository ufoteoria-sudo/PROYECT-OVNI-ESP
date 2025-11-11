# 🚀 UAP Analysis System - Guía Rápida

## Estado Actual del Sistema

✅ **Sistema Científico v5.1 Operativo**
- Extracción de características científicas (morfología, histogramas, textura, bordes, momentos)
- Comparación matemática con 1055 objetos de base de datos
- Extracción EXIF expandida (60+ campos, estilo ExifTool)
- Detección avanzada de manipulación

## 🎯 Iniciar el Sistema

### Opción 1: Script Automático (Recomendado)
```bash
cd /home/roberto/Escritorio/uap-analysys
./start-services.sh
```

### Opción 2: Manual
```bash
# Backend
cd server
node app.js &

# Frontend
cd ../frontend
python3 -m http.server 8080 &
```

## 🌐 Acceso al Sistema

- **Login**: http://localhost:8080/login.html
- **Dashboard**: http://localhost:8080/dashboard.html
- **API Backend**: http://localhost:3000/api/

## 🔧 Comandos Útiles

### Verificar Estado
```bash
./check-services.sh
```

### Detener Servicios
```bash
./stop-services.sh
```

### Ver Logs
```bash
# Backend
tail -f server/server.log

# Frontend
tail -f frontend/frontend.log
```

## 🐛 Solución de Problemas

### Error: "Error de conexión. Verifica que el servidor esté corriendo"

1. Verificar servicios:
   ```bash
   ./check-services.sh
   ```

2. Si el backend no está corriendo:
   ```bash
   cd server
   node app.js &
   ```

3. Si el frontend no está corriendo:
   ```bash
   cd frontend
   python3 -m http.server 8080 &
   ```

### Error: MongoDB no conecta

Verificar que MongoDB esté corriendo:
```bash
sudo systemctl status mongod
# O iniciar:
sudo systemctl start mongod
```

### Puerto ocupado

Si el puerto 3000 o 8080 está ocupado:
```bash
# Ver qué proceso lo está usando
netstat -tlnp | grep :3000
netstat -tlnp | grep :8080

# Matar proceso
kill -9 <PID>
```

## 📊 Estado de Implementación

### ✅ Completado
- ✅ Sistema de usuarios (login, registro, autenticación JWT)
- ✅ Upload de imágenes
- ✅ Extracción EXIF expandida (60+ campos)
- ✅ Análisis científico con características matemáticas
- ✅ Base de datos de 1055 objetos conocidos
- ✅ Comparación por similitud (morfología, color, textura, bordes, momentos)
- ✅ Detección de manipulación avanzada
- ✅ Dashboard con visualización completa
- ✅ Sistema de reportes

### 🔄 En Progreso
- ⏳ Mejora de features sintéticas para objetos sin imagen
- ⏳ Calibración de pesos de similitud
- ⏳ Validación con múltiples imágenes

## 📝 Notas Técnicas

### Base de Datos
- MongoDB local: `uap-db`
- Colecciones: `users`, `analyses`, `reports`, `ufodatabases`

### Archivos Importantes
- `server/app.js` - Punto de entrada del backend
- `server/routes/analyze.js` - Rutas de análisis
- `server/services/scientificComparisonService.js` - Sistema científico v5.0
- `server/services/featureExtractionService.js` - Extracción características
- `server/services/exifService.js` - Extracción EXIF expandida
- `frontend/dashboard.html` - Dashboard principal

## 🔒 Credenciales de Prueba

Usuario: [Crear en el sistema]
Password: [Definir al registrarse]

---

**Última actualización:** 8 de Noviembre de 2025
**Versión:** 5.1 (Sistema Científico)
