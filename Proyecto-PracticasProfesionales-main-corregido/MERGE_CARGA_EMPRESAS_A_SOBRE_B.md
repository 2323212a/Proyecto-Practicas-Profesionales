# Merge de carga masiva de empresas sobre B

Base oficial usada: `Proyecto-Practicas-Profesionales-Proyecto-Practicas-Profesionales-corregido (2).zip`.

Se conservó B como base. No se reemplazaron los módulos nuevos de B de reglas por carrera, vacantes multi-carrera, vacantes multi-tipo, Plan de Trabajo, ampliación de cupos ni normalización de textos visibles.

## Agregado desde A

- `backend/interfaces/api/routes/coord_unidades_importacion_empresas.py`
- `src/app/pages/coord-unidades/ImportacionEmpresasModal.tsx`
- `src/domain/coord-unidades/ImportacionEmpresa.ts`
- `src/infrastructure/coord-unidades/importacionEmpresasApi.ts`

## Integración en B

- Se registró el router de importación masiva en `backend/main.py`.
- Se agregó el botón **Cargar empresas desde Excel** en `src/app/pages/coord-unidades/ValidacionEmpresas.tsx`.
- Se agregó el modal de importación en la pantalla de empresas de Coordinación de Unidades.
- Se refresca el listado de empresas después de confirmar una importación.
- Se ajustó `importacionEmpresasApi.ts` para no forzar manualmente `Content-Type: multipart/form-data`; el `apiClient` de B elimina el header cuando detecta `FormData` y deja que el navegador coloque el boundary correcto.

## Ajuste importante de lógica

A permitía que el Excel con estatus `Aceptado` registrara la empresa como `Activa`. En B esto podía romper el flujo porque una empresa activa necesita documentación legal y convenio/vinculación, y la importación no crea cuenta de acceso.

Para no descartar ese dato, se conserva el estatus capturado dentro de las observaciones, pero la empresa importada queda como:

- `empresa.estado_empresa = 'Solicitante'`
- `solicitud_empresa.estado_solicitud = 'Recibida'`
- `responsable_empresa.id_usuario = NULL`

Así Coordinación de Unidades puede revisar la solicitud y usar el flujo normal de aceptación/creación de cuenta.

## Advertencias agregadas

- La carga masiva no crea cuentas de acceso automáticamente.
- La carga masiva no sustituye la validación documental.
- El estatus capturado en la plantilla se conserva en observaciones.

## Validaciones realizadas en el entorno de trabajo

- `python -m py_compile backend/interfaces/api/routes/coord_unidades_importacion_empresas.py backend/main.py`: OK
- `npx --no-install tsc --noEmit`: OK
- `git diff --check --no-index` contra B base: sin salida de whitespace; el código de retorno fue 1 porque existen diferencias por el merge.

`import main` no se pudo completar en el sandbox sin configurar dependencias/entorno real (`DATABASE_URL` y paquete `jose`).
