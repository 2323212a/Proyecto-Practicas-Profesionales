# Contexto permanente de DB limpia

Este proyecto ya no debe adaptarse a la base vieja. La DB limpia es la fuente de verdad.

## Reglas permanentes

- No restaurar tablas ni columnas viejas.
- No agregar compatibilidad con estructura vieja.
- `usuario` guarda acceso, rol, estado y contraseña hash.
- Los datos personales se guardan en perfiles:
  - `alumno`
  - `personal_interno`
  - `responsable_empresa`
- Administrador, Coordinador de Prácticas, Coordinador de Unidades Receptoras, Asesor Interno y Dirección viven en `personal_interno`.
- Asesor Interno usa `personal_interno.id_personal`.
- `asignacion.id_asesor` apunta a `personal_interno.id_personal`.
- `seleccion_empresa` guarda `id_vacante`, no `id_empresa`.
- La empresa de una selección se obtiene con `seleccion_empresa.id_vacante -> vacante.id_empresa`.

## Vacantes

La tabla `vacante` usa:

- `id_empresa`
- `id_convocatoria`
- `id_tipo_practica`
- `titulo`
- `descripcion`
- `actividades`
- `requisitos`
- `cupos`
- `periodo`
- `estado_vacante`
- `observaciones`

No usar en `vacante`:

- `id_carrera`
- `modalidad`
- `horario`
- `cupo_total`
- `cupo_disponible`

Los cupos disponibles se calculan como:

```text
vacante.cupos - asignaciones activas de esa vacante
```

## Empresa y convocatorias

- `empresa` no usa `periodo_participacion`.
- El periodo académico se maneja desde `convocatoria.tipo_periodo` y `vacante.periodo`.
- Las empresas participan mediante `participacion_empresa_convocatoria`.

## Convocatorias, inscripción y documentación

- El alumno no elige convocatoria desde el formulario de documentos.
- Antes de cargar documentación, el alumno debe inscribirse a una convocatoria disponible.
- Convocatoria disponible para alumno significa:
  - `convocatoria.estado = "Activa"`.
  - `convocatoria.tipo_periodo = alumno.periodo_practica`.
  - La fecha actual está dentro de `fecha_inicio_documentos` y `fecha_cierre_documentos`.
  - Si aplica, coincide con el tipo de práctica del alumno.
- Al inscribirse, se crea `expediente_alumno` para `id_alumno + id_convocatoria` y se preparan los `documento_alumno` pendientes según `tipo_documento_alumno`.
- La pantalla de Documentación solo carga documentos cuando el alumno ya tiene expediente inscrito en una convocatoria activa compatible.
- Documentación no debe crear expediente automáticamente solo por entrar a la pantalla si el alumno no está inscrito.
- No se debe continuar automáticamente un expediente viejo en otra convocatoria o año.
- Expedientes viejos se conservan como historial; no borrar ni sobrescribir documentos anteriores.
- Si el expediente anterior pertenece a una convocatoria no activa o no vigente, el alumno debe inscribirse a una convocatoria disponible nueva.
- No permitir doble inscripción activa del mismo alumno para el mismo tipo de periodo/tipo de práctica.
- El alumno debe ver su convocatoria actual, periodo, fechas de etapas, estado del expediente y tipo de práctica.

## Fechas de convocatoria

- Una convocatoria solo puede estar `Activa` y operar si tiene calendario completo.
- Fechas obligatorias para convocatoria activa:
  - `fecha_inicio_general` / `fecha_cierre_general`.
  - `fecha_inicio_empresas` / `fecha_cierre_empresas`.
  - `fecha_inicio_documentos` / `fecha_cierre_documentos`.
  - `fecha_inicio_validacion` / `fecha_cierre_validacion`.
  - `fecha_inicio_seleccion` / `fecha_cierre_seleccion`.
  - `fecha_inicio_asignacion` / `fecha_cierre_asignacion`.
  - `fecha_inicio_practicas` / `fecha_cierre_practicas`.
  - `fecha_inicio_cierre` / `fecha_cierre_cierre`.
- Las fechas de etapa deben estar configuradas y en orden para operar cada etapa:
  - `fecha_inicio_documentos` / `fecha_cierre_documentos`: carga de documentos del alumno.
  - `fecha_inicio_validacion` / `fecha_cierre_validacion`: validación documental por coordinación.
  - `fecha_inicio_seleccion` / `fecha_cierre_seleccion`: selección de vacantes por alumno.
  - `fecha_inicio_asignacion` / `fecha_cierre_asignacion`: asignación por coordinación.
  - `fecha_inicio_practicas` / `fecha_cierre_practicas`: reportes, horas y seguimiento.
  - `fecha_inicio_cierre` / `fecha_cierre_cierre`: liberación y cierre administrativo.
- Flujo secuencial obligatorio:
  - General contiene todas las etapas.
  - Empresas y Documentos inician dentro del rango general.
  - Validación inicia después de Documentos.
  - Selección inicia después de Validación.
  - Asignación inicia después de Selección.
  - Prácticas inicia después de Asignación.
  - Cierre inicia después de Prácticas.
- Si falta cualquier fecha obligatoria en una convocatoria activa, mostrar: "La convocatoria no tiene calendario completo."
- Si una fecha está fuera de orden, mostrar: "El calendario de la convocatoria no respeta el flujo de etapas."
- No permitir operar una etapa fuera de sus fechas.
- Las fechas pueden editarse desde Admin/Convocatorias; la disponibilidad de módulos debe calcularse con los valores actuales.
- Alumno y coordinación deben poder consultar las fechas de etapa de la convocatoria.

## Empresa, participación y vacantes

- La empresa puede participar en varias convocatorias activas compatibles, no solo una por año.
- La participación por convocatoria se controla con `participacion_empresa_convocatoria`.
- La empresa debe solicitar o registrar participación por convocatoria dentro de fechas de empresas.
- La regla correcta de vacantes es máximo una vacante por empresa por convocatoria.
- Mantener/aplicar `UNIQUE(id_empresa, id_convocatoria)` en `vacante`.
- No usar reglas de "una vacante por año".

## Organización de archivos de alumno

- La DB sigue siendo fuente de verdad; `documento_alumno.ruta_archivo` guarda la ruta final.
- Los documentos deben guardarse bajo una ruta normalizada por alumno, tipo de práctica y convocatoria.
- Normalizar carpetas sin acentos, sin caracteres especiales y con espacios como guion bajo.

## Bitácora

La tabla `bitacora_auditoria` usa:

- `id_bitacora`
- `id_usuario`
- `accion`
- `modulo`
- `descripcion`
- `entidad`
- `id_entidad`
- `fecha`
- `ip`
- `user_agent`

No usar:

- `tabla_afectada`
- `fecha_accion`
- `detalles`

## Validación recomendada

Cuando se modifique un módulo, ejecutar solo lo necesario:

- Backend: `py_compile` del archivo tocado o `python -m compileall -q backend` si hubo muchos cambios.
- Frontend: `npm run typecheck` si se modificó TypeScript/React.
- Siempre revisar formato con `git diff --check` cuando haya repo Git.
