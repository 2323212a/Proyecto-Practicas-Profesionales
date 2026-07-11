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
    id_rol,
    nombre,
    apellido_paterno,
    apellido_materno,
    correo,
    password_hash,
    estado
) VALUES
    (1, 2, 'Admin', 'Sistema', NULL, 'admin@example.com', @demo_password_hash, 'Activo'),
    (2, 3, 'Carla', 'Mendez', 'Lopez', 'coordinador@example.com', @demo_password_hash, 'Activo'),
    (3, 6, 'Mario', 'Santos', 'Perez', 'asesor@example.com', @demo_password_hash, 'Activo'),
    (4, 1, 'Ana', 'Garcia', 'Torres', 'alumno1@example.com', @demo_password_hash, 'Activo'),
    (5, 1, 'Luis', 'Hernandez', 'Diaz', 'alumno2@example.com', @demo_password_hash, 'Activo'),
    (6, 5, 'Patricia', 'Ramirez', 'Nava', 'empresa@example.com', @demo_password_hash, 'Activo'),
    (7, 4, 'Ana', 'Torres', 'Morales', 'coord.unidades@example.com', @demo_password_hash, 'Activo'),
    (8, 7, 'Direccion', 'General', NULL, 'direccion@example.com', @demo_password_hash, 'Activo')
ON DUPLICATE KEY UPDATE
    id_rol = VALUES(id_rol),
    nombre = VALUES(nombre),
    apellido_paterno = VALUES(apellido_paterno),
    apellido_materno = VALUES(apellido_materno),
    correo = VALUES(correo),
    password_hash = VALUES(password_hash),
    estado = VALUES(estado);

INSERT INTO coordinador (id_coordinador, id_usuario, area, departamento) VALUES
    (1, 2, 'Practicas Profesionales', 'Vinculacion'),
    (2, 7, 'Unidades Receptoras', 'Vinculacion')
ON DUPLICATE KEY UPDATE
    id_usuario = VALUES(id_usuario),
    area = VALUES(area),
    departamento = VALUES(departamento);

INSERT INTO docente_asesor (id_docente, id_usuario, departamento) VALUES
    (1, 3, 'Sistemas y Computacion')
ON DUPLICATE KEY UPDATE
    id_usuario = VALUES(id_usuario),
    departamento = VALUES(departamento);

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
    tipo_tramite,
    periodo_participacion
) VALUES
    (1, 'TechNova Solutions', 'TNO260101AB1', 'Desarrollo de software', 'Av. Universidad 120, Ciudad de Mexico', '5550102030', 'contacto@technova.local', 'Activa', 'Convenio', 'Semestral'),
    (2, 'Industrias Orion', 'IOR260101CD2', 'Manufactura', 'Parque Industrial Norte 45, Ciudad de Mexico', '5550102040', 'rh@orion.local', 'Activa', 'Convenio', 'Ambos')
ON DUPLICATE KEY UPDATE
    nombre_empresa = VALUES(nombre_empresa),
    rfc = VALUES(rfc),
    giro = VALUES(giro),
    domicilio = VALUES(domicilio),
    telefono = VALUES(telefono),
    correo_contacto = VALUES(correo_contacto),
    estado_empresa = VALUES(estado_empresa),
    tipo_tramite = VALUES(tipo_tramite),
    periodo_participacion = VALUES(periodo_participacion);

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
    documento_convenio,
    version,
    es_actual,
    renovacion_solicitada,
    estado_convenio
) VALUES
    (1, 1, '2026-01-01', '2026-12-31', 'uploads/documentos/convenio-technova.pdf', 1, TRUE, FALSE, 'Vigente'),
    (2, 2, '2026-01-01', '2026-12-31', 'uploads/documentos/convenio-orion.pdf', 1, TRUE, FALSE, 'Vigente')
ON DUPLICATE KEY UPDATE
    id_empresa = VALUES(id_empresa),
    fecha_inicio = VALUES(fecha_inicio),
    fecha_fin = VALUES(fecha_fin),
    documento_convenio = VALUES(documento_convenio),
    version = VALUES(version),
    es_actual = VALUES(es_actual),
    renovacion_solicitada = VALUES(renovacion_solicitada),
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
    id_carrera,
    titulo,
    descripcion,
    modalidad,
    horario,
    cupo_total,
    cupo_disponible,
    estado_vacante,
    periodo,
    id_tipo_practica,
    id_convocatoria,
    observaciones
) VALUES
    (1, 1, 1, 'Desarrollador Backend Jr.', 'Apoyo en desarrollo de APIs y automatizacion de procesos internos.', 'Hibrida', 'Lunes a viernes 09:00-14:00', 3, 2, 'Activa', 'Semestral', 1, 1, NULL),
    (2, 2, 2, 'Analista de Procesos', 'Documentacion y mejora de procesos administrativos.', 'Presencial', 'Lunes a viernes 08:00-13:00', 2, 2, 'Activa', 'Semestral', 1, 1, NULL)
ON DUPLICATE KEY UPDATE
    id_empresa = VALUES(id_empresa),
    id_carrera = VALUES(id_carrera),
    titulo = VALUES(titulo),
    descripcion = VALUES(descripcion),
    modalidad = VALUES(modalidad),
    horario = VALUES(horario),
    cupo_total = VALUES(cupo_total),
    cupo_disponible = VALUES(cupo_disponible),
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
    id_docente,
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
    id_docente = VALUES(id_docente),
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
    tabla_afectada,
    detalles
) VALUES
    (1, 1, 'Carga de datos semilla', 'base_datos', 'Se insertaron catalogos y datos iniciales para pruebas.')
ON DUPLICATE KEY UPDATE
    id_usuario = VALUES(id_usuario),
    accion = VALUES(accion),
    tabla_afectada = VALUES(tabla_afectada),
    detalles = VALUES(detalles);

