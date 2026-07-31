-- Unifica los nombres de alumnos en una sola columna sin perder información.
-- Las columnas de apellidos se conservan temporalmente para compatibilidad con versiones anteriores.

CREATE TABLE IF NOT EXISTS alumno_nombre_backup_20260730 (
  id_alumno INT NOT NULL PRIMARY KEY,
  nombre VARCHAR(120) NOT NULL,
  apellido_paterno VARCHAR(120) NULL,
  apellido_materno VARCHAR(120) NULL,
  fecha_respaldo DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

INSERT IGNORE INTO alumno_nombre_backup_20260730
  (id_alumno, nombre, apellido_paterno, apellido_materno)
SELECT id_alumno, nombre, apellido_paterno, apellido_materno
FROM alumno;

ALTER TABLE alumno
  MODIFY COLUMN nombre VARCHAR(300) NOT NULL,
  MODIFY COLUMN apellido_paterno VARCHAR(120) NULL,
  MODIFY COLUMN apellido_materno VARCHAR(120) NULL;

UPDATE alumno
SET
  nombre = TRIM(CONCAT_WS(
    ' ',
    NULLIF(TRIM(nombre), ''),
    NULLIF(TRIM(apellido_paterno), ''),
    NULLIF(TRIM(apellido_materno), '')
  )),
  apellido_paterno = NULL,
  apellido_materno = NULL
WHERE COALESCE(TRIM(apellido_paterno), '') <> ''
   OR COALESCE(TRIM(apellido_materno), '') <> '';
