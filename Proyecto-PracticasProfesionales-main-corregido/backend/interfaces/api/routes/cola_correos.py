from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.services.cola_correos_service import ESTADO_ERROR, ESTADO_PENDIENTE, procesar_cola_correos
from infrastructure.database.dependencies import obtener_db
from infrastructure.persistence.models.cola_correos import ColaCorreosModel
from infrastructure.security.auth_dependencies import requerir_roles


router = APIRouter(
    prefix="/admin/cola-correos",
    tags=["Admin Cola Correos"],
    dependencies=[Depends(requerir_roles(["Administrador"]))],
)


ESTADOS_VALIDOS = {"PENDIENTE", "ENVIADO", "ERROR"}


def _normalizar_estado(estado: str | None) -> str | None:
    if estado is None:
        return None
    estado_normalizado = estado.strip().upper()
    if estado_normalizado not in ESTADOS_VALIDOS:
        raise HTTPException(status_code=400, detail="Estado no valido. Usa PENDIENTE, ENVIADO o ERROR")
    return estado_normalizado


@router.get("/")
def listar_cola_correos(
    estado: str | None = Query(default=None, description="PENDIENTE|ENVIADO|ERROR"),
    limit: int = Query(default=100, ge=1, le=500),
    db: Session = Depends(obtener_db),
):
    estado_filtro = _normalizar_estado(estado)
    query = db.query(ColaCorreosModel)
    if estado_filtro:
        query = query.filter(ColaCorreosModel.estado == estado_filtro)

    items = (
        query.order_by(ColaCorreosModel.fecha_creacion.desc())
        .limit(limit)
        .all()
    )

    return {
        "total": len(items),
        "items": [
            {
                "id": item.id,
                "destinatario": item.destinatario,
                "asunto": item.asunto,
                "estado": item.estado,
                "intentos": item.intentos,
                "tiene_html": bool(item.contenido_html),
                "fecha_creacion": item.fecha_creacion.isoformat() if item.fecha_creacion else None,
                "fecha_envio": item.fecha_envio.isoformat() if item.fecha_envio else None,
                "error_ultimo": item.error_ultimo,
            }
            for item in items
        ],
    }


@router.get("/{id_cola:int}")
def detalle_cola_correo(id_cola: int, db: Session = Depends(obtener_db)):
    item = db.query(ColaCorreosModel).filter(ColaCorreosModel.id == id_cola).first()
    if item is None:
        raise HTTPException(status_code=404, detail="Registro de cola no encontrado")

    return {
        "id": item.id,
        "destinatario": item.destinatario,
        "asunto": item.asunto,
        "contenido": item.contenido,
        "contenido_html": item.contenido_html,
        "estado": item.estado,
        "intentos": item.intentos,
        "fecha_creacion": item.fecha_creacion.isoformat() if item.fecha_creacion else None,
        "fecha_envio": item.fecha_envio.isoformat() if item.fecha_envio else None,
        "error_ultimo": item.error_ultimo,
    }


@router.post("/procesar")
def procesar_cola(
    max_lote: int = Query(default=20, ge=1, le=200),
    max_intentos: int = Query(default=3, ge=1, le=10),
    db: Session = Depends(obtener_db),
):
    procesados = procesar_cola_correos(db, max_lote=max_lote, max_intentos=max_intentos)
    return {"mensaje": "Cola procesada", "procesados": procesados}


@router.post("/{id_cola:int}/reintentar")
def reintentar_correo(id_cola: int, db: Session = Depends(obtener_db)):
    item = db.query(ColaCorreosModel).filter(ColaCorreosModel.id == id_cola).first()
    if item is None:
        raise HTTPException(status_code=404, detail="Registro de cola no encontrado")

    estado_anterior = item.estado
    item.estado = ESTADO_PENDIENTE
    item.error_ultimo = None
    if estado_anterior == ESTADO_ERROR:
        item.intentos = 0
    db.commit()
    db.refresh(item)
    return {
        "mensaje": "Correo marcado para reintento",
        "id": item.id,
        "estado": item.estado,
        "intentos": item.intentos,
    }


@router.post("/reintentar/masivo")
def reintentar_correos_masivo(
    estado: str = Query(default=ESTADO_ERROR, description="PENDIENTE|ERROR"),
    limit: int = Query(default=200, ge=1, le=1000),
    db: Session = Depends(obtener_db),
):
    estado_filtro = _normalizar_estado(estado)
    if estado_filtro == "ENVIADO":
        raise HTTPException(status_code=400, detail="No se puede reintentar correos ya enviados")

    items = (
        db.query(ColaCorreosModel)
        .filter(ColaCorreosModel.estado == estado_filtro)
        .order_by(ColaCorreosModel.fecha_creacion.asc())
        .limit(limit)
        .all()
    )

    ids = []
    for item in items:
        item.estado = ESTADO_PENDIENTE
        item.error_ultimo = None
        item.intentos = 0
        ids.append(item.id)

    if ids:
        db.commit()

    return {
        "mensaje": "Correos marcados para reintento",
        "estado_origen": estado_filtro,
        "total": len(ids),
        "ids": ids,
    }
