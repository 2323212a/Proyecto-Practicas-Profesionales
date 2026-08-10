SET @schema_name = DATABASE();

SET @sql = (
    SELECT IF(
        COUNT(*) = 0,
        'ALTER TABLE vacante ADD COLUMN aplica_todas_carreras TINYINT(1) NOT NULL DEFAULT 0 AFTER cupos',
        'SELECT 1'
    )
    FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = @schema_name
      AND TABLE_NAME = 'vacante'
      AND COLUMN_NAME = 'aplica_todas_carreras'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

CREATE TABLE IF NOT EXISTS vacante_tipo_practica (
    id_vacante_tipo_practica INT AUTO_INCREMENT PRIMARY KEY,
    id_vacante INT NOT NULL,
    id_tipo_practica INT NOT NULL,
    cupos INT NOT NULL DEFAULT 1,
    activo TINYINT(1) NOT NULL DEFAULT 1,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NULL ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_vacante_tipo_practica_vacante
        FOREIGN KEY (id_vacante) REFERENCES vacante(id_vacante),
    CONSTRAINT fk_vacante_tipo_practica_tipo
        FOREIGN KEY (id_tipo_practica) REFERENCES tipo_practica(id_tipo_practica),
    CONSTRAINT uq_vacante_tipo_practica UNIQUE (id_vacante, id_tipo_practica)
);

CREATE TABLE IF NOT EXISTS vacante_carrera (
    id_vacante_carrera INT AUTO_INCREMENT PRIMARY KEY,
    id_vacante INT NOT NULL,
    id_carrera INT NOT NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_vacante_carrera_vacante
        FOREIGN KEY (id_vacante) REFERENCES vacante(id_vacante),
    CONSTRAINT fk_vacante_carrera_carrera
        FOREIGN KEY (id_carrera) REFERENCES carrera(id_carrera),
    CONSTRAINT uq_vacante_carrera UNIQUE (id_vacante, id_carrera)
);

CREATE TABLE IF NOT EXISTS solicitud_ampliacion_cupos_vacante (
    id_solicitud_ampliacion INT AUTO_INCREMENT PRIMARY KEY,
    id_vacante INT NOT NULL,
    id_tipo_practica INT NULL,
    cupos_solicitados INT NOT NULL,
    motivo TEXT NOT NULL,
    estado ENUM('Pendiente','Aprobada','Rechazada') NOT NULL DEFAULT 'Pendiente',
    fecha_solicitud DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    fecha_revision DATETIME NULL,
    revisada_por INT NULL,
    observaciones TEXT NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NULL ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_solicitud_ampliacion_vacante
        FOREIGN KEY (id_vacante) REFERENCES vacante(id_vacante),
    CONSTRAINT fk_solicitud_ampliacion_tipo
        FOREIGN KEY (id_tipo_practica) REFERENCES tipo_practica(id_tipo_practica),
    CONSTRAINT fk_solicitud_ampliacion_revisor
        FOREIGN KEY (revisada_por) REFERENCES usuario(id_usuario)
);

INSERT IGNORE INTO vacante_tipo_practica (id_vacante, id_tipo_practica, cupos, activo)
SELECT id_vacante, id_tipo_practica, COALESCE(cupos, 1), 1
FROM vacante
WHERE id_tipo_practica IS NOT NULL;

UPDATE vacante v
SET v.aplica_todas_carreras = 1
WHERE NOT EXISTS (
    SELECT 1
    FROM vacante_carrera vc
    WHERE vc.id_vacante = v.id_vacante
);
