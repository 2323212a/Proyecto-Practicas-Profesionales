from dataclasses import dataclass

from sqlalchemy.orm import Session

from infrastructure.persistence.models.alumno import AlumnoModel
from infrastructure.persistence.models.regla_practica_carrera import ReglaPracticaCarreraModel


@dataclass
class ReglaPracticaAlumno:
    periodo_requerido: int
    creditos_minimos: int
    horas_requeridas: int
    origen_regla: str
    advertencia: str | None = None


def obtener_regla_practica_para_alumno(db: Session, alumno: AlumnoModel) -> ReglaPracticaAlumno | None:
    if alumno.id_tipo_practica is None:
        return None

    regla = (
        db.query(ReglaPracticaCarreraModel)
        .filter(
            ReglaPracticaCarreraModel.id_carrera == alumno.id_carrera,
            ReglaPracticaCarreraModel.id_tipo_practica == alumno.id_tipo_practica,
            ReglaPracticaCarreraModel.activo.is_(True),
        )
        .first()
    )
    if regla is not None:
        return ReglaPracticaAlumno(
            periodo_requerido=regla.periodo_requerido,
            creditos_minimos=regla.creditos_minimos,
            horas_requeridas=regla.horas_requeridas,
            origen_regla="carrera",
        )

    tipo = alumno.tipo_practica
    if tipo is None:
        return None

    return ReglaPracticaAlumno(
        periodo_requerido=tipo.semestre_requerido or 1,
        creditos_minimos=tipo.creditos_minimos or 0,
        horas_requeridas=tipo.horas_requeridas or 480,
        origen_regla="tipo_practica",
        advertencia="No hay regla especifica configurada para esta carrera y tipo de practica.",
    )
