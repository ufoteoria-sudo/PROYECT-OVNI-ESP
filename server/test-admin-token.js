const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
require('dotenv').config();

const userSchema = new mongoose.Schema({
  username: String,
  email: String,
  password: String,
  role: String
});

const User = mongoose.model('User', userSchema);

async function getAdminToken() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Conectado a MongoDB');
    
    // Buscar admin existente
    let admin = await User.findOne({ role: 'admin' });
    
    if (!admin) {
      console.log('No hay admin, creando uno...');
      const hashedPassword = await bcrypt.hash('admin123', 10);
      admin = await User.create({
        username: 'admin',
        email: 'admin@uap.com',
        password: hashedPassword,
        role: 'admin'
      });
      console.log('✅ Admin creado: admin@uap.com / admin123');
    } else {
      console.log('✅ Admin encontrado:', admin.email);
    }
    
    // Generar token
    const token = jwt.sign(
      { userId: admin._id, email: admin.email, role: admin.role },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );
    
    console.log('\n📝 TOKEN JWT (válido 24h):');
    console.log(token);
    
    await mongoose.connection.close();
    process.exit(0);
  } catch (err) {
    console.error('❌ Error:', err.message);
    process.exit(1);
  }
}

getAdminToken();
