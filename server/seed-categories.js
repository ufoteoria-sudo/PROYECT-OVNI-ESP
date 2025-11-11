/**
 * Script para poblar categorías iniciales
 * Ejecutar con: node seed-categories.js
 */

const mongoose = require('mongoose');
const Category = require('./models/Category');
require('dotenv').config();

const mongoUri = process.env.MONGO_URI || 'mongodb://localhost:27017/uap-db';

const initialCategories = [
  // OBJETOS ARTIFICIALES
  { name: 'Aviones Comerciales', slug: 'aviones-comerciales', type: 'object', icon: '✈️', color: '#3b82f6', order: 1, description: 'Aviones de pasajeros y carga comercial' },
  { name: 'Aviones Militares', slug: 'aviones-militares', type: 'object', icon: '🛩️', color: '#ef4444', order: 2, description: 'Aeronaves militares, cazas, transportes' },
  { name: 'Drones', slug: 'drones', type: 'object', icon: '🚁', color: '#8b5cf6', order: 3, description: 'Vehículos aéreos no tripulados (UAV, drones comerciales)' },
  { name: 'Helicópteros', slug: 'helicopteros', type: 'object', icon: '🚁', color: '#10b981', order: 4, description: 'Helicópteros civiles y militares' },
  { name: 'Satélites', slug: 'satelites', type: 'object', icon: '🛰️', color: '#06b6d4', order: 5, description: 'Satélites artificiales, ISS, Starlink' },
  { name: 'Globos Aerostáticos', slug: 'globos', type: 'object', icon: '🎈', color: '#f59e0b', order: 6, description: 'Globos meteorológicos, aerostáticos, dirigibles' },
  { name: 'Vehículos Terrestres', slug: 'vehiculos', type: 'object', icon: '🚗', color: '#64748b', order: 7, description: 'Luces de vehículos, faros, reflectores' },
  { name: 'Infraestructura', slug: 'infraestructura', type: 'object', icon: '🏗️', color: '#6b7280', order: 8, description: 'Torres, antenas, repetidores, alumbrado público' },
  
  // FENÓMENOS ATMOSFÉRICOS
  { name: 'Auroras', slug: 'aurora', type: 'phenomenon', icon: '🌌', color: '#a855f7', order: 10, description: 'Auroras boreales y australes' },
  { name: 'Meteoros', slug: 'meteor', type: 'phenomenon', icon: '☄️', color: '#f97316', order: 11, description: 'Meteoros, bólidos, estrellas fugaces' },
  { name: 'Nubes', slug: 'cloud', type: 'phenomenon', icon: '☁️', color: '#94a3b8', order: 12, description: 'Nubes lenticulares, mammatus, noctilucentes' },
  { name: 'Fenómenos Ópticos', slug: 'optico', type: 'phenomenon', icon: '🌈', color: '#ec4899', order: 13, description: 'Halos, parhelios, arcoíris, espejismos' },
  { name: 'Rayos y Tormentas', slug: 'tormenta', type: 'phenomenon', icon: '⚡', color: '#eab308', order: 14, description: 'Rayos, sprites, jets azules' },
  
  // OBJETOS CELESTES
  { name: 'Planetas', slug: 'planetas', type: 'object', icon: '🪐', color: '#f59e0b', order: 20, description: 'Venus, Júpiter, Marte y otros planetas visibles' },
  { name: 'Estrellas', slug: 'estrellas', type: 'object', icon: '⭐', color: '#fbbf24', order: 21, description: 'Estrellas brillantes, Sirio, Vega, Betelgeuse' },
  { name: 'Luna', slug: 'luna', type: 'object', icon: '🌙', color: '#cbd5e1', order: 22, description: 'Luna llena, creciente, eclipses lunares' },
  { name: 'Sol', slug: 'sol', type: 'object', icon: '☀️', color: '#fbbf24', order: 23, description: 'Sol, eclipses solares, manchas solares' },
  
  // ERRORES DE INTERPRETACIÓN
  { name: 'Reflejos en Cristales', slug: 'reflejos-cristal', type: 'object', icon: '🪟', color: '#06b6d4', order: 30, description: 'Reflejos en ventanas, parabrisas, lentes' },
  { name: 'Luces de Alumbrado', slug: 'luces-alumbrado', type: 'object', icon: '💡', color: '#facc15', order: 31, description: 'Farolas, proyectores, luces de estadios' },
  { name: 'Artefactos de Cámara', slug: 'artefactos-camara', type: 'object', icon: '📷', color: '#6366f1', order: 32, description: 'Lens flare, polvo, manchas en lente' },
  { name: 'Aves e Insectos', slug: 'aves-insectos', type: 'object', icon: '🦅', color: '#14b8a6', order: 33, description: 'Aves, insectos captados en vuelo' }
];

async function seedCategories() {
  try {
    await mongoose.connect(mongoUri, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    
    console.log('Conectado a MongoDB');
    
    // Verificar si ya existen categorías
    const existingCount = await Category.countDocuments();
    
    if (existingCount > 0) {
      console.log(`⚠️  Ya existen ${existingCount} categorías.`);
      console.log('   Eliminando categorías existentes...');
      await Category.deleteMany({});
    }
    
    // Crear categorías
    const created = await Category.insertMany(initialCategories);
    
    console.log(`✅ ${created.length} categorías creadas exitosamente:`);
    
    // Mostrar resumen por tipo
    const objectCategories = created.filter(c => c.type === 'object');
    const phenomenonCategories = created.filter(c => c.type === 'phenomenon');
    
    console.log(`\n📦 Objetos (${objectCategories.length}):`);
    objectCategories.forEach(c => console.log(`   ${c.icon} ${c.name} (${c.slug})`));
    
    console.log(`\n🌤️  Fenómenos (${phenomenonCategories.length}):`);
    phenomenonCategories.forEach(c => console.log(`   ${c.icon} ${c.name} (${c.slug})`));
    
    console.log('\n✅ Proceso completado');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

seedCategories();
