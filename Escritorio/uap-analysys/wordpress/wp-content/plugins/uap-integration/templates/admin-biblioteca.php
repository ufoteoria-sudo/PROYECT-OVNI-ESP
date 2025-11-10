<?php
/**
 * Template: Admin - Gestión Biblioteca
 * CRUD completo de objetos UAP
 */

$current_user = wp_get_current_user();
$is_admin = current_user_can('administrator');

if (!$is_admin) {
    echo '<div class="alert alert-danger">Acceso denegado. Solo administradores.</div>';
    return;
}
?>

<div class="uap-dashboard-wrapper">
    <?php include UAP_PLUGIN_DIR . 'templates/sidebar.php'; ?>
    
    <main class="uap-dashboard-content">
        <div class="page-header">
            <h1 class="page-title">⚙️ Administración de Biblioteca Visual</h1>
            <p class="page-subtitle">Gestiona objetos en la biblioteca visual. Los objetos creados aquí se sincronizan automáticamente con el sistema de entrenamiento.</p>
        </div>
        
        <!-- Formulario Añadir Objeto -->
        <div class="admin-section">
            <h3 class="section-title">Añadir Objeto Manual</h3>
            
            <form id="add-object-form" class="admin-form">
                <div class="form-grid">
                    <div class="form-group">
                        <label>Nombre del Objeto *</label>
                        <input type="text" name="name" class="form-control" required placeholder="Ej: F-16 Fighting Falcon">
                    </div>
                    
                    <div class="form-group">
                        <label>Categoría *</label>
                        <select name="category" class="form-control" id="object-category" required>
                            <option value="">Seleccionar...</option>
                            <!-- Se llenará dinámicamente -->
                        </select>
                    </div>
                    
                    <div class="form-group">
                        <label>Tipología/Subtipo</label>
                        <input type="text" name="subtype" class="form-control" placeholder="Subtipo específico del objeto (opcional pero recomendado)">
                    </div>
                </div>
                
                <div class="form-group">
                    <label>Descripción Detallada *</label>
                    <textarea name="description" class="form-control" rows="4" required placeholder="Cuanto más detallada, mejor será el matching"></textarea>
                </div>
                
                <div class="form-group">
                    <label>Palabras Clave (Keywords)</label>
                    <div class="keywords-input">
                        <input type="text" id="keyword-input" class="form-control" placeholder="Escribe y presiona Enter (máx 20 keywords)">
                        <div id="keywords-list" class="keywords-list"></div>
                        <input type="hidden" name="keywords" id="keywords-hidden">
                    </div>
                    <small class="form-text">Máximo 20 keywords para matching</small>
                </div>
                
                <div class="form-group">
                    <label>Patrones Visuales</label>
                    <input type="text" name="visualPatterns" class="form-control" placeholder="Tags descriptivos para comparación visual (separados por comas)">
                </div>
                
                <div class="characteristics-section">
                    <h4>Características (Opcional)</h4>
                    <div class="form-grid">
                        <div class="form-group">
                            <label>Forma</label>
                            <select name="shape" class="form-control">
                                <option value="">Seleccionar...</option>
                                <option value="circular">Circular</option>
                                <option value="triangular">Triangular</option>
                                <option value="cilindrica">Cilíndrica</option>
                                <option value="discoidal">Discoidal</option>
                                <option value="irregular">Irregular</option>
                                <option value="ovoide">Ovoide</option>
                            </select>
                        </div>
                        
                        <div class="form-group">
                            <label>Tamaño</label>
                            <select name="size" class="form-control">
                                <option value="">Seleccionar...</option>
                                <option value="pequeño">Pequeño (&lt;3m)</option>
                                <option value="mediano">Mediano (3-10m)</option>
                                <option value="grande">Grande (10-30m)</option>
                                <option value="muy-grande">Muy Grande (&gt;30m)</option>
                            </select>
                        </div>
                        
                        <div class="form-group">
                            <label>Velocidad</label>
                            <select name="speed" class="form-control">
                                <option value="">Seleccionar...</option>
                                <option value="estatico">Estático</option>
                                <option value="lento">Lento</option>
                                <option value="moderado">Moderado</option>
                                <option value="rapido">Rápido</option>
                                <option value="supersonico">Supersónico</option>
                            </select>
                        </div>
                        
                        <div class="form-group">
                            <label>Luminosidad</label>
                            <select name="luminosity" class="form-control">
                                <option value="">Seleccionar...</option>
                                <option value="sin-luz">Sin luz visible</option>
                                <option value="tenue">Tenue</option>
                                <option value="brillante">Brillante</option>
                                <option value="muy-brillante">Muy brillante</option>
                                <option value="pulsante">Pulsante/Intermitente</option>
                            </select>
                        </div>
                    </div>
                    
                    <div class="form-group">
                        <label>Colores</label>
                        <input type="text" name="colors" class="form-control" placeholder="Colores observados (separados por comas)">
                    </div>
                    
                    <div class="form-group">
                        <label>Comportamiento</label>
                        <input type="text" name="behavior" class="form-control" placeholder="Comportamiento típico (separado por comas)">
                    </div>
                </div>
                
                <div class="form-group">
                    <label>Imágenes de Referencia (máx 5)</label>
                    <input type="file" name="images" id="object-images" class="form-control" accept="image/*" multiple>
                    <small class="form-text">JPG, PNG o WEBP. Máx. 10MB por imagen</small>
                    <div id="image-previews" class="image-previews"></div>
                </div>
                
                <div class="form-actions">
                    <button type="submit" class="btn btn-primary">
                        <span class="btn-icon">💾</span>
                        <span>Guardar Objeto</span>
                    </button>
                    <button type="reset" class="btn btn-secondary">Limpiar Formulario</button>
                </div>
                
                <div id="add-object-message" class="form-message"></div>
            </form>
        </div>
        
        <!-- Lista de Objetos -->
        <div class="admin-section">
            <div class="section-header">
                <h3 class="section-title">Todos los Objetos de Biblioteca <span id="objects-count">(0)</span></h3>
                <div class="section-actions">
                    <input type="text" id="search-objects" class="search-input" placeholder="🔍 Buscar objetos...">
                    <select id="filter-category" class="filter-select">
                        <option value="">Todas las categorías</option>
                    </select>
                </div>
            </div>
            
            <div class="objects-loading" id="objects-loading">
                <div class="spinner"></div>
                <p>Cargando...</p>
            </div>
            
            <div class="objects-grid" id="objects-grid">
                <!-- Se llenará dinámicamente -->
            </div>
        </div>
    </main>
</div>

<script>
(function($) {
    'use strict';
    
    let keywords = [];
    let selectedFiles = [];
    
    $(document).ready(function() {
        loadCategories();
        loadObjects();
        initKeywords();
        initImagePreview();
        initForm();
        initSearch();
    });
    
    function loadCategories() {
        $.ajax({
            url: uapConfig.apiUrl + '/categories',
            success: function(response) {
                const categories = response.data || response;
                const selects = $('#object-category, #filter-category');
                
                categories.forEach(cat => {
                    $('#object-category').append(`<option value="${cat.slug}">${cat.name}</option>`);
                    $('#filter-category').append(`<option value="${cat.slug}">${cat.name}</option>`);
                });
            }
        });
    }
    
    function initKeywords() {
        $('#keyword-input').on('keypress', function(e) {
            if (e.which === 13) {
                e.preventDefault();
                addKeyword($(this).val().trim());
                $(this).val('');
            }
        });
    }
    
    function addKeyword(keyword) {
        if (!keyword || keywords.length >= 20) return;
        if (keywords.includes(keyword)) return;
        
        keywords.push(keyword);
        updateKeywordsList();
    }
    
    function removeKeyword(keyword) {
        keywords = keywords.filter(k => k !== keyword);
        updateKeywordsList();
    }
    
    function updateKeywordsList() {
        const list = $('#keywords-list');
        list.empty();
        
        keywords.forEach(keyword => {
            list.append(`
                <span class="keyword-tag">
                    ${keyword}
                    <button type="button" class="keyword-remove" onclick="removeKeywordGlobal('${keyword}')">×</button>
                </span>
            `);
        });
        
        $('#keywords-hidden').val(keywords.join(','));
    }
    
    window.removeKeywordGlobal = function(keyword) {
        removeKeyword(keyword);
    };
    
    function initImagePreview() {
        $('#object-images').on('change', function() {
            selectedFiles = Array.from(this.files);
            updateImagePreviews();
        });
    }
    
    function updateImagePreviews() {
        const container = $('#image-previews');
        container.empty();
        
        selectedFiles.forEach((file, index) => {
            const reader = new FileReader();
            reader.onload = function(e) {
                container.append(`
                    <div class="preview-item">
                        <img src="${e.target.result}" alt="Preview ${index + 1}">
                        <button type="button" class="preview-remove" onclick="removeImagePreview(${index})">×</button>
                    </div>
                `);
            };
            reader.readAsDataURL(file);
        });
    }
    
    window.removeImagePreview = function(index) {
        selectedFiles.splice(index, 1);
        updateImagePreviews();
    };
    
    function initForm() {
        $('#add-object-form').on('submit', function(e) {
            e.preventDefault();
            
            const formData = new FormData(this);
            formData.delete('images');
            
            selectedFiles.forEach((file, index) => {
                formData.append('images', file);
            });
            
            const message = $('#add-object-message');
            message.removeClass('alert-success alert-danger').hide();
            
            $.ajax({
                url: uapConfig.apiUrl + '/library/objects',
                method: 'POST',
                data: formData,
                processData: false,
                contentType: false,
                success: function(response) {
                    message.addClass('alert alert-success').text('Objeto creado exitosamente').show();
                    $('#add-object-form')[0].reset();
                    keywords = [];
                    selectedFiles = [];
                    updateKeywordsList();
                    updateImagePreviews();
                    loadObjects();
                    
                    setTimeout(() => message.fadeOut(), 3000);
                },
                error: function(xhr) {
                    const error = xhr.responseJSON?.error || 'Error al crear objeto';
                    message.addClass('alert alert-danger').text(error).show();
                }
            });
        });
    }
    
    function loadObjects() {
        $('#objects-loading').show();
        $('#objects-grid').hide();
        
        const category = $('#filter-category').val();
        const search = $('#search-objects').val();
        
        const params = new URLSearchParams();
        if (category) params.append('category', category);
        if (search) params.append('search', search);
        
        $.ajax({
            url: uapConfig.apiUrl + '/library/objects?' + params.toString(),
            success: function(response) {
                const objects = response.data || response;
                
                $('#objects-loading').hide();
                $('#objects-count').text(`(${objects.length})`);
                
                renderObjects(objects);
                $('#objects-grid').show();
            },
            error: function() {
                $('#objects-loading').hide();
                $('#objects-grid').html('<p class="text-center">Error al cargar objetos</p>').show();
            }
        });
    }
    
    function renderObjects(objects) {
        const grid = $('#objects-grid');
        grid.empty();
        
        if (objects.length === 0) {
            grid.html('<p class="text-center text-muted">No hay objetos en la biblioteca</p>');
            return;
        }
        
        objects.forEach(obj => {
            const card = `
                <div class="object-card">
                    <div class="object-image">
                        <img src="${obj.images?.[0] || 'https://via.placeholder.com/300x200'}" alt="${obj.name}">
                    </div>
                    <div class="object-info">
                        <h4 class="object-name">${obj.name}</h4>
                        <p class="object-category">${obj.categoryName || obj.category}</p>
                        <p class="object-description">${obj.description?.substring(0, 100)}...</p>
                        <div class="object-actions">
                            <button class="btn-sm btn-primary" onclick="editObject('${obj._id}')">✏️ Editar</button>
                            <button class="btn-sm btn-danger" onclick="deleteObject('${obj._id}')">🗑️ Eliminar</button>
                        </div>
                    </div>
                </div>
            `;
            grid.append(card);
        });
    }
    
    function initSearch() {
        let searchTimeout;
        $('#search-objects').on('input', function() {
            clearTimeout(searchTimeout);
            searchTimeout = setTimeout(() => loadObjects(), 500);
        });
        
        $('#filter-category').on('change', () => loadObjects());
    }
    
    window.editObject = function(id) {
        alert('Función de edición en desarrollo. ID: ' + id);
    };
    
    window.deleteObject = function(id) {
        if (!confirm('¿Estás seguro de eliminar este objeto?')) return;
        
        $.ajax({
            url: uapConfig.apiUrl + '/library/objects/' + id,
            method: 'DELETE',
            success: function() {
                alert('Objeto eliminado exitosamente');
                loadObjects();
            },
            error: function() {
                alert('Error al eliminar objeto');
            }
        });
    };
    
})(jQuery);
</script>
