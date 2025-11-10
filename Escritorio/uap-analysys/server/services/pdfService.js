const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');
const moment = require('moment');

class PDFService {
  /**
   * Filtrar objeto eliminando propiedades null, undefined y vacías
   */
  static cleanObject(obj, depth = 0, maxArrayLength = 5) {
    if (depth > 3) return obj; // Evitar recursión infinita
    
    if (Array.isArray(obj)) {
      const cleaned = obj.filter(item => item != null);
      // Limitar tamaño de arrays grandes (solo 5 primeros elementos)
      const limited = cleaned.slice(0, maxArrayLength);
      if (limited.length > 0) {
        if (cleaned.length > maxArrayLength) {
          limited.push({ _truncated: `(+${cleaned.length - maxArrayLength} elementos mas)` });
        }
        return limited;
      }
      return null;
    }
    
    if (typeof obj !== 'object' || obj === null) {
      return obj;
    }
    
    // Campos a excluir por ser muy largos o innecesarios
    const excludeFields = [
      'rawTags', 
      'rawResponse', 
      '_id', 
      '__v', 
      'id',
      'details', // Excluir arrays de detalles muy largos
      'histogramR', // Histogramas muy largos
      'histogramG',
      'histogramB'
    ];
    
    const cleaned = {};
    for (const [key, value] of Object.entries(obj)) {
      // Saltar campos excluidos
      if (excludeFields.includes(key)) continue;
      
      // Saltar campos vacíos
      if (value == null) continue;
      if (typeof value === 'string' && value.trim() === '') continue;
      if (Array.isArray(value) && value.length === 0) continue;
      if (typeof value === 'object' && Object.keys(value).length === 0) continue;
      
      // Limpiar recursivamente si es objeto
      if (typeof value === 'object') {
        const cleanedValue = this.cleanObject(value, depth + 1, maxArrayLength);
        if (cleanedValue != null && Object.keys(cleanedValue).length > 0) {
          cleaned[key] = cleanedValue;
        }
      } else {
        cleaned[key] = value;
      }
    }
    
    return Object.keys(cleaned).length > 0 ? cleaned : null;
  }

  /**
   * Formatear valor para mostrar en PDF
   */
  static formatValue(value) {
    if (value === null || value === undefined) return 'N/A';
    if (typeof value === 'boolean') return value ? 'Si' : 'No';
    if (typeof value === 'number') {
      // Si es entero, no mostrar decimales
      if (Number.isInteger(value)) return value.toString();
      // Si es decimal, limitar a 2 decimales
      return value.toFixed(2);
    }
    if (typeof value === 'object') return JSON.stringify(value, null, 2);
    // Convertir a string y eliminar caracteres problemáticos
    return String(value)
      .replace(/[^\x00-\x7F]/g, '') // Eliminar caracteres no ASCII
      .trim();
  }

  /**
   * Create a PDFDocument for an analysis and return the doc instance (readable stream).
   * Caller should pipe the returned doc to the response and call doc.end().
   * @param {Object} analysis Mongoose Analysis document
   * @returns {PDFDocument}
   */
  static createAnalysisPdfDoc(analysis) {
    const doc = new PDFDocument({ 
      autoFirstPage: false, 
      bufferPages: true,
      margins: { top: 60, bottom: 60, left: 70, right: 70 }
    });

    // Add first page
    doc.addPage({ size: 'A4', margin: 70 });

    // === HEADER SECTION CON DISEÑO MEJORADO ===
    const pageWidth = doc.page.width;
    
    // Barra superior decorativa con gradiente
    const headerY = 50;
    doc.rect(0, headerY, pageWidth, 80)
       .fillAndStroke('#0d47a1', '#0d47a1');
    
    // Título principal en blanco sobre fondo azul
    doc.fontSize(26)
       .font('Helvetica-Bold')
       .fillColor('#ffffff')
       .text('INFORME DE ANÁLISIS UAP', 70, headerY + 25);
    
    doc.fontSize(11)
       .font('Helvetica')
       .fillColor('#e3f2fd')
       .text('Sistema de Análisis e Identificación de Fenómenos Aéreos', 70, headerY + 55);
    
    doc.y = headerY + 95;

    doc.y = headerY + 95;

    // === METADATA SECTION CON DISEÑO DE TABLA ===
    doc.moveDown(1.5);
    
    // Recuadro con sombreado para metadatos
    const metaBoxY = doc.y;
    const metaBoxHeight = 75;
    
    doc.roundedRect(70, metaBoxY, pageWidth - 140, metaBoxHeight, 8)
       .fillAndStroke('#f5f5f5', '#cccccc');
    
    // Limpiar nombre de archivo de caracteres especiales
    const cleanFileName = (analysis.fileName || 'Sin nombre')
      .replace(/[^\x00-\x7F]/g, '');
    
    const leftCol = 85;
    const rightCol = pageWidth / 2 + 30;
    const labelWidth = 100;
    let currentY = metaBoxY + 15;
    
    // Columna izquierda
    doc.fontSize(9)
       .font('Helvetica-Bold')
       .fillColor('#555555')
       .text('ARCHIVO:', leftCol, currentY);
    doc.fontSize(10)
       .font('Helvetica')
       .fillColor('#1a1a1a')
       .text(cleanFileName, leftCol, currentY + 13, { width: rightCol - leftCol - 30 });
    
    doc.fontSize(9)
       .font('Helvetica-Bold')
       .fillColor('#555555')
       .text('FECHA:', leftCol, currentY + 38);
    doc.fontSize(10)
       .font('Helvetica')
       .fillColor('#1a1a1a')
       .text(moment(analysis.uploadDate).format('DD/MM/YYYY HH:mm'), leftCol, currentY + 51);
    
    // Columna derecha
    doc.fontSize(9)
       .font('Helvetica-Bold')
       .fillColor('#555555')
       .text('ID ANÁLISIS:', rightCol, currentY);
    doc.fontSize(10)
       .font('Helvetica')
       .fillColor('#1a1a1a')
       .text(String(analysis._id).substring(0, 12) + '...', rightCol, currentY + 13);
    
    doc.fontSize(9)
       .font('Helvetica-Bold')
       .fillColor('#555555')
       .text('ESTADO:', rightCol, currentY + 38);
    doc.fontSize(10)
       .font('Helvetica-Bold')
       .fillColor('#28a745')
       .text(analysis.status === 'completed' ? 'COMPLETADO' : analysis.status.toUpperCase(), rightCol, currentY + 51);
    
    doc.y = metaBoxY + metaBoxHeight + 20;

    doc.y = metaBoxY + metaBoxHeight + 20;

    // === RESUMEN EJECUTIVO CON DISEÑO MEJORADO ===
    doc.moveDown(1);
    
    // Título de sección con barra lateral
    const titleY = doc.y;
    doc.rect(70, titleY, 4, 20)
       .fillAndStroke('#0d47a1', '#0d47a1');
    
    doc.fontSize(16)
       .font('Helvetica-Bold')
       .fillColor('#0d47a1')
       .text('RESUMEN EJECUTIVO', 85, titleY + 2);
    
    doc.moveDown(1.2);

    const category = analysis.aiAnalysis?.category || analysis.bestMatch?.category || 'Desconocido';
    const confidence = analysis.aiAnalysis?.confidence ?? analysis.bestMatch?.matchPercentage ?? 0;
    
    // Caja de resultados principales con diseño más limpio
    const boxY = doc.y;
    const boxHeight = 80;
    
    // Fondo con sombra sutil
    doc.roundedRect(72, boxY + 2, pageWidth - 144, boxHeight, 10)
       .fillAndStroke('#e8e8e8', '#e8e8e8');
    
    doc.roundedRect(70, boxY, pageWidth - 140, boxHeight, 10)
       .fillAndStroke('#ffffff', '#0d47a1');
    
    // Contenido de la caja
    const boxPadding = 20;
    let boxContentY = boxY + boxPadding;
    
    // Categoría
    doc.fontSize(11)
       .font('Helvetica')
       .fillColor('#666666')
       .text('CATEGORÍA IDENTIFICADA', 85, boxContentY);
    
    doc.fontSize(16)
       .font('Helvetica-Bold')
       .fillColor('#0d47a1')
       .text(category.toUpperCase().replace(/_/g, ' '), 85, boxContentY + 18);
    
    // Línea divisoria vertical
    const dividerX = pageWidth / 2;
    doc.moveTo(dividerX, boxY + 15)
       .lineTo(dividerX, boxY + boxHeight - 15)
       .strokeColor('#e0e0e0')
       .lineWidth(1)
       .stroke();
    
    // Confianza con barra de progreso
    doc.fontSize(11)
       .font('Helvetica')
       .fillColor('#666666')
       .text('NIVEL DE CONFIANZA', dividerX + 15, boxContentY);
    
    const confidenceColor = confidence >= 80 ? '#28a745' : confidence >= 50 ? '#ffc107' : '#dc3545';
    doc.fontSize(18)
       .font('Helvetica-Bold')
       .fillColor(confidenceColor)
       .text(`${confidence.toFixed(1)}%`, dividerX + 15, boxContentY + 18);
    
    // Mini barra de progreso
    const barWidth = 120;
    const barY = boxContentY + 48;
    doc.roundedRect(dividerX + 15, barY, barWidth, 8, 4)
       .fillAndStroke('#e0e0e0', '#e0e0e0');
    
    doc.roundedRect(dividerX + 15, barY, (barWidth * confidence) / 100, 8, 4)
       .fillAndStroke(confidenceColor, confidenceColor);
    
    doc.y = boxY + boxHeight + 15;
    doc.moveDown(0.8);

    // Descripción de IA con diseño mejorado
    if (analysis.aiAnalysis?.description) {
      // Recuadro para la descripción
      const descBoxY = doc.y;
      doc.roundedRect(70, descBoxY, pageWidth - 140, 0, 5); // Auto-altura
      
      doc.fontSize(10)
         .font('Helvetica-Bold')
         .fillColor('#0d47a1')
         .text('Descripción del Análisis', 85, descBoxY + 15);
      
      doc.moveDown(0.5);
      
      doc.fontSize(10)
         .font('Helvetica')
         .fillColor('#333333')
         .text(analysis.aiAnalysis.description, 85, doc.y, { 
           align: 'justify',
           lineGap: 4,
           width: pageWidth - 170
         });
      
      doc.moveDown(0.5);
    }

    doc.addPage();

    // === DETALLE POR CAPAS CON DISEÑO MEJORADO ===
    const detailHeaderY = 70;
    
    // Barra de título para sección de capas
    doc.rect(70, detailHeaderY, 4, 20)
       .fillAndStroke('#0d47a1', '#0d47a1');
    
    doc.fontSize(16)
       .font('Helvetica-Bold')
       .fillColor('#0d47a1')
       .text('ANÁLISIS DETALLADO POR CAPAS', 85, detailHeaderY + 2);
    
    doc.moveDown(1.5);

    // Preparar datos de capas con limpieza
    const layers = [
      { n: 1, name: 'Metadatos EXIF', data: this.cleanObject(analysis.exifData) },
      { n: 2, name: 'Analisis Visual IA', data: this.cleanObject(analysis.aiAnalysis) },
      { n: 3, name: 'Analisis Visual Avanzado', data: this.cleanObject(analysis.visualAnalysis) },
      { n: 4, name: 'Analisis Forense', data: this.cleanObject(analysis.forensicAnalysis) },
      { n: 5, name: 'Validacion Externa', data: this.cleanObject(analysis.externalValidation) },
      { n: 6, name: 'Datos Meteorologicos', data: this.cleanObject(analysis.weatherData) },
      { n: 7, name: 'Comparacion Atmosferica', data: this.cleanObject(analysis.atmosphericComparison) },
      { n: 8, name: 'Mejora por Training', data: this.cleanObject(analysis.trainingEnhancement) },
      { n: 9, name: 'Confianza Ponderada', data: this.cleanObject(analysis.confidenceBreakdown) }
    ];

    layers.forEach((layer, index) => {
      // Nueva página si no hay espacio suficiente
      if (doc.y > doc.page.height - 200) {
        doc.addPage();
      }

      // Saltar capas sin datos con diseño minimalista
      if (!layer.data || Object.keys(layer.data).length === 0) {
        const headerY = doc.y;
        
        // Caja gris para capa sin datos
        doc.roundedRect(70, headerY, pageWidth - 140, 45, 6)
           .fillAndStroke('#fafafa', '#e0e0e0');
        
        // Número de capa en círculo
        doc.circle(90, headerY + 22, 14)
           .fillAndStroke('#bdbdbd', '#bdbdbd');
        
        doc.fontSize(11)
           .font('Helvetica-Bold')
           .fillColor('#ffffff')
           .text(layer.n.toString(), 85, headerY + 15, { width: 10, align: 'center' });
        
        doc.fontSize(11)
           .font('Helvetica-Bold')
           .fillColor('#757575')
           .text(layer.name.toUpperCase(), 115, headerY + 12);
        
        doc.fontSize(9)
           .font('Helvetica-Oblique')
           .fillColor('#9e9e9e')
           .text('Sin datos disponibles', 115, headerY + 28);
        
        doc.y = headerY + 55;
        return;
      }

      // Caja de encabezado de capa con datos - Diseño mejorado
      const headerY = doc.y;
      
      // Sombra sutil
      doc.roundedRect(72, headerY + 2, pageWidth - 144, 42, 6)
         .fillAndStroke('#e0e0e0', '#e0e0e0');
      
      // Caja principal
      doc.roundedRect(70, headerY, pageWidth - 140, 42, 6)
         .fillAndStroke('#ffffff', '#0d47a1');
      
      // Número de capa en círculo azul
      doc.circle(90, headerY + 21, 15)
         .fillAndStroke('#0d47a1', '#0d47a1');
      
      doc.fontSize(12)
         .font('Helvetica-Bold')
         .fillColor('#ffffff')
         .text(layer.n.toString(), 83, headerY + 13, { width: 14, align: 'center' });
      
      // Nombre de la capa
      doc.fontSize(11)
         .font('Helvetica-Bold')
         .fillColor('#0d47a1')
         .text(layer.name.toUpperCase(), 115, headerY + 15);
      
      doc.y = headerY + 50;
      
      // Renderizar datos con espaciado mejorado
      this.renderObjectData(doc, layer.data, 85, pageWidth);
      
      doc.moveDown(1.2);
    });

    // Footer profesional con línea decorativa
    const range = doc.bufferedPageRange();
    for (let i = 0; i < range.count; i++) {
      doc.switchToPage(i);
      const bottom = doc.page.height - 50;
      
      // Línea decorativa superior del footer
      doc.moveTo(70, bottom - 15)
         .lineTo(pageWidth - 70, bottom - 15)
         .strokeColor('#0d47a1')
         .lineWidth(1.5)
         .stroke();
      
      // Información del footer
      doc.fontSize(8)
         .font('Helvetica')
         .fillColor('#757575')
         .text(`Generado el ${moment().format('DD/MM/YYYY')} a las ${moment().format('HH:mm')}`, 70, bottom, { align: 'left' });
      
      doc.fontSize(8)
         .font('Helvetica-Bold')
         .fillColor('#0d47a1')
         .text(`Página ${i + 1} de ${range.count}`, 70, bottom, { align: 'right' });
    }

    return doc;
  }

  /**
   * Renderizar objeto de datos en el PDF de manera legible
   */
  static renderObjectData(doc, obj, indent = 70, pageWidth = null) {
    if (!pageWidth) pageWidth = doc.page.width;
    
    for (const [key, value] of Object.entries(obj)) {
      // Si cerca del final de página, agregar nueva página
      if (doc.y > doc.page.height - 120) {
        doc.addPage();
      }

      // Formatear nombre de clave (de camelCase a Title Case)
      const formattedKey = key
        .replace(/([A-Z])/g, ' $1')
        .replace(/^./, str => str.toUpperCase())
        .trim()
        .replace(/[^\x00-\x7F]/g, '');

      if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
        // Es un objeto anidado
        doc.fontSize(10)
           .font('Helvetica-Bold')
           .fillColor('#0d47a1')
           .text(`${formattedKey}:`, indent, doc.y);
        doc.moveDown(0.3);
        this.renderObjectData(doc, value, indent + 15, pageWidth);
      } else if (Array.isArray(value)) {
        // Es un array
        doc.fontSize(10)
           .font('Helvetica-Bold')
           .fillColor('#0d47a1')
           .text(`${formattedKey}:`, indent, doc.y);
        doc.moveDown(0.3);
        
        const hasOnlySimpleValues = value.every(item => 
          typeof item !== 'object' || item._truncated
        );
        
        if (hasOnlySimpleValues && value.length <= 5) {
          const joinedValues = value
            .filter(item => !item._truncated)
            .map(item => this.formatValue(item))
            .join(', ');
          doc.fontSize(9)
             .font('Helvetica')
             .fillColor('#424242')
             .text(joinedValues, indent + 15, doc.y, { 
               width: pageWidth - indent - 100,
               lineGap: 2
             });
          doc.moveDown(0.4);
        } else {
          value.forEach((item, idx) => {
            if (typeof item === 'object' && item._truncated) {
              doc.fontSize(8)
                 .font('Helvetica-Oblique')
                 .fillColor('#9e9e9e')
                 .text(item._truncated, indent + 15, doc.y);
              doc.moveDown(0.3);
            } else if (typeof item === 'object') {
              if (idx < 3) {
                doc.fontSize(9)
                   .font('Helvetica')
                   .fillColor('#757575')
                   .text(`[${idx + 1}]`, indent + 10, doc.y);
                this.renderObjectData(doc, item, indent + 20, pageWidth);
              }
            } else {
              doc.fontSize(9)
                 .font('Helvetica')
                 .fillColor('#424242')
                 .text(`•  ${this.formatValue(item)}`, indent + 15, doc.y);
              doc.moveDown(0.2);
            }
          });
        }
      } else {
        // Valor simple - Formato mejorado
        const displayValue = this.formatValue(value);
        
        doc.fontSize(9)
           .font('Helvetica-Bold')
           .fillColor('#616161')
           .text(`${formattedKey}:`, indent, doc.y, { continued: true, width: 150 });
        
        doc.fontSize(9)
           .font('Helvetica')
           .fillColor('#212121')
           .text(` ${displayValue}`, { 
             continued: false, 
             width: pageWidth - indent - 100,
             lineGap: 2
           });
        
        doc.moveDown(0.3);
      }
    }
  }
}

module.exports = PDFService;
