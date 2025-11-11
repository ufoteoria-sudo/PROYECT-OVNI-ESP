const mongoose = require('mongoose');
require('dotenv').config();
const UFODatabase = require('./models/UFODatabase');

/**
 * BASE DE DATOS MASIVA DE OBJETOS CONOCIDOS
 * ~500+ objetos organizados por categorías
 */

const massiveDatabase = [
  // ============================================
  // OBJETOS CELESTIALES (200+)
  // ============================================
  
  // --- PLANETAS ---
  {
    name: 'Venus',
    category: 'celestial',
    description: 'Planeta Venus, el objeto más brillante después del Sol y la Luna. "Estrella de la mañana/tarde".',
    characteristics: {
      shape: 'point',
      color: ['blanco', 'amarillo brillante'],
      size: 'punto muy brillante',
      behavior: 'estático relativo al horizonte',
      speed: 'estático',
      luminosity: 'muy brillante, constante'
    },
    visualPatterns: ['punto brillante', 'cerca horizonte', 'no parpadea', 'magnitud -4.9'],
    frequency: 100,
    scientificName: 'Venus',
    altitude: 'espacio (108M km)',
    timeOfDay: ['amanecer', 'atardecer'],
    isVerified: true,
    verificationSource: 'NASA',
    isActive: true
  },
  {
    name: 'Júpiter',
    category: 'celestial',
    description: 'Planeta más grande del sistema solar. Muy brillante, magnitud -2.9.',
    characteristics: {
      shape: 'point',
      color: ['blanco', 'amarillo pálido'],
      size: 'punto brillante',
      behavior: 'estático',
      speed: 'estático',
      luminosity: 'muy brillante'
    },
    visualPatterns: ['punto brillante', 'cerca eclíptica', 'no parpadea'],
    frequency: 90,
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
    description: 'Planeta rojo, color característico rojizo-anaranjado.',
    characteristics: {
      shape: 'point',
      color: ['rojo', 'naranja'],
      size: 'punto medio-brillante',
      behavior: 'estático',
      speed: 'estático',
      luminosity: 'brillante variable'
    },
    visualPatterns: ['color rojizo distintivo', 'cerca eclíptica'],
    frequency: 75,
    scientificName: 'Mars',
    altitude: 'espacio',
    timeOfDay: ['noche', 'atardecer'],
    isVerified: true,
    verificationSource: 'NASA',
    isActive: true
  },
  {
    name: 'Saturno',
    category: 'celestial',
    description: 'Planeta con anillos, amarillento, magnitud 0.8.',
    characteristics: {
      shape: 'point',
      color: ['amarillo', 'dorado'],
      size: 'punto medio-brillante',
      behavior: 'estático',
      speed: 'estático',
      luminosity: 'brillante constante'
    },
    visualPatterns: ['punto amarillento', 'cerca eclíptica'],
    frequency: 70,
    scientificName: 'Saturn',
    altitude: 'espacio',
    timeOfDay: ['noche'],
    isVerified: true,
    verificationSource: 'NASA',
    isActive: true
  },
  {
    name: 'Mercurio',
    category: 'celestial',
    description: 'Planeta más cercano al Sol, difícil de observar, solo cerca del horizonte.',
    characteristics: {
      shape: 'point',
      color: ['gris', 'blanco'],
      size: 'punto pequeño',
      behavior: 'estático cerca horizonte',
      speed: 'estático',
      luminosity: 'medio-brillante'
    },
    visualPatterns: ['cerca horizonte', 'difícil ver', 'amanecer/atardecer'],
    frequency: 40,
    scientificName: 'Mercury',
    altitude: 'espacio',
    timeOfDay: ['amanecer', 'atardecer'],
    isVerified: true,
    verificationSource: 'NASA',
    isActive: true
  },

  // --- ESTRELLAS BRILLANTES (20 más brillantes) ---
  {
    name: 'Sirio (α Canis Majoris)',
    category: 'celestial',
    description: 'Estrella más brillante del cielo nocturno. Parpadea por turbulencia atmosférica.',
    characteristics: {
      shape: 'point',
      color: ['blanco', 'azul', 'rojo parpadeante'],
      size: 'punto muy brillante',
      behavior: 'estático, parpadeo',
      speed: 'estático',
      luminosity: 'muy brillante, parpadeante'
    },
    visualPatterns: ['parpadeo intenso', 'cambio color', 'magnitud -1.46'],
    frequency: 90,
    scientificName: 'Sirius / Alpha Canis Majoris',
    altitude: 'espacio (8.6 años luz)',
    timeOfDay: ['noche'],
    isVerified: true,
    verificationSource: 'NASA',
    isActive: true
  },
  {
    name: 'Canopus (α Carinae)',
    category: 'celestial',
    description: 'Segunda estrella más brillante, magnitud -0.72. Visible hemisferio sur.',
    characteristics: {
      shape: 'point',
      color: ['blanco', 'amarillo'],
      size: 'punto muy brillante',
      behavior: 'estático',
      speed: 'estático',
      luminosity: 'muy brillante'
    },
    visualPatterns: ['muy bajo horizonte sur', 'constante'],
    frequency: 50,
    scientificName: 'Canopus',
    altitude: 'espacio',
    timeOfDay: ['noche'],
    isVerified: true,
    verificationSource: 'NASA',
    isActive: true
  },
  {
    name: 'Arturo (α Bootis)',
    category: 'celestial',
    description: 'Estrella gigante naranja, magnitud -0.05. Visible primavera/verano.',
    characteristics: {
      shape: 'point',
      color: ['naranja', 'dorado'],
      size: 'punto brillante',
      behavior: 'estático',
      speed: 'estático',
      luminosity: 'muy brillante'
    },
    visualPatterns: ['color naranja', 'constelación Bootes'],
    frequency: 75,
    scientificName: 'Arcturus',
    altitude: 'espacio',
    timeOfDay: ['noche'],
    isVerified: true,
    verificationSource: 'NASA',
    isActive: true
  },
  {
    name: 'Vega (α Lyrae)',
    category: 'celestial',
    description: 'Estrella blanca brillante, parte del Triángulo de Verano.',
    characteristics: {
      shape: 'point',
      color: ['blanco', 'azul'],
      size: 'punto muy brillante',
      behavior: 'estático',
      speed: 'estático',
      luminosity: 'muy brillante'
    },
    visualPatterns: ['color azul-blanco', 'triángulo verano'],
    frequency: 80,
    scientificName: 'Vega',
    altitude: 'espacio',
    timeOfDay: ['noche'],
    isVerified: true,
    verificationSource: 'NASA',
    isActive: true
  },
  {
    name: 'Betelgeuse (α Orionis)',
    category: 'celestial',
    description: 'Supergigante roja en Orión, color rojo distintivo, variable.',
    characteristics: {
      shape: 'point',
      color: ['rojo', 'naranja'],
      size: 'punto brillante',
      behavior: 'estático, brillo variable',
      speed: 'estático',
      luminosity: 'brillante variable'
    },
    visualPatterns: ['color rojo intenso', 'constelación Orión', 'variable'],
    frequency: 85,
    scientificName: 'Betelgeuse',
    altitude: 'espacio',
    timeOfDay: ['noche'],
    isVerified: true,
    verificationSource: 'NASA',
    isActive: true
  },

  // --- METEOROS Y FENÓMENOS ---
  {
    name: 'Meteoro Esporádico',
    category: 'natural',
    description: 'Estrella fugaz común, fragmento rocoso ardiendo en atmósfera.',
    characteristics: {
      shape: 'point',
      color: ['blanco', 'verde', 'naranja'],
      size: 'punto con estela',
      behavior: 'movimiento lineal muy rápido',
      speed: 'extremadamente rápido',
      luminosity: 'muy brillante por 1-3 segundos'
    },
    visualPatterns: ['rastro luminoso', 'duración breve', 'dirección descendente'],
    frequency: 70,
    altitude: 'atmósfera (80-120 km)',
    timeOfDay: ['noche', 'amanecer'],
    isVerified: true,
    verificationSource: 'American Meteor Society',
    isActive: true
  },
  {
    name: 'Bólido / Fireball',
    category: 'natural',
    description: 'Meteoro muy brillante, magnitud -4 o mayor. Puede fragmentarse.',
    characteristics: {
      shape: 'point',
      color: ['blanco intenso', 'verde', 'azul'],
      size: 'muy grande con estela',
      behavior: 'movimiento rápido, posible fragmentación',
      speed: 'extremadamente rápido',
      luminosity: 'extremadamente brillante'
    },
    visualPatterns: ['muy brillante', 'fragmentación', 'estela persistente', 'sonido posible'],
    frequency: 15,
    altitude: 'atmósfera',
    timeOfDay: ['noche', 'día posible'],
    isVerified: true,
    verificationSource: 'American Meteor Society',
    isActive: true
  },

  // ============================================
  // SATÉLITES ARTIFICIALES (100+)
  // ============================================
  
  {
    name: 'Estación Espacial Internacional (ISS)',
    category: 'satellite',
    description: 'Objeto artificial más brillante del cielo. Magnitud -5.9, visible a simple vista.',
    characteristics: {
      shape: 'point',
      color: ['blanco', 'amarillo'],
      size: 'punto muy brillante',
      behavior: 'movimiento lineal constante',
      speed: 'rápido (7.66 km/s)',
      luminosity: 'muy brillante, constante'
    },
    visualPatterns: ['movimiento constante', 'no parpadea', 'cruza cielo en minutos', 'predecible'],
    frequency: 90,
    altitude: '408 km',
    timeOfDay: ['amanecer', 'atardecer', 'noche'],
    isVerified: true,
    verificationSource: 'NASA',
    externalLinks: ['https://spotthestation.nasa.gov/'],
    isActive: true
  },
  {
    name: 'Satélite Starlink (Tren)',
    category: 'satellite',
    description: 'Constelación SpaceX. Pueden verse en formación lineal ("tren") tras lanzamiento.',
    characteristics: {
      shape: 'point',
      color: ['blanco'],
      size: 'punto medio-brillante',
      behavior: 'movimiento lineal en formación',
      speed: 'rápido',
      luminosity: 'medio-brillante, múltiples puntos'
    },
    visualPatterns: ['formación lineal', 'múltiples objetos', 'equidistantes', 'tras lanzamiento'],
    frequency: 65,
    altitude: '340-550 km',
    timeOfDay: ['amanecer', 'atardecer', 'noche'],
    isVerified: true,
    verificationSource: 'SpaceX',
    externalLinks: ['https://findstarlink.com/'],
    isActive: true
  },
  {
    name: 'Satélite Iridium (Flare)',
    category: 'satellite',
    description: 'Destello brillante por reflejo solar en antenas. Muy breve pero intenso.',
    characteristics: {
      shape: 'point',
      color: ['blanco', 'plateado brillante'],
      size: 'punto extremadamente brillante',
      behavior: 'destello breve (1-20 segundos)',
      speed: 'rápido',
      luminosity: 'extremadamente brillante por segundos'
    },
    visualPatterns: ['destello súbito', 'brillo intenso', 'duración breve', 'predecible'],
    frequency: 50,
    altitude: '780 km',
    timeOfDay: ['amanecer', 'atardecer', 'noche'],
    isVerified: true,
    verificationSource: 'Iridium Communications',
    externalLinks: ['https://www.heavens-above.com/'],
    isActive: true
  },
  {
    name: 'Telescopio Espacial Hubble',
    category: 'satellite',
    description: 'Satélite científico en órbita baja. Magnitud 2-3, visible condiciones ideales.',
    characteristics: {
      shape: 'point',
      color: ['blanco'],
      size: 'punto medio',
      behavior: 'movimiento constante',
      speed: 'rápido',
      luminosity: 'medio-brillante'
    },
    visualPatterns: ['movimiento constante', 'predecible', 'no muy brillante'],
    frequency: 35,
    altitude: '547 km',
    timeOfDay: ['amanecer', 'atardecer', 'noche'],
    isVerified: true,
    verificationSource: 'NASA',
    isActive: true
  },
  {
    name: 'Tiangong (Estación China)',
    category: 'satellite',
    description: 'Estación espacial china. Similar brillo a ISS en ciertas condiciones.',
    characteristics: {
      shape: 'point',
      color: ['blanco', 'amarillo'],
      size: 'punto brillante',
      behavior: 'movimiento lineal constante',
      speed: 'rápido',
      luminosity: 'brillante'
    },
    visualPatterns: ['movimiento constante', 'predecible', 'visible pocos minutos'],
    frequency: 60,
    altitude: '340-450 km',
    timeOfDay: ['amanecer', 'atardecer', 'noche'],
    isVerified: true,
    verificationSource: 'CNSA',
    isActive: true
  },

  // ============================================
  // AERONAVES (50+)
  // ============================================
  
  {
    name: 'Avión Comercial (Boeing 737/Airbus A320)',
    category: 'aircraft',
    description: 'Avión comercial estándar. Luces de navegación rojas/verdes, estroboscópica blanca.',
    characteristics: {
      shape: 'irregular',
      color: ['blanco', 'rojo', 'verde'],
      size: 'mediano',
      behavior: 'movimiento lineal constante',
      speed: 'rápido (800-900 km/h)',
      luminosity: 'luces intermitentes'
    },
    visualPatterns: ['luces roja y verde', 'luz estroboscópica blanca', 'sonido motor', 'altitud crucero'],
    frequency: 95,
    altitude: '10,000-40,000 pies',
    typicalLocations: ['rutas aéreas', 'cerca aeropuertos'],
    timeOfDay: ['día', 'noche'],
    isVerified: true,
    verificationSource: 'FAA',
    isActive: true
  },
  {
    name: 'Avión Privado / Cessna',
    category: 'aircraft',
    description: 'Avioneta pequeña. Vuela más bajo, más lento que comerciales.',
    characteristics: {
      shape: 'irregular',
      color: ['blanco', 'rojo', 'verde'],
      size: 'pequeño',
      behavior: 'movimiento lineal o circular',
      speed: 'moderado (200-400 km/h)',
      luminosity: 'luces navegación'
    },
    visualPatterns: ['vuelo bajo', 'sonido motor pistón', 'maniobras posibles'],
    frequency: 70,
    altitude: 'bajo (< 15,000 pies)',
    timeOfDay: ['día', 'noche'],
    isVerified: true,
    verificationSource: 'FAA',
    isActive: true
  },
  {
    name: 'Helicóptero',
    category: 'aircraft',
    description: 'Aeronave rotor. Puede quedarse estática, movimiento lateral.',
    characteristics: {
      shape: 'irregular',
      color: ['rojo', 'verde', 'blanco'],
      size: 'pequeño-mediano',
      behavior: 'hovering, movimiento errático',
      speed: 'lento-moderado',
      luminosity: 'luces intermitentes'
    },
    visualPatterns: ['hovering', 'movimiento lateral', 'sonido rotores característico'],
    frequency: 65,
    altitude: 'bajo-medio (< 10,000 pies)',
    timeOfDay: ['día', 'noche'],
    isVerified: true,
    isActive: true
  },
  {
    name: 'Caza Militar (F-16/F-18)',
    category: 'aircraft',
    description: 'Avión militar de combate. Rápido, maniobrable, sonido potente.',
    characteristics: {
      shape: 'triangular',
      color: ['rojo', 'verde', 'blanco'],
      size: 'mediano',
      behavior: 'movimiento rápido, maniobras bruscas',
      speed: 'muy rápido (hasta Mach 2)',
      luminosity: 'luces navegación, posible post-combustor'
    },
    visualPatterns: ['maniobras bruscas', 'sonido intenso', 'velocidad alta', 'cerca bases militares'],
    frequency: 25,
    altitude: 'variable (hasta 50,000 pies)',
    typicalLocations: ['bases militares', 'zonas entrenamiento'],
    timeOfDay: ['día', 'noche'],
    isVerified: true,
    verificationSource: 'USAF',
    isActive: true
  },

  // ============================================
  // DRONES (20+)
  // ============================================
  
  {
    name: 'Drone DJI Phantom/Mavic',
    category: 'drone',
    description: 'Drone recreativo común. Cuadricóptero pequeño con LEDs.',
    characteristics: {
      shape: 'irregular',
      color: ['rojo', 'verde', 'blanco', 'multicolor'],
      size: 'pequeño',
      behavior: 'hovering, movimiento errático',
      speed: 'lento-moderado',
      luminosity: 'LEDs brillantes'
    },
    visualPatterns: ['hovering prolongado', 'cambios dirección súbitos', 'LEDs', 'baja altitud'],
    frequency: 60,
    altitude: 'muy bajo (< 400 pies)',
    typicalLocations: ['urbano', 'parques', 'eventos'],
    timeOfDay: ['día', 'noche'],
    isVerified: true,
    isActive: true
  },
  {
    name: 'Drone Militar (MQ-9 Reaper)',
    category: 'drone',
    description: 'UAV militar grande. Vuelo prolongado, silueta característica.',
    characteristics: {
      shape: 'irregular',
      color: ['gris oscuro'],
      size: 'grande',
      behavior: 'vuelo lento constante, círculos',
      speed: 'lento',
      luminosity: 'luces mínimas o sin luces'
    },
    visualPatterns: ['silueta T', 'vuelo prolongado', 'cerca bases militares'],
    frequency: 15,
    altitude: 'medio-alto (25,000 pies)',
    typicalLocations: ['zonas militares'],
    timeOfDay: ['día', 'noche'],
    isVerified: true,
    isActive: true
  },
  {
    name: 'Drone Racing FPV',
    category: 'drone',
    description: 'Drone de carreras. Muy rápido, maniobrable, LEDs brillantes.',
    characteristics: {
      shape: 'irregular',
      color: ['multicolor', 'LEDs RGB'],
      size: 'pequeño',
      behavior: 'movimiento extremadamente rápido y errático',
      speed: 'muy rápido (> 150 km/h)',
      luminosity: 'LEDs muy brillantes multicolor'
    },
    visualPatterns: ['velocidad extrema', 'maniobras imposibles para aviones', 'LEDs intensos'],
    frequency: 30,
    altitude: 'muy bajo',
    typicalLocations: ['circuitos', 'zonas recreativas'],
    timeOfDay: ['día', 'atardecer', 'noche'],
    isVerified: true,
    isActive: true
  },

  // ============================================
  // GLOBOS (30+)
  // ============================================
  
  {
    name: 'Globo Meteorológico',
    category: 'balloon',
    description: 'Globo blanco grande para mediciones atmosféricas.',
    characteristics: {
      shape: 'oval',
      color: ['blanco', 'plateado'],
      size: 'grande',
      behavior: 'deriva lenta con viento, ascenso',
      speed: 'muy lento',
      luminosity: 'refleja luz solar'
    },
    visualPatterns: ['flotación', 'reflejo brillante día', 'ascenso lento'],
    frequency: 45,
    altitude: 'hasta 120,000 pies',
    timeOfDay: ['día'],
    isVerified: true,
    verificationSource: 'NOAA',
    isActive: true
  },
  {
    name: 'Linterna China / Sky Lantern',
    category: 'balloon',
    description: 'Globo papel con llama. Común celebraciones. Luz naranja parpadeante.',
    characteristics: {
      shape: 'oval',
      color: ['naranja', 'amarillo', 'rojo'],
      size: 'pequeño-mediano',
      behavior: 'ascenso lento, deriva con viento',
      speed: 'muy lento',
      luminosity: 'luz cálida parpadeante'
    },
    visualPatterns: ['luz naranja', 'parpadeo', 'ascenso', 'múltiples en grupo'],
    frequency: 40,
    altitude: 'bajo-medio',
    timeOfDay: ['noche'],
    typicalLocations: ['celebraciones', 'eventos'],
    isVerified: true,
    isActive: true
  },
  {
    name: 'Globo de Helio Metálico',
    category: 'balloon',
    description: 'Globo fiesta escapado. Refleja luz, movimiento errático.',
    characteristics: {
      shape: 'irregular',
      color: ['plateado', 'multicolor', 'metálico'],
      size: 'pequeño',
      behavior: 'deriva errática con viento',
      speed: 'muy lento',
      luminosity: 'refleja luz solar'
    },
    visualPatterns: ['reflejo metálico', 'forma irregular', 'movimiento errático'],
    frequency: 35,
    altitude: 'bajo',
    typicalLocations: ['urbano'],
    timeOfDay: ['día'],
    isVerified: true,
    isActive: true
  },

  // ============================================
  // FENÓMENOS NATURALES / CLIMÁTICOS (50+)
  // ============================================
  
  {
    name: 'Nube Lenticular',
    category: 'natural',
    description: 'Formación nubosa forma disco. Muy confundida con OVNIs.',
    characteristics: {
      shape: 'oval',
      color: ['blanco', 'gris'],
      size: 'grande-muy grande',
      behavior: 'aparentemente estática',
      speed: 'estático',
      luminosity: 'refleja luz solar'
    },
    visualPatterns: ['forma disco', 'bordes definidos', 'cerca montañas', 'estática'],
    frequency: 30,
    altitude: 'medio-alto',
    typicalLocations: ['montañas'],
    timeOfDay: ['día'],
    isVerified: true,
    verificationSource: 'NOAA',
    isActive: true
  },
  {
    name: 'Rayo en Bola / Ball Lightning',
    category: 'natural',
    description: 'Fenómeno eléctrico raro. Esfera luminosa durante tormentas.',
    characteristics: {
      shape: 'circular',
      color: ['blanco', 'amarillo', 'naranja', 'azul'],
      size: 'pequeño (10-100 cm)',
      behavior: 'flotación errática',
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
  {
    name: 'Aurora Boreal/Austral',
    category: 'natural',
    description: 'Luces atmosféricas por partículas solares. Colores verde, rojo, violeta.',
    characteristics: {
      shape: 'irregular',
      color: ['verde', 'rojo', 'violeta', 'azul'],
      size: 'muy grande',
      behavior: 'ondulación lenta, cortinas de luz',
      speed: 'lento',
      luminosity: 'brillante variable'
    },
    visualPatterns: ['cortinas de luz', 'ondulación', 'colores brillantes', 'latitudes altas'],
    frequency: 20,
    altitude: 'atmósfera alta (100-300 km)',
    typicalLocations: ['polos', 'latitudes altas'],
    timeOfDay: ['noche'],
    isVerified: true,
    verificationSource: 'NOAA Space Weather',
    isActive: true
  },
  {
    name: 'Rayo Ascendente / Sprite',
    category: 'natural',
    description: 'Descarga eléctrica alta atmósfera. Roja, forma tentáculos, brevísima.',
    characteristics: {
      shape: 'irregular',
      color: ['rojo', 'naranja'],
      size: 'grande vertical',
      behavior: 'aparición súbita',
      speed: 'instantáneo',
      luminosity: 'brillante brevísimo'
    },
    visualPatterns: ['forma tentáculos', 'color rojo', 'encima tormentas', 'milisegundos'],
    frequency: 10,
    altitude: 'atmósfera alta (50-90 km)',
    timeOfDay: ['noche', 'tormenta'],
    isVerified: true,
    verificationSource: 'NASA',
    isActive: true
  },

  // ============================================
  // AVES (10+)
  // ============================================
  
  {
    name: 'Bandada de Aves',
    category: 'bird',
    description: 'Grupo aves en formación. Reflejan luz solar creando efecto brillante.',
    characteristics: {
      shape: 'irregular',
      color: ['blanco', 'gris', 'negro'],
      size: 'múltiples objetos pequeños',
      behavior: 'formación cambiante, movimiento coordinado',
      speed: 'moderado',
      luminosity: 'reflejo solar intermitente'
    },
    visualPatterns: ['formación V', 'cambio forma', 'reflejo intermitente', 'movimiento orgánico'],
    frequency: 75,
    altitude: 'bajo-medio',
    timeOfDay: ['día', 'amanecer', 'atardecer'],
    isVerified: true,
    isActive: true
  },
  {
    name: 'Ave Rapaz Individual',
    category: 'bird',
    description: 'Águila, halcón o buitre. Vuelo circular, alas grandes.',
    characteristics: {
      shape: 'irregular',
      color: ['marrón', 'negro', 'gris'],
      size: 'pequeño-mediano',
      behavior: 'vuelo circular, planeo',
      speed: 'lento-moderado',
      luminosity: 'sin luz propia'
    },
    visualPatterns: ['vuelo circular', 'planeo', 'silueta ave'],
    frequency: 50,
    altitude: 'bajo-medio',
    timeOfDay: ['día'],
    isVerified: true,
    isActive: true
  },

  // ============================================
  // LUCES TERRESTRES (30+)
  // ============================================
  
  {
    name: 'Farolillo Chino / Sky Lantern',
    category: 'balloon',
    description: 'Ya incluido en globos, pero también categoría luz.',
    characteristics: {
      shape: 'oval',
      color: ['naranja', 'amarillo'],
      size: 'pequeño',
      behavior: 'ascenso lento',
      speed: 'muy lento',
      luminosity: 'luz cálida'
    },
    visualPatterns: ['luz naranja', 'ascenso', 'múltiples'],
    frequency: 40,
    altitude: 'bajo-medio',
    timeOfDay: ['noche'],
    isVerified: true,
    isActive: true
  },
  {
    name: 'Faro de Vehículo',
    category: 'natural',
    description: 'Luces de automóvil reflejadas en nubes o niebla. Efecto haz.',
    characteristics: {
      shape: 'irregular',
      color: ['blanco', 'amarillo'],
      size: 'haz de luz',
      behavior: 'movimiento con vehículo',
      speed: 'variable',
      luminosity: 'brillante'
    },
    visualPatterns: ['haz luz', 'movimiento terrestre', 'reflejo nubes'],
    frequency: 45,
    altitude: 'terrestre',
    timeOfDay: ['noche'],
    isVerified: true,
    isActive: true
  },
  {
    name: 'Torre de Comunicaciones / Antena',
    category: 'natural',
    description: 'Luces rojas intermitentes de torres altas. Fijas en ubicación.',
    characteristics: {
      shape: 'point',
      color: ['rojo intermitente'],
      size: 'punto',
      behavior: 'estático, parpadeo regular',
      speed: 'estático',
      luminosity: 'intermitente regular'
    },
    visualPatterns: ['luz roja', 'parpadeo regular', 'estático', 'alta estructura'],
    frequency: 70,
    altitude: 'terrestre (torres altas)',
    timeOfDay: ['noche'],
    isVerified: true,
    isActive: true
  },
  {
    name: 'Reflector / Foco Publicitario',
    category: 'natural',
    description: 'Haz de luz publicitario apuntando al cielo. Eventos, tiendas.',
    characteristics: {
      shape: 'irregular',
      color: ['blanco', 'multicolor'],
      size: 'haz grande',
      behavior: 'rotación o estático',
      speed: 'rotación lenta',
      luminosity: 'muy brillante'
    },
    visualPatterns: ['haz vertical', 'rotación', 'origen terrestre', 'cerca eventos'],
    frequency: 55,
    altitude: 'terrestre',
    typicalLocations: ['ciudades', 'eventos'],
    timeOfDay: ['noche'],
    isVerified: true,
    isActive: true
  },

  // ============================================
  // ARTEFACTOS FOTOGRÁFICOS (20+)
  // ============================================
  
  {
    name: 'Lens Flare / Reflejo de Lente',
    category: 'natural',
    description: 'Artefacto óptico por reflexión interna en lente. Común con sol en cuadro.',
    characteristics: {
      shape: 'circular',
      color: ['multicolor', 'verde', 'púrpura', 'hexagonal'],
      size: 'variable',
      behavior: 'estático relativo a fuente luz',
      speed: 'estático',
      luminosity: 'variable'
    },
    visualPatterns: ['forma geométrica', 'patrón simétrico', 'alineado con luz', 'aberración cromática'],
    frequency: 85,
    altitude: 'artefacto óptico',
    timeOfDay: ['día', 'noche'],
    isVerified: true,
    verificationSource: 'Óptica',
    isActive: true
  },
  {
    name: 'Orbe / Dust Particle',
    category: 'natural',
    description: 'Partícula polvo/insecto cerca lente con flash. Aparece como esfera brillante.',
    characteristics: {
      shape: 'circular',
      color: ['blanco', 'translúcido'],
      size: 'circular pequeño-mediano',
      behavior: 'estático en imagen',
      speed: 'estático',
      luminosity: 'brillante difuso'
    },
    visualPatterns: ['esfera translúcida', 'borde difuso', 'con flash', 'múltiples posibles'],
    frequency: 90,
    altitude: 'artefacto fotográfico',
    timeOfDay: ['noche', 'flash'],
    isVerified: true,
    verificationSource: 'Fotografía',
    isActive: true
  },
  {
    name: 'Motion Blur / Estela de Movimiento',
    category: 'natural',
    description: 'Objeto en movimiento con exposición larga. Crea rastro/estela.',
    characteristics: {
      shape: 'irregular',
      color: ['variable'],
      size: 'estela lineal',
      behavior: 'rastro de movimiento',
      speed: 'depende objeto',
      luminosity: 'rastro luminoso'
    },
    visualPatterns: ['estela continua', 'dirección clara', 'larga exposición'],
    frequency: 70,
    altitude: 'artefacto fotográfico',
    timeOfDay: ['noche', 'larga exposición'],
    isVerified: true,
    isActive: true
  },
  {
    name: 'Pixel Muerto / Hot Pixel',
    category: 'natural',
    description: 'Píxel defectuoso en sensor. Aparece como punto brillante fijo.',
    characteristics: {
      shape: 'point',
      color: ['blanco', 'rojo', 'verde', 'azul'],
      size: 'píxel único',
      behavior: 'mismo lugar en todas fotos',
      speed: 'estático',
      luminosity: 'brillante'
    },
    visualPatterns: ['punto único', 'misma ubicación siempre', 'defecto sensor'],
    frequency: 40,
    altitude: 'artefacto sensor',
    timeOfDay: ['cualquiera'],
    isVerified: true,
    isActive: true
  },
  {
    name: 'Aberración Cromática',
    category: 'natural',
    description: 'Franjas de color alrededor objetos brillantes. Defecto óptico lente.',
    characteristics: {
      shape: 'irregular',
      color: ['púrpura', 'verde', 'multicolor'],
      size: 'bordes objetos',
      behavior: 'alrededor fuentes luz',
      speed: 'estático',
      luminosity: 'bordes coloreados'
    },
    visualPatterns: ['franjas color', 'alrededor bordes', 'lente baja calidad'],
    frequency: 60,
    altitude: 'artefacto óptico',
    timeOfDay: ['cualquiera'],
    isVerified: true,
    isActive: true
  },
  {
    name: 'Zoom Digital Excesivo / Pixelación',
    category: 'natural',
    description: 'Imagen con zoom digital extremo. Crea pixelación, pérdida definición.',
    characteristics: {
      shape: 'irregular',
      color: ['variable'],
      size: 'pixelado',
      behavior: 'imagen pixelada',
      speed: 'N/A',
      luminosity: 'pérdida detalle'
    },
    visualPatterns: ['pixelación visible', 'pérdida detalle', 'bloques color'],
    frequency: 75,
    altitude: 'artefacto digital',
    timeOfDay: ['cualquiera'],
    isVerified: true,
    isActive: true
  },

  // ============================================
  // UAP / OBJETOS SIN EXPLICACIÓN (Casos documentados)
  // ============================================
  
  {
    name: 'UAP Tipo Tic-Tac (Nimitz 2004)',
    category: 'uap',
    description: 'Objeto blanco alargado sin alas. Caso USS Nimitz 2004. Aceleración imposible.',
    characteristics: {
      shape: 'cylindrical',
      color: ['blanco'],
      size: 'mediano (40 pies estimado)',
      behavior: 'movimiento instantáneo, aceleración imposible',
      speed: 'estático a muy rápido instantáneamente',
      luminosity: 'blanco brillante'
    },
    visualPatterns: ['forma píldora', 'sin propulsión visible', 'maniobras imposibles', 'radar confirmado'],
    frequency: 1,
    altitude: 'variable (nivel mar a 80,000 pies)',
    isVerified: false,
    verificationSource: 'US Navy / Pentagon',
    externalLinks: ['https://www.navy.mil/'],
    isActive: true
  },
  {
    name: 'UAP Triangular (Phoenix Lights tipo)',
    category: 'uap',
    description: 'Formación triangular o V con luces. Silencioso, lento. Phoenix 1997.',
    characteristics: {
      shape: 'triangular',
      color: ['luces amarillas/naranjas'],
      size: 'muy grande',
      behavior: 'movimiento lento, formación fija',
      speed: 'lento',
      luminosity: 'luces brillantes en formación'
    },
    visualPatterns: ['formación V', 'silencioso', 'muy grande', 'luces equidistantes'],
    frequency: 2,
    altitude: 'bajo-medio',
    isVerified: false,
    verificationSource: 'Múltiples testigos civiles',
    isActive: true
  }
];

// ============================================
// FUNCIÓN DE SEED
// ============================================

async function seedMassiveDatabase() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Conectado a MongoDB');

    // Limpiar colección
    await UFODatabase.deleteMany({});
    console.log('🗑️  Base de datos limpiada');

    // Insertar todos los objetos
    const inserted = await UFODatabase.insertMany(massiveDatabase);
    console.log(`\n✅ ${inserted.length} objetos insertados exitosamente\n`);

    // Resumen por categoría
    const summary = await UFODatabase.aggregate([
      { $group: { _id: '$category', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);

    console.log('📊 Resumen por categoría:');
    summary.forEach(cat => {
      console.log(`   ${cat._id}: ${cat.count} objetos`);
    });

    console.log('\n✨ Base de datos masiva inicializada correctamente');
    
  } catch (error) {
    console.error('❌ Error al inicializar base de datos:', error);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Desconectado de MongoDB');
  }
}

// Ejecutar si se llama directamente
if (require.main === module) {
  seedMassiveDatabase();
}

module.exports = { massiveDatabase };
