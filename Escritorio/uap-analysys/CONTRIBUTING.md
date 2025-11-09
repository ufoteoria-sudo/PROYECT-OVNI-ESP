# Guía de Contribución

¡Gracias por tu interés en contribuir al UAP Analysis System! 🛸

## Código de Conducta

- Sé respetuoso con otros colaboradores
- Mantén un ambiente profesional y constructivo
- Enfócate en lo mejor para el proyecto

## Cómo Contribuir

### 1. Fork y Clone

```bash
# Fork el proyecto en GitHub
# Luego clona tu fork
git clone https://github.com/TU-USUARIO/PROYECT-OVNI-ESP.git
cd uap-analysys
```

### 2. Crear una Rama

```bash
git checkout -b feature/mi-nueva-caracteristica
# O para correcciones de bugs
git checkout -b fix/descripcion-del-bug
```

### 3. Configurar el Entorno

```bash
# Instalar dependencias
cd server
npm install

# Configurar .env
cp .env.example .env
# Editar .env con tu configuración
```

### 4. Realizar Cambios

- Escribe código limpio y mantenible
- Sigue las convenciones existentes del proyecto
- Comenta código complejo cuando sea necesario
- Prueba tus cambios antes de hacer commit

### 5. Convenciones de Código

#### Backend (Node.js/Express)
- Usa `async/await` para operaciones asíncronas
- Siempre incluye manejo de errores en try/catch
- Retorna respuestas consistentes: `{ error: 'mensaje' }` para errores
- Usa códigos HTTP apropiados (400, 404, 409, 500)

#### Frontend (Vanilla JS)
- Funciones descriptivas y claras
- Escape de HTML para prevenir XSS
- Manejo de errores con mensajes al usuario
- Validación en cliente y servidor

### 6. Commits

Usa mensajes de commit descriptivos:

```bash
# Buenos ejemplos
git commit -m "Agregar validación de longitud mínima de username"
git commit -m "Corregir error al actualizar email duplicado"
git commit -m "Mejorar mensajes de error en frontend"

# Evitar
git commit -m "fix"
git commit -m "cambios"
git commit -m "update"
```

### 7. Push y Pull Request

```bash
# Push a tu fork
git push origin feature/mi-nueva-caracteristica
```

Luego crea un Pull Request en GitHub con:
- Título descriptivo
- Descripción de los cambios
- Screenshots si hay cambios visuales
- Referencia a issues relacionados

## Áreas de Contribución

### Backend
- Mejoras en validación de datos
- Optimización de queries a MongoDB
- Nuevos endpoints API
- Mejoras de seguridad

### Frontend
- Mejoras de UX/UI
- Responsive design
- Accesibilidad
- Validaciones adicionales

### Documentación
- Mejorar README.md
- Agregar ejemplos de código
- Documentar casos de uso
- Traducciones

### Testing
- Agregar tests unitarios
- Tests de integración
- Tests end-to-end

## Estructura de Archivos

```
uap-analysys/
├── frontend/           # Cliente web
│   └── index.html
├── server/            # Backend API
│   ├── app.js         # Configuración Express
│   ├── models/        # Modelos Mongoose
│   ├── routes/        # Rutas API
│   └── .env           # Variables de entorno
└── .github/           # Configuración GitHub
    └── copilot-instructions.md
```

## Testing Local

Antes de enviar un PR, asegúrate de que:

1. El servidor arranca sin errores
```bash
cd server
npm run dev
```

2. El frontend se conecta correctamente
- Abre `frontend/index.html` en el navegador
- Verifica que puedas crear, editar y borrar usuarios

3. No hay errores en la consola del navegador

## Reportar Bugs

Para reportar un bug, crea un issue con:

- Título descriptivo
- Pasos para reproducir
- Comportamiento esperado vs actual
- Screenshots si aplica
- Información del entorno (OS, navegador, versión Node.js)

## Solicitar Features

Para solicitar nuevas características:

- Explica claramente el caso de uso
- Describe cómo beneficiaría al proyecto
- Considera la complejidad de implementación

## Preguntas

Si tienes preguntas, puedes:
- Abrir un issue con la etiqueta "question"
- Revisar issues existentes
- Consultar la documentación en README.md

## Licencia

Al contribuir, aceptas que tus contribuciones serán licenciadas bajo la licencia MIT del proyecto.

---

¡Gracias por contribuir al UAP Analysis System! 🚀
