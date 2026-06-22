from modules.expedientes.infrastructure.database.models import DocumentoModel


class MySQLDocumentoRepository:

    def __init__(self, db):
        self.db = db

    def listar(self):
        return self.db.query(DocumentoModel).all()

    def obtener_por_id(self, id_documento):
        return (
            self.db.query(DocumentoModel)
            .filter(DocumentoModel.id_documento == id_documento)
            .first()
        )

    def crear(self, documento):
        nuevo = DocumentoModel(
            id_expediente=documento.id_expediente,
            id_tipo_documento=documento.id_tipo_documento,
            nombre_archivo=documento.nombre_archivo,
            ruta_archivo=documento.ruta_archivo,
            estado_documento="Pendiente",
            generado_por_sistema=documento.generado_por_sistema
        )

        self.db.add(nuevo)
        self.db.commit()
        self.db.refresh(nuevo)

        return nuevo

    def cambiar_estado(self, id_documento, estado):
        documento = self.obtener_por_id(id_documento)

        if documento is None:
            return None

        documento.estado_documento = estado
        self.db.commit()
        self.db.refresh(documento)

        return documento
