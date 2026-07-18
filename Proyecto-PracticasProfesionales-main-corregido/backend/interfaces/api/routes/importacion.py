import secrets
import string
from pathlib import Path

import pandas as pd
from fastapi import APIRouter, Depends, File, HTTPException, UploadFile
from sqlalchemy.orm import Session

from app.services.auditoria_service import registrar_bitacora
from infrastructure.database.dependencies import obtener_db
from infrastructure.email.email_service import EmailError, enviar_credenciales_login
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


def _normalizar_excel_con_secciones(df_raw, columnas_requeridas):
    encabezado_index = None
    encabezados = []
    requeridas = set(columnas_requeridas)

    for index, fila in df_raw.iterrows():
        valores = [_texto(valor) for valor in fila.tolist()]
        if requeridas.issubset(set(valores)):
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
        "Roles permitidos",
        "Errores comunes",
        "Carreras disponibles",
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


def _leer_archivo(archivo: UploadFile, hoja: str | None = None, columnas_requeridas=None):
    extension = Path(archivo.filename or "").suffix.lower()
    if extension == ".csv":
        return pd.read_csv(archivo.file)
    if extension == ".xlsx":
        hojas = [hoja] if isinstance(hoja, str) else list(hoja or [])
        try:
            excel = pd.ExcelFile(archivo.file)
            hoja_encontrada = next((item for item in hojas if item in excel.sheet_names), None)
            if hojas and hoja_encontrada is None:
                raise ValueError
            if columnas_requeridas:
                df_raw = pd.read_excel(excel, sheet_name=hoja_encontrada, header=None)
                return _normalizar_excel_con_secciones(df_raw, columnas_requeridas)
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


def _vista_previa(df, limite=5):
    return df.head(limite).fillna("").to_dict(orient="records")


def _validar_columnas(df, columnas):
    return [
        {"fila": 0, "error": f"Falta la columna {columna}"}
        for columna in columnas
        if columna not in df.columns
    ]


def _validar_alumnos_df(df, db: Session):
    errores = _validar_columnas(df, COLUMNAS_ALUMNOS_REQUERIDAS)

    if errores:
        return errores

    if df.empty:
        return [{"fila": 0, "error": "No hay registros validos para importar. Captura al menos un alumno."}]

    correos = set()
    matriculas = set()

    for index, fila in df.iterrows():
        numero_fila = index + 2
        correo = _texto(fila["correo"])
        matricula = _texto(fila["matricula"])
        carrera_nombre = _texto(fila["carrera"])

        for columna in COLUMNAS_ALUMNOS_REQUERIDAS:
            if not _texto(fila[columna]):
                errores.append({"fila": numero_fila, "error": f"{columna} es obligatorio"})

        if correo in correos:
            errores.append({"fila": numero_fila, "error": f"Correo duplicado en archivo: {correo}"})
        if matricula in matriculas:
            errores.append({"fila": numero_fila, "error": f"Matricula duplicada en archivo: {matricula}"})

        correos.add(correo)
        matriculas.add(matricula)

        if correo and db.query(UsuarioModel).filter(UsuarioModel.correo == correo).first():
            errores.append({"fila": numero_fila, "error": f"Correo ya registrado: {correo}"})

        if matricula and db.query(AlumnoModel).filter(AlumnoModel.matricula == matricula).first():
            errores.append({"fila": numero_fila, "error": f"Matricula ya registrada: {matricula}"})

        carrera = db.query(CarreraModel).filter(CarreraModel.nombre == carrera_nombre).first()
        if carrera_nombre and carrera is None:
            errores.append({"fila": numero_fila, "error": f"Carrera no existe: {carrera_nombre}"})

        tipo_practica = _buscar_tipo_practica(db, fila["tipo_practica"])
        if _texto(fila["tipo_practica"]) and tipo_practica is None:
            errores.append({"fila": numero_fila, "error": f"Tipo de practica no existe: {_texto(fila['tipo_practica'])}"})

        try:
            semestre = _entero(fila["semestre"])
            if semestre is None or semestre < 1 or semestre > 12:
                errores.append({"fila": numero_fila, "error": "Semestre debe estar entre 1 y 12"})
        except (TypeError, ValueError):
            errores.append({"fila": numero_fila, "error": "Semestre debe ser numerico"})

    return errores


def _buscar_tipo_practica(db: Session, valor):
    texto = _texto(valor)
    if not texto:
        return None

    try:
        id_tipo_practica = int(texto)
    except ValueError:
        id_tipo_practica = None

    query = db.query(TipoPracticaModel)
    if id_tipo_practica is not None:
        return query.filter(TipoPracticaModel.id_tipo_practica == id_tipo_practica).first()

    return query.filter(TipoPracticaModel.nombre == texto).first()


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

    for credencial in credenciales:
        correo = credencial["correo"]
        try:
            enviar_credenciales_login(
                destinatario=correo,
                nombre=credencial.get("nombre") or correo,
                correo_acceso=correo,
                password_temporal=credencial["password_temporal"],
                rol=credencial.get("rol") or "Usuario",
            )
            enviados.append(correo)
            registrar_bitacora(
                db,
                id_usuario_admin,
                "Enviar credenciales importacion",
                "importacion",
                f"Se enviaron credenciales de acceso al usuario {correo}.",
                "usuario",
                credencial.get("id_usuario"),
            )
        except EmailError:
            fallidos.append(correo)
            registrar_bitacora(
                db,
                id_usuario_admin,
                "Fallo envio credenciales importacion",
                "importacion",
                f"No se pudieron enviar credenciales de acceso al usuario {correo}.",
                "usuario",
                credencial.get("id_usuario"),
            )

    return {
        "correos_enviados": enviados,
        "correos_fallidos": fallidos,
        "total_correos_enviados": len(enviados),
        "total_correos_fallidos": len(fallidos),
        "advertencia_correo": (
            "Algunas cuentas fueron creadas, pero no se pudo enviar el correo de acceso a todos los usuarios."
            if fallidos
            else None
        ),
    }


@router.post("/validar-alumnos")
async def validar_alumnos(archivo: UploadFile = File(...), db: Session = Depends(obtener_db)):
    df = _leer_archivo(archivo, ["Plantilla Alumnos", "Alumnos"], COLUMNAS_ALUMNOS_REQUERIDAS)
    return _resumen_validacion(df, _validar_alumnos_df(df, db))


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
    db: Session = Depends(obtener_db),
    usuario_actual: UsuarioModel = Depends(obtener_usuario_actual),
):
    df = _leer_archivo(archivo, ["Plantilla Alumnos", "Alumnos"], COLUMNAS_ALUMNOS_REQUERIDAS)
    errores = _validar_alumnos_df(df, db)

    if errores:
        return _resumen_validacion(df, errores) | {"importados": 0, "credenciales": []}

    importados = []
    credenciales = []

    for index, fila in df.iterrows():
        numero_fila = index + 2
        carrera_nombre = _texto(fila["carrera"])
        carrera = db.query(CarreraModel).filter(CarreraModel.nombre == carrera_nombre).first()
        tipo_practica = _buscar_tipo_practica(db, fila["tipo_practica"])
        password_temporal = generar_password_segura()

        nuevo_usuario = UsuarioModel(
            id_rol=1,
            correo=_texto(fila["correo"]),
            password_hash=generar_password_hash(password_temporal),
            debe_cambiar_password=True,
            estado="Activo",
        )

        db.add(nuevo_usuario)
        db.flush()

        nuevo_alumno = AlumnoModel(
            id_usuario=nuevo_usuario.id_usuario,
            nombre=_texto(fila["nombre"]),
            apellido_paterno=_texto(fila["apellido_paterno"]),
            apellido_materno=_texto(fila["apellido_materno"]),
            id_carrera=carrera.id_carrera,
            id_tipo_practica=tipo_practica.id_tipo_practica if tipo_practica else None,
            periodo_practica=_texto(fila["periodo"]) if "periodo" in df.columns and _texto(fila["periodo"]) else carrera.tipo_periodo,
            matricula=_texto(fila["matricula"]),
            semestre=_entero(fila["semestre"]),
            grupo=_texto(fila["grupo"]),
            creditos_aprobados=_entero(fila["creditos_aprobados"], 0) if "creditos_aprobados" in df.columns else 0,
            estado_alumno="Activo",
        )

        db.add(nuevo_alumno)
        db.flush()

        importados.append({
            "fila": numero_fila,
            "id_usuario": nuevo_usuario.id_usuario,
            "id_alumno": nuevo_alumno.id_alumno,
            "matricula": nuevo_alumno.matricula,
            "correo": nuevo_usuario.correo,
            "tipo_practica": tipo_practica.nombre if tipo_practica else None,
            "periodo_practica": nuevo_alumno.periodo_practica,
        })
        credenciales.append({
            "fila": numero_fila,
            "id_usuario": nuevo_usuario.id_usuario,
            "correo": nuevo_usuario.correo,
            "nombre": f"{_texto(fila['nombre'])} {_texto(fila['apellido_paterno'])}".strip(),
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
        "credenciales": credenciales,
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
            debe_cambiar_password=False,
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
        "credenciales": credenciales,
        **resultado_correo,
        "mensaje_credenciales": "Guarda este archivo ahora. Las contrasenas no podran recuperarse despues.",
    }
