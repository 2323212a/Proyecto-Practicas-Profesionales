from __future__ import annotations

from datetime import date

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.services.convenio_empresa_service import activar_convenio_actual
from app.services.notificacion_service import crear_notificacion
from infrastructure.database.dependencies import obtener_db
from infrastructure.security.auth_dependencies import requerir_roles
from infrastructure.persistence.models.empresa import EmpresaModel
from infrastructure.persistence.models.convenio import ConvenioModel
from infrastructure.persistence.models.responsable_empresa import ResponsableEmpresaModel
from interfaces.api.schemas.convenio import (
    ConvenioCreate,
    ConvenioResponse,
    ConvenioUpdate,
    SolicitarRenovacionRequest,
)


router = APIRouter(
    prefix="/convenios", tags=["Convenios"],
    dependencies=[Depends(requerir_roles(['Administrador', 'Coordinador de Unidades Receptoras']))],
)


@router.get("/", response_model=list[ConvenioResponse])
def listar_convenios(db: Session = Depends(obtener_db)):
    _actualizar_convenios_vencidos(db)
    convenios = (
        db.query(ConvenioModel)
        .order_by(
            ConvenioModel.id_empresa.asc(),
            ConvenioModel.es_actual.desc(),
            ConvenioModel.estado_convenio.asc(),
            ConvenioModel.fecha_fin.desc(),
            ConvenioModel.id_convenio.desc(),
        )
        .all()
    )
    por_empresa: dict[int, ConvenioModel] = {}
    for convenio in convenios:
        actual = por_empresa.get(convenio.id_empresa)
        if actual is None or _prioridad_convenio(convenio) < _prioridad_convenio(actual):
            por_empresa[convenio.id_empresa] = convenio
    return sorted(
        por_empresa.values(),
        key=lambda item: (item.fecha_fin, item.id_convenio),
    )


@router.get("/{id_convenio}", response_model=ConvenioResponse)
def obtener_convenio(id_convenio: int, db: Session = Depends(obtener_db)):
    convenio = db.query(ConvenioModel).filter(ConvenioModel.id_convenio == id_convenio).first()
    if convenio is None:
        raise HTTPException(status_code=404, detail="Convenio no encontrado")
    return convenio


@router.post("/", response_model=ConvenioResponse)
def crear_convenio(convenio: ConvenioCreate, db: Session = Depends(obtener_db)):
    nuevo_convenio = ConvenioModel(**convenio.model_dump())
    db.add(nuevo_convenio)
    db.flush()
    if nuevo_convenio.es_actual:
        empresa = db.query(EmpresaModel).filter(
            EmpresaModel.id_empresa == nuevo_convenio.id_empresa
        ).first()
        if empresa is None:
            raise HTTPException(status_code=404, detail="Empresa no encontrada")
        if nuevo_convenio.estado_convenio == "Vigente":
            if nuevo_convenio.fecha_inicio is None or nuevo_convenio.fecha_fin is None:
                raise HTTPException(status_code=400, detail="Un convenio vigente requiere fecha de inicio y fin")
            activar_convenio_actual(
                db,
                empresa,
                nuevo_convenio,
                fecha_inicio=nuevo_convenio.fecha_inicio,
                fecha_fin=nuevo_convenio.fecha_fin,
            )
        else:
            _marcar_otros_como_historicos(
                db, nuevo_convenio.id_empresa, nuevo_convenio.id_convenio
            )
    db.commit()
    db.refresh(nuevo_convenio)
    return nuevo_convenio


@router.put("/{id_convenio}", response_model=ConvenioResponse)
def actualizar_convenio(
    id_convenio: int,
    datos: ConvenioUpdate,
    db: Session = Depends(obtener_db)
):
    convenio = db.query(ConvenioModel).filter(ConvenioModel.id_convenio == id_convenio).first()
    if convenio is None:
        raise HTTPException(status_code=404, detail="Convenio no encontrado")

    for campo, valor in datos.model_dump(exclude_unset=True).items():
        setattr(convenio, campo, valor)

    if convenio.es_actual:
        empresa = db.query(EmpresaModel).filter(
            EmpresaModel.id_empresa == convenio.id_empresa
        ).first()
        if empresa is None:
            raise HTTPException(status_code=404, detail="Empresa no encontrada")
        if convenio.estado_convenio == "Vigente":
            if convenio.fecha_inicio is None or convenio.fecha_fin is None:
                raise HTTPException(status_code=400, detail="Un convenio vigente requiere fecha de inicio y fin")
            activar_convenio_actual(
                db,
                empresa,
                convenio,
                fecha_inicio=convenio.fecha_inicio,
                fecha_fin=convenio.fecha_fin,
            )
        else:
            _marcar_otros_como_historicos(db, convenio.id_empresa, convenio.id_convenio)

    db.commit()
    db.refresh(convenio)
    return convenio


@router.patch("/{id_convenio}/solicitar-renovacion", response_model=ConvenioResponse)
def solicitar_renovacion_convenio(
    id_convenio: int,
    datos: SolicitarRenovacionRequest,
    db: Session = Depends(obtener_db),
):
    convenio = db.query(ConvenioModel).filter(ConvenioModel.id_convenio == id_convenio).first()
    if convenio is None:
        raise HTTPException(status_code=404, detail="Convenio no encontrado")

    convenio.observaciones = datos.observaciones
    if convenio.fecha_fin and convenio.fecha_fin < date.today():
        convenio.estado_convenio = "Vencido"

    empresa = db.query(EmpresaModel).filter(EmpresaModel.id_empresa == convenio.id_empresa).first()
    responsables = (
        db.query(ResponsableEmpresaModel)
        .filter(ResponsableEmpresaModel.id_empresa == convenio.id_empresa)
        .all()
    )
    for responsable in responsables:
        crear_notificacion(
            db,
            responsable.id_usuario,
            "Revision de convenio registrada",
            f"Coordinacion registro una observacion sobre el convenio de {empresa.nombre_empresa if empresa else 'la empresa'}."
            + (f" Observaciones: {datos.observaciones}" if datos.observaciones else ""),
        )

    db.commit()
    db.refresh(convenio)
    return convenio


@router.delete("/{id_convenio}")
def eliminar_convenio(id_convenio: int, db: Session = Depends(obtener_db)):
    convenio = db.query(ConvenioModel).filter(ConvenioModel.id_convenio == id_convenio).first()
    if convenio is None:
        raise HTTPException(status_code=404, detail="Convenio no encontrado")

    id_empresa = convenio.id_empresa
    era_actual = bool(convenio.es_actual)
    db.delete(convenio)
    db.flush()

    if era_actual:
        reemplazo = (
            db.query(ConvenioModel)
            .filter(ConvenioModel.id_empresa == id_empresa)
            .order_by(
                ConvenioModel.estado_convenio.asc(),
                ConvenioModel.fecha_fin.desc(),
                ConvenioModel.id_convenio.desc(),
            )
            .first()
        )
        if reemplazo is not None:
            reemplazo.es_actual = True

    db.commit()
    return {"mensaje": "Convenio eliminado correctamente"}


def _actualizar_convenios_vencidos(db: Session) -> None:
    db.query(ConvenioModel).filter(
        ConvenioModel.es_actual.is_(True),
        ConvenioModel.estado_convenio == "Vigente",
        ConvenioModel.fecha_fin < date.today(),
    ).update({"estado_convenio": "Vencido"}, synchronize_session=False)
    db.commit()


def _marcar_otros_como_historicos(db: Session, id_empresa: int, excepto_id: int | None = None) -> None:
    query = db.query(ConvenioModel).filter(ConvenioModel.id_empresa == id_empresa)
    if excepto_id is not None:
        query = query.filter(ConvenioModel.id_convenio != excepto_id)
    convenios = query.all()
    for convenio in convenios:
        convenio.es_actual = False
        if convenio.estado_convenio == "Vigente":
            convenio.estado_convenio = "Vencido"


def _prioridad_convenio(convenio: ConvenioModel) -> tuple[int, int, date]:
    if convenio.es_actual and convenio.estado_convenio == "Vigente":
        estado = 0
    elif convenio.estado_convenio == "Vigente":
        estado = 1
    elif convenio.es_actual:
        estado = 2
    elif convenio.estado_convenio == "Pendiente":
        estado = 3
    else:
        estado = 4
    return (estado, -convenio.id_convenio, convenio.fecha_fin)
