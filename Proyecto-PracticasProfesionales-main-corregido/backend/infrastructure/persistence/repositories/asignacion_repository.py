from infrastructure.persistence.models.alumno import AlumnoModel
from infrastructure.persistence.models.asignacion import AsignacionModel
from infrastructure.persistence.models.convocatoria import ConvocatoriaModel
from infrastructure.persistence.models.convenio import ConvenioModel
from infrastructure.persistence.models.docente_asesor import DocenteAsesorModel
from infrastructure.persistence.models.empresa import EmpresaModel
from infrastructure.persistence.models.vacante import VacanteModel
from infrastructure.persistence.repositories.base_repository import SQLAlchemyRepository


class AsignacionRepository(SQLAlchemyRepository):
    def __init__(self, db):
        super().__init__(db, AsignacionModel, "id_asignacion")

    def obtener_alumno(self, id_alumno: int):
        return self.db.query(AlumnoModel).filter(AlumnoModel.id_alumno == id_alumno).first()

    def obtener_convocatoria(self, id_convocatoria: int):
        return (
            self.db.query(ConvocatoriaModel)
            .filter(ConvocatoriaModel.id_convocatoria == id_convocatoria)
            .first()
        )

    def obtener_docente(self, id_docente: int):
        return (
            self.db.query(DocenteAsesorModel)
            .filter(DocenteAsesorModel.id_docente == id_docente)
            .first()
        )

    def obtener_empresa(self, id_empresa: int):
        return self.db.query(EmpresaModel).filter(EmpresaModel.id_empresa == id_empresa).first()

    def tiene_convenio_vigente(self, id_empresa: int, fecha) -> bool:
        return (
            self.db.query(ConvenioModel.id_convenio)
            .filter(
                ConvenioModel.id_empresa == id_empresa,
                ConvenioModel.es_actual.is_(True),
                ConvenioModel.estado_convenio == "Vigente",
                ConvenioModel.fecha_inicio <= fecha,
                ConvenioModel.fecha_fin >= fecha,
            )
            .first()
            is not None
        )

    def obtener_vacante(self, id_vacante: int):
        return self.db.query(VacanteModel).filter(VacanteModel.id_vacante == id_vacante).first()

    def obtener_por_alumno_convocatoria(self, id_alumno: int, id_convocatoria: int):
        return (
            self.db.query(AsignacionModel)
            .filter(
                AsignacionModel.id_alumno == id_alumno,
                AsignacionModel.id_convocatoria == id_convocatoria,
            )
            .first()
        )

    def nuevo(self, datos):
        return AsignacionModel(**datos)
