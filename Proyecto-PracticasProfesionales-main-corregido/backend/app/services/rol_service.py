from domain.ports.repositories import RepositoryPort


class RolService:
    def __init__(self, repository: RepositoryPort):
        self.repository = repository

    def listar(self):
        return self.repository.listar()

    def crear(self, rol):
        nuevo_rol = self.repository.nuevo(rol.model_dump())
        return self.repository.crear(nuevo_rol)

    def obtener_por_id(self, id_rol: int):
        return self.repository.obtener_por_id(id_rol)

    def actualizar(self, id_rol: int, datos):
        rol = self.obtener_por_id(id_rol)
        if rol is None:
            return None
        return self.repository.actualizar(rol, datos.model_dump(exclude_unset=True))

    def eliminar(self, id_rol: int):
        rol = self.obtener_por_id(id_rol)
        if rol is None:
            return None
        return self.repository.eliminar(rol)
