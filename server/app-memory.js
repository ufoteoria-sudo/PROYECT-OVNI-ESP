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

// ==================== BIBLIOTECA VISUAL ====================

let libraryObjects = [
  { id: 1, category: 'Objetos Celestes', name: 'Venus', description: 'Planeta Venus.', image: 'https://via.placeholder.com/300x200?text=Venus', characteristics: [], confidence: 0.95 },
  { id: 2, category: 'Satélites Artificiales', name: 'ISS', description: 'Estación Espacial.', image: 'https://via.placeholder.com/300x200?text=ISS', characteristics: [], confidence: 0.99 }
];

let libraryCategories = [
  { id: 1, name: 'Objetos Celestes', icon: '⭐' },
  { id: 2, name: 'Satélites Artificiales', icon: '🛰️' }
];

let nextLibraryObjectId = 3;

app.get('/api/library/objects', (req, res) => {
  const category = req.query.category;
  const objects = category ? libraryObjects.filter(obj => obj.category === category) : libraryObjects;
  res.json(objects);
});

app.get('/api/library/categories', (req, res) => {
  res.json(libraryCategories);
});

app.post('/api/library/objects', verificarAutenticacion, (req, res) => {
  if (!req.user.isAdmin) return res.status(403).json({ error: 'Solo admin' });
  const { category, name, description } = req.body;
  if (!category || !name) return res.status(400).json({ error: 'Requerido' });
  const obj = { id: nextLibraryObjectId++, category, name, description, image: req.body.image || '', characteristics: [], confidence: 0.5, createdBy: req.user.email };
  libraryObjects.push(obj);
  res.status(201).json(obj);
});

app.put('/api/library/objects/:id', verificarAutenticacion, (req, res) => {
  if (!req.user.isAdmin) return res.status(403).json({ error: 'Solo admin' });
  const obj = libraryObjects.find(o => o.id === parseInt(req.params.id));
  if (!obj) return res.status(404).json({ error: 'No encontrado' });
  Object.assign(obj, req.body);
  res.json(obj);
});

app.delete('/api/library/objects/:id', verificarAutenticacion, (req, res) => {
  if (!req.user.isAdmin) return res.status(403).json({ error: 'Solo admin' });
  const idx = libraryObjects.findIndex(o => o.id === parseInt(req.params.id));
  if (idx === -1) return res.status(404).json({ error: 'No encontrado' });
  const deleted = libraryObjects.splice(idx, 1);
  res.json(deleted[0]);
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
  try {
    // Soportar tanto JSON como FormData
    let fileName = req.body.fileName || 'upload.jpg';
    let fileSize = req.body.fileSize || 0;
    let sightingContext = {};
    let imageData = '';

    // Si viene FormData
    if (req.body.sightingContext) {
      try {
        sightingContext = typeof req.body.sightingContext === 'string' 
          ? JSON.parse(req.body.sightingContext)
          : req.body.sightingContext;
      } catch (e) {
        console.log('⚠️  No se pudo parsear contexto:', e.message);
      }
    }

    // Si viene imageData base64
    if (req.body.imageData) {
      imageData = req.body.imageData;
      if (!fileSize && imageData.length) {
        fileSize = Math.ceil(imageData.length / 1.33); // Aproximado
      }
    }

    const upload = {
      id: nextUploadId++,
      userId: req.user.id,
      fileName: fileName,
      fileSize: fileSize,
      sightingContext: sightingContext,
      imageData: imageData || '',
      createdAt: new Date(),
      status: 'completed',
      analysisScore: Math.floor(Math.random() * 100),
      analysis: {
        confidence: Math.random() * 100,
        classification: ['Desconocido', 'Dron', 'Globo', 'Fenómeno Aéreo'][Math.floor(Math.random() * 4)],
        details: 'Análisis completado exitosamente'
      }
    };

    uploads.push(upload);
    
    console.log(`✅ Upload guardado: ${fileName} (Usuario: ${req.user.email})`);
    
    res.status(201).json({ 
      message: 'Upload completado exitosamente', 
      upload: upload 
    });
  } catch (error) {
    console.error('❌ Error en upload:', error.message);
    res.status(400).json({ error: 'Error al procesar upload: ' + error.message });
  }
});

app.get('/api/uploads', verificarAutenticacion, (req, res) => {
  try {
    const userUploads = uploads.filter(u => u.userId === req.user.id);
    console.log(`📊 Obteniendo ${userUploads.length} uploads para usuario ${req.user.email}`);
    res.json(userUploads);
  } catch (error) {
    console.error('❌ Error al obtener uploads:', error.message);
    res.status(400).json({ error: 'Error al obtener uploads' });
app.get('/api/uploads/:id', verificarAutenticacion, (req, res) => {
  try {
    const upload = uploads.find(u => u.id === parseInt(req.params.id) && u.userId === req.user.id);
    if (!upload) return res.status(404).json({ error: 'No encontrado' });
    res.json(upload);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

app.delete('/api/uploads/:id', verificarAutenticacion, (req, res) => {
  try {
    const idx = uploads.findIndex(u => u.id === parseInt(req.params.id) && u.userId === req.user.id);
    if (idx === -1) return res.status(404).json({ error: 'No encontrado' });
    const deleted = uploads.splice(idx, 1);
    res.json(deleted[0]);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

  }
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
