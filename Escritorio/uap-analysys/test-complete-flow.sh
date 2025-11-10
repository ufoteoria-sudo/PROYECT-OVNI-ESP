#!/bin/bash

# =====================================================
# Script de Prueba Integral del Sistema UAP Analysis
# =====================================================

API_URL="http://localhost:3000/api"
FRONTEND_URL="http://localhost:8888"

echo "======================================"
echo "  PRUEBA INTEGRAL - SISTEMA UAP"
echo "======================================"
echo ""

# Colores para output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 1. Verificar servidores
echo -e "${YELLOW}[1/8] Verificando servidores...${NC}"
if curl -s http://localhost:3000/api/admin/analyses > /dev/null 2>&1; then
    echo -e "${GREEN}✓ Backend corriendo en puerto 3000${NC}"
else
    echo -e "${RED}✗ Backend NO responde${NC}"
    exit 1
fi

if curl -s http://localhost:8888 > /dev/null 2>&1; then
    echo -e "${GREEN}✓ Frontend corriendo en puerto 8888${NC}"
else
    echo -e "${RED}✗ Frontend NO responde${NC}"
    exit 1
fi
echo ""

# 2. Login como admin
echo -e "${YELLOW}[2/8] Autenticando como admin...${NC}"
LOGIN_RESPONSE=$(curl -s -X POST "$API_URL/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@uap.com","password":"admin123"}')

TOKEN=$(echo $LOGIN_RESPONSE | grep -o '"token":"[^"]*' | cut -d'"' -f4)

if [ -z "$TOKEN" ]; then
    echo -e "${RED}✗ Error de autenticación${NC}"
    echo "Respuesta: $LOGIN_RESPONSE"
    exit 1
fi

echo -e "${GREEN}✓ Token obtenido${NC}"
echo "Token: ${TOKEN:0:20}..."
echo ""

# 3. Verificar imágenes disponibles
echo -e "${YELLOW}[3/8] Buscando imágenes para análisis...${NC}"
IMAGE_FILE=$(ls -1 server/uploads/images/*.jpg 2>/dev/null | head -1)

if [ -z "$IMAGE_FILE" ]; then
    IMAGE_FILE=$(ls -1 server/uploads/images/*.jpeg 2>/dev/null | head -1)
fi

if [ -z "$IMAGE_FILE" ]; then
    echo -e "${RED}✗ No hay imágenes disponibles en server/uploads/images/${NC}"
    exit 1
fi

echo -e "${GREEN}✓ Imagen encontrada: $(basename $IMAGE_FILE)${NC}"
echo ""

# 4. Iniciar análisis
echo -e "${YELLOW}[4/8] Iniciando análisis de imagen...${NC}"
ANALYZE_RESPONSE=$(curl -s -X POST "$API_URL/analyze" \
  -H "Authorization: Bearer $TOKEN" \
  -F "file=@$IMAGE_FILE")

ANALYSIS_ID=$(echo $ANALYZE_RESPONSE | grep -o '"analysisId":"[^"]*' | cut -d'"' -f4)

if [ -z "$ANALYSIS_ID" ]; then
    ANALYSIS_ID=$(echo $ANALYZE_RESPONSE | grep -o '"_id":"[^"]*' | cut -d'"' -f4)
fi

if [ -z "$ANALYSIS_ID" ]; then
    echo -e "${RED}✗ Error iniciando análisis${NC}"
    echo "Respuesta: $ANALYZE_RESPONSE"
    exit 1
fi

echo -e "${GREEN}✓ Análisis iniciado con ID: $ANALYSIS_ID${NC}"
echo ""

# 5. Esperar y verificar análisis
echo -e "${YELLOW}[5/8] Esperando finalización del análisis...${NC}"
MAX_ATTEMPTS=30
ATTEMPT=0
STATUS=""

while [ $ATTEMPT -lt $MAX_ATTEMPTS ]; do
    sleep 2
    STATUS_RESPONSE=$(curl -s "$API_URL/analyze/$ANALYSIS_ID/status" \
      -H "Authorization: Bearer $TOKEN")
    
    STATUS=$(echo $STATUS_RESPONSE | grep -o '"status":"[^"]*' | cut -d'"' -f4)
    
    echo -n "."
    
    if [ "$STATUS" = "completed" ]; then
        echo ""
        echo -e "${GREEN}✓ Análisis completado exitosamente${NC}"
        break
    elif [ "$STATUS" = "error" ]; then
        echo ""
        echo -e "${RED}✗ Análisis falló${NC}"
        echo "Respuesta: $STATUS_RESPONSE"
        exit 1
    fi
    
    ATTEMPT=$((ATTEMPT + 1))
done

if [ "$STATUS" != "completed" ]; then
    echo ""
    echo -e "${RED}✗ Timeout esperando análisis (60 segundos)${NC}"
    exit 1
fi
echo ""

# 6. Obtener resultados completos
echo -e "${YELLOW}[6/8] Obteniendo resultados del análisis...${NC}"
RESULTS=$(curl -s "$API_URL/admin/analyses?limit=1" \
  -H "Authorization: Bearer $TOKEN")

# Verificar análisis forense
HAS_FORENSIC=$(echo $RESULTS | grep -o '"forensicAnalysis"')
if [ -n "$HAS_FORENSIC" ]; then
    echo -e "${GREEN}✓ Análisis forense incluido${NC}"
    
    MANIPULATION_SCORE=$(echo $RESULTS | grep -o '"manipulationScore":[0-9]*' | cut -d':' -f2 | head -1)
    VERDICT=$(echo $RESULTS | grep -o '"verdict":"[^"]*' | cut -d'"' -f4 | head -1)
    
    echo "  - Puntuación de manipulación: ${MANIPULATION_SCORE}/100"
    echo "  - Veredicto: $VERDICT"
else
    echo -e "${YELLOW}⚠ Análisis forense no encontrado${NC}"
fi
echo ""

# 7. Convertir a Training
echo -e "${YELLOW}[7/8] Convirtiendo análisis a imagen de entrenamiento...${NC}"
TRAINING_RESPONSE=$(curl -s -X POST "$API_URL/training/from-analysis/$ANALYSIS_ID" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "verifiedCategory": "aircraft_commercial",
    "verifiedType": "Prueba automatizada",
    "additionalNotes": "Conversión desde script de prueba integral"
  }')

TRAINING_ID=$(echo $TRAINING_RESPONSE | grep -o '"_id":"[^"]*' | cut -d'"' -f4)

if [ -z "$TRAINING_ID" ]; then
    echo -e "${RED}✗ Error convirtiendo a training${NC}"
    echo "Respuesta: $TRAINING_RESPONSE"
    exit 1
fi

echo -e "${GREEN}✓ Imagen de entrenamiento creada con ID: $TRAINING_ID${NC}"
echo ""

# 8. Verificar datos forenses en training
echo -e "${YELLOW}[8/8] Verificando datos forenses en training...${NC}"
TRAINING_DATA=$(curl -s "$API_URL/training/$TRAINING_ID" \
  -H "Authorization: Bearer $TOKEN")

# Buscar datos forenses en notes
HAS_FORENSIC_DATA=$(echo $TRAINING_DATA | grep -o '"authenticityScore"')

if [ -n "$HAS_FORENSIC_DATA" ]; then
    echo -e "${GREEN}✓ Datos forenses incluidos en imagen de entrenamiento${NC}"
    
    AUTH_SCORE=$(echo $TRAINING_DATA | grep -o '"authenticityScore":[0-9.]*' | cut -d':' -f2)
    echo "  - Autenticidad: $AUTH_SCORE"
else
    echo -e "${YELLOW}⚠ Datos forenses no encontrados en training${NC}"
fi
echo ""

# Resumen final
echo "======================================"
echo -e "${GREEN}  PRUEBA COMPLETADA EXITOSAMENTE${NC}"
echo "======================================"
echo ""
echo "Resultados:"
echo "  - Analysis ID: $ANALYSIS_ID"
echo "  - Training ID: $TRAINING_ID"
echo "  - Status: $STATUS"
echo ""
echo "Accede al dashboard en: $FRONTEND_URL/dashboard.html"
echo ""
