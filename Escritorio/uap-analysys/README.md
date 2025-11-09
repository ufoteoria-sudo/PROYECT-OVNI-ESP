# UAP Analysis System

Sistema de gestión de usuarios con arquitectura cliente-servidor, diseñado para el análisis y gestión de registros UAP (Unidentified Aerial Phenomena).

## 🚀 Características

- ✅ Sistema de autenticación JWT completo
- ✅ Control de acceso basado en roles (user/admin)
- ✅ CRUD completo de usuarios
- ✅ Validación de emails con índice único
- ✅ Hash de contraseñas con bcrypt
- ✅ Protección de rutas con middleware
- ✅ Interfaz responsive con Bootstrap 5
- ✅ API REST con Express y MongoDB
- ✅ Búsqueda en tiempo real
- ✅ Prevención de XSS

## 📋 Requisitos previos

- Node.js (v14 o superior)
- MongoDB (local o Atlas)
- npm o yarn

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
MONGO_URI=mongodb://localhost:27017/uap-db
JWT_SECRET=uap-secret-key-super-secure-2025-change-in-production
PORT=3000
```

Para MongoDB Atlas:
```env
MONGO_URI=mongodb+srv://usuario:password@cluster0.mongodb.net/uap-db?retryWrites=true&w=majority
JWT_SECRET=uap-secret-key-super-secure-2025-change-in-production
PORT=3000
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
Opción 1 - Abrir directamente:
```bash
# Abrir frontend/index.html en el navegador
```

Opción 2 - Servidor HTTP simple:
```bash
# Desde la raíz del proyecto
python3 -m http.server 8000 --directory frontend
# Luego abrir http://localhost:8000
```

Opción 3 - Servir desde Express (descomentar en `app.js`):
```javascript
const frontendPath = path.join(__dirname, '..', 'frontend');
app.use(express.static(frontendPath));
app.get('/', (req, res) => res.sendFile(path.join(frontendPath, 'index.html')));
```

## 📡 API Endpoints

### Autenticación (públicas)
| Método | Endpoint | Descripción |
|--------|----------|-------------|
| POST | `/api/auth/register` | Registrar nuevo usuario |
| POST | `/api/auth/login` | Iniciar sesión (obtener JWT) |

### Autenticación (protegidas - requieren token)
| Método | Endpoint | Descripción |
|--------|----------|-------------|
| GET | `/api/auth/me` | Obtener usuario autenticado |
| PUT | `/api/auth/change-password` | Cambiar contraseña |

### Usuarios (protegidas)
| Método | Endpoint | Descripción | Requiere |
|--------|----------|-------------|----------|
| GET | `/api/users` | Listar todos los usuarios | Admin |
| GET | `/api/users/:id` | Obtener usuario por ID | Admin o mismo usuario |
| POST | `/api/users` | Crear nuevo usuario | Admin |
| PUT | `/api/users/:id` | Actualizar usuario | Admin o mismo usuario |
| DELETE | `/api/users/:id` | Eliminar usuario | Admin |

### Ejemplo de uso

#### Registrar usuario
```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "johndoe",
    "email": "john@example.com",
    "password": "SecurePass123!",
    "firstName": "John",
    "lastName": "Doe"
  }'
```

#### Iniciar sesión
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "john@example.com", "password": "SecurePass123!"}'
```

Respuesta:
```json
{
  "message": "Login exitoso.",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {...}
}
```

#### Acceder a ruta protegida
```bash
TOKEN="tu_token_jwt_aqui"
curl -X GET http://localhost:3000/api/auth/me \
  -H "Authorization: Bearer $TOKEN"
```

#### Crear usuario (requiere rol admin)
```bash
ADMIN_TOKEN="token_del_admin"
curl -X POST http://localhost:3000/api/users \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -d '{"username": "johndoe", "email": "john@example.com", "password": "Pass123!"}'
```

#### Listar usuarios (requiere rol admin)
```bash
ADMIN_TOKEN="token_del_admin"
curl -X GET http://localhost:3000/api/users \
  -H "Authorization: Bearer $ADMIN_TOKEN"
```

📖 **Documentación completa:** Ver [docs/AUTHENTICATION.md](docs/AUTHENTICATION.md)

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
│   │   └── UFODatabase.js  # Base de datos de objetos conocidos
│   ├── routes/
│   │   ├── auth.js         # Rutas de autenticación
│   │   └── user.js         # Rutas de usuarios
│   ├── middleware/
│   │   ├── auth.js         # Middleware JWT
│   │   └── isAdmin.js      # Middleware de roles
│   ├── scripts/
│   │   ├── createAdmin.js  # Script para crear admin
│   │   └── testAuth.sh     # Tests de autenticación
│   ├── .env                # Variables de entorno
│   └── package.json
├── docs/
│   ├── AUTHENTICATION.md   # Documentación de autenticación
│   ├── ROADMAP.md          # Plan de desarrollo
│   └── ...
├── .github/
│   └── copilot-instructions.md
├── .gitignore
└── README.md
```

## 🛠️ Tecnologías utilizadas

### Backend
- Node.js
- Express.js
- MongoDB / MongoDB Atlas
- Mongoose
- JWT (jsonwebtoken)
- bcryptjs
- CORS
- dotenv

### Frontend
- HTML5
- JavaScript (Vanilla)
- Bootstrap 5
- Fetch API

## 🔒 Seguridad

- ✅ Autenticación JWT con tokens de 7 días
- ✅ Hash de contraseñas con bcrypt (10 salt rounds)
- ✅ Control de acceso basado en roles
- ✅ Protección de rutas con middleware
- ✅ Validación de emails en cliente y servidor
- ✅ Índice único en MongoDB para prevenir duplicados
- ✅ Escape de HTML para prevenir XSS
- ✅ CORS configurado para desarrollo
- ✅ Variables de entorno para credenciales sensibles
- ✅ Contraseñas nunca expuestas en respuestas JSON

## 🐛 Solución de problemas

### El servidor no inicia
- Verificar que MongoDB esté ejecutándose
- Comprobar que el puerto 3000 esté disponible
- Revisar las credenciales en `.env`

### Error de conexión desde el frontend
- Verificar que el backend esté corriendo en `http://localhost:3000`
- Actualizar `API_URL` en `index.html` si es necesario
- Revisar CORS en `app.js`

### Email duplicado
- El sistema previene emails duplicados con status 409
- Verificar el índice único en MongoDB: `db.users.getIndexes()`

## 📝 Scripts disponibles

```bash
npm start                    # Inicia el servidor en producción
npm run dev                  # Inicia el servidor con nodemon (auto-reload)
node scripts/createAdmin.js  # Crea usuario administrador
./scripts/testAuth.sh        # Ejecuta tests de autenticación
```

## 🧪 Testing

### Ejecutar tests de autenticación
```bash
cd server
./scripts/testAuth.sh
```

Este script verifica:
- ✅ Registro de usuarios
- ✅ Login y generación de JWT
- ✅ Protección de rutas
- ✅ Control de roles (user/admin)
- ✅ Cambio de contraseña

### Ejecutar tests completos del sistema
```bash
cd server
./scripts/testSystem.sh
```

Este script verifica:
- ✅ Servicios backend y frontend corriendo
- ✅ Todos los endpoints de autenticación
- ✅ Protección de rutas
- ✅ Archivos frontend disponibles
- ✅ Auto-inicia servicios si están detenidos

## 🤝 Contribuir

1. Fork el proyecto
2. Crear una rama para tu feature (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abrir un Pull Request

## 📄 Licencia

Este proyecto está bajo la Licencia MIT.

## 👥 Autores

- **ufoteoria-sudo** - [GitHub](https://github.com/ufoteoria-sudo)

## 🌟 Agradecimientos

- Proyecto desarrollado para el análisis de fenómenos aéreos no identificados
- Comunidad de investigadores UAP
