from typing import Literal

from pydantic import BaseModel, ConfigDict, Field, field_validator


TipoPeriodo = Literal["Semestral", "Cuatrimestral"]
EstadoCarrera = Literal["Activa", "Inactiva"]


class CarreraCreate(BaseModel):
    nombre: str
    tipo_periodo: TipoPeriodo = "Semestral"
    duracion_periodos: int | None = Field(default=None, ge=1)
    creditos_totales: int | None = Field(default=None, ge=0)
    estado: EstadoCarrera = "Activa"

    @field_validator("nombre")
    @classmethod
    def nombre_obligatorio(cls, valor: str) -> str:
        valor = valor.strip()
        if not valor:
            raise ValueError("El nombre de la carrera es obligatorio")
        return valor


class CarreraResponse(BaseModel):
    id_carrera: int
    nombre: str
    tipo_periodo: TipoPeriodo = "Semestral"
    duracion_periodos: int | None = None
    creditos_totales: int | None = None
    estado: EstadoCarrera

    model_config = ConfigDict(
        from_attributes=True
    )

class CarreraUpdate(BaseModel):
    nombre: str
    tipo_periodo: TipoPeriodo = "Semestral"
    duracion_periodos: int | None = Field(default=None, ge=1)
    creditos_totales: int | None = Field(default=None, ge=0)
    estado: EstadoCarrera = "Activa"

    @field_validator("nombre")
    @classmethod
    def nombre_obligatorio(cls, valor: str) -> str:
        valor = valor.strip()
        if not valor:
            raise ValueError("El nombre de la carrera es obligatorio")
        return valor
