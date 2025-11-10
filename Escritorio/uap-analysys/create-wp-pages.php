<?php
/**
 * Script para crear páginas de WordPress con shortcodes UAP
 */

// Cargar WordPress
require('/var/www/html/wp-load.php');

// Verificar que WordPress esté cargado
if (!function_exists('wp_insert_post')) {
    die("Error: No se pudo cargar WordPress\n");
}

// Páginas a crear
$pages = array(
    array(
        'post_title'    => 'Biblioteca UAP',
        'post_content'  => '[uap-biblioteca]',
        'post_status'   => 'publish',
        'post_type'     => 'page',
        'post_name'     => 'biblioteca-uap'
    ),
    array(
        'post_title'    => 'Reportar Avistamiento',
        'post_content'  => '[uap-reportar]',
        'post_status'   => 'publish',
        'post_type'     => 'page',
        'post_name'     => 'reportar-avistamiento'
    ),
    array(
        'post_title'    => 'Análisis UAP',
        'post_content'  => '[uap-galeria]',
        'post_status'   => 'publish',
        'post_type'     => 'page',
        'post_name'     => 'analisis-uap'
    )
);

echo "Creando páginas de WordPress...\n\n";

foreach ($pages as $page) {
    // Verificar si la página ya existe
    $existing = get_page_by_path($page['post_name'], OBJECT, 'page');
    
    if ($existing) {
        echo "✓ La página '{$page['post_title']}' ya existe (ID: {$existing->ID})\n";
        echo "  URL: " . get_permalink($existing->ID) . "\n\n";
    } else {
        // Crear la página
        $page_id = wp_insert_post($page);
        
        if ($page_id && !is_wp_error($page_id)) {
            echo "✓ Página '{$page['post_title']}' creada exitosamente (ID: {$page_id})\n";
            echo "  URL: " . get_permalink($page_id) . "\n\n";
        } else {
            echo "✗ Error al crear la página '{$page['post_title']}'\n";
            if (is_wp_error($page_id)) {
                echo "  Error: " . $page_id->get_error_message() . "\n\n";
            }
        }
    }
}

echo "Proceso completado.\n";
echo "\n📋 Resumen:\n";
echo "- Biblioteca UAP: http://localhost:8090/biblioteca-uap/\n";
echo "- Reportar Avistamiento: http://localhost:8090/reportar-avistamiento/\n";
echo "- Análisis UAP: http://localhost:8090/analisis-uap/\n";
?>
