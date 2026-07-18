ALTER TABLE carrera
ADD COLUMN tipo_periodo ENUM('Semestral', 'Cuatrimestral')
NOT NULL DEFAULT 'Semestral'
AFTER nombre;

ALTER TABLE convocatoria
ADD COLUMN tipo_periodo ENUM('Semestral', 'Cuatrimestral')
NOT NULL DEFAULT 'Semestral'
AFTER nombre;

ALTER TABLE alumno
ADD COLUMN id_tipo_practica INT NULL
AFTER id_carrera;

ALTER TABLE alumno
ADD COLUMN periodo_practica ENUM('Semestral', 'Cuatrimestral') NULL
AFTER id_tipo_practica;

ALTER TABLE alumno
ADD CONSTRAINT fk_alumno_tipo_practica
FOREIGN KEY (id_tipo_practica)
REFERENCES tipo_practica(id_tipo_practica)
ON DELETE SET NULL
ON UPDATE CASCADE;

UPDATE alumno a
JOIN carrera c ON c.id_carrera = a.id_carrera
SET a.periodo_practica = c.tipo_periodo
WHERE a.periodo_practica IS NULL;

ALTER TABLE usuario
ADD COLUMN debe_cambiar_password TINYINT(1)
NOT NULL DEFAULT 0
AFTER password_hash;

ALTER TABLE usuario
ADD COLUMN fecha_cambio_password DATETIME NULL
AFTER debe_cambiar_password;

ALTER TABLE usuario
ADD COLUMN fecha_reset_password DATETIME NULL
AFTER fecha_cambio_password;
