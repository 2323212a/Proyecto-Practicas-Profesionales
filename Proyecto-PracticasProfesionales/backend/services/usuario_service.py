from models.usuario import UsuarioModel


class UsuarioService:

    def __init__(self, db):
        self.db = db

    def listar(self):
        return self.db.query(
            UsuarioModel
        ).all()

    def crear(self, usuario):

        nuevo_usuario = UsuarioModel(
            id_rol=usuario.id_rol,
            nombre=usuario.nombre,
            apellido_paterno=usuario.apellido_paterno,
            apellido_materno=usuario.apellido_materno,
            correo=usuario.correo,
            password=usuario.password,
            estado="Activo"
        )

        self.db.add(nuevo_usuario)
        self.db.commit()
        self.db.refresh(nuevo_usuario)

        return nuevo_usuario