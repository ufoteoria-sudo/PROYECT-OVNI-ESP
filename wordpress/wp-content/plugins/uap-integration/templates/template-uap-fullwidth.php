<?php
/**
 * Template Name: UAP Full Width
 * Description: Plantilla de página completa sin header/footer para páginas UAP
 */

// No mostrar nada de WordPress, solo el contenido del shortcode
?>
<!DOCTYPE html>
<html <?php language_attributes(); ?>>
<head>
    <meta charset="<?php bloginfo('charset'); ?>">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title><?php wp_title('|', true, 'right'); ?> <?php bloginfo('name'); ?></title>
    <?php wp_head(); ?>
    <style>
        /* Reset completo para eliminar estilos del tema */
        body {
            margin: 0 !important;
            padding: 0 !important;
            overflow-x: hidden !important;
            background: #0f0c29 !important;
        }
        
        /* Ocultar elementos de WordPress */
        #wpadminbar,
        .site-header,
        .site-footer,
        .site-navigation,
        .breadcrumb,
        .entry-header,
        .entry-footer,
        .post-navigation,
        .site-info,
        .widget-area,
        nav,
        aside {
            display: none !important;
        }
        
        /* Forzar ancho completo */
        #page,
        #content,
        #primary,
        .site,
        .site-content,
        .content-area,
        .entry-content,
        article,
        main {
            max-width: 100% !important;
            width: 100% !important;
            margin: 0 !important;
            padding: 0 !important;
        }
        
        /* Contenedor principal */
        .uap-full-width-container {
            width: 100vw !important;
            min-height: 100vh !important;
            margin: 0 !important;
            padding: 0 !important;
            position: relative !important;
        }
    </style>
</head>
<body <?php body_class('uap-fullwidth-page'); ?>>

<div class="uap-full-width-container">
    <?php
    while (have_posts()) : the_post();
        the_content();
    endwhile;
    ?>
</div>

<?php wp_footer(); ?>
</body>
</html>
