from infrastructure.persistence.models.alumno import AlumnoModel
from infrastructure.persistence.models.personal_interno import PersonalInternoModel
from infrastructure.persistence.models.responsable_empresa import ResponsableEmpresaModel
from infrastructure.persistence.models.usuario import UsuarioModel


class PerfilRepository:
    def __init__(self, db):
        self.db = db

    def obtener_usuario(self, id_usuario: int):
        return (
            self.db.query(UsuarioModel)
            .filter(UsuarioModel.id_usuario == id_usuario)
            .first()
        )

    def usuario_tiene_perfil(self, id_usuario: int):
        consultas = (
            self.db.query(AlumnoModel).filter(AlumnoModel.id_usuario == id_usuario).first(),
            self.db.query(PersonalInternoModel).filter(
                PersonalInternoModel.id_usuario == id_usuario
            ).first(),
            self.db.query(ResponsableEmpresaModel).filter(
                ResponsableEmpresaModel.id_usuario == id_usuario
            ).first(),
        )
        return any(consultas)
