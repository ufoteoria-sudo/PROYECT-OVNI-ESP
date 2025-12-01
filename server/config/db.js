const sequelize = require('./database');
const User = require('../models/User.sequelize');
const Analysis = require('../models/Analysis.sequelize');

// Definir relaciones
User.hasMany(Analysis, { 
  foreignKey: 'userId',
  onDelete: 'CASCADE'
});

Analysis.belongsTo(User, {
  foreignKey: 'userId'
});

// Sincronizar con la base de datos
async function initializeDatabase() {
  try {
    await sequelize.authenticate();
    console.log('✅ Conectado a PostgreSQL correctamente');
    
    // Crear tablas si no existen
    await sequelize.sync({ alter: false });
    console.log('✅ Tablas sincronizadas');
    
    return sequelize;
  } catch (error) {
    console.error('❌ Error inicializando base de datos:', error.message);
    process.exit(1);
  }
}

module.exports = {
  sequelize,
  initializeDatabase,
  User,
  Analysis,
};
