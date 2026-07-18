-- =========================================================
-- DATOS SEMILLA PARA PRUEBAS
-- Password demo para todos los usuarios: Password123!
-- Hash generado con passlib/bcrypt del backend.
-- =========================================================

SET @demo_password_hash = '$2b$12$SfBAc0maM6Z3pYacZX9YKeExSWD.bkEp64sVUs/BQNsC20ehoeZKu';

INSERT INTO rol (id_rol, nombre, descripcion) VALUES
    (1, 'Alumno', 'Alumno que realiza practicas profesionales'),
    (2, 'Administrador', 'Administrador general del sistema'),
    (3, 'Coordinador de Practicas', 'Coordina convocatorias, expedientes y asignaciones'),
    (4, 'Coordinador de Unidades Receptoras', 'Valida empresas, convenios y vacantes'),
    (5, 'Unidad Receptora', 'Empresa receptora que da seguimiento a alumnos'),
    (6, 'Asesor Interno', 'Docente asesor que da seguimiento academico'),
    (7, 'Direccion', 'Perfil directivo de consulta y reportes')
ON DUPLICATE KEY UPDATE
    nombre = VALUES(nombre),
    descripcion = VALUES(descripcion);

INSERT INTO carrera (id_carrera, clave, nombre) VALUES
    (1, 'ISC', 'Ingenieria en Sistemas Computacionales'),
    (2, 'IGE', 'Ingenieria en Gestion Empresarial'),
    (3, 'II', 'Ingenieria Industrial')
ON DUPLICATE KEY UPDATE
    clave = VALUES(clave),
    nombre = VALUES(nombre);

INSERT INTO usuario (
    id_usuario,
    correo,
    password_hash,
    id_rol,
    estado
) VALUES
    (1, 'admin@example.com', @demo_password_hash, 2, 'Activo'),
    (2, 'coordinador@example.com', @demo_password_hash, 3, 'Activo'),
    (3, 'asesor@example.com', @demo_password_hash, 6, 'Activo'),
    (4, 'alumno1@example.com', @demo_password_hash, 1, 'Activo'),
    (5, 'alumno2@example.com', @demo_password_hash, 1, 'Activo'),
    (6, 'empresa@example.com', @demo_password_hash, 5, 'Activo'),
    (7, 'coord.unidades@example.com', @demo_password_hash, 4, 'Activo'),
    (8, 'direccion@example.com', @demo_password_hash, 7, 'Activo')
ON DUPLICATE KEY UPDATE
    correo = VALUES(correo),
    password_hash = VALUES(password_hash),
    id_rol = VALUES(id_rol),
    estado = VALUES(estado);

INSERT INTO personal_interno (
    id_personal,
    id_usuario,
    nombre,
    apellido_paterno,
    apellido_materno,
    departamento,
    cargo,
    telefono
) VALUES
    (1, 1, 'Admin', 'Sistema', NULL, 'Administracion', 'Administrador', NULL),
    (2, 2, 'Carla', 'Mendez', 'Lopez', 'Vinculacion', 'Coordinador de Practicas', NULL),
    (3, 3, 'Mario', 'Santos', 'Perez', 'Sistemas y Computacion', 'Asesor Interno', NULL),
    (4, 7, 'Ana', 'Torres', 'Morales', 'Vinculacion', 'Coordinador de Unidades Receptoras', NULL),
    (5, 8, 'Direccion', 'General', NULL, 'Direccion', 'Directivo', NULL)
ON DUPLICATE KEY UPDATE
    id_usuario = VALUES(id_usuario),
    nombre = VALUES(nombre),
    apellido_paterno = VALUES(apellido_paterno),
    apellido_materno = VALUES(apellido_materno),
    departamento = VALUES(departamento),
    cargo = VALUES(cargo),
    telefono = VALUES(telefono);

INSERT INTO alumno (
    id_alumno,
    id_usuario,
    id_carrera,
    matricula,
    semestre,
    grupo,
    creditos_aprobados,
    estado_alumno
) VALUES
    (1, 4, 1, 'A20260001', 8, 'A', 220, 'Asignado'),
    (2, 5, 2, 'A20260002', 7, 'B', 205, 'Elegible')
ON DUPLICATE KEY UPDATE
    id_usuario = VALUES(id_usuario),
    id_carrera = VALUES(id_carrera),
    matricula = VALUES(matricula),
    semestre = VALUES(semestre),
    grupo = VALUES(grupo),
    creditos_aprobados = VALUES(creditos_aprobados),
    estado_alumno = VALUES(estado_alumno);

INSERT INTO convocatoria (
    id_convocatoria,
    nombre,
    periodo,
    fecha_inicio,
    fecha_fin,
    estado
) VALUES
    (1, 'Practicas Profesionales Enero-Junio 2026', 'Enero-Junio 2026', '2026-01-15', '2026-06-30', 'Activa')
ON DUPLICATE KEY UPDATE
    nombre = VALUES(nombre),
    periodo = VALUES(periodo),
    fecha_inicio = VALUES(fecha_inicio),
    fecha_fin = VALUES(fecha_fin),
    estado = VALUES(estado);

INSERT INTO empresa (
    id_empresa,
    nombre_empresa,
    rfc,
    giro,
    domicilio,
    telefono,
    correo_contacto,
    estado_empresa,
    tipo_tramite
) VALUES
    (1, 'TechNova Solutions', 'TNO260101AB1', 'Desarrollo de software', 'Av. Universidad 120, Ciudad de Mexico', '5550102030', 'contacto@technova.local', 'Activa', 'Convenio'),
    (2, 'Industrias Orion', 'IOR260101CD2', 'Manufactura', 'Parque Industrial Norte 45, Ciudad de Mexico', '5550102040', 'rh@orion.local', 'Activa', 'Convenio')
ON DUPLICATE KEY UPDATE
    nombre_empresa = VALUES(nombre_empresa),
    rfc = VALUES(rfc),
    giro = VALUES(giro),
    domicilio = VALUES(domicilio),
    telefono = VALUES(telefono),
    correo_contacto = VALUES(correo_contacto),
    estado_empresa = VALUES(estado_empresa),
    tipo_tramite = VALUES(tipo_tramite);

INSERT INTO responsable_empresa (
    id_responsable,
    id_empresa,
    id_usuario,
    cargo,
    telefono
) VALUES
    (1, 1, 6, 'Gerente de Talento', '5550102031')
ON DUPLICATE KEY UPDATE
    id_empresa = VALUES(id_empresa),
    id_usuario = VALUES(id_usuario),
    cargo = VALUES(cargo),
    telefono = VALUES(telefono);

INSERT INTO convenio (
    id_convenio,
    id_empresa,
    fecha_inicio,
    fecha_fin,
    es_actual,
    estado_convenio
) VALUES
    (1, 1, '2026-01-01', '2026-12-31', TRUE, 'Vigente'),
    (2, 2, '2026-01-01', '2026-12-31', TRUE, 'Vigente')
ON DUPLICATE KEY UPDATE
    id_empresa = VALUES(id_empresa),
    fecha_inicio = VALUES(fecha_inicio),
    fecha_fin = VALUES(fecha_fin),
    es_actual = VALUES(es_actual),
    estado_convenio = VALUES(estado_convenio);

INSERT INTO tipo_practica (
    id_tipo_practica,
    nombre,
    horas_requeridas,
    activo
) VALUES
    (1, 'Practicas Profesionales', 480, TRUE)
ON DUPLICATE KEY UPDATE
    nombre = VALUES(nombre),
    horas_requeridas = VALUES(horas_requeridas),
    activo = VALUES(activo);

INSERT INTO vacante (
    id_vacante,
    id_empresa,
    titulo,
    descripcion,
    actividades,
    requisitos,
    cupos,
    estado_vacante,
    periodo,
    id_tipo_practica,
    id_convocatoria,
    observaciones
) VALUES
    (1, 1, 'Desarrollador Backend Jr.', 'Apoyo en desarrollo de APIs y automatizacion de procesos internos.', 'Desarrollo de APIs y automatizacion.', 'Python, SQL y control de cambios.', 3, 'Activa', 'Semestral', 1, 1, NULL),
    (2, 2, 'Analista de Procesos', 'Documentacion y mejora de procesos administrativos.', 'Mapeo y mejora de procesos.', 'Analisis, redaccion y trabajo en equipo.', 2, 'Activa', 'Semestral', 1, 1, NULL)
ON DUPLICATE KEY UPDATE
    id_empresa = VALUES(id_empresa),
    titulo = VALUES(titulo),
    descripcion = VALUES(descripcion),
    actividades = VALUES(actividades),
    requisitos = VALUES(requisitos),
    cupos = VALUES(cupos),
    estado_vacante = VALUES(estado_vacante),
    periodo = VALUES(periodo),
    id_tipo_practica = VALUES(id_tipo_practica),
    id_convocatoria = VALUES(id_convocatoria),
    observaciones = VALUES(observaciones);

INSERT INTO expediente (
    id_expediente,
    id_alumno,
    id_convocatoria,
    estado_expediente
) VALUES
    (1, 1, 1, 'Aprobado'),
    (2, 2, 1, 'En Revision')
ON DUPLICATE KEY UPDATE
    id_alumno = VALUES(id_alumno),
    id_convocatoria = VALUES(id_convocatoria),
    estado_expediente = VALUES(estado_expediente);

INSERT INTO tipo_documento (
    id_tipo_documento,
    nombre_documento,
    descripcion,
    etapa,
    obligatorio
) VALUES
    (1, 'Solicitud de practicas', 'Documento inicial firmado por el alumno.', 'Registro', TRUE),
    (2, 'Carta de aceptacion', 'Carta emitida por la empresa receptora.', 'Asignacion', TRUE),
    (3, 'Reporte final', 'Reporte final de actividades.', 'Cierre', TRUE)
ON DUPLICATE KEY UPDATE
    nombre_documento = VALUES(nombre_documento),
    descripcion = VALUES(descripcion),
    etapa = VALUES(etapa),
    obligatorio = VALUES(obligatorio);

INSERT INTO documento (
    id_documento,
    id_expediente,
    id_tipo_documento,
    nombre_archivo,
    ruta_archivo,
    estado_documento,
    generado_por_sistema,
    requiere_validacion_automatica,
    validacion_automatica_estado
) VALUES
    (1, 1, 1, 'solicitud-ana.pdf', 'uploads/documentos/solicitud-ana.pdf', 'Aprobado', FALSE, FALSE, 'No validado'),
    (2, 1, 2, 'carta-aceptacion-ana.pdf', 'uploads/documentos/carta-aceptacion-ana.pdf', 'Aprobado', FALSE, FALSE, 'No validado'),
    (3, 2, 1, 'solicitud-luis.pdf', 'uploads/documentos/solicitud-luis.pdf', 'Pendiente', FALSE, FALSE, 'No validado')
ON DUPLICATE KEY UPDATE
    id_expediente = VALUES(id_expediente),
    id_tipo_documento = VALUES(id_tipo_documento),
    nombre_archivo = VALUES(nombre_archivo),
    ruta_archivo = VALUES(ruta_archivo),
    estado_documento = VALUES(estado_documento),
    generado_por_sistema = VALUES(generado_por_sistema),
    requiere_validacion_automatica = VALUES(requiere_validacion_automatica),
    validacion_automatica_estado = VALUES(validacion_automatica_estado);

INSERT INTO seleccion_empresa (
    id_seleccion,
    id_alumno,
    id_empresa,
    id_vacante,
    prioridad,
    estado_seleccion,
    observaciones
) VALUES
    (1, 1, 1, 1, 1, 'Aprobada', 'Seleccion vinculada con la asignacion semilla.'),
    (2, 1, 2, 2, 2, 'Rechazada', 'Se aprobo la primera prioridad.'),
    (3, 2, 2, 2, 1, 'Pendiente', NULL)
ON DUPLICATE KEY UPDATE
    id_alumno = VALUES(id_alumno),
    id_empresa = VALUES(id_empresa),
    id_vacante = VALUES(id_vacante),
    prioridad = VALUES(prioridad),
    estado_seleccion = VALUES(estado_seleccion),
    observaciones = VALUES(observaciones);

INSERT INTO asignacion (
    id_asignacion,
    id_alumno,
    id_empresa,
    id_vacante,
    id_convocatoria,
    id_asesor,
    fecha_asignacion,
    estado_asignacion,
    tipo_asignacion
) VALUES
    (1, 1, 1, 1, 1, 1, '2026-02-01', 'Activa', 'Normal')
ON DUPLICATE KEY UPDATE
    id_alumno = VALUES(id_alumno),
    id_empresa = VALUES(id_empresa),
    id_vacante = VALUES(id_vacante),
    id_convocatoria = VALUES(id_convocatoria),
    id_asesor = VALUES(id_asesor),
    fecha_asignacion = VALUES(fecha_asignacion),
    estado_asignacion = VALUES(estado_asignacion),
    tipo_asignacion = VALUES(tipo_asignacion);

INSERT INTO horas (
    id_horas,
    id_asignacion,
    fecha,
    horas_realizadas,
    actividad,
    evidencia_archivo,
    estado_horas,
    observaciones
) VALUES
    (1, 1, '2026-02-03', 5.00, 'Configuracion del entorno de desarrollo y revision de requerimientos.', 'uploads/evidencias/evidencia-ana-001.pdf', 'Aprobada', 'Actividad validada por la empresa.'),
    (2, 1, '2026-02-04', 5.00, 'Implementacion de endpoints CRUD para modulo interno.', 'uploads/evidencias/evidencia-ana-002.pdf', 'Pendiente', NULL)
ON DUPLICATE KEY UPDATE
    id_asignacion = VALUES(id_asignacion),
    fecha = VALUES(fecha),
    horas_realizadas = VALUES(horas_realizadas),
    actividad = VALUES(actividad),
    evidencia_archivo = VALUES(evidencia_archivo),
    estado_horas = VALUES(estado_horas),
    observaciones = VALUES(observaciones);

INSERT INTO reporte (
    id_reporte,
    id_asignacion,
    titulo,
    descripcion,
    archivo,
    fecha_entrega,
    estado_reporte
) VALUES
    (1, 1, 'Reporte mensual febrero', 'Avances del primer mes de practicas.', 'uploads/reportes/reporte-febrero-ana.pdf', '2026-02-28', 'Pendiente')
ON DUPLICATE KEY UPDATE
    id_asignacion = VALUES(id_asignacion),
    titulo = VALUES(titulo),
    descripcion = VALUES(descripcion),
    archivo = VALUES(archivo),
    fecha_entrega = VALUES(fecha_entrega),
    estado_reporte = VALUES(estado_reporte);

INSERT INTO evaluacion (
    id_evaluacion,
    id_asignacion,
    id_usuario_evaluador,
    tipo_evaluacion,
    calificacion,
    comentarios,
    fecha_evaluacion
) VALUES
    (1, 1, 3, 'Docente', 92.50, 'Buen avance y cumplimiento de actividades.', '2026-03-01')
ON DUPLICATE KEY UPDATE
    id_asignacion = VALUES(id_asignacion),
    id_usuario_evaluador = VALUES(id_usuario_evaluador),
    tipo_evaluacion = VALUES(tipo_evaluacion),
    calificacion = VALUES(calificacion),
    comentarios = VALUES(comentarios),
    fecha_evaluacion = VALUES(fecha_evaluacion);

INSERT INTO liberacion (
    id_liberacion,
    id_asignacion,
    fecha_liberacion,
    documento_liberacion,
    estado_liberacion,
    observaciones
) VALUES
    (1, 1, NULL, NULL, 'Pendiente', 'Pendiente hasta completar horas requeridas.')
ON DUPLICATE KEY UPDATE
    id_asignacion = VALUES(id_asignacion),
    fecha_liberacion = VALUES(fecha_liberacion),
    documento_liberacion = VALUES(documento_liberacion),
    estado_liberacion = VALUES(estado_liberacion),
    observaciones = VALUES(observaciones);

INSERT INTO notificacion (
    id_notificacion,
    id_usuario,
    titulo,
    mensaje,
    leida
) VALUES
    (1, 4, 'Asignacion registrada', 'Tu asignacion a TechNova Solutions fue registrada correctamente.', FALSE),
    (2, 3, 'Alumno asignado', 'Tienes un alumno asignado para seguimiento.', FALSE)
ON DUPLICATE KEY UPDATE
    id_usuario = VALUES(id_usuario),
    titulo = VALUES(titulo),
    mensaje = VALUES(mensaje),
    leida = VALUES(leida);

INSERT INTO bitacora_auditoria (
    id_bitacora,
    id_usuario,
    accion,
    modulo,
    descripcion,
    entidad
) VALUES
    (1, 1, 'Carga de datos semilla', 'base_datos', 'Se insertaron catalogos y datos iniciales para pruebas.', 'base_datos')
ON DUPLICATE KEY UPDATE
    id_usuario = VALUES(id_usuario),
    accion = VALUES(accion),
    modulo = VALUES(modulo),
    descripcion = VALUES(descripcion),
    entidad = VALUES(entidad);

