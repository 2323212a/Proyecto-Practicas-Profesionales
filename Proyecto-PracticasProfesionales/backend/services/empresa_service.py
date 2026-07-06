from models.empresa import EmpresaModel


class EmpresaService:

    def __init__(self, db):
        self.db = db

    def listar(self):
        return self.db.query(EmpresaModel).all()

    def obtener_por_id(self, id_empresa: int):
        return (
            self.db.query(EmpresaModel)
            .filter(EmpresaModel.id_empresa == id_empresa)
            .first()
        )

    def crear(self, empresa):
        nueva_empresa = EmpresaModel(
            id_usuario=empresa.id_usuario,
            nombre_empresa=empresa.nombre_empresa,
            rfc=empresa.rfc,
            giro=empresa.giro,
            domicilio=empresa.domicilio,
            telefono=empresa.telefono,
            correo_contacto=empresa.correo_contacto
        )

        self.db.add(nueva_empresa)
        self.db.commit()
        self.db.refresh(nueva_empresa)

        return nueva_empresa

    def actualizar(self, id_empresa: int, datos):
        empresa = self.obtener_por_id(id_empresa)

        if empresa is None:
            return None

        empresa.nombre_empresa = datos.nombre_empresa
        empresa.rfc = datos.rfc
        empresa.giro = datos.giro
        empresa.domicilio = datos.domicilio
        empresa.telefono = datos.telefono
        empresa.correo_contacto = datos.correo_contacto

        if datos.estado_empresa is not None:
            empresa.estado_empresa = datos.estado_empresa

        self.db.commit()
        self.db.refresh(empresa)

        return empresa

    def eliminar(self, id_empresa: int):
        empresa = self.obtener_por_id(id_empresa)

        if empresa is None:
            return None

        self.db.delete(empresa)
        self.db.commit()

        return empresa