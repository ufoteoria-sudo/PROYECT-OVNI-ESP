const sharp = require('sharp');
const path = require('path');

async function debugImage() {
  const imagePath = path.join(__dirname, 'uploads/images/1762631367069-690f6933ff531e26cd48599a-imagen_ovni_prueba.jpeg');
  
  console.log('📸 Analizando imagen:', imagePath);
  
  const image = sharp(imagePath);
  const metadata = await image.metadata();
  
  console.log('\n📊 Metadata:', {
    width: metadata.width,
    height: metadata.height,
    format: metadata.format,
    space: metadata.space,
    channels: metadata.channels,
    hasAlpha: metadata.hasAlpha
  });
  
  // Extraer datos RAW
  const { data, info } = await image
    .resize(800, 800, { fit: 'inside' })
    .raw()
    .toBuffer({ resolveWithObject: true });
  
  console.log('\n📊 Info después de resize:', info);
  
  // Analizar primeros píxeles
  console.log('\n🎨 Primeros 10 píxeles (R,G,B):');
  for (let i = 0; i < 30; i += 3) {
    console.log(`  Pixel ${i/3}: R=${data[i]}, G=${data[i+1]}, B=${data[i+2]}`);
  }
  
  // Calcular promedio RGB
  let totalR = 0, totalG = 0, totalB = 0;
  const totalPixels = info.width * info.height;
  
  for (let i = 0; i < data.length; i += info.channels) {
    totalR += data[i];
    totalG += data[i + 1];
    totalB += data[i + 2];
  }
  
  const avgR = Math.round(totalR / totalPixels);
  const avgG = Math.round(totalG / totalPixels);
  const avgB = Math.round(totalB / totalPixels);
  
  console.log('\n🎨 Color promedio:', {
    R: avgR,
    G: avgG,
    B: avgB
  });
  
  // Analizar contraste en el centro
  const centerX = Math.floor(info.width / 2);
  const centerY = Math.floor(info.height / 2);
  const centerRadius = Math.floor(Math.min(info.width, info.height) / 4);
  
  let centerBrightness = 0;
  let centerPixels = 0;
  
  for (let y = centerY - centerRadius; y < centerY + centerRadius; y++) {
    for (let x = centerX - centerRadius; x < centerX + centerRadius; x++) {
      if (y >= 0 && y < info.height && x >= 0 && x < info.width) {
        const idx = (y * info.width + x) * info.channels;
        const brightness = (data[idx] + data[idx + 1] + data[idx + 2]) / 3;
        centerBrightness += brightness;
        centerPixels++;
      }
    }
  }
  
  centerBrightness /= centerPixels;
  
  console.log('\n📍 Análisis del centro:');
  console.log('  Brillo promedio del centro:', Math.round(centerBrightness));
  console.log('  Brillo promedio general:', Math.round((avgR + avgG + avgB) / 3));
  console.log('  Diferencia:', Math.round(Math.abs(centerBrightness - (avgR + avgG + avgB) / 3)));
}

debugImage().catch(console.error);
