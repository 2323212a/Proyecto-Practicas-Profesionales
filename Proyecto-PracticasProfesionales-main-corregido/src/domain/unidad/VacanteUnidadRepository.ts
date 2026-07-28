import type {
  ConvocatoriaBasica,
  ConvocatoriaDisponibleUnidad,
  CrearVacanteUnidadInput,
  VacanteUnidad,
  VacantesUnidadResponse,
} from "./VacanteUnidad";

export interface VacanteUnidadRepository {
  listar(idEmpresa: number): Promise<VacantesUnidadResponse>;
  crear(idEmpresa: number, datos: CrearVacanteUnidadInput): Promise<VacanteUnidad>;
  obtenerDetalle(idVacante: number): Promise<VacanteUnidad>;
  editar(idVacante: number, datos: CrearVacanteUnidadInput): Promise<VacanteUnidad>;
  subirPlanTrabajo(idVacante: number, archivo: File): Promise<VacanteUnidad["plan_trabajo"]>;
  reenviar(idVacante: number): Promise<void>;
  obtenerFormatoPlanTrabajo(idConvocatoria?: number): Promise<VacanteUnidad["formato_plan_trabajo"]>;
  listarConvocatorias(): Promise<ConvocatoriaBasica[]>;
  listarConvocatoriasDisponibles(): Promise<ConvocatoriaDisponibleUnidad[]>;
  solicitarParticipacion(idConvocatoria: number): Promise<void>;
}
