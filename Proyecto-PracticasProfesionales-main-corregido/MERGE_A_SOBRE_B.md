# Merge A sobre B

Base usada: **B** (`Proyecto-Practicas-Profesionales-Proyecto-Practicas-Profesionales-corregido (1).zip`).

Fuente recuperada: **A** (`Proyecto-Practicas-Profesionales-respaldo-antes-carga-empresas.zip`).

## Integrado desde A

1. `src/app/components/NotificationCenter.tsx`
   - Campana real de notificaciones.
   - Contador de no leídas.
   - Panel desplegable.
   - Marcar todas como leídas.
   - Avisos al iniciar sesión.
   - Refresco cada 60 segundos.

2. `src/app/layouts/MainLayout.tsx`
   - Integración de `NotificationCenter`.
   - `UsuarioSesion` ahora contempla `id_usuario`.
   - Se conserva el layout base de B.

3. `src/app/pages/auth/LoginPage.tsx`
   - Al iniciar sesión guarda `notificaciones:mostrar-al-iniciar` para mostrar avisos pendientes.

4. `src/app/components/NotificacionesUsuarioView.tsx`
   - Emite `notificaciones:actualizadas` al marcar una o todas como leídas.

5. Guías PDF de reportes del alumno:
   - `public/documentos/reportes/guia-informe-parcial-practicas-profesionales.pdf`
   - `public/documentos/reportes/guia-informe-final-practicas-profesionales.pdf`

6. `src/app/pages/alumno/AlumnoReportes.tsx`
   - Botones para descargar las guías de informe parcial/final.

7. `backend/app/services/documentacion_generada_service.py`
   - Responsables dinámicos desde `configuracion_sistema`.
   - Tipo de práctica real del alumno.
   - Nombre real de práctica en documentos generados.
   - Reemplazos extra de plantilla.

8. `backend/app/services/documentacion_flujo_service.py`
   - `fecha_envio_pendiente`.
   - Ordenamiento de alumnos por documentos en revisión y fecha de envío.

9. `src/domain/documento/RevisionDocumental.ts`
   - Campo opcional `fecha_envio_pendiente`.

10. `src/app/pages/coordinador/RevisionDocumentos.tsx`
    - Agrupación visual: “Documentos en revisión” y “Sin documentos en revisión”.
    - Muestra “En espera desde ...”.

11. `src/app/pages/admin/GestionUsuarios.tsx`
    - Agrupación por rol.
    - Orden por rol, nombre y correo.
    - Conteo por grupo.
    - Confirmación fuerte para eliminación definitiva de alumnos.
    - Manejo mejorado del reset cuando el correo fue enviado.

12. `backend/interfaces/api/routes/usuarios.py`
    - Eliminación controlada de alumno con registros relacionados.
    - Se adaptó para revisar tablas/columnas opcionales antes de nullear referencias.
    - Se agregaron referencias nuevas de B: `documento_vacante`, `formato_plan_trabajo_vacante` y `solicitud_ampliacion_cupos_vacante`.

## Conservado de B

No se reemplazaron los módulos nuevos de B:

- Reglas por carrera.
- Vacantes multi-carrera y multi-tipo.
- Plan de Trabajo en vacantes.
- Formatos de Plan de Trabajo.
- Solicitudes de ampliación de cupos.
- Detalle de ampliación por varios tipos de práctica.
- Convocatorias mejoradas.
- Padrón compatible por carrera/tipo/cupos.
- Corrección de multipart en `apiClient.ts`.

## Validaciones ejecutadas

- `py -m py_compile` equivalente con `python -m py_compile` en archivos backend tocados: OK.
- `npx --no-install tsc --noEmit`: OK.
- `git diff --check --no-index` entre B y el merge: OK.

## Pendientes reales

1. Probar runtime en navegador.
2. Probar campana de notificaciones con usuarios reales.
3. Probar eliminación definitiva de alumno solo con datos de QA.
4. Probar documentos generados contra plantillas reales.
5. Verificar que todas las migraciones nuevas de B estén aplicadas en MySQL.
