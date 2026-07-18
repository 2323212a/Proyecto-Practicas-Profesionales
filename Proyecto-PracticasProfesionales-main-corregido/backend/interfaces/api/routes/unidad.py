from __future__ import annotations

from datetime import date
from decimal import Decimal

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy import func, text
from sqlalchemy.orm import Session, joinedload

from app.services.convenio_empresa_service import (
    obtener_convenio_actual,
    obtener_convenio_vigente,
)
from app.services.convocatoria_rules_service import validar_etapa_actual
from app.services.empresa_reglas_service import (
    convocatoria_activa_para_empresas,
    validar_habilitacion_empresa_para_vacantes,
    validar_participacion_aceptada,
)
from app.services.notificacion_service import crear_notificacion
from infrastructure.database.dependencies import obtener_db
from infrastructure.security.auth_dependencies import obtener_id_empresa_actual, requerir_empresa_actual_o_roles
from infrastructure.persistence.models.alumno import AlumnoModel
from infrastructure.persistence.models.asignacion import AsignacionModel
from infrastructure.persistence.models.convenio import ConvenioModel
from infrastructure.persistence.models.convocatoria import ConvocatoriaModel
from infrastructure.persistence.models.documento_empresa import DocumentoEmpresaModel
from infrastructure.persistence.models.empresa import EmpresaModel
from infrastructure.persistence.models.evaluacion_empresa_alumno import EvaluacionEmpresaAlumnoModel
from infrastructure.persistence.models.horas import HorasModel
from infrastructure.persistence.models.personal_interno import PersonalInternoModel
from infrastructure.persistence.models.responsable_empresa import ResponsableEmpresaModel
from infrastructure.persistence.models.tipo_documento_empresa import TipoDocumentoEmpresaModel
from infrastructure.persistence.models.participacion_empresa_convocatoria import ParticipacionEmpresaConvocatoriaModel
from infrastructure.persistence.models.vacante import VacanteModel


router = APIRouter(
    prefix="/unidad",
    tags=["Unidad Receptora"],
    dependencies=[Depends(requerir_empresa_actual_o_roles(["Administrador"]))],
)


class CambiarEstadoHorasUnidadRequest(BaseModel):
    estado: str
    observaciones: str | None = None


def _tiene_convenio_vigente(db: Session, id_empresa: int) -> bool:
    return obtener_convenio_vigente(db, id_empresa) is not None


def _estado_convenio_empresa(db: Session, id_empresa: int) -> str | None:
    convenio = obtener_convenio_actual(db, id_empresa)
    return convenio.estado_convenio if convenio else None

def _documentacion_legal_aprobada(db: Session, id_empresa: int) -> bool:
    tipos_obligatorios = (
        db.query(TipoDocumentoEmpresaModel)
        .filter(
            TipoDocumentoEmpresaModel.activo.is_(True),
            TipoDocumentoEmpresaModel.obligatorio.is_(True),
            TipoDocumentoEmpresaModel.etapa == "Documentacion",
        )
        .all()
    )
    if not tipos_obligatorios:
        return False

    documentos = (
        db.query(DocumentoEmpresaModel)
        .filter(DocumentoEmpresaModel.id_empresa == id_empresa)
        .all()
    )
    por_tipo = {documento.id_tipo_documento_empresa: documento for documento in documentos}
    return all(
        por_tipo.get(tipo.id_tipo_documento_empresa) is not None
        and por_tipo[tipo.id_tipo_documento_empresa].estado_documento == "Aprobado"
        for tipo in tipos_obligatorios
    )


def _estado_vacantes_empresa(db: Session, empresa: EmpresaModel) -> dict:
    documentacion_ok = _documentacion_legal_aprobada(db, empresa.id_empresa)
    convenio_vigente = _tiene_convenio_vigente(db, empresa.id_empresa)
    convenio_estado = _estado_convenio_empresa(db, empresa.id_empresa)
    vinculacion_ok = False
    try:
        validar_habilitacion_empresa_para_vacantes(db, empresa)
        tramite_ok = True
        vinculacion_ok = empresa.tipo_tramite == "Vinculacion"
    except HTTPException:
        tramite_ok = False
    puede_capturar = documentacion_ok and tramite_ok

    if puede_capturar:
        motivo = None
    elif not documentacion_ok:
        motivo = "Necesitas aprobar toda la documentacion legal obligatoria antes de capturar vacantes."
    elif empresa.tipo_tramite == "Vinculacion":
        motivo = "Necesitas una vinculacion aprobada y vigente antes de capturar vacantes."
    else:
        motivo = "Necesitas un convenio aprobado y vigente antes de capturar vacantes."

    return {
        "documentacion_legal_aprobada": documentacion_ok,
        "convenio_vigente": convenio_vigente,
        "convenio_estado": convenio_estado,
        "vinculacion_aprobada": vinculacion_ok,
        "puede_capturar_vacantes": puede_capturar,
        "motivo_bloqueo": motivo,
    }


class CrearVacanteUnidadRequest(BaseModel):
    id_convocatoria: int
    id_tipo_practica: int
    titulo: str
    descripcion: str | None = None
    actividades: str | None = None
    requisitos: str | None = None
    cupos: int


class SolicitarParticipacionRequest(BaseModel):
    id_convocatoria: int
    observaciones: str | None = None


def _nombre_usuario(perfil) -> str:
    if perfil is None:
        return "Sin nombre"
    return " ".join(
        parte
        for parte in [getattr(perfil, "nombre", None), getattr(perfil, "apellido_paterno", None), getattr(perfil, "apellido_materno", None)]
        if parte
    ) or getattr(perfil, "correo", "Sin nombre")


def _decimal_to_float(valor) -> float:
    if isinstance(valor, Decimal):
        return float(valor)
    return float(valor or 0)


def _hora_unidad_response(hora: HorasModel) -> dict:
    asignacion = hora.asignacion
    alumno = asignacion.alumno
    return {
        "id_horas": hora.id_horas,
        "id_asignacion": hora.id_asignacion,
        "id_alumno": alumno.id_alumno,
        "alumno": _nombre_usuario(alumno),
        "matricula": alumno.matricula,
        "carrera": alumno.carrera.nombre if alumno.carrera else "Sin carrera",
        "proyecto": asignacion.vacante.titulo if asignacion.vacante else "Sin proyecto",
        "fecha": hora.fecha.isoformat(),
        "horas": _decimal_to_float(hora.horas_realizadas),
        "actividad": hora.actividad,
        "estado": hora.estado_horas,
        "observaciones": hora.observaciones,
        "evidencia_archivo": hora.evidencia_archivo,
        "fecha_registro": hora.fecha_registro.isoformat() if hora.fecha_registro else None,
    }


def _empresa_basica_response(empresa: EmpresaModel) -> dict:
    return {
        "id_empresa": empresa.id_empresa,
        "nombre_empresa": empresa.nombre_empresa,
        "rfc": empresa.rfc,
        "giro": empresa.giro,
        "domicilio": empresa.domicilio,
        "telefono": empresa.telefono,
        "correo_contacto": empresa.correo_contacto,
        "estado_empresa": empresa.estado_empresa,
        "tipo_tramite": empresa.tipo_tramite,
    }


def _alumnos_unidad_items(id_empresa: int, db: Session) -> list[dict]:
    asignaciones = (
        db.query(AsignacionModel)
        .options(
            joinedload(AsignacionModel.alumno).joinedload(AlumnoModel.usuario),
            joinedload(AsignacionModel.alumno).joinedload(AlumnoModel.carrera),
            joinedload(AsignacionModel.vacante),
            joinedload(AsignacionModel.asesor).joinedload(PersonalInternoModel.usuario),
            joinedload(AsignacionModel.horas),
        )
        .filter(
            AsignacionModel.id_empresa == id_empresa,
            AsignacionModel.estado_asignacion == "Activa",
        )
        .order_by(AsignacionModel.fecha_asignacion.desc())
        .all()
    )

    alumnos = []
    for asignacion in asignaciones:
        alumno = asignacion.alumno
        horas_aprobadas = sum(
            _decimal_to_float(horas.horas_realizadas)
            for horas in asignacion.horas
            if horas.estado_horas == "Aprobada"
        )
        horas_pendientes = sum(
            _decimal_to_float(horas.horas_realizadas)
            for horas in asignacion.horas
            if horas.estado_horas == "Pendiente"
        )
        total_horas = 480
        avance = round((horas_aprobadas / total_horas) * 100) if total_horas else 0
        estado = "Por evaluar" if avance >= 80 else "Activo"

        alumnos.append(
            {
                "id_asignacion": asignacion.id_asignacion,
                "id_alumno": alumno.id_alumno,
                "nombre": _nombre_usuario(alumno),
                "matricula": alumno.matricula,
                "carrera": alumno.carrera.nombre if alumno.carrera else "Sin carrera",
                "semestre": alumno.semestre,
                "grupo": alumno.grupo,
                "proyecto": asignacion.vacante.titulo if asignacion.vacante else "Sin proyecto",
                "vacante": asignacion.vacante.titulo if asignacion.vacante else "Sin vacante",
                "horas_aprobadas": horas_aprobadas,
                "horas_pendientes": horas_pendientes,
                "total_horas": total_horas,
                "avance": avance,
                "estado": estado,
                "asesor": (
                    _nombre_usuario(asignacion.asesor.usuario)
                    if asignacion.asesor and asignacion.asesor.usuario
                    else "Sin asesor asignado"
                ),
                "fecha_inicio": asignacion.fecha_asignacion.isoformat(),
                "fecha_fin": None,
                "tipo_asignacion": asignacion.tipo_asignacion,
            }
        )

    return alumnos


@router.get("/me/dashboard")
def obtener_dashboard_mi_unidad(
    id_empresa: int = Depends(obtener_id_empresa_actual),
    db: Session = Depends(obtener_db),
):
    empresa = db.query(EmpresaModel).filter(EmpresaModel.id_empresa == id_empresa).first()
    if empresa is None:
        raise HTTPException(status_code=404, detail="Empresa no encontrada")
    alumnos = _alumnos_unidad_items(id_empresa, db)
    asignacion_ids = [alumno["id_asignacion"] for alumno in alumnos]
    vacantes = (
        db.query(VacanteModel)
        .filter(VacanteModel.id_empresa == id_empresa)
        .order_by(VacanteModel.id_vacante.desc())
        .limit(5)
        .all()
    )
    convenios = (
        db.query(ConvenioModel)
        .filter(ConvenioModel.id_empresa == id_empresa)
        .order_by(
            ConvenioModel.es_actual.desc(),
            ConvenioModel.fecha_fin.desc(),
            ConvenioModel.id_convenio.desc(),
        )
        .all()
    )
    horas_aprobadas = (
        db.query(func.coalesce(func.sum(HorasModel.horas_realizadas), 0))
        .join(AsignacionModel, HorasModel.id_asignacion == AsignacionModel.id_asignacion)
        .filter(AsignacionModel.id_empresa == id_empresa, HorasModel.estado_horas == "Aprobada")
        .scalar()
        or 0
    )
    evaluadas = (
        db.query(EvaluacionEmpresaAlumnoModel.id_asignacion)
        .filter(EvaluacionEmpresaAlumnoModel.id_asignacion.in_(asignacion_ids))
        .all()
        if asignacion_ids
        else []
    )
    evaluadas_ids = {item[0] for item in evaluadas}
    evaluaciones_pendientes = [
        alumno for alumno in alumnos if alumno["id_asignacion"] not in evaluadas_ids
    ]

    return {
        "empresa": _empresa_basica_response(empresa),
        "resumen": {
            "alumnos_activos": len(alumnos),
            "planes_trabajo": db.query(VacanteModel).filter(VacanteModel.id_empresa == id_empresa).count(),
            "convenios_vigentes": sum(
                1
                for convenio in convenios
                if convenio.es_actual
                and convenio.estado_convenio == "Vigente"
                and convenio.fecha_inicio is not None
                and convenio.fecha_fin is not None
                and convenio.fecha_inicio <= date.today() <= convenio.fecha_fin
            ),
            "horas_registradas": _decimal_to_float(horas_aprobadas),
            "evaluaciones_pendientes": len(evaluaciones_pendientes),
        },
        "alumnos": alumnos[:6],
        "vacantes": [
            {
                "id_vacante": vacante.id_vacante,
                "titulo": vacante.titulo,
                "estado_vacante": vacante.estado_vacante,
                "cupos": vacante.cupos,
                "periodo": vacante.periodo,
            }
            for vacante in vacantes
        ],
        "convenios": [
            {
                "id_convenio": convenio.id_convenio,
                "fecha_inicio": convenio.fecha_inicio.isoformat() if convenio.fecha_inicio else None,
                "fecha_fin": convenio.fecha_fin.isoformat() if convenio.fecha_fin else None,
                "estado_convenio": convenio.estado_convenio,
                "es_actual": convenio.es_actual,
                "observaciones": convenio.observaciones,
            }
            for convenio in convenios
        ],
        "evaluaciones_pendientes": evaluaciones_pendientes[:5],
    }


@router.get("/me/perfil")
def obtener_perfil_mi_unidad(
    id_empresa: int = Depends(obtener_id_empresa_actual),
    db: Session = Depends(obtener_db),
):
    empresa = (
        db.query(EmpresaModel)
        .options(joinedload(EmpresaModel.responsables).joinedload(ResponsableEmpresaModel.usuario))
        .filter(EmpresaModel.id_empresa == id_empresa)
        .first()
    )
    if empresa is None:
        raise HTTPException(status_code=404, detail="Empresa no encontrada")

    alumnos = _alumnos_unidad_items(id_empresa, db)
    convenios = (
        db.query(ConvenioModel)
        .filter(ConvenioModel.id_empresa == id_empresa)
        .order_by(
            ConvenioModel.es_actual.desc(),
            ConvenioModel.fecha_fin.desc(),
            ConvenioModel.id_convenio.desc(),
        )
        .all()
    )
    vacantes = db.query(VacanteModel).filter(VacanteModel.id_empresa == id_empresa).all()

    return {
        "empresa": _empresa_basica_response(empresa),
        "resumen": {
            "alumnos_asignados": len(alumnos),
            "convenios_vigentes": sum(
                1
                for convenio in convenios
                if convenio.es_actual
                and convenio.estado_convenio == "Vigente"
                and convenio.fecha_inicio is not None
                and convenio.fecha_fin is not None
                and convenio.fecha_inicio <= date.today() <= convenio.fecha_fin
            ),
            "planes_disponibles": sum(1 for vacante in vacantes if vacante.estado_vacante == "Activa"),
        },
        "responsables": [
            {
                "id_responsable": responsable.id_responsable,
                "nombre": _nombre_usuario(responsable.usuario) if responsable.usuario else "Sin usuario",
                "cargo": responsable.cargo or "Responsable",
                "correo": responsable.usuario.correo if responsable.usuario else None,
                "telefono": responsable.telefono,
            }
            for responsable in empresa.responsables
        ],
        "vacantes": [
            {
                "id_vacante": vacante.id_vacante,
                "titulo": vacante.titulo,
                "descripcion": vacante.descripcion,
                "actividades": vacante.actividades,
                "requisitos": vacante.requisitos,
                "cupos": vacante.cupos,
                "periodo": vacante.periodo,
                "estado_vacante": vacante.estado_vacante,
            }
            for vacante in vacantes
        ],
        "convenios": [
            {
                "id_convenio": convenio.id_convenio,
                "fecha_inicio": convenio.fecha_inicio.isoformat() if convenio.fecha_inicio else None,
                "fecha_fin": convenio.fecha_fin.isoformat() if convenio.fecha_fin else None,
                "estado_convenio": convenio.estado_convenio,
                "es_actual": convenio.es_actual,
                "observaciones": convenio.observaciones,
            }
            for convenio in convenios
        ],
    }


@router.get("/{id_empresa:int}/alumnos")
def listar_alumnos_unidad(id_empresa: int, db: Session = Depends(obtener_db)):
    empresa = db.query(EmpresaModel).filter(EmpresaModel.id_empresa == id_empresa).first()
    if empresa is None:
        raise HTTPException(status_code=404, detail="Empresa no encontrada")

    asignaciones = (
        db.query(AsignacionModel)
        .options(
            joinedload(AsignacionModel.alumno).joinedload(AlumnoModel.usuario),
            joinedload(AsignacionModel.alumno).joinedload(AlumnoModel.carrera),
            joinedload(AsignacionModel.vacante),
            joinedload(AsignacionModel.asesor).joinedload(PersonalInternoModel.usuario),
            joinedload(AsignacionModel.horas),
        )
        .filter(
            AsignacionModel.id_empresa == id_empresa,
            AsignacionModel.estado_asignacion == "Activa",
        )
        .order_by(AsignacionModel.fecha_asignacion.desc())
        .all()
    )

    alumnos = []
    for asignacion in asignaciones:
        alumno = asignacion.alumno
        horas_aprobadas = sum(
            _decimal_to_float(horas.horas_realizadas)
            for horas in asignacion.horas
            if horas.estado_horas == "Aprobada"
        )
        horas_pendientes = sum(
            _decimal_to_float(horas.horas_realizadas)
            for horas in asignacion.horas
            if horas.estado_horas == "Pendiente"
        )
        total_horas = 480
        avance = round((horas_aprobadas / total_horas) * 100) if total_horas else 0
        estado = "Por evaluar" if avance >= 80 else "Activo"

        alumnos.append(
            {
                "id_asignacion": asignacion.id_asignacion,
                "id_alumno": alumno.id_alumno,
                "nombre": _nombre_usuario(alumno),
                "matricula": alumno.matricula,
                "carrera": alumno.carrera.nombre if alumno.carrera else "Sin carrera",
                "semestre": alumno.semestre,
                "grupo": alumno.grupo,
                "proyecto": asignacion.vacante.titulo if asignacion.vacante else "Sin proyecto",
                "vacante": asignacion.vacante.titulo if asignacion.vacante else "Sin vacante",
                "horas_aprobadas": horas_aprobadas,
                "horas_pendientes": horas_pendientes,
                "total_horas": total_horas,
                "avance": avance,
                "estado": estado,
                "asesor": (
                    _nombre_usuario(asignacion.asesor.usuario)
                    if asignacion.asesor and asignacion.asesor.usuario
                    else "Sin asesor asignado"
                ),
                "fecha_inicio": asignacion.fecha_asignacion.isoformat(),
                "fecha_fin": None,
                "tipo_asignacion": asignacion.tipo_asignacion,
            }
        )

    return {
        "id_empresa": empresa.id_empresa,
        "empresa": empresa.nombre_empresa,
        "estado_empresa": empresa.estado_empresa,
        "alumnos": alumnos,
    }


@router.get("/me/alumnos")
def listar_mis_alumnos_unidad(
    id_empresa: int = Depends(obtener_id_empresa_actual),
    db: Session = Depends(obtener_db),
):
    return listar_alumnos_unidad(id_empresa, db)


@router.get("/{id_empresa:int}/horas")
def listar_horas_unidad(id_empresa: int, db: Session = Depends(obtener_db)):
    empresa = db.query(EmpresaModel).filter(EmpresaModel.id_empresa == id_empresa).first()
    if empresa is None:
        raise HTTPException(status_code=404, detail="Empresa no encontrada")

    horas = (
        db.query(HorasModel)
        .join(AsignacionModel, HorasModel.id_asignacion == AsignacionModel.id_asignacion)
        .options(
            joinedload(HorasModel.asignacion)
            .joinedload(AsignacionModel.alumno)
            .joinedload(AlumnoModel.usuario),
            joinedload(HorasModel.asignacion)
            .joinedload(AsignacionModel.alumno)
            .joinedload(AlumnoModel.carrera),
            joinedload(HorasModel.asignacion).joinedload(AsignacionModel.vacante),
        )
        .filter(AsignacionModel.id_empresa == id_empresa)
        .order_by(HorasModel.fecha.desc(), HorasModel.id_horas.desc())
        .all()
    )

    registros = [_hora_unidad_response(hora) for hora in horas]
    horas_aprobadas = sum(registro["horas"] for registro in registros if registro["estado"] == "Aprobada")
    horas_pendientes = sum(registro["horas"] for registro in registros if registro["estado"] == "Pendiente")

    return {
        "id_empresa": empresa.id_empresa,
        "empresa": empresa.nombre_empresa,
        "resumen": {
            "total_registros": len(registros),
            "pendientes": sum(1 for registro in registros if registro["estado"] == "Pendiente"),
            "aprobadas": sum(1 for registro in registros if registro["estado"] == "Aprobada"),
            "rechazadas": sum(1 for registro in registros if registro["estado"] == "Rechazada"),
            "horas_aprobadas": horas_aprobadas,
            "horas_pendientes": horas_pendientes,
        },
        "horas": registros,
    }


@router.get("/me/horas")
def listar_mis_horas_unidad(
    id_empresa: int = Depends(obtener_id_empresa_actual),
    db: Session = Depends(obtener_db),
):
    return listar_horas_unidad(id_empresa, db)


@router.patch("/{id_empresa:int}/horas/{id_horas:int}/estado")
def cambiar_estado_hora_unidad(
    id_empresa: int,
    id_horas: int,
    payload: CambiarEstadoHorasUnidadRequest,
    db: Session = Depends(obtener_db),
):
    estado = payload.estado.strip()
    if estado not in {"Aprobada", "Rechazada"}:
        raise HTTPException(status_code=400, detail="El estado debe ser Aprobada o Rechazada")

    hora = (
        db.query(HorasModel)
        .join(AsignacionModel, HorasModel.id_asignacion == AsignacionModel.id_asignacion)
        .options(
            joinedload(HorasModel.asignacion)
            .joinedload(AsignacionModel.alumno)
            .joinedload(AlumnoModel.usuario),
            joinedload(HorasModel.asignacion)
            .joinedload(AsignacionModel.alumno)
            .joinedload(AlumnoModel.carrera),
            joinedload(HorasModel.asignacion).joinedload(AsignacionModel.vacante),
        )
        .filter(
            HorasModel.id_horas == id_horas,
            AsignacionModel.id_empresa == id_empresa,
        )
        .first()
    )
    if hora is None:
        raise HTTPException(status_code=404, detail="Registro de horas no encontrado para esta unidad")

    hora.estado_horas = estado
    hora.observaciones = payload.observaciones
    alumno = hora.asignacion.alumno if hora.asignacion else None
    crear_notificacion(
        db,
        alumno.id_usuario if alumno else None,
        f"Horas {estado.lower()}s",
        f"Tu registro de horas del {hora.fecha.isoformat()} fue marcado como {estado}."
        + (f" Observaciones: {payload.observaciones}" if payload.observaciones else ""),
    )
    db.commit()
    db.refresh(hora)

    return _hora_unidad_response(hora)


@router.patch("/me/horas/{id_horas:int}/estado")
def cambiar_estado_mi_hora_unidad(
    id_horas: int,
    payload: CambiarEstadoHorasUnidadRequest,
    id_empresa: int = Depends(obtener_id_empresa_actual),
    db: Session = Depends(obtener_db),
):
    return cambiar_estado_hora_unidad(id_empresa, id_horas, payload, db)


@router.get("/{id_empresa:int}/vacantes")
def listar_vacantes_unidad(id_empresa: int, db: Session = Depends(obtener_db)):
    empresa = db.query(EmpresaModel).filter(EmpresaModel.id_empresa == id_empresa).first()
    if empresa is None:
        raise HTTPException(status_code=404, detail="Empresa no encontrada")
    estado_proceso = _estado_vacantes_empresa(db, empresa)
    puede_capturar = estado_proceso["puede_capturar_vacantes"]
    tipos_practica = {
        row.id_tipo_practica: row.nombre
        for row in db.execute(text("SELECT id_tipo_practica, nombre FROM tipo_practica")).all()
    }

    vacantes = (
        db.query(VacanteModel)
        .filter(VacanteModel.id_empresa == id_empresa)
        .order_by(VacanteModel.id_vacante.desc())
        .all()
    )

    return {
        "empresa": {
            "id_empresa": empresa.id_empresa,
            "nombre_empresa": empresa.nombre_empresa,
            "estado_empresa": empresa.estado_empresa,
            "tipo_tramite": empresa.tipo_tramite,
            "documentacion_legal_aprobada": estado_proceso["documentacion_legal_aprobada"],
            "convenio_vigente": estado_proceso["convenio_vigente"],
            "convenio_estado": estado_proceso["convenio_estado"],
            "puede_capturar_vacantes": puede_capturar,
            "puede_publicar": puede_capturar,
            "motivo_bloqueo": estado_proceso["motivo_bloqueo"],
        },
        "vacantes": [
            {
                "id_vacante": vacante.id_vacante,
                "id_empresa": vacante.id_empresa,
                "titulo": vacante.titulo,
                "descripcion": vacante.descripcion,
                "actividades": vacante.actividades,
                "requisitos": vacante.requisitos,
                "cupos": vacante.cupos,
                "estado_vacante": vacante.estado_vacante,
                "periodo": vacante.periodo,
                "id_tipo_practica": vacante.id_tipo_practica,
                "tipo_practica": tipos_practica.get(vacante.id_tipo_practica),
                "visible_padron": (
                    puede_capturar
                    and vacante.estado_vacante == "Activa"
                ),
            }
            for vacante in vacantes
        ],
    }


@router.get("/me/vacantes")
def listar_mis_vacantes_unidad(
    id_empresa: int = Depends(obtener_id_empresa_actual),
    db: Session = Depends(obtener_db),
):
    return listar_vacantes_unidad(id_empresa, db)


@router.post("/me/participaciones")
def solicitar_mi_participacion_convocatoria(
    datos: SolicitarParticipacionRequest,
    id_empresa: int = Depends(obtener_id_empresa_actual),
    db: Session = Depends(obtener_db),
):
    empresa = db.query(EmpresaModel).filter(EmpresaModel.id_empresa == id_empresa).first()
    if empresa is None:
        raise HTTPException(status_code=404, detail="Empresa no encontrada")
    if empresa.estado_empresa not in {"Pendiente", "Activa"}:
        raise HTTPException(status_code=400, detail="La empresa debe estar aceptada para solicitar participacion.")
    convocatoria_activa_para_empresas(db, datos.id_convocatoria)
    existente = (
        db.query(ParticipacionEmpresaConvocatoriaModel)
        .filter(
            ParticipacionEmpresaConvocatoriaModel.id_empresa == id_empresa,
            ParticipacionEmpresaConvocatoriaModel.id_convocatoria == datos.id_convocatoria,
        )
        .first()
    )
    if existente is not None:
        raise HTTPException(status_code=400, detail="Ya existe una participacion para esta convocatoria.")
    participacion = ParticipacionEmpresaConvocatoriaModel(
        id_empresa=id_empresa,
        id_convocatoria=datos.id_convocatoria,
        estado="Pendiente",
        observaciones=datos.observaciones,
    )
    db.add(participacion)
    db.commit()
    db.refresh(participacion)
    return {
        "id_participacion": participacion.id_participacion,
        "estado": participacion.estado,
        "id_convocatoria": participacion.id_convocatoria,
    }


@router.post("/{id_empresa:int}/vacantes")
def crear_vacante_unidad(
    id_empresa: int,
    datos: CrearVacanteUnidadRequest,
    db: Session = Depends(obtener_db),
):
    empresa = db.query(EmpresaModel).filter(EmpresaModel.id_empresa == id_empresa).first()
    if empresa is None:
        raise HTTPException(status_code=404, detail="Empresa no encontrada")
    if empresa.estado_empresa not in {"Pendiente", "Activa"}:
        raise HTTPException(
            status_code=400,
            detail="La solicitud de la empresa debe estar aceptada antes de registrar vacantes",
        )
    if not _estado_vacantes_empresa(db, empresa)["puede_capturar_vacantes"]:
        raise HTTPException(
            status_code=400,
            detail="Necesitas documentacion legal aprobada y tramite vigente antes de capturar vacantes.",
        )
    if datos.cupos <= 0:
        raise HTTPException(status_code=400, detail="Los cupos deben ser mayores a cero")
    convocatoria = (
        db.query(ConvocatoriaModel)
        .filter(ConvocatoriaModel.id_convocatoria == datos.id_convocatoria, ConvocatoriaModel.estado == "Activa")
        .first()
    )
    if convocatoria is None:
        raise HTTPException(status_code=404, detail="Convocatoria activa no encontrada")
    validar_etapa_actual(convocatoria, "empresas")
    validar_participacion_aceptada(db, id_empresa, datos.id_convocatoria)
    existente = (
        db.query(VacanteModel)
        .filter(VacanteModel.id_empresa == id_empresa, VacanteModel.id_convocatoria == datos.id_convocatoria)
        .first()
    )
    if existente is not None:
        raise HTTPException(status_code=400, detail="La empresa ya tiene una vacante registrada para esta convocatoria.")
    tipo_practica = db.execute(
        text(
            """
            SELECT id_tipo_practica
            FROM tipo_practica
            WHERE id_tipo_practica = :id_tipo_practica AND activo = 1
            """
        ),
        {"id_tipo_practica": datos.id_tipo_practica},
    ).first()
    if tipo_practica is None:
        raise HTTPException(status_code=400, detail="Tipo de practica no valido o inactivo")

    vacante = VacanteModel(
        id_empresa=id_empresa,
        id_convocatoria=datos.id_convocatoria,
        id_tipo_practica=datos.id_tipo_practica,
        titulo=datos.titulo.strip(),
        descripcion=datos.descripcion,
        actividades=datos.actividades,
        requisitos=datos.requisitos,
        cupos=datos.cupos,
        periodo=convocatoria.tipo_periodo,
        estado_vacante="Pendiente",
    )
    db.add(vacante)
    db.commit()
    db.refresh(vacante)
    return {
        "id_vacante": vacante.id_vacante,
        "id_empresa": vacante.id_empresa,
        "id_convocatoria": vacante.id_convocatoria,
        "id_tipo_practica": vacante.id_tipo_practica,
        "titulo": vacante.titulo,
        "descripcion": vacante.descripcion,
        "actividades": vacante.actividades,
        "requisitos": vacante.requisitos,
        "cupos": vacante.cupos,
        "estado_vacante": vacante.estado_vacante,
        "periodo": vacante.periodo,
    }


@router.post("/me/vacantes")
def crear_mi_vacante_unidad(
    datos: CrearVacanteUnidadRequest,
    id_empresa: int = Depends(obtener_id_empresa_actual),
    db: Session = Depends(obtener_db),
):
    return crear_vacante_unidad(id_empresa, datos, db)
