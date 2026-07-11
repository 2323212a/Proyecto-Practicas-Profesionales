from app.services.alumno_service import AlumnoService as AlumnoApplicationService
from app.services.asignacion_service import AsignacionService as AsignacionApplicationService
from app.services.carrera_service import CarreraService as CarreraApplicationService
from app.services.convocatoria_service import ConvocatoriaService as ConvocatoriaApplicationService
from app.services.documento_service import DocumentoService as DocumentoApplicationService
from app.services.expediente_service import ExpedienteService as ExpedienteApplicationService
from app.services.horas_service import HorasService as HorasApplicationService
from app.services.perfil_service import PerfilService as PerfilApplicationService
from app.services.rol_service import RolService as RolApplicationService
from app.services.tipo_documento_service import TipoDocumentoService as TipoDocumentoApplicationService
from app.services.usuario_service import UsuarioService as UsuarioApplicationService
from app.services.vacante_service import VacanteService as VacanteApplicationService
from infrastructure.persistence.repositories.asignacion_repository import AsignacionRepository
from infrastructure.persistence.repositories.horas_repository import HorasRepository
from infrastructure.persistence.repositories.perfil_repository import PerfilRepository
from infrastructure.persistence.repositories.simple_repositories import (
    AlumnoRepository,
    CarreraRepository,
    ConvocatoriaRepository,
    DocumentoRepository,
    ExpedienteRepository,
    RolRepository,
    TipoDocumentoRepository,
)
from infrastructure.persistence.repositories.usuario_repository import UsuarioRepository
from infrastructure.persistence.repositories.vacante_repository import VacanteRepository
from infrastructure.security.password_hasher import PasslibPasswordHasher


def PerfilService(db):
    return PerfilApplicationService(PerfilRepository(db))


def UsuarioService(db):
    return UsuarioApplicationService(
        UsuarioRepository(db),
        PerfilService(db),
        PasslibPasswordHasher()
    )


def AlumnoService(db):
    return AlumnoApplicationService(
        AlumnoRepository(db),
        PerfilService(db)
    )


def CarreraService(db):
    return CarreraApplicationService(CarreraRepository(db))


def ConvocatoriaService(db):
    return ConvocatoriaApplicationService(ConvocatoriaRepository(db))


def DocumentoService(db):
    return DocumentoApplicationService(DocumentoRepository(db))


def ExpedienteService(db):
    return ExpedienteApplicationService(ExpedienteRepository(db))


def RolService(db):
    return RolApplicationService(RolRepository(db))


def TipoDocumentoService(db):
    return TipoDocumentoApplicationService(TipoDocumentoRepository(db))


def VacanteService(db):
    return VacanteApplicationService(VacanteRepository(db))


def AsignacionService(db):
    return AsignacionApplicationService(AsignacionRepository(db))


def HorasService(db):
    return HorasApplicationService(HorasRepository(db))
