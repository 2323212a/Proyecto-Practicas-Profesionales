from fastapi import APIRouter, Depends,  HTTPException
from sqlalchemy.orm import Session
from interfaces.api.schemas.usuario import UsuarioCreate, UsuarioResponse, UsuarioUpdate
from interfaces.api.schemas.usuario_perfil import UsuarioPerfilResponse, UsuarioPerfilUpdate
from infrastructure.database.dependencies import obtener_db
from interfaces.api.service_factory import UsuarioService
from infrastructure.persistence.models.alumno import AlumnoModel
from infrastructure.persistence.models.coordinador import CoordinadorModel
from infrastructure.persistence.models.docente_asesor import DocenteAsesorModel
from infrastructure.persistence.models.responsable_empresa import ResponsableEmpresaModel
from infrastructure.persistence.models.usuario import UsuarioModel
from infrastructure.security.auth_dependencies import requerir_roles


router = APIRouter(
    prefix="/usuarios",
    tags=["Usuarios"],
    dependencies=[Depends(requerir_roles(["Administrador"]))]
)


def _obtener_usuario_model(db: Session, id_usuario: int):
    usuario = db.query(UsuarioModel).filter(
        UsuarioModel.id_usuario == id_usuario
    ).first()
    if usuario is None:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")
    return usuario


def _perfil_tipo_por_rol(id_rol: int):
    return {
        1: "Alumno",
        3: "Coordinador",
        4: "Coordinador",
        5: "Unidad Receptora",
        6: "Asesor Interno",
    }.get(id_rol, "Sin perfil editable")


def _model_to_dict(model, campos):
    if model is None:
        return None
    return {campo: getattr(model, campo) for campo in campos}


@router.get(
    "/",
    response_model=list[UsuarioResponse]
)
def listar_usuarios(
    db: Session = Depends(obtener_db)
):
    return UsuarioService(db).listar()


@router.get("/{id_usuario}", response_model=UsuarioResponse)
def obtener_usuario(
    id_usuario: int,
    db: Session = Depends(obtener_db)
):
    usuario = UsuarioService(db).obtener_por_id(id_usuario)

    if usuario is None:
        raise HTTPException(
            status_code=404,
            detail="Usuario no encontrado"
        )

    return usuario


@router.get("/{id_usuario}/perfil", response_model=UsuarioPerfilResponse)
def obtener_perfil_usuario(
    id_usuario: int,
    db: Session = Depends(obtener_db)
):
    usuario = _obtener_usuario_model(db, id_usuario)
    tipo = _perfil_tipo_por_rol(usuario.id_rol)

    if usuario.id_rol == 1:
        return {
            "tipo": tipo,
            "datos": _model_to_dict(
                usuario.alumno,
                [
                    "id_alumno",
                    "id_usuario",
                    "id_carrera",
                    "matricula",
                    "semestre",
                    "grupo",
                    "creditos_aprobados",
                    "estado_alumno",
                ],
            ),
        }

    if usuario.id_rol in (3, 4):
        return {
            "tipo": tipo,
            "datos": _model_to_dict(
                usuario.coordinador,
                ["id_coordinador", "id_usuario", "area", "departamento"],
            ),
        }

    if usuario.id_rol == 5:
        return {
            "tipo": tipo,
            "datos": _model_to_dict(
                usuario.responsable_empresa,
                ["id_responsable", "id_usuario", "id_empresa", "cargo", "telefono"],
            ),
        }

    if usuario.id_rol == 6:
        return {
            "tipo": tipo,
            "datos": _model_to_dict(
                usuario.docente,
                ["id_docente", "id_usuario", "departamento"],
            ),
        }

    return {"tipo": tipo, "datos": None}


@router.put("/{id_usuario}/perfil", response_model=UsuarioPerfilResponse)
def actualizar_perfil_usuario(
    id_usuario: int,
    datos: UsuarioPerfilUpdate,
    db: Session = Depends(obtener_db)
):
    usuario = _obtener_usuario_model(db, id_usuario)
    payload = datos.model_dump(exclude_unset=True)

    if usuario.id_rol == 1:
        perfil = usuario.alumno
        if perfil is None:
            if not payload.get("id_carrera") or not payload.get("matricula"):
                raise HTTPException(
                    status_code=400,
                    detail="Alumno requiere id_carrera y matricula"
                )
            perfil = AlumnoModel(
                id_usuario=id_usuario,
                id_carrera=payload["id_carrera"],
                matricula=payload["matricula"],
                creditos_aprobados=payload.get("creditos_aprobados", 0),
                estado_alumno=payload.get("estado_alumno", "Activo"),
            )
            db.add(perfil)

        for campo in [
            "id_carrera",
            "matricula",
            "semestre",
            "grupo",
            "creditos_aprobados",
            "estado_alumno",
        ]:
            if campo in payload:
                setattr(perfil, campo, payload[campo])

    elif usuario.id_rol in (3, 4):
        perfil = usuario.coordinador
        if perfil is None:
            perfil = CoordinadorModel(id_usuario=id_usuario)
            db.add(perfil)

        for campo in ["area", "departamento"]:
            if campo in payload:
                setattr(perfil, campo, payload[campo])

    elif usuario.id_rol == 5:
        perfil = usuario.responsable_empresa
        if perfil is None:
            if not payload.get("id_empresa"):
                raise HTTPException(
                    status_code=400,
                    detail="Unidad Receptora requiere id_empresa"
                )
            perfil = ResponsableEmpresaModel(
                id_usuario=id_usuario,
                id_empresa=payload["id_empresa"],
            )
            db.add(perfil)

        for campo in ["id_empresa", "cargo", "telefono"]:
            if campo in payload:
                setattr(perfil, campo, payload[campo])

    elif usuario.id_rol == 6:
        perfil = usuario.docente
        if perfil is None:
            perfil = DocenteAsesorModel(
                id_usuario=id_usuario,
                departamento=payload.get("departamento") or "Sin departamento",
            )
            db.add(perfil)

        if "departamento" in payload:
            perfil.departamento = payload["departamento"] or "Sin departamento"

    else:
        raise HTTPException(
            status_code=400,
            detail="Este rol no tiene perfil editable"
        )

    db.commit()
    db.refresh(usuario)
    return obtener_perfil_usuario(id_usuario, db)


@router.post(
    "/",
    response_model=UsuarioResponse
)
def crear_usuario(
    usuario: UsuarioCreate,
    db: Session = Depends(obtener_db)
):
    return UsuarioService(db).crear(usuario)

@router.patch("/{id_usuario}/estado", response_model=UsuarioResponse)
def cambiar_estado_usuario(
    id_usuario: int,
    db: Session = Depends(obtener_db)
):
    usuario = UsuarioService(db).cambiar_estado(id_usuario)

    if usuario is None:
        raise HTTPException(
            status_code=404,
            detail="Usuario no encontrado"
        )

    return usuario

@router.delete("/{id_usuario}")
def eliminar_usuario(
    id_usuario: int,
    db: Session = Depends(obtener_db)
):
    usuario = UsuarioService(db).eliminar(id_usuario)

    if usuario is None:
        raise HTTPException(
            status_code=404,
            detail="Usuario no encontrado"
        )

    return {"mensaje": "Usuario eliminado correctamente"}

@router.put("/{id_usuario}", response_model=UsuarioResponse)
def actualizar_usuario(
    id_usuario: int,
    datos: UsuarioUpdate,
    db: Session = Depends(obtener_db)
):
    usuario = UsuarioService(db).actualizar(id_usuario, datos)

    if usuario is None:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")

    return usuario
