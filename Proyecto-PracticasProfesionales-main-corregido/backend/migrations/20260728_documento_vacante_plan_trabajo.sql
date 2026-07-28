CREATE TABLE IF NOT EXISTS documento_vacante (
    id_documento_vacante INT AUTO_INCREMENT PRIMARY KEY,
    id_vacante INT NOT NULL,
    tipo_documento ENUM('Plan de trabajo') NOT NULL DEFAULT 'Plan de trabajo',
    nombre_archivo VARCHAR(255) NOT NULL,
    ruta_archivo VARCHAR(500) NOT NULL,
    estado_documento ENUM('Pendiente','Aprobado','Observado','Rechazado') NOT NULL DEFAULT 'Pendiente',
    observaciones TEXT NULL,
    fecha_subida DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    fecha_revision DATETIME NULL,
    revisado_por INT NULL,
    activo TINYINT(1) NOT NULL DEFAULT 1,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NULL ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_documento_vacante_vacante
        FOREIGN KEY (id_vacante) REFERENCES vacante(id_vacante),
    CONSTRAINT fk_documento_vacante_revisor
        FOREIGN KEY (revisado_por) REFERENCES usuario(id_usuario),
    INDEX ix_documento_vacante_vacante (id_vacante),
    INDEX ix_documento_vacante_estado (estado_documento),
    INDEX ix_documento_vacante_activo (activo)
);
