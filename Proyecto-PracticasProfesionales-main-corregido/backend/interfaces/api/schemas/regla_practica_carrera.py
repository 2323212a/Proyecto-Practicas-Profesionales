from pydantic import BaseModel, ConfigDict, Field


class ReglaPracticaCarreraCreate(BaseModel):
    id_carrera: int
    id_tipo_practica: int
    periodo_requerido: int = Field(ge=1)
    creditos_minimos: int = Field(default=0, ge=0)
    horas_requeridas: int = Field(default=480, ge=1)
    activo: bool = True
    observaciones: str | None = None


class ReglaPracticaCarreraUpdate(BaseModel):
    periodo_requerido: int | None = Field(default=None, ge=1)
    creditos_minimos: int | None = Field(default=None, ge=0)
    horas_requeridas: int | None = Field(default=None, ge=1)
    activo: bool | None = None
    observaciones: str | None = None


class ReglaPracticaCarreraResponse(BaseModel):
    id_regla_practica_carrera: int
    id_carrera: int
    carrera_nombre: str | None = None
    carrera_tipo_periodo: str | None = None
    carrera_duracion_periodos: int | None = None
    carrera_creditos_totales: int | None = None
    id_tipo_practica: int
    tipo_practica_nombre: str | None = None
    periodo_requerido: int
    creditos_minimos: int
    horas_requeridas: int
    activo: bool
    observaciones: str | None = None

    model_config = ConfigDict(from_attributes=True)
