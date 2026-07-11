from datetime import datetime

from domain.ports.repositories import RepositoryPort


class DocumentoService:
    def __init__(self, repository: RepositoryPort):
        self.repository = repository

    def listar(self):
        return self.repository.listar()

    def obtener_por_id(self, id_documento: int):
        return self.repository.obtener_por_id(id_documento)

    def crear(self, documento):
        datos = documento.model_dump()
        datos["estado_documento"] = "Pendiente"
        datos["validacion_automatica_estado"] = "No validado"
        nuevo = self.repository.nuevo(datos)
        return self.repository.crear(nuevo)

    def cambiar_estado_documento(self, id_documento: int, estado: str):
        documento = self.obtener_por_id(id_documento)
        if documento is None:
            return None

        documento.estado_documento = estado
        return self.repository.commit_refresh(documento)

    def cambiar_estado_validacion_automatica(
        self,
        id_documento: int,
        estado_validacion: str
    ):
        documento = self.obtener_por_id(id_documento)
        if documento is None:
            return None

        documento.validacion_automatica_estado = estado_validacion
        documento.fecha_validacion_automatica = datetime.now()
        return self.repository.commit_refresh(documento)
