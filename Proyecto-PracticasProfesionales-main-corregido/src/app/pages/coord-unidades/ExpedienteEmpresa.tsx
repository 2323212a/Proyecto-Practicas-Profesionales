import { useEffect, useMemo, useState } from "react";
import type { ChangeEvent } from "react";
import {
  AlertTriangle,
  CalendarDays,
  CheckCircle2,
  Download,
  Eye,
  FileText,
  Send,
  Settings,
  Upload,
  X,
  XCircle,
} from "lucide-react";
import { useParams } from "react-router";

import { gestionDocumentacionEmpresaUseCase } from "../../dependencies";
import { apiClient } from "../../../infrastructure/api/apiClient";
import type {
  DocumentacionEmpresaResponse,
  DocumentoEmpresa,
  EstadoDocumentoEmpresa,
  RequisitoEmpresa,
} from "../../../domain/empresa/DocumentacionEmpresa";
import { getApiErrorMessage } from "../../../shared/utils/apiError";
import { abrirVistaPreviaArchivo } from "../../../shared/utils/filePreview";

import type { StatCard } from "../../../shared/types/ui";
type ConfiguracionRequisitoForm = {
  nombre: string;
  descripcion: string;
  obligatorio: boolean;
  requiere_formato: boolean;
  activo: boolean;
  etapa: "Documentacion" | "Convenio" | "Vinculacion";
  tipo_tramite: "Todos" | "Convenio" | "Vinculacion";
};

const estadoColor: Record<string, string> = {
  Activa: "bg-green-100 text-green-700",
  Pendiente: "bg-yellow-100 text-yellow-700",
  Suspendida: "bg-red-100 text-red-700",
  Inactiva: "bg-gray-100 text-gray-600",
};
const MAX_FORMATO_BYTES = 2 * 1024 * 1024;
const ACCEPT_FORMATOS = ".pdf,.doc,.docx,.xls,.xlsx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";

function esFormatoPermitido(archivo: File) {
  return [
    "application/pdf",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "application/vnd.ms-excel",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  ].includes(archivo.type) || /\.(pdf|docx?|xlsx?)$/i.test(archivo.name);
}

function archivoABase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result).split(",", 2)[1] ?? "");
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

function textoFormatoPorEtapa(etapa: string) {
  if (etapa === "Convenio") {
    return "Este formato sera descargado por la Unidad Receptora cuando su documentacion legal sea aprobada.";
  }
  return "Este formato sera descargado por la Unidad Receptora para completar este requisito.";
}

export function ExpedienteEmpresa() {
  const { idEmpresa } = useParams();
  const [empresas, setEmpresas] = useState<DocumentacionEmpresaResponse[]>([]);
  const [requisitosGlobales, setRequisitosGlobales] = useState<RequisitoEmpresa[]>([]);
  const [vista, setVista] = useState<"revisión" | "configuracion">("revisión");
  const [seleccionada, setSeleccionada] = useState<number | null>(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");
  const [exito, setExito] = useState("");
  const [procesando, setProcesando] = useState<number | null>(null);
  const [rechazando, setRechazando] = useState<DocumentoEmpresa | null>(null);
  const [aprobandoConvenio, setAprobandoConvenio] = useState<DocumentoEmpresa | null>(null);
  const [vigenciaConvenio, setVigenciaConvenio] = useState({
    inicio: new Date().toISOString().slice(0, 10),
    fin: new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toISOString().slice(0, 10),
  });
  const [observaciones, setObservaciones] = useState("");
  const [formatoTipo, setFormatoTipo] = useState<number | null>(null);
  const [formatoAlcance, setFormatoAlcance] = useState<"todas" | "empresa">("todas");
  const [formatoEmpresaId, setFormatoEmpresaId] = useState<number | "">("");
  const [configurando, setConfigurando] = useState<RequisitoEmpresa | null>(null);
  const [creandoRequisito, setCreandoRequisito] = useState(false);
  const [configForm, setConfigForm] = useState<ConfiguracionRequisitoForm>({
    nombre: "",
    descripcion: "",
    obligatorio: true,
    requiere_formato: false,
    activo: true,
    etapa: "Documentacion",
    tipo_tramite: "Todos",
  });

  useEffect(() => {
    void cargar();
  }, [idEmpresa]); // eslint-disable-line react-hooks/exhaustive-deps -- cargar only reads the route company id.

  async function cargar() {
    try {
      setCargando(true);
      setError("");
      const [respuesta, requisitosRespuesta] = await Promise.all([
        gestionDocumentacionEmpresaUseCase.listarRevision(),
        apiClient.get<RequisitoEmpresa[]>("/coord-unidades/documentos-empresa/requisitos"),
      ]);
      const conExpediente = respuesta.filter(
        (item) => !["Solicitante", "Rechazada"].includes(item.empresa.estado_empresa),
      );
      setEmpresas(conExpediente);
      setRequisitosGlobales(requisitosRespuesta.data);
      const idSolicitado = Number(idEmpresa);
      const existeSolicitada =
        Number.isFinite(idSolicitado) &&
        conExpediente.some((item) => item.empresa.id_empresa === idSolicitado);
      setSeleccionada((actual) => {
        if (existeSolicitada) return idSolicitado;
        if (actual && conExpediente.some((item) => item.empresa.id_empresa === actual)) return actual;
        return conExpediente[0]?.empresa.id_empresa ?? null;
      });
      setFormatoEmpresaId((actual) => actual || conExpediente[0]?.empresa.id_empresa || "");
    } catch (err) {
      console.error(err);
      setError("No se pudo cargar la documentacion empresarial.");
    } finally {
      setCargando(false);
    }
  }

  const empresaActual = useMemo(
    () => empresas.find((empresa) => empresa.empresa.id_empresa === seleccionada) ?? null,
    [empresas, seleccionada],
  );
  const documentacionLegal = empresaActual?.documentos.filter(
    (requisito) => ((requisito as RequisitoEmpresa & { etapa?: string }).etapa ?? "Documentacion") === "Documentacion",
  ) ?? [];
  const requisitosConvenio = empresaActual?.documentos.filter(
    (requisito) => ((requisito as RequisitoEmpresa & { etapa?: string }).etapa ?? "Documentacion") === "Convenio",
  ) ?? [];
  const existeConvenioConFormato = requisitosGlobales.some(
    (requisito) =>
      ((requisito as RequisitoEmpresa & { etapa?: string }).etapa ?? "Documentacion") === "Convenio" &&
      requisito.requiere_formato,
  );

  async function revisarDocumento(
    documento: DocumentoEmpresa,
    estado: EstadoDocumentoEmpresa,
    nota?: string,
    fechasConvenio?: { inicio: string; fin: string },
  ) {
    try {
      setProcesando(documento.id_documento_empresa);
      setError("");
      await gestionDocumentacionEmpresaUseCase.revisarDocumento(
        documento.id_documento_empresa,
        {
          estado_documento: estado,
          observaciones: nota,
          fecha_inicio_convenio: fechasConvenio?.inicio,
          fecha_fin_convenio: fechasConvenio?.fin,
        },
      );
      await cargar();
      setRechazando(null);
      setAprobandoConvenio(null);
      setObservaciones("");
    } catch (err) {
      console.error(err);
      setError("No se pudo actualizar el documento.");
    } finally {
      setProcesando(null);
    }
  }

  function abrirAprobacionConvenio(documento: DocumentoEmpresa) {
    const inicio = new Date().toISOString().slice(0, 10);
    const finDate = new Date();
    finDate.setFullYear(finDate.getFullYear() + 1);
    setVigenciaConvenio({ inicio, fin: finDate.toISOString().slice(0, 10) });
    setAprobandoConvenio(documento);
  }

  async function subirFormato(requisito: RequisitoEmpresa, event: ChangeEvent<HTMLInputElement>) {
    const archivo = event.target.files?.[0];
    if (!archivo) return;
    const etapa = requisito.etapa ?? "Documentacion";
    const tipoTramite = requisito.tipo_tramite ?? null;
    const requiereEmpresaEspecifica = etapa === "Convenio" || etapa === "Vinculacion";
    if (archivo.size > MAX_FORMATO_BYTES) {
      setError("El archivo excede el límite máximo de 2 MB.");
      event.target.value = "";
      return;
    }
    if (!esFormatoPermitido(archivo)) {
      setError("Tipo de archivo no permitido.");
      event.target.value = "";
      return;
    }

    try {
      const empresasCompatibles = empresas.filter((item) => {
        if (etapa === "Convenio") return item.empresa.tipo_tramite === "Convenio";
        if (etapa === "Vinculacion") return item.empresa.tipo_tramite === "Vinculacion";
        if (tipoTramite) return item.empresa.tipo_tramite === tipoTramite;
        return true;
      });
      const idBase = Number(formatoEmpresaId || seleccionada);
      const idEmpresaFormato =
        formatoAlcance === "empresa" || requiereEmpresaEspecifica
          ? empresasCompatibles.some((item) => item.empresa.id_empresa === idBase)
            ? idBase
            : null
          : null;
      if ((formatoAlcance === "empresa" || requiereEmpresaEspecifica) && !idEmpresaFormato) {
        setError("Selecciona la empresa a la que se asignara el formato.");
        event.target.value = "";
        return;
      }
      setFormatoTipo(requisito.id_tipo_documento_empresa);
      setError("");
      setExito("");
      const contenido = await archivoABase64(archivo);
      await gestionDocumentacionEmpresaUseCase.subirFormato({
        id_tipo_documento_empresa: requisito.id_tipo_documento_empresa,
        id_empresa: idEmpresaFormato,
        nombre_archivo: archivo.name,
        contenido_base64: contenido,
        mime_type: archivo.type || null,
      });
      setExito(
        formatoAlcance === "empresa"
          ? `Formato asignado para esta empresa en ${requisito.nombre}.`
          : `Formato general actualizado para ${requisito.nombre}.`,
      );
      await cargar();
    } catch (err) {
      console.error(err);
      setError(getApiErrorMessage(err, "No se pudo subir el formato."));
    } finally {
      setFormatoTipo(null);
      event.target.value = "";
    }
  }

  function abrirConfiguracion(requisito: RequisitoEmpresa) {
    setConfigurando(requisito);
    setCreandoRequisito(false);
    setConfigForm({
      nombre: requisito.nombre,
      descripcion: requisito.descripcion ?? "",
      obligatorio: requisito.obligatorio,
      requiere_formato: requisito.requiere_formato,
      activo: (requisito as RequisitoEmpresa & { activo?: boolean }).activo ?? true,
      etapa: (requisito as RequisitoEmpresa & { etapa?: string }).etapa ?? "Documentacion",
      tipo_tramite: requisito.tipo_tramite ?? "Todos",
    });
  }

  function abrirCreacionRequisito() {
    setConfigurando(null);
    setCreandoRequisito(true);
    setConfigForm({
      nombre: "",
      descripcion: "",
      obligatorio: true,
      requiere_formato: false,
      activo: true,
      etapa: "Documentacion",
      tipo_tramite: "Todos",
    });
  }

  async function guardarConfiguracion() {
    try {
      setProcesando(configurando?.id_tipo_documento_empresa ?? -1);
      setError("");
      if (configurando) {
        await gestionDocumentacionEmpresaUseCase.configurarRequisito(
          configurando.id_tipo_documento_empresa,
          {
            nombre: configForm.nombre.trim(),
            descripcion: configForm.descripcion.trim() || null,
            obligatorio: configForm.obligatorio,
            requiere_formato: configForm.requiere_formato,
            activo: configForm.activo,
            etapa: configForm.etapa,
            tipo_tramite: configForm.tipo_tramite === "Todos" ? null : configForm.tipo_tramite,
          },
        );
      } else {
        await apiClient.post("/coord-unidades/documentos-empresa/requisitos", {
          nombre: configForm.nombre.trim(),
          descripcion: configForm.descripcion.trim() || null,
          obligatorio: configForm.obligatorio,
          requiere_formato: configForm.requiere_formato,
          activo: configForm.activo,
          etapa: configForm.etapa,
          tipo_tramite: configForm.tipo_tramite === "Todos" ? null : configForm.tipo_tramite,
        });
      }
      setConfigurando(null);
      setCreandoRequisito(false);
      await cargar();
    } catch (err) {
      console.error(err);
      setError("No se pudo actualizar la configuracion del documento.");
    } finally {
      setProcesando(null);
    }
  }

  async function desactivarRequisito(requisito: RequisitoEmpresa) {
    if (!window.confirm("El requisito se desactivara para nuevas cargas, pero no se borraran documentos existentes.")) {
      return;
    }
    try {
      setProcesando(requisito.id_tipo_documento_empresa);
      setError("");
      await apiClient.patch(
        `/coord-unidades/documentos-empresa/requisitos/${requisito.id_tipo_documento_empresa}/desactivar`,
      );
      await cargar();
    } catch (err) {
      console.error(err);
      setError("No se pudo desactivar el requisito.");
    } finally {
      setProcesando(null);
    }
  }

  async function activarRequisito(requisito: RequisitoEmpresa) {
    try {
      setProcesando(requisito.id_tipo_documento_empresa);
      setError("");
      await apiClient.patch(
        `/coord-unidades/documentos-empresa/requisitos/${requisito.id_tipo_documento_empresa}/activar`,
      );
      await cargar();
    } catch (err) {
      console.error(err);
      setError("No se pudo activar el requisito.");
    } finally {
      setProcesando(null);
    }
  }

  async function eliminarRequisito(requisito: RequisitoEmpresa) {
    if (!window.confirm("Este requisito se eliminara definitivamente porque no tiene historial. Deseas continuar?")) {
      return;
    }
    try {
      setProcesando(requisito.id_tipo_documento_empresa);
      setError("");
      await apiClient.delete(
        `/coord-unidades/documentos-empresa/requisitos/${requisito.id_tipo_documento_empresa}`,
      );
      await cargar();
    } catch (err: unknown) {
      console.error(err);
      setError(getApiErrorMessage(err, "No se pudo eliminar el requisito."));
    } finally {
      setProcesando(null);
    }
  }

  async function eliminarFormato(requisito: RequisitoEmpresa) {
    if (!requisito.formato) return;
    if (
      !window.confirm(
        "Este formato institucional se eliminara. Las empresas ya no podran descargarlo. Los documentos ya subidos por empresas no se eliminaran. Deseas continuar?",
      )
    ) {
      return;
    }

    try {
      setFormatoTipo(requisito.id_tipo_documento_empresa);
      setError("");
      setExito("");
      await apiClient.delete(
        `/coord-unidades/documentos-empresa/formatos/${requisito.formato.id_formato_empresa}`,
      );
      setExito(`Formato eliminado para ${requisito.nombre}.`);
      await cargar();
    } catch (err: unknown) {
      console.error(err);
      setError(getApiErrorMessage(err, "No se pudo eliminar el formato."));
    } finally {
      setFormatoTipo(null);
    }
  }

  async function abrirFormato(idFormatoEmpresa: number, nombreArchivo?: string | null) {
    try {
      setError("");
      const blob = await gestionDocumentacionEmpresaUseCase.descargarFormato(idFormatoEmpresa);
      abrirVistaPreviaArchivo(blob, nombreArchivo ?? "formato_empresa.pdf");
    } catch (err: unknown) {
      console.error(err);
      setError(getApiErrorMessage(err, "No se pudo descargar el formato."));
    }
  }

  async function abrirDocumento(idDocumentoEmpresa: number, nombreArchivo?: string | null) {
    try {
      setError("");
      const blob = await gestionDocumentacionEmpresaUseCase.descargarDocumento(idDocumentoEmpresa);
      abrirVistaPreviaArchivo(blob, nombreArchivo ?? "documento_empresa.pdf");
    } catch (err: unknown) {
      console.error(err);
      setError(getApiErrorMessage(err, "No se pudo abrir el documento."));
    }
  }

  function renderSelectorAlcanceFormato(etapa: string, tipoTramite?: string | null) {
    const requiereEmpresaEspecifica = etapa === "Convenio" || etapa === "Vinculacion";
    const empresasCompatibles = empresas.filter((item) => {
      if (etapa === "Convenio") return item.empresa.tipo_tramite === "Convenio";
      if (etapa === "Vinculacion") return item.empresa.tipo_tramite === "Vinculacion";
      if (tipoTramite) return item.empresa.tipo_tramite === tipoTramite;
      return true;
    });
    const empresaSeleccionadaCompatible = empresasCompatibles.some(
      (item) => item.empresa.id_empresa === Number(formatoEmpresaId),
    );

    return (
      <div className="mt-3 grid gap-3 md:grid-cols-2">
        <label className="block">
          <span className="text-xs font-semibold text-gray-600">Alcance del formato</span>
          <select
            value={requiereEmpresaEspecifica ? "empresa" : formatoAlcance}
            onChange={(event) => setFormatoAlcance(event.target.value as "todas" | "empresa")}
            disabled={requiereEmpresaEspecifica}
            className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2 text-xs outline-none focus:border-[#1565c0]"
          >
            {!requiereEmpresaEspecifica && <option value="todas">Todas las empresas</option>}
            <option value="empresa">Solo una empresa</option>
          </select>
          {requiereEmpresaEspecifica && (
            <span className="mt-1 block text-xs text-blue-700">
              Los formatos de Convenio y Vinculación deben asignarse a una empresa específica.
            </span>
          )}
        </label>

        {(formatoAlcance === "empresa" || requiereEmpresaEspecifica) && (
          <label className="block">
            <span className="text-xs font-semibold text-gray-600">Empresa</span>
            <select
              value={empresaSeleccionadaCompatible ? formatoEmpresaId : ""}
              onChange={(event) => setFormatoEmpresaId(Number(event.target.value))}
              className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2 text-xs outline-none focus:border-[#1565c0]"
            >
              <option value="">Selecciona empresa</option>
              {empresasCompatibles.map((item) => (
                <option key={item.empresa.id_empresa} value={item.empresa.id_empresa}>
                  {item.empresa.nombre_empresa} - {item.empresa.tipo_tramite ?? "Sin tramite"}
                </option>
              ))}
            </select>
          </label>
        )}
      </div>
    );
  }

  function renderRequisito(requisito: RequisitoEmpresa, modo: "revisión" | "configuracion") {
    const documento = requisito.documento;
    const estado = documento?.estado_documento ?? "Faltante";
    const etapa = requisito.etapa ?? "Documentacion";
    const aplicaA = requisito.tipo_tramite ?? "Todas";
    const activo = requisito.activo ?? true;
    const puedeEliminar = requisito.puede_eliminar ?? false;

    return (
      <div key={requisito.id_tipo_documento_empresa} className="border border-gray-200 rounded-xl p-4">
        <div className="flex flex-col xl:flex-row xl:items-start xl:justify-between gap-4">
          <div className="flex items-start gap-3 flex-1">
            <FileText className="w-5 h-5 text-[#1565c0] mt-0.5" />
            <div>
              <p className="font-medium text-gray-800">{requisito.nombre}</p>
              <p className="text-xs text-gray-500 mt-1 max-w-2xl">
                {requisito.descripcion ?? "Sin descripcion configurada."}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                {documento?.nombre_archivo ?? "Sin documento cargado"}
              </p>
              <p className="text-xs text-[#1565c0] mt-1">
                {etapa} - {requisito.obligatorio ? "Obligatorio" : "Opcional"} - {activo ? "Activo" : "Inactivo"} - {requisito.requiere_formato
                  ? requisito.formato
                    ? "Con formato institucional"
                    : "Requiere formato, pendiente de anexar"
                  : "Sin formato institucional requerido"}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                Aplica a: {aplicaA === "Todas" ? "Todas las empresas" : aplicaA}
              </p>
              {etapa === "Convenio" && (
                <p className="inline-flex mt-2 text-xs text-green-700 bg-green-50 border border-green-100 rounded-full px-3 py-1 font-semibold">
                  Al aprobarse genera o actualiza el convenio formal
                </p>
              )}
              {documento?.observaciones && (
                <p className="text-xs text-red-700 mt-2 bg-red-50 border border-red-100 rounded-lg px-3 py-2">
                  Observaciones: {documento.observaciones}
                </p>
              )}
              {modo === "configuracion" && requisito.requiere_formato && (
                <div className="mt-3 border border-blue-200 bg-blue-50 rounded-xl p-3">
                  <p className="text-xs font-semibold text-[#0d2b5e]">Formato institucional</p>
                  <p className="text-xs text-blue-700 mt-1">
                    {textoFormatoPorEtapa(etapa)}
                  </p>
                  <p className="text-xs text-gray-600 mt-2">
                    Estado: {requisito.formato ? `Cargado - ${requisito.formato.nombre_archivo}` : "Pendiente de subir"}
                  </p>
                  {requisito.formato && (
                    <p className="text-xs text-gray-600 mt-1">
                      Alcance: {requisito.formato.id_empresa
                        ? `Solo ${requisito.formato.empresa_nombre ?? "empresa asignada"}`
                        : "Todas las empresas"}
                    </p>
                  )}
                  {renderSelectorAlcanceFormato(etapa, requisito.tipo_tramite)}
                  <div className="flex flex-wrap gap-2 mt-3">
                    {requisito.formato && (
                      <button
                        onClick={() => abrirFormato(requisito.formato!.id_formato_empresa, requisito.formato!.nombre_archivo)}
                        className="border border-blue-200 bg-white text-[#1565c0] rounded-lg px-3 py-2 text-xs font-semibold flex items-center gap-1"
                      >
                        <Download className="w-3 h-3" />
                        Ver / Descargar formato
                      </button>
                    )}
                    {requisito.formato && (
                      <button
                        onClick={() => eliminarFormato(requisito)}
                        disabled={formatoTipo === requisito.id_tipo_documento_empresa}
                        className="border border-red-200 bg-white text-red-700 rounded-lg px-3 py-2 text-xs font-semibold flex items-center gap-1 disabled:opacity-50"
                      >
                        <XCircle className="w-3 h-3" />
                        Eliminar formato
                      </button>
                    )}
                    <label className="bg-[#1565c0] text-white rounded-lg px-3 py-2 text-xs font-semibold flex items-center gap-1 cursor-pointer">
                      <Upload className="w-3 h-3" />
                      {formatoTipo === requisito.id_tipo_documento_empresa
                        ? "Subiendo..."
                        : requisito.formato
                          ? "Reemplazar formato"
                          : "Subir formato"}
                      <input
                        type="file"
                        accept={ACCEPT_FORMATOS}
                        className="hidden"
                        onChange={(event) => subirFormato(requisito, event)}
                      />
                    </label>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <span
              className={`px-3 py-1 rounded-full text-xs font-semibold h-fit ${
                estado === "Aprobado"
                  ? "bg-green-100 text-green-700"
                  : estado === "Pendiente"
                    ? "bg-yellow-100 text-yellow-700"
                    : estado === "Rechazado"
                      ? "bg-red-100 text-red-700"
                      : "bg-gray-100 text-gray-600"
              }`}
            >
              {estado}
            </span>

            {modo === "configuracion" && (
              <>
                <button
                  onClick={() => abrirConfiguracion(requisito)}
                  className="border border-gray-200 text-gray-600 rounded-lg px-3 py-1.5 text-xs font-semibold flex items-center gap-1"
                >
                  <Settings className="w-3 h-3" />
                  Editar
                </button>
                {activo ? (
                  <button
                    onClick={() => desactivarRequisito(requisito)}
                    disabled={procesando === requisito.id_tipo_documento_empresa}
                    className="border border-red-200 text-red-600 rounded-lg px-3 py-1.5 text-xs font-semibold flex items-center gap-1 disabled:opacity-50"
                  >
                    <XCircle className="w-3 h-3" />
                    Desactivar
                  </button>
                ) : (
                  <button
                    onClick={() => activarRequisito(requisito)}
                    disabled={procesando === requisito.id_tipo_documento_empresa}
                    className="border border-green-200 text-green-700 rounded-lg px-3 py-1.5 text-xs font-semibold flex items-center gap-1 disabled:opacity-50"
                  >
                    <CheckCircle2 className="w-3 h-3" />
                    Activar
                  </button>
                )}
                {puedeEliminar && (
                  <button
                    onClick={() => eliminarRequisito(requisito)}
                    disabled={procesando === requisito.id_tipo_documento_empresa}
                    className="border border-red-200 bg-red-50 text-red-700 rounded-lg px-3 py-1.5 text-xs font-semibold flex items-center gap-1 disabled:opacity-50"
                  >
                    <X className="w-3 h-3" />
                    Eliminar
                  </button>
                )}
              </>
            )}

            {modo === "revisión" && (
              <button
                onClick={() => documento && abrirDocumento(documento.id_documento_empresa, documento.nombre_archivo)}
                disabled={!documento}
                className="border border-blue-200 text-[#1565c0] rounded-lg px-3 py-1.5 text-xs font-semibold flex items-center gap-1 disabled:opacity-50"
              >
                <Eye className="w-3 h-3" />
                Ver
              </button>
            )}

            {requisito.formato && (
              <button
                onClick={() => abrirFormato(requisito.formato!.id_formato_empresa, requisito.formato!.nombre_archivo)}
                className="border border-blue-200 text-[#1565c0] rounded-lg px-3 py-1.5 text-xs font-semibold flex items-center gap-1"
              >
                <Download className="w-3 h-3" />
                Formato
              </button>
            )}
          </div>
        </div>

        {modo === "revisión" && (
          <div className="flex flex-wrap gap-2 mt-4">
            {documento && documento.estado_documento !== "Aprobado" && (
              <button
                onClick={() =>
                  etapa === "Convenio"
                    ? abrirAprobacionConvenio(documento)
                    : revisarDocumento(documento, "Aprobado")
                }
                disabled={procesando === documento.id_documento_empresa}
                className="bg-green-600 text-white rounded-xl px-4 py-2 text-xs font-semibold flex items-center gap-2 disabled:opacity-50"
              >
                <CheckCircle2 className="w-4 h-4" />
                Aprobar
              </button>
            )}

            {documento && documento.estado_documento !== "Rechazado" && (
              <button
                onClick={() => {
                  setRechazando(documento);
                  setObservaciones("");
                }}
                disabled={procesando === documento.id_documento_empresa}
                className="border border-orange-200 text-orange-600 rounded-xl px-4 py-2 text-xs font-semibold flex items-center gap-2 disabled:opacity-50"
              >
                <AlertTriangle className="w-4 h-4" />
                Observar/Rechazar
              </button>
            )}
          </div>
        )}
      </div>
    );
  }

  if (cargando) {
    return (
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-10 text-center text-gray-500">
        Cargando expedientes empresariales...
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[#0d2b5e]">Expediente de Empresa</h1>
        <p className="text-gray-500 text-sm mt-1">
          Revision documental de unidades receptoras y publicacion de formatos institucionales.
        </p>
      </div>

      {error && (
        <div className="bg-orange-50 border border-orange-200 rounded-xl px-4 py-3 text-sm text-orange-700">
          {error}
        </div>
      )}

      {exito && (
        <div className="bg-green-50 border border-green-200 rounded-xl px-4 py-3 text-sm text-green-700">
          {exito}
        </div>
      )}

      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-3 flex flex-wrap gap-2">
        {[
          ["revisión", "Revisión documental"],
          ["configuracion", "Configuracion de requisitos"],
        ].map(([id, label]) => (
          <button
            key={id}
            onClick={() => setVista(id as "revisión" | "configuracion")}
            className={`px-4 py-2 rounded-xl text-sm font-semibold ${
              vista === id ? "bg-[#0d2b5e] text-white" : "text-[#0d2b5e] hover:bg-blue-50"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="grid lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-4 lg:col-span-1">
          <h3 className="font-bold text-[#0d2b5e] mb-4">Empresas</h3>
          <div className="space-y-2">
            {empresas.map((empresa) => (
              <button
                key={empresa.empresa.id_empresa}
                onClick={() => setSeleccionada(empresa.empresa.id_empresa)}
                className={`w-full text-left border rounded-xl p-3 ${
                  seleccionada === empresa.empresa.id_empresa
                    ? "border-[#1565c0] bg-blue-50"
                    : "border-gray-200 hover:bg-gray-50"
                }`}
              >
                <div className="font-semibold text-sm text-[#0d2b5e]">{empresa.empresa.nombre_empresa}</div>
                <div className="text-xs text-gray-500 mt-1">
                  {empresa.resumen.aprobados}/{empresa.resumen.total} documentos aprobados
                </div>
                <span
                  className={`inline-block mt-2 text-xs px-2.5 py-1 rounded-full font-semibold ${
                    estadoColor[empresa.empresa.estado_empresa] ?? "bg-gray-100 text-gray-600"
                  }`}
                >
                  {empresa.empresa.estado_empresa}
                </span>
              </button>
            ))}
            {empresas.length === 0 && (
              <p className="text-sm text-gray-400">No hay empresas con expediente documental activo.</p>
            )}
          </div>
        </div>

        <div className="lg:col-span-3 space-y-6">
          {vista === "configuracion" ? (
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
              <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-3 mb-5">
                <div>
                  <h3 className="font-bold text-[#0d2b5e]">Configuracion de requisitos</h3>
                  <p className="text-xs text-gray-500 mt-1">
                    Esta configuracion es global y no depende de que exista una empresa seleccionada.
                  </p>
                </div>
                <button
                  onClick={abrirCreacionRequisito}
                  className="bg-[#1565c0] text-white rounded-xl px-4 py-2 text-xs font-semibold"
                >
                  Crear requisito
                </button>
              </div>
              <p className="text-xs text-orange-700 bg-orange-50 border border-orange-100 rounded-xl px-4 py-3 mb-5">
                No elimines requisitos usados; desactivalos para conservar historial.
              </p>
              {!existeConvenioConFormato && (
                <p className="text-xs text-blue-700 bg-blue-50 border border-blue-100 rounded-xl px-4 py-3 mb-5">
                  No hay requisito de convenio con formato configurado. Crea uno con etapa Convenio y requiere formato para habilitar la descarga del formato.
                </p>
              )}
              <div className="space-y-3">
                {requisitosGlobales.map((requisito) => renderRequisito(requisito, "configuracion"))}
                {requisitosGlobales.length === 0 && (
                  <div className="text-sm text-gray-400">No hay requisitos configurados.</div>
                )}
              </div>
            </div>
          ) : empresaActual ? (
            <>
              <div className="bg-[#0d2b5e] text-white rounded-2xl p-6">
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-5">
                  <div>
                    <h2 className="text-xl font-bold">{empresaActual.empresa.nombre_empresa}</h2>
                    <p className="text-blue-200 text-sm mt-1">
                      RFC: {empresaActual.empresa.rfc ?? "Sin RFC"} · {empresaActual.empresa.giro ?? "Sin giro"}
                    </p>
                  </div>

                  <span className="bg-white/15 text-white px-4 py-2 rounded-full text-sm font-semibold w-fit">
                    {empresaActual.empresa.estado_empresa}
                  </span>
                </div>

                <div className="grid md:grid-cols-4 gap-4 mt-6">
                  {([
                    ["Aprobados", empresaActual.resumen.aprobados, CheckCircle2],
                    ["Pendientes", empresaActual.resumen.pendientes, AlertTriangle],
                    ["Rechazados", empresaActual.resumen.rechazados, XCircle],
                    ["Faltantes", empresaActual.resumen.faltantes, FileText],
                  ] satisfies StatCard[]).map(([label, value, Icon]) => (
                    <div key={label} className="bg-white/10 rounded-xl p-4">
                      <Icon className="w-5 h-5 text-blue-200 mb-2" />
                      <div className="font-bold">{value}</div>
                      <div className="text-blue-200 text-sm">{label}</div>
                    </div>
                  ))}
                </div>
              </div>

              {vista === "revisión" && (
                <div className="space-y-6">
                  <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
                    <h3 className="font-bold text-[#0d2b5e] mb-2">Documentacion legal</h3>
                    <p className="text-xs text-gray-500 mb-5">
                      Estos requisitos deben aprobarse antes de liberar el convenio.
                    </p>
                    <div className="space-y-3">
                      {documentacionLegal.map((requisito) => renderRequisito(requisito, "revisión"))}
                      {documentacionLegal.length === 0 && (
                        <div className="text-sm text-gray-400">No hay requisitos de documentacion configurados.</div>
                      )}
                    </div>
                  </div>

                  <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
                    <h3 className="font-bold text-[#0d2b5e] mb-2">Convenio</h3>
                    <p className="text-xs text-gray-500 mb-5">
                      Los requisitos de convenio se revisan por separado de la documentacion legal inicial.
                    </p>
                    <div className="space-y-3">
                      {requisitosConvenio.map((requisito) => renderRequisito(requisito, "revisión"))}
                      {requisitosConvenio.length === 0 && (
                        <div className="text-sm text-gray-400">No hay requisitos de convenio configurados.</div>
                      )}
                    </div>
                  </div>
                </div>
              )}

            </>
          ) : (
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-10 text-center text-gray-400">
              No hay empresas con expediente documental activo.
            </div>
          )}
        </div>
      </div>

      {(configurando || creandoRequisito) && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl border border-gray-200 shadow-xl p-6 w-full max-w-2xl">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h3 className="font-bold text-[#0d2b5e]">
                  {configurando ? "Configurar documento" : "Crear requisito documental"}
                </h3>
                <p className="text-sm text-gray-500 mt-1">
                  Estos datos son los que vera la empresa antes de cargar su archivo.
                </p>
              </div>
              <button
                onClick={() => {
                  setConfigurando(null);
                  setCreandoRequisito(false);
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid gap-4 mt-5">
              <label className="block">
                <span className="text-xs font-semibold text-gray-500">Nombre del documento</span>
                <input
                  value={configForm.nombre}
                  onChange={(event) => setConfigForm({ ...configForm, nombre: event.target.value })}
                  className="mt-1 w-full border border-gray-300 rounded-xl px-3 py-2 text-sm outline-none focus:border-[#1565c0]"
                />
              </label>

              <label className="block">
                <span className="text-xs font-semibold text-gray-500">Descripcion para la empresa</span>
                <textarea
                  value={configForm.descripcion}
                  onChange={(event) => setConfigForm({ ...configForm, descripcion: event.target.value })}
                  rows={4}
                  placeholder="Explica que debe entregar la empresa y cualquier criterio importante."
                  className="mt-1 w-full border border-gray-300 rounded-xl px-3 py-2 text-sm outline-none resize-none focus:border-[#1565c0]"
                />
              </label>

              <label className="block">
                <span className="text-xs font-semibold text-gray-500">Etapa</span>
                <select
                  value={configForm.etapa}
                  onChange={(event) =>
                    setConfigForm({
                      ...configForm,
                      etapa: event.target.value as ConfiguracionRequisitoForm["etapa"],
                    })
                  }
                  className="mt-1 w-full border border-gray-300 rounded-xl px-3 py-2 text-sm outline-none focus:border-[#1565c0]"
                >
                  <option value="Documentacion">Documentacion</option>
                  <option value="Convenio">Convenio</option>
                  <option value="Vinculacion">Vinculacion</option>
                </select>
              </label>

              <label className="block">
                <span className="text-xs font-semibold text-gray-500">Aplica a</span>
                <select
                  value={configForm.tipo_tramite}
                  onChange={(event) =>
                    setConfigForm({
                      ...configForm,
                      tipo_tramite: event.target.value as ConfiguracionRequisitoForm["tipo_tramite"],
                    })
                  }
                  className="mt-1 w-full border border-gray-300 rounded-xl px-3 py-2 text-sm outline-none focus:border-[#1565c0]"
                >
                  <option value="Todos">Todas las empresas</option>
                  <option value="Convenio">Solo empresas de Convenio</option>
                  <option value="Vinculacion">Solo empresas de Vinculacion</option>
                </select>
                <span className="mt-1 block text-xs text-gray-500">
                  Úsalo para que un requisito de Documentacion sea solo de Convenio o solo de Vinculacion.
                </span>
              </label>

              <div className="grid md:grid-cols-3 gap-3">
                <label className="border border-gray-200 rounded-xl px-3 py-2 flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={configForm.obligatorio}
                    onChange={(event) => setConfigForm({ ...configForm, obligatorio: event.target.checked })}
                  />
                  Obligatorio
                </label>

                <label className="border border-gray-200 rounded-xl px-3 py-2 flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={configForm.requiere_formato}
                    onChange={(event) => setConfigForm({ ...configForm, requiere_formato: event.target.checked })}
                  />
                  Requiere formato
                </label>

                <label className="border border-gray-200 rounded-xl px-3 py-2 flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={configForm.activo}
                    onChange={(event) => setConfigForm({ ...configForm, activo: event.target.checked })}
                  />
                  Visible para empresas
                </label>
              </div>

              {configurando && configForm.requiere_formato && (
                <div className="border border-blue-100 bg-blue-50 rounded-xl p-4">
                  <div className="flex flex-col md:flex-row md:items-center gap-3 md:justify-between">
                    <div>
                      <p className="font-semibold text-sm text-[#0d2b5e]">Formato institucional</p>
                      <p className="text-xs text-gray-500 mt-1">
                        {configurando.formato
                          ? configurando.formato.nombre_archivo
                          : "Aun no hay formato anexado para este requisito."}
                      </p>
                      <p className="text-xs text-blue-700 mt-1">
                        {textoFormatoPorEtapa(configForm.etapa)}
                      </p>
                      {configurando.formato && (
                        <p className="text-xs text-gray-600 mt-1">
                          Alcance actual: {configurando.formato.id_empresa
                            ? `Solo ${configurando.formato.empresa_nombre ?? "empresa asignada"}`
                            : "Todas las empresas"}
                        </p>
                      )}
                    </div>

                    <div className="flex flex-wrap gap-2">
                      {configurando.formato && (
                        <button
                          onClick={() => abrirFormato(configurando.formato!.id_formato_empresa, configurando.formato!.nombre_archivo)}
                          className="border border-blue-200 text-[#1565c0] rounded-xl px-4 py-2 text-xs font-semibold flex items-center gap-2"
                        >
                          <Download className="w-4 h-4" />
                          Ver formato
                        </button>
                      )}

                      {configurando.formato && (
                        <button
                          onClick={() => eliminarFormato(configurando)}
                          disabled={formatoTipo === configurando.id_tipo_documento_empresa}
                          className="border border-red-200 text-red-700 rounded-xl px-4 py-2 text-xs font-semibold flex items-center gap-2 disabled:opacity-50"
                        >
                          <XCircle className="w-4 h-4" />
                          Eliminar formato
                        </button>
                      )}

                      <label className="bg-[#1565c0] text-white rounded-xl px-4 py-2 text-xs font-semibold flex items-center gap-2 cursor-pointer">
                        <Upload className="w-4 h-4" />
                        {formatoTipo === configurando.id_tipo_documento_empresa
                          ? "Subiendo..."
                          : configurando.formato
                            ? "Actualizar formato"
                            : "Subir formato"}
                        <input
                          type="file"
                          accept={ACCEPT_FORMATOS}
                          className="hidden"
                          onChange={(event) => subirFormato(configurando, event)}
                        />
                      </label>
                    </div>
                  </div>
                  {renderSelectorAlcanceFormato(
                    configForm.etapa,
                    configForm.tipo_tramite === "Todos" ? null : configForm.tipo_tramite,
                  )}
                </div>
              )}

              {configForm.etapa === "Convenio" && (
                <div className="border border-green-200 bg-green-50 rounded-xl p-4 text-sm text-green-800">
                  Este requisito pertenece a la etapa Convenio. Cuando su documento sea aprobado,
                  se creara o actualizara automaticamente el convenio vigente de la empresa.
                </div>
              )}
            </div>

            <div className="flex flex-wrap gap-2 justify-end mt-5">
              <button
                onClick={() => {
                  setConfigurando(null);
                  setCreandoRequisito(false);
                }}
                className="border border-gray-300 text-gray-600 rounded-xl px-4 py-2 text-xs font-semibold"
              >
                Cancelar
              </button>
              <button
                onClick={guardarConfiguracion}
                disabled={!configForm.nombre.trim() || procesando === (configurando?.id_tipo_documento_empresa ?? -1)}
                className="bg-[#0d2b5e] text-white rounded-xl px-4 py-2 text-xs font-semibold flex items-center gap-2 disabled:opacity-50"
              >
                <Send className="w-4 h-4" />
                Guardar configuracion
              </button>
            </div>
          </div>
        </div>
      )}

      {rechazando && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl border border-gray-200 shadow-xl p-6 w-full max-w-xl">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h3 className="font-bold text-[#0d2b5e]">Rechazar documento</h3>
                <p className="text-sm text-gray-500 mt-1">
                  La empresa vera esta observacion para corregir el archivo.
                </p>
              </div>
              <button onClick={() => setRechazando(null)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <textarea
              value={observaciones}
              onChange={(event) => setObservaciones(event.target.value)}
              rows={4}
              placeholder="Indica que debe corregir la empresa..."
              className="mt-4 w-full border border-gray-300 rounded-xl px-3 py-2 text-sm outline-none resize-none focus:ring-2 focus:ring-orange-300"
            />

            <div className="flex flex-wrap gap-2 justify-end mt-4">
              <button
                onClick={() => setRechazando(null)}
                className="border border-gray-300 text-gray-600 rounded-xl px-4 py-2 text-xs font-semibold"
              >
                Cancelar
              </button>
              <button
                onClick={() => revisarDocumento(rechazando, "Rechazado", observaciones)}
                disabled={!observaciones.trim() || procesando === rechazando.id_documento_empresa}
                className="bg-orange-600 text-white rounded-xl px-4 py-2 text-xs font-semibold flex items-center gap-2 disabled:opacity-50"
              >
                <Send className="w-4 h-4" />
                Enviar observacion
              </button>
            </div>
          </div>
        </div>
      )}

      {aprobandoConvenio && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl border border-gray-200 shadow-xl p-6 w-full max-w-xl">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h3 className="font-bold text-[#0d2b5e]">Aprobar convenio</h3>
                <p className="text-sm text-gray-500 mt-1">
                  Define la vigencia que controlara si la empresa puede aparecer en el padron.
                </p>
              </div>
              <button onClick={() => setAprobandoConvenio(null)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid md:grid-cols-2 gap-3 mt-5">
              <label className="block">
                <span className="text-xs font-semibold text-gray-500">Inicio</span>
                <div className="mt-1 border border-gray-300 rounded-xl px-3 py-2 flex items-center gap-2">
                  <CalendarDays className="w-4 h-4 text-gray-400" />
                  <input
                    type="date"
                    value={vigenciaConvenio.inicio}
                    onChange={(event) =>
                      setVigenciaConvenio({ ...vigenciaConvenio, inicio: event.target.value })
                    }
                    className="outline-none text-sm w-full"
                  />
                </div>
              </label>

              <label className="block">
                <span className="text-xs font-semibold text-gray-500">Fin</span>
                <div className="mt-1 border border-gray-300 rounded-xl px-3 py-2 flex items-center gap-2">
                  <CalendarDays className="w-4 h-4 text-gray-400" />
                  <input
                    type="date"
                    value={vigenciaConvenio.fin}
                    onChange={(event) =>
                      setVigenciaConvenio({ ...vigenciaConvenio, fin: event.target.value })
                    }
                    className="outline-none text-sm w-full"
                  />
                </div>
              </label>
            </div>

            {vigenciaConvenio.fin < vigenciaConvenio.inicio && (
              <div className="mt-4 text-xs text-red-700 bg-red-50 border border-red-100 rounded-xl px-4 py-3">
                La fecha fin no puede ser menor a la fecha inicio.
              </div>
            )}

            <div className="flex flex-wrap gap-2 justify-end mt-5">
              <button
                onClick={() => setAprobandoConvenio(null)}
                className="border border-gray-300 text-gray-600 rounded-xl px-4 py-2 text-xs font-semibold"
              >
                Cancelar
              </button>
              <button
                onClick={() =>
                  revisarDocumento(aprobandoConvenio, "Aprobado", undefined, vigenciaConvenio)
                }
                disabled={
                  !vigenciaConvenio.inicio ||
                  !vigenciaConvenio.fin ||
                  vigenciaConvenio.fin < vigenciaConvenio.inicio ||
                  procesando === aprobandoConvenio.id_documento_empresa
                }
                className="bg-green-600 text-white rounded-xl px-4 py-2 text-xs font-semibold flex items-center gap-2 disabled:opacity-50"
              >
                <CheckCircle2 className="w-4 h-4" />
                Aprobar convenio
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
