from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, EmailStr, Field
from sqlalchemy.orm import Session
from typing import Optional

from app.services.notificacion_service import notificar_roles
from infrastructure.database.dependencies import obtener_db
from infrastructure.persistence.models.empresa import EmpresaModel
from interfaces.api.schemas.empresa import EmpresaCreate, EmpresaResponse, EmpresaUpdate


router = APIRouter(prefix="/empresas", tags=["Empresas"])


class SolicitudEmpresaCreate(BaseModel):
    nombre_empresa: str = Field(min_length=2, max_length=150)
    rfc: Optional[str] = Field(default=None, max_length=20)
    giro: Optional[str] = Field(default=None, max_length=100)
    domicilio: Optional[str] = None
    telefono: Optional[str] = Field(default=None, max_length=15)
    correo_contacto: EmailStr
    nombre_contacto: Optional[str] = Field(default=None, max_length=150)
    cargo_contacto: Optional[str] = Field(default=None, max_length=100)
    descripcion: Optional[str] = None


@router.get("/", response_model=list[EmpresaResponse])
def listar_empresas(db: Session = Depends(obtener_db)):
    return db.query(EmpresaModel).all()


@router.post("/solicitudes", response_model=EmpresaResponse)
def crear_solicitud_empresa(solicitud: SolicitudEmpresaCreate, db: Session = Depends(obtener_db)):
    rfc = solicitud.rfc.strip().upper() if solicitud.rfc else None
    if rfc:
        existente = db.query(EmpresaModel).filter(EmpresaModel.rfc == rfc).first()
        if existente is not None:
            raise HTTPException(status_code=400, detail="Ya existe una empresa registrada con ese RFC")

    domicilio = solicitud.domicilio
    detalles = []
    if solicitud.nombre_contacto:
        detalles.append(f"Contacto: {solicitud.nombre_contacto}")
    if solicitud.cargo_contacto:
        detalles.append(f"Cargo: {solicitud.cargo_contacto}")
    if solicitud.descripcion:
        detalles.append(f"Descripcion: {solicitud.descripcion}")
    if detalles:
        domicilio = "\n".join([domicilio or "", *detalles]).strip()

    empresa = EmpresaModel(
        nombre_empresa=solicitud.nombre_empresa.strip(),
        rfc=rfc,
        giro=solicitud.giro.strip() if solicitud.giro else None,
        domicilio=domicilio,
        telefono=solicitud.telefono.strip() if solicitud.telefono else None,
        correo_contacto=str(solicitud.correo_contacto),
        estado_empresa="Pendiente",
    )
    db.add(empresa)
    notificar_roles(
        db,
        ["Coordinador de Unidades Receptoras", "Administrador"],
        "Nueva solicitud de empresa",
        f"{empresa.nombre_empresa} solicito registrarse como unidad receptora.",
    )
    db.commit()
    db.refresh(empresa)
    return empresa


@router.get("/{id_empresa}", response_model=EmpresaResponse)
def obtener_empresa(id_empresa: int, db: Session = Depends(obtener_db)):
    empresa = db.query(EmpresaModel).filter(EmpresaModel.id_empresa == id_empresa).first()
    if empresa is None:
        raise HTTPException(status_code=404, detail="Empresa no encontrada")
    return empresa


@router.post("/", response_model=EmpresaResponse)
def crear_empresa(empresa: EmpresaCreate, db: Session = Depends(obtener_db)):
    nueva_empresa = EmpresaModel(**empresa.model_dump())
    db.add(nueva_empresa)
    db.commit()
    db.refresh(nueva_empresa)
    return nueva_empresa


@router.put("/{id_empresa}", response_model=EmpresaResponse)
def actualizar_empresa(
    id_empresa: int,
    datos: EmpresaUpdate,
    db: Session = Depends(obtener_db)
):
    empresa = db.query(EmpresaModel).filter(EmpresaModel.id_empresa == id_empresa).first()
    if empresa is None:
        raise HTTPException(status_code=404, detail="Empresa no encontrada")

    for campo, valor in datos.model_dump(exclude_unset=True).items():
        setattr(empresa, campo, valor)

    db.commit()
    db.refresh(empresa)
    return empresa


@router.delete("/{id_empresa}")
def eliminar_empresa(id_empresa: int, db: Session = Depends(obtener_db)):
    empresa = db.query(EmpresaModel).filter(EmpresaModel.id_empresa == id_empresa).first()
    if empresa is None:
        raise HTTPException(status_code=404, detail="Empresa no encontrada")

    db.delete(empresa)
    db.commit()
    return {"mensaje": "Empresa eliminada correctamente"}
