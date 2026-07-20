from __future__ import annotations

from collections.abc import Iterable
import warnings

from sqlalchemy import text
from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy.engine import Connection, Engine


ColumnUpdate = tuple[str, str, str]


def _table_exists(connection: Connection, table_name: str) -> bool:
    return bool(
        connection.execute(
            text(
                """
                SELECT COUNT(*)
                FROM information_schema.TABLES
                WHERE TABLE_SCHEMA = DATABASE()
                  AND TABLE_NAME = :table_name
                """
            ),
            {"table_name": table_name},
        ).scalar()
    )


def _column_exists(connection: Connection, table_name: str, column_name: str) -> bool:
    return bool(
        connection.execute(
            text(
                """
                SELECT COUNT(*)
                FROM information_schema.COLUMNS
                WHERE TABLE_SCHEMA = DATABASE()
                  AND TABLE_NAME = :table_name
                  AND COLUMN_NAME = :column_name
                """
            ),
            {"table_name": table_name, "column_name": column_name},
        ).scalar()
    )


def _apply_missing_columns(connection: Connection, updates: Iterable[ColumnUpdate]) -> set[tuple[str, str]]:
    added: set[tuple[str, str]] = set()
    for table_name, column_name, ddl in updates:
        if not _table_exists(connection, table_name):
            continue
        if _column_exists(connection, table_name, column_name):
            continue
        connection.execute(text(ddl))
        added.add((table_name, column_name))
    return added


def _foreign_key_exists(connection: Connection, table_name: str, column_name: str) -> bool:
    return bool(
        connection.execute(
            text(
                """
                SELECT COUNT(*)
                FROM information_schema.KEY_COLUMN_USAGE
                WHERE TABLE_SCHEMA = DATABASE()
                  AND TABLE_NAME = :table_name
                  AND COLUMN_NAME = :column_name
                  AND REFERENCED_TABLE_NAME IS NOT NULL
                """
            ),
            {"table_name": table_name, "column_name": column_name},
        ).scalar()
    )


def _add_foreign_key_when_data_is_valid(
    connection: Connection,
    *,
    table_name: str,
    column_name: str,
    referenced_table: str,
    referenced_column: str,
    constraint_name: str,
) -> None:
    """Add a missing FK without breaking startup on a legacy database with dirty data."""
    if _foreign_key_exists(connection, table_name, column_name):
        return

    invalid_count = connection.execute(
        text(
            f"""
            SELECT COUNT(*)
            FROM `{table_name}` child
            LEFT JOIN `{referenced_table}` parent
              ON parent.`{referenced_column}` = child.`{column_name}`
            WHERE child.`{column_name}` IS NOT NULL
              AND parent.`{referenced_column}` IS NULL
            """
        )
    ).scalar()

    if invalid_count:
        warnings.warn(
            f"No se agrego {constraint_name}: hay {invalid_count} referencias invalidas "
            f"en {table_name}.{column_name}.",
            RuntimeWarning,
            stacklevel=2,
        )
        return

    try:
        connection.execute(
            text(
                f"ALTER TABLE `{table_name}` "
                f"ADD CONSTRAINT `{constraint_name}` "
                f"FOREIGN KEY (`{column_name}`) "
                f"REFERENCES `{referenced_table}` (`{referenced_column}`)"
            )
        )
    except SQLAlchemyError as error:
        warnings.warn(
            f"No se pudo agregar {constraint_name}: {error}",
            RuntimeWarning,
            stacklevel=2,
        )


def _drop_single_column_unique_indexes(
    connection: Connection,
    table_name: str,
    column_name: str,
) -> None:
    """Remove legacy UNIQUE indexes that prevent reusing an inactive requirement name."""
    rows = connection.execute(
        text(
            """
            SELECT INDEX_NAME
            FROM information_schema.STATISTICS
            WHERE TABLE_SCHEMA = DATABASE()
              AND TABLE_NAME = :table_name
              AND COLUMN_NAME = :column_name
              AND NON_UNIQUE = 0
              AND INDEX_NAME <> 'PRIMARY'
            GROUP BY INDEX_NAME
            HAVING COUNT(*) = 1
            """
        ),
        {"table_name": table_name, "column_name": column_name},
    ).all()

    for (index_name,) in rows:
        safe_index_name = str(index_name).replace("`", "``")
        safe_table_name = table_name.replace("`", "``")
        connection.execute(text(f"ALTER TABLE `{safe_table_name}` DROP INDEX `{safe_index_name}`"))


def ensure_runtime_schema(engine: Engine) -> None:
    """Apply small, idempotent MySQL migrations required by the application.

    The project currently does not use Alembic. These checks keep existing databases
    compatible without failing when a column was already created manually.
    """

    base_updates: list[ColumnUpdate] = [
        (
            "tipo_documento",
            "requiere_formato",
            "ALTER TABLE tipo_documento ADD COLUMN requiere_formato TINYINT(1) NOT NULL DEFAULT 0",
        ),
        (
            "tipo_documento_empresa",
            "requiere_formato",
            "ALTER TABLE tipo_documento_empresa ADD COLUMN requiere_formato TINYINT(1) NOT NULL DEFAULT 0",
        ),
        (
            "tipo_documento_empresa",
            "etapa",
            "ALTER TABLE tipo_documento_empresa ADD COLUMN etapa ENUM('Documentacion','Convenio') NOT NULL DEFAULT 'Documentacion'",
        ),
        (
            "empresa",
            "tipo_tramite",
            "ALTER TABLE empresa ADD COLUMN tipo_tramite ENUM('Convenio','Vinculacion') NULL",
        ),
        (
            "empresa",
            "periodo_participacion",
            "ALTER TABLE empresa ADD COLUMN periodo_participacion ENUM('Semestral','Cuatrimestral','Ambos') NULL",
        ),
        (
            "vacante",
            "periodo",
            "ALTER TABLE vacante ADD COLUMN periodo ENUM('Semestral','Cuatrimestral') NULL",
        ),
        (
            "vacante",
            "id_tipo_practica",
            "ALTER TABLE vacante ADD COLUMN id_tipo_practica INT NULL",
        ),
        (
            "vacante",
            "id_convocatoria",
            "ALTER TABLE vacante ADD COLUMN id_convocatoria INT NULL",
        ),
        (
            "vacante",
            "observaciones",
            "ALTER TABLE vacante ADD COLUMN observaciones TEXT NULL",
        ),
        (
            "seleccion_empresa",
            "id_vacante",
            "ALTER TABLE seleccion_empresa ADD COLUMN id_vacante INT NULL",
        ),
        (
            "seleccion_empresa",
            "estado_seleccion",
            "ALTER TABLE seleccion_empresa ADD COLUMN estado_seleccion ENUM('Pendiente','Aprobada','Rechazada') NOT NULL DEFAULT 'Pendiente'",
        ),
        (
            "seleccion_empresa",
            "observaciones",
            "ALTER TABLE seleccion_empresa ADD COLUMN observaciones TEXT NULL",
        ),
        (
            "seleccion_empresa",
            "fecha_revision",
            "ALTER TABLE seleccion_empresa ADD COLUMN fecha_revision DATETIME NULL",
        ),
        (
            "seleccion_empresa",
            "id_usuario_revisor",
            "ALTER TABLE seleccion_empresa ADD COLUMN id_usuario_revisor INT NULL",
        ),
        (
            "convenio",
            "id_documento_empresa",
            "ALTER TABLE convenio ADD COLUMN id_documento_empresa INT NULL",
        ),
        (
            "convenio",
            "version",
            "ALTER TABLE convenio ADD COLUMN version INT NOT NULL DEFAULT 1",
        ),
        (
            "convenio",
            "es_actual",
            "ALTER TABLE convenio ADD COLUMN es_actual TINYINT(1) NOT NULL DEFAULT 1",
        ),
        (
            "convenio",
            "renovacion_solicitada",
            "ALTER TABLE convenio ADD COLUMN renovacion_solicitada TINYINT(1) NOT NULL DEFAULT 0",
        ),
        (
            "cola_correos",
            "contenido_html",
            "ALTER TABLE cola_correos ADD COLUMN contenido_html TEXT NULL",
        ),
    ]

    with engine.begin() as connection:
        added = _apply_missing_columns(connection, base_updates)

        # A fresh installation needs at least one active catalog item before a unit
        # can create its first work plan or vacancy. Existing custom values are preserved.
        connection.execute(
            text(
                """
                INSERT IGNORE INTO tipo_practica (nombre, horas_requeridas, activo)
                VALUES ('Practicas Profesionales', 480, 1)
                """
            )
        )

        # Legacy databases marked convenio requirements as general documentation.
        connection.execute(
            text(
                """
                UPDATE tipo_documento_empresa
                SET etapa = 'Convenio'
                WHERE etapa = 'Documentacion'
                  AND (
                    LOWER(nombre) LIKE '%convenio%'
                    OR LOWER(nombre) LIKE '%carta compromiso%'
                    OR LOWER(COALESCE(descripcion, '')) LIKE '%convenio%'
                    OR LOWER(COALESCE(descripcion, '')) LIKE '%carta compromiso%'
                  )
                """
            )
        )

        # The original model declared nombre as globally unique. The new workflow
        # permits reusing the name of a disabled requirement or using it in another stage.
        _drop_single_column_unique_indexes(connection, "tipo_documento_empresa", "nombre")

        if ("convenio", "es_actual") in added:
            connection.execute(
                text(
                    """
                    UPDATE convenio c
                    JOIN (
                        SELECT id_empresa, MAX(id_convenio) AS id_convenio_actual
                        FROM convenio
                        GROUP BY id_empresa
                    ) actual ON actual.id_empresa = c.id_empresa
                    SET c.es_actual = CASE
                        WHEN c.id_convenio = actual.id_convenio_actual THEN 1
                        ELSE 0
                    END
                    """
                )
            )

        # Legacy data and repeated reviews could leave more than one convenio
        # marked as current. Keep the newest current row; if none was marked,
        # use the newest convenio as the current record.
        connection.execute(
            text(
                """
                UPDATE convenio c
                JOIN (
                    SELECT
                        id_empresa,
                        COALESCE(
                            MAX(CASE WHEN es_actual = 1 THEN id_convenio END),
                            MAX(id_convenio)
                        ) AS id_convenio_actual
                    FROM convenio
                    GROUP BY id_empresa
                ) actual ON actual.id_empresa = c.id_empresa
                SET c.es_actual = CASE
                    WHEN c.id_convenio = actual.id_convenio_actual THEN 1
                    ELSE 0
                END
                """
            )
        )

        # A replaced convenio remains in the history, but it must not continue
        # counting as active. The inherited ENUM uses Vencido for historical or
        # superseded records.
        connection.execute(
            text(
                """
                UPDATE convenio
                SET estado_convenio = 'Vencido', renovacion_solicitada = 0
                WHERE es_actual = 0
                  AND estado_convenio = 'Vigente'
                """
            )
        )
        connection.execute(
            text(
                """
                UPDATE convenio
                SET estado_convenio = 'Vencido'
                WHERE es_actual = 1
                  AND estado_convenio = 'Vigente'
                  AND fecha_fin < CURRENT_DATE()
                """
            )
        )

        # An approved current convenio is authoritative. Repair companies that
        # were imported with tipo_tramite NULL/Vinculacion even though they have
        # a valid convenio, which otherwise blocks vacancy creation.
        connection.execute(
            text(
                """
                UPDATE empresa e
                JOIN convenio c ON c.id_empresa = e.id_empresa
                SET e.tipo_tramite = 'Convenio'
                WHERE c.es_actual = 1
                  AND c.estado_convenio = 'Vigente'
                  AND c.fecha_inicio <= CURRENT_DATE()
                  AND c.fecha_fin >= CURRENT_DATE()
                  AND (e.tipo_tramite IS NULL OR e.tipo_tramite <> 'Convenio')
                """
            )
        )

        # Complete legacy records that already satisfy the full workflow.
        # This avoids leaving a company in Pendiente after all mandatory legal
        # documents and its current convenio were approved.
        connection.execute(
            text(
                """
                UPDATE empresa e
                JOIN convenio c ON c.id_empresa = e.id_empresa
                SET e.estado_empresa = 'Activa'
                WHERE e.estado_empresa = 'Pendiente'
                  AND c.es_actual = 1
                  AND c.estado_convenio = 'Vigente'
                  AND c.fecha_inicio <= CURRENT_DATE()
                  AND c.fecha_fin >= CURRENT_DATE()
                  AND EXISTS (
                      SELECT 1
                      FROM tipo_documento_empresa t
                      WHERE t.activo = 1
                        AND t.obligatorio = 1
                        AND t.etapa = 'Documentacion'
                  )
                  AND NOT EXISTS (
                      SELECT 1
                      FROM tipo_documento_empresa t
                      LEFT JOIN documento_empresa d
                        ON d.id_empresa = e.id_empresa
                       AND d.id_tipo_documento_empresa = t.id_tipo_documento_empresa
                      WHERE t.activo = 1
                        AND t.obligatorio = 1
                        AND t.etapa = 'Documentacion'
                        AND (
                            d.id_documento_empresa IS NULL
                            OR d.estado_documento <> 'Aprobado'
                        )
                  )
                """
            )
        )

        # Expanding an ENUM is safe to repeat and keeps manually created databases aligned.
        connection.execute(
            text(
                """
                ALTER TABLE empresa
                MODIFY estado_empresa ENUM(
                    'Solicitante','Pendiente','Rechazada','Activa','Suspendida','Inactiva'
                ) NOT NULL DEFAULT 'Pendiente'
                """
            )
        )
        connection.execute(
            text(
                """
                ALTER TABLE vacante
                MODIFY estado_vacante ENUM(
                    'Pendiente','Con observaciones','PrePadron','Activa','Rechazada','Cerrada'
                ) NOT NULL DEFAULT 'Pendiente'
                """
            )
        )

        foreign_keys = [
            {
                "table_name": "vacante",
                "column_name": "id_tipo_practica",
                "referenced_table": "tipo_practica",
                "referenced_column": "id_tipo_practica",
                "constraint_name": "fk_vacante_tipo_practica",
            },
            {
                "table_name": "vacante",
                "column_name": "id_convocatoria",
                "referenced_table": "convocatoria",
                "referenced_column": "id_convocatoria",
                "constraint_name": "fk_vacante_convocatoria",
            },
            {
                "table_name": "seleccion_empresa",
                "column_name": "id_vacante",
                "referenced_table": "vacante",
                "referenced_column": "id_vacante",
                "constraint_name": "fk_seleccion_empresa_vacante",
            },
            {
                "table_name": "seleccion_empresa",
                "column_name": "id_usuario_revisor",
                "referenced_table": "usuario",
                "referenced_column": "id_usuario",
                "constraint_name": "fk_seleccion_empresa_revisor",
            },
            {
                "table_name": "convenio",
                "column_name": "id_documento_empresa",
                "referenced_table": "documento_empresa",
                "referenced_column": "id_documento_empresa",
                "constraint_name": "fk_convenio_documento_empresa",
            },
        ]
        for foreign_key in foreign_keys:
            _add_foreign_key_when_data_is_valid(connection, **foreign_key)
