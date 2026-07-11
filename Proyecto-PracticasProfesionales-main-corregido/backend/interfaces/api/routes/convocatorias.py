from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from fastapi import HTTPException
from interfaces.api.schemas.convocatoria import ConvocatoriaCreate, ConvocatoriaResponse, ConvocatoriaUpdate
from infrastructure.database.dependencies import obtener_db
from infrastructure.security.auth_dependencies import requerir_roles


from interfaces.api.service_factory import ConvocatoriaService


router = APIRouter(
    prefix="/convocatorias",
    tags=["Convocatorias"],
    dependencies=[Depends(requerir_roles(['Administrador', 'Coordinador de Practicas']))],
)


@router.get(
    "/",
    response_model=list[ConvocatoriaResponse]
)
def listar_convocatorias(
    db: Session = Depends(obtener_db)
):
    return ConvocatoriaService(db).listar()


@router.get("/{id_convocatoria}", response_model=ConvocatoriaResponse)
def obtener_convocatoria(
    id_convocatoria: int,
    db: Session = Depends(obtener_db)
):
    convocatoria = ConvocatoriaService(db).obtener_por_id(id_convocatoria)

    if convocatoria is None:
        raise HTTPException(
            status_code=404,
            detail="Convocatoria no encontrada"
        )

    return convocatoria


@router.post(
    "/",
    response_model=ConvocatoriaResponse
)
def crear_convocatoria(
    convocatoria: ConvocatoriaCreate,
    db: Session = Depends(obtener_db)
):
    return ConvocatoriaService(db).crear(convocatoria)

@router.put("/{id_convocatoria}", response_model=ConvocatoriaResponse)
def actualizar_convocatoria(
    id_convocatoria: int,
    convocatoria: ConvocatoriaUpdate,
    db: Session = Depends(obtener_db)
):
    convocatoria_actualizada = ConvocatoriaService(db).actualizar(
        id_convocatoria,
        convocatoria
    )

    if convocatoria_actualizada is None:
        raise HTTPException(
            status_code=404,
            detail="Convocatoria no encontrada"
        )

    return convocatoria_actualizada


@router.delete("/{id_convocatoria}")
def eliminar_convocatoria(
    id_convocatoria: int,
    db: Session = Depends(obtener_db)
):
    convocatoria = ConvocatoriaService(db).eliminar(id_convocatoria)

    if convocatoria is None:
        raise HTTPException(
            status_code=404,
            detail="Convocatoria no encontrada"
        )

    return {"mensaje": "Convocatoria eliminada correctamente"}
