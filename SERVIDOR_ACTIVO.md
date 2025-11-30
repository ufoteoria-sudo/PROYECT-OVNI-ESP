# ✅ SERVIDOR INICIADO - ACCESO LOCAL

## 🚀 El servidor está activo en:

**URL Base**: http://localhost:3000

### 📊 Endpoints Disponibles

#### API Pública (Sin autenticación)
```bash
GET http://localhost:3000/api/library/stats
GET http://localhost:3000/api/library/phenomena
GET http://localhost:3000/api/library/objects
```

#### Autenticación
```bash
POST http://localhost:3000/api/auth/login
POST http://localhost:3000/api/auth/register
```

#### Ejemplos de Login
```bash
# Admin
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@uap.com","password":"Admin123!"}'

# Demo
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"demo@uap.com","password":"Demo123!"}'
```

### 📱 Frontend
El frontend está disponible en:
- `/api/library` - API de biblioteca
- `/api/uploads` - API de uploads
- `/api/analyze` - API de análisis
- `/api/reports` - API de reportes
- `/api/training` - API de training data

### 🔑 Credenciales Precargadas

**Usuario Admin:**
- Email: `admin@uap.com`
- Password: `Admin123!`
- Rol: admin

**Usuario Demo:**
- Email: `demo@uap.com`
- Password: `Demo123!`
- Rol: user

---

## 📝 Próximos Pasos

1. **Prueba el sistema** via `http://localhost:3000`
2. **Consulta los endpoints** con Postman/curl
3. **Accede a la documentación** en los archivos generados

---

**Servidor iniciado**: 30 Nov 2025  
**Estado**: ✅ Operacional  
**Puerto**: 3000

