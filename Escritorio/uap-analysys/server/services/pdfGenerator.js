const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');

/**
 * SERVICIO DE GENERACIÓN DE INFORMES PDF
 * Genera informes profesionales en PDF para análisis de UAP/OVNI
 */

class PDFGenerator {
  constructor() {
    // Asegurar que existe el directorio de reportes
    this.reportsDir = path.join(__dirname, '..', 'reports');
    if (!fs.existsSync(this.reportsDir)) {
      fs.mkdirSync(this.reportsDir, { recursive: true });
    }
  }

  /**
   * Genera un PDF completo del informe
   * @param {Object} reportData - Datos del reporte
   * @param {Object} analysis - Análisis asociado
   * @param {Object} user - Usuario que genera el reporte
   * @returns {Promise<string>} - Ruta del archivo PDF generado
   */
  async generateReport(reportData, analysis, user) {
    return new Promise((resolve, reject) => {
      try {
        // Nombre del archivo PDF
        const fileName = `UAP-Report-${Date.now()}.pdf`;
        const filePath = path.join(this.reportsDir, fileName);

        // Crear documento PDF
        const doc = new PDFDocument({
          size: 'A4',
          margins: {
            top: 50,
            bottom: 50,
            left: 50,
            right: 50
          },
          info: {
            Title: `Informe UAP ${reportData.reportNumber || ''}`,
            Author: user.username || 'UAP Analysis System',
            Subject: 'Análisis de Fenómeno Aéreo No Identificado',
            Keywords: 'UAP, OVNI, UFO, Análisis',
            CreationDate: new Date()
          }
        });

        // Stream al archivo
        const stream = fs.createWriteStream(filePath);
        doc.pipe(stream);

        // CONTENIDO DEL PDF
        this._addHeader(doc, reportData);
        this._addSeparator(doc);
        this._addReportInfo(doc, reportData);
        this._addSeparator(doc);
        this._addSightingDetails(doc, reportData);
        this._addSeparator(doc);
        this._addAnalysisResults(doc, analysis);
        this._addSeparator(doc);
        this._addExifData(doc, analysis);
        this._addSeparator(doc);
        this._addAIAnalysis(doc, analysis);
        this._addSeparator(doc);
        this._addConclusions(doc, analysis, reportData);
        this._addFooter(doc);

        // Finalizar documento
        doc.end();

        // Esperar a que termine de escribirse
        stream.on('finish', () => {
          resolve(filePath);
        });

        stream.on('error', (error) => {
          reject(error);
        });

      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * Añade el encabezado del documento
   */
  _addHeader(doc, reportData) {
    // Título principal
    doc
      .fontSize(24)
      .font('Helvetica-Bold')
      .fillColor('#1a365d')
      .text('INFORME DE ANÁLISIS UAP', { align: 'center' });

    doc.moveDown(0.5);

    // Subtítulo
    doc
      .fontSize(16)
      .font('Helvetica')
      .fillColor('#2d3748')
      .text('Sistema de Análisis de Fenómenos Aéreos No Identificados', { align: 'center' });

    doc.moveDown(0.5);

    // Número de reporte
    if (reportData.reportNumber) {
      doc
        .fontSize(12)
        .font('Helvetica-Bold')
        .fillColor('#4a5568')
        .text(`Nº de Informe: ${reportData.reportNumber}`, { align: 'center' });
    }

    doc.moveDown(1);
  }

  /**
   * Añade información básica del reporte
   */
  _addReportInfo(doc, reportData) {
    doc
      .fontSize(14)
      .font('Helvetica-Bold')
      .fillColor('#1a365d')
      .text('INFORMACIÓN DEL REPORTE', { underline: true });

    doc.moveDown(0.5);

    const info = [
      ['Fecha de generación', new Date().toLocaleString('es-ES', { dateStyle: 'full', timeStyle: 'short' })],
      ['Estado', this._translateStatus(reportData.status)],
      ['Versión', reportData.version || '1']
    ];

    doc.fontSize(11).font('Helvetica').fillColor('#2d3748');

    info.forEach(([label, value]) => {
      doc
        .font('Helvetica-Bold')
        .text(`${label}: `, { continued: true })
        .font('Helvetica')
        .text(value || 'N/A');
      doc.moveDown(0.3);
    });

    doc.moveDown(0.5);
  }

  /**
   * Añade detalles del avistamiento
   */
  _addSightingDetails(doc, reportData) {
    doc
      .fontSize(14)
      .font('Helvetica-Bold')
      .fillColor('#1a365d')
      .text('DETALLES DEL AVISTAMIENTO', { underline: true });

    doc.moveDown(0.5);

    // Fecha y ubicación
    doc.fontSize(11).font('Helvetica').fillColor('#2d3748');

    const details = [
      ['Fecha y hora del avistamiento', reportData.reportData?.datetime ? new Date(reportData.reportData.datetime).toLocaleString('es-ES', { dateStyle: 'full', timeStyle: 'short' }) : 'N/A'],
      ['Ubicación', reportData.reportData?.location || 'N/A'],
      ['Número de testigos', reportData.reportData?.witnesses || '1'],
      ['Duración', reportData.reportData?.duration || 'No especificada'],
      ['Condiciones climáticas', reportData.reportData?.weatherConditions || 'No especificadas'],
      ['Visibilidad', reportData.reportData?.visibility || 'No especificada']
    ];

    details.forEach(([label, value]) => {
      doc
        .font('Helvetica-Bold')
        .text(`${label}: `, { continued: true })
        .font('Helvetica')
        .text(value);
      doc.moveDown(0.3);
    });

    doc.moveDown(0.5);

    // Descripción de la situación
    if (reportData.reportData?.situation) {
      doc
        .font('Helvetica-Bold')
        .text('Descripción del fenómeno:');
      doc.moveDown(0.3);
      doc
        .font('Helvetica')
        .text(reportData.reportData.situation, { align: 'justify' });
      doc.moveDown(0.5);
    }

    // Notas adicionales
    if (reportData.reportData?.additionalNotes) {
      doc
        .font('Helvetica-Bold')
        .text('Notas adicionales:');
      doc.moveDown(0.3);
      doc
        .font('Helvetica')
        .text(reportData.reportData.additionalNotes, { align: 'justify' });
      doc.moveDown(0.5);
    }
  }

  /**
   * Añade resultados del análisis
   */
  _addAnalysisResults(doc, analysis) {
    doc
      .fontSize(14)
      .font('Helvetica-Bold')
      .fillColor('#1a365d')
      .text('ANÁLISIS TÉCNICO', { underline: true });

    doc.moveDown(0.5);

    doc.fontSize(11).font('Helvetica').fillColor('#2d3748');

    const info = [
      ['Archivo analizado', analysis.fileName || 'N/A'],
      ['Tipo de archivo', analysis.fileType === 'image' ? 'Imagen' : analysis.fileType === 'video' ? 'Video' : 'Desconocido'],
      ['Tamaño', analysis.fileSize ? `${(analysis.fileSize / 1024).toFixed(2)} KB` : 'N/A'],
      ['Fecha de análisis', analysis.uploadDate ? new Date(analysis.uploadDate).toLocaleString('es-ES') : 'N/A'],
      ['Estado del análisis', this._translateStatus(analysis.status)]
    ];

    info.forEach(([label, value]) => {
      doc
        .font('Helvetica-Bold')
        .text(`${label}: `, { continued: true })
        .font('Helvetica')
        .text(value);
      doc.moveDown(0.3);
    });

    doc.moveDown(0.5);
  }

  /**
   * Añade datos EXIF
   */
  _addExifData(doc, analysis) {
    doc
      .fontSize(14)
      .font('Helvetica-Bold')
      .fillColor('#1a365d')
      .text('DATOS EXIF / METADATOS', { underline: true });

    doc.moveDown(0.5);

    const exif = analysis.exifData || {};

    if (!exif || Object.keys(exif).length === 0) {
      doc
        .fontSize(11)
        .font('Helvetica-Oblique')
        .fillColor('#718096')
        .text('No se encontraron datos EXIF en el archivo.');
      doc.moveDown(0.5);
      return;
    }

    doc.fontSize(11).font('Helvetica').fillColor('#2d3748');

    // Datos principales
    const exifData = [
      ['Cámara', exif.camera || 'N/A'],
      ['Modelo', exif.cameraModel || 'N/A'],
      ['Fecha de captura', exif.captureDate ? new Date(exif.captureDate).toLocaleString('es-ES') : 'N/A'],
      ['Ubicación GPS', exif.location ? `${exif.location.latitude}, ${exif.location.longitude}` : 'N/A'],
      ['Altitud', exif.location?.altitude ? `${exif.location.altitude}m` : 'N/A'],
      ['ISO', exif.iso || 'N/A'],
      ['Apertura', exif.aperture || 'N/A'],
      ['Velocidad de obturación', exif.shutterSpeed || 'N/A'],
      ['Distancia focal', exif.focalLength || 'N/A']
    ];

    exifData.forEach(([label, value]) => {
      doc
        .font('Helvetica-Bold')
        .text(`${label}: `, { continued: true })
        .font('Helvetica')
        .text(value);
      doc.moveDown(0.3);
    });

    doc.moveDown(0.3);

    // Análisis de manipulación
    if (exif.isManipulated !== undefined) {
      doc
        .font('Helvetica-Bold')
        .fillColor(exif.isManipulated ? '#c53030' : '#38a169')
        .text('Estado de manipulación: ', { continued: true })
        .font('Helvetica')
        .text(exif.isManipulated ? 'DETECTADA' : 'NO DETECTADA');
      doc.moveDown(0.3);

      if (exif.manipulationScore) {
        doc
          .fillColor('#2d3748')
          .font('Helvetica-Bold')
          .text('Puntuación de autenticidad: ', { continued: true })
          .font('Helvetica')
          .text(`${exif.manipulationScore}/100`);
        doc.moveDown(0.3);
      }

      if (exif.manipulationDetails) {
        doc
          .font('Helvetica-Bold')
          .text('Detalles: ', { continued: true })
          .font('Helvetica')
          .text(exif.manipulationDetails);
        doc.moveDown(0.3);
      }
    }

    doc.moveDown(0.5);
  }

  /**
   * Añade análisis de IA
   */
  _addAIAnalysis(doc, analysis) {
    // Nueva página para mejor legibilidad
    doc.addPage();

    doc
      .fontSize(14)
      .font('Helvetica-Bold')
      .fillColor('#1a365d')
      .text('ANÁLISIS DE INTELIGENCIA ARTIFICIAL', { underline: true });

    doc.moveDown(0.5);

    const ai = analysis.aiAnalysis || {};

    if (!ai || !ai.description) {
      doc
        .fontSize(11)
        .font('Helvetica-Oblique')
        .fillColor('#718096')
        .text('No se realizó análisis de IA.');
      doc.moveDown(0.5);
      return;
    }

    doc.fontSize(11).font('Helvetica').fillColor('#2d3748');

    // Información del modelo
    const aiInfo = [
      ['Proveedor', ai.provider || 'N/A'],
      ['Modelo', ai.model || 'N/A'],
      ['Categoría detectada', this._translateCategory(ai.category)],
      ['Confianza', ai.confidence ? `${ai.confidence}%` : 'N/A'],
      ['Fecha de procesamiento', ai.processedDate ? new Date(ai.processedDate).toLocaleString('es-ES') : 'N/A']
    ];

    aiInfo.forEach(([label, value]) => {
      doc
        .font('Helvetica-Bold')
        .text(`${label}: `, { continued: true })
        .font('Helvetica')
        .text(value);
      doc.moveDown(0.3);
    });

    doc.moveDown(0.5);

    // Descripción del análisis
    if (ai.description) {
      doc
        .font('Helvetica-Bold')
        .text('Descripción del análisis:');
      doc.moveDown(0.3);
      doc
        .font('Helvetica')
        .text(ai.description, { align: 'justify' });
      doc.moveDown(0.5);
    }

    // Objetos detectados
    if (ai.detectedObjects && ai.detectedObjects.length > 0) {
      doc
        .font('Helvetica-Bold')
        .text('Objetos detectados:');
      doc.moveDown(0.3);
      
      ai.detectedObjects.forEach((obj, index) => {
        doc
          .font('Helvetica')
          .text(`${index + 1}. ${obj}`);
        doc.moveDown(0.2);
      });
      doc.moveDown(0.5);
    }

    // Características inusuales
    if (ai.unusualFeatures && ai.unusualFeatures.length > 0) {
      doc
        .font('Helvetica-Bold')
        .fillColor('#c53030')
        .text('Características inusuales detectadas:');
      doc.moveDown(0.3);
      
      ai.unusualFeatures.forEach((feature, index) => {
        doc
          .fillColor('#2d3748')
          .font('Helvetica')
          .text(`• ${feature}`);
        doc.moveDown(0.2);
      });
      doc.moveDown(0.5);
    }

    // Recomendaciones
    if (ai.recommendations && ai.recommendations.length > 0) {
      doc
        .fillColor('#1a365d')
        .font('Helvetica-Bold')
        .text('Recomendaciones:');
      doc.moveDown(0.3);
      
      ai.recommendations.forEach((rec, index) => {
        doc
          .fillColor('#2d3748')
          .font('Helvetica')
          .text(`${index + 1}. ${rec}`);
        doc.moveDown(0.2);
      });
      doc.moveDown(0.5);
    }
  }

  /**
   * Añade conclusiones
   */
  _addConclusions(doc, analysis, reportData) {
    doc
      .fontSize(14)
      .font('Helvetica-Bold')
      .fillColor('#1a365d')
      .text('CONCLUSIONES', { underline: true });

    doc.moveDown(0.5);

    doc.fontSize(11).font('Helvetica').fillColor('#2d3748');

    // Generar conclusión basada en los datos
    let conclusion = 'Basándose en el análisis técnico realizado, ';

    const ai = analysis.aiAnalysis || {};
    const exif = analysis.exifData || {};

    if (ai.confidence >= 70) {
      conclusion += `se ha identificado con alta confianza (${ai.confidence}%) que el fenómeno corresponde a ${this._translateCategory(ai.category)}. `;
    } else if (ai.confidence >= 40) {
      conclusion += `se sugiere con confianza moderada (${ai.confidence}%) que el fenómeno podría corresponder a ${this._translateCategory(ai.category)}. `;
    } else {
      conclusion += `el análisis no pudo determinar con certeza la naturaleza del fenómeno observado. `;
    }

    if (exif.isManipulated) {
      conclusion += 'Se detectaron indicios de manipulación en los metadatos de la imagen, lo que puede afectar la autenticidad del registro. ';
    } else if (exif.camera) {
      conclusion += 'Los metadatos de la imagen no muestran signos de manipulación evidente. ';
    }

    conclusion += '\n\nEste informe ha sido generado automáticamente por el Sistema de Análisis UAP y debe ser considerado como una herramienta de apoyo para la investigación. Se recomienda complementar este análisis con investigación de campo adicional.';

    doc.text(conclusion, { align: 'justify' });
    doc.moveDown(1);
  }

  /**
   * Añade pie de página
   */
  _addFooter(doc) {
    const bottomMargin = 50;
    const pageHeight = doc.page.height;

    doc
      .fontSize(9)
      .font('Helvetica-Oblique')
      .fillColor('#a0aec0')
      .text(
        'Este documento ha sido generado por el Sistema de Análisis UAP - Confidencial',
        50,
        pageHeight - bottomMargin,
        { align: 'center' }
      );
  }

  /**
   * Añade separador visual
   */
  _addSeparator(doc) {
    doc
      .moveTo(50, doc.y)
      .lineTo(doc.page.width - 50, doc.y)
      .strokeColor('#e2e8f0')
      .lineWidth(1)
      .stroke();
    doc.moveDown(1);
  }

  /**
   * Traduce el estado del reporte/análisis
   */
  _translateStatus(status) {
    const translations = {
      'draft': 'Borrador',
      'generating': 'Generando',
      'generated': 'Generado',
      'sent': 'Enviado',
      'error': 'Error',
      'pending': 'Pendiente',
      'analyzing': 'Analizando',
      'completed': 'Completado'
    };
    return translations[status] || status;
  }

  /**
   * Traduce la categoría detectada
   */
  _translateCategory(category) {
    const translations = {
      'celestial': 'Objeto Celeste',
      'aircraft': 'Aeronave Convencional',
      'satellite': 'Satélite Artificial',
      'drone': 'Drone Comercial',
      'balloon': 'Globo Meteorológico',
      'natural': 'Fenómeno Natural',
      'bird': 'Ave',
      'insect': 'Insecto',
      'uap': 'UAP/Fenómeno No Identificado',
      'unknown': 'Desconocido',
      'artifact': 'Artefacto en la Imagen'
    };
    return translations[category] || category;
  }
}

module.exports = new PDFGenerator();
