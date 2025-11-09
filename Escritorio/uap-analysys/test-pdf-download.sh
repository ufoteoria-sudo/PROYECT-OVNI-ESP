#!/bin/bash

# Test rápido de descarga de PDF con token

API_URL="http://localhost:3000"

echo "🧪 Probando descarga de PDF con autenticación..."
echo ""

# Login
TOKEN=$(curl -s -X POST "$API_URL/api/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@uap.com","password":"Admin123!"}' \
  | grep -o '"token":"[^"]*' | cut -d'"' -f4)

if [ -z "$TOKEN" ]; then
  echo "❌ Error: No se pudo obtener token"
  exit 1
fi

echo "✅ Token obtenido"

# Obtener el reporte más reciente
REPORT_ID=$(curl -s "$API_URL/api/reports?limit=1" \
  -H "Authorization: Bearer $TOKEN" \
  | grep -o '"_id":"[^"]*' | head -1 | cut -d'"' -f4)

if [ -z "$REPORT_ID" ]; then
  echo "❌ No hay reportes disponibles"
  exit 1
fi

echo "✅ Reporte encontrado: $REPORT_ID"

# Descargar PDF
echo "📥 Descargando PDF..."
curl -s "$API_URL/api/reports/$REPORT_ID/download" \
  -H "Authorization: Bearer $TOKEN" \
  -o "test-download-$(date +%s).pdf"

if [ $? -eq 0 ]; then
  echo "✅ PDF descargado exitosamente"
  ls -lh test-download-*.pdf | tail -1
else
  echo "❌ Error al descargar PDF"
  exit 1
fi
