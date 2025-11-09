#!/bin/bash

# Script de prueba del Sistema de Reportes PDF
# Este script prueba la funcionalidad completa de generación de reportes

API_URL="http://localhost:3000"

echo "========================================="
echo "PRUEBA DEL SISTEMA DE REPORTES PDF"
echo "========================================="
echo ""

# Paso 1: Login
echo "📝 Paso 1: Autenticación..."
LOGIN_RESPONSE=$(curl -s -X POST "$API_URL/api/auth/login" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@uap.com",
    "password": "Admin123!"
  }')

TOKEN=$(echo $LOGIN_RESPONSE | grep -o '"token":"[^"]*' | cut -d'"' -f4)

if [ -z "$TOKEN" ]; then
  echo "❌ Error: No se pudo obtener el token"
  echo "Respuesta: $LOGIN_RESPONSE"
  exit 1
fi

echo "✅ Autenticado correctamente"
echo ""

# Paso 2: Obtener primer análisis completado
echo "📊 Paso 2: Obteniendo análisis completado..."
ANALYSIS=$(curl -s "$API_URL/api/analyze?status=completed&limit=1" \
  -H "Authorization: Bearer $TOKEN")

ANALYSIS_ID=$(echo $ANALYSIS | grep -o '"_id":"[^"]*' | head -1 | cut -d'"' -f4)

if [ -z "$ANALYSIS_ID" ]; then
  echo "❌ Error: No hay análisis completados disponibles"
  echo "Por favor, sube y analiza una imagen primero"
  exit 1
fi

echo "✅ Análisis encontrado: $ANALYSIS_ID"
echo ""

# Paso 3: Crear reporte
echo "📄 Paso 3: Creando reporte..."
REPORT_RESPONSE=$(curl -s -X POST "$API_URL/api/reports" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d "{
    \"analysisId\": \"$ANALYSIS_ID\",
    \"situation\": \"Se observó un objeto luminoso no identificado moviéndose a gran velocidad en dirección norte. El objeto emitía una luz brillante y realizaba maniobras imposibles para aeronaves convencionales.\",
    \"location\": \"Madrid, España (40.4168° N, 3.7038° O)\",
    \"datetime\": \"$(date -u +"%Y-%m-%dT%H:%M:%S.000Z")\",
    \"witnesses\": 3,
    \"duration\": \"Aproximadamente 5 minutos\",
    \"weatherConditions\": \"Cielo despejado, sin nubes\",
    \"visibility\": \"Excelente, más de 10 km\",
    \"additionalNotes\": \"El fenómeno fue grabado en vídeo por uno de los testigos. No se escucharon sonidos asociados al objeto.\"
  }")

REPORT_ID=$(echo $REPORT_RESPONSE | grep -o '"_id":"[^"]*' | cut -d'"' -f4)

if [ -z "$REPORT_ID" ]; then
  echo "❌ Error: No se pudo crear el reporte"
  echo "Respuesta: $REPORT_RESPONSE"
  exit 1
fi

echo "✅ Reporte creado: $REPORT_ID"
echo ""

# Paso 4: Generar PDF
echo "🖨️  Paso 4: Generando PDF..."
GENERATE_RESPONSE=$(curl -s -X POST "$API_URL/api/reports/$REPORT_ID/generate" \
  -H "Authorization: Bearer $TOKEN")

PDF_URL=$(echo $GENERATE_RESPONSE | grep -o '"downloadUrl":"[^"]*' | cut -d'"' -f4)

if [ -z "$PDF_URL" ]; then
  echo "❌ Error: No se pudo generar el PDF"
  echo "Respuesta: $GENERATE_RESPONSE"
  exit 1
fi

echo "✅ PDF generado exitosamente"
echo ""

# Paso 5: Descargar PDF
echo "📥 Paso 5: Descargando PDF..."
curl -s "$API_URL$PDF_URL" \
  -H "Authorization: Bearer $TOKEN" \
  -o "test-report.pdf"

if [ -f "test-report.pdf" ]; then
  PDF_SIZE=$(wc -c < "test-report.pdf")
  if [ $PDF_SIZE -gt 1000 ]; then
    echo "✅ PDF descargado: test-report.pdf ($PDF_SIZE bytes)"
    echo ""
    echo "========================================="
    echo "✅ PRUEBA COMPLETADA EXITOSAMENTE"
    echo "========================================="
    echo ""
    echo "📄 Reporte generado: $REPORT_ID"
    echo "📥 PDF guardado en: test-report.pdf"
    echo ""
    echo "Para ver el PDF: xdg-open test-report.pdf"
  else
    echo "❌ Error: El PDF descargado parece estar corrupto"
    exit 1
  fi
else
  echo "❌ Error: No se pudo descargar el PDF"
  exit 1
fi
