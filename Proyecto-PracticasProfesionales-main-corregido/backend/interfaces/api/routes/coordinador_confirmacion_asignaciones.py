from __future__ import annotations

from datetime import date, datetime

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, ConfigDict, Field
from sqlalchemy import func
from sqlalchemy.orm import Session, joinedload

from app.services.auditoria_service import registrar_bitacora
from app.services.convocatoria_rules_service import validar_etapa_actual
from app.services.documentacion_flujo_service import habilitar_documentacion_asignacion
from app.services.notificacion_service import crear_notificacion
from infrastructure.database.dependencies import obtener_db
from infrastructure.persistence.models.alumno import AlumnoModel
from infrastructure.persistence.models.asignacion import AsignacionModel
from infrastructure.persistence.models.convocatoria import ConvocatoriaModel
from infrastructure.persistence.models.configuracion_sistema import ConfiguracionSistemaModel
from infrastructure.persistence.models.personal_interno import PersonalInternoModel
from infrastructure.persistence.models.rol import RolModel
from infrastructure.persistence.models.seleccion_empresa import SeleccionEmpresaModel
from infrastructure.persistence.models.usuario import UsuarioModel
from infrastructure.persistence.models.vacante import VacanteModel
from infrastructure.security.auth_dependencies import requerir_roles
from interfaces.api.schemas.asignacion import AsignacionCreate, AsignacionResponse
from interfaces.api.service_factory import AsignacionService
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
    tipo_asignacion: str = "Normal"


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

        vacantes_disponibles = []
        if convocatoria is not None and asignacion is not None:
            candidatas = (
                db.query(VacanteModel)
                .options(
                    joinedload(VacanteModel.empresa),
                    joinedload(VacanteModel.convocatoria),
                    joinedload(VacanteModel.tipo_practica),
                )
                .filter(
                    VacanteModel.id_convocatoria == convocatoria.id_convocatoria,
                    VacanteModel.id_tipo_practica == alumno.id_tipo_practica,
                    VacanteModel.periodo == alumno.periodo_practica,
                    VacanteModel.estado_vacante == "Activa",
                    VacanteModel.id_vacante != asignacion.id_vacante,
                )
                .order_by(VacanteModel.titulo.asc())
                .all()
            )
            vacantes_disponibles = [
                _vacante_response(db, vacante)
                for vacante in candidatas
                if _cupos_usados(db, vacante.id_vacante) < vacante.cupos
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
    convocatoria = _convocatoria_vigente(db)
    if convocatoria is None:
        raise HTTPException(status_code=400, detail="No hay convocatoria registrada")
    validar_etapa_actual(convocatoria, "asignacion")

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
    if vacante_nueva.id_tipo_practica != asignacion_actual.id_tipo_practica:
        raise HTTPException(status_code=400, detail="La vacante nueva no corresponde al mismo tipo de practica")

    alumno = asignacion_actual.alumno
    if alumno is None:
        raise HTTPException(status_code=400, detail="La asignacion no tiene alumno vinculado")
    if vacante_nueva.periodo != alumno.periodo_practica:
        raise HTTPException(status_code=400, detail="La vacante nueva no corresponde al periodo del alumno")

    cupos_usados = _cupos_usados(db, vacante_nueva.id_vacante)
    if cupos_usados >= vacante_nueva.cupos:
        raise HTTPException(status_code=400, detail="La vacante nueva no tiene cupos disponibles")

    id_asesor = datos.id_asesor if datos.id_asesor is not None else asignacion_actual.id_asesor
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
        id_tipo_practica=vacante_nueva.id_tipo_practica,
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
