from datetime import datetime
from pathlib import Path

from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import FileResponse
from pydantic import BaseModel
from sqlalchemy.orm import Session

from database.dependencies import obtener_db
from models.alumno import AlumnoModel
from models.carrera import CarreraModel
from models.documento import DocumentoModel
from models.expediente import ExpedienteModel
from models.tipo_documento import TipoDocumentoModel
from models.usuario import UsuarioModel
from routes.alumno_documentacion import (
    UPLOAD_DIR,
    asegurar_documentos_expediente,
    crear_pdf_placeholder,
    documentos_del_flujo,
    generar_nomenclatura,
    serializar_documentacion,
)

router = APIRouter(prefix="/coordinador/documentos", tags=["Coordinador Documentos"])


class CambiarEstadoDocumentoRequest(BaseModel):
    estado: str
    comentario: str | None = None


def nombre_completo(usuario: UsuarioModel | None):
    if usuario is None:
        return "Alumno"
    return " ".join(parte for parte in [usuario.nombre, usuario.apellido_paterno, usuario.apellido_materno] if parte)


def resumen_documentos(documentos):
    return {
        "aprobados": sum(1 for d in documentos if d.estado_documento == "Aprobado"),
        "cargados": sum(1 for d in documentos if d.nombre_archivo),
        "revision": sum(1 for d in documentos if d.nombre_archivo and d.estado_documento == "Pendiente"),
        "observados": sum(1 for d in documentos if d.estado_documento in ["Observado", "Rechazado"]),
        "total": len(documentos),
    }



@router.get("/dashboard")
def obtener_dashboard_coordinador(db: Session = Depends(obtener_db)):
    alumnos = db.query(AlumnoModel).order_by(AlumnoModel.id_alumno).all()
    total_documentos = 0
    aprobados = 0
    en_revision = 0
    observados = 0
    pendientes = 0
    expedientes_aprobados = 0
    alumnos_en_revision = 0
    recientes = []

    for alumno in alumnos:
        expediente = asegurar_documentos_expediente(db, alumno)
        usuario = db.query(UsuarioModel).filter(UsuarioModel.id_usuario == alumno.id_usuario).first()
        carrera = db.query(CarreraModel).filter(CarreraModel.id_carrera == alumno.id_carrera).first()
        filas = documentos_del_flujo(db, expediente)
        documentos = [documento for documento, _ in filas]
        resumen = resumen_documentos(documentos)

        total_documentos += resumen["total"]
        aprobados += resumen["aprobados"]
        en_revision += resumen["revision"]
        observados += resumen["observados"]
        pendientes += sum(1 for documento in documentos if not documento.nombre_archivo)

        iniciales = [documento for documento, tipo in filas if tipo.etapa in ["elegibilidad", "expediente"]]
        if iniciales and all(documento.estado_documento == "Aprobado" for documento in iniciales):
            expedientes_aprobados += 1
        if resumen["revision"] > 0 or resumen["observados"] > 0 or expediente.estado_expediente == "En Revision":
            alumnos_en_revision += 1

        recientes.append({
            "id_alumno": alumno.id_alumno,
            "nombre": nombre_completo(usuario),
            "matricula": alumno.matricula,
            "carrera": carrera.nombre if carrera else None,
            "estado_expediente": expediente.estado_expediente,
            "revision": resumen["revision"],
            "observados": resumen["observados"],
        })

    recientes.sort(key=lambda item: (item["revision"], item["observados"]), reverse=True)

    return {
        "metricas": {
            "total_alumnos": len(alumnos),
            "alumnos_en_revision": alumnos_en_revision,
            "docs_revisados": aprobados + observados,
            "empresas_disponibles": 0,
            "expedientes_aprobados": expedientes_aprobados,
        },
        "estado_documentos": [
            {"name": "Aprobados", "value": aprobados, "color": "#22c55e"},
            {"name": "En revision", "value": en_revision, "color": "#f59e0b"},
            {"name": "Observados", "value": observados, "color": "#ef4444"},
            {"name": "Pendientes", "value": pendientes, "color": "#94a3b8"},
        ],
        "expedientes_por_revisar": recientes[:5],
        "total_documentos": total_documentos,
    }

@router.get("/alumnos")
def listar_alumnos_con_documentos(db: Session = Depends(obtener_db)):
    alumnos = db.query(AlumnoModel).order_by(AlumnoModel.id_alumno).all()
    resultado = []

    for alumno in alumnos:
        expediente = asegurar_documentos_expediente(db, alumno)
        usuario = db.query(UsuarioModel).filter(UsuarioModel.id_usuario == alumno.id_usuario).first()
        carrera = db.query(CarreraModel).filter(CarreraModel.id_carrera == alumno.id_carrera).first()
        filas = documentos_del_flujo(db, expediente)
        documentos = [documento for documento, _ in filas]

        resultado.append({
            "id_alumno": alumno.id_alumno,
            "id_expediente": expediente.id_expediente,
            "nombre": nombre_completo(usuario),
            "correo": usuario.correo if usuario else None,
            "matricula": alumno.matricula,
            "semestre": alumno.semestre,
            "grupo": alumno.grupo,
            "carrera": carrera.nombre if carrera else None,
            "estado_alumno": alumno.estado_alumno,
            "estado_expediente": expediente.estado_expediente,
            "resumen": resumen_documentos(documentos),
        })

    return resultado


@router.get("/alumnos/{id_alumno}")
def obtener_documentos_alumno(id_alumno: int, db: Session = Depends(obtener_db)):
    alumno = db.query(AlumnoModel).filter(AlumnoModel.id_alumno == id_alumno).first()
    if alumno is None:
        raise HTTPException(status_code=404, detail="Alumno no encontrado")
    return serializar_documentacion(db, alumno)


@router.patch("/{id_documento}/estado")
def cambiar_estado_documento(id_documento: int, payload: CambiarEstadoDocumentoRequest, db: Session = Depends(obtener_db)):
    estados_validos = {"Aprobado", "Observado", "Rechazado", "Pendiente"}
    if payload.estado not in estados_validos:
        raise HTTPException(status_code=400, detail="Estado de documento invalido")

    documento = db.query(DocumentoModel).filter(DocumentoModel.id_documento == id_documento).first()
    if documento is None:
        raise HTTPException(status_code=404, detail="Documento no encontrado")
    if not documento.nombre_archivo and payload.estado == "Aprobado":
        raise HTTPException(status_code=400, detail="No se puede aprobar un documento sin archivo")

    documento.estado_documento = payload.estado
    expediente = db.query(ExpedienteModel).filter(ExpedienteModel.id_expediente == documento.id_expediente).first()
    if expediente and payload.estado in ["Aprobado", "Observado", "Rechazado"]:
        expediente.estado_expediente = "En Revision"
    db.commit()
    db.refresh(documento)
    return {"id_documento": documento.id_documento, "estado": documento.estado_documento, "comentario": payload.comentario}


@router.post("/alumnos/{id_alumno}/habilitar-seleccion")
def habilitar_seleccion_empresa(id_alumno: int, db: Session = Depends(obtener_db)):
    alumno = db.query(AlumnoModel).filter(AlumnoModel.id_alumno == id_alumno).first()
    if alumno is None:
        raise HTTPException(status_code=404, detail="Alumno no encontrado")

    detalle = serializar_documentacion(db, alumno)
    if not detalle["expediente"]["expediente_inicial_aprobado"]:
        raise HTTPException(status_code=400, detail="Primero deben aprobarse los 7 documentos iniciales")

    alumno.estado_alumno = "Elegible"
    db.commit()
    return serializar_documentacion(db, alumno)


@router.post("/alumnos/{id_alumno}/habilitar-asignacion")
def habilitar_documentacion_asignacion(id_alumno: int, db: Session = Depends(obtener_db)):
    alumno = db.query(AlumnoModel).filter(AlumnoModel.id_alumno == id_alumno).first()
    if alumno is None:
        raise HTTPException(status_code=404, detail="Alumno no encontrado")

    detalle = serializar_documentacion(db, alumno)
    if not detalle["expediente"]["seleccion_validada"]:
        raise HTTPException(status_code=400, detail="Primero debe aprobarse la seleccion de empresa")

    expediente = asegurar_documentos_expediente(db, alumno)
    filas = documentos_del_flujo(db, expediente)
    carpeta = UPLOAD_DIR / str(expediente.id_expediente)

    for documento, tipo in filas:
        if tipo.etapa != "asignacion":
            continue
        nombre_archivo = generar_nomenclatura(tipo.nombre_documento, alumno.matricula)
        destino = carpeta / f"{documento.id_documento}_{nombre_archivo}"
        crear_pdf_placeholder(destino, tipo.nombre_documento, alumno)
        documento.nombre_archivo = nombre_archivo
        documento.ruta_archivo = str(destino)
        documento.estado_documento = "Aprobado"
        documento.generado_por_sistema = True
        documento.fecha_carga = datetime.now()

    alumno.estado_alumno = "Asignado"
    expediente.estado_expediente = "Aprobado"
    db.commit()
    return serializar_documentacion(db, alumno)


@router.get("/{id_documento}/archivo")
def descargar_documento_coordinador(id_documento: int, db: Session = Depends(obtener_db)):
    documento = db.query(DocumentoModel).filter(DocumentoModel.id_documento == id_documento).first()
    if documento is None or not documento.ruta_archivo:
        raise HTTPException(status_code=404, detail="Archivo no encontrado")
    ruta = Path(documento.ruta_archivo)
    if not ruta.exists():
        raise HTTPException(status_code=404, detail="Archivo no encontrado")
    nombre = documento.nombre_archivo or generar_nomenclatura("documento", "alumno")
    return FileResponse(ruta, media_type="application/pdf", filename=nombre)