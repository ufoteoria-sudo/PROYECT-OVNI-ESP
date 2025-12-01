const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Analysis = sequelize.define('Analysis', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  userId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'Users',
      key: 'id',
    },
  },
  fileName: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  fileType: {
    type: DataTypes.ENUM('image', 'video'),
    allowNull: false,
  },
  filePath: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  fileSize: {
    type: DataTypes.BIGINT,
    allowNull: false,
  },
  uploadDate: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
  },
  
  // Status del análisis
  status: {
    type: DataTypes.ENUM('pending', 'analyzing', 'completed', 'error'),
    defaultValue: 'pending',
  },
  
  // Datos EXIF completos (JSONB - más flexible que Mongoose)
  exifData: {
    type: DataTypes.JSONB,
    defaultValue: {},
  },
  
  // Análisis Visual (Capa 2)
  aiAnalysis: {
    type: DataTypes.JSONB,
    defaultValue: {},
  },
  
  // Análisis Forense (Capa 3)
  forensicAnalysis: {
    type: DataTypes.JSONB,
    defaultValue: {},
  },
  
  // Comparación Científica (Capa 4)
  scientificComparison: {
    type: DataTypes.JSONB,
    defaultValue: {},
  },
  
  // Training Enhancement (Capa 5)
  trainingEnhancement: {
    type: DataTypes.JSONB,
    defaultValue: {},
  },
  
  // Validación Externa (Capa 6)
  externalValidation: {
    type: DataTypes.JSONB,
    defaultValue: {},
  },
  
  // Análisis Meteorológico (Capa 7)
  weatherData: {
    type: DataTypes.JSONB,
    defaultValue: {},
  },
  
  // Comparación Atmosférica (Capa 8)
  atmosphericComparison: {
    type: DataTypes.JSONB,
    defaultValue: {},
  },
  
  // Confianza Ponderada (Capa 9)
  confidence: {
    type: DataTypes.FLOAT,
    defaultValue: 0,
  },
  
  // Recomendaciones
  recommendations: {
    type: DataTypes.JSONB,
    defaultValue: [],
  },
  
  // Mensajes de error si aplica
  errorMessage: {
    type: DataTypes.TEXT,
  },
  
  // Metadatos adicionales
  metadata: {
    type: DataTypes.JSONB,
    defaultValue: {},
  },
}, {
  timestamps: true,
  underscored: false,
  indexes: [
    { fields: ['userId'] },
    { fields: ['status'] },
    { fields: ['createdAt'] },
  ],
});

module.exports = Analysis;
