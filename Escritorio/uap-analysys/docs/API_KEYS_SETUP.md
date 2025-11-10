# 🔑 Guía Completa - Configuración de API Keys

Esta guía te ayudará a obtener y configurar las API keys necesarias para activar todas las funcionalidades del sistema UAP Analysis.

---

## 📊 Estado Actual del Sistema

### Sin API Keys (Estado Actual)
- ✅ **8/9 capas funcionando** (89%)
- ⚠️ Capa 7 (Meteorológica): Funciona con fallback sin datos reales
- ❌ Capa 8 (Atmosférica): No funciona sin datos meteorológicos
- ⚠️ Capa 2 (Visual AI): Análisis básico sin OpenAI
- ⚠️ Capa 6 (Externa): Satélites no disponibles sin N2YO

### Con API Keys Configuradas
- ✅ **9/9 capas funcionando** (100%)
- ✅ Datos meteorológicos reales en tiempo real
- ✅ Comparación con 23 fenómenos atmosféricos
- ✅ Análisis AI avanzado con GPT-4 Vision
- ✅ Tracking completo de satélites

---

## 🌐 APIs Recomendadas

### 1. OpenWeatherMap (ALTA PRIORIDAD) ⭐⭐⭐
**Activa**: Capas 7 y 8

**Plan Gratuito**: 1,000 llamadas/día
**Costo**: $0
**Tiempo de registro**: 5 minutos
**Activación**: Inmediata

#### ¿Para qué se usa?
- Temperatura, condiciones climáticas, nubes
- Visibilidad y análisis de calidad
- Probabilidad de fenómenos ópticos atmosféricos
- Comparación con 23 fenómenos catalogados (auroras, halos, rayos, etc.)
- Advertencias sobre condiciones que expliquen avistamientos

#### Cómo Obtener
1. Ir a: https://openweathermap.org/api
2. Click en "Sign Up" (esquina superior derecha)
3. Completar formulario:
   - Email
   - Username
   - Password
4. Verificar email
5. Login en: https://home.openweathermap.org/
6. Ir a "API keys" en el menú
7. Copiar la API key generada automáticamente
   - Formato: `a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6`

#### Configurar en el Sistema
```bash
# Editar server/.env
nano server/.env

# Agregar:
OPENWEATHERMAP_API_KEY=tu_api_key_aqui
```

#### Verificar
```bash
# Desde el directorio del proyecto
node server/scripts/testApiKeys.js openweathermap
```

---

### 2. N2YO (MEDIA PRIORIDAD) ⭐⭐
**Activa**: Capa 6 (Tracking de satélites)

**Plan Gratuito**: 1,000 transacciones/hora
**Costo**: $0
**Tiempo de registro**: 3 minutos
**Activación**: Inmediata

#### ¿Para qué se usa?
- Tracking de satélites visibles en tiempo real
- Detección de Starlink, ISS, Iridium flares
- Coordenadas y magnitud de satélites
- Verificación de avistamientos satelitales

#### Cómo Obtener
1. Ir a: https://www.n2yo.com/api/
2. Click en "Request API Key"
3. Completar formulario:
   - Name
   - Email
   - Usage (seleccionar "Personal/Non-commercial")
4. Verificar email
5. Copiar API key del email
   - Formato: `ABC123-DEF456-GHI789-JKL012`

#### Configurar en el Sistema
```bash
# Editar server/.env
nano server/.env

# Agregar:
N2YO_API_KEY=tu_api_key_aqui
```

#### Verificar
```bash
node server/scripts/testApiKeys.js n2yo
```

---

### 3. OpenAI GPT-4 Vision (BAJA PRIORIDAD) ⭐
**Activa**: Capa 2 (Análisis Visual Avanzado)

**Plan Gratuito**: NO (requiere pago)
**Costo**: ~$0.01 por análisis (GPT-4 Vision)
**Tiempo de registro**: 10 minutos
**Activación**: Inmediata si tienes créditos

#### ¿Para qué se usa?
- Análisis visual avanzado con IA
- Descripción detallada de objetos en imágenes
- Detección de características inusuales
- Categorización automática inteligente
- Confianza mejorada en identificación

#### Cómo Obtener
1. Ir a: https://platform.openai.com/signup
2. Crear cuenta con:
   - Email
   - Verificación de teléfono (requerido)
3. Agregar método de pago en: https://platform.openai.com/account/billing
4. Ir a: https://platform.openai.com/api-keys
5. Click en "Create new secret key"
6. Copiar la API key (solo se muestra una vez)
   - Formato: `sk-proj-abcd1234efgh5678ijkl9012mnop3456qrst7890uvwx1234yz56`

#### Configurar en el Sistema
```bash
# Editar server/.env
nano server/.env

# Agregar:
OPENAI_API_KEY=sk-proj-...tu_api_key_completa
```

#### Verificar
```bash
node server/scripts/testApiKeys.js openai
```

⚠️ **NOTA**: OpenAI es de pago. El sistema funciona sin ella con análisis básico.

---

## 🚀 Configuración Rápida (Recomendado)

### Script Interactivo
```bash
cd server
node scripts/configureApiKeys.js
```

Este script te guiará paso a paso:
1. Detecta qué API keys faltan
2. Te pregunta si quieres configurar cada una
3. Valida el formato de las keys
4. Prueba la conexión con cada API
5. Actualiza automáticamente el archivo `.env`
6. Reinicia el servidor si está corriendo

---

## 📝 Configuración Manual

### 1. Editar .env
```bash
cd server
nano .env
```

### 2. Agregar las Keys
```env
# APIs Externas (OPCIONAL - pero recomendado)
OPENWEATHERMAP_API_KEY=a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6
N2YO_API_KEY=ABC123-DEF456-GHI789-JKL012
OPENAI_API_KEY=sk-proj-abcd1234efgh5678ijkl9012mnop3456

# Nota: Solo agrega las que hayas obtenido
```

### 3. Guardar y Salir
```
Ctrl + O  (guardar)
Enter
Ctrl + X  (salir)
```

### 4. Reiniciar Servidor
```bash
pkill -f "node.*app.js"
cd ..
nohup node server/app.js > /tmp/uap-server.log 2>&1 &
```

---

## ✅ Verificación de APIs

### Script de Verificación Completo
```bash
cd server
node scripts/testApiKeys.js all
```

### Verificación Individual
```bash
# OpenWeatherMap
node scripts/testApiKeys.js openweathermap

# N2YO
node scripts/testApiKeys.js n2yo

# OpenAI
node scripts/testApiKeys.js openai
```

### Salida Esperada (Exitosa)
```
🔑 Testing API Keys...

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🌤️  OpenWeatherMap API
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✅ API Key configurada
✅ Conexión exitosa
📍 Datos de prueba recibidos:
   Location: London, GB
   Temp: 12.5°C
   Conditions: Clear sky

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🛰️  N2YO API
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✅ API Key configurada
✅ Conexión exitosa
📡 Satélites detectados: 3
   - ISS (ZARYA)
   - STARLINK-1234
   - IRIDIUM 33

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🤖 OpenAI API
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✅ API Key configurada
✅ Conexión exitosa
💰 Créditos disponibles: $5.00

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✅ TODAS LAS APIS CONFIGURADAS CORRECTAMENTE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

---

## 🐛 Troubleshooting

### Error: "Invalid API Key"
- Verificar que la key no tenga espacios al inicio/final
- Verificar que esté completa (se copió todo)
- Para OpenAI, verificar que empiece con `sk-`
- Regenerar la key si es necesario

### Error: "API Key not found"
- Verificar que el archivo `.env` esté en `server/.env`
- Verificar permisos: `chmod 600 server/.env`
- Reiniciar el servidor después de editar

### Error: "Rate limit exceeded"
- OpenWeatherMap: 1000 llamadas/día
- N2YO: 1000 transacciones/hora
- Esperar o actualizar a plan de pago

### Error: "Network timeout"
- Verificar conexión a internet
- Verificar que no haya firewall bloqueando
- Probar más tarde si el servicio está caído

### OpenWeatherMap no retorna datos
- La activación puede tardar hasta 2 horas después del registro
- Verificar en: https://home.openweathermap.org/api_keys
- Estado debe ser "Active"

---

## 📊 Comparación de Planes

### OpenWeatherMap
| Plan | Llamadas/día | Costo | Recomendado para |
|------|--------------|-------|------------------|
| Free | 1,000 | $0 | Desarrollo y pruebas |
| Startup | 100,000 | $40/mes | Producción pequeña |
| Developer | 1,000,000 | $180/mes | Producción mediana |

### N2YO
| Plan | Transacciones/hora | Costo | Recomendado para |
|------|-------------------|-------|------------------|
| Free | 1,000 | $0 | Todos los casos |

### OpenAI
| Modelo | Costo por 1K tokens | Recomendado para |
|--------|---------------------|------------------|
| GPT-4 Vision | ~$0.01/imagen | Análisis detallado |
| GPT-3.5 Turbo | ~$0.001/imagen | Análisis básico |

---

## 💡 Recomendaciones

### Prioridad de Configuración
1. **OpenWeatherMap** (ALTA) - Activa 2 capas completas
2. **N2YO** (MEDIA) - Mejora capa 6
3. **OpenAI** (BAJA) - Mejora capa 2 (pero tiene costo)

### Plan Recomendado
- **Desarrollo/Pruebas**: Solo OpenWeatherMap (gratis)
- **Producción Básica**: OpenWeatherMap + N2YO (gratis)
- **Producción Completa**: Las 3 APIs (OpenAI con costo)

### Seguridad
- ✅ Nunca subir `.env` a Git (ya está en `.gitignore`)
- ✅ Usar variables de entorno en producción
- ✅ Rotar keys periódicamente
- ✅ Monitorear uso para detectar abusos
- ✅ Limitar keys solo a IPs necesarias (en dashboard de cada API)

---

## 📈 Impacto en el Sistema

### Antes (Sin APIs)
```
Análisis Completo: 4-5 segundos
Capas Activas: 8/9 (89%)
Precisión: Media
Datos en Tiempo Real: No
```

### Después (Con APIs)
```
Análisis Completo: 5-7 segundos (+2s por APIs externas)
Capas Activas: 9/9 (100%)
Precisión: Alta
Datos en Tiempo Real: Sí
```

### Beneficios Concretos
- ✅ Detección de fenómenos atmosféricos reales
- ✅ Correlación con condiciones meteorológicas actuales
- ✅ Verificación de satélites visibles en el momento
- ✅ Análisis visual detallado con IA
- ✅ Mayor confianza en identificaciones
- ✅ Menos falsos positivos

---

## 🔄 Actualizar/Rotar Keys

### Cambiar API Key
1. Obtener nueva key del dashboard del proveedor
2. Editar `server/.env`
3. Reemplazar la key antigua
4. Reiniciar servidor
5. Verificar con `node scripts/testApiKeys.js all`

### Revocar Key Comprometida
1. Ir al dashboard del proveedor
2. Revocar/eliminar la key comprometida
3. Generar nueva key
4. Actualizar en `.env`
5. Verificar funcionamiento

---

## 📞 Soporte

### Problemas con APIs
- **OpenWeatherMap**: https://openweathermap.org/faq
- **N2YO**: https://www.n2yo.com/api/#faq
- **OpenAI**: https://help.openai.com/

### Documentación Oficial
- **OpenWeatherMap**: https://openweathermap.org/api/one-call-3
- **N2YO**: https://www.n2yo.com/api/
- **OpenAI**: https://platform.openai.com/docs/

---

**Última actualización**: 9 de noviembre de 2025
**Versión**: 1.0
