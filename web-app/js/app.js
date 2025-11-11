// Configuración API
const API_URL = window.location.hostname === 'localhost' 
    ? 'http://localhost:3000/api'
    : 'https://tu-api-backend.com/api'; // Cambiar cuando tengas el backend en producción

// Sistema de navegación
const app = {
    currentPage: 'dashboard',
    
    init() {
        this.setupNavigation();
        this.loadPage('dashboard');
    },
    
    setupNavigation() {
        // Navegación por clicks en el sidebar
        document.querySelectorAll('.nav-link').forEach(link => {
            link.addEventListener('click', (e) => {
                const page = link.getAttribute('data-page');
                if (page) {
                    e.preventDefault();
                    this.loadPage(page);
                    
                    // Actualizar clase active
                    document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));
                    link.classList.add('active');
                }
            });
        });
        
        // Navegación por URL hash
        window.addEventListener('hashchange', () => {
            const page = window.location.hash.slice(1) || 'dashboard';
            this.loadPage(page);
        });
    },
    
    loadPage(pageName) {
        this.currentPage = pageName;
        const content = document.getElementById('main-content');
        
        // Mostrar loading
        content.innerHTML = '<div class="loading text-center py-5"><div class="spinner-border text-primary"></div><p class="mt-3">Cargando...</p></div>';
        
        // Cargar contenido de la página
        setTimeout(() => {
            if (typeof Pages[pageName] === 'function') {
                content.innerHTML = Pages[pageName]();
                
                // Ejecutar inicializadores de página si existen
                if (typeof PageInit[pageName] === 'function') {
                    PageInit[pageName]();
                }
            } else {
                content.innerHTML = '<div class="alert alert-warning">Página no encontrada</div>';
            }
        }, 300);
    }
};

// Funciones globales para compatibilidad
function showSection(section) {
    const pageMap = {
        'dashboard': 'dashboard',
        'profile': 'perfil',
        'uploads': 'subir-analisis',
        'reports': 'mis-reportes',
        'biblioteca': 'biblioteca',
        'libraryAdmin': 'admin-biblioteca',
        'training': 'admin-training',
        'siteConfig': 'admin-config'
    };
    
    const page = pageMap[section] || section;
    app.loadPage(page);
}

function logout() {
    if (confirm('¿Estás seguro de que deseas cerrar sesión?')) {
        localStorage.removeItem('token');
        window.location.href = '/';
    }
}

// Inicializar cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', () => {
    app.init();
});

// Utilidades
const utils = {
    async fetchAPI(endpoint, options = {}) {
        try {
            const response = await fetch(`${API_URL}${endpoint}`, {
                headers: {
                    'Content-Type': 'application/json',
                    ...options.headers
                },
                ...options
            });
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            return await response.json();
        } catch (error) {
            console.error('Error en API:', error);
            throw error;
        }
    },
    
    formatDate(date) {
        return new Date(date).toLocaleDateString('es-ES', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    },
    
    showNotification(message, type = 'success') {
        // TODO: Implementar sistema de notificaciones
        console.log(`[${type.toUpperCase()}] ${message}`);
    }
};
