# QA de cierre tecnico

Fecha: 2026-07-20

## 1. Estado general del proyecto

Estado: cierre tecnico parcial con backend y frontend arrancando, pero sin validacion funcional completa por falta de contrasenas reales de los usuarios de la DB local.

Recomendacion final: No listo por bloqueantes para cierre definitivo. Si es solo una demo tecnica de arranque y pantallas publicas, esta cerca; para demo funcional por roles falta validar login y flujo completo con credenciales reales.

## 2. Comandos ejecutados

- `Get-Content docs/DB_LIMPIA_CONTEXT.md`
- `Get-Content docs/PENDIENTES_TECNICOS.md`
- `rg -n "create_all|ensure_runtime_schema|schema_updates|StaticFiles|app\\.mount|API_DOCS_ENABLED|CORS_ORIGINS" backend/main.py backend/infrastructure/database backend/interfaces/api`
- `py -m compileall -q backend`
- `npx.cmd tsc --noEmit`
- `backend/.venv/Scripts/python.exe -m uvicorn main:app --host 127.0.0.1 --port 8019`
- `Invoke-WebRequest http://127.0.0.1:8019/`
- `Invoke-WebRequest http://127.0.0.1:8019/openapi.json`
- `Invoke-WebRequest http://127.0.0.1:8019/configuracion-sistema/`
- `Invoke-WebRequest http://127.0.0.1:8019/roles/`
- `Invoke-RestMethod http://127.0.0.1:8019/auth/login`
- `npx.cmd vite --host 127.0.0.1 --port 5179`
- `rg -n "password_hash|password_temporal|SMTP_PASSWORD|access_token|token" backend/interfaces/api/schemas backend/interfaces/api/routes src/domain src/app`

## 3. Resultado backend

- Backend arranco con la `.venv` local y MySQL real.
- `/` respondio `200 OK`.
- `/configuracion-sistema/` respondio `200 OK`, confirmando conexion DB operativa.
- `/roles/` respondio `401 Unauthorized`, correcto porque esta protegido.
- `/openapi.json` respondio `404 Not Found`, correcto con `API_DOCS_ENABLED=false`.
- No se encontro `create_all` ni llamada a `ensure_runtime_schema` en `main.py`.
- `/uploads` no esta montado publicamente; `main.py` conserva el comentario de no montarlo.

## 4. Resultado frontend

- `npx.cmd tsc --noEmit`: OK.
- `npx.cmd vite --host 127.0.0.1 --port 5179`: Vite arranco y quedo `ready` en `http://127.0.0.1:5179/`.
- No se hizo navegacion manual en navegador por falta de sesion valida.

## 5. Resultado login por rol

Usuarios de seed probados con `Password123!`:

- `admin@example.com`: `401 Unauthorized`
- `alumno1@example.com`: `401 Unauthorized`
- `coordinador@example.com`: `401 Unauthorized`
- `coord.unidades@example.com`: `401 Unauthorized`
- `empresa@example.com`: `401 Unauthorized`
- `asesor@example.com`: `401 Unauthorized`
- `direccion@example.com`: `401 Unauthorized`

La DB real contiene usuarios distintos:

- Administrador: `admin@unach.mx`, `admin2@unach.mx`
- Alumno: `brayan@unach.mx`, `juan@unach.mx`
- Coordinador de Practicas: `coord.practicas@unach.mx`
- Coordinador de Unidades Receptoras: `coord.unidades@unach.mx`
- Unidad Receptora: `empresa.prueba@correo.com`
- Asesor Interno: `asesor.interno@unach.mx`
- Direccion: `direccion@unach.mx`

Todos aparecen activos y con perfil correspondiente. No se probaron contrasenas reales porque no estan documentadas y no se deben leer ni alterar hashes.

## 6. Resultado flujo empresa

No validado end to end. Pendiente probar con usuario real de Unidad Receptora y Coordinador de Unidades:

1. Registro publico de empresa.
2. Revision y aceptacion/rechazo.
3. Creacion de cuenta.
4. Carga y revision documental.
5. Convenio o vinculacion.
6. Solicitud de participacion en convocatoria.
7. Creacion de vacante.
8. Revision a PrePadron.
9. Liberacion a Activa.

## 7. Resultado flujo alumno

No validado end to end. Pendiente probar con usuario real Alumno y Coordinador de Practicas:

1. Inscripcion a convocatoria.
2. Carga documental.
3. Revision documental.
4. Seleccion de vacantes.
5. Asignacion.
6. Asesor asignado.
7. Horas, reportes y evaluaciones.
8. Liberacion final.

## 8. Resultado flujo asesor

No validado end to end. Pendiente probar que el Asesor Interno solo vea alumnos asignados y pueda revisar lo correspondiente.

## 9. Resultado documentos

Pendiente validacion visual contra formatos oficiales:

- Carta compromiso.
- Carta exoneracion.
- Solicitud FO-136.
- Carta exposicion de motivos.
- Otros formatos generados por el sistema.

El estandar tecnico de subida queda centralizado en `backend/app/services/upload_security.py`, con limite de 2 MB y validacion de PDF.

## 10. Resultado seguridad

Validado:

- `/uploads` no esta montado publicamente.
- Documentos se sirven por endpoints autenticados.
- `API_DOCS_ENABLED=false` deja OpenAPI en `404`.
- `CORS_ORIGINS` no usa `*` en `.env.example`; si se configura `*`, `main.py` lo reemplaza por localhost.
- `JWT_SECRET_KEY` exige minimo 32 caracteres y no acepta el placeholder.
- `EMAIL_ENABLED=false` congela envio SMTP por defecto.
- `password_hash` no aparece como campo de respuesta; solo se usa internamente.

Pendiente manual:

- Verificar permisos cruzados: alumno no ve datos de otro alumno, empresa no ve otra empresa y asesor no ve alumnos no asignados.
- Verificar rechazo de archivos mayores a 2 MB y PDF falso/corrupto desde UI.

## 11. Bugs encontrados

- Los usuarios demo del seed no autentican contra la DB real local con `Password123!`.
- No hay credenciales reales documentadas para completar login por rol.

## 12. Bloqueantes

- Falta credencial real o reseteo controlado de cuentas de QA para probar roles.
- Sin login por rol no se puede certificar flujo empresa/alumno/asesor/direccion end to end.

## 13. Pendientes no bloqueantes

- Prueba visual completa de documentos institucionales.
- Prueba manual de consola del navegador en cada modulo.
- Prueba de archivos corruptos/peligrosos desde UI.

## 14. Decisiones funcionales pendientes

No inventadas ni implementadas:

- Progresion Practicas 1 -> Practicas 2 -> Residencia.
- Criterio exacto para acreditado/no acreditado.
- Que pasa si un alumno cancela proceso.
- Que pasa si reprueba o no concluye.
- Si puede reinscribirse a otra convocatoria.
- Estados finales oficiales de expediente.
- Reglas de repeticion.

## 15. Recomendacion final

No listo por bloqueantes para cierre definitivo.

Siguiente paso recomendado: definir o resetear credenciales de QA para los siete roles reales y ejecutar el recorrido completo documentado en `docs/PENDIENTES_TECNICOS.md`.
