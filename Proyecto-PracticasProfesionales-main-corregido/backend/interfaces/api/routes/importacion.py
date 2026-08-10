import re
import secrets
import string
import unicodedata
from pathlib import Path

import pandas as pd
from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile
from sqlalchemy.orm import Session

from app.services.auditoria_service import registrar_bitacora
from app.services.identidad_importacion_service import (
    buscar_id_alumno_reutilizable,
    marcar_id_reutilizado,
)
from app.services.upload_security import leer_uploadfile_validado_importacion
from infrastructure.database.dependencies import obtener_db
from infrastructure.email.email_service import enviar_correo_importacion_usuario
from infrastructure.persistence.models.alumno import AlumnoModel
from infrastructure.persistence.models.carrera import CarreraModel
from infrastructure.persistence.models.personal_interno import PersonalInternoModel
from infrastructure.persistence.models.rol import RolModel
from infrastructure.persistence.models.tipo_practica import TipoPracticaModel
from infrastructure.persistence.models.usuario import UsuarioModel
from infrastructure.security.auth_dependencies import obtener_usuario_actual, requerir_roles
from infrastructure.security.password import generar_password_hash


router = APIRouter(
    prefix="/importacion",
    tags=["Importacion"],
    dependencies=[Depends(requerir_roles(["Administrador"]))],
)


COLUMNAS_ALUMNOS_REQUERIDAS = [
    "alumno",
    "matricula",
    "semestre",
    "grupo",
    "correo",
    "practica",
    "tipo",
]

COLUMNAS_ALUMNOS_ANTERIORES = [
    "nombre",
    "apellido_paterno",
    "apellido_materno",
    "correo",
    "matricula",
    "carrera",
    "semestre",
    "grupo",
    "tipo_practica",
]

COLUMNAS_PERSONAL_REQUERIDAS = [
    "nombre",
    "apellido_paterno",
    "apellido_materno",
    "correo",
    "rol",
    "departamento",
    "cargo",
    "telefono",
]

ROLES_PERSONAL_PERMITIDOS = {
    "administrador": 2,
    "coordinador de practicas": 3,
    "coordinador de prácticas": 3,
    "coordinador de unidades receptoras": 4,
    "asesor interno": 6,
    "direccion": 7,
    "dirección": 7,
}


def generar_password_segura(longitud: int = 12):
    caracteres = string.ascii_letters + string.digits + "!@#$%&*"
    return "".join(secrets.choice(caracteres) for _ in range(longitud))


DOMINIO_INSTITUCIONAL = "@unach.mx"


def _correo_institucional_valido(correo: str):
    return correo.lower().endswith(DOMINIO_INSTITUCIONAL)


def _clave_encabezado(valor):
    texto = unicodedata.normalize("NFKD", _texto(valor))
    texto = texto.encode("ascii", "ignore").decode("ascii").lower().strip()
    return re.sub(r"\s+", "_", texto)


def _normalizar_columnas(df):
    normalizado = df.copy()
    normalizado.columns = [_clave_encabezado(columna) for columna in normalizado.columns]
    return normalizado


def _normalizar_excel_con_secciones(df_raw, columnas_requeridas, columnas_alternativas=None):
    encabezado_index = None
    encabezados = []
    conjuntos_requeridos = [
        {_clave_encabezado(columna) for columna in columnas_requeridas},
        *[
            {_clave_encabezado(columna) for columna in alternativa}
            for alternativa in (columnas_alternativas or [])
        ],
    ]

    for index, fila in df_raw.iterrows():
        valores = [_clave_encabezado(valor) for valor in fila.tolist()]
        if any(requeridas.issubset(set(valores)) for requeridas in conjuntos_requeridos):
            encabezado_index = index
            encabezados = valores
            break

    if encabezado_index is None:
        return df_raw

    datos = df_raw.iloc[encabezado_index + 1:].copy()
    datos.columns = encabezados
    datos = datos.loc[:, [columna for columna in datos.columns if columna]]

    marcadores_fin = {
        "EJEMPLO CORRECTO, NO IMPORTAR",
        "Catalogos / valores permitidos",
        "Catalogo de tipos de practica",
        "Prácticas permitidas",
        "Roles permitidos",
        "Errores comunes",
        "Carreras disponibles",
        "Ejemplos de TIPO texto libre",
    }
    filas_validas = []
    for _, fila in datos.iterrows():
        primer_valor = _texto(fila.iloc[0]) if len(fila) else ""
        if primer_valor in marcadores_fin:
            break
        if any(_texto(valor) for valor in fila.tolist()):
            filas_validas.append(fila)

    if not filas_validas:
        return datos.iloc[0:0]

    return pd.DataFrame(filas_validas).reset_index(drop=True)


def _leer_archivo(
    archivo: UploadFile,
    hoja: str | None = None,
    columnas_requeridas=None,
    columnas_alternativas=None,
):
    leer_uploadfile_validado_importacion(archivo)
    extension = Path(archivo.filename or "").suffix.lower()
    if extension == ".csv":
        return _normalizar_columnas(pd.read_csv(archivo.file))
    if extension == ".xlsx":
        hojas = [hoja] if isinstance(hoja, str) else list(hoja or [])
        try:
            excel = pd.ExcelFile(archivo.file)
            hoja_encontrada = next((item for item in hojas if item in excel.sheet_names), None)
            if hojas and hoja_encontrada is None:
                raise ValueError
            if columnas_requeridas:
                df_raw = pd.read_excel(excel, sheet_name=hoja_encontrada, header=None)
                return _normalizar_excel_con_secciones(
                    df_raw,
                    columnas_requeridas,
                    columnas_alternativas,
                )
            return pd.read_excel(excel, sheet_name=hoja_encontrada) if hoja_encontrada else pd.read_excel(excel)
        except ValueError as exc:
            raise HTTPException(
                status_code=400,
                detail=f"La plantilla no contiene la hoja esperada. Descarga la nueva plantilla.",
            ) from exc
    raise HTTPException(status_code=400, detail="Formato no permitido. Sube un archivo .csv o .xlsx.")


def _texto(valor):
    if pd.isna(valor):
        return ""
    return str(valor).strip()


def _entero(valor, default=None):
    if pd.isna(valor) or valor == "":
        return default
    return int(valor)


def _matricula_texto(valor):
    texto = _texto(valor)
    if re.fullmatch(r"\d+\.0", texto):
        return texto[:-2]
    return texto


def _adaptar_columnas_alumnos(df):
    adaptado = _normalizar_columnas(df)

    if "alumno" not in adaptado.columns:
        columnas_nombre = ["nombre", "apellido_paterno", "apellido_materno"]
        if all(columna in adaptado.columns for columna in columnas_nombre):
            adaptado["alumno"] = adaptado[columnas_nombre].apply(
                lambda fila: " ".join(_texto(valor) for valor in fila if _texto(valor)),
                axis=1,
            )

    if "practica" not in adaptado.columns and "tipo_practica" in adaptado.columns:
        adaptado["practica"] = adaptado["tipo_practica"]
    if "tipo" not in adaptado.columns and "carrera" in adaptado.columns:
        adaptado["tipo"] = adaptado["carrera"]

    return adaptado



def _leer_archivo_alumnos(archivo: UploadFile):
    df = _leer_archivo(
        archivo,
        ["Plantilla Alumnos", "Alumnos"],
        COLUMNAS_ALUMNOS_REQUERIDAS,
        [COLUMNAS_ALUMNOS_ANTERIORES],
    )
    return _adaptar_columnas_alumnos(df)


def _vista_previa(df, limite=5):
    return df.head(limite).fillna("").to_dict(orient="records")


def _validar_columnas(df, columnas):
    return [
        {"fila": 0, "error": f"Falta la columna {columna}"}
        for columna in columnas
        if columna not in df.columns
    ]


def _resolver_carrera_importacion(db: Session, id_carrera: int | None):
    query = db.query(CarreraModel)
    if id_carrera is not None:
        return query.filter(
            CarreraModel.id_carrera == id_carrera,
            CarreraModel.estado == "Activa",
        ).first()

    carreras_activas = query.filter(CarreraModel.estado == "Activa").all()
    return carreras_activas[0] if len(carreras_activas) == 1 else None


def _validar_alumnos_df(
    df,
    db: Session,
    id_carrera: int | None = None,
    requerir_carrera: bool = True,
):
    errores = _validar_columnas(df, COLUMNAS_ALUMNOS_REQUERIDAS)

    if errores:
        return errores

    if df.empty:
        return [{"fila": 0, "error": "No hay registros validos para importar. Captura al menos un alumno."}]

    carrera_importacion = _resolver_carrera_importacion(db, id_carrera) if requerir_carrera else None
    if requerir_carrera and carrera_importacion is None:
        return [{
            "fila": 0,
            "error": "Selecciona una carrera activa para la importación de alumnos.",
        }]

    correos = set()
    matriculas = set()

    for index, fila in df.iterrows():
        numero_fila = index + 2
        alumno = _texto(fila["alumno"])
        correo = _texto(fila["correo"])
        matricula = _matricula_texto(fila["matricula"])
        grupo = _texto(fila["grupo"])
        practica = _texto(fila["practica"])

        for columna in COLUMNAS_ALUMNOS_REQUERIDAS:
            if not _texto(fila[columna]):
                errores.append({"fila": numero_fila, "error": f"{columna} es obligatorio"})


        if correo in correos:
            errores.append({"fila": numero_fila, "error": f"Correo duplicado en archivo: {correo}"})
        if correo and not _correo_institucional_valido(correo):
            errores.append({"fila": numero_fila, "error": "El correo de alumnos debe terminar en @unach.mx"})
        if matricula in matriculas:
            errores.append({"fila": numero_fila, "error": f"Matricula duplicada en archivo: {matricula}"})
        if matricula and re.fullmatch(r"[A-Za-z0-9]+", matricula) is None:
            errores.append({"fila": numero_fila, "error": "MATRÍCULA solo puede contener letras y números, sin espacios ni símbolos"})
        if grupo and re.fullmatch(r"[A-Z]", grupo) is None:
            errores.append({"fila": numero_fila, "error": "GRUPO debe ser una sola letra mayúscula"})

        if correo:
            correos.add(correo)
        if matricula:
            matriculas.add(matricula)

        if correo and db.query(UsuarioModel).filter(UsuarioModel.correo == correo).first():
            errores.append({"fila": numero_fila, "error": f"Correo ya registrado: {correo}"})

        if matricula and db.query(AlumnoModel).filter(AlumnoModel.matricula == matricula).first():
            errores.append({"fila": numero_fila, "error": f"Matricula ya registrada: {matricula}"})

        tipo_practica = _buscar_tipo_practica(db, practica)
        if practica and tipo_practica is None:
            errores.append({
                "fila": numero_fila,
                "error": (
                    "PRÁCTICA debe ser PRÁCTICA PROFESIONAL 1, "
                    "PRÁCTICA PROFESIONAL 2 o RESIDENCIA PROFESIONAL"
                ),
            })

        try:
            semestre = _entero(fila["semestre"])
            if semestre is None or semestre < 1 or semestre > 9:
                errores.append({"fila": numero_fila, "error": "SEMESTRE debe estar entre 1 y 9"})
        except (TypeError, ValueError):
            errores.append({"fila": numero_fila, "error": "SEMESTRE debe ser numérico"})

    return errores


def _clave_tipo_practica(valor):
    texto = unicodedata.normalize("NFKD", _texto(valor))
    texto = texto.encode("ascii", "ignore").decode("ascii").lower()
    if "residencia" in texto:
        return "residencia"
    if "practica" in texto and re.search(r"\b1\b", texto):
        return "practica_1"
    if "practica" in texto and re.search(r"\b2\b", texto):
        return "practica_2"
    return None


def _buscar_tipo_practica(db: Session, valor):
    clave = _clave_tipo_practica(valor)
    if clave is None:
        return None

    tipos_activos = db.query(TipoPracticaModel).filter(TipoPracticaModel.activo.is_(True)).all()
    return next(
        (tipo for tipo in tipos_activos if _clave_tipo_practica(tipo.nombre) == clave),
        None,
    )


def _rol_personal_id(valor):
    nombre = _texto(valor).lower()
    return ROLES_PERSONAL_PERMITIDOS.get(nombre)


def _validar_personal_df(df, db: Session):
    if "id_empresa" in df.columns or "id_rol" in df.columns:
        return [{
            "fila": 0,
            "error": "La plantilla de personal ya no usa id_empresa ni id_rol. Descarga la nueva plantilla.",
        }]

    errores = _validar_columnas(df, COLUMNAS_PERSONAL_REQUERIDAS)

    if errores:
        return errores

    if df.empty:
        return [{"fila": 0, "error": "No hay registros validos para importar. Captura al menos un usuario de personal."}]

    correos = set()

    for index, fila in df.iterrows():
        numero_fila = index + 2
        correo = _texto(fila["correo"])

        for columna in COLUMNAS_PERSONAL_REQUERIDAS:
            if columna in {"cargo", "telefono"}:
                continue
            if not _texto(fila[columna]):
                errores.append({"fila": numero_fila, "error": f"{columna} es obligatorio"})

        if correo in correos:
            errores.append({"fila": numero_fila, "error": f"Correo duplicado en archivo: {correo}"})
        if correo and not _correo_institucional_valido(correo):
            errores.append({"fila": numero_fila, "error": "El correo de personal debe terminar en @unach.mx"})
        correos.add(correo)

        if correo and db.query(UsuarioModel).filter(UsuarioModel.correo == correo).first():
            errores.append({"fila": numero_fila, "error": f"Correo ya registrado: {correo}"})

        id_rol = _rol_personal_id(fila["rol"])
        if id_rol is None:
            errores.append({
                "fila": numero_fila,
                "error": "Rol no permitido para personal. Usa Administrador, Coordinador de Practicas, Coordinador de Unidades Receptoras, Asesor Interno o Direccion.",
            })
            continue

        if db.query(RolModel).filter(RolModel.id_rol == id_rol).first() is None:
            errores.append({"fila": numero_fila, "error": f"Rol no existe: {id_rol}"})

        if id_rol in (3, 4) and "departamento" in df.columns and not _texto(fila["departamento"]):
            errores.append({"fila": numero_fila, "error": "departamento es obligatorio para coordinadores"})

        if id_rol == 6 and ("departamento" not in df.columns or not _texto(fila["departamento"])):
            errores.append({"fila": numero_fila, "error": "departamento es obligatorio para asesor interno"})

    return errores


def _resumen_validacion(df, errores):
    filas_con_error = {error["fila"] for error in errores if error["fila"] != 0}
    return {
        "total": len(df),
        "validos": max(len(df) - len(filas_con_error), 0),
        "errores": errores,
        "vista_previa": _vista_previa(df),
    }


def _enviar_credenciales_importacion(
    db: Session,
    credenciales: list[dict],
    id_usuario_admin: int,
):
    enviados = []
    fallidos = []
    omitidos = []

    for credencial in credenciales:
        correo = credencial["correo"]
        try:
            resultado = enviar_correo_importacion_usuario(
                destinatario=correo,
                nombre=credencial.get("nombre") or correo,
                correo_acceso=correo,
                password_temporal=credencial["password_temporal"],
                rol=credencial.get("rol") or "Usuario",
            )
            if resultado.enviado:
                enviados.append(correo)
                accion = "envio_correo_importacion"
                descripcion = f"Se enviaron credenciales de acceso al usuario {correo}."
            elif "deshabilitado" in (resultado.error or "").lower():
                omitidos.append(correo)
                accion = "correo_deshabilitado"
                descripcion = f"No se enviaron credenciales de acceso al usuario {correo}: {resultado.error}."
            else:
                fallidos.append(correo)
                accion = "error_envio_correo"
                descripcion = f"No se pudieron enviar credenciales de acceso al usuario {correo}: {resultado.error}."
            registrar_bitacora(
                db,
                id_usuario_admin,
                accion,
                "importacion",
                descripcion,
                "usuario",
                credencial.get("id_usuario"),
            )
        except Exception:
            fallidos.append(correo)
            registrar_bitacora(
                db,
                id_usuario_admin,
                "error_envio_correo",
                "importacion",
                f"No se pudieron enviar credenciales de acceso al usuario {correo}.",
                "usuario",
                credencial.get("id_usuario"),
            )

    return {
        "correos_enviados": enviados,
        "correos_omitidos": omitidos,
        "correos_fallidos": fallidos,
        "total_correos_enviados": len(enviados),
        "total_correos_fallidos": len(fallidos),
        "total_correos_omitidos": len(omitidos),
        "advertencia_correo": (
            "Algunas cuentas fueron creadas, pero no se pudo enviar el correo de acceso a todos los usuarios."
            if fallidos or omitidos
            else None
        ),
    }


def _credenciales_respuesta(credenciales: list[dict]) -> list[dict]:
    # Se devuelven una sola vez al terminar la importación para generar el CSV.
    return credenciales


@router.post("/validar-alumnos")
async def validar_alumnos(
    archivo: UploadFile = File(...),
    id_carrera: int | None = Form(None),
    db: Session = Depends(obtener_db),
):
    df = _leer_archivo_alumnos(archivo)
    return _resumen_validacion(
        df,
        _validar_alumnos_df(df, db, id_carrera, requerir_carrera=False),
    )


@router.post("/validar-personal")
async def validar_personal(
    archivo: UploadFile = File(...),
    db: Session = Depends(obtener_db),
):
    df = _leer_archivo(archivo, ["Plantilla Personal", "Personal"], COLUMNAS_PERSONAL_REQUERIDAS)
    return _resumen_validacion(df, _validar_personal_df(df, db))


@router.post("/importar-alumnos")
async def importar_alumnos(
    archivo: UploadFile = File(...),
    id_carrera: int | None = Form(None),
    db: Session = Depends(obtener_db),
    usuario_actual: UsuarioModel = Depends(obtener_usuario_actual),
):
    df = _leer_archivo_alumnos(archivo)
    errores = _validar_alumnos_df(df, db, id_carrera)

    if errores:
        return _resumen_validacion(df, errores) | {"importados": 0, "credenciales": []}

    importados = []
    credenciales = []
    carrera = _resolver_carrera_importacion(db, id_carrera)

    for index, fila in df.iterrows():
        numero_fila = index + 2
        tipo_practica = _buscar_tipo_practica(db, fila["practica"])
        nombre_completo = _texto(fila["alumno"])
        matricula = _matricula_texto(fila["matricula"])
        correo = _texto(fila["correo"])
        id_alumno_reutilizado, registro_identidad = buscar_id_alumno_reutilizable(
            db, matricula=matricula, correo=correo
        )
        password_temporal = generar_password_segura()

        nuevo_usuario = UsuarioModel(
            id_rol=1,
            correo=correo,
            password_hash=generar_password_hash(password_temporal),
            debe_cambiar_password=True,
            estado="Activo",
        )

        db.add(nuevo_usuario)
        db.flush()

        nuevo_alumno = AlumnoModel(
            id_alumno=id_alumno_reutilizado,
            id_usuario=nuevo_usuario.id_usuario,
            nombre=nombre_completo,
            apellido_paterno=None,
            apellido_materno=None,
            id_carrera=carrera.id_carrera,
            id_tipo_practica=tipo_practica.id_tipo_practica if tipo_practica else None,
            periodo_practica=carrera.tipo_periodo,
            matricula=matricula,
            semestre=_entero(fila["semestre"]),
            grupo=_texto(fila["grupo"]),
            creditos_aprobados=_entero(fila["creditos_aprobados"], 0) if "creditos_aprobados" in df.columns else 0,
            estado_alumno="Activo",
        )

        db.add(nuevo_alumno)
        db.flush()
        marcar_id_reutilizado(registro_identidad)

        importados.append({
            "fila": numero_fila,
            "id_usuario": nuevo_usuario.id_usuario,
            "id_alumno": nuevo_alumno.id_alumno,
            "id_reutilizado": id_alumno_reutilizado is not None,
            "matricula": nuevo_alumno.matricula,
            "correo": nuevo_usuario.correo,
            "tipo_practica": tipo_practica.nombre if tipo_practica else None,
            "periodo_practica": nuevo_alumno.periodo_practica,
        })
        credenciales.append({
            "fila": numero_fila,
            "id_usuario": nuevo_usuario.id_usuario,
            "correo": nuevo_usuario.correo,
            "nombre": _texto(fila["alumno"]),
            "matricula": nuevo_alumno.matricula,
            "rol": "Alumno",
            "password_temporal": password_temporal,
        })

    db.commit()
    resultado_correo = _enviar_credenciales_importacion(
        db,
        credenciales,
        usuario_actual.id_usuario,
    )

    return {
        "total": len(df),
        "importados": len(importados),
        "errores": [],
        "alumnos": importados,
        "credenciales": _credenciales_respuesta(credenciales),
        **resultado_correo,
        "mensaje_credenciales": "Guarda este archivo ahora. Las contrasenas no podran recuperarse despues.",
    }


@router.post("/importar-personal")
async def importar_personal(
    archivo: UploadFile = File(...),
    db: Session = Depends(obtener_db),
    usuario_actual: UsuarioModel = Depends(obtener_usuario_actual),
):
    df = _leer_archivo(archivo, ["Plantilla Personal", "Personal"], COLUMNAS_PERSONAL_REQUERIDAS)
    errores = _validar_personal_df(df, db)

    if errores:
        return _resumen_validacion(df, errores) | {"importados": 0, "credenciales": []}

    importados = []
    credenciales = []

    for index, fila in df.iterrows():
        numero_fila = index + 2
        id_rol = _rol_personal_id(fila["rol"])
        password_temporal = generar_password_segura()

        nuevo_usuario = UsuarioModel(
            id_rol=id_rol,
            correo=_texto(fila["correo"]),
            password_hash=generar_password_hash(password_temporal),
            debe_cambiar_password=True,
            estado="Activo",
        )
        db.add(nuevo_usuario)
        db.flush()

        if id_rol in (2, 3, 4, 6, 7):
            db.add(PersonalInternoModel(
                id_usuario=nuevo_usuario.id_usuario,
                nombre=_texto(fila["nombre"]),
                apellido_paterno=_texto(fila["apellido_paterno"]),
                apellido_materno=_texto(fila["apellido_materno"]),
                departamento=_texto(fila["departamento"]) if "departamento" in df.columns else None,
                cargo=_texto(fila["cargo"]) if "cargo" in df.columns else None,
                telefono=_texto(fila["telefono"]) if "telefono" in df.columns else None,
            ))

        importados.append({
            "fila": numero_fila,
            "id_usuario": nuevo_usuario.id_usuario,
            "correo": nuevo_usuario.correo,
            "rol": _texto(fila["rol"]),
        })
        credenciales.append({
            "fila": numero_fila,
            "id_usuario": nuevo_usuario.id_usuario,
            "correo": nuevo_usuario.correo,
            "nombre": f"{_texto(fila['nombre'])} {_texto(fila['apellido_paterno'])}".strip(),
            "rol": _texto(fila["rol"]),
            "password_temporal": password_temporal,
        })

    db.commit()
    resultado_correo = _enviar_credenciales_importacion(
        db,
        credenciales,
        usuario_actual.id_usuario,
    )

    return {
        "total": len(df),
        "importados": len(importados),
        "errores": [],
        "personal": importados,
        "credenciales": _credenciales_respuesta(credenciales),
        **resultado_correo,
        "mensaje_credenciales": "Guarda este archivo ahora. Las contrasenas no podran recuperarse despues.",
    }
