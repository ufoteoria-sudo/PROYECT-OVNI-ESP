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
  // Objetos Celestes (12)
  { id: 1, category: 'Objetos Celestes', name: 'Venus', description: 'El planeta Venus es el segundo planeta más cercano al Sol.', image: 'https://images.unsplash.com/photo-1419242902214-272b3f66ee7a?w=300&h=200&fit=crop', characteristics: ['Brillante', 'Movimiento lento'], confidence: 0.95 },
  { id: 2, category: 'Satélites Artificiales', name: 'ISS', description: 'Estación Espacial Internacional. Uno de los objetos más brillantes del cielo.', image: 'https://images.unsplash.com/photo-1446776877081-d282a0f896e2?w=300&h=200&fit=crop', characteristics: ['Órbita regular', 'Muy brillante', 'Predecible'], confidence: 0.99 },
  { id: 3, category: 'Satélites Artificiales', name: 'Starlink', description: 'Satélites Starlink de SpaceX. A menudo confundidos con OVNIs.', image: 'https://images.unsplash.com/photo-1444080748397-f442aa95c3e5?w=300&h=200&fit=crop', characteristics: ['En cadena', 'Movimiento rápido', 'Reciente'], confidence: 0.92 },
  { id: 4, category: 'Objetos Celestes', name: 'Júpiter', description: 'El planeta más grande del sistema solar. Visible a simple vista.', image: 'https://images.unsplash.com/photo-1419242902214-272b3f66ee7a?w=300&h=200&fit=crop', characteristics: ['Brillante', 'Rojo/Anaranjado', 'Estático'], confidence: 0.94 },
  { id: 5, category: 'Globos Atmosféricos', name: 'Globo Meteorológico', description: 'Globos utilizados para mediciones de temperatura y presión atmosférica.', image: 'https://images.unsplash.com/photo-1446776653964-20c1d3a81b06?w=300&h=200&fit=crop', characteristics: ['Reflexión', 'Movimiento lento', 'Forma esférica'], confidence: 0.88 },
  { id: 6, category: 'Fenómenos Ópticos', name: 'Luz Solar Reflejada', description: 'La luz solar reflejada en nubes crea efectos visuales engañosos.', image: 'https://images.unsplash.com/photo-1444080748397-f442aa95c3e5?w=300&h=200&fit=crop', characteristics: ['Luz intensa', 'Temporal', 'Óptico'], confidence: 0.85 },
  { id: 7, category: 'Aeronaves Convencionales', name: 'Boeing 747', description: 'Aviones comerciales grandes vistos desde ciertos ángulos.', image: 'https://images.unsplash.com/photo-1446776877081-d282a0f896e2?w=300&h=200&fit=crop', characteristics: ['Luces posicionales', 'Sonido de motores', 'Trayectoria recta'], confidence: 0.96 },
  { id: 8, category: 'Drones', name: 'Dron DJI Phantom', description: 'Drones comerciales cada vez más comunes responsables de avistamientos.', image: 'https://images.unsplash.com/photo-1419242902214-272b3f66ee7a?w=300&h=200&fit=crop', characteristics: ['Luces LED', 'Hover capability', 'Sonido distintivo'], confidence: 0.91 },
  { id: 9, category: 'Objetos Celestes', name: 'Mercurio', description: 'Planeta rocoso más cercano al Sol. Visible al atardecer.', image: 'https://images.unsplash.com/photo-1444080748397-f442aa95c3e5?w=300&h=200&fit=crop', characteristics: ['Débil', 'Horizonte', 'Rápido'], confidence: 0.90 },
  { id: 10, category: 'Satélites Artificiales', name: 'Satélite Meteorológico', description: 'Satélites geoestacionarios para monitoreo meteorológico.', image: 'https://images.unsplash.com/photo-1446776877081-d282a0f896e2?w=300&h=200&fit=crop', characteristics: ['Órbita fija', 'Lento', 'Predecible'], confidence: 0.93 },
  { id: 11, category: 'Globos Atmosféricos', name: 'Globo Estratosférico', description: 'Globos científicos que alcanzan la estratosfera.', image: 'https://images.unsplash.com/photo-1446776653964-20c1d3a81b06?w=300&h=200&fit=crop', characteristics: ['Altitud extrema', 'Reflectivo', 'Lentitud extrema'], confidence: 0.87 },
  { id: 12, category: 'Drones', name: 'Dron Militar', description: 'Drones no tripulados utilizados en operaciones militares.', image: 'https://images.unsplash.com/photo-1419242902214-272b3f66ee7a?w=300&h=200&fit=crop', characteristics: ['Silencioso', 'Noche', 'Maniobras'], confidence: 0.85 }
];

let libraryCategories = [
  { id: 1, name: 'Objetos Celestes', icon: '⭐', slug: 'objetos-celestes', type: 'object' },
  { id: 2, name: 'Satélites Artificiales', icon: '🛰️', slug: 'satelites-artificiales', type: 'object' },
  { id: 3, name: 'Globos Atmosféricos', icon: '🎈', slug: 'globos-atmosfericos', type: 'object' },
  { id: 4, name: 'Fenómenos Ópticos', icon: '✨', slug: 'fenomenos-opticos', type: 'phenomenon' },
  { id: 5, name: 'Aeronaves Convencionales', icon: '✈️', slug: 'aeronaves-convencionales', type: 'object' },
  { id: 6, name: 'Drones', icon: '🚁', slug: 'drones', type: 'object' }
];

let phenomena = [
  // Fenómenos Ópticos (8)
  { id: 1, name: 'Aurora Boreal', category: 'Fenómenos Ópticos', description: 'Fenómeno luminoso natural en zonas polares causado por el viento solar.', image: 'https://images.unsplash.com/photo-1444080748397-f442aa95c3e5?w=300&h=200&fit=crop', rarity: 'media', characteristics: ['Luces verdes/azules', 'Movimiento ondulante', 'Noche polar'] },
  { id: 2, name: 'Destello de Iridio', category: 'Fenómenos Ópticos', description: 'Flash brillante de satélites Iridio. A menudo confundido con OVNIs.', image: 'https://images.unsplash.com/photo-1419242902214-272b3f66ee7a?w=300&h=200&fit=crop', rarity: 'baja', characteristics: ['Destello repentino', 'Muy brillante', 'Corta duración'] },
  { id: 3, name: 'Espejismo', category: 'Fenómenos Ópticos', description: 'Refracción de luz en capas de aire de diferentes temperaturas.', image: 'https://images.unsplash.com/photo-1446776653964-20c1d3a81b06?w=300&h=200&fit=crop', rarity: 'media', characteristics: ['Distorsión visual', 'Efecto de agua', 'Temporal'] },
  { id: 4, name: 'Halo Solar', category: 'Fenómenos Ópticos', description: 'Fenómeno óptico por refracción en cristales de hielo atmosféricos.', image: 'https://images.unsplash.com/photo-1444570053456-71e66804b5e7?w=300&h=200&fit=crop', rarity: 'baja', characteristics: ['Anillo alrededor del sol', 'Colores débiles', 'Predecible'] },
  { id: 5, name: 'Rayo Bola', category: 'Fenómenos Ópticos', description: 'Fenómeno luminoso raro asociado a tormentas eléctricas.', image: 'https://images.unsplash.com/photo-1534274988757-a28bf1ad0e1f?w=300&h=200&fit=crop', rarity: 'alta', characteristics: ['Esfera luminosa', 'Movimiento errático', 'Peligroso'] },
  { id: 6, name: 'Coronas Luminosas', category: 'Fenómenos Ópticos', description: 'Halos alrededor de fuentes de luz causados por niebla o polvo.', image: 'https://images.unsplash.com/photo-1444080748397-f442aa95c3e5?w=300&h=200&fit=crop', rarity: 'media', characteristics: ['Anillo de luz', 'Coloreado', 'Común en montañas'] },
  { id: 7, name: 'Gloria', category: 'Fenómenos Ópticos', description: 'Halo de luz alrededor de la sombra del observador.', image: 'https://images.unsplash.com/photo-1446776877081-d282a0f896e2?w=300&h=200&fit=crop', rarity: 'baja', characteristics: ['Anillo concéntrico', 'Alrededor de sombra', 'Altitud'] },
  { id: 8, name: 'Brocken Spectre', category: 'Fenómenos Ópticos', description: 'Proyección fantasmal de la sombra del observador sobre nubes.', image: 'https://images.unsplash.com/photo-1446776877081-d282a0f896e2?w=300&h=200&fit=crop', rarity: 'media', characteristics: ['Sombra amplificada', 'Sobre nubes', 'Espectacular'] },
  
  // Fenómenos Meteorológicos (6)
  { id: 9, name: 'Nube Lenticular', category: 'Fenómenos Meteorológicos', description: 'Nube en forma de OVNI causada por aire que fluye sobre montañas.', image: 'https://images.unsplash.com/photo-1518639298871-25f0e2fb3db2?w=300&h=200&fit=crop', rarity: 'baja', characteristics: ['Forma de disco', 'Estacionaria', 'Cerca de montañas'] },
  { id: 10, name: 'Nube Asperatus', category: 'Fenómenos Meteorológicos', description: 'Formación de nubes onduladas y turbulentas muy inusual.', image: 'https://images.unsplash.com/photo-1533531173927-3a36e0be4217?w=300&h=200&fit=crop', rarity: 'alta', characteristics: ['Ondas dramáticas', 'Cielo turbulento', 'Ominosa'] },
  { id: 11, name: 'Nube Mammatus', category: 'Fenómenos Meteorológicos', description: 'Protuberancias en forma de bolsas bajo las nubes de tormenta.', image: 'https://images.unsplash.com/photo-1493246507139-91e8fad9978e?w=300&h=200&fit=crop', rarity: 'media', characteristics: ['Bolsas colgantes', 'Después de tormenta', 'Fantasmal'] },
  { id: 12, name: 'Nube Catarata', category: 'Fenómenos Meteorológicos', description: 'Nube que parece caer del cielo pero no llueve.', image: 'https://images.unsplash.com/photo-1533531173927-3a36e0be4217?w=300&h=200&fit=crop', rarity: 'media', characteristics: ['Caída vertical', 'Precip. virga', 'Ilusoria'] },
  { id: 13, name: 'Virga', category: 'Fenómenos Meteorológicos', description: 'Precipitación que no llega al suelo evaporándose en el aire.', image: 'https://images.unsplash.com/photo-1446776877081-d282a0f896e2?w=300&h=200&fit=crop', rarity: 'media', characteristics: ['Lluvia fantasma', 'Diagonal', 'Evaporación'] },
  { id: 14, name: 'Pilares de Luz', category: 'Fenómenos Meteorológicos', description: 'Columnas verticales de luz causadas por reflexión en cristales de hielo.', image: 'https://images.unsplash.com/photo-1444080748397-f442aa95c3e5?w=300&h=200&fit=crop', rarity: 'baja', characteristics: ['Vertical', 'Multicolor', 'Raro'] },
  
  // Fenómenos Luminosos (5)
  { id: 15, name: 'Luz Volcánica', category: 'Fenómenos Luminosos', description: 'Gases ionizados sobre volcanes activos crean halos luminosos.', image: 'https://images.unsplash.com/photo-1464207687429-7505649dae38?w=300&h=200&fit=crop', rarity: 'baja', characteristics: ['Azul/púrpura', 'Sobre volcán', 'Noche'] },
  { id: 16, name: 'Luminiscencia Marina', category: 'Fenómenos Luminosos', description: 'Bioluminiscencia en océanos causada por organismos microscópicos.', image: 'https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?w=300&h=200&fit=crop', rarity: 'media', characteristics: ['Azul/verde', 'Movimiento', 'Océano'] },
  { id: 17, name: 'Rayos Positivos', category: 'Fenómenos Luminosos', description: 'Rayos rojos/azules de tormenta desde altitud de crucero de aviones.', image: 'https://images.unsplash.com/photo-1534274988757-a28bf1ad0e1f?w=300&h=200&fit=crop', rarity: 'baja', characteristics: ['Rojo/azul', 'Arriba de tormenta', 'Raro'] },
  { id: 18, name: 'Sprites', category: 'Fenómenos Luminosos', description: 'Destellos transitorios en mesosfera causados por rayos intensos.', image: 'https://images.unsplash.com/photo-1444080748397-f442aa95c3e5?w=300&h=200&fit=crop', rarity: 'alta', characteristics: ['Rojo/azul', 'Mesosfera', 'Ultrarápido'] },
  { id: 19, name: 'Cucarachas Azules', category: 'Fenómenos Luminosos', description: 'Fulguración azul rara desde líneas de alta tensión.', image: 'https://images.unsplash.com/photo-1419242902214-272b3f66ee7a?w=300&h=200&fit=crop', rarity: 'alta', characteristics: ['Azul', 'Líneas eléctricas', 'Muy raro'] },
  
  // Fenómenos Atmosféricos (4)
  { id: 20, name: 'Rayo Verde', category: 'Fenómenos Atmosféricos', description: 'Destello verde raro visto en el horizonte durante puesta de sol.', image: 'https://images.unsplash.com/photo-1446776877081-d282a0f896e2?w=300&h=200&fit=crop', rarity: 'alta', characteristics: ['Verde', 'Horizonte', 'Efímero'] },
  { id: 21, name: 'Scintilación Estelar', category: 'Fenómenos Atmosféricos', description: 'Parpadeo de estrellas por turbulencia atmosférica.', image: 'https://images.unsplash.com/photo-1419242902214-272b3f66ee7a?w=300&h=200&fit=crop', rarity: 'baja', characteristics: ['Parpadeo', 'Estrellas', 'Común'] },
  { id: 22, name: 'Espejismo Inferior', category: 'Fenómenos Atmosféricos', description: 'Imagen invertida del cielo vista en superficies calientes.', image: 'https://images.unsplash.com/photo-1446776953081-d282a0f896e2?w=300&h=200&fit=crop', rarity: 'media', characteristics: ['Inversión', 'Calor', 'Ilusoria'] },
  { id: 23, name: 'Crepúsculo Profundo', category: 'Fenómenos Atmosféricos', description: 'Fenómeno de iluminación crepuscular desde altitud estratosférica.', image: 'https://images.unsplash.com/photo-1444080748397-f442aa95c3e5?w=300&h=200&fit=crop', rarity: 'baja', characteristics: ['Violeta', 'Atardecer', 'Altitud'] }
];

let nextLibraryObjectId = 3;

app.get('/api/training', verificarAutenticacion, (req, res) => {
  const { page = 1, limit = 20 } = req.query;
  res.json({ images: [], pagination: { page: 1, limit: 20, total: 0, totalPages: 0 } });
});

app.get('/api/library/objects', (req, res) => {
  let categorySlug = req.query.category;
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 12;
  const skip = (page - 1) * limit;
  
  // Convertir slug a nombre de categoría
  let categoryName = null;
  if (categorySlug) {
    const cat = libraryCategories.find(c => c.slug === categorySlug);
    categoryName = cat ? cat.name : categorySlug;
  }
  
  let objects = categoryName ? libraryObjects.filter(obj => obj.category === categoryName) : libraryObjects;
  const total = objects.length;
  const paginatedObjects = objects.slice(skip, skip + limit);
  
  res.json({
    success: true,
    data: paginatedObjects,
    pagination: {
      page: page,
      limit: limit,
      total: total,
      totalPages: Math.ceil(total / limit)
    },
    objects: paginatedObjects,
    total: total
  });
});

app.get('/api/library/categories', (req, res) => {
  res.json({
    success: true,
    data: libraryCategories
  });
});

app.get('/api/categories', (req, res) => {
  res.json({
    success: true,
    data: libraryCategories
  });
});

app.get('/api/library/phenomena', (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 12;
  const skip = (page - 1) * limit;
  let categorySlug = req.query.category;
  
  // Convertir slug a nombre de categoría
  let categoryName = null;
  if (categorySlug) {
    const cat = libraryCategories.find(c => c.slug === categorySlug);
    categoryName = cat ? cat.name : categorySlug;
  }
  
  let filtered = phenomena;
  if (categoryName) {
    filtered = phenomena.filter(p => p.category === categoryName);
  }
  
  const total = filtered.length;
  const paginated = filtered.slice(skip, skip + limit);
  
  res.json({
    success: true,
    data: paginated,
    pagination: {
      page: page,
      limit: limit,
      total: total,
      totalPages: Math.ceil(total / limit)
    }
  });
});

app.get('/api/library/phenomena/:id', (req, res) => {
  const phenomenon = phenomena.find(p => p.id === parseInt(req.params.id));
  if (!phenomenon) {
    return res.status(404).json({ success: false, error: 'Fenómeno no encontrado' });
  }
  res.json({ success: true, data: phenomenon });
});

app.get('/api/library/objects/:id', (req, res) => {
  const obj = libraryObjects.find(o => o.id === parseInt(req.params.id));
  if (!obj) {
    return res.status(404).json({ success: false, error: 'Objeto no encontrado' });
  }
  res.json({ success: true, data: obj });
});

app.post('/api/library/objects', verificarAutenticacion, (req, res) => {
  if (req.user.role !== 'admin' && !req.user.isAdmin) return res.status(403).json({ error: 'Solo admin' });
  const { category, name, description } = req.body;
  if (!category || !name) return res.status(400).json({ error: 'Requerido' });
  const obj = { id: nextLibraryObjectId++, category, name, description, image: req.body.image || '', characteristics: [], confidence: 0.5, createdBy: req.user.email };
  libraryObjects.push(obj);
  res.status(201).json(obj);
});

app.put('/api/library/objects/:id', verificarAutenticacion, (req, res) => {
  if (req.user.role !== 'admin' && !req.user.isAdmin) return res.status(403).json({ error: 'Solo admin' });
  const obj = libraryObjects.find(o => o.id === parseInt(req.params.id));
  if (!obj) return res.status(404).json({ error: 'No encontrado' });
  Object.assign(obj, req.body);
  res.json(obj);
});

app.delete('/api/library/objects/:id', verificarAutenticacion, (req, res) => {
  if (req.user.role !== 'admin' && !req.user.isAdmin) return res.status(403).json({ error: 'Solo admin' });
  const idx = libraryObjects.findIndex(o => o.id === parseInt(req.params.id));
  if (idx === -1) return res.status(404).json({ error: 'No encontrado' });
  const deleted = libraryObjects.splice(idx, 1);
  res.json(deleted[0]);
});

// CRUD para fenómenos
app.post('/api/library/phenomena', verificarAutenticacion, (req, res) => {
  if (req.user.role !== 'admin' && !req.user.isAdmin) return res.status(403).json({ error: 'Solo admin' });
  const { category, name, description } = req.body;
  if (!category || !name) return res.status(400).json({ error: 'Requerido' });
  const phenomenon = { 
    id: Math.max(...phenomena.map(p => p.id || 0), 0) + 1, 
    category, 
    name, 
    description, 
    image: req.body.image || '',
    rarity: req.body.rarity || 'media',
    characteristics: req.body.characteristics || [],
    createdBy: req.user.email
  };
  phenomena.push(phenomenon);
  res.status(201).json(phenomenon);
});

app.put('/api/library/phenomena/:id', verificarAutenticacion, (req, res) => {
  if (req.user.role !== 'admin' && !req.user.isAdmin) return res.status(403).json({ error: 'Solo admin' });
  const phenomenon = phenomena.find(p => p.id === parseInt(req.params.id));
  if (!phenomenon) return res.status(404).json({ error: 'No encontrado' });
  Object.assign(phenomenon, req.body);
  res.json(phenomenon);
});

app.delete('/api/library/phenomena/:id', verificarAutenticacion, (req, res) => {
  if (req.user.role !== 'admin' && !req.user.isAdmin) return res.status(403).json({ error: 'Solo admin' });
  const idx = phenomena.findIndex(p => p.id === parseInt(req.params.id));
  if (idx === -1) return res.status(404).json({ error: 'No encontrado' });
  const deleted = phenomena.splice(idx, 1);
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
  }
});

// Endpoint para obtener estado de análisis (DEBE estar ANTES de /api/uploads/:id)
app.get('/api/analyze/:id/status', verificarAutenticacion, (req, res) => {
  try {
    const upload = uploads.find(u => u.id === parseInt(req.params.id) && u.userId === req.user.id);
    if (!upload) return res.status(404).json({ error: 'No encontrado' });
    
    // Retornar formato compatible con frontend
    res.json({
      analysisId: upload.id,
      fileName: upload.fileName,
      uploadDate: upload.createdAt,
      status: upload.status,
      imageData: upload.imageData,
      sightingContext: upload.sightingContext,
      analysis: upload.analysis,
      analysisScore: upload.analysisScore,
      hasExifData: !!upload.sightingContext && Object.keys(upload.sightingContext).length > 0,
      hasAiAnalysis: !!upload.analysis,
      exifData: upload.sightingContext,
      aiAnalysis: {
        category: upload.analysis?.classification,
        confidence: upload.analysis?.confidence || 0,
        description: upload.analysis?.details
      },
      bestMatch: null,
      usedForTraining: false
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

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
