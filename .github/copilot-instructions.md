# Copilot Instructions - UAP Analysis System

## Arquitectura del proyecto

Este es un sistema de gestión de usuarios con arquitectura cliente-servidor:

- **Frontend**: SPA vanilla HTML/JS (`frontend/index.html`) usando Bootstrap 5, sin framework
- **Backend**: Express.js + MongoDB con Mongoose (`server/`)
- **Comunicación**: REST API en `/api/users`, CORS habilitado para desarrollo local
- **Base de datos**: MongoDB local por defecto (`uap-db`), configurable vía `.env`

## Estructura del proyecto

```
frontend/
  index.html          # SPA completa con CRUD de usuarios
server/
  app.js              # Punto de entrada Express, configura middlewares y DB
  models/User.js      # Modelo Mongoose con validaciones
  routes/user.js      # Router con endpoints CRUD
  .env                # Config: MONGO_URI, PORT
  package.json
```

## Convenciones de código

### Backend (Node.js/Express)
- **Respuestas de error**: Siempre formato `{ error: 'mensaje' }` con status HTTP apropiado
- **Códigos de estado**: 
  - `409` para conflictos de email duplicado (índice único)
  - `400` para validación de campos requeridos
  - `404` para recursos no encontrados
  - `500` para errores del servidor
- **Validación duplicados**: Verificación explícita con `findOne()` antes de crear/actualizar, además de catch de error `11000` (índice único MongoDB)
- **Mongoose**: Usar `{ timestamps: true }` en schemas, ordenar por `createdAt: -1` en listados
- **Async/await**: Todos los handlers de ruta son `async` con bloques try/catch

### Frontend (Vanilla JS)
- **API URL**: Hardcoded como `const API_URL = 'http://localhost:3000/api/users'`
- **Bootstrap**: Usar clases de Bootstrap 5 para UI, modal para edición
- **Validación email**: Regex personalizado `/^[^\s@]+@[^\s@]+\.[^\s@]+$/`
- **Escape HTML**: Función `escapeHtml()` para prevenir XSS en atributos onclick
- **Manejo de errores**: Mostrar mensajes en elementos con clase `.small-msg`, limpiar después de 3s
- **Estado 409**: Detectar email duplicado y mostrar mensaje específico
- **Búsqueda**: Filtro en tiempo real con evento `input` en el campo de búsqueda

## Workflows de desarrollo

### Iniciar el proyecto
```bash
# Backend
cd server
npm install
npm run dev        # Desarrollo con nodemon
# O: npm start     # Producción con node
```

### Variables de entorno
Editar `server/.env` para:
- `MONGO_URI`: Conexión MongoDB (local o Atlas)
- `PORT`: Puerto del servidor (default: 3000)

### Base de datos
- MongoDB debe estar corriendo en `localhost:27017` (o usar URI de Atlas)
- Colección: `users` en DB `uap-db`
- Índice único en campo `email` del modelo User

### Frontend local
Abrir `frontend/index.html` directamente en navegador o usar:
```bash
# Opcional: servir con servidor HTTP simple
python3 -m http.server 8000 --directory frontend
```

Actualizar `API_URL` en `index.html` si el backend no está en `localhost:3000`.

## Patrones específicos del proyecto

### Manejo de email único
- Modelo tiene índice único en `email`
- Rutas verifican duplicados explícitamente antes de crear/actualizar
- Catch de error `11000` como fallback
- Respuesta consistente con status `409` y `{ error: 'El email ya está registrado.' }`

### Mensajería de usuario
- Frontend usa elementos dedicados para mensajes (e.g., `#crearUsuarioMsg`, `#editarMsg`)
- Toggle de clases `text-success`/`text-danger` según resultado
- Auto-limpieza de mensajes con `setTimeout(..., 3000)`

### Rutas API
Todas bajo `/api/users`:
- `GET /` - Listar usuarios (ordenados por más reciente)
- `GET /:id` - Obtener usuario específico
- `POST /` - Crear usuario (requiere `username`, `email`)
- `PUT /:id` - Actualizar usuario (requiere `username`, `email`)
- `DELETE /:id` - Borrar usuario

### Campos requeridos
- `username`: String, trim, requerido
- `email`: String, trim, requerido, único, validación de formato en modelo

## Debugging

- Ver logs de MongoDB: `console.log('Conectado a MongoDB')` en `app.js`
- Errores de validación: Mongoose retorna detalles en `err.errors`
- Frontend: Inspeccionar elemento `#usuariosMsg` para errores de fetch
- Backend: Nodemon recarga automáticamente en cambios de código
