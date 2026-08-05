import re
from datetime import date

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
from infrastructure.persistence.models.configuracion_sistema import ConfiguracionSistemaModel
from infrastructure.persistence.models.convocatoria import ConvocatoriaModel
from infrastructure.persistence.models.empresa import EmpresaModel
from infrastructure.persistence.models.solicitud_empresa import SolicitudEmpresaModel
from infrastructure.persistence.models.responsable_empresa import ResponsableEmpresaModel
from infrastructure.persistence.models.tipo_unidad_receptora import TipoUnidadReceptoraModel
from infrastructure.persistence.models.usuario import UsuarioModel
from infrastructure.persistence.models.vacante import VacanteModel
from interfaces.api.schemas.empresa import EmpresaCreate, EmpresaResponse, EmpresaUpdate


router = APIRouter(prefix="/empresas", tags=["Empresas"])


RFC_PATTERN = re.compile(r"^[A-Z\u00d1&]{3,4}\d{6}[A-Z0-9]{3}$")
TELEFONO_PATTERN = re.compile(r"^\+?[0-9]{7,15}$")
TIPOS_TRAMITE = {"Convenio", "Vinculacion"}
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


def validar_registro_publico_habilitado(db: Session):
    configuracion = (
        db.query(ConfiguracionSistemaModel)
        .order_by(ConfiguracionSistemaModel.id_configuracion.asc())
        .first()
    )
    estado = configuracion.estado_sistema if configuracion is not None else "Activo"
    if estado != "Activo":
        raise HTTPException(
            status_code=403,
            detail="El registro de solicitudes esta temporalmente deshabilitado.",
        )
    hoy = date.today()
    convocatoria_en_registro = (
        db.query(ConvocatoriaModel)
        .filter(
            ConvocatoriaModel.estado == "Activa",
            ConvocatoriaModel.fecha_inicio_general <= hoy,
            ConvocatoriaModel.fecha_cierre_general >= hoy,
        )
        .order_by(ConvocatoriaModel.fecha_inicio_empresas.desc(), ConvocatoriaModel.id_convocatoria.desc())
        .first()
    )
    if convocatoria_en_registro is None:
        raise HTTPException(
            status_code=403,
            detail="El registro de nuevas empresas esta cerrado por calendario de convocatoria.",
        )


class SolicitudEmpresaCreate(BaseModel):
    nombre_empresa: str = Field(min_length=2, max_length=150)
    rfc: Optional[str] = Field(default=None, max_length=20)
    giro: str = Field(min_length=2, max_length=100)
    domicilio: Optional[str] = None
    telefono: Optional[str] = Field(default=None, max_length=25)
    correo_contacto: EmailStr
    nombre_contacto: Optional[str] = Field(default=None, max_length=150)
    cargo_contacto: Optional[str] = Field(default=None, max_length=100)
    nombre_responsable: Optional[str] = Field(default=None, max_length=100)
    apellido_paterno_responsable: Optional[str] = Field(default=None, max_length=100)
    apellido_materno_responsable: Optional[str] = Field(default=None, max_length=100)
    cargo_responsable: Optional[str] = Field(default=None, max_length=100)
    descripcion: Optional[str] = None
    tipo_tramite: str
    id_tipo_unidad_receptora: int


class TipoUnidadReceptoraRequest(BaseModel):
    nombre: str = Field(min_length=2, max_length=150)
    descripcion: str | None = None
    activo: bool = True


def _tipo_unidad_response(tipo: TipoUnidadReceptoraModel) -> dict:
    return {
        "id_tipo_unidad_receptora": tipo.id_tipo_unidad_receptora,
        "nombre": tipo.nombre,
        "descripcion": tipo.descripcion,
        "activo": bool(tipo.activo),
    }


@router.get("/tipos-unidad-receptora")
def listar_tipos_unidad_receptora(
    incluir_inactivos: bool = False,
    db: Session = Depends(obtener_db),
):
    query = db.query(TipoUnidadReceptoraModel)
    if not incluir_inactivos:
        query = query.filter(TipoUnidadReceptoraModel.activo.is_(True))
    return [_tipo_unidad_response(tipo) for tipo in query.order_by(TipoUnidadReceptoraModel.nombre.asc()).all()]


@router.post(
    "/tipos-unidad-receptora",
    dependencies=[Depends(requerir_roles(["Coordinador de Unidades Receptoras", "Administrador"]))],
)
def crear_tipo_unidad_receptora(datos: TipoUnidadReceptoraRequest, db: Session = Depends(obtener_db)):
    nombre = " ".join(datos.nombre.split())
    if db.query(TipoUnidadReceptoraModel).filter(func.lower(TipoUnidadReceptoraModel.nombre) == nombre.lower()).first():
        raise HTTPException(status_code=400, detail="Ya existe un tipo de unidad receptora con ese nombre.")
    tipo = TipoUnidadReceptoraModel(nombre=nombre, descripcion=limpiar_texto(datos.descripcion), activo=datos.activo)
    db.add(tipo)
    db.commit()
    db.refresh(tipo)
    return _tipo_unidad_response(tipo)


@router.put(
    "/tipos-unidad-receptora/{id_tipo:int}",
    dependencies=[Depends(requerir_roles(["Coordinador de Unidades Receptoras", "Administrador"]))],
)
def editar_tipo_unidad_receptora(
    id_tipo: int,
    datos: TipoUnidadReceptoraRequest,
    db: Session = Depends(obtener_db),
):
    tipo = db.query(TipoUnidadReceptoraModel).filter(TipoUnidadReceptoraModel.id_tipo_unidad_receptora == id_tipo).first()
    if tipo is None:
        raise HTTPException(status_code=404, detail="Tipo de unidad receptora no encontrado.")
    nombre = " ".join(datos.nombre.split())
    duplicado = (
        db.query(TipoUnidadReceptoraModel)
        .filter(
            func.lower(TipoUnidadReceptoraModel.nombre) == nombre.lower(),
            TipoUnidadReceptoraModel.id_tipo_unidad_receptora != id_tipo,
        )
        .first()
    )
    if duplicado is not None:
        raise HTTPException(status_code=400, detail="Ya existe un tipo de unidad receptora con ese nombre.")
    tipo.nombre = nombre
    tipo.descripcion = limpiar_texto(datos.descripcion)
    tipo.activo = datos.activo
    db.commit()
    return _tipo_unidad_response(tipo)


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
    validar_registro_publico_habilitado(db)

    nombre_empresa = limpiar_texto(solicitud.nombre_empresa)
    if not nombre_empresa:
        raise HTTPException(status_code=400, detail="Nombre de empresa es obligatorio")

    rfc = normalizar_rfc(solicitud.rfc)
    giro = limpiar_texto(solicitud.giro)
    if not giro:
        raise HTTPException(status_code=400, detail="El giro o sector de actividad es obligatorio.")
    domicilio = limpiar_texto(solicitud.domicilio)
    telefono = normalizar_telefono(solicitud.telefono)
    correo_contacto = str(solicitud.correo_contacto).strip().lower()
    nombre_responsable = limpiar_texto(solicitud.nombre_responsable)
    apellido_paterno_responsable = limpiar_texto(solicitud.apellido_paterno_responsable)
    apellido_materno_responsable = limpiar_texto(solicitud.apellido_materno_responsable)
    cargo_responsable = limpiar_texto(solicitud.cargo_responsable)
    nombre_contacto_legacy = limpiar_texto(solicitud.nombre_contacto)
    cargo_contacto_legacy = limpiar_texto(solicitud.cargo_contacto)
    usa_responsable_separado = any(
        [
            nombre_responsable,
            apellido_paterno_responsable,
            apellido_materno_responsable,
            cargo_responsable,
        ]
    )
    if usa_responsable_separado:
        if not nombre_responsable:
            raise HTTPException(status_code=400, detail="El nombre del responsable es obligatorio.")
        if not apellido_paterno_responsable:
            raise HTTPException(
                status_code=400,
                detail="El apellido paterno del responsable es obligatorio.",
            )
        if not cargo_responsable:
            raise HTTPException(status_code=400, detail="El cargo del responsable es obligatorio.")
        nombre_contacto = " ".join(
            parte
            for parte in [
                nombre_responsable,
                apellido_paterno_responsable,
                apellido_materno_responsable,
            ]
            if parte
        )
        cargo_contacto = cargo_responsable
    else:
        nombre_contacto = nombre_contacto_legacy
        cargo_contacto = cargo_contacto_legacy
    descripcion = limpiar_texto(solicitud.descripcion)
    tipo_tramite = normalizar_opcion(solicitud.tipo_tramite, TIPOS_TRAMITE, "Tipo de tramite")
    tipo_unidad = (
        db.query(TipoUnidadReceptoraModel)
        .filter(
            TipoUnidadReceptoraModel.id_tipo_unidad_receptora == solicitud.id_tipo_unidad_receptora,
            TipoUnidadReceptoraModel.activo.is_(True),
        )
        .first()
    )
    if tipo_unidad is None:
        raise HTTPException(status_code=400, detail="Selecciona el tipo de unidad receptora.")

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
            id_tipo_unidad_receptora=tipo_unidad.id_tipo_unidad_receptora,
        )
        db.add(empresa)
        db.flush()
        db.add(
            ResponsableEmpresaModel(
                id_empresa=empresa.id_empresa,
                id_usuario=None,
                nombre=nombre_responsable or nombre_contacto or "Responsable",
                apellido_paterno=apellido_paterno_responsable or "Empresa",
                apellido_materno=apellido_materno_responsable,
                cargo=cargo_responsable or cargo_contacto,
                telefono=telefono,
                correo=correo_contacto,
            )
        )
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
        empresa.id_tipo_unidad_receptora = tipo_unidad.id_tipo_unidad_receptora
        responsable = (
            db.query(ResponsableEmpresaModel)
            .filter(ResponsableEmpresaModel.id_empresa == empresa.id_empresa)
            .order_by(ResponsableEmpresaModel.id_responsable.desc())
            .first()
        )
        if responsable is None:
            db.add(
                ResponsableEmpresaModel(
                    id_empresa=empresa.id_empresa,
                    id_usuario=None,
                    nombre=nombre_responsable or nombre_contacto or "Responsable",
                    apellido_paterno=apellido_paterno_responsable or "Empresa",
                    apellido_materno=apellido_materno_responsable,
                    cargo=cargo_responsable or cargo_contacto,
                    telefono=telefono,
                    correo=correo_contacto,
                )
            )
        else:
            responsable.nombre = nombre_responsable or nombre_contacto or responsable.nombre
            responsable.apellido_paterno = apellido_paterno_responsable or responsable.apellido_paterno
            responsable.apellido_materno = apellido_materno_responsable
            responsable.cargo = cargo_responsable or cargo_contacto
            responsable.telefono = telefono
            responsable.correo = correo_contacto

    db.add(
        SolicitudEmpresaModel(
            id_empresa=empresa.id_empresa,
            tipo_tramite_solicitado=tipo_tramite,
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
