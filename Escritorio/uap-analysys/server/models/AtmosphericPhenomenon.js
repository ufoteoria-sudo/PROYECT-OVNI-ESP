const mongoose = require('mongoose');

/**
 * Modelo de Fenómenos Atmosféricos
 * Base de datos de fenómenos atmosféricos y ópticos que pueden
 * confundirse con UAPs/OVNIs
 */
const atmosphericPhenomenonSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true
  },
  
  // ACTUALIZADO: category ahora acepta cualquier slug de categoría dinámica
  category: {
    type: String,
    required: true
    // Eliminado enum - ahora usa slugs de la colección Category
  },
  
  description: {
    type: String,
    required: true
  },
  
  visualCharacteristics: {
    shape: {
      type: String,
      enum: ['circular', 'oval', 'lens', 'pillar', 'arc', 'curtain', 'irregular', 'point', 'streak', 'disk', 'varied', 'wave-like']
    },
    colors: [String],      // ['white', 'red', 'orange', 'green', 'blue', 'purple', 'rainbow']
    movement: {
      type: String,
      enum: ['stationary', 'slow', 'fast', 'erratic', 'wave-like', 'pulsating', 'none']
    },
    duration: String,      // '5 minutes', '30 seconds', '1-2 hours', etc.
    brightness: {
      type: String,
      enum: ['dim', 'moderate', 'bright', 'very_bright', 'variable']
    },
    texture: String        // 'smooth', 'wispy', 'sharp', 'diffuse'
  },
  
  conditions: {
    weather: [String],     // ['clear', 'cloudy', 'rainy', 'snowy', 'foggy']
    timeOfDay: [String],   // ['day', 'night', 'dawn', 'dusk']
    altitude: {
      min: Number,         // metros
      max: Number
    },
    geographicRegions: [String],  // ['polar', 'temperate', 'tropical', 'worldwide']
    seasonality: [String]  // ['winter', 'summer', 'spring', 'fall', 'year-round']
  },
  
  commonConfusions: [String],  // ['ufo', 'aircraft', 'satellite', 'drone']
  
  rarity: {
    type: String,
    enum: ['very_common', 'common', 'uncommon', 'rare', 'very_rare'],
    default: 'common'
  },
  
  scientificExplanation: String,
  
  referenceImages: [String],  // URLs o paths a imágenes de referencia (LEGACY - mantener para compatibilidad)
  
  // NUEVO: Array de imágenes con metadatos (similar a LibraryObject)
  images: [{
    url: {
      type: String,
      required: true
    },
    thumbnailUrl: String,
    description: String,
    uploadedAt: {
      type: Date,
      default: Date.now
    },
    uploadedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }
  }],
  
  imageUrl: String,  // Imagen principal (LEGACY - mantener para compatibilidad)
  
  wikipediaUrl: String,
  
  reportFrequency: {
    type: Number,
    default: 0,
    min: 0
  },
  
  keywords: [String],  // Para búsqueda
  
  isActive: {
    type: Boolean,
    default: true
  }
  
}, {
  timestamps: true
});

// Índices para búsqueda rápida
atmosphericPhenomenonSchema.index({ name: 1 });
atmosphericPhenomenonSchema.index({ category: 1 });
atmosphericPhenomenonSchema.index({ rarity: 1 });
atmosphericPhenomenonSchema.index({ keywords: 1 });

// Método para buscar fenómenos por características visuales
atmosphericPhenomenonSchema.statics.findByVisualCharacteristics = function(characteristics) {
  const query = { isActive: true };
  
  if (characteristics.shape) {
    query['visualCharacteristics.shape'] = characteristics.shape;
  }
  
  if (characteristics.colors && characteristics.colors.length > 0) {
    query['visualCharacteristics.colors'] = { $in: characteristics.colors };
  }
  
  if (characteristics.movement) {
    query['visualCharacteristics.movement'] = characteristics.movement;
  }
  
  return this.find(query).sort({ reportFrequency: -1, rarity: 1 });
};

// Método para buscar por condiciones
atmosphericPhenomenonSchema.statics.findByConditions = function(conditions) {
  const query = { isActive: true };
  
  if (conditions.weather) {
    query['conditions.weather'] = conditions.weather;
  }
  
  if (conditions.timeOfDay) {
    query['conditions.timeOfDay'] = conditions.timeOfDay;
  }
  
  if (conditions.altitude) {
    query['conditions.altitude.min'] = { $lte: conditions.altitude };
    query['conditions.altitude.max'] = { $gte: conditions.altitude };
  }
  
  return this.find(query).sort({ reportFrequency: -1 });
};

module.exports = mongoose.model('AtmosphericPhenomenon', atmosphericPhenomenonSchema);
