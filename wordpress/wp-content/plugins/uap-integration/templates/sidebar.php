<?php
/**
 * Sidebar del Dashboard UAP
 * Menú lateral con navegación principal
 */

$current_user = wp_get_current_user();
$is_admin = current_user_can('administrator');

// Obtener página actual
$current_page = get_query_var('pagename') ?: '';
?>

<aside class="uap-sidebar">
    <!-- Header del Sidebar con Logo -->
    <div class="sidebar-header">
        <div class="logo-container">
            <div class="logo-classified">CLASIFICADO</div>
            <h3 class="logo-title">UAP SYSTEM</h3>
            <div class="logo-subtitle">v3.0 HÍBRIDO</div>
        </div>
    </div>
    
    <!-- Perfil de Usuario -->
    <div class="user-profile">
        <div class="avatar-container">
            <?php echo get_avatar($current_user->ID, 60, '', '', array('class' => 'user-avatar')); ?>
        </div>
        <div class="user-info">
            <div class="user-name"><?php echo esc_html($current_user->display_name); ?></div>
            <div class="user-email"><?php echo esc_html($current_user->user_email); ?></div>
            <?php if ($is_admin): ?>
                <span class="user-badge">Administrador</span>
            <?php else: ?>
                <span class="user-badge user">Usuario</span>
            <?php endif; ?>
        </div>
    </div>
    
    <!-- Menú de Navegación -->
    <nav class="sidebar-nav">
        <ul class="nav-list">
            <!-- Dashboard / Inicio -->
            <li class="nav-item <?php echo ($current_page === 'dashboard') ? 'active' : ''; ?>">
                <a href="<?php echo home_url('/dashboard/'); ?>" class="nav-link">
                    <i class="icon">🏠</i>
                    <span>Inicio</span>
                </a>
            </li>
            
            <!-- Mi Perfil -->
            <li class="nav-item">
                <a href="<?php echo home_url('/mi-perfil/'); ?>" class="nav-link">
                    <i class="icon">👤</i>
                    <span>Mi Perfil</span>
                </a>
            </li>
            
            <!-- Subir Análisis -->
            <li class="nav-item <?php echo ($current_page === 'subir-analisis') ? 'active' : ''; ?>">
                <a href="<?php echo home_url('/subir-analisis/'); ?>" class="nav-link">
                    <i class="icon">📤</i>
                    <span>Subir Análisis</span>
                </a>
            </li>
            
            <!-- Mis Reportes -->
            <li class="nav-item <?php echo ($current_page === 'mis-reportes') ? 'active' : ''; ?>">
                <a href="<?php echo home_url('/mis-reportes/'); ?>" class="nav-link">
                    <i class="icon">📋</i>
                    <span>Mis Reportes</span>
                </a>
            </li>
            
            <!-- Biblioteca Visual (Pública) -->
            <li class="nav-item <?php echo ($current_page === 'biblioteca-uap') ? 'active' : ''; ?>">
                <a href="<?php echo home_url('/biblioteca-uap/'); ?>" class="nav-link">
                    <i class="icon">📚</i>
                    <span>Biblioteca Visual</span>
                </a>
            </li>
            
            <?php if ($is_admin): ?>
                <!-- Separador Admin -->
                <li class="nav-separator">
                    <span>ADMINISTRACIÓN</span>
                </li>
                
                <!-- Admin - Gestión Biblioteca -->
                <li class="nav-item <?php echo ($current_page === 'admin-biblioteca') ? 'active' : ''; ?>">
                    <a href="<?php echo home_url('/admin-biblioteca/'); ?>" class="nav-link">
                        <i class="icon">⚙️</i>
                        <span>Gestión Biblioteca</span>
                    </a>
                </li>
                
                <!-- Admin - Entrada de Datos -->
                <li class="nav-item <?php echo ($current_page === 'admin-training') ? 'active' : ''; ?>">
                    <a href="<?php echo home_url('/admin-training/'); ?>" class="nav-link">
                        <i class="icon">🎓</i>
                        <span>Entrada de Datos</span>
                    </a>
                </li>
                
                <!-- Admin - Configuración -->
                <li class="nav-item <?php echo ($current_page === 'admin-config') ? 'active' : ''; ?>">
                    <a href="<?php echo home_url('/admin-config/'); ?>" class="nav-link">
                        <i class="icon">🔧</i>
                        <span>Configuración</span>
                    </a>
                </li>
            <?php endif; ?>
            
            <!-- Separador Links -->
            <li class="nav-separator">
                <span>ENLACES</span>
            </li>
            
            <!-- Donar -->
            <li class="nav-item">
                <a href="<?php echo get_option('uap_donation_url', 'https://paypal.me/uapproject'); ?>" target="_blank" class="nav-link" rel="noopener">
                    <i class="icon">💝</i>
                    <span>Donar</span>
                </a>
            </li>
            
            <!-- Nuestra Web -->
            <li class="nav-item">
                <a href="<?php echo get_option('uap_website_url', home_url('/')); ?>" target="_blank" class="nav-link" rel="noopener">
                    <i class="icon">🌐</i>
                    <span>Nuestra Web</span>
                </a>
            </li>
        </ul>
    </nav>
    
    <!-- Footer del Sidebar -->
    <div class="sidebar-footer">
        <div class="footer-badge">
            <span class="badge-icon">🔓</span>
            <span class="badge-text">Open Source</span>
        </div>
        <div class="footer-text">Proyecto 100% gratuito</div>
        <div class="footer-level">NIVEL DE ACCESO: PÚBLICO</div>
    </div>
</aside>
