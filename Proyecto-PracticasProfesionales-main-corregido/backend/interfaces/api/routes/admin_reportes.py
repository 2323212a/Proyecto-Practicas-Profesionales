from __future__ import annotations

import csv
from datetime import datetime, timedelta
from io import StringIO
from typing import Optional

from fastapi import APIRouter, Depends, Query
from fastapi.responses import StreamingResponse
from sqlalchemy import func
from sqlalchemy.orm import Session

from infrastructure.database.dependencies import obtener_db
from infrastructure.persistence.models.alumno import AlumnoModel
from infrastructure.persistence.models.asignacion import AsignacionModel
from infrastructure.persistence.models.bitacora_auditoria import BitacoraAuditoriaModel
from infrastructure.persistence.models.convocatoria import ConvocatoriaModel
from infrastructure.persistence.models.documento import DocumentoModel
from infrastructure.persistence.models.documento_empresa import DocumentoEmpresaModel
from infrastructure.persistence.models.empresa import EmpresaModel
from infrastructure.persistence.models.evaluacion import EvaluacionModel
from infrastructure.persistence.models.evaluacion_empresa_alumno import EvaluacionEmpresaAlumnoModel
from infrastructure.persistence.models.expediente import ExpedienteModel
from infrastructure.persistence.models.horas import HorasModel
from infrastructure.persistence.models.incidencia_practica import IncidenciaPracticaModel
from infrastructure.persistence.models.liberacion import LiberacionModel
from infrastructure.persistence.models.notificacion import NotificacionModel
from infrastructure.persistence.models.reporte import ReporteModel
from infrastructure.persistence.models.rol import RolModel
from infrastructure.persistence.models.usuario import UsuarioModel
from infrastructure.security.auth_dependencies import requerir_roles


router = APIRouter(
    prefix="/admin/reportes",
    tags=["Admin Reportes"],
    dependencies=[Depends(requerir_roles(["Administrador", "Direccion"]))],
)


def _fecha_inicio(periodo: Optional[str]):
    ahora = datetime.now()
    if periodo == "30d":
        return ahora - timedelta(days=30)
    if periodo == "6m":
        return ahora - timedelta(days=180)
    return None


def _query_bitacora(db: Session, periodo: Optional[str], modulo: Optional[str]):
    query = db.query(BitacoraAuditoriaModel)
    desde = _fecha_inicio(periodo)
    if desde is not None:
        query = query.filter(BitacoraAuditoriaModel.fecha_accion >= desde)
    if modulo and modulo != "todos":
        query = query.filter(BitacoraAuditoriaModel.tabla_afectada == modulo)
    return query


def _conteo_por_campo(db: Session, modelo, campo):
    rows = db.query(campo, func.count()).group_by(campo).all()
    return [{"nombre": str(nombre or "Sin dato"), "total": total} for nombre, total in rows]


def _actividad_response(item: BitacoraAuditoriaModel):
    usuario = item.usuario
    nombre_usuario = (
        " ".join(
            parte
            for parte in [
                usuario.nombre if usuario else None,
                usuario.apellido_paterno if usuario else None,
                usuario.apellido_materno if usuario else None,
            ]
            if parte
        )
        if usuario
        else "Sistema"
    )
    return {
        "id_bitacora": item.id_bitacora,
        "fecha": item.fecha_accion.isoformat() if item.fecha_accion else None,
        "usuario": nombre_usuario or (usuario.correo if usuario else "Sistema"),
        "accion": item.accion,
        "modulo": item.tabla_afectada,
        "detalle": item.detalles,
        "estado": "Completado",
    }


def _reportes_catalogo(db: Session):
    usuarios = db.query(UsuarioModel).count()
    roles = db.query(RolModel).count()
    alumnos = db.query(AlumnoModel).count()
    empresas = db.query(EmpresaModel).count()
    horas = db.query(HorasModel).count()
    documentos = db.query(DocumentoModel).count() + db.query(DocumentoEmpresaModel).count()
    incidencias = db.query(IncidenciaPracticaModel).count()
    liberaciones = db.query(LiberacionModel).filter(LiberacionModel.estado_liberacion == "Emitida").count()

    return [
        {
            "clave": "usuarios",
            "titulo": "Reporte de Usuarios",
            "descripcion": "Usuarios registrados, activos e inactivos dentro del sistema.",
            "total": usuarios,
        },
        {
            "clave": "roles",
            "titulo": "Reporte de Roles",
            "descripcion": "Distribucion de usuarios por rol institucional.",
            "total": roles,
        },
        {
            "clave": "alumnos",
            "titulo": "Reporte de Alumnos",
            "descripcion": "Alumnos registrados, expedientes y asignaciones.",
            "total": alumnos,
        },
        {
            "clave": "empresas",
            "titulo": "Reporte de Empresas",
            "descripcion": "Unidades receptoras registradas y estado documental.",
            "total": empresas,
        },
        {
            "clave": "horas",
            "titulo": "Reporte de Horas",
            "descripcion": "Horas registradas por alumnos y estado de revision.",
            "total": horas,
        },
        {
            "clave": "documentos",
            "titulo": "Reporte de Documentos",
            "descripcion": "Documentos de alumnos y empresas por estado.",
            "total": documentos,
        },
        {
            "clave": "incidencias",
            "titulo": "Reporte de Incidencias",
            "descripcion": "Quejas e incidencias durante las practicas.",
            "total": incidencias,
        },
        {
            "clave": "liberaciones",
            "titulo": "Reporte de Liberaciones",
            "descripcion": "Alumnos liberados y constancias emitidas.",
            "total": liberaciones,
        },
    ]


@router.get("/")
def obtener_reportes_admin(
    periodo: str = Query("todos"),
    modulo: str = Query("todos"),
    db: Session = Depends(obtener_db),
):
    bitacora_query = _query_bitacora(db, periodo, modulo)
    actividad = (
        bitacora_query.order_by(BitacoraAuditoriaModel.fecha_accion.desc())
        .limit(25)
        .all()
    )

    usuarios_activos = db.query(UsuarioModel).filter(UsuarioModel.estado == "Activo").count()
    usuarios_inactivos = db.query(UsuarioModel).filter(UsuarioModel.estado == "Inactivo").count()
    documentos_pendientes = db.query(DocumentoModel).filter(DocumentoModel.estado_documento == "Pendiente").count()
    documentos_empresa_pendientes = db.query(DocumentoEmpresaModel).filter(DocumentoEmpresaModel.estado_documento == "Pendiente").count()
    incidencias_abiertas = db.query(IncidenciaPracticaModel).filter(
        IncidenciaPracticaModel.estado.in_(["Abierta", "En seguimiento"])
    ).count()

    return {
        "resumen": {
            "usuarios": db.query(UsuarioModel).count(),
            "usuarios_activos": usuarios_activos,
            "usuarios_inactivos": usuarios_inactivos,
            "roles": db.query(RolModel).count(),
            "alumnos": db.query(AlumnoModel).count(),
            "empresas": db.query(EmpresaModel).count(),
            "documentos": db.query(DocumentoModel).count() + db.query(DocumentoEmpresaModel).count(),
            "documentos_pendientes": documentos_pendientes + documentos_empresa_pendientes,
            "reportes": db.query(ReporteModel).count(),
            "horas": db.query(HorasModel).count(),
            "incidencias_abiertas": incidencias_abiertas,
            "liberaciones_emitidas": db.query(LiberacionModel).filter(LiberacionModel.estado_liberacion == "Emitida").count(),
            "acciones_auditoria": bitacora_query.count(),
        },
        "reportes": _reportes_catalogo(db),
        "distribuciones": {
            "usuarios_por_rol": [
                {"nombre": nombre or "Sin rol", "total": total}
                for nombre, total in (
                    db.query(RolModel.nombre, func.count(UsuarioModel.id_usuario))
                    .join(UsuarioModel, UsuarioModel.id_rol == RolModel.id_rol)
                    .group_by(RolModel.nombre)
                    .all()
                )
            ],
            "alumnos_por_estado": _conteo_por_campo(db, AlumnoModel, AlumnoModel.estado_alumno),
            "empresas_por_estado": _conteo_por_campo(db, EmpresaModel, EmpresaModel.estado_empresa),
            "documentos_por_estado": _conteo_por_campo(db, DocumentoModel, DocumentoModel.estado_documento),
            "horas_por_estado": _conteo_por_campo(db, HorasModel, HorasModel.estado_horas),
            "reportes_por_estado": _conteo_por_campo(db, ReporteModel, ReporteModel.estado_reporte),
            "incidencias_por_estado": _conteo_por_campo(db, IncidenciaPracticaModel, IncidenciaPracticaModel.estado),
        },
        "modulos": [
            "usuario",
            "rol",
            "alumno",
            "empresa",
            "documento",
            "documento_empresa",
            "horas",
            "reporte",
            "incidencia_practica",
            "liberacion",
        ],
        "actividad": [_actividad_response(item) for item in actividad],
        "contexto": {
            "convocatorias": db.query(ConvocatoriaModel).count(),
            "convocatoria_activa": (
                db.query(ConvocatoriaModel.nombre)
                .filter(ConvocatoriaModel.estado == "Activa")
                .order_by(ConvocatoriaModel.fecha_inicio.desc())
                .scalar()
            ),
            "expedientes": db.query(ExpedienteModel).count(),
            "asignaciones": db.query(AsignacionModel).count(),
            "evaluaciones": db.query(EvaluacionModel).count() + db.query(EvaluacionEmpresaAlumnoModel).count(),
            "notificaciones": db.query(NotificacionModel).count(),
        },
    }


@router.get("/exportar")
def exportar_reportes_admin(
    periodo: str = Query("todos"),
    modulo: str = Query("todos"),
    db: Session = Depends(obtener_db),
):
    datos = obtener_reportes_admin(periodo, modulo, db)
    salida = StringIO()
    writer = csv.writer(salida)
    writer.writerow(["Seccion", "Nombre", "Valor"])
    for clave, valor in datos["resumen"].items():
        writer.writerow(["Resumen", clave, valor])
    for reporte in datos["reportes"]:
        writer.writerow(["Reporte", reporte["titulo"], reporte["total"]])
    for item in datos["actividad"]:
        writer.writerow(["Actividad", item["accion"], item["detalle"] or ""])

    salida.seek(0)
    filename = f"reportes_admin_{periodo}_{modulo}.csv"
    return StreamingResponse(
        iter([salida.getvalue()]),
        media_type="text/csv",
        headers={"Content-Disposition": f"attachment; filename={filename}"},
    )
