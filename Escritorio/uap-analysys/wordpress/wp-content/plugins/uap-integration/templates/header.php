<?php
/**
 * Header/Topbar del Dashboard UAP
 * Barra superior con logo, notificaciones, perfil y logout
 */

$current_user = wp_get_current_user();
$is_admin = current_user_can('administrator');
?>

<header class="uap-topbar">
    <!-- Logo y Título -->
    <div class="topbar-left">
        <div class="logo-section">
            <div class="logo-icon">🛸</div>
            <div class="logo-text">
                <span class="logo-title">UAP ANALYSIS SYSTEM</span>
                <span class="logo-version">v3.0 HÍBRIDO</span>
            </div>
        </div>
    </div>
    
    <!-- Barra de Búsqueda (Opcional) -->
    <div class="topbar-center">
        <div class="search-bar">
            <input type="text" placeholder="Buscar análisis, reportes..." class="topbar-search">
            <button class="search-btn">🔍</button>
        </div>
    </div>
    
    <!-- Acciones de Usuario -->
    <div class="topbar-right">
        <!-- Notificaciones -->
        <div class="topbar-item notifications" id="notifications-btn">
            <span class="icon">🔔</span>
            <span class="badge" id="notifications-badge">3</span>
            
            <!-- Dropdown de Notificaciones -->
            <div class="notifications-dropdown" id="notifications-dropdown">
                <div class="dropdown-header">
                    <h4>Notificaciones</h4>
                    <button class="mark-read">Marcar todas como leídas</button>
                </div>
                <div class="notifications-list">
                    <div class="notification-item unread">
                        <span class="notification-icon">✅</span>
                        <div class="notification-content">
                            <p class="notification-text">Análisis completado: UAP-20251110-001</p>
                            <span class="notification-time">Hace 5 minutos</span>
                        </div>
                    </div>
                    <div class="notification-item unread">
                        <span class="notification-icon">📤</span>
                        <div class="notification-content">
                            <p class="notification-text">Nuevo reporte pendiente de revisión</p>
                            <span class="notification-time">Hace 1 hora</span>
                        </div>
                    </div>
                    <div class="notification-item">
                        <span class="notification-icon">🎓</span>
                        <div class="notification-content">
                            <p class="notification-text">Sistema de training actualizado</p>
                            <span class="notification-time">Hace 2 horas</span>
                        </div>
                    </div>
                </div>
                <div class="dropdown-footer">
                    <a href="<?php echo home_url('/notificaciones/'); ?>">Ver todas las notificaciones</a>
                </div>
            </div>
        </div>
        
        <!-- Rol de Usuario (Admin) -->
        <?php if ($is_admin): ?>
        <div class="topbar-item admin-badge">
            <span class="icon">⚙️</span>
            <span class="text">ADMIN</span>
        </div>
        <?php endif; ?>
        
        <!-- Perfil de Usuario -->
        <div class="topbar-item user-menu" id="user-menu-btn">
            <?php echo get_avatar($current_user->ID, 40, '', '', array('class' => 'user-avatar-small')); ?>
            <div class="user-info-small">
                <span class="user-name-small"><?php echo esc_html($current_user->display_name); ?></span>
                <span class="user-role-small"><?php echo $is_admin ? 'Administrador' : 'Usuario'; ?></span>
            </div>
            <span class="dropdown-arrow">▼</span>
            
            <!-- Dropdown de Usuario -->
            <div class="user-dropdown" id="user-dropdown">
                <div class="dropdown-header">
                    <div class="user-avatar-large">
                        <?php echo get_avatar($current_user->ID, 60); ?>
                    </div>
                    <div class="user-details">
                        <strong><?php echo esc_html($current_user->display_name); ?></strong>
                        <span><?php echo esc_html($current_user->user_email); ?></span>
                    </div>
                </div>
                <div class="dropdown-menu">
                    <a href="<?php echo home_url('/mi-perfil/'); ?>" class="menu-item">
                        <span class="menu-icon">👤</span>
                        <span>Mi Perfil</span>
                    </a>
                    <a href="<?php echo home_url('/configuracion/'); ?>" class="menu-item">
                        <span class="menu-icon">⚙️</span>
                        <span>Configuración</span>
                    </a>
                    <?php if ($is_admin): ?>
                    <a href="<?php echo admin_url(); ?>" class="menu-item">
                        <span class="menu-icon">🔧</span>
                        <span>Panel WordPress</span>
                    </a>
                    <?php endif; ?>
                    <div class="menu-divider"></div>
                    <a href="<?php echo wp_logout_url(home_url('/login/')); ?>" class="menu-item logout">
                        <span class="menu-icon">🚪</span>
                        <span>Cerrar Sesión</span>
                    </a>
                </div>
            </div>
        </div>
    </div>
</header>

<script>
(function($) {
    'use strict';
    
    $(document).ready(function() {
        initNotifications();
        initUserMenu();
    });
    
    function initNotifications() {
        $('#notifications-btn').on('click', function(e) {
            e.stopPropagation();
            $('#notifications-dropdown').toggleClass('show');
            $('#user-dropdown').removeClass('show');
        });
        
        // Cerrar al hacer clic fuera
        $(document).on('click', function() {
            $('#notifications-dropdown').removeClass('show');
        });
        
        $('#notifications-dropdown').on('click', function(e) {
            e.stopPropagation();
        });
    }
    
    function initUserMenu() {
        $('#user-menu-btn').on('click', function(e) {
            e.stopPropagation();
            $('#user-dropdown').toggleClass('show');
            $('#notifications-dropdown').removeClass('show');
        });
        
        // Cerrar al hacer clic fuera
        $(document).on('click', function() {
            $('#user-dropdown').removeClass('show');
        });
        
        $('#user-dropdown').on('click', function(e) {
            e.stopPropagation();
        });
    }
    
})(jQuery);
</script>
