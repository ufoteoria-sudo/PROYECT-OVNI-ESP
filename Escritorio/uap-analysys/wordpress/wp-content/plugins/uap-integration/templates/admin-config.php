<?php
/**
 * Template: Admin - Configuración
 * Configuración global del sitio
 */

$current_user = wp_get_current_user();
$is_admin = current_user_can('administrator');

if (!$is_admin) {
    echo '<div class="alert alert-danger">Acceso denegado. Solo administradores.</div>';
    return;
}

// Obtener configuración actual
$donation_url = get_option('uap_donation_url', 'https://paypal.me/uapproject');
$website_url = get_option('uap_website_url', home_url('/'));
?>

<div class="uap-dashboard-wrapper">
    <?php include UAP_PLUGIN_DIR . 'templates/sidebar.php'; ?>
    
    <main class="uap-dashboard-content">
        <div class="page-header">
            <h1 class="page-title">🔧 Configuración del Sitio</h1>
            <p class="page-subtitle">Aquí puedes modificar los enlaces y configuraciones globales del sitio.</p>
        </div>
        
        <!-- Configuración de URLs -->
        <div class="admin-section">
            <h3 class="section-title">URL de Donación</h3>
            <p class="section-description">
                URL a la que redirige el botón "Donar". Generalmente un enlace de PayPal, Ko-fi, etc.
            </p>
            
            <form id="donation-url-form" class="config-form">
                <div class="form-group">
                    <label>URL Actual:</label>
                    <div class="input-group">
                        <input type="url" name="donation_url" class="form-control" value="<?php echo esc_attr($donation_url); ?>" required>
                        <button type="submit" class="btn btn-primary">Guardar</button>
                    </div>
                </div>
                <div id="donation-message" class="form-message"></div>
            </form>
        </div>
        
        <div class="admin-section">
            <h3 class="section-title">URL del Sitio Web</h3>
            <p class="section-description">
                URL de tu sitio web principal. Se muestra en el enlace "Nuestra Web".
            </p>
            
            <form id="website-url-form" class="config-form">
                <div class="form-group">
                    <label>URL Actual:</label>
                    <div class="input-group">
                        <input type="url" name="website_url" class="form-control" value="<?php echo esc_attr($website_url); ?>" required>
                        <button type="submit" class="btn btn-primary">Guardar</button>
                    </div>
                </div>
                <div id="website-message" class="form-message"></div>
            </form>
        </div>
        
        <!-- Vista Previa -->
        <div class="admin-section">
            <h3 class="section-title">Vista Previa</h3>
            <p class="section-description">
                Los cambios se aplicarán inmediatamente en toda la aplicación.
            </p>
            
            <div class="preview-grid">
                <div class="preview-card">
                    <h4>Botón Donar:</h4>
                    <a href="<?php echo esc_url($donation_url); ?>" target="_blank" class="preview-btn donate" rel="noopener">
                        <span class="btn-icon">💝</span>
                        <span>Donar</span>
                    </a>
                    <p class="preview-url"><?php echo esc_html($donation_url); ?></p>
                </div>
                
                <div class="preview-card">
                    <h4>Enlace Web:</h4>
                    <a href="<?php echo esc_url($website_url); ?>" target="_blank" class="preview-btn website" rel="noopener">
                        <span class="btn-icon">🌐</span>
                        <span>Nuestra Web</span>
                    </a>
                    <p class="preview-url"><?php echo esc_html($website_url); ?></p>
                </div>
            </div>
        </div>
        
        <!-- Configuración de API -->
        <div class="admin-section">
            <h3 class="section-title">Configuración de API</h3>
            <p class="section-description">
                URL del servidor backend de la API UAP.
            </p>
            
            <form id="api-url-form" class="config-form">
                <div class="form-group">
                    <label>URL de API:</label>
                    <div class="input-group">
                        <input type="url" name="api_url" class="form-control" value="<?php echo esc_attr(get_option('uap_api_url', 'http://localhost:3000/api')); ?>" required>
                        <button type="submit" class="btn btn-primary">Guardar</button>
                    </div>
                    <small class="form-text">Ejemplo: http://localhost:3000/api</small>
                </div>
                <div id="api-message" class="form-message"></div>
            </form>
            
            <div class="api-status">
                <h4>Estado de la API:</h4>
                <div id="api-status-indicator" class="status-indicator">
                    <div class="spinner-sm"></div>
                    <span>Comprobando...</span>
                </div>
                <button type="button" class="btn btn-secondary btn-sm" id="test-api">Probar Conexión</button>
            </div>
        </div>
        
        <!-- Información del Sistema -->
        <div class="admin-section">
            <h3 class="section-title">Información del Sistema</h3>
            
            <div class="system-info">
                <div class="info-row">
                    <span class="info-label">Plugin UAP Integration:</span>
                    <span class="info-value">v<?php echo UAP_PLUGIN_VERSION; ?></span>
                </div>
                <div class="info-row">
                    <span class="info-label">WordPress:</span>
                    <span class="info-value"><?php echo get_bloginfo('version'); ?></span>
                </div>
                <div class="info-row">
                    <span class="info-label">PHP:</span>
                    <span class="info-value"><?php echo phpversion(); ?></span>
                </div>
                <div class="info-row">
                    <span class="info-label">Tema Activo:</span>
                    <span class="info-value"><?php echo wp_get_theme()->get('Name'); ?></span>
                </div>
            </div>
        </div>
        
        <!-- Acciones de Mantenimiento -->
        <div class="admin-section">
            <h3 class="section-title">Mantenimiento</h3>
            
            <div class="maintenance-actions">
                <button type="button" class="btn btn-secondary" id="clear-cache">
                    <span class="btn-icon">🗑️</span>
                    <span>Limpiar Caché</span>
                </button>
                
                <button type="button" class="btn btn-secondary" id="flush-permalinks">
                    <span class="btn-icon">🔄</span>
                    <span>Regenerar Permalinks</span>
                </button>
                
                <button type="button" class="btn btn-warning" id="reset-settings">
                    <span class="btn-icon">⚠️</span>
                    <span>Restaurar Configuración</span>
                </button>
            </div>
            
            <div id="maintenance-message" class="form-message"></div>
        </div>
    </main>
</div>

<script>
(function($) {
    'use strict';
    
    $(document).ready(function() {
        initForms();
        testApiConnection();
        initMaintenance();
    });
    
    function initForms() {
        // Formulario de URL de donación
        $('#donation-url-form').on('submit', function(e) {
            e.preventDefault();
            saveConfig('donation_url', $(this).find('[name="donation_url"]').val(), '#donation-message');
        });
        
        // Formulario de URL del sitio
        $('#website-url-form').on('submit', function(e) {
            e.preventDefault();
            saveConfig('website_url', $(this).find('[name="website_url"]').val(), '#website-message');
        });
        
        // Formulario de API URL
        $('#api-url-form').on('submit', function(e) {
            e.preventDefault();
            saveConfig('api_url', $(this).find('[name="api_url"]').val(), '#api-message');
        });
    }
    
    function saveConfig(key, value, messageSelector) {
        const message = $(messageSelector);
        message.removeClass('alert-success alert-danger').hide();
        
        $.ajax({
            url: ajaxurl || '/wp-admin/admin-ajax.php',
            method: 'POST',
            data: {
                action: 'uap_save_config',
                key: key,
                value: value,
                nonce: uapConfig.nonce
            },
            success: function(response) {
                message.addClass('alert alert-success')
                       .text('Configuración guardada exitosamente')
                       .show();
                
                setTimeout(() => {
                    message.fadeOut();
                    location.reload(); // Recargar para actualizar vista previa
                }, 1500);
            },
            error: function() {
                message.addClass('alert alert-danger')
                       .text('Error al guardar configuración')
                       .show();
            }
        });
    }
    
    function testApiConnection() {
        const indicator = $('#api-status-indicator');
        
        $.ajax({
            url: uapConfig.apiUrl + '/categories',
            method: 'GET',
            timeout: 5000,
            success: function(response) {
                indicator.html(`
                    <span class="status-dot success"></span>
                    <span class="status-text">Conectado ✓</span>
                `);
            },
            error: function() {
                indicator.html(`
                    <span class="status-dot error"></span>
                    <span class="status-text">Desconectado ✗</span>
                `);
            }
        });
    }
    
    $('#test-api').on('click', function() {
        testApiConnection();
    });
    
    function initMaintenance() {
        $('#clear-cache').on('click', function() {
            if (!confirm('¿Limpiar toda la caché del sitio?')) return;
            
            const btn = $(this);
            btn.prop('disabled', true);
            
            $.ajax({
                url: ajaxurl || '/wp-admin/admin-ajax.php',
                method: 'POST',
                data: {
                    action: 'uap_clear_cache',
                    nonce: uapConfig.nonce
                },
                success: function() {
                    showMaintenanceMessage('Caché limpiada exitosamente', 'success');
                    btn.prop('disabled', false);
                },
                error: function() {
                    showMaintenanceMessage('Error al limpiar caché', 'danger');
                    btn.prop('disabled', false);
                }
            });
        });
        
        $('#flush-permalinks').on('click', function() {
            const btn = $(this);
            btn.prop('disabled', true);
            
            $.ajax({
                url: ajaxurl || '/wp-admin/admin-ajax.php',
                method: 'POST',
                data: {
                    action: 'uap_flush_permalinks',
                    nonce: uapConfig.nonce
                },
                success: function() {
                    showMaintenanceMessage('Permalinks regenerados exitosamente', 'success');
                    btn.prop('disabled', false);
                },
                error: function() {
                    showMaintenanceMessage('Error al regenerar permalinks', 'danger');
                    btn.prop('disabled', false);
                }
            });
        });
        
        $('#reset-settings').on('click', function() {
            if (!confirm('¿Restaurar toda la configuración a valores por defecto? Esta acción no se puede deshacer.')) return;
            
            const btn = $(this);
            btn.prop('disabled', true);
            
            $.ajax({
                url: ajaxurl || '/wp-admin/admin-ajax.php',
                method: 'POST',
                data: {
                    action: 'uap_reset_settings',
                    nonce: uapConfig.nonce
                },
                success: function() {
                    showMaintenanceMessage('Configuración restaurada', 'success');
                    setTimeout(() => location.reload(), 1500);
                },
                error: function() {
                    showMaintenanceMessage('Error al restaurar configuración', 'danger');
                    btn.prop('disabled', false);
                }
            });
        });
    }
    
    function showMaintenanceMessage(text, type) {
        const message = $('#maintenance-message');
        message.removeClass('alert-success alert-danger')
               .addClass('alert alert-' + type)
               .text(text)
               .show();
        
        setTimeout(() => message.fadeOut(), 3000);
    }
    
})(jQuery);
</script>
