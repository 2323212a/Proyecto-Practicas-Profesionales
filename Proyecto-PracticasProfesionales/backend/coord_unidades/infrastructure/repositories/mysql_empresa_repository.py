from datetime import datetime

from sqlalchemy.orm import Session

from coord_unidades.domain.repositories.empresa_repository import (
    EmpresaRepository,
)
from coord_unidades.infrastructure.database.models.empresa_model import (
    EmpresaModel,
)


class MySQLEmpresaRepository(EmpresaRepository):

    def __init__(self, db: Session):
        self.db = db

    def listar_empresas(self):
        return self.db.query(EmpresaModel).all()

    def obtener_empresa_por_id(self, id_empresa: int):
        return (
            self.db.query(EmpresaModel)
            .filter(EmpresaModel.id_empresa == id_empresa)
            .first()
        )

    def validar_empresa(self, id_empresa: int):
        empresa = self.obtener_empresa_por_id(id_empresa)

        if not empresa:
            return None

        empresa.estado_empresa = "Aprobada"
        empresa.fecha_validacion = datetime.utcnow()

        self.db.commit()
        self.db.refresh(empresa)

        return empresa
