from __future__ import annotations

from datetime import date, timedelta

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy import func
from sqlalchemy.orm import Session

from infrastructure.database.dependencies import obtener_db
from infrastructure.security.auth_dependencies import requerir_roles
from infrastructure.persistence.models.bitacora_auditoria import BitacoraAuditoriaModel
from infrastructure.persistence.models.carrera import CarreraModel
from infrastructure.persistence.models.convenio import ConvenioModel
from infrastructure.persistence.models.documento_empresa import DocumentoEmpresaModel
from infrastructure.persistence.models.empresa import EmpresaModel
from infrastructure.persistence.models.vacante import VacanteModel


router = APIRouter(
    prefix="/coord-unidades/empresas",
    tags=["Coordinador Unidades - Empresas"],
    dependencies=[Depends(requerir_roles(["Coordinador de Unidades Receptoras", "Administrador"]))],
)


class CambiarEstadoEmpresaRequest(BaseModel):
    estado_empresa: str


class CambiarEstadoVacanteRequest(BaseModel):
    estado_vacante: str


@router.get("/dashboard")
def obtener_dashboard_coord_unidades(db: Session = Depends(obtener_db)):
    hoy = date.today()
    limite_vencimiento = hoy + timedelta(days=30)

    empresas_total = db.query(EmpresaModel).count()
    empresas_pendientes = db.query(EmpresaModel).filter(EmpresaModel.estado_empresa == "Pendiente").count()
    empresas_activas = db.query(EmpresaModel).filter(EmpresaModel.estado_empresa == "Activa").count()
    documentos_pendientes = db.query(DocumentoEmpresaModel).filter(
        DocumentoEmpresaModel.estado_documento == "Pendiente"
    ).count()
    convenios_vigentes = db.query(ConvenioModel).filter(ConvenioModel.estado_convenio == "Vigente").count()
    convenios_por_vencer = db.query(ConvenioModel).filter(
        ConvenioModel.fecha_fin >= hoy,
        ConvenioModel.fecha_fin <= limite_vencimiento,
    ).count()
    vacantes_activas = db.query(VacanteModel).filter(VacanteModel.estado_vacante == "Activa").count()
    vacantes_publicables = (
        db.query(VacanteModel)
        .join(EmpresaModel, EmpresaModel.id_empresa == VacanteModel.id_empresa)
        .filter(
            EmpresaModel.estado_empresa == "Activa",
            VacanteModel.estado_vacante == "Activa",
            VacanteModel.cupo_disponible > 0,
        )
        .count()
    )

    actividad = (
        db.query(BitacoraAuditoriaModel)
        .filter(BitacoraAuditoriaModel.tabla_afectada.in_(["empresa", "documento_empresa", "vacante", "convenio"]))
        .order_by(BitacoraAuditoriaModel.fecha_accion.desc())
        .limit(6)
        .all()
    )

    alertas = []
    if documentos_pendientes:
        alertas.append(f"{documentos_pendientes} documento(s) de empresa esperan revision.")
    if convenios_por_vencer:
        alertas.append(f"{convenios_por_vencer} convenio(s) vencen en los proximos 30 dias.")
    if empresas_pendientes:
        alertas.append(f"{empresas_pendientes} empresa(s) esperan validacion para entrar al padron.")
    if vacantes_activas != vacantes_publicables:
        alertas.append("Hay vacantes activas que aun no son publicables por estado de empresa o cupo.")

    return {
        "resumen": {
            "empresas_pendientes": empresas_pendientes,
            "documentos_pendientes": documentos_pendientes,
            "vacantes_activas": vacantes_activas,
            "empresas_publicadas": empresas_activas,
            "convenios_por_vencer": convenios_por_vencer,
        },
        "pipeline": [
            {
                "etapa": "Empresas registradas",
                "cantidad": empresas_total,
                "detalle": "Solicitudes recibidas",
            },
            {
                "etapa": "Documentacion validada",
                "cantidad": db.query(func.count(func.distinct(DocumentoEmpresaModel.id_empresa))).filter(
                    DocumentoEmpresaModel.estado_documento == "Aprobado"
                ).scalar() or 0,
                "detalle": "Empresas con documentos aprobados",
            },
            {
                "etapa": "Convenios vigentes",
                "cantidad": convenios_vigentes,
                "detalle": "Empresas habilitadas por convenio",
            },
            {
                "etapa": "Vacantes activas",
                "cantidad": vacantes_activas,
                "detalle": "Planes de trabajo registrados",
            },
            {
                "etapa": "Publicadas en padron",
                "cantidad": vacantes_publicables,
                "detalle": "Vacantes visibles para alumnos",
            },
        ],
        "actividad": [
            {
                "id_bitacora": item.id_bitacora,
                "texto": f"{item.accion} en {item.tabla_afectada}",
                "detalle": item.detalles,
                "fecha": item.fecha_accion.isoformat() if item.fecha_accion else None,
            }
            for item in actividad
        ],
        "alertas": alertas,
    }


@router.get("/")
def listar_empresas_revision(db: Session = Depends(obtener_db)):
    empresas = db.query(EmpresaModel).order_by(EmpresaModel.id_empresa.desc()).all()

    return [
        {
            "id_empresa": empresa.id_empresa,
            "nombre_empresa": empresa.nombre_empresa,
            "rfc": empresa.rfc,
            "giro": empresa.giro,
            "domicilio": empresa.domicilio,
            "telefono": empresa.telefono,
            "correo_contacto": empresa.correo_contacto,
            "estado_empresa": empresa.estado_empresa,
            "vacantes": db.query(VacanteModel)
            .filter(VacanteModel.id_empresa == empresa.id_empresa)
            .count(),
            "vacantes_activas": db.query(VacanteModel)
            .filter(
                VacanteModel.id_empresa == empresa.id_empresa,
                VacanteModel.estado_vacante == "Activa",
                VacanteModel.cupo_disponible > 0,
            )
            .count(),
            "padron": "Publicado" if empresa.estado_empresa == "Activa" else "No publicado",
        }
        for empresa in empresas
    ]


@router.get("/vacantes/")
def listar_vacantes_revision(db: Session = Depends(obtener_db)):
    vacantes = (
        db.query(VacanteModel)
        .join(EmpresaModel, EmpresaModel.id_empresa == VacanteModel.id_empresa)
        .join(CarreraModel, CarreraModel.id_carrera == VacanteModel.id_carrera)
        .order_by(VacanteModel.id_vacante.desc())
        .all()
    )

    return [
        {
            "id_vacante": vacante.id_vacante,
            "id_empresa": vacante.id_empresa,
            "empresa": vacante.empresa.nombre_empresa,
            "estado_empresa": vacante.empresa.estado_empresa,
            "id_carrera": vacante.id_carrera,
            "carrera": vacante.carrera.nombre,
            "titulo": vacante.titulo,
            "descripcion": vacante.descripcion,
            "modalidad": vacante.modalidad,
            "horario": vacante.horario,
            "cupo_total": vacante.cupo_total,
            "cupo_disponible": vacante.cupo_disponible,
            "estado_vacante": vacante.estado_vacante,
            "publicable": (
                vacante.empresa.estado_empresa == "Activa"
                and vacante.estado_vacante == "Activa"
                and vacante.cupo_disponible > 0
            ),
        }
        for vacante in vacantes
    ]


@router.patch("/vacantes/{id_vacante}/estado")
def cambiar_estado_vacante(
    id_vacante: int,
    datos: CambiarEstadoVacanteRequest,
    db: Session = Depends(obtener_db),
):
    estados_validos = {"Activa", "Cerrada"}
    if datos.estado_vacante not in estados_validos:
        raise HTTPException(status_code=400, detail="Estado de vacante no valido")

    vacante = db.query(VacanteModel).filter(VacanteModel.id_vacante == id_vacante).first()
    if vacante is None:
        raise HTTPException(status_code=404, detail="Vacante no encontrada")

    if datos.estado_vacante == "Activa" and vacante.cupo_disponible <= 0:
        raise HTTPException(status_code=400, detail="No se puede activar una vacante sin cupo")

    vacante.estado_vacante = datos.estado_vacante
    db.commit()
    db.refresh(vacante)
    return {"mensaje": "Estado de vacante actualizado", "estado_vacante": vacante.estado_vacante}


@router.patch("/{id_empresa}/estado")
def cambiar_estado_empresa(
    id_empresa: int,
    datos: CambiarEstadoEmpresaRequest,
    db: Session = Depends(obtener_db),
):
    estados_validos = {"Pendiente", "Activa", "Suspendida", "Inactiva"}
    if datos.estado_empresa not in estados_validos:
        raise HTTPException(status_code=400, detail="Estado de empresa no válido")

    empresa = db.query(EmpresaModel).filter(EmpresaModel.id_empresa == id_empresa).first()
    if empresa is None:
        raise HTTPException(status_code=404, detail="Empresa no encontrada")

    empresa.estado_empresa = datos.estado_empresa
    db.commit()
    db.refresh(empresa)

    return {"mensaje": "Estado de empresa actualizado", "estado_empresa": empresa.estado_empresa}
