/**
 * Script mejorado: Crea entradas de entrenamiento SIN descargar imágenes
 * El administrador puede luego subir las imágenes reales manualmente
 */

require('dotenv').config();
const mongoose = require('mongoose');
const TrainingImage = require('../models/TrainingImage');

const ADMIN_USER_ID = '690f643c034b2f618ad9cdd2';

// Dataset con descripciones detalladas listas para usar
const TRAINING_DATA = [
  // ======== DRONES ========
  {
    category: 'drone',
    type: 'DJI Phantom 4',
    model: 'Phantom 4 Pro',
    description: 'Drone cuadricóptero color blanco brillante. Cuerpo compacto redondeado de aprox 35cm de diámetro. Cuatro brazos con hélices negras o plateadas. Cámara gimbal suspendida en parte inferior con lente visible. LED verdes en brazos traseros y rojos en delanteros para orientación. Tren de aterrizaje integrado con patas curvas. Sensores anticolisión negros circulares visibles. Forma aerodinámica y simétrica. Vuelo estable y horizontal. Zumbido agudo característico de motores eléctricos. Muy común en fotografía aérea urbana y rural.',
    needs_image: true
  },
  {
    category: 'drone',
    type: 'DJI Mavic',
    model: 'Mavic 2 Pro',
    description: 'Drone plegable compacto gris oscuro metalizado. Brazos delanteros plegables hacia atrás. Tamaño plegado similar a botella agua (20cm). Desplegado forma X con cuatro hélices. Gimbal frontal integrado con cámara Hasselblad. LED de estado en brazo trasero. Diseño más aerodinámico que Phantom. Vuelo rápido hasta 72km/h. Emisión sonido agudo similar a Phantom pero tono más bajo. Popular entre viajeros por portabilidad. Color gris grafito con detalles negros mate.',
    needs_image: true
  },
  {
    category: 'drone',
    type: 'Drone de carreras FPV',
    model: 'Racing Drone',
    description: 'Drone pequeño (15-25cm) diseño racing agresivo. Frame de carbono negro visible. Cuatro motores brushless con hélices agresivas tri-blade. Cámara FPV inclinada hacia adelante 30-40 grados. LED de colores brillantes (RGB) para visibilidad. Antena de video prominente. Diseño minimalista sin carcasa. Muy rápido y ágil, maniobras bruscas. Sonido muy agudo y potente de motores. Usado en competiciones. Puede llevar luces LED de colores personalizables. Vuelo errático y acrobático.',
    needs_image: true
  },

  // ======== HELICÓPTEROS ========
  {
    category: 'helicopter',
    type: 'Robinson R44',
    model: 'R44 Raven II',
    description: 'Helicóptero ligero civil color blanco, azul o rojo común. Rotor principal de dos palas. Cabina tipo burbuja transparente muy visible. Tren de aterrizaje tipo patín curvado. Cola larga y delgada con rotor anti-torque pequeño. 4 plazas visibles dentro. Sonido característico "thop-thop" de rotor. Vuelo a baja-media altitud 300-1000m típico. Muy maniobrable, puede hacer hover estático. Luz estroboscópica blanca en cola. Luces de navegación roja/verde en lados. Común en turismo y entrenamiento.',
    needs_image: true
  },
  {
    category: 'helicopter',
    type: 'Helicóptero de rescate',
    model: 'EC135',
    description: 'Helicóptero mediano color amarillo, rojo o naranja brillante. Marcas de emergencia visibles. Rotor principal de 4 palas. Cabina amplia con ventanas grandes. Puerta lateral corredera visible. Tren de aterrizaje tipo patín robusto. Cola Fenestron (rotor carenado) característica. Luces estroboscópicas múltiples muy brillantes. Foco de búsqueda potente ventral. Vuelo bajo en zonas urbanas/montaña. Sonido más grave que helicópteros ligeros. Puede llevar camilla externa. Muy estable en hover.',
    needs_image: true
  },

  // ======== GLOBOS ========
  {
    category: 'balloon',
    type: 'Globo aerostático',
    model: 'Globo de aire caliente',
    description: 'Globo grande multicolor o con diseño corporativo. Envuelta esférica u ovoide de 15-30m diámetro. Cesta/góndola rectangular suspendida por cables. Quemador con llama visible naranja-azul intermitente. Colores vivos: rojo, amarillo, azul, verde típicos. Movimiento muy lento con deriva de viento. Ascenso/descenso gradual. Sonido intermitente de quemador (whoosh fuerte). Típico al amanecer o atardecer. Altitud 300-1500m común. Silueta distintiva circular. Visible desde gran distancia.',
    needs_image: true
  },
  {
    category: 'balloon',
    type: 'Globo meteorológico',
    model: 'Weather Balloon',
    description: 'Globo blanco o translúcido de látex. Forma esférica u ovoide. Tamaño variable según altitud (2-8m). Color blanco lechoso o translúcido brillante. Ascenso constante vertical. Puede llevar radiosonda suspendida (caja pequeña). Visible con zoom o binoculares. Altitud muy alta (hasta 30km). Movimiento lento pero constante hacia arriba. Se desinfla y cae al reventar. Refleja mucho luz solar. A veces confundido con OVNI por brillo y movimiento anómalo.',
    needs_image: true
  },

  // ======== AVIONES PRIVADOS ========
  {
    category: 'aircraft_private',
    type: 'Cessna 172',
    model: 'Skyhawk',
    description: 'Avión monomotor pequeño ala alta. Color típicamente blanco con franjas de color. Ala recta por encima del fuselaje. Hélice de dos o tres palas en morro. Tren de aterrizaje fijo triciclo visible. Cabina pequeña 4 plazas con ventanas. Motor de pistón, sonido característico grave y constante. Vuelo lento 180-220 km/h. Altitud típica baja-media 1000-3000m. Muy común en aviación general y escuelas. Una luz estroboscópica blanca en cola. Luces de navegación estándar.',
    needs_image: true
  },

  // ======== AVES ========
  {
    category: 'bird',
    type: 'Águila',
    model: 'Águila Real',
    description: 'Ave rapaz grande envergadura 2m. Color marrón oscuro con tonos dorados en cabeza/cuello. Silueta en forma de cruz al planear. Alas largas y anchas con dedos en puntas. Cola amplia en forma de abanico. Vuelo planeado circular ascendente (térmicas). Movimiento de aleteo lento y potente. Cabeza relativamente grande y pico curvado visible con zoom. Patas amarillas si visible. Solitaria o en parejas. Altitud variable hasta 3000m. Confundible con avión pequeño a gran distancia.',
    needs_image: true
  },
  {
    category: 'bird',
    type: 'Grupo de pájaros',
    model: 'Bandada de aves',
    description: 'Múltiples puntos negros moviéndose en formación. Patrón cambiante y fluido (murmurización). Movimientos sincronizados y orgánicos. Forma general variable: V, línea, nube. Individuos difíciles de distinguir a distancia. Movimiento ondulante característico. Cambios de dirección súbitos y coordinados. Visible especialmente al amanecer/atardecer. Puede formar patrones que parecen objetos sólidos. Número variable: docenas a miles. Silueta oscura contra cielo claro.',
    needs_image: true
  },

  // ======== REFLEJOS ========
  {
    category: 'reflection_vehicle',
    type: 'Reflejo en parabrisas',
    model: 'Reflejo interno vehiculo',
    description: 'Reflejo de luces de tablero, GPS, pantallas en cristal de parabrisas. Aparece superpuesto sobre cielo nocturno. Formas geométricas de displays (cuadrados, rectángulos). Colores típicos: verde, azul, blanco de instrumentos. Posición fija relativa a vehículo. Movimiento sincronizado con giros del vehículo. Más visible de noche con interior iluminado. Puede aparecer como luces flotantes en cielo. Doble reflexión posible en laminado de parabrisas. Intensidad variable según ángulo. Desaparece al cambiar posición cámara.',
    needs_image: true
  },
  {
    category: 'reflection_glass',
    type: 'Reflejo lámpara en ventana',
    model: 'Reflejo luz interior',
    description: 'Luz interior reflejada en cristal de ventana. Forma circular u ovoide según bombilla/pantalla. Color blanco cálido (2700-3000K) si incandescente, blanco frío si LED. Intensidad media-alta. Borde difuso con halo. Posición fija respecto a ventana. Más evidente con oscuridad exterior. Puede aparecer multiplicado en doble acristalamiento. Superpuesto sobre escena exterior. Confundible con objeto luminoso distante. Desaparece al apagar luz o mover cámara.',
    needs_image: true
  },

  // ======== LUCES ARTIFICIALES ========
  {
    category: 'artificial_light',
    type: 'Torre de comunicaciones',
    model: 'Torre con luces',
    description: 'Torre alta (50-300m) con luces de señalización aeronáutica. Luces rojas intermitentes en punta y niveles intermedios. Parpadeo sincronizado cada 1-2 segundos. Estructura metálica o monopolar. Visible desde gran distancia especialmente de noche. Antenas y equipos en punta. Luz blanca estroboscópica de alta intensidad adicional posible. Siempre en posición fija. Común en montañas y zonas elevadas. Puede parecer ovni parpadeante a gran distancia. Patrón de parpadeo regular y predecible.',
    needs_image: true
  },
  {
    category: 'artificial_light',
    type: 'Foco de obra',
    model: 'Reflector construcción',
    description: 'Foco potente de obra o estadio. Luz blanca muy brillante e intensa. Haz concentrado proyectando hacia arriba. Puede moverse lentamente si es móvil. Crea columna de luz visible en humedad/polvo. Intensidad suficiente para saturar cámara. Color blanco frío con tinte azul (LED) o amarillo (halógeno). Posición generalmente fija durante observación. Crea halo de luz dispersa. Visible desde varios kilómetros. Usado en construcción nocturna o eventos.',
    needs_image: true
  },

  // ======== ESTELAS DE LUZ ========
  {
    category: 'light_trail',
    type: 'Estela de avión',
    model: 'Long exposure aircraft',
    description: 'Línea de luz continua atravesando cielo en fotografía de larga exposición. Color típicamente blanco o amarillo. Línea recta o ligeramente curva. Grosor uniforme. Puede mostrar color de luces de navegación (rojo/verde) en inicio. Atraviesa frame de esquina a esquina típicamente. Indica trayectoria de avión durante exposición. Puede mostrar parpadeos de estroboscópica como perlas. Estrellas aparecen como puntos o trazas si hay seguimiento. NO es objeto real sino artefacto fotográfico.',
    needs_image: true
  },

  // ======== INSECTOS ========
  {
    category: 'insect',
    type: 'Insecto cerca de lente',
    model: 'Insecto desenfocado',
    description: 'Forma borrosa, generalmente ovalada u alargada muy desenfocada. Aparece muy grande y cercano. Fuera de foco por proximidad extrema a lente. Color variable: oscuro, translúcido, o brillante si refleja luz. Puede aparecer con movimiento rápido tipo borrón. Semi-transparente. Forma difusa sin detalles nítidos. Tamaño aparente grande (varios centímetros en imagen). Posición aleatoria en frame. Puede tener brillo si flash/luz frontal lo ilumina. Común en fotografía nocturna con flash.',
    needs_image: true
  },

  // ======== ARTEFACTOS DE CÁMARA ========
  {
    category: 'camera_artifact',
    type: 'Polvo en sensor',
    model: 'Sensor dust',
    description: 'Manchas oscuras circulares difusas. Siempre en misma posición en múltiples fotos. Borde suave y gradual. Más visible con cielo uniforme y diafragma cerrado (f/16+). Color gris oscuro neutro. Tamaño variable pero constante entre fotos. Múltiples manchas posibles. Aparece sobre área de cielo principalmente. NO se mueve entre tomas. Desaparece en diafragma abierto (f/2.8). Permanece en misma posición aunque se rote cámara. Es defecto de cámara, no objeto real.',
    needs_image: true
  },
  {
    category: 'camera_artifact',
    type: 'Orbe de polvo',
    model: 'Dust orb',
    description: 'Círculo brillante difuso translúcido. Causado por partícula de polvo cercana a lente iluminada por flash. Color blanco, azul o con iridiscencia. Borde suave degradado. Centro más brillante que borde. Tamaño variable pequeño a grande. Posición aleatoria. Aparece solo con flash o luz frontal fuerte. Puede mostrar patrones concéntricos. Semi-transparente, se ve escena detrás. Común en ambientes polvorientos. Desaparece sin flash. Múltiples orbes posibles en una imagen.',
    needs_image: true
  },

  // ======== NATURALES ========
  {
    category: 'natural',
    type: 'Aurora Boreal',
    model: 'Northern Lights',
    description: 'Cortinas de luz verde, rosa, violeta en cielo nocturno. Movimiento ondulante lento como cortinas al viento. Color verde predominante, con rosa/rojo en bordes. Forma de arco o banda horizontal. Variación de intensidad. Visible solo en latitudes altas. Aparece en horizonte norte típicamente. Puede cubrir gran porción de cielo. Movimiento fluido y orgánico. Brillo suficiente para ver a simple vista. En foto puede ser más colorido que visualmente. Estrellas visibles entre las luces.',
    needs_image: true
  }
];

async function main() {
  try {
    console.log('🚀 Creando entradas de entrenamiento (sin imágenes)\n');

    await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/uap-db');
    console.log('✅ Conectado a MongoDB\n');

    let created = 0;
    let skipped = 0;

    for (const data of TRAINING_DATA) {
      try {
        // Verificar si ya existe
        const existing = await TrainingImage.findOne({
          type: data.type,
          category: data.category
        });

        if (existing) {
          console.log(`⏭️  Ya existe: ${data.type}`);
          skipped++;
          continue;
        }

        // Crear entrada
        const entry = new TrainingImage({
          category: data.category,
          type: data.type,
          model: data.model,
          description: data.description,
          imageUrl: 'placeholder.jpg', // Placeholder hasta que admin suba imagen real
          thumbnailUrl: 'placeholder-thumb.jpg',
          uploadedBy: ADMIN_USER_ID,
          source: 'manual_upload',
          verified: false, // No verificado hasta que tenga imagen real
          isActive: true,
          visualFeatures: {
            needsImage: true,
            description: 'Entrada creada automáticamente - requiere imagen'
          }
        });

        await entry.save();
        console.log(`✅ Creado: ${data.type}`);
        created++;

      } catch (error) {
        console.error(`❌ Error con ${data.type}:`, error.message);
      }
    }

    console.log('\n' + '='.repeat(60));
    console.log(`✅ Creadas: ${created}`);
    console.log(`⏭️  Omitidas (ya existían): ${skipped}`);
    console.log(`📁 Total: ${TRAINING_DATA.length}`);
    console.log('='.repeat(60));

    console.log('\n📝 SIGUIENTE PASO:');
    console.log('Ve a "Admin - Entrada de Datos" y sube imágenes reales');
    console.log('para cada una de estas categorías.\n');

    process.exit(0);

  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

main();
