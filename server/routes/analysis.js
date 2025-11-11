const express = require('express');
const router = express.Router();
const Analysis = require('../models/Analysis');

/**
 * GET /api/analysis
 * Obtener análisis públicos (sin autenticación)
 * Para mostrar en la galería pública de WordPress
 */
router.get('/', async (req, res) => {
    try {
        const { limit = 20, page = 1, sort = 'createdAt', order = 'desc' } = req.query;
        
        const skip = (page - 1) * limit;
        const sortOrder = order === 'asc' ? 1 : -1;
        
        // Obtener análisis públicos (completados y con cierto nivel de confianza)
        const analyses = await Analysis.find({
            status: 'completed',
            isPublic: true,
            'aiAnalysis.confidence': { $gte: 50 } // Solo mostrar análisis con confianza >= 50%
        })
        .select('fileName aiAnalysis.confidence aiAnalysis.description exifData.location createdAt')
        .sort({ [sort]: sortOrder })
        .limit(parseInt(limit))
        .skip(parseInt(skip))
        .lean();
        
        // Formatear respuesta
        const formattedAnalyses = analyses.map(analysis => ({
            _id: analysis._id,
            title: `Análisis UAP - ${analysis.exifData?.location?.address || 'Ubicación desconocida'}`,
            imageUrl: `https://via.placeholder.com/600x400/667eea/ffffff?text=${encodeURIComponent(analysis.fileName)}`,
            confidence: analysis.aiAnalysis?.confidence || 0,
            summary: analysis.aiAnalysis?.description || 'Sin resumen disponible',
            location: analysis.exifData?.location?.address || 'Ubicación desconocida',
            createdAt: analysis.createdAt
        }));
        
        // Contar total para paginación
        const total = await Analysis.countDocuments({
            status: 'completed',
            isPublic: true,
            'aiAnalysis.confidence': { $gte: 50 }
        });
        
        res.json({
            success: true,
            data: formattedAnalyses,
            pagination: {
                total,
                page: parseInt(page),
                limit: parseInt(limit),
                pages: Math.ceil(total / limit)
            }
        });
        
    } catch (error) {
        console.error('Error obteniendo análisis públicos:', error);
        res.status(500).json({
            success: false,
            error: 'Error al obtener análisis públicos',
            message: error.message
        });
    }
});

/**
 * GET /api/analysis/:id
 * Obtener un análisis público específico
 */
router.get('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        
        const analysis = await Analysis.findById(id)
            .select('fileName aiAnalysis exifData.location createdAt status')
            .lean();
        
        if (!analysis) {
            return res.status(404).json({
                success: false,
                error: 'Análisis no encontrado'
            });
        }
        
        // Solo mostrar si está completado y es público
        if (analysis.status !== 'completed' || !analysis.isPublic) {
            return res.status(403).json({
                success: false,
                error: 'Este análisis no está disponible públicamente'
            });
        }
        
        res.json({
            success: true,
            data: {
                _id: analysis._id,
                title: `Análisis UAP - ${analysis.exifData?.location?.address || 'Ubicación desconocida'}`,
                imageUrl: `https://via.placeholder.com/600x400/667eea/ffffff?text=${encodeURIComponent(analysis.fileName)}`,
                confidence: analysis.aiAnalysis?.confidence || 0,
                summary: analysis.aiAnalysis?.description || 'Sin resumen disponible',
                location: analysis.exifData?.location?.address || 'Ubicación desconocida',
                unusualFeatures: analysis.aiAnalysis?.unusualFeatures || [],
                createdAt: analysis.createdAt
            }
        });
        
    } catch (error) {
        console.error('Error obteniendo análisis:', error);
        res.status(500).json({
            success: false,
            error: 'Error al obtener el análisis',
            message: error.message
        });
    }
});

module.exports = router;
