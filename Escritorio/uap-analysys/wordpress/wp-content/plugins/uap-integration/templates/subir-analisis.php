<?php
/**
 * Template: Subir Análisis
 * Sistema de análisis híbrido de 3 capas
 */

$current_user = wp_get_current_user();
?>

<div class="uap-dashboard-wrapper">
    <?php include UAP_PLUGIN_DIR . 'templates/sidebar.php'; ?>
    
    <main class="uap-dashboard-content">
        <div class="page-header">
            <h1 class="page-title">📤 Subir Análisis UAP</h1>
            <p class="page-subtitle">Sistema de análisis híbrido de 3 capas: OpenCV + Training Dataset + Llama Vision</p>
        </div>
        
        <!-- Área de Upload -->
        <div class="upload-section">
            <form id="upload-analysis-form" class="upload-form" enctype="multipart/form-data">
                <!-- Dropzone -->
                <div class="dropzone" id="dropzone">
                    <div class="dropzone-content">
                        <div class="dropzone-icon">📁</div>
                        <h3 class="dropzone-title">Arrastra tu imagen aquí</h3>
                        <p class="dropzone-text">o haz clic para seleccionar</p>
                        <p class="dropzone-formats">JPG, PNG o WEBP • Máx. 10MB</p>
                        <input type="file" id="file-input" name="image" accept="image/*" hidden>
                    </div>
                    
                    <!-- Preview -->
                    <div class="image-preview" id="image-preview" style="display: none;">
                        <img id="preview-img" src="" alt="Preview">
                        <button type="button" class="remove-btn" id="remove-image">✕</button>
                    </div>
                </div>
                
                <!-- Botón de Análisis -->
                <button type="submit" class="analyze-btn" id="analyze-btn" disabled>
                    <span class="btn-icon">🔬</span>
                    <span class="btn-text">Iniciar Análisis Híbrido</span>
                </button>
            </form>
        </div>
        
        <!-- Progreso del Análisis -->
        <div class="analysis-progress" id="analysis-progress" style="display: none;">
            <div class="progress-header">
                <h3 class="progress-title">Análisis en Progreso...</h3>
                <div class="progress-spinner"></div>
            </div>
            
            <!-- Capas del Análisis -->
            <div class="layers-progress">
                <!-- Capa 1: OpenCV -->
                <div class="layer-progress" id="layer-opencv">
                    <div class="layer-icon">🔬</div>
                    <div class="layer-info">
                        <div class="layer-name">Capa 1: Detección Objetiva (OpenCV)</div>
                        <div class="layer-status">Esperando...</div>
                    </div>
                    <div class="layer-check">⏳</div>
                </div>
                
                <!-- Capa 2: Training Dataset -->
                <div class="layer-progress" id="layer-training">
                    <div class="layer-icon">📚</div>
                    <div class="layer-info">
                        <div class="layer-name">Capa 2: Training Dataset</div>
                        <div class="layer-status">Esperando...</div>
                    </div>
                    <div class="layer-check">⏳</div>
                </div>
                
                <!-- Capa 3: Llama Vision (Condicional) -->
                <div class="layer-progress" id="layer-llama">
                    <div class="layer-icon">🤖</div>
                    <div class="layer-info">
                        <div class="layer-name">Capa 3: Llama Vision (si confianza &lt; 75%)</div>
                        <div class="layer-status">Esperando...</div>
                    </div>
                    <div class="layer-check">⏳</div>
                </div>
                
                <!-- Validación Externa -->
                <div class="layer-progress" id="layer-validation">
                    <div class="layer-icon">🌐</div>
                    <div class="layer-info">
                        <div class="layer-name">Validación Externa (APIs)</div>
                        <div class="layer-status">Esperando...</div>
                    </div>
                    <div class="layer-check">⏳</div>
                </div>
            </div>
        </div>
        
        <!-- Resultados -->
        <div class="analysis-results" id="analysis-results" style="display: none;">
            <div class="results-header">
                <h3 class="results-title">Resultados del Análisis</h3>
            </div>
            
            <div class="results-content" id="results-content">
                <!-- Se llenará dinámicamente -->
            </div>
        </div>
    </main>
</div>

<script>
(function($) {
    'use strict';
    
    let selectedFile = null;
    
    $(document).ready(function() {
        initDropzone();
        initForm();
    });
    
    /**
     * Inicializar dropzone
     */
    function initDropzone() {
        const dropzone = $('#dropzone');
        const fileInput = $('#file-input');
        const preview = $('#image-preview');
        const previewImg = $('#preview-img');
        const analyzeBtn = $('#analyze-btn');
        
        // Click en dropzone
        dropzone.on('click', function(e) {
            if (!$(e.target).hasClass('remove-btn')) {
                fileInput.click();
            }
        });
        
        // Drag & Drop
        dropzone.on('dragover', function(e) {
            e.preventDefault();
            $(this).addClass('dragover');
        });
        
        dropzone.on('dragleave', function() {
            $(this).removeClass('dragover');
        });
        
        dropzone.on('drop', function(e) {
            e.preventDefault();
            $(this).removeClass('dragover');
            
            const files = e.originalEvent.dataTransfer.files;
            if (files.length > 0) {
                handleFile(files[0]);
            }
        });
        
        // Cambio de archivo
        fileInput.on('change', function() {
            if (this.files.length > 0) {
                handleFile(this.files[0]);
            }
        });
        
        // Remover imagen
        $('#remove-image').on('click', function(e) {
            e.stopPropagation();
            selectedFile = null;
            fileInput.val('');
            preview.hide();
            $('.dropzone-content').show();
            analyzeBtn.prop('disabled', true);
        });
    }
    
    /**
     * Manejar archivo seleccionado
     */
    function handleFile(file) {
        // Validar tipo
        if (!file.type.match('image.*')) {
            alert('Por favor selecciona una imagen válida');
            return;
        }
        
        // Validar tamaño (10MB)
        if (file.size > 10 * 1024 * 1024) {
            alert('La imagen no debe superar los 10MB');
            return;
        }
        
        selectedFile = file;
        
        // Mostrar preview
        const reader = new FileReader();
        reader.onload = function(e) {
            $('#preview-img').attr('src', e.target.result);
            $('.dropzone-content').hide();
            $('#image-preview').show();
            $('#analyze-btn').prop('disabled', false);
        };
        reader.readAsDataURL(file);
    }
    
    /**
     * Inicializar formulario
     */
    function initForm() {
        $('#upload-analysis-form').on('submit', function(e) {
            e.preventDefault();
            
            if (!selectedFile) {
                alert('Por favor selecciona una imagen');
                return;
            }
            
            startAnalysis();
        });
    }
    
    /**
     * Iniciar análisis
     */
    function startAnalysis() {
        // Ocultar upload, mostrar progreso
        $('.upload-section').hide();
        $('#analysis-progress').show();
        
        // Crear FormData
        const formData = new FormData();
        formData.append('image', selectedFile);
        formData.append('userId', '<?php echo $current_user->ID; ?>');
        
        // Enviar al servidor
        $.ajax({
            url: uapConfig.apiUrl + '/upload',
            method: 'POST',
            data: formData,
            processData: false,
            contentType: false,
            xhr: function() {
                const xhr = new window.XMLHttpRequest();
                // Upload progress
                xhr.upload.addEventListener('progress', function(e) {
                    if (e.lengthComputable) {
                        const percent = (e.loaded / e.total) * 100;
                        console.log('Upload progress:', percent + '%');
                    }
                }, false);
                return xhr;
            },
            success: function(response) {
                console.log('Upload exitoso:', response);
                const analysisId = response.data.analysisId || response.analysisId;
                
                if (analysisId) {
                    pollAnalysisStatus(analysisId);
                } else {
                    showError('No se recibió ID de análisis');
                }
            },
            error: function(xhr, status, error) {
                console.error('Error en upload:', error);
                showError('Error al subir la imagen: ' + error);
            }
        });
    }
    
    /**
     * Polling del estado del análisis
     */
    function pollAnalysisStatus(analysisId) {
        const pollInterval = setInterval(function() {
            $.ajax({
                url: uapConfig.apiUrl + '/analysis/' + analysisId + '/status',
                method: 'GET',
                success: function(response) {
                    const status = response.data || response;
                    
                    updateLayerStatus(status);
                    
                    if (status.status === 'completed') {
                        clearInterval(pollInterval);
                        showResults(status);
                    } else if (status.status === 'error') {
                        clearInterval(pollInterval);
                        showError(status.errorMessage || 'Error en el análisis');
                    }
                },
                error: function() {
                    clearInterval(pollInterval);
                    showError('Error al obtener estado del análisis');
                }
            });
        }, 2000); // Poll cada 2 segundos
    }
    
    /**
     * Actualizar estado de capas
     */
    function updateLayerStatus(status) {
        // Capa OpenCV
        if (status.layers && status.layers.opencv) {
            updateLayer('opencv', status.layers.opencv.status, status.layers.opencv.confidence);
        }
        
        // Capa Training
        if (status.layers && status.layers.training) {
            updateLayer('training', status.layers.training.status, status.layers.training.confidence);
        }
        
        // Capa Llama
        if (status.layers && status.layers.llama) {
            updateLayer('llama', status.layers.llama.status, status.layers.llama.confidence);
        }
        
        // Validación
        if (status.validation) {
            updateLayer('validation', status.validation.status, status.validation.confidence);
        }
    }
    
    /**
     * Actualizar capa individual
     */
    function updateLayer(layerId, status, confidence) {
        const layer = $(`#layer-${layerId}`);
        const statusEl = layer.find('.layer-status');
        const checkEl = layer.find('.layer-check');
        
        if (status === 'completed') {
            statusEl.text(`Completado (${Math.round(confidence)}%)`);
            checkEl.text('✅').css('color', '#4ade80');
            layer.addClass('completed');
        } else if (status === 'processing') {
            statusEl.text('Procesando...');
            checkEl.text('⏳').css('color', '#f59e0b');
            layer.addClass('processing');
        } else if (status === 'skipped') {
            statusEl.text('Omitido (confianza suficiente)');
            checkEl.text('⏭️').css('color', '#8b9dc3');
            layer.addClass('skipped');
        }
    }
    
    /**
     * Mostrar resultados
     */
    function showResults(data) {
        $('#analysis-progress').hide();
        $('#analysis-results').show();
        
        const html = `
            <div class="result-card">
                <div class="result-confidence">
                    <div class="confidence-circle" style="--confidence: ${data.overallConfidence}%">
                        <span class="confidence-value">${Math.round(data.overallConfidence)}%</span>
                    </div>
                    <div class="confidence-label">Confianza General</div>
                </div>
                
                <div class="result-summary">
                    <h4>Resumen del Análisis</h4>
                    <p>${data.summary || 'Análisis completado exitosamente'}</p>
                </div>
                
                <div class="result-actions">
                    <a href="${uapConfig.homeUrl}/mis-reportes/" class="btn btn-primary">Ver Mis Reportes</a>
                    <button type="button" class="btn btn-secondary" onclick="location.reload()">Analizar Otro</button>
                </div>
            </div>
        `;
        
        $('#results-content').html(html);
    }
    
    /**
     * Mostrar error
     */
    function showError(message) {
        $('#analysis-progress').hide();
        $('#analysis-results').show();
        
        const html = `
            <div class="alert alert-danger">
                <strong>Error:</strong> ${message}
                <button type="button" class="btn btn-sm btn-secondary mt-3" onclick="location.reload()">
                    Intentar de Nuevo
                </button>
            </div>
        `;
        
        $('#results-content').html(html);
    }
    
})(jQuery);
</script>
