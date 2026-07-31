from types import SimpleNamespace

from app.services.convocatoria_rules_service import (
    validar_convocatoria_sin_dependencias,
    validar_sin_conflicto_activo,
)
from domain.ports.repositories import RepositoryPort


class ConvocatoriaService:
    CAMPOS_FECHA_INICIO_COMPATIBILIDAD = (
        "fecha_inicio_empresas",
        "fecha_inicio_documentos",
        "fecha_inicio_validacion",
        "fecha_inicio_seleccion",
        "fecha_inicio_asignacion",
        "fecha_inicio_practicas",
        "fecha_inicio_cierre",
    )

    CAMPOS_FECHA_CIERRE_COMPATIBILIDAD = (
        "fecha_cierre_empresas",
        "fecha_cierre_documentos",
        "fecha_cierre_validacion",
        "fecha_cierre_seleccion",
        "fecha_cierre_asignacion",
        "fecha_cierre_practicas",
        "fecha_cierre_cierre",
    )

    CAMPOS_CONVOCATORIA = (
        "id_convocatoria",
        "nombre",
        "tipo_periodo",
        "estado",
        "fecha_inicio_general",
        "fecha_cierre_general",
        "fecha_inicio_empresas",
        "fecha_cierre_empresas",
        "fecha_inicio_documentos",
        "fecha_cierre_documentos",
        "fecha_inicio_validacion",
        "fecha_cierre_validacion",
        "fecha_inicio_seleccion",
        "fecha_cierre_seleccion",
        "fecha_inicio_asignacion",
        "fecha_cierre_asignacion",
        "fecha_inicio_practicas",
        "fecha_cierre_practicas",
        "fecha_inicio_cierre",
        "fecha_cierre_cierre",
        "observaciones",
    )

    def __init__(self, repository: RepositoryPort, db=None):
        self.repository = repository
        self.db = db

    def listar(self):
        return self.repository.listar()

    def crear(self, convocatoria):
        datos = convocatoria.model_dump()

        # Para creación, si el frontend no manda fechas internas, se rellenan
        # por compatibilidad con el periodo general. Si sí las manda, se respetan.
        self._completar_fechas_compatibilidad_si_faltan(datos)

        nueva = self.repository.nuevo(datos)

        if self.db is not None:
            validar_sin_conflicto_activo(self.db, nueva)

        return self.repository.crear(nueva)

    def obtener_por_id(self, id_convocatoria: int):
        return self.repository.obtener_por_id(id_convocatoria)

    def actualizar(self, id_convocatoria: int, datos):
        convocatoria = self.obtener_por_id(id_convocatoria)

        if convocatoria is None:
            return None

        cambios = datos.model_dump(exclude_unset=True)

        # Base real actual de la convocatoria.
        valores = {
            campo: getattr(convocatoria, campo)
            for campo in self.CAMPOS_CONVOCATORIA
        }

        # Aplicar cambios recibidos desde frontend.
        valores.update(cambios)

        # Completar solo fechas faltantes. No sobrescribir fechas por bloque
        # que ya existan o que vengan desde la UI.
        self._completar_fechas_compatibilidad_si_faltan(valores)

        # Si alguna fecha interna estaba vacía y se completó por compatibilidad,
        # también se manda al repository para que quede persistida.
        for campo in (
            *self.CAMPOS_FECHA_INICIO_COMPATIBILIDAD,
            *self.CAMPOS_FECHA_CIERRE_COMPATIBILIDAD,
        ):
            if valores.get(campo) is not None:
                cambios[campo] = valores[campo]

        if self.db is not None:
            validar_sin_conflicto_activo(
                self.db,
                SimpleNamespace(**valores),
                id_convocatoria,
            )

        return self.repository.actualizar(convocatoria, cambios)

    @classmethod
    def _completar_fechas_compatibilidad_si_faltan(cls, datos: dict) -> None:
        """
        Conserva las fechas por bloque si el frontend las envía.

        Solo rellena fechas internas faltantes usando el periodo general.
        Esto mantiene compatibilidad con columnas existentes sin volver a
        depender de las ocho subfases rígidas.
        """
        inicio_general = datos.get("fecha_inicio_general")
        cierre_general = datos.get("fecha_cierre_general")

        if not inicio_general or not cierre_general:
            return

        for campo in cls.CAMPOS_FECHA_INICIO_COMPATIBILIDAD:
            if datos.get(campo) is None:
                datos[campo] = inicio_general

        for campo in cls.CAMPOS_FECHA_CIERRE_COMPATIBILIDAD:
            if datos.get(campo) is None:
                datos[campo] = cierre_general

    def eliminar(self, id_convocatoria: int):
        convocatoria = self.obtener_por_id(id_convocatoria)

        if convocatoria is None:
            return None

        if self.db is not None:
            validar_convocatoria_sin_dependencias(self.db, id_convocatoria)

        return self.repository.eliminar(convocatoria)

    def cambiar_estado(self, id_convocatoria: int, estado: str):
        convocatoria = self.obtener_por_id(id_convocatoria)

        if convocatoria is None:
            return None

        return self.actualizar(
            id_convocatoria,
            SimpleNamespace(model_dump=lambda exclude_unset=True: {"estado": estado}),
        )