from domain.ports.repositories import RepositoryPort


class ExpedienteService:
    def __init__(self, repository: RepositoryPort):
        self.repository = repository

    def listar(self):
        return self.repository.listar()

    def obtener_por_id(self, id_expediente: int):
        return self.repository.obtener_por_id(id_expediente)

    def crear(self, expediente):
        nuevo = self.repository.nuevo(expediente.model_dump())
        return self.repository.crear(nuevo)

    def actualizar(self, id_expediente: int, datos):
        expediente = self.obtener_por_id(id_expediente)
        if expediente is None:
            return None
        return self.repository.actualizar(expediente, datos.model_dump(exclude_unset=True))

    def eliminar(self, id_expediente: int):
        expediente = self.obtener_por_id(id_expediente)
        if expediente is None:
            return None
        return self.repository.eliminar(expediente)
