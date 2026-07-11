from domain.ports.repositories import RepositoryPort


class ConvocatoriaService:
    def __init__(self, repository: RepositoryPort):
        self.repository = repository

    def listar(self):
        return self.repository.listar()

    def crear(self, convocatoria):
        nueva = self.repository.nuevo(convocatoria.model_dump())
        return self.repository.crear(nueva)

    def obtener_por_id(self, id_convocatoria: int):
        return self.repository.obtener_por_id(id_convocatoria)

    def actualizar(self, id_convocatoria: int, datos):
        convocatoria = self.obtener_por_id(id_convocatoria)
        if convocatoria is None:
            return None
        return self.repository.actualizar(convocatoria, datos.model_dump(exclude_unset=True))

    def eliminar(self, id_convocatoria: int):
        convocatoria = self.obtener_por_id(id_convocatoria)
        if convocatoria is None:
            return None
        return self.repository.eliminar(convocatoria)
