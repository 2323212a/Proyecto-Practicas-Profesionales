import unicodedata

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session, joinedload

from app.services.auditoria_service import registrar_bitacora
from infrastructure.database.dependencies import obtener_db
from infrastructure.persistence.models.carrera import CarreraModel
from infrastructure.persistence.models.regla_practica_carrera import ReglaPracticaCarreraModel
from infrastructure.persistence.models.tipo_practica import TipoPracticaModel
from infrastructure.persistence.models.usuario import UsuarioModel
from infrastructure.security.auth_dependencies import obtener_usuario_actual, requerir_roles
from interfaces.api.schemas.regla_practica_carrera import (
    ReglaPracticaCarreraCreate,
    ReglaPracticaCarreraResponse,
    ReglaPracticaCarreraUpdate,
)


router = APIRouter(prefix="/reglas-practica-carrera", tags=["Reglas practica carrera"])

TIPOS_SECUENCIA = {
    "practicas_1": 1,
    "practicas_2": 2,
    "residencia": 3,
}


def _serializar(regla: ReglaPracticaCarreraModel) -> dict:
    return {
        "id_regla_practica_carrera": regla.id_regla_practica_carrera,
        "id_carrera": regla.id_carrera,
        "carrera_nombre": regla.carrera.nombre if regla.carrera else None,
        "carrera_tipo_periodo": regla.carrera.tipo_periodo if regla.carrera else None,
        "carrera_duracion_periodos": regla.carrera.duracion_periodos if regla.carrera else None,
        "carrera_creditos_totales": regla.carrera.creditos_totales if regla.carrera else None,
        "id_tipo_practica": regla.id_tipo_practica,
        "tipo_practica_nombre": regla.tipo_practica.nombre if regla.tipo_practica else None,
        "periodo_requerido": regla.periodo_requerido,
        "creditos_minimos": regla.creditos_minimos,
        "horas_requeridas": regla.horas_requeridas,
        "activo": bool(regla.activo),
        "observaciones": regla.observaciones,
    }


def _obtener_carrera_tipo(db: Session, id_carrera: int, id_tipo_practica: int):
    carrera = db.query(CarreraModel).filter(CarreraModel.id_carrera == id_carrera).first()
    if carrera is None:
        raise HTTPException(status_code=404, detail="Carrera no encontrada")
    if carrera.estado != "Activa":
        raise HTTPException(status_code=400, detail="La carrera debe estar activa para configurar reglas.")
    tipo = db.query(TipoPracticaModel).filter(TipoPracticaModel.id_tipo_practica == id_tipo_practica).first()
    if tipo is None:
        raise HTTPException(status_code=404, detail="Tipo de practica no encontrado")
    if not tipo.activo:
        raise HTTPException(status_code=400, detail="El tipo de practica debe estar activo para configurar reglas.")
    return carrera, tipo


def _validar_regla(carrera: CarreraModel, periodo_requerido: int, creditos_minimos: int, horas_requeridas: int):
    if periodo_requerido < 1:
        raise HTTPException(status_code=400, detail="El periodo requerido debe ser mayor o igual a 1.")
    if creditos_minimos < 0:
        raise HTTPException(status_code=400, detail="Los creditos minimos no pueden ser negativos.")
    if carrera.duracion_periodos is not None and periodo_requerido > carrera.duracion_periodos:
        raise HTTPException(status_code=400, detail="El periodo requerido no puede ser mayor a la duracion de la carrera.")
    if carrera.creditos_totales is not None and creditos_minimos > carrera.creditos_totales:
        raise HTTPException(status_code=400, detail="Los creditos minimos no pueden superar los creditos totales de la carrera.")
    if horas_requeridas <= 0:
        raise HTTPException(status_code=400, detail="Las horas requeridas deben ser mayores a cero.")


def _clave_tipo_practica(nombre: str | None) -> str | None:
    if not nombre:
        return None
    texto = unicodedata.normalize("NFKD", nombre).encode("ascii", "ignore").decode("ascii").lower()
    if "residencia" in texto:
        return "residencia"
    if "practica" in texto and "1" in texto:
        return "practicas_1"
    if "practica" in texto and "2" in texto:
        return "practicas_2"
    return None


def _validar_secuencia_regla(
    db: Session,
    id_carrera: int,
    tipo_actual: TipoPracticaModel,
    periodo_actual: int,
    activo: bool,
    id_regla_actual: int | None = None,
):
    if not activo:
        return

    clave_actual = _clave_tipo_practica(tipo_actual.nombre)
    if clave_actual is None:
        return

    reglas = (
        db.query(ReglaPracticaCarreraModel)
        .join(TipoPracticaModel, ReglaPracticaCarreraModel.id_tipo_practica == TipoPracticaModel.id_tipo_practica)
        .filter(
            ReglaPracticaCarreraModel.id_carrera == id_carrera,
            ReglaPracticaCarreraModel.activo.is_(True),
        )
        .all()
    )

    periodos: dict[str, int] = {clave_actual: periodo_actual}
    for regla in reglas:
        if id_regla_actual and regla.id_regla_practica_carrera == id_regla_actual:
            continue
        clave = _clave_tipo_practica(regla.tipo_practica.nombre if regla.tipo_practica else None)
        if clave:
            periodos[clave] = regla.periodo_requerido

    practica_1 = periodos.get("practicas_1")
    practica_2 = periodos.get("practicas_2")
    residencia = periodos.get("residencia")

    if practica_1 is not None and practica_2 is not None and practica_2 <= practica_1:
        raise HTTPException(status_code=400, detail="Practicas 2 debe ubicarse despues de Practicas 1.")
    if practica_1 is not None and residencia is not None and residencia <= practica_1:
        raise HTTPException(status_code=400, detail="Residencia debe ubicarse despues de Practicas 1.")
    if practica_2 is not None and residencia is not None and residencia <= practica_2:
        raise HTTPException(status_code=400, detail="Residencia debe ubicarse despues de Practicas 2.")


@router.get(
    "/",
    response_model=list[ReglaPracticaCarreraResponse],
    dependencies=[Depends(requerir_roles(["Administrador", "Direccion"]))],
)
def listar_reglas_practica_carrera(db: Session = Depends(obtener_db)):
    reglas = (
        db.query(ReglaPracticaCarreraModel)
        .options(
            joinedload(ReglaPracticaCarreraModel.carrera),
            joinedload(ReglaPracticaCarreraModel.tipo_practica),
        )
        .order_by(ReglaPracticaCarreraModel.id_carrera, ReglaPracticaCarreraModel.id_tipo_practica)
        .all()
    )
    return [_serializar(regla) for regla in reglas]


@router.post(
    "/",
    response_model=ReglaPracticaCarreraResponse,
    dependencies=[Depends(requerir_roles(["Administrador"]))],
)
def crear_regla_practica_carrera(
    datos: ReglaPracticaCarreraCreate,
    db: Session = Depends(obtener_db),
    usuario_actual: UsuarioModel = Depends(obtener_usuario_actual),
):
    carrera, tipo = _obtener_carrera_tipo(db, datos.id_carrera, datos.id_tipo_practica)
    existente = (
        db.query(ReglaPracticaCarreraModel)
        .filter(
            ReglaPracticaCarreraModel.id_carrera == datos.id_carrera,
            ReglaPracticaCarreraModel.id_tipo_practica == datos.id_tipo_practica,
        )
        .first()
    )
    if existente is not None:
        raise HTTPException(status_code=400, detail="La regla para esta carrera y tipo de practica ya existe.")
    _validar_regla(carrera, datos.periodo_requerido, datos.creditos_minimos, datos.horas_requeridas)
    _validar_secuencia_regla(db, datos.id_carrera, tipo, datos.periodo_requerido, datos.activo)
    regla = ReglaPracticaCarreraModel(**datos.model_dump())
    db.add(regla)
    db.commit()
    db.refresh(regla)
    registrar_bitacora(
        db,
        usuario_actual.id_usuario,
        "Crear regla practica carrera",
        "reglas_practica_carrera",
        "Admin creo una regla de practica por carrera",
        "regla_practica_carrera",
        regla.id_regla_practica_carrera,
    )
    return _serializar(regla)


@router.put(
    "/{id_regla}",
    response_model=ReglaPracticaCarreraResponse,
    dependencies=[Depends(requerir_roles(["Administrador"]))],
)
def actualizar_regla_practica_carrera(
    id_regla: int,
    datos: ReglaPracticaCarreraUpdate,
    db: Session = Depends(obtener_db),
    usuario_actual: UsuarioModel = Depends(obtener_usuario_actual),
):
    regla = (
        db.query(ReglaPracticaCarreraModel)
        .options(joinedload(ReglaPracticaCarreraModel.carrera), joinedload(ReglaPracticaCarreraModel.tipo_practica))
        .filter(ReglaPracticaCarreraModel.id_regla_practica_carrera == id_regla)
        .first()
    )
    if regla is None:
        raise HTTPException(status_code=404, detail="Regla no encontrada")
    cambios = datos.model_dump(exclude_unset=True)
    periodo = cambios.get("periodo_requerido", regla.periodo_requerido)
    creditos = cambios.get("creditos_minimos", regla.creditos_minimos)
    horas = cambios.get("horas_requeridas", regla.horas_requeridas)
    activo = cambios.get("activo", regla.activo)
    _validar_regla(regla.carrera, periodo, creditos, horas)
    _validar_secuencia_regla(
        db,
        regla.id_carrera,
        regla.tipo_practica,
        periodo,
        activo,
        regla.id_regla_practica_carrera,
    )
    for campo, valor in cambios.items():
        setattr(regla, campo, valor)
    db.commit()
    db.refresh(regla)
    registrar_bitacora(
        db,
        usuario_actual.id_usuario,
        "Editar regla practica carrera",
        "reglas_practica_carrera",
        "Admin edito una regla de practica por carrera",
        "regla_practica_carrera",
        regla.id_regla_practica_carrera,
    )
    return _serializar(regla)


@router.patch(
    "/{id_regla}/activar",
    response_model=ReglaPracticaCarreraResponse,
    dependencies=[Depends(requerir_roles(["Administrador"]))],
)
def activar_regla_practica_carrera(id_regla: int, db: Session = Depends(obtener_db)):
    regla = (
        db.query(ReglaPracticaCarreraModel)
        .options(joinedload(ReglaPracticaCarreraModel.carrera), joinedload(ReglaPracticaCarreraModel.tipo_practica))
        .filter(ReglaPracticaCarreraModel.id_regla_practica_carrera == id_regla)
        .first()
    )
    if regla is None:
        raise HTTPException(status_code=404, detail="Regla no encontrada")
    _validar_regla(regla.carrera, regla.periodo_requerido, regla.creditos_minimos, regla.horas_requeridas)
    _validar_secuencia_regla(
        db,
        regla.id_carrera,
        regla.tipo_practica,
        regla.periodo_requerido,
        True,
        regla.id_regla_practica_carrera,
    )
    regla.activo = True
    db.commit()
    db.refresh(regla)
    return _serializar(regla)


@router.patch(
    "/{id_regla}/desactivar",
    response_model=ReglaPracticaCarreraResponse,
    dependencies=[Depends(requerir_roles(["Administrador"]))],
)
def desactivar_regla_practica_carrera(id_regla: int, db: Session = Depends(obtener_db)):
    regla = (
        db.query(ReglaPracticaCarreraModel)
        .options(joinedload(ReglaPracticaCarreraModel.carrera), joinedload(ReglaPracticaCarreraModel.tipo_practica))
        .filter(ReglaPracticaCarreraModel.id_regla_practica_carrera == id_regla)
        .first()
    )
    if regla is None:
        raise HTTPException(status_code=404, detail="Regla no encontrada")
    regla.activo = False
    db.commit()
    db.refresh(regla)
    return _serializar(regla)
