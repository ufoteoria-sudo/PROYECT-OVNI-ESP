<div class="wrap">
    <h1><?php echo esc_html(get_admin_page_title()); ?></h1>
    
    <div class="card" style="max-width: 800px;">
        <h2 class="title">Configuración de UAP Integration</h2>
        
        <form method="post" action="options.php">
            <?php
            settings_fields('uap_settings');
            do_settings_sections('uap_settings');
            ?>
            
            <table class="form-table" role="presentation">
                <tr>
                    <th scope="row">
                        <label for="uap_api_url">URL de la API UAP</label>
                    </th>
                    <td>
                        <input 
                            type="text" 
                            id="uap_api_url" 
                            name="uap_api_url" 
                            value="<?php echo esc_attr(get_option('uap_api_url', UAP_API_URL)); ?>" 
                            class="regular-text"
                        >
                        <p class="description">
                            URL base de tu servidor Node.js (por defecto: http://localhost:3000/api)
                        </p>
                    </td>
                </tr>
            </table>
            
            <?php submit_button(); ?>
        </form>
        
        <hr>
        
        <h2>📋 Shortcodes Disponibles</h2>
        <div class="notice notice-info">
            <p><strong>Biblioteca Visual:</strong> <code>[uap-biblioteca]</code></p>
            <p>Muestra la biblioteca completa de objetos y fenómenos categorizados.</p>
        </div>
        
        <div class="notice notice-info">
            <p><strong>Formulario de Reporte:</strong> <code>[uap-reportar]</code></p>
            <p>Formulario público para que los usuarios reporten avistamientos.</p>
        </div>
        
        <div class="notice notice-info">
            <p><strong>Galería de Análisis:</strong> <code>[uap-galeria]</code></p>
            <p>Muestra los análisis públicos realizados por el sistema.</p>
        </div>
        
        <hr>
        
        <h2>🔗 Estado de la Conexión</h2>
        <div id="connection-status">
            <button type="button" class="button button-secondary" onclick="checkUAPConnection()">
                Probar Conexión
            </button>
            <span id="connection-result"></span>
        </div>
        
        <script>
        function checkUAPConnection() {
            const apiUrl = document.getElementById('uap_api_url').value;
            const resultElement = document.getElementById('connection-result');
            
            resultElement.innerHTML = '<span class="spinner is-active" style="float: none;"></span> Probando...';
            
            fetch(apiUrl + '/categories')
                .then(response => response.json())
                .then(data => {
                    resultElement.innerHTML = '<span style="color: green;">✓ Conexión exitosa</span>';
                })
                .catch(error => {
                    resultElement.innerHTML = '<span style="color: red;">✗ Error de conexión</span>';
                });
        }
        </script>
    </div>
</div>
