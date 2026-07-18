from __future__ import annotations

from datetime import date

from fastapi import HTTPException
from sqlalchemy.orm import Session

from infrastructure.persistence.models.convenio import ConvenioModel
from infrastructure.persistence.models.convocatoria import ConvocatoriaModel
from infrastructure.persistence.models.empresa import EmpresaModel
from infrastructure.persistence.models.participacion_empresa_convocatoria import ParticipacionEmpresaConvocatoriaModel
from infrastructure.persistence.models.vinculacion_empresa import VinculacionEmpresaModel


def obtener_convenio_vigente_actual(db: Session, id_empresa: int) -> ConvenioModel | None:
    hoy = date.today()
    return (
        db.query(ConvenioModel)
        .filter(
            ConvenioModel.id_empresa == id_empresa,
            ConvenioModel.es_actual.is_(True),
            ConvenioModel.estado_convenio == "Vigente",
            ConvenioModel.fecha_inicio <= hoy,
            ConvenioModel.fecha_fin >= hoy,
        )
        .first()
    )


def obtener_vinculacion_aprobada_actual(db: Session, id_empresa: int) -> VinculacionEmpresaModel | None:
    hoy = date.today()
    return (
        db.query(VinculacionEmpresaModel)
        .filter(
            VinculacionEmpresaModel.id_empresa == id_empresa,
            VinculacionEmpresaModel.es_actual.is_(True),
            VinculacionEmpresaModel.estado_vinculacion == "Aprobada",
            VinculacionEmpresaModel.fecha_inicio <= hoy,
            VinculacionEmpresaModel.fecha_fin >= hoy,
        )
        .first()
    )


def validar_habilitacion_empresa_para_vacantes(db: Session, empresa: EmpresaModel) -> None:
    if empresa.tipo_tramite == "Convenio":
        if obtener_convenio_vigente_actual(db, empresa.id_empresa) is None:
            raise HTTPException(status_code=400, detail="La empresa requiere convenio vigente actual para crear o aprobar vacantes.")
        return
    if empresa.tipo_tramite == "Vinculacion":
        if obtener_vinculacion_aprobada_actual(db, empresa.id_empresa) is None:
            raise HTTPException(status_code=400, detail="La empresa requiere vinculacion aprobada actual para crear o aprobar vacantes.")
        return
    raise HTTPException(status_code=400, detail="La empresa no tiene tipo de tramite valido.")


def obtener_participacion_aceptada(
    db: Session,
    id_empresa: int,
    id_convocatoria: int,
) -> ParticipacionEmpresaConvocatoriaModel | None:
    return (
        db.query(ParticipacionEmpresaConvocatoriaModel)
        .filter(
            ParticipacionEmpresaConvocatoriaModel.id_empresa == id_empresa,
            ParticipacionEmpresaConvocatoriaModel.id_convocatoria == id_convocatoria,
            ParticipacionEmpresaConvocatoriaModel.estado == "Aceptada",
        )
        .first()
    )


def validar_participacion_aceptada(db: Session, id_empresa: int, id_convocatoria: int) -> None:
    if obtener_participacion_aceptada(db, id_empresa, id_convocatoria) is None:
        raise HTTPException(status_code=400, detail="La empresa no tiene participacion aceptada en esta convocatoria.")


def convocatoria_activa_para_empresas(db: Session, id_convocatoria: int) -> ConvocatoriaModel:
    convocatoria = (
        db.query(ConvocatoriaModel)
        .filter(
            ConvocatoriaModel.id_convocatoria == id_convocatoria,
            ConvocatoriaModel.estado == "Activa",
        )
        .first()
    )
    if convocatoria is None:
        raise HTTPException(status_code=404, detail="Convocatoria activa no encontrada")

    hoy = date.today()
    if convocatoria.fecha_inicio_empresas and hoy < convocatoria.fecha_inicio_empresas:
        raise HTTPException(status_code=400, detail="La etapa de registro de empresas aun no inicia.")
    if convocatoria.fecha_cierre_empresas and hoy > convocatoria.fecha_cierre_empresas:
        raise HTTPException(status_code=400, detail="La etapa de registro de empresas ya cerro.")
    return convocatoria
