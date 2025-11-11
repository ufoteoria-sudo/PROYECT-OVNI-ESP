#!/bin/bash

# Script de verificación e inicio del proyecto UAP Analysis System
# Este script verifica los requisitos y ayuda a iniciar el proyecto

echo "🛸 UAP Analysis System - Script de inicio"
echo "========================================"
echo ""

# Colores
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Función para verificar si un comando existe
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Verificar Node.js
echo -n "Verificando Node.js... "
if command_exists node; then
    NODE_VERSION=$(node -v)
    echo -e "${GREEN}✓${NC} $NODE_VERSION"
else
    echo -e "${RED}✗ Node.js no está instalado${NC}"
    echo "Por favor, instala Node.js desde https://nodejs.org/"
    exit 1
fi

# Verificar npm
echo -n "Verificando npm... "
if command_exists npm; then
    NPM_VERSION=$(npm -v)
    echo -e "${GREEN}✓${NC} v$NPM_VERSION"
else
    echo -e "${RED}✗ npm no está instalado${NC}"
    exit 1
fi

# Verificar MongoDB
echo -n "Verificando MongoDB... "
if command_exists mongod; then
    echo -e "${GREEN}✓${NC} MongoDB instalado"
    
    # Verificar si MongoDB está corriendo
    if pgrep -x "mongod" > /dev/null; then
        echo -e "  ${GREEN}✓${NC} MongoDB está corriendo"
    else
        echo -e "  ${YELLOW}⚠${NC} MongoDB no está corriendo"
        echo -e "  ${YELLOW}Inicia MongoDB con: sudo systemctl start mongod${NC}"
    fi
else
    echo -e "${YELLOW}⚠${NC} MongoDB no detectado localmente"
    echo -e "  ${YELLOW}Asegúrate de usar MongoDB Atlas en .env${NC}"
fi

echo ""
echo "Verificando dependencias del backend..."

# Verificar si existe node_modules en server
if [ ! -d "server/node_modules" ]; then
    echo -e "${YELLOW}⚠${NC} Instalando dependencias del backend..."
    cd server
    npm install
    cd ..
    echo -e "${GREEN}✓${NC} Dependencias instaladas"
else
    echo -e "${GREEN}✓${NC} Dependencias ya instaladas"
fi

# Verificar archivo .env
echo -n "Verificando archivo .env... "
if [ -f "server/.env" ]; then
    echo -e "${GREEN}✓${NC} Archivo .env encontrado"
else
    echo -e "${YELLOW}⚠${NC} Archivo .env no encontrado"
    echo "  Copiando .env.example a .env..."
    cp server/.env.example server/.env
    echo -e "  ${GREEN}✓${NC} Archivo .env creado"
    echo -e "  ${YELLOW}⚠${NC} Por favor, revisa y configura server/.env según tu entorno"
fi

echo ""
echo "========================================"
echo "Proyecto verificado y listo para usar"
echo "========================================"
echo ""
echo "Para iniciar el servidor backend:"
echo -e "  ${GREEN}cd server && npm run dev${NC}"
echo ""
echo "Para abrir el frontend:"
echo -e "  ${GREEN}Abrir frontend/index.html en el navegador${NC}"
echo -e "  ${GREEN}O ejecutar: python3 -m http.server 8000 --directory frontend${NC}"
echo ""
echo "API disponible en: http://localhost:3000/api/users"
echo ""
