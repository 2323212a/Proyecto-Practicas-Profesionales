import type {
  ResultadoImportacionEmpresas,
  ValidacionImportacionEmpresas,
} from "../../domain/coord-unidades/ImportacionEmpresa";
import { apiClient } from "../api/apiClient";

const BASE = "/coord-unidades/empresas/importacion";

export async function descargarPlantillaEmpresas(): Promise<Blob> {
  const response = await apiClient.get(BASE + "/plantilla", { responseType: "blob" });
  return response.data;
}

export async function validarImportacionEmpresas(
  archivoExcel: File,
): Promise<ValidacionImportacionEmpresas> {
  const data = new FormData();
  data.append("archivo_excel", archivoExcel);
  const response = await apiClient.post<ValidacionImportacionEmpresas>(BASE + "/validar", data, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return response.data;
}

export async function confirmarImportacionEmpresas(
  idImportacion: string,
): Promise<ResultadoImportacionEmpresas> {
  const response = await apiClient.post<ResultadoImportacionEmpresas>(
    BASE + "/" + idImportacion + "/confirmar",
  );
  return response.data;
}

export async function descargarReporteImportacionEmpresas(idImportacion: string): Promise<Blob> {
  const response = await apiClient.get(BASE + "/" + idImportacion + "/reporte", {
    responseType: "blob",
  });
  return response.data;
}
