from __future__ import annotations

from datetime import date, datetime

from pydantic import BaseModel, ConfigDict, EmailStr


class ConfiguracionSistemaUpdate(BaseModel):
    nombre_sistema: str
    escuela_facultad: str
    correo_institucional: EmailStr
    estado_sistema: str
    inscripcion_empresas_estado: str = "Abierta"
    ciclo_escolar: str
    hero_titulo: str
    hero_subtitulo: str
    id_convocatoria_principal: int | None = None
    soporte_telefono: str | None = None


class ConfiguracionSistemaResponse(ConfiguracionSistemaUpdate):
    id_configuracion: int
    inscripcion_empresas_motivo: str | None = None
    convocatoria_nombre: str
    convocatoria_inicio: date | None = None
    convocatoria_cierre: date | None = None
    convocatoria_empresas_inicio: date | None = None
    convocatoria_empresas_cierre: date | None = None
    convocatoria_periodo: str | None = None
    convocatoria_estado: str | None = None
    ultima_actualizacion: datetime | None = None

    model_config = ConfigDict(from_attributes=True)
