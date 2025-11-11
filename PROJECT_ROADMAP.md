# 🛸 PROYECT-OVNI-ESP - Roadmap Completo

## 📋 Resumen del Proyecto

Plataforma de análisis de objetos voladores no identificados (OVNI/UAP) con:
- Análisis de imágenes/vídeos con IA (Claude Vision)
- Extracción y validación de datos EXIF
- Comparación con base de datos de fenómenos conocidos
- Generación de informes profesionales en PDF
- Sistema de usuarios y suscripciones
- Panel administrativo

---

## 🏗️ Arquitectura del Sistema

### Stack Tecnológico

**Frontend:**
- React 18+ con TypeScript
- TailwindCSS para estilos
- shadcn/ui para componentes
- React Router para navegación
- Axios para peticiones HTTP
- Zustand o Context API para estado global

**Backend:**
- Node.js + Express (ya implementado)
- MongoDB + Mongoose (ya configurado con Atlas)
- JWT para autenticación
- Multer para subida de archivos
- bcrypt para hash de contraseñas

**APIs y Servicios:**
- Claude Vision (Anthropic) para análisis de imágenes
- exiftool / exif-parser para extracción EXIF
- jsPDF para generación de PDFs
- SendGrid para emails (o Nodemailer + Ethereal en dev)
- Stripe para pagos

---

## 📊 Modelos de Base de Datos

### 1. User (Usuario)
```javascript
{
  _id: ObjectId,
  username: String (único, requerido),
  email: String (único, requerido),
  password: String (hash, requerido),
  firstName: String,
  lastName: String,
  role: String (enum: ['user', 'admin'], default: 'user'),
  subscription: {
    status: String (enum: ['free', 'active', 'expired']),
    plan: String ('annual'),
    startDate: Date,
    endDate: Date,
    stripeCustomerId: String,
    stripeSubscriptionId: String
  },
  profile: {
    phone: String,
    country: String,
    bio: String
  },
  createdAt: Date,
  updatedAt: Date
}
```

### 2. Analysis (Análisis)
```javascript
{
  _id: ObjectId,
  userId: ObjectId (ref: 'User'),
  fileName: String,
  fileType: String (enum: ['image', 'video']),
  filePath: String,
  fileSize: Number,
  uploadDate: Date,
  
  // EXIF Data
  exifData: {
    camera: String,
    location: {
      latitude: Number,
      longitude: Number,
      altitude: Number
    },
    captureDate: Date,
    captureTime: String,
    isManipulated: Boolean,
    manipulationScore: Number (0-100)
  },
  
  // AI Analysis
  aiAnalysis: {
    provider: String ('claude', 'openai'),
    model: String,
    description: String,
    detectedObjects: [String],
    confidence: Number (0-100),
    processedDate: Date
  },
  
  // Matching Results
  matchResults: [{
    objectId: ObjectId (ref: 'UFODatabase'),
    matchPercentage: Number (0-100),
    category: String,
    reason: String
  }],
  
  status: String (enum: ['pending', 'analyzing', 'completed', 'error']),
  createdAt: Date,
  updatedAt: Date
}
```

### 3. Report (Informe)
```javascript
{
  _id: ObjectId,
  analysisId: ObjectId (ref: 'Analysis'),
  userId: ObjectId (ref: 'User'),
  
  // User Input
  reportData: {
    situation: String,
    location: String,
    datetime: Date,
    contactInfo: String,
    witnesses: Number,
    duration: String,
    additionalNotes: String
  },
  
  // Generated Report
  pdfPath: String,
  pdfUrl: String,
  generatedDate: Date,
  sentByEmail: Boolean,
  emailSentDate: Date,
  
  status: String (enum: ['draft', 'generated', 'sent']),
  createdAt: Date,
  updatedAt: Date
}
```

### 4. UFODatabase (Base de Datos de Objetos)
```javascript
{
  _id: ObjectId,
  name: String (requerido),
  category: String (enum: [
    'celestial',      // Objetos celestes (Luna, Venus, meteoros)
    'aircraft',       // Aeronaves convencionales
    'satellite',      // Satélites artificiales
    'drone',          // Drones comerciales
    'balloon',        // Globos meteorológicos
    'natural',        // Fenómenos naturales (relámpagos, nubes)
    'uap',            // UAP/OVNI verificados
    'unknown'         // Sin categorizar
  ]),
  description: String,
  characteristics: {
    shape: String,
    color: String,
    size: String,
    behavior: String,
    speed: String
  },
  visualPatterns: [String], // Patrones visuales para matching
  images: [String], // URLs de imágenes de referencia
  frequency: Number, // Frecuencia de avistamientos
  isVerified: Boolean,
  addedBy: ObjectId (ref: 'User'),
  createdAt: Date,
  updatedAt: Date
}
```

---

## 🗂️ Estructura de Carpetas

```
uap-analysys/
├── client/                      # Frontend React
│   ├── public/
│   │   ├── index.html
│   │   └── assets/
│   ├── src/
│   │   ├── components/          # Componentes reutilizables
│   │   │   ├── common/          # Botones, inputs, modales
│   │   │   ├── layout/          # Header, Sidebar, Footer
│   │   │   └── ui/              # shadcn/ui components
│   │   ├── pages/               # Páginas principales
│   │   │   ├── Landing.tsx
│   │   │   ├── Login.tsx
│   │   │   ├── Register.tsx
│   │   │   ├── Dashboard/
│   │   │   │   ├── Upload.tsx
│   │   │   │   ├── Analysis.tsx
│   │   │   │   ├── ReportForm.tsx
│   │   │   │   ├── History.tsx
│   │   │   │   └── Gallery.tsx
│   │   │   ├── Admin/
│   │   │   │   ├── Dashboard.tsx
│   │   │   │   ├── Users.tsx
│   │   │   │   └── Database.tsx
│   │   │   ├── Subscription.tsx
│   │   │   └── NotFound.tsx
│   │   ├── hooks/               # Custom hooks
│   │   ├── services/            # API calls
│   │   ├── context/             # Context providers
│   │   ├── utils/               # Utilidades
│   │   ├── types/               # TypeScript types
│   │   ├── App.tsx
│   │   └── main.tsx
│   ├── package.json
│   └── tsconfig.json
│
├── server/                      # Backend (ya existente)
│   ├── config/                  # Configuraciones
│   │   ├── database.js
│   │   ├── stripe.js
│   │   ├── email.js
│   │   └── claude.js
│   ├── models/                  # Modelos Mongoose
│   │   ├── User.js
│   │   ├── Analysis.js
│   │   ├── Report.js
│   │   └── UFODatabase.js
│   ├── routes/                  # Rutas API
│   │   ├── auth.js              # Login, register, logout
│   │   ├── user.js              # CRUD usuarios (ya existe)
│   │   ├── upload.js            # Subida de archivos
│   │   ├── analysis.js          # Análisis de imágenes
│   │   ├── report.js            # Generación de informes
│   │   ├── ufo-database.js      # Gestión BD objetos
│   │   ├── subscription.js      # Stripe webhooks
│   │   └── admin.js             # Rutas admin
│   ├── middleware/              # Middlewares
│   │   ├── auth.js              # Verificar JWT
│   │   ├── admin.js             # Verificar rol admin
│   │   └── upload.js            # Multer config
│   ├── services/                # Lógica de negocio
│   │   ├── aiAnalysis.js        # Claude Vision
│   │   ├── exifExtractor.js     # Extraer EXIF
│   │   ├── matching.js          # Comparar con BD
│   │   ├── pdfGenerator.js      # Generar PDFs
│   │   ├── emailService.js      # Envío de emails
│   │   └── stripeService.js     # Pagos
│   ├── utils/                   # Utilidades
│   │   ├── validators.js
│   │   └── helpers.js
│   ├── uploads/                 # Archivos subidos
│   ├── reports/                 # PDFs generados
│   ├── seeds/                   # Datos de prueba
│   │   └── ufoDatabase.seed.js
│   ├── app.js
│   ├── .env
│   └── package.json
│
├── docs/                        # Documentación
├── .github/
│   └── copilot-instructions.md
├── .gitignore
├── README.md
└── PROJECT_ROADMAP.md (este archivo)
```

---

## 🚀 Fases de Desarrollo

### **Fase 1: Fundamentos (Semanas 1-2)** ✅ COMPLETADO
- [x] Setup inicial del proyecto
- [x] Conexión MongoDB Atlas
- [x] Sistema básico de usuarios (CRUD)
- [x] API REST funcionando

### **Fase 2: Autenticación y Usuarios (Semana 3)**
- [ ] Modelo User ampliado (roles, suscripción)
- [ ] Sistema de registro con hash de contraseña
- [ ] Login con JWT
- [ ] Middleware de autenticación
- [ ] Rutas protegidas
- [ ] Perfil de usuario editable

### **Fase 3: Subida y Almacenamiento (Semana 4)**
- [ ] Configurar Multer para imágenes/vídeos
- [ ] Validación de tipos de archivo
- [ ] Límites de tamaño
- [ ] Almacenamiento local organizado
- [ ] Modelo Analysis
- [ ] API de subida

### **Fase 4: Análisis con IA (Semanas 5-6)**
- [ ] Integración Claude Vision API
- [ ] Extracción de datos EXIF
- [ ] Validación de manipulación de imágenes
- [ ] Modelo UFODatabase con datos seed
- [ ] Algoritmo de matching/comparación
- [ ] Cálculo de porcentaje de coincidencia

### **Fase 5: Informes y PDFs (Semana 7)**
- [ ] Modelo Report
- [ ] Formulario de redacción de informe
- [ ] Generación de PDF con jsPDF
- [ ] Template profesional de informe
- [ ] Envío por email con SendGrid/Nodemailer

### **Fase 6: Frontend React (Semanas 8-10)**
- [ ] Setup Vite + React + TypeScript
- [ ] TailwindCSS y shadcn/ui
- [ ] Landing page atractiva
- [ ] Login y registro
- [ ] Dashboard con sidebar
- [ ] Página de subida con drag & drop
- [ ] Vista de análisis con resultados
- [ ] Formulario de informe
- [ ] Historial de análisis
- [ ] Galería de imágenes

### **Fase 7: Panel Admin (Semana 11)**
- [ ] Dashboard administrativo
- [ ] Gestión de usuarios
- [ ] CRUD de UFODatabase
- [ ] Estadísticas del sistema

### **Fase 8: Suscripciones (Semana 12)**
- [ ] Integración Stripe
- [ ] Checkout de suscripción anual
- [ ] Webhooks de Stripe
- [ ] Gestión de membresías
- [ ] Restricciones por plan

### **Fase 9: Extras y Pulido (Semana 13)**
- [ ] Página 404 personalizada
- [ ] Widgets opcionales (reloj, etc.)
- [ ] Optimización de rendimiento
- [ ] Testing básico
- [ ] Documentación

### **Fase 10: Despliegue (Semana 14)**
- [ ] Configuración de producción
- [ ] Deploy backend (Railway/Render)
- [ ] Deploy frontend (Vercel/Netlify)
- [ ] Configuración de dominio
- [ ] SSL y seguridad

---

## 📝 Próximos Pasos Inmediatos

### 1. **Ampliar Modelo User** (Hoy)
Actualizar `server/models/User.js` con todos los campos necesarios

### 2. **Sistema de Autenticación** (Mañana)
- Instalar dependencias: `jsonwebtoken`, `bcryptjs`
- Crear rutas de auth
- Implementar middleware JWT

### 3. **Setup Frontend React** (Próxima sesión)
- Crear carpeta `client/`
- Inicializar Vite + React + TypeScript
- Configurar TailwindCSS

---

## 🎯 Decisiones Técnicas

### ¿Por qué estas tecnologías?

**React + TypeScript**: Tipado fuerte, componentes reutilizables, ecosistema maduro

**TailwindCSS**: Desarrollo rápido, responsive design, mantenible

**MongoDB**: Flexible para datos no estructurados, ya configurado

**Claude Vision**: Mejor análisis visual, ética en IA

**Stripe**: Estándar de la industria, fácil integración

---

## 📌 Notas Importantes

1. **Base actual funcional**: Ya tienes usuarios CRUD + MongoDB Atlas
2. **Enfoque incremental**: Construir feature por feature
3. **Testing continuo**: Probar cada módulo antes de continuar
4. **Documentación**: Mantener README actualizado
5. **Git**: Commits frecuentes con mensajes descriptivos

---

## 🚦 Estado Actual

✅ **Completado:**
- Sistema básico de usuarios
- MongoDB Atlas conectado
- API REST funcionando
- Documentación inicial

🔄 **En progreso:**
- Planificación de arquitectura completa

⏳ **Pendiente:**
- Todo lo demás del roadmap

---

**Última actualización**: 8 de noviembre de 2025
**Próxima revisión**: Al completar Fase 2
