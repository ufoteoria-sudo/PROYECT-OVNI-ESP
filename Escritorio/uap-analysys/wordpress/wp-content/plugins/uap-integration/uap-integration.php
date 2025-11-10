<?php
/**
 * Plugin Name: UAP Integration
 * Plugin URI: https://github.com/ufoteoria-sudo/PROYECT-OVNI-ESP
 * Description: Integra el sistema UAP Analysis con WordPress mediante shortcodes y widgets para mostrar la biblioteca visual, formulario de reportes y análisis públicos.
 * Version: 1.2.0
 * Author: UAP Analysis Team
 * Author URI: https://github.com/ufoteoria-sudo
 * License: GPL-2.0+
 * License URI: http://www.gnu.org/licenses/gpl-2.0.txt
 * Text Domain: uap-integration
 * Domain Path: /languages
 */

// Si se accede directamente, salir
if (!defined('ABSPATH')) {
    exit;
}

// Definir constantes del plugin
define('UAP_PLUGIN_VERSION', '1.2.0');
define('UAP_PLUGIN_DIR', plugin_dir_path(__FILE__));
define('UAP_PLUGIN_URL', plugin_dir_url(__FILE__));
define('UAP_API_URL', 'http://localhost:3000/api');

/**
 * Clase principal del plugin
 */
class UAP_Integration {
    
    private static $instance = null;
    
    /**
     * Obtener instancia única (Singleton)
     */
    public static function get_instance() {
        if (null === self::$instance) {
            self::$instance = new self();
        }
        return self::$instance;
    }
    
    /**
     * Constructor
     */
    private function __construct() {
        // Hooks de activación/desactivación
        register_activation_hook(__FILE__, array($this, 'activate'));
        register_deactivation_hook(__FILE__, array($this, 'deactivate'));
        
        // Cargar assets
        add_action('wp_enqueue_scripts', array($this, 'enqueue_scripts'));
        
        // Registrar shortcodes
        add_shortcode('uap-biblioteca', array($this, 'biblioteca_shortcode'));
        add_shortcode('uap-reportar', array($this, 'reportar_shortcode'));
        add_shortcode('uap-galeria', array($this, 'galeria_shortcode'));
        
        // Nuevos shortcodes del dashboard completo
        add_shortcode('uap-dashboard', array($this, 'dashboard_shortcode'));
        add_shortcode('uap-subir-analisis', array($this, 'subir_analisis_shortcode'));
        add_shortcode('uap-mis-reportes', array($this, 'mis_reportes_shortcode'));
        add_shortcode('uap-admin-biblioteca', array($this, 'admin_biblioteca_shortcode'));
        add_shortcode('uap-admin-training', array($this, 'admin_training_shortcode'));
        add_shortcode('uap-admin-config', array($this, 'admin_config_shortcode'));
        
        // Menú de administración
        add_action('admin_menu', array($this, 'add_admin_menu'));
        add_action('admin_init', array($this, 'register_settings'));
    }
    
    /**
     * Activación del plugin
     */
    public function activate() {
        // Configuración por defecto
        add_option('uap_api_url', UAP_API_URL);
        flush_rewrite_rules();
    }
    
    /**
     * Desactivación del plugin
     */
    public function deactivate() {
        flush_rewrite_rules();
    }
    
    /**
     * Cargar scripts y estilos
     */
    public function enqueue_scripts() {
        // Bootstrap 5
        wp_enqueue_style('bootstrap', 'https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css', array(), '5.3.0');
        wp_enqueue_script('bootstrap', 'https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/js/bootstrap.bundle.min.js', array('jquery'), '5.3.0', true);
        
        // Estilos personalizados
        wp_enqueue_style('uap-styles', UAP_PLUGIN_URL . 'assets/css/uap-styles.css', array('bootstrap'), UAP_PLUGIN_VERSION);
        wp_enqueue_style('uap-dashboard', UAP_PLUGIN_URL . 'assets/css/uap-dashboard.css', array('uap-styles'), UAP_PLUGIN_VERSION);
        
        // Scripts personalizados
        wp_enqueue_script('uap-scripts', UAP_PLUGIN_URL . 'assets/js/uap-scripts.js', array('jquery', 'bootstrap'), UAP_PLUGIN_VERSION, true);
        
        // Pasar la URL de la API a JavaScript
        wp_localize_script('uap-scripts', 'uapConfig', array(
            'apiUrl' => get_option('uap_api_url', UAP_API_URL),
            'nonce' => wp_create_nonce('uap_nonce')
        ));
    }
    
    /**
     * Shortcode: Biblioteca Visual
     */
    public function biblioteca_shortcode($atts) {
        $atts = shortcode_atts(array(
            'limit' => 12
        ), $atts);
        
        ob_start();
        include UAP_PLUGIN_DIR . 'templates/biblioteca.php';
        return ob_get_clean();
    }
    
    /**
     * Shortcode: Formulario de Reporte
     */
    public function reportar_shortcode($atts) {
        ob_start();
        include UAP_PLUGIN_DIR . 'templates/reportar.php';
        return ob_get_clean();
    }
    
    /**
     * Shortcode: Galería de Análisis
     */
    public function galeria_shortcode($atts) {
        $atts = shortcode_atts(array(
            'limit' => 9
        ), $atts);
        
        ob_start();
        include UAP_PLUGIN_DIR . 'templates/galeria.php';
        return ob_get_clean();
    }
    
    /**
     * Shortcode: Dashboard principal
     */
    public function dashboard_shortcode($atts) {
        ob_start();
        include UAP_PLUGIN_DIR . 'templates/dashboard.php';
        return ob_get_clean();
    }
    
    /**
     * Shortcode: Subir Análisis
     */
    public function subir_analisis_shortcode($atts) {
        ob_start();
        include UAP_PLUGIN_DIR . 'templates/subir-analisis.php';
        return ob_get_clean();
    }
    
    /**
     * Shortcode: Mis Reportes
     */
    public function mis_reportes_shortcode($atts) {
        ob_start();
        include UAP_PLUGIN_DIR . 'templates/mis-reportes.php';
        return ob_get_clean();
    }
    
    /**
     * Shortcode: Admin - Gestión Biblioteca
     */
    public function admin_biblioteca_shortcode($atts) {
        ob_start();
        include UAP_PLUGIN_DIR . 'templates/admin-biblioteca.php';
        return ob_get_clean();
    }
    
    /**
     * Shortcode: Admin - Entrada de Datos de Entrenamiento
     */
    public function admin_training_shortcode($atts) {
        ob_start();
        include UAP_PLUGIN_DIR . 'templates/admin-training.php';
        return ob_get_clean();
    }
    
    /**
     * Shortcode: Admin - Configuración
     */
    public function admin_config_shortcode($atts) {
        ob_start();
        include UAP_PLUGIN_DIR . 'templates/admin-config.php';
        return ob_get_clean();
    }
    
    /**
     * Agregar menú de administración
     */
    public function add_admin_menu() {
        add_menu_page(
            'UAP Integration',
            'UAP Integration',
            'manage_options',
            'uap-integration',
            array($this, 'admin_page'),
            'dashicons-visibility',
            30
        );
    }
    
    /**
     * Registrar configuraciones
     */
    public function register_settings() {
        register_setting('uap_settings', 'uap_api_url');
    }
    
    /**
     * Página de administración
     */
    public function admin_page() {
        include UAP_PLUGIN_DIR . 'templates/admin-page.php';
    }
}

// Inicializar el plugin
UAP_Integration::get_instance();
