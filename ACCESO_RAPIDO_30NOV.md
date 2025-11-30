# 🚀 GUÍA DE ACCESO RÁPIDO - UAP Analysis System v2.0

## 🎯 EL SERVIDOR ESTÁ CORRIENDO

**URL**: `http://localhost:3000`  
**Estado**: ✅ Operacional  
**Modo**: Base de Datos en Memoria  
**Última Actualización**: 30 Nov 2025

---

## 🌐 Endpoints Disponibles

### Biblioteca Visual (Sin autenticación)
```bash
# Estadísticas
curl http://localhost:3000/api/library/stats

# Listar fenómenos atmosféricos
curl http://localhost:3000/api/library/phenomena

# Listar objetos UFO
curl http://localhost:3000/api/library/objects

# Con paginación
curl "http://localhost:3000/api/library/objects?page=1&limit=10"
```

### Uploads (Requiere autenticación)
```bash
# Listar uploads
curl http://localhost:3000/api/uploads \
  -H "Authorization: Bearer TOKEN"

# Con paginación
curl "http://localhost:3000/api/uploads?page=1&limit=20" \
  -H "Authorization: Bearer TOKEN"
```

### Training Data (Requiere autenticación)
```bash
# Listar dataset
curl http://localhost:3000/api/training \
  -H "Authorization: Bearer TOKEN"
```

### Autenticación
```bash
# Login como Admin
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email":"ufoteoria@gmail.com",
    "password":"admin123"
  }'

# Login como Usuario
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email":"investigador@uap.com",
    "password":"investigador123"
  }'

# Obtener usuario autenticado
curl http://localhost:3000/api/auth/me \
  -H "Authorization: Bearer TOKEN"
```

---

## 🔑 Credenciales de Prueba

### Admin
- **Email**: ufoteoria@gmail.com
- **Password**: admin123
- **Rol**: admin

### Investigador
- **Email**: investigador@uap.com
- **Password**: investigador123
- **Rol**: user

---

## 📊 Estructura de Respuestas (Cambios del 30 Nov)

### Respuesta Exitosa
```json
{
  "success": true,
  "data": [...],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 100,
    "pages": 5
  }
}
```

### Respuesta con Error
```json
{
  "success": false,
  "error": "Mensaje de error",
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 0,
    "pages": 0
  }
}
```

---

## 🧪 Testing Rápido

### 1. Verificar servidor activo
```bash
curl http://localhost:3000/api/library/stats
```

### 2. Obtener token
```bash
TOKEN=$(curl -s -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"ufoteoria@gmail.com","password":"admin123"}' | \
  jq -r '.token // .data.token')

echo $TOKEN
```

### 3. Usar token en requests
```bash
curl http://localhost:3000/api/uploads \
  -H "Authorization: Bearer $TOKEN"
```

---

## 🔄 Cambios Activos del 30 Nov

✅ **Normalización de API**
- Estructura estándar: `{success, data, pagination}`
- Consistencia en todos los endpoints

✅ **Paginación Completa**
- Parámetros: `page` y `limit`
- Metadatos incluidos en respuesta

✅ **Biblioteca Visual**
- 23 fenómenos atmosféricos
- 1,064 objetos UFO
- Sincronización de cambios

✅ **4 Bugs Resueltos**
- gpsTimeStamp undefined
- scientificFeatures undefined
- Ruta /status no existía
- Estructura API inconsistente

---

## 📚 Documentación Completa

Consulta estos archivos para más detalles:

1. **RESUMEN_ESTADO_30NOV2025.md** - Estado completo del sistema
2. **ANALISIS_CAMBIOS_30NOV2025.md** - Análisis de cambios
3. **PROXIMOS_PASOS_RECOMENDADOS.md** - Hoja de ruta
4. **ESTADO_EJECUTIVO_30NOV.txt** - Resumen ejecutivo
5. **DOCUMENTACION_INDICES_30NOV.md** - Índice de docs

---

## 🎯 Próximas Acciones

### Inmediatas (48 horas)
1. ✅ Sistema operativo
2. ⏳ Testing exhaustivo
3. ⏳ Validación de documentación

### Corto Plazo (1-2 semanas)
1. Exportación PDF
2. Análisis de video
3. Caché distribuido

### Mediano Plazo (2-4 semanas)
1. Colaboración multi-usuario
2. API Pública
3. App Móvil

---

## 📞 Soporte

- **Puerto**: 3000
- **Host**: localhost
- **Base de Datos**: En memoria (sin persistencia)
- **Estado**: Operacional 95%
- **Última Actualización**: 30 Nov 2025 13:15 UTC+1

---

<div align="center">

### 🛸 UAP Analysis System v2.0 🛸

**Sistema Operacional - Listo para Testing**

http://localhost:3000

**Documentación Completa**: DOCUMENTACION_INDICES_30NOV.md

</div>
