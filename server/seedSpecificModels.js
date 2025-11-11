const mongoose = require('mongoose');
require('dotenv').config();
const UFODatabase = require('./models/UFODatabase');

/**
 * Seed de modelos específicos de drones, satélites y aeronaves
 * Complementa la base de datos existente con identificación precisa por modelo
 */

const specificModels = [
  // ==================== DRONES COMERCIALES ====================
  {
    name: 'DJI Phantom 4',
    category: 'drone',
    description: 'Cuadricóptero DJI más popular con cámara 4K integrada. Patrón de LED característico: rojos en brazos traseros y blancos frontales. Tamaño compacto (~35cm). Sonido de zumbido agudo. Muy común en eventos, bodas y producción audiovisual.',
    characteristics: {
      shape: 'other',
      color: ['white', 'gray', 'red'],
      size: 'pequeño (35cm)',
      behavior: 'vuelo estacionario preciso, movimientos suaves',
      speed: 'lento a moderado (hasta 20 m/s)',
      luminosity: 'LED rojos y blancos intermitentes'
    },
    visualPatterns: [
      'quadcopter',
      'drone',
      'red_led_pattern',
      'white_front_leds',
      'small_hovering_object',
      'dji_phantom',
      'four_propellers',
      'camera_gimbal'
    ],
    altitude: '0-500m (uso recreativo típico)',
    typicalLocations: ['áreas urbanas', 'parques', 'eventos', 'bodas', 'zonas rurales'],
    timeOfDay: ['día', 'tarde', 'noche'],
    frequency: 850,
    isVerified: true,
    verificationSource: 'DJI',
    externalLinks: ['https://www.dji.com/phantom-4'],
    isActive: true
  },

  {
    name: 'DJI Mavic Pro',
    category: 'drone',
    description: 'Dron plegable compacto muy popular entre fotógrafos. LEDs verdes traseros y blancos frontales. Extremadamente pequeño (20cm). El dron recreativo más reportado por su ubicuidad.',
    characteristics: {
      shape: 'other',
      color: ['gray', 'black', 'green', 'white'],
      size: 'muy pequeño (20cm)',
      behavior: 'vuelo ágil, flotante preciso',
      speed: 'lento a moderado (hasta 18 m/s)',
      luminosity: 'LED verdes traseros, blancos frontales'
    },
    visualPatterns: [
      'quadcopter',
      'drone',
      'green_rear_leds',
      'white_front_leds',
      'tiny_hovering',
      'dji_mavic',
      'foldable_arms'
    ],
    altitude: '0-500m',
    typicalLocations: ['urbano', 'viajes', 'montaña', 'playa'],
    timeOfDay: ['día', 'tarde', 'noche'],
    frequency: 920,
    isVerified: true,
    verificationSource: 'DJI',
    externalLinks: ['https://www.dji.com/mavic'],
    isActive: true
  },

  {
    name: 'Parrot Bebop 2',
    category: 'drone',
    description: 'Dron ligero con cuerpo rectangular blanco distintivo. LED azul característico en parte trasera. Menos común que DJI pero con patrón de luz único.',
    characteristics: {
      shape: 'rectangular',
      color: ['white', 'blue'],
      size: 'pequeño (32cm)',
      behavior: 'vuelo ligero y ágil',
      speed: 'lento a moderado (hasta 16 m/s)',
      luminosity: 'LED azul trasero distintivo'
    },
    visualPatterns: [
      'quadcopter',
      'drone',
      'blue_rear_led',
      'rectangular_body',
      'parrot',
      'white_body'
    ],
    altitude: '0-300m',
    typicalLocations: ['urbano', 'parques'],
    timeOfDay: ['día', 'tarde'],
    frequency: 280,
    isVerified: true,
    verificationSource: 'Parrot',
    externalLinks: ['https://www.parrot.com/'],
    isActive: true
  },

  // ==================== SATÉLITES ESPECÍFICOS ====================
  {
    name: 'Starlink (Tren de Satélites)',
    category: 'satellite',
    scientificName: 'Starlink Constellation',
    description: 'Constelación de satélites SpaceX. Aparecen como "tren de luces" o "cadena de perlas" poco después del lanzamiento. El avistamiento de formación en línea más reportado desde 2019. Se dispersan con el tiempo.',
    characteristics: {
      shape: 'point',
      color: ['white', 'amarillo'],
      size: 'puntos luminosos pequeños',
      behavior: 'línea perfecta moviéndose uniformemente',
      speed: 'muy rápido (cruzan el cielo en minutos)',
      luminosity: 'brillante, uniforme entre todos los puntos'
    },
    visualPatterns: [
      'satellite_train',
      'line_of_lights',
      'string_of_pearls',
      'starlink',
      'formation',
      'uniform_movement',
      'spacex',
      'multiple_objects'
    ],
    altitude: '340-550km',
    typicalLocations: ['cualquier ubicación', 'cielos oscuros'],
    timeOfDay: ['amanecer', 'anochecer', 'noche'],
    frequency: 1200,
    isVerified: true,
    verificationSource: 'SpaceX, Jonathan McDowell',
    externalLinks: [
      'https://www.spacex.com/launches/',
      'https://findstarlink.com/',
      'https://heavens-above.com/'
    ],
    isActive: true
  },

  {
    name: 'ISS (Estación Espacial Internacional)',
    category: 'satellite',
    scientificName: 'International Space Station',
    description: 'Estación espacial tripulada. Tercer objeto más brillante del cielo nocturno después de la Luna y Venus. Punto luminoso que cruza el cielo en 5-10 minutos sin parpadear. Visible con calendario predecible.',
    characteristics: {
      shape: 'point',
      color: ['white', 'amarillo'],
      size: 'muy brillante',
      behavior: 'arco constante a través del cielo',
      speed: 'muy rápido (7.66 km/s orbital)',
      luminosity: 'extremadamente brillante, no parpadea'
    },
    visualPatterns: [
      'iss',
      'space_station',
      'very_bright_satellite',
      'steady_movement',
      'no_flashing',
      'crosses_sky',
      'third_brightest'
    ],
    altitude: '408-410km',
    typicalLocations: ['cualquier ubicación entre 51.6°N y 51.6°S'],
    timeOfDay: ['amanecer', 'anochecer', 'noche'],
    frequency: 650,
    isVerified: true,
    verificationSource: 'NASA',
    externalLinks: [
      'https://spotthestation.nasa.gov/',
      'https://heavens-above.com/'
    ],
    isActive: true
  },

  {
    name: 'Iridium Flare',
    category: 'satellite',
    scientificName: 'Iridium Communication Satellite',
    description: 'Destello muy brillante causado por reflejo de antenas de satélites Iridium (generación antigua). Menos común desde Iridium NEXT. Brillo súbito e intenso de 1-20 segundos que puede rivalizar con Venus.',
    characteristics: {
      shape: 'point',
      color: ['white', 'amarillo'],
      size: 'punto extremadamente brillante',
      behavior: 'destello súbito, aumento y disminución rápida',
      speed: 'aparentemente estático durante el flash',
      luminosity: 'extremadamente brillante, puede ser visible de día'
    },
    visualPatterns: [
      'iridium_flare',
      'satellite_flash',
      'brief_intense_light',
      'predictable_flash',
      'daytime_visible',
      'antenna_reflection'
    ],
    altitude: '780km',
    typicalLocations: ['cualquier ubicación'],
    timeOfDay: ['amanecer', 'anochecer', 'noche', 'día ocasionalmente'],
    frequency: 180,
    isVerified: true,
    verificationSource: 'Iridium Communications',
    externalLinks: [
      'https://www.heavens-above.com/IridiumFlares.aspx'
    ],
    isActive: true
  },

  // ==================== AERONAVES ESPECÍFICAS ====================
  {
    name: 'Boeing 737',
    category: 'aircraft',
    description: 'Avión comercial más común mundialmente. Patrón estándar de luces: roja (izquierda), verde (derecha), blanca (cola), estrobos blancos parpadeantes. Sonido característico de motores jet.',
    characteristics: {
      shape: 'cylindrical',
      color: ['white', 'metallic', 'rojo', 'verde'],
      size: 'grande (39m longitud)',
      behavior: 'vuelo lineal en rutas comerciales',
      speed: 'rápido (200 m/s crucero)',
      luminosity: 'luces de navegación estándar + estrobos intermitentes'
    },
    visualPatterns: [
      'commercial_aircraft',
      'navigation_lights',
      'red_green_white',
      'strobes',
      'jet_engine_sound',
      'contrail',
      'boeing',
      'large_plane'
    ],
    altitude: '0-12500m',
    typicalLocations: ['rutas comerciales', 'cerca de aeropuertos', 'corredores aéreos'],
    timeOfDay: ['día', 'tarde', 'noche', 'madrugada'],
    frequency: 3200,
    isVerified: true,
    verificationSource: 'Boeing, FlightRadar24',
    externalLinks: ['https://www.flightradar24.com/'],
    isActive: true
  },

  {
    name: 'Cessna 172 Skyhawk',
    category: 'aircraft',
    description: 'Avión pequeño de entrenamiento y recreativo más popular del mundo. Ala alta distintiva, motor único de pistón. Vuelo bajo y lento cerca de aeropuertos pequeños.',
    characteristics: {
      shape: 'other',
      color: ['white', 'rojo', 'azul', 'verde'],
      size: 'pequeño (8m longitud)',
      behavior: 'vuelo bajo, lento, a veces circular',
      speed: 'lento (45 m/s crucero)',
      luminosity: 'luces de navegación tenues'
    },
    visualPatterns: [
      'small_aircraft',
      'general_aviation',
      'high_wing',
      'single_engine',
      'propeller_sound',
      'cessna',
      'slow_flight',
      'low_altitude'
    ],
    altitude: '0-4500m',
    typicalLocations: ['cerca de aeropuertos pequeños', 'zonas rurales', 'entrenamiento'],
    timeOfDay: ['día', 'tarde'],
    frequency: 890,
    isVerified: true,
    verificationSource: 'Cessna, FAA',
    externalLinks: ['https://www.flightradar24.com/'],
    isActive: true
  },

  // ==================== HELICÓPTEROS ====================
  {
    name: 'Helicóptero Policial/Noticias',
    category: 'aircraft',
    description: 'Helicópteros con foco potente (searchlight) que se confunde frecuentemente con UAPs. Patrón circular, foco blanco brillante dirigido al suelo, sonido distintivo de rotor.',
    characteristics: {
      shape: 'other',
      color: ['oscuro', 'blanco brillante del foco'],
      size: 'mediano',
      behavior: 'vuelo circular, estacionario, movimiento errático',
      speed: 'lento a moderado',
      luminosity: 'foco muy brillante dirigido hacia abajo'
    },
    visualPatterns: [
      'helicopter',
      'searchlight',
      'bright_spotlight',
      'circular_pattern',
      'hovering',
      'rotor_sound',
      'police',
      'news_chopper'
    ],
    altitude: '100-1500m',
    typicalLocations: ['urbano', 'escenas de crimen', 'persecuciones', 'eventos'],
    timeOfDay: ['tarde', 'noche', 'madrugada'],
    frequency: 720,
    isVerified: true,
    verificationSource: 'Múltiples departamentos policiales',
    isActive: true
  }
];

async function seedSpecificModels() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Conectado a MongoDB');

    // Insertar o actualizar modelos
    let inserted = 0;
    let updated = 0;

    for (const model of specificModels) {
      const existing = await UFODatabase.findOne({ name: model.name });

      if (existing) {
        await UFODatabase.updateOne({ _id: existing._id }, model);
        updated++;
        console.log(`   ⬆️  Actualizado: ${model.name}`);
      } else {
        await UFODatabase.create(model);
        inserted++;
        console.log(`   ➕ Insertado: ${model.name}`);
      }
    }

    console.log(`\n📊 Resumen:`);
    console.log(`   ➕ Nuevos modelos: ${inserted}`);
    console.log(`   ⬆️  Modelos actualizados: ${updated}`);
    console.log(`   📦 Total procesado: ${specificModels.length}`);

    // Estadísticas por categoría
    const stats = await UFODatabase.aggregate([
      { $match: { isActive: true } },
      { $group: { _id: '$category', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);

    console.log('\n📊 Objetos en base de datos por categoría:');
    stats.forEach(stat => {
      console.log(`   ${stat._id}: ${stat.count} objetos`);
    });

    // Top 5 más reportados
    console.log('\n🔥 Top 5 objetos más reportados:');
    const topReported = await UFODatabase.find({ isActive: true })
      .sort({ frequency: -1 })
      .limit(5)
      .select('name frequency category');
    
    topReported.forEach((obj, index) => {
      console.log(`   ${index + 1}. ${obj.name} (${obj.frequency} reportes) - ${obj.category}`);
    });

    process.exit(0);

  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

seedSpecificModels();
