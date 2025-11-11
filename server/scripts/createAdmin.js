const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const User = require('../models/User');

const createAdminUser = async () => {
  try {
    // Conectar a MongoDB
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Conectado a MongoDB');
    
    // Verificar si ya existe un admin
    const existingAdmin = await User.findOne({ role: 'admin' });
    if (existingAdmin) {
      console.log('⚠️  Ya existe un usuario administrador:', existingAdmin.username);
      process.exit(0);
    }
    
    // Datos del admin
    const adminData = {
      username: 'admin',
      email: 'admin@uap.com',
      password: 'Admin123!',
      firstName: 'Administrador',
      lastName: 'UAP',
      role: 'admin',
      subscription: {
        status: 'active',
        plan: 'lifetime'
      },
      isActive: true
    };
    
    // Hash de la contraseña
    const salt = await bcrypt.genSalt(10);
    adminData.password = await bcrypt.hash(adminData.password, salt);
    
    // Crear admin
    const admin = new User(adminData);
    await admin.save();
    
    console.log('✅ Usuario administrador creado exitosamente!');
    console.log('📧 Email:', adminData.email);
    console.log('🔑 Password: Admin123!');
    console.log('⚠️  CAMBIAR LA CONTRASEÑA EN PRODUCCIÓN');
    
    process.exit(0);
    
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
};

createAdminUser();
