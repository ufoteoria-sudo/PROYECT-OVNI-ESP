#!/bin/bash

echo "🚀 INICIANDO UAP ANALYSIS SYSTEM"
echo "================================="
echo ""

# Detener procesos anteriores
echo "🛑 Deteniendo procesos anteriores..."
pkill -f "node app.js" 2>/dev/null
pkill -f "http.server 8080" 2>/dev/null
sleep 1

# Iniciar Backend
echo ""
echo "1️⃣ Iniciando Backend (Node.js)..."
cd /home/roberto/Escritorio/uap-analysys/server
nohup node app.js > server.log 2>&1 &
BACKEND_PID=$!
echo "   ✅ Backend iniciado (PID: $BACKEND_PID)"

# Esperar a que el backend esté listo
echo "   ⏳ Esperando a que el backend esté listo..."
sleep 3

# Verificar backend
if curl -s http://localhost:3000/api/users 2>/dev/null | grep -q "error"; then
    echo "   ✅ Backend operativo en puerto 3000"
else
    echo "   ⚠️  Backend puede no estar respondiendo correctamente"
fi

# Iniciar Frontend
echo ""
echo "2️⃣ Iniciando Frontend (HTTP Server)..."
cd /home/roberto/Escritorio/uap-analysys/frontend
python3 -m http.server 8080 > frontend.log 2>&1 &
FRONTEND_PID=$!
echo "   ✅ Frontend iniciado (PID: $FRONTEND_PID)"

sleep 1

echo ""
echo "✅ Sistema iniciado correctamente"
echo ""
echo "🌐 Accede al sistema en:"
echo "   http://localhost:8080/login.html"
echo ""
echo "📋 Para verificar el estado:"
echo "   ./check-services.sh"
echo ""
echo "🛑 Para detener todos los servicios:"
echo "   ./stop-services.sh"
echo ""
