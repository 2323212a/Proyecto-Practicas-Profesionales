CREATE TABLE IF NOT EXISTS registro_identidad_importacion (
  id_registro_identidad INT AUTO_INCREMENT PRIMARY KEY,
  tipo_entidad VARCHAR(20) NOT NULL,
  id_entidad INT NOT NULL,
  matricula VARCHAR(50) NULL,
  rfc VARCHAR(100) NULL,
  correo VARCHAR(150) NULL,
  nombre VARCHAR(300) NULL,
  datos_json TEXT NULL,
  fecha_archivo DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  fecha_reutilizacion DATETIME NULL,
  activo TINYINT(1) NOT NULL DEFAULT 1,
  UNIQUE KEY uq_registro_identidad_tipo_id (tipo_entidad, id_entidad),
  INDEX ix_registro_identidad_matricula (tipo_entidad, matricula),
  INDEX ix_registro_identidad_rfc (tipo_entidad, rfc),
  INDEX ix_registro_identidad_correo (tipo_entidad, correo),
  INDEX ix_registro_identidad_nombre (tipo_entidad, nombre)
);
