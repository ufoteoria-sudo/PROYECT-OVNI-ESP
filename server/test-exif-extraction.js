const exifService = require('./services/exifService');
const path = require('path');

/**
 * Script de prueba para verificar la extracción EXIF expandida
 */
async function testExifExtraction() {
  console.log('🔍 TEST: EXTRACCIÓN EXIF EXPANDIDA (ESTILO EXIFTOOL)');
  console.log('='.repeat(70));
  
  // Buscar una imagen real con EXIF
  const imagePath = 'uploads/images/1762632253094-690f6933ff531e26cd48599a-IMG_4549.JPG';
  
  console.log(`\n📸 Analizando: ${imagePath}\n`);
  
  try {
    const result = await exifService.extractExifData(imagePath);
    
    if (!result.success) {
      console.log('❌ ERROR:', result.error);
      return;
    }
    
    const exif = result.data;
    
    // Mostrar datos organizados
    console.log('📷 INFORMACIÓN DE LA CÁMARA');
    console.log('-'.repeat(70));
    console.log(`Marca:               ${exif.camera || 'N/A'}`);
    console.log(`Modelo:              ${exif.cameraModel || 'N/A'}`);
    console.log(`Serial:              ${exif.cameraSerialNumber || 'N/A'}`);
    console.log(`Firmware:            ${exif.firmware || 'N/A'}`);
    console.log(`Lente:               ${exif.lens || 'N/A'}`);
    console.log(`Lente Marca:         ${exif.lensMake || 'N/A'}`);
    console.log(`Lente Serial:        ${exif.lensSerialNumber || 'N/A'}`);
    
    console.log('\n⚙️ CONFIGURACIÓN DE CAPTURA (TRIÁNGULO DE EXPOSICIÓN)');
    console.log('-'.repeat(70));
    console.log(`ISO:                 ${exif.iso || 'N/A'}`);
    console.log(`Apertura:            ${exif.aperture || 'N/A'} (valor: ${exif.apertureValue || 'N/A'})`);
    console.log(`Obturador:           ${exif.shutterSpeed || 'N/A'} (${exif.exposureTime || 'N/A'}s)`);
    console.log(`Focal:               ${exif.focalLength || 'N/A'}`);
    console.log(`Focal 35mm equiv:    ${exif.focalLengthIn35mm ? exif.focalLengthIn35mm + 'mm' : 'N/A'}`);
    console.log(`Modo exposición:     ${exif.exposureMode || 'N/A'}`);
    console.log(`Programa:            ${exif.exposureProgram || 'N/A'}`);
    console.log(`Compensación EV:     ${exif.exposureBias !== null ? exif.exposureBias : 'N/A'}`);
    console.log(`Medición:            ${exif.meteringMode || 'N/A'}`);
    
    console.log('\n⚡ FLASH');
    console.log('-'.repeat(70));
    console.log(`Usado:               ${exif.flash !== null ? (exif.flash ? 'SÍ' : 'NO') : 'N/A'}`);
    console.log(`Disparado:           ${exif.flashFired !== null ? (exif.flashFired ? 'SÍ' : 'NO') : 'N/A'}`);
    console.log(`Modo:                ${exif.flashMode || 'N/A'}`);
    console.log(`Energía:             ${exif.flashEnergy || 'N/A'}`);
    
    console.log('\n🎨 AJUSTES DE IMAGEN');
    console.log('-'.repeat(70));
    console.log(`Balance blancos:     ${exif.whiteBalance || 'N/A'}`);
    console.log(`Espacio color:       ${exif.colorSpace || 'N/A'}`);
    console.log(`Saturación:          ${exif.saturation || 'N/A'}`);
    console.log(`Nitidez:             ${exif.sharpness || 'N/A'}`);
    console.log(`Contraste:           ${exif.contrast || 'N/A'}`);
    console.log(`Brillo:              ${exif.brightness !== null ? exif.brightness : 'N/A'}`);
    
    console.log('\n🎯 ENFOQUE');
    console.log('-'.repeat(70));
    console.log(`Modo enfoque:        ${exif.focusMode || 'N/A'}`);
    console.log(`Distancia:           ${exif.focusDistance ? exif.focusDistance + 'm' : 'N/A'}`);
    console.log(`Punto AF:            ${exif.focusPoint || 'N/A'}`);
    console.log(`Área AF:             ${exif.afAreaMode || 'N/A'}`);
    
    console.log('\n📅 FECHA Y HORA');
    console.log('-'.repeat(70));
    if (exif.captureDate) {
      console.log(`Captura original:    ${new Date(exif.captureDate).toLocaleString('es-ES')}`);
    }
    if (exif.dateTime) {
      console.log(`Última modificación: ${new Date(exif.dateTime).toLocaleString('es-ES')}`);
    }
    if (exif.dateTimeDigitized) {
      console.log(`Digitalizada:        ${new Date(exif.dateTimeDigitized).toLocaleString('es-ES')}`);
    }
    
    console.log('\n🌍 UBICACIÓN GPS');
    console.log('-'.repeat(70));
    if (exif.location) {
      console.log(`Latitud:             ${exif.location.latitude?.toFixed(6) || 'N/A'} ${exif.location.latitudeRef || ''}`);
      console.log(`Longitud:            ${exif.location.longitude?.toFixed(6) || 'N/A'} ${exif.location.longitudeRef || ''}`);
      console.log(`Altitud:             ${exif.location.altitude ? exif.location.altitude + 'm' : 'N/A'} ${exif.location.altitudeRef || ''}`);
      console.log(`GPS Timestamp:       ${exif.location.gpsDateStamp || 'N/A'} ${exif.location.gpsTimeStamp || ''}`);
      if (exif.location.latitude && exif.location.longitude) {
        console.log(`Google Maps:         https://www.google.com/maps?q=${exif.location.latitude},${exif.location.longitude}`);
      }
    } else {
      console.log('Sin datos GPS');
    }
    
    console.log('\n📐 DIMENSIONES Y CALIDAD');
    console.log('-'.repeat(70));
    console.log(`Resolución:          ${exif.imageWidth || 'N/A'} × ${exif.imageHeight || 'N/A'} px`);
    if (exif.imageWidth && exif.imageHeight) {
      const mp = ((exif.imageWidth * exif.imageHeight) / 1000000).toFixed(1);
      console.log(`Megapíxeles:         ${mp} MP`);
    }
    console.log(`DPI:                 ${exif.xResolution || 'N/A'} × ${exif.yResolution || 'N/A'} ${exif.resolutionUnit || ''}`);
    console.log(`Bits por muestra:    ${exif.bitsPerSample || 'N/A'}`);
    console.log(`Orientación:         ${exif.orientation || 'N/A'}`);
    console.log(`Calidad:             ${exif.quality || 'N/A'}`);
    console.log(`Compresión:          ${exif.compression || 'N/A'}`);
    
    console.log('\n💾 ARCHIVO');
    console.log('-'.repeat(70));
    console.log(`Tipo:                ${exif.fileType || 'N/A'}`);
    console.log(`MIME:                ${exif.mimeType || 'N/A'}`);
    if (exif.fileSize) {
      const mb = (exif.fileSize / 1024 / 1024).toFixed(2);
      console.log(`Tamaño:              ${mb} MB (${exif.fileSize.toLocaleString()} bytes)`);
    }
    
    console.log('\n💻 SOFTWARE Y PROCESAMIENTO');
    console.log('-'.repeat(70));
    console.log(`Software:            ${exif.software || 'N/A'}`);
    console.log(`Procesamiento:       ${exif.processingSoftware || 'N/A'}`);
    console.log(`Makernotes:          ${exif.makernotes || 'No'}`);
    console.log(`Artista:             ${exif.artist || 'N/A'}`);
    console.log(`Copyright:           ${exif.copyright || 'N/A'}`);
    console.log(`Descripción:         ${exif.imageDescription || 'N/A'}`);
    
    console.log('\n☀️ CONDICIONES DE CAPTURA');
    console.log('-'.repeat(70));
    console.log(`Fuente de luz:       ${exif.lightSource || 'N/A'}`);
    console.log(`Tipo de escena:      ${exif.sceneType || 'N/A'}`);
    console.log(`Captura de escena:   ${exif.sceneCaptureType || 'N/A'}`);
    console.log(`Control de ganancia: ${exif.gainControl || 'N/A'}`);
    console.log(`Zoom digital:        ${exif.digitalZoomRatio ? exif.digitalZoomRatio + 'x' : 'N/A'}`);
    
    console.log('\n🔒 ANÁLISIS DE AUTENTICIDAD');
    console.log('='.repeat(70));
    const authenticityScore = 100 - (exif.manipulationScore || 0);
    const scoreEmoji = authenticityScore >= 70 ? '✅' : authenticityScore >= 40 ? '⚠️' : '❌';
    console.log(`${scoreEmoji} Puntuación: ${authenticityScore}/100`);
    console.log(`Manipulada:          ${exif.isManipulated ? '⚠️ SÍ' : '✅ NO'}`);
    console.log(`IA Generada:         ${exif.isAIGenerated ? '❌ SÍ' : '✅ NO'}`);
    if (exif.manipulationDetails) {
      console.log(`\nDetalles:`);
      console.log(`  ${exif.manipulationDetails}`);
    }
    
    console.log('\n📊 RESUMEN DE TAGS RAW');
    console.log('-'.repeat(70));
    console.log(`Total de tags EXIF:  ${Object.keys(exif.rawTags || {}).length}`);
    
    console.log('\n✅ Extracción completada exitosamente');
    console.log('='.repeat(70));
    
  } catch (error) {
    console.error('\n❌ ERROR en la extracción:', error.message);
    console.error(error.stack);
  }
}

// Ejecutar test
testExifExtraction()
  .then(() => {
    console.log('\n✨ Test finalizado\n');
    process.exit(0);
  })
  .catch(err => {
    console.error('\n💥 Error fatal:', err);
    process.exit(1);
  });
