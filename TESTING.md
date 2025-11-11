# Guía de Comprobación - UAP Analysis System

## ✅ Pasos para Comprobar que Todo Funciona

### 1. Verificar la Corrección del Código

El archivo `app.js` tiene la línea correcta:
```javascript
const usersRouter = require('./routes/user');
```

✅ **Esto es correcto** porque:
- El archivo existe en `server/routes/user.js`
- La importación coincide con el nombre del archivo
- El módulo exporta correctamente con `module.exports = router`

---

### 2. Iniciar el Servidor Backend

Abre una terminal y ejecuta:

```bash
cd server
npm run dev
```

**Deberías ver:**
```
[nodemon] 3.1.10
[nodemon] starting `node app.js`
Servidor iniciado en puerto 3000
```

✅ **Si ves "Servidor iniciado en puerto 3000"** → El código está correcto

❌ **Si ves un error de "Cannot find module"** → Hay un problema con la ruta

---

### 3. Verificar MongoDB

El servidor necesita MongoDB para funcionar completamente. Tienes dos opciones:

#### Opción A: MongoDB Local
```bash
# Iniciar MongoDB
sudo systemctl start mongod

# Verificar que está corriendo
pgrep mongod
```

Si MongoDB está corriendo, deberías ver en el servidor:
```
Conectado a MongoDB
```

#### Opción B: MongoDB Atlas (Recomendado si tienes problemas locales)

1. Crear cuenta gratuita en [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Crear un cluster gratuito
3. Obtener la cadena de conexión
4. Editar `server/.env`:
```env
MONGO_URI=mongodb+srv://usuario:password@cluster0.mongodb.net/uap-db?retryWrites=true&w=majority
PORT=3000
```

---

### 4. Probar la API con curl

Con el servidor corriendo, abre **otra terminal** y ejecuta:

```bash
# Listar usuarios (debería retornar array vacío [] al inicio)
curl http://localhost:3000/api/users

# Crear un usuario
curl -X POST http://localhost:3000/api/users \
  -H "Content-Type: application/json" \
  -d '{"username": "testuser", "email": "test@example.com"}'

# Listar usuarios nuevamente (debería mostrar el usuario creado)
curl http://localhost:3000/api/users
```

**Respuestas esperadas:**

✅ **Primera llamada** (sin usuarios):
```json
[]
```

✅ **Crear usuario**:
```json
{
  "_id": "673e1a2b3c4d5e6f7a8b9c0d",
  "username": "testuser",
  "email": "test@example.com",
  "createdAt": "2025-11-08T...",
  "updatedAt": "2025-11-08T..."
}
```

✅ **Segunda llamada** (con usuario):
```json
[
  {
    "_id": "673e1a2b3c4d5e6f7a8b9c0d",
    "username": "testuser",
    "email": "test@example.com",
    "createdAt": "2025-11-08T...",
    "updatedAt": "2025-11-08T..."
  }
]
```

---

### 5. Probar el Frontend

1. Con el servidor backend corriendo, abre el archivo:
```bash
# Linux
xdg-open frontend/index.html

# Mac
open frontend/index.html

# Windows
start frontend/index.html

# O con Python
python3 -m http.server 8000 --directory frontend
# Luego abrir: http://localhost:8000
```

2. En el navegador deberías ver:
   - ✅ Formulario para crear usuarios
   - ✅ Tabla de usuarios
   - ✅ Campo de búsqueda

3. Prueba crear un usuario:
   - Introduce un nombre de usuario
   - Introduce un email válido
   - Click en "Crear"
   - ✅ Debería aparecer el mensaje "Usuario creado correctamente"
   - ✅ El usuario debería aparecer en la tabla

---

### 6. Comprobar la Consola del Navegador

1. Abre las DevTools (F12 o Ctrl+Shift+I)
2. Ve a la pestaña "Console"
3. ✅ **No debería haber errores en rojo**
4. Si ves errores de CORS o conexión, verifica que el backend esté corriendo

---

### 7. Verificación Completa con el Script

Usa el script de verificación automática:

```bash
# Linux/Mac
./start.sh

# Windows
start.bat
```

Este script verifica automáticamente:
- ✅ Node.js instalado
- ✅ npm instalado
- ✅ MongoDB disponible
- ✅ Dependencias instaladas
- ✅ Archivo .env configurado

---

## 🐛 Solución de Problemas

### Error: "Cannot find module './routes/user'"

**Causa**: La ruta de importación no coincide con el archivo real

**Solución**:
```bash
# Verificar que el archivo existe
ls server/routes/

# Debería mostrar: user.js
```

Si el archivo no existe o tiene otro nombre, ajusta la línea en `app.js`.

---

### Error: "Error conectando a MongoDB"

**Causa**: MongoDB no está corriendo o la URI es incorrecta

**Solución**:
1. Verificar MongoDB local:
```bash
sudo systemctl status mongod
```

2. O usar MongoDB Atlas en `.env`

---

### El frontend no carga datos

**Causa**: Backend no está corriendo o hay problema de CORS

**Solución**:
1. Verifica que el servidor esté en puerto 3000
2. Revisa la consola del navegador (F12)
3. Comprueba que `API_URL` en `index.html` sea correcto:
```javascript
const API_URL = 'http://localhost:3000/api/users';
```

---

### Email duplicado

**Causa**: El email ya existe en la base de datos

**Respuesta esperada**: Status 409
```json
{
  "error": "El email ya está registrado."
}
```

✅ **Esto es correcto** - El sistema está previniendo duplicados

---

## ✅ Checklist Final

- [ ] El servidor arranca sin errores
- [ ] Se muestra "Servidor iniciado en puerto 3000"
- [ ] Se muestra "Conectado a MongoDB"
- [ ] curl a `/api/users` retorna respuesta JSON
- [ ] El frontend abre correctamente
- [ ] Puedo crear un usuario desde el frontend
- [ ] El usuario aparece en la tabla
- [ ] Puedo editar un usuario
- [ ] Puedo borrar un usuario
- [ ] La búsqueda funciona en tiempo real

Si todos los puntos están marcados: **¡El proyecto está funcionando perfectamente!** 🎉

---

## 📞 Siguiente Paso

Si todo funciona correctamente, el próximo paso sería:
1. Hacer commit de los cambios
2. Push a GitHub
3. Empezar a agregar nuevas funcionalidades

```bash
git add .
git commit -m "Fix: Corregir importación de rutas y mejorar documentación"
git push origin main
```
