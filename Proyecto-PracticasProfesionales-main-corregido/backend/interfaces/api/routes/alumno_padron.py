from __future__ import annotations

from datetime import date

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field
from sqlalchemy import func
from sqlalchemy.orm import Session, joinedload

from app.services.convocatoria_rules_service import validar_etapa_actual
from infrastructure.database.dependencies import obtener_db
from infrastructure.persistence.models.alumno import AlumnoModel
from infrastructure.persistence.models.asignacion import AsignacionModel
from infrastructure.persistence.models.convenio import ConvenioModel
from infrastructure.persistence.models.convocatoria import ConvocatoriaModel
from infrastructure.persistence.models.empresa import EmpresaModel
from infrastructure.persistence.models.expediente import ExpedienteModel
from infrastructure.persistence.models.seleccion_empresa import SeleccionEmpresaModel
from infrastructure.persistence.models.vacante import VacanteModel
from infrastructure.security.auth_dependencies import obtener_id_alumno_actual, requerir_alumno_actual_o_roles


router = APIRouter(
    prefix="/alumno/padron",
    tags=["Alumno - Padron"],
    dependencies=[Depends(requerir_alumno_actual_o_roles(["Administrador"]))],
)


class PreferenciaVacante(BaseModel):
    id_vacante: int
    prioridad: int = Field(ge=1, le=3)


class GuardarPreferenciasRequest(BaseModel):
    preferencias: list[PreferenciaVacante] = Field(min_length=1, max_length=3)
    id_vacante_prioritaria: int | None = None


def _expediente_actual_aprobado(db: Session, alumno: AlumnoModel) -> ExpedienteModel | None:
    return (
        db.query(ExpedienteModel)
        .join(ConvocatoriaModel, ConvocatoriaModel.id_convocatoria == ExpedienteModel.id_convocatoria)
        .filter(
            ExpedienteModel.id_alumno == alumno.id_alumno,
            ExpedienteModel.estado_expediente == "Aprobado",
            ConvocatoriaModel.estado == "Activa",
            ConvocatoriaModel.tipo_periodo == alumno.periodo_practica,
        )
        .order_by(ConvocatoriaModel.fecha_inicio_general.desc(), ExpedienteModel.fecha_creacion.desc())
        .first()
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


def _vacante_tiene_cupo(db: Session, vacante: VacanteModel) -> bool:
    return _cupos_usados(db, vacante.id_vacante) < vacante.cupos


def _estado_seleccion_api(seleccion: SeleccionEmpresaModel) -> str:
    if seleccion.estado == "Cancelada":
        return "Rechazada"
    return "Pendiente"


def _expediente_aprobado(db: Session, alumno: AlumnoModel, id_convocatoria: int | None) -> bool:
    query = db.query(ExpedienteModel).filter(
        ExpedienteModel.id_alumno == alumno.id_alumno,
        ExpedienteModel.estado_expediente == "Aprobado",
    )
    if id_convocatoria is not None:
        query = query.filter(ExpedienteModel.id_convocatoria == id_convocatoria)
    return query.first() is not None


def _validar_elegibilidad_practica(alumno: AlumnoModel):
    tipo = alumno.tipo_practica
    respuesta_base = {
        "alumno": {
            "semestre": alumno.semestre,
            "creditos_aprobados": alumno.creditos_aprobados,
            "periodo_practica": alumno.periodo_practica,
        },
        "tipo_practica": (
            {
                "id_tipo_practica": tipo.id_tipo_practica,
                "nombre": tipo.nombre,
                "semestre_requerido": tipo.semestre_requerido,
                "creditos_minimos": tipo.creditos_minimos,
                "orden": tipo.orden,
            }
            if tipo
            else None
        ),
    }

    if tipo is None:
        return {
            "elegible": False,
            "motivo_bloqueo": "No tienes un tipo de practica asignado. Contacta a Administracion.",
            **respuesta_base,
        }

    if tipo.semestre_requerido is not None and alumno.semestre != tipo.semestre_requerido:
        return {
            "elegible": False,
            "motivo_bloqueo": (
                f"No puedes iniciar este proceso porque {tipo.nombre} "
                f"corresponde a {tipo.semestre_requerido}. semestre."
            ),
            **respuesta_base,
        }

    creditos_minimos = tipo.creditos_minimos or 0
    if alumno.creditos_aprobados < creditos_minimos:
        return {
            "elegible": False,
            "motivo_bloqueo": "No cuentas con los creditos minimos requeridos para este tipo de practica.",
            **respuesta_base,
        }

    return {"elegible": True, "motivo_bloqueo": None, **respuesta_base}


def _query_vacantes_compatibles(db: Session, alumno: AlumnoModel, id_convocatoria: int | None = None):
    query = (
        db.query(VacanteModel)
        .options(
            joinedload(VacanteModel.empresa),
            joinedload(VacanteModel.convocatoria),
            joinedload(VacanteModel.tipo_practica),
        )
        .join(EmpresaModel, EmpresaModel.id_empresa == VacanteModel.id_empresa)
        .join(ConvenioModel, ConvenioModel.id_empresa == EmpresaModel.id_empresa)
        .filter(
            EmpresaModel.estado_empresa == "Activa",
            ConvenioModel.es_actual.is_(True),
            ConvenioModel.estado_convenio == "Vigente",
            ConvenioModel.fecha_inicio <= date.today(),
            ConvenioModel.fecha_fin >= date.today(),
            VacanteModel.estado_vacante == "Activa",
            VacanteModel.periodo == alumno.periodo_practica,
            VacanteModel.id_tipo_practica == alumno.id_tipo_practica,
        )
    )
    if id_convocatoria is not None:
        query = query.filter(VacanteModel.id_convocatoria == id_convocatoria)
    return query.order_by(EmpresaModel.nombre_empresa.asc(), VacanteModel.titulo.asc()).all()


@router.get("/me/")
def obtener_mi_padron_alumno(
    id_alumno: int = Depends(obtener_id_alumno_actual),
    db: Session = Depends(obtener_db),
):
    return obtener_padron_alumno(id_alumno, db)


@router.put("/me/preferencias")
def guardar_mis_preferencias_alumno(
    datos: GuardarPreferenciasRequest,
    id_alumno: int = Depends(obtener_id_alumno_actual),
    db: Session = Depends(obtener_db),
):
    return guardar_preferencias_alumno(id_alumno, datos, db)


@router.get("/{id_alumno:int}")
def obtener_padron_alumno(id_alumno: int, db: Session = Depends(obtener_db)):
    alumno = (
        db.query(AlumnoModel)
        .options(joinedload(AlumnoModel.tipo_practica))
        .filter(AlumnoModel.id_alumno == id_alumno)
        .first()
    )
    if alumno is None:
        raise HTTPException(status_code=404, detail="Alumno no encontrado")

    expediente_actual = _expediente_actual_aprobado(db, alumno)
    convocatoria = expediente_actual.convocatoria if expediente_actual else None
    vacantes = _query_vacantes_compatibles(
        db,
        alumno,
        convocatoria.id_convocatoria if convocatoria else None,
    )
    vacantes = [vacante for vacante in vacantes if _vacante_tiene_cupo(db, vacante)]

    empresas = sorted(
        {vacante.id_empresa: vacante.empresa for vacante in vacantes if vacante.empresa}.values(),
        key=lambda empresa: empresa.nombre_empresa,
    )

    selecciones = (
        db.query(SeleccionEmpresaModel)
        .options(joinedload(SeleccionEmpresaModel.vacante).joinedload(VacanteModel.empresa))
        .filter(SeleccionEmpresaModel.id_alumno == id_alumno)
        .order_by(SeleccionEmpresaModel.prioridad.asc())
        .all()
    )

    asignacion = (
        db.query(AsignacionModel)
        .options(
            joinedload(AsignacionModel.empresa),
            joinedload(AsignacionModel.vacante).joinedload(VacanteModel.convocatoria),
            joinedload(AsignacionModel.vacante).joinedload(VacanteModel.tipo_practica),
        )
        .filter(
            AsignacionModel.id_alumno == id_alumno,
            AsignacionModel.estado_asignacion == "Activa",
        )
        .order_by(AsignacionModel.fecha_asignacion.desc())
        .first()
    )

    elegibilidad = _validar_elegibilidad_practica(alumno)
    expediente_aprobado = expediente_actual is not None
    ventana_seleccion_abierta = False
    motivo_calendario = None
    if convocatoria is not None:
        try:
            validar_etapa_actual(convocatoria, "seleccion")
            ventana_seleccion_abierta = True
        except HTTPException as exc:
            motivo_calendario = str(exc.detail)
    puede_seleccionar = bool(expediente_aprobado and elegibilidad["elegible"] and asignacion is None and ventana_seleccion_abierta)
    motivo_bloqueo = None
    if asignacion is not None:
        motivo_bloqueo = "Ya tienes una empresa asignada para esta convocatoria."
    elif not expediente_aprobado:
        motivo_bloqueo = "Tu expediente documental debe estar aprobado por coordinacion antes de seleccionar vacante."
    elif not ventana_seleccion_abierta:
        motivo_bloqueo = motivo_calendario
    elif not elegibilidad["elegible"]:
        motivo_bloqueo = elegibilidad["motivo_bloqueo"]

    return {
        "elegible": puede_seleccionar,
        "puede_seleccionar": puede_seleccionar,
        "motivo_bloqueo": motivo_bloqueo,
        "estado_alumno": alumno.estado_alumno,
        "alumno": elegibilidad["alumno"],
        "tipo_practica": elegibilidad["tipo_practica"],
        "convocatoria": (
            {
                "id_convocatoria": convocatoria.id_convocatoria,
                "nombre": convocatoria.nombre,
                "tipo_periodo": convocatoria.tipo_periodo,
            }
            if convocatoria
            else None
        ),
        "empresa_asignada": (
            {
                "id_empresa": asignacion.empresa.id_empresa,
                "nombre": asignacion.empresa.nombre_empresa,
                "giro": asignacion.empresa.giro,
                "domicilio": asignacion.empresa.domicilio,
                "correo_contacto": asignacion.empresa.correo_contacto,
                "telefono": asignacion.empresa.telefono,
                "vacante": asignacion.vacante.titulo if asignacion.vacante else None,
                "convocatoria": (
                    asignacion.vacante.convocatoria.nombre
                    if asignacion.vacante and asignacion.vacante.convocatoria
                    else None
                ),
                "tipo_practica": (
                    asignacion.vacante.tipo_practica.nombre
                    if asignacion.vacante and asignacion.vacante.tipo_practica
                    else None
                ),
                "periodo": asignacion.vacante.periodo if asignacion.vacante else None,
                "fecha_asignacion": asignacion.fecha_asignacion,
            }
            if asignacion and asignacion.empresa
            else None
        ),
        "empresas": [
            {
                "id_empresa": empresa.id_empresa,
                "nombre": empresa.nombre_empresa,
                "giro": empresa.giro,
                "domicilio": empresa.domicilio,
                "correo_contacto": empresa.correo_contacto,
                "telefono": empresa.telefono,
            }
            for empresa in empresas
        ],
        "vacantes": [
            {
                "id_vacante": vacante.id_vacante,
                "id_empresa": vacante.id_empresa,
                "empresa": vacante.empresa.nombre_empresa if vacante.empresa else "Sin empresa",
                "giro": vacante.empresa.giro if vacante.empresa else None,
                "domicilio": vacante.empresa.domicilio if vacante.empresa else None,
                "correo_contacto": vacante.empresa.correo_contacto if vacante.empresa else None,
                "telefono": vacante.empresa.telefono if vacante.empresa else None,
                "id_convocatoria": vacante.id_convocatoria,
                "convocatoria": vacante.convocatoria.nombre if vacante.convocatoria else None,
                "id_tipo_practica": vacante.id_tipo_practica,
                "tipo_practica": vacante.tipo_practica.nombre if vacante.tipo_practica else None,
                "titulo": vacante.titulo,
                "descripcion": vacante.descripcion,
                "actividades": vacante.actividades,
                "requisitos": vacante.requisitos,
                "cupos": vacante.cupos,
                "cupos_usados": _cupos_usados(db, vacante.id_vacante),
                "periodo": vacante.periodo,
                "estado_vacante": vacante.estado_vacante,
            }
            for vacante in vacantes
        ],
        "selecciones": [
            {
                "id_seleccion": seleccion.id_seleccion,
                "id_empresa": seleccion.vacante.id_empresa if seleccion.vacante else None,
                "id_convocatoria": seleccion.id_convocatoria,
                "id_vacante": seleccion.id_vacante,
                "prioridad": seleccion.prioridad,
                "estado_seleccion": _estado_seleccion_api(seleccion),
                "observaciones": seleccion.observaciones,
                "fecha_revision": seleccion.fecha_revision.isoformat() if seleccion.fecha_revision else None,
            }
            for seleccion in selecciones
        ],
    }


@router.put("/{id_alumno:int}/preferencias")
def guardar_preferencias_alumno(
    id_alumno: int,
    datos: GuardarPreferenciasRequest,
    db: Session = Depends(obtener_db),
):
    alumno = (
        db.query(AlumnoModel)
        .options(joinedload(AlumnoModel.tipo_practica))
        .filter(AlumnoModel.id_alumno == id_alumno)
        .first()
    )
    if alumno is None:
        raise HTTPException(status_code=404, detail="Alumno no encontrado")
    expediente_actual = _expediente_actual_aprobado(db, alumno)
    convocatoria = expediente_actual.convocatoria if expediente_actual else None
    if convocatoria is None:
        raise HTTPException(status_code=400, detail="El expediente documental debe estar aprobado antes de guardar preferencias")
    validar_etapa_actual(convocatoria, "seleccion")

    elegibilidad = _validar_elegibilidad_practica(alumno)
    if not elegibilidad["elegible"]:
        raise HTTPException(status_code=403, detail=elegibilidad["motivo_bloqueo"])

    ids_vacantes = [preferencia.id_vacante for preferencia in datos.preferencias]
    prioridades = [preferencia.prioridad for preferencia in datos.preferencias]
    if len(ids_vacantes) != len(set(ids_vacantes)):
        raise HTTPException(status_code=400, detail="No se puede repetir la misma vacante")
    if len(prioridades) != len(set(prioridades)):
        raise HTTPException(status_code=400, detail="No se puede repetir la prioridad")
    if datos.id_vacante_prioritaria is not None and datos.id_vacante_prioritaria not in ids_vacantes:
        raise HTTPException(status_code=400, detail="La vacante prioritaria debe estar dentro de las preferencias")

    vacantes = (
        db.query(VacanteModel)
        .options(joinedload(VacanteModel.empresa))
        .filter(VacanteModel.id_vacante.in_(ids_vacantes))
        .all()
    )
    vacantes_por_id = {vacante.id_vacante: vacante for vacante in vacantes}
    if set(ids_vacantes) != set(vacantes_por_id):
        raise HTTPException(status_code=400, detail="Todas las vacantes seleccionadas deben existir")

    for vacante in vacantes:
        if vacante.estado_vacante != "Activa":
            raise HTTPException(status_code=400, detail="Solo puedes seleccionar vacantes activas")
        if vacante.periodo != alumno.periodo_practica:
            raise HTTPException(status_code=400, detail="La vacante no corresponde a tu periodo de practica")
        if vacante.id_tipo_practica != alumno.id_tipo_practica:
            raise HTTPException(status_code=400, detail="La vacante no corresponde a tu tipo de practica")
        if vacante.empresa is None or vacante.empresa.estado_empresa != "Activa":
            raise HTTPException(status_code=400, detail="La empresa de la vacante no esta activa")
        if not _vacante_tiene_cupo(db, vacante):
            raise HTTPException(status_code=400, detail="La vacante seleccionada ya no tiene cupo disponible")

    db.query(SeleccionEmpresaModel).filter(SeleccionEmpresaModel.id_alumno == id_alumno).delete()

    for preferencia in datos.preferencias:
        vacante = vacantes_por_id[preferencia.id_vacante]
        db.add(
            SeleccionEmpresaModel(
                id_alumno=id_alumno,
                id_convocatoria=vacante.id_convocatoria,
                id_vacante=vacante.id_vacante,
                prioridad=preferencia.prioridad,
                estado="Registrada",
                observaciones=None,
                fecha_revision=None,
                revisado_por=None,
            )
        )

    db.commit()
    return {"mensaje": "Preferencias guardadas correctamente"}
