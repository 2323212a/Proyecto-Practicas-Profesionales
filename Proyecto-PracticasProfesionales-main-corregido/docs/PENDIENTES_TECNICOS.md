# Pendientes tecnicos

## Seguimiento historico de practicas del alumno

Actualmente el sistema valida la elegibilidad del alumno usando el proceso actual registrado en `alumno.id_tipo_practica`, junto con `alumno.semestre`, `alumno.creditos_aprobados`, `tipo_practica.semestre_requerido` y `tipo_practica.creditos_minimos`.

Esta validacion funciona para determinar si el alumno puede iniciar el proceso que tiene asignado actualmente, pero no conserva evidencia formal de procesos anteriores. Por esa razon, `alumno.id_tipo_practica` no es suficiente para validar correctamente la progresion:

- Practicas 1 -> Practicas 2 -> Residencia

En una siguiente etapa se debe disenar e implementar una tabla historica del proceso del alumno, por ejemplo `alumno_proceso_practica`.

Campos sugeridos:

- `id_alumno_proceso_practica`
- `id_alumno`
- `id_tipo_practica`
- `id_convocatoria`
- `semestre_al_momento`
- `creditos_al_momento`
- `periodo`
- `estado`
- `fecha_inicio`
- `fecha_fin`
- `observaciones`
- `creado_por`
- `actualizado_por`
- `created_at`
- `updated_at`

Estados sugeridos:

- Pendiente
- En proceso
- Finalizada
- Acreditada
- No acreditada
- Cancelada

Regla futura:

- Para Practicas 1 basta cumplir semestre y creditos.
- Para Practicas 2 se debe cumplir semestre, creditos y tener Practicas 1 acreditada.
- Para Residencia se debe cumplir semestre, creditos y tener Practicas 2 acreditada.

Antes de implementar se debe definir:

1. Quien puede marcar una practica como Acreditada.
2. Desde que pantalla se cerrara el proceso.
3. Que documentos o evaluaciones se requieren para acreditar.
4. Como se relacionara con asignaciones, asesores, empresas y convocatoria.
5. Si un alumno puede repetir un proceso No acreditado.
6. Que pasa si una practica queda Cancelada.
7. Si el historial se genera al iniciar seleccion, al asignar empresa o al aprobar documentacion.

Este pendiente no implica cambios actuales en base de datos, migraciones, endpoints ni frontend.
