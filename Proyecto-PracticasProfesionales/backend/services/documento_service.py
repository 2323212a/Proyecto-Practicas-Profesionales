from models.documento import DocumentoModel
from schemas.documento import DocumentoCreate


class DocumentoService:

    def __init__(self, db):
        self.db = db

    def listar(self):
        return self.db.query(DocumentoModel).all()

    def obtener_por_id(self, id_documento: int):
        return (
            self.db.query(DocumentoModel)
            .filter(DocumentoModel.id_documento == id_documento)
            .first()
        )

    def crear(self, documento: DocumentoCreate):
        nuevo_documento = DocumentoModel(
            id_expediente=documento.id_expediente,
            id_tipo_documento=documento.id_tipo_documento,
            nombre_archivo=documento.nombre_archivo,
            ruta_archivo=documento.ruta_archivo,
            generado_por_sistema=documento.generado_por_sistema,
            estado_documento="Pendiente"
        )

        self.db.add(nuevo_documento)
        self.db.commit()
        self.db.refresh(nuevo_documento)

        return nuevo_documento

    def cambiar_estado(self, id_documento: int, estado: str):
        documento = self.obtener_por_id(id_documento)

        if documento is None:
            return None

        documento.estado_documento = estado
        self.db.commit()
        self.db.refresh(documento)

        return documento