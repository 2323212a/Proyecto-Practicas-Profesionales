from __future__ import annotations

from datetime import date
from typing import Literal

from pydantic import BaseModel, ConfigDict, model_validator


TipoPeriodo = Literal["Semestral", "Cuatrimestral"]
EstadoConvocatoria = Literal["Activa", "Inactiva", "Cerrada"]


class ConvocatoriaBase(BaseModel):
    nombre: str | None = None
    tipo_periodo: TipoPeriodo | None = None
    estado: EstadoConvocatoria | None = None

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
    def validar_pares_fechas(self):
        pares = [
            ("fecha_inicio_general", "fecha_cierre_general", "periodo general"),
            ("fecha_inicio_empresas", "fecha_cierre_empresas", "registro y preparación"),
            ("fecha_inicio_documentos", "fecha_cierre_documentos", "documentación"),
            ("fecha_inicio_validacion", "fecha_cierre_validacion", "validación"),
            ("fecha_inicio_seleccion", "fecha_cierre_seleccion", "selección"),
            ("fecha_inicio_asignacion", "fecha_cierre_asignacion", "asignación"),
            ("fecha_inicio_practicas", "fecha_cierre_practicas", "desarrollo de prácticas"),
            ("fecha_inicio_cierre", "fecha_cierre_cierre", "cierre"),
        ]

        for inicio_campo, cierre_campo, nombre in pares:
            inicio = getattr(self, inicio_campo)
            cierre = getattr(self, cierre_campo)

            if inicio is not None and cierre is not None and inicio > cierre:
                raise ValueError(f"La fecha de cierre de {nombre} debe ser posterior al inicio.")

        return self


class ConvocatoriaCreate(ConvocatoriaBase):
    nombre: str
    tipo_periodo: TipoPeriodo = "Semestral"
    estado: EstadoConvocatoria = "Activa"
    fecha_inicio_general: date
    fecha_cierre_general: date

    @model_validator(mode="after")
    def validar_create(self):
        if self.fecha_inicio_general > self.fecha_cierre_general:
            raise ValueError("La fecha de cierre general debe ser posterior al inicio.")

        return self


class ConvocatoriaUpdate(ConvocatoriaBase):
    pass


class ConvocatoriaResponse(ConvocatoriaBase):
    id_convocatoria: int
    nombre: str
    tipo_periodo: TipoPeriodo
    estado: EstadoConvocatoria
    fase_actual: str

    model_config = ConfigDict(from_attributes=True)