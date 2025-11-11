<div id="uap-reportar" class="uap-container">
    <div class="container py-5">
        <div class="row justify-content-center">
            <div class="col-lg-8">
                <div class="card shadow-lg">
                    <div class="card-header bg-primary text-white">
                        <h3 class="mb-0">🛸 Reportar Avistamiento UAP</h3>
                    </div>
                    <div class="card-body">
                        <form id="uap-report-form">
                            <div class="mb-3">
                                <label for="location" class="form-label">Ubicación</label>
                                <input type="text" class="form-control" id="location" name="location" required placeholder="Ciudad, País">
                            </div>
                            
                            <div class="row">
                                <div class="col-md-6 mb-3">
                                    <label for="date" class="form-label">Fecha</label>
                                    <input type="date" class="form-control" id="date" name="date" required>
                                </div>
                                <div class="col-md-6 mb-3">
                                    <label for="time" class="form-label">Hora</label>
                                    <input type="time" class="form-control" id="time" name="time" required>
                                </div>
                            </div>
                            
                            <div class="mb-3">
                                <label for="description" class="form-label">Descripción del avistamiento</label>
                                <textarea class="form-control" id="description" name="description" rows="5" required placeholder="Describe lo que observaste..."></textarea>
                            </div>
                            
                            <div class="mb-3">
                                <label for="image" class="form-label">Imagen o video (opcional)</label>
                                <input type="file" class="form-control" id="image" name="image" accept="image/*,video/*">
                                <small class="form-text text-muted">Formatos aceptados: JPG, PNG, MP4, MOV</small>
                            </div>
                            
                            <div class="mb-3">
                                <label for="email" class="form-label">Email (para seguimiento)</label>
                                <input type="email" class="form-control" id="email" name="email" placeholder="tu@email.com">
                            </div>
                            
                            <div id="report-message" class="alert d-none" role="alert"></div>
                            
                            <div class="d-grid">
                                <button type="submit" class="btn btn-primary btn-lg" id="submit-btn">
                                    <span id="submit-text">Enviar Reporte</span>
                                    <span id="submit-spinner" class="spinner-border spinner-border-sm d-none" role="status"></span>
                                </button>
                            </div>
                        </form>
                        
                        <div class="mt-4 text-center">
                            <small class="text-muted">
                                Tu reporte será revisado por nuestro equipo de análisis.<br>
                                Todos los reportes son confidenciales.
                            </small>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</div>
