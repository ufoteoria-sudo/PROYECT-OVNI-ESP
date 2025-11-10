const mongoose = require('mongoose');

/**
 * Modelo de Categoría
 * Sistema dinámico de categorías para la biblioteca visual
 */
const categorySchema = new mongoose.Schema({
  // Nombre de la categoría (visible al usuario)
  name: {
    type: String,
    required: true,
    trim: true
  },

  // Slug único para URLs y referencias
  slug: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },

  // Tipo de categoría
  type: {
    type: String,
    enum: ['phenomenon', 'object'], // phenomenon = fenómenos atmosféricos, object = objetos
    required: true
  },

  // Icono/emoji para la categoría
  icon: {
    type: String,
    default: '📁'
  },

  // Descripción de la categoría
  description: {
    type: String,
    trim: true
  },

  // Orden de visualización (menor = primero)
  order: {
    type: Number,
    default: 0
  },

  // Si la categoría está activa (visible en biblioteca)
  isActive: {
    type: Boolean,
    default: true
  },

  // Color de la categoría (para badges y UI)
  color: {
    type: String,
    default: '#667eea'
  },

  // Conteo de elementos en esta categoría (calculado dinámicamente)
  itemCount: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

// Índices
categorySchema.index({ type: 1, order: 1 });
categorySchema.index({ slug: 1 });
categorySchema.index({ isActive: 1 });

// Método para actualizar el conteo de elementos
categorySchema.methods.updateItemCount = async function() {
  const LibraryObject = mongoose.model('LibraryObject');
  const AtmosphericPhenomenon = mongoose.model('AtmosphericPhenomenon');
  
  if (this.type === 'object') {
    this.itemCount = await LibraryObject.countDocuments({ category: this.slug });
  } else {
    this.itemCount = await AtmosphericPhenomenon.countDocuments({ category: this.slug });
  }
  
  return this.save();
};

module.exports = mongoose.model('Category', categorySchema);
