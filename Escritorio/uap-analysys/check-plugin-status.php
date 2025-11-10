<?php
require('/var/www/html/wp-load.php');

echo "Verificando estado del plugin UAP Integration...\n\n";

// Obtener plugins activos
$active_plugins = get_option('active_plugins');

echo "Plugins activos:\n";
foreach ($active_plugins as $plugin) {
    echo "  - $plugin\n";
}

$uap_active = in_array('uap-integration/uap-integration.php', $active_plugins);

echo "\n";
if ($uap_active) {
    echo "✓ El plugin UAP Integration está ACTIVADO\n";
} else {
    echo "✗ El plugin UAP Integration NO está activado\n";
    echo "\nActivando plugin...\n";
    activate_plugin('uap-integration/uap-integration.php');
    echo "✓ Plugin activado\n";
}

// Verificar shortcodes registrados
global $shortcode_tags;
echo "\nShortcodes relacionados con UAP:\n";
foreach ($shortcode_tags as $tag => $callback) {
    if (strpos($tag, 'uap') !== false) {
        echo "  - [$tag]\n";
    }
}

if (empty(array_filter(array_keys($shortcode_tags), function($tag) {
    return strpos($tag, 'uap') !== false;
}))) {
    echo "  (No se encontraron shortcodes UAP registrados)\n";
}
?>
