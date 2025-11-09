const mongoose = require('mongoose');

/**
 * Modelo de Imágenes de Entrenamiento
 * Permite a los administradores cargar imágenes de referencia
 * para mejorar la precisión del sistema de análisis
 */
const trainingImageSchema = new mongoose.Schema({
  // Identificación
  category: {
    type: String,
    required: true,
    enum: [
      'aircraft_commercial',    // Avión comercial
      'aircraft_military',      // Avión militar
      'aircraft_private',       // Avión privado
      'drone',                  // Dron/UAV
      'helicopter',             // Helicóptero
      'balloon',                // Globo aerostático/meteorológico
      'satellite',              // Satélite artificial
      'bird',                   // Ave/fauna
      'celestial',              // Objeto celestial (luna, planeta, estrella)
      'atmospheric',            // Fenómeno atmosférico
      'kite',                   // Cometa/papalote
      'rocket',                 // Cohete/lanzadera
      'debris',                 // Basura espacial
      'other'                   // Otro objeto identificable
    ]
  },

  // Tipo específico dentro de la categoría
  type: {
    type: String,
    required: true,
    trim: true
    // Ejemplos: "Boeing 737", "DJI Phantom 4", "ISS", "Gaviota", etc.
  },

  // Descripción detallada
  description: {
    type: String,
    required: true,
    trim: true,
    maxlength: 1000
  },

  // Ruta de la imagen en el servidor
  imageUrl: {
    type: String,
    required: true
  },

  // Thumbnail para vista previa
  thumbnailUrl: {
    type: String
  },

  // Características visuales específicas
  visualFeatures: {
    shape: String,              // Forma característica
    colors: [String],           // Colores predominantes
    size: String,               // Tamaño aproximado
    movementPattern: String,    // Patrón de movimiento típico
    lightPattern: String,       // Patrón de luces (si aplica)
    commonAltitude: String,     // Altitud típica
    commonSpeed: String         // Velocidad típica
  },

  // Metadatos técnicos
  technicalData: {
    manufacturer: String,       // Fabricante
    model: String,              // Modelo específico
    wingspan: Number,           // Envergadura (metros)
    length: Number,             // Longitud (metros)
    maxSpeed: Number,           // Velocidad máxima (km/h)
    cruiseAltitude: Number,     // Altitud de crucero (metros)
    identificationMarks: String // Marcas de identificación
  },

  // Ejemplos de avistamiento
  commonSightings: {
    timeOfDay: [String],        // Horarios comunes de avistamiento
    locations: [String],        // Ubicaciones típicas
    weather: [String]           // Condiciones meteorológicas típicas
  },

  // Tags para búsqueda
  tags: [{
    type: String,
    lowercase: true,
    trim: true
  }],

  // Estado de verificación
  isActive: {
    type: Boolean,
    default: true
  },

  verified: {
    type: Boolean,
    default: false
  },

  verifiedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },

  verifiedAt: {
    type: Date
  },

  // Estadísticas de uso
  usageStats: {
    matchCount: {
      type: Number,
      default: 0
    },
    lastUsed: Date,
    accuracy: {
      type: Number,
      default: 0,
      min: 0,
      max: 100
    }
  },

  // Usuario que subió la imagen
  uploadedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },

  // Fuente de la imagen
  source: {
    type: String,
    enum: ['manual_upload', 'web_scraping', 'api_import', 'user_contribution'],
    default: 'manual_upload'
  },

  // URL de referencia externa (opcional)
  externalRefs: [{
    name: String,      // Nombre de la fuente
    url: String,       // URL de referencia
    type: String       // wikipedia, manufacturer, database, etc.
  }],

  // Notas adicionales
  notes: {
    type: String,
    maxlength: 2000
  }

}, {
  timestamps: true
});

// Índices para búsqueda eficiente
trainingImageSchema.index({ category: 1, isActive: 1 });
trainingImageSchema.index({ type: 1 });
trainingImageSchema.index({ tags: 1 });
trainingImageSchema.index({ 'usageStats.matchCount': -1 });
trainingImageSchema.index({ createdAt: -1 });

// Método estático para buscar imágenes similares
trainingImageSchema.statics.findSimilar = async function(category, tags = []) {
  const query = {
    isActive: true,
    $or: [
      { category: category }
    ]
  };

  // Si hay tags, buscar coincidencias
  if (tags.length > 0) {
    query.$or.push({ tags: { $in: tags } });
  }

  return this.find(query)
    .sort({ 'usageStats.matchCount': -1, 'usageStats.accuracy': -1 })
    .limit(10)
    .populate('uploadedBy', 'username email')
    .populate('verifiedBy', 'username email');
};

// Método para incrementar contador de uso
trainingImageSchema.methods.incrementUsage = async function() {
  this.usageStats.matchCount += 1;
  this.usageStats.lastUsed = new Date();
  return this.save();
};

// Método para actualizar precisión
trainingImageSchema.methods.updateAccuracy = async function(isCorrect) {
  const currentAccuracy = this.usageStats.accuracy || 0;
  const currentCount = this.usageStats.matchCount || 1;
  
  // Calcular nueva precisión promedio
  const newAccuracy = isCorrect 
    ? ((currentAccuracy * (currentCount - 1)) + 100) / currentCount
    : ((currentAccuracy * (currentCount - 1)) + 0) / currentCount;
  
  this.usageStats.accuracy = Math.round(newAccuracy);
  return this.save();
};

// Método para obtener estadísticas por categoría
trainingImageSchema.statics.getCategoryStats = async function() {
  return this.aggregate([
    { $match: { isActive: true } },
    {
      $group: {
        _id: '$category',
        count: { $sum: 1 },
        verified: { $sum: { $cond: ['$verified', 1, 0] } },
        totalMatches: { $sum: '$usageStats.matchCount' },
        avgAccuracy: { $avg: '$usageStats.accuracy' }
      }
    },
    { $sort: { count: -1 } }
  ]);
};

// Método virtual para obtener URL completa de la imagen
trainingImageSchema.virtual('fullImageUrl').get(function() {
  if (this.imageUrl && !this.imageUrl.startsWith('http')) {
    return `${process.env.BASE_URL || 'http://localhost:3000'}/uploads/training/${this.imageUrl}`;
  }
  return this.imageUrl;
});

// Asegurar que los virtuals se serialicen
trainingImageSchema.set('toJSON', { virtuals: true });
trainingImageSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('TrainingImage', trainingImageSchema);
