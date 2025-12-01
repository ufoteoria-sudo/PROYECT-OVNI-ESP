const { User, sequelize } = require('../config/db');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const createAdminUser = async () => {
  try {
    // Conectar a PostgreSQL
    await sequelize.authenticate();
    console.log('✅ Conectado a PostgreSQL');
    
    // Verificar si ya existe un admin
    const existingAdmin = await User.findOne({ where: { role: 'admin' } });
    if (existingAdmin) {
      console.log('⚠️  Ya existe un usuario administrador:', existingAdmin.username);
      process.exit(0);
    }
    
    // Datos del admin
    const adminData = {
      username: 'ufoteoria',
      email: 'ufoteoria@gmail.com',
      password: 'admin123',
      firstName: 'Administrador',
      lastName: 'UAP',
      role: 'admin',
      subscription: {
        status: 'active',
        plan: 'enterprise'
      },
      isActive: true
    };
    
    // Hash de la contraseña
    const salt = await bcrypt.genSalt(10);
    adminData.password = await bcrypt.hash(adminData.password, salt);
    
    // Crear admin
    const admin = await User.create(adminData);
    
    console.log('✅ Usuario administrador creado exitosamente!');
    console.log('📧 Email:', admin.email);
    console.log('👤 Username:', admin.username);
    console.log('🔑 Password: admin123');
    console.log('👑 Role: admin');
    console.log('🆔 ID:', admin.id);
    console.log('\n💡 Puedes acceder con:');
    console.log('   curl -X POST http://localhost:3000/api/auth/login \\');
    console.log('   -H "Content-Type: application/json" \\');
    console.log('   -d \'{"email":"ufoteoria@gmail.com","password":"admin123"}\'');
    
    process.exit(0);
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
};

createAdminUser();
