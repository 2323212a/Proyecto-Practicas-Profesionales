from sqlalchemy.orm import Session

from coord_unidades.domain.repositories.responsable_empresa_repository import (
    ResponsableEmpresaRepository,
)
from coord_unidades.infrastructure.database.models.responsable_empresa_model import (
    ResponsableEmpresaModel,
)


class MySQLResponsableEmpresaRepository(ResponsableEmpresaRepository):

    def __init__(self, db: Session):
        self.db = db

    def listar_responsables_empresa(self, id_empresa: int):
        return (
            self.db.query(ResponsableEmpresaModel)
            .filter(ResponsableEmpresaModel.id_empresa == id_empresa)
            .all()
        )

    def crear_responsable_empresa(self, data):
        responsable = ResponsableEmpresaModel(
            id_empresa=data.id_empresa,
            nombre_completo=data.nombre_completo,
            cargo=data.cargo,
            correo=data.correo,
            telefono=data.telefono,
            activo=data.activo,
        )

        self.db.add(responsable)
        self.db.commit()
        self.db.refresh(responsable)

        return responsable
