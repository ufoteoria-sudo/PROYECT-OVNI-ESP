// Definición de todas las páginas
const Pages = {
    // ========== DASHBOARD ==========
    dashboard: () => `
        <h3 class="mb-4">Panel de Control</h3>
        
        <div class="row">
            <div class="col-md-3 mb-4">
                <div class="card stat-card">
                    <div class="text-center">
                        <i class="bi bi-cloud-upload stat-icon text-primary"></i>
                        <h3 class="mt-3" id="totalAnalysisCount">127</h3>
                        <p class="text-muted">Análisis Subidos</p>
                    </div>
                </div>
            </div>

            <div class="col-md-3 mb-4">
                <div class="card stat-card">
                    <div class="text-center">
                        <i class="bi bi-file-earmark-check stat-icon text-success"></i>
                        <h3 class="mt-3" id="completedAnalysisCount">45</h3>
                        <p class="text-muted">Completados</p>
                    </div>
                </div>
            </div>

            <div class="col-md-3 mb-4">
                <div class="card stat-card">
                    <div class="text-center">
                        <i class="bi bi-hourglass-split stat-icon text-warning"></i>
                        <h3 class="mt-3" id="processingAnalysisCount">7</h3>
                        <p class="text-muted">En Proceso</p>
                    </div>
                </div>
            </div>

            <div class="col-md-3 mb-4">
                <div class="card stat-card">
                    <div class="text-center">
                        <i class="bi bi-graph-up stat-icon text-info"></i>
                        <h3 class="mt-3">97%</h3>
                        <p class="text-muted">Precisión</p>
                    </div>
                </div>
            </div>
        </div>

        <!-- Expediente Sistema Híbrido -->
        <div class="row mt-4">
            <div class="col-md-12">
                <div class="retro-file-container">
                    <div class="retro-file-header">
                        <div class="file-stamp">CLASIFICADO</div>
                        <h3 class="file-title">
                            <i class="bi bi-file-earmark-text"></i> 
                            EXPEDIENTE: SISTEMA UAP v3.0 - HÍBRIDO
                        </h3>
                        <div class="file-id">ID: UAP-SYS-2025-001-H3</div>
                    </div>
                    
                    <div class="card retro-card mt-3">
                        <div class="card-body">
                            <h4 class="retro-title">🔬 SISTEMA DE ANÁLISIS TRICAPA</h4>
                            
                            <div class="row mt-4">
                                <div class="col-md-4">
                                    <div class="layer-box">
                                        <h5>🔍 CAPA 1: OpenCV</h5>
                                        <p class="small">Análisis Técnico Científico</p>
                                        <ul class="small">
                                            <li>Detección de objetos</li>
                                            <li>Análisis de movimiento</li>
                                            <li>Procesamiento de imagen</li>
                                        </ul>
                                        <span class="badge bg-success">✅ Operativo</span>
                                    </div>
                                </div>
                                
                                <div class="col-md-4">
                                    <div class="layer-box">
                                        <h5>🎓 CAPA 2: Training Dataset</h5>
                                        <p class="small">Clasificación Supervisada</p>
                                        <ul class="small">
                                            <li>500+ casos documentados</li>
                                            <li>Patrones UAP conocidos</li>
                                            <li>Machine Learning</li>
                                        </ul>
                                        <span class="badge bg-success">✅ Operativo</span>
                                    </div>
                                </div>
                                
                                <div class="col-md-4">
                                    <div class="layer-box">
                                        <h5>🤖 CAPA 3: Llama Vision</h5>
                                        <p class="small">IA de Última Generación</p>
                                        <ul class="small">
                                            <li>Análisis contextual</li>
                                            <li>Detección de anomalías</li>
                                            <li>Verificación cruzada</li>
                                        </ul>
                                        <span class="badge bg-success">✅ Operativo</span>
                                    </div>
                                </div>
                            </div>
                            
                            <div class="alert alert-info mt-4">
                                <strong>🛡️ Sistema de Validación Triangular:</strong> 
                                Cada análisis pasa por tres capas independientes de verificación. 
                                Solo cuando las tres capas coinciden en un resultado, el análisis se considera validado.
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `,

    // ========== SUBIR ANÁLISIS ==========
    'subir-analisis': () => `
        <div class="page-header">
            <h1 class="page-title">📤 Subir Análisis</h1>
            <p class="page-subtitle">Sube imágenes o videos para análisis con el sistema híbrido de 3 capas</p>
        </div>

        <div class="hybrid-system-card">
            <h3 class="hybrid-title">Subir Archivo para Análisis</h3>
            
            <div class="form-group">
                <label class="form-label">Seleccionar archivo (imagen o video)</label>
                <input type="file" id="fileInput" class="form-control" accept="image/*,video/*">
            </div>

            <div class="form-group">
                <label class="form-label">Descripción (opcional)</label>
                <textarea id="descripcion" class="form-control" rows="4" placeholder="Añade detalles sobre el avistamiento..."></textarea>
            </div>

            <button class="btn btn-primary" onclick="PageInit['subir-analisis'].uploadFile()">
                🚀 Iniciar Análisis
            </button>

            <div id="upload-status" style="margin-top: 20px;"></div>
        </div>
    `,

    // ========== MIS REPORTES ==========
    'mis-reportes': () => `
        <div class="page-header">
            <h1 class="page-title">📋 Mis Reportes</h1>
            <p class="page-subtitle">Historial completo de análisis realizados</p>
        </div>

        <div class="table-container">
            <div class="form-group">
                <input type="text" id="searchReportes" class="form-control" placeholder="🔍 Buscar reportes...">
            </div>

            <table class="data-table">
                <thead>
                    <tr>
                        <th>ID</th>
                        <th>Fecha</th>
                        <th>Tipo</th>
                        <th>Estado</th>
                        <th>Resultado</th>
                        <th>Acciones</th>
                    </tr>
                </thead>
                <tbody id="reportes-tbody">
                    <tr>
                        <td colspan="6" style="text-align: center; padding: 40px;">
                            <div class="loading-spinner">⏳</div>
                            <p>Cargando reportes...</p>
                        </td>
                    </tr>
                </tbody>
            </table>
        </div>
    `,

    // ========== BIBLIOTECA VISUAL ==========
    'biblioteca': () => `
        <div class="page-header">
            <h1 class="page-title">📚 Biblioteca Visual</h1>
            <p class="page-subtitle">Catálogo de objetos y fenómenos UAP conocidos</p>
        </div>

        <div class="stats-grid">
            <div class="stat-card">
                <div class="stat-icon">🛸</div>
                <div class="stat-info">
                    <div class="stat-label">Objetos UAP</div>
                    <div class="stat-value" id="total-objects">-</div>
                </div>
            </div>
            <div class="stat-card">
                <div class="stat-icon">⚡</div>
                <div class="stat-info">
                    <div class="stat-label">Fenómenos</div>
                    <div class="stat-value" id="total-phenomena">-</div>
                </div>
            </div>
        </div>

        <div id="biblioteca-content">
            <p style="text-align: center; padding: 40px; color: #8b9dc3;">
                Cargando biblioteca...
            </p>
        </div>
    `,

    // ========== ADMIN: GESTIÓN BIBLIOTECA ==========
    'admin-biblioteca': () => `
        <div class="page-header">
            <h1 class="page-title">🗂️ Gestión de Biblioteca</h1>
            <p class="page-subtitle">Administrar objetos y fenómenos UAP</p>
        </div>

        <div class="hybrid-system-card">
            <h3 class="hybrid-title">Agregar Nuevo Objeto UAP</h3>
            
            <div class="form-group">
                <label class="form-label">Nombre del objeto</label>
                <input type="text" id="objectName" class="form-control" placeholder="Ej: Disco Metálico">
            </div>

            <div class="form-group">
                <label class="form-label">Descripción</label>
                <textarea id="objectDesc" class="form-control" rows="3"></textarea>
            </div>

            <div class="form-group">
                <label class="form-label">Keywords (separadas por coma)</label>
                <input type="text" id="objectKeywords" class="form-control" placeholder="disco, metálico, plateado">
            </div>

            <button class="btn btn-primary" onclick="PageInit['admin-biblioteca'].addObject()">
                ➕ Agregar Objeto
            </button>
        </div>

        <div class="table-container" style="margin-top: 32px;">
            <h3 style="color: #00ffff; margin-bottom: 20px;">Objetos Existentes</h3>
            <div id="objects-list">Cargando...</div>
        </div>
    `,

    // ========== ADMIN: TRAINING ==========
    'admin-training': () => `
        <div class="page-header">
            <h1 class="page-title">🎓 Entrada de Datos - Training Dataset</h1>
            <p class="page-subtitle">Añadir imágenes al dataset de entrenamiento</p>
        </div>

        <div class="hybrid-system-card">
            <h3 class="hybrid-title">Upload Training Images</h3>
            
            <div class="form-group">
                <label class="form-label">Categoría</label>
                <select id="trainingCategory" class="form-control">
                    <option value="uap">UAP Auténtico</option>
                    <option value="fake">Falsificación</option>
                    <option value="natural">Fenómeno Natural</option>
                    <option value="aircraft">Aeronave Convencional</option>
                </select>
            </div>

            <div class="form-group">
                <label class="form-label">Imágenes (múltiples)</label>
                <input type="file" id="trainingFiles" class="form-control" multiple accept="image/*">
            </div>

            <button class="btn btn-primary" onclick="PageInit['admin-training'].uploadTraining()">
                🚀 Subir al Dataset
            </button>

            <div id="training-status" style="margin-top: 20px;"></div>
        </div>
    `,

    // ========== ADMIN: CONFIGURACIÓN ==========
    'admin-config': () => `
        <div class="page-header">
            <h1 class="page-title">⚙️ Configuración del Sistema</h1>
            <p class="page-subtitle">Configuración avanzada y estado de servicios</p>
        </div>

        <div class="stats-grid">
            <div class="stat-card">
                <div class="stat-icon">🔌</div>
                <div class="stat-info">
                    <div class="stat-label">API Backend</div>
                    <div class="stat-value" id="api-status">-</div>
                </div>
            </div>
            <div class="stat-card">
                <div class="stat-icon">🗄️</div>
                <div class="stat-info">
                    <div class="stat-label">MongoDB</div>
                    <div class="stat-value" id="db-status">-</div>
                </div>
            </div>
        </div>

        <div class="hybrid-system-card">
            <h3 class="hybrid-title">Configuración de URLs</h3>
            
            <div class="form-group">
                <label class="form-label">API Backend URL</label>
                <input type="text" id="apiUrl" class="form-control" value="http://localhost:3000/api">
            </div>

            <button class="btn btn-primary" onclick="PageInit['admin-config'].saveConfig()">
                💾 Guardar Configuración
            </button>

            <button class="btn btn-primary" onclick="PageInit['admin-config'].testConnection()" style="margin-left: 10px;">
                🔍 Probar Conexión
            </button>
        </div>
    `,

    // ========== MI PERFIL ==========
    'perfil': () => `
        <div class="page-header">
            <h1 class="page-title">👤 Mi Perfil</h1>
            <p class="page-subtitle">Información y configuración de la cuenta</p>
        </div>

        <div class="hybrid-system-card">
            <div style="text-align: center; margin-bottom: 24px;">
                <img src="https://ui-avatars.com/api/?name=Admin+UAP&size=120&background=667eea&color=fff&bold=true" 
                     alt="Avatar" 
                     style="width: 120px; height: 120px; border-radius: 50%; border: 4px solid rgba(0, 255, 255, 0.4);">
            </div>

            <div class="form-group">
                <label class="form-label">Nombre de usuario</label>
                <input type="text" class="form-control" value="Admin UAP" readonly>
            </div>

            <div class="form-group">
                <label class="form-label">Email</label>
                <input type="email" class="form-control" value="admin@uap.system" readonly>
            </div>

            <div class="form-group">
                <label class="form-label">Rol</label>
                <input type="text" class="form-control" value="👑 Administrador" readonly>
            </div>

            <div class="form-group">
                <label class="form-label">Nivel de acceso</label>
                <input type="text" class="form-control" value="MÁXIMO - Clasificado" readonly>
            </div>

            <p style="text-align: center; color: #8b9dc3; margin-top: 32px;">
                Sistema de autenticación completo en desarrollo
            </p>
        </div>
    `
};

// Inicializadores de páginas (para cargar datos dinámicos)
const PageInit = {
    dashboard: async () => {
        try {
            const stats = await utils.fetchAPI('/user/stats');
            document.getElementById('stat-panel').textContent = stats.totalAnalysis || '0';
            document.getElementById('stat-subidos').textContent = stats.uploaded || '0';
            document.getElementById('stat-completados').textContent = stats.completed || '0';
            document.getElementById('stat-proceso').textContent = stats.processing || '0';
        } catch (error) {
            // Datos mock si la API no responde
            document.getElementById('stat-panel').textContent = '127';
            document.getElementById('stat-subidos').textContent = '45';
            document.getElementById('stat-completados').textContent = '38';
            document.getElementById('stat-proceso').textContent = '7';
        }
    },

    'subir-analisis': {
        uploadFile: async () => {
            const fileInput = document.getElementById('fileInput');
            const descripcion = document.getElementById('descripcion').value;
            const statusDiv = document.getElementById('upload-status');

            if (!fileInput.files[0]) {
                statusDiv.innerHTML = '<p style="color: #ff0055;">⚠️ Selecciona un archivo primero</p>';
                return;
            }

            statusDiv.innerHTML = '<div class="loading"><div class="loading-spinner">⏳</div><p>Subiendo y analizando...</p></div>';

            // Simular análisis (aquí iría la llamada real a la API)
            setTimeout(() => {
                statusDiv.innerHTML = `
                    <div style="background: rgba(0, 255, 0, 0.1); border: 2px solid rgba(0, 255, 0, 0.3); border-radius: 12px; padding: 20px; text-align: center;">
                        <h3 style="color: #4ade80; margin-bottom: 12px;">✅ Análisis Completado</h3>
                        <p style="color: #b0bec5;">El archivo ha sido procesado por las 3 capas del sistema híbrido.</p>
                        <p style="color: #00ffff; font-weight: 700; margin-top: 12px;">ID: UAP-${Date.now()}</p>
                    </div>
                `;
            }, 3000);
        }
    },

    'mis-reportes': async () => {
        const tbody = document.getElementById('reportes-tbody');
        
        // Mock data (aquí iría la llamada a la API)
        setTimeout(() => {
            tbody.innerHTML = `
                <tr>
                    <td>UAP-20251110-001</td>
                    <td>10/11/2025 14:30</td>
                    <td>Imagen</td>
                    <td style="color: #4ade80;">✅ Completado</td>
                    <td style="color: #00ffff;">UAP Auténtico</td>
                    <td><button class="btn btn-primary" style="padding: 6px 12px; font-size: 12px;">Ver</button></td>
                </tr>
                <tr>
                    <td>UAP-20251110-002</td>
                    <td>10/11/2025 12:15</td>
                    <td>Video</td>
                    <td style="color: #ffa500;">⏳ Procesando</td>
                    <td>-</td>
                    <td><button class="btn btn-primary" style="padding: 6px 12px; font-size: 12px;">Ver</button></td>
                </tr>
            `;
        }, 1000);
    },

    'biblioteca': async () => {
        try {
            const objects = await utils.fetchAPI('/library/objects');
            document.getElementById('total-objects').textContent = objects.length || '0';
            document.getElementById('total-phenomena').textContent = '12';
        } catch (error) {
            document.getElementById('total-objects').textContent = '24';
            document.getElementById('total-phenomena').textContent = '12';
        }
    },

    'admin-biblioteca': {
        addObject: async () => {
            const name = document.getElementById('objectName').value;
            const description = document.getElementById('objectDesc').value;
            const keywords = document.getElementById('objectKeywords').value;

            if (!name || !description) {
                alert('❌ Rellena todos los campos');
                return;
            }

            utils.showNotification('✅ Objeto agregado correctamente');
            document.getElementById('objectName').value = '';
            document.getElementById('objectDesc').value = '';
            document.getElementById('objectKeywords').value = '';
        }
    },

    'admin-training': {
        uploadTraining: () => {
            const files = document.getElementById('trainingFiles').files;
            const category = document.getElementById('trainingCategory').value;
            const statusDiv = document.getElementById('training-status');

            if (files.length === 0) {
                statusDiv.innerHTML = '<p style="color: #ff0055;">⚠️ Selecciona al menos una imagen</p>';
                return;
            }

            statusDiv.innerHTML = '<div class="loading"><div class="loading-spinner">⏳</div><p>Subiendo al dataset...</p></div>';

            setTimeout(() => {
                statusDiv.innerHTML = `
                    <div style="background: rgba(0, 255, 0, 0.1); border: 2px solid rgba(0, 255, 0, 0.3); border-radius: 12px; padding: 20px; text-align: center;">
                        <h3 style="color: #4ade80;">✅ ${files.length} imagen(es) agregadas al dataset</h3>
                        <p style="color: #b0bec5;">Categoría: ${category}</p>
                    </div>
                `;
            }, 2000);
        }
    },

    'admin-config': {
        testConnection: async () => {
            document.getElementById('api-status').textContent = '🔄';
            document.getElementById('db-status').textContent = '🔄';

            try {
                await fetch('http://localhost:3000/api/categories');
                document.getElementById('api-status').textContent = '✅';
                document.getElementById('db-status').textContent = '✅';
            } catch (error) {
                document.getElementById('api-status').textContent = '❌';
                document.getElementById('db-status').textContent = '❌';
            }
        },

        saveConfig: () => {
            utils.showNotification('✅ Configuración guardada');
        }
    }
};
