<?php
/**
 * Template: Dashboard Principal
 * Página de inicio con estadísticas y sistema híbrido
 */

$current_user = wp_get_current_user();
$is_admin = current_user_can('administrator');
?>

<div class="uap-dashboard-wrapper">
    <?php include UAP_PLUGIN_DIR . 'templates/header.php'; ?>
    
    <div class="uap-dashboard-main">
        <?php include UAP_PLUGIN_DIR . 'templates/sidebar.php'; ?>
        
        <main class="uap-dashboard-content">
            <!-- Header Principal con Efecto Neón -->
            <div class="dashboard-header">
                <div class="welcome-section">
                    <h1 class="welcome-title neon-text">¡Bienvenido <?php echo $is_admin ? 'Administrador' : esc_html($current_user->display_name); ?>!</h1>
                <p class="welcome-subtitle">
                    <?php echo esc_html($current_user->user_email); ?>
                    <span class="badge-role"><?php echo $is_admin ? 'Administrador' : 'Usuario'; ?></span>
                </p>
            </div>
        </div>
        
        <!-- Estadísticas -->
        <div class="stats-grid">
            <div class="stat-card">
                <div class="stat-icon">📊</div>
                <div class="stat-content">
                    <div class="stat-label">Panel de Control</div>
                    <div class="stat-value" id="stat-total">26</div>
                </div>
            </div>
            
            <div class="stat-card">
                <div class="stat-icon">📤</div>
                <div class="stat-content">
                    <div class="stat-label">Análisis Subidos</div>
                    <div class="stat-value" id="stat-uploaded">26</div>
                </div>
            </div>
            
            <div class="stat-card">
                <div class="stat-icon">✅</div>
                <div class="stat-content">
                    <div class="stat-label">Completados</div>
                    <div class="stat-value" id="stat-completed">26</div>
                </div>
            </div>
            
            <div class="stat-card">
                <div class="stat-icon">⏳</div>
                <div class="stat-content">
                    <div class="stat-label">En Proceso</div>
                    <div class="stat-value" id="stat-processing">0</div>
                </div>
            </div>
        </div>
        
        <!-- Tarjeta del Sistema Híbrido -->
        <div class="hybrid-system-card">
            <!-- Header Clasificado -->
            <div class="classified-header">
                <div class="classified-badge">CLASIFICADO</div>
                <div class="classified-title">EXPEDIENTE: SISTEMA UAP v3.0 - HÍBRIDO</div>
                <div class="classified-id">ID: UAP-SYS-2025-001-H3</div>
            </div>
            
            <!-- Badges del Sistema -->
            <div class="system-badges">
                <span class="sys-badge">3 CAPAS HÍBRIDAS</span>
                <span class="sys-badge">SCORING</span>
                <span class="sys-badge">VALIDACIÓN</span>
                <span class="sys-badge">OPENCV</span>
            </div>
            
            <!-- Título Principal -->
            <h2 class="hybrid-title">ANÁLISIS HÍBRIDO DE 3 CAPAS</h2>
            
            <!-- Capas del Sistema -->
            <div class="layers-grid">
                <!-- Capa 1: OpenCV -->
                <div class="layer-card">
                    <div class="layer-icon">🔬</div>
                    <h3 class="layer-title">Capa 1: Detección Objetiva</h3>
                    <p class="layer-tech">OpenCV (Sharp + Jimp) - Análisis local determinístico</p>
                    <div class="layer-status active">● ACTIVO</div>
                </div>
                
                <!-- Capa 2: Training Dataset -->
                <div class="layer-card">
                    <div class="layer-icon">📚</div>
                    <h3 class="layer-title">Capa 2: Training Dataset</h3>
                    <p class="layer-tech">Aprendizaje supervisado + UFODatabase científica</p>
                    <div class="layer-status active">● ACTIVO</div>
                </div>
                
                <!-- Capa 3: Llama Vision -->
                <div class="layer-card">
                    <div class="layer-icon">🤖</div>
                    <h3 class="layer-title">Capa 3: Llama Vision (Complemento)</h3>
                    <p class="layer-tech">Análisis semántico solo si confianza &lt; 75%</p>
                    <div class="layer-status active">● ACTIVO</div>
                </div>
                
                <!-- Validación Externa -->
                <div class="layer-card">
                    <div class="layer-icon">🌐</div>
                    <h3 class="layer-title">Validación Externa</h3>
                    <p class="layer-tech">APIs en tiempo real (OpenSky, SunCalc, ISS)</p>
                    <div class="layer-status active">● ACTIVO</div>
                </div>
            </div>
            
            <!-- Descripción del Sistema -->
            <div class="system-description">
                <p><strong>ARQUITECTURA HÍBRIDA:</strong> Combina precisión científica local (OpenCV), aprendizaje continuo (Training) y contexto semántico (Llama Vision) para máxima fiabilidad.</p>
            </div>
            
            <!-- Footer -->
            <div class="system-footer">
                <div class="footer-badge">
                    <span class="badge-icon">🔓</span>
                    <span class="badge-text">Proyecto 100% gratuito y open-source</span>
                </div>
                <div class="footer-level">NIVEL DE ACCESO: PÚBLICO</div>
            </div>
        </div>
        
        <!-- Acciones Rápidas -->
        <div class="quick-actions">
            <h3 class="section-title">Acciones Rápidas</h3>
            <div class="actions-grid">
                <a href="<?php echo home_url('/subir-analisis/'); ?>" class="action-btn primary">
                    <span class="btn-icon">📤</span>
                    <span class="btn-text">Subir Nuevo Análisis</span>
                </a>
                
                <a href="<?php echo home_url('/biblioteca-uap/'); ?>" class="action-btn">
                    <span class="btn-icon">📚</span>
                    <span class="btn-text">Ver Biblioteca</span>
                </a>
                
                <a href="<?php echo home_url('/mis-reportes/'); ?>" class="action-btn">
                    <span class="btn-icon">📋</span>
                    <span class="btn-text">Mis Reportes</span>
                </a>
                
                <?php if ($is_admin): ?>
                    <a href="<?php echo home_url('/admin-training/'); ?>" class="action-btn admin">
                        <span class="btn-icon">🎓</span>
                        <span class="btn-text">Entrada de Datos</span>
                    </a>
                <?php endif; ?>
            </div>
        </div>
    </main>
    </div>
</div>

<script>
(function($) {
    'use strict';
    
    $(document).ready(function() {
        loadDashboardStats();
    });
    
    /**
     * Cargar estadísticas del usuario
     */
    function loadDashboardStats() {
        $.ajax({
            url: uapConfig.apiUrl + '/user/stats',
            method: 'GET',
            success: function(response) {
                const stats = response.data || response;
                
                if (stats) {
                    $('#stat-total').text(stats.total || 0);
                    $('#stat-uploaded').text(stats.uploaded || 0);
                    $('#stat-completed').text(stats.completed || 0);
                    $('#stat-processing').text(stats.processing || 0);
                }
            },
            error: function(xhr, status, error) {
                console.log('Stats usando valores por defecto');
                // Mantener valores por defecto si falla
            }
        });
    }
    
})(jQuery);
</script>
