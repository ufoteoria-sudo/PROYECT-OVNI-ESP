const mongoose = require('mongoose');

const analysisSchema = new mongoose.Schema({
  // Relación con usuario
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  
  // Información del archivo
  fileName: {
    type: String,
    required: true
  },
  fileType: {
    type: String,
    enum: ['image', 'video'],
    required: true
  },
  filePath: {
    type: String,
    required: true
  },
  fileSize: {
    type: Number, // en bytes
    required: true
  },
  uploadDate: {
    type: Date,
    default: Date.now
  },
  
  // Datos EXIF (EXPANDIDO - Compatible con ExifTool)
  exifData: {
    // Información de la cámara
    camera: String, // Make
    cameraModel: String, // Model
    lens: String, // LensModel
    lensMake: String, // LensMake
    lensSerialNumber: String,
    cameraSerialNumber: String,
    
    // Ubicación GPS
    location: {
      latitude: Number,
      longitude: Number,
      altitude: Number,
      address: String, // Geocoding inverso
      latitudeRef: String, // N/S
      longitudeRef: String, // E/W
      altitudeRef: String, // Above/Below sea level
      gpsDateStamp: String,
      gpsTimeStamp: String
    },
    
    // Fecha y hora (múltiples campos)
    captureDate: Date, // DateTimeOriginal
    captureTime: String,
    dateTime: Date, // DateTime (puede ser diferente si fue editada)
    dateTimeDigitized: Date,
    createDate: String,
    modifyDate: String,
    
    // Configuración de captura
    iso: Number,
    shutterSpeed: String, // ExposureTime
    exposureTime: Number, // Valor numérico original
    aperture: String, // FNumber
    apertureValue: Number, // Valor numérico
    focalLength: String,
    focalLengthIn35mm: Number, // FocalLengthIn35mmFilm
    
    // Exposición
    exposureMode: String, // Auto, Manual, etc.
    exposureProgram: String, // Program AE, Aperture-priority, etc.
    exposureBias: Number, // ExposureCompensation
    meteringMode: String, // Matrix, Center-weighted, Spot
    
    // Flash
    flash: Boolean,
    flashMode: String,
    flashFired: Boolean,
    flashReturn: String,
    flashEnergy: String,
    
    // Balance de blancos y color
    whiteBalance: String, // Auto, Manual
    colorSpace: String, // sRGB, Adobe RGB
    colorMode: String,
    saturation: String,
    sharpness: String,
    contrast: String,
    brightness: Number,
    
    // Enfoque
    focusMode: String, // AF-S, AF-C, Manual
    focusDistance: Number,
    focusPoint: String,
    afAreaMode: String,
    
    // Calidad y formato
    quality: String, // Fine, Normal, Basic
    imageWidth: Number,
    imageHeight: Number,
    xResolution: Number,
    yResolution: Number,
    resolutionUnit: String,
    bitsPerSample: Number,
    compression: String,
    orientation: Number,
    
    // Software y procesamiento
    software: String, // Software de la cámara o editor
    processingSoftware: String,
    firmware: String,
    makernotes: String,
    
    // Información del archivo
    fileSize: Number,
    fileType: String,
    mimeType: String,
    
    // Detección de manipulación (EXPANDIDO)
    isManipulated: {
      type: Boolean,
      default: false
    },
    manipulationScore: {
      type: Number,
      min: 0,
      max: 100,
      default: 0
    },
    manipulationDetails: String,
    isAIGenerated: Boolean,
    
    // Otros campos útiles
    artist: String, // Autor/Fotógrafo
    copyright: String,
    imageDescription: String,
    userComment: String,
    subjectDistance: Number,
    lightSource: String,
    sceneType: String,
    sceneCaptureType: String,
    gainControl: String,
    digitalZoomRatio: Number,
    
    // Datos RAW completos (para análisis avanzado)
    rawTags: mongoose.Schema.Types.Mixed // Todos los tags sin procesar
  },
  
  // Análisis con IA
  aiAnalysis: {
    provider: {
      type: String,
      enum: ['claude', 'openai', 'gemini', 'visual_comparison', 'scientific_comparison', 'basic', 'huggingface'],
      default: 'visual_comparison'
    },
    model: String,
    description: String,
    detectedObjects: [String],
    confidence: {
      type: Number,
      min: 0,
      max: 100
    },
    category: String,
    isUnusual: Boolean,
    unusualFeatures: [String],
    recommendations: [String],
    processedDate: Date,
    rawResponse: mongoose.Schema.Types.Mixed // Respuesta completa de la IA
  },
  
  // Resultados del matching con base de datos
  matchResults: [{
    objectId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'UFODatabase'
    },
    objectName: String,
    category: String,
    matchPercentage: {
      type: Number,
      min: 0,
      max: 100
    },
    matchReason: String,
    visualSimilarity: Number
  }],
  
  // Mejor coincidencia
  bestMatch: {
    objectId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'UFODatabase'
    },
    matchPercentage: Number,
    category: String
  },
  
  // NUEVO: Tracking de match con dataset de training
  matchedWithTraining: {
    type: Boolean,
    default: false
  },
  trainingImageId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'TrainingImage'
  },
  trainingMatchScore: {
    type: Number,
    min: 0,
    max: 100
  },
  
  // NUEVO: Contexto del avistamiento (información del testigo)
  sightingContext: {
    // Características del objeto observado
    movement: {
      type: String,
      enum: ['estático', 'lento', 'moderado', 'rápido', 'muy rápido', 'errático', 'zigzag', 'circular', 'no observado'],
      default: 'no observado'
    },
    speedEstimate: {
      type: Number,
      min: 1,
      max: 5, // 1=muy lento, 5=extremadamente rápido
      default: 3
    },
    altitudeEstimate: {
      type: String,
      enum: ['muy baja', 'baja', 'media', 'alta', 'muy alta', 'no determinada'],
      default: 'no determinada'
    },
    lightColor: {
      type: [String],
      enum: ['blanco', 'amarillo', 'naranja', 'rojo', 'verde', 'azul', 'púrpura', 'multicolor', 'sin luz visible'],
      default: []
    },
    lightIntensity: {
      type: String,
      enum: ['sin luz', 'tenue', 'media', 'brillante', 'muy brillante', 'cegadora', 'parpadeante', 'intermitente'],
      default: 'sin luz'
    },
    soundHeard: {
      type: String,
      enum: ['sin sonido', 'zumbido', 'silbido', 'motor', 'explosión', 'otro'],
      default: 'sin sonido'
    },
    soundDescription: String,
    duration: {
      type: String, // Ej: "30 segundos", "5 minutos"
    },
    weatherConditions: {
      type: String,
      enum: ['despejado', 'parcialmente nublado', 'nublado', 'lluvia', 'tormenta', 'niebla', 'no recuerdo'],
      default: 'no recuerdo'
    },
    
    // Contexto personal del testigo
    witnessActivity: String, // ¿Qué estaba haciendo?
    substanceUse: {
      type: Boolean,
      default: false
    },
    beliefLevel: {
      type: String,
      enum: ['muy escéptico', 'escéptico', 'neutral', 'creyente', 'muy creyente'],
      default: 'neutral'
    },
    accompanied: {
      type: Boolean,
      default: false
    },
    witnessCount: {
      type: Number,
      min: 1,
      default: 1
    },
    otherWitnessesAgree: Boolean,
    
    // Descripción narrativa
    incidentDescription: String, // Descripción detallada del suceso
    emotionalState: {
      type: String,
      enum: ['calmado', 'curioso', 'asustado', 'emocionado', 'confundido', 'otro'],
      default: 'curioso'
    },
    
    // Contexto adicional
    previousSightings: {
      type: Boolean,
      default: false
    },
    previousSightingsCount: Number,
    reportedToAuthorities: {
      type: Boolean,
      default: false
    },
    
    // Timestamp del llenado del formulario
    contextProvidedDate: {
      type: Date,
      default: Date.now
    }
  },

  // NUEVO: Validación Externa con APIs
  externalValidation: {
    performed: {
      type: Boolean,
      default: false
    },
    performedAt: Date,
    coordinates: {
      latitude: Number,
      longitude: Number
    },
    timestamp: Date,
    results: mongoose.Schema.Types.Mixed, // Resultados completos de validación
    hasMatches: {
      type: Boolean,
      default: false
    },
    matchCount: {
      type: Number,
      default: 0
    },
    confidence: {
      type: Number,
      min: 0,
      max: 100,
      default: 0
    },
    error: String
  },

  // NUEVO: Mejora con Datos de Entrenamiento
  trainingEnhancement: {
    enhanced: {
      type: Boolean,
      default: false
    },
    improvementDelta: Number, // Cuánto mejoró la confianza
    trainingMatchCount: Number, // Cuántas imágenes de entrenamiento coincidieron
    enhancedAt: Date,
    reason: String // Si no se pudo mejorar, por qué
  },

  // NUEVO: Sistema de Confianza Ponderada
  confidenceBreakdown: {
    externalValidation: {
      score: Number, // 0-100
      weight: Number, // 0.40 por defecto
      details: [String]
    },
    imageCharacteristics: {
      score: Number, // 0-100
      weight: Number, // 0.30 por defecto
      details: [String]
    },
    trainingData: {
      score: Number, // 0-100
      weight: Number, // 0.30 por defecto
      details: [String]
    }
  },
  confidenceAdjustments: [String], // Ajustes aplicados (ej: "Reducido 20% por conflicto")
  confidenceExplanation: String, // Explicación legible del cálculo de confianza

  // NUEVO: Análisis Visual Avanzado (independiente de EXIF)
  visualAnalysis: {
    lightPatterns: {
      spotCount: Number,
      hasMultipleLights: Boolean,
      pattern: String, // 'drone_multiple_lights', 'aircraft_navigation_lights', etc.
      colorAnalysis: mongoose.Schema.Types.Mixed
    },
    shapeAnalysis: {
      objectArea: Number,
      compactness: Number,
      shapeType: String, // 'circular', 'elongated', 'irregular'
      isSmallObject: Boolean
    },
    colorProfile: {
      dominant: mongoose.Schema.Types.Mixed,
      colorType: String
    },
    edgeDetection: {
      edgeDensity: Number,
      edgeStrength: String
    },
    perceptualHash: String, // Para comparación visual
    objectType: {
      category: String, // 'drone', 'aircraft', 'celestial', etc.
      confidence: Number,
      allScores: mongoose.Schema.Types.Mixed
    },
    confidence: Number // Confianza del análisis visual (0-100)
  },

  // NUEVO: Análisis Forense (detección de manipulación)
  forensicAnalysis: {
    manipulationScore: Number, // 0-100 (100 = muy manipulado)
    verdict: String, // 'LIKELY_AUTHENTIC', 'POSSIBLY_AUTHENTIC', 'INCONCLUSIVE', 'POSSIBLY_MANIPULATED', 'LIKELY_MANIPULATED'
    
    lightingAnalysis: {
      inconsistencyScore: Number,
      averageDirection: Number,
      standardDeviation: Number,
      regions: Number,
      isSuspicious: Boolean
    },
    
    noiseAnalysis: {
      inconsistencyScore: Number,
      averageNoise: Number,
      standardDeviation: Number,
      regions: Number,
      isSuspicious: Boolean
    },
    
    cloneDetection: {
      cloneScore: Number,
      clonedRegions: Number,
      totalBlocks: Number,
      isSuspicious: Boolean,
      details: [mongoose.Schema.Types.Mixed] // Pares de regiones clonadas
    },
    
    edgeConsistency: {
      inconsistencyScore: Number,
      averageDensity: Number,
      standardDeviation: Number,
      isSuspicious: Boolean
    },
    
    processingTime: String
  },

  // NUEVO: Datos Meteorológicos
  weatherData: {
    source: String, // 'OpenWeatherMap'
    queriedAt: Date,
    location: {
      latitude: Number,
      longitude: Number,
      name: String,
      country: String
    },
    temperature: {
      current: Number,
      feels_like: Number,
      unit: String
    },
    conditions: {
      main: String, // 'clouds', 'clear', 'rain', etc.
      description: String
    },
    clouds: {
      coverage: Number, // %
      type: String
    },
    visibility: Number, // metros
    humidity: Number, // %
    wind: {
      speed: Number,
      direction: Number
    },
    precipitation: {
      rain_1h: Number,
      snow_1h: Number
    },
    analysis: {
      visibility_quality: String,
      likelihood_of_optical_phenomena: String,
      weather_explanation_probability: String,
      relevant_conditions: [String],
      warnings: [String]
    }
  },

  // NUEVO: Comparación con Fenómenos Atmosféricos
  atmosphericComparison: {
    totalMatches: Number,
    bestMatch: {
      phenomenon: {
        name: String,
        category: String,
        description: String,
        rarity: String
      },
      score: Number,
      confidence: String,
      explanation: String
    },
    topMatches: [{
      phenomenon: {
        name: String,
        category: String
      },
      score: Number,
      confidence: String
    }],
    hasStrongMatch: Boolean,
    summary: String
  },
  
  // Estado del análisis
  status: {
    type: String,
    enum: ['pending', 'uploading', 'analyzing', 'completed', 'error'],
    default: 'pending'
  },
  errorMessage: String,
  
  // Metadata adicional
  isPublic: {
    type: Boolean,
    default: false
  },
  views: {
    type: Number,
    default: 0
  },
  
  // NUEVO: Indicadores de uso para training
  usedForTraining: {
    type: Boolean,
    default: false
  },
  trainingImageId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'TrainingImage'
  },
  
}, { 
  timestamps: true,
  toJSON: {
    transform: function(doc, ret) {
      ret.id = ret._id;
      delete ret._id;
      delete ret.__v;
      return ret;
    }
  }
});

// Índices para búsquedas eficientes
analysisSchema.index({ userId: 1, createdAt: -1 });
analysisSchema.index({ status: 1 });
analysisSchema.index({ 'bestMatch.category': 1 });

module.exports = mongoose.model('Analysis', analysisSchema);
