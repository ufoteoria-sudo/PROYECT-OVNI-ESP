#!/bin/bash

echo "🔍 Verificando estado del servidor UAP Analysis System..."
echo ""

# Verificar que el servidor esté corriendo
echo "1. Verificando puerto 3000..."
if lsof -Pi :3000 -sTCP:LISTEN -t >/dev/null ; then
    echo "✅ Servidor corriendo en puerto 3000"
else
    echo "❌ Servidor NO está corriendo en puerto 3000"
    echo "   Ejecuta: cd server && node app.js &"
    exit 1
fi

# Verificar frontend
echo ""
echo "2. Verificando puerto 8000..."
if lsof -Pi :8000 -sTCP:LISTEN -t >/dev/null ; then
    echo "✅ Frontend corriendo en puerto 8000"
else
    echo "❌ Frontend NO está corriendo en puerto 8000"
    echo "   Ejecuta: cd frontend && python3 -m http.server 8000 &"
fi

# Probar endpoint de usuarios
echo ""
echo "3. Probando endpoint /api/users..."
response=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/api/users)
if [ "$response" = "401" ]; then
    echo "✅ API responde correctamente (401 sin token es esperado)"
else
    echo "⚠️  Respuesta: $response"
fi

# Probar login
echo ""
echo "4. Probando login con admin@uap.com..."
login_response=$(curl -s -X POST http://localhost:3000/api/auth/login \
    -H "Content-Type: application/json" \
    -d '{"email":"admin@uap.com","password":"Admin123!"}')

if echo "$login_response" | grep -q "token"; then
    echo "✅ Login funciona correctamente"
    echo ""
    echo "📝 Token generado:"
    echo "$login_response" | grep -o '"token":"[^"]*"' | cut -d'"' -f4 | head -c 50
    echo "..."
else
    echo "❌ Error en login:"
    echo "$login_response"
fi

echo ""
echo "5. Probando análisis IA..."
config_response=$(curl -s http://localhost:3000/api/analyze/config \
    -H "Authorization: Bearer $(echo "$login_response" | grep -o '"token":"[^"]*"' | cut -d'"' -f4)")

if echo "$config_response" | grep -q "huggingface"; then
    echo "✅ Servicio de IA configurado"
    echo "   Provider: Hugging Face"
else
    echo "⚠️  Respuesta: $config_response"
fi

echo ""
echo "========================"
echo "📊 RESUMEN:"
echo "========================"
echo "Backend:  http://localhost:3000 ✅"
echo "Frontend: http://localhost:8000"
echo "Login:    admin@uap.com / Admin123!"
echo ""
echo "Para acceder:"
echo "  🌐 http://localhost:8000/login.html"
echo ""
