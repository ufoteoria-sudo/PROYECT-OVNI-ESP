const express = require('express');
const router = express.Router();
const Category = require('../models/Category');
const auth = require('../middleware/auth');
const isAdmin = require('../middleware/isAdmin');

/**
 * Ruta: /api/categories
 * Endpoints para gestionar categorías dinámicas de la biblioteca
 */

// ============================================
// PÚBLICAS - Consulta de categorías
// ============================================

/**
 * GET /api/categories
 * Listar todas las categorías activas (público)
 */
router.get('/', async (req, res) => {
  try {
    const { type } = req.query;
    
    const filter = { isActive: true };
    if (type) {
      filter.type = type;
    }
    
    const categories = await Category
      .find(filter)
      .sort({ order: 1, name: 1 })
      .select('-__v');
    
    res.json({
      success: true,
      data: categories
    });
  } catch (error) {
    console.error('Error obteniendo categorías:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener categorías'
    });
  }
});

/**
 * GET /api/categories/:id
 * Obtener una categoría específica
 */
router.get('/:id', async (req, res) => {
  try {
    const category = await Category.findById(req.params.id);
    
    if (!category) {
      return res.status(404).json({
        success: false,
        message: 'Categoría no encontrada'
      });
    }
    
    res.json({
      success: true,
      data: category
    });
  } catch (error) {
    console.error('Error obteniendo categoría:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener categoría'
    });
  }
});

// ============================================
// ADMIN - Gestión de categorías
// ============================================

/**
 * POST /api/categories
 * Crear nueva categoría (solo admin)
 */
router.post('/', auth, isAdmin, async (req, res) => {
  try {
    const { name, slug, type, icon, description, color, order } = req.body;
    
    // Validar campos requeridos
    if (!name || !slug || !type) {
      return res.status(400).json({
        success: false,
        message: 'Nombre, slug y tipo son requeridos'
      });
    }
    
    // Verificar que el slug no exista
    const existingCategory = await Category.findOne({ slug });
    if (existingCategory) {
      return res.status(409).json({
        success: false,
        message: 'Ya existe una categoría con ese slug'
      });
    }
    
    const category = new Category({
      name,
      slug: slug.toLowerCase(),
      type,
      icon: icon || '📁',
      description,
      color: color || '#667eea',
      order: order || 0,
      isActive: true
    });
    
    await category.save();
    
    res.status(201).json({
      success: true,
      message: 'Categoría creada exitosamente',
      data: category
    });
  } catch (error) {
    console.error('Error creando categoría:', error);
    res.status(500).json({
      success: false,
      message: 'Error al crear categoría'
    });
  }
});

/**
 * PUT /api/categories/:id
 * Actualizar categoría (solo admin)
 */
router.put('/:id', auth, isAdmin, async (req, res) => {
  try {
    const { name, slug, type, icon, description, color, order, isActive } = req.body;
    
    const category = await Category.findById(req.params.id);
    
    if (!category) {
      return res.status(404).json({
        success: false,
        message: 'Categoría no encontrada'
      });
    }
    
    // Si se cambia el slug, verificar que no exista
    if (slug && slug !== category.slug) {
      const existingCategory = await Category.findOne({ slug });
      if (existingCategory) {
        return res.status(409).json({
          success: false,
          message: 'Ya existe una categoría con ese slug'
        });
      }
      category.slug = slug.toLowerCase();
    }
    
    // Actualizar campos
    if (name) category.name = name;
    if (type) category.type = type;
    if (icon !== undefined) category.icon = icon;
    if (description !== undefined) category.description = description;
    if (color) category.color = color;
    if (order !== undefined) category.order = order;
    if (isActive !== undefined) category.isActive = isActive;
    
    await category.save();
    
    res.json({
      success: true,
      message: 'Categoría actualizada exitosamente',
      data: category
    });
  } catch (error) {
    console.error('Error actualizando categoría:', error);
    res.status(500).json({
      success: false,
      message: 'Error al actualizar categoría'
    });
  }
});

/**
 * DELETE /api/categories/:id
 * Eliminar categoría (solo admin)
 * NOTA: Solo se puede eliminar si no tiene elementos asociados
 */
router.delete('/:id', auth, isAdmin, async (req, res) => {
  try {
    const category = await Category.findById(req.params.id);
    
    if (!category) {
      return res.status(404).json({
        success: false,
        message: 'Categoría no encontrada'
      });
    }
    
    // Actualizar conteo antes de verificar
    await category.updateItemCount();
    
    // Verificar que no tenga elementos
    if (category.itemCount > 0) {
      return res.status(400).json({
        success: false,
        message: `No se puede eliminar. La categoría tiene ${category.itemCount} elementos asociados`
      });
    }
    
    await category.deleteOne();
    
    res.json({
      success: true,
      message: 'Categoría eliminada exitosamente'
    });
  } catch (error) {
    console.error('Error eliminando categoría:', error);
    res.status(500).json({
      success: false,
      message: 'Error al eliminar categoría'
    });
  }
});

/**
 * POST /api/categories/reorder
 * Reordenar categorías (solo admin)
 */
router.post('/reorder', auth, isAdmin, async (req, res) => {
  try {
    const { categories } = req.body; // Array de { id, order }
    
    if (!Array.isArray(categories)) {
      return res.status(400).json({
        success: false,
        message: 'Se requiere un array de categorías'
      });
    }
    
    // Actualizar orden de cada categoría
    const updates = categories.map(cat => 
      Category.findByIdAndUpdate(cat.id, { order: cat.order })
    );
    
    await Promise.all(updates);
    
    res.json({
      success: true,
      message: 'Orden actualizado exitosamente'
    });
  } catch (error) {
    console.error('Error reordenando categorías:', error);
    res.status(500).json({
      success: false,
      message: 'Error al reordenar categorías'
    });
  }
});

/**
 * POST /api/categories/:id/update-count
 * Actualizar conteo de elementos de una categoría
 */
router.post('/:id/update-count', auth, isAdmin, async (req, res) => {
  try {
    const category = await Category.findById(req.params.id);
    
    if (!category) {
      return res.status(404).json({
        success: false,
        message: 'Categoría no encontrada'
      });
    }
    
    await category.updateItemCount();
    
    res.json({
      success: true,
      message: 'Conteo actualizado',
      data: { itemCount: category.itemCount }
    });
  } catch (error) {
    console.error('Error actualizando conteo:', error);
    res.status(500).json({
      success: false,
      message: 'Error al actualizar conteo'
    });
  }
});

/**
 * POST /api/categories/seed
 * Poblar categorías iniciales (solo admin, solo una vez)
 */
router.post('/seed', auth, isAdmin, async (req, res) => {
  try {
    // Verificar si ya existen categorías
    const existingCount = await Category.countDocuments();
    if (existingCount > 0) {
      return res.status(400).json({
        success: false,
        message: `Ya existen ${existingCount} categorías. Use el panel de administración para gestionarlas.`
      });
    }
    
    // Categorías iniciales
    const initialCategories = [
      // OBJETOS ARTIFICIALES
      { name: 'Aviones Comerciales', slug: 'aviones-comerciales', type: 'object', icon: '✈️', color: '#3b82f6', order: 1, description: 'Aviones de pasajeros y carga comercial' },
      { name: 'Aviones Militares', slug: 'aviones-militares', type: 'object', icon: '🛩️', color: '#ef4444', order: 2, description: 'Aeronaves militares, cazas, transportes' },
      { name: 'Drones', slug: 'drones', type: 'object', icon: '🚁', color: '#8b5cf6', order: 3, description: 'Vehículos aéreos no tripulados (UAV, drones comerciales)' },
      { name: 'Helicópteros', slug: 'helicopteros', type: 'object', icon: '🚁', color: '#10b981', order: 4, description: 'Helicópteros civiles y militares' },
      { name: 'Satélites', slug: 'satelites', type: 'object', icon: '🛰️', color: '#06b6d4', order: 5, description: 'Satélites artificiales, ISS, Starlink' },
      { name: 'Globos Aerostáticos', slug: 'globos', type: 'object', icon: '🎈', color: '#f59e0b', order: 6, description: 'Globos meteorológicos, aerostáticos, dirigibles' },
      { name: 'Vehículos Terrestres', slug: 'vehiculos', type: 'object', icon: '🚗', color: '#64748b', order: 7, description: 'Luces de vehículos, faros, reflectores' },
      { name: 'Infraestructura', slug: 'infraestructura', type: 'object', icon: '🏗️', color: '#6b7280', order: 8, description: 'Torres, antenas, repetidores, alumbrado público' },
      
      // FENÓMENOS ATMOSFÉRICOS
      { name: 'Auroras', slug: 'aurora', type: 'phenomenon', icon: '🌌', color: '#a855f7', order: 10, description: 'Auroras boreales y australes' },
      { name: 'Meteoros', slug: 'meteor', type: 'phenomenon', icon: '☄️', color: '#f97316', order: 11, description: 'Meteoros, bólidos, estrellas fugaces' },
      { name: 'Nubes', slug: 'cloud', type: 'phenomenon', icon: '☁️', color: '#94a3b8', order: 12, description: 'Nubes lenticulares, mammatus, noctilucentes' },
      { name: 'Fenómenos Ópticos', slug: 'optico', type: 'phenomenon', icon: '🌈', color: '#ec4899', order: 13, description: 'Halos, parhelios, arcoíris, espejismos' },
      { name: 'Rayos y Tormentas', slug: 'tormenta', type: 'phenomenon', icon: '⚡', color: '#eab308', order: 14, description: 'Rayos, sprites, jets azules' },
      
      // OBJETOS CELESTES
      { name: 'Planetas', slug: 'planetas', type: 'object', icon: '🪐', color: '#f59e0b', order: 20, description: 'Venus, Júpiter, Marte y otros planetas visibles' },
      { name: 'Estrellas', slug: 'estrellas', type: 'object', icon: '⭐', color: '#fbbf24', order: 21, description: 'Estrellas brillantes, Sirio, Vega, Betelgeuse' },
      { name: 'Luna', slug: 'luna', type: 'object', icon: '🌙', color: '#cbd5e1', order: 22, description: 'Luna llena, creciente, eclipses lunares' },
      { name: 'Sol', slug: 'sol', type: 'object', icon: '☀️', color: '#fbbf24', order: 23, description: 'Sol, eclipses solares, manchas solares' },
      
      // ERRORES DE INTERPRETACIÓN
      { name: 'Reflejos en Cristales', slug: 'reflejos-cristal', type: 'object', icon: '🪟', color: '#06b6d4', order: 30, description: 'Reflejos en ventanas, parabrisas, lentes' },
      { name: 'Luces de Alumbrado', slug: 'luces-alumbrado', type: 'object', icon: '💡', color: '#facc15', order: 31, description: 'Farolas, proyectores, luces de estadios' },
      { name: 'Artefactos de Cámara', slug: 'artefactos-camara', type: 'object', icon: '📷', color: '#6366f1', order: 32, description: 'Lens flare, polvo, manchas en lente' },
      { name: 'Aves e Insectos', slug: 'aves-insectos', type: 'object', icon: '🦅', color: '#14b8a6', order: 33, description: 'Aves, insectos captados en vuelo' }
    ];
    
    // Crear categorías
    const created = await Category.insertMany(initialCategories);
    
    res.json({
      success: true,
      message: `${created.length} categorías creadas exitosamente`,
      data: created
    });
  } catch (error) {
    console.error('Error poblando categorías:', error);
    res.status(500).json({
      success: false,
      message: 'Error al poblar categorías'
    });
  }
});

module.exports = router;

module.exports = router;
