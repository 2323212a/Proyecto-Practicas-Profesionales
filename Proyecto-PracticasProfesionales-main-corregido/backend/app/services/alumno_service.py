from app.services.perfil_service import PerfilService
from domain.ports.repositories import RepositoryPort


class AlumnoService:
    def __init__(self, repository: RepositoryPort, perfil_service: PerfilService):
        self.repository = repository
        self.perfil_service = perfil_service

    def listar(self):
        return self.repository.listar()

    def obtener_por_id(self, id_alumno: int):
        return self.repository.obtener_por_id(id_alumno)

    def crear(self, alumno):
        self.perfil_service.validar_usuario_para_perfil(
            alumno.id_usuario,
            "Alumno"
        )

        nuevo_alumno = self.repository.nuevo(alumno.model_dump())
        return self.repository.crear(nuevo_alumno)

    def actualizar(self, id_alumno: int, datos):
        alumno = self.obtener_por_id(id_alumno)
        if alumno is None:
            return None
        return self.repository.actualizar(alumno, datos.model_dump(exclude_unset=True))

    def eliminar(self, id_alumno: int):
        alumno = self.obtener_por_id(id_alumno)
        if alumno is None:
            return None
        return self.repository.eliminar(alumno)
