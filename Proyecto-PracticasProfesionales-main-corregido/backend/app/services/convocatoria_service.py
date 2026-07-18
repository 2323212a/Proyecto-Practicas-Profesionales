from domain.ports.repositories import RepositoryPort
from app.services.convocatoria_rules_service import validar_convocatoria_sin_dependencias, validar_sin_conflicto_activo
from types import SimpleNamespace


class ConvocatoriaService:
    def __init__(self, repository: RepositoryPort, db=None):
        self.repository = repository
        self.db = db

    def listar(self):
        return self.repository.listar()

    def crear(self, convocatoria):
        nueva = self.repository.nuevo(convocatoria.model_dump())
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
        if self.db is not None:
            valores = {
                campo: getattr(convocatoria, campo)
                for campo in [
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
                ]
            }
            valores.update(cambios)
            validar_sin_conflicto_activo(self.db, SimpleNamespace(**valores), id_convocatoria)
        return self.repository.actualizar(convocatoria, cambios)

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
        return self.actualizar(id_convocatoria, SimpleNamespace(model_dump=lambda exclude_unset=True: {"estado": estado}))
