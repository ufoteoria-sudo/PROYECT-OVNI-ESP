#!/bin/bash

echo "🛑 DETENIENDO UAP ANALYSIS SYSTEM"
echo "=================================="
echo ""

# Detener Backend
echo "1️⃣ Deteniendo Backend (Node.js)..."
if pkill -f "node app.js" 2>/dev/null; then
    echo "   ✅ Backend detenido"
else
    echo "   ℹ️  Backend no estaba corriendo"
fi

# Detener Frontend
echo ""
echo "2️⃣ Deteniendo Frontend (HTTP Server)..."
if pkill -f "http.server 8080" 2>/dev/null; then
    echo "   ✅ Frontend detenido"
else
    echo "   ℹ️  Frontend no estaba corriendo"
fi

sleep 1

echo ""
echo "✅ Todos los servicios detenidos"
echo ""
