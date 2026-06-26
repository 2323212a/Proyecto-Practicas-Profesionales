from models.usuario import UsuarioModel
from security.password import generar_password_hash
from schemas.usuario import UsuarioUpdate

class UsuarioService:

    def __init__(self, db):
        self.db = db

    def listar(self):
        return self.db.query(UsuarioModel).all()
    
    def crear(self, usuario):

        nuevo_usuario = UsuarioModel(
            id_rol=usuario.id_rol,
            nombre=usuario.nombre,
            apellido_paterno=usuario.apellido_paterno,
            apellido_materno=usuario.apellido_materno,
            correo=usuario.correo,
            password=generar_password_hash(usuario.password),
            estado="Activo"
        )

        self.db.add(nuevo_usuario)
        self.db.commit()
        self.db.refresh(nuevo_usuario)

        return nuevo_usuario
    
    def cambiar_estado(self, id_usuario: int):
        usuario = (
            self.db.query(UsuarioModel)
            .filter(UsuarioModel.id_usuario == id_usuario)
            .first()
        )

        if usuario is None:
            return None

        usuario.estado = "Inactivo" if usuario.estado == "Activo" else "Activo"

        self.db.commit()
        self.db.refresh(usuario)

        return usuario

    def eliminar(self, id_usuario: int):
        usuario = (
            self.db.query(UsuarioModel)
            .filter(UsuarioModel.id_usuario == id_usuario)
            .first()
        )

        if usuario is None:
            return None

        self.db.delete(usuario)
        self.db.commit()

        return usuario
    
    def actualizar(self, id_usuario: int, datos: UsuarioUpdate):
        usuario = (
            self.db.query(UsuarioModel)
            .filter(UsuarioModel.id_usuario == id_usuario)
            .first()
        )

        if usuario is None:
            return None

        usuario.id_rol = datos.id_rol
        usuario.nombre = datos.nombre
        usuario.apellido_paterno = datos.apellido_paterno
        usuario.apellido_materno = datos.apellido_materno
        usuario.correo = datos.correo
        usuario.estado = datos.estado

        self.db.commit()
        self.db.refresh(usuario)

        return usuario