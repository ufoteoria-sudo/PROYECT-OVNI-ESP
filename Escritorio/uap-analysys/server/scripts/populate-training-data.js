/**
 * Script para poblar la base de datos con imágenes de entrenamiento
 * Descarga imágenes de fuentes públicas y las registra automáticamente
 */

require('dotenv').config();
const mongoose = require('mongoose');
const axios = require('axios');
const fs = require('fs').promises;
const path = require('path');
const sharp = require('sharp');
const TrainingImage = require('../models/TrainingImage');

// Usuario admin que subirá las imágenes (usar el ID de tu usuario admin)
const ADMIN_USER_ID = '690f643c034b2f618ad9cdd2'; // Tu ID de Roberto

// Dataset de imágenes públicas y sus descripciones
const TRAINING_DATASET = [
  // ==================== AERONAVES ====================
  {
    category: 'aircraft_commercial',
    type: 'Boeing 737',
    model: '737-800',
    description: 'Avión comercial bimotor de fuselaje estrecho. Forma cilíndrica alargada con alas en posición baja. Dos motores turbofan bajo las alas. Típicamente blanco con franjas de aerolínea. Cola vertical alta con timón. Envergadura aproximada 35 metros. Común en rutas cortas y medias. Altitud de crucero 35000-41000 pies. Luces de navegación rojas (izquierda) y verdes (derecha) en extremos alares. Luz estroboscópica blanca en cola.',
    imageUrl: 'https://images.unsplash.com/photo-1436491865332-7a61a109cc05?w=640',
    tags: ['avion', 'comercial', 'boeing', 'pasajeros', 'jet']
  },
  {
    category: 'aircraft_commercial',
    type: 'Airbus A320',
    model: 'A320-200',
    description: 'Avión comercial de pasajeros de fuselaje estrecho. Diseño similar al Boeing 737 pero con morro más puntiagudo y winglets característicos. Dos motores turbofan. Cabina de cristal (fly-by-wire). Color típicamente blanco con decoración de aerolínea. Envergadura 35.8 metros. Luces anticolisión rojas intermitentes. Faros de aterrizaje muy brillantes en tren delantero. Ventanas ovaladas uniformes en fuselaje.',
    imageUrl: 'https://images.unsplash.com/photo-1464037866556-6812c9d1c72e?w=640',
    tags: ['avion', 'comercial', 'airbus', 'pasajeros', 'jet']
  },
  {
    category: 'aircraft_military',
    type: 'F-16 Fighting Falcon',
    model: 'F-16C',
    description: 'Caza táctico monomotor. Silueta distintiva con entrada de aire ventral y burbuja de cabina grande. Un solo motor jet con postquemador. Alas delta recortadas. Típicamente gris claro o camuflaje. Muy maniobrable, velocidad supersónica. Luces de formación visibles de noche. Forma compacta y aerodinámica. Cola vertical inclinada. Puede llevar armamento visible bajo las alas.',
    imageUrl: 'https://images.unsplash.com/photo-1583396194793-23bf8b4a37cc?w=640',
    tags: ['avion', 'militar', 'caza', 'jet', 'supersónico']
  },

  // ==================== DRONES ====================
  {
    category: 'drone',
    type: 'DJI Phantom 4',
    model: 'Phantom 4 Pro',
    description: 'Drone cuadricóptero blanco de tamaño mediano. Cuatro brazos con hélices negras/plateadas. Cuerpo compacto de color blanco perla. Cámara gimbal de 3 ejes suspendida en parte inferior. Cuatro LED verdes/rojos en extremos de brazos (navegación). Forma redondeada y aerodinámica. Sensores anticolisión visibles. Tren de aterrizaje fijo integrado. Aproximadamente 35cm de diámetro. Vuelo estable y controlado. Común en fotografía aérea y video.',
    imageUrl: 'https://images.unsplash.com/photo-1473968512647-3e447244af8f?w=640',
    tags: ['drone', 'cuadricóptero', 'dji', 'phantom', 'uav', 'camara']
  },
  {
    category: 'drone',
    type: 'DJI Mavic',
    model: 'Mavic Pro',
    description: 'Drone plegable compacto de color gris oscuro. Brazos delanteros plegables con hélices. Diseño más compacto que Phantom. Gimbal de cámara frontal integrado. LED indicadores de estado en brazos delanteros y traseros. Forma alargada cuando plegado, similar a botella de agua. Desplegado muestra cuatro hélices. Vuelo rápido y ágil. Popular para viajes por portabilidad. Emisión de zumbido característico de alta frecuencia.',
    imageUrl: 'https://images.unsplash.com/photo-1507582020474-9a35b7d455d9?w=640',
    tags: ['drone', 'mavic', 'dji', 'plegable', 'compacto', 'uav']
  },

  // ==================== HELICÓPTEROS ====================
  {
    category: 'helicopter',
    type: 'Helicóptero civil',
    model: 'Robinson R44',
    description: 'Helicóptero ligero con rotor principal visible. Cabina transparente tipo burbuja. Patines de aterrizaje curvados. Cola larga con rotor anti-torque. Color variable, común blanco o azul. Muy maniobrable, puede hacer hover. Sonido característico thop-thop. Vuelo a baja altitud típico. Luces de navegación roja y verde. Estroboscópica blanca en cola.',
    imageUrl: 'https://images.unsplash.com/photo-1520645344736-fbfbfb46e5d0?w=640',
    tags: ['helicoptero', 'civil', 'robinson', 'rotor', 'aviacion']
  },

  // ==================== SATÉLITES ====================
  {
    category: 'satellite',
    type: 'Estación Espacial Internacional',
    model: 'ISS',
    description: 'Estructura grande y compleja visible desde tierra como punto brillante en movimiento constante. Forma distintiva de "H" con paneles solares extendidos a ambos lados. Color plateado/dorado reflectante. Se mueve lentamente atravesando el cielo en línea recta sin parpadear. Visible al amanecer o anochecer cuando está iluminada por el sol pero el observador está en oscuridad. Magnitud aparente muy brillante (-4 a -6). Tránsito dura varios minutos. No tiene luces propias, brilla por reflexión solar.',
    imageUrl: 'https://images.unsplash.com/photo-1446776653964-20c1d3a81b06?w=640',
    tags: ['satelite', 'iss', 'espacial', 'estacion', 'orbital']
  },

  // ==================== OBJETOS CELESTES ====================
  {
    category: 'celestial',
    type: 'Luna',
    model: 'Luna Llena',
    description: 'Objeto celeste grande y circular muy brillante. Color blanco grisáceo con patrones oscuros visibles (mares lunares). Tamaño angular grande (0.5 grados). Brillo intenso suficiente para proyectar sombras. No se mueve apreciablemente durante observación corta. Cráteres visibles con telescopio o zoom. Puede aparecer amarillenta/naranja cerca del horizonte por dispersión atmosférica. Fases variables (creciente, llena, menguante). Luz fría, no titila.',
    imageUrl: 'https://images.unsplash.com/photo-1509773896068-7fd415d91e2e?w=640',
    tags: ['luna', 'celeste', 'astronomia', 'satelite natural']
  },
  {
    category: 'celestial',
    type: 'Venus',
    model: 'Planeta Venus',
    description: 'Punto muy brillante blanco-amarillento en cielo. Tercer objeto más brillante tras Sol y Luna. No titila como estrellas. Visible solo al amanecer (lucero del alba) o atardecer (lucero vespertino). Magnitud aparente muy alta (-4.6). Se ve como disco si se usa telescopio. Muestra fases como la Luna. Movimiento lento respecto a estrellas de fondo. Color característico blanquecino brillante. Permanece en misma posición durante observación.',
    imageUrl: 'https://images.unsplash.com/photo-1614642264762-d0a3b8bf3700?w=640',
    tags: ['venus', 'planeta', 'celeste', 'lucero', 'astronomia']
  },

  // ==================== AVES ====================
  {
    category: 'bird',
    type: 'Gaviota',
    model: 'Gaviota Común',
    description: 'Ave de tamaño mediano-grande con alas largas y puntiagudas. Color predominante blanco con puntas negras en alas. Pico amarillo característico. Vuelo planeado con aleteos ocasionales. Silueta distintiva en forma de "M" cuando alas están extendidas. Común cerca de costas y zonas urbanas. Vuelo a baja-media altitud. Movimiento orgánico, puede cambiar dirección abruptamente. Visible individualmente o en grupos. Puede verse silueta oscura contra cielo brillante.',
    imageUrl: 'https://images.unsplash.com/photo-1551244072-5d12893278ab?w=640',
    tags: ['ave', 'gaviota', 'pajaro', 'fauna', 'volador']
  },

  // ==================== EFECTOS ÓPTICOS ====================
  {
    category: 'lens_flare',
    type: 'Destello de lente solar',
    model: 'Lens Flare',
    description: 'Artefacto óptico en fotografía causado por reflexiones internas en lente. Aparece como serie de círculos luminosos, hexágonos o manchas de luz dispuestas en línea desde fuente de luz brillante. Colores característicos: verde, azul, magenta, naranja. Forma geométrica regular (hexagonal si diafragma cerrado). Siempre alineado con fuente de luz intensa (sol, foco). Puede tener forma de estrella con rayos. Brillo disminuye desde fuente. NO es objeto real en escena. Aparece solo cuando cámara apunta cerca de fuente brillante.',
    imageUrl: 'https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?w=640',
    tags: ['lens flare', 'destello', 'artefacto', 'optico', 'camara']
  },
  {
    category: 'reflection_glass',
    type: 'Reflejo en ventana',
    model: 'Reflejo Interior',
    description: 'Imagen reflejada de objetos interiores en cristal de ventana. Aparece superpuesta sobre escena exterior. Puede incluir lámparas, luces LED, pantallas, personas. Típicamente borroso o semi-transparente. Colores pueden aparecer atenuados. Forma coincide con objetos de interior. Visible especialmente de noche cuando interior iluminado y exterior oscuro. Puede crear ilusión de objetos flotantes en cielo. Posición fija respecto a ventana. Puede tener doble imagen por doble acristalamiento.',
    imageUrl: 'https://images.unsplash.com/photo-1497366754035-f200968a6e72?w=640',
    tags: ['reflejo', 'ventana', 'cristal', 'interior', 'luz']
  },
  {
    category: 'artificial_light',
    type: 'Farola LED',
    model: 'Alumbrado Público LED',
    description: 'Luz artificial estática de alta intensidad. Color típicamente blanco frío (5000-6500K) con tinte azulado. Brillo muy intenso y uniforme. Forma circular o rectangular según difusor. Siempre estática, fija en poste. Altura típica 6-12 metros. Crea halo de luz en condiciones de humedad. Puede saturar sensor de cámara creando bloom. Encendida solo de noche. Distribución regular a lo largo de calles. No parpadea (a diferencia de sodio antiguo). En foto nocturna aparece como fuente muy brillante con rayos de difracción.',
    imageUrl: 'https://images.unsplash.com/photo-1513828583688-c52646db42da?w=640',
    tags: ['farola', 'led', 'luz', 'artificial', 'alumbrado', 'urbano']
  },

  // ==================== FENÓMENOS ATMOSFÉRICOS ====================
  {
    category: 'atmospheric',
    type: 'Nube lenticular',
    model: 'Altocumulus lenticularis',
    description: 'Nube con forma de lente, platillo o almendra. Bordes muy definidos y suaves. Color blanco brillante en parte iluminada, puede tener tonos rosados/naranjas al atardecer. Formación estacionaria sobre montañas o zonas elevadas. NO se mueve con el viento como otras nubes. Capas múltiples apiladas posibles. Aspecto suave y uniforme. Puede parecer disco volador clásico. Visible en cielos despejados con viento en altura. Altitud media-alta (2000-6000m). Bordes nítidos sin deshilachamiento.',
    imageUrl: 'https://images.unsplash.com/photo-1528459584353-5297db1a9c01?w=640',
    tags: ['nube', 'lenticular', 'atmosferico', 'meteorologico', 'fenomeno']
  },
  {
    category: 'weather',
    type: 'Rayo',
    model: 'Descarga Eléctrica',
    description: 'Descarga eléctrica atmosférica de muy alta intensidad y corta duración. Forma ramificada irregular desde nube a tierra o entre nubes. Color blanco-azulado muy brillante. Duración de fracción de segundo. Ilumina área circundante. Seguido por trueno. Patrón zigzagueante o arborescente. Puede aparecer como línea vertical brillante en fotografía. Extremadamente luminoso, puede saturar sensor. Aparece durante tormentas. Movimiento instantáneo descendente o ascendente.',
    imageUrl: 'https://images.unsplash.com/photo-1527482797697-8795b05a13fe?w=640',
    tags: ['rayo', 'tormenta', 'electrico', 'atmosferico', 'meteorologico']
  }
];

// Directorio de destino
const UPLOAD_DIR = path.join(__dirname, '../uploads/training');
const THUMBNAIL_DIR = UPLOAD_DIR;

/**
 * Descarga imagen desde URL
 */
async function downloadImage(url, filename) {
  try {
    const response = await axios({
      url,
      method: 'GET',
      responseType: 'arraybuffer',
      timeout: 30000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      }
    });

    const filepath = path.join(UPLOAD_DIR, filename);
    await fs.writeFile(filepath, response.data);
    
    console.log(`   ✅ Descargada: ${filename}`);
    return filepath;
  } catch (error) {
    console.error(`   ❌ Error descargando ${url}:`, error.message);
    return null;
  }
}

/**
 * Genera thumbnail
 */
async function generateThumbnail(imagePath, thumbnailPath) {
  try {
    await sharp(imagePath)
      .resize(300, 300, {
        fit: 'cover',
        position: 'center'
      })
      .jpeg({ quality: 80 })
      .toFile(thumbnailPath);
    
    return true;
  } catch (error) {
    console.error('   ⚠️ Error generando thumbnail:', error.message);
    return false;
  }
}

/**
 * Extrae características visuales básicas
 */
async function extractFeatures(imagePath) {
  try {
    const metadata = await sharp(imagePath).metadata();
    const stats = await sharp(imagePath).stats();

    const dominantColors = stats.channels.slice(0, 3).map((channel, index) => ({
      channel: ['red', 'green', 'blue'][index],
      mean: channel.mean,
      std: channel.std
    }));

    const r = stats.channels[0].mean;
    const g = stats.channels[1].mean;
    const b = stats.channels[2].mean;
    const brightness = (0.299 * r + 0.587 * g + 0.114 * b) / 255;

    const avgStd = stats.channels.slice(0, 3).reduce((sum, ch) => sum + ch.std, 0) / 3;
    const contrast = avgStd / 255;

    return {
      autoExtracted: {
        aspectRatio: (metadata.width / metadata.height).toFixed(2),
        dominantColors,
        brightness: brightness.toFixed(2),
        contrast: contrast.toFixed(2),
        width: metadata.width,
        height: metadata.height
      }
    };
  } catch (error) {
    console.error('   ⚠️ Error extrayendo características:', error.message);
    return { autoExtracted: {} };
  }
}

/**
 * Procesa y guarda una imagen de entrenamiento
 */
async function processTrainingImage(data, index) {
  try {
    console.log(`\n📸 Procesando ${index + 1}/${TRAINING_DATASET.length}: ${data.type}`);

    // Generar nombre de archivo único
    const timestamp = Date.now();
    const randomSuffix = Math.round(Math.random() * 1E6);
    const ext = '.jpg';
    const filename = `training-${timestamp}-${randomSuffix}${ext}`;
    const thumbnailFilename = `thumb-${filename}`;

    // Descargar imagen
    const imagePath = await downloadImage(data.imageUrl, filename);
    if (!imagePath) {
      console.log('   ⏭️  Saltando por error de descarga');
      return null;
    }

    // Generar thumbnail
    const thumbnailPath = path.join(THUMBNAIL_DIR, thumbnailFilename);
    await generateThumbnail(imagePath, thumbnailPath);

    // Extraer características visuales
    console.log('   🔍 Extrayendo características...');
    const visualFeatures = await extractFeatures(imagePath);

    // Crear registro en base de datos
    const trainingImage = new TrainingImage({
      category: data.category,
      type: data.type,
      model: data.model || null,
      description: data.description,
      imageUrl: filename,
      thumbnailUrl: thumbnailFilename,
      visualFeatures,
      tags: data.tags || [],
      uploadedBy: ADMIN_USER_ID,
      source: 'web_scraping',
      verified: true,
      verifiedBy: ADMIN_USER_ID,
      verifiedAt: new Date(),
      isActive: true
    });

    await trainingImage.save();
    console.log(`   ✅ Guardado en BD: ${data.type}`);

    return trainingImage;

  } catch (error) {
    console.error(`   ❌ Error procesando ${data.type}:`, error.message);
    return null;
  }
}

/**
 * Función principal
 */
async function main() {
  try {
    console.log('🚀 Iniciando población de base de datos de entrenamiento\n');

    // Conectar a MongoDB
    console.log('📡 Conectando a MongoDB...');
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/uap-db');
    console.log('✅ Conectado a MongoDB\n');

    // Crear directorio si no existe
    await fs.mkdir(UPLOAD_DIR, { recursive: true });
    console.log(`📁 Directorio de uploads: ${UPLOAD_DIR}\n`);

    // Procesar cada imagen
    let successful = 0;
    let failed = 0;

    for (let i = 0; i < TRAINING_DATASET.length; i++) {
      const result = await processTrainingImage(TRAINING_DATASET[i], i);
      if (result) {
        successful++;
      } else {
        failed++;
      }

      // Pequeña pausa entre descargas para no saturar
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    // Resumen
    console.log('\n' + '='.repeat(60));
    console.log('📊 RESUMEN DE POBLACIÓN');
    console.log('='.repeat(60));
    console.log(`✅ Exitosas: ${successful}`);
    console.log(`❌ Fallidas: ${failed}`);
    console.log(`📁 Total: ${TRAINING_DATASET.length}`);
    console.log('='.repeat(60));

    // Mostrar estadísticas por categoría
    console.log('\n📈 Imágenes por categoría:');
    const stats = await TrainingImage.aggregate([
      { $match: { isActive: true, verified: true } },
      { $group: { _id: '$category', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);

    stats.forEach(stat => {
      console.log(`   ${stat._id}: ${stat.count} imagen(es)`);
    });

    console.log('\n✅ Proceso completado exitosamente!');
    console.log('🎓 La base de datos está lista para entrenar el sistema.\n');

    process.exit(0);

  } catch (error) {
    console.error('\n❌ Error fatal:', error);
    process.exit(1);
  }
}

// Ejecutar
main();
