from __future__ import annotations

from datetime import date, datetime, timedelta
from io import BytesIO
from typing import Any
from xml.sax.saxutils import escape

from fastapi import APIRouter, Depends, HTTPException, Query
from fastapi.responses import StreamingResponse
from sqlalchemy import inspect, text
from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy.orm import Session

from infrastructure.database.dependencies import obtener_db
from infrastructure.persistence.models.usuario import UsuarioModel
from infrastructure.security.auth_dependencies import obtener_usuario_actual, requerir_roles


router = APIRouter(
    prefix="/direccion",
    tags=["Direccion"],
    dependencies=[Depends(requerir_roles(["Direccion", "Administrador"]))],
)


def _tabla_existe(db: Session, tabla: str) -> bool:
    return inspect(db.bind).has_table(tabla)


def _columna_existe(db: Session, tabla: str, columna: str) -> bool:
    if not _tabla_existe(db, tabla):
        return False
    return any(item["name"] == columna for item in inspect(db.bind).get_columns(tabla))


def _safe_scalar(db: Session, sql: str, params: dict[str, Any] | None = None, default: int | float = 0):
    try:
        return db.execute(text(sql), params or {}).scalar() or default
    except SQLAlchemyError:
        db.rollback()
        return default


def _safe_rows(db: Session, sql: str, params: dict[str, Any] | None = None):
    try:
        return db.execute(text(sql), params or {}).mappings().all()
    except SQLAlchemyError:
        db.rollback()
        return []


def _conteo_tabla(db: Session, tabla: str) -> int:
    if not _tabla_existe(db, tabla):
        return 0
    return int(_safe_scalar(db, f"SELECT COUNT(*) FROM `{tabla}`", default=0))


def _limpio(valor: str | int | None) -> bool:
    return valor not in (None, "", "todos", "Todas", "Todos")


def _like(valor: str):
    return f"%{valor.strip()}%"


def _filtros_alumno(filtros: dict[str, Any]):
    where: list[str] = []
    params: dict[str, Any] = {}
    if _limpio(filtros.get("carrera")):
        where.append("c.nombre = :carrera")
        params["carrera"] = filtros["carrera"]
    if _limpio(filtros.get("tipo_practica")):
        where.append("tp.nombre = :tipo_practica")
        params["tipo_practica"] = filtros["tipo_practica"]
    if _limpio(filtros.get("periodo_practica")):
        where.append("a.periodo_practica = :periodo_practica")
        params["periodo_practica"] = filtros["periodo_practica"]
    if _limpio(filtros.get("semestre")):
        where.append("a.semestre = :semestre")
        params["semestre"] = int(filtros["semestre"])
    if _limpio(filtros.get("grupo")):
        where.append("a.grupo LIKE :grupo")
        params["grupo"] = _like(str(filtros["grupo"]))
    if _limpio(filtros.get("convocatoria")):
        where.append("(cv.nombre = :convocatoria OR cv.tipo_periodo = :convocatoria)")
        params["convocatoria"] = filtros["convocatoria"]
    return where, params


def _filtros_empresa(filtros: dict[str, Any]):
    where: list[str] = []
    params: dict[str, Any] = {}
    if _limpio(filtros.get("estado_empresa")):
        where.append("e.estado_empresa = :estado_empresa")
        params["estado_empresa"] = filtros["estado_empresa"]
    if _limpio(filtros.get("tipo_tramite")):
        where.append("e.tipo_tramite = :tipo_tramite")
        params["tipo_tramite"] = filtros["tipo_tramite"]
    return where, params


def _filtros_vacante(filtros: dict[str, Any]):
    where: list[str] = []
    params: dict[str, Any] = {}
    if _limpio(filtros.get("estado_vacante")):
        where.append("v.estado_vacante = :estado_vacante")
        params["estado_vacante"] = filtros["estado_vacante"]
    if _limpio(filtros.get("tipo_practica")):
        where.append("tp.nombre = :tipo_practica_v")
        params["tipo_practica_v"] = filtros["tipo_practica"]
    if _limpio(filtros.get("periodo_practica")):
        where.append("v.periodo = :periodo_practica_v")
        params["periodo_practica_v"] = filtros["periodo_practica"]
    if _limpio(filtros.get("convocatoria")):
        where.append("(cv.nombre = :convocatoria_v OR cv.tipo_periodo = :convocatoria_v)")
        params["convocatoria_v"] = filtros["convocatoria"]
    return where, params


def _filtros_convenio(filtros: dict[str, Any]):
    where: list[str] = []
    params: dict[str, Any] = {}
    if _limpio(filtros.get("estado_convenio")):
        where.append("co.estado_convenio = :estado_convenio")
        params["estado_convenio"] = filtros["estado_convenio"]
    empresa_where, empresa_params = _filtros_empresa(filtros)
    where.extend(empresa_where)
    params.update(empresa_params)
    return where, params


def _where(where: list[str]) -> str:
    return f"WHERE {' AND '.join(where)}" if where else ""


def _base_alumno_sql(select_sql: str, where_extra: list[str], filtros: dict[str, Any]):
    where, params = _filtros_alumno(filtros)
    where.extend(where_extra)
    return (
        f"""
        SELECT {select_sql}
        FROM alumno a
        LEFT JOIN carrera c ON c.id_carrera = a.id_carrera
        LEFT JOIN tipo_practica tp ON tp.id_tipo_practica = a.id_tipo_practica
        LEFT JOIN asignacion asg ON asg.id_alumno = a.id_alumno
        LEFT JOIN convocatoria cv ON cv.id_convocatoria = asg.id_convocatoria
        {_where(where)}
        """,
        params,
    )


def _base_vacante_sql(select_sql: str, where_extra: list[str], filtros: dict[str, Any]):
    where, params = _filtros_vacante(filtros)
    where.extend(where_extra)
    return (
        f"""
        SELECT {select_sql}
        FROM vacante v
        LEFT JOIN tipo_practica tp ON tp.id_tipo_practica = v.id_tipo_practica
        LEFT JOIN convocatoria cv ON cv.id_convocatoria = v.id_convocatoria
        {_where(where)}
        """,
        params,
    )


def _distribucion_alumnos(db: Session, campo: str, alias: str, filtros: dict[str, Any]):
    sql, params = _base_alumno_sql(
        f"COALESCE(CAST({campo} AS CHAR), 'Sin dato') AS nombre, COUNT(DISTINCT a.id_alumno) AS total",
        [],
        filtros,
    )
    rows = _safe_rows(db, f"{sql} GROUP BY {campo} ORDER BY total DESC, nombre ASC", params)
    return [{"nombre": row["nombre"] or alias, "total": int(row["total"] or 0)} for row in rows]


def _distribucion_empresas(db: Session, columna: str, filtros: dict[str, Any]):
    where, params = _filtros_empresa(filtros)
    rows = _safe_rows(
        db,
        f"""
        SELECT COALESCE(CAST(e.{columna} AS CHAR), 'Sin dato') AS nombre, COUNT(*) AS total
        FROM empresa e
        {_where(where)}
        GROUP BY e.{columna}
        ORDER BY total DESC, nombre ASC
        """,
        params,
    )
    return [{"nombre": row["nombre"], "total": int(row["total"] or 0)} for row in rows]


def _distribucion_convenios(db: Session, filtros: dict[str, Any]):
    where, params = _filtros_convenio(filtros)
    rows = _safe_rows(
        db,
        f"""
        SELECT COALESCE(CAST(co.estado_convenio AS CHAR), 'Sin dato') AS nombre, COUNT(*) AS total
        FROM convenio co
        LEFT JOIN empresa e ON e.id_empresa = co.id_empresa
        {_where(where)}
        GROUP BY co.estado_convenio
        ORDER BY total DESC, nombre ASC
        """,
        params,
    )
    return [{"nombre": row["nombre"], "total": int(row["total"] or 0)} for row in rows]


def _distribucion_vacantes(db: Session, campo: str, filtros: dict[str, Any]):
    sql, params = _base_vacante_sql(
        f"COALESCE(CAST({campo} AS CHAR), 'Sin dato') AS nombre, COUNT(DISTINCT v.id_vacante) AS total",
        [],
        filtros,
    )
    rows = _safe_rows(db, f"{sql} GROUP BY {campo} ORDER BY total DESC, nombre ASC", params)
    return [{"nombre": row["nombre"], "total": int(row["total"] or 0)} for row in rows]


def _horas_por_mes(db: Session, filtros: dict[str, Any]):
    where, params = _filtros_alumno(filtros)
    rows = _safe_rows(
        db,
        f"""
        SELECT DATE_FORMAT(h.fecha, '%Y-%m') AS mes, COALESCE(SUM(h.horas_realizadas), 0) AS horas
        FROM horas_practica h
        LEFT JOIN asignacion asg ON asg.id_asignacion = h.id_asignacion
        LEFT JOIN alumno a ON a.id_alumno = asg.id_alumno
        LEFT JOIN carrera c ON c.id_carrera = a.id_carrera
        LEFT JOIN tipo_practica tp ON tp.id_tipo_practica = a.id_tipo_practica
        LEFT JOIN convocatoria cv ON cv.id_convocatoria = asg.id_convocatoria
        {_where(where)}
        GROUP BY DATE_FORMAT(h.fecha, '%Y-%m')
        ORDER BY mes ASC
        """,
        params,
    )
    return [{"mes": row["mes"] or "Sin fecha", "horas": float(row["horas"] or 0)} for row in rows]


def _convocatorias(db: Session, filtros: dict[str, Any]):
    where: list[str] = []
    params: dict[str, Any] = {}
    if _limpio(filtros.get("convocatoria")):
        where.append("(cv.nombre = :convocatoria OR cv.tipo_periodo = :convocatoria)")
        params["convocatoria"] = filtros["convocatoria"]
    if _limpio(filtros.get("tipo_periodo")):
        where.append("cv.tipo_periodo = :tipo_periodo")
        params["tipo_periodo"] = filtros["tipo_periodo"]
    rows = _safe_rows(
        db,
        f"""
        SELECT
            cv.id_convocatoria,
            cv.nombre AS convocatoria,
            cv.tipo_periodo AS periodo,
            cv.tipo_periodo,
            cv.estado,
            COUNT(DISTINCT asg.id_alumno) AS alumnos,
            COUNT(DISTINCT asg.id_empresa) AS empresas,
            COUNT(DISTINCT co.id_convenio) AS convenios,
            COUNT(DISTINCT i.id_incidencia) AS incidencias,
            COUNT(DISTINCT l.id_liberacion) AS concluidas
        FROM convocatoria cv
        LEFT JOIN asignacion asg ON asg.id_convocatoria = cv.id_convocatoria
        LEFT JOIN convenio co ON co.id_empresa = asg.id_empresa
        LEFT JOIN incidencia_practica i ON i.id_asignacion = asg.id_asignacion
        LEFT JOIN liberacion_practica l ON l.id_asignacion = asg.id_asignacion
        {_where(where)}
        GROUP BY cv.id_convocatoria, cv.nombre, cv.tipo_periodo, cv.estado
        ORDER BY cv.fecha_inicio_general DESC, cv.id_convocatoria DESC
        """,
        params,
    )
    return [
        {
            "convocatoria": row["convocatoria"] or "Sin nombre",
            "periodo": row["periodo"] or "Sin periodo",
            "tipo_periodo": row["tipo_periodo"] or "Sin dato",
            "alumnos": int(row["alumnos"] or 0),
            "empresas": int(row["empresas"] or 0),
            "convenios": int(row["convenios"] or 0),
            "incidencias": int(row["incidencias"] or 0),
            "concluidas": int(row["concluidas"] or 0),
            "estado": row["estado"] or "Sin estado",
        }
        for row in rows
    ]


def _catalogos_filtros(db: Session):
    def valores(tabla: str, columna: str):
        if not _columna_existe(db, tabla, columna):
            return []
        rows = _safe_rows(
            db,
            f"""
            SELECT DISTINCT `{columna}` AS valor
            FROM `{tabla}`
            WHERE `{columna}` IS NOT NULL AND `{columna}` <> ''
            ORDER BY `{columna}`
            """,
        )
        return [row["valor"] for row in rows]

    return {
        "convocatorias": valores("convocatoria", "nombre"),
        "carreras": valores("carrera", "nombre"),
        "tipos_practica": valores("tipo_practica", "nombre"),
        "periodos_practica": valores("alumno", "periodo_practica"),
        "semestres": valores("alumno", "semestre"),
        "grupos": valores("alumno", "grupo"),
        "estados_empresa": valores("empresa", "estado_empresa"),
        "estados_vacante": valores("vacante", "estado_vacante"),
        "estados_convenio": valores("convenio", "estado_convenio"),
        "tipos_tramite": valores("empresa", "tipo_tramite"),
        "tipos_periodo": valores("convocatoria", "tipo_periodo"),
    }


def _configuracion(db: Session):
    if not _tabla_existe(db, "configuracion_sistema"):
        return {
            "nombre_sistema": "Sistema Integral de Practicas Profesionales",
            "escuela_facultad": "Institucion",
        }
    row = _safe_rows(
        db,
        """
        SELECT nombre_sistema, escuela_facultad
        FROM configuracion_sistema
        ORDER BY id_configuracion DESC
        LIMIT 1
        """,
    )
    if not row:
        return {
            "nombre_sistema": "Sistema Integral de Practicas Profesionales",
            "escuela_facultad": "Institucion",
        }
    return dict(row[0])


def _obtener_indicadores(db: Session, filtros: dict[str, Any]):
    hoy = date.today()
    limite_vencimiento = hoy + timedelta(days=30)

    alumnos_sql, alumnos_params = _base_alumno_sql("COUNT(DISTINCT a.id_alumno)", [], filtros)
    asignados_sql, asignados_params = _base_alumno_sql(
        "COUNT(DISTINCT a.id_alumno)",
        ["asg.id_asignacion IS NOT NULL"],
        filtros,
    )
    en_proceso_sql, en_proceso_params = _base_alumno_sql(
        "COUNT(DISTINCT a.id_alumno)",
        ["asg.estado_asignacion = 'Activa'"],
        filtros,
    )
    sin_asignacion_sql, sin_asignacion_params = _base_alumno_sql(
        "COUNT(DISTINCT a.id_alumno)",
        ["asg.id_asignacion IS NULL"],
        filtros,
    )

    empresas_where, empresas_params = _filtros_empresa(filtros)
    convenios_where, convenios_params = _filtros_convenio(filtros)
    vacantes_sql, vacantes_params = _base_vacante_sql("COUNT(DISTINCT v.id_vacante)", [], filtros)
    vacantes_activas_sql, vacantes_activas_params = _base_vacante_sql(
        "COUNT(DISTINCT v.id_vacante)",
        ["v.estado_vacante = 'Activa'"],
        filtros,
    )
    vacantes_prepadron_sql, vacantes_prepadron_params = _base_vacante_sql(
        "COUNT(DISTINCT v.id_vacante)",
        ["v.estado_vacante = 'PrePadron'"],
        filtros,
    )

    convocatoria = _safe_rows(
        db,
        """
        SELECT nombre
        FROM convocatoria
        WHERE estado = 'Activa'
        ORDER BY fecha_inicio_general DESC
        LIMIT 1
        """,
    )

    total_empresas = _safe_scalar(
        db,
        f"SELECT COUNT(*) FROM empresa e {_where(empresas_where)}",
        empresas_params,
    )
    empresas_activas_where = empresas_where + ["e.estado_empresa = 'Activa'"]
    empresas_pendientes_where = empresas_where + ["e.estado_empresa IN ('Pendiente', 'Solicitante')"]
    empresas_activas = _safe_scalar(
        db,
        f"SELECT COUNT(*) FROM empresa e {_where(empresas_activas_where)}",
        empresas_params,
    )
    empresas_pendientes = _safe_scalar(
        db,
        f"SELECT COUNT(*) FROM empresa e {_where(empresas_pendientes_where)}",
        empresas_params,
    )

    total_convenios = _safe_scalar(
        db,
        f"""
        SELECT COUNT(*)
        FROM convenio co
        LEFT JOIN empresa e ON e.id_empresa = co.id_empresa
        {_where(convenios_where)}
        """,
        convenios_params,
    )
    convenios_vigentes = _safe_scalar(
        db,
        f"""
        SELECT COUNT(*)
        FROM convenio co
        LEFT JOIN empresa e ON e.id_empresa = co.id_empresa
        {_where(convenios_where + ["co.estado_convenio = 'Vigente'"])}
        """,
        convenios_params,
    )
    convenios_por_vencer = _safe_scalar(
        db,
        f"""
        SELECT COUNT(*)
        FROM convenio co
        LEFT JOIN empresa e ON e.id_empresa = co.id_empresa
        {_where(convenios_where + ["co.fecha_fin >= :hoy", "co.fecha_fin <= :limite"])}
        """,
        {**convenios_params, "hoy": hoy, "limite": limite_vencimiento},
    )
    convenios_vencidos = _safe_scalar(
        db,
        f"""
        SELECT COUNT(*)
        FROM convenio co
        LEFT JOIN empresa e ON e.id_empresa = co.id_empresa
        {_where(convenios_where + ["co.fecha_fin < :hoy"])}
        """,
        {**convenios_params, "hoy": hoy},
    )

    reportes = [
        {"tipo": "general", "titulo": "Reporte general institucional", "descripcion": "Indicadores globales de alumnos, empresas, convenios, vacantes y convocatorias.", "registros": int(_safe_scalar(db, alumnos_sql, alumnos_params))},
        {"tipo": "alumnos", "titulo": "Reporte de alumnos", "descripcion": "Distribución de alumnos por carrera, semestre, tipo de práctica y asignación.", "registros": int(_safe_scalar(db, alumnos_sql, alumnos_params))},
        {"tipo": "empresas", "titulo": "Reporte de empresas / unidades receptoras", "descripcion": "Estado institucional de unidades receptoras y su participación.", "registros": int(total_empresas or 0)},
        {"tipo": "convenios", "titulo": "Reporte de convenios", "descripcion": "Convenios vigentes, vencidos y próximos a vencer.", "registros": int(total_convenios or 0)},
        {"tipo": "vacantes", "titulo": "Reporte de vacantes / padrón", "descripcion": "Vacantes pendientes, PrePadrón, activas y por tipo de práctica.", "registros": int(_safe_scalar(db, vacantes_sql, vacantes_params))},
        {"tipo": "convocatorias", "titulo": "Reporte por convocatoria", "descripcion": "Historial institucional de convocatorias y participación.", "registros": _conteo_tabla(db, "convocatoria")},
        {"tipo": "carreras", "titulo": "Reporte por carrera", "descripcion": "Participación de alumnos por carrera.", "registros": int(_safe_scalar(db, alumnos_sql, alumnos_params))},
    ]

    return {
        "contexto": {
            **_configuracion(db),
            "convocatoria_activa": convocatoria[0]["nombre"] if convocatoria else None,
            "fecha_actualizacion": hoy.isoformat(),
        },
        "filtros": filtros,
        "catalogos": _catalogos_filtros(db),
        "resumen": {
            "alumnos": int(_safe_scalar(db, alumnos_sql, alumnos_params)),
            "alumnos_en_proceso": int(_safe_scalar(db, en_proceso_sql, en_proceso_params)),
            "alumnos_asignados": int(_safe_scalar(db, asignados_sql, asignados_params)),
            "alumnos_sin_asignacion": int(_safe_scalar(db, sin_asignacion_sql, sin_asignacion_params)),
            "empresas": int(total_empresas or 0),
            "empresas_activas": int(empresas_activas or 0),
            "empresas_pendientes": int(empresas_pendientes or 0),
            "convenios": int(total_convenios or 0),
            "convenios_vigentes": int(convenios_vigentes or 0),
            "convenios_por_vencer": int(convenios_por_vencer or 0),
            "convenios_vencidos": int(convenios_vencidos or 0),
            "vacantes": int(_safe_scalar(db, vacantes_sql, vacantes_params)),
            "vacantes_publicadas": int(_safe_scalar(db, vacantes_activas_sql, vacantes_activas_params)),
            "vacantes_prepadron": int(_safe_scalar(db, vacantes_prepadron_sql, vacantes_prepadron_params)),
            "convocatorias": _conteo_tabla(db, "convocatoria"),
            "incidencias_abiertas": int(_safe_scalar(db, "SELECT COUNT(*) FROM incidencia_practica WHERE estado IN ('Abierta', 'En seguimiento')")),
            "horas_registradas": float(_safe_scalar(db, "SELECT COALESCE(SUM(horas_realizadas), 0) FROM horas_practica", default=0)),
        },
        "alumnos_por_carrera": _distribucion_alumnos(db, "c.nombre", "Sin carrera", filtros),
        "alumnos_por_semestre": _distribucion_alumnos(db, "a.semestre", "Sin semestre", filtros),
        "alumnos_por_tipo_practica": _distribucion_alumnos(db, "tp.nombre", "Sin tipo", filtros),
        "alumnos_por_estado": _distribucion_alumnos(db, "a.estado_alumno", "Sin estado", filtros),
        "empresas_por_estado": _distribucion_empresas(db, "estado_empresa", filtros),
        "empresas_por_tipo_tramite": _distribucion_empresas(db, "tipo_tramite", filtros),
        "empresas_por_periodo": _distribucion_vacantes(db, "v.periodo", filtros),
        "convenios_por_estado": _distribucion_convenios(db, filtros),
        "vacantes_por_estado": _distribucion_vacantes(db, "v.estado_vacante", filtros),
        "vacantes_por_tipo_practica": _distribucion_vacantes(db, "tp.nombre", filtros),
        "vacantes_por_periodo": _distribucion_vacantes(db, "v.periodo", filtros),
        "convocatorias_por_tipo_periodo": [
            {"nombre": item["nombre"], "total": item["total"]}
            for item in _safe_rows(
                db,
                "SELECT COALESCE(tipo_periodo, 'Sin dato') AS nombre, COUNT(*) AS total FROM convocatoria GROUP BY tipo_periodo",
            )
        ],
        "horas_por_mes": _horas_por_mes(db, filtros),
        "convocatorias": _convocatorias(db, filtros),
        "reportes": reportes,
    }


def _query_filtros(
    convocatoria: str = "todos",
    carrera: str = "todos",
    tipo_practica: str = "todos",
    periodo_practica: str = "todos",
    semestre: int | None = None,
    grupo: str = "",
    estado_empresa: str = "todos",
    estado_vacante: str = "todos",
    estado_convenio: str = "todos",
    tipo_tramite: str = "todos",
    tipo_periodo: str = "todos",
):
    return {
        "convocatoria": convocatoria,
        "carrera": carrera,
        "tipo_practica": tipo_practica,
        "periodo_practica": periodo_practica,
        "semestre": semestre,
        "grupo": grupo,
        "estado_empresa": estado_empresa,
        "estado_vacante": estado_vacante,
        "estado_convenio": estado_convenio,
        "tipo_tramite": tipo_tramite,
        "tipo_periodo": tipo_periodo,
    }


@router.get("/indicadores")
def obtener_indicadores_direccion(
    filtros: dict[str, Any] = Depends(_query_filtros),
    db: Session = Depends(obtener_db),
):
    return _obtener_indicadores(db, filtros)


def _texto_pdf(valor: Any) -> str:
    if valor is None or valor == "":
        return "Sin dato"
    if isinstance(valor, bool):
        return "Si" if valor else "No"
    return escape(str(valor))


def _tabla_pdf(titulo: str, encabezados: list[str], filas: list[list[Any]], estilos):
    from reportlab.lib import colors
    from reportlab.platypus import KeepTogether, Paragraph, Spacer, Table, TableStyle

    if not filas:
        return _bloque_sin_datos(titulo, estilos)

    contenido = [[Paragraph(str(celda), estilos["table_header"]) for celda in encabezados]]
    for fila in filas:
        contenido.append([Paragraph(_texto_pdf(celda), estilos["table_cell"]) for celda in fila])

    tabla = Table(contenido, repeatRows=1, hAlign="LEFT")
    tabla.setStyle(
        TableStyle(
            [
                ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#0B2E63")),
                ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
                ("LINEBELOW", (0, 0), (-1, 0), 1, colors.HexColor("#C9A227")),
                ("GRID", (0, 0), (-1, -1), 0.25, colors.HexColor("#D9E2EC")),
                ("VALIGN", (0, 0), (-1, -1), "TOP"),
                ("ROWBACKGROUNDS", (0, 1), (-1, -1), [colors.white, colors.HexColor("#F8FAFC")]),
                ("LEFTPADDING", (0, 0), (-1, -1), 7),
                ("RIGHTPADDING", (0, 0), (-1, -1), 7),
                ("TOPPADDING", (0, 0), (-1, -1), 6),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
            ]
        )
    )
    return KeepTogether([Paragraph(titulo, estilos["section"]), Spacer(1, 6), tabla, Spacer(1, 12)])


def _bloque_sin_datos(titulo: str, estilos):
    from reportlab.lib import colors
    from reportlab.platypus import KeepTogether, Paragraph, Spacer, Table, TableStyle

    tabla = Table([[Paragraph("Sin datos disponibles para esta sección.", estilos["small"])]], colWidths=[470])
    tabla.setStyle(
        TableStyle(
            [
                ("BACKGROUND", (0, 0), (-1, -1), colors.HexColor("#F8FAFC")),
                ("BOX", (0, 0), (-1, -1), 0.6, colors.HexColor("#D9E2EC")),
                ("LEFTPADDING", (0, 0), (-1, -1), 12),
                ("RIGHTPADDING", (0, 0), (-1, -1), 12),
                ("TOPPADDING", (0, 0), (-1, -1), 10),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 10),
            ]
        )
    )
    return KeepTogether([Paragraph(titulo, estilos["section"]), Spacer(1, 6), tabla, Spacer(1, 12)])


def _encabezado_reporte_pdf(facultad: str, tipo_reporte: str, usuario_nombre: str, estilos):
    from reportlab.lib import colors
    from reportlab.platypus import Paragraph, Spacer, Table, TableStyle

    logo = Paragraph("<b>UNACH</b><br/>FCA", estilos["logo"])
    datos = [
        Paragraph("Sistema de Prácticas Profesionales", estilos["title"]),
        Paragraph(facultad, estilos["subtitle"]),
        Paragraph(tipo_reporte, estilos["report_type"]),
        Paragraph(f"Fecha de generación: {datetime.now().strftime('%d/%m/%Y %H:%M')}", estilos["meta"]),
        Paragraph(f"Generado por: {usuario_nombre}", estilos["meta"]),
    ]
    tabla = Table([[logo, datos]], colWidths=[72, 420])
    tabla.setStyle(
        TableStyle(
            [
                ("BACKGROUND", (0, 0), (-1, -1), colors.HexColor("#EEF4FF")),
                ("BOX", (0, 0), (-1, -1), 0.8, colors.HexColor("#D9E2EC")),
                ("LINEBELOW", (0, 0), (-1, -1), 2, colors.HexColor("#C9A227")),
                ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
                ("LEFTPADDING", (0, 0), (-1, -1), 12),
                ("RIGHTPADDING", (0, 0), (-1, -1), 12),
                ("TOPPADDING", (0, 0), (-1, -1), 12),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 12),
            ]
        )
    )
    return [tabla, Spacer(1, 14)]


def _tabla_filtros_pdf(filtros: list[list[Any]], estilos):
    from reportlab.lib import colors
    from reportlab.platypus import Paragraph, Spacer, Table, TableStyle

    contenido = [[Paragraph("Filtro", estilos["table_header"]), Paragraph("Valor", estilos["table_header"])]]
    if filtros:
        contenido.extend([[Paragraph(_texto_pdf(f[0]), estilos["table_cell"]), Paragraph(_texto_pdf(f[1]), estilos["table_cell"])] for f in filtros])
    else:
        contenido.append([Paragraph("Sin filtros aplicados.", estilos["table_cell"]), Paragraph("Todos los registros", estilos["table_cell"])])
    tabla = Table(contenido, colWidths=[160, 310], hAlign="LEFT")
    tabla.setStyle(
        TableStyle(
            [
                ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#0B2E63")),
                ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
                ("GRID", (0, 0), (-1, -1), 0.25, colors.HexColor("#D9E2EC")),
                ("ROWBACKGROUNDS", (0, 1), (-1, -1), [colors.white, colors.HexColor("#F8FAFC")]),
                ("LEFTPADDING", (0, 0), (-1, -1), 7),
                ("RIGHTPADDING", (0, 0), (-1, -1), 7),
                ("TOPPADDING", (0, 0), (-1, -1), 6),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
            ]
        )
    )
    return [Paragraph("Filtros aplicados", estilos["section"]), Spacer(1, 6), tabla, Spacer(1, 12)]


def _tarjetas_resumen_pdf(items: list[tuple[str, int]], estilos):
    from reportlab.lib import colors
    from reportlab.platypus import KeepTogether, Paragraph, Spacer, Table, TableStyle

    bloques = [Paragraph("Resumen ejecutivo", estilos["section"]), Spacer(1, 6)]
    for indice in range(0, len(items), 4):
        fila = []
        grupo = items[indice: indice + 4]
        col_width = 470 / len(grupo)
        for etiqueta, valor in grupo:
            fila.append(Paragraph(f"<font size='18'><b>{_texto_pdf(valor)}</b></font><br/><font size='7'>{_texto_pdf(etiqueta)}</font>", estilos["metric_card"]))
        tabla = Table([fila], colWidths=[col_width] * len(fila), hAlign="LEFT")
        tabla.setStyle(
            TableStyle(
                [
                    ("BACKGROUND", (0, 0), (-1, -1), colors.HexColor("#F8FAFC")),
                    ("BOX", (0, 0), (-1, -1), 0.4, colors.HexColor("#D9E2EC")),
                    ("INNERGRID", (0, 0), (-1, -1), 0.4, colors.HexColor("#D9E2EC")),
                    ("LEFTPADDING", (0, 0), (-1, -1), 9),
                    ("RIGHTPADDING", (0, 0), (-1, -1), 9),
                    ("TOPPADDING", (0, 0), (-1, -1), 8),
                    ("BOTTOMPADDING", (0, 0), (-1, -1), 8),
                    ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
                ]
            )
        )
        bloques.extend([tabla, Spacer(1, 5)])
    bloques.append(Spacer(1, 7))
    return KeepTogether(bloques)


def _lectura_general_pdf(titulo: str, lineas: list[str], estilos):
    from reportlab.lib import colors
    from reportlab.platypus import KeepTogether, Paragraph, Spacer, Table, TableStyle

    contenido = Paragraph(" &nbsp; ".join(_texto_pdf(linea) for linea in lineas), estilos["small"])
    tabla = Table([[contenido]], colWidths=[470])
    tabla.setStyle(
        TableStyle(
            [
                ("BACKGROUND", (0, 0), (-1, -1), colors.HexColor("#EEF4FF")),
                ("BOX", (0, 0), (-1, -1), 0.6, colors.HexColor("#D9E2EC")),
                ("LEFTPADDING", (0, 0), (-1, -1), 12),
                ("RIGHTPADDING", (0, 0), (-1, -1), 12),
                ("TOPPADDING", (0, 0), (-1, -1), 10),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 10),
            ]
        )
    )
    return KeepTogether([Paragraph(titulo, estilos["section"]), Spacer(1, 6), tabla, Spacer(1, 12)])


def _frase_cantidad(cantidad: int, singular: str, plural: str) -> str:
    return f"Hay {cantidad} {singular if cantidad == 1 else plural}."


def _puntos_atencion_direccion(datos: dict[str, Any]) -> list[str]:
    resumen = datos.get("resumen") or {}
    contexto = datos.get("contexto") or {}
    puntos: list[str] = []
    vacantes_no_publicadas = max(
        int(resumen.get("vacantes") or 0) - int(resumen.get("vacantes_publicadas") or 0),
        0,
    )

    if int(resumen.get("alumnos_sin_asignacion") or 0) > 0:
        puntos.append(
            _frase_cantidad(
                int(resumen.get("alumnos_sin_asignacion") or 0),
                "alumno sin asignación",
                "alumnos sin asignación",
            )
        )
    if int(resumen.get("empresas_pendientes") or 0) > 0:
        puntos.append(
            _frase_cantidad(
                int(resumen.get("empresas_pendientes") or 0),
                "empresa pendiente de revisión",
                "empresas pendientes de revisión",
            )
        )
    if int(resumen.get("vacantes_prepadron") or 0) > 0:
        puntos.append(
            _frase_cantidad(
                int(resumen.get("vacantes_prepadron") or 0),
                "vacante en PrePadrón lista para liberación",
                "vacantes en PrePadrón listas para liberación",
            )
        )
    if vacantes_no_publicadas > 0:
        puntos.append(
            _frase_cantidad(
                vacantes_no_publicadas,
                "vacante no publicada",
                "vacantes no publicadas",
            )
        )
    if int(resumen.get("convenios_por_vencer") or 0) > 0:
        puntos.append(
            _frase_cantidad(
                int(resumen.get("convenios_por_vencer") or 0),
                "convenio por vencer en los próximos 30 días",
                "convenios por vencer en los próximos 30 días",
            )
        )
    if int(resumen.get("convenios_vencidos") or 0) > 0:
        puntos.append(
            _frase_cantidad(
                int(resumen.get("convenios_vencidos") or 0),
                "convenio vencido",
                "convenios vencidos",
            )
        )
    if int(resumen.get("incidencias_abiertas") or 0) > 0:
        puntos.append(
            _frase_cantidad(
                int(resumen.get("incidencias_abiertas") or 0),
                "incidencia abierta o en seguimiento",
                "incidencias abiertas o en seguimiento",
            )
        )
    if not contexto.get("convocatoria_activa"):
        puntos.append("No hay convocatoria activa registrada.")

    return puntos


def _recomendaciones_direccion(datos: dict[str, Any]) -> list[str]:
    resumen = datos.get("resumen") or {}
    contexto = datos.get("contexto") or {}
    recomendaciones: list[str] = []

    if int(resumen.get("alumnos_sin_asignacion") or 0) > 0:
        recomendaciones.append("Priorizar asignaciones de alumnos sin empresa para evitar rezago operativo.")
    if int(resumen.get("empresas_pendientes") or 0) > 0:
        recomendaciones.append("Dar seguimiento a empresas pendientes para ampliar opciones del padrón.")
    if int(resumen.get("vacantes_prepadron") or 0) > 0:
        recomendaciones.append("Revisar liberación de vacantes en PrePadrón para publicarlas oportunamente.")
    if int(resumen.get("convenios_por_vencer") or 0) > 0 or int(resumen.get("convenios_vencidos") or 0) > 0:
        recomendaciones.append("Solicitar revisión documental de convenios próximos a vencer o vencidos.")
    if int(resumen.get("incidencias_abiertas") or 0) > 0:
        recomendaciones.append("Escalar incidencias abiertas con mayor antigüedad al área responsable.")
    if not contexto.get("convocatoria_activa"):
        recomendaciones.append("Confirmar el calendario de convocatoria antes de abrir nuevos procesos.")

    return recomendaciones


def _etiqueta_corta(valor: str) -> str:
    reemplazos = {
        "Coordinador de Practicas": "Coord. Prácticas",
        "Coordinador de Prácticas": "Coord. Prácticas",
        "Coordinador de Unidades Receptoras": "Coord. Unidades",
    }
    texto = reemplazos.get(valor, valor)
    return texto if len(texto) <= 28 else f"{texto[:25]}..."


def _grafico_barras(titulo: str, items: list[dict[str, Any]], estilos):
    from reportlab.graphics.shapes import Drawing, Rect, String
    from reportlab.lib import colors
    from reportlab.platypus import KeepTogether, Paragraph, Spacer

    if not items or sum(int(item.get("total") or 0) for item in items) == 0:
        return _bloque_sin_datos(titulo, estilos)

    datos = items[:8]
    valores = [int(item.get("total") or 0) for item in datos]
    etiquetas = [str(item.get("nombre") or "Sin dato")[:30] for item in datos]
    maximo = max(valores) if valores else 0
    if len(datos) <= 1:
        return _tabla_pdf(titulo, ["Categoría", "Total"], [[etiquetas[0], valores[0]]] if datos else [], estilos)

    alto = 28 + len(datos) * 18
    drawing = Drawing(470, alto)
    drawing.add(String(0, alto - 12, titulo, fontName="Helvetica-Bold", fontSize=9, fillColor=colors.HexColor("#0B2E63")))
    y = alto - 30
    for etiqueta, valor in zip(etiquetas, valores):
        ancho = 250 * (valor / max(maximo, 1))
        drawing.add(String(0, y + 3, _etiqueta_corta(etiqueta), fontName="Helvetica", fontSize=7, fillColor=colors.HexColor("#1F2937")))
        drawing.add(Rect(145, y, 250, 8, fillColor=colors.HexColor("#EAF1FB"), strokeColor=colors.HexColor("#D9E2EC"), strokeWidth=0.3))
        drawing.add(Rect(145, y, max(ancho, 2), 8, fillColor=colors.HexColor("#0B2E63"), strokeColor=None))
        drawing.add(String(405, y + 1, str(valor), fontName="Helvetica-Bold", fontSize=7, fillColor=colors.HexColor("#1F2937")))
        y -= 18

    return KeepTogether([drawing, Spacer(1, 8)])


def _footer(canvas, doc):
    from reportlab.lib.colors import HexColor

    canvas.saveState()
    canvas.setFont("Helvetica", 8)
    canvas.setFillColor(HexColor("#64748b"))
    canvas.drawString(36, 24, "Sistema de Prácticas Profesionales")
    canvas.drawCentredString(doc.pagesize[0] / 2, 24, datetime.now().strftime("%d/%m/%Y"))
    canvas.drawRightString(doc.pagesize[0] - 36, 24, f"Página {doc.page}")
    canvas.restoreState()


def _generar_pdf_direccion(datos: dict[str, Any], usuario_actual: UsuarioModel):
    try:
        from reportlab.lib import colors
        from reportlab.lib.enums import TA_CENTER
        from reportlab.lib.pagesizes import letter
        from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
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
        title="Reporte de Dirección",
    )
    sample = getSampleStyleSheet()
    estilos = {
        "title": ParagraphStyle("TitleDireccion", parent=sample["Title"], textColor=colors.HexColor("#0B2E63"), fontSize=16, alignment=TA_CENTER, spaceAfter=4),
        "report_type": ParagraphStyle("ReportTypeDireccion", parent=sample["Heading2"], textColor=colors.HexColor("#0B2E63"), fontSize=13, alignment=TA_CENTER, spaceAfter=4),
        "subtitle": ParagraphStyle("SubtitleDireccion", parent=sample["Normal"], textColor=colors.HexColor("#475569"), fontSize=10, alignment=TA_CENTER, spaceAfter=3),
        "meta": ParagraphStyle("MetaDireccion", parent=sample["Normal"], textColor=colors.HexColor("#475569"), fontSize=8, alignment=TA_CENTER, spaceAfter=2),
        "logo": ParagraphStyle("LogoDireccion", parent=sample["Normal"], textColor=colors.HexColor("#0B2E63"), fontSize=11, leading=14, alignment=TA_CENTER),
        "section": ParagraphStyle("SectionDireccion", parent=sample["Heading2"], textColor=colors.HexColor("#0B2E63"), fontSize=12, spaceBefore=10, spaceAfter=6),
        "small": ParagraphStyle("SmallDireccion", parent=sample["Normal"], textColor=colors.HexColor("#475569"), fontSize=8, leading=11),
        "metric_card": ParagraphStyle("MetricCardDireccion", parent=sample["Normal"], textColor=colors.HexColor("#1F2937"), fontSize=8, leading=13),
        "table_header": ParagraphStyle("TableHeaderDireccion", parent=sample["Normal"], textColor=colors.white, fontSize=8, leading=10),
        "table_cell": ParagraphStyle("TableCellDireccion", parent=sample["Normal"], textColor=colors.HexColor("#1e293b"), fontSize=7, leading=9),
    }

    contexto = datos.get("contexto") or {}
    resumen = datos.get("resumen") or {}
    filtros = datos.get("filtros") or {}
    usuario_nombre = " ".join(
        parte
        for parte in [
            getattr(usuario_actual, "nombre", None),
            getattr(usuario_actual, "apellido_paterno", None),
            getattr(usuario_actual, "apellido_materno", None),
        ]
        if parte
    ) or getattr(usuario_actual, "correo", "Dirección")

    story = _encabezado_reporte_pdf(
        _texto_pdf(contexto.get("escuela_facultad") or "Facultad de Contaduría y Administración"),
        "Reporte de Dirección",
        _texto_pdf(usuario_nombre),
        estilos,
    )

    filtros_activos = [
        [clave.replace("_", " ").title(), valor]
        for clave, valor in filtros.items()
        if _limpio(valor)
    ]
    story.extend(_tabla_filtros_pdf(filtros_activos, estilos))

    resumen_items = [
        ("Alumnos", resumen.get("alumnos", 0)),
        ("Alumnos en proceso", resumen.get("alumnos_en_proceso", 0)),
        ("Alumnos asignados", resumen.get("alumnos_asignados", 0)),
        ("Alumnos sin asignación", resumen.get("alumnos_sin_asignacion", 0)),
        ("Empresas", resumen.get("empresas", 0)),
        ("Convenios", resumen.get("convenios", 0)),
        ("Vacantes", resumen.get("vacantes", 0)),
        ("Convocatorias", resumen.get("convocatorias", 0)),
        ("Incidencias abiertas", resumen.get("incidencias_abiertas", 0)),
    ]
    story.append(_tarjetas_resumen_pdf(resumen_items, estilos))
    story.append(
        _lectura_general_pdf(
            "Estado general del proceso",
            [
                _frase_cantidad(int(resumen.get("alumnos") or 0), "alumno registrado", "alumnos registrados"),
                _frase_cantidad(int(resumen.get("alumnos_sin_asignacion") or 0), "alumno sin asignación", "alumnos sin asignación"),
                _frase_cantidad(int(resumen.get("empresas") or 0), "empresa registrada", "empresas registradas"),
                _frase_cantidad(int(resumen.get("vacantes_publicadas", resumen.get("vacantes", 0)) or 0), "vacante publicada o disponible en el padrón", "vacantes publicadas o disponibles en el padrón"),
                (
                    "No se registran incidencias abiertas."
                    if int(resumen.get("incidencias_abiertas") or 0) == 0
                    else f"Hay {resumen.get('incidencias_abiertas', 0)} incidencias abiertas."
                ),
            ],
            estilos,
        )
    )
    story.append(
        _lectura_general_pdf(
            "Puntos de atención",
            _puntos_atencion_direccion(datos) or ["No hay puntos críticos con los filtros actuales."],
            estilos,
        )
    )
    story.append(
        _lectura_general_pdf(
            "Recomendaciones",
            _recomendaciones_direccion(datos) or ["Mantener seguimiento ordinario del proceso."],
            estilos,
        )
    )

    story.append(Paragraph("Distribución general", estilos["section"]))
    for titulo, clave in [
        ("Alumnos por carrera", "alumnos_por_carrera"),
        ("Alumnos por tipo de práctica", "alumnos_por_tipo_practica"),
        ("Empresas por estado", "empresas_por_estado"),
        ("Convenios por estado", "convenios_por_estado"),
        ("Vacantes por estado", "vacantes_por_estado"),
        ("Vacantes por tipo de práctica", "vacantes_por_tipo_practica"),
    ]:
        items = datos.get(clave, [])
        if clave == "alumnos_por_carrera":
            items = [
                {"nombre": item.get("carrera"), "total": item.get("alumnos")}
                for item in items
            ]
        story.append(_grafico_barras(titulo, items, estilos))

    story.append(PageBreak())
    story.append(_tabla_pdf("Alumnos por carrera", ["Carrera", "Total"], [[i.get("carrera"), i.get("alumnos")] for i in datos.get("alumnos_por_carrera", [])], estilos))
    story.append(_tabla_pdf("Alumnos por tipo de práctica", ["Tipo de práctica", "Total"], [[i.get("nombre"), i.get("total")] for i in datos.get("alumnos_por_tipo_practica", [])], estilos))
    story.append(_tabla_pdf("Empresas por estado", ["Estado", "Total"], [[i.get("nombre"), i.get("total")] for i in datos.get("empresas_por_estado", [])], estilos))
    story.append(_tabla_pdf("Convenios por estado", ["Estado", "Total"], [[i.get("nombre"), i.get("total")] for i in datos.get("convenios_por_estado", [])], estilos))
    story.append(_tabla_pdf("Vacantes por estado", ["Estado", "Total"], [[i.get("nombre"), i.get("total")] for i in datos.get("vacantes_por_estado", [])], estilos))
    if int(resumen.get("incidencias_abiertas") or 0) > 0:
        story.append(
            _tabla_pdf(
                "Incidencias",
                ["Indicador", "Total"],
                [["Abiertas o en seguimiento", resumen.get("incidencias_abiertas", 0)]],
                estilos,
            )
        )
    story.append(
        _tabla_pdf(
            "Convocatorias",
            ["Convocatoria", "Periodo", "Tipo", "Alumnos", "Empresas", "Convenios", "Estado"],
            [
                [
                    row.get("convocatoria"),
                    row.get("periodo"),
                    row.get("tipo_periodo"),
                    row.get("alumnos"),
                    row.get("empresas"),
                    row.get("convenios"),
                    row.get("estado"),
                ]
                for row in datos.get("convocatorias", [])
            ],
            estilos,
        )
    )

    doc.build(story, onFirstPage=_footer, onLaterPages=_footer)
    buffer.seek(0)
    return buffer


@router.get("/reportes/exportar")
def exportar_reporte_direccion(
    formato: str = Query("pdf"),
    filtros: dict[str, Any] = Depends(_query_filtros),
    db: Session = Depends(obtener_db),
    usuario_actual: UsuarioModel = Depends(obtener_usuario_actual),
):
    if formato != "pdf":
        raise HTTPException(status_code=400, detail="Dirección solo permite exportar PDF.")
    datos = _obtener_indicadores(db, filtros)
    buffer = _generar_pdf_direccion(datos, usuario_actual)
    return StreamingResponse(
        buffer,
        media_type="application/pdf",
        headers={"Content-Disposition": 'attachment; filename="reporte_direccion.pdf"'},
    )
