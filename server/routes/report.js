const express = require('express');
const router = express.Router();
const Report = require('../models/Report');
const Analysis = require('../models/Analysis');
const auth = require('../middleware/auth');
const pdfGenerator = require('../services/pdfGenerator');
const NotificationService = require('../services/notificationService');
const fs = require('fs');
const path = require('path');

/**
 * RUTAS DE REPORTES
 * Gestión de informes generados a partir de análisis
 */

// ==================== CREAR NUEVO REPORTE ====================
// POST /api/reports
router.post('/', auth, async (req, res) => {
  try {
    const {
      analysisId,
      situation,
      location,
      locationDetails,
      datetime,
      contactInfo,
      witnesses,
      duration,
      weatherConditions,
      visibility,
      additionalNotes
    } = req.body;

    // Validar campos requeridos
    if (!analysisId || !situation || !location || !datetime) {
      return res.status(400).json({
        error: 'Faltan campos requeridos: analysisId, situation, location, datetime'
      });
    }

    // Verificar que el análisis existe y pertenece al usuario
    const analysis = await Analysis.findOne({
      _id: analysisId,
      userId: req.userId
    });

    if (!analysis) {
      return res.status(404).json({
        error: 'Análisis no encontrado o no tienes permiso para acceder'
      });
    }

    // Verificar que el análisis esté completado
    if (analysis.status !== 'completed') {
      return res.status(400).json({
        error: 'El análisis debe estar completado antes de generar un reporte'
      });
    }

    // Crear el reporte
    const report = new Report({
      analysisId,
      userId: req.userId,
      reportData: {
        situation,
        location,
        locationDetails,
        datetime,
        contactInfo,
        witnesses,
        duration,
        weatherConditions,
        visibility,
        additionalNotes
      },
      status: 'draft'
    });

    await report.save();

    res.status(201).json({
      message: 'Reporte creado exitosamente',
      report
    });

  } catch (error) {
    console.error('Error al crear reporte:', error);
    res.status(500).json({
      error: 'Error del servidor al crear reporte',
      details: error.message
    });
  }
});

// ==================== GENERAR PDF ====================
// POST /api/reports/:id/generate
router.post('/:id/generate', auth, async (req, res) => {
  try {
    // Buscar el reporte
    const report = await Report.findOne({
      _id: req.params.id,
      userId: req.userId
    });

    if (!report) {
      return res.status(404).json({
        error: 'Reporte no encontrado'
      });
    }

    // Obtener el análisis asociado
    const analysis = await Analysis.findById(report.analysisId);
    if (!analysis) {
      return res.status(404).json({
        error: 'Análisis asociado no encontrado'
      });
    }

    // Obtener datos del usuario
    const User = require('../models/User');
    const user = await User.findById(req.userId).select('username email firstName lastName');

    // Cambiar estado a "generando"
    report.status = 'generating';
    await report.save();

    // Generar PDF
    try {
      const pdfPath = await pdfGenerator.generateReport(report, analysis, user);
      
      // Actualizar reporte con la ruta del PDF
      report.pdfPath = pdfPath;
      report.pdfFileName = path.basename(pdfPath);
      report.pdfUrl = `/api/reports/${report._id}/download`;
      report.pdfGeneratedDate = new Date();
      report.status = 'generated';
      await report.save();

      // Enviar notificación al usuario
      await NotificationService.notifyReportGenerated(
        req.userId,
        report._id,
        {
          title: report.reportData?.title || 'Reporte UAP',
          reportNumber: report.reportNumber
        }
      );

      res.json({
        message: 'PDF generado exitosamente',
        report,
        downloadUrl: report.pdfUrl
      });

    } catch (pdfError) {
      // Error al generar PDF
      report.status = 'error';
      report.errorMessage = pdfError.message;
      await report.save();

      throw pdfError;
    }

  } catch (error) {
    console.error('Error al generar PDF:', error);
    res.status(500).json({
      error: 'Error al generar PDF',
      details: error.message
    });
  }
});

// ==================== LISTAR REPORTES DEL USUARIO ====================
// GET /api/reports
router.get('/', auth, async (req, res) => {
  try {
    const { status, page = 1, limit = 10 } = req.query;

    // Construir filtro
    const filter = { userId: req.userId };
    if (status) {
      filter.status = status;
    }

    // Paginación
    const skip = (page - 1) * limit;

    // Obtener reportes
    const reports = await Report.find(filter)
      .populate('analysisId', 'fileName fileType uploadDate status')
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip(skip)
      .lean();

    // Contar total
    const total = await Report.countDocuments(filter);

    res.json({
      reports,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(total / limit)
      }
    });

  } catch (error) {
    console.error('Error al listar reportes:', error);
    res.status(500).json({
      error: 'Error al obtener reportes',
      details: error.message
    });
  }
});

// ==================== OBTENER UN REPORTE ====================
// GET /api/reports/:id
router.get('/:id', auth, async (req, res) => {
  try {
    const report = await Report.findOne({
      _id: req.params.id,
      userId: req.userId
    })
      .populate('analysisId')
      .populate('userId', 'username email firstName lastName');

    if (!report) {
      return res.status(404).json({
        error: 'Reporte no encontrado'
      });
    }

    res.json({ report });

  } catch (error) {
    console.error('Error al obtener reporte:', error);
    res.status(500).json({
      error: 'Error al obtener reporte',
      details: error.message
    });
  }
});

// ==================== DESCARGAR PDF ====================
// GET /api/reports/:id/download
router.get('/:id/download', auth, async (req, res) => {
  try {
    const report = await Report.findOne({
      _id: req.params.id,
      userId: req.userId
    });

    if (!report) {
      return res.status(404).json({
        error: 'Reporte no encontrado'
      });
    }

    if (!report.pdfPath || !fs.existsSync(report.pdfPath)) {
      return res.status(404).json({
        error: 'PDF no encontrado. Genera el PDF primero.'
      });
    }

    // Establecer headers para descarga
    const fileName = report.pdfFileName || `UAP-Report-${report.reportNumber}.pdf`;
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);

    // Enviar archivo
    const fileStream = fs.createReadStream(report.pdfPath);
    fileStream.pipe(res);

  } catch (error) {
    console.error('Error al descargar PDF:', error);
    res.status(500).json({
      error: 'Error al descargar PDF',
      details: error.message
    });
  }
});

// ==================== ACTUALIZAR REPORTE ====================
// PUT /api/reports/:id
router.put('/:id', auth, async (req, res) => {
  try {
    const report = await Report.findOne({
      _id: req.params.id,
      userId: req.userId
    });

    if (!report) {
      return res.status(404).json({
        error: 'Reporte no encontrado'
      });
    }

    // Solo permitir actualizar si está en draft
    if (report.status !== 'draft') {
      return res.status(400).json({
        error: 'Solo se pueden editar reportes en estado borrador'
      });
    }

    // Actualizar datos permitidos
    const allowedUpdates = [
      'situation',
      'location',
      'locationDetails',
      'datetime',
      'contactInfo',
      'witnesses',
      'duration',
      'weatherConditions',
      'visibility',
      'additionalNotes'
    ];

    allowedUpdates.forEach(field => {
      if (req.body[field] !== undefined) {
        report.reportData[field] = req.body[field];
      }
    });

    await report.save();

    res.json({
      message: 'Reporte actualizado exitosamente',
      report
    });

  } catch (error) {
    console.error('Error al actualizar reporte:', error);
    res.status(500).json({
      error: 'Error al actualizar reporte',
      details: error.message
    });
  }
});

// ==================== ELIMINAR REPORTE ====================
// DELETE /api/reports/:id
router.delete('/:id', auth, async (req, res) => {
  try {
    const report = await Report.findOne({
      _id: req.params.id,
      userId: req.userId
    });

    if (!report) {
      return res.status(404).json({
        error: 'Reporte no encontrado'
      });
    }

    // Eliminar archivo PDF si existe
    if (report.pdfPath && fs.existsSync(report.pdfPath)) {
      fs.unlinkSync(report.pdfPath);
    }

    // Eliminar reporte
    await Report.deleteOne({ _id: report._id });

    res.json({
      message: 'Reporte eliminado exitosamente'
    });

  } catch (error) {
    console.error('Error al eliminar reporte:', error);
    res.status(500).json({
      error: 'Error al eliminar reporte',
      details: error.message
    });
  }
});

module.exports = router;
