from sqlalchemy.orm import Session

from coord_unidades.domain.repositories.convenio_repository import (
    ConvenioRepository,
)
from coord_unidades.infrastructure.database.models.convenio_model import (
    ConvenioModel,
)


class MySQLConvenioRepository(ConvenioRepository):

    def __init__(self, db: Session):
        self.db = db

    def listar(self):
        return self.db.query(ConvenioModel).all()

    def obtener_por_id(self, id_convenio: int):
        return (
            self.db.query(ConvenioModel)
            .filter(ConvenioModel.id_convenio == id_convenio)
            .first()
        )

    def crear(self, data):
        nuevo = ConvenioModel(
            id_empresa=data.id_empresa,
            fecha_inicio=data.fecha_inicio,
            fecha_fin=data.fecha_fin,
            documento_convenio=data.documento_convenio,
            tipo_convenio=data.tipo_convenio,
            estado_convenio="Pendiente",
            observaciones=data.observaciones,
        )

        self.db.add(nuevo)
        self.db.commit()
        self.db.refresh(nuevo)

        return nuevo

    def actualizar(self, id_convenio: int, data):
        convenio = self.obtener_por_id(id_convenio)

        if not convenio:
            return None

        convenio.fecha_inicio = data.fecha_inicio
        convenio.fecha_fin = data.fecha_fin
        convenio.documento_convenio = data.documento_convenio
        convenio.tipo_convenio = data.tipo_convenio
        convenio.observaciones = data.observaciones

        self.db.commit()
        self.db.refresh(convenio)

        return convenio
