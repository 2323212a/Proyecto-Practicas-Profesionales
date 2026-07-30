from __future__ import annotations

from datetime import date, datetime
from typing import Literal

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, ConfigDict, Field
from sqlalchemy import func
from sqlalchemy.orm import Session, joinedload

from app.services.auditoria_service import registrar_bitacora
from app.services.convocatoria_rules_service import validar_etapa_actual
from app.services.documentacion_flujo_service import habilitar_documentacion_asignacion
from app.services.notificacion_service import crear_notificacion
from app.services.regla_practica_carrera_service import obtener_regla_practica_para_alumno
from infrastructure.database.dependencies import obtener_db
from infrastructure.persistence.models.alumno import AlumnoModel
from infrastructure.persistence.models.asignacion import AsignacionModel
from infrastructure.persistence.models.convocatoria import ConvocatoriaModel
from infrastructure.persistence.models.configuracion_sistema import ConfiguracionSistemaModel
from infrastructure.persistence.models.convenio import ConvenioModel
from infrastructure.persistence.models.expediente import ExpedienteModel
from infrastructure.persistence.models.personal_interno import PersonalInternoModel
from infrastructure.persistence.models.responsable_empresa import ResponsableEmpresaModel
from infrastructure.persistence.models.rol import RolModel
from infrastructure.persistence.models.seleccion_empresa import SeleccionEmpresaModel
from infrastructure.persistence.models.usuario import UsuarioModel
from infrastructure.persistence.models.vacante import VacanteModel
from infrastructure.persistence.models.vacante_carrera import VacanteCarreraModel
from infrastructure.persistence.models.vacante_tipo_practica import VacanteTipoPracticaModel
from infrastructure.security.auth_dependencies import requerir_roles
from interfaces.api.schemas.asignacion import AsignacionResponse
from interfaces.api.routes.configuracion_sistema import obtener_o_crear_configuracion


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
    es_rezagado: bool = False
    motivo_rezago: str | None = None
    vacantes_disponibles: list[VacanteConfirmacionResponse] = []
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
    secretaria_academica: str
    asesores: list[AsesorInternoResponse]
    alumnos: list[AlumnoConfirmacionResponse]


class SecretariaAcademicaRequest(BaseModel):
    nombre: str = Field(min_length=3, max_length=150)


class SecretariaAcademicaResponse(BaseModel):
    secretaria_academica: str


class ConfirmarAsignacionRequest(BaseModel):
    id_alumno: int
    id_empresa: int
    id_vacante: int
    id_asesor: int | None = None
    tipo_asignacion: Literal["Normal", "Rezagado", "Reasignacion"] = "Normal"
    motivo: str | None = Field(default=None, max_length=1000)


class RechazarSeleccionRequest(BaseModel):
    observaciones: str | None = None


class CambiarEmpresaAsignacionRequest(BaseModel):
    id_vacante_nueva: int
    motivo: str = Field(min_length=3, max_length=1000)
    id_asesor: int | None = None
    notificar_alumno: bool = True
    regenerar_documentos: bool = True


class CambiarEmpresaAsignacionResponse(BaseModel):
    mensaje: str
    id_asignacion_anterior: int
    id_asignacion_nueva: int
    documentos_regenerados: bool


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


def _cupos_usados(db: Session, id_vacante: int, id_tipo_practica: int | None = None) -> int:
    filtros = [
        AsignacionModel.id_vacante == id_vacante,
        AsignacionModel.estado_asignacion == "Activa",
    ]
    if id_tipo_practica is not None:
        filtros.append(AsignacionModel.id_tipo_practica == id_tipo_practica)
    return (
        db.query(func.count(AsignacionModel.id_asignacion))
        .filter(*filtros)
        .scalar()
        or 0
    )


def _config_tipo_vacante(db: Session, vacante: VacanteModel, id_tipo_practica: int | None) -> VacanteTipoPracticaModel | None:
    if id_tipo_practica is None:
        return None
    config = (
        db.query(VacanteTipoPracticaModel)
        .filter(
            VacanteTipoPracticaModel.id_vacante == vacante.id_vacante,
            VacanteTipoPracticaModel.id_tipo_practica == id_tipo_practica,
            VacanteTipoPracticaModel.activo.is_(True),
        )
        .first()
    )
    return config


def _vacante_permite_carrera(db: Session, vacante: VacanteModel, alumno: AlumnoModel) -> bool:
    if vacante.aplica_todas_carreras:
        return True
    if alumno.id_carrera is None:
        return False
    return (
        db.query(VacanteCarreraModel)
        .filter(VacanteCarreraModel.id_vacante == vacante.id_vacante, VacanteCarreraModel.id_carrera == alumno.id_carrera)
        .first()
        is not None
    )


def _vacante_disponible_para_alumno(db: Session, vacante: VacanteModel, alumno: AlumnoModel) -> bool:
    if vacante.estado_vacante != "Activa":
        return False
    config = _config_tipo_vacante(db, vacante, alumno.id_tipo_practica)
    if config is None or not _vacante_permite_carrera(db, vacante, alumno):
        return False
    return _cupos_usados(db, vacante.id_vacante, alumno.id_tipo_practica) < config.cupos


def _vacante_response(
    db: Session,
    vacante: VacanteModel,
    id_tipo_practica: int,
) -> VacanteConfirmacionResponse:
    config = _config_tipo_vacante(db, vacante, id_tipo_practica)
    cupos = config.cupos if config is not None else 0
    cupos_usados = _cupos_usados(db, vacante.id_vacante, id_tipo_practica)
    return VacanteConfirmacionResponse(
        id_vacante=vacante.id_vacante,
        id_empresa=vacante.id_empresa,
        empresa=vacante.empresa.nombre_empresa if vacante.empresa else "Sin empresa",
        id_convocatoria=vacante.id_convocatoria,
        convocatoria=vacante.convocatoria.nombre if vacante.convocatoria else None,
        id_tipo_practica=id_tipo_practica,
        tipo_practica=config.tipo_practica.nombre if config is not None and config.tipo_practica else None,
        titulo=vacante.titulo,
        descripcion=vacante.descripcion,
        actividades=vacante.actividades,
        requisitos=vacante.requisitos,
        cupos=cupos,
        cupos_usados=cupos_usados,
        cupos_disponibles=max(cupos - cupos_usados, 0),
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


def _cumple_regla_practica(db: Session, alumno: AlumnoModel) -> bool:
    regla = obtener_regla_practica_para_alumno(db, alumno)
    if regla is None:
        return False
    return (
        (alumno.semestre or 0) >= regla.periodo_requerido
        and (alumno.creditos_aprobados or 0) >= regla.creditos_minimos
    )


def _notificar_empresa(db: Session, id_empresa: int, titulo: str, mensaje: str) -> None:
    responsables = (
        db.query(ResponsableEmpresaModel)
        .filter(
            ResponsableEmpresaModel.id_empresa == id_empresa,
            ResponsableEmpresaModel.id_usuario.is_not(None),
        )
        .all()
    )
    for responsable in responsables:
        crear_notificacion(db, responsable.id_usuario, titulo, mensaje)


@router.get("/", response_model=ConfirmacionAsignacionesResponse)
def listar_confirmacion_asignaciones(db: Session = Depends(obtener_db)):
    convocatoria = _convocatoria_vigente(db)
    configuracion: ConfiguracionSistemaModel = obtener_o_crear_configuracion(db)

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

        expediente_aprobado = False
        if convocatoria is not None:
            expediente_aprobado = (
                db.query(ExpedienteModel.id_expediente)
                .filter(
                    ExpedienteModel.id_alumno == alumno.id_alumno,
                    ExpedienteModel.id_convocatoria == convocatoria.id_convocatoria,
                    ExpedienteModel.estado_expediente == "Aprobado",
                )
                .first()
                is not None
            )
        cumple_regla = _cumple_regla_practica(db, alumno)
        es_rezagado = (
            convocatoria is not None
            and alumno.estado_alumno == "Activo"
            and expediente_aprobado
            and cumple_regla
            and asignacion is None
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
            .filter(
                SeleccionEmpresaModel.id_alumno == alumno.id_alumno,
                SeleccionEmpresaModel.prioridad <= 2,
            )
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
                and _vacante_disponible_para_alumno(db, vacante, alumno)
            ):
                vacantes = [_vacante_response(db, vacante, alumno.id_tipo_practica)]

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

        vacantes_disponibles = []
        if convocatoria is not None:
            candidatas_query = (
                db.query(VacanteModel)
                .options(
                    joinedload(VacanteModel.empresa),
                    joinedload(VacanteModel.convocatoria),
                    joinedload(VacanteModel.tipo_practica),
                )
                .filter(
                    VacanteModel.id_convocatoria == convocatoria.id_convocatoria,
                    VacanteModel.periodo == alumno.periodo_practica,
                    VacanteModel.estado_vacante == "Activa",
                )
            )
            if asignacion is not None:
                candidatas_query = candidatas_query.filter(VacanteModel.id_vacante != asignacion.id_vacante)
            candidatas = candidatas_query.order_by(VacanteModel.titulo.asc()).all()
            vacantes_disponibles = [
                _vacante_response(db, vacante, alumno.id_tipo_practica)
                for vacante in candidatas
                if _vacante_disponible_para_alumno(db, vacante, alumno)
            ]

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
                es_rezagado=es_rezagado,
                motivo_rezago=(
                    None
                    if not es_rezagado
                    else (
                        "Sin selección registrada."
                        if not selecciones
                        else (
                            "Sus opciones ya no tienen cupo o dejaron de ser compatibles."
                            if not any(preferencia.vacantes for preferencia in preferencias)
                            else "Pendiente de asignación."
                        )
                    )
                ),
                vacantes_disponibles=vacantes_disponibles,
                preferencias=preferencias,
            )
        )

    return ConfirmacionAsignacionesResponse(
        convocatoria_id=convocatoria.id_convocatoria if convocatoria else None,
        convocatoria=convocatoria.nombre if convocatoria else None,
        secretaria_academica=configuracion.secretaria_academica or "Paola Lopez",
        asesores=_listar_asesores(db),
        alumnos=respuesta,
    )


@router.put("/secretaria-academica", response_model=SecretariaAcademicaResponse)
def actualizar_secretaria_academica(
    datos: SecretariaAcademicaRequest,
    db: Session = Depends(obtener_db),
):
    nombre = " ".join(datos.nombre.split())
    if len(nombre) < 3:
        raise HTTPException(status_code=422, detail="Ingresa un nombre valido")

    configuracion: ConfiguracionSistemaModel = obtener_o_crear_configuracion(db)
    configuracion.secretaria_academica = nombre
    db.commit()
    db.refresh(configuracion)
    return SecretariaAcademicaResponse(secretaria_academica=nombre)


@router.post("/", response_model=AsignacionResponse)
def confirmar_asignacion(
    datos: ConfirmarAsignacionRequest,
    db: Session = Depends(obtener_db),
    usuario: UsuarioModel = Depends(requerir_roles(["Coordinador de Practicas", "Administrador"])),
):
    vacante = (
        db.query(VacanteModel)
        .options(joinedload(VacanteModel.empresa), joinedload(VacanteModel.convocatoria))
        .filter(VacanteModel.id_vacante == datos.id_vacante)
        .first()
    )
    if vacante is None:
        raise HTTPException(status_code=404, detail="Vacante no encontrada")
    if vacante.id_empresa != datos.id_empresa:
        raise HTTPException(status_code=400, detail="La vacante no pertenece a la empresa indicada")
    if vacante.estado_vacante != "Activa":
        raise HTTPException(status_code=400, detail="Solo se pueden asignar vacantes activas y publicadas")
    if vacante.empresa is None or vacante.empresa.estado_empresa != "Activa":
        raise HTTPException(status_code=400, detail="La empresa de la vacante no está activa")
    convenio_vigente = (
        db.query(ConvenioModel)
        .filter(
            ConvenioModel.id_empresa == vacante.id_empresa,
            ConvenioModel.es_actual.is_(True),
            ConvenioModel.estado_convenio == "Vigente",
            ConvenioModel.fecha_inicio <= date.today(),
            ConvenioModel.fecha_fin >= date.today(),
        )
        .first()
    )
    if convenio_vigente is None:
        raise HTTPException(status_code=400, detail="La empresa no tiene convenio vigente")
    convocatoria = vacante.convocatoria
    if convocatoria is None or convocatoria.estado != "Activa":
        raise HTTPException(status_code=400, detail="La vacante no pertenece a una convocatoria activa")
    validar_etapa_actual(convocatoria, "asignacion")

    alumno = db.query(AlumnoModel).filter(AlumnoModel.id_alumno == datos.id_alumno).first()
    if alumno is None:
        raise HTTPException(status_code=404, detail="Alumno no encontrado")
    if alumno.estado_alumno != "Activo":
        raise HTTPException(status_code=400, detail="Solo se pueden asignar alumnos activos")
    if vacante.periodo != alumno.periodo_practica:
        raise HTTPException(status_code=400, detail="La vacante no corresponde al periodo del alumno")
    expediente_aprobado = (
        db.query(ExpedienteModel)
        .filter(
            ExpedienteModel.id_alumno == alumno.id_alumno,
            ExpedienteModel.id_convocatoria == convocatoria.id_convocatoria,
            ExpedienteModel.estado_expediente == "Aprobado",
        )
        .first()
    )
    if expediente_aprobado is None:
        raise HTTPException(status_code=400, detail="El alumno debe tener el expediente aprobado en esta convocatoria")
    asignacion_activa = (
        db.query(AsignacionModel)
        .filter(
            AsignacionModel.id_alumno == alumno.id_alumno,
            AsignacionModel.id_convocatoria == convocatoria.id_convocatoria,
            AsignacionModel.estado_asignacion == "Activa",
        )
        .first()
    )
    if asignacion_activa is not None:
        raise HTTPException(status_code=409, detail="El alumno ya tiene una asignación activa en esta convocatoria")
    if not _vacante_disponible_para_alumno(db, vacante, alumno):
        raise HTTPException(status_code=400, detail="La vacante no tiene cupos disponibles o no es compatible con la carrera y tipo de práctica del alumno")
    motivo = " ".join((datos.motivo or "").split())
    if datos.tipo_asignacion == "Rezagado" and len(motivo) < 3:
        raise HTTPException(status_code=422, detail="El motivo de la asignación del rezagado es obligatorio")
    if datos.tipo_asignacion == "Rezagado" and not _cumple_regla_practica(db, alumno):
        raise HTTPException(status_code=400, detail="El alumno no cumple la regla de práctica de su carrera")
    if datos.tipo_asignacion == "Reasignacion":
        raise HTTPException(status_code=400, detail="Usa el flujo de cambio de empresa para una reasignación")

    seleccion = (
        db.query(SeleccionEmpresaModel)
        .filter(
            SeleccionEmpresaModel.id_alumno == datos.id_alumno,
            SeleccionEmpresaModel.id_vacante == datos.id_vacante,
            SeleccionEmpresaModel.id_convocatoria == convocatoria.id_convocatoria,
            SeleccionEmpresaModel.prioridad <= 2,
        )
        .first()
    )
    if seleccion is None and datos.tipo_asignacion != "Rezagado":
        raise HTTPException(status_code=400, detail="La vacante seleccionada no pertenece a las preferencias del alumno")
    if seleccion is not None and seleccion.estado != "Registrada":
        raise HTTPException(status_code=400, detail="La seleccion ya fue revisada por coordinacion")
    if seleccion is not None and datos.tipo_asignacion == "Normal":
        selecciones_anteriores = (
            db.query(SeleccionEmpresaModel)
            .options(joinedload(SeleccionEmpresaModel.vacante))
            .filter(
                SeleccionEmpresaModel.id_alumno == alumno.id_alumno,
                SeleccionEmpresaModel.id_convocatoria == convocatoria.id_convocatoria,
                SeleccionEmpresaModel.estado == "Registrada",
                SeleccionEmpresaModel.prioridad < seleccion.prioridad,
            )
            .order_by(SeleccionEmpresaModel.prioridad.asc())
            .all()
        )
        prioridad_anterior_valida = next(
            (
                preferencia
                for preferencia in selecciones_anteriores
                if preferencia.vacante is not None
                and preferencia.vacante.id_convocatoria == convocatoria.id_convocatoria
                and preferencia.vacante.periodo == alumno.periodo_practica
                and _vacante_disponible_para_alumno(db, preferencia.vacante, alumno)
            ),
            None,
        )
        if prioridad_anterior_valida is not None:
            raise HTTPException(
                status_code=409,
                detail=f"La prioridad {prioridad_anterior_valida.prioridad} sigue disponible y debe intentarse primero",
            )

    id_asesor = datos.id_asesor
    if datos.tipo_asignacion == "Rezagado" and id_asesor is None:
        raise HTTPException(status_code=422, detail="Selecciona un asesor interno para el alumno rezagado")
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

    nueva_asignacion = AsignacionModel(
        id_alumno=datos.id_alumno,
        id_empresa=datos.id_empresa,
        id_vacante=datos.id_vacante,
        id_convocatoria=convocatoria.id_convocatoria,
        id_tipo_practica=alumno.id_tipo_practica,
        id_asesor=id_asesor,
        fecha_asignacion=datetime.now(),
        estado_asignacion="Activa",
        tipo_asignacion=datos.tipo_asignacion,
        asignado_por=usuario.id_usuario,
        observaciones=(
            "Asignación manual autorizada para alumno rezagado sin opciones válidas disponibles."
            if datos.tipo_asignacion == "Rezagado"
            else "Asignación formal confirmada respetando el orden de preferencias."
        ),
    )
    if datos.tipo_asignacion == "Rezagado":
        nueva_asignacion.observaciones = (
            f"Asignación manual autorizada para alumno rezagado. Motivo: {motivo}"
        )
    db.add(nueva_asignacion)
    db.flush()

    ahora = datetime.now()
    if seleccion is not None:
        seleccion.observaciones = "Asignacion confirmada por coordinacion."
        seleccion.fecha_revision = ahora
        seleccion.revisado_por = usuario.id_usuario

    otras = (
        db.query(SeleccionEmpresaModel)
        .filter(
            SeleccionEmpresaModel.id_alumno == datos.id_alumno,
            SeleccionEmpresaModel.id_convocatoria == convocatoria.id_convocatoria,
            SeleccionEmpresaModel.estado == "Registrada",
        )
        .all()
    )
    for otra in otras:
        if seleccion is not None and otra.id_seleccion == seleccion.id_seleccion:
            continue
        otra.estado = "Cancelada"
        otra.observaciones = "Se aprobo otra opcion para este alumno."
        otra.fecha_revision = ahora
        otra.revisado_por = usuario.id_usuario

    if datos.tipo_asignacion == "Rezagado":
        crear_notificacion(
            db,
            alumno.id_usuario,
            "Asignación de prácticas",
            "Has sido asignado a una vacante por Coordinación.",
        )
        _notificar_empresa(
            db,
            vacante.id_empresa,
            "Alumno asignado",
            "Se ha asignado un alumno a tu vacante.",
        )

    db.commit()
    db.refresh(nueva_asignacion)
    if datos.tipo_asignacion == "Rezagado":
        registrar_bitacora(
            db,
            usuario.id_usuario,
            "Asignar alumno rezagado",
            "asignaciones",
            (
                f"Se asignó manualmente al alumno rezagado {alumno.id_alumno} "
                f"a la vacante {vacante.id_vacante}."
            ),
            "asignacion",
            nueva_asignacion.id_asignacion,
        )
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
    validar_etapa_actual(seleccion.convocatoria, "asignacion")
    if seleccion.estado != "Registrada":
        raise HTTPException(status_code=400, detail="La seleccion ya fue revisada")

    seleccion.estado = "Cancelada"
    seleccion.observaciones = datos.observaciones or "Solicitud rechazada por coordinacion."
    seleccion.fecha_revision = datetime.now()
    seleccion.revisado_por = usuario.id_usuario
    db.commit()
    return {"mensaje": "Seleccion rechazada correctamente"}


@router.post("/{id_asignacion}/cambiar-empresa", response_model=CambiarEmpresaAsignacionResponse)
def cambiar_empresa_asignacion(
    id_asignacion: int,
    datos: CambiarEmpresaAsignacionRequest,
    db: Session = Depends(obtener_db),
    usuario: UsuarioModel = Depends(requerir_roles(["Coordinador de Practicas", "Administrador"])),
):
    motivo = " ".join(datos.motivo.split())
    if len(motivo) < 3:
        raise HTTPException(status_code=422, detail="Ingresa el motivo del cambio")

    asignacion_actual = (
        db.query(AsignacionModel)
        .options(
            joinedload(AsignacionModel.alumno).joinedload(AlumnoModel.usuario),
            joinedload(AsignacionModel.empresa),
            joinedload(AsignacionModel.vacante),
            joinedload(AsignacionModel.convocatoria),
        )
        .filter(AsignacionModel.id_asignacion == id_asignacion)
        .first()
    )
    if asignacion_actual is None:
        raise HTTPException(status_code=404, detail="Asignacion no encontrada")
    if asignacion_actual.estado_asignacion != "Activa":
        raise HTTPException(status_code=400, detail="Solo se puede cambiar una asignacion activa")

    otra_activa = (
        db.query(AsignacionModel)
        .filter(
            AsignacionModel.id_alumno == asignacion_actual.id_alumno,
            AsignacionModel.id_convocatoria == asignacion_actual.id_convocatoria,
            AsignacionModel.estado_asignacion == "Activa",
            AsignacionModel.id_asignacion != asignacion_actual.id_asignacion,
        )
        .first()
    )
    if otra_activa is not None:
        raise HTTPException(status_code=400, detail="El alumno ya tiene otra asignacion activa en esta convocatoria")

    vacante_nueva = (
        db.query(VacanteModel)
        .options(joinedload(VacanteModel.empresa), joinedload(VacanteModel.tipo_practica))
        .filter(VacanteModel.id_vacante == datos.id_vacante_nueva)
        .first()
    )
    if vacante_nueva is None:
        raise HTTPException(status_code=404, detail="Vacante nueva no encontrada")
    if vacante_nueva.estado_vacante != "Activa":
        raise HTTPException(status_code=400, detail="La vacante nueva debe estar activa/publicada")
    if vacante_nueva.id_vacante == asignacion_actual.id_vacante:
        raise HTTPException(status_code=400, detail="Selecciona una vacante distinta a la asignacion actual")
    if vacante_nueva.id_convocatoria != asignacion_actual.id_convocatoria:
        raise HTTPException(status_code=400, detail="La vacante nueva no pertenece a la misma convocatoria")
    alumno = asignacion_actual.alumno
    if alumno is None:
        raise HTTPException(status_code=400, detail="La asignacion no tiene alumno vinculado")
    if vacante_nueva.periodo != alumno.periodo_practica:
        raise HTTPException(status_code=400, detail="La vacante nueva no corresponde al periodo del alumno")
    if vacante_nueva.id_tipo_practica != asignacion_actual.id_tipo_practica and _config_tipo_vacante(db, vacante_nueva, asignacion_actual.id_tipo_practica) is None:
        raise HTTPException(status_code=400, detail="La vacante nueva no corresponde al mismo tipo de practica")
    if not _vacante_permite_carrera(db, vacante_nueva, alumno):
        raise HTTPException(status_code=400, detail="La vacante nueva no corresponde a la carrera del alumno")
    config_tipo = _config_tipo_vacante(db, vacante_nueva, asignacion_actual.id_tipo_practica)
    if config_tipo is None or _cupos_usados(db, vacante_nueva.id_vacante, asignacion_actual.id_tipo_practica) >= config_tipo.cupos:
        raise HTTPException(status_code=400, detail="La vacante nueva no tiene cupos disponibles")

    id_asesor = datos.id_asesor if datos.id_asesor is not None else asignacion_actual.id_asesor
    if id_asesor is None:
        raise HTTPException(status_code=422, detail="Selecciona un asesor interno para la reasignación")
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

    fecha_motivo = datetime.now().strftime("%Y-%m-%d %H:%M")
    observacion_anterior = (
        f"Reasignada el {fecha_motivo}. "
        f"Empresa anterior: {asignacion_actual.empresa.nombre_empresa if asignacion_actual.empresa else 'Sin empresa'}. "
        f"Vacante anterior: {asignacion_actual.vacante.titulo if asignacion_actual.vacante else 'Sin vacante'}. "
        f"Motivo: {motivo}"
    )
    asignacion_actual.estado_asignacion = "Cancelada"
    asignacion_actual.observaciones = "\n".join(
        parte for parte in [asignacion_actual.observaciones, observacion_anterior] if parte
    )
    db.flush()

    nueva_asignacion = AsignacionModel(
        id_alumno=asignacion_actual.id_alumno,
        id_empresa=vacante_nueva.id_empresa,
        id_vacante=vacante_nueva.id_vacante,
        id_convocatoria=asignacion_actual.id_convocatoria,
        id_tipo_practica=asignacion_actual.id_tipo_practica,
        id_asesor=id_asesor,
        estado_asignacion="Activa",
        tipo_asignacion="Reasignacion",
        asignado_por=usuario.id_usuario,
        observaciones=f"Reasignacion desde asignacion {asignacion_actual.id_asignacion}. Motivo: {motivo}",
    )
    db.add(nueva_asignacion)
    db.flush()

    documentos_regenerados = False
    if datos.regenerar_documentos:
        habilitar_documentacion_asignacion(db, alumno)
        documentos_regenerados = True

    if datos.notificar_alumno:
        crear_notificacion(
            db,
            alumno.id_usuario,
            "Cambio de empresa asignada",
            (
                f"Tu asignacion fue actualizada a {vacante_nueva.empresa.nombre_empresa if vacante_nueva.empresa else 'la nueva empresa'} "
                f"en la vacante {vacante_nueva.titulo}. Motivo: {motivo}"
            ),
        )
        _notificar_empresa(
            db,
            asignacion_actual.id_empresa,
            "Alumno retirado por reasignación",
            "Un alumno fue retirado de tu vacante por reasignación autorizada.",
        )
        _notificar_empresa(
            db,
            vacante_nueva.id_empresa,
            "Alumno asignado",
            "Se ha asignado un alumno a tu vacante.",
        )

    db.commit()
    db.refresh(nueva_asignacion)

    registrar_bitacora(
        db,
        usuario.id_usuario,
        "Cambiar empresa asignada",
        "asignaciones",
        (
            f"Asignacion {asignacion_actual.id_asignacion} cerrada como historica "
            f"y creada asignacion {nueva_asignacion.id_asignacion} para alumno {alumno.id_alumno}."
        ),
        "asignacion",
        nueva_asignacion.id_asignacion,
    )

    return CambiarEmpresaAsignacionResponse(
        mensaje="Empresa y vacante reasignadas correctamente",
        id_asignacion_anterior=asignacion_actual.id_asignacion,
        id_asignacion_nueva=nueva_asignacion.id_asignacion,
        documentos_regenerados=documentos_regenerados,
    )
