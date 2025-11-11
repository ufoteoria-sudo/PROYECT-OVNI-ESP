/**
 * Script para migrar categorías antiguas a slugs nuevos
 * Ejecutar con: node migrate-categories.js
 */

const mongoose = require('mongoose');
const AtmosphericPhenomenon = require('./models/AtmosphericPhenomenon');
const LibraryObject = require('./models/UFODatabase');
require('dotenv').config();

const mongoUri = process.env.MONGO_URI || 'mongodb://localhost:27017/uap-db';

// Mapeo de categorías antiguas a slugs nuevos
const CATEGORY_MAPPING = {
  // Fenómenos Atmosféricos
  'aurora': 'aurora',
  'meteor': 'meteor',
  'cloud': 'cloud',
  'optical': 'optico',
  'storm': 'tormenta',
  'lightning': 'tormenta',
  
  // Objetos - mapear a las nuevas categorías específicas
  'Atmospheric': 'cloud',
  'Celestial': 'planetas', // Por defecto planetas, luego se puede refinar
  'Aerial': 'drones', // Por defecto drones, luego se puede refinar
  'Technological': 'infraestructura',
  'Unknown': 'drones',
  'Aircraft': 'aviones-comerciales',
  'Satellite': 'satelites',
  'Drone': 'drones',
  'Balloon': 'globos',
  'Bird': 'aves-insectos',
  'Insect': 'aves-insectos',
  'Reflection': 'reflejos-cristal',
  'Light': 'luces-alumbrado',
  'Camera': 'artefactos-camara'
};

async function migratePhenomena() {
  console.log('\n📊 Migrando Fenómenos Atmosféricos...');
  
  const phenomena = await AtmosphericPhenomenon.find({});
  console.log(`   Encontrados: ${phenomena.length} fenómenos`);
  
  let updated = 0;
  let skipped = 0;
  
  for (const phenomenon of phenomena) {
    const oldCategory = phenomenon.category;
    const newCategory = CATEGORY_MAPPING[oldCategory] || oldCategory;
    
    if (newCategory !== oldCategory) {
      phenomenon.category = newCategory;
      await phenomenon.save();
      console.log(`   ✅ ${phenomenon.name}: "${oldCategory}" → "${newCategory}"`);
      updated++;
    } else {
      skipped++;
    }
  }
  
  console.log(`   Actualizados: ${updated}, Sin cambios: ${skipped}`);
}

async function migrateObjects() {
  console.log('\n📦 Migrando Objetos de Biblioteca...');
  
  const objects = await LibraryObject.find({});
  console.log(`   Encontrados: ${objects.length} objetos`);
  
  let updated = 0;
  let skipped = 0;
  
  for (const object of objects) {
    const oldCategory = object.category;
    let newCategory = CATEGORY_MAPPING[oldCategory];
    
    // Si no hay mapeo directo, intentar detectar por nombre/keywords
    if (!newCategory) {
      const name = (object.name || '').toLowerCase();
      const keywords = (object.keywords || []).join(' ').toLowerCase();
      const combined = `${name} ${keywords}`;
      
      // Detección inteligente por palabras clave
      if (combined.includes('drone') || combined.includes('uav')) {
        newCategory = 'drones';
      } else if (combined.includes('avion') || combined.includes('plane') || combined.includes('aircraft')) {
        newCategory = 'aviones-comerciales';
      } else if (combined.includes('helicoptero') || combined.includes('helicopter')) {
        newCategory = 'helicopteros';
      } else if (combined.includes('satelite') || combined.includes('satellite') || combined.includes('starlink')) {
        newCategory = 'satelites';
      } else if (combined.includes('globo') || combined.includes('balloon')) {
        newCategory = 'globos';
      } else if (combined.includes('planeta') || combined.includes('planet') || combined.includes('venus') || combined.includes('jupiter')) {
        newCategory = 'planetas';
      } else if (combined.includes('estrella') || combined.includes('star') || combined.includes('sirio')) {
        newCategory = 'estrellas';
      } else if (combined.includes('luna') || combined.includes('moon')) {
        newCategory = 'luna';
      } else if (combined.includes('sol') || combined.includes('sun')) {
        newCategory = 'sol';
      } else if (combined.includes('reflejo') || combined.includes('reflection') || combined.includes('cristal')) {
        newCategory = 'reflejos-cristal';
      } else if (combined.includes('luz') || combined.includes('light') || combined.includes('farola') || combined.includes('alumbrado')) {
        newCategory = 'luces-alumbrado';
      } else if (combined.includes('ave') || combined.includes('bird') || combined.includes('insect')) {
        newCategory = 'aves-insectos';
      } else if (combined.includes('phantom') || combined.includes('dji')) {
        newCategory = 'drones';
      } else {
        newCategory = 'drones'; // Por defecto
      }
    }
    
    if (newCategory !== oldCategory) {
      object.category = newCategory;
      await object.save();
      console.log(`   ✅ ${object.name}: "${oldCategory}" → "${newCategory}"`);
      updated++;
    } else {
      skipped++;
    }
  }
  
  console.log(`   Actualizados: ${updated}, Sin cambios: ${skipped}`);
}

async function migrate() {
  try {
    await mongoose.connect(mongoUri, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    
    console.log('✅ Conectado a MongoDB');
    console.log('🔄 Iniciando migración de categorías...\n');
    
    await migratePhenomena();
    await migrateObjects();
    
    console.log('\n✅ Migración completada exitosamente');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error en migración:', error);
    process.exit(1);
  }
}

migrate();
