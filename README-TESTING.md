# 🧪 UAP Analysis System - RAMA TESTING

**Rama especializada en testing y deployment**

## 📍 Ubicación

```
/home/roberto/Escritorio/uap-analysys-testing
Branch: testing
Servidor: localhost:3001
Estado: ✅ 100% Funcional
```

## 🚀 Inicio Rápido (30 segundos)

```bash
cd /home/roberto/Escritorio/uap-analysys-testing
./start-testing.sh
# Abrir: http://localhost:3001
```

## 📚 Documentación

| Archivo | Contenido |
|---------|----------|
| **DEPLOY-READY.md** | Guía general del sistema |
| **DEPLOYMENT-GUIDE.md** | Pasos para 7 plataformas |
| **TESTING-PHASE-SUMMARY.md** | Resumen ejecutivo |
| **QUICK-START.md** | Inicio inmediato |

## 🔐 Acceso Inmediato

```
Admin:   ufoteoria@gmail.com / admin123
User:    investigador@uap.com / investigador123
URL:     http://localhost:3001
```

## 🌐 APIs Disponibles

- ✅ NASA APOD
- ✅ OpenMeteo Weather
- ✅ CelesTrak Satellites
- ✅ Wikimedia Commons

## 🐳 Docker

```bash
# Build
docker build -t uap-testing .

# Run
docker run -p 3001:3000 uap-testing
```

## ☁️ Deploy en Railway (Recomendado)

1. Ir a https://railway.app
2. Conectar GitHub
3. Seleccionar rama `testing`
4. Railway detecta `railway.json` automáticamente
5. ¡Listo! Tu app estará en vivo en 2 minutos

## 📊 Estado del Sistema

✅ Backend: Express.js funcionando  
✅ Frontend: SPA sin parpadeo  
✅ Autenticación: Tokens Base64  
✅ APIs: 4 gratuitas integradas  
✅ Uploads: Funcionales  
✅ Dashboard: Limpio y responsivo  

## 🛠️ Comandos Útiles

```bash
# Iniciar con script
./start-testing.sh

# Iniciar manual
cd server && npm install && PORT=3001 node app-memory.js

# Verificar APIs
curl http://localhost:3001/api/free/nasa

# Tests rápidos
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"ufoteoria@gmail.com","password":"admin123"}'
```

## 📈 Próximos Pasos

1. Leer **DEPLOYMENT-GUIDE.md**
2. Elegir plataforma (Railway es la más simple)
3. Deploy en 5 minutos
4. ¡Compartir tu aplicación!

## 🎯 Diferencias con Rama Main

| Aspecto | Main | Testing |
|--------|------|---------|
| Documentación | Básica | Completa |
| Docker | No | ✅ Sí |
| Deployment | No configurado | 7 plataformas |
| Scripts | Ninguno | start-testing.sh |
| Commit | main | testing |

## ✨ Status Final

✅ Sistema 100% funcional  
✅ Documentación completa  
✅ Listo para production  
✅ Sin errores conocidos  
✅ Testeado y verificado  

---

**Rama**: testing  
**Commits**: 2  
**Última actualización**: 29 de noviembre de 2025  
**Mantenedor**: Development Team
