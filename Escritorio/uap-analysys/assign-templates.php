<?php
require('/var/www/html/wp-load.php');

echo "Asignando template 'UAP Full Width' a páginas UAP...\n\n";

$pages = array(
    'Biblioteca UAP',
    'Reportar Avistamiento',
    'Análisis UAP'
);

foreach ($pages as $page_title) {
    $page = get_page_by_title($page_title);
    
    if ($page) {
        // Asignar el template
        update_post_meta($page->ID, '_wp_page_template', 'template-uap-fullwidth.php');
        
        echo "✓ Template asignado a: {$page_title} (ID: {$page->ID})\n";
    } else {
        echo "✗ Página no encontrada: {$page_title}\n";
    }
}

// Eliminar la página de ejemplo
$example_page = get_page_by_title('Página de ejemplo');
if ($example_page) {
    wp_delete_post($example_page->ID, true);
    echo "\n✓ Página de ejemplo eliminada\n";
}

echo "\n✅ Proceso completado\n";
?>
