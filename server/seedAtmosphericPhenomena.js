const mongoose = require('mongoose');
require('dotenv').config();
const AtmosphericPhenomenon = require('./models/AtmosphericPhenomenon');

const phenomena = [
  // ==================== NUBES INUSUALES ====================
  {
    name: 'Nube Lenticular',
    category: 'cloud',
    description: 'Nubes con forma de lente o platillo volador que se forman cerca de montañas debido a vientos fuertes. Son estacionarias y pueden parecer objetos sólidos.',
    visualCharacteristics: {
      shape: 'lens',
      colors: ['white', 'gray', 'orange', 'pink'],
      movement: 'stationary',
      duration: '30 minutes to several hours',
      brightness: 'moderate',
      texture: 'smooth'
    },
    conditions: {
      weather: ['clear', 'partly_cloudy'],
      timeOfDay: ['day', 'dawn', 'dusk'],
      altitude: { min: 2000, max: 12000 },
      geographicRegions: ['mountainous'],
      seasonality: ['year-round']
    },
    commonConfusions: ['ufo', 'spacecraft'],
    rarity: 'common',
    scientificExplanation: 'Formadas cuando aire húmedo fluye sobre montañas, creando ondas estacionarias en la atmósfera. La nube se forma en la cresta de la onda donde el aire se enfría.',
    keywords: ['lenticular', 'platillo', 'disco', 'lens', 'montaña', 'estacionaria'],
    reportFrequency: 850
  },
  
  {
    name: 'Nube Mammatus',
    category: 'cloud',
    description: 'Formaciones nubosas con apariencia de bolsas o sacos colgantes, a menudo asociadas con tormentas severas.',
    visualCharacteristics: {
      shape: 'irregular',
      colors: ['gray', 'white', 'orange', 'red'],
      movement: 'slow',
      duration: '10-15 minutes',
      brightness: 'moderate',
      texture: 'bulbous'
    },
    conditions: {
      weather: ['stormy', 'cloudy'],
      timeOfDay: ['day', 'dusk'],
      altitude: { min: 1000, max: 8000 },
      geographicRegions: ['worldwide'],
      seasonality: ['spring', 'summer']
    },
    commonConfusions: ['structured_craft', 'formation'],
    rarity: 'uncommon',
    scientificExplanation: 'Se forman cuando el aire frío desciende en la base de nubes de tormenta, creando bolsas de aire descendente.',
    keywords: ['mammatus', 'bolsas', 'tormenta', 'colgante'],
    reportFrequency: 320
  },

  {
    name: 'Nube de Hongo (Pileus)',
    category: 'cloud',
    description: 'Nube en forma de capucha o sombrilla que se forma encima de cúmulos en rápido crecimiento.',
    visualCharacteristics: {
      shape: 'disk',
      colors: ['white', 'gray'],
      movement: 'slow',
      duration: '5-10 minutes',
      brightness: 'bright',
      texture: 'smooth'
    },
    conditions: {
      weather: ['partly_cloudy', 'developing_storm'],
      timeOfDay: ['day'],
      altitude: { min: 3000, max: 10000 },
      geographicRegions: ['worldwide'],
      seasonality: ['spring', 'summer']
    },
    commonConfusions: ['ufo', 'disk'],
    rarity: 'uncommon',
    scientificExplanation: 'Se forma cuando una corriente ascendente rápida empuja el aire húmedo hacia arriba, creando una nube en forma de sombrero.',
    keywords: ['pileus', 'sombrero', 'capucha', 'disco'],
    reportFrequency: 180
  },

  // ==================== FENÓMENOS ÓPTICOS ====================
  {
    name: 'Parhelio (Sun Dog)',
    category: 'optical',
    description: 'Manchas brillantes a ambos lados del sol causadas por refracción de luz en cristales de hielo. Parecen soles adicionales.',
    visualCharacteristics: {
      shape: 'circular',
      colors: ['white', 'rainbow', 'red', 'orange'],
      movement: 'stationary',
      duration: '5-30 minutes',
      brightness: 'very_bright',
      texture: 'sharp'
    },
    conditions: {
      weather: ['clear', 'cirrus_clouds'],
      timeOfDay: ['day'],
      altitude: { min: 5000, max: 13000 },
      geographicRegions: ['worldwide'],
      seasonality: ['winter', 'year-round']
    },
    commonConfusions: ['ufo', 'bright_light'],
    rarity: 'common',
    scientificExplanation: 'Causado por refracción de luz solar en cristales de hielo hexagonales en nubes cirrus, típicamente a 22° del sol.',
    keywords: ['parhelio', 'sun dog', 'halo', 'falso sol'],
    reportFrequency: 620
  },

  {
    name: 'Halo Solar/Lunar',
    category: 'optical',
    description: 'Anillo luminoso alrededor del sol o la luna causado por cristales de hielo en la atmósfera.',
    visualCharacteristics: {
      shape: 'circular',
      colors: ['white', 'rainbow'],
      movement: 'stationary',
      duration: '10 minutes to hours',
      brightness: 'bright',
      texture: 'diffuse'
    },
    conditions: {
      weather: ['cirrus_clouds'],
      timeOfDay: ['day', 'night'],
      altitude: { min: 5000, max: 13000 },
      geographicRegions: ['worldwide'],
      seasonality: ['year-round']
    },
    commonConfusions: ['ring_ufo', 'portal'],
    rarity: 'common',
    scientificExplanation: 'Refracción y reflexión de luz en cristales de hielo hexagonales suspendidos en cirrus.',
    keywords: ['halo', 'anillo', 'círculo', 'corona'],
    reportFrequency: 890
  },

  {
    name: 'Iridiscencia de Nubes',
    category: 'optical',
    description: 'Colores del arcoíris en nubes cerca del sol o la luna, causados por difracción de luz.',
    visualCharacteristics: {
      shape: 'irregular',
      colors: ['rainbow', 'green', 'blue', 'pink', 'purple'],
      movement: 'slow',
      duration: '5-20 minutes',
      brightness: 'bright',
      texture: 'diffuse'
    },
    conditions: {
      weather: ['thin_clouds'],
      timeOfDay: ['day'],
      altitude: { min: 3000, max: 8000 },
      geographicRegions: ['worldwide'],
      seasonality: ['year-round']
    },
    commonConfusions: ['ufo', 'energy_being'],
    rarity: 'uncommon',
    scientificExplanation: 'Difracción de luz solar en gotas de agua muy pequeñas y uniformes en nubes delgadas.',
    keywords: ['iridiscencia', 'arcoíris', 'colores', 'nube'],
    reportFrequency: 280
  },

  {
    name: 'Gloria',
    category: 'optical',
    description: 'Anillos de colores alrededor de la sombra del observador en nubes o niebla, visible desde aviones.',
    visualCharacteristics: {
      shape: 'circular',
      colors: ['rainbow'],
      movement: 'stationary',
      duration: 'variable',
      brightness: 'bright',
      texture: 'sharp'
    },
    conditions: {
      weather: ['cloudy', 'foggy'],
      timeOfDay: ['day'],
      altitude: { min: 1000, max: 12000 },
      geographicRegions: ['worldwide'],
      seasonality: ['year-round']
    },
    commonConfusions: ['ufo', 'portal'],
    rarity: 'uncommon',
    scientificExplanation: 'Retrodispersión de luz solar en gotas de agua de tamaño uniforme.',
    keywords: ['gloria', 'espectro', 'brocken', 'anillos'],
    reportFrequency: 150
  },

  // ==================== PILARES Y COLUMNAS DE LUZ ====================
  {
    name: 'Pilar de Luz Solar',
    category: 'light_pillar',
    description: 'Columna vertical de luz que se extiende hacia arriba o abajo desde el sol al amanecer/atardecer.',
    visualCharacteristics: {
      shape: 'pillar',
      colors: ['orange', 'red', 'yellow', 'white'],
      movement: 'stationary',
      duration: '5-15 minutes',
      brightness: 'very_bright',
      texture: 'sharp'
    },
    conditions: {
      weather: ['clear', 'cold'],
      timeOfDay: ['dawn', 'dusk'],
      altitude: { min: 0, max: 6000 },
      geographicRegions: ['cold_regions'],
      seasonality: ['winter']
    },
    commonConfusions: ['beam', 'ufo_light'],
    rarity: 'uncommon',
    scientificExplanation: 'Reflexión de luz solar en cristales de hielo planos que caen lentamente, actuando como espejos.',
    keywords: ['pilar', 'columna', 'rayo', 'amanecer', 'atardecer'],
    reportFrequency: 420
  },

  {
    name: 'Pilar de Luz Artificial',
    category: 'light_pillar',
    description: 'Columnas de luz que se elevan desde luces artificiales (farolas, edificios) en noches frías.',
    visualCharacteristics: {
      shape: 'pillar',
      colors: ['white', 'yellow', 'orange', 'varied'],
      movement: 'stationary',
      duration: 'hours',
      brightness: 'bright',
      texture: 'diffuse'
    },
    conditions: {
      weather: ['clear', 'cold'],
      timeOfDay: ['night'],
      altitude: { min: 0, max: 3000 },
      geographicRegions: ['cold_regions'],
      seasonality: ['winter']
    },
    commonConfusions: ['ufo_beam', 'spacecraft'],
    rarity: 'common',
    scientificExplanation: 'Reflexión de luces artificiales en cristales de hielo suspendidos cerca del suelo en noches muy frías.',
    keywords: ['pilar', 'luz', 'columna', 'invierno', 'noche'],
    reportFrequency: 580
  },

  // ==================== FENÓMENOS ELÉCTRICOS ====================
  {
    name: 'Rayo en Bola',
    category: 'electric',
    description: 'Esfera luminosa rara que aparece durante tormentas eléctricas, puede flotar y moverse erráticamente.',
    visualCharacteristics: {
      shape: 'circular',
      colors: ['white', 'blue', 'orange', 'red'],
      movement: 'erratic',
      duration: '2-5 seconds',
      brightness: 'very_bright',
      texture: 'glowing'
    },
    conditions: {
      weather: ['stormy'],
      timeOfDay: ['day', 'night'],
      altitude: { min: 0, max: 3000 },
      geographicRegions: ['worldwide'],
      seasonality: ['spring', 'summer']
    },
    commonConfusions: ['ufo', 'orb', 'probe'],
    rarity: 'very_rare',
    scientificExplanation: 'Fenómeno eléctrico mal comprendido, posiblemente plasma ionizado o vaporización de minerales del suelo.',
    keywords: ['rayo bola', 'esfera', 'plasma', 'tormenta'],
    reportFrequency: 45
  },

  {
    name: 'Sprite Rojo',
    category: 'electric',
    description: 'Descarga eléctrica roja gigante que ocurre sobre tormentas eléctricas intensas, visible desde lejos.',
    visualCharacteristics: {
      shape: 'irregular',
      colors: ['red', 'orange'],
      movement: 'fast',
      duration: 'milliseconds',
      brightness: 'bright',
      texture: 'diffuse'
    },
    conditions: {
      weather: ['stormy'],
      timeOfDay: ['night'],
      altitude: { min: 50000, max: 90000 },
      geographicRegions: ['worldwide'],
      seasonality: ['spring', 'summer']
    },
    commonConfusions: ['ufo', 'flash'],
    rarity: 'rare',
    scientificExplanation: 'Descarga eléctrica en la mesosfera, causada por rayos positivos muy intensos.',
    keywords: ['sprite', 'descarga', 'rojo', 'tormenta', 'mesosfera'],
    reportFrequency: 120
  },

  {
    name: 'Fuego de San Telmo',
    category: 'electric',
    description: 'Descarga eléctrica continua que produce un brillo azul/violeta en objetos puntiagudos durante tormentas.',
    visualCharacteristics: {
      shape: 'irregular',
      colors: ['blue', 'violet', 'white'],
      movement: 'pulsating',
      duration: 'minutes',
      brightness: 'moderate',
      texture: 'glowing'
    },
    conditions: {
      weather: ['stormy'],
      timeOfDay: ['day', 'night'],
      altitude: { min: 0, max: 3000 },
      geographicRegions: ['worldwide'],
      seasonality: ['year-round']
    },
    commonConfusions: ['ghost_light', 'energy'],
    rarity: 'uncommon',
    scientificExplanation: 'Descarga corona causada por ionización del aire en áreas con campo eléctrico intenso.',
    keywords: ['san telmo', 'corona', 'azul', 'descarga'],
    reportFrequency: 190
  },

  // ==================== AURORAS ====================
  {
    name: 'Aurora Boreal/Austral',
    category: 'aurora',
    description: 'Luces danzantes en el cielo nocturno causadas por partículas solares interactuando con la atmósfera.',
    visualCharacteristics: {
      shape: 'curtain',
      colors: ['green', 'red', 'purple', 'blue', 'yellow'],
      movement: 'wave-like',
      duration: 'minutes to hours',
      brightness: 'bright',
      texture: 'diffuse'
    },
    conditions: {
      weather: ['clear'],
      timeOfDay: ['night'],
      altitude: { min: 90000, max: 400000 },
      geographicRegions: ['polar'],
      seasonality: ['winter', 'fall']
    },
    commonConfusions: ['ufo', 'lights', 'craft'],
    rarity: 'uncommon',
    scientificExplanation: 'Colisiones entre partículas cargadas del viento solar y moléculas de gas en la atmósfera terrestre.',
    keywords: ['aurora', 'boreal', 'austral', 'luces', 'norte', 'sur'],
    reportFrequency: 720
  },

  {
    name: 'STEVE (Strong Thermal Emission Velocity Enhancement)',
    category: 'aurora',
    description: 'Arco de luz púrpura/mageneta que aparece junto con auroras, descubierto recientemente por científicos ciudadanos.',
    visualCharacteristics: {
      shape: 'arc',
      colors: ['purple', 'magenta', 'white'],
      movement: 'slow',
      duration: '20-60 minutes',
      brightness: 'moderate',
      texture: 'sharp'
    },
    conditions: {
      weather: ['clear'],
      timeOfDay: ['night'],
      altitude: { min: 90000, max: 250000 },
      geographicRegions: ['temperate'],
      seasonality: ['spring', 'fall']
    },
    commonConfusions: ['ufo', 'beam', 'probe'],
    rarity: 'rare',
    scientificExplanation: 'Flujo rápido de iones calientes en la ionosfera, diferente a auroras tradicionales.',
    keywords: ['steve', 'arco', 'púrpura', 'mageneta'],
    reportFrequency: 85
  },

  // ==================== METEOROS Y BÓLIDOS ====================
  {
    name: 'Meteoro (Estrella Fugaz)',
    category: 'meteor',
    description: 'Trazo luminoso en el cielo causado por partículas espaciales quemándose en la atmósfera.',
    visualCharacteristics: {
      shape: 'streak',
      colors: ['white', 'green', 'blue', 'orange'],
      movement: 'fast',
      duration: 'seconds',
      brightness: 'bright',
      texture: 'sharp'
    },
    conditions: {
      weather: ['clear'],
      timeOfDay: ['night'],
      altitude: { min: 70000, max: 120000 },
      geographicRegions: ['worldwide'],
      seasonality: ['year-round']
    },
    commonConfusions: ['ufo', 'craft', 'missile'],
    rarity: 'very_common',
    scientificExplanation: 'Partículas de polvo espacial (meteoroides) que se incineran al entrar en la atmósfera terrestre a alta velocidad.',
    keywords: ['meteoro', 'estrella fugaz', 'trazo', 'flash'],
    reportFrequency: 2500
  },

  {
    name: 'Bólido',
    category: 'meteor',
    description: 'Meteoro extremadamente brillante que puede explotar y fragmentarse, a veces dejando rastro persistente.',
    visualCharacteristics: {
      shape: 'streak',
      colors: ['white', 'blue', 'green', 'orange', 'red'],
      movement: 'fast',
      duration: '5-30 seconds',
      brightness: 'very_bright',
      texture: 'sharp'
    },
    conditions: {
      weather: ['clear'],
      timeOfDay: ['day', 'night'],
      altitude: { min: 70000, max: 120000 },
      geographicRegions: ['worldwide'],
      seasonality: ['year-round']
    },
    commonConfusions: ['ufo', 'crash', 'explosion'],
    rarity: 'uncommon',
    scientificExplanation: 'Meteoroide grande (>1 metro) que produce luz intensa al desintegrarse en la atmósfera, puede generar sonidos sónicos.',
    keywords: ['bólido', 'fireball', 'explosión', 'brillante'],
    reportFrequency: 380
  },

  // ==================== REFLEJOS Y EFECTOS FOTOGRÁFICOS ====================
  {
    name: 'Lens Flare (Reflejo de Lente)',
    category: 'reflection',
    description: 'Artefacto fotográfico causado por reflejos internos en la lente de la cámara, aparece como orbes o hexágonos.',
    visualCharacteristics: {
      shape: 'circular',
      colors: ['white', 'rainbow', 'blue', 'purple'],
      movement: 'stationary',
      duration: 'permanent_in_photo',
      brightness: 'bright',
      texture: 'sharp'
    },
    conditions: {
      weather: ['any'],
      timeOfDay: ['any'],
      altitude: { min: 0, max: 0 },
      geographicRegions: ['worldwide'],
      seasonality: ['year-round']
    },
    commonConfusions: ['ufo', 'orb', 'craft'],
    rarity: 'very_common',
    scientificExplanation: 'Luz brillante (sol, luna, farola) que entra en la lente y se refleja internamente entre los elementos de vidrio.',
    keywords: ['lens flare', 'reflejo', 'lente', 'orbe', 'hexágono'],
    reportFrequency: 1850
  },

  {
    name: 'Reflejo en Ventana/Parabrisas',
    category: 'reflection',
    description: 'Reflexión de luces interiores o exteriores en vidrios que aparece superpuesta al paisaje.',
    visualCharacteristics: {
      shape: 'varied',
      colors: ['varied'],
      movement: 'stationary',
      duration: 'continuous',
      brightness: 'moderate',
      texture: 'semi-transparent'
    },
    conditions: {
      weather: ['any'],
      timeOfDay: ['night', 'dusk'],
      altitude: { min: 0, max: 0 },
      geographicRegions: ['worldwide'],
      seasonality: ['year-round']
    },
    commonConfusions: ['ufo', 'lights', 'formation'],
    rarity: 'very_common',
    scientificExplanation: 'Reflexión especular de fuentes de luz en superficies de vidrio, especialmente notable de noche.',
    keywords: ['reflejo', 'ventana', 'vidrio', 'luz interior'],
    reportFrequency: 1420
  },

  // ==================== OTROS FENÓMENOS ATMOSFÉRICOS ====================
  {
    name: 'Inversión Térmica con Luces',
    category: 'atmospheric',
    description: 'Luces distantes que parecen flotar o distorsionarse debido a capas de aire con diferentes temperaturas.',
    visualCharacteristics: {
      shape: 'varied',
      colors: ['varied'],
      movement: 'slow',
      duration: 'hours',
      brightness: 'variable',
      texture: 'distorted'
    },
    conditions: {
      weather: ['clear', 'calm'],
      timeOfDay: ['night'],
      altitude: { min: 0, max: 5000 },
      geographicRegions: ['worldwide'],
      seasonality: ['year-round']
    },
    commonConfusions: ['ufo', 'hovering_craft'],
    rarity: 'common',
    scientificExplanation: 'Refracción atmosférica causada por gradientes de temperatura que doblan la luz, haciendo que objetos distantes parezcan más cerca o flotantes.',
    keywords: ['inversión', 'espejismo', 'refracción', 'miraje'],
    reportFrequency: 620
  },

  {
    name: 'Virga',
    category: 'atmospheric',
    description: 'Cortinas de precipitación que se evaporan antes de llegar al suelo, colgando de nubes.',
    visualCharacteristics: {
      shape: 'streak',
      colors: ['gray', 'white'],
      movement: 'slow',
      duration: '10-30 minutes',
      brightness: 'dim',
      texture: 'wispy'
    },
    conditions: {
      weather: ['cloudy', 'dry_air_below'],
      timeOfDay: ['day'],
      altitude: { min: 1000, max: 8000 },
      geographicRegions: ['worldwide'],
      seasonality: ['year-round']
    },
    commonConfusions: ['contrail', 'beam'],
    rarity: 'common',
    scientificExplanation: 'Precipitación que se evapora en aire seco antes de alcanzar el suelo.',
    keywords: ['virga', 'lluvia', 'cortina', 'evaporación'],
    reportFrequency: 290
  },

  {
    name: 'Noctilucent Clouds (Nubes Noctilucentes)',
    category: 'cloud',
    description: 'Nubes extremadamente altas y brillantes visibles en crepúsculo profundo, compuestas de cristales de hielo.',
    visualCharacteristics: {
      shape: 'wave-like',
      colors: ['blue', 'silver', 'white'],
      movement: 'wave-like',
      duration: '30-90 minutes',
      brightness: 'bright',
      texture: 'wispy'
    },
    conditions: {
      weather: ['clear'],
      timeOfDay: ['dusk', 'dawn'],
      altitude: { min: 76000, max: 85000 },
      geographicRegions: ['high_latitude'],
      seasonality: ['summer']
    },
    commonConfusions: ['ufo', 'lights', 'formation'],
    rarity: 'rare',
    scientificExplanation: 'Las nubes más altas de la atmósfera, formadas en la mesosfera. Brillan después del atardecer porque están lo suficientemente altas para ser iluminadas por el sol.',
    keywords: ['noctilucent', 'mesosfera', 'azul', 'plateado'],
    reportFrequency: 140
  },

  {
    name: 'Kelvin-Helmholtz Waves',
    category: 'cloud',
    description: 'Formaciones nubosas con forma de olas rompientes u ondulaciones, causadas por cizalladura del viento.',
    visualCharacteristics: {
      shape: 'wave-like',
      colors: ['white', 'gray'],
      movement: 'slow',
      duration: '1-2 minutes',
      brightness: 'moderate',
      texture: 'sharp'
    },
    conditions: {
      weather: ['partly_cloudy'],
      timeOfDay: ['day'],
      altitude: { min: 2000, max: 10000 },
      geographicRegions: ['worldwide'],
      seasonality: ['year-round']
    },
    commonConfusions: ['ufo', 'structured_object'],
    rarity: 'rare',
    scientificExplanation: 'Ondas formadas cuando dos capas de aire se mueven a velocidades diferentes, creando inestabilidad.',
    keywords: ['kelvin', 'helmholtz', 'olas', 'ondulación'],
    reportFrequency: 95
  },

  {
    name: 'Contrail Persistente',
    category: 'atmospheric',
    description: 'Estela de condensación de avión que persiste y se expande durante horas, puede formar nubes artificiales.',
    visualCharacteristics: {
      shape: 'streak',
      colors: ['white'],
      movement: 'slow',
      duration: 'hours',
      brightness: 'bright',
      texture: 'wispy'
    },
    conditions: {
      weather: ['clear', 'cold_upper_air'],
      timeOfDay: ['day'],
      altitude: { min: 8000, max: 13000 },
      geographicRegions: ['worldwide'],
      seasonality: ['year-round']
    },
    commonConfusions: ['chemtrail', 'ufo_trail'],
    rarity: 'very_common',
    scientificExplanation: 'Vapor de agua del escape de aviones que se condensa y congela en cristales de hielo cuando la atmósfera superior está fría y húmeda.',
    keywords: ['contrail', 'estela', 'avión', 'vapor'],
    reportFrequency: 3200
  }
];

async function seedAtmosphericPhenomena() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Conectado a MongoDB');

    // Limpiar colección existente
    await AtmosphericPhenomenon.deleteMany({});
    console.log('🗑️  Colección limpiada');

    // Insertar fenómenos
    const result = await AtmosphericPhenomenon.insertMany(phenomena);
    console.log(`✅ ${result.length} fenómenos atmosféricos insertados`);

    // Estadísticas
    const stats = await AtmosphericPhenomenon.aggregate([
      { $group: { _id: '$category', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);

    console.log('\n📊 Estadísticas por categoría:');
    stats.forEach(stat => {
      console.log(`   ${stat._id}: ${stat.count} fenómenos`);
    });

    console.log('\n🔥 Fenómenos más reportados:');
    const topReported = await AtmosphericPhenomenon.find()
      .sort({ reportFrequency: -1 })
      .limit(5)
      .select('name reportFrequency category');
    
    topReported.forEach((phenom, index) => {
      console.log(`   ${index + 1}. ${phenom.name} (${phenom.reportFrequency} reportes) - ${phenom.category}`);
    });

    process.exit(0);

  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

seedAtmosphericPhenomena();
