from sqlalchemy import text
from sqlalchemy.orm import Session

from coord_unidades.domain.repositories.padron_empresarial_repository import (
    PadronEmpresarialRepository,
)


class MySQLPadronEmpresarialRepository(PadronEmpresarialRepository):

    def __init__(self, db: Session):
        self.db = db

    def listar_padron(self):
        query = text(
            """
            SELECT
                id_empresa,
                nombre_empresa,
                rfc,
                estado_empresa,
                id_convenio,
                estado_convenio,
                id_vacante,
                titulo,
                estado_vacante
            FROM padron_empresarial
            """
        )

        return [dict(row) for row in self.db.execute(query).mappings().all()]
