const fs = require('fs');
const ExifParser = require('exif-parser');

/**
 * Extrae datos EXIF de una imagen (EXPANDIDO - estilo ExifTool)
 * @param {string} filePath - Ruta completa del archivo
 * @returns {Object} Datos EXIF extraídos con TODOS los campos disponibles
 */
async function extractExifData(filePath) {
  try {
    // Leer archivo
    const buffer = fs.readFileSync(filePath);
    const stats = fs.statSync(filePath);
    
    // Parsear EXIF
    const parser = ExifParser.create(buffer);
    const result = parser.parse();
    const tags = result.tags || {};
    
    // Extraer TODOS los datos relevantes (estilo ExifTool)
    const exifData = {
      // ===== INFORMACIÓN DE LA CÁMARA =====
      camera: tags.Make || null,
      cameraModel: tags.Model || null,
      lens: tags.LensModel || null,
      lensMake: tags.LensMake || null,
      lensSerialNumber: tags.LensSerialNumber || null,
      cameraSerialNumber: tags.SerialNumber || tags.InternalSerialNumber || null,
      
      // ===== CONFIGURACIÓN DE CAPTURA =====
      iso: tags.ISO || tags.ISOSpeedRatings || null,
      
      // Shutter Speed (múltiples formatos)
      shutterSpeed: null,
      exposureTime: tags.ExposureTime || null,
      
      // Apertura (múltiples formatos)
      aperture: null,
      apertureValue: tags.FNumber || tags.ApertureValue || null,
      
      // Focal Length
      focalLength: tags.FocalLength ? `${tags.FocalLength}mm` : null,
      focalLengthIn35mm: tags.FocalLengthIn35mmFilm || null,
      
      // ===== EXPOSICIÓN =====
      exposureMode: getExposureMode(tags.ExposureMode),
      exposureProgram: getExposureProgram(tags.ExposureProgram),
      exposureBias: tags.ExposureCompensation || tags.ExposureBiasValue || null,
      meteringMode: getMeteringMode(tags.MeteringMode),
      
      // ===== FLASH =====
      flash: tags.Flash !== undefined ? tags.Flash !== 0 : null,
      flashMode: getFlashMode(tags.Flash),
      flashFired: tags.Flash ? (tags.Flash & 0x01) === 1 : null,
      flashReturn: tags.FlashReturn || null,
      flashEnergy: tags.FlashEnergy || null,
      
      // ===== BALANCE DE BLANCOS Y COLOR =====
      whiteBalance: getWhiteBalance(tags.WhiteBalance),
      colorSpace: getColorSpace(tags.ColorSpace),
      colorMode: tags.ColorMode || null,
      saturation: getSaturation(tags.Saturation),
      sharpness: getSharpness(tags.Sharpness),
      contrast: getContrast(tags.Contrast),
      brightness: tags.BrightnessValue || null,
      
      // ===== ENFOQUE =====
      focusMode: getFocusMode(tags.FocusMode),
      focusDistance: tags.SubjectDistance || tags.FocusDistance || null,
      focusPoint: tags.FocusPoint || null,
      afAreaMode: tags.AFAreaMode || null,
      
      // ===== FECHA Y HORA (múltiples campos) =====
      captureDate: tags.DateTimeOriginal 
        ? new Date(tags.DateTimeOriginal * 1000) 
        : null,
      captureTime: tags.DateTimeOriginal 
        ? new Date(tags.DateTimeOriginal * 1000).toISOString() 
        : null,
      dateTime: tags.DateTime 
        ? new Date(tags.DateTime * 1000) 
        : null,
      dateTimeDigitized: tags.DateTimeDigitized 
        ? new Date(tags.DateTimeDigitized * 1000) 
        : null,
      createDate: tags.CreateDate || null,
      modifyDate: tags.ModifyDate || null,
      
      // ===== UBICACIÓN GPS =====
      location: null,
      
      // ===== DIMENSIONES Y CALIDAD =====
      quality: tags.Quality || null,
      imageWidth: result.imageSize?.width || tags.ImageWidth || tags.ExifImageWidth || null,
      imageHeight: result.imageSize?.height || tags.ImageHeight || tags.ExifImageHeight || null,
      xResolution: tags.XResolution || null,
      yResolution: tags.YResolution || null,
      resolutionUnit: getResolutionUnit(tags.ResolutionUnit),
      bitsPerSample: tags.BitsPerSample || null,
      compression: getCompression(tags.Compression),
      orientation: tags.Orientation || null,
      
      // ===== SOFTWARE Y PROCESAMIENTO =====
      software: tags.Software || null,
      processingSoftware: tags.ProcessingSoftware || null,
      firmware: tags.FirmwareVersion || null,
      makernotes: tags.MakerNote ? 'Present' : null,
      
      // ===== INFORMACIÓN DEL ARCHIVO =====
      fileSize: stats.size,
      fileType: getFileType(filePath),
      mimeType: getMimeType(filePath),
      
      // ===== OTROS CAMPOS ÚTILES =====
      artist: tags.Artist || null,
      copyright: tags.Copyright || null,
      imageDescription: tags.ImageDescription || null,
      userComment: tags.UserComment || null,
      subjectDistance: tags.SubjectDistance || null,
      lightSource: getLightSource(tags.LightSource),
      sceneType: getSceneType(tags.SceneType),
      sceneCaptureType: getSceneCaptureType(tags.SceneCaptureType),
      gainControl: getGainControl(tags.GainControl),
      digitalZoomRatio: tags.DigitalZoomRatio || null,
      
      // ===== DATOS RAW COMPLETOS =====
      rawTags: tags, // TODOS los tags sin procesar
      
      // ===== DETECCIÓN DE MANIPULACIÓN =====
      isManipulated: false,
      manipulationScore: 0,
      manipulationDetails: '',
      isAIGenerated: false
    };
    
    // Formatear Shutter Speed
    if (exifData.exposureTime) {
      if (exifData.exposureTime >= 1) {
        exifData.shutterSpeed = `${exifData.exposureTime}s`;
      } else {
        exifData.shutterSpeed = `1/${Math.round(1/exifData.exposureTime)}`;
      }
    }
    
    // Formatear Apertura
    if (exifData.apertureValue) {
      exifData.aperture = `f/${exifData.apertureValue}`;
    }
    
    // Extraer GPS si está disponible (CON CONVERSIÓN A DECIMAL)
    if (tags.GPSLatitude && tags.GPSLongitude) {
      const latDecimal = convertGPSToDecimal(tags.GPSLatitude, tags.GPSLatitudeRef || 'N');
      const lonDecimal = convertGPSToDecimal(tags.GPSLongitude, tags.GPSLongitudeRef || 'E');
      
      // Convertir gpsTimeStamp de array a string si es necesario
      let gpsTimeStamp = tags.GPSTimeStamp;
      if (Array.isArray(gpsTimeStamp) && gpsTimeStamp.length === 3) {
        gpsTimeStamp = `${String(gpsTimeStamp[0]).padStart(2, '0')}:${String(gpsTimeStamp[1]).padStart(2, '0')}:${String(gpsTimeStamp[2]).padStart(2, '0')}`;
      }
      
      exifData.location = {
        latitude: latDecimal,
        longitude: lonDecimal,
        altitude: tags.GPSAltitude || null,
        latitudeRef: tags.GPSLatitudeRef || null,
        longitudeRef: tags.GPSLongitudeRef || null,
        altitudeRef: tags.GPSAltitudeRef || null,
        gpsDateStamp: tags.GPSDateStamp || null,
        gpsTimeStamp: gpsTimeStamp || null,
        address: null, // Se llenará con geocoding inverso
        raw: { // Guardar valores originales para debugging
          latitudeRaw: tags.GPSLatitude,
          longitudeRaw: tags.GPSLongitude
        }
      };
    }
    
    // ===== DETECCIÓN DE MANIPULACIÓN (AMPLIADA) =====
    const manipulationIndicators = [];
    
    // 1. Falta de datos EXIF (sospechoso en cámaras modernas)
    if (!tags.Make && !tags.Model && !tags.DateTimeOriginal) {
      manipulationIndicators.push('EXIF data ausente o eliminada');
      exifData.manipulationScore += 30;
    }
    
    // 2. Software de edición detectado (AMPLIADO)
    if (exifData.software) {
      const editingSoftware = [
        'photoshop', 'gimp', 'lightroom', 'pixlr', 'paint.net', 
        'photoscape', 'affinity', 'corel', 'snapseed', 'vsco',
        'facetune', 'picsart', 'canva', 'fotor', 'befunky',
        'pixelmator', 'acdsee', 'capture one', 'darktable'
      ];
      const softwareLower = exifData.software.toLowerCase();
      
      if (editingSoftware.some(editor => softwareLower.includes(editor))) {
        manipulationIndicators.push(`Editada con ${exifData.software}`);
        exifData.manipulationScore += 40;
      }
    }
    
    // 2b. ProcessingSoftware detectado
    if (exifData.processingSoftware) {
      manipulationIndicators.push(`Procesada con ${exifData.processingSoftware}`);
      exifData.manipulationScore += 35;
    }
    
    // 2c. Software AI detectado
    const aiSoftware = ['midjourney', 'dall-e', 'stable diffusion', 'ai', 'generated'];
    if (exifData.software) {
      const softwareLower = exifData.software.toLowerCase();
      if (aiSoftware.some(ai => softwareLower.includes(ai))) {
        manipulationIndicators.push('IMAGEN GENERADA POR IA');
        exifData.manipulationScore = 100; // Score máximo
        exifData.isAIGenerated = true;
      }
    }
    
    // 3. Datos GPS pero sin otros metadatos (sospechoso)
    if (exifData.location && !tags.Make) {
      manipulationIndicators.push('GPS presente pero sin datos de cámara');
      exifData.manipulationScore += 20;
    }
    
    // 4. Marca de tiempo inconsistente
    if (tags.DateTime && tags.DateTimeOriginal) {
      const diff = Math.abs(tags.DateTime - tags.DateTimeOriginal);
      if (diff > 86400) { // Más de 1 día de diferencia
        manipulationIndicators.push('Marcas de tiempo inconsistentes (>24h diferencia)');
        exifData.manipulationScore += 25;
      }
    }
    
    // 4b. Timestamp en el futuro
    if (tags.DateTimeOriginal) {
      const captureTime = new Date(tags.DateTimeOriginal * 1000);
      const now = new Date();
      if (captureTime > now) {
        manipulationIndicators.push('Fecha de captura en el FUTURO');
        exifData.manipulationScore += 50;
      }
      
      // Timestamp demasiado antiguo para la cámara
      const year = captureTime.getFullYear();
      if (year < 2000 && tags.Model) {
        const modelLower = tags.Model.toLowerCase();
        if (modelLower.includes('iphone') || modelLower.includes('galaxy')) {
          manipulationIndicators.push('Timestamp inconsistente con modelo de cámara');
          exifData.manipulationScore += 30;
        }
      }
    }
    
    // 4c. Resolución inconsistente
    if (exifData.imageWidth && exifData.imageHeight) {
      const megapixels = (exifData.imageWidth * exifData.imageHeight) / 1000000;
      // Si es muy baja para cámaras modernas
      if (megapixels < 1 && tags.Model && tags.Model.includes('Canon')) {
        manipulationIndicators.push('Resolución muy baja para el modelo de cámara');
        exifData.manipulationScore += 15;
      }
    }
    
    // 4d. Thumbnail presente pero EXIF principal ausente
    if (result.hasThumbnail && (!tags.Make || !tags.Model)) {
      manipulationIndicators.push('Thumbnail presente pero datos principales eliminados');
      exifData.manipulationScore += 35;
    }
    
    // Limitar el score a un máximo de 100
    exifData.manipulationScore = Math.min(exifData.manipulationScore, 100);
    
    if (exifData.manipulationScore > 50) {
      exifData.isManipulated = true;
    }
    
    if (manipulationIndicators.length > 0) {
      exifData.manipulationDetails = manipulationIndicators.join('; ');
    }
    
    return {
      success: true,
      data: exifData,
      raw: tags // Datos crudos para referencia
    };
    
  } catch (error) {
    console.error('Error al extraer EXIF:', error);
    
    // Si no hay EXIF, no es necesariamente un error
    if (error.message && error.message.includes('Invalid JPEG')) {
      return {
        success: false,
        error: 'Archivo no es un JPEG válido o no contiene datos EXIF',
        data: null
      };
    }
    
    return {
      success: false,
      error: error.message,
      data: null
    };
  }
}

// ===== FUNCIONES AUXILIARES PARA DECODIFICAR VALORES =====

function getExposureMode(value) {
  const modes = {
    0: 'Auto',
    1: 'Manual',
    2: 'Auto bracket'
  };
  return modes[value] || null;
}

function getExposureProgram(value) {
  const programs = {
    0: 'Not defined',
    1: 'Manual',
    2: 'Normal program',
    3: 'Aperture priority',
    4: 'Shutter priority',
    5: 'Creative program',
    6: 'Action program',
    7: 'Portrait mode',
    8: 'Landscape mode'
  };
  return programs[value] || null;
}

function getMeteringMode(value) {
  const modes = {
    0: 'Unknown',
    1: 'Average',
    2: 'Center-weighted average',
    3: 'Spot',
    4: 'Multi-spot',
    5: 'Pattern',
    6: 'Partial',
    255: 'Other'
  };
  return modes[value] || null;
}

function getFlashMode(value) {
  if (value === undefined || value === null) return null;
  
  const fired = (value & 0x01) === 1;
  const mode = (value >> 3) & 0x03;
  
  const modes = {
    0: fired ? 'Unknown' : 'No flash',
    1: 'Compulsory flash',
    2: 'Suppressed flash',
    3: 'Auto mode'
  };
  
  return modes[mode] || null;
}

function getWhiteBalance(value) {
  const modes = {
    0: 'Auto',
    1: 'Manual'
  };
  return modes[value] || null;
}

function getColorSpace(value) {
  const spaces = {
    1: 'sRGB',
    2: 'Adobe RGB',
    65535: 'Uncalibrated'
  };
  return spaces[value] || null;
}

function getSaturation(value) {
  const modes = {
    0: 'Normal',
    1: 'Low',
    2: 'High'
  };
  return modes[value] || null;
}

function getSharpness(value) {
  const modes = {
    0: 'Normal',
    1: 'Soft',
    2: 'Hard'
  };
  return modes[value] || null;
}

function getContrast(value) {
  const modes = {
    0: 'Normal',
    1: 'Low',
    2: 'High'
  };
  return modes[value] || null;
}

function getFocusMode(value) {
  const modes = {
    0: 'Auto',
    1: 'Manual',
    2: 'Macro'
  };
  return modes[value] || null;
}

function getResolutionUnit(value) {
  const units = {
    1: 'None',
    2: 'inches',
    3: 'cm'
  };
  return units[value] || null;
}

function getCompression(value) {
  const types = {
    1: 'Uncompressed',
    6: 'JPEG'
  };
  return types[value] || null;
}

function getLightSource(value) {
  const sources = {
    0: 'Unknown',
    1: 'Daylight',
    2: 'Fluorescent',
    3: 'Tungsten',
    4: 'Flash',
    9: 'Fine weather',
    10: 'Cloudy weather',
    11: 'Shade',
    12: 'Daylight fluorescent',
    13: 'Day white fluorescent',
    14: 'Cool white fluorescent',
    15: 'White fluorescent',
    17: 'Standard light A',
    18: 'Standard light B',
    19: 'Standard light C',
    20: 'D55',
    21: 'D65',
    22: 'D75',
    23: 'D50',
    24: 'ISO studio tungsten',
    255: 'Other'
  };
  return sources[value] || null;
}

function getSceneType(value) {
  return value === 1 ? 'Directly photographed' : null;
}

function getSceneCaptureType(value) {
  const types = {
    0: 'Standard',
    1: 'Landscape',
    2: 'Portrait',
    3: 'Night scene'
  };
  return types[value] || null;
}

function getGainControl(value) {
  const controls = {
    0: 'None',
    1: 'Low gain up',
    2: 'High gain up',
    3: 'Low gain down',
    4: 'High gain down'
  };
  return controls[value] || null;
}

function getFileType(filePath) {
  const ext = filePath.split('.').pop().toLowerCase();
  return ext.toUpperCase();
}

function getMimeType(filePath) {
  const ext = filePath.split('.').pop().toLowerCase();
  const types = {
    'jpg': 'image/jpeg',
    'jpeg': 'image/jpeg',
    'png': 'image/png',
    'gif': 'image/gif',
    'bmp': 'image/bmp',
    'webp': 'image/webp'
  };
  return types[ext] || 'application/octet-stream';
}

/**
 * Convierte coordenadas GPS a formato decimal si están en DMS
 * @param {number|array} gpsValue - Valor GPS (puede ser decimal o array [grados, minutos, segundos])
 * @param {string} ref - Referencia (N/S para latitud, E/W para longitud)
 * @returns {number} Coordenada en formato decimal
 */
function convertGPSToDecimal(gpsValue, ref) {
  // Si ya es un número decimal, retornar directamente
  if (typeof gpsValue === 'number') {
    // Aplicar signo según referencia
    if (ref === 'S' || ref === 'W') {
      return -Math.abs(gpsValue);
    }
    return Math.abs(gpsValue);
  }
  
  // Si es array DMS [grados, minutos, segundos]
  if (Array.isArray(gpsValue) && gpsValue.length === 3) {
    const degrees = gpsValue[0];
    const minutes = gpsValue[1];
    const seconds = gpsValue[2];
    
    let decimal = degrees + (minutes / 60) + (seconds / 3600);
    
    // Aplicar signo según referencia
    if (ref === 'S' || ref === 'W') {
      decimal = -Math.abs(decimal);
    }
    
    return decimal;
  }
  
  // Fallback: retornar el valor tal cual
  return gpsValue;
}

/**
 * Verifica si un archivo tiene datos EXIF
 * @param {string} filePath - Ruta completa del archivo
 * @returns {boolean}
 */
function hasExifData(filePath) {
  try {
    const buffer = fs.readFileSync(filePath);
    const parser = ExifParser.create(buffer);
    const result = parser.parse();
    return Object.keys(result.tags).length > 0;
  } catch (error) {
    return false;
  }
}

module.exports = {
  extractExifData,
  hasExifData,
  convertGPSToDecimal
};
