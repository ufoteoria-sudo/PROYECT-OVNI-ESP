const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Analysis = require('../models/Analysis');
const PDFService = require('../services/pdfService');

// POST /api/export/:id/generate - Generar y descargar PDF del análisis
router.post('/:id/generate', auth, async (req, res) => {
  try {
    const id = req.params.id;
    console.log(`[export] Generar PDF para analysisId=${id} solicitado por user=${req.userId}`);
    const analysis = await Analysis.findById(id).lean();
    if (!analysis) return res.status(404).json({ error: 'Análisis no encontrado.' });

    // Create PDF document stream
    const doc = PDFService.createAnalysisPdfDoc(analysis);

    // Set headers for file download
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="analysis_${id}.pdf"`);

    // Pipe PDF to response
    doc.pipe(res);
    doc.end();

  } catch (error) {
    console.error('Error generating PDF:', error);
    res.status(500).json({ error: 'Error al generar el PDF.' });
  }
});

module.exports = router;
