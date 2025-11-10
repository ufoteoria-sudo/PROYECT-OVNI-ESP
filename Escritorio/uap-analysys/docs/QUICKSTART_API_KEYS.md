# 🚀 Guía Rápida - Configuración de API Keys

## Estado Actual

✅ **Scripts creados y listos para usar**:
- `server/scripts/configureApiKeys.js` - Configuración interactiva
- `server/scripts/testApiKeys.js` - Verificación de conexión

## Uso

### 1️⃣ Configurar API Keys (Recomendado)

```bash
cd /home/roberto/Escritorio/uap-analysys
node server/scripts/configureApiKeys.js
```

**¿Qué hace?**
- Te guía paso a paso para obtener cada API key
- Actualiza automáticamente `server/.env`
- Crea backup antes de modificar
- Muestra enlaces y pasos exactos

**APIs disponibles:**
1. **OpenWeatherMap** (GRATIS, ALTA PRIORIDAD)
   - 1,000 llamadas/día
   - Activa capas 7 y 8 (Meteorológica + Atmosférica)
   - Tiempo: 5 minutos
   - URL: https://openweathermap.org/api

2. **N2YO** (GRATIS, MEDIA PRIORIDAD)
   - 1,000 transacciones/hora
   - Mejora capa 6 (tracking satélites)
   - Tiempo: 3 minutos + espera email
   - URL: https://www.n2yo.com/api/

3. **OpenAI** (PAGO, BAJA PRIORIDAD)
   - ~$0.01 por análisis
   - Mejora capa 2 (análisis IA avanzado)
   - Tiempo: 10 minutos
   - URL: https://platform.openai.com/api-keys

### 2️⃣ Verificar Configuración

Después de configurar las keys:

```bash
# Verificar todas
node server/scripts/testApiKeys.js

# Verificar una específica
node server/scripts/testApiKeys.js openweathermap
node server/scripts/testApiKeys.js n2yo
node server/scripts/testApiKeys.js openai
```

**¿Qué hace?**
- Prueba conexión real con cada API
- Valida formato de las keys
- Muestra datos de ejemplo
- Detecta problemas (key inválida, sin créditos, límites)

**Salida esperada:**
```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🌤️  OpenWeatherMap API
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

✅ API Key configurada
✅ Conexión exitosa
ℹ️  📍 Datos de prueba recibidos:
   Location: London, GB
   Temp: 12.5°C
   Conditions: clear sky
   Clouds: 0%
   Visibility: 10km
```

### 3️⃣ Reiniciar el Servidor

Para que los cambios surtan efecto:

```bash
cd server
npm run dev
```

### 4️⃣ Probar el Sistema

1. Abrir dashboard: http://localhost:8000/dashboard.html
2. Login: `admin@uap.com` / `Admin123!`
3. Subir imagen de prueba: `/tmp/test_uap_nyc.jpg`
4. Verificar resultados en las 9 capas

## Resultados Esperados

### Sin API Keys (Estado Actual)
- ✅ 8/9 capas funcionando (89%)
- ⚠️ Capa 8 (Atmosférica) limitada
- ⚠️ Capa 7 (Meteorológica) usa datos mock

### Con OpenWeatherMap
- ✅ 9/9 capas funcionando (100%)
- ✅ Datos meteorológicos reales
- ✅ Comparación atmosférica completa
- ✅ 23 fenómenos atmosféricos detectables

### Con N2YO (Adicional)
- ✅ Tracking de satélites en tiempo real
- ✅ Capa 6 mejorada (posición exacta)
- ✅ Validación externa más precisa

### Con OpenAI (Adicional)
- ✅ Análisis visual avanzado con GPT-4 Vision
- ✅ Capa 2 mejorada (descripción detallada)
- ✅ Mayor precisión en identificación

## Troubleshooting

### Error: "OPENWEATHERMAP_API_KEY is not defined"
```bash
# Verificar que .env existe
ls -la server/.env

# Si no existe, ejecutar configuración
node server/scripts/configureApiKeys.js
```

### Error: "API Key inválida (401)"
```bash
# Verificar la key en el panel de la API
# OpenWeatherMap: https://home.openweathermap.org/api_keys
# N2YO: Revisar email con la key
# OpenAI: https://platform.openai.com/api-keys

# Reconfigurar
node server/scripts/configureApiKeys.js
```

### Error: "Límite excedido (429)"
- **OpenWeatherMap**: 1,000 llamadas/día consumidas
- **N2YO**: 1,000 transacciones/hora consumidas
- **OpenAI**: Rate limit o sin créditos

Solución: Esperar o actualizar plan

### Las keys no funcionan después de configurarlas
```bash
# 1. Verificar que .env tiene las keys
cat server/.env | grep API_KEY

# 2. Reiniciar el servidor (importante)
# Ctrl+C en la terminal del servidor
cd server && npm run dev

# 3. Probar de nuevo
```

## Configuración Manual (Alternativa)

Si prefieres no usar el script interactivo:

1. Crear/editar `server/.env`:
```bash
nano server/.env
```

2. Agregar las keys:
```env
# External APIs
OPENWEATHERMAP_API_KEY=tu_key_aqui
N2YO_API_KEY=tu_key_aqui
OPENAI_API_KEY=sk-tu_key_aqui
```

3. Guardar (Ctrl+O, Enter, Ctrl+X)

4. Verificar:
```bash
node server/scripts/testApiKeys.js
```

## Prioridad Recomendada

1. ⭐ **OpenWeatherMap** (5 min, GRATIS)
   - Mayor impacto: 8/9 → 9/9 capas
   - Totalmente gratuito
   - Activación inmediata

2. ⭐ **N2YO** (3 min + email, GRATIS)
   - Mejora capa de validación externa
   - Totalmente gratuito
   - Espera email (puede tardar)

3. ⚪ **OpenAI** (10 min, PAGO)
   - Mejora marginal
   - Requiere tarjeta de crédito
   - Costo ~$0.01/análisis
   - **OPCIONAL** - Solo si necesitas IA avanzada

## Próximos Pasos

Después de configurar las APIs:

- [ ] Verificar que funcionan con `testApiKeys.js`
- [ ] Reiniciar servidor
- [ ] Probar con imagen de prueba
- [ ] Ver mejoras en dashboard
- [ ] Continuar con otras funcionalidades:
  - Biblioteca visual de fenómenos
  - Notificaciones WebSocket
  - Exportación PDF

## Documentación Completa

- **Configuración detallada**: `docs/API_KEYS_SETUP.md`
- **Resultados de pruebas**: `test/RESULTADO_PRUEBAS.md`
- **Probar frontend**: `test/PROBAR_FRONTEND.md`

---

## 📞 Ayuda Rápida

```bash
# Ver ayuda del script de configuración
node server/scripts/configureApiKeys.js --help

# Ver ayuda del script de verificación
node server/scripts/testApiKeys.js --help

# Verificar estado de las capas
node test/test_api_complete.py
```

**Tiempo total estimado**: 
- Solo OpenWeatherMap: **5 minutos** ⚡
- OpenWeatherMap + N2YO: **10 minutos** ⚡
- Todas las APIs: **20 minutos** 🔥

**¡Listo para mejorar tu sistema de 89% a 100%!** 🚀
