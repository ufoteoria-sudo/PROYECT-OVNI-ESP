# 📚 Guía Completa de Deployment

## Plataformas Soportadas

### 1. 🐳 Docker (Recomendado para mayor control)

#### Build local
```bash
cd /home/roberto/Escritorio/uap-analysys-testing
docker build -t uap-analysis:latest .
docker run -p 3000:3000 uap-analysis:latest
```

#### Con Docker Compose
```bash
docker-compose -f docker-compose-prod.yml up -d
```

#### Verificar
```bash
curl http://localhost:3000
```

---

### 2. ☁️ Heroku (Más simple)

#### Requisitos
```bash
npm install -g heroku
heroku login
```

#### Deploy
```bash
cd /home/roberto/Escritorio/uap-analysys-testing
heroku create uap-analysis-app
git push heroku testing:main
```

#### Verificar
```bash
heroku open
heroku logs --tail
```

---

### 3. 🚀 Railway (Recomendado - Rápido y fácil)

#### Pasos
1. Ir a https://railway.app
2. Conectar GitHub
3. Seleccionar repositorio `PROYECT-OVNI-ESP`
4. Railway detectará `railway.json` automáticamente
5. Deploy automático

#### Verificar
```bash
railway logs
```

---

### 4. 🌐 Render.com

#### Crear nuevo Web Service
1. Ir a https://render.com
2. New → Web Service
3. Conectar GitHub
4. Configurar:
   - Build Command: `cd server && npm install`
   - Start Command: `npm start`
   - Environment: Node
5. Deploy

#### Variables de entorno
```
PORT=3000
NODE_ENV=production
```

---

### 5. 🔵 Azure App Service

#### Con CLI
```bash
az login
az webapp create --resource-group myResourceGroup --plan myPlan --name myApp --runtime node|18
cd server
az webapp up --name myApp
```

---

### 6. 📦 DigitalOcean App Platform

#### Pasos
1. Ir a DigitalOcean Console
2. App Platform → Create App
3. Conectar GitHub
4. Configurar:
   - Source: GitHub
   - Repository: PROYECT-OVNI-ESP
   - Branch: testing
   - Build Command: `cd server && npm install`
   - Run Command: `npm start`

---

### 7. 🏃 Vercel (Para SPA + Serverless)

#### Instalación
```bash
npm i -g vercel
cd /home/roberto/Escritorio/uap-analysys-testing
vercel --prod
```

#### Configuración automática
- Detecta `vercel.json`
- Configura variables de entorno automáticamente

---

## Checklist Pre-Deployment

- [ ] Variables de entorno configuradas
- [ ] `.env.example` documentado
- [ ] Dockerfile compilable
- [ ] Dependencies instaladas: `npm install`
- [ ] npm start funciona localmente
- [ ] Tests pasan: `curl http://localhost:3000`
- [ ] CORS configurado correctamente
- [ ] Secrets no expuestos en repo
- [ ] .gitignore actualizado
- [ ] Ports configurados correctamente

---

## Variables de Entorno por Plataforma

### Heroku
```bash
heroku config:set PORT=3000 NODE_ENV=production
```

### Railway
Ir a Settings → Environment → Add Variable

### Render
Settings → Environment

### DigitalOcean
App Settings → Environment

---

## Monitoreo Post-Deploy

### Health Check
```bash
curl https://tu-app.com/api/free/nasa
```

### Logs
```bash
# Heroku
heroku logs --tail

# Railway
railway logs

# Docker
docker logs -f uap-analysis-app
```

---

## Troubleshooting

| Problema | Solución |
|----------|----------|
| Puerto ocupado | Cambiar PORT en .env |
| CORS error | Configurar CORS_ORIGIN |
| Módulos no encontrados | `npm install` en carpeta server |
| Build falla | Revisar `package.json` |
| App lenta | Aumentar memoria/CPU en hosting |

---

## Costos Estimados

| Plataforma | Tier Gratis | Costo Mínimo |
|-----------|-----------|------------|
| Heroku | No | $7/mes |
| Railway | $5 créditos gratis | $5-20/mes |
| Render | 0.25 SSD gratuita | Free-$7/mes |
| Vercel | Ilimitado* | Free-$20/mes |
| DigitalOcean | No | $4/mes |
| Azure | $200 crédito | Free-$20/mes |

*Vercel es limitado para backends Node.js

---

## Recomendación Final

**Para Testing**: Railway o Render (más simple)  
**Para Producción**: Docker en DigitalOcean u Azure  
**Para Rápido**: Heroku o Vercel
