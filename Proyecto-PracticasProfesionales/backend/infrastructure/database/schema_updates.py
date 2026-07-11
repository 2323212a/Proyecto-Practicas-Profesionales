from sqlalchemy import text
from sqlalchemy.engine import Engine


def ensure_runtime_schema(engine: Engine) -> None:
    updates = [
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
    ]

    with engine.begin() as connection:
        for table_name, column_name, ddl in updates:
            exists = connection.execute(
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

            if not exists:
                connection.execute(text(ddl))
