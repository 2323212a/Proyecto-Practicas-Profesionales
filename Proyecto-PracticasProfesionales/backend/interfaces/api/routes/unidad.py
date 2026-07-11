from __future__ import annotations

from decimal import Decimal

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy import func
from sqlalchemy.orm import Session, joinedload

from app.services.notificacion_service import crear_notificacion
from infrastructure.database.dependencies import obtener_db
from infrastructure.security.auth_dependencies import obtener_id_empresa_actual, requerir_empresa_actual_o_roles
from infrastructure.persistence.models.alumno import AlumnoModel
from infrastructure.persistence.models.asignacion import AsignacionModel
from infrastructure.persistence.models.convenio import ConvenioModel
from infrastructure.persistence.models.carrera import CarreraModel
from infrastructure.persistence.models.docente_asesor import DocenteAsesorModel
from infrastructure.persistence.models.empresa import EmpresaModel
from infrastructure.persistence.models.evaluacion_empresa_alumno import EvaluacionEmpresaAlumnoModel
from infrastructure.persistence.models.horas import HorasModel
from infrastructure.persistence.models.responsable_empresa import ResponsableEmpresaModel
from infrastructure.persistence.models.vacante import VacanteModel


router = APIRouter(
    prefix="/unidad",
    tags=["Unidad Receptora"],
    dependencies=[Depends(requerir_empresa_actual_o_roles(["Administrador"]))],
)


class CambiarEstadoHorasUnidadRequest(BaseModel):
    estado: str
    observaciones: str | None = None


class CrearVacanteUnidadRequest(BaseModel):
    id_carrera: int
    titulo: str
    descripcion: str | None = None
    modalidad: str
    horario: str | None = None
    cupo_total: int


def _nombre_usuario(usuario) -> str:
    return " ".join(
        parte
        for parte in [usuario.nombre, usuario.apellido_paterno, usuario.apellido_materno]
        if parte
    )


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
        "alumno": _nombre_usuario(alumno.usuario),
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
    }


def _alumnos_unidad_items(id_empresa: int, db: Session) -> list[dict]:
    asignaciones = (
        db.query(AsignacionModel)
        .options(
            joinedload(AsignacionModel.alumno).joinedload(AlumnoModel.usuario),
            joinedload(AsignacionModel.alumno).joinedload(AlumnoModel.carrera),
            joinedload(AsignacionModel.vacante),
            joinedload(AsignacionModel.docente).joinedload(DocenteAsesorModel.usuario),
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
                "nombre": _nombre_usuario(alumno.usuario),
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
                    _nombre_usuario(asignacion.docente.usuario)
                    if asignacion.docente and asignacion.docente.usuario
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
        .options(joinedload(VacanteModel.carrera))
        .filter(VacanteModel.id_empresa == id_empresa)
        .order_by(VacanteModel.id_vacante.desc())
        .limit(5)
        .all()
    )
    convenios = (
        db.query(ConvenioModel)
        .filter(ConvenioModel.id_empresa == id_empresa)
        .order_by(ConvenioModel.fecha_fin.desc())
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
            "convenios_vigentes": sum(1 for convenio in convenios if convenio.estado_convenio == "Vigente"),
            "horas_registradas": _decimal_to_float(horas_aprobadas),
            "evaluaciones_pendientes": len(evaluaciones_pendientes),
        },
        "alumnos": alumnos[:6],
        "vacantes": [
            {
                "id_vacante": vacante.id_vacante,
                "titulo": vacante.titulo,
                "carrera": vacante.carrera.nombre if vacante.carrera else "Sin carrera",
                "estado_vacante": vacante.estado_vacante,
                "cupo_total": vacante.cupo_total,
                "cupo_disponible": vacante.cupo_disponible,
            }
            for vacante in vacantes
        ],
        "convenios": [
            {
                "id_convenio": convenio.id_convenio,
                "fecha_inicio": convenio.fecha_inicio.isoformat(),
                "fecha_fin": convenio.fecha_fin.isoformat(),
                "estado_convenio": convenio.estado_convenio,
                "documento_convenio": convenio.documento_convenio,
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
        .order_by(ConvenioModel.fecha_fin.desc())
        .all()
    )
    vacantes = db.query(VacanteModel).filter(VacanteModel.id_empresa == id_empresa).all()

    return {
        "empresa": _empresa_basica_response(empresa),
        "resumen": {
            "alumnos_asignados": len(alumnos),
            "convenios_vigentes": sum(1 for convenio in convenios if convenio.estado_convenio == "Vigente"),
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
                "modalidad": vacante.modalidad,
                "cupo_total": vacante.cupo_total,
                "cupo_disponible": vacante.cupo_disponible,
                "estado_vacante": vacante.estado_vacante,
            }
            for vacante in vacantes
        ],
        "convenios": [
            {
                "id_convenio": convenio.id_convenio,
                "fecha_inicio": convenio.fecha_inicio.isoformat(),
                "fecha_fin": convenio.fecha_fin.isoformat(),
                "estado_convenio": convenio.estado_convenio,
                "documento_convenio": convenio.documento_convenio,
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
            joinedload(AsignacionModel.docente).joinedload(DocenteAsesorModel.usuario),
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
                "nombre": _nombre_usuario(alumno.usuario),
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
                    _nombre_usuario(asignacion.docente.usuario)
                    if asignacion.docente and asignacion.docente.usuario
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

    vacantes = (
        db.query(VacanteModel)
        .options(joinedload(VacanteModel.carrera))
        .filter(VacanteModel.id_empresa == id_empresa)
        .order_by(VacanteModel.id_vacante.desc())
        .all()
    )

    return {
        "empresa": {
            "id_empresa": empresa.id_empresa,
            "nombre_empresa": empresa.nombre_empresa,
            "estado_empresa": empresa.estado_empresa,
            "puede_publicar": empresa.estado_empresa == "Activa",
            "motivo_bloqueo": (
                None
                if empresa.estado_empresa == "Activa"
                else "La documentacion de la empresa debe estar aprobada antes de publicar vacantes."
            ),
        },
        "vacantes": [
            {
                "id_vacante": vacante.id_vacante,
                "id_empresa": vacante.id_empresa,
                "id_carrera": vacante.id_carrera,
                "carrera": vacante.carrera.nombre if vacante.carrera else "Sin carrera",
                "titulo": vacante.titulo,
                "descripcion": vacante.descripcion,
                "modalidad": vacante.modalidad,
                "horario": vacante.horario,
                "cupo_total": vacante.cupo_total,
                "cupo_disponible": vacante.cupo_disponible,
                "estado_vacante": vacante.estado_vacante,
                "visible_padron": (
                    empresa.estado_empresa == "Activa"
                    and vacante.estado_vacante == "Activa"
                    and vacante.cupo_disponible > 0
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


@router.post("/{id_empresa:int}/vacantes")
def crear_vacante_unidad(
    id_empresa: int,
    datos: CrearVacanteUnidadRequest,
    db: Session = Depends(obtener_db),
):
    empresa = db.query(EmpresaModel).filter(EmpresaModel.id_empresa == id_empresa).first()
    if empresa is None:
        raise HTTPException(status_code=404, detail="Empresa no encontrada")
    if empresa.estado_empresa != "Activa":
        raise HTTPException(
            status_code=400,
            detail="La documentacion de la empresa debe estar aprobada antes de publicar vacantes",
        )
    if datos.cupo_total <= 0:
        raise HTTPException(status_code=400, detail="El cupo total debe ser mayor a cero")
    if datos.modalidad not in {"Presencial", "Virtual", "Hibrida"}:
        raise HTTPException(status_code=400, detail="Modalidad no valida")
    carrera = db.query(CarreraModel).filter(CarreraModel.id_carrera == datos.id_carrera).first()
    if carrera is None:
        raise HTTPException(status_code=404, detail="Carrera no encontrada")

    vacante = VacanteModel(
        id_empresa=id_empresa,
        id_carrera=datos.id_carrera,
        titulo=datos.titulo.strip(),
        descripcion=datos.descripcion,
        modalidad=datos.modalidad,
        horario=datos.horario,
        cupo_total=datos.cupo_total,
        cupo_disponible=datos.cupo_total,
        estado_vacante="Activa",
    )
    db.add(vacante)
    db.commit()
    db.refresh(vacante)
    return {
        "id_vacante": vacante.id_vacante,
        "id_empresa": vacante.id_empresa,
        "id_carrera": vacante.id_carrera,
        "titulo": vacante.titulo,
        "descripcion": vacante.descripcion,
        "modalidad": vacante.modalidad,
        "horario": vacante.horario,
        "cupo_total": vacante.cupo_total,
        "cupo_disponible": vacante.cupo_disponible,
        "estado_vacante": vacante.estado_vacante,
    }


@router.post("/me/vacantes")
def crear_mi_vacante_unidad(
    datos: CrearVacanteUnidadRequest,
    id_empresa: int = Depends(obtener_id_empresa_actual),
    db: Session = Depends(obtener_db),
):
    return crear_vacante_unidad(id_empresa, datos, db)
