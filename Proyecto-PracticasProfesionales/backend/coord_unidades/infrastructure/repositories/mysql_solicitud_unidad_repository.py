from datetime import datetime

from sqlalchemy.orm import Session

from coord_unidades.domain.repositories.solicitud_unidad_repository import (
    SolicitudUnidadRepository,
)
from coord_unidades.infrastructure.database.models.empresa_model import (
    EmpresaModel,
)
from coord_unidades.infrastructure.database.models.solicitud_unidad_model import (
    SolicitudUnidadModel,
)


class MySQLSolicitudUnidadRepository(SolicitudUnidadRepository):

    def __init__(self, db: Session):
        self.db = db

    def obtener_empresa_por_rfc(self, rfc: str):
        return (
            self.db.query(EmpresaModel)
            .filter(EmpresaModel.rfc == rfc)
            .first()
        )

    def crear_empresa_con_solicitud(self, data):
        try:
            empresa = EmpresaModel(
                id_usuario=None,
                nombre_empresa=data.nombre_empresa,
                rfc=data.rfc,
                giro=data.giro,
                domicilio=data.domicilio,
                telefono=data.telefono,
                correo_contacto=data.correo_contacto,
                estado_empresa="Pendiente",
            )

            self.db.add(empresa)
            self.db.flush()

            solicitud = SolicitudUnidadModel(
                id_empresa=empresa.id_empresa,
                estado="Pendiente",
            )

            self.db.add(solicitud)
            self.db.commit()
            self.db.refresh(empresa)
            self.db.refresh(solicitud)

            return empresa, solicitud
        except Exception:
            self.db.rollback()
            raise

    def reenviar_solicitud(self, empresa):
        try:
            empresa.estado_empresa = "Pendiente"
            empresa.motivo_rechazo = None

            solicitud = SolicitudUnidadModel(
                id_empresa=empresa.id_empresa,
                estado="Pendiente",
            )

            self.db.add(solicitud)
            self.db.commit()
            self.db.refresh(empresa)
            self.db.refresh(solicitud)

            return empresa, solicitud
        except Exception:
            self.db.rollback()
            raise

    def obtener_solicitud_por_id(self, id_solicitud: int):
        return (
            self.db.query(SolicitudUnidadModel)
            .filter(SolicitudUnidadModel.id_solicitud == id_solicitud)
            .first()
        )

    def aprobar_solicitud(self, solicitud):
        try:
            solicitud.estado = "Aprobada"
            solicitud.fecha_revision = datetime.utcnow()

            solicitud.empresa.estado_empresa = "Aprobada"
            solicitud.empresa.fecha_validacion = datetime.utcnow()
            solicitud.empresa.motivo_rechazo = None

            self.db.commit()
            self.db.refresh(solicitud)
            self.db.refresh(solicitud.empresa)

            return solicitud
        except Exception:
            self.db.rollback()
            raise

    def rechazar_solicitud(self, solicitud, data):
        try:
            solicitud.estado = "Rechazada"
            solicitud.fecha_revision = datetime.utcnow()
            solicitud.observaciones = data.observaciones

            solicitud.empresa.estado_empresa = "Rechazada"
            solicitud.empresa.motivo_rechazo = data.motivo_rechazo

            self.db.commit()
            self.db.refresh(solicitud)
            self.db.refresh(solicitud.empresa)

            return solicitud
        except Exception:
            self.db.rollback()
            raise

    def listar_solicitudes(self, estado=None, nombre_empresa=None, rfc=None):
        query = (
            self.db.query(
                SolicitudUnidadModel.id_solicitud,
                SolicitudUnidadModel.id_empresa,
                EmpresaModel.nombre_empresa,
                EmpresaModel.rfc,
                EmpresaModel.giro,
                EmpresaModel.telefono,
                EmpresaModel.correo_contacto,
                SolicitudUnidadModel.estado,
                SolicitudUnidadModel.fecha_solicitud,
            )
            .join(EmpresaModel, SolicitudUnidadModel.id_empresa == EmpresaModel.id_empresa)
        )

        if estado:
            query = query.filter(SolicitudUnidadModel.estado == estado)

        if nombre_empresa:
            query = query.filter(
                EmpresaModel.nombre_empresa.ilike(f"%{nombre_empresa}%")
            )

        if rfc:
            query = query.filter(EmpresaModel.rfc == rfc)

        return (
            query
            .order_by(SolicitudUnidadModel.fecha_solicitud.desc())
            .all()
        )
