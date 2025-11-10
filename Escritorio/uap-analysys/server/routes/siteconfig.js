const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const SiteConfig = require('../models/SiteConfig');

// Middleware para verificar que el usuario es admin
const isAdmin = async (req, res, next) => {
    try {
        const User = require('../models/User');
        const user = await User.findById(req.userId);
        
        if (!user || user.role !== 'admin') {
            return res.status(403).json({ error: 'Acceso denegado. Solo administradores.' });
        }
        
        next();
    } catch (error) {
        res.status(500).json({ error: 'Error al verificar permisos' });
    }
};

// GET /api/siteconfig - Obtener todas las configuraciones (público)
router.get('/', async (req, res) => {
    try {
        const configs = await SiteConfig.find();
        
        // Convertir a objeto key-value para facilitar acceso en frontend
        const configObj = {};
        configs.forEach(config => {
            configObj[config.key] = config.value;
        });
        
        res.json(configObj);
    } catch (error) {
        console.error('Error al obtener configuraciones:', error);
        res.status(500).json({ error: 'Error al obtener configuraciones' });
    }
});

// GET /api/siteconfig/all - Obtener todas las configuraciones con detalles (admin)
router.get('/all', auth, isAdmin, async (req, res) => {
    try {
        const configs = await SiteConfig.find().populate('updatedBy', 'username email');
        res.json(configs);
    } catch (error) {
        console.error('Error al obtener configuraciones:', error);
        res.status(500).json({ error: 'Error al obtener configuraciones' });
    }
});

// PUT /api/siteconfig/:key - Actualizar configuración (admin)
router.put('/:key', auth, isAdmin, async (req, res) => {
    try {
        const { key } = req.params;
        const { value, description } = req.body;

        if (!value) {
            return res.status(400).json({ error: 'El valor es requerido' });
        }

        // Validar URL si es un enlace
        if (key.includes('url') || key.includes('link')) {
            try {
                new URL(value);
            } catch (e) {
                return res.status(400).json({ error: 'URL inválida' });
            }
        }

        let config = await SiteConfig.findOne({ key });

        if (config) {
            // Actualizar existente
            config.value = value;
            if (description) config.description = description;
            config.updatedBy = req.userId;
            await config.save();
        } else {
            // Crear nueva
            config = new SiteConfig({
                key,
                value,
                description: description || '',
                updatedBy: req.userId
            });
            await config.save();
        }

        res.json({
            message: 'Configuración actualizada exitosamente',
            config
        });
    } catch (error) {
        console.error('Error al actualizar configuración:', error);
        res.status(500).json({ error: 'Error al actualizar configuración' });
    }
});

// POST /api/siteconfig/init - Inicializar configuraciones por defecto (admin)
router.post('/init', auth, isAdmin, async (req, res) => {
    try {
        const defaultConfigs = [
            {
                key: 'donation_url',
                value: 'https://paypal.me/tuusuario',
                description: 'URL para donaciones PayPal'
            },
            {
                key: 'website_url',
                value: 'https://tu-sitio-web.com',
                description: 'URL del sitio web principal'
            }
        ];

        const results = [];
        for (const config of defaultConfigs) {
            const existing = await SiteConfig.findOne({ key: config.key });
            if (!existing) {
                const newConfig = new SiteConfig({
                    ...config,
                    updatedBy: req.userId
                });
                await newConfig.save();
                results.push(newConfig);
            }
        }

        res.json({
            message: 'Configuraciones inicializadas',
            created: results.length
        });
    } catch (error) {
        console.error('Error al inicializar configuraciones:', error);
        res.status(500).json({ error: 'Error al inicializar configuraciones' });
    }
});

module.exports = router;
