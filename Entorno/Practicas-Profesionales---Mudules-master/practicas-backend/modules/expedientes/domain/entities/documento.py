class Documento:

    def __init__(
        self,
        id_documento,
        id_expediente,
        id_tipo_documento,
        nombre_archivo,
        ruta_archivo,
        estado_documento,
        fecha_carga=None,
        generado_por_sistema=False
    ):
        self.id_documento = id_documento
        self.id_expediente = id_expediente
        self.id_tipo_documento = id_tipo_documento
        self.nombre_archivo = nombre_archivo
        self.ruta_archivo = ruta_archivo
        self.estado_documento = estado_documento
        self.fecha_carga = fecha_carga
        self.generado_por_sistema = generado_por_sistema
