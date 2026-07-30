CREATE TABLE IF NOT EXISTS tipo_unidad_receptora (
  id_tipo_unidad_receptora INT AUTO_INCREMENT PRIMARY KEY,
  nombre VARCHAR(150) NOT NULL UNIQUE,
  descripcion TEXT NULL,
  activo TINYINT(1) NOT NULL DEFAULT 1,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NULL ON UPDATE CURRENT_TIMESTAMP
);

ALTER TABLE empresa
  ADD COLUMN IF NOT EXISTS id_tipo_unidad_receptora INT NULL;

SET @fk_tipo_unidad := (
  SELECT COUNT(*) FROM information_schema.TABLE_CONSTRAINTS
  WHERE CONSTRAINT_SCHEMA = DATABASE()
    AND TABLE_NAME = 'empresa'
    AND CONSTRAINT_NAME = 'fk_empresa_tipo_unidad_receptora'
);
SET @sql_fk_tipo_unidad := IF(
  @fk_tipo_unidad = 0,
  'ALTER TABLE empresa ADD CONSTRAINT fk_empresa_tipo_unidad_receptora FOREIGN KEY (id_tipo_unidad_receptora) REFERENCES tipo_unidad_receptora(id_tipo_unidad_receptora)',
  'SELECT 1'
);
PREPARE stmt_fk_tipo_unidad FROM @sql_fk_tipo_unidad;
EXECUTE stmt_fk_tipo_unidad;
DEALLOCATE PREPARE stmt_fk_tipo_unidad;

CREATE TABLE IF NOT EXISTS requisito_empresa_tipo_unidad (
  id_requisito_empresa_tipo_unidad INT AUTO_INCREMENT PRIMARY KEY,
  id_tipo_unidad_receptora INT NOT NULL,
  id_tipo_documento_empresa INT NOT NULL,
  obligatorio TINYINT(1) NOT NULL DEFAULT 1,
  activo TINYINT(1) NOT NULL DEFAULT 1,
  orden INT NOT NULL DEFAULT 0,
  instrucciones TEXT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NULL ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uq_requisito_empresa_tipo_unidad (id_tipo_unidad_receptora, id_tipo_documento_empresa),
  CONSTRAINT fk_requisito_tipo_unidad FOREIGN KEY (id_tipo_unidad_receptora)
    REFERENCES tipo_unidad_receptora(id_tipo_unidad_receptora),
  CONSTRAINT fk_requisito_tipo_documento_empresa FOREIGN KEY (id_tipo_documento_empresa)
    REFERENCES tipo_documento_empresa(id_tipo_documento_empresa)
);

INSERT INTO tipo_unidad_receptora (nombre, descripcion, activo) VALUES
('Sector Productivo - Persona física', 'Persona física del sector productivo.', 1),
('Sector Productivo - Persona jurídica', 'Persona jurídica del sector productivo.', 1),
('Sector Público - Estatal o Federal', 'Dependencia o entidad pública estatal o federal.', 1),
('Sector Social', 'Organización perteneciente al sector social.', 1),
('Sector Municipal - Ayuntamiento', 'Ayuntamiento municipal.', 1),
('Sector Municipal - Descentralizado o desconcentrado', 'Órgano municipal descentralizado o desconcentrado.', 1)
ON DUPLICATE KEY UPDATE descripcion = VALUES(descripcion);

INSERT INTO tipo_documento_empresa
  (nombre, descripcion, obligatorio, requiere_formato, activo, etapa, tipo_tramite)
SELECT semilla.nombre, semilla.descripcion, semilla.obligatorio, 0, 1, 'Documentacion', NULL
FROM (
  SELECT 'Acta de nacimiento' nombre, NULL descripcion, 1 obligatorio
  UNION ALL SELECT 'Identificación oficial con fotografía', NULL, 1
  UNION ALL SELECT 'Constancia de situación fiscal', NULL, 1
  UNION ALL SELECT 'Comprobante de domicilio', NULL, 1
  UNION ALL SELECT 'Acta constitutiva con datos de registro', NULL, 1
  UNION ALL SELECT 'Poder notarial para actos de administración vigente', NULL, 1
  UNION ALL SELECT 'Identificación oficial de la persona apoderada', NULL, 1
  UNION ALL SELECT 'RVOE o autorización educativa', 'Solo aplica cuando sea institución educativa.', 0
  UNION ALL SELECT 'Decreto de creación del ente público', NULL, 1
  UNION ALL SELECT 'Fundamento legal de la representación', NULL, 1
  UNION ALL SELECT 'Nombramiento de la persona titular o representante legal', NULL, 1
  UNION ALL SELECT 'Acta de sesión de cabildo que aprueba el convenio', NULL, 1
  UNION ALL SELECT 'Nombramiento de la Presidencia Municipal', NULL, 1
  UNION ALL SELECT 'Nombramiento de la Sindicatura Municipal', NULL, 1
  UNION ALL SELECT 'Identificación oficial de la Sindicatura Municipal', NULL, 1
  UNION ALL SELECT 'Acuerdo de cabildo de creación del órgano', NULL, 1
  UNION ALL SELECT 'Nombramiento de la persona titular del órgano', NULL, 1
  UNION ALL SELECT 'Identificación oficial de la persona titular del órgano', NULL, 1
) semilla
WHERE NOT EXISTS (
  SELECT 1
  FROM tipo_documento_empresa existente
  WHERE existente.nombre = semilla.nombre
);

INSERT IGNORE INTO requisito_empresa_tipo_unidad
  (id_tipo_unidad_receptora, id_tipo_documento_empresa, obligatorio, activo, orden)
SELECT tu.id_tipo_unidad_receptora, td.id_tipo_documento_empresa, 1, 1,
  FIELD(td.nombre, 'Acta de nacimiento', 'Identificación oficial con fotografía', 'Constancia de situación fiscal', 'Comprobante de domicilio')
FROM tipo_unidad_receptora tu
JOIN tipo_documento_empresa td ON td.nombre IN ('Acta de nacimiento', 'Identificación oficial con fotografía', 'Constancia de situación fiscal', 'Comprobante de domicilio')
WHERE tu.nombre = 'Sector Productivo - Persona física';

INSERT IGNORE INTO requisito_empresa_tipo_unidad
  (id_tipo_unidad_receptora, id_tipo_documento_empresa, obligatorio, activo, orden)
SELECT tu.id_tipo_unidad_receptora, td.id_tipo_documento_empresa,
  IF(td.nombre = 'RVOE o autorización educativa', 0, 1), 1, td.id_tipo_documento_empresa
FROM tipo_unidad_receptora tu
JOIN tipo_documento_empresa td ON td.nombre IN ('Acta constitutiva con datos de registro', 'Poder notarial para actos de administración vigente', 'Identificación oficial de la persona apoderada', 'Constancia de situación fiscal', 'Comprobante de domicilio', 'RVOE o autorización educativa')
WHERE tu.nombre = 'Sector Productivo - Persona jurídica';

INSERT IGNORE INTO requisito_empresa_tipo_unidad
  (id_tipo_unidad_receptora, id_tipo_documento_empresa, obligatorio, activo, orden)
SELECT tu.id_tipo_unidad_receptora, td.id_tipo_documento_empresa, 1, 1, td.id_tipo_documento_empresa
FROM tipo_unidad_receptora tu
JOIN tipo_documento_empresa td ON
  (tu.nombre = 'Sector Público - Estatal o Federal' AND td.nombre IN ('Decreto de creación del ente público', 'Fundamento legal de la representación', 'Nombramiento de la persona titular o representante legal', 'Identificación oficial con fotografía', 'Comprobante de domicilio', 'Constancia de situación fiscal'))
  OR (tu.nombre = 'Sector Social' AND td.nombre IN ('Acta constitutiva con datos de registro', 'Poder notarial para actos de administración vigente', 'Identificación oficial de la persona apoderada', 'Constancia de situación fiscal', 'Comprobante de domicilio'))
  OR (tu.nombre = 'Sector Municipal - Ayuntamiento' AND td.nombre IN ('Acta de sesión de cabildo que aprueba el convenio', 'Nombramiento de la Presidencia Municipal', 'Identificación oficial con fotografía', 'Nombramiento de la Sindicatura Municipal', 'Identificación oficial de la Sindicatura Municipal', 'Constancia de situación fiscal', 'Comprobante de domicilio'))
  OR (tu.nombre = 'Sector Municipal - Descentralizado o desconcentrado' AND td.nombre IN ('Acuerdo de cabildo de creación del órgano', 'Nombramiento de la persona titular del órgano', 'Identificación oficial de la persona titular del órgano', 'Constancia de situación fiscal', 'Comprobante de domicilio'));
