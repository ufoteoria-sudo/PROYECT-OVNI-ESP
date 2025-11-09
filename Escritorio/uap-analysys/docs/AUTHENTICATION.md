# Sistema de Autenticación UAP

## Descripción General

El sistema UAP utiliza autenticación basada en JWT (JSON Web Tokens) con bcrypt para hash de contraseñas.

## Características

- ✅ Registro de usuarios con validación
- ✅ Login con generación de JWT
- ✅ Protección de rutas con middleware
- ✅ Control de acceso basado en roles (user/admin)
- ✅ Cambio de contraseña
- ✅ Tokens con expiración (7 días)
- ✅ Seguimiento de último login

## Endpoints de Autenticación

### 1. Registro de Usuario

**POST** `/api/auth/register`

```json
{
  "username": "testuser",
  "email": "test@uap.com",
  "password": "Password123!",
  "firstName": "Test",
  "lastName": "User"
}
```

**Respuesta exitosa (201):**
```json
{
  "message": "Usuario registrado exitosamente.",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "690f686b7dacb9d954615623",
    "username": "testuser",
    "email": "test@uap.com",
    "firstName": "Test",
    "lastName": "User",
    "role": "user",
    "subscription": {
      "status": "free",
      "plan": "free"
    }
  }
}
```

**Errores:**
- `400`: Campos requeridos faltantes
- `409`: Email o username ya registrado

### 2. Login

**POST** `/api/auth/login`

```json
{
  "email": "test@uap.com",
  "password": "Password123!"
}
```

**Respuesta exitosa (200):**
```json
{
  "message": "Login exitoso.",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "690f686b7dacb9d954615623",
    "username": "testuser",
    "email": "test@uap.com",
    "role": "user",
    "subscription": {
      "status": "free",
      "plan": "free"
    }
  }
}
```

**Errores:**
- `400`: Email y password requeridos
- `404`: Usuario no encontrado
- `401`: Contraseña incorrecta

### 3. Obtener Usuario Actual

**GET** `/api/auth/me`

**Headers:**
```
Authorization: Bearer <token>
```

**Respuesta exitosa (200):**
```json
{
  "id": "690f686b7dacb9d954615623",
  "username": "testuser",
  "email": "test@uap.com",
  "firstName": "Test",
  "lastName": "User",
  "role": "user",
  "subscription": {
    "status": "free",
    "plan": "free"
  },
  "profile": {
    "phone": "",
    "country": "",
    "bio": ""
  },
  "isActive": true,
  "lastLogin": "2025-11-08T15:57:48.285Z",
  "createdAt": "2025-11-08T15:57:31.918Z"
}
```

**Errores:**
- `401`: Token inválido o expirado
- `404`: Usuario no encontrado

### 4. Cambiar Contraseña

**PUT** `/api/auth/change-password`

**Headers:**
```
Authorization: Bearer <token>
```

**Body:**
```json
{
  "currentPassword": "Password123!",
  "newPassword": "NewPassword456!"
}
```

**Respuesta exitosa (200):**
```json
{
  "message": "Contraseña actualizada exitosamente."
}
```

**Errores:**
- `400`: Contraseña actual y nueva requeridas
- `401`: Contraseña actual incorrecta

## Protección de Rutas

### Middleware de Autenticación

Todas las rutas protegidas requieren el header:
```
Authorization: Bearer <token>
```

**Ejemplo con curl:**
```bash
curl -X GET http://localhost:3000/api/users \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

**Ejemplo con JavaScript:**
```javascript
fetch('http://localhost:3000/api/users', {
  headers: {
    'Authorization': `Bearer ${token}`
  }
})
```

### Rutas Públicas (sin autenticación)

- `POST /api/auth/register` - Registro de usuarios
- `POST /api/auth/login` - Login

### Rutas Protegidas (requieren autenticación)

- `GET /api/auth/me` - Ver perfil propio
- `PUT /api/auth/change-password` - Cambiar contraseña
- `GET /api/users/:id` - Ver usuario específico (admin o el mismo usuario)
- `PUT /api/users/:id` - Actualizar usuario (admin o el mismo usuario)

### Rutas Admin (requieren role: "admin")

- `GET /api/users` - Listar todos los usuarios
- `POST /api/users` - Crear usuario
- `DELETE /api/users/:id` - Eliminar usuario

## Roles de Usuario

### Usuario Normal (user)
- Puede registrarse
- Puede actualizar su propio perfil
- Puede ver sus propios datos
- Puede subir imágenes/videos
- Puede generar reportes de sus análisis
- Puede cambiar su contraseña

### Administrador (admin)
- Tiene todos los permisos de usuario normal
- Puede ver todos los usuarios
- Puede crear usuarios manualmente
- Puede actualizar cualquier usuario
- Puede eliminar usuarios
- Puede acceder al panel de administración

## Crear Usuario Administrador

Para crear el primer usuario administrador:

```bash
cd server
node scripts/createAdmin.js
```

**Credenciales por defecto:**
- Email: `admin@uap.com`
- Password: `Admin123!`

⚠️ **IMPORTANTE:** Cambiar esta contraseña inmediatamente en producción.

## Seguridad

### Hash de Contraseñas
- Usa bcrypt con 10 salt rounds
- Las contraseñas nunca se almacenan en texto plano
- Las contraseñas no se incluyen en respuestas JSON

### Tokens JWT
- Firmados con `JWT_SECRET` (variable de entorno)
- Expiración: 7 días
- Contienen: `userId`, `role`, `iat`, `exp`
- Se validan en cada petición a rutas protegidas

### Variables de Entorno

En `server/.env`:
```env
JWT_SECRET=uap-secret-key-super-secure-2025-change-in-production
MONGO_URI=mongodb+srv://...
PORT=3000
```

⚠️ **Cambiar JWT_SECRET en producción** a un valor aleatorio y seguro:
```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

## Testing

### Script de Pruebas Automatizado

```bash
cd server
./scripts/testAuth.sh
```

Este script prueba:
1. ✅ Registro de usuario
2. ✅ Login
3. ✅ Obtener datos de usuario autenticado
4. ✅ Bloqueo de acceso sin token
5. ✅ Control de acceso basado en roles
6. ✅ Login de admin
7. ✅ Permisos de admin
8. ✅ Cambio de contraseña
9. ✅ Login con nueva contraseña

### Pruebas Manuales con curl

**1. Registrar usuario:**
```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "username":"testuser",
    "email":"test@uap.com",
    "password":"Test123!",
    "firstName":"Test",
    "lastName":"User"
  }'
```

**2. Login:**
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@uap.com","password":"Test123!"}'
```

**3. Acceder a ruta protegida:**
```bash
TOKEN="tu_token_aqui"
curl -X GET http://localhost:3000/api/auth/me \
  -H "Authorization: Bearer $TOKEN"
```

**4. Login como admin:**
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@uap.com","password":"Admin123!"}'
```

**5. Listar usuarios (solo admin):**
```bash
ADMIN_TOKEN="token_de_admin"
curl -X GET http://localhost:3000/api/users \
  -H "Authorization: Bearer $ADMIN_TOKEN"
```

## Integración con Frontend

### Almacenar Token

```javascript
// Después del login exitoso
const { token, user } = await response.json();
localStorage.setItem('token', token);
localStorage.setItem('user', JSON.stringify(user));
```

### Incluir Token en Peticiones

```javascript
const token = localStorage.getItem('token');

const response = await fetch('http://localhost:3000/api/users/123', {
  method: 'GET',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  }
});
```

### Verificar Autenticación

```javascript
async function checkAuth() {
  const token = localStorage.getItem('token');
  if (!token) {
    // Redirigir a login
    window.location.href = '/login.html';
    return;
  }
  
  try {
    const response = await fetch('http://localhost:3000/api/auth/me', {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    
    if (!response.ok) {
      // Token inválido, limpiar y redirigir
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login.html';
    }
    
    const user = await response.json();
    return user;
    
  } catch (error) {
    console.error('Error al verificar autenticación:', error);
  }
}
```

### Logout

```javascript
function logout() {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
  window.location.href = '/login.html';
}
```

## Códigos de Estado HTTP

- `200` - OK (login exitoso, datos obtenidos)
- `201` - Created (usuario registrado)
- `400` - Bad Request (campos faltantes, validación)
- `401` - Unauthorized (token inválido, contraseña incorrecta)
- `403` - Forbidden (no tiene permisos, no es admin)
- `404` - Not Found (usuario no existe)
- `409` - Conflict (email/username duplicado)
- `500` - Internal Server Error (error del servidor)

## Próximos Pasos

1. ✅ Sistema de autenticación implementado
2. 🔄 Actualizar frontend para usar autenticación
3. ⏳ Implementar subida de archivos (Multer)
4. ⏳ Integrar AI para análisis de imágenes
5. ⏳ Sistema de reportes PDF
6. ⏳ Integración de pagos (Stripe)

## Soporte

Para problemas con autenticación:
1. Verificar que MongoDB está conectado
2. Verificar que `.env` tiene `JWT_SECRET` configurado
3. Verificar que el token no ha expirado (7 días)
4. Verificar que el header `Authorization` está correctamente formateado
5. Revisar logs del servidor para errores específicos
