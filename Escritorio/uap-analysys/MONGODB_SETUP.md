# Configuración de MongoDB Atlas

## 🚀 Pasos para Conectar MongoDB (Opción Recomendada)

Ya que MongoDB local no está disponible, usaremos **MongoDB Atlas** (completamente gratis):

### 1. Crear Cuenta en MongoDB Atlas

1. Ve a: https://www.mongodb.com/cloud/atlas/register
2. Regístrate con:
   - Email
   - O con Google/GitHub

### 2. Crear un Cluster Gratuito

1. Click en "Build a Database"
2. Selecciona **FREE** (M0 Sandbox)
3. Elige un proveedor: AWS, Google Cloud o Azure
4. Región: Elige la más cercana (por ejemplo: `us-east-1`)
5. Click "Create Cluster"
6. Espera 1-3 minutos mientras se crea

### 3. Configurar Acceso

#### a) Crear Usuario de Base de Datos
1. En "Security" → "Database Access"
2. Click "Add New Database User"
3. Método: **Password**
4. Username: `uap_user`
5. Password: Genera una contraseña (GUÁRDALA)
6. Rol: `Atlas Admin`
7. Click "Add User"

#### b) Permitir Acceso desde Cualquier IP
1. En "Security" → "Network Access"
2. Click "Add IP Address"
3. Click "Allow Access from Anywhere" (para desarrollo)
4. IP: `0.0.0.0/0`
5. Click "Confirm"

### 4. Obtener Cadena de Conexión

1. Ve a "Database" en el menú
2. Click en "Connect" en tu cluster
3. Selecciona "Connect your application"
4. Driver: **Node.js**
5. Version: **5.5 or later**
6. Copia la cadena de conexión que se parece a:
```
mongodb+srv://uap_user:<password>@cluster0.xxxxx.mongodb.net/?retryWrites=true&w=majority
```

### 5. Configurar en el Proyecto

Edita el archivo `server/.env`:

```env
MONGO_URI=mongodb+srv://uap_user:TU_PASSWORD_AQUI@cluster0.xxxxx.mongodb.net/uap-db?retryWrites=true&w=majority
PORT=3000
```

**IMPORTANTE**: 
- Reemplaza `<password>` con tu contraseña real
- Reemplaza `cluster0.xxxxx.mongodb.net` con tu URL real
- Agrega `/uap-db` antes del `?` para especificar la base de datos

### 6. Reiniciar el Servidor

```bash
cd server
node app.js
```

Deberías ver:
```
Servidor iniciado en puerto 3000
Conectado a MongoDB
```

### 7. Probar la Conexión

```bash
curl http://localhost:3000/api/users
```

Debería retornar: `[]` (array vacío, significa que está conectado)

---

## 🔧 Alternativa Rápida: Usar Datos de Prueba Sin MongoDB

Si quieres probar la interfaz ahora mismo sin configurar MongoDB, puedo crear una versión del backend que use datos en memoria (se pierden al reiniciar):

```bash
# En server/app.js, comentar la conexión MongoDB
# Y usar un array en memoria para los usuarios
```

---

## ✅ Verificación Final

Una vez configurado MongoDB Atlas:

1. ✅ Backend muestra "Conectado a MongoDB"
2. ✅ `curl http://localhost:3000/api/users` retorna JSON
3. ✅ Frontend puede crear/editar/borrar usuarios
4. ✅ Los datos persisten (no se pierden al reiniciar)

---

## 💡 Tips

- **Gratis para siempre**: M0 Sandbox es gratis, sin tarjeta de crédito
- **512 MB de almacenamiento**: Suficiente para miles de usuarios
- **Compartido**: Ideal para desarrollo y proyectos pequeños
- **Seguro**: Conexión encriptada con SSL/TLS

---

¿Prefieres que:
1. Te guíe paso a paso para configurar MongoDB Atlas ahora?
2. Cree una versión con datos en memoria para probar inmediatamente?
