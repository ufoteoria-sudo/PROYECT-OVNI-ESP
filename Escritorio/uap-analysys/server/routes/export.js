const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Analysis = require('../models/Analysis');
const Report = require('../models/Report');
const User = require('../models/User');
const { Parser } = require('json2csv');
const archiver = require('archiver');
const fs = require('fs');
const path = require('path');

/**
 * RUTAS DE EXPORTACIÓN
 * Exportar datos del sistema en diferentes formatos
 */

// ==================== EXPORTAR ANÁLISIS A CSV ====================
router.get('/analyses/csv', auth, async (req, res) => {
  try {
    const { startDate, endDate, status, category } = req.query;
    
    // Construir filtro
    const filter = { userId: req.user._id };
    
    if (startDate || endDate) {
      filter.createdAt = {};
      if (startDate) filter.createdAt.$gte = new Date(startDate);
      if (endDate) filter.createdAt.$lte = new Date(endDate);
    }
    
    if (status) filter.status = status;
    if (category) filter['aiAnalysis.category'] = category;
    
    // Obtener análisis
    const analyses = await Analysis.find(filter)
      .sort({ createdAt: -1 })
      .lean();
    
    if (analyses.length === 0) {
      return res.status(404).json({ error: 'No hay análisis para exportar' });
    }
    
    // Preparar datos para CSV
    const csvData = analyses.map(analysis => ({
      'ID': analysis._id,
      'Archivo': analysis.fileName,
      'Tipo': analysis.fileType,
      'Estado': analysis.status,
      'Categoría': analysis.aiAnalysis?.category || 'N/A',
      'Confianza (%)': analysis.aiAnalysis?.confidence || 0,
      'Descripción': analysis.aiAnalysis?.description || 'N/A',
      'Fecha de Subida': analysis.uploadDate || analysis.createdAt,
      'Fecha de Análisis': analysis.aiAnalysis?.processedDate || 'N/A',
      'Ubicación (Lat)': analysis.exifData?.gps?.latitude || 'N/A',
      'Ubicación (Lon)': analysis.exifData?.gps?.longitude || 'N/A',
      'Cámara': analysis.exifData?.camera?.make || 'N/A',
      'Modelo': analysis.exifData?.camera?.model || 'N/A',
      'Mejor Coincidencia': analysis.bestMatch?.category || 'N/A',
      'Porcentaje Coincidencia': analysis.bestMatch?.matchPercentage || 0
    }));
    
    // Convertir a CSV
    const parser = new Parser();
    const csv = parser.parse(csvData);
    
    // Enviar archivo
    res.header('Content-Type', 'text/csv; charset=utf-8');
    res.header('Content-Disposition', `attachment; filename="analisis-${Date.now()}.csv"`);
    res.send('\uFEFF' + csv); // BOM para Excel
    
  } catch (error) {
    console.error('Error exportando análisis:', error);
    res.status(500).json({ error: 'Error al exportar análisis' });
  }
});

// ==================== EXPORTAR REPORTES A CSV ====================
router.get('/reports/csv', auth, async (req, res) => {
  try {
    const { startDate, endDate, status } = req.query;
    
    // Construir filtro
    const filter = { userId: req.user._id };
    
    if (startDate || endDate) {
      filter.createdAt = {};
      if (startDate) filter.createdAt.$gte = new Date(startDate);
      if (endDate) filter.createdAt.$lte = new Date(endDate);
    }
    
    if (status) filter.status = status;
    
    // Obtener reportes
    const reports = await Report.find(filter)
      .populate('analysisId', 'fileName aiAnalysis')
      .sort({ createdAt: -1 })
      .lean();
    
    if (reports.length === 0) {
      return res.status(404).json({ error: 'No hay reportes para exportar' });
    }
    
    // Preparar datos para CSV
    const csvData = reports.map(report => ({
      'Número de Reporte': report.reportNumber,
      'Título': report.reportData?.title || 'N/A',
      'Archivo': report.analysisId?.fileName || 'N/A',
      'Categoría': report.analysisId?.aiAnalysis?.category || 'N/A',
      'Situación': report.reportData?.situation || 'N/A',
      'Ubicación': report.reportData?.location || 'N/A',
      'Fecha del Evento': report.reportData?.datetime || 'N/A',
      'Duración': report.reportData?.duration || 'N/A',
      'Testigos': report.reportData?.witnesses || 0,
      'Condiciones Climáticas': report.reportData?.weatherConditions || 'N/A',
      'Visibilidad': report.reportData?.visibility || 'N/A',
      'Estado': report.status,
      'Fecha de Creación': report.createdAt,
      'PDF Generado': report.pdfGeneratedDate || 'No generado'
    }));
    
    // Convertir a CSV
    const parser = new Parser();
    const csv = parser.parse(csvData);
    
    // Enviar archivo
    res.header('Content-Type', 'text/csv; charset=utf-8');
    res.header('Content-Disposition', `attachment; filename="reportes-${Date.now()}.csv"`);
    res.send('\uFEFF' + csv);
    
  } catch (error) {
    console.error('Error exportando reportes:', error);
    res.status(500).json({ error: 'Error al exportar reportes' });
  }
});

// ==================== EXPORTAR TODO (ZIP) ====================
router.get('/all/zip', auth, async (req, res) => {
  try {
    const userId = req.user._id;
    const username = req.user.username;
    
    // Crear archivo ZIP
    res.header('Content-Type', 'application/zip');
    res.header('Content-Disposition', `attachment; filename="uap-export-${username}-${Date.now()}.zip"`);
    
    const archive = archiver('zip', {
      zlib: { level: 9 }
    });
    
    archive.on('error', (err) => {
      console.error('Error creando ZIP:', err);
      res.status(500).json({ error: 'Error al crear archivo ZIP' });
    });
    
    archive.pipe(res);
    
    // 1. Exportar análisis a CSV
    const analyses = await Analysis.find({ userId }).sort({ createdAt: -1 }).lean();
    if (analyses.length > 0) {
      const analysesData = analyses.map(a => ({
        'ID': a._id,
        'Archivo': a.fileName,
        'Estado': a.status,
        'Categoría': a.aiAnalysis?.category || 'N/A',
        'Confianza': a.aiAnalysis?.confidence || 0,
        'Fecha': a.createdAt
      }));
      const parser1 = new Parser();
      const csv1 = parser1.parse(analysesData);
      archive.append('\uFEFF' + csv1, { name: 'analisis.csv' });
    }
    
    // 2. Exportar reportes a CSV
    const reports = await Report.find({ userId })
      .populate('analysisId', 'fileName')
      .sort({ createdAt: -1 })
      .lean();
    if (reports.length > 0) {
      const reportsData = reports.map(r => ({
        'Número': r.reportNumber,
        'Título': r.reportData?.title || 'N/A',
        'Archivo': r.analysisId?.fileName || 'N/A',
        'Ubicación': r.reportData?.location || 'N/A',
        'Fecha Evento': r.reportData?.datetime || 'N/A',
        'Estado': r.status,
        'Fecha Creación': r.createdAt
      }));
      const parser2 = new Parser();
      const csv2 = parser2.parse(reportsData);
      archive.append('\uFEFF' + csv2, { name: 'reportes.csv' });
    }
    
    // 3. Incluir PDFs de reportes
    for (const report of reports) {
      if (report.pdfPath && fs.existsSync(report.pdfPath)) {
        archive.file(report.pdfPath, { 
          name: `pdfs/${report.pdfFileName || path.basename(report.pdfPath)}` 
        });
      }
    }
    
    // 4. Crear archivo README
    const readme = `
UAP ANALYSIS SYSTEM - EXPORTACIÓN DE DATOS
==========================================

Usuario: ${username}
Fecha de exportación: ${new Date().toLocaleString('es-ES')}

CONTENIDO:
----------
- analisis.csv: ${analyses.length} análisis
- reportes.csv: ${reports.length} reportes
- pdfs/: PDFs de reportes generados

NOTAS:
------
Los archivos CSV están codificados en UTF-8 con BOM para compatibilidad con Excel.
Las imágenes originales no están incluidas por motivos de tamaño.

Para más información: https://www.ovniesp.com
    `;
    
    archive.append(readme, { name: 'README.txt' });
    
    // Finalizar archivo
    await archive.finalize();
    
  } catch (error) {
    console.error('Error exportando todo:', error);
    res.status(500).json({ error: 'Error al exportar datos' });
  }
});

// ==================== BACKUP DE DATOS (ADMIN ONLY) ====================
router.get('/backup', auth, async (req, res) => {
  try {
    // Verificar que es admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'No autorizado' });
    }
    
    // Crear backup completo del sistema
    res.header('Content-Type', 'application/zip');
    res.header('Content-Disposition', `attachment; filename="uap-backup-${Date.now()}.zip"`);
    
    const archive = archiver('zip', { zlib: { level: 9 } });
    archive.pipe(res);
    
    // Exportar todas las colecciones
    const users = await User.find().select('-password').lean();
    const analyses = await Analysis.find().lean();
    const reports = await Report.find().lean();
    
    archive.append(JSON.stringify(users, null, 2), { name: 'users.json' });
    archive.append(JSON.stringify(analyses, null, 2), { name: 'analyses.json' });
    archive.append(JSON.stringify(reports, null, 2), { name: 'reports.json' });
    
    // Incluir UFO Database
    const UFODatabase = require('../models/UFODatabase');
    const ufoObjects = await UFODatabase.find().lean();
    archive.append(JSON.stringify(ufoObjects, null, 2), { name: 'ufo-database.json' });
    
    // Incluir notificaciones
    const Notification = require('../models/Notification');
    const notifications = await Notification.find().lean();
    archive.append(JSON.stringify(notifications, null, 2), { name: 'notifications.json' });
    
    // Metadata del backup
    const metadata = {
      date: new Date(),
      version: '1.0.0',
      counts: {
        users: users.length,
        analyses: analyses.length,
        reports: reports.length,
        ufoObjects: ufoObjects.length,
        notifications: notifications.length
      }
    };
    archive.append(JSON.stringify(metadata, null, 2), { name: 'metadata.json' });
    
    await archive.finalize();
    
  } catch (error) {
    console.error('Error creando backup:', error);
    res.status(500).json({ error: 'Error al crear backup' });
  }
});

// ==================== HISTORIAL DE EXPORTACIONES ====================
router.get('/history', auth, async (req, res) => {
  try {
    // Por ahora retornamos las estadísticas de exportación disponibles
    const analysesCount = await Analysis.countDocuments({ userId: req.user._id });
    const reportsCount = await Report.countDocuments({ userId: req.user._id });
    
    res.json({
      available: {
        analyses: analysesCount,
        reports: reportsCount
      },
      formats: ['CSV', 'ZIP'],
      message: 'Usa los endpoints /analyses/csv, /reports/csv o /all/zip para exportar'
    });
    
  } catch (error) {
    console.error('Error obteniendo historial:', error);
    res.status(500).json({ error: 'Error del servidor' });
  }
});

module.exports = router;
