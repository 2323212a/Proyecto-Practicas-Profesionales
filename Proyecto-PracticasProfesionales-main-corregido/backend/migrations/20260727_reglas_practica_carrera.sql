-- Reglas de practica por carrera para DB limpia.
-- Idempotente: agrega columnas y tabla solo si no existen.

SET @schema_name := DATABASE();

SET @sql := (
  SELECT IF(
    COUNT(*) = 0,
    'ALTER TABLE carrera ADD COLUMN duracion_periodos INT NULL AFTER tipo_periodo',
    'SELECT 1'
  )
  FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = @schema_name
    AND TABLE_NAME = 'carrera'
    AND COLUMN_NAME = 'duracion_periodos'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @sql := (
  SELECT IF(
    COUNT(*) = 0,
    'ALTER TABLE carrera ADD COLUMN creditos_totales INT NULL AFTER duracion_periodos',
    'SELECT 1'
  )
  FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = @schema_name
    AND TABLE_NAME = 'carrera'
    AND COLUMN_NAME = 'creditos_totales'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

CREATE TABLE IF NOT EXISTS regla_practica_carrera (
  id_regla_practica_carrera INT NOT NULL AUTO_INCREMENT,
  id_carrera INT NOT NULL,
  id_tipo_practica INT NOT NULL,
  periodo_requerido INT NOT NULL,
  creditos_minimos INT NOT NULL DEFAULT 0,
  horas_requeridas INT NOT NULL DEFAULT 0,
  activo TINYINT(1) NOT NULL DEFAULT 1,
  observaciones TEXT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NULL DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id_regla_practica_carrera),
  UNIQUE KEY uq_regla_practica_carrera_tipo (id_carrera, id_tipo_practica),
  KEY idx_regla_practica_carrera_carrera (id_carrera),
  KEY idx_regla_practica_carrera_tipo (id_tipo_practica),
  KEY idx_regla_practica_carrera_activo (activo),
  CONSTRAINT fk_regla_practica_carrera_carrera
    FOREIGN KEY (id_carrera) REFERENCES carrera(id_carrera),
  CONSTRAINT fk_regla_practica_carrera_tipo
    FOREIGN KEY (id_tipo_practica) REFERENCES tipo_practica(id_tipo_practica)
);

INSERT INTO regla_practica_carrera (
  id_carrera,
  id_tipo_practica,
  periodo_requerido,
  creditos_minimos,
  horas_requeridas,
  activo,
  observaciones
)
SELECT
  c.id_carrera,
  tp.id_tipo_practica,
  COALESCE(tp.semestre_requerido, 1),
  COALESCE(tp.creditos_minimos, 0),
  COALESCE(tp.horas_requeridas, 480),
  1,
  'Regla inicial migrada desde tipo_practica.'
FROM carrera c
CROSS JOIN tipo_practica tp
LEFT JOIN regla_practica_carrera rpc
  ON rpc.id_carrera = c.id_carrera
 AND rpc.id_tipo_practica = tp.id_tipo_practica
WHERE tp.activo = 1
  AND rpc.id_regla_practica_carrera IS NULL;
