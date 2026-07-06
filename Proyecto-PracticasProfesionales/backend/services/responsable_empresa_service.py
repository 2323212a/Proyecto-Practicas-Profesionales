from models.responsable_empresa import ResponsableEmpresaModel


class ResponsableEmpresaService:

    def __init__(self, db):
        self.db = db

    def listar(self):
        return self.db.query(ResponsableEmpresaModel).all()

    def listar_por_empresa(self, id_empresa: int):
        return (
            self.db.query(ResponsableEmpresaModel)
            .filter(ResponsableEmpresaModel.id_empresa == id_empresa)
            .all()
        )

    def obtener(self, id_responsable: int):
        return (
            self.db.query(ResponsableEmpresaModel)
            .filter(ResponsableEmpresaModel.id_responsable == id_responsable)
            .first()
        )

    def crear(self, datos):
        responsable = ResponsableEmpresaModel(
            id_empresa=datos.id_empresa,
            nombre_completo=datos.nombre_completo,
            cargo=datos.cargo,
            correo=datos.correo,
            telefono=datos.telefono,
        )

        self.db.add(responsable)
        self.db.commit()
        self.db.refresh(responsable)

        return responsable

    def actualizar(self, id_responsable: int, datos):
        responsable = self.obtener(id_responsable)

        if responsable is None:
            return None

        if datos.nombre_completo is not None:
            responsable.nombre_completo = datos.nombre_completo

        if datos.cargo is not None:
            responsable.cargo = datos.cargo

        if datos.correo is not None:
            responsable.correo = datos.correo

        if datos.telefono is not None:
            responsable.telefono = datos.telefono

        self.db.commit()
        self.db.refresh(responsable)

        return responsable

    def eliminar(self, id_responsable: int):
        responsable = self.obtener(id_responsable)

        if responsable is None:
            return None

        self.db.delete(responsable)
        self.db.commit()

        return responsable