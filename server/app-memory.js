const express = require('express');
const cors = require('cors');

const app = express();

// Middlewares
app.use(cors());
app.use(express.json());

// Base de datos en memoria (temporal)
let users = [
  {
    _id: '673e1a2b3c4d5e6f7a8b9c0d',
    username: 'admin',
    email: 'admin@uap.com',
    createdAt: new Date('2025-11-01T10:00:00.000Z'),
    updatedAt: new Date('2025-11-01T10:00:00.000Z')
  },
  {
    _id: '673e1a2b3c4d5e6f7a8b9c0e',
    username: 'investigador1',
    email: 'investigador1@uap.com',
    createdAt: new Date('2025-11-05T15:30:00.000Z'),
    updatedAt: new Date('2025-11-05T15:30:00.000Z')
  }
];

let nextId = 3;

// Generar ID único
const generateId = () => {
  return '673e1a2b3c4d5e6f7a8b9c' + (nextId++).toString(16).padStart(2, '0');
};

// Validar email
const validarEmail = (email) => {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
};

// Listar todos los usuarios
app.get('/api/users', (req, res) => {
  const sorted = [...users].sort((a, b) => 
    new Date(b.createdAt) - new Date(a.createdAt)
  );
  res.json(sorted);
});

// Obtener usuario por id
app.get('/api/users/:id', (req, res) => {
  const user = users.find(u => u._id === req.params.id);
  if (!user) {
    return res.status(404).json({ error: 'Usuario no encontrado.' });
  }
  res.json(user);
});

// Crear usuario
app.post('/api/users', (req, res) => {
  const { username, email } = req.body;
  
  if (!username || !email) {
    return res.status(400).json({ error: 'Usuario y email son obligatorios.' });
  }
  
  if (!validarEmail(email)) {
    return res.status(400).json({ error: 'El email no tiene un formato válido.' });
  }
  
  // Verificar email duplicado
  const existe = users.find(u => u.email === email);
  if (existe) {
    return res.status(409).json({ error: 'El email ya está registrado.' });
  }
  
  const nuevoUsuario = {
    _id: generateId(),
    username: username.trim(),
    email: email.trim(),
    createdAt: new Date(),
    updatedAt: new Date()
  };
  
  users.push(nuevoUsuario);
  res.status(201).json(nuevoUsuario);
});

// Actualizar usuario
app.put('/api/users/:id', (req, res) => {
  const { username, email } = req.body;
  
  if (!username || !email) {
    return res.status(400).json({ error: 'Usuario y email son obligatorios.' });
  }
  
  if (!validarEmail(email)) {
    return res.status(400).json({ error: 'El email no tiene un formato válido.' });
  }
  
  const index = users.findIndex(u => u._id === req.params.id);
  if (index === -1) {
    return res.status(404).json({ error: 'Usuario no encontrado.' });
  }
  
  // Verificar email duplicado en otro usuario
  const existe = users.find(u => u.email === email && u._id !== req.params.id);
  if (existe) {
    return res.status(409).json({ error: 'El email ya está registrado.' });
  }
  
  users[index] = {
    ...users[index],
    username: username.trim(),
    email: email.trim(),
    updatedAt: new Date()
  };
  
  res.json(users[index]);
});

// Borrar usuario
app.delete('/api/users/:id', (req, res) => {
  const index = users.findIndex(u => u._id === req.params.id);
  if (index === -1) {
    return res.status(404).json({ error: 'Usuario no encontrado.' });
  }
  
  users.splice(index, 1);
  res.json({ message: 'Usuario borrado correctamente.' });
});

// Error handler
app.use((req, res) => {
  res.status(404).json({ error: 'Endpoint no encontrado' });
});

// Iniciar servidor
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`✅ Servidor iniciado en puerto ${PORT} (Modo: MEMORIA)`);
  console.log(`📊 ${users.length} usuarios de ejemplo cargados`);
  console.log(`⚠️  Nota: Los datos se perderán al reiniciar el servidor`);
  console.log(`🔗 Para usar MongoDB, configura MONGODB_SETUP.md`);
});
