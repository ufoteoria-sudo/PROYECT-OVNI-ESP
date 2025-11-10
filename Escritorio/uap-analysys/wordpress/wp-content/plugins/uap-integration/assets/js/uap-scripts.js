/**
 * UAP Integration - JavaScript
 */

(function($) {
    'use strict';
    
    const API_URL = uapConfig.apiUrl;
    
    /**
     * Inicialización al cargar el documento
     */
    $(document).ready(function() {
        // Si existe el contenedor de biblioteca, cargarla
        if ($('#uap-biblioteca').length) {
            loadBiblioteca();
        }
        
        // Si existe el formulario de reporte, configurarlo
        if ($('#uap-report-form').length) {
            setupReportForm();
        }
        
        // Si existe la galería, cargarla
        if ($('#uap-galeria').length) {
            loadGaleria();
        }
    });
    
    /**
     * Cargar biblioteca visual con categorías
     */
    function loadBiblioteca() {
        console.log('Cargando biblioteca desde:', API_URL + '/categories');
        
        // Cargar categorías
        $.ajax({
            url: API_URL + '/categories',
            method: 'GET',
            success: function(response) {
                console.log('Respuesta de categorías:', response);
                
                // La API devuelve {success: true, data: [...]}
                const categories = response.data || response;
                
                if (categories && categories.length > 0) {
                    console.log('Categorías cargadas:', categories.length);
                    renderCategoryTabs(categories);
                    loadCategoryData(categories[0].slug);
                } else {
                    console.error('No hay categorías en la respuesta');
                    showError('No hay categorías disponibles');
                }
            },
            error: function(xhr, status, error) {
                console.error('Error cargando categorías:', error, xhr);
                showError('Error al conectar con el servidor UAP. Verifica que esté corriendo en ' + API_URL);
            }
        });
    }
    
    /**
     * Renderizar tabs de categorías
     */
    function renderCategoryTabs(categories) {
        const tabsContainer = $('#categoryTabs');
        tabsContainer.empty();
        
        categories.forEach((category, index) => {
            const isActive = index === 0 ? 'active' : '';
            const tab = `
                <li class="nav-item" role="presentation">
                    <button 
                        class="nav-link ${isActive}" 
                        id="tab-${category.slug}" 
                        data-bs-toggle="tab" 
                        data-category="${category.slug}"
                        type="button" 
                        role="tab"
                    >
                        ${category.icon} ${category.name}
                    </button>
                </li>
            `;
            tabsContainer.append(tab);
        });
        
        // Event listener para cambio de tabs
        $('.nav-link[data-category]').on('click', function() {
            const categorySlug = $(this).data('category');
            loadCategoryData(categorySlug);
        });
    }
    
    /**
     * Cargar datos de una categoría
     */
    function loadCategoryData(categorySlug) {
        console.log('Cargando datos para categoría:', categorySlug);
        
        $('#loading').removeClass('d-none');
        $('#cards-container').empty();
        $('#error-message').addClass('d-none');
        
        // Determinar el endpoint según el tipo
        const endpoints = [
            API_URL + '/library/objects',
            API_URL + '/library/phenomena'
        ];
        
        Promise.all(endpoints.map(url => 
            fetch(url)
                .then(res => res.ok ? res.json() : {data: []})
                .then(data => {
                    // Manejar tanto {data: [...]} como [...] directo
                    return data.data || data || [];
                })
                .catch(() => [])
        ))
        .then(([objects, phenomena]) => {
            console.log('Objetos cargados:', objects.length, 'Fenómenos:', phenomena.length);
            
            const allItems = [...objects, ...phenomena];
            const filteredItems = allItems.filter(item => item.category === categorySlug);
            
            console.log('Items filtrados para', categorySlug, ':', filteredItems.length);
            
            $('#loading').addClass('d-none');
            
            if (filteredItems.length > 0) {
                renderCards(filteredItems);
            } else {
                $('#cards-container').html(`
                    <div class="col-12 text-center py-5">
                        <p class="text-muted">No hay elementos en esta categoría aún.</p>
                        <p class="text-muted small">Total de items en BD: ${allItems.length}</p>
                    </div>
                `);
            }
        })
        .catch(error => {
            console.error('Error cargando datos:', error);
            $('#loading').addClass('d-none');
            showError('Error al cargar los datos de la categoría: ' + error.message);
        });
    }
    
    /**
     * Renderizar tarjetas
     */
    function renderCards(items) {
        const container = $('#cards-container');
        container.empty();
        
        items.forEach((item, index) => {
            const imageUrl = item.image || item.imageUrl || 'https://via.placeholder.com/300x200?text=UAP';
            const name = item.name || item.title || 'Sin nombre';
            const description = item.description || 'Sin descripción';
            const location = item.location || 'Ubicación desconocida';
            const date = item.date ? new Date(item.date).toLocaleDateString('es-ES') : 'Fecha desconocida';
            
            const card = `
                <div class="col" style="animation-delay: ${index * 0.1}s">
                    <div class="card uap-card shadow-sm h-100">
                        <img src="${imageUrl}" class="card-img-top uap-card-img" alt="${name}">
                        <div class="card-body uap-card-body">
                            <h5 class="card-title">${name}</h5>
                            <p class="card-text text-muted small">${description.substring(0, 100)}${description.length > 100 ? '...' : ''}</p>
                            <div class="d-flex justify-content-between align-items-center mt-2">
                                <span class="badge uap-badge bg-primary">${location}</span>
                                <small class="text-muted">${date}</small>
                            </div>
                        </div>
                    </div>
                </div>
            `;
            container.append(card);
        });
    }
    
    /**
     * Configurar formulario de reporte
     */
    function setupReportForm() {
        $('#uap-report-form').on('submit', function(e) {
            e.preventDefault();
            
            const submitBtn = $('#submit-btn');
            const submitText = $('#submit-text');
            const submitSpinner = $('#submit-spinner');
            const messageDiv = $('#report-message');
            
            // Deshabilitar botón y mostrar spinner
            submitBtn.prop('disabled', true);
            submitText.addClass('d-none');
            submitSpinner.removeClass('d-none');
            messageDiv.addClass('d-none');
            
            // Recopilar datos del formulario
            const formData = {
                location: $('#location').val(),
                date: $('#date').val(),
                time: $('#time').val(),
                description: $('#description').val(),
                email: $('#email').val(),
                source: 'wordpress',
                status: 'pending'
            };
            
            // Enviar al servidor
            $.ajax({
                url: API_URL + '/reports',
                method: 'POST',
                contentType: 'application/json',
                data: JSON.stringify(formData),
                success: function(response) {
                    messageDiv
                        .removeClass('d-none alert-danger')
                        .addClass('alert-success')
                        .html('<strong>¡Éxito!</strong> Tu reporte ha sido enviado correctamente. Te contactaremos pronto.');
                    
                    // Limpiar formulario
                    $('#uap-report-form')[0].reset();
                },
                error: function(xhr, status, error) {
                    console.error('Error enviando reporte:', error);
                    messageDiv
                        .removeClass('d-none alert-success')
                        .addClass('alert-danger')
                        .html('<strong>Error:</strong> No se pudo enviar el reporte. Por favor, intenta nuevamente.');
                },
                complete: function() {
                    // Rehabilitar botón
                    submitBtn.prop('disabled', false);
                    submitText.removeClass('d-none');
                    submitSpinner.addClass('d-none');
                }
            });
        });
    }
    
    /**
     * Cargar galería de análisis
     */
    function loadGaleria() {
        console.log('Cargando galería de análisis desde:', API_URL + '/analysis');
        
        $.ajax({
            url: API_URL + '/analysis',
            method: 'GET',
            success: function(response) {
                console.log('Respuesta de análisis:', response);
                
                const analyses = response.data || response;
                
                $('#galeria-loading').addClass('d-none');
                
                if (analyses && analyses.length > 0) {
                    console.log('Análisis cargados:', analyses.length);
                    renderAnalysisCards(analyses);
                } else {
                    console.log('No hay análisis disponibles');
                    $('#galeria-grid').html(`
                        <div class="col-12 text-center py-5">
                            <p class="text-muted">No hay análisis públicos disponibles aún.</p>
                        </div>
                    `);
                }
            },
            error: function(xhr, status, error) {
                console.error('Error cargando análisis:', error, xhr);
                $('#galeria-loading').addClass('d-none');
                $('#galeria-error').removeClass('d-none').text('Error al cargar análisis: ' + error);
            }
        });
    }
    
    /**
     * Renderizar tarjetas de análisis
     */
    function renderAnalysisCards(analyses) {
        const container = $('#galeria-grid');
        container.empty();
        
        analyses.forEach((analysis, index) => {
            const confidence = analysis.confidence || analysis.overallConfidence || 0;
            const imageUrl = analysis.imageUrl || 'https://via.placeholder.com/400x300?text=Analysis';
            const title = analysis.title || `Análisis #${analysis._id}`;
            const date = analysis.createdAt ? new Date(analysis.createdAt).toLocaleDateString('es-ES') : 'Fecha desconocida';
            
            const card = `
                <div class="col">
                    <div class="card analysis-card">
                        <img src="${imageUrl}" class="card-img-top" alt="${title}" style="height: 200px; object-fit: cover;">
                        <div class="card-body">
                            <h5 class="card-title">${title}</h5>
                            <p class="card-text text-muted small">${date}</p>
                            <div class="mb-2">
                                <small class="text-muted">Confianza: ${Math.round(confidence)}%</small>
                                <div class="confidence-bar mt-1">
                                    <div class="confidence-fill" style="width: ${confidence}%"></div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            `;
            container.append(card);
        });
    }
    
    /**
     * Mostrar mensaje de error
     */
    function showError(message) {
        $('#loading').addClass('d-none');
        $('#error-message').removeClass('d-none').text(message);
    }
    
})(jQuery);
