from __future__ import annotations
from datetime import date
from typing import Literal
from pydantic import BaseModel, ConfigDict, model_validator


TipoPeriodo = Literal["Semestral", "Cuatrimestral"]
EstadoConvocatoria = Literal["Activa", "Inactiva", "Cerrada"]


class ConvocatoriaBase(BaseModel):
    nombre: str
    tipo_periodo: TipoPeriodo = "Semestral"
    estado: EstadoConvocatoria = "Activa"
    fecha_inicio_general: date | None = None
    fecha_cierre_general: date | None = None
    fecha_inicio_empresas: date | None = None
    fecha_cierre_empresas: date | None = None
    fecha_inicio_documentos: date | None = None
    fecha_cierre_documentos: date | None = None
    fecha_inicio_validacion: date | None = None
    fecha_cierre_validacion: date | None = None
    fecha_inicio_seleccion: date | None = None
    fecha_cierre_seleccion: date | None = None
    fecha_inicio_asignacion: date | None = None
    fecha_cierre_asignacion: date | None = None
    fecha_inicio_practicas: date | None = None
    fecha_cierre_practicas: date | None = None
    fecha_inicio_cierre: date | None = None
    fecha_cierre_cierre: date | None = None
    observaciones: str | None = None

    @model_validator(mode="after")
    def validar_fechas(self):
        pares = [
            ("general", self.fecha_inicio_general, self.fecha_cierre_general),
            ("empresas", self.fecha_inicio_empresas, self.fecha_cierre_empresas),
            ("documentos", self.fecha_inicio_documentos, self.fecha_cierre_documentos),
            ("validacion", self.fecha_inicio_validacion, self.fecha_cierre_validacion),
            ("seleccion", self.fecha_inicio_seleccion, self.fecha_cierre_seleccion),
            ("asignacion", self.fecha_inicio_asignacion, self.fecha_cierre_asignacion),
            ("practicas", self.fecha_inicio_practicas, self.fecha_cierre_practicas),
            ("cierre", self.fecha_inicio_cierre, self.fecha_cierre_cierre),
        ]
        for etapa, inicio, cierre in pares:
            if inicio and cierre and inicio > cierre:
                raise ValueError(f"La fecha de inicio de {etapa} no puede ser mayor que la fecha de cierre")
        cierre_anterior = None
        etapa_anterior = None
        for etapa, inicio, cierre in pares:
            if inicio and cierre_anterior and inicio < cierre_anterior:
                raise ValueError(
                    f"La fecha de inicio de {etapa} no puede ser anterior al cierre de {etapa_anterior}"
                )
            if cierre:
                cierre_anterior = cierre
                etapa_anterior = etapa
        return self


class ConvocatoriaCreate(ConvocatoriaBase):
    pass


class ConvocatoriaResponse(ConvocatoriaBase):
    id_convocatoria: int
    fase_actual: str

    model_config = ConfigDict(
        from_attributes=True
    )

class ConvocatoriaUpdate(ConvocatoriaBase):
    nombre: str | None = None
    tipo_periodo: TipoPeriodo | None = None
    estado: EstadoConvocatoria | None = None
