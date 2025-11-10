#!/usr/bin/env node

/**
 * Script Interactivo de Configuración de API Keys
 * Guía paso a paso para configurar cada API
 */

const fs = require('fs');
const path = require('path');
const readline = require('readline');

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

const envPath = path.join(__dirname, '..', '.env');
const envExamplePath = path.join(__dirname, '..', '.env.example');

// Interfaz readline
const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

function question(query) {
    return new Promise(resolve => rl.question(query, resolve));
}

function printHeader(text) {
    console.log(`\n${Colors.cyan}${'━'.repeat(70)}`);
    console.log(`${Colors.bright}${text}${Colors.reset}`);
    console.log(`${Colors.cyan}${'━'.repeat(70)}${Colors.reset}\n`);
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

function printStep(num, text) {
    console.log(`${Colors.bright}${num}.${Colors.reset} ${text}`);
}

// Leer archivo .env existente
function readEnvFile() {
    try {
        if (!fs.existsSync(envPath)) {
            return {};
        }
        
        const content = fs.readFileSync(envPath, 'utf8');
        const env = {};
        
        content.split('\n').forEach(line => {
            const trimmed = line.trim();
            if (trimmed && !trimmed.startsWith('#')) {
                const [key, ...valueParts] = trimmed.split('=');
                if (key) {
                    env[key.trim()] = valueParts.join('=').trim();
                }
            }
        });
        
        return env;
    } catch (error) {
        printError(`Error leyendo .env: ${error.message}`);
        return {};
    }
}

// Escribir archivo .env
function writeEnvFile(env) {
    try {
        // Hacer backup si existe
        if (fs.existsSync(envPath)) {
            const backupPath = `${envPath}.backup.${Date.now()}`;
            fs.copyFileSync(envPath, backupPath);
            printSuccess(`Backup creado: ${path.basename(backupPath)}`);
        }
        
        // Escribir nuevo archivo
        let content = '# UAP Analysis System - Environment Variables\n';
        content += `# Última actualización: ${new Date().toISOString()}\n\n`;
        
        // MongoDB (siempre primero)
        content += '# MongoDB\n';
        content += `MONGO_URI=${env.MONGO_URI || 'mongodb://localhost:27017/uap-db'}\n\n`;
        
        content += '# Server\n';
        content += `PORT=${env.PORT || '3000'}\n\n`;
        
        // JWT
        content += '# Authentication\n';
        content += `JWT_SECRET=${env.JWT_SECRET || ''}\n\n`;
        
        // API Keys
        content += '# External APIs\n';
        content += `OPENWEATHERMAP_API_KEY=${env.OPENWEATHERMAP_API_KEY || ''}\n`;
        content += `N2YO_API_KEY=${env.N2YO_API_KEY || ''}\n`;
        content += `OPENAI_API_KEY=${env.OPENAI_API_KEY || ''}\n`;
        
        fs.writeFileSync(envPath, content, 'utf8');
        printSuccess('.env actualizado correctamente');
        
        return true;
    } catch (error) {
        printError(`Error escribiendo .env: ${error.message}`);
        return false;
    }
}

// ============== OPENWEATHERMAP ==============
async function configureOpenWeatherMap(env) {
    printHeader('🌤️  OpenWeatherMap API');
    
    if (env.OPENWEATHERMAP_API_KEY) {
        console.log(`Actual: ${Colors.yellow}${env.OPENWEATHERMAP_API_KEY.substring(0, 8)}...${Colors.reset}`);
        const replace = await question('¿Reemplazar? (s/N): ');
        if (replace.toLowerCase() !== 's') {
            printInfo('Manteniendo configuración actual');
            return env.OPENWEATHERMAP_API_KEY;
        }
    }
    
    console.log('\n📝 Pasos para obtener tu API key:\n');
    printStep(1, 'Ir a: https://openweathermap.org/api');
    printStep(2, 'Click en "Sign Up" (arriba derecha)');
    printStep(3, 'Crear cuenta gratuita');
    printStep(4, 'Verificar email');
    printStep(5, 'Ir a: https://home.openweathermap.org/api_keys');
    printStep(6, 'Copiar la "Default" API key');
    
    console.log(`\n${Colors.yellow}Tiempo estimado: 5 minutos${Colors.reset}`);
    console.log(`${Colors.green}Plan gratuito: 1,000 llamadas/día${Colors.reset}\n`);
    
    const apiKey = await question('Pegar API key (o Enter para omitir): ');
    
    if (!apiKey || apiKey.trim() === '') {
        printWarning('OpenWeatherMap no configurado');
        printInfo('Capas 7 (Meteorológica) y 8 (Atmosférica) tendrán funcionalidad limitada');
        return '';
    }
    
    if (apiKey.length < 20) {
        printError('API key parece inválida (muy corta)');
        return '';
    }
    
    printSuccess('API key guardada');
    return apiKey.trim();
}

// ============== N2YO ==============
async function configureN2YO(env) {
    printHeader('🛰️  N2YO API');
    
    if (env.N2YO_API_KEY) {
        console.log(`Actual: ${Colors.yellow}${env.N2YO_API_KEY.substring(0, 8)}...${Colors.reset}`);
        const replace = await question('¿Reemplazar? (s/N): ');
        if (replace.toLowerCase() !== 's') {
            printInfo('Manteniendo configuración actual');
            return env.N2YO_API_KEY;
        }
    }
    
    console.log('\n📝 Pasos para obtener tu API key:\n');
    printStep(1, 'Ir a: https://www.n2yo.com/api/');
    printStep(2, 'Click en "Request an API Key"');
    printStep(3, 'Completar formulario (nombre, email, uso)');
    printStep(4, 'Recibirás la key por email');
    printStep(5, 'Copiar la API key del email');
    
    console.log(`\n${Colors.yellow}Tiempo estimado: 3 minutos (+ espera email)${Colors.reset}`);
    console.log(`${Colors.green}Plan gratuito: 1,000 transacciones/hora${Colors.reset}\n`);
    
    const apiKey = await question('Pegar API key (o Enter para omitir): ');
    
    if (!apiKey || apiKey.trim() === '') {
        printWarning('N2YO no configurado');
        printInfo('Capa 6 (Validación Externa) no podrá rastrear satélites en tiempo real');
        return '';
    }
    
    printSuccess('API key guardada');
    return apiKey.trim();
}

// ============== OPENAI ==============
async function configureOpenAI(env) {
    printHeader('🤖 OpenAI API');
    
    if (env.OPENAI_API_KEY) {
        console.log(`Actual: ${Colors.yellow}${env.OPENAI_API_KEY.substring(0, 8)}...${Colors.reset}`);
        const replace = await question('¿Reemplazar? (s/N): ');
        if (replace.toLowerCase() !== 's') {
            printInfo('Manteniendo configuración actual');
            return env.OPENAI_API_KEY;
        }
    }
    
    console.log(`\n${Colors.red}⚠️  NOTA IMPORTANTE: OpenAI es de pago${Colors.reset}`);
    console.log(`   Costo aproximado: $0.01 por análisis`);
    console.log(`   Requiere tarjeta de crédito\n`);
    
    const proceed = await question('¿Deseas configurar OpenAI? (s/N): ');
    if (proceed.toLowerCase() !== 's') {
        printInfo('OpenAI omitido (opcional)');
        printInfo('El sistema usará análisis visual básico sin IA avanzada');
        return '';
    }
    
    console.log('\n📝 Pasos para obtener tu API key:\n');
    printStep(1, 'Ir a: https://platform.openai.com/');
    printStep(2, 'Click en "Sign up" o "Log in"');
    printStep(3, 'Verificar email y teléfono');
    printStep(4, 'Agregar método de pago: https://platform.openai.com/account/billing');
    printStep(5, 'Ir a: https://platform.openai.com/api-keys');
    printStep(6, 'Click en "Create new secret key"');
    printStep(7, 'Copiar la key (solo se muestra una vez)');
    
    console.log(`\n${Colors.yellow}Tiempo estimado: 10 minutos${Colors.reset}`);
    console.log(`${Colors.red}Requiere: Tarjeta de crédito${Colors.reset}\n`);
    
    const apiKey = await question('Pegar API key (o Enter para omitir): ');
    
    if (!apiKey || apiKey.trim() === '') {
        printWarning('OpenAI no configurado');
        return '';
    }
    
    if (!apiKey.startsWith('sk-')) {
        printError('API key inválida (debe empezar con "sk-")');
        return '';
    }
    
    printSuccess('API key guardada');
    return apiKey.trim();
}

// ============== MAIN ==============
async function main() {
    console.log(`${Colors.bright}${Colors.magenta}`);
    console.log('╔════════════════════════════════════════════════════════════════════╗');
    console.log('║          🔧 CONFIGURACIÓN DE API KEYS                              ║');
    console.log('║             UAP Analysis System v2.0                               ║');
    console.log('╚════════════════════════════════════════════════════════════════════╝');
    console.log(Colors.reset);
    
    console.log('\nEste asistente te ayudará a configurar las API keys para:');
    console.log(`  ${Colors.green}1. OpenWeatherMap${Colors.reset} - Datos meteorológicos (GRATIS)`);
    console.log(`  ${Colors.green}2. N2YO${Colors.reset} - Tracking de satélites (GRATIS)`);
    console.log(`  ${Colors.yellow}3. OpenAI${Colors.reset} - Análisis IA avanzado (PAGO)\n`);
    
    printInfo('Prioridad: OpenWeatherMap > N2YO > OpenAI');
    printWarning('Puedes omitir cualquiera - El sistema funciona sin ellas\n');
    
    const start = await question('¿Continuar? (S/n): ');
    if (start.toLowerCase() === 'n') {
        console.log('Configuración cancelada\n');
        rl.close();
        return;
    }
    
    // Leer configuración actual
    const env = readEnvFile();
    
    // Configurar cada API
    env.OPENWEATHERMAP_API_KEY = await configureOpenWeatherMap(env);
    env.N2YO_API_KEY = await configureN2YO(env);
    env.OPENAI_API_KEY = await configureOpenAI(env);
    
    // Guardar configuración
    printHeader('💾 Guardando Configuración');
    
    const success = writeEnvFile(env);
    
    if (success) {
        console.log(`${Colors.green}${Colors.bright}`);
        console.log('╔════════════════════════════════════════════════════════════════════╗');
        console.log('║          ✅ CONFIGURACIÓN COMPLETADA                              ║');
        console.log('╚════════════════════════════════════════════════════════════════════╝');
        console.log(Colors.reset);
        
        console.log('\n📊 APIs configuradas:');
        if (env.OPENWEATHERMAP_API_KEY) printSuccess('OpenWeatherMap');
        else printWarning('OpenWeatherMap - no configurado');
        
        if (env.N2YO_API_KEY) printSuccess('N2YO');
        else printWarning('N2YO - no configurado');
        
        if (env.OPENAI_API_KEY) printSuccess('OpenAI');
        else printWarning('OpenAI - no configurado');
        
        console.log('\n📝 Próximos pasos:\n');
        printStep(1, 'Verificar las API keys:');
        console.log(`   ${Colors.cyan}node server/scripts/testApiKeys.js${Colors.reset}\n`);
        
        printStep(2, 'Reiniciar el servidor:');
        console.log(`   ${Colors.cyan}cd server && npm run dev${Colors.reset}\n`);
        
        printStep(3, 'Subir una imagen de prueba desde el dashboard\n');
        
        console.log(`${Colors.blue}Documentación completa: docs/API_KEYS_SETUP.md${Colors.reset}\n`);
        
    } else {
        printError('Error guardando configuración');
    }
    
    rl.close();
}

// Ejecutar
main().catch(error => {
    printError(`Error inesperado: ${error.message}`);
    rl.close();
    process.exit(1);
});
