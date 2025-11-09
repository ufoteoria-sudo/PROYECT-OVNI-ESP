# Configurar Token de Hugging Face para Análisis de IA

## ⚠️ Problema Actual

El token actual tiene permisos insuficientes (error 403):
```
This authentication method does not have sufficient permissions to call Inference Providers
```

## ✅ Solución: Crear Token con Permisos Correctos

### Paso 1: Ir a Hugging Face
Abre: https://huggingface.co/settings/tokens

### Paso 2: Crear Nuevo Token
1. Click en **"New token"**
2. **Name:** `UAP Analysis System`
3. **Type:** Selecciona **"Write"** o **"Fine-grained"**
4. Si eliges Fine-grained, asegúrate de marcar:
   - ✅ **"Make calls to the serverless Inference API"**
   - ✅ **"Read access to contents of all repos"**

### Paso 3: Copiar Token
- El token empieza con `hf_...`
- Copia todo el token completo

### Paso 4: Actualizar .env
Edita el archivo `/home/roberto/Escritorio/uap-analysys/server/.env`:

```bash
HF_TOKEN=hf_TU_NUEVO_TOKEN_AQUI
```

### Paso 5: Reiniciar Servidor
```bash
cd /home/roberto/Escritorio/uap-analysys/server
pkill -f "node app.js"
node app.js > /tmp/uap-server.log 2>&1 &
```

## 🔄 Alternativa: Modo Sin IA (Actual)

Mientras tanto, el sistema funciona en **modo básico**:
- ✅ Extrae datos EXIF (cámara, ubicación, fecha)
- ✅ Detecta manipulación de imágenes
- ✅ Genera análisis básico
- ❌ Sin análisis de IA avanzado

## 🆓 ¿Es Gratis?

**SÍ**, Hugging Face Inference API es **100% GRATUITO** para modelos públicos con límites razonables:
- ✅ Sin tarjeta de crédito
- ✅ Sin suscripción
- ⚠️ Con rate limits (suficiente para desarrollo)

## 📚 Modelos Disponibles (Gratuitos)

Una vez configurado el token, podrás usar:
- **meta-llama/Llama-3.2-11B-Vision-Instruct** (actual)
- **Salesforce/blip-image-captioning-large**
- **nlpconnect/vit-gpt2-image-captioning**
- Y muchos más...

## 🔗 Enlaces Útiles

- Crear token: https://huggingface.co/settings/tokens
- Docs Inference API: https://huggingface.co/docs/api-inference/index
- Modelos de Visión: https://huggingface.co/models?pipeline_tag=image-classification

---

**Nota:** El análisis básico actual es suficiente para probar todas las funcionalidades del sistema. El análisis con IA es opcional pero recomendado para resultados más precisos.
