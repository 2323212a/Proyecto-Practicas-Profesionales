from __future__ import annotations

from datetime import date, datetime, time

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import or_
from sqlalchemy.orm import Session, joinedload

from infrastructure.database.dependencies import obtener_db
from infrastructure.persistence.models.bitacora_auditoria import BitacoraAuditoriaModel
from infrastructure.persistence.models.usuario import UsuarioModel
from infrastructure.security.auth_dependencies import requerir_roles
from interfaces.api.schemas.bitacora_auditoria import BitacoraAuditoriaCreate, BitacoraAuditoriaResponse


router = APIRouter(
    prefix="/bitacora-auditoria",
    tags=["Bitacora Auditoria"],
    dependencies=[Depends(requerir_roles(["Administrador"]))],
)

CLAVES_SENSIBLES = {
    "password",
    "password_hash",
    "contrasena",
    "contraseña",
    "token",
    "refresh_token",
    "smtp_password",
    "password_temporal",
    "secret",
}


def _validar_sin_datos_sensibles(*valores: object):
    texto = " ".join(str(valor or "") for valor in valores).lower()
    if any(clave in texto for clave in CLAVES_SENSIBLES):
        raise HTTPException(
            status_code=400,
            detail="La bitacora no permite guardar contrasenas, hashes, tokens ni secretos.",
        )


def _serializar_bitacora(item: BitacoraAuditoriaModel):
    return {
        "id_bitacora": item.id_bitacora,
        "id_usuario": item.id_usuario,
        "usuario_correo": item.usuario.correo if item.usuario else None,
        "accion": item.accion,
        "modulo": item.modulo,
        "descripcion": item.descripcion,
        "entidad": item.entidad,
        "id_entidad": item.id_entidad,
        "fecha": item.fecha.isoformat() if item.fecha else None,
        "ip": item.ip,
        "user_agent": item.user_agent,
    }


def _query_filtrada(
    db: Session,
    fecha_inicio: date | None,
    fecha_fin: date | None,
    modulo: str | None,
    accion: str | None,
    entidad: str | None,
    usuario: str | None,
):
    query = db.query(BitacoraAuditoriaModel).options(joinedload(BitacoraAuditoriaModel.usuario))

    if fecha_inicio is not None:
        query = query.filter(BitacoraAuditoriaModel.fecha >= datetime.combine(fecha_inicio, time.min))
    if fecha_fin is not None:
        query = query.filter(BitacoraAuditoriaModel.fecha <= datetime.combine(fecha_fin, time.max))
    if modulo and modulo != "todos":
        query = query.filter(BitacoraAuditoriaModel.modulo == modulo)
    if accion and accion != "todos":
        query = query.filter(BitacoraAuditoriaModel.accion == accion)
    if entidad and entidad != "todos":
        query = query.filter(BitacoraAuditoriaModel.entidad == entidad)
    if usuario and usuario.strip():
        valor = usuario.strip()
        if valor.isdigit():
            query = query.filter(BitacoraAuditoriaModel.id_usuario == int(valor))
        else:
            patron = f"%{valor}%"
            query = query.outerjoin(UsuarioModel).filter(
                or_(
                    UsuarioModel.correo.ilike(patron),
                    BitacoraAuditoriaModel.descripcion.ilike(patron),
                    BitacoraAuditoriaModel.accion.ilike(patron),
                    BitacoraAuditoriaModel.modulo.ilike(patron),
                    BitacoraAuditoriaModel.entidad.ilike(patron),
                )
            )

    return query


@router.get("/")
def listar_bitacora(
    fecha_inicio: date | None = Query(None),
    fecha_fin: date | None = Query(None),
    modulo: str | None = Query(None),
    accion: str | None = Query(None),
    entidad: str | None = Query(None),
    usuario: str | None = Query(None),
    pagina: int = Query(1, ge=1),
    limite: int = Query(25, ge=1, le=100),
    db: Session = Depends(obtener_db),
):
    query = _query_filtrada(db, fecha_inicio, fecha_fin, modulo, accion, entidad, usuario)
    total = query.count()
    registros = (
        query.order_by(BitacoraAuditoriaModel.fecha.desc(), BitacoraAuditoriaModel.id_bitacora.desc())
        .offset((pagina - 1) * limite)
        .limit(limite)
        .all()
    )

    modulos = [
        row[0]
        for row in db.query(BitacoraAuditoriaModel.modulo)
        .distinct()
        .order_by(BitacoraAuditoriaModel.modulo.asc())
        .all()
        if row[0]
    ]
    acciones = [
        row[0]
        for row in db.query(BitacoraAuditoriaModel.accion)
        .distinct()
        .order_by(BitacoraAuditoriaModel.accion.asc())
        .all()
        if row[0]
    ]
    entidades = [
        row[0]
        for row in db.query(BitacoraAuditoriaModel.entidad)
        .distinct()
        .order_by(BitacoraAuditoriaModel.entidad.asc())
        .all()
        if row[0]
    ]

    return {
        "items": [_serializar_bitacora(item) for item in registros],
        "total": total,
        "pagina": pagina,
        "limite": limite,
        "total_paginas": (total + limite - 1) // limite if total else 1,
        "modulos": modulos,
        "acciones": acciones,
        "entidades": entidades,
    }


@router.get("/usuario/{id_usuario}", response_model=list[BitacoraAuditoriaResponse])
def listar_bitacora_usuario(id_usuario: int, db: Session = Depends(obtener_db)):
    registros = (
        db.query(BitacoraAuditoriaModel)
        .options(joinedload(BitacoraAuditoriaModel.usuario))
        .filter(BitacoraAuditoriaModel.id_usuario == id_usuario)
        .order_by(BitacoraAuditoriaModel.fecha.desc(), BitacoraAuditoriaModel.id_bitacora.desc())
        .all()
    )
    return [_serializar_bitacora(item) for item in registros]


@router.get("/{id_bitacora}", response_model=BitacoraAuditoriaResponse)
def obtener_bitacora(id_bitacora: int, db: Session = Depends(obtener_db)):
    bitacora = (
        db.query(BitacoraAuditoriaModel)
        .options(joinedload(BitacoraAuditoriaModel.usuario))
        .filter(BitacoraAuditoriaModel.id_bitacora == id_bitacora)
        .first()
    )
    if bitacora is None:
        raise HTTPException(status_code=404, detail="Registro de bitacora no encontrado")
    return _serializar_bitacora(bitacora)


@router.post("/", response_model=BitacoraAuditoriaResponse)
def crear_bitacora(registro: BitacoraAuditoriaCreate, db: Session = Depends(obtener_db)):
    _validar_sin_datos_sensibles(
        registro.accion,
        registro.modulo,
        registro.descripcion,
        registro.entidad,
        registro.ip,
        registro.user_agent,
    )
    nuevo_registro = BitacoraAuditoriaModel(**registro.model_dump())
    db.add(nuevo_registro)
    db.commit()
    db.refresh(nuevo_registro)
    return _serializar_bitacora(nuevo_registro)
