#!/bin/bash
# Script para iniciar el sistema UAP completo

echo "🚀 Iniciando Sistema de Análisis UAP v4.0"
echo "=========================================="

# Verificar que estamos en el directorio correcto
if [ ! -f "app.js" ]; then
    echo "❌ Error: Ejecutar desde directorio server/"
    exit 1
fi

# Detener procesos previos si existen
echo "🔄 Deteniendo procesos previos..."
pkill -f "node app.js" 2>/dev/null
pkill -f "python3 -m http.server 8000" 2>/dev/null
sleep 1

# Iniciar backend
echo "🖥️  Iniciando backend (puerto 3000)..."
node app.js > /tmp/uap-server.log 2>&1 &
BACKEND_PID=$!
sleep 2

# Verificar backend
if curl -s http://localhost:3000/api/users >/dev/null 2>&1; then
    echo "✅ Backend activo (PID: $BACKEND_PID)"
else
    echo "❌ Error: Backend no responde"
    exit 1
fi

# Iniciar frontend
echo "🌐 Iniciando frontend (puerto 8000)..."
cd ../frontend
python3 -m http.server 8000 > /tmp/uap-frontend.log 2>&1 &
FRONTEND_PID=$!
cd ../server

sleep 1
echo "✅ Frontend activo (PID: $FRONTEND_PID)"

echo ""
echo "=========================================="
echo "✅ Sistema iniciado correctamente"
echo ""
echo "📍 URLs:"
echo "   Backend:  http://localhost:3000"
echo "   Frontend: http://localhost:8000"
echo ""
echo "📝 Logs:"
echo "   Backend:  /tmp/uap-server.log"
echo "   Frontend: /tmp/uap-frontend.log"
echo ""
echo "🧪 Tests:"
echo "   Suite:    node test-suite.js"
echo "   Visual:   node test-visual-analysis.js"
echo ""
echo "🛑 Detener:"
echo "   pkill -f 'node app.js'"
echo "   pkill -f 'python3 -m http.server 8000'"
echo "=========================================="
