from __future__ import annotations

from datetime import date, datetime

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, ConfigDict
from sqlalchemy.orm import Session

from infrastructure.database.dependencies import obtener_db
from infrastructure.security.auth_dependencies import requerir_roles
from infrastructure.persistence.models.alumno import AlumnoModel
from infrastructure.persistence.models.asignacion import AsignacionModel
from infrastructure.persistence.models.convenio import ConvenioModel
from infrastructure.persistence.models.convocatoria import ConvocatoriaModel
from infrastructure.persistence.models.seleccion_empresa import SeleccionEmpresaModel
from infrastructure.persistence.models.usuario import UsuarioModel
from infrastructure.persistence.models.vacante import VacanteModel
from interfaces.api.schemas.asignacion import AsignacionCreate, AsignacionResponse
from interfaces.api.service_factory import AsignacionService


router = APIRouter(
    prefix="/coordinador/confirmar-asignaciones",
    tags=["Coordinador - Confirmacion de Asignaciones"],
    dependencies=[Depends(requerir_roles(["Coordinador de Practicas", "Administrador"]))],
)


class VacanteConfirmacionResponse(BaseModel):
    id_vacante: int
    titulo: str
    modalidad: str
    horario: str | None = None
    cupo_total: int
    cupo_disponible: int

    model_config = ConfigDict(from_attributes=True)


class PreferenciaConfirmacionResponse(BaseModel):
    id_seleccion: int
    id_empresa: int
    id_vacante: int | None = None
    empresa: str
    prioridad: int
    estado_empresa: str
    estado_seleccion: str
    observaciones: str | None = None
    vacantes: list[VacanteConfirmacionResponse]


class AlumnoConfirmacionResponse(BaseModel):
    id_alumno: int
    nombre: str
    matricula: str
    carrera: str
    estado_alumno: str
    ya_asignado: bool
    id_asignacion: int | None = None
    empresa_asignada: str | None = None
    vacante_asignada: str | None = None
    preferencias: list[PreferenciaConfirmacionResponse]


class ConfirmacionAsignacionesResponse(BaseModel):
    convocatoria_id: int | None
    convocatoria: str | None
    alumnos: list[AlumnoConfirmacionResponse]


class ConfirmarAsignacionRequest(BaseModel):
    id_alumno: int
    id_empresa: int
    id_vacante: int
    id_docente: int | None = None
    tipo_asignacion: str = "Normal"


class RechazarSeleccionRequest(BaseModel):
    observaciones: str | None = None


def _convocatoria_vigente(db: Session):
    activa = (
        db.query(ConvocatoriaModel)
        .filter(ConvocatoriaModel.estado == "Activa")
        .order_by(ConvocatoriaModel.fecha_inicio.desc())
        .first()
    )
    if activa is not None:
        return activa

    return (
        db.query(ConvocatoriaModel)
        .order_by(ConvocatoriaModel.fecha_inicio.desc())
        .first()
    )


def _nombre_usuario(usuario: UsuarioModel) -> str:
    partes = [
        usuario.nombre,
        usuario.apellido_paterno,
        usuario.apellido_materno,
    ]
    return " ".join([parte for parte in partes if parte])


def _tiene_convenio_vigente(db: Session, id_empresa: int) -> bool:
    return (
        db.query(ConvenioModel)
        .filter(
            ConvenioModel.id_empresa == id_empresa,
            ConvenioModel.es_actual.is_(True),
            ConvenioModel.estado_convenio == "Vigente",
            ConvenioModel.fecha_inicio <= date.today(),
            ConvenioModel.fecha_fin >= date.today(),
        )
        .first()
        is not None
    )


@router.get("/", response_model=ConfirmacionAsignacionesResponse)
def listar_confirmacion_asignaciones(db: Session = Depends(obtener_db)):
    convocatoria = _convocatoria_vigente(db)

    alumnos = (
        db.query(AlumnoModel)
        .join(UsuarioModel, UsuarioModel.id_usuario == AlumnoModel.id_usuario)
        .order_by(UsuarioModel.apellido_paterno.asc(), UsuarioModel.nombre.asc())
        .all()
    )

    respuesta = []
    for alumno in alumnos:
        asignacion = None
        if convocatoria is not None:
            asignacion = (
                db.query(AsignacionModel)
                .filter(
                    AsignacionModel.id_alumno == alumno.id_alumno,
                    AsignacionModel.id_convocatoria == convocatoria.id_convocatoria,
                    AsignacionModel.estado_asignacion == "Activa",
                )
                .first()
            )

        selecciones = (
            db.query(SeleccionEmpresaModel)
            .filter(SeleccionEmpresaModel.id_alumno == alumno.id_alumno)
            .order_by(SeleccionEmpresaModel.prioridad.asc())
            .all()
        )

        preferencias = []
        for seleccion in selecciones:
            empresa = seleccion.empresa
            vacantes = []
            if (
                seleccion.estado_seleccion == "Pendiente"
                and empresa.estado_empresa == "Activa"
                and _tiene_convenio_vigente(db, empresa.id_empresa)
            ):
                vacantes = (
                    db.query(VacanteModel)
                    .filter(
                        VacanteModel.id_empresa == seleccion.id_empresa,
                        VacanteModel.id_carrera == alumno.id_carrera,
                        VacanteModel.estado_vacante == "Activa",
                        VacanteModel.cupo_disponible > 0,
                    )
                    .order_by(VacanteModel.titulo.asc())
                    .all()
                )
            preferencias.append(
                PreferenciaConfirmacionResponse(
                    id_seleccion=seleccion.id_seleccion,
                    id_empresa=seleccion.id_empresa,
                    id_vacante=seleccion.id_vacante,
                    empresa=empresa.nombre_empresa,
                    prioridad=seleccion.prioridad,
                    estado_empresa=empresa.estado_empresa,
                    estado_seleccion=seleccion.estado_seleccion,
                    observaciones=seleccion.observaciones,
                    vacantes=vacantes,
                )
            )

        respuesta.append(
            AlumnoConfirmacionResponse(
                id_alumno=alumno.id_alumno,
                nombre=_nombre_usuario(alumno.usuario),
                matricula=alumno.matricula,
                carrera=alumno.carrera.nombre,
                estado_alumno=alumno.estado_alumno,
                ya_asignado=asignacion is not None,
                id_asignacion=asignacion.id_asignacion if asignacion else None,
                empresa_asignada=(
                    asignacion.empresa.nombre_empresa if asignacion else None
                ),
                vacante_asignada=asignacion.vacante.titulo if asignacion else None,
                preferencias=preferencias,
            )
        )

    return ConfirmacionAsignacionesResponse(
        convocatoria_id=convocatoria.id_convocatoria if convocatoria else None,
        convocatoria=convocatoria.nombre if convocatoria else None,
        alumnos=respuesta,
    )


@router.post("/", response_model=AsignacionResponse)
def confirmar_asignacion(
    datos: ConfirmarAsignacionRequest,
    db: Session = Depends(obtener_db),
    usuario: UsuarioModel = Depends(requerir_roles(["Coordinador de Practicas", "Administrador"])),
):
    convocatoria = _convocatoria_vigente(db)
    if convocatoria is None:
        raise HTTPException(status_code=400, detail="No hay convocatoria registrada")
    if convocatoria.estado != "Activa":
        raise HTTPException(status_code=400, detail="La convocatoria no esta activa")

    seleccion = (
        db.query(SeleccionEmpresaModel)
        .filter(
            SeleccionEmpresaModel.id_alumno == datos.id_alumno,
            SeleccionEmpresaModel.id_empresa == datos.id_empresa,
        )
        .first()
    )
    if seleccion is None:
        raise HTTPException(
            status_code=400,
            detail="La empresa seleccionada no pertenece a las preferencias del alumno",
        )
    if seleccion.estado_seleccion != "Pendiente":
        raise HTTPException(
            status_code=400,
            detail="La seleccion ya fue revisada por coordinacion",
        )
    if not _tiene_convenio_vigente(db, datos.id_empresa):
        raise HTTPException(
            status_code=400,
            detail="No se puede asignar una empresa sin convenio vigente",
        )

    asignacion = AsignacionCreate(
        id_alumno=datos.id_alumno,
        id_empresa=datos.id_empresa,
        id_vacante=datos.id_vacante,
        id_convocatoria=convocatoria.id_convocatoria,
        id_docente=datos.id_docente,
        fecha_asignacion=date.today(),
        estado_asignacion="Activa",
        tipo_asignacion=datos.tipo_asignacion,
    )
    nueva_asignacion = AsignacionService(db).crear(asignacion)

    ahora = datetime.now()
    seleccion.id_vacante = datos.id_vacante
    seleccion.estado_seleccion = "Aprobada"
    seleccion.observaciones = "Asignacion confirmada por coordinacion."
    seleccion.fecha_revision = ahora
    seleccion.id_usuario_revisor = usuario.id_usuario

    otras = (
        db.query(SeleccionEmpresaModel)
        .filter(
            SeleccionEmpresaModel.id_alumno == datos.id_alumno,
            SeleccionEmpresaModel.id_seleccion != seleccion.id_seleccion,
            SeleccionEmpresaModel.estado_seleccion == "Pendiente",
        )
        .all()
    )
    for otra in otras:
        otra.estado_seleccion = "Rechazada"
        otra.observaciones = "Se aprobo otra opcion para este alumno."
        otra.fecha_revision = ahora
        otra.id_usuario_revisor = usuario.id_usuario

    db.commit()
    db.refresh(nueva_asignacion)
    return nueva_asignacion


@router.patch("/{id_seleccion}/rechazar")
def rechazar_seleccion(
    id_seleccion: int,
    datos: RechazarSeleccionRequest,
    db: Session = Depends(obtener_db),
    usuario: UsuarioModel = Depends(requerir_roles(["Coordinador de Practicas", "Administrador"])),
):
    seleccion = (
        db.query(SeleccionEmpresaModel)
        .filter(SeleccionEmpresaModel.id_seleccion == id_seleccion)
        .first()
    )
    if seleccion is None:
        raise HTTPException(status_code=404, detail="Seleccion no encontrada")
    if seleccion.estado_seleccion != "Pendiente":
        raise HTTPException(status_code=400, detail="La seleccion ya fue revisada")

    seleccion.estado_seleccion = "Rechazada"
    seleccion.observaciones = datos.observaciones or "Solicitud rechazada por coordinacion."
    seleccion.fecha_revision = datetime.now()
    seleccion.id_usuario_revisor = usuario.id_usuario
    db.commit()
    return {"mensaje": "Seleccion rechazada correctamente"}
