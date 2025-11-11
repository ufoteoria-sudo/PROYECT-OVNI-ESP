# Frontend de Autenticación - Guía de Uso

## 🎨 Páginas Creadas

### 1. `index.html` (Página Principal)
- Redirige automáticamente según el estado de autenticación
- Si hay token: → `dashboard.html`
- Si no hay token: → `login.html`

### 2. `login.html` (Inicio de Sesión)
**URL:** `http://localhost:8000/login.html`

**Características:**
- ✅ Formulario de login con validación
- ✅ Almacena JWT token en localStorage
- ✅ Redirige a dashboard después del login
- ✅ Redirige a admin panel si el usuario es administrador
- ✅ Manejo de errores (credenciales inválidas, servidor no disponible)
- ✅ Diseño moderno con gradiente morado

**Usuarios de prueba:**
```
Admin:
- Email: admin@uap.com
- Password: Admin123!

Usuario Demo:
- Email: demo@uap.com
- Password: Demo123!
```

### 3. `register.html` (Registro)
**URL:** `http://localhost:8000/register.html`

**Características:**
- ✅ Formulario de registro completo
- ✅ Validación en tiempo real de contraseñas
- ✅ Validación de formato de username (3-20 caracteres)
- ✅ Detección de emails/usernames duplicados
- ✅ Auto-login después del registro
- ✅ Checkbox de términos y condiciones

**Campos requeridos:**
- Nombre
- Apellido
- Nombre de usuario (3-20 caracteres, solo letras, números y guión bajo)
- Email
- Contraseña (mínimo 6 caracteres)
- Confirmar contraseña

### 4. `dashboard.html` (Panel de Usuario)
**URL:** `http://localhost:8000/dashboard.html`

**Características:**
- ✅ Requiere autenticación (redirige a login si no hay token)
- ✅ Verifica token con el backend al cargar
- ✅ Sidebar con navegación
- ✅ Información del usuario (nombre, email, rol, suscripción)
- ✅ Estadísticas (análisis, reportes, plan actual)
- ✅ Edición de perfil
- ✅ Cambio de contraseña
- ✅ Botón de logout

**Secciones:**
- **Dashboard**: Vista general con estadísticas
- **Mi Perfil**: Editar datos personales y cambiar contraseña
- **Subir Análisis**: Placeholder (próximamente)
- **Mis Reportes**: Placeholder (próximamente)
- **Suscripción**: Placeholder (próximamente)

### 5. `admin-users.html` (CRUD de Usuarios - Admin)
**URL:** `http://localhost:8000/admin-users.html`

**Nota:** Este es el CRUD original, ahora debe protegerse para solo admins. Por ahora solo se accede directamente.

## 🚀 Cómo Usar

### Iniciar los Servidores

**Backend (Puerto 3000):**
```bash
cd server
npm run dev
```

**Frontend (Puerto 8000):**
```bash
cd frontend
python3 -m http.server 8000
```

### Flujo de Usuario Nuevo

1. **Acceder:** `http://localhost:8000`
2. **Redirección automática** → `login.html` (no autenticado)
3. **Clic en "Registrarse"** → `register.html`
4. **Completar formulario** de registro
5. **Auto-login** y redirección → `dashboard.html`
6. **Explorar** dashboard, editar perfil, etc.
7. **Logout** → Vuelve a `login.html`

### Flujo de Usuario Existente

1. **Acceder:** `http://localhost:8000`
2. **Login** con credenciales
3. **Redirección** → `dashboard.html` (usuarios) o `admin.html` (admins)
4. **Trabajar** en el dashboard
5. **Logout** cuando termine

## 🔐 Almacenamiento de Sesión

El sistema usa **localStorage** para mantener la sesión:

```javascript
// Después del login exitoso
localStorage.setItem('token', jwt_token);
localStorage.setItem('user', JSON.stringify(user_data));

// Para hacer peticiones autenticadas
fetch(url, {
  headers: {
    'Authorization': `Bearer ${localStorage.getItem('token')}`
  }
});

// Al hacer logout
localStorage.removeItem('token');
localStorage.removeItem('user');
```

## 🎨 Diseño y UI

**Colores principales:**
- Gradiente primario: `#667eea` → `#764ba2` (Morado)
- Fondo: `#f5f7fa` (Gris claro)
- Cards: Blanco con sombras

**Íconos:**
- Bootstrap Icons (`bootstrap-icons`)
- Usados en botones, navegación, estadísticas

**Framework:**
- Bootstrap 5.3.0
- Componentes: Cards, Forms, Buttons, Navbar, Sidebar, Alerts

## 🔧 Funcionalidades Implementadas

### Login
- [x] Validación de campos
- [x] Petición POST a `/api/auth/login`
- [x] Almacenamiento de token
- [x] Redireccionamiento según rol
- [x] Manejo de errores
- [x] Spinner de carga

### Registro
- [x] Validación de formato de campos
- [x] Comparación de contraseñas en tiempo real
- [x] Detección de duplicados (409)
- [x] Auto-login después del registro
- [x] Redirección a dashboard

### Dashboard
- [x] Verificación de autenticación
- [x] Obtener datos del usuario (`/api/auth/me`)
- [x] Mostrar información del usuario
- [x] Navegación entre secciones
- [x] Edición de perfil (`PUT /api/users/:id`)
- [x] Cambio de contraseña (`PUT /api/auth/change-password`)
- [x] Logout

## 📝 Próximas Funcionalidades

### Dashboard
- [ ] Mostrar análisis reales del usuario
- [ ] Mostrar reportes generados
- [ ] Gráficos de estadísticas
- [ ] Notificaciones en tiempo real

### Subir Análisis
- [ ] Formulario de upload de imágenes/videos
- [ ] Preview de archivos
- [ ] Barra de progreso
- [ ] Validación de tipos de archivo

### Reportes
- [ ] Listado de reportes generados
- [ ] Descarga de PDFs
- [ ] Vista previa de reportes
- [ ] Compartir reportes

### Admin Panel
- [ ] Crear `admin.html` completo
- [ ] Gestión de usuarios (CRUD)
- [ ] Gestión de análisis
- [ ] Estadísticas del sistema
- [ ] Logs de actividad

## 🐛 Testing

### Prueba Manual - Login

1. Abrir `http://localhost:8000/login.html`
2. Ingresar: `admin@uap.com` / `Admin123!`
3. Verificar redirección a dashboard
4. Verificar que aparece el nombre "Administrador"
5. Verificar badge "ADMIN"

### Prueba Manual - Registro

1. Abrir `http://localhost:8000/register.html`
2. Completar todos los campos
3. Username: `testuser2`
4. Email: `testuser2@uap.com`
5. Password: `Test123!`
6. Aceptar términos
7. Enviar
8. Verificar auto-login y redirección

### Prueba Manual - Dashboard

1. Login como usuario normal
2. Ir a "Mi Perfil"
3. Editar nombre y apellido
4. Guardar cambios
5. Verificar mensaje de éxito
6. Verificar que el nombre se actualiza en el navbar

### Prueba Manual - Cambio de Contraseña

1. Dashboard → Mi Perfil
2. Scroll al formulario "Cambiar Contraseña"
3. Ingresar contraseña actual
4. Ingresar nueva contraseña
5. Guardar
6. Logout
7. Login con nueva contraseña
8. Verificar acceso exitoso

## 🔒 Seguridad

### Implementado
- ✅ Tokens JWT con expiración (7 días)
- ✅ Validación de tokens en backend
- ✅ Redirección automática si token inválido
- ✅ Contraseñas hasheadas (bcrypt)
- ✅ Validación de input en cliente y servidor
- ✅ Protección contra emails duplicados

### Pendiente
- [ ] HTTPS en producción
- [ ] Rate limiting en backend
- [ ] Refresh tokens
- [ ] 2FA (autenticación de dos factores)
- [ ] Captcha en registro
- [ ] Sesiones con expiración más corta
- [ ] Logout de todas las sesiones

## 🌐 URLs del Sistema

| URL | Descripción | Acceso |
|-----|-------------|--------|
| `http://localhost:8000/` | Página principal (redirige) | Público |
| `http://localhost:8000/login.html` | Inicio de sesión | Público |
| `http://localhost:8000/register.html` | Registro de usuario | Público |
| `http://localhost:8000/dashboard.html` | Panel de usuario | Autenticado |
| `http://localhost:8000/admin-users.html` | CRUD de usuarios | Admin (sin protección aún) |
| `http://localhost:3000/api/auth/login` | API - Login | Público |
| `http://localhost:3000/api/auth/register` | API - Registro | Público |
| `http://localhost:3000/api/auth/me` | API - Usuario actual | Autenticado |
| `http://localhost:3000/api/users` | API - Listar usuarios | Admin |

## 📊 Estado del Proyecto

**Fase 2: Autenticación** ✅ COMPLETADO

- [x] Backend de autenticación
- [x] Frontend de login
- [x] Frontend de registro
- [x] Frontend de dashboard
- [x] Edición de perfil
- [x] Cambio de contraseña
- [x] Gestión de sesión
- [x] Documentación

**Próxima Fase: Subida de Archivos** ⏳

---

**Última actualización:** 8 de noviembre de 2025
**Versión:** 2.0 - Sistema de Autenticación Completo
