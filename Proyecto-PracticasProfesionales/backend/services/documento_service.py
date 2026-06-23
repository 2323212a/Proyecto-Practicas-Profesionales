from datetime import datetime

from models.documento import DocumentoModel


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

    def crear(self, documento):
        nuevo = DocumentoModel(
            id_expediente=documento.id_expediente,
            id_tipo_documento=documento.id_tipo_documento,
            nombre_archivo=documento.nombre_archivo,
            ruta_archivo=documento.ruta_archivo,
            generado_por_sistema=documento.generado_por_sistema,
            requiere_validacion_automatica=documento.requiere_validacion_automatica,
            estado_documento="Pendiente",
            validacion_automatica_estado="No validado"
        )

        self.db.add(nuevo)
        self.db.commit()
        self.db.refresh(nuevo)

        return nuevo

    def cambiar_estado_documento(self, id_documento: int, estado: str):
        documento = self.obtener_por_id(id_documento)

        if documento is None:
            return None

        documento.estado_documento = estado

        self.db.commit()
        self.db.refresh(documento)

        return documento

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

        self.db.commit()
        self.db.refresh(documento)

        return documento