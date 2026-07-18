from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session, joinedload

from infrastructure.database.dependencies import obtener_db
from infrastructure.persistence.models.seleccion_empresa import SeleccionEmpresaModel
from infrastructure.security.auth_dependencies import requerir_roles
from interfaces.api.schemas.seleccion_empresa import (
    SeleccionEmpresaCreate,
    SeleccionEmpresaResponse,
    SeleccionEmpresaUpdate,
)


router = APIRouter(
    prefix="/selecciones-empresa",
    tags=["Selecciones Empresa"],
    dependencies=[Depends(requerir_roles(["Administrador", "Coordinador de Practicas"]))],
)


def _serializar_seleccion(seleccion: SeleccionEmpresaModel):
    return {
        "id_seleccion": seleccion.id_seleccion,
        "id_alumno": seleccion.id_alumno,
        "id_empresa": seleccion.vacante.id_empresa if seleccion.vacante else None,
        "id_convocatoria": seleccion.id_convocatoria,
        "id_vacante": seleccion.id_vacante,
        "prioridad": seleccion.prioridad,
        "estado": seleccion.estado,
        "observaciones": seleccion.observaciones,
        "fecha_seleccion": seleccion.fecha_seleccion,
        "fecha_revision": seleccion.fecha_revision,
        "revisado_por": seleccion.revisado_por,
    }


@router.get("/", response_model=list[SeleccionEmpresaResponse])
def listar_selecciones(db: Session = Depends(obtener_db)):
    selecciones = (
        db.query(SeleccionEmpresaModel)
        .options(joinedload(SeleccionEmpresaModel.vacante))
        .all()
    )
    return [_serializar_seleccion(seleccion) for seleccion in selecciones]


@router.get("/{id_seleccion}", response_model=SeleccionEmpresaResponse)
def obtener_seleccion(id_seleccion: int, db: Session = Depends(obtener_db)):
    seleccion = (
        db.query(SeleccionEmpresaModel)
        .options(joinedload(SeleccionEmpresaModel.vacante))
        .filter(SeleccionEmpresaModel.id_seleccion == id_seleccion)
        .first()
    )
    if seleccion is None:
        raise HTTPException(status_code=404, detail="Seleccion no encontrada")
    return _serializar_seleccion(seleccion)


@router.post("/", response_model=SeleccionEmpresaResponse)
def crear_seleccion(seleccion: SeleccionEmpresaCreate, db: Session = Depends(obtener_db)):
    nueva_seleccion = SeleccionEmpresaModel(
        **seleccion.model_dump(),
        estado="Registrada",
    )
    db.add(nueva_seleccion)
    db.commit()
    db.refresh(nueva_seleccion)
    return _serializar_seleccion(nueva_seleccion)


@router.put("/{id_seleccion}", response_model=SeleccionEmpresaResponse)
def actualizar_seleccion(
    id_seleccion: int,
    datos: SeleccionEmpresaUpdate,
    db: Session = Depends(obtener_db),
):
    seleccion = (
        db.query(SeleccionEmpresaModel)
        .options(joinedload(SeleccionEmpresaModel.vacante))
        .filter(SeleccionEmpresaModel.id_seleccion == id_seleccion)
        .first()
    )
    if seleccion is None:
        raise HTTPException(status_code=404, detail="Seleccion no encontrada")

    for campo, valor in datos.model_dump(exclude_unset=True).items():
        setattr(seleccion, campo, valor)

    db.commit()
    db.refresh(seleccion)
    return _serializar_seleccion(seleccion)


@router.delete("/{id_seleccion}")
def eliminar_seleccion(id_seleccion: int, db: Session = Depends(obtener_db)):
    seleccion = (
        db.query(SeleccionEmpresaModel)
        .filter(SeleccionEmpresaModel.id_seleccion == id_seleccion)
        .first()
    )
    if seleccion is None:
        raise HTTPException(status_code=404, detail="Seleccion no encontrada")

    db.delete(seleccion)
    db.commit()
    return {"mensaje": "Seleccion eliminada correctamente"}
