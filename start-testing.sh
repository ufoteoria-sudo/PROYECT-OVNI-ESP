#!/bin/bash

# Script de Inicio Rápido - UAP Analysis Testing
# Este script configura e inicia el sistema completamente

set -e

echo "======================================"
echo "🚀 UAP Analysis System - Testing Setup"
echo "======================================"
echo ""

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 1. Verificar Node.js
echo -e "${BLUE}📋 Verificando requisitos...${NC}"
if ! command -v node &> /dev/null; then
    echo "❌ Node.js no está instalado"
    exit 1
fi
echo -e "${GREEN}✓ Node.js $(node -v) detectado${NC}"

# 2. Instalar dependencias
echo ""
echo -e "${BLUE}📦 Instalando dependencias...${NC}"
cd server
if [ ! -d "node_modules" ]; then
    npm install --quiet
    echo -e "${GREEN}✓ Dependencias instaladas${NC}"
else
    echo -e "${GREEN}✓ Dependencias ya existen${NC}"
fi

# 3. Crear .env si no existe
echo ""
echo -e "${BLUE}⚙️  Configurando variables de entorno...${NC}"
if [ ! -f ".env" ]; then
    cat > .env << EOF
PORT=3000
NODE_ENV=development
EOF
    echo -e "${GREEN}✓ Archivo .env creado${NC}"
else
    echo -e "${GREEN}✓ Archivo .env ya existe${NC}"
fi

# 4. Mostrar credenciales
echo ""
echo -e "${YELLOW}🔐 Credenciales Precargadas:${NC}"
echo "   Admin: ufoteoria@gmail.com / admin123"
echo "   User:  investigador@uap.com / investigador123"

# 5. Mostrar APIs disponibles
echo ""
echo -e "${YELLOW}📚 APIs Gratuitas Disponibles:${NC}"
echo "   • NASA APOD (Astronomy Picture of the Day)"
echo "   • OpenMeteo Weather"
echo "   • CelesTrak Satellites"
echo "   • Wikimedia Commons"

# 6. Iniciar servidor
echo ""
echo -e "${BLUE}🚀 Iniciando servidor...${NC}"
echo -e "${YELLOW}Accede a: http://localhost:3000${NC}"
echo ""

# Verificar si ya hay un servidor corriendo
if lsof -Pi :3000 -sTCP:LISTEN -t >/dev/null ; then
    echo -e "${YELLOW}⚠️  Puerto 3000 ya en uso${NC}"
    echo "   Comando para liberar: killall node"
    exit 1
fi

# Iniciar con npm start o npm run dev
if [ -f "package.json" ] && grep -q '"dev"' package.json; then
    npm run dev
else
    npm start
fi
