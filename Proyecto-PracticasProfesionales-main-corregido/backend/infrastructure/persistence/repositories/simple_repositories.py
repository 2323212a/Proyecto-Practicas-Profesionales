from infrastructure.persistence.models.alumno import AlumnoModel
from infrastructure.persistence.models.carrera import CarreraModel
from infrastructure.persistence.models.convocatoria import ConvocatoriaModel
from infrastructure.persistence.models.documento import DocumentoModel
from infrastructure.persistence.models.expediente import ExpedienteModel
from infrastructure.persistence.models.rol import RolModel
from infrastructure.persistence.models.tipo_documento import TipoDocumentoModel
from infrastructure.persistence.repositories.base_repository import SQLAlchemyRepository


class AlumnoRepository(SQLAlchemyRepository):
    def __init__(self, db):
        super().__init__(db, AlumnoModel, "id_alumno")

    def nuevo(self, datos):
        return AlumnoModel(**datos)


class CarreraRepository(SQLAlchemyRepository):
    def __init__(self, db):
        super().__init__(db, CarreraModel, "id_carrera")

    def nuevo(self, datos):
        return CarreraModel(**datos)


class ConvocatoriaRepository(SQLAlchemyRepository):
    def __init__(self, db):
        super().__init__(db, ConvocatoriaModel, "id_convocatoria")

    def nuevo(self, datos):
        return ConvocatoriaModel(**datos)


class DocumentoRepository(SQLAlchemyRepository):
    def __init__(self, db):
        super().__init__(db, DocumentoModel, "id_documento")

    def nuevo(self, datos):
        return DocumentoModel(**datos)


class ExpedienteRepository(SQLAlchemyRepository):
    def __init__(self, db):
        super().__init__(db, ExpedienteModel, "id_expediente")

    def nuevo(self, datos):
        return ExpedienteModel(**datos)


class RolRepository(SQLAlchemyRepository):
    def __init__(self, db):
        super().__init__(db, RolModel, "id_rol")

    def nuevo(self, datos):
        return RolModel(**datos)


class TipoDocumentoRepository(SQLAlchemyRepository):
    def __init__(self, db):
        super().__init__(db, TipoDocumentoModel, "id_tipo_documento")

    def obtener_por_nombre_etapa(self, nombre_documento: str, etapa: str):
        return (
            self.db.query(TipoDocumentoModel)
            .filter(
                TipoDocumentoModel.nombre_documento == nombre_documento,
                TipoDocumentoModel.etapa == etapa,
            )
            .first()
        )

    def nuevo(self, datos):
        return TipoDocumentoModel(**datos)
