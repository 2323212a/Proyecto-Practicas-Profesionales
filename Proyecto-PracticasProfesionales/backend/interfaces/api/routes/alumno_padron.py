from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session, joinedload

from infrastructure.database.dependencies import obtener_db
from infrastructure.security.auth_dependencies import obtener_id_alumno_actual, requerir_alumno_actual_o_roles
from infrastructure.persistence.models.alumno import AlumnoModel
from infrastructure.persistence.models.asignacion import AsignacionModel
from infrastructure.persistence.models.empresa import EmpresaModel
from infrastructure.persistence.models.seleccion_empresa import SeleccionEmpresaModel
from infrastructure.persistence.models.vacante import VacanteModel


router = APIRouter(
    prefix="/alumno/padron",
    tags=["Alumno - Padron"],
    dependencies=[Depends(requerir_alumno_actual_o_roles(["Administrador"]))],
)


class PreferenciaEmpresa(BaseModel):
    id_empresa: int
    prioridad: int = Field(ge=1, le=3)


class GuardarPreferenciasRequest(BaseModel):
    preferencias: list[PreferenciaEmpresa] = Field(min_length=1, max_length=3)
    id_empresa_prioritaria: int | None = None


@router.get("/me/")
def obtener_mi_padron_alumno(
    id_alumno: int = Depends(obtener_id_alumno_actual),
    db: Session = Depends(obtener_db),
):
    return obtener_padron_alumno(id_alumno, db)


@router.put("/me/preferencias")
def guardar_mis_preferencias_alumno(
    datos: GuardarPreferenciasRequest,
    id_alumno: int = Depends(obtener_id_alumno_actual),
    db: Session = Depends(obtener_db),
):
    return guardar_preferencias_alumno(id_alumno, datos, db)


@router.get("/{id_alumno:int}")
def obtener_padron_alumno(id_alumno: int, db: Session = Depends(obtener_db)):
    alumno = db.query(AlumnoModel).filter(AlumnoModel.id_alumno == id_alumno).first()
    if alumno is None:
        raise HTTPException(status_code=404, detail="Alumno no encontrado")

    empresas = (
        db.query(EmpresaModel)
        .filter(EmpresaModel.estado_empresa == "Activa")
        .order_by(EmpresaModel.nombre_empresa.asc())
        .all()
    )

    vacantes = (
        db.query(VacanteModel)
        .options(
            joinedload(VacanteModel.empresa),
            joinedload(VacanteModel.carrera),
        )
        .join(EmpresaModel, EmpresaModel.id_empresa == VacanteModel.id_empresa)
        .filter(
            EmpresaModel.estado_empresa == "Activa",
            VacanteModel.estado_vacante == "Activa",
            VacanteModel.cupo_disponible > 0,
        )
        .order_by(EmpresaModel.nombre_empresa.asc(), VacanteModel.titulo.asc())
        .all()
    )

    selecciones = (
        db.query(SeleccionEmpresaModel)
        .filter(SeleccionEmpresaModel.id_alumno == id_alumno)
        .order_by(SeleccionEmpresaModel.prioridad.asc())
        .all()
    )

    asignacion = (
        db.query(AsignacionModel)
        .options(
            joinedload(AsignacionModel.empresa),
            joinedload(AsignacionModel.vacante),
        )
        .filter(
            AsignacionModel.id_alumno == id_alumno,
            AsignacionModel.estado_asignacion == "Activa",
        )
        .order_by(AsignacionModel.fecha_asignacion.desc())
        .first()
    )

    puede_seleccionar = alumno.estado_alumno == "Elegible"
    motivo_bloqueo = None
    if not puede_seleccionar:
        if alumno.estado_alumno == "Asignado":
            motivo_bloqueo = "Ya tienes una empresa asignada para esta convocatoria."
        else:
            motivo_bloqueo = (
                "Tu expediente documental debe estar aprobado por coordinacion "
                "antes de seleccionar empresa."
            )

    return {
        "puede_seleccionar": puede_seleccionar,
        "motivo_bloqueo": motivo_bloqueo,
        "estado_alumno": alumno.estado_alumno,
        "empresa_asignada": (
            {
                "id_empresa": asignacion.empresa.id_empresa,
                "nombre": asignacion.empresa.nombre_empresa,
                "giro": asignacion.empresa.giro,
                "domicilio": asignacion.empresa.domicilio,
                "correo_contacto": asignacion.empresa.correo_contacto,
                "telefono": asignacion.empresa.telefono,
                "vacante": asignacion.vacante.titulo if asignacion.vacante else None,
                "modalidad": asignacion.vacante.modalidad if asignacion.vacante else None,
                "horario": asignacion.vacante.horario if asignacion.vacante else None,
                "fecha_asignacion": asignacion.fecha_asignacion,
            }
            if asignacion and asignacion.empresa
            else None
        ),
        "empresas": [
            {
                "id_empresa": empresa.id_empresa,
                "nombre": empresa.nombre_empresa,
                "giro": empresa.giro,
                "domicilio": empresa.domicilio,
                "correo_contacto": empresa.correo_contacto,
                "telefono": empresa.telefono,
            }
            for empresa in empresas
        ],
        "vacantes": [
            {
                "id_vacante": vacante.id_vacante,
                "id_empresa": vacante.id_empresa,
                "empresa": vacante.empresa.nombre_empresa if vacante.empresa else "Sin empresa",
                "giro": vacante.empresa.giro if vacante.empresa else None,
                "domicilio": vacante.empresa.domicilio if vacante.empresa else None,
                "correo_contacto": vacante.empresa.correo_contacto if vacante.empresa else None,
                "telefono": vacante.empresa.telefono if vacante.empresa else None,
                "titulo": vacante.titulo,
                "descripcion": vacante.descripcion,
                "modalidad": vacante.modalidad,
                "horario": vacante.horario,
                "cupo_disponible": vacante.cupo_disponible,
                "cupo_total": vacante.cupo_total,
                "carrera": vacante.carrera.nombre if vacante.carrera else "Sin carrera",
            }
            for vacante in vacantes
        ],
        "selecciones": [
            {
                "id_empresa": seleccion.id_empresa,
                "prioridad": seleccion.prioridad,
            }
            for seleccion in selecciones
        ],
    }


@router.put("/{id_alumno:int}/preferencias")
def guardar_preferencias_alumno(
    id_alumno: int,
    datos: GuardarPreferenciasRequest,
    db: Session = Depends(obtener_db),
):
    alumno = db.query(AlumnoModel).filter(AlumnoModel.id_alumno == id_alumno).first()
    if alumno is None:
        raise HTTPException(status_code=404, detail="Alumno no encontrado")
    if alumno.estado_alumno != "Elegible":
        raise HTTPException(
            status_code=400,
            detail="El expediente documental debe estar aprobado antes de guardar preferencias",
        )

    ids_empresas = [preferencia.id_empresa for preferencia in datos.preferencias]
    prioridades = [preferencia.prioridad for preferencia in datos.preferencias]

    if len(ids_empresas) != len(set(ids_empresas)):
        raise HTTPException(status_code=400, detail="No se puede repetir la misma empresa")
    if len(prioridades) != len(set(prioridades)):
        raise HTTPException(status_code=400, detail="No se puede repetir la prioridad")
    if datos.id_empresa_prioritaria is not None and datos.id_empresa_prioritaria not in ids_empresas:
        raise HTTPException(
            status_code=400,
            detail="La empresa prioritaria debe estar dentro de las preferencias",
        )

    empresas_activas = {
        empresa.id_empresa
        for empresa in db.query(EmpresaModel)
        .filter(
            EmpresaModel.id_empresa.in_(ids_empresas),
            EmpresaModel.estado_empresa == "Activa",
        )
        .all()
    }
    if set(ids_empresas) != empresas_activas:
        raise HTTPException(
            status_code=400,
            detail="Todas las empresas seleccionadas deben estar activas en el padrón",
        )

    vacantes_disponibles = {
        id_empresa
        for (id_empresa,) in db.query(VacanteModel.id_empresa)
        .filter(
            VacanteModel.id_empresa.in_(ids_empresas),
            VacanteModel.estado_vacante == "Activa",
            VacanteModel.cupo_disponible > 0,
        )
        .distinct()
        .all()
    }
    if set(ids_empresas) != vacantes_disponibles:
        raise HTTPException(
            status_code=400,
            detail="Todas las empresas seleccionadas deben tener vacantes disponibles",
        )

    db.query(SeleccionEmpresaModel).filter(
        SeleccionEmpresaModel.id_alumno == id_alumno
    ).delete()

    for preferencia in datos.preferencias:
        db.add(
            SeleccionEmpresaModel(
                id_alumno=id_alumno,
                id_empresa=preferencia.id_empresa,
                prioridad=preferencia.prioridad,
            )
        )

    db.commit()

    return {"mensaje": "Preferencias guardadas correctamente"}
