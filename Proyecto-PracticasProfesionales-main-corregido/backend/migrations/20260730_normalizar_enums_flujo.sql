-- Normaliza enums históricos del flujo principal.
-- Idempotente: puede ejecutarse de nuevo sin cambiar los valores oficiales.

ALTER TABLE expediente_alumno
  MODIFY COLUMN estado_expediente
  ENUM('Pendiente', 'En Revision', 'En revision', 'En Revisión', 'Aprobado', 'Rechazado')
  NOT NULL DEFAULT 'Pendiente';

UPDATE expediente_alumno
SET estado_expediente = 'En Revisión'
WHERE estado_expediente IN ('En Revision', 'En revision');

ALTER TABLE expediente_alumno
  MODIFY COLUMN estado_expediente
  ENUM('Pendiente', 'En Revisión', 'Aprobado', 'Rechazado')
  NOT NULL DEFAULT 'Pendiente';

ALTER TABLE solicitud_empresa
  MODIFY COLUMN estado_solicitud
  ENUM('Recibida', 'En revision', 'En Revision', 'En Revisión', 'En revisión', 'Aceptada', 'Rechazada')
  NOT NULL DEFAULT 'Recibida';

UPDATE solicitud_empresa
SET estado_solicitud = 'En revisión'
WHERE estado_solicitud IN ('En revision', 'En Revision', 'En Revisión');

ALTER TABLE solicitud_empresa
  MODIFY COLUMN estado_solicitud
  ENUM('Recibida', 'En revisión', 'Aceptada', 'Rechazada')
  NOT NULL DEFAULT 'Recibida';

ALTER TABLE asignacion
  MODIFY COLUMN tipo_asignacion
  ENUM('Normal', 'Rezagado', 'Reasignacion', 'Manual', 'Automatica', 'Automática')
  NOT NULL DEFAULT 'Normal';

UPDATE asignacion
SET tipo_asignacion = 'Normal'
WHERE tipo_asignacion IN ('Manual', 'Automatica', 'Automática');

ALTER TABLE asignacion
  MODIFY COLUMN tipo_asignacion
  ENUM('Normal', 'Rezagado', 'Reasignacion')
  NOT NULL DEFAULT 'Normal';

ALTER TABLE asignacion
  MODIFY COLUMN estado_asignacion
  ENUM('Pendiente', 'Activa', 'Cancelada', 'Finalizada', 'Rechazada')
  NOT NULL DEFAULT 'Activa';

ALTER TABLE incidencia_practica
  MODIFY COLUMN reportante
  ENUM('Alumno', 'Empresa', 'Docente', 'Asesor', 'Coordinacion')
  NOT NULL;

UPDATE incidencia_practica
SET reportante = 'Asesor'
WHERE reportante = 'Docente';

ALTER TABLE incidencia_practica
  MODIFY COLUMN reportante
  ENUM('Alumno', 'Empresa', 'Asesor', 'Coordinacion')
  NOT NULL;
