/**
 * Script de prueba para verificar el sistema WebSocket
 * 
 * Este script:
 * 1. Se conecta al servidor WebSocket
 * 2. Crea un usuario de prueba (si no existe)
 * 3. Sube una imagen de prueba
 * 4. Inicia un análisis
 * 5. Escucha todos los eventos WebSocket emitidos
 * 6. Valida que se reciban todos los eventos esperados
 * 
 * Uso: node test_websocket.js
 */

require('dotenv').config();
const io = require('socket.io-client');
const FormData = require('form-data');
const fs = require('fs');
const path = require('path');
const axios = require('axios');

const API_URL = 'http://localhost:3000';
const TEST_USER = {
    username: 'websocket_test',
    email: 'websocket@test.com',
    password: 'Test1234!'
};

// Colores para consola
const colors = {
    reset: '\x1b[0m',
    green: '\x1b[32m',
    red: '\x1b[31m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
    console.log(`${colors[color]}${message}${colors.reset}`);
}

// Eventos esperados
const expectedEvents = {
    started: false,
    progress: [],
    layer_complete: [],
    complete: false
};

// Conectar al WebSocket
let socket = null;
let token = null;
let analysisId = null;

async function registerUser() {
    try {
        log('\n📝 Registrando usuario de prueba...', 'blue');
        const response = await axios.post(`${API_URL}/api/auth/register`, TEST_USER);
        log('✅ Usuario registrado exitosamente', 'green');
        return response.data.token;
    } catch (error) {
        if (error.response?.status === 409) {
            log('⚠️  Usuario ya existe, intentando login...', 'yellow');
            return loginUser();
        }
        throw error;
    }
}

async function loginUser() {
    try {
        log('🔐 Iniciando sesión...', 'blue');
        const response = await axios.post(`${API_URL}/api/auth/login`, {
            email: TEST_USER.email,
            password: TEST_USER.password
        });
        log('✅ Login exitoso', 'green');
        return response.data.token;
    } catch (error) {
        log(`❌ Error en login: ${error.message}`, 'red');
        throw error;
    }
}

async function uploadTestImage() {
    try {
        log('\n📤 Subiendo imagen de prueba...', 'blue');
        
        // Crear imagen de prueba simple (1x1 pixel PNG)
        const testImagePath = path.join(__dirname, 'test_image.png');
        const pngData = Buffer.from([
            0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A, // PNG signature
            0x00, 0x00, 0x00, 0x0D, 0x49, 0x48, 0x44, 0x52, // IHDR chunk
            0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01, // 1x1 pixel
            0x08, 0x02, 0x00, 0x00, 0x00, 0x90, 0x77, 0x53,
            0xDE, 0x00, 0x00, 0x00, 0x0C, 0x49, 0x44, 0x41, // IDAT chunk
            0x54, 0x08, 0x99, 0x63, 0xF8, 0xFF, 0xFF, 0x3F,
            0x00, 0x05, 0xFE, 0x02, 0xFE, 0xDC, 0xCC, 0x59,
            0xE7, 0x00, 0x00, 0x00, 0x00, 0x49, 0x45, 0x4E, // IEND chunk
            0x44, 0xAE, 0x42, 0x60, 0x82
        ]);
        
        fs.writeFileSync(testImagePath, pngData);
        
        const formData = new FormData();
        formData.append('file', fs.createReadStream(testImagePath), {
            filename: 'test_websocket.png',
            contentType: 'image/png'
        });
        
        const response = await axios.post(`${API_URL}/api/uploads`, formData, {
            headers: {
                ...formData.getHeaders(),
                'Authorization': `Bearer ${token}`
            }
        });
        
        // Limpiar archivo temporal
        fs.unlinkSync(testImagePath);
        
        log('✅ Imagen subida exitosamente', 'green');
        log(`   ID: ${response.data.analysis.id}`, 'cyan');
        return response.data.analysis.id;
        
    } catch (error) {
        log(`❌ Error subiendo imagen: ${error.message}`, 'red');
        throw error;
    }
}

async function startAnalysis(uploadId) {
    try {
        log('\n🤖 Iniciando análisis...', 'blue');
        const response = await axios.post(`${API_URL}/api/analyze/${uploadId}`, {}, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        log('✅ Análisis iniciado', 'green');
        return uploadId;
    } catch (error) {
        log(`❌ Error iniciando análisis: ${error.message}`, 'red');
        throw error;
    }
}

function connectWebSocket() {
    return new Promise((resolve, reject) => {
        log('\n🔌 Conectando a WebSocket...', 'blue');
        
        socket = io(API_URL, {
            transports: ['websocket', 'polling']
        });
        
        socket.on('connect', () => {
            log(`✅ WebSocket conectado: ${socket.id}`, 'green');
            resolve();
        });
        
        socket.on('connect_error', (error) => {
            log(`❌ Error de conexión: ${error.message}`, 'red');
            reject(error);
        });
        
        socket.on('disconnect', () => {
            log('❌ WebSocket desconectado', 'yellow');
        });
    });
}

function subscribeToAnalysis(id) {
    const channel = `analysis:${id}`;
    log(`\n📡 Suscrito a canal: ${channel}`, 'cyan');
    log('\n⏳ Esperando eventos WebSocket...\n', 'yellow');
    
    socket.on(channel, (event) => {
        const timestamp = new Date(event.timestamp).toLocaleTimeString();
        
        switch(event.type) {
            case 'started':
                expectedEvents.started = true;
                log(`[${timestamp}] ✅ STARTED - Análisis iniciado`, 'green');
                break;
                
            case 'progress':
                expectedEvents.progress.push(event.progress);
                log(`[${timestamp}] 📊 PROGRESS ${event.progress}% - ${event.currentLayer}`, 'cyan');
                break;
                
            case 'layer_complete':
                expectedEvents.layer_complete.push(event.layer.number);
                log(`[${timestamp}] ✅ LAYER ${event.layer.number} - ${event.layer.name}`, 'green');
                // Mostrar datos de la capa
                if (event.layer.data) {
                    const dataStr = JSON.stringify(event.layer.data, null, 2)
                        .split('\n')
                        .map(line => `       ${line}`)
                        .join('\n');
                    log(`       Data: ${dataStr}`, 'cyan');
                }
                break;
                
            case 'complete':
                expectedEvents.complete = true;
                log(`[${timestamp}] 🎉 COMPLETE - Análisis completado`, 'green');
                log(`       Confidence: ${event.result.confidence}%`, 'cyan');
                log(`       Category: ${event.result.category}`, 'cyan');
                
                // Validar resultados después de un pequeño delay
                setTimeout(() => validateResults(), 1000);
                break;
                
            case 'error':
                log(`[${timestamp}] ❌ ERROR - ${event.error.message}`, 'red');
                process.exit(1);
                break;
        }
    });
}

function validateResults() {
    log('\n' + '='.repeat(60), 'blue');
    log('📋 VALIDACIÓN DE RESULTADOS', 'blue');
    log('='.repeat(60), 'blue');
    
    let allPassed = true;
    
    // 1. Verificar evento started
    if (expectedEvents.started) {
        log('✅ Evento STARTED recibido', 'green');
    } else {
        log('❌ Evento STARTED NO recibido', 'red');
        allPassed = false;
    }
    
    // 2. Verificar eventos de progreso
    const expectedProgress = [0, 10, 20, 30, 40, 50, 60, 70, 80, 90, 100];
    const receivedProgress = [...new Set(expectedEvents.progress)].sort((a, b) => a - b);
    
    log(`\n📊 Eventos de PROGRESO:`, 'cyan');
    log(`   Esperados: ${expectedProgress.join(', ')}`, 'cyan');
    log(`   Recibidos: ${receivedProgress.join(', ')}`, 'cyan');
    
    const missingProgress = expectedProgress.filter(p => !receivedProgress.includes(p));
    if (missingProgress.length === 0) {
        log('✅ Todos los eventos de progreso recibidos', 'green');
    } else {
        log(`❌ Faltan eventos de progreso: ${missingProgress.join(', ')}`, 'red');
        allPassed = false;
    }
    
    // 3. Verificar layer_complete
    const expectedLayers = [1, 2, 3, 4, 5, 6, 7, 8, 9];
    const receivedLayers = [...new Set(expectedEvents.layer_complete)].sort((a, b) => a - b);
    
    log(`\n🔢 Eventos LAYER_COMPLETE:`, 'cyan');
    log(`   Esperados: ${expectedLayers.join(', ')}`, 'cyan');
    log(`   Recibidos: ${receivedLayers.join(', ')}`, 'cyan');
    
    const missingLayers = expectedLayers.filter(l => !receivedLayers.includes(l));
    if (missingLayers.length === 0) {
        log('✅ Todas las capas completadas', 'green');
    } else {
        log(`❌ Faltan capas: ${missingLayers.join(', ')}`, 'red');
        allPassed = false;
    }
    
    // 4. Verificar evento complete
    if (expectedEvents.complete) {
        log('\n✅ Evento COMPLETE recibido', 'green');
    } else {
        log('\n❌ Evento COMPLETE NO recibido', 'red');
        allPassed = false;
    }
    
    // Resultado final
    log('\n' + '='.repeat(60), 'blue');
    if (allPassed) {
        log('🎉 PRUEBA EXITOSA - Sistema WebSocket funcionando correctamente', 'green');
        log('='.repeat(60) + '\n', 'blue');
        cleanup(0);
    } else {
        log('❌ PRUEBA FALLIDA - Algunos eventos no se recibieron', 'red');
        log('='.repeat(60) + '\n', 'blue');
        cleanup(1);
    }
}

function cleanup(exitCode) {
    if (socket) {
        socket.disconnect();
    }
    setTimeout(() => process.exit(exitCode), 500);
}

// Ejecución principal
async function main() {
    try {
        log('╔═══════════════════════════════════════════════════════════╗', 'blue');
        log('║     PRUEBA DEL SISTEMA WEBSOCKET - UAP Analysis System    ║', 'blue');
        log('╚═══════════════════════════════════════════════════════════╝', 'blue');
        
        // 1. Autenticación
        token = await registerUser();
        
        // 2. Conectar WebSocket
        await connectWebSocket();
        
        // 3. Subir imagen
        const uploadId = await uploadTestImage();
        analysisId = uploadId;
        
        // 4. Suscribirse a eventos
        subscribeToAnalysis(analysisId);
        
        // 5. Iniciar análisis
        await startAnalysis(analysisId);
        
        // El análisis continuará en background y los eventos se escucharán
        // La validación se ejecutará cuando llegue el evento 'complete'
        
    } catch (error) {
        log(`\n❌ Error fatal: ${error.message}`, 'red');
        if (error.stack) {
            log(error.stack, 'red');
        }
        cleanup(1);
    }
}

// Manejar Ctrl+C
process.on('SIGINT', () => {
    log('\n\n⚠️  Prueba interrumpida por el usuario', 'yellow');
    cleanup(1);
});

// Timeout de seguridad (5 minutos)
setTimeout(() => {
    log('\n\n⚠️  Timeout - El análisis tomó más de 5 minutos', 'yellow');
    cleanup(1);
}, 5 * 60 * 1000);

// Iniciar
main();
