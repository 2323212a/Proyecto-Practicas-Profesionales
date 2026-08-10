from domain.ports.repositories import RepositoryPort


class TipoDocumentoService:
    def __init__(self, repository: RepositoryPort):
        self.repository = repository

    def listar(self):
        return self.repository.listar()

    def crear(self, tipo_documento):
        existente = self.repository.obtener_por_nombre_etapa(
            tipo_documento.nombre_documento,
            tipo_documento.etapa
        )

        if existente:
            return existente

        nuevo = self.repository.nuevo(tipo_documento.model_dump())
        return self.repository.crear(nuevo)

    def obtener_por_id(self, id_tipo_documento: int):
        return self.repository.obtener_por_id(id_tipo_documento)

    def actualizar(self, id_tipo_documento: int, datos):
        tipo = self.obtener_por_id(id_tipo_documento)
        if tipo is None:
            return None
        return self.repository.actualizar(tipo, datos.model_dump())

    def eliminar(self, id_tipo_documento: int):
        tipo = self.obtener_por_id(id_tipo_documento)
        if tipo is None:
            return None
        return self.repository.eliminar(tipo)
