import { useEffect, useMemo, useState } from "react";
import type { ChangeEvent } from "react";
import {
  AlertTriangle,
  CalendarDays,
  CheckCircle2,
  Download,
  Eye,
  FileText,
  Pencil,
  Plus,
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
  FormatoEmpresa,
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
type TipoUnidad = {
  id_tipo_unidad_receptora: number;
  nombre: string;
  descripcion?: string | null;
  activo?: boolean;
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
  const [tiposUnidad, setTiposUnidad] = useState<TipoUnidad[]>([]);
  const [tipoUnidadConfigurando, setTipoUnidadConfigurando] = useState<number | null>(null);
  const [matrizTipoUnidad, setMatrizTipoUnidad] = useState<Array<{
    id_tipo_documento_empresa: number;
    nombre: string;
    aplica: boolean;
    obligatorio: boolean;
    orden: number | null;
    instrucciones: string | null;
  }>>([]);
  const [cargandoMatriz, setCargandoMatriz] = useState(false);
  const [guardandoMatriz, setGuardandoMatriz] = useState(false);
  const [tipoEnModal, setTipoEnModal] = useState<TipoUnidad | "nuevo" | null>(null);
  const [tipoForm, setTipoForm] = useState({ nombre: "", descripcion: "" });
  const [guardandoTipo, setGuardandoTipo] = useState(false);
  const [tipoPorDesactivar, setTipoPorDesactivar] = useState<TipoUnidad | null>(null);
  const [corrigiendoCategoria, setCorrigiendoCategoria] = useState(false);
  const [categoriaForm, setCategoriaForm] = useState({ idTipo: "", motivo: "" });
  const [guardandoCategoria, setGuardandoCategoria] = useState(false);
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

  useEffect(() => {
    if (!tipoUnidadConfigurando) {
      setMatrizTipoUnidad([]);
      return;
    }
    setCargandoMatriz(true);
    setError("");
    void apiClient
      .get<{ requisitos: typeof matrizTipoUnidad }>(
        `/coord-unidades/requisitos-por-tipo-unidad/${tipoUnidadConfigurando}`,
      )
      .then(({ data }) => setMatrizTipoUnidad(data.requisitos))
      .catch((err) => setError(getApiErrorMessage(err, "No se pudo cargar la configuración por tipo.")))
      .finally(() => setCargandoMatriz(false));
  }, [tipoUnidadConfigurando]); // eslint-disable-line react-hooks/exhaustive-deps

  async function cargar() {
    try {
      setCargando(true);
      setError("");
      const [respuesta, requisitosRespuesta, tiposRespuesta] = await Promise.all([
        gestionDocumentacionEmpresaUseCase.listarRevision(),
        apiClient.get<RequisitoEmpresa[]>("/coord-unidades/documentos-empresa/requisitos"),
        apiClient.get<TipoUnidad[]>(
          "/empresas/tipos-unidad-receptora?incluir_inactivos=true",
        ),
      ]);
      const conExpediente = respuesta.filter(
        (item) => !["Solicitante", "Rechazada"].includes(item.empresa.estado_empresa),
      );
      setEmpresas(conExpediente);
      setRequisitosGlobales(requisitosRespuesta.data);
      setTiposUnidad(tiposRespuesta.data);
      setTipoUnidadConfigurando((actual) => {
        if (actual && tiposRespuesta.data.some((tipo) => tipo.id_tipo_unidad_receptora === actual)) return actual;
        return tiposRespuesta.data.find((tipo) => tipo.activo !== false)?.id_tipo_unidad_receptora ?? null;
      });
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

  function abrirCorreccionCategoria() {
    if (!empresaActual) return;
    setCategoriaForm({
      idTipo: empresaActual.empresa.id_tipo_unidad_receptora
        ? String(empresaActual.empresa.id_tipo_unidad_receptora)
        : "",
      motivo: "",
    });
    setCorrigiendoCategoria(true);
    setError("");
  }

  async function cambiarTipoUnidad() {
    const idTipo = Number(categoriaForm.idTipo);
    if (!empresaActual || !idTipo || !categoriaForm.motivo.trim()) return;
    try {
      setGuardandoCategoria(true);
      await apiClient.patch(
        `/coord-unidades/documentos-empresa/empresas/${empresaActual.empresa.id_empresa}/tipo-unidad`,
        { id_tipo_unidad_receptora: idTipo, motivo: categoriaForm.motivo.trim() },
      );
      await cargar();
      setCorrigiendoCategoria(false);
      setExito("Categoría documental actualizada. Los requisitos aplicables fueron recalculados.");
    } catch (err) {
      setError(getApiErrorMessage(err, "No se pudo actualizar la categoría documental."));
    } finally {
      setGuardandoCategoria(false);
    }
  }

  function abrirModalTipo(tipo?: TipoUnidad) {
    setTipoEnModal(tipo ?? "nuevo");
    setTipoForm({ nombre: tipo?.nombre ?? "", descripcion: tipo?.descripcion ?? "" });
    setError("");
  }

  async function guardarTipoDesdeModal() {
    const nombre = tipoForm.nombre.trim();
    if (!nombre || tipoEnModal === null) return;
    try {
      setGuardandoTipo(true);
      setError("");
      const descripcion = tipoForm.descripcion.trim() || null;
      if (tipoEnModal === "nuevo") {
        await apiClient.post("/empresas/tipos-unidad-receptora", { nombre, descripcion, activo: true });
      } else {
        await apiClient.put(`/empresas/tipos-unidad-receptora/${tipoEnModal.id_tipo_unidad_receptora}`, {
          nombre,
          descripcion,
          activo: tipoEnModal.activo !== false,
        });
      }
      await cargar();
      setTipoEnModal(null);
      setExito(tipoEnModal === "nuevo" ? "Tipo de unidad receptora creado." : "Tipo de unidad receptora actualizado.");
    } catch (err) {
      setError(getApiErrorMessage(err, "No se pudo guardar el tipo de unidad receptora."));
    } finally {
      setGuardandoTipo(false);
    }
  }

  function crearTipoUnidad() {
    abrirModalTipo();
  }

  function editarTipoUnidad(tipo: TipoUnidad) {
    abrirModalTipo(tipo);
  }

  async function cambiarEstadoTipoUnidad(tipo: (typeof tiposUnidad)[number]) {
    try {
      await apiClient.put(`/empresas/tipos-unidad-receptora/${tipo.id_tipo_unidad_receptora}`, {
        nombre: tipo.nombre,
        descripcion: tipo.descripcion ?? null,
        activo: tipo.activo === false,
      });
      await cargar();
      setTipoPorDesactivar(null);
      setExito(`Tipo de unidad receptora ${tipo.activo === false ? "activado" : "desactivado"}.`);
    } catch (err) {
      setError(getApiErrorMessage(err, "No se pudo cambiar el estado del tipo de unidad receptora."));
    }
  }

  async function guardarMatrizTipoUnidad() {
    if (!tipoUnidadConfigurando) return;
    let ordenAplicable = 0;
    const requisitos = matrizTipoUnidad.map((item) => ({
      id_tipo_documento_empresa: item.id_tipo_documento_empresa,
      aplica: item.aplica,
      obligatorio: item.aplica ? item.obligatorio : false,
      orden: item.aplica ? ++ordenAplicable : null,
      instrucciones: item.aplica ? item.instrucciones : null,
    }));
    try {
      setGuardandoMatriz(true);
      setError("");
      await apiClient.put(
        `/coord-unidades/requisitos-por-tipo-unidad/${tipoUnidadConfigurando}`,
        {
          requisitos,
        },
      );
      setExito("Configuración documental guardada.");
    } catch (err) {
      setError(getApiErrorMessage(err, "No se pudo guardar la configuración documental."));
    } finally {
      setGuardandoMatriz(false);
    }
  }
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
      const idEmpresaFormato = formatoAlcance === "empresa"
        ? empresasCompatibles.some((item) => item.empresa.id_empresa === idBase) ? idBase : null
        : null;
      if (formatoAlcance === "empresa" && !idEmpresaFormato) {
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

  async function eliminarFormato(requisito: RequisitoEmpresa, formatoSeleccionado?: FormatoEmpresa | null) {
    const formato = formatoSeleccionado ?? requisito.formato;
    if (!formato) return;
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
        `/coord-unidades/documentos-empresa/formatos/${formato.id_formato_empresa}`,
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

  function obtenerFormatoActivoAlcance(requisito: RequisitoEmpresa) {
    const activos = requisito.formatos?.filter((formato) => formato.formato_activo !== false) ?? [];
    if (formatoAlcance === "empresa") {
      return activos.find((formato) => formato.id_empresa === Number(formatoEmpresaId)) ?? null;
    }
    return activos.find((formato) => formato.id_empresa === null) ?? requisito.formato;
  }

  function renderSelectorAlcanceFormato(etapa: string, tipoTramite?: string | null) {
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
            value={formatoAlcance}
            onChange={(event) => setFormatoAlcance(event.target.value as "todas" | "empresa")}
            className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2 text-xs outline-none focus:border-[#1565c0]"
          >
            <option value="todas">Formato general para todas las empresas</option>
            <option value="empresa">Solo una empresa</option>
          </select>
          <span className="mt-1 block text-xs text-blue-700">
            Puedes subir un formato general para todas las empresas o asignar un formato específico a una empresa. Si una empresa tiene formato específico, este tendrá prioridad sobre el general.
          </span>
        </label>

        {formatoAlcance === "empresa" && (
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
    const pendienteRevision = estado === "Pendiente" || estado === "En revisión" || estado === "En revision";
    const esperandoCorreccion = estado === "Rechazado" || estado === "Observado" || estado === "Con observaciones";
    const observaciones = documento?.observaciones?.trim() || "";
    const etapa = requisito.etapa ?? "Documentacion";
    const aplicaA = requisito.tipo_tramite ?? "Todas";
    const activo = requisito.activo ?? true;
    const puedeEliminar = requisito.puede_eliminar ?? false;
    const formatoDelAlcance = obtenerFormatoActivoAlcance(requisito);
    const formatoGeneralActivo = (requisito.formatos ?? []).find(
      (formato) => formato.formato_activo !== false && formato.id_empresa === null,
    ) ?? requisito.formato;
    const empresaFormato = empresas.find((item) => item.empresa.id_empresa === Number(formatoEmpresaId))?.empresa;

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
              {esperandoCorreccion && (
                <div className="mt-3 rounded-xl border border-orange-200 bg-orange-50 px-4 py-3">
                  <p className="text-sm font-semibold text-orange-800">Esperando corrección de la empresa</p>
                  <p className="text-xs text-orange-700 mt-1">La unidad receptora debe reemplazar el archivo antes de que pueda aprobarse.</p>
                </div>
              )}
              {esperandoCorreccion && (
                <div className="text-xs text-red-700 mt-2 bg-red-50 border border-red-100 rounded-lg px-3 py-2">
                  <p className="font-semibold">Observaciones del rechazo</p>
                  <p className="mt-1 whitespace-pre-wrap">{observaciones || "Sin observaciones registradas"}</p>
                </div>
              )}
              {modo === "configuracion" && requisito.requiere_formato && (
                <div className="mt-3 border border-blue-200 bg-blue-50 rounded-xl p-3">
                  <p className="text-xs font-semibold text-[#0d2b5e]">Formato institucional</p>
                  <p className="text-xs text-blue-700 mt-1">
                    {textoFormatoPorEtapa(etapa)}
                  </p>
                  {renderSelectorAlcanceFormato(etapa, requisito.tipo_tramite)}
                  <div className={`mt-3 rounded-lg border px-3 py-2 text-xs ${formatoDelAlcance ? "border-green-200 bg-green-50 text-green-800" : "border-gray-200 bg-white text-gray-500"}`}>
                    {formatoDelAlcance
                      ? formatoAlcance === "empresa"
                        ? `Formato específico activo para ${formatoDelAlcance.empresa_nombre ?? empresaFormato?.nombre_empresa ?? "la empresa seleccionada"}: ${formatoDelAlcance.nombre_archivo}`
                        : `Formato general activo: ${formatoDelAlcance.nombre_archivo}`
                      : formatoAlcance === "empresa" && !formatoEmpresaId
                        ? "Selecciona una empresa para consultar su formato específico."
                        : formatoAlcance === "empresa" && formatoGeneralActivo
                          ? `Sin formato específico. Esta empresa usará el formato general activo: ${formatoGeneralActivo.nombre_archivo}`
                        : "Sin formato disponible para este alcance."}
                  </div>
                  <div className="flex flex-wrap gap-2 mt-3">
                    {formatoDelAlcance && (
                      <button
                        onClick={() => abrirFormato(formatoDelAlcance.id_formato_empresa, formatoDelAlcance.nombre_archivo)}
                        className="border border-blue-200 bg-white text-[#1565c0] rounded-lg px-3 py-2 text-xs font-semibold flex items-center gap-1"
                      >
                        <Download className="w-3 h-3" />
                        Ver / Descargar formato
                      </button>
                    )}
                    {formatoDelAlcance && (
                      <button
                        onClick={() => eliminarFormato(requisito, formatoDelAlcance)}
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
                        : formatoDelAlcance
                          ? "Reemplazar formato"
                          : "Subir formato"}
                      <input
                        type="file"
                        accept={ACCEPT_FORMATOS}
                        className="hidden"
                        disabled={formatoAlcance === "empresa" && !formatoEmpresaId}
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
                    : esperandoCorreccion
                      ? "bg-red-100 text-red-700"
                      : "bg-gray-100 text-gray-600"
              }`}
            >
              {esperandoCorreccion ? "Esperando corrección" : estado}
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
            {documento && pendienteRevision && (
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

            {documento && pendienteRevision && (
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
          ["configuracion", "Configuración de requisitos"],
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
            <div className="space-y-6">
              <section className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
                <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
                  <div>
                    <h2 className="text-xl font-bold text-[#0d2b5e]">Configuración de requisitos documentales</h2>
                    <p className="text-sm text-gray-500 mt-1">Define qué documentos debe entregar cada tipo de unidad receptora.</p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <button onClick={() => abrirModalTipo()} className="border border-gray-300 text-gray-700 rounded-xl px-4 py-2 text-sm font-semibold flex items-center gap-2">
                      <Plus className="w-4 h-4" /> Crear tipo de unidad
                    </button>
                    <button onClick={abrirCreacionRequisito} className="bg-[#1565c0] text-white rounded-xl px-4 py-2 text-sm font-semibold flex items-center gap-2">
                      <Plus className="w-4 h-4" /> Crear requisito
                    </button>
                  </div>
                </div>
              </section>

              <section className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
                <div className="mb-4">
                  <h3 className="font-bold text-[#0d2b5e]">Tipos de unidad receptora</h3>
                  <p className="text-sm text-gray-500 mt-1">Selecciona una tarjeta para configurar sus documentos.</p>
                </div>
                <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-3">
                  {tiposUnidad.map((tipo) => {
                    const seleccionado = tipoUnidadConfigurando === tipo.id_tipo_unidad_receptora;
                    return (
                      <article key={tipo.id_tipo_unidad_receptora} className={`rounded-xl border-2 p-4 transition ${seleccionado ? "border-[#1565c0] bg-blue-50/60" : "border-gray-200 hover:border-blue-200"}`}>
                        <button onClick={() => setTipoUnidadConfigurando(tipo.id_tipo_unidad_receptora)} className="w-full text-left" aria-pressed={seleccionado}>
                          <div className="flex items-start justify-between gap-3">
                            <span className="font-semibold text-[#0d2b5e]">{tipo.nombre}</span>
                            <span className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${tipo.activo === false ? "bg-gray-100 text-gray-500" : "bg-green-100 text-green-700"}`}>{tipo.activo === false ? "Inactivo" : "Activo"}</span>
                          </div>
                          <p className="text-xs text-gray-500 mt-2 min-h-8">{tipo.descripcion || "Sin descripción."}</p>
                        </button>
                        <div className="flex gap-2 mt-3 pt-3 border-t border-gray-200">
                          <button onClick={() => abrirModalTipo(tipo)} className="text-gray-600 hover:text-[#1565c0] rounded-lg px-2 py-1.5 text-xs font-semibold flex items-center gap-1"><Pencil className="w-3.5 h-3.5" /> Editar</button>
                          <button onClick={() => tipo.activo === false ? void cambiarEstadoTipoUnidad(tipo) : setTipoPorDesactivar(tipo)} className={`${tipo.activo === false ? "text-green-700" : "text-orange-700"} rounded-lg px-2 py-1.5 text-xs font-semibold`}>{tipo.activo === false ? "Activar" : "Desactivar"}</button>
                        </div>
                      </article>
                    );
                  })}
                </div>
                {tiposUnidad.length === 0 && <p className="text-sm text-gray-400 py-6 text-center">No hay tipos de unidad receptora configurados.</p>}
              </section>

              <section className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
                <h3 className="font-bold text-[#0d2b5e]">Requisitos para: {tiposUnidad.find((tipo) => tipo.id_tipo_unidad_receptora === tipoUnidadConfigurando)?.nombre ?? "ningún tipo seleccionado"}</h3>
                <p className="text-sm text-gray-500 mt-1 mb-5">Marca qué documentos aplican para este tipo de unidad receptora.</p>
                {!tipoUnidadConfigurando ? (
                  <div className="rounded-xl border border-dashed border-gray-300 p-8 text-center text-sm text-gray-500">Selecciona un tipo de unidad receptora para comenzar.</div>
                ) : cargandoMatriz ? (
                  <div className="rounded-xl bg-gray-50 p-8 text-center text-sm text-gray-500">Cargando requisitos...</div>
                ) : matrizTipoUnidad.length === 0 ? (
                  <div className="rounded-xl border border-dashed border-gray-300 p-8 text-center text-sm text-gray-500">No hay documentos disponibles para configurar.</div>
                ) : (
                  <>
                    <div className="overflow-x-auto rounded-xl border border-gray-200">
                      <table className="w-full text-sm">
                        <thead className="bg-gray-50 text-left text-xs uppercase tracking-wide text-gray-500"><tr><th className="p-3">Documento</th><th className="p-3">Aplica</th><th className="p-3">Obligatorio</th><th className="p-3">Instrucciones</th></tr></thead>
                        <tbody>{matrizTipoUnidad.map((item, indice) => (
                          <tr key={item.id_tipo_documento_empresa} className={`border-t ${item.aplica ? "bg-white" : "bg-gray-50/70"}`}>
                            <td className="p-3 min-w-52"><p className="font-medium text-gray-800">{item.nombre}</p><span className={`inline-flex mt-1 rounded-full px-2 py-0.5 text-[11px] font-semibold ${item.aplica ? item.obligatorio ? "bg-orange-100 text-orange-700" : "bg-blue-100 text-blue-700" : "bg-gray-200 text-gray-500"}`}>{item.aplica ? item.obligatorio ? "Obligatorio" : "Opcional" : "No aplica"}</span></td>
                            <td className="p-3"><input aria-label={`Aplicar ${item.nombre}`} type="checkbox" checked={item.aplica} onChange={(event) => setMatrizTipoUnidad((actual) => actual.map((fila, i) => i === indice ? { ...fila, aplica: event.target.checked, obligatorio: event.target.checked ? fila.obligatorio : false, orden: null, instrucciones: event.target.checked ? fila.instrucciones : null } : fila))} /></td>
                            <td className="p-3"><input aria-label={`Marcar ${item.nombre} como obligatorio`} type="checkbox" checked={item.aplica && item.obligatorio} disabled={!item.aplica} onChange={(event) => setMatrizTipoUnidad((actual) => actual.map((fila, i) => i === indice ? { ...fila, obligatorio: event.target.checked } : fila))} /></td>
                            <td className="p-3"><input aria-label={`Instrucciones de ${item.nombre}`} value={item.aplica ? item.instrucciones ?? "" : ""} disabled={!item.aplica} placeholder={item.aplica ? "Indicaciones para la empresa" : "No aplica"} onChange={(event) => setMatrizTipoUnidad((actual) => actual.map((fila, i) => i === indice ? { ...fila, instrucciones: event.target.value } : fila))} className="w-full min-w-56 border border-gray-300 rounded-lg px-3 py-1.5 disabled:bg-gray-100 disabled:text-gray-400" /></td>
                          </tr>
                        ))}</tbody>
                      </table>
                    </div>
                    <div className="flex justify-end mt-4"><button onClick={() => void guardarMatrizTipoUnidad()} disabled={guardandoMatriz} className="bg-[#1565c0] text-white rounded-xl px-5 py-2.5 text-sm font-semibold disabled:opacity-50">{guardandoMatriz ? "Guardando..." : `Guardar requisitos de ${tiposUnidad.find((tipo) => tipo.id_tipo_unidad_receptora === tipoUnidadConfigurando)?.nombre ?? "este tipo"}`}</button></div>
                  </>
                )}
              </section>

              <section className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
              <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-3 mb-5">
                <div>
                  <h3 className="font-bold text-[#0d2b5e]">Catálogo general de requisitos</h3>
                  <p className="text-xs text-gray-500 mt-1">
                    Documentos globales disponibles para las etapas de documentación, convenio y vinculación.
                  </p>
                </div>
                <span className="text-xs rounded-full bg-blue-50 text-blue-700 px-3 py-1.5 font-semibold">{requisitosGlobales.length} documentos</span>
              </div>
              <div className="hidden">
                <div className="flex items-center justify-between gap-3">
                  <div className="font-semibold text-sm text-[#0d2b5e]">Requisitos por tipo de unidad receptora</div>
                  <button onClick={() => void crearTipoUnidad()} className="bg-white border border-blue-200 text-[#0d2b5e] rounded-lg px-3 py-1.5 text-xs font-semibold">
                    Crear nuevo tipo
                  </button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {tiposUnidad.map((tipo) => (
                    <div key={tipo.id_tipo_unidad_receptora} className="bg-white border rounded-lg px-2 py-1 flex items-center gap-2 text-xs">
                      <span className={tipo.activo === false ? "text-gray-400 line-through" : "text-gray-700"}>{tipo.nombre}</span>
                      <button onClick={() => void editarTipoUnidad(tipo)} className="text-blue-700">Editar</button>
                      <button onClick={() => void cambiarEstadoTipoUnidad(tipo)} className="text-orange-700">
                        {tipo.activo === false ? "Activar" : "Desactivar"}
                      </button>
                    </div>
                  ))}
                </div>
                <select
                  value={tipoUnidadConfigurando ?? ""}
                  onChange={(event) => setTipoUnidadConfigurando(Number(event.target.value) || null)}
                  className="w-full border rounded-lg px-3 py-2 text-sm bg-white"
                >
                  <option value="">Selecciona un tipo</option>
                  {tiposUnidad.filter((tipo) => tipo.activo !== false).map((tipo) => (
                    <option key={tipo.id_tipo_unidad_receptora} value={tipo.id_tipo_unidad_receptora}>
                      {tipo.nombre}
                    </option>
                  ))}
                </select>
                {matrizTipoUnidad.length > 0 && (
                  <>
                    <div className="overflow-x-auto bg-white rounded-lg border">
                      <table className="w-full text-xs">
                        <thead><tr className="text-left border-b"><th className="p-2">Documento</th><th>Aplica</th><th>Obligatorio</th><th>Orden</th><th>Instrucciones</th></tr></thead>
                        <tbody>
                          {matrizTipoUnidad.map((item, indice) => (
                            <tr key={item.id_tipo_documento_empresa} className="border-b last:border-0">
                              <td className="p-2">{item.nombre}</td>
                              <td><input type="checkbox" checked={item.aplica} onChange={(e) => setMatrizTipoUnidad((actual) => actual.map((fila, i) => i === indice ? { ...fila, aplica: e.target.checked } : fila))} /></td>
                              <td><input type="checkbox" checked={item.obligatorio} onChange={(e) => setMatrizTipoUnidad((actual) => actual.map((fila, i) => i === indice ? { ...fila, obligatorio: e.target.checked } : fila))} /></td>
                              <td><input type="number" value={item.orden} onChange={(e) => setMatrizTipoUnidad((actual) => actual.map((fila, i) => i === indice ? { ...fila, orden: Number(e.target.value) } : fila))} className="w-16 border rounded px-2 py-1" /></td>
                              <td><input value={item.instrucciones ?? ""} onChange={(e) => setMatrizTipoUnidad((actual) => actual.map((fila, i) => i === indice ? { ...fila, instrucciones: e.target.value } : fila))} className="w-full min-w-44 border rounded px-2 py-1" /></td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    <button onClick={() => void guardarMatrizTipoUnidad()} className="bg-[#0d2b5e] text-white rounded-lg px-4 py-2 text-xs font-semibold">
                      Guardar configuración
                    </button>
                  </>
                )}
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
              </section>
            </div>
          ) : empresaActual ? (
            <>
              <div className="bg-[#0d2b5e] text-white rounded-2xl p-6">
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-5">
                  <div>
                    <h2 className="text-xl font-bold">{empresaActual.empresa.nombre_empresa}</h2>
                    <div className="mt-3">
                      <span className="text-xs text-blue-100 block mb-1">Categoría documental</span>
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="bg-white/10 rounded-lg px-3 py-2 text-sm">
                          {empresaActual.empresa.tipo_unidad_receptora ?? "Sin categoría asignada"}
                        </span>
                        <button onClick={abrirCorreccionCategoria} className="bg-white text-[#0d2b5e] rounded-lg px-3 py-2 text-xs font-semibold">
                          {empresaActual.empresa.id_tipo_unidad_receptora ? "Corregir categoría documental" : "Asignar categoría documental"}
                        </button>
                      </div>
                    </div>
                    <p className="text-blue-200 text-sm mt-1">
                      RFC: {empresaActual.empresa.rfc ?? "Sin RFC"} · {empresaActual.empresa.giro ?? "Sin giro"}
                    </p>
                  </div>

                  <span className="bg-white/15 text-white px-4 py-2 rounded-full text-sm font-semibold w-fit">
                    {empresaActual.empresa.estado_empresa}
                  </span>
                </div>

                {empresaActual.clasificacion_pendiente && (
                  <div className="mt-5 rounded-xl border border-orange-300 bg-orange-50 px-4 py-3 text-sm text-orange-900">
                    <p className="font-semibold">Esta empresa no tiene categoría documental asignada.</p>
                    <p className="mt-1">Asigna una categoría antes de revisar o aprobar su documentación.</p>
                  </div>
                )}

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

      {corrigiendoCategoria && empresaActual && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50" role="dialog" aria-modal="true">
          <div className="bg-white rounded-2xl border border-gray-200 shadow-xl p-6 w-full max-w-lg">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h3 className="font-bold text-[#0d2b5e]">Corregir categoría documental</h3>
                <p className="text-sm text-gray-500 mt-1">Los requisitos del expediente se recalcularán sin borrar documentos existentes.</p>
              </div>
              <button onClick={() => setCorrigiendoCategoria(false)} className="text-gray-400 hover:text-gray-600" aria-label="Cerrar"><X className="w-5 h-5" /></button>
            </div>
            <div className="grid gap-4 mt-5">
              <label>
                <span className="text-xs font-semibold text-gray-600">Tipo de institución u organización</span>
                <select value={categoriaForm.idTipo} onChange={(event) => setCategoriaForm({ ...categoriaForm, idTipo: event.target.value })} className="mt-1 w-full border border-gray-300 rounded-xl px-3 py-2 text-sm bg-white">
                  <option value="">Selecciona una categoría</option>
                  {tiposUnidad.filter((tipo) => tipo.activo !== false).map((tipo) => <option key={tipo.id_tipo_unidad_receptora} value={tipo.id_tipo_unidad_receptora}>{tipo.nombre}</option>)}
                </select>
                {tiposUnidad.find((tipo) => String(tipo.id_tipo_unidad_receptora) === categoriaForm.idTipo)?.descripcion && <p className="text-xs text-blue-700 mt-2">{tiposUnidad.find((tipo) => String(tipo.id_tipo_unidad_receptora) === categoriaForm.idTipo)?.descripcion}</p>}
              </label>
              <label>
                <span className="text-xs font-semibold text-gray-600">Motivo del cambio *</span>
                <textarea value={categoriaForm.motivo} onChange={(event) => setCategoriaForm({ ...categoriaForm, motivo: event.target.value })} rows={3} placeholder="Explica por qué se corrige la categoría documental." className="mt-1 w-full border border-gray-300 rounded-xl px-3 py-2 text-sm resize-none" />
              </label>
            </div>
            <div className="flex justify-end gap-2 mt-5">
              <button onClick={() => setCorrigiendoCategoria(false)} className="border border-gray-300 text-gray-600 rounded-xl px-4 py-2 text-sm font-semibold">Cancelar</button>
              <button onClick={() => void cambiarTipoUnidad()} disabled={!categoriaForm.idTipo || !categoriaForm.motivo.trim() || guardandoCategoria} className="bg-[#1565c0] text-white rounded-xl px-4 py-2 text-sm font-semibold disabled:opacity-50">{guardandoCategoria ? "Guardando..." : "Actualizar categoría"}</button>
            </div>
          </div>
        </div>
      )}

      {tipoEnModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50" role="dialog" aria-modal="true">
          <div className="bg-white rounded-2xl border border-gray-200 shadow-xl p-6 w-full max-w-lg">
            <div className="flex items-start justify-between gap-4">
              <div><h3 className="font-bold text-[#0d2b5e]">{tipoEnModal === "nuevo" ? "Crear tipo de unidad" : "Editar tipo de unidad"}</h3><p className="text-sm text-gray-500 mt-1">Este nombre se mostrará al clasificar unidades receptoras.</p></div>
              <button onClick={() => setTipoEnModal(null)} className="text-gray-400 hover:text-gray-600" aria-label="Cerrar"><X className="w-5 h-5" /></button>
            </div>
            <div className="grid gap-4 mt-5">
              <label><span className="text-xs font-semibold text-gray-600">Nombre</span><input autoFocus value={tipoForm.nombre} onChange={(event) => setTipoForm({ ...tipoForm, nombre: event.target.value })} className="mt-1 w-full border border-gray-300 rounded-xl px-3 py-2 text-sm outline-none focus:border-[#1565c0]" placeholder="Ej. Institución pública" /></label>
              <label><span className="text-xs font-semibold text-gray-600">Descripción (opcional)</span><textarea value={tipoForm.descripcion} onChange={(event) => setTipoForm({ ...tipoForm, descripcion: event.target.value })} rows={3} className="mt-1 w-full border border-gray-300 rounded-xl px-3 py-2 text-sm outline-none resize-none focus:border-[#1565c0]" placeholder="Describe brevemente este tipo de unidad." /></label>
            </div>
            {!tipoForm.nombre.trim() && <p className="text-xs text-orange-700 mt-3">El nombre es obligatorio.</p>}
            <div className="flex justify-end gap-2 mt-5"><button onClick={() => setTipoEnModal(null)} className="border border-gray-300 text-gray-600 rounded-xl px-4 py-2 text-sm font-semibold">Cancelar</button><button onClick={() => void guardarTipoDesdeModal()} disabled={!tipoForm.nombre.trim() || guardandoTipo} className="bg-[#1565c0] text-white rounded-xl px-4 py-2 text-sm font-semibold disabled:opacity-50">{guardandoTipo ? "Guardando..." : "Guardar"}</button></div>
          </div>
        </div>
      )}

      {tipoPorDesactivar && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50" role="alertdialog" aria-modal="true">
          <div className="bg-white rounded-2xl border border-gray-200 shadow-xl p-6 w-full max-w-md">
            <h3 className="font-bold text-[#0d2b5e]">Desactivar tipo de unidad</h3>
            <p className="text-sm text-gray-600 mt-2">¿Deseas desactivar “{tipoPorDesactivar.nombre}”? Se conservarán las empresas y configuraciones existentes.</p>
            <div className="flex justify-end gap-2 mt-5"><button onClick={() => setTipoPorDesactivar(null)} className="border border-gray-300 text-gray-600 rounded-xl px-4 py-2 text-sm font-semibold">Cancelar</button><button onClick={() => void cambiarEstadoTipoUnidad(tipoPorDesactivar)} className="bg-orange-600 text-white rounded-xl px-4 py-2 text-sm font-semibold">Desactivar</button></div>
          </div>
        </div>
      )}

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
                  <option value="Documentacion">Documentación</option>
                  <option value="Convenio">Convenio</option>
                  <option value="Vinculacion">Vinculación</option>
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
                        {obtenerFormatoActivoAlcance(configurando)?.nombre_archivo
                          ?? "Sin formato disponible para el alcance seleccionado."}
                      </p>
                      <p className="text-xs text-blue-700 mt-1">
                        {textoFormatoPorEtapa(configForm.etapa)}
                      </p>
                      {obtenerFormatoActivoAlcance(configurando) && (
                        <p className="text-xs text-gray-600 mt-1">
                          {formatoAlcance === "empresa"
                            ? `Formato específico activo para ${obtenerFormatoActivoAlcance(configurando)?.empresa_nombre ?? "la empresa seleccionada"}`
                            : "Formato general activo"}
                        </p>
                      )}
                    </div>

                    <div className="flex flex-wrap gap-2">
                      {obtenerFormatoActivoAlcance(configurando) && (
                        <button
                          onClick={() => {
                            const formato = obtenerFormatoActivoAlcance(configurando);
                            if (formato) void abrirFormato(formato.id_formato_empresa, formato.nombre_archivo);
                          }}
                          className="border border-blue-200 text-[#1565c0] rounded-xl px-4 py-2 text-xs font-semibold flex items-center gap-2"
                        >
                          <Download className="w-4 h-4" />
                          Ver formato
                        </button>
                      )}

                      {obtenerFormatoActivoAlcance(configurando) && (
                        <button
                          onClick={() => eliminarFormato(configurando, obtenerFormatoActivoAlcance(configurando))}
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
                           : obtenerFormatoActivoAlcance(configurando)
                            ? "Actualizar formato"
                            : "Subir formato"}
                        <input
                          type="file"
                          accept={ACCEPT_FORMATOS}
                          className="hidden"
                          disabled={formatoAlcance === "empresa" && !formatoEmpresaId}
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
                Guardar configuración
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
