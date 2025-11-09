const mongoose = require('mongoose');
require('dotenv').config();
const UFODatabase = require('./models/UFODatabase');

const knownObjects = [
  // ============ OBJETOS CELESTIALES ============
  {
    name: 'Venus',
    category: 'celestial',
    description: 'Planeta Venus, el objeto más brillante en el cielo después del Sol y la Luna. A menudo confundido con OVNIs por su brillo intenso.',
    characteristics: {
      shape: 'point',
      color: ['blanco', 'amarillo'],
      size: 'punto brillante',
      behavior: 'estático relativo al horizonte',
      speed: 'aparentemente estático',
      luminosity: 'muy brillante'
    },
    visualPatterns: ['luz brillante', 'punto fijo', 'brillo constante', 'visible al amanecer/atardecer'],
    frequency: 100,
    scientificName: 'Venus',
    altitude: 'espacio',
    typicalLocations: ['cielo', 'horizonte oeste', 'horizonte este'],
    timeOfDay: ['amanecer', 'atardecer'],
    isVerified: true,
    verificationSource: 'NASA',
    isActive: true
  },
  {
    name: 'Estrella Sirio',
    category: 'celestial',
    description: 'La estrella más brillante del cielo nocturno. Puede parpadear y cambiar de color debido a la turbulencia atmosférica.',
    characteristics: {
      shape: 'point',
      color: ['blanco', 'azul', 'rojo'],
      size: 'punto brillante',
      behavior: 'estático',
      speed: 'estático',
      luminosity: 'muy brillante, parpadeante'
    },
    visualPatterns: ['luz parpadeante', 'cambio de color', 'brillo intenso', 'punto fijo'],
    frequency: 90,
    scientificName: 'Sirius',
    altitude: 'espacio',
    timeOfDay: ['noche'],
    isVerified: true,
    verificationSource: 'NASA',
    isActive: true
  },
  {
    name: 'Estación Espacial Internacional (ISS)',
    category: 'satellite',
    description: 'Satélite más grande y brillante visible a simple vista. Se mueve rápidamente en línea recta a través del cielo.',
    characteristics: {
      shape: 'point',
      color: ['blanco', 'amarillo'],
      size: 'punto muy brillante',
      behavior: 'movimiento lineal constante',
      speed: 'rápido',
      luminosity: 'muy brillante'
    },
    visualPatterns: ['movimiento lineal', 'sin parpadeo', 'brillo constante', 'cruce rápido del cielo'],
    frequency: 80,
    altitude: '400 km',
    typicalLocations: ['cielo'],
    timeOfDay: ['amanecer', 'atardecer', 'noche'],
    isVerified: true,
    verificationSource: 'NASA ISS Tracker',
    externalLinks: ['https://spotthestation.nasa.gov/'],
    isActive: true
  },
  {
    name: 'Satélites Starlink',
    category: 'satellite',
    description: 'Constelación de satélites de SpaceX. Aparecen como cadena de luces en línea recta.',
    characteristics: {
      shape: 'point',
      color: ['blanco'],
      size: 'múltiples puntos',
      behavior: 'formación lineal, movimiento sincronizado',
      speed: 'moderado',
      luminosity: 'brillante'
    },
    visualPatterns: ['múltiples luces', 'formación lineal', 'tren de luces', 'movimiento sincronizado'],
    frequency: 70,
    altitude: '550 km',
    timeOfDay: ['amanecer', 'atardecer'],
    isVerified: true,
    verificationSource: 'SpaceX',
    externalLinks: ['https://findstarlink.com/'],
    isActive: true
  },
  
  // ============ AERONAVES ============
  {
    name: 'Avión Comercial',
    category: 'aircraft',
    description: 'Aeronave comercial típica (Boeing, Airbus). Visible por luces de navegación rojas y verdes.',
    characteristics: {
      shape: 'rectangular',
      color: ['blanco', 'rojo', 'verde'],
      size: 'mediano a grande',
      behavior: 'movimiento lineal con pequeñas correcciones',
      speed: 'rápido a muy rápido',
      luminosity: 'luces intermitentes (rojo/verde)'
    },
    visualPatterns: ['luces intermitentes', 'luz roja y verde', 'luz estroboscópica blanca', 'sonido de motor'],
    frequency: 95,
    altitude: '10,000-40,000 pies',
    typicalLocations: ['rutas aéreas', 'cerca de aeropuertos'],
    timeOfDay: ['día', 'noche'],
    isVerified: true,
    verificationSource: 'FAA',
    isActive: true
  },
  {
    name: 'Helicóptero',
    category: 'aircraft',
    description: 'Aeronave de rotor. Movimiento más errático que aviones, puede quedarse estático.',
    characteristics: {
      shape: 'irregular',
      color: ['rojo', 'verde', 'blanco'],
      size: 'pequeño a mediano',
      behavior: 'puede quedarse estático, movimientos laterales',
      speed: 'lento a moderado',
      luminosity: 'luces intermitentes'
    },
    visualPatterns: ['hovering', 'movimiento lateral', 'sonido característico rotores', 'luz estroboscópica'],
    frequency: 60,
    altitude: 'bajo a medio (< 10,000 pies)',
    timeOfDay: ['día', 'noche'],
    isVerified: true,
    isActive: true
  },
  
  // ============ DRONES ============
  {
    name: 'Drone Comercial (DJI)',
    category: 'drone',
    description: 'Drone recreativo o comercial tipo cuadricóptero. Tamaño pequeño con luces LED.',
    characteristics: {
      shape: 'irregular',
      color: ['rojo', 'verde', 'blanco', 'multicolor'],
      size: 'pequeño',
      behavior: 'movimiento errático, puede quedarse estático, cambios bruscos dirección',
      speed: 'lento a moderado',
      luminosity: 'luces LED brillantes'
    },
    visualPatterns: ['hovering prolongado', 'movimiento súbito', 'luces LED', 'baja altitud'],
    frequency: 50,
    altitude: 'muy bajo (< 400 pies)',
    typicalLocations: ['urbano', 'parques', 'zonas residenciales'],
    timeOfDay: ['día', 'noche'],
    isVerified: true,
    isActive: true
  },
  
  // ============ GLOBOS ============
  {
    name: 'Globo Meteorológico',
    category: 'balloon',
    description: 'Globo blanco de gran tamaño usado para mediciones atmosféricas. Refleja luz solar.',
    characteristics: {
      shape: 'oval',
      color: ['blanco', 'plateado'],
      size: 'grande',
      behavior: 'deriva con el viento, ascenso lento',
      speed: 'muy lento',
      luminosity: 'refleja luz solar'
    },
    visualPatterns: ['flotación', 'reflejo brillante', 'movimiento con viento', 'forma esférica'],
    frequency: 40,
    altitude: 'bajo a muy alto (hasta 120,000 pies)',
    timeOfDay: ['día'],
    isVerified: true,
    verificationSource: 'NOAA',
    isActive: true
  },
  {
    name: 'Linterna China / Sky Lantern',
    category: 'balloon',
    description: 'Globo de papel con llama interna. Común en celebraciones. Luz naranja/amarilla.',
    characteristics: {
      shape: 'oval',
      color: ['naranja', 'amarillo', 'rojo'],
      size: 'pequeño a mediano',
      behavior: 'ascenso lento, deriva con viento',
      speed: 'muy lento',
      luminosity: 'luz cálida parpadeante'
    },
    visualPatterns: ['luz naranja', 'ascenso lento', 'parpadeo', 'múltiples objetos en grupo'],
    frequency: 30,
    altitude: 'bajo a medio',
    timeOfDay: ['noche'],
    isVerified: true,
    isActive: true
  },
  
  // ============ AVES ============
  {
    name: 'Bandada de Aves',
    category: 'bird',
    description: 'Grupo de aves en formación. Pueden reflejar luz solar creando efecto brillante.',
    characteristics: {
      shape: 'irregular',
      color: ['blanco', 'gris', 'negro'],
      size: 'múltiples objetos pequeños',
      behavior: 'formación cambiante, movimiento coordinado',
      speed: 'moderado',
      luminosity: 'reflejo solar intermitente'
    },
    visualPatterns: ['formación en V', 'cambio de forma', 'reflejo intermitente', 'movimiento orgánico'],
    frequency: 70,
    altitude: 'bajo a medio',
    timeOfDay: ['día', 'amanecer', 'atardecer'],
    isVerified: true,
    isActive: true
  },
  
  // ============ FENÓMENOS NATURALES ============
  {
    name: 'Nube Lenticular',
    category: 'natural',
    description: 'Formación nubosa con forma de disco o lente. Frecuentemente confundida con OVNIs.',
    characteristics: {
      shape: 'oval',
      color: ['blanco', 'gris'],
      size: 'grande a muy grande',
      behavior: 'aparentemente estática',
      speed: 'estático',
      luminosity: 'refleja luz solar'
    },
    visualPatterns: ['forma de disco', 'bordes definidos', 'estática', 'cerca montañas'],
    frequency: 25,
    altitude: 'medio a alto',
    typicalLocations: ['montañas', 'zonas montañosas'],
    timeOfDay: ['día'],
    isVerified: true,
    verificationSource: 'NOAA Weather',
    isActive: true
  },
  {
    name: 'Rayo en Bola / Ball Lightning',
    category: 'natural',
    description: 'Fenómeno eléctrico raro. Esfera luminosa flotante durante tormentas.',
    characteristics: {
      shape: 'circular',
      color: ['blanco', 'amarillo', 'naranja', 'azul'],
      size: 'pequeño',
      behavior: 'flotación errática, puede atravesar objetos',
      speed: 'lento',
      luminosity: 'muy brillante'
    },
    visualPatterns: ['esfera luminosa', 'durante tormenta', 'movimiento errático', 'desaparición súbita'],
    frequency: 5,
    altitude: 'muy bajo',
    timeOfDay: ['tormenta'],
    isVerified: true,
    verificationSource: 'Estudios científicos',
    isActive: true
  },
  
  // ============ MÁS OBJETOS CELESTIALES ============
  {
    name: 'Júpiter',
    category: 'celestial',
    description: 'Planeta más grande del sistema solar. Muy brillante, visible a simple vista.',
    characteristics: {
      shape: 'point',
      color: ['blanco', 'amarillo pálido'],
      size: 'punto brillante',
      behavior: 'estático relativo al horizonte',
      speed: 'aparentemente estático',
      luminosity: 'muy brillante'
    },
    visualPatterns: ['luz brillante constante', 'punto fijo', 'no parpadea', 'cerca de la eclíptica'],
    frequency: 85,
    scientificName: 'Jupiter',
    altitude: 'espacio',
    timeOfDay: ['noche'],
    isVerified: true,
    verificationSource: 'NASA',
    isActive: true
  },
  {
    name: 'Marte',
    category: 'celestial',
    description: 'Planeta rojo. Brillo variable, color característico rojizo-anaranjado.',
    characteristics: {
      shape: 'point',
      color: ['rojo', 'naranja'],
      size: 'punto brillante',
      behavior: 'estático',
      speed: 'estático',
      luminosity: 'brillante, no parpadea'
    },
    visualPatterns: ['color rojizo', 'brillo constante', 'cerca horizonte o alto en cielo'],
    frequency: 75,
    scientificName: 'Mars',
    altitude: 'espacio',
    timeOfDay: ['noche', 'amanecer', 'atardecer'],
    isVerified: true,
    verificationSource: 'NASA',
    isActive: true
  },
  {
    name: 'Satélite Iridium (Flare)',
    category: 'satellite',
    description: 'Destello brillante causado por reflejo solar en paneles de satélites Iridium. Muy breve pero intenso.',
    characteristics: {
      shape: 'point',
      color: ['blanco', 'plateado'],
      size: 'punto muy brillante',
      behavior: 'destello breve (1-10 segundos)',
      speed: 'rápido',
      luminosity: 'extremadamente brillante por segundos'
    },
    visualPatterns: ['destello súbito', 'brillo intenso breve', 'predecible si se conoce órbita'],
    frequency: 45,
    altitude: 'espacio (780 km)',
    timeOfDay: ['amanecer', 'atardecer', 'noche'],
    isVerified: true,
    verificationSource: 'Iridium Communications',
    externalLinks: ['https://www.heavens-above.com/'],
    isActive: true
  },
  {
    name: 'Meteoro / Estrella Fugaz',
    category: 'natural',
    description: 'Fragmento de roca espacial ardiendo en atmósfera. Rastro luminoso breve.',
    characteristics: {
      shape: 'point',
      color: ['blanco', 'verde', 'naranja', 'azul'],
      size: 'punto con estela',
      behavior: 'movimiento lineal muy rápido',
      speed: 'extremadamente rápido',
      luminosity: 'muy brillante por 1-3 segundos'
    },
    visualPatterns: ['rastro luminoso', 'desaparición rápida', 'dirección descendente', 'posible fragmentación'],
    frequency: 55,
    altitude: 'atmósfera alta (80-120 km)',
    timeOfDay: ['noche', 'amanecer'],
    isVerified: true,
    verificationSource: 'American Meteor Society',
    externalLinks: ['https://www.amsmeteors.org/'],
    isActive: true
  },
  {
    name: 'Reflejo de Luz en Lente',
    category: 'natural',
    description: 'Artefacto óptico causado por reflexión interna en lente de cámara. Lens flare o ghost.',
    characteristics: {
      shape: 'circular',
      color: ['multicolor', 'verde', 'púrpura'],
      size: 'variable',
      behavior: 'estático relativo a fuente luz',
      speed: 'estático',
      luminosity: 'variable'
    },
    visualPatterns: ['forma geométrica', 'patrón simétrico', 'alineado con fuente luz', 'color aberrante'],
    frequency: 80,
    altitude: 'artefacto óptico',
    timeOfDay: ['día', 'noche'],
    isVerified: true,
    verificationSource: 'Óptica básica',
    isActive: true
  },
  
  // ============ MÁS AERONAVES ============
  {
    name: 'Avión Privado / Cessna',
    category: 'aircraft',
    description: 'Avioneta pequeña. Vuela más bajo que aviones comerciales, más lento.',
    characteristics: {
      shape: 'irregular',
      color: ['blanco', 'rojo', 'verde'],
      size: 'pequeño',
      behavior: 'movimiento lineal o circular',
      speed: 'moderado a rápido',
      luminosity: 'luces de navegación'
    },
    visualPatterns: ['vuelo bajo', 'sonido motor de pistón', 'luces intermitentes'],
    frequency: 65,
    altitude: 'bajo a medio (< 15,000 pies)',
    timeOfDay: ['día', 'noche'],
    isVerified: true,
    verificationSource: 'FAA',
    isActive: true
  },
  {
    name: 'Dron Militar / Reaper',
    category: 'drone',
    description: 'UAV militar de gran tamaño. Silueta característica, vuelo prolongado.',
    characteristics: {
      shape: 'irregular',
      color: ['gris oscuro', 'negro'],
      size: 'mediano',
      behavior: 'vuelo lento y constante, círculos',
      speed: 'lento',
      luminosity: 'luces mínimas o sin luces'
    },
    visualPatterns: ['silueta en forma T', 'vuelo prolongado', 'altura media', 'cerca bases militares'],
    frequency: 15,
    altitude: 'medio a alto (25,000 pies)',
    typicalLocations: ['zonas militares', 'cerca bases'],
    timeOfDay: ['día', 'noche'],
    isVerified: true,
    isActive: true
  },
  {
    name: 'Globo de Helio / Fiesta',
    category: 'balloon',
    description: 'Globo de helio escapado. Común en zonas urbanas, refleja luz.',
    characteristics: {
      shape: 'irregular',
      color: ['plateado', 'multicolor', 'metálico'],
      size: 'pequeño',
      behavior: 'deriva con viento, ascenso',
      speed: 'muy lento',
      luminosity: 'refleja luz solar'
    },
    visualPatterns: ['forma irregular', 'reflejo metálico', 'movimiento errático con viento'],
    frequency: 35,
    altitude: 'bajo',
    typicalLocations: ['urbano', 'zonas residenciales'],
    timeOfDay: ['día'],
    isVerified: true,
    isActive: true
  },
  
  // ============ UAP REPORTADOS ============
  {
    name: 'UAP Tipo Tic-Tac',
    category: 'uap',
    description: 'Objeto blanco alargado sin alas ni propulsión visible. Reportado por pilotos militares (Nimitz, 2004).',
    characteristics: {
      shape: 'cylindrical',
      color: ['blanco'],
      size: 'mediano',
      behavior: 'movimiento instantáneo, aceleración imposible',
      speed: 'estático a muy rápido instantáneamente',
      luminosity: 'blanco brillante'
    },
    visualPatterns: ['forma cilíndrica', 'aceleración súbita', 'sin propulsión visible', 'maniobras imposibles'],
    frequency: 1,
    altitude: 'variable',
    isVerified: false,
    verificationSource: 'US Navy / Pentagon',
    externalLinks: ['https://www.navy.mil/'],
    isActive: true
  }
];

async function seedDatabase() {
  try {
    // Conectar a MongoDB
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Conectado a MongoDB');

    // Limpiar colección existente
    await UFODatabase.deleteMany({});
    console.log('🗑️  Base de datos limpiada');

    // Insertar objetos conocidos
    const inserted = await UFODatabase.insertMany(knownObjects);
    console.log(`✅ ${inserted.length} objetos insertados exitosamente`);

    // Mostrar resumen por categoría
    const categories = await UFODatabase.aggregate([
      {
        $group: {
          _id: '$category',
          count: { $sum: 1 }
        }
      },
      {
        $sort: { count: -1 }
      }
    ]);

    console.log('\n📊 Resumen por categoría:');
    categories.forEach(cat => {
      console.log(`   ${cat._id}: ${cat.count} objetos`);
    });

    console.log('\n✨ Base de datos UFO Database inicializada correctamente');
    
  } catch (error) {
    console.error('❌ Error al inicializar base de datos:', error);
  } finally {
    await mongoose.connection.close();
    console.log('🔌 Desconectado de MongoDB');
  }
}

// Ejecutar seed
seedDatabase();
