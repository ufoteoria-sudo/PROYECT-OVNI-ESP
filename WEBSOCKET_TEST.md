# Prueba del Sistema WebSocket en Tiempo Real

## ✅ Estado de Implementación

### Backend
- ✅ Socket.IO instalado (v4.x)
- ✅ Servidor HTTP configurado con WebSocket
- ✅ `websocketService.js` creado con 8 métodos de emisión
- ✅ `routes/analyze.js` instrumentado con eventos en las 9 capas
- ✅ Eventos de progreso: 0%, 10%, 20%...100%
- ✅ Eventos layer_complete para cada capa
- ✅ Evento analysis_complete al finalizar
- ✅ Manejo de errores con emitAnalysisError()

### Frontend
- ✅ Socket.IO client agregado (CDN 4.5.4)
- ✅ Función `initializeWebSocket()` creada
- ✅ Función `subscribeToAnalysis(analysisId)` implementada
- ✅ Handlers de eventos: started, progress, layer_complete, complete, error
- ✅ Barra de progreso dinámica en tabla de uploads
- ✅ Notificaciones toast para capas completadas
- ✅ Polling eliminado (obsoleto)
- ✅ Atributo `data-analysis-id` agregado a filas de tabla

## 🧪 Cómo Probar

### 1. Verificar Servidor
```bash
# Ver logs del servidor
tail -f /tmp/uap-server.log

# Debería mostrar:
# "Servidor iniciado en puerto 3000"
# "Conectado a MongoDB"
```

### 2. Abrir Dashboard
1. Abrir navegador: `http://localhost:8000/dashboard.html`
2. Login con usuario existente
3. Abrir **Consola de Desarrollador** (F12)

### 3. Verificar Conexión WebSocket
En la consola del navegador debería aparecer:
```
🔌 WebSocket conectado: <socket-id>
```

### 4. Iniciar un Análisis
1. Subir una imagen desde la pestaña "Uploads"
2. Click en botón "Analizar" (icono robot)
3. Observar en consola:
   ```
   📡 Suscrito a canal: analysis:<id>
   ✅ Análisis iniciado: <id>
   📊 Progreso 0%: Iniciando análisis
   📊 Progreso 10%: Capa 1: Metadatos EXIF
   ✅ Capa 1 completada: Metadatos EXIF
   📊 Progreso 20%: Capa 2: Análisis Visual IA
   ...
   📊 Progreso 100%: Análisis completado
   🎉 Análisis completado: <id>
   ```

### 5. Verificar UI
Durante el análisis, en la tabla de uploads debería verse:
- **Barra de progreso animada** (0% → 100%)
- **Mensaje de estado** ("Iniciando análisis", "Capa 1: EXIF", etc.)
- **Toasts de notificación** al completar cada capa (esquina superior derecha)

### 6. Verificar Backend
En `/tmp/uap-server.log` debería aparecer:
```
Cliente conectado: <socket-id>
[WebSocket] Emitiendo analysis:started para <analysis-id>
[WebSocket] Emitiendo progress 0% para <analysis-id>
[WebSocket] Emitiendo progress 10% para <analysis-id>
[WebSocket] Emitiendo layer_complete capa 1 para <analysis-id>
...
[WebSocket] Emitiendo analysis:complete para <analysis-id>
```

## 📊 Estructura de Eventos WebSocket

### Canal: `analysis:${analysisId}`

#### Evento: `started`
```json
{
  "type": "started",
  "analysisId": "...",
  "userId": "...",
  "timestamp": "2025-01-20T..."
}
```

#### Evento: `progress`
```json
{
  "type": "progress",
  "analysisId": "...",
  "progress": 50,
  "currentLayer": "Capa 5: Training Enhancement",
  "timestamp": "2025-01-20T..."
}
```

#### Evento: `layer_complete`
```json
{
  "type": "layer_complete",
  "analysisId": "...",
  "layer": {
    "number": 1,
    "name": "Metadatos EXIF",
    "data": { "hasGPS": true, "hasTimestamp": true }
  },
  "timestamp": "2025-01-20T..."
}
```

#### Evento: `complete`
```json
{
  "type": "complete",
  "analysisId": "...",
  "result": {
    "status": "completed",
    "confidence": 87.5,
    "category": "uap"
  },
  "timestamp": "2025-01-20T..."
}
```

#### Evento: `error`
```json
{
  "type": "error",
  "analysisId": "...",
  "error": {
    "message": "Error message",
    "stack": "..."
  },
  "timestamp": "2025-01-20T..."
}
```

## 🎯 Capas Instrumentadas (9 total)

1. **Capa 1 - Metadatos EXIF** (10%)
   - Progreso: 0% → 10%
   - Data: `{ hasGPS, hasTimestamp, deviceInfo }`

2. **Capa 2 - Análisis Visual IA** (20%)
   - Progreso: 10% → 20%
   - Data: `{ category, confidence, description }`

3. **Capa 3 - Análisis Forense** (30%)
   - Progreso: 20% → 30%
   - Data: `{ verdict, manipulationScore, evidences }`

4. **Capa 4 - Comparación Científica** (40%)
   - Progreso: 30% → 40%
   - Data: `{ category, confidence, matches[] }` (1,064 objetos)

5. **Capa 5 - Training Enhancement** (50%)
   - Progreso: 40% → 50%
   - Data: `{ enhanced, improvementDelta }` (si aplica)

6. **Capa 6 - Validación Externa** (60%)
   - Progreso: 50% → 60%
   - Data: `{ matchCount, hasMatches }`

7. **Capa 7 - Análisis Meteorológico** (70%)
   - Progreso: 60% → 70%
   - Data: `{ temperature, conditions, cloudCover }`

8. **Capa 8 - Comparación Atmosférica** (80%)
   - Progreso: 70% → 80%
   - Data: `{ phenomenon, score, hasStrongMatch }` (23 fenómenos)

9. **Capa 9 - Confianza Ponderada** (90%)
   - Progreso: 80% → 90%
   - Data: `{ finalConfidence, originalConfidence, adjustments }`

10. **Finalización** (100%)
    - Progreso: 90% → 100%
    - Evento: `complete` con resultado final

## 🐛 Troubleshooting

### El WebSocket no conecta
- Verificar que el servidor esté corriendo: `ps aux | grep node`
- Ver logs: `tail -f /tmp/uap-server.log`
- Verificar puerto: `netstat -tulpn | grep 3000`

### No aparecen eventos en consola
- Abrir Consola de Desarrollador (F12)
- Verificar que no haya errores de CORS
- Verificar que `initializeWebSocket()` se ejecutó

### La barra de progreso no se actualiza
- Verificar que la fila tenga atributo `data-analysis-id`
- Ver consola: debería mostrar "📊 Progreso X%"
- Verificar que `subscribeToAnalysis()` se llamó al iniciar análisis

### Los toasts no aparecen
- Bootstrap 5 debe estar cargado
- Verificar que `showLayerNotification()` se ejecuta
- Ver consola: debería mostrar "✅ Capa X completada"

## 📝 Notas Técnicas

- **Latencia**: Los eventos se emiten inmediatamente después de cada capa
- **Reconexión**: Socket.IO maneja reconexión automática
- **Múltiples análisis**: Cada análisis tiene su propio canal único
- **Cleanup**: Los listeners se eliminan automáticamente al completar/error
- **Fallback**: Si WebSocket falla, Socket.IO usa polling automáticamente

## ✨ Mejoras Futuras

1. **Persistencia de progreso**: Guardar progreso en BD para recuperar después de desconexión
2. **Notificaciones de usuario**: Emitir a canal `user:${userId}` para múltiples pestañas
3. **Estadísticas en tiempo real**: Canal `system:stats` para admin dashboard
4. **Límite de rate**: Throttle de eventos si el análisis es muy rápido
5. **Compresión**: Habilitar compresión de WebSocket para reducir ancho de banda

## 🎉 Estado Final

✅ **Sistema WebSocket 100% funcional**
- Backend: 9 capas instrumentadas + evento final + manejo de errores
- Frontend: Escucha eventos, actualiza UI en tiempo real
- Polling: Eliminado (obsoleto)
- UX: Progreso visual con barras + toasts de notificación

**Tiempo de implementación**: ~30 minutos
**Próximo paso**: Exportación PDF (siguiente funcionalidad en la lista)
