# routes/empresas.py

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional

from database.dependencies import obtener_db
from models.empresa import EmpresaModel
from models.vacante import Vacante

router = APIRouter(prefix="/empresas", tags=["Empresas"])

CUPO_INICIAL = 3


class EmpresaCreate(BaseModel):
    id_usuario: Optional[int] = None
    nombre_empresa: str
    rfc: Optional[str] = None
    giro: Optional[str] = None
    domicilio: Optional[str] = None
    telefono: Optional[str] = None
    correo_contacto: Optional[str] = None
    estado_empresa: Optional[str] = "Pendiente"
    vacantes: Optional[int] = CUPO_INICIAL


class EmpresaUpdate(BaseModel):
    id_usuario: Optional[int] = None
    nombre_empresa: Optional[str] = None
    rfc: Optional[str] = None
    giro: Optional[str] = None
    domicilio: Optional[str] = None
    telefono: Optional[str] = None
    correo_contacto: Optional[str] = None
    estado_empresa: Optional[str] = None
    vacantes: Optional[int] = None


def obtener_o_crear_vacante(db: Session, empresa: EmpresaModel, cupo: int = CUPO_INICIAL):
    vacante = db.query(Vacante).filter(Vacante.id_empresa == empresa.id_empresa).first()
    if vacante is not None:
        return vacante

    cupo_normalizado = max(int(cupo or CUPO_INICIAL), 0)
    vacante = Vacante(
        id_empresa=empresa.id_empresa,
        id_carrera=1,
        titulo=f"Practicas profesionales - {empresa.nombre_empresa}",
        descripcion=empresa.giro or "Actividades profesionales en unidad receptora",
        modalidad="Presencial",
        horario="08:00 - 14:00",
        cupo_total=cupo_normalizado,
        cupo_disponible=cupo_normalizado,
        estado_vacante="Activa" if empresa.estado_empresa == "Activa" and cupo_normalizado > 0 else "Cerrada",
    )
    db.add(vacante)
    return vacante


def sincronizar_vacante(db: Session, empresa: EmpresaModel, cupo: Optional[int] = None):
    vacante = obtener_o_crear_vacante(db, empresa, cupo if cupo is not None else CUPO_INICIAL)
    if cupo is not None:
        nuevo_total = max(int(cupo), 0)
        usados = max((vacante.cupo_total or 0) - (vacante.cupo_disponible or 0), 0)
        vacante.cupo_total = nuevo_total
        vacante.cupo_disponible = max(nuevo_total - usados, 0)
    vacante.estado_vacante = "Activa" if empresa.estado_empresa == "Activa" and (vacante.cupo_total or 0) > 0 else "Cerrada"
    if not vacante.titulo:
        vacante.titulo = f"Practicas profesionales - {empresa.nombre_empresa}"
    if not vacante.descripcion:
        vacante.descripcion = empresa.giro or "Actividades profesionales en unidad receptora"
    return vacante


def serializar_empresa_padron(empresa: EmpresaModel, vacante: Vacante | None):
    return {
        "id_empresa": empresa.id_empresa,
        "nombre_empresa": empresa.nombre_empresa,
        "rfc": empresa.rfc,
        "giro": empresa.giro,
        "domicilio": empresa.domicilio,
        "telefono": empresa.telefono,
        "correo_contacto": empresa.correo_contacto,
        "estado_empresa": empresa.estado_empresa,
        "id_vacante": vacante.id_vacante if vacante else None,
        "titulo": vacante.titulo if vacante else None,
        "descripcion": vacante.descripcion if vacante else None,
        "modalidad": vacante.modalidad if vacante else None,
        "horario": vacante.horario if vacante else None,
        "cupo_total": vacante.cupo_total if vacante else 0,
        "cupo_disponible": vacante.cupo_disponible if vacante else 0,
        "estado_vacante": vacante.estado_vacante if vacante else "Cerrada",
    }


@router.get("/")
def obtener_empresas(db: Session = Depends(obtener_db)):
    empresas = db.query(EmpresaModel).order_by(EmpresaModel.id_empresa.desc()).all()
    resultado = []
    for empresa in empresas:
        vacante = db.query(Vacante).filter(Vacante.id_empresa == empresa.id_empresa).first()
        resultado.append(serializar_empresa_padron(empresa, vacante))
    return resultado


@router.get("/padron")
def obtener_empresas_padron(db: Session = Depends(obtener_db)):
    empresas = db.query(EmpresaModel).filter(EmpresaModel.estado_empresa == "Activa").order_by(EmpresaModel.nombre_empresa).all()
    resultado = []
    for empresa in empresas:
        vacante = sincronizar_vacante(db, empresa)
        if vacante.estado_vacante == "Activa":
            resultado.append(serializar_empresa_padron(empresa, vacante))
    db.commit()
    return resultado


@router.get("/{id_empresa}")
def obtener_empresa(id_empresa: int, db: Session = Depends(obtener_db)):
    empresa = db.query(EmpresaModel).filter(
        EmpresaModel.id_empresa == id_empresa
    ).first()

    if empresa is None:
        raise HTTPException(status_code=404, detail="Empresa no encontrada")

    vacante = db.query(Vacante).filter(Vacante.id_empresa == empresa.id_empresa).first()
    return serializar_empresa_padron(empresa, vacante)


@router.post("/")
def crear_empresa(
    datos: EmpresaCreate,
    db: Session = Depends(obtener_db)
):
    payload = datos.model_dump(exclude={"vacantes"})
    nueva_empresa = EmpresaModel(**payload)

    db.add(nueva_empresa)
    db.flush()
    sincronizar_vacante(db, nueva_empresa, datos.vacantes)
    db.commit()
    db.refresh(nueva_empresa)

    return {
        "mensaje": "Empresa creada correctamente",
        "empresa": obtener_empresa(nueva_empresa.id_empresa, db)
    }


@router.put("/{id_empresa}")
def actualizar_empresa(
    id_empresa: int,
    datos: EmpresaUpdate,
    db: Session = Depends(obtener_db)
):
    empresa = db.query(EmpresaModel).filter(
        EmpresaModel.id_empresa == id_empresa
    ).first()

    if empresa is None:
        raise HTTPException(status_code=404, detail="Empresa no encontrada")

    valores = datos.model_dump(exclude_unset=True)
    cupo = valores.pop("vacantes", None)
    for campo, valor in valores.items():
        setattr(empresa, campo, valor)

    sincronizar_vacante(db, empresa, cupo)
    db.commit()
    db.refresh(empresa)

    return {
        "mensaje": "Empresa actualizada correctamente",
        "empresa": obtener_empresa(empresa.id_empresa, db)
    }


@router.delete("/{id_empresa}")
def eliminar_empresa(id_empresa: int, db: Session = Depends(obtener_db)):
    empresa = db.query(EmpresaModel).filter(
        EmpresaModel.id_empresa == id_empresa
    ).first()

    if empresa is None:
        raise HTTPException(status_code=404, detail="Empresa no encontrada")

    vacante = db.query(Vacante).filter(Vacante.id_empresa == empresa.id_empresa).first()
    if vacante:
        db.delete(vacante)
    db.delete(empresa)
    db.commit()

    return {"mensaje": "Empresa eliminada correctamente"}