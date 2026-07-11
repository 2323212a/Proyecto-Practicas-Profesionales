from __future__ import annotations

import csv
from datetime import date, timedelta
from io import StringIO

from fastapi import APIRouter, Depends, Query
from fastapi.responses import StreamingResponse
from sqlalchemy import func
from sqlalchemy.orm import Session

from infrastructure.database.dependencies import obtener_db
from infrastructure.persistence.models.alumno import AlumnoModel
from infrastructure.persistence.models.asignacion import AsignacionModel
from infrastructure.persistence.models.carrera import CarreraModel
from infrastructure.persistence.models.convenio import ConvenioModel
from infrastructure.persistence.models.convocatoria import ConvocatoriaModel
from infrastructure.persistence.models.documento import DocumentoModel
from infrastructure.persistence.models.documento_empresa import DocumentoEmpresaModel
from infrastructure.persistence.models.empresa import EmpresaModel
from infrastructure.persistence.models.expediente import ExpedienteModel
from infrastructure.persistence.models.horas import HorasModel
from infrastructure.persistence.models.incidencia_practica import IncidenciaPracticaModel
from infrastructure.persistence.models.liberacion import LiberacionModel
from infrastructure.persistence.models.reporte import ReporteModel
from infrastructure.security.auth_dependencies import requerir_roles


router = APIRouter(
    prefix="/direccion",
    tags=["Direccion"],
    dependencies=[Depends(requerir_roles(["Direccion", "Administrador"]))],
)


def _conteo_por_campo(db: Session, campo):
    rows = db.query(campo, func.count()).group_by(campo).all()
    return [{"nombre": str(nombre or "Sin dato"), "total": total} for nombre, total in rows]


def _alumnos_por_carrera(db: Session):
    rows = (
        db.query(CarreraModel.nombre, func.count(AlumnoModel.id_alumno))
        .outerjoin(AlumnoModel, AlumnoModel.id_carrera == CarreraModel.id_carrera)
        .group_by(CarreraModel.nombre)
        .order_by(CarreraModel.nombre.asc())
        .all()
    )
    return [{"carrera": nombre or "Sin carrera", "alumnos": total} for nombre, total in rows]


def _horas_por_mes(db: Session):
    rows = (
        db.query(func.date_format(HorasModel.fecha, "%Y-%m"), func.coalesce(func.sum(HorasModel.horas_realizadas), 0))
        .group_by(func.date_format(HorasModel.fecha, "%Y-%m"))
        .order_by(func.date_format(HorasModel.fecha, "%Y-%m"))
        .all()
    )
    return [{"mes": mes or "Sin fecha", "horas": float(horas or 0)} for mes, horas in rows]


def _convocatoria_activa(db: Session):
    return (
        db.query(ConvocatoriaModel)
        .filter(ConvocatoriaModel.estado == "Activa")
        .order_by(ConvocatoriaModel.fecha_inicio.desc())
        .first()
    )


def _historico_convocatorias(db: Session):
    convocatorias = db.query(ConvocatoriaModel).order_by(ConvocatoriaModel.fecha_inicio.desc()).all()
    items = []
    for convocatoria in convocatorias:
        asignaciones = db.query(AsignacionModel).filter(AsignacionModel.id_convocatoria == convocatoria.id_convocatoria)
        asignacion_ids = [row[0] for row in asignaciones.with_entities(AsignacionModel.id_asignacion).all()]
        empresa_ids = {row[0] for row in asignaciones.with_entities(AsignacionModel.id_empresa).all()}
        items.append(
            {
                "convocatoria": convocatoria.nombre,
                "periodo": convocatoria.periodo,
                "alumnos": asignaciones.count(),
                "empresas": len(empresa_ids),
                "convenios": db.query(ConvenioModel).filter(ConvenioModel.id_empresa.in_(empresa_ids)).count() if empresa_ids else 0,
                "incidencias": (
                    db.query(IncidenciaPracticaModel)
                    .filter(IncidenciaPracticaModel.id_asignacion.in_(asignacion_ids))
                    .count()
                    if asignacion_ids
                    else 0
                ),
                "concluidas": (
                    db.query(LiberacionModel)
                    .filter(LiberacionModel.id_asignacion.in_(asignacion_ids))
                    .count()
                    if asignacion_ids
                    else 0
                ),
                "estado": convocatoria.estado,
            }
        )
    return items


@router.get("/indicadores")
def obtener_indicadores_direccion(db: Session = Depends(obtener_db)):
    hoy = date.today()
    limite_vencimiento = hoy + timedelta(days=30)

    total_alumnos = db.query(AlumnoModel).count()
    liberaciones = db.query(LiberacionModel).count()
    asignaciones_activas = db.query(AsignacionModel).filter(AsignacionModel.estado_asignacion == "Activa").count()
    rezagados = db.query(AsignacionModel).filter(AsignacionModel.tipo_asignacion == "Rezagado").count()
    empresas_activas = db.query(EmpresaModel).filter(EmpresaModel.estado_empresa == "Activa").count()
    convenios_vigentes = db.query(ConvenioModel).filter(ConvenioModel.estado_convenio == "Vigente").count()
    convenios_por_vencer = db.query(ConvenioModel).filter(
        ConvenioModel.fecha_fin >= hoy,
        ConvenioModel.fecha_fin <= limite_vencimiento,
    ).count()
    horas = db.query(func.coalesce(func.sum(HorasModel.horas_realizadas), 0)).scalar() or 0
    documentos_total = db.query(DocumentoModel).count() + db.query(DocumentoEmpresaModel).count()
    incidencias_total = db.query(IncidenciaPracticaModel).count()
    convocatoria = _convocatoria_activa(db)

    reportes = [
        {
            "tipo": "alumnos",
            "titulo": "Reporte de Alumnos",
            "descripcion": "Alumnos registrados, estado documental, asignacion, carrera y avance.",
            "registros": total_alumnos,
        },
        {
            "tipo": "empresas",
            "titulo": "Reporte de Empresas",
            "descripcion": "Unidades receptoras activas, pendientes, suspendidas y publicables.",
            "registros": db.query(EmpresaModel).count(),
        },
        {
            "tipo": "convenios",
            "titulo": "Reporte de Convenios",
            "descripcion": "Convenios vigentes, proximos a vencer, vencidos y renovaciones.",
            "registros": db.query(ConvenioModel).count(),
        },
        {
            "tipo": "practicas",
            "titulo": "Reporte de Practicas",
            "descripcion": "Practicas en proceso, concluidas, rezagadas y liberadas.",
            "registros": db.query(AsignacionModel).count(),
        },
        {
            "tipo": "incidencias",
            "titulo": "Reporte de Incidencias",
            "descripcion": "Quejas y observaciones registradas durante las practicas.",
            "registros": incidencias_total,
        },
        {
            "tipo": "brutos",
            "titulo": "Datos Brutos para Auditoria",
            "descripcion": "Exportacion completa de registros para revision institucional.",
            "registros": total_alumnos + db.query(EmpresaModel).count() + documentos_total + db.query(ReporteModel).count(),
        },
    ]

    return {
        "contexto": {
            "convocatoria_activa": convocatoria.nombre if convocatoria else None,
            "fecha_actualizacion": hoy.isoformat(),
        },
        "resumen": {
            "alumnos": total_alumnos,
            "en_practicas": asignaciones_activas,
            "concluidos": liberaciones,
            "rezagados": rezagados,
            "empresas_activas": empresas_activas,
            "convenios_vigentes": convenios_vigentes,
            "convenios_por_vencer": convenios_por_vencer,
            "horas_registradas": float(horas),
            "documentos": documentos_total,
            "incidencias": incidencias_total,
            "expedientes": db.query(ExpedienteModel).count(),
        },
        "alumnos_por_carrera": _alumnos_por_carrera(db),
        "alumnos_por_estado": _conteo_por_campo(db, AlumnoModel.estado_alumno),
        "empresas_por_estado": _conteo_por_campo(db, EmpresaModel.estado_empresa),
        "convenios_por_estado": _conteo_por_campo(db, ConvenioModel.estado_convenio),
        "documentos_por_estado": _conteo_por_campo(db, DocumentoModel.estado_documento),
        "incidencias_por_tipo": _conteo_por_campo(db, IncidenciaPracticaModel.reportante),
        "horas_por_mes": _horas_por_mes(db),
        "convocatorias": _historico_convocatorias(db),
        "reportes": reportes,
    }


@router.get("/exportar")
def exportar_datos_direccion(
    tipo: str = Query("brutos"),
    db: Session = Depends(obtener_db),
):
    datos = obtener_indicadores_direccion(db)
    salida = StringIO()
    writer = csv.writer(salida)
    writer.writerow(["Seccion", "Nombre", "Valor"])

    for clave, valor in datos["resumen"].items():
        writer.writerow(["Resumen", clave, valor])
    for item in datos["alumnos_por_carrera"]:
        writer.writerow(["Alumnos por carrera", item["carrera"], item["alumnos"]])
    for item in datos["convocatorias"]:
        writer.writerow(["Convocatoria", item["convocatoria"], item["alumnos"]])

    salida.seek(0)
    filename = f"direccion_{tipo}.csv"
    return StreamingResponse(
        iter([salida.getvalue()]),
        media_type="text/csv",
        headers={"Content-Disposition": f"attachment; filename={filename}"},
    )
