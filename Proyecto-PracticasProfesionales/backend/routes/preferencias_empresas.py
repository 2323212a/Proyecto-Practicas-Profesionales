from fastapi import APIRouter, Depends, HTTPException
from datetime import date
from pydantic import BaseModel
from sqlalchemy import text
from sqlalchemy.orm import Session

from database.dependencies import obtener_db
from models.alumno import AlumnoModel
from models.carrera import CarreraModel
from models.empresa import EmpresaModel
from models.preferencia_empresa import PreferenciaEmpresaModel
from models.usuario import UsuarioModel
from models.vacante import Vacante
from routes.alumno_documentacion import obtener_usuario_actual, serializar_documentacion
from routes.empresas import sincronizar_vacante

router = APIRouter(tags=["Preferencias de Empresa"])


class PreferenciaSeleccion(BaseModel):
    id_empresa: int
    prioritaria: bool = False


class GuardarPreferenciasRequest(BaseModel):
    preferencias: list[PreferenciaSeleccion]


class ValidarPreferenciaRequest(BaseModel):
    estado: str


def nombre_completo(usuario: UsuarioModel | None):
    if usuario is None:
        return "Alumno"
    return " ".join([p for p in [usuario.nombre, usuario.apellido_paterno, usuario.apellido_materno] if p])


def obtener_alumno_actual(db: Session, usuario_actual: UsuarioModel):
    alumno = db.query(AlumnoModel).filter(AlumnoModel.id_usuario == usuario_actual.id_usuario).first()
    if alumno is None:
        raise HTTPException(status_code=404, detail="Alumno no encontrado")
    return alumno


def serializar_preferencia(db: Session, pref: PreferenciaEmpresaModel):
    empresa = db.query(EmpresaModel).filter(EmpresaModel.id_empresa == pref.id_empresa).first()
    vacante = db.query(Vacante).filter(Vacante.id_vacante == pref.id_vacante).first()
    alumno = db.query(AlumnoModel).filter(AlumnoModel.id_alumno == pref.id_alumno).first()
    usuario = db.query(UsuarioModel).filter(UsuarioModel.id_usuario == alumno.id_usuario).first() if alumno else None
    carrera = db.query(CarreraModel).filter(CarreraModel.id_carrera == alumno.id_carrera).first() if alumno else None
    return {
        "id_preferencia": pref.id_preferencia,
        "id_alumno": pref.id_alumno,
        "alumno": nombre_completo(usuario),
        "matricula": alumno.matricula if alumno else None,
        "carrera": carrera.nombre if carrera else None,
        "id_empresa": pref.id_empresa,
        "empresa": empresa.nombre_empresa if empresa else None,
        "id_vacante": pref.id_vacante,
        "titulo": vacante.titulo if vacante else None,
        "orden_preferencia": pref.orden_preferencia,
        "prioritaria": bool(pref.prioritaria),
        "estado_preferencia": pref.estado_preferencia,
        "cupo_disponible": vacante.cupo_disponible if vacante else 0,
        "cupo_total": vacante.cupo_total if vacante else 0,
        "fecha_registro": pref.fecha_registro,
    }


def validar_expediente_inicial(db: Session, alumno: AlumnoModel):
    documentacion = serializar_documentacion(db, alumno)
    if not documentacion["expediente"]["expediente_inicial_aprobado"]:
        raise HTTPException(status_code=403, detail="Primero deben aprobarse los 7 documentos iniciales")


@router.get("/alumno/padron-empresarial")
def obtener_padron_alumno(
    db: Session = Depends(obtener_db),
    usuario_actual: UsuarioModel = Depends(obtener_usuario_actual),
):
    alumno = obtener_alumno_actual(db, usuario_actual)
    documentacion = serializar_documentacion(db, alumno)
    if not documentacion["expediente"]["expediente_inicial_aprobado"]:
        return {
            "habilitado": False,
            "motivo": "Primero deben aprobarse los 7 documentos iniciales",
            "empresas": [],
            "preferencias": [],
        }

    empresas_activas = db.query(EmpresaModel).filter(EmpresaModel.estado_empresa == "Activa").all()
    for empresa_activa in empresas_activas:
        sincronizar_vacante(db, empresa_activa)
    db.commit()

    registros = (
        db.query(EmpresaModel, Vacante)
        .join(Vacante, Vacante.id_empresa == EmpresaModel.id_empresa)
        .filter(EmpresaModel.estado_empresa == "Activa", Vacante.estado_vacante == "Activa")
        .order_by(EmpresaModel.nombre_empresa)
        .all()
    )

    empresas = [
        {
            "id_empresa": empresa.id_empresa,
            "nombre_empresa": empresa.nombre_empresa,
            "giro": empresa.giro,
            "domicilio": empresa.domicilio,
            "telefono": empresa.telefono,
            "correo_contacto": empresa.correo_contacto,
            "estado_empresa": empresa.estado_empresa,
            "id_vacante": vacante.id_vacante,
            "titulo": vacante.titulo,
            "descripcion": vacante.descripcion,
            "modalidad": vacante.modalidad,
            "horario": vacante.horario,
            "cupo_total": vacante.cupo_total or 0,
            "cupo_disponible": vacante.cupo_disponible or 0,
        }
        for empresa, vacante in registros
    ]

    preferencias = db.query(PreferenciaEmpresaModel).filter(
        PreferenciaEmpresaModel.id_alumno == alumno.id_alumno,
        PreferenciaEmpresaModel.estado_preferencia.in_(["Pendiente", "Aprobada"]),
    ).order_by(PreferenciaEmpresaModel.orden_preferencia).all()

    return {
        "habilitado": True,
        "empresas": empresas,
        "preferencias": [serializar_preferencia(db, pref) for pref in preferencias],
    }


@router.post("/alumno/preferencias-empresa")
def guardar_preferencias_alumno(
    datos: GuardarPreferenciasRequest,
    db: Session = Depends(obtener_db),
    usuario_actual: UsuarioModel = Depends(obtener_usuario_actual),
):
    alumno = obtener_alumno_actual(db, usuario_actual)
    validar_expediente_inicial(db, alumno)

    if not 1 <= len(datos.preferencias) <= 3:
        raise HTTPException(status_code=400, detail="Debes seleccionar entre 1 y 3 empresas")

    ids = [p.id_empresa for p in datos.preferencias]
    if len(ids) != len(set(ids)):
        raise HTTPException(status_code=400, detail="No puedes repetir empresas")

    existentes = db.query(PreferenciaEmpresaModel).filter(
        PreferenciaEmpresaModel.id_alumno == alumno.id_alumno,
        PreferenciaEmpresaModel.estado_preferencia.in_(["Pendiente", "Aprobada"]),
    ).all()
    if any(pref.estado_preferencia == "Aprobada" for pref in existentes):
        raise HTTPException(status_code=400, detail="Ya tienes una empresa aprobada")

    for pref in existentes:
        vacante = db.query(Vacante).filter(Vacante.id_vacante == pref.id_vacante).with_for_update().first()
        if vacante:
            vacante.cupo_disponible = (vacante.cupo_disponible or 0) + 1
        pref.estado_preferencia = "Cancelada"

    nuevas = []
    for index, seleccion in enumerate(datos.preferencias, start=1):
        empresa = db.query(EmpresaModel).filter(EmpresaModel.id_empresa == seleccion.id_empresa).first()
        if empresa is not None:
            sincronizar_vacante(db, empresa)
        vacante = (
            db.query(Vacante)
            .filter(Vacante.id_empresa == seleccion.id_empresa, Vacante.estado_vacante == "Activa")
            .with_for_update()
            .first()
        )
        if empresa is None or empresa.estado_empresa != "Activa" or vacante is None:
            raise HTTPException(status_code=404, detail="Empresa no disponible")
        if (vacante.cupo_disponible or 0) <= 0:
            raise HTTPException(status_code=400, detail=f"La empresa {empresa.nombre_empresa} ya no tiene vacantes")

        vacante.cupo_disponible = (vacante.cupo_disponible or 0) - 1
        pref = PreferenciaEmpresaModel(
            id_alumno=alumno.id_alumno,
            id_empresa=empresa.id_empresa,
            id_vacante=vacante.id_vacante,
            orden_preferencia=index,
            prioritaria=seleccion.prioritaria,
            estado_preferencia="Pendiente",
        )
        db.add(pref)
        nuevas.append(pref)

    db.commit()
    for pref in nuevas:
        db.refresh(pref)

    return {
        "mensaje": "Preferencias enviadas al Coordinador de Practicas",
        "preferencias": [serializar_preferencia(db, pref) for pref in nuevas],
    }


@router.get("/coordinador/asignaciones/preferencias")
def listar_preferencias_coordinador(db: Session = Depends(obtener_db)):
    preferencias = db.query(PreferenciaEmpresaModel).filter(
        PreferenciaEmpresaModel.estado_preferencia == "Pendiente"
    ).order_by(PreferenciaEmpresaModel.fecha_registro, PreferenciaEmpresaModel.orden_preferencia).all()
    return [serializar_preferencia(db, pref) for pref in preferencias]


@router.patch("/coordinador/asignaciones/preferencias/{id_preferencia}")
def validar_preferencia_coordinador(
    id_preferencia: int,
    datos: ValidarPreferenciaRequest,
    db: Session = Depends(obtener_db),
):
    if datos.estado not in ["Aprobada", "Rechazada"]:
        raise HTTPException(status_code=400, detail="Estado invalido")

    pref = db.query(PreferenciaEmpresaModel).filter(
        PreferenciaEmpresaModel.id_preferencia == id_preferencia
    ).first()
    if pref is None:
        raise HTTPException(status_code=404, detail="Preferencia no encontrada")
    if pref.estado_preferencia != "Pendiente":
        raise HTTPException(status_code=400, detail="La preferencia ya fue atendida")

    if datos.estado == "Aprobada":
        pref.estado_preferencia = "Aprobada"
        otras = db.query(PreferenciaEmpresaModel).filter(
            PreferenciaEmpresaModel.id_alumno == pref.id_alumno,
            PreferenciaEmpresaModel.id_preferencia != pref.id_preferencia,
            PreferenciaEmpresaModel.estado_preferencia == "Pendiente",
        ).all()
        for otra in otras:
            vacante = db.query(Vacante).filter(Vacante.id_vacante == otra.id_vacante).with_for_update().first()
            if vacante:
                vacante.cupo_disponible = (vacante.cupo_disponible or 0) + 1
            otra.estado_preferencia = "Rechazada"
        alumno = db.query(AlumnoModel).filter(AlumnoModel.id_alumno == pref.id_alumno).first()
        if alumno:
            alumno.estado_alumno = "Asignado"

        convocatoria_id = db.execute(text("SELECT id_convocatoria FROM convocatoria ORDER BY id_convocatoria DESC LIMIT 1")).scalar() or 1
        asignacion_existente = db.execute(
            text(
                """
                SELECT id_asignacion
                FROM asignacion
                WHERE id_alumno = :id_alumno
                  AND id_empresa = :id_empresa
                  AND id_vacante = :id_vacante
                  AND estado_asignacion = 'Activa'
                LIMIT 1
                """
            ),
            {"id_alumno": pref.id_alumno, "id_empresa": pref.id_empresa, "id_vacante": pref.id_vacante},
        ).scalar()
        if asignacion_existente is None:
            db.execute(
                text(
                    """
                    INSERT INTO asignacion
                        (id_alumno, id_empresa, id_vacante, id_convocatoria, fecha_asignacion, estado_asignacion, tipo_asignacion)
                    VALUES
                        (:id_alumno, :id_empresa, :id_vacante, :id_convocatoria, :fecha_asignacion, 'Activa', 'Normal')
                    """
                ),
                {
                    "id_alumno": pref.id_alumno,
                    "id_empresa": pref.id_empresa,
                    "id_vacante": pref.id_vacante,
                    "id_convocatoria": convocatoria_id,
                    "fecha_asignacion": date.today(),
                },
            )
    else:
        pref.estado_preferencia = "Rechazada"
        vacante = db.query(Vacante).filter(Vacante.id_vacante == pref.id_vacante).with_for_update().first()
        if vacante:
            vacante.cupo_disponible = (vacante.cupo_disponible or 0) + 1

    db.commit()
    db.refresh(pref)
    return serializar_preferencia(db, pref)