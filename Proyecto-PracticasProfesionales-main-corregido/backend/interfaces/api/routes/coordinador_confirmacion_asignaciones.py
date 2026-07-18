from __future__ import annotations

from datetime import date, datetime

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, ConfigDict
from sqlalchemy import func
from sqlalchemy.orm import Session, joinedload

from infrastructure.database.dependencies import obtener_db
from infrastructure.persistence.models.alumno import AlumnoModel
from infrastructure.persistence.models.asignacion import AsignacionModel
from infrastructure.persistence.models.convocatoria import ConvocatoriaModel
from infrastructure.persistence.models.personal_interno import PersonalInternoModel
from infrastructure.persistence.models.rol import RolModel
from infrastructure.persistence.models.seleccion_empresa import SeleccionEmpresaModel
from infrastructure.persistence.models.usuario import UsuarioModel
from infrastructure.persistence.models.vacante import VacanteModel
from infrastructure.security.auth_dependencies import requerir_roles
from interfaces.api.schemas.asignacion import AsignacionCreate, AsignacionResponse
from interfaces.api.service_factory import AsignacionService


router = APIRouter(
    prefix="/coordinador/confirmar-asignaciones",
    tags=["Coordinador - Confirmacion de Asignaciones"],
    dependencies=[Depends(requerir_roles(["Coordinador de Practicas", "Administrador"]))],
)


class VacanteConfirmacionResponse(BaseModel):
    id_vacante: int
    id_empresa: int
    empresa: str
    id_convocatoria: int
    convocatoria: str | None = None
    id_tipo_practica: int
    tipo_practica: str | None = None
    titulo: str
    descripcion: str | None = None
    actividades: str | None = None
    requisitos: str | None = None
    cupos: int
    cupos_usados: int
    cupos_disponibles: int
    periodo: str
    estado_vacante: str

    model_config = ConfigDict(from_attributes=True)


class PreferenciaConfirmacionResponse(BaseModel):
    id_seleccion: int
    id_empresa: int
    id_convocatoria: int
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
    periodo_practica: str
    ya_asignado: bool
    id_asignacion: int | None = None
    empresa_asignada: str | None = None
    vacante_asignada: str | None = None
    preferencias: list[PreferenciaConfirmacionResponse]


class AsesorInternoResponse(BaseModel):
    id_asesor: int
    id_usuario: int
    nombre: str
    correo: str | None = None
    departamento: str | None = None
    cargo: str | None = None


class ConfirmacionAsignacionesResponse(BaseModel):
    convocatoria_id: int | None
    convocatoria: str | None
    asesores: list[AsesorInternoResponse]
    alumnos: list[AlumnoConfirmacionResponse]


class ConfirmarAsignacionRequest(BaseModel):
    id_alumno: int
    id_empresa: int
    id_vacante: int
    id_asesor: int | None = None
    tipo_asignacion: str = "Normal"


class RechazarSeleccionRequest(BaseModel):
    observaciones: str | None = None


def _convocatoria_vigente(db: Session):
    activa = (
        db.query(ConvocatoriaModel)
        .filter(ConvocatoriaModel.estado == "Activa")
        .order_by(ConvocatoriaModel.fecha_inicio_general.desc(), ConvocatoriaModel.created_at.desc())
        .first()
    )
    if activa is not None:
        return activa
    return db.query(ConvocatoriaModel).order_by(ConvocatoriaModel.fecha_inicio_general.desc(), ConvocatoriaModel.created_at.desc()).first()


def _nombre_alumno(alumno: AlumnoModel) -> str:
    return " ".join(
        parte
        for parte in [alumno.nombre, alumno.apellido_paterno, alumno.apellido_materno]
        if parte
    )


def _nombre_personal(persona: PersonalInternoModel | None) -> str:
    if persona is None:
        return "Sin asesor"
    return " ".join(
        parte
        for parte in [persona.nombre, persona.apellido_paterno, persona.apellido_materno]
        if parte
    )


def _cupos_usados(db: Session, id_vacante: int) -> int:
    return (
        db.query(func.count(AsignacionModel.id_asignacion))
        .filter(
            AsignacionModel.id_vacante == id_vacante,
            AsignacionModel.estado_asignacion == "Activa",
        )
        .scalar()
        or 0
    )


def _vacante_response(db: Session, vacante: VacanteModel) -> VacanteConfirmacionResponse:
    cupos_usados = _cupos_usados(db, vacante.id_vacante)
    return VacanteConfirmacionResponse(
        id_vacante=vacante.id_vacante,
        id_empresa=vacante.id_empresa,
        empresa=vacante.empresa.nombre_empresa if vacante.empresa else "Sin empresa",
        id_convocatoria=vacante.id_convocatoria,
        convocatoria=vacante.convocatoria.nombre if vacante.convocatoria else None,
        id_tipo_practica=vacante.id_tipo_practica,
        tipo_practica=vacante.tipo_practica.nombre if vacante.tipo_practica else None,
        titulo=vacante.titulo,
        descripcion=vacante.descripcion,
        actividades=vacante.actividades,
        requisitos=vacante.requisitos,
        cupos=vacante.cupos,
        cupos_usados=cupos_usados,
        cupos_disponibles=max(vacante.cupos - cupos_usados, 0),
        periodo=vacante.periodo,
        estado_vacante=vacante.estado_vacante,
    )


def _estado_seleccion_api(
    seleccion: SeleccionEmpresaModel,
    asignacion: AsignacionModel | None = None,
) -> str:
    if seleccion.estado == "Cancelada":
        return "Rechazada"
    if asignacion is not None and asignacion.id_vacante == seleccion.id_vacante:
        return "Aprobada"
    return "Pendiente"


def _listar_asesores(db: Session) -> list[AsesorInternoResponse]:
    asesores = (
        db.query(PersonalInternoModel)
        .join(PersonalInternoModel.usuario)
        .join(UsuarioModel.rol)
        .filter(
            RolModel.id_rol == 6,
            UsuarioModel.estado == "Activo",
        )
        .order_by(PersonalInternoModel.apellido_paterno.asc(), PersonalInternoModel.nombre.asc())
        .all()
    )
    return [
        AsesorInternoResponse(
            id_asesor=asesor.id_personal,
            id_usuario=asesor.id_usuario,
            nombre=_nombre_personal(asesor),
            correo=asesor.usuario.correo if asesor.usuario else None,
            departamento=asesor.departamento,
            cargo=asesor.cargo,
        )
        for asesor in asesores
    ]


@router.get("/", response_model=ConfirmacionAsignacionesResponse)
def listar_confirmacion_asignaciones(db: Session = Depends(obtener_db)):
    convocatoria = _convocatoria_vigente(db)

    alumnos = (
        db.query(AlumnoModel)
        .options(joinedload(AlumnoModel.carrera))
        .order_by(AlumnoModel.apellido_paterno.asc(), AlumnoModel.nombre.asc())
        .all()
    )

    respuesta = []
    for alumno in alumnos:
        asignacion = None
        if convocatoria is not None:
            asignacion = (
                db.query(AsignacionModel)
                .options(joinedload(AsignacionModel.empresa), joinedload(AsignacionModel.vacante))
                .filter(
                    AsignacionModel.id_alumno == alumno.id_alumno,
                    AsignacionModel.id_convocatoria == convocatoria.id_convocatoria,
                    AsignacionModel.estado_asignacion == "Activa",
                )
                .first()
            )

        selecciones_query = db.query(SeleccionEmpresaModel).options(
            joinedload(SeleccionEmpresaModel.vacante).joinedload(VacanteModel.empresa),
            joinedload(SeleccionEmpresaModel.vacante).joinedload(VacanteModel.convocatoria),
            joinedload(SeleccionEmpresaModel.vacante).joinedload(VacanteModel.tipo_practica),
        )
        if convocatoria is not None:
            selecciones_query = selecciones_query.filter(
                SeleccionEmpresaModel.id_convocatoria == convocatoria.id_convocatoria
            )
        selecciones = (
            selecciones_query
            .filter(SeleccionEmpresaModel.id_alumno == alumno.id_alumno)
            .order_by(SeleccionEmpresaModel.prioridad.asc())
            .all()
        )

        preferencias = []
        for seleccion in selecciones:
            vacante = seleccion.vacante
            vacantes = []
            estado_api = _estado_seleccion_api(seleccion, asignacion)
            if (
                estado_api == "Pendiente"
                and vacante is not None
                and vacante.estado_vacante == "Activa"
                and vacante.periodo == alumno.periodo_practica
                and vacante.id_tipo_practica == alumno.id_tipo_practica
                and _cupos_usados(db, vacante.id_vacante) < vacante.cupos
            ):
                vacantes = [_vacante_response(db, vacante)]

            empresa = vacante.empresa if vacante else None
            preferencias.append(
                PreferenciaConfirmacionResponse(
                    id_seleccion=seleccion.id_seleccion,
                    id_empresa=vacante.id_empresa if vacante else 0,
                    id_convocatoria=seleccion.id_convocatoria,
                    id_vacante=seleccion.id_vacante,
                    empresa=empresa.nombre_empresa if empresa else "Sin empresa",
                    prioridad=seleccion.prioridad,
                    estado_empresa=empresa.estado_empresa if empresa else "Sin empresa",
                    estado_seleccion=estado_api,
                    observaciones=seleccion.observaciones,
                    vacantes=vacantes,
                )
            )

        respuesta.append(
            AlumnoConfirmacionResponse(
                id_alumno=alumno.id_alumno,
                nombre=_nombre_alumno(alumno),
                matricula=alumno.matricula,
                carrera=alumno.carrera.nombre if alumno.carrera else "Sin carrera",
                estado_alumno=alumno.estado_alumno,
                periodo_practica=alumno.periodo_practica,
                ya_asignado=asignacion is not None,
                id_asignacion=asignacion.id_asignacion if asignacion else None,
                empresa_asignada=asignacion.empresa.nombre_empresa if asignacion and asignacion.empresa else None,
                vacante_asignada=asignacion.vacante.titulo if asignacion and asignacion.vacante else None,
                preferencias=preferencias,
            )
        )

    return ConfirmacionAsignacionesResponse(
        convocatoria_id=convocatoria.id_convocatoria if convocatoria else None,
        convocatoria=convocatoria.nombre if convocatoria else None,
        asesores=_listar_asesores(db),
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

    vacante = (
        db.query(VacanteModel)
        .options(joinedload(VacanteModel.empresa))
        .filter(VacanteModel.id_vacante == datos.id_vacante)
        .first()
    )
    if vacante is None:
        raise HTTPException(status_code=404, detail="Vacante no encontrada")
    if vacante.id_empresa != datos.id_empresa:
        raise HTTPException(status_code=400, detail="La vacante no pertenece a la empresa indicada")
    if vacante.id_convocatoria != convocatoria.id_convocatoria:
        raise HTTPException(status_code=400, detail="La vacante no pertenece a la convocatoria activa")

    seleccion = (
        db.query(SeleccionEmpresaModel)
        .filter(
            SeleccionEmpresaModel.id_alumno == datos.id_alumno,
            SeleccionEmpresaModel.id_vacante == datos.id_vacante,
            SeleccionEmpresaModel.id_convocatoria == convocatoria.id_convocatoria,
        )
        .first()
    )
    if seleccion is None:
        raise HTTPException(status_code=400, detail="La vacante seleccionada no pertenece a las preferencias del alumno")
    if seleccion.estado != "Registrada":
        raise HTTPException(status_code=400, detail="La seleccion ya fue revisada por coordinacion")

    id_asesor = datos.id_asesor
    if id_asesor is not None:
        asesor = (
            db.query(PersonalInternoModel)
            .join(PersonalInternoModel.usuario)
            .filter(
                PersonalInternoModel.id_personal == id_asesor,
                UsuarioModel.id_rol == 6,
                UsuarioModel.estado == "Activo",
            )
            .first()
        )
        if asesor is None:
            raise HTTPException(status_code=400, detail="El asesor interno no existe o no esta activo")

    asignacion = AsignacionCreate(
        id_alumno=datos.id_alumno,
        id_empresa=datos.id_empresa,
        id_vacante=datos.id_vacante,
        id_convocatoria=convocatoria.id_convocatoria,
        id_tipo_practica=vacante.id_tipo_practica,
        id_asesor=id_asesor,
        fecha_asignacion=date.today(),
        estado_asignacion="Activa",
        tipo_asignacion=datos.tipo_asignacion,
    )
    nueva_asignacion = AsignacionService(db).crear(asignacion)

    ahora = datetime.now()
    seleccion.observaciones = "Asignacion confirmada por coordinacion."
    seleccion.fecha_revision = ahora
    seleccion.revisado_por = usuario.id_usuario

    otras = (
        db.query(SeleccionEmpresaModel)
        .filter(
            SeleccionEmpresaModel.id_alumno == datos.id_alumno,
            SeleccionEmpresaModel.id_seleccion != seleccion.id_seleccion,
            SeleccionEmpresaModel.id_convocatoria == convocatoria.id_convocatoria,
            SeleccionEmpresaModel.estado == "Registrada",
        )
        .all()
    )
    for otra in otras:
        otra.estado = "Cancelada"
        otra.observaciones = "Se aprobo otra opcion para este alumno."
        otra.fecha_revision = ahora
        otra.revisado_por = usuario.id_usuario

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
    if seleccion.estado != "Registrada":
        raise HTTPException(status_code=400, detail="La seleccion ya fue revisada")

    seleccion.estado = "Cancelada"
    seleccion.observaciones = datos.observaciones or "Solicitud rechazada por coordinacion."
    seleccion.fecha_revision = datetime.now()
    seleccion.revisado_por = usuario.id_usuario
    db.commit()
    return {"mensaje": "Seleccion rechazada correctamente"}
