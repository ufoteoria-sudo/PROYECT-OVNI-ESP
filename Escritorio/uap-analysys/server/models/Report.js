const mongoose = require('mongoose');

const reportSchema = new mongoose.Schema({
  // Relaciones
  analysisId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Analysis',
    required: true
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  
  // Datos del informe (llenados por el usuario)
  reportData: {
    // Descripción del avistamiento
    situation: {
      type: String,
      required: true
    },
    
    // Localización detallada
    location: {
      type: String,
      required: true
    },
    locationDetails: {
      city: String,
      state: String,
      country: String,
      coordinates: {
        lat: Number,
        lng: Number
      }
    },
    
    // Fecha y hora del avistamiento
    datetime: {
      type: Date,
      required: true
    },
    
    // Información de contacto (opcional - string simple o estructurado)
    contactInfo: {
      type: mongoose.Schema.Types.Mixed, // Acepta string u objeto
      default: null
    },
    
    // Detalles adicionales
    witnesses: {
      type: Number,
      default: 1,
      min: 1
    },
    duration: String, // Ej: "5 minutos", "30 segundos"
    weatherConditions: String,
    visibility: String,
    
    // Notas adicionales
    additionalNotes: {
      type: String,
      maxlength: 2000
    }
  },
  
  // Archivo PDF generado
  pdfPath: String,
  pdfFileName: String,
  pdfUrl: String,
  pdfGeneratedDate: Date,
  
  // Envío por email
  sentByEmail: {
    type: Boolean,
    default: false
  },
  emailSentDate: Date,
  recipientEmail: String,
  
  // Estado del informe
  status: {
    type: String,
    enum: ['draft', 'generating', 'generated', 'sent', 'error'],
    default: 'draft'
  },
  errorMessage: String,
  
  // Metadata
  reportNumber: String, // Número único de informe
  version: {
    type: Number,
    default: 1
  },
  
}, { timestamps: true });

// Generar número de informe único antes de guardar
reportSchema.pre('save', async function(next) {
  if (!this.reportNumber) {
    const date = new Date();
    const year = date.getFullYear();
    const count = await mongoose.model('Report').countDocuments();
    this.reportNumber = `UAP-${year}-${String(count + 1).padStart(6, '0')}`;
  }
  next();
});

// Índices
reportSchema.index({ userId: 1, createdAt: -1 });
reportSchema.index({ analysisId: 1 });
reportSchema.index({ reportNumber: 1 }, { unique: true });

module.exports = mongoose.model('Report', reportSchema);
