from dataclasses import dataclass


@dataclass
class SolicitudUnidad:
    id_solicitud: int | None
    id_empresa: int
    estado: str
    observaciones: str | None = None
