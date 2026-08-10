CREATE TABLE IF NOT EXISTS formato_plan_trabajo_vacante (
    id_formato_plan INT AUTO_INCREMENT PRIMARY KEY,
    id_convocatoria INT NULL,
    nombre VARCHAR(255) NOT NULL,
    descripcion TEXT NULL,
    nombre_archivo VARCHAR(255) NOT NULL,
    ruta_archivo VARCHAR(500) NOT NULL,
    activo TINYINT(1) NOT NULL DEFAULT 1,
    fecha_subida DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    subido_por INT NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NULL ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_formato_plan_convocatoria
        FOREIGN KEY (id_convocatoria) REFERENCES convocatoria(id_convocatoria),
    CONSTRAINT fk_formato_plan_usuario
        FOREIGN KEY (subido_por) REFERENCES usuario(id_usuario),
    INDEX ix_formato_plan_convocatoria (id_convocatoria),
    INDEX ix_formato_plan_activo (activo)
);

CREATE TABLE IF NOT EXISTS solicitud_ampliacion_cupos_vacante_detalle (
    id_detalle_ampliacion INT AUTO_INCREMENT PRIMARY KEY,
    id_solicitud_ampliacion INT NOT NULL,
    id_tipo_practica INT NOT NULL,
    cupos_solicitados INT NOT NULL,
    cupos_aprobados INT NULL,
    estado ENUM('Pendiente','Aprobada','Rechazada') NOT NULL DEFAULT 'Pendiente',
    observaciones TEXT NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NULL ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_ampliacion_detalle_solicitud
        FOREIGN KEY (id_solicitud_ampliacion)
        REFERENCES solicitud_ampliacion_cupos_vacante(id_solicitud_ampliacion),
    CONSTRAINT fk_ampliacion_detalle_tipo
        FOREIGN KEY (id_tipo_practica) REFERENCES tipo_practica(id_tipo_practica),
    CONSTRAINT uq_ampliacion_detalle_tipo UNIQUE (id_solicitud_ampliacion, id_tipo_practica),
    INDEX ix_ampliacion_detalle_solicitud (id_solicitud_ampliacion)
);
