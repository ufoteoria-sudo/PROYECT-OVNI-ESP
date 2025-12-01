const path = require('path');
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const mongoSanitize = require('express-mongo-sanitize');
const hpp = require('hpp');
const { initializeDatabase } = require('./config/db');
require('dotenv').config({ path: path.join(__dirname, '.env') });

const app = express();

// ==================== SEGURIDAD ====================

// Helmet - Configuración de headers de seguridad
app.use(helmet({
  contentSecurityPolicy: false, // Desactivar para desarrollo
  crossOriginEmbedderPolicy: false
}));

// Rate Limiting - Limitar peticiones por IP (DESARROLLO: límites altos)
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 1000, // Máximo 1000 peticiones por ventana (desarrollo)
  message: 'Demasiadas peticiones desde esta IP, por favor intenta más tarde.',
  standardHeaders: true,
  legacyHeaders: false
});

// Rate Limiting específico para login
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 50, // Máximo 50 intentos de login (desarrollo)
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
// CORS - Configuración explícita para desarrollo y producción
app.use(cors({
  origin: [
    'http://localhost:8000', 
    'http://127.0.0.1:8000', 
    'http://localhost:8080', 
    'http://127.0.0.1:8080', 
    'http://localhost:5500', 
    'http://127.0.0.1:5500', 
    'http://localhost:8090', 
    'http://127.0.0.1:8090',
    'https://uapanalysis.netlify.app',
    'null'
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

// Manejar preflight requests
app.options('*', cors());

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
const analysisRouter = require('./routes/analysis');
const reportRouter = require('./routes/report');
const adminRouter = require('./routes/admin');
const notificationsRouter = require('./routes/notifications');
const exportRouter = require('./routes/export');
const auditRouter = require('./routes/audit');
const advancedRouter = require('./routes/advanced');
const trainingRouter = require('./routes/training');
const libraryRouter = require('./routes/library');
const siteConfigRouter = require('./routes/siteconfig');
const testRouter = require('./routes/test');
const categoriesRouter = require('./routes/categories');

app.use('/api/auth', authRouter);
app.use('/api/users', usersRouter);
app.use('/api/user', usersRouter); // Alias para endpoints sin autenticación
app.use('/api/siteconfig', siteConfigRouter);
app.use('/api/uploads', uploadRouter);
app.use('/api/analyze', analyzeRouter);
app.use('/api/analysis', analysisRouter); // NUEVO: Análisis públicos para WordPress
app.use('/api/reports', reportRouter);
app.use('/api/admin', adminRouter);
app.use('/api/notifications', notificationsRouter);
app.use('/api/export', exportRouter);
app.use('/api/audit', auditRouter);
app.use('/api/advanced', advancedRouter);
app.use('/api/training', trainingRouter);
app.use('/api/library', libraryRouter);
app.use('/api/categories', categoriesRouter);
app.use('/api/test', testRouter); // NUEVO: Endpoints de prueba para OpenCV + Llama

// Servir archivos estáticos de training
app.use('/uploads/training', express.static(path.join(__dirname, 'uploads/training')));

// Servir archivos estáticos de biblioteca
app.use('/uploads/library', express.static(path.join(__dirname, 'uploads/library')));

// Servir archivos estáticos de uploads generales (para búsqueda inversa)
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// ==================== SERVIR WEB-APP (FUSIÓN DE SERVIDORES) ====================
// Backend sirve frontend desde /web-app (1 solo servidor, 1 solo puerto)
const webAppPath = path.join(__dirname, '..', 'web-app');
app.use(express.static(webAppPath));

// SPA: Redirigir todas las rutas no-API al index.html
app.get('*', (req, res, next) => {
  // Solo si NO es una ruta API
  if (!req.url.startsWith('/api') && !req.url.startsWith('/uploads')) {
    res.sendFile(path.join(webAppPath, 'index.html'));
  } else {
    next();
  }
});

// Conexión a PostgreSQL (Sequelize)
(async () => {
  try {
    await initializeDatabase();
    console.log('✅ Base de datos PostgreSQL inicializada correctamente');
  } catch (error) {
    console.error('❌ Error al inicializar la base de datos:', error.message);
    process.exit(1);
  }
})();

// Error handler básico para rutas no encontradas
app.use((req, res, next) => {
  res.status(404).json({ error: 'Endpoint no encontrado' });
});

// Iniciar servidor HTTP con Socket.IO
const PORT = process.env.PORT || 3000;
const http = require('http');
const { Server } = require('socket.io');

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});

// Configurar Socket.IO
io.on('connection', (socket) => {
  console.log('Cliente conectado:', socket.id);

  socket.on('disconnect', () => {
    console.log('Cliente desconectado:', socket.id);
  });
});

// Hacer io accesible globalmente
global.io = io;

server.listen(PORT, '0.0.0.0', () => {
  console.log(`Servidor iniciado en puerto ${PORT}`);
});

module.exports = { app, io };
