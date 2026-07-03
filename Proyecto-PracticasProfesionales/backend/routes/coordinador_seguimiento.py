from datetime import date, datetime, timedelta
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy import text
from sqlalchemy.orm import Session

from database.dependencies import obtener_db

router = APIRouter(prefix="/coordinador/seguimiento", tags=["Coordinador Seguimiento"])

REPORTES_REQUERIDOS = 5
HORAS_REQUERIDAS = 480
DURACION_PRACTICAS_DIAS = 90


class ObservacionRequest(BaseModel):
    tipo: str = "Seguimiento"
    mensaje: str


def calcular_estado(reportes_entregados: int, avance: int, horas_deberia_llevar: int, horas_registradas: int):
    if avance >= 100:
        return "Listo para liberacion"
    if horas_registradas < horas_deberia_llevar or reportes_entregados == 0:
        return "Requiere seguimiento"
    if reportes_entregados < REPORTES_REQUERIDOS:
        return "Con observaciones"
    return "Al corriente"


def buscar_asignacion(db: Session, id_alumno: int, id_empresa: int, id_vacante: int):
    return db.execute(
        text(
            """
            SELECT id_asignacion, fecha_asignacion, estado_asignacion
            FROM asignacion
            WHERE id_alumno = :id_alumno
              AND id_empresa = :id_empresa
              AND id_vacante = :id_vacante
            ORDER BY id_asignacion DESC
            LIMIT 1
            """
        ),
        {"id_alumno": id_alumno, "id_empresa": id_empresa, "id_vacante": id_vacante},
    ).mappings().first()


def contar_reportes(db: Session, id_asignacion: int | None):
    if id_asignacion is None:
        return {"total": 0, "entregados": 0, "pendientes": REPORTES_REQUERIDOS}

    total = db.execute(
        text("SELECT COUNT(*) FROM reporte WHERE id_asignacion = :id_asignacion"),
        {"id_asignacion": id_asignacion},
    ).scalar() or 0
    entregados = db.execute(
        text(
            """
            SELECT COUNT(*)
            FROM reporte
            WHERE id_asignacion = :id_asignacion
              AND estado_reporte IN ('Entregado', 'Aprobado', 'Validado')
            """
        ),
        {"id_asignacion": id_asignacion},
    ).scalar() or 0
    if total > 0 and entregados == 0:
        entregados = total
    return {
        "total": int(total),
        "entregados": int(entregados),
        "pendientes": max(REPORTES_REQUERIDOS - int(entregados), 0),
    }


def normalizar_fecha(valor):
    if isinstance(valor, datetime):
        return valor.date()
    if isinstance(valor, date):
        return valor
    return date.today()


def construir_alumno_seguimiento(db: Session, pref):
    nombre = " ".join(
        parte for parte in [pref["nombre"], pref["apellido_paterno"], pref["apellido_materno"]] if parte
    ) or "Alumno"
    asignacion = buscar_asignacion(db, pref["id_alumno"], pref["id_empresa"], pref["id_vacante"])
    reportes = contar_reportes(db, asignacion["id_asignacion"] if asignacion else None)
    inicio = normalizar_fecha(asignacion["fecha_asignacion"] if asignacion else pref["fecha_actualizacion"])
    fin = inicio + timedelta(days=DURACION_PRACTICAS_DIAS)
    dias_transcurridos = max((date.today() - inicio).days, 0)
    progreso_tiempo = min(dias_transcurridos / DURACION_PRACTICAS_DIAS, 1)
    horas_deberia_llevar = round(progreso_tiempo * HORAS_REQUERIDAS)
    avance = min(round((reportes["entregados"] / REPORTES_REQUERIDOS) * 100), 100)
    horas_registradas = min(round((avance / 100) * HORAS_REQUERIDAS), HORAS_REQUERIDAS)
    horas_faltantes = max(horas_deberia_llevar - horas_registradas, 0)
    estado = calcular_estado(reportes["entregados"], avance, horas_deberia_llevar, horas_registradas)

    return {
        "id_preferencia": pref["id_preferencia"],
        "id_alumno": pref["id_alumno"],
        "id_usuario": pref["id_usuario"],
        "id_asignacion": asignacion["id_asignacion"] if asignacion else None,
        "alumno": nombre,
        "matricula": pref["matricula"],
        "semestre": pref["semestre"],
        "grupo": pref["grupo"],
        "carrera": pref["carrera"],
        "empresa": pref["nombre_empresa"],
        "vacante": pref["vacante"],
        "modalidad": pref["modalidad"],
        "horario": pref["horario"],
        "periodo": "Convocatoria actual",
        "fecha_inicio": inicio.isoformat(),
        "fecha_fin": fin.isoformat(),
        "dias_transcurridos": dias_transcurridos,
        "dias_totales": DURACION_PRACTICAS_DIAS,
        "reportes_entregados": reportes["entregados"],
        "reportes_requeridos": REPORTES_REQUERIDOS,
        "reportes_total": reportes["total"],
        "horas_registradas": horas_registradas,
        "horas_deberia_llevar": horas_deberia_llevar,
        "horas_faltantes": horas_faltantes,
        "horas_requeridas": HORAS_REQUERIDAS,
        "avance": avance,
        "estado": estado,
    }


def obtener_preferencias_aprobadas(db: Session):
    return db.execute(
        text(
            """
            SELECT
                p.id_preferencia,
                p.id_alumno,
                p.id_empresa,
                p.id_vacante,
                p.fecha_actualizacion,
                a.id_usuario,
                a.matricula,
                a.semestre,
                a.grupo,
                u.nombre,
                u.apellido_paterno,
                u.apellido_materno,
                c.nombre AS carrera,
                e.nombre_empresa,
                v.titulo AS vacante,
                v.modalidad,
                v.horario
            FROM preferencia_empresa p
            JOIN alumno a ON a.id_alumno = p.id_alumno
            LEFT JOIN usuario u ON u.id_usuario = a.id_usuario
            LEFT JOIN carrera c ON c.id_carrera = a.id_carrera
            JOIN empresa e ON e.id_empresa = p.id_empresa
            LEFT JOIN vacante v ON v.id_vacante = p.id_vacante
            WHERE p.estado_preferencia = 'Aprobada'
            ORDER BY p.fecha_actualizacion DESC, p.id_preferencia DESC
            """
        )
    ).mappings().all()


@router.get("")
def obtener_seguimiento(db: Session = Depends(obtener_db)):
    alumnos = []
    pendientes = []
    empresas = set()
    estados = set()

    for pref in obtener_preferencias_aprobadas(db):
        alumno = construir_alumno_seguimiento(db, pref)
        empresas.add(alumno["empresa"])
        estados.add(alumno["estado"])

        if alumno["estado"] == "Requiere seguimiento":
            if alumno["horas_faltantes"] > 0:
                pendientes.append(f"{alumno['alumno']} lleva {alumno['horas_faltantes']} horas menos de las esperadas.")
            else:
                pendientes.append(f"{alumno['alumno']} no tiene reportes registrados.")
        elif alumno["estado"] == "Con observaciones":
            pendientes.append(f"{alumno['alumno']} tiene reportes pendientes.")
        elif alumno["estado"] == "Listo para liberacion":
            pendientes.append(f"{alumno['alumno']} esta listo para pasar a liberacion.")

        alumnos.append(alumno)

    resumen = {
        "total": len(alumnos),
        "al_corriente": sum(1 for alumno in alumnos if alumno["estado"] == "Al corriente"),
        "con_observaciones": sum(1 for alumno in alumnos if alumno["estado"] == "Con observaciones"),
        "requiere_seguimiento": sum(1 for alumno in alumnos if alumno["estado"] == "Requiere seguimiento"),
        "listos_liberacion": sum(1 for alumno in alumnos if alumno["estado"] == "Listo para liberacion"),
    }

    return {
        "resumen": resumen,
        "filtros": {
            "empresas": sorted(empresas),
            "estados": sorted(estados),
        },
        "pendientes": pendientes[:6],
        "alumnos": alumnos,
    }


@router.get("/alumnos/{id_alumno}")
def obtener_detalle_alumno(id_alumno: int, db: Session = Depends(obtener_db)):
    pref = next((p for p in obtener_preferencias_aprobadas(db) if p["id_alumno"] == id_alumno), None)
    if pref is None:
        raise HTTPException(status_code=404, detail="Alumno sin asignacion aprobada")
    return construir_alumno_seguimiento(db, pref)


@router.post("/alumnos/{id_alumno}/observaciones")
def registrar_observacion(id_alumno: int, datos: ObservacionRequest, db: Session = Depends(obtener_db)):
    pref = next((p for p in obtener_preferencias_aprobadas(db) if p["id_alumno"] == id_alumno), None)
    if pref is None:
        raise HTTPException(status_code=404, detail="Alumno sin asignacion aprobada")
    alumno = construir_alumno_seguimiento(db, pref)
    mensaje = datos.mensaje.strip()
    if not mensaje:
        raise HTTPException(status_code=400, detail="La observacion no puede estar vacia")

    titulo = f"Observacion de seguimiento: {datos.tipo}"
    db.execute(
        text(
            """
            INSERT INTO notificacion (id_usuario, titulo, mensaje, leida, fecha_envio)
            VALUES (:id_usuario, :titulo, :mensaje, 0, NOW())
            """
        ),
        {
            "id_usuario": alumno["id_usuario"],
            "titulo": titulo,
            "mensaje": mensaje,
        },
    )
    db.commit()
    return {"mensaje": "Observacion enviada al alumno", "alumno": alumno["alumno"], "titulo": titulo}