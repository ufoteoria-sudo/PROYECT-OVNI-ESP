const mongoose = require('mongoose');
require('dotenv').config();
const UFODatabase = require('./models/UFODatabase');

// Distribución objetivo
const distribution = {
  celestial: 200,
  satellite: 200,
  aircraft: 200,
  natural: 200,
  drone: 50,
  balloon: 50,
  bird: 50,
  uap: 30,
  hoax: 10,
  unknown: 20
};

const shapes = ['circular','oval','triangular','rectangular','irregular','point','cylindrical','other'];
const colors = ['white','red','orange','yellow','green','blue','purple','silver','black','multicolor','gray'];
const sizes = ['muy pequeño','pequeño','mediano','grande','muy grande'];
const behaviors = ['estático','flotante','lineal','zigzag','errático','circula','rápido movimiento rectilíneo','ascenso vertical','descenso vertical'];
const speeds = ['estático','lento','moderado','rápido','muy rápido'];
const luminosities = ['brillante','tenue','intermitente','sin luz','resplandeciente'];
const timeOfDayOpts = ['día','noche','amanecer','atardecer','todo el día'];
const altitudes = ['muy baja','baja','media','alta','muy alta'];
const locations = ['urbano','rural','costero','montaña','desierto','bosque','mar','zonas polares'];

function rand(arr){ return arr[Math.floor(Math.random()*arr.length)]; }
function pickN(arr,n){ const s=[]; while(s.length<n){ const v=rand(arr); if(!s.includes(v)) s.push(v); } return s; }

function genObject(category, idx){
  const name = `${category.toUpperCase()} ${idx} - ${rand(['Spec','Pattern','Type','Model','Variant','Case'])}`;
  const shape = rand(shapes);
  const colorCount = Math.min(3, Math.max(1, Math.floor(Math.random()*3)+1));
  const colorList = pickN(colors, colorCount);
  const obj = {
    name,
    category,
    description: `Registro sintético de ${category} - patrón visual ${shape}, colores ${colorList.join(', ')}. Generado automáticamente para ampliar la base de datos.`,
    characteristics: {
      shape,
      color: colorList,
      size: rand(sizes),
      behavior: rand(behaviors),
      speed: rand(speeds),
      luminosity: rand(luminosities)
    },
    visualPatterns: [shape, ...colorList.slice(0,2), rand(behaviors)],
    images: [],
    frequency: Math.floor(Math.random()*100),
    matchCount: 0,
    scientificName: category === 'celestial' ? `Celestialus ${idx}` : undefined,
    altitude: rand(altitudes),
    typicalLocations: pickN(locations, Math.min(3, Math.floor(Math.random()*3)+1)),
    timeOfDay: pickN(timeOfDayOpts, Math.min(2, Math.floor(Math.random()*2)+1)),
    isVerified: false,
    verificationSource: '',
    externalLinks: [],
    isActive: true
  };
  return obj;
}

async function run(){
  try{
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Conectado a MongoDB');

    // Count before
    const before = await UFODatabase.countDocuments();
    console.log('Documentos antes:', before);

    const bulk = [];
    for(const [category, count] of Object.entries(distribution)){
      for(let i=1;i<=count;i++){
        bulk.push(genObject(category, i));
      }
    }

    console.log('Objetos a insertar:', bulk.length);

    // Insertar en batches de 200
    const batchSize = 200;
    for(let i=0;i<bulk.length;i+=batchSize){
      const batch = bulk.slice(i, i+batchSize);
      await UFODatabase.insertMany(batch, { ordered: false });
      console.log(`Inserted batch ${i/batchSize + 1} (${batch.length} items)`);
    }

    const after = await UFODatabase.countDocuments();
    console.log('Documentos después:', after);

    console.log('Seed completo. Añadidos:', after - before);
    await mongoose.disconnect();
    process.exit(0);
  }catch(err){
    console.error('Error en seed:', err);
    process.exit(1);
  }
}

run();
