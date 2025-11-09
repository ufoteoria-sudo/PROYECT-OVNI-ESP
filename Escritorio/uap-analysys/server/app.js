const path = require('path');
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const mongoSanitize = require('express-mongo-sanitize');
const hpp = require('hpp');
require('dotenv').config();

const app = express();

// ==================== SEGURIDAD ====================

// Helmet - Configuración de headers de seguridad
app.use(helmet({
  contentSecurityPolicy: false, // Desactivar para desarrollo
  crossOriginEmbedderPolicy: false
}));

// Rate Limiting - Limitar peticiones por IP
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 100, // Máximo 100 peticiones por ventana
  message: 'Demasiadas peticiones desde esta IP, por favor intenta más tarde.',
  standardHeaders: true,
  legacyHeaders: false
});

// Rate Limiting específico para login
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5, // Máximo 5 intentos de login
  message: 'Demasiados intentos de login, por favor intenta más tarde.',
  skipSuccessfulRequests: true
});

// Aplicar rate limiting
app.use('/api/', limiter);
app.use('/api/auth/login', loginLimiter);

// Sanitización contra NoSQL Injection
app.use(mongoSanitize());

// Protección contra HTTP Parameter Pollution
app.use(hpp());

// ==================== MIDDLEWARES ====================
app.use(cors());
app.use(express.json({ limit: '50mb' })); // Limitar tamaño de JSON
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Cache middleware
const CacheService = require('./services/cacheService');
app.use(CacheService.middleware());

// Rutas API
const authRouter = require('./routes/auth');
const usersRouter = require('./routes/user');
const uploadRouter = require('./routes/upload');
const analyzeRouter = require('./routes/analyze');
const reportRouter = require('./routes/report');
const adminRouter = require('./routes/admin');
const notificationsRouter = require('./routes/notifications');
const exportRouter = require('./routes/export');
const auditRouter = require('./routes/audit');
const advancedRouter = require('./routes/advanced');
const trainingRouter = require('./routes/training');

app.use('/api/auth', authRouter);
app.use('/api/users', usersRouter);
app.use('/api/uploads', uploadRouter);
app.use('/api/analyze', analyzeRouter);
app.use('/api/reports', reportRouter);
app.use('/api/admin', adminRouter);
app.use('/api/notifications', notificationsRouter);
app.use('/api/export', exportRouter);
app.use('/api/audit', auditRouter);
app.use('/api/advanced', advancedRouter);
app.use('/api/training', trainingRouter);

// Servir archivos estáticos de training
app.use('/uploads/training', express.static(path.join(__dirname, 'uploads/training')));

// (Opcional) servir frontend estático si colocas la carpeta frontend junto a server
// Descomenta si quieres servir la web desde el mismo servidor Express:
// const frontendPath = path.join(__dirname, '..', 'frontend');
// app.use(express.static(frontendPath));
// app.get('/', (req, res) => res.sendFile(path.join(frontendPath, 'index.html')));

// Conexión a MongoDB
const mongoUri = process.env.MONGO_URI || 'mongodb://localhost:27017/uap-db';
mongoose.connect(mongoUri, {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
  .then(() => console.log('Conectado a MongoDB'))
  .catch((error) => {
    console.error('Error conectando a MongoDB:', error);
    process.exit(1);
  });

// Error handler básico para rutas no encontradas
app.use((req, res, next) => {
  res.status(404).json({ error: 'Endpoint no encontrado' });
});

// Iniciar servidor
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Servidor iniciado en puerto ${PORT}`);
});
