from __future__ import annotations

from typing import Any, Mapping

from sqlalchemy import func
from sqlalchemy.orm import Session

from infrastructure.persistence.models.empresa import EmpresaModel
from infrastructure.persistence.models.institucion_practicas import InstitucionPracticasModel


CAMPOS_COMPLETOS = {
    'domicilio', 'horario_atencion', 'nombre_contacto', 'cargo_contacto', 'area_contacto',
    'telefono_contacto', 'correo_contacto', 'areas_receptoras', 'numero_estudiantes',
    'perfil_academico', 'actividades', 'horario_practicas', 'modalidad', 'documento_pdf',
    'municipio', 'estado', 'observaciones', 'carta_colaboracion',
}


def _limpiar(valor: Any) -> Any:
    if not isinstance(valor, str):
        return valor
    valor = valor.strip()
    return valor or None


def sincronizar_institucion_practicas(
    db: Session,
    empresa: EmpresaModel,
    *,
    tipo_unidad: str | None = None,
    rfc_anterior: str | None = None,
    datos_completos: Mapping[str, Any] | None = None,
) -> InstitucionPracticasModel:
    '''Crea o actualiza la ficha completa sin borrar datos no incluidos.'''

    rfc = (_limpiar(empresa.rfc) or '').upper()
    telefono = _limpiar(empresa.telefono)
    correo = _limpiar(empresa.correo_contacto)
    if not rfc or not telefono or not correo:
        raise ValueError(
            'RFC, teléfono institucional y correo institucional son obligatorios.'
        )

    institucion = (
        db.query(InstitucionPracticasModel)
        .filter(func.upper(InstitucionPracticasModel.rfc) == rfc)
        .order_by(InstitucionPracticasModel.id.asc())
        .first()
    )
    if institucion is None and rfc_anterior:
        institucion = (
            db.query(InstitucionPracticasModel)
            .filter(func.upper(InstitucionPracticasModel.rfc) == rfc_anterior.upper())
            .order_by(InstitucionPracticasModel.id.asc())
            .first()
        )

    if institucion is None:
        institucion = (
            db.query(InstitucionPracticasModel)
            .filter(func.lower(InstitucionPracticasModel.correo_institucional) == correo.lower())
            .order_by(InstitucionPracticasModel.id.asc())
            .first()
        )
    if institucion is None:
        institucion = InstitucionPracticasModel(
            nombre_institucion=empresa.nombre_empresa,
            rfc=rfc,
            telefono_institucional=telefono,
            correo_institucional=correo,
        )
        db.add(institucion)

    institucion.nombre_institucion = empresa.nombre_empresa
    institucion.rfc = rfc
    institucion.telefono_institucional = telefono
    institucion.correo_institucional = correo
    domicilio = _limpiar(empresa.domicilio)
    institucion.domicilio = domicilio[:255] if domicilio else None
    institucion.estatus = empresa.estado_empresa or 'Activo'
    if tipo_unidad is not None:
        institucion.tipo_unidad = _limpiar(tipo_unidad)

    for campo, valor in (datos_completos or {}).items():
        if campo in CAMPOS_COMPLETOS:
            setattr(institucion, campo, _limpiar(valor))

    db.flush()
    return institucion
