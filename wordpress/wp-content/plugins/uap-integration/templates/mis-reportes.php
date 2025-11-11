<?php
/**
 * Template: Mis Reportes
 * Lista de todos los reportes del usuario con filtros
 */

$current_user = wp_get_current_user();
?>

<div class="uap-dashboard-wrapper">
    <?php include UAP_PLUGIN_DIR . 'templates/sidebar.php'; ?>
    
    <main class="uap-dashboard-content">
        <div class="page-header">
            <h1 class="page-title">📋 Mis Reportes</h1>
            <p class="page-subtitle">Historial completo de tus análisis y avistamientos reportados</p>
        </div>
        
        <!-- Filtros y Búsqueda -->
        <div class="reports-filters">
            <div class="filter-group">
                <input type="text" id="search-reports" class="filter-input" placeholder="🔍 Buscar por título, ubicación...">
                
                <select id="filter-status" class="filter-select">
                    <option value="">Todos los estados</option>
                    <option value="pending">Pendiente</option>
                    <option value="analyzing">Analizando</option>
                    <option value="completed">Completado</option>
                    <option value="error">Error</option>
                </select>
                
                <select id="filter-type" class="filter-select">
                    <option value="">Todos los tipos</option>
                    <option value="analysis">Análisis</option>
                    <option value="report">Reporte</option>
                </select>
                
                <button type="button" class="btn-filter" id="apply-filters">Aplicar</button>
                <button type="button" class="btn-clear" id="clear-filters">Limpiar</button>
            </div>
        </div>
        
        <!-- Tabla de Reportes -->
        <div class="reports-table-container">
            <div class="reports-loading" id="reports-loading">
                <div class="spinner"></div>
                <p>Cargando reportes...</p>
            </div>
            
            <table class="reports-table" id="reports-table" style="display: none;">
                <thead>
                    <tr>
                        <th>ID</th>
                        <th>Imagen</th>
                        <th>Fecha</th>
                        <th>Ubicación</th>
                        <th>Tipo</th>
                        <th>Estado</th>
                        <th>Confianza</th>
                        <th>Acciones</th>
                    </tr>
                </thead>
                <tbody id="reports-tbody">
                    <!-- Se llenará dinámicamente -->
                </tbody>
            </table>
            
            <div class="no-reports" id="no-reports" style="display: none;">
                <div class="empty-icon">📭</div>
                <h3>No hay reportes aún</h3>
                <p>Comienza subiendo tu primer análisis UAP</p>
                <a href="<?php echo home_url('/subir-analisis/'); ?>" class="btn btn-primary">Subir Análisis</a>
            </div>
        </div>
        
        <!-- Paginación -->
        <div class="pagination" id="pagination" style="display: none;">
            <!-- Se llenará dinámicamente -->
        </div>
    </main>
</div>

<script>
(function($) {
    'use strict';
    
    let currentPage = 1;
    let filters = {
        search: '',
        status: '',
        type: ''
    };
    
    $(document).ready(function() {
        loadReports();
        initFilters();
    });
    
    function initFilters() {
        $('#apply-filters').on('click', function() {
            filters.search = $('#search-reports').val();
            filters.status = $('#filter-status').val();
            filters.type = $('#filter-type').val();
            currentPage = 1;
            loadReports();
        });
        
        $('#clear-filters').on('click', function() {
            $('#search-reports').val('');
            $('#filter-status').val('');
            $('#filter-type').val('');
            filters = { search: '', status: '', type: '' };
            currentPage = 1;
            loadReports();
        });
        
        $('#search-reports').on('keypress', function(e) {
            if (e.which === 13) {
                $('#apply-filters').click();
            }
        });
    }
    
    function loadReports() {
        $('#reports-loading').show();
        $('#reports-table').hide();
        $('#no-reports').hide();
        
        const params = new URLSearchParams({
            page: currentPage,
            limit: 20,
            ...filters
        });
        
        $.ajax({
            url: uapConfig.apiUrl + '/user/reports?' + params.toString(),
            method: 'GET',
            success: function(response) {
                const reports = response.data || [];
                
                $('#reports-loading').hide();
                
                if (reports.length === 0) {
                    $('#no-reports').show();
                    return;
                }
                
                renderReports(reports);
                $('#reports-table').show();
                
                if (response.pagination) {
                    renderPagination(response.pagination);
                }
            },
            error: function() {
                $('#reports-loading').hide();
                $('#no-reports').show();
            }
        });
    }
    
    function renderReports(reports) {
        const tbody = $('#reports-tbody');
        tbody.empty();
        
        reports.forEach(report => {
            const statusClass = getStatusClass(report.status);
            const statusText = getStatusText(report.status);
            const confidence = report.aiAnalysis?.confidence || 0;
            
            const row = `
                <tr>
                    <td><code>${report._id.substring(0, 8)}</code></td>
                    <td>
                        <img src="${report.imageUrl || 'https://via.placeholder.com/60'}" 
                             alt="Preview" class="report-thumb">
                    </td>
                    <td>${new Date(report.createdAt).toLocaleDateString('es-ES')}</td>
                    <td>${report.exifData?.location?.address || 'No especificada'}</td>
                    <td><span class="badge badge-type">${report.fileType || 'image'}</span></td>
                    <td><span class="badge badge-${statusClass}">${statusText}</span></td>
                    <td>
                        <div class="confidence-mini">
                            <div class="confidence-bar">
                                <div class="confidence-fill" style="width: ${confidence}%"></div>
                            </div>
                            <span>${Math.round(confidence)}%</span>
                        </div>
                    </td>
                    <td>
                        <button class="btn-action" onclick="viewReport('${report._id}')">👁️</button>
                        <button class="btn-action" onclick="downloadReport('${report._id}')">⬇️</button>
                    </td>
                </tr>
            `;
            
            tbody.append(row);
        });
    }
    
    function getStatusClass(status) {
        const classes = {
            pending: 'warning',
            analyzing: 'info',
            completed: 'success',
            error: 'danger'
        };
        return classes[status] || 'secondary';
    }
    
    function getStatusText(status) {
        const texts = {
            pending: 'Pendiente',
            analyzing: 'Analizando',
            completed: 'Completado',
            error: 'Error'
        };
        return texts[status] || status;
    }
    
    function renderPagination(pagination) {
        if (pagination.pages <= 1) {
            $('#pagination').hide();
            return;
        }
        
        let html = '<div class="pagination-buttons">';
        
        if (pagination.page > 1) {
            html += `<button class="page-btn" onclick="goToPage(${pagination.page - 1})">← Anterior</button>`;
        }
        
        html += `<span class="page-info">Página ${pagination.page} de ${pagination.pages}</span>`;
        
        if (pagination.page < pagination.pages) {
            html += `<button class="page-btn" onclick="goToPage(${pagination.page + 1})">Siguiente →</button>`;
        }
        
        html += '</div>';
        
        $('#pagination').html(html).show();
    }
    
    window.goToPage = function(page) {
        currentPage = page;
        loadReports();
    };
    
    window.viewReport = function(id) {
        window.location.href = '/analisis-detalle/?id=' + id;
    };
    
    window.downloadReport = function(id) {
        window.open(uapConfig.apiUrl + '/reports/' + id + '/download', '_blank');
    };
    
})(jQuery);
</script>
