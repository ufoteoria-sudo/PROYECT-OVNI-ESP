<?php
/**
 * Template: Admin - Entrada de Datos de Entrenamiento
 * Sistema completo de training con grid de imágenes
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
            <h1 class="page-title">🎓 Administrador - Entrada de Datos de Entrenamiento</h1>
            
            <div class="stats-mini">
                <div class="stat-mini">
                    <span class="stat-value" id="total-training">-</span>
                    <span class="stat-label">Total Imágenes</span>
                </div>
                <div class="stat-mini">
                    <span class="stat-value" id="verified-training">-</span>
                    <span class="stat-label">Verificadas</span>
                </div>
                <div class="stat-mini">
                    <span class="stat-value" id="categories-training">-</span>
                    <span class="stat-label">Categorías</span>
                </div>
            </div>
        </div>
        
        <!-- Formulario de Upload -->
        <div class="admin-section">
            <h3 class="section-title">Subir Nueva Imagen de Entrenamiento</h3>
            
            <form id="training-upload-form" class="admin-form">
                <div class="form-grid">
                    <div class="form-group full-width">
                        <label>Imagen *</label>
                        <input type="file" name="image" id="training-image" class="form-control" accept="image/*" required>
                        <small class="form-text">JPG, PNG o WEBP. Máx. 10MB</small>
                        <div id="training-preview" class="training-preview"></div>
                    </div>
                    
                    <div class="form-group">
                        <label>Categoría *</label>
                        <select name="category" class="form-control" id="training-category" required>
                            <option value="">Seleccionar...</option>
                        </select>
                    </div>
                    
                    <div class="form-group">
                        <label>Tipo / Modelo *</label>
                        <input type="text" name="type" class="form-control" required placeholder="Especifica el tipo o modelo específico del objeto">
                    </div>
                    
                    <div class="form-group full-width">
                        <label>Modelo/Variante (Opcional)</label>
                        <input type="text" name="variant" class="form-control" placeholder="Variante o versión específica del tipo">
                    </div>
                </div>
                
                <div class="form-group">
                    <label>Descripción Detallada</label>
                    <textarea name="description" class="form-control" rows="3" placeholder="Cuanto más detallada, mejor será el entrenamiento del algoritmo"></textarea>
                </div>
                
                <div class="form-group">
                    <label>Palabras Clave (Keywords) *</label>
                    <div class="keywords-input">
                        <input type="text" id="training-keyword-input" class="form-control" placeholder="Escribe y presiona Enter">
                        <div id="training-keywords-list" class="keywords-list"></div>
                        <input type="hidden" name="keywords" id="training-keywords-hidden">
                    </div>
                    <small class="form-text">
                        Máximo 20 keywords. Usa palabras clave descriptivas que ayuden al algoritmo a identificar la imagen.<br>
                        <strong>Ejemplos:</strong> esfera, metal, reflectante, luz, brillante, artificial, generado, cgi, render, 3d, fake
                    </small>
                    <div class="keyword-counter">
                        <span id="keyword-count">0</span> / 20 keywords
                    </div>
                </div>
                
                <div class="form-actions">
                    <button type="submit" class="btn btn-primary">
                        <span class="btn-icon">📤</span>
                        <span>Subir Imagen de Entrenamiento</span>
                    </button>
                    <button type="reset" class="btn btn-secondary">Limpiar</button>
                </div>
                
                <div id="training-message" class="form-message"></div>
            </form>
        </div>
        
        <!-- Grid de Imágenes de Entrenamiento -->
        <div class="admin-section">
            <div class="section-header">
                <h3 class="section-title">Imágenes de Entrenamiento</h3>
                <div class="section-actions">
                    <input type="text" id="search-training" class="search-input" placeholder="🔍 Buscar...">
                    <select id="filter-training-category" class="filter-select">
                        <option value="">Todas las categorías</option>
                    </select>
                    <select id="filter-verified" class="filter-select">
                        <option value="">Todos los estados</option>
                        <option value="verified">Verificadas</option>
                        <option value="pending">Pendientes</option>
                    </select>
                </div>
            </div>
            
            <div class="training-loading" id="training-loading">
                <div class="spinner"></div>
                <p>Cargando...</p>
            </div>
            
            <div class="training-grid" id="training-grid">
                <!-- Se llenará dinámicamente -->
            </div>
            
            <div class="pagination" id="training-pagination"></div>
        </div>
    </main>
</div>

<script>
(function($) {
    'use strict';
    
    let trainingKeywords = [];
    let currentPage = 1;
    
    $(document).ready(function() {
        loadCategories();
        loadTrainingImages();
        loadStats();
        initKeywords();
        initForm();
        initFilters();
        initPreview();
    });
    
    function loadCategories() {
        $.ajax({
            url: uapConfig.apiUrl + '/categories',
            success: function(response) {
                const categories = response.data || response;
                
                categories.forEach(cat => {
                    $('#training-category, #filter-training-category').append(
                        `<option value="${cat.slug}">${cat.name}</option>`
                    );
                });
            }
        });
    }
    
    function loadStats() {
        $.ajax({
            url: uapConfig.apiUrl + '/training/stats',
            success: function(response) {
                const stats = response.data || response;
                $('#total-training').text(stats.total || 0);
                $('#verified-training').text(stats.verified || 0);
                $('#categories-training').text(stats.categories || 0);
            }
        });
    }
    
    function initKeywords() {
        $('#training-keyword-input').on('keypress', function(e) {
            if (e.which === 13) {
                e.preventDefault();
                const keyword = $(this).val().trim().toLowerCase();
                addTrainingKeyword(keyword);
                $(this).val('');
            }
        });
    }
    
    function addTrainingKeyword(keyword) {
        if (!keyword || trainingKeywords.length >= 20) return;
        if (trainingKeywords.includes(keyword)) return;
        
        trainingKeywords.push(keyword);
        updateTrainingKeywords();
    }
    
    function removeTrainingKeyword(keyword) {
        trainingKeywords = trainingKeywords.filter(k => k !== keyword);
        updateTrainingKeywords();
    }
    
    function updateTrainingKeywords() {
        const list = $('#training-keywords-list');
        list.empty();
        
        trainingKeywords.forEach(keyword => {
            list.append(`
                <span class="keyword-tag">
                    ${keyword}
                    <button type="button" class="keyword-remove" onclick="removeTrainingKeywordGlobal('${keyword}')">×</button>
                </span>
            `);
        });
        
        $('#training-keywords-hidden').val(trainingKeywords.join(','));
        $('#keyword-count').text(trainingKeywords.length);
        
        if (trainingKeywords.length >= 20) {
            $('#training-keyword-input').prop('disabled', true);
        } else {
            $('#training-keyword-input').prop('disabled', false);
        }
    }
    
    window.removeTrainingKeywordGlobal = function(keyword) {
        removeTrainingKeyword(keyword);
    };
    
    function initPreview() {
        $('#training-image').on('change', function() {
            const file = this.files[0];
            if (!file) return;
            
            const reader = new FileReader();
            reader.onload = function(e) {
                $('#training-preview').html(`
                    <div class="preview-image">
                        <img src="${e.target.result}" alt="Preview">
                    </div>
                `);
            };
            reader.readAsDataURL(file);
        });
    }
    
    function initForm() {
        $('#training-upload-form').on('submit', function(e) {
            e.preventDefault();
            
            if (trainingKeywords.length === 0) {
                alert('Debes agregar al menos 1 keyword');
                return;
            }
            
            const formData = new FormData(this);
            const message = $('#training-message');
            message.removeClass('alert-success alert-danger').hide();
            
            $.ajax({
                url: uapConfig.apiUrl + '/training/images',
                method: 'POST',
                data: formData,
                processData: false,
                contentType: false,
                success: function(response) {
                    message.addClass('alert alert-success')
                           .text('Imagen de entrenamiento subida exitosamente')
                           .show();
                    
                    $('#training-upload-form')[0].reset();
                    trainingKeywords = [];
                    updateTrainingKeywords();
                    $('#training-preview').empty();
                    
                    loadTrainingImages();
                    loadStats();
                    
                    setTimeout(() => message.fadeOut(), 3000);
                },
                error: function(xhr) {
                    const error = xhr.responseJSON?.error || 'Error al subir imagen';
                    message.addClass('alert alert-danger').text(error).show();
                }
            });
        });
    }
    
    function initFilters() {
        let searchTimeout;
        $('#search-training').on('input', function() {
            clearTimeout(searchTimeout);
            searchTimeout = setTimeout(() => {
                currentPage = 1;
                loadTrainingImages();
            }, 500);
        });
        
        $('#filter-training-category, #filter-verified').on('change', function() {
            currentPage = 1;
            loadTrainingImages();
        });
    }
    
    function loadTrainingImages() {
        $('#training-loading').show();
        $('#training-grid').hide();
        
        const params = new URLSearchParams({
            page: currentPage,
            limit: 24,
            search: $('#search-training').val(),
            category: $('#filter-training-category').val(),
            verified: $('#filter-verified').val()
        });
        
        $.ajax({
            url: uapConfig.apiUrl + '/training/images?' + params.toString(),
            success: function(response) {
                const images = response.data || [];
                
                $('#training-loading').hide();
                renderTrainingGrid(images);
                
                if (response.pagination) {
                    renderPagination(response.pagination);
                }
                
                $('#training-grid').show();
            },
            error: function() {
                $('#training-loading').hide();
                $('#training-grid').html('<p class="text-center">Error al cargar imágenes</p>').show();
            }
        });
    }
    
    function renderTrainingGrid(images) {
        const grid = $('#training-grid');
        grid.empty();
        
        if (images.length === 0) {
            grid.html('<p class="text-center text-muted">No hay imágenes de entrenamiento</p>');
            return;
        }
        
        images.forEach(img => {
            const verified = img.verified ? 'verified' : 'pending';
            const verifiedIcon = img.verified ? '✅' : '⏳';
            
            const card = `
                <div class="training-card ${verified}">
                    <div class="training-image">
                        <img src="${img.imageUrl}" alt="${img.type}">
                        <div class="training-badge">${verifiedIcon}</div>
                    </div>
                    <div class="training-info">
                        <h5 class="training-type">${img.type}</h5>
                        <p class="training-category">${img.categoryName || img.category}</p>
                        <div class="training-keywords">
                            ${img.keywords.slice(0, 3).map(k => `<span class="keyword-mini">${k}</span>`).join('')}
                            ${img.keywords.length > 3 ? `<span class="keyword-mini">+${img.keywords.length - 3}</span>` : ''}
                        </div>
                    </div>
                    <div class="training-actions">
                        ${!img.verified ? `<button class="btn-sm btn-success" onclick="verifyTraining('${img._id}')">✓ Verificar</button>` : ''}
                        <button class="btn-sm btn-primary" onclick="viewTraining('${img._id}')">👁️</button>
                        <button class="btn-sm btn-danger" onclick="deleteTraining('${img._id}')">🗑️</button>
                    </div>
                </div>
            `;
            
            grid.append(card);
        });
    }
    
    function renderPagination(pagination) {
        if (pagination.pages <= 1) {
            $('#training-pagination').hide();
            return;
        }
        
        let html = '<div class="pagination-buttons">';
        
        if (pagination.page > 1) {
            html += `<button class="page-btn" onclick="goToTrainingPage(${pagination.page - 1})">← Anterior</button>`;
        }
        
        html += `<span class="page-info">Página ${pagination.page} de ${pagination.pages}</span>`;
        
        if (pagination.page < pagination.pages) {
            html += `<button class="page-btn" onclick="goToTrainingPage(${pagination.page + 1})">Siguiente →</button>`;
        }
        
        html += '</div>';
        
        $('#training-pagination').html(html).show();
    }
    
    window.goToTrainingPage = function(page) {
        currentPage = page;
        loadTrainingImages();
        $('html, body').animate({ scrollTop: 0 }, 300);
    };
    
    window.verifyTraining = function(id) {
        $.ajax({
            url: uapConfig.apiUrl + '/training/images/' + id + '/verify',
            method: 'POST',
            success: function() {
                loadTrainingImages();
                loadStats();
            }
        });
    };
    
    window.viewTraining = function(id) {
        window.open(uapConfig.apiUrl + '/training/images/' + id, '_blank');
    };
    
    window.deleteTraining = function(id) {
        if (!confirm('¿Eliminar esta imagen de entrenamiento?')) return;
        
        $.ajax({
            url: uapConfig.apiUrl + '/training/images/' + id,
            method: 'DELETE',
            success: function() {
                loadTrainingImages();
                loadStats();
            }
        });
    };
    
})(jQuery);
</script>
