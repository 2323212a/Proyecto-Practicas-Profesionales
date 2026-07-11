import re

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, EmailStr, Field
from sqlalchemy import func
from sqlalchemy.orm import Session
from typing import Optional

from app.services.notificacion_service import notificar_roles
from infrastructure.database.dependencies import obtener_db
from infrastructure.security.auth_dependencies import (
    requerir_empresa_actual_o_roles,
    requerir_roles,
)
from infrastructure.persistence.models.empresa import EmpresaModel
from infrastructure.persistence.models.solicitud_empresa import SolicitudEmpresaModel
from infrastructure.persistence.models.responsable_empresa import ResponsableEmpresaModel
from infrastructure.persistence.models.usuario import UsuarioModel
from infrastructure.persistence.models.vacante import VacanteModel
from interfaces.api.schemas.empresa import EmpresaCreate, EmpresaResponse, EmpresaUpdate


router = APIRouter(prefix="/empresas", tags=["Empresas"])


RFC_PATTERN = re.compile(r"^[A-Z\u00d1&]{3,4}\d{6}[A-Z0-9]{3}$")
TELEFONO_PATTERN = re.compile(r"^\+?[0-9]{7,15}$")
TIPOS_TRAMITE = {"Convenio", "Vinculacion"}
PERIODOS_PARTICIPACION = {"Semestral", "Cuatrimestral", "Ambos"}
ESTADOS_SOLICITUD_ACTIVA = {"Solicitante", "Pendiente"}
ESTADOS_EMPRESA = {"Solicitante", "Pendiente", "Rechazada", "Activa", "Suspendida", "Inactiva"}


def limpiar_texto(valor: Optional[str]) -> Optional[str]:
    if valor is None:
        return None
    texto = valor.strip()
    return texto or None


def normalizar_rfc(valor: Optional[str]) -> Optional[str]:
    rfc = limpiar_texto(valor)
    if not rfc:
        return None
    rfc = re.sub(r"\s+", "", rfc).upper()
    if not RFC_PATTERN.match(rfc):
        raise HTTPException(status_code=400, detail="RFC con formato no valido")
    return rfc


def normalizar_telefono(valor: Optional[str]) -> Optional[str]:
    telefono = limpiar_texto(valor)
    if not telefono:
        return None
    telefono = re.sub(r"[\s\-\(\)]", "", telefono)
    if not TELEFONO_PATTERN.match(telefono):
        raise HTTPException(status_code=400, detail="Telefono con formato no valido")
    return telefono


def normalizar_opcion(valor: Optional[str], opciones: set[str], campo: str) -> str:
    texto = limpiar_texto(valor)
    if not texto:
        raise HTTPException(status_code=400, detail=f"{campo} es obligatorio")
    if texto not in opciones:
        raise HTTPException(status_code=400, detail=f"{campo} no valido")
    return texto


class SolicitudEmpresaCreate(BaseModel):
    nombre_empresa: str = Field(min_length=2, max_length=150)
    rfc: Optional[str] = Field(default=None, max_length=20)
    giro: Optional[str] = Field(default=None, max_length=100)
    domicilio: Optional[str] = None
    telefono: Optional[str] = Field(default=None, max_length=25)
    correo_contacto: EmailStr
    nombre_contacto: Optional[str] = Field(default=None, max_length=150)
    cargo_contacto: Optional[str] = Field(default=None, max_length=100)
    descripcion: Optional[str] = None
    tipo_tramite: str
    periodo_participacion: str


@router.get(
    "/",
    response_model=list[EmpresaResponse],
    dependencies=[
        Depends(
            requerir_roles(
                [
                    "Administrador",
                    "Coordinador de Practicas",
                    "Coordinador de Unidades Receptoras",
                    "Direccion",
                ]
            )
        )
    ],
)
def listar_empresas(db: Session = Depends(obtener_db)):
    return db.query(EmpresaModel).all()


@router.post("/solicitudes", response_model=EmpresaResponse)
def crear_solicitud_empresa(solicitud: SolicitudEmpresaCreate, db: Session = Depends(obtener_db)):
    nombre_empresa = limpiar_texto(solicitud.nombre_empresa)
    if not nombre_empresa:
        raise HTTPException(status_code=400, detail="Nombre de empresa es obligatorio")

    rfc = normalizar_rfc(solicitud.rfc)
    giro = limpiar_texto(solicitud.giro)
    domicilio = limpiar_texto(solicitud.domicilio)
    telefono = normalizar_telefono(solicitud.telefono)
    correo_contacto = str(solicitud.correo_contacto).strip().lower()
    nombre_contacto = limpiar_texto(solicitud.nombre_contacto)
    cargo_contacto = limpiar_texto(solicitud.cargo_contacto)
    descripcion = limpiar_texto(solicitud.descripcion)
    tipo_tramite = normalizar_opcion(solicitud.tipo_tramite, TIPOS_TRAMITE, "Tipo de tramite")
    periodo_participacion = normalizar_opcion(
        solicitud.periodo_participacion,
        PERIODOS_PARTICIPACION,
        "Periodo de participacion",
    )

    existente_rfc = (
        db.query(EmpresaModel).filter(EmpresaModel.rfc == rfc).first() if rfc else None
    )
    existente_correo = (
        db.query(EmpresaModel)
        .filter(func.lower(EmpresaModel.correo_contacto) == correo_contacto)
        .first()
    )
    if (
        existente_rfc is not None
        and existente_correo is not None
        and existente_rfc.id_empresa != existente_correo.id_empresa
    ):
        raise HTTPException(
            status_code=400,
            detail="El RFC y el correo pertenecen a empresas diferentes en el sistema.",
        )
    existente = existente_rfc or existente_correo

    if existente is not None and existente.estado_empresa in ESTADOS_SOLICITUD_ACTIVA:
        raise HTTPException(
            status_code=400,
            detail="Ya existe una solicitud o proceso activo para esta empresa.",
        )
    if existente is not None and existente.estado_empresa != "Rechazada":
        raise HTTPException(status_code=400, detail="La empresa ya existe en el sistema.")

    detalles = []
    if nombre_contacto:
        detalles.append(f"Contacto: {nombre_contacto}")
    if cargo_contacto:
        detalles.append(f"Cargo: {cargo_contacto}")
    if descripcion:
        detalles.append(f"Descripcion: {descripcion}")
    if detalles:
        domicilio = "\n".join([domicilio or "", *detalles]).strip()

    if existente is None:
        empresa = EmpresaModel(
            nombre_empresa=nombre_empresa,
            rfc=rfc,
            giro=giro,
            domicilio=domicilio,
            telefono=telefono,
            correo_contacto=correo_contacto,
            estado_empresa="Solicitante",
            tipo_tramite=tipo_tramite,
            periodo_participacion=periodo_participacion,
        )
        db.add(empresa)
        db.flush()
    else:
        empresa = existente
        empresa.nombre_empresa = nombre_empresa
        empresa.rfc = rfc
        empresa.giro = giro
        empresa.domicilio = domicilio
        empresa.telefono = telefono
        empresa.correo_contacto = correo_contacto
        empresa.estado_empresa = "Solicitante"
        empresa.tipo_tramite = tipo_tramite
        empresa.periodo_participacion = periodo_participacion

    db.add(
        SolicitudEmpresaModel(
            id_empresa=empresa.id_empresa,
            tipo_tramite=tipo_tramite,
            periodo_participacion=periodo_participacion,
            estado_solicitud="Recibida",
            observaciones=descripcion,
        )
    )
    notificar_roles(
        db,
        ["Coordinador de Unidades Receptoras", "Administrador"],
        "Nueva solicitud de empresa",
        f"{empresa.nombre_empresa} solicito registrarse como unidad receptora.",
    )
    db.commit()
    db.refresh(empresa)
    return empresa


@router.get(
    "/{id_empresa}",
    response_model=EmpresaResponse,
    dependencies=[
        Depends(
            requerir_empresa_actual_o_roles(
                [
                    "Administrador",
                    "Coordinador de Practicas",
                    "Coordinador de Unidades Receptoras",
                    "Direccion",
                ]
            )
        )
    ],
)
def obtener_empresa(id_empresa: int, db: Session = Depends(obtener_db)):
    empresa = db.query(EmpresaModel).filter(EmpresaModel.id_empresa == id_empresa).first()
    if empresa is None:
        raise HTTPException(status_code=404, detail="Empresa no encontrada")
    return empresa


@router.post(
    "/",
    response_model=EmpresaResponse,
    dependencies=[Depends(requerir_roles(["Administrador", "Coordinador de Unidades Receptoras"]))],
)
def crear_empresa(empresa: EmpresaCreate, db: Session = Depends(obtener_db)):
    datos = empresa.model_dump()
    datos["nombre_empresa"] = limpiar_texto(datos["nombre_empresa"])
    if not datos["nombre_empresa"]:
        raise HTTPException(status_code=400, detail="Nombre de empresa es obligatorio")
    datos["rfc"] = normalizar_rfc(datos.get("rfc"))
    datos["telefono"] = normalizar_telefono(datos.get("telefono"))
    datos["correo_contacto"] = (
        str(datos["correo_contacto"]).strip().lower()
        if datos.get("correo_contacto")
        else None
    )
    datos["giro"] = limpiar_texto(datos.get("giro"))
    datos["domicilio"] = limpiar_texto(datos.get("domicilio"))
    if datos.get("estado_empresa") not in ESTADOS_EMPRESA:
        raise HTTPException(status_code=400, detail="Estado de empresa no valido")
    if datos.get("tipo_tramite") is not None:
        datos["tipo_tramite"] = normalizar_opcion(datos["tipo_tramite"], TIPOS_TRAMITE, "Tipo de tramite")
    if datos.get("periodo_participacion") is not None:
        datos["periodo_participacion"] = normalizar_opcion(
            datos["periodo_participacion"],
            PERIODOS_PARTICIPACION,
            "Periodo de participacion",
        )

    duplicada = None
    if datos["rfc"]:
        duplicada = db.query(EmpresaModel).filter(EmpresaModel.rfc == datos["rfc"]).first()
    if duplicada is None and datos["correo_contacto"]:
        duplicada = (
            db.query(EmpresaModel)
            .filter(func.lower(EmpresaModel.correo_contacto) == datos["correo_contacto"])
            .first()
        )
    if duplicada is not None:
        raise HTTPException(status_code=400, detail="Ya existe una empresa con ese RFC o correo")

    nueva_empresa = EmpresaModel(**datos)
    db.add(nueva_empresa)
    db.commit()
    db.refresh(nueva_empresa)
    return nueva_empresa


@router.put(
    "/{id_empresa}",
    response_model=EmpresaResponse,
    dependencies=[Depends(requerir_roles(["Administrador", "Coordinador de Unidades Receptoras"]))],
)
def actualizar_empresa(
    id_empresa: int,
    datos: EmpresaUpdate,
    db: Session = Depends(obtener_db)
):
    empresa = db.query(EmpresaModel).filter(EmpresaModel.id_empresa == id_empresa).first()
    if empresa is None:
        raise HTTPException(status_code=404, detail="Empresa no encontrada")

    cambios = datos.model_dump(exclude_unset=True)
    if "nombre_empresa" in cambios:
        cambios["nombre_empresa"] = limpiar_texto(cambios["nombre_empresa"])
        if not cambios["nombre_empresa"]:
            raise HTTPException(status_code=400, detail="Nombre de empresa es obligatorio")
    if "rfc" in cambios:
        cambios["rfc"] = normalizar_rfc(cambios["rfc"])
    if "telefono" in cambios:
        cambios["telefono"] = normalizar_telefono(cambios["telefono"])
    if "correo_contacto" in cambios:
        cambios["correo_contacto"] = (
            str(cambios["correo_contacto"]).strip().lower()
            if cambios["correo_contacto"]
            else None
        )
    if "giro" in cambios:
        cambios["giro"] = limpiar_texto(cambios["giro"])
    if "domicilio" in cambios:
        cambios["domicilio"] = limpiar_texto(cambios["domicilio"])
    if "estado_empresa" in cambios and cambios["estado_empresa"] not in ESTADOS_EMPRESA:
        raise HTTPException(status_code=400, detail="Estado de empresa no valido")
    if cambios.get("tipo_tramite") is not None:
        cambios["tipo_tramite"] = normalizar_opcion(
            cambios["tipo_tramite"], TIPOS_TRAMITE, "Tipo de tramite"
        )
    if cambios.get("periodo_participacion") is not None:
        cambios["periodo_participacion"] = normalizar_opcion(
            cambios["periodo_participacion"],
            PERIODOS_PARTICIPACION,
            "Periodo de participacion",
        )

    rfc = cambios.get("rfc")
    correo = cambios.get("correo_contacto")
    if rfc:
        duplicada = (
            db.query(EmpresaModel)
            .filter(EmpresaModel.rfc == rfc, EmpresaModel.id_empresa != id_empresa)
            .first()
        )
        if duplicada is not None:
            raise HTTPException(status_code=400, detail="Ya existe otra empresa con ese RFC")
    if correo:
        duplicada = (
            db.query(EmpresaModel)
            .filter(
                func.lower(EmpresaModel.correo_contacto) == correo,
                EmpresaModel.id_empresa != id_empresa,
            )
            .first()
        )
        if duplicada is not None:
            raise HTTPException(status_code=400, detail="Ya existe otra empresa con ese correo")

    for campo, valor in cambios.items():
        setattr(empresa, campo, valor)

    db.commit()
    db.refresh(empresa)
    return empresa


@router.delete(
    "/{id_empresa}",
    dependencies=[Depends(requerir_roles(["Administrador", "Coordinador de Unidades Receptoras"]))],
)
def eliminar_empresa(id_empresa: int, db: Session = Depends(obtener_db)):
    empresa = db.query(EmpresaModel).filter(EmpresaModel.id_empresa == id_empresa).first()
    if empresa is None:
        raise HTTPException(status_code=404, detail="Empresa no encontrada")

    if empresa.estado_empresa == "Inactiva":
        return {"mensaje": "La empresa ya estaba inactiva"}

    empresa.estado_empresa = "Inactiva"
    db.query(VacanteModel).filter(VacanteModel.id_empresa == id_empresa).update(
        {VacanteModel.estado_vacante: "Cerrada"},
        synchronize_session=False,
    )
    responsables = (
        db.query(ResponsableEmpresaModel)
        .filter(ResponsableEmpresaModel.id_empresa == id_empresa)
        .all()
    )
    ids_usuario = [responsable.id_usuario for responsable in responsables]
    if ids_usuario:
        db.query(UsuarioModel).filter(UsuarioModel.id_usuario.in_(ids_usuario)).update(
            {UsuarioModel.estado: "Inactivo"},
            synchronize_session=False,
        )

    db.commit()
    return {"mensaje": "Empresa desactivada correctamente"}
