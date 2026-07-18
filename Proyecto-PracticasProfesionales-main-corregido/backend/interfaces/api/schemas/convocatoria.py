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
        campos = [
            self.fecha_inicio_general,
            self.fecha_cierre_general,
            self.fecha_inicio_empresas,
            self.fecha_cierre_empresas,
            self.fecha_inicio_documentos,
            self.fecha_cierre_documentos,
            self.fecha_inicio_validacion,
            self.fecha_cierre_validacion,
            self.fecha_inicio_seleccion,
            self.fecha_cierre_seleccion,
            self.fecha_inicio_asignacion,
            self.fecha_cierre_asignacion,
            self.fecha_inicio_practicas,
            self.fecha_cierre_practicas,
            self.fecha_inicio_cierre,
            self.fecha_cierre_cierre,
        ]
        pares = [
            (self.fecha_inicio_general, self.fecha_cierre_general),
            (self.fecha_inicio_empresas, self.fecha_cierre_empresas),
            (self.fecha_inicio_documentos, self.fecha_cierre_documentos),
            (self.fecha_inicio_validacion, self.fecha_cierre_validacion),
            (self.fecha_inicio_seleccion, self.fecha_cierre_seleccion),
            (self.fecha_inicio_asignacion, self.fecha_cierre_asignacion),
            (self.fecha_inicio_practicas, self.fecha_cierre_practicas),
            (self.fecha_inicio_cierre, self.fecha_cierre_cierre),
        ]
        for inicio, cierre in pares:
            if inicio and cierre and inicio > cierre:
                raise ValueError("El calendario de la convocatoria no respeta el flujo de etapas.")

        if all(campo is not None for campo in campos):
            reglas = [
                self.fecha_inicio_empresas >= self.fecha_inicio_general,
                self.fecha_cierre_empresas <= self.fecha_cierre_general,
                self.fecha_inicio_documentos >= self.fecha_inicio_general,
                self.fecha_cierre_documentos <= self.fecha_cierre_general,
                self.fecha_inicio_validacion >= self.fecha_inicio_documentos,
                self.fecha_cierre_validacion <= self.fecha_cierre_general,
                self.fecha_inicio_seleccion >= self.fecha_cierre_validacion,
                self.fecha_cierre_seleccion <= self.fecha_cierre_general,
                self.fecha_inicio_asignacion >= self.fecha_cierre_seleccion,
                self.fecha_cierre_asignacion <= self.fecha_cierre_general,
                self.fecha_inicio_practicas >= self.fecha_cierre_asignacion,
                self.fecha_cierre_practicas <= self.fecha_cierre_general,
                self.fecha_inicio_cierre >= self.fecha_cierre_practicas,
                self.fecha_cierre_cierre <= self.fecha_cierre_general,
            ]
            if not all(reglas):
                raise ValueError("El calendario de la convocatoria no respeta el flujo de etapas.")
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
