<div id="uap-biblioteca" class="uap-container">
    <div class="container-fluid py-4">
        <h2 class="text-center mb-4">📚 Biblioteca Visual UAP</h2>
        
        <!-- Tabs de categorías -->
        <ul class="nav nav-tabs mb-4" id="categoryTabs" role="tablist">
            <!-- Se llenarán dinámicamente vía JavaScript -->
        </ul>
        
        <!-- Contenedor de tarjetas -->
        <div class="tab-content" id="categoryTabContent">
            <div id="loading" class="text-center py-5">
                <div class="spinner-border text-primary" role="status">
                    <span class="visually-hidden">Cargando...</span>
                </div>
                <p class="mt-2">Cargando biblioteca...</p>
            </div>
            
            <div id="error-message" class="alert alert-danger d-none" role="alert">
                Error al cargar los datos. Por favor, verifica que el servidor UAP esté en funcionamiento.
            </div>
            
            <div id="cards-container" class="row row-cols-1 row-cols-md-2 row-cols-lg-3 row-cols-xl-4 g-4">
                <!-- Las tarjetas se cargarán aquí dinámicamente -->
            </div>
        </div>
    </div>
</div>
