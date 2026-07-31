from __future__ import annotations

import json
import re
import unicodedata

from sqlalchemy import func
from sqlalchemy.orm import Session

from infrastructure.persistence.models.alumno import AlumnoModel
from infrastructure.persistence.models.empresa import EmpresaModel
from infrastructure.persistence.models.registro_identidad_importacion import RegistroIdentidadImportacionModel


def _texto_normalizado(valor: object) -> str | None:
    texto = str(valor or "").strip()
    return texto or None


def _clave_nombre(valor: object) -> str | None:
    texto = _texto_normalizado(valor)
    if not texto:
        return None
    texto = unicodedata.normalize("NFKD", texto)
    texto = texto.encode("ascii", "ignore").decode("ascii").casefold()
    return re.sub(r"\s+", " ", texto).strip() or None


def _guardar_registro(
    db: Session,
    *,
    tipo_entidad: str,
    id_entidad: int,
    matricula: str | None = None,
    rfc: str | None = None,
    correo: str | None = None,
    nombre: str | None = None,
    datos: dict | None = None,
) -> RegistroIdentidadImportacionModel:
    registro = (
        db.query(RegistroIdentidadImportacionModel)
        .filter(
            RegistroIdentidadImportacionModel.tipo_entidad == tipo_entidad,
            RegistroIdentidadImportacionModel.id_entidad == id_entidad,
        )
        .first()
    )
    if registro is None:
        registro = RegistroIdentidadImportacionModel(
            tipo_entidad=tipo_entidad,
            id_entidad=id_entidad,
        )
        db.add(registro)

    registro.matricula = _texto_normalizado(matricula)
    registro.rfc = _texto_normalizado(rfc)
    registro.correo = _texto_normalizado(correo.casefold() if correo else None)
    registro.nombre = _clave_nombre(nombre)
    registro.datos_json = json.dumps(datos or {}, ensure_ascii=False)
    registro.fecha_archivo = func.now()
    registro.fecha_reutilizacion = None
    registro.activo = True
    db.flush()
    return registro


def archivar_empresa(db: Session, empresa: EmpresaModel) -> RegistroIdentidadImportacionModel:
    return _guardar_registro(
        db,
        tipo_entidad="empresa",
        id_entidad=empresa.id_empresa,
        rfc=empresa.rfc,
        correo=empresa.correo_contacto,
        nombre=empresa.nombre_empresa,
        datos={
            "nombre_empresa": empresa.nombre_empresa,
            "rfc": empresa.rfc,
            "correo_contacto": empresa.correo_contacto,
        },
    )


def archivar_alumno(
    db: Session,
    alumno: AlumnoModel,
    correo: str | None,
) -> RegistroIdentidadImportacionModel:
    return _guardar_registro(
        db,
        tipo_entidad="alumno",
        id_entidad=alumno.id_alumno,
        matricula=alumno.matricula,
        correo=correo,
        nombre=alumno.nombre,
        datos={
            "nombre": alumno.nombre,
            "matricula": alumno.matricula,
            "correo": correo,
        },
    )


def _id_disponible(db: Session, modelo, campo_id, id_entidad: int) -> bool:
    return db.query(modelo).filter(campo_id == id_entidad).first() is None


def buscar_id_empresa_reutilizable(
    db: Session,
    *,
    rfc: str | None,
    correo: str | None,
    nombre: str | None,
) -> tuple[int | None, RegistroIdentidadImportacionModel | None]:
    query = db.query(RegistroIdentidadImportacionModel).filter(
        RegistroIdentidadImportacionModel.tipo_entidad == "empresa",
        RegistroIdentidadImportacionModel.activo.is_(True),
    )
    registro = None
    if _texto_normalizado(rfc):
        registro = query.filter(
            func.upper(RegistroIdentidadImportacionModel.rfc) == _texto_normalizado(rfc).upper()
        ).order_by(RegistroIdentidadImportacionModel.id_registro_identidad.desc()).first()
    if registro is None and _texto_normalizado(correo):
        registro = query.filter(
            func.lower(RegistroIdentidadImportacionModel.correo) == _texto_normalizado(correo).lower()
        ).order_by(RegistroIdentidadImportacionModel.id_registro_identidad.desc()).first()
    if registro is None and _clave_nombre(nombre):
        registro = query.filter(
            RegistroIdentidadImportacionModel.nombre == _clave_nombre(nombre)
        ).order_by(RegistroIdentidadImportacionModel.id_registro_identidad.desc()).first()
    if registro and _id_disponible(db, EmpresaModel, EmpresaModel.id_empresa, registro.id_entidad):
        return registro.id_entidad, registro
    return None, None


def buscar_id_alumno_reutilizable(
    db: Session,
    *,
    matricula: str,
    correo: str | None,
) -> tuple[int | None, RegistroIdentidadImportacionModel | None]:
    query = db.query(RegistroIdentidadImportacionModel).filter(
        RegistroIdentidadImportacionModel.tipo_entidad == "alumno",
        RegistroIdentidadImportacionModel.activo.is_(True),
    )
    registro = query.filter(
        RegistroIdentidadImportacionModel.matricula == _texto_normalizado(matricula)
    ).order_by(RegistroIdentidadImportacionModel.id_registro_identidad.desc()).first()
    if registro is None and _texto_normalizado(correo):
        registro = query.filter(
            func.lower(RegistroIdentidadImportacionModel.correo) == _texto_normalizado(correo).lower()
        ).order_by(RegistroIdentidadImportacionModel.id_registro_identidad.desc()).first()
    if registro and _id_disponible(db, AlumnoModel, AlumnoModel.id_alumno, registro.id_entidad):
        return registro.id_entidad, registro
    return None, None


def marcar_id_reutilizado(registro: RegistroIdentidadImportacionModel | None) -> None:
    if registro is None:
        return
    registro.fecha_reutilizacion = func.now()
    registro.activo = False
