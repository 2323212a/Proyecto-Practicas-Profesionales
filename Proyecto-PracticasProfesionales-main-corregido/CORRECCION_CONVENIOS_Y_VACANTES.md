# Corrección de convenios y creación de vacantes

Esta revisión corrige dos inconsistencias detectadas en Unidad Receptora:

1. Una empresa con documentación aprobada y convenio vigente podía quedar bloqueada para crear vacantes si `empresa.tipo_tramite` conservaba un valor heredado (`NULL` o `Vinculacion`).
2. La revisión repetida o sustitución del documento de convenio podía dejar más de un convenio mostrado como vigente.

## Comportamiento corregido

- La existencia de un convenio actual, aprobado y dentro de vigencia habilita la captura de vacantes cuando la documentación legal obligatoria está aprobada.
- Al aprobar un convenio se corrige automáticamente `empresa.tipo_tramite` a `Convenio`.
- Solo un convenio queda marcado como actual y vigente por empresa.
- Los convenios sustituidos se conservan como historial y dejan de contarse como vigentes.
- Aprobar dos veces el mismo documento ya no crea otro convenio.
- Una empresa que ya tiene documentación legal aprobada y convenio vigente pasa a estado `Activa`.
- El perfil distingue entre `Vigente actual` e `Historico`.

## Base de datos existente

Al iniciar el backend, `schema_updates.py` repara los registros heredados de forma idempotente. También se incluye el script manual:

`backend/infrastructure/database/reparar_convenios_duplicados.sql`

Antes de aplicarlo manualmente, realiza un respaldo de la base de datos.
