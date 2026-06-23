from models.tipo_documento import TipoDocumentoModel


class TipoDocumentoService:

    def __init__(self, db):
        self.db = db

    def listar(self):
        return self.db.query(
            TipoDocumentoModel
        ).all()

    def crear(self, tipo_documento):

        existente = (
            self.db.query(TipoDocumentoModel)
            .filter(
                TipoDocumentoModel.nombre_documento ==
                tipo_documento.nombre_documento
            )
            .first()
        )

        if existente:
            return existente

        nuevo = TipoDocumentoModel(
            nombre_documento=tipo_documento.nombre_documento,
            descripcion=tipo_documento.descripcion,
            etapa=tipo_documento.etapa,
            obligatorio=tipo_documento.obligatorio
        )

        self.db.add(nuevo)
        self.db.commit()
        self.db.refresh(nuevo)

        return nuevo