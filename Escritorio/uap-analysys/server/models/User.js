const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  // Credenciales
  username: {
    type: String,
    required: [true, 'El nombre de usuario es obligatorio'],
    unique: true,
    trim: true,
    minlength: [3, 'El username debe tener al menos 3 caracteres']
  },
  email: {
    type: String,
    required: [true, 'El email es obligatorio'],
    unique: true,
    trim: true,
    lowercase: true,
    match: [/.+\@.+\..+/, 'El email no tiene un formato válido']
  },
  password: {
    type: String,
    required: [true, 'La contraseña es obligatoria'],
    minlength: [6, 'La contraseña debe tener al menos 6 caracteres']
  },
  
  // Información personal
  firstName: {
    type: String,
    trim: true
  },
  lastName: {
    type: String,
    trim: true
  },
  
  // Rol y permisos
  role: {
    type: String,
    enum: ['user', 'admin'],
    default: 'user'
  },
  
  // Suscripción
  subscription: {
    status: {
      type: String,
      enum: ['free', 'active', 'expired'],
      default: 'free'
    },
    plan: {
      type: String,
      default: 'free'
    },
    startDate: Date,
    endDate: Date,
    stripeCustomerId: String,
    stripeSubscriptionId: String
  },
  
  // Perfil adicional
  profile: {
    phone: String,
    country: String,
    bio: String,
    avatar: String
  },
  
  // Control
  isActive: {
    type: Boolean,
    default: true
  },
  lastLogin: Date
  
}, { 
  timestamps: true,
  toJSON: {
    transform: function(doc, ret) {
      ret.id = ret._id;
      delete ret._id;
      delete ret.__v;
      delete ret.password;
      return ret;
    }
  }
});

// Índices
userSchema.index({ email: 1 }, { unique: true });
userSchema.index({ username: 1 }, { unique: true });

module.exports = mongoose.model('User', userSchema);
