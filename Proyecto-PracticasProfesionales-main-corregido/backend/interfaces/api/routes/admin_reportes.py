from __future__ import annotations

from datetime import datetime, timedelta
from io import BytesIO
from types import SimpleNamespace
from typing import Optional
from xml.sax.saxutils import escape

from fastapi import APIRouter, Depends, HTTPException, Query
from fastapi.responses import StreamingResponse
from sqlalchemy import func, inspect, text
from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy.orm import Session

from app.services.auditoria_service import registrar_bitacora
from infrastructure.database.dependencies import obtener_db
from infrastructure.persistence.models.alumno import AlumnoModel
from infrastructure.persistence.models.asignacion import AsignacionModel
from infrastructure.persistence.models.bitacora_auditoria import BitacoraAuditoriaModel
from infrastructure.persistence.models.carrera import CarreraModel
from infrastructure.persistence.models.configuracion_sistema import ConfiguracionSistemaModel
from infrastructure.persistence.models.convocatoria import ConvocatoriaModel
from infrastructure.persistence.models.documento_empresa import DocumentoEmpresaModel
from infrastructure.persistence.models.empresa import EmpresaModel
from infrastructure.persistence.models.incidencia_practica import IncidenciaPracticaModel
from infrastructure.persistence.models.notificacion import NotificacionModel
from infrastructure.persistence.models.rol import RolModel
from infrastructure.persistence.models.solicitud_empresa import SolicitudEmpresaModel
from infrastructure.persistence.models.tipo_practica import TipoPracticaModel
from infrastructure.persistence.models.usuario import UsuarioModel
from infrastructure.persistence.models.vacante import VacanteModel
from infrastructure.security.auth_dependencies import obtener_usuario_actual
from infrastructure.security.auth_dependencies import requerir_roles


router = APIRouter(
    prefix="/admin/reportes",
    tags=["Admin Reportes"],
    dependencies=[Depends(requerir_roles(["Administrador"]))],
)


def _fecha_inicio(periodo: Optional[str]):
    ahora = datetime.now()
    if periodo == "30d":
        return ahora - timedelta(days=30)
    if periodo == "6m":
        return ahora - timedelta(days=180)
    return None


def _query_bitacora(db: Session, periodo: Optional[str], modulo: Optional[str]):
    query = db.query(BitacoraAuditoriaModel)
    desde = _fecha_inicio(periodo)
    if desde is not None:
        query = query.filter(BitacoraAuditoriaModel.fecha >= desde)
    if modulo and modulo != "todos":
        query = query.filter(BitacoraAuditoriaModel.modulo == modulo)
    return query


def _conteo_por_campo(db: Session, modelo, campo):
    rows = db.query(campo, func.count()).group_by(campo).all()
    return [{"nombre": str(nombre or "Sin dato"), "total": total} for nombre, total in rows]


def _conteo_query_por_campo(query, campo):
    rows = query.with_entities(campo, func.count()).group_by(campo).all()
    return [{"nombre": str(nombre or "Sin dato"), "total": total} for nombre, total in rows]


def _like(texto: str):
    return f"%{texto.strip()}%"


def _tabla_existe(db: Session, tabla: str):
    return inspect(db.bind).has_table(tabla)


def _columna_existe(db: Session, tabla: str, columna: str):
    if not _tabla_existe(db, tabla):
        return False
    return any(item["name"] == columna for item in inspect(db.bind).get_columns(tabla))


def _safe_scalar(db: Session, sql: str, params: dict | None = None, default=0):
    try:
        return db.execute(text(sql), params or {}).scalar() or default
    except SQLAlchemyError:
        db.rollback()
        return default


def _safe_rows(db: Session, sql: str, params: dict | None = None):
    try:
        return db.execute(text(sql), params or {}).all()
    except SQLAlchemyError:
        db.rollback()
        return []


def _conteo_tabla(db: Session, tabla: str):
    if not _tabla_existe(db, tabla):
        return 0
    return int(_safe_scalar(db, f"SELECT COUNT(*) FROM `{tabla}`", default=0))


def _conteo_tablas_posibles(db: Session, *tablas: str):
    for tabla in tablas:
        if _tabla_existe(db, tabla):
            return _conteo_tabla(db, tabla)
    return 0


def _conteo_estado_tablas_posibles(db: Session, columna: str, *tablas: str):
    for tabla in tablas:
        if _columna_existe(db, tabla, columna):
            return _conteo_por_columna_segura(db, tabla, columna)
    return []


def _conteo_por_columna_segura(db: Session, tabla: str, columna: str):
    if not _columna_existe(db, tabla, columna):
        return []
    rows = _safe_rows(
        db,
        f"""
        SELECT COALESCE(CAST(`{columna}` AS CHAR), 'Sin dato') AS nombre, COUNT(*) AS total
        FROM `{tabla}`
        GROUP BY `{columna}`
        """,
    )
    return [{"nombre": nombre or "Sin dato", "total": total} for nombre, total in rows]


def _conteo_query_id(query, campo_id):
    return query.with_entities(func.count(campo_id)).scalar() or 0


def _tabla_tipos_practica(db: Session):
    if not _tabla_existe(db, "tipo_practica"):
        return []
    columnas = {
        "nombre": "`nombre`" if _columna_existe(db, "tipo_practica", "nombre") else "'Sin nombre'",
        "activo": "`activo`" if _columna_existe(db, "tipo_practica", "activo") else "1",
        "semestre_requerido": (
            "`semestre_requerido`"
            if _columna_existe(db, "tipo_practica", "semestre_requerido")
            else "NULL"
        ),
        "creditos_minimos": (
            "`creditos_minimos`"
            if _columna_existe(db, "tipo_practica", "creditos_minimos")
            else "NULL"
        ),
        "orden": "`orden`" if _columna_existe(db, "tipo_practica", "orden") else "NULL",
    }
    join_alumno = (
        "LEFT JOIN alumno a ON a.id_tipo_practica = tp.id_tipo_practica"
        if _columna_existe(db, "alumno", "id_tipo_practica")
        else ""
    )
    alumnos_col = "COUNT(a.id_alumno)" if join_alumno else "0"
    rows = _safe_rows(
        db,
        f"""
        SELECT
            tp.id_tipo_practica,
            {columnas["nombre"]} AS nombre,
            {columnas["activo"]} AS activo,
            {columnas["semestre_requerido"]} AS semestre_requerido,
            {columnas["creditos_minimos"]} AS creditos_minimos,
            {columnas["orden"]} AS orden,
            {alumnos_col} AS alumnos
        FROM tipo_practica tp
        {join_alumno}
        GROUP BY
            tp.id_tipo_practica,
            nombre,
            activo,
            semestre_requerido,
            creditos_minimos,
            orden
        ORDER BY COALESCE(orden, tp.id_tipo_practica), tp.id_tipo_practica
        """,
    )
    return [
        {
            "nombre": row.nombre,
            "activo": bool(row.activo),
            "semestre_requerido": row.semestre_requerido,
            "creditos_minimos": row.creditos_minimos,
            "orden": row.orden,
            "alumnos": row.alumnos,
        }
        for row in rows
    ]


def _tabla_ultimos_usuarios(db: Session, rol: str, estado_usuario: str, busqueda: str):
    if not _tabla_existe(db, "usuario"):
        return []

    fecha_col = (
        "u.`created_at`"
        if _columna_existe(db, "usuario", "created_at")
        else "NULL"
    )
    debe_cambiar_col = (
        "u.`debe_cambiar_password`"
        if _columna_existe(db, "usuario", "debe_cambiar_password")
        else "0"
    )
    rol_join = "LEFT JOIN rol r ON r.id_rol = u.id_rol" if _tabla_existe(db, "rol") else ""
    rol_col = "r.nombre" if rol_join else "'Sin rol'"
    perfil_joins = []
    nombre_partes = ["u.correo"]
    busqueda_partes = ["u.correo LIKE :busqueda"]
    if _tabla_existe(db, "personal_interno"):
        perfil_joins.append("LEFT JOIN personal_interno pi ON pi.id_usuario = u.id_usuario")
        nombre_partes.insert(0, "NULLIF(TRIM(CONCAT_WS(' ', pi.nombre, pi.apellido_paterno, pi.apellido_materno)), '')")
        busqueda_partes.extend([
            "pi.nombre LIKE :busqueda",
            "pi.apellido_paterno LIKE :busqueda",
            "pi.apellido_materno LIKE :busqueda",
        ])
    if _tabla_existe(db, "alumno"):
        perfil_joins.append("LEFT JOIN alumno a ON a.id_usuario = u.id_usuario")
        nombre_partes.insert(0, "NULLIF(TRIM(CONCAT_WS(' ', a.nombre, a.apellido_paterno, a.apellido_materno)), '')")
        busqueda_partes.extend([
            "a.nombre LIKE :busqueda",
            "a.apellido_paterno LIKE :busqueda",
            "a.apellido_materno LIKE :busqueda",
        ])
    if _tabla_existe(db, "responsable_empresa"):
        perfil_joins.append("LEFT JOIN responsable_empresa re ON re.id_usuario = u.id_usuario")
        nombre_partes.insert(0, "NULLIF(TRIM(CONCAT_WS(' ', re.nombre, re.apellido_paterno, re.apellido_materno)), '')")
        busqueda_partes.extend([
            "re.nombre LIKE :busqueda",
            "re.apellido_paterno LIKE :busqueda",
            "re.apellido_materno LIKE :busqueda",
        ])
    nombre_col = f"COALESCE({', '.join(nombre_partes)})"
    filtros = []
    params: dict[str, object] = {}
    if rol != "todos" and rol_join:
        filtros.append("r.nombre = :rol")
        params["rol"] = rol
    if estado_usuario != "todos" and _columna_existe(db, "usuario", "estado"):
        filtros.append("u.estado = :estado_usuario")
        params["estado_usuario"] = estado_usuario
    if busqueda.strip():
        filtros.append(
            f"({' OR '.join(busqueda_partes)})"
        )
        params["busqueda"] = _like(busqueda)
    where = f"WHERE {' AND '.join(filtros)}" if filtros else ""
    order = "ORDER BY u.created_at DESC" if fecha_col != "NULL" else "ORDER BY u.id_usuario DESC"

    rows = _safe_rows(
        db,
        f"""
        SELECT
            {nombre_col} AS nombre,
            u.correo,
            {rol_col} AS rol,
            u.estado,
            {fecha_col} AS fecha_registro,
            {debe_cambiar_col} AS debe_cambiar_password
        FROM usuario u
        {rol_join}
        {' '.join(perfil_joins)}
        {where}
        {order}
        LIMIT 25
        """,
        params,
    )
    return [
        {
            "nombre": row.nombre,
            "correo": row.correo,
            "rol": row.rol or "Sin rol",
            "estado": row.estado,
            "fecha_registro": row.fecha_registro.isoformat() if row.fecha_registro else None,
            "debe_cambiar_password": bool(row.debe_cambiar_password),
        }
        for row in rows
    ]


def _tabla_convocatorias(db: Session, tipo_periodo: str, estado_convocatoria: str):
    if not _tabla_existe(db, "convocatoria"):
        return []
    filtros = []
    params: dict[str, object] = {}
    if tipo_periodo != "todos" and _columna_existe(db, "convocatoria", "tipo_periodo"):
        filtros.append("tipo_periodo = :tipo_periodo")
        params["tipo_periodo"] = tipo_periodo
    if estado_convocatoria != "todos" and _columna_existe(db, "convocatoria", "estado"):
        filtros.append("estado = :estado")
        params["estado"] = estado_convocatoria

    where = f"WHERE {' AND '.join(filtros)}" if filtros else ""
    tipo_col = "`tipo_periodo`" if _columna_existe(db, "convocatoria", "tipo_periodo") else "'Ambos'"
    periodo_col = "`periodo`" if _columna_existe(db, "convocatoria", "periodo") else "NULL"
    inicio_col = (
        "`fecha_inicio_general`"
        if _columna_existe(db, "convocatoria", "fecha_inicio_general")
        else "`fecha_inicio`"
        if _columna_existe(db, "convocatoria", "fecha_inicio")
        else "NULL"
    )
    fin_col = (
        "`fecha_cierre_general`"
        if _columna_existe(db, "convocatoria", "fecha_cierre_general")
        else "`fecha_fin`"
        if _columna_existe(db, "convocatoria", "fecha_fin")
        else "NULL"
    )
    estado_col = "`estado`" if _columna_existe(db, "convocatoria", "estado") else "'Sin dato'"
    order_col = "fecha_inicio_general" if _columna_existe(db, "convocatoria", "fecha_inicio_general") else "id_convocatoria"
    rows = _safe_rows(
        db,
        f"""
        SELECT
            nombre,
            {tipo_col} AS tipo_periodo,
            {periodo_col} AS periodo,
            {inicio_col} AS fecha_inicio,
            {fin_col} AS fecha_fin,
            {estado_col} AS estado
        FROM convocatoria
        {where}
        ORDER BY {order_col} DESC
        LIMIT 25
        """,
        params,
    )
    return [
        {
            "nombre": row.nombre,
            "tipo_periodo": row.tipo_periodo,
            "periodo": row.periodo,
            "fecha_inicio": row.fecha_inicio.isoformat() if row.fecha_inicio else None,
            "fecha_fin": row.fecha_fin.isoformat() if row.fecha_fin else None,
            "estado": row.estado,
        }
        for row in rows
    ]


def _tabla_carreras(db: Session, tipo_periodo: str):
    if not _tabla_existe(db, "carrera"):
        return []
    filtros = []
    params: dict[str, object] = {}
    if tipo_periodo != "todos" and _columna_existe(db, "carrera", "tipo_periodo"):
        filtros.append("c.tipo_periodo = :tipo_periodo")
        params["tipo_periodo"] = tipo_periodo
    where = f"WHERE {' AND '.join(filtros)}" if filtros else ""
    tipo_col = "c.`tipo_periodo`" if _columna_existe(db, "carrera", "tipo_periodo") else "'Sin dato'"
    clave_col = "c.`clave`" if _columna_existe(db, "carrera", "clave") else "NULL"
    join_alumno = (
        "LEFT JOIN alumno a ON a.id_carrera = c.id_carrera"
        if _columna_existe(db, "alumno", "id_carrera")
        else ""
    )
    alumnos_col = "COUNT(a.id_alumno)" if join_alumno else "0"
    rows = _safe_rows(
        db,
        f"""
        SELECT
            {clave_col} AS clave,
            c.nombre,
            {tipo_col} AS tipo_periodo,
            {alumnos_col} AS alumnos
        FROM carrera c
        {join_alumno}
        {where}
        GROUP BY c.id_carrera, clave, c.nombre, tipo_periodo
        ORDER BY c.nombre ASC
        """,
        params,
    )
    return [
        {
            "clave": row.clave,
            "nombre": row.nombre,
            "tipo_periodo": row.tipo_periodo,
            "alumnos": row.alumnos,
        }
        for row in rows
    ]


def _configuracion_actual(db: Session):
    if not _tabla_existe(db, "configuracion_sistema"):
        return None

    columnas = ["id_configuracion", "estado_sistema"]
    if _columna_existe(db, "configuracion_sistema", "nombre_sistema"):
        columnas.append("nombre_sistema")
    if _columna_existe(db, "configuracion_sistema", "escuela_facultad"):
        columnas.append("escuela_facultad")
    if _columna_existe(db, "configuracion_sistema", "inscripcion_empresas_estado"):
        columnas.append("inscripcion_empresas_estado")

    select_cols = ", ".join(f"`{columna}`" for columna in columnas)
    row = db.execute(
        text(
            f"""
            SELECT {select_cols}
            FROM configuracion_sistema
            ORDER BY id_configuracion ASC
            LIMIT 1
            """
        )
    ).mappings().first()
    if row is None:
        return None
    return SimpleNamespace(
        id_configuracion=row.get("id_configuracion"),
        nombre_sistema=row.get("nombre_sistema") or "Sistema Integral de Practicas Profesionales",
        escuela_facultad=row.get("escuela_facultad") or "Institucion",
        estado_sistema=row.get("estado_sistema") or "Activo",
        inscripcion_empresas_estado=row.get("inscripcion_empresas_estado") or "Abierta",
    )


def _actividad_response(item: BitacoraAuditoriaModel):
    usuario = item.usuario
    return {
        "id_bitacora": item.id_bitacora,
        "fecha": item.fecha.isoformat() if item.fecha else None,
        "usuario": usuario.correo if usuario else "Sistema",
        "accion": item.accion,
        "modulo": item.modulo,
        "detalle": item.descripcion,
        "estado": "Completado",
    }


def _texto_pdf(valor):
    if valor is None or valor == "":
        return "Sin dato"
    if isinstance(valor, bool):
        return "Si" if valor else "No"
    return escape(str(valor))


def _filtros_activos(datos: dict):
    etiquetas = {
        "periodo": "Periodo de actividad",
        "modulo": "Modulo de auditoria",
        "busqueda": "Busqueda",
        "rol": "Rol",
        "estado_usuario": "Estado de usuario",
        "carrera": "Carrera",
        "semestre": "Semestre",
        "grupo": "Grupo",
        "tipo_practica": "Tipo de practica",
        "periodo_practica": "Periodo de practica",
        "estado_empresa": "Estado de empresa",
        "tipo_tramite": "Tramite empresa",
        "tipo_periodo": "Tipo de periodo",
        "estado_convocatoria": "Estado convocatoria",
    }
    activos = []
    for clave, etiqueta in etiquetas.items():
        valor = (datos.get("filtros") or {}).get(clave)
        if valor is None or valor == "" or valor == "todos":
            continue
        activos.append([etiqueta, _texto_pdf(valor)])
    return activos


def _tabla_pdf(titulo: str, encabezados: list[str], filas: list[list], estilos):
    from reportlab.lib import colors
    from reportlab.platypus import KeepTogether, Paragraph, Spacer, Table, TableStyle

    contenido = [[Paragraph(str(celda), estilos["table_header"]) for celda in encabezados]]
    if filas:
        for fila in filas:
            contenido.append([Paragraph(_texto_pdf(celda), estilos["table_cell"]) for celda in fila])
    else:
        contenido.append([Paragraph("Sin datos disponibles.", estilos["table_cell"])] + [""] * (len(encabezados) - 1))

    tabla = Table(contenido, repeatRows=1, hAlign="LEFT")
    tabla.setStyle(
        TableStyle(
            [
                ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#0d2b5e")),
                ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
                ("GRID", (0, 0), (-1, -1), 0.35, colors.HexColor("#cbd5e1")),
                ("VALIGN", (0, 0), (-1, -1), "TOP"),
                ("ROWBACKGROUNDS", (0, 1), (-1, -1), [colors.white, colors.HexColor("#f8fafc")]),
                ("LEFTPADDING", (0, 0), (-1, -1), 5),
                ("RIGHTPADDING", (0, 0), (-1, -1), 5),
                ("TOPPADDING", (0, 0), (-1, -1), 4),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 4),
            ]
        )
    )
    return KeepTogether([Paragraph(titulo, estilos["section"]), Spacer(1, 6), tabla, Spacer(1, 12)])


def _grafico_barras(titulo: str, items: list[dict], estilos):
    from reportlab.graphics.charts.barcharts import HorizontalBarChart
    from reportlab.graphics.shapes import Drawing, String
    from reportlab.lib import colors
    from reportlab.platypus import KeepTogether, Paragraph, Spacer

    if not items:
        return KeepTogether(
            [
                Paragraph(titulo, estilos["section"]),
                Paragraph("Sin datos disponibles.", estilos["small"]),
                Spacer(1, 10),
            ]
        )

    datos = items[:8]
    valores = [int(item.get("total") or 0) for item in datos]
    etiquetas = [str(item.get("nombre") or "Sin dato")[:30] for item in datos]
    maximo = max(valores) if valores else 0

    drawing = Drawing(470, 170)
    chart = HorizontalBarChart()
    chart.x = 115
    chart.y = 25
    chart.height = 115
    chart.width = 310
    chart.data = [valores]
    chart.categoryAxis.categoryNames = etiquetas
    chart.categoryAxis.labels.fontSize = 7
    chart.valueAxis.valueMin = 0
    chart.valueAxis.valueMax = max(maximo, 1)
    chart.valueAxis.valueStep = max(1, round(max(maximo, 1) / 4))
    chart.valueAxis.labels.fontSize = 7
    chart.bars[0].fillColor = colors.HexColor("#1565c0")
    drawing.add(chart)
    drawing.add(String(115, 148, titulo, fontName="Helvetica-Bold", fontSize=9, fillColor=colors.HexColor("#0d2b5e")))

    return KeepTogether([drawing, Spacer(1, 8)])


def _footer(canvas, doc):
    from reportlab.lib.colors import HexColor

    canvas.saveState()
    canvas.setFont("Helvetica", 8)
    canvas.setFillColor(HexColor("#64748b"))
    canvas.drawRightString(doc.pagesize[0] - 36, 24, f"Pagina {doc.page}")
    canvas.restoreState()


def _generar_pdf_reportes(datos: dict, usuario_actual: UsuarioModel):
    try:
        from reportlab.lib import colors
        from reportlab.lib.enums import TA_CENTER
        from reportlab.lib.pagesizes import letter
        from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
        from reportlab.lib.units import inch
        from reportlab.platypus import PageBreak, Paragraph, SimpleDocTemplate, Spacer, Table, TableStyle
    except ImportError as error:
        raise HTTPException(
            status_code=500,
            detail="No se pudo generar el PDF: falta instalar reportlab en el backend.",
        ) from error

    buffer = BytesIO()
    doc = SimpleDocTemplate(
        buffer,
        pagesize=letter,
        rightMargin=36,
        leftMargin=36,
        topMargin=42,
        bottomMargin=42,
        title="Reporte Administrativo",
    )
    sample = getSampleStyleSheet()
    estilos = {
        "title": ParagraphStyle(
            "TitleAdmin",
            parent=sample["Title"],
            textColor=colors.HexColor("#0d2b5e"),
            fontSize=18,
            alignment=TA_CENTER,
            spaceAfter=8,
        ),
        "subtitle": ParagraphStyle(
            "SubtitleAdmin",
            parent=sample["Normal"],
            textColor=colors.HexColor("#475569"),
            fontSize=10,
            alignment=TA_CENTER,
            spaceAfter=3,
        ),
        "section": ParagraphStyle(
            "SectionAdmin",
            parent=sample["Heading2"],
            textColor=colors.HexColor("#0d2b5e"),
            fontSize=12,
            spaceBefore=10,
            spaceAfter=6,
        ),
        "small": ParagraphStyle(
            "SmallAdmin",
            parent=sample["Normal"],
            textColor=colors.HexColor("#475569"),
            fontSize=8,
            leading=10,
        ),
        "table_header": ParagraphStyle(
            "TableHeaderAdmin",
            parent=sample["Normal"],
            textColor=colors.white,
            fontSize=8,
            leading=10,
        ),
        "table_cell": ParagraphStyle(
            "TableCellAdmin",
            parent=sample["Normal"],
            textColor=colors.HexColor("#1e293b"),
            fontSize=7,
            leading=9,
        ),
    }

    contexto = datos.get("contexto") or {}
    resumen = datos.get("resumen") or {}
    distribuciones = datos.get("distribuciones") or {}
    tablas = datos.get("tablas") or {}
    sistema = _texto_pdf(contexto.get("nombre_sistema") or "Sistema Integral de Practicas Profesionales")
    facultad = _texto_pdf(contexto.get("escuela_facultad") or "Institucion")
    usuario_nombre = " ".join(
        parte
        for parte in [
            getattr(usuario_actual, "nombre", None),
            getattr(usuario_actual, "apellido_paterno", None),
            getattr(usuario_actual, "apellido_materno", None),
        ]
        if parte
    ) or getattr(usuario_actual, "correo", "Administrador")
    usuario_nombre = _texto_pdf(usuario_nombre)

    story = [
        Paragraph(sistema, estilos["title"]),
        Paragraph(facultad, estilos["subtitle"]),
        Paragraph("Reporte Administrativo", estilos["title"]),
        Paragraph(f"Fecha de generacion: {datetime.now().strftime('%d/%m/%Y %H:%M')}", estilos["subtitle"]),
        Paragraph(f"Generado por: {usuario_nombre}", estilos["subtitle"]),
        Spacer(1, 12),
    ]

    filtros = _filtros_activos(datos)
    story.append(Paragraph("Filtros aplicados", estilos["section"]))
    if filtros:
        filtros_tabla = Table([[Paragraph("Filtro", estilos["table_header"]), Paragraph("Valor", estilos["table_header"])]]
                              + [[Paragraph(f[0], estilos["table_cell"]), Paragraph(f[1], estilos["table_cell"])] for f in filtros])
        filtros_tabla.setStyle(
            TableStyle(
                [
                    ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#0d2b5e")),
                    ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
                    ("GRID", (0, 0), (-1, -1), 0.35, colors.HexColor("#cbd5e1")),
                    ("VALIGN", (0, 0), (-1, -1), "TOP"),
                ]
            )
        )
        story.extend([filtros_tabla, Spacer(1, 12)])
    else:
        story.extend([Paragraph("Sin filtros aplicados.", estilos["small"]), Spacer(1, 12)])

    resumen_filas = [
        ["Total usuarios", resumen.get("usuarios", 0)],
        ["Alumnos elegibles", resumen.get("alumnos_elegibles", 0)],
        ["Empresas", resumen.get("empresas", 0)],
        ["Solicitudes pendientes", resumen.get("solicitudes_pendientes", 0)],
        ["Convocatorias", resumen.get("convocatorias", 0)],
        ["Tipos de practica", resumen.get("tipos_practica", 0)],
        ["Documentos pendientes", resumen.get("documentos_pendientes", 0)],
        ["Incidencias abiertas", resumen.get("incidencias_abiertas", 0)],
    ]
    story.append(_tabla_pdf("Resumen general", ["Indicador", "Total"], resumen_filas, estilos))

    story.append(Paragraph("Graficos", estilos["section"]))
    for titulo, clave in [
        ("Usuarios por rol", "usuarios_por_rol"),
        ("Usuarios por estado", "usuarios_por_estado"),
        ("Alumnos por carrera", "alumnos_por_carrera"),
        ("Alumnos por tipo de practica", "alumnos_por_tipo_practica"),
        ("Empresas por estado", "empresas_por_estado"),
        ("Solicitudes por estado", "solicitudes_por_estado"),
        ("Convocatorias por tipo de periodo", "convocatorias_por_tipo_periodo"),
    ]:
        story.append(_grafico_barras(titulo, distribuciones.get(clave, []), estilos))

    story.append(PageBreak())
    story.append(_tabla_pdf(
        "Usuarios por rol",
        ["Rol", "Total"],
        [[item.get("nombre"), item.get("total")] for item in distribuciones.get("usuarios_por_rol", [])],
        estilos,
    ))
    story.append(_tabla_pdf(
        "Alumnos por carrera",
        ["Carrera", "Total alumnos"],
        [[item.get("nombre"), item.get("total")] for item in distribuciones.get("alumnos_por_carrera", [])],
        estilos,
    ))

    tipos_lookup = {
        str(item.get("nombre")): item
        for item in tablas.get("tipos_practica", [])
    }
    story.append(_tabla_pdf(
        "Alumnos por tipo de practica",
        ["Tipo de practica", "Total alumnos", "Semestre requerido", "Creditos minimos"],
        [
            [
                item.get("nombre"),
                item.get("total"),
                (tipos_lookup.get(str(item.get("nombre"))) or {}).get("semestre_requerido"),
                (tipos_lookup.get(str(item.get("nombre"))) or {}).get("creditos_minimos"),
            ]
            for item in distribuciones.get("alumnos_por_tipo_practica", [])
        ],
        estilos,
    ))
    story.append(_tabla_pdf(
        "Empresas por estado",
        ["Estado", "Total"],
        [[item.get("nombre"), item.get("total")] for item in distribuciones.get("empresas_por_estado", [])],
        estilos,
    ))
    story.append(_tabla_pdf(
        "Convocatorias",
        ["Nombre", "Tipo periodo", "Estado", "Fecha inicio", "Fecha fin"],
        [
            [
                item.get("nombre"),
                item.get("tipo_periodo"),
                item.get("estado"),
                item.get("fecha_inicio"),
                item.get("fecha_fin"),
            ]
            for item in tablas.get("convocatorias", [])
        ],
        estilos,
    ))
    story.append(_tabla_pdf(
        "Tipos de practica",
        ["Nombre", "Semestre requerido", "Creditos minimos", "Orden", "Activo"],
        [
            [
                item.get("nombre"),
                item.get("semestre_requerido"),
                item.get("creditos_minimos"),
                item.get("orden"),
                item.get("activo"),
            ]
            for item in tablas.get("tipos_practica", [])
        ],
        estilos,
    ))

    doc.build(story, onFirstPage=_footer, onLaterPages=_footer)
    buffer.seek(0)
    return buffer


def _reportes_catalogo(db: Session):
    usuarios = _conteo_tabla(db, "usuario")
    roles = _conteo_tabla(db, "rol")
    alumnos = _conteo_tabla(db, "alumno")
    empresas = _conteo_tabla(db, "empresa")
    convocatorias = _conteo_tabla(db, "convocatoria")
    carreras = _conteo_tabla(db, "carrera")
    tipos_practica = _conteo_tabla(db, "tipo_practica")
    horas = _conteo_tablas_posibles(db, "horas_practica", "horas")
    documentos = _conteo_tablas_posibles(db, "documento_alumno", "documento") + _conteo_tabla(db, "documento_empresa")
    incidencias = _conteo_tabla(db, "incidencia_practica")
    liberaciones = (
        _safe_scalar(
            db,
            "SELECT COUNT(*) FROM liberacion_practica WHERE estado_liberacion = 'Emitida'",
            default=0,
        )
        if _columna_existe(db, "liberacion_practica", "estado_liberacion")
        else 0
    )

    return [
        {
            "clave": "usuarios",
            "titulo": "Reporte de Usuarios",
            "descripcion": "Usuarios registrados, activos e inactivos dentro del sistema.",
            "total": usuarios,
        },
        {
            "clave": "roles",
            "titulo": "Reporte de Roles",
            "descripcion": "Distribucion de usuarios por rol institucional.",
            "total": roles,
        },
        {
            "clave": "alumnos",
            "titulo": "Reporte de Alumnos",
            "descripcion": "Alumnos registrados, expedientes y asignaciones.",
            "total": alumnos,
        },
        {
            "clave": "empresas",
            "titulo": "Reporte de Empresas",
            "descripcion": "Unidades receptoras registradas y estado documental.",
            "total": empresas,
        },
        {
            "clave": "convocatorias",
            "titulo": "Reporte de Convocatorias",
            "descripcion": "Convocatorias por periodo, estado y fechas de vigencia.",
            "total": convocatorias,
        },
        {
            "clave": "carreras",
            "titulo": "Reporte de Carreras",
            "descripcion": "Carreras registradas por tipo de periodo y alumnos asociados.",
            "total": carreras,
        },
        {
            "clave": "tipos_practica",
            "titulo": "Reporte de Tipos de Practica",
            "descripcion": "Tipos de practica, creditos minimos y alumnos asignados.",
            "total": tipos_practica,
        },
        {
            "clave": "horas",
            "titulo": "Reporte de Horas",
            "descripcion": "Horas registradas por alumnos y estado de revision.",
            "total": horas,
        },
        {
            "clave": "documentos",
            "titulo": "Reporte de Documentos",
            "descripcion": "Documentos de alumnos y empresas por estado.",
            "total": documentos,
        },
        {
            "clave": "incidencias",
            "titulo": "Reporte de Incidencias",
            "descripcion": "Quejas e incidencias durante las practicas.",
            "total": incidencias,
        },
        {
            "clave": "liberaciones",
            "titulo": "Reporte de Liberaciones",
            "descripcion": "Alumnos liberados y constancias emitidas.",
            "total": liberaciones,
        },
    ]


def _resumen_elegibilidad(alumnos: list):
    elegibles = 0
    no_elegibles = 0
    sin_tipo = 0
    creditos_insuficientes = 0

    for alumno in alumnos:
        tipo = alumno.tipo_practica
        if tipo is None:
            sin_tipo += 1
            no_elegibles += 1
            continue

        semestre_requerido = tipo.semestre_requerido or 0
        creditos_minimos = tipo.creditos_minimos or 0
        semestre = alumno.semestre or 0
        creditos = alumno.creditos_aprobados or 0

        cumple_semestre = semestre_requerido == 0 or semestre >= semestre_requerido
        cumple_creditos = creditos >= creditos_minimos
        if cumple_semestre and cumple_creditos:
            elegibles += 1
        else:
            no_elegibles += 1
            if not cumple_creditos:
                creditos_insuficientes += 1

    return {
        "alumnos_elegibles": elegibles,
        "alumnos_no_elegibles": no_elegibles,
        "alumnos_sin_tipo_practica": sin_tipo,
        "alumnos_creditos_insuficientes": creditos_insuficientes,
    }


def _resumen_elegibilidad_db(
    db: Session,
    carrera: str,
    semestre: str,
    grupo: str,
    tipo_practica: str,
    periodo_practica: str,
):
    if not _tabla_existe(db, "alumno"):
        return {
            "alumnos_elegibles": 0,
            "alumnos_no_elegibles": 0,
            "alumnos_sin_tipo_practica": 0,
            "alumnos_creditos_insuficientes": 0,
        }

    tiene_id_tipo = _columna_existe(db, "alumno", "id_tipo_practica")
    tiene_creditos = _columna_existe(db, "alumno", "creditos_aprobados")
    tiene_periodo = _columna_existe(db, "alumno", "periodo_practica")
    tiene_grupo = _columna_existe(db, "alumno", "grupo")
    tiene_carrera = _columna_existe(db, "alumno", "id_carrera")
    tiene_semestre = _columna_existe(db, "alumno", "semestre")
    tiene_tipo_tabla = _tabla_existe(db, "tipo_practica")
    tiene_tipo_semestre = _columna_existe(db, "tipo_practica", "semestre_requerido")
    tiene_tipo_creditos = _columna_existe(db, "tipo_practica", "creditos_minimos")

    select_tipo = "a.id_tipo_practica" if tiene_id_tipo else "NULL"
    select_semestre = "a.semestre" if tiene_semestre else "0"
    select_creditos = "a.creditos_aprobados" if tiene_creditos else "0"
    select_tipo_semestre = "tp.semestre_requerido" if tiene_tipo_semestre else "0"
    select_tipo_creditos = "tp.creditos_minimos" if tiene_tipo_creditos else "0"
    join_tipo = (
        "LEFT JOIN tipo_practica tp ON tp.id_tipo_practica = a.id_tipo_practica"
        if tiene_id_tipo and tiene_tipo_tabla
        else ""
    )

    filtros = []
    params: dict[str, object] = {}
    if carrera != "todos" and tiene_carrera:
        filtros.append("a.id_carrera = :carrera")
        params["carrera"] = int(carrera)
    if semestre != "todos" and tiene_semestre:
        filtros.append("a.semestre = :semestre")
        params["semestre"] = int(semestre)
    if grupo.strip() and tiene_grupo:
        filtros.append("a.grupo LIKE :grupo")
        params["grupo"] = _like(grupo)
    if tipo_practica != "todos" and tiene_id_tipo:
        filtros.append("a.id_tipo_practica = :tipo_practica")
        params["tipo_practica"] = int(tipo_practica)
    if periodo_practica != "todos" and tiene_periodo:
        filtros.append("a.periodo_practica = :periodo_practica")
        params["periodo_practica"] = periodo_practica

    where = f"WHERE {' AND '.join(filtros)}" if filtros else ""
    rows = _safe_rows(
        db,
        f"""
        SELECT
            {select_tipo} AS id_tipo_practica,
            COALESCE({select_semestre}, 0) AS semestre,
            COALESCE({select_creditos}, 0) AS creditos_aprobados,
            COALESCE({select_tipo_semestre}, 0) AS semestre_requerido,
            COALESCE({select_tipo_creditos}, 0) AS creditos_minimos
        FROM alumno a
        {join_tipo}
        {where}
        """,
        params,
    )

    alumnos = [
        SimpleNamespace(
            semestre=row.semestre,
            creditos_aprobados=row.creditos_aprobados,
            tipo_practica=(
                SimpleNamespace(
                    semestre_requerido=row.semestre_requerido,
                    creditos_minimos=row.creditos_minimos,
                )
                if row.id_tipo_practica is not None
                else None
            ),
        )
        for row in rows
    ]
    return _resumen_elegibilidad(alumnos)


@router.get("/")
def obtener_reportes_admin(
    periodo: str = Query("todos"),
    modulo: str = Query("todos"),
    rol: str = Query("todos"),
    estado_usuario: str = Query("todos"),
    busqueda: str = Query(""),
    carrera: str = Query("todos"),
    semestre: str = Query("todos"),
    grupo: str = Query(""),
    tipo_practica: str = Query("todos"),
    periodo_practica: str = Query("todos"),
    estado_empresa: str = Query("todos"),
    tipo_tramite: str = Query("todos"),
    tipo_periodo: str = Query("todos"),
    estado_convocatoria: str = Query("todos"),
    db: Session = Depends(obtener_db),
):
    bitacora_query = _query_bitacora(db, periodo, modulo)
    actividad = (
        bitacora_query.order_by(BitacoraAuditoriaModel.fecha.desc())
        .limit(25)
        .all()
    )

    documentos_pendientes = (
        _safe_scalar(db, "SELECT COUNT(*) FROM documento_alumno WHERE estado_documento = 'Pendiente'", default=0)
        if _columna_existe(db, "documento_alumno", "estado_documento")
        else 0
    )
    documentos_empresa_pendientes = (
        _safe_scalar(db, "SELECT COUNT(*) FROM documento_empresa WHERE estado_documento = 'Pendiente'", default=0)
        if _columna_existe(db, "documento_empresa", "estado_documento")
        else 0
    )
    incidencias_abiertas = (
        _safe_scalar(
            db,
            "SELECT COUNT(*) FROM incidencia_practica WHERE estado IN ('Abierta', 'En seguimiento')",
            default=0,
        )
        if _columna_existe(db, "incidencia_practica", "estado")
        else 0
    )
    usuarios_query = db.query(UsuarioModel).outerjoin(RolModel, UsuarioModel.id_rol == RolModel.id_rol)
    if rol != "todos":
        usuarios_query = usuarios_query.filter(RolModel.nombre == rol)
    if estado_usuario != "todos":
        usuarios_query = usuarios_query.filter(UsuarioModel.estado == estado_usuario)
    if busqueda.strip():
        patron = _like(busqueda)
        usuarios_query = usuarios_query.filter(
            (UsuarioModel.correo.ilike(patron))
        )

    alumnos_query = db.query(AlumnoModel)
    if carrera != "todos" and _columna_existe(db, "alumno", "id_carrera"):
        alumnos_query = alumnos_query.filter(AlumnoModel.id_carrera == int(carrera))
    if semestre != "todos" and _columna_existe(db, "alumno", "semestre"):
        alumnos_query = alumnos_query.filter(AlumnoModel.semestre == int(semestre))
    if grupo.strip() and _columna_existe(db, "alumno", "grupo"):
        alumnos_query = alumnos_query.filter(AlumnoModel.grupo.ilike(_like(grupo)))
    if tipo_practica != "todos" and _columna_existe(db, "alumno", "id_tipo_practica"):
        alumnos_query = alumnos_query.filter(AlumnoModel.id_tipo_practica == int(tipo_practica))
    if periodo_practica != "todos" and _columna_existe(db, "alumno", "periodo_practica"):
        alumnos_query = alumnos_query.filter(AlumnoModel.periodo_practica == periodo_practica)
    elegibilidad = _resumen_elegibilidad_db(
        db,
        carrera,
        semestre,
        grupo,
        tipo_practica,
        periodo_practica,
    )

    empresas_query = db.query(EmpresaModel)
    if estado_empresa != "todos":
        empresas_query = empresas_query.filter(EmpresaModel.estado_empresa == estado_empresa)
    if tipo_tramite != "todos" and _columna_existe(db, "empresa", "tipo_tramite"):
        empresas_query = empresas_query.filter(EmpresaModel.tipo_tramite == tipo_tramite)
    if busqueda.strip():
        patron = _like(busqueda)
        empresas_query = empresas_query.filter(
            (EmpresaModel.nombre_empresa.ilike(patron)) | (EmpresaModel.rfc.ilike(patron))
        )

    convocatorias_query = db.query(ConvocatoriaModel)
    if tipo_periodo != "todos" and _columna_existe(db, "convocatoria", "tipo_periodo"):
        convocatorias_query = convocatorias_query.filter(ConvocatoriaModel.tipo_periodo == tipo_periodo)
    if estado_convocatoria != "todos":
        convocatorias_query = convocatorias_query.filter(ConvocatoriaModel.estado == estado_convocatoria)

    carreras_query = db.query(CarreraModel)
    if tipo_periodo != "todos" and _columna_existe(db, "carrera", "tipo_periodo"):
        carreras_query = carreras_query.filter(CarreraModel.tipo_periodo == tipo_periodo)

    config = _configuracion_actual(db)
    solicitudes_pendientes = (
        _safe_scalar(
            db,
            "SELECT COUNT(*) FROM solicitud_empresa WHERE estado_solicitud IN ('Recibida', 'En revision')",
            default=0,
        )
        if _columna_existe(db, "solicitud_empresa", "estado_solicitud")
        else 0
    )
    vacantes_activas = (
        _safe_scalar(db, "SELECT COUNT(*) FROM vacante WHERE estado_vacante = 'Activa'", default=0)
        if _columna_existe(db, "vacante", "estado_vacante")
        else 0
    )
    vacantes_prepadron = (
        _safe_scalar(db, "SELECT COUNT(*) FROM vacante WHERE estado_vacante = 'PrePadron'", default=0)
        if _columna_existe(db, "vacante", "estado_vacante")
        else 0
    )
    usuarios_activos_filtrados = _conteo_query_id(
        usuarios_query.filter(UsuarioModel.estado == "Activo"),
        UsuarioModel.id_usuario,
    )
    usuarios_inactivos_filtrados = _conteo_query_id(
        usuarios_query.filter(UsuarioModel.estado == "Inactivo"),
        UsuarioModel.id_usuario,
    )

    return {
        "resumen": {
            "usuarios": _conteo_query_id(usuarios_query, UsuarioModel.id_usuario),
            "usuarios_activos": usuarios_activos_filtrados,
            "usuarios_inactivos": usuarios_inactivos_filtrados,
            "usuarios_cambio_password_pendiente": (
                db.query(UsuarioModel).filter(UsuarioModel.debe_cambiar_password.is_(True)).count()
                if _columna_existe(db, "usuario", "debe_cambiar_password")
                else 0
            ),
            "roles": _conteo_tabla(db, "rol"),
            "alumnos": _conteo_query_id(alumnos_query, AlumnoModel.id_alumno),
            **elegibilidad,
            "empresas": _conteo_query_id(empresas_query, EmpresaModel.id_empresa),
            "solicitudes_pendientes": solicitudes_pendientes,
            "documentos": _conteo_tablas_posibles(db, "documento_alumno", "documento") + _conteo_tabla(db, "documento_empresa"),
            "documentos_pendientes": documentos_pendientes + documentos_empresa_pendientes,
            "reportes": _conteo_tablas_posibles(db, "reporte_practica", "reporte"),
            "horas": _conteo_tablas_posibles(db, "horas_practica", "horas"),
            "incidencias_abiertas": incidencias_abiertas,
            "liberaciones_emitidas": (
                _safe_scalar(
                    db,
                    "SELECT COUNT(*) FROM liberacion_practica WHERE estado_liberacion = 'Emitida'",
                    default=0,
                )
                if _columna_existe(db, "liberacion_practica", "estado_liberacion")
                else 0
            ),
            "acciones_auditoria": _conteo_query_id(bitacora_query, BitacoraAuditoriaModel.id_bitacora),
            "convocatorias": _conteo_query_id(convocatorias_query, ConvocatoriaModel.id_convocatoria),
            "carreras": _conteo_query_id(carreras_query, CarreraModel.id_carrera),
            "tipos_practica": _conteo_tabla(db, "tipo_practica"),
            "vacantes_activas": vacantes_activas,
            "vacantes_prepadron": vacantes_prepadron,
        },
        "reportes": _reportes_catalogo(db),
        "distribuciones": {
            "usuarios_por_rol": [
                {"nombre": nombre or "Sin rol", "total": total}
                for nombre, total in (
                    usuarios_query.with_entities(RolModel.nombre, func.count(UsuarioModel.id_usuario))
                    .group_by(RolModel.nombre)
                    .all()
                )
            ],
            "usuarios_por_estado": _conteo_query_por_campo(usuarios_query, UsuarioModel.estado),
            "alumnos_por_estado": (
                _conteo_query_por_campo(alumnos_query, AlumnoModel.estado_alumno)
                if _columna_existe(db, "alumno", "estado_alumno")
                else []
            ),
            "alumnos_por_carrera": [
                {"nombre": nombre or "Sin carrera", "total": total}
                for nombre, total in (
                    alumnos_query.with_entities(CarreraModel.nombre, func.count(AlumnoModel.id_alumno))
                    .outerjoin(CarreraModel, AlumnoModel.id_carrera == CarreraModel.id_carrera)
                    .group_by(CarreraModel.nombre)
                    .all()
                )
            ] if _columna_existe(db, "alumno", "id_carrera") else [],
            "alumnos_por_semestre": (
                _conteo_query_por_campo(alumnos_query, AlumnoModel.semestre)
                if _columna_existe(db, "alumno", "semestre")
                else []
            ),
            "alumnos_por_grupo": (
                _conteo_query_por_campo(alumnos_query, AlumnoModel.grupo)
                if _columna_existe(db, "alumno", "grupo")
                else []
            ),
            "alumnos_por_tipo_practica": ([
                {"nombre": nombre or "Sin tipo", "total": total}
                for nombre, total in (
                    alumnos_query.with_entities(TipoPracticaModel.nombre, func.count(AlumnoModel.id_alumno))
                    .outerjoin(TipoPracticaModel, AlumnoModel.id_tipo_practica == TipoPracticaModel.id_tipo_practica)
                    .group_by(TipoPracticaModel.nombre)
                    .all()
                )
            ] if _columna_existe(db, "alumno", "id_tipo_practica") else []),
            "empresas_por_estado": _conteo_query_por_campo(empresas_query, EmpresaModel.estado_empresa),
            "empresas_por_tipo_tramite": (
                _conteo_query_por_campo(empresas_query, EmpresaModel.tipo_tramite)
                if _columna_existe(db, "empresa", "tipo_tramite")
                else []
            ),
            "solicitudes_por_estado": _conteo_por_campo(db, SolicitudEmpresaModel, SolicitudEmpresaModel.estado_solicitud),
            "convocatorias_por_estado": _conteo_query_por_campo(convocatorias_query, ConvocatoriaModel.estado),
            "convocatorias_por_tipo_periodo": (
                _conteo_query_por_campo(convocatorias_query, ConvocatoriaModel.tipo_periodo)
                if _columna_existe(db, "convocatoria", "tipo_periodo")
                else []
            ),
            "carreras_por_tipo_periodo": (
                _conteo_query_por_campo(carreras_query, CarreraModel.tipo_periodo)
                if _columna_existe(db, "carrera", "tipo_periodo")
                else []
            ),
            "documentos_por_estado": _conteo_estado_tablas_posibles(db, "estado_documento", "documento_alumno", "documento"),
            "horas_por_estado": _conteo_estado_tablas_posibles(db, "estado_horas", "horas_practica", "horas"),
            "reportes_por_estado": _conteo_estado_tablas_posibles(db, "estado_reporte", "reporte_practica", "reporte"),
            "incidencias_por_estado": _conteo_por_campo(db, IncidenciaPracticaModel, IncidenciaPracticaModel.estado),
        },
        "modulos": [
            "usuario",
            "rol",
            "alumno",
            "empresa",
            "documento",
            "documento_empresa",
            "horas_practica",
            "reporte_practica",
            "incidencia_practica",
            "liberacion_practica",
            "convocatoria",
            "carrera",
            "tipo_practica",
        ],
        "actividad": [_actividad_response(item) for item in actividad],
        "contexto": {
            "estado_sistema": config.estado_sistema if config is not None else "Activo",
            "inscripcion_empresas_estado": (
                config.inscripcion_empresas_estado if config is not None else "Abierta"
            ),
            "convocatorias": _conteo_query_id(convocatorias_query, ConvocatoriaModel.id_convocatoria),
            "convocatoria_activa": (
                _safe_scalar(
                    db,
                    "SELECT nombre FROM convocatoria WHERE estado = 'Activa' ORDER BY fecha_inicio_general DESC, id_convocatoria DESC LIMIT 1",
                    default=None,
                )
                if _columna_existe(db, "convocatoria", "estado")
                and _columna_existe(db, "convocatoria", "fecha_inicio_general")
                else _safe_scalar(
                    db,
                    "SELECT nombre FROM convocatoria WHERE estado = 'Activa' ORDER BY id_convocatoria DESC LIMIT 1",
                    default=None,
                )
                if _columna_existe(db, "convocatoria", "estado")
                else None
            ),
            "expedientes": _conteo_tablas_posibles(db, "expediente_alumno", "expediente"),
            "asignaciones": _conteo_tabla(db, "asignacion"),
            "evaluaciones": _conteo_tablas_posibles(db, "evaluacion_practica", "evaluacion") + _conteo_tabla(db, "evaluacion_alumno_empresa"),
            "notificaciones": _conteo_tabla(db, "notificacion"),
        },
        "tablas": {
            "ultimos_usuarios": _tabla_ultimos_usuarios(db, rol, estado_usuario, busqueda),
            "tipos_practica": _tabla_tipos_practica(db),
            "convocatorias": _tabla_convocatorias(db, tipo_periodo, estado_convocatoria),
            "carreras": _tabla_carreras(db, tipo_periodo),
        },
        "filtros": {
            "periodo": periodo,
            "modulo": modulo,
            "rol": rol,
            "estado_usuario": estado_usuario,
            "busqueda": busqueda,
            "carrera": carrera,
            "semestre": semestre,
            "grupo": grupo,
            "tipo_practica": tipo_practica,
            "periodo_practica": periodo_practica,
            "estado_empresa": estado_empresa,
            "tipo_tramite": tipo_tramite,
            "tipo_periodo": tipo_periodo,
            "estado_convocatoria": estado_convocatoria,
        },
    }


@router.get("/exportar")
def exportar_reportes_admin(
    formato: str = Query("pdf"),
    periodo: str = Query("todos"),
    modulo: str = Query("todos"),
    rol: str = Query("todos"),
    estado_usuario: str = Query("todos"),
    busqueda: str = Query(""),
    carrera: str = Query("todos"),
    semestre: str = Query("todos"),
    grupo: str = Query(""),
    tipo_practica: str = Query("todos"),
    periodo_practica: str = Query("todos"),
    estado_empresa: str = Query("todos"),
    tipo_tramite: str = Query("todos"),
    tipo_periodo: str = Query("todos"),
    estado_convocatoria: str = Query("todos"),
    db: Session = Depends(obtener_db),
    usuario_actual: UsuarioModel = Depends(obtener_usuario_actual),
):
    if formato.lower() != "pdf":
        raise HTTPException(status_code=400, detail="Solo se permite exportar reportes administrativos en PDF")

    datos = obtener_reportes_admin(
        periodo,
        modulo,
        rol,
        estado_usuario,
        busqueda,
        carrera,
        semestre,
        grupo,
        tipo_practica,
        periodo_practica,
        estado_empresa,
        tipo_tramite,
        tipo_periodo,
        estado_convocatoria,
        db,
    )
    pdf = _generar_pdf_reportes(datos, usuario_actual)
    filename = "reporte_administrativo.pdf"
    registrar_bitacora(
        db,
        usuario_actual.id_usuario,
        "Exportar reporte administrativo",
        "reportes",
        "Admin exporto reporte administrativo en PDF",
        "reporte_admin",
        None,
    )
    return StreamingResponse(
        pdf,
        media_type="application/pdf",
        headers={"Content-Disposition": f"attachment; filename={filename}"},
    )
