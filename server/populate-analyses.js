const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

// Conectar a MongoDB
mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/uap-db', {
    useNewUrlParser: true,
    useUnifiedTopology: true
});

const Analysis = require('./models/Analysis');

// Usuario de prueba fijo
const DEMO_USER_ID = new mongoose.Types.ObjectId();

const locations = [
    { city: 'Madrid', lat: 40.4168, lon: -3.7038 },
    { city: 'Barcelona', lat: 41.3851, lon: 2.1734 },
    { city: 'Valencia', lat: 39.4699, lon: -0.3763 },
    { city: 'Sevilla', lat: 37.3891, lon: -5.9845 },
    { city: 'Bilbao', lat: 43.2630, lon: -2.9340 },
    { city: 'Zaragoza', lat: 41.6488, lon: -0.8891 },
    { city: 'Málaga', lat: 36.7213, lon: -4.4214 },
    { city: 'Granada', lat: 37.1773, lon: -3.5986 }
];

const descriptions = [
    'Objeto con características anómalas detectado. Movimiento no convencional, sin rastro de propulsión visible.',
    'Formación triangular de luces detectada. Sin correlación con vuelos comerciales registrados.',
    'Objeto con firmas térmicas anómalas. Descartados drones, globos y aeronaves.',
    'Objeto metálico captado en pleno día. Análisis sugiere tecnología no identificada.',
    'Luz con patrón de pulsación regular detectada. No coincide con aeronaves ni satélites.',
    'Forma cilíndrica alargada detectada. Sin alas visibles ni rastro de propulsión.',
    'Esfera perfecta con luminosidad propia detectada. Movimiento errático documentado.',
    'Objeto con forma de disco y rotación aparente. Sin correlación con aeronaves convencionales.'
];

const sampleAnalyses = locations.map((loc, idx) => ({
    userId: DEMO_USER_ID,
    fileName: `uap-${loc.city.toLowerCase()}-${String(idx + 1).padStart(3, '0')}.jpg`,
    fileType: 'image',
    filePath: `/uploads/demo/uap-${loc.city.toLowerCase()}-${idx + 1}.jpg`,
    fileSize: 1024000 + Math.floor(Math.random() * 500000),
    status: 'completed',
    isPublic: true,
    aiAnalysis: {
        provider: 'visual_comparison',
        model: 'Llama 3.2 Vision + OpenCV + Scientific Analysis',
        description: descriptions[idx],
        confidence: 65 + Math.floor(Math.random() * 30), // 65-95%
        category: 'UAP',
        isUnusual: true,
        unusualFeatures: ['Movimiento anómalo', 'Sin propulsión visible', 'Características no identificadas'],
        processedDate: new Date()
    },
    confidenceBreakdown: {
        externalValidation: { 
            score: 70 + Math.floor(Math.random() * 25), 
            weight: 0.4, 
            details: ['Sin correlación con vuelos registrados', 'Análisis de datos externos'] 
        },
        imageCharacteristics: { 
            score: 75 + Math.floor(Math.random() * 20), 
            weight: 0.3, 
            details: ['Alta calidad EXIF', 'Sin manipulación detectada'] 
        },
        trainingData: { 
            score: 70 + Math.floor(Math.random() * 25), 
            weight: 0.3, 
            details: [`Coincidencia con ${2 + Math.floor(Math.random() * 3)} casos similares`] 
        }
    },
    exifData: {
        camera: ['Sony', 'Canon', 'Nikon'][Math.floor(Math.random() * 3)],
        cameraModel: ['Alpha 7 III', 'EOS R5', 'Z6 II'][Math.floor(Math.random() * 3)],
        captureDate: new Date(Date.now() - Math.floor(Math.random() * 90) * 24 * 60 * 60 * 1000), // Últimos 90 días
        location: {
            latitude: loc.lat,
            longitude: loc.lon,
            address: `${loc.city}, España`
        },
        iso: [1600, 3200, 6400][Math.floor(Math.random() * 3)],
        shutterSpeed: ['1/250', '1/500', '1/1000'][Math.floor(Math.random() * 3)],
        aperture: 'f/' + [2.8, 4, 5.6][Math.floor(Math.random() * 3)],
        imageWidth: 6000,
        imageHeight: 4000
    },
    visualAnalysis: {
        shapeAnalysis: {
            shapeType: ['circular', 'elongated', 'irregular'][Math.floor(Math.random() * 3)],
            isSmallObject: false
        },
        confidence: 70 + Math.floor(Math.random() * 25)
    },
    sightingContext: {
        movement: ['rápido', 'errático', 'moderado'][Math.floor(Math.random() * 3)],
        speedEstimate: 3 + Math.floor(Math.random() * 2),
        altitudeEstimate: ['media', 'alta', 'muy alta'][Math.floor(Math.random() * 3)],
        lightColor: [['blanco'], ['multicolor'], ['rojo', 'verde']][Math.floor(Math.random() * 3)],
        lightIntensity: ['brillante', 'muy brillante'][Math.floor(Math.random() * 2)],
        soundHeard: 'sin sonido',
        duration: `${30 + Math.floor(Math.random() * 300)} segundos`,
        weatherConditions: ['despejado', 'parcialmente nublado'][Math.floor(Math.random() * 2)]
    }
}));

async function populateAnalyses() {
    try {
        console.log('🚀 Creando análisis de prueba...\n');
        
        let createdCount = 0;
        
        for (const analysisData of sampleAnalyses) {
            const analysis = new Analysis(analysisData);
            await analysis.save();
            const city = analysisData.exifData.location.address.split(',')[0];
            const conf = analysisData.aiAnalysis.confidence;
            console.log(`✓ Creado: UAP en ${city} (Confianza: ${conf}%)`);
            createdCount++;
        }
        
        console.log(`\n✅ ${createdCount} análisis creados exitosamente`);
        
        // Verificar
        const count = await Analysis.countDocuments({ status: 'completed', isPublic: true });
        console.log(`\n📊 Total de análisis públicos en BD: ${count}`);
        
        // Verificar que la API los devuelve
        console.log('\n🔍 Verificando estructura para API...');
        const sample = await Analysis.findOne({ status: 'completed', isPublic: true })
            .select('fileName aiAnalysis.description aiAnalysis.confidence exifData.location createdAt');
        
        if (sample) {
            console.log('✓ Estructura de documento:', {
                fileName: sample.fileName,
                description: sample.aiAnalysis.description.substring(0, 50) + '...',
                confidence: sample.aiAnalysis.confidence,
                location: sample.exifData.location.address,
                createdAt: sample.createdAt
            });
        }
        
        process.exit(0);
    } catch (error) {
        console.error('❌ Error:', error);
        console.error('\nDetalles:', error.errors || error.message);
        process.exit(1);
    }
}

populateAnalyses();
