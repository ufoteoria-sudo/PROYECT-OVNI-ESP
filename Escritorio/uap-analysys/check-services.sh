#!/bin/bash

echo "🔍 VERIFICACIÓN DE SERVICIOS UAP ANALYSIS SYSTEM"
echo "================================================"
echo ""

# Backend
echo "1️⃣ Backend (Node.js - Puerto 3000)"
echo "-----------------------------------"
if ps aux | grep "node app.js" | grep -v grep > /dev/null; then
    echo "✅ Servidor Node.js: CORRIENDO"
    PID=$(ps aux | grep "node app.js" | grep -v grep | awk '{print $2}')
    echo "   PID: $PID"
else
    echo "❌ Servidor Node.js: NO ESTÁ CORRIENDO"
    echo "   Iniciando..."
    cd /home/roberto/Escritorio/uap-analysys/server
    nohup node app.js > server.log 2>&1 &
    sleep 2
    echo "   ✅ Iniciado"
fi

# Verificar conexión
if curl -s http://localhost:3000/api/users 2>/dev/null | grep -q "error"; then
    echo "✅ Backend responde correctamente"
else
    echo "⚠️  Backend no responde como esperado"
fi

echo ""

# Frontend
echo "2️⃣ Frontend (Python HTTP Server - Puerto 8080)"
echo "----------------------------------------------"
if ps aux | grep "http.server 8080" | grep -v grep > /dev/null; then
    echo "✅ Servidor Frontend: CORRIENDO"
    PID=$(ps aux | grep "http.server 8080" | grep -v grep | awk '{print $2}')
    echo "   PID: $PID"
else
    echo "❌ Servidor Frontend: NO ESTÁ CORRIENDO"
    echo "   Iniciando..."
    cd /home/roberto/Escritorio/uap-analysys/frontend
    python3 -m http.server 8080 > frontend.log 2>&1 &
    sleep 1
    echo "   ✅ Iniciado"
fi

echo ""

# MongoDB
echo "3️⃣ MongoDB"
echo "----------"
if ps aux | grep mongod | grep -v grep > /dev/null; then
    echo "✅ MongoDB: CORRIENDO"
else
    echo "⚠️  MongoDB: Estado desconocido (puede estar corriendo como servicio)"
fi

echo ""
echo "📊 RESUMEN DE PUERTOS"
echo "--------------------"
netstat -tlnp 2>/dev/null | grep -E ":(3000|8080)" || ss -tlnp 2>/dev/null | grep -E ":(3000|8080)"

echo ""
echo "🌐 URLs DE ACCESO"
echo "-----------------"
echo "Frontend Login:    http://localhost:8080/login.html"
echo "Frontend Dashboard: http://localhost:8080/dashboard.html"
echo "Backend API:       http://localhost:3000/api/"
echo ""
echo "✅ Verificación completada"
