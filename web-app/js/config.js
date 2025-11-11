// Configuración de API
const API_CONFIG = {
  // Cambia esto después de desplegar el backend en Railway/Render
  // API_URL: 'https://tu-backend.railway.app'
  API_URL: window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
    ? 'http://localhost:3000'
    : 'https://TU-BACKEND-EN-RAILWAY.railway.app' // CAMBIAR ESTO
};

// Exportar para uso global
window.API_CONFIG = API_CONFIG;
