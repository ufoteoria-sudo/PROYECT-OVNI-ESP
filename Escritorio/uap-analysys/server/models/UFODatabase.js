const mongoose = require('mongoose');

const ufoDatabaseSchema = new mongoose.Schema({
  // Identificación
  name: {
    type: String,
    required: true,
    trim: true
  },
  
  // Categorización
  category: {
    type: String,
    required: true,
    enum: [
      'celestial',      // Objetos celestes (Luna, Venus, meteoros, estrellas)
      'aircraft',       // Aeronaves convencionales (aviones, helicópteros)
      'satellite',      // Satélites artificiales (ISS, Starlink)
      'drone',          // Drones comerciales y recreativos
      'balloon',        // Globos meteorológicos, aerostáticos
      'natural',        // Fenómenos naturales (relámpagos, nubes lenticulares)
      'bird',           // Aves y animales voladores
      'uap',            // UAP/OVNI verificados o inexplicados
      'hoax',           // Engaños conocidos
      'unknown'         // Sin categorizar
    ]
  },
  
  // Descripción detallada
  description: {
    type: String,
    required: true
  },
  
  // Características visuales
  characteristics: {
    shape: {
      type: String,
      enum: ['circular', 'oval', 'triangular', 'rectangular', 'irregular', 'point', 'cylindrical', 'other']
    },
    color: [String], // Puede tener múltiples colores
    size: String, // Ej: "pequeño", "grande", "muy grande"
    behavior: String, // Patrón de movimiento
    speed: String, // "estático", "lento", "rápido", "muy rápido"
    luminosity: String, // "brillante", "tenue", "intermitente"
  },
  
  // Patrones visuales para matching con IA
  visualPatterns: [String], // Tags descriptivos para comparación
  
  // Imágenes de referencia
  images: [{
    url: String,
    description: String,
    isReference: Boolean
  }],
  
  // Estadísticas
  frequency: {
    type: Number,
    default: 0, // Frecuencia de avistamientos reportados
  },
  matchCount: {
    type: Number,
    default: 0 // Cuántas veces coincidió con análisis
  },
  
  // Información adicional
  scientificName: String, // Para objetos celestiales
  altitude: String, // Rango de altitud típico
  typicalLocations: [String], // Dónde se suele ver
  timeOfDay: [String], // Cuándo es más común (día, noche, amanecer, etc.)
  
  // Verificación y validación
  isVerified: {
    type: Boolean,
    default: false
  },
  verificationSource: String, // NASA, NOAA, etc.
  externalLinks: [String], // URLs de referencia
  
  // NUEVO: Características científicas precalculadas para comparación
  scientificFeatures: {
    morphology: {
      area: Number,
      perimeter: Number,
      compactness: Number,
      aspectRatio: Number
    },
    colorHistogram: {
      histogramR: [Number],
      histogramG: [Number],
      histogramB: [Number],
      meanR: Number,
      meanG: Number,
      meanB: Number,
      stdR: Number,
      stdG: Number,
      stdB: Number
    },
    texture: {
      entropy: Number,
      energy: Number,
      contrast: Number,
      smoothness: Number
    },
    edges: {
      averageEdgeStrength: Number,
      edgeDensity: Number,
      hasStrongEdges: Boolean
    },
    moments: {
      centroidX: Number,
      centroidY: Number,
      eccentricity: Number,
      isCentered: Boolean
    },
    global: {
      averageBrightness: Number,
      averageSaturation: Number,
      isDark: Boolean,
      isBright: Boolean,
      isColorful: Boolean
    }
  },
  
  // Metadatos
  addedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  isActive: {
    type: Boolean,
    default: true
  },
  
}, { timestamps: true });

// Índices para búsquedas eficientes
ufoDatabaseSchema.index({ category: 1 });
ufoDatabaseSchema.index({ name: 'text', description: 'text' });
ufoDatabaseSchema.index({ visualPatterns: 1 });

module.exports = mongoose.model('UFODatabase', ufoDatabaseSchema);
