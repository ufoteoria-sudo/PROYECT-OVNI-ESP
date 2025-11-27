const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();

// Middlewares
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Servir frontend
app.use(express.static(path.join(__dirname, '../web-app')));

// ==================== BASE DE DATOS EN MEMORIA ====================

let users = [
  {
    _id: '673e1a2b3c4d5e6f7a8b9c0d',
    username: 'admin',
    email: 'ufoteoria@gmail.com',
    password: 'admin123',
    role: 'admin',
    createdAt: new Date('2025-11-01T10:00:00.000Z'),
    updatedAt: new Date('2025-11-01T10:00:00.000Z')
  },
  {
    _id: '673e1a2b3c4d5e6f7a8b9c0e',
    username: 'investigador1',
    email: 'investigador@uap.com',
    password: 'investigador123',
    role: 'user',
    createdAt: new Date('2025-11-05T15:30:00.000Z'),
    updatedAt: new Date('2025-11-05T15:30:00.000Z')
  }
];

let uploads = [];
let nextUploadId = 1;

// ==================== AUTENTICACIÓN ====================

const generarToken = (user) => {
  return Buffer.from(JSON.stringify({ id: user._id, email: user.email, role: user.role })).toString('base64');
};

const verificarToken = (token) => {
  try {
    return JSON.parse(Buffer.from(token, 'base64').toString());
  } catch {
    return null;
  }
};

const verificarAutenticacion = (req, res, next) => {
  const token = req.headers.authorization?.replace('Bearer ', '');
  if (!token) {
    return res.status(401).json({ error: 'Token requerido' });
  }
  
  const payload = verificarToken(token);
  if (!payload) {
    return res.status(401).json({ error: 'Token inválido' });
  }
  
  req.user = payload;
  next();
};

// ==================== RUTAS AUTH ====================

app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body;
  
  if (!email || !password) {
    return res.status(400).json({ error: 'Email y password requeridos' });
  }
  
  const user = users.find(u => u.email === email && u.password === password);
  if (!user) {
    return res.status(401).json({ error: 'Credenciales inválidas' });
  }
  
  const token = generarToken(user);
  res.json({
    token,
    user: {
      id: user._id,
      username: user.username,
      email: user.email,
      role: user.role
    }
  });
});

app.get('/api/auth/me', verificarAutenticacion, (req, res) => {
  const user = users.find(u => u._id === req.user.id);
  if (!user) {
    return res.status(404).json({ error: 'Usuario no encontrado' });
  }
  
  res.json({
    user: {
      id: user._id,
      username: user.username,
      email: user.email,
      role: user.role
    }
  });
});

// ==================== RUTAS USUARIOS ====================

app.get('/api/users', (req, res) => {
  const sorted = [...users].sort((a, b) => 
    new Date(b.createdAt) - new Date(a.createdAt)
  );
  res.json(sorted.map(u => ({
    _id: u._id,
    username: u.username,
    email: u.email,
    createdAt: u.createdAt,
    updatedAt: u.updatedAt
  })));
});

app.post('/api/users', (req, res) => {
  const { username, email, password } = req.body;
  
  if (!username || !email || !password) {
    return res.status(400).json({ error: 'Usuario, email y password son obligatorios' });
  }
  
  const existe = users.find(u => u.email === email);
  if (existe) {
    return res.status(409).json({ error: 'El email ya está registrado' });
  }
  
  const nuevoUsuario = {
    _id: '673e1a2b3c4d5e6f7a8b' + Math.random().toString(16).substr(2, 8),
    username: username.trim(),
    email: email.trim(),
    password,
    role: 'user',
    createdAt: new Date(),
    updatedAt: new Date()
  };
  
  users.push(nuevoUsuario);
  res.status(201).json(nuevoUsuario);
});

// ==================== RUTAS UPLOADS ====================

app.post('/api/uploads', verificarAutenticacion, (req, res) => {
  const { fileName, fileSize, context, imageData } = req.body;
  
  const upload = {
    id: nextUploadId++,
    userId: req.user.id,
    fileName: fileName || 'image.jpg',
    fileSize: fileSize || 0,
    context: context || '',
    imageData: imageData || '',
    createdAt: new Date(),
    status: 'completed',
    analysisScore: Math.floor(Math.random() * 100)
  };
  
  uploads.push(upload);
  res.status(201).json({ message: 'Upload completado', upload });
});

app.get('/api/uploads', verificarAutenticacion, (req, res) => {
  const userUploads = uploads.filter(u => u.userId === req.user.id);
  res.json(userUploads);
});

// ==================== APIs GRATUITAS ====================

app.get('/api/free/nasa', (req, res) => {
  res.json({
    title: 'NASA APOD (Astronomy Picture of the Day)',
    url: 'https://api.nasa.gov/planetary/apod',
    key: 'DEMO_KEY',
    description: 'API gratuita de NASA sin límite de peticiones con DEMO_KEY'
  });
});

app.get('/api/free/weather', (req, res) => {
  res.json({
    name: 'Open-Meteo Weather API',
    url: 'https://api.open-meteo.com/v1/forecast',
    description: 'Predicción del tiempo completamente gratuita, sin autenticación'
  });
});

app.get('/api/free/satellites', (req, res) => {
  res.json({
    name: 'CelesTrak',
    url: 'https://celestrak.org',
    description: 'Información de satélites, ISS, estaciones espaciales'
  });
});

app.get('/api/free/wikimedia', (req, res) => {
  res.json({
    name: 'Wikimedia Commons API',
    url: 'https://commons.wikimedia.org/w/api.php',
    description: 'Imágenes de dominio público'
  });
});

// ==================== NOTIFICACIONES ====================

app.get('/api/notifications', verificarAutenticacion, (req, res) => {
  res.json({ count: 0, notifications: [] });
});

// ==================== SPA: Servir index.html ====================

app.get('*', (req, res) => {
  if (!req.path.startsWith('/api')) {
    res.sendFile(path.join(__dirname, '../web-app/index.html'));
  } else {
    res.status(404).json({ error: 'Endpoint no encontrado' });
  }
});

// ==================== INICIAR SERVIDOR ====================

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`✅ Servidor iniciado en puerto ${PORT} (Modo: MEMORIA)`);
  console.log(`📊 ${users.length} usuarios cargados`);
  console.log(`🔐 Admin: ufoteoria@gmail.com / admin123`);
  console.log(`🔐 Usuario: investigador@uap.com / investigador123`);
  console.log(`🌐 APIs Gratuitas: NASA, OpenMeteo, CelesTrak, Wikimedia`);
});
