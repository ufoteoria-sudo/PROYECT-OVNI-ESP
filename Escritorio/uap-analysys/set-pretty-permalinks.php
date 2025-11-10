<?php
require('/var/www/html/wp-load.php');

echo "Configurando permalinks bonitos...\n\n";

// Configurar estructura de permalinks a "post name"
update_option('permalink_structure', '/%postname%/');

// Flush rewrite rules para aplicar los cambios
flush_rewrite_rules();

echo "✓ Estructura de permalinks actualizada a: /%postname%/\n\n";

// Verificar las URLs ahora
$pages = array(
    'Biblioteca UAP',
    'Reportar Avistamiento',
    'Análisis UAP'
);

echo "URLs actualizadas:\n";
foreach ($pages as $page_title) {
    $page = get_page_by_title($page_title);
    if ($page) {
        $url = get_permalink($page->ID);
        echo "  - {$page_title}: {$url}\n";
    }
}

echo "\n✓ Configuración completada\n";
?>
