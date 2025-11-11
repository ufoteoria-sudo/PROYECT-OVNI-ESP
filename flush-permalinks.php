<?php
require('/var/www/html/wp-load.php');

echo "Regenerando permalinks de WordPress...\n\n";

// Flush rewrite rules
flush_rewrite_rules();

echo "✓ Permalinks regenerados\n\n";

// Verificar las páginas creadas
$pages = get_pages();

echo "Páginas disponibles:\n";
foreach ($pages as $page) {
    $url = get_permalink($page->ID);
    echo "  - {$page->post_title}: {$url}\n";
}

echo "\n✓ Proceso completado\n";
?>
