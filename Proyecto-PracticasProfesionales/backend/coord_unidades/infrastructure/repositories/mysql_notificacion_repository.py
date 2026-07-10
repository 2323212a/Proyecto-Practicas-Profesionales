from sqlalchemy.orm import Session

from coord_unidades.domain.repositories.notificacion_repository import (
    NotificacionRepository,
)
from coord_unidades.infrastructure.database.models.notificacion_model import (
    NotificacionModel,
)


class MySQLNotificacionRepository(NotificacionRepository):

    def __init__(self, db: Session):
        self.db = db

    def listar_notificaciones(self):
        return (
            self.db.query(NotificacionModel)
            .order_by(NotificacionModel.fecha_envio.desc())
            .all()
        )

    def enviar_notificacion(self, data):
        nueva = NotificacionModel(
            id_usuario=data.id_usuario,
            titulo=data.titulo,
            mensaje=data.mensaje,
            tipo=data.tipo,
        )

        self.db.add(nueva)
        self.db.commit()
        self.db.refresh(nueva)

        return nueva
