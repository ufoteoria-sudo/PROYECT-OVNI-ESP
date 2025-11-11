#!/usr/bin/env node

/**
 * Script de Verificación de API Keys
 * Prueba la conectividad y funcionalidad de cada API configurada
 */

require('dotenv').config();
const axios = require('axios');

const Colors = {
    reset: '\x1b[0m',
    bright: '\x1b[1m',
    red: '\x1b[31m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    magenta: '\x1b[35m',
    cyan: '\x1b[36m'
};

function printHeader(text) {
    console.log(`\n${Colors.cyan}${'━'.repeat(60)}`);
    console.log(`${Colors.bright}${text}${Colors.reset}`);
    console.log(`${Colors.cyan}${'━'.repeat(60)}${Colors.reset}\n`);
}

function printSuccess(text) {
    console.log(`${Colors.green}✅ ${text}${Colors.reset}`);
}

function printError(text) {
    console.log(`${Colors.red}❌ ${text}${Colors.reset}`);
}

function printWarning(text) {
    console.log(`${Colors.yellow}⚠️  ${text}${Colors.reset}`);
}

function printInfo(text) {
    console.log(`${Colors.blue}ℹ️  ${text}${Colors.reset}`);
}

// ============== OPENWEATHERMAP ==============
async function testOpenWeatherMap() {
    printHeader('🌤️  OpenWeatherMap API');
    
    const apiKey = process.env.OPENWEATHERMAP_API_KEY;
    
    if (!apiKey) {
        printError('API Key no configurada');
        printInfo('Agregar OPENWEATHERMAP_API_KEY en server/.env');
        printInfo('Obtener en: https://openweathermap.org/api');
        return false;
    }
    
    printSuccess('API Key configurada');
    
    try {
        // Probar con Londres como ubicación de prueba
        const url = `https://api.openweathermap.org/data/2.5/weather?lat=51.5074&lon=-0.1278&appid=${apiKey}&units=metric`;
        
        const response = await axios.get(url, { timeout: 5000 });
        
        if (response.data) {
            printSuccess('Conexión exitosa');
            printInfo(`📍 Datos de prueba recibidos:`);
            console.log(`   Location: ${response.data.name}, ${response.data.sys.country}`);
            console.log(`   Temp: ${response.data.main.temp}°C`);
            console.log(`   Conditions: ${response.data.weather[0].description}`);
            console.log(`   Clouds: ${response.data.clouds.all}%`);
            console.log(`   Visibility: ${response.data.visibility/1000}km`);
            return true;
        }
        
    } catch (error) {
        if (error.response?.status === 401) {
            printError('API Key inválida');
            printInfo('Verificar la key en https://home.openweathermap.org/api_keys');
        } else if (error.response?.status === 429) {
            printError('Límite de llamadas excedido (1000/día)');
        } else {
            printError(`Error de conexión: ${error.message}`);
        }
        return false;
    }
}

// ============== N2YO ==============
async function testN2YO() {
    printHeader('🛰️  N2YO API');
    
    const apiKey = process.env.N2YO_API_KEY;
    
    if (!apiKey) {
        printError('API Key no configurada');
        printInfo('Agregar N2YO_API_KEY en server/.env');
        printInfo('Obtener en: https://www.n2yo.com/api/');
        return false;
    }
    
    printSuccess('API Key configurada');
    
    try {
        // Probar con ISS (ID: 25544) sobre Londres
        const url = `https://api.n2yo.com/rest/v1/satellite/positions/25544/51.5074/-0.1278/0/1/&apiKey=${apiKey}`;
        
        const response = await axios.get(url, { timeout: 5000 });
        
        if (response.data?.info) {
            printSuccess('Conexión exitosa');
            printInfo(`📡 Datos de prueba recibidos:`);
            console.log(`   Satélite: ${response.data.info.satname}`);
            console.log(`   ID: ${response.data.info.satid}`);
            console.log(`   Transacciones restantes: ${response.data.info.transactionscount}`);
            
            if (response.data.positions && response.data.positions.length > 0) {
                const pos = response.data.positions[0];
                console.log(`   Posición actual:`);
                console.log(`     Lat: ${pos.satlatitude}°`);
                console.log(`     Lon: ${pos.satlongitude}°`);
                console.log(`     Alt: ${pos.sataltitude} km`);
            }
            
            return true;
        }
        
    } catch (error) {
        if (error.response?.status === 401) {
            printError('API Key inválida');
            printInfo('Verificar la key o solicitar una nueva');
        } else if (error.response?.status === 429) {
            printError('Límite de transacciones excedido (1000/hora)');
        } else {
            printError(`Error de conexión: ${error.message}`);
        }
        return false;
    }
}

// ============== OPENAI ==============
async function testOpenAI() {
    printHeader('🤖 OpenAI API');
    
    const apiKey = process.env.OPENAI_API_KEY;
    
    if (!apiKey) {
        printError('API Key no configurada');
        printInfo('Agregar OPENAI_API_KEY en server/.env');
        printInfo('Obtener en: https://platform.openai.com/api-keys');
        printWarning('Nota: OpenAI es de pago (~$0.01 por análisis)');
        return false;
    }
    
    if (!apiKey.startsWith('sk-')) {
        printError('Formato de API Key inválido (debe empezar con "sk-")');
        return false;
    }
    
    printSuccess('API Key configurada');
    
    try {
        // Probar con endpoint de modelos
        const url = 'https://api.openai.com/v1/models';
        
        const response = await axios.get(url, {
            headers: {
                'Authorization': `Bearer ${apiKey}`
            },
            timeout: 5000
        });
        
        if (response.data?.data) {
            printSuccess('Conexión exitosa');
            
            // Verificar si tiene acceso a GPT-4 Vision
            const hasGPT4Vision = response.data.data.some(m => 
                m.id.includes('gpt-4') && m.id.includes('vision')
            );
            
            if (hasGPT4Vision) {
                printSuccess('Acceso a GPT-4 Vision confirmado');
            } else {
                printWarning('No se detectó acceso a GPT-4 Vision');
                printInfo('El sistema usará GPT-3.5 como fallback');
            }
            
            printInfo(`📊 Modelos disponibles: ${response.data.data.length}`);
            
            return true;
        }
        
    } catch (error) {
        if (error.response?.status === 401) {
            printError('API Key inválida o revocada');
            printInfo('Verificar en: https://platform.openai.com/api-keys');
        } else if (error.response?.status === 429) {
            printError('Límite de rate excedido');
        } else if (error.response?.status === 403) {
            printError('Sin créditos o cuenta suspendida');
            printInfo('Verificar billing: https://platform.openai.com/account/billing');
        } else {
            printError(`Error de conexión: ${error.message}`);
        }
        return false;
    }
}

// ============== MAIN ==============
async function main() {
    const args = process.argv.slice(2);
    const testType = args[0]?.toLowerCase() || 'all';
    
    console.log(`${Colors.bright}${Colors.magenta}`);
    console.log('╔════════════════════════════════════════════════════════════╗');
    console.log('║           🔑 VERIFICACIÓN DE API KEYS                     ║');
    console.log('║              UAP Analysis System v2.0                     ║');
    console.log('╚════════════════════════════════════════════════════════════╝');
    console.log(Colors.reset);
    
    const results = {
        openweathermap: null,
        n2yo: null,
        openai: null
    };
    
    if (testType === 'all' || testType === 'openweathermap' || testType === 'weather') {
        results.openweathermap = await testOpenWeatherMap();
    }
    
    if (testType === 'all' || testType === 'n2yo' || testType === 'satellite') {
        results.n2yo = await testN2YO();
    }
    
    if (testType === 'all' || testType === 'openai' || testType === 'ai') {
        results.openai = await testOpenAI();
    }
    
    // Resumen final
    if (testType === 'all') {
        printHeader('📊 RESUMEN');
        
        const configured = Object.values(results).filter(r => r !== null).length;
        const successful = Object.values(results).filter(r => r === true).length;
        const failed = Object.values(results).filter(r => r === false).length;
        
        console.log(`APIs configuradas: ${Colors.bright}${configured}/3${Colors.reset}`);
        console.log(`${Colors.green}Exitosas: ${successful}${Colors.reset}`);
        if (failed > 0) {
            console.log(`${Colors.red}Fallidas: ${failed}${Colors.reset}`);
        }
        
        console.log('');
        
        if (results.openweathermap) printSuccess('OpenWeatherMap: OK');
        else if (results.openweathermap === false) printError('OpenWeatherMap: FAILED');
        else printWarning('OpenWeatherMap: NO TESTEADO');
        
        if (results.n2yo) printSuccess('N2YO: OK');
        else if (results.n2yo === false) printError('N2YO: FAILED');
        else printWarning('N2YO: NO TESTEADO');
        
        if (results.openai) printSuccess('OpenAI: OK');
        else if (results.openai === false) printError('OpenAI: FAILED');
        else printWarning('OpenAI: NO TESTEADO');
        
        console.log('');
        
        if (successful === configured && configured > 0) {
            console.log(`${Colors.green}${Colors.bright}`);
            console.log('╔════════════════════════════════════════════════════════════╗');
            console.log('║     ✅ TODAS LAS APIS CONFIGURADAS CORRECTAMENTE          ║');
            console.log('╚════════════════════════════════════════════════════════════╝');
            console.log(Colors.reset);
            console.log('');
            printInfo('Reiniciar el servidor para aplicar cambios');
            console.log('');
        } else if (configured === 0) {
            printWarning('Ninguna API configurada - El sistema funciona con funcionalidad limitada');
            printInfo('Ver guía: docs/API_KEYS_SETUP.md');
        } else {
            printWarning('Algunas APIs no están configuradas o fallaron');
            printInfo('Ver logs arriba para más detalles');
        }
    }
    
    console.log('');
}

// Ejecutar
main().catch(error => {
    printError(`Error inesperado: ${error.message}`);
    process.exit(1);
});
