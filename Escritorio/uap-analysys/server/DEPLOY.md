# Deploy Backend a Railway

## Pasos:

1. **Crear cuenta en Railway**: https://railway.app/
   - Login con GitHub

2. **Crear nuevo proyecto**:
   - Click en "New Project"
   - Selecciona "Deploy from GitHub repo"
   - Autoriza Railway a acceder a tu repo `PROYECT-OVNI-ESP`

3. **Configurar el proyecto**:
   - Root Directory: `server`
   - Build Command: (automático)
   - Start Command: `node app.js`

4. **Agregar variables de entorno** en Railway:
   ```
   MONGO_URI=mongodb+srv://ufologiateorica_db_user:cLgcnGkU2b2IFICc@uap-cluster.qoa9hel.mongodb.net/uap-db?retryWrites=true&w=majority&appName=UAP-Cluster
   JWT_SECRET=uap-secret-key-super-secure-2025-change-in-production
   HF_TOKEN=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
   N2YO_API_KEY=your_n2yo_api_key_here
   FLIGHTRADAR24_API_KEY=your_flightradar24_api_key_here
   OPENWEATHER_API_KEY=your_openweather_api_key_here
   BASE_URL=https://tu-app.railway.app
   ```

5. **Deploy**:
   - Railway desplegará automáticamente
   - Te dará una URL como: `https://tu-app.railway.app`

6. **Actualizar frontend**:
   - Cambia la API_URL en todos los archivos HTML del frontend
   - De: `http://localhost:3000`
   - A: `https://tu-app.railway.app`

7. **Push a GitHub**:
   ```bash
   cd /home/roberto/Escritorio/uap-analysys
   git add .
   git commit -m "Add Railway config and update CORS for Netlify"
   git push origin main
   ```

## Alternativas:

### Render.com (Gratis):
- https://render.com/
- Similar a Railway
- Conecta repo de GitHub
- Agrega variables de entorno

### Heroku (Requiere tarjeta, pero gratis):
- https://heroku.com/
- Instala Heroku CLI
- `heroku create uap-backend`
- `git push heroku main`

## Costos:
- **Railway**: $5/mes después de 500 horas gratis
- **Render**: Gratis con limitaciones
- **Heroku**: Requiere tarjeta, pero gratis hasta ciertos límites
