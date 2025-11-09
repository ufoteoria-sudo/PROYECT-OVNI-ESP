#!/bin/bash

# Script para probar el sistema de autenticación
# Colores para output
GREEN='\033[0;32m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

API_URL="http://localhost:3000/api"

echo -e "${BLUE}=== Test de Autenticación UAP ===${NC}\n"

# 1. Registro de usuario nuevo
echo -e "${BLUE}1. Registrando nuevo usuario...${NC}"
REGISTER_RESPONSE=$(curl -s -X POST $API_URL/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "username":"testauth",
    "email":"testauth@uap.com",
    "password":"Test123!",
    "firstName":"Test",
    "lastName":"Auth"
  }')

echo $REGISTER_RESPONSE | jq '.'
TOKEN=$(echo $REGISTER_RESPONSE | jq -r '.token')

if [ "$TOKEN" != "null" ]; then
  echo -e "${GREEN}✅ Registro exitoso${NC}\n"
else
  echo -e "${RED}❌ Error en registro${NC}\n"
fi

# 2. Login con credenciales
echo -e "${BLUE}2. Login con credenciales...${NC}"
LOGIN_RESPONSE=$(curl -s -X POST $API_URL/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email":"testauth@uap.com",
    "password":"Test123!"
  }')

echo $LOGIN_RESPONSE | jq '.'
TOKEN=$(echo $LOGIN_RESPONSE | jq -r '.token')

if [ "$TOKEN" != "null" ]; then
  echo -e "${GREEN}✅ Login exitoso${NC}\n"
else
  echo -e "${RED}❌ Error en login${NC}\n"
  exit 1
fi

# 3. Obtener datos del usuario autenticado
echo -e "${BLUE}3. Obteniendo datos de usuario autenticado...${NC}"
ME_RESPONSE=$(curl -s -X GET $API_URL/auth/me \
  -H "Authorization: Bearer $TOKEN")

echo $ME_RESPONSE | jq '.'
echo -e "${GREEN}✅ Datos obtenidos${NC}\n"

# 4. Intentar acceder a ruta protegida sin token
echo -e "${BLUE}4. Intentando acceder sin token (debe fallar)...${NC}"
NO_TOKEN_RESPONSE=$(curl -s -X GET $API_URL/users)
echo $NO_TOKEN_RESPONSE | jq '.'

if echo $NO_TOKEN_RESPONSE | grep -q "error"; then
  echo -e "${GREEN}✅ Acceso correctamente bloqueado${NC}\n"
else
  echo -e "${RED}❌ Error: acceso permitido sin token${NC}\n"
fi

# 5. Acceder con token (usuario normal no puede listar usuarios)
echo -e "${BLUE}5. Intentando listar usuarios como usuario normal (debe fallar)...${NC}"
USER_LIST_RESPONSE=$(curl -s -X GET $API_URL/users \
  -H "Authorization: Bearer $TOKEN")

echo $USER_LIST_RESPONSE | jq '.'

if echo $USER_LIST_RESPONSE | grep -q "error"; then
  echo -e "${GREEN}✅ Acceso correctamente bloqueado (no es admin)${NC}\n"
else
  echo -e "${RED}❌ Error: usuario normal puede listar usuarios${NC}\n"
fi

# 6. Login como admin
echo -e "${BLUE}6. Login como administrador...${NC}"
ADMIN_LOGIN_RESPONSE=$(curl -s -X POST $API_URL/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email":"admin@uap.com",
    "password":"Admin123!"
  }')

echo $ADMIN_LOGIN_RESPONSE | jq '.'
ADMIN_TOKEN=$(echo $ADMIN_LOGIN_RESPONSE | jq -r '.token')

if [ "$ADMIN_TOKEN" != "null" ]; then
  echo -e "${GREEN}✅ Login admin exitoso${NC}\n"
else
  echo -e "${RED}❌ Error en login admin${NC}\n"
fi

# 7. Listar usuarios como admin
echo -e "${BLUE}7. Listando usuarios como administrador...${NC}"
ADMIN_LIST_RESPONSE=$(curl -s -X GET $API_URL/users \
  -H "Authorization: Bearer $ADMIN_TOKEN")

echo $ADMIN_LIST_RESPONSE | jq '. | length'
echo -e "${GREEN}✅ Admin puede listar usuarios${NC}\n"

# 8. Cambiar contraseña
echo -e "${BLUE}8. Cambiando contraseña de usuario normal...${NC}"
CHANGE_PASS_RESPONSE=$(curl -s -X PUT $API_URL/auth/change-password \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "currentPassword":"Test123!",
    "newPassword":"NewTest456!"
  }')

echo $CHANGE_PASS_RESPONSE | jq '.'

if echo $CHANGE_PASS_RESPONSE | grep -q "exitosamente"; then
  echo -e "${GREEN}✅ Contraseña cambiada${NC}\n"
else
  echo -e "${RED}❌ Error al cambiar contraseña${NC}\n"
fi

# 9. Login con nueva contraseña
echo -e "${BLUE}9. Login con nueva contraseña...${NC}"
NEW_LOGIN_RESPONSE=$(curl -s -X POST $API_URL/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email":"testauth@uap.com",
    "password":"NewTest456!"
  }')

echo $NEW_LOGIN_RESPONSE | jq '.'

if echo $NEW_LOGIN_RESPONSE | grep -q "token"; then
  echo -e "${GREEN}✅ Login con nueva contraseña exitoso${NC}\n"
else
  echo -e "${RED}❌ Error: nueva contraseña no funciona${NC}\n"
fi

echo -e "${BLUE}=== Tests completados ===${NC}"
