from domain.ports.repositories import RepositoryPort


class CarreraService:
    def __init__(self, repository: RepositoryPort):
        self.repository = repository

    def listar(self):
        return self.repository.listar()

    def crear(self, carrera):
        nueva_carrera = self.repository.nuevo(carrera.model_dump())
        return self.repository.crear(nueva_carrera)

    def obtener_por_id(self, id_carrera: int):
        return self.repository.obtener_por_id(id_carrera)

    def actualizar(self, id_carrera: int, datos):
        carrera = self.obtener_por_id(id_carrera)
        if carrera is None:
            return None
        return self.repository.actualizar(carrera, datos.model_dump())

    def eliminar(self, id_carrera: int):
        carrera = self.obtener_por_id(id_carrera)
        if carrera is None:
            return None
        return self.repository.eliminar(carrera)
