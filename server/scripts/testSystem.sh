#!/bin/bash

# Script de prueba completa del sistema UAP
# Incluye: Backend, Frontend, Autenticación

echo "🚀 UAP Analysis System - Test Completo"
echo "======================================"
echo ""

# Colores
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Variables
BACKEND_URL="http://localhost:3000"
FRONTEND_URL="http://localhost:8000"

# Función para verificar servicios
check_service() {
    local url=$1
    local name=$2
    
    if curl -s --head --request GET "$url" | grep "200\|301\|302" > /dev/null; then
        echo -e "${GREEN}✓${NC} $name está corriendo"
        return 0
    else
        echo -e "${RED}✗${NC} $name NO está disponible"
        return 1
    fi
}

# 1. Verificar que los servicios estén corriendo
echo "1. Verificando servicios..."
check_service "$BACKEND_URL/api/users" "Backend (puerto 3000)"
BACKEND_STATUS=$?

check_service "$FRONTEND_URL" "Frontend (puerto 8000)"
FRONTEND_STATUS=$?

if [ $BACKEND_STATUS -ne 0 ]; then
    echo -e "${YELLOW}⚠${NC} Iniciando backend..."
    cd ../server
    nohup node app.js > server.log 2>&1 &
    sleep 3
fi

if [ $FRONTEND_STATUS -ne 0 ]; then
    echo -e "${YELLOW}⚠${NC} Iniciando frontend..."
    cd ../frontend
    nohup python3 -m http.server 8000 > frontend.log 2>&1 &
    sleep 2
fi

echo ""

# 2. Test de endpoints de autenticación
echo "2. Probando endpoints de autenticación..."

# Test: Registro de usuario
echo -n "   - Registro de usuario: "
REGISTER_RESPONSE=$(curl -s -X POST "$BACKEND_URL/api/auth/register" \
  -H "Content-Type: application/json" \
  -d '{
    "username": "testuser'$RANDOM'",
    "email": "test'$RANDOM'@uap.com",
    "password": "Test123!",
    "firstName": "Test",
    "lastName": "User"
  }')

if echo "$REGISTER_RESPONSE" | grep -q "token"; then
    echo -e "${GREEN}✓ OK${NC}"
    TEST_TOKEN=$(echo $REGISTER_RESPONSE | grep -o '"token":"[^"]*"' | cut -d'"' -f4)
else
    echo -e "${RED}✗ FAIL${NC}"
fi

# Test: Login
echo -n "   - Login con credenciales válidas: "
LOGIN_RESPONSE=$(curl -s -X POST "$BACKEND_URL/api/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@uap.com","password":"Admin123!"}')

if echo "$LOGIN_RESPONSE" | grep -q "token"; then
    echo -e "${GREEN}✓ OK${NC}"
    ADMIN_TOKEN=$(echo $LOGIN_RESPONSE | grep -o '"token":"[^"]*"' | cut -d'"' -f4)
else
    echo -e "${RED}✗ FAIL${NC}"
fi

# Test: Obtener usuario autenticado
echo -n "   - Obtener usuario autenticado (/me): "
ME_RESPONSE=$(curl -s -X GET "$BACKEND_URL/api/auth/me" \
  -H "Authorization: Bearer $ADMIN_TOKEN")

if echo "$ME_RESPONSE" | grep -q "username"; then
    echo -e "${GREEN}✓ OK${NC}"
else
    echo -e "${RED}✗ FAIL${NC}"
fi

# Test: Acceso sin token (debe fallar)
echo -n "   - Bloqueo sin token (debe fallar): "
NO_TOKEN_RESPONSE=$(curl -s -X GET "$BACKEND_URL/api/users")

if echo "$NO_TOKEN_RESPONSE" | grep -q "No hay token"; then
    echo -e "${GREEN}✓ OK (bloqueado correctamente)${NC}"
else
    echo -e "${RED}✗ FAIL (debería estar bloqueado)${NC}"
fi

# Test: Acceso con token
echo -n "   - Acceso con token válido: "
WITH_TOKEN_RESPONSE=$(curl -s -X GET "$BACKEND_URL/api/users" \
  -H "Authorization: Bearer $ADMIN_TOKEN")

if echo "$WITH_TOKEN_RESPONSE" | grep -q "username"; then
    echo -e "${GREEN}✓ OK${NC}"
else
    echo -e "${RED}✗ FAIL${NC}"
fi

echo ""

# 3. Test de archivos frontend
echo "3. Verificando archivos frontend..."
FRONTEND_FILES=("index.html" "login.html" "register.html" "dashboard.html" "admin-users.html")

for file in "${FRONTEND_FILES[@]}"; do
    echo -n "   - $file: "
    if curl -s --head "$FRONTEND_URL/$file" | grep "200" > /dev/null; then
        echo -e "${GREEN}✓ OK${NC}"
    else
        echo -e "${RED}✗ FAIL${NC}"
    fi
done

echo ""

# 4. Resumen
echo "======================================"
echo "📊 Resumen de Pruebas"
echo "======================================"
echo ""
echo -e "${GREEN}Backend:${NC} $BACKEND_URL"
echo -e "${GREEN}Frontend:${NC} $FRONTEND_URL"
echo ""
echo "🔐 Credenciales de prueba:"
echo "   Admin:"
echo "   - Email: admin@uap.com"
echo "   - Password: Admin123!"
echo ""
echo "   Demo:"
echo "   - Email: demo@uap.com"
echo "   - Password: Demo123!"
echo ""
echo "🌐 URLs de acceso:"
echo "   - Frontend: http://localhost:8000"
echo "   - Login: http://localhost:8000/login.html"
echo "   - Register: http://localhost:8000/register.html"
echo "   - Dashboard: http://localhost:8000/dashboard.html"
echo ""
echo "✅ Tests completados!"
