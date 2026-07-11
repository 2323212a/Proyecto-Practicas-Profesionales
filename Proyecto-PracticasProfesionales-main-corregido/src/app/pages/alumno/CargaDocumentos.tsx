import { useEffect, useMemo, useState } from "react";
import { AlertCircle, CheckCircle, Clock, Download, Eye, FileText, Lock, RefreshCw, Upload } from "lucide-react";

import { gestionDocumentosAlumnoUseCase } from "../../dependencies";
import type { DocumentacionAlumnoResponse, DocumentoFlujoAlumno } from "../../../domain/alumno/DocumentoAlumno";
import { getApiErrorMessage } from "../../../shared/utils/apiError";

const estadoConfig = (doc: DocumentoFlujoAlumno) => {
  if (doc.estado === "Aprobado") return { label: "Aprobado", color: "bg-green-100 text-green-700", icon: CheckCircle };
  if (doc.nombre_archivo && doc.estado === "Pendiente") return { label: "En revision", color: "bg-yellow-100 text-yellow-700", icon: Clock };
  if (doc.estado === "Observado" || doc.estado === "Rechazado") return { label: "Correccion", color: "bg-orange-100 text-orange-700", icon: AlertCircle };
  return { label: "Pendiente", color: "bg-gray-100 text-gray-500", icon: Clock };
};

const fecha = (value?: string | null) => {
  if (!value) return "Sin fecha";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Sin fecha";
  return new Intl.DateTimeFormat("es-MX", { day: "2-digit", month: "short", year: "numeric" }).format(date);
};

export function CargaDocumentos() {
  const [data, setData] = useState<DocumentacionAlumnoResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState<number | null>(null);
  const [error, setError] = useState("");

  const cargar = async () => {
    try {
      setLoading(true);
      setError("");
      setData(await gestionDocumentosAlumnoUseCase.obtenerDocumentacion());
    } catch (err) {
      console.error(err);
      setError("No se pudo cargar tu expediente documental.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { cargar(); }, []);

  const porEtapa = useMemo(() => {
    const docs = data?.documentos ?? [];
    return {
      elegibilidad: docs.filter((doc) => doc.etapa === "elegibilidad"),
      expediente: docs.filter((doc) => doc.etapa === "expediente"),
      seleccion: docs.filter((doc) => doc.etapa === "seleccion_empresa"),
      asignacion: docs.filter((doc) => doc.etapa === "asignacion"),
      firmados: docs.filter((doc) => doc.etapa === "asignacion_firmada"),
    };
  }, [data]);

  const subir = async (doc: DocumentoFlujoAlumno, file?: File) => {
    if (!file) return;
    if (file.type !== "application/pdf" && !file.name.toLowerCase().endsWith(".pdf")) {
      setError("Solo se permiten archivos PDF.");
      return;
    }
    try {
      setUploading(doc.id_documento);
      setData(await gestionDocumentosAlumnoUseCase.subirArchivo(doc.id_documento, file));
      setError("");
    } catch (err: unknown) {
      console.error(err);
      setError(getApiErrorMessage(err, "No se pudo subir el PDF."));
    } finally {
      setUploading(null);
    }
  };

  const abrir = async (doc: DocumentoFlujoAlumno) => {
    if (!doc.url_archivo) return;
    try {
      const blob = await gestionDocumentosAlumnoUseCase.descargarArchivo(doc.id_documento);
      const url = URL.createObjectURL(blob);
      window.open(url, "_blank", "noopener,noreferrer");
    } catch (err) {
      console.error(err);
      setError("No se pudo abrir el PDF.");
    }
  };

  const descargarGenerado = async (doc: DocumentoFlujoAlumno) => {
    if (!doc.codigo_generacion) return;
    try {
      const blob = await gestionDocumentosAlumnoUseCase.descargarGenerado(doc.codigo_generacion);
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      const extension = blob.type.includes("wordprocessingml") ? "docx" : "pdf";
      link.href = url;
      link.download = `${doc.codigo_generacion}_${data?.alumno?.matricula ?? "alumno"}.${extension}`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
    } catch (err: unknown) {
      console.error(err);
      setError(getApiErrorMessage(err, "No se pudo descargar el documento oficial."));
    }
  };

  if (loading) return <div className="text-[11px] text-gray-500">Cargando expediente documental...</div>;
  if (!data) return <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl p-3 text-[11px]">{error}</div>;

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-bold text-[#0d2b5e]">Carga de Documentos</h1>
        <p className="text-gray-500 text-[11px] mt-0.5">Carga tu expediente en PDF siguiendo el flujo por bloques.</p>
      </div>

      {error && <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl p-3 text-[11px]">{error}</div>}

      <Bloque titulo="Bloque 1: Elegibilidad academica" descripcion="Primer filtro: historial academico y vigencia de derechos. Si no se aprueba este bloque, el alumno no puede continuar." validado={porEtapa.elegibilidad.every((d) => d.estado === "Aprobado")}>
        {porEtapa.elegibilidad.map((doc) => <DocumentoAlumno key={doc.id_documento} doc={doc} uploading={uploading} onUpload={subir} onOpen={abrir} onDownloadGenerated={descargarGenerado} />)}
      </Bloque>

      <Bloque titulo="Bloque 2: Expediente inicial" descripcion="Documentos personales del alumno. Se habilita unicamente cuando el alumno pasa el filtro academico." validado={porEtapa.expediente.length > 0 && porEtapa.expediente.every((d) => d.estado === "Aprobado")}>
        {porEtapa.expediente.map((doc) => <DocumentoAlumno key={doc.id_documento} doc={doc} uploading={uploading} onUpload={subir} onOpen={abrir} onDownloadGenerated={descargarGenerado} />)}
      </Bloque>

      <div className={`rounded-xl border shadow-sm p-3 ${data.expediente.expediente_inicial_aprobado ? "bg-green-50 border-green-200" : "bg-gray-50 border-gray-200"}`}>
        <h3 className={`font-bold text-base ${data.expediente.expediente_inicial_aprobado ? "text-green-700" : "text-gray-500"}`}>Habilitar seleccion de empresa</h3>
        <p className={`text-[11px] mt-1 ${data.expediente.expediente_inicial_aprobado ? "text-green-600" : "text-gray-400"}`}>
          {data.expediente.expediente_inicial_aprobado ? "Tu expediente inicial fue validado. Ya puedes consultar el padron de empresas y elegir tus opciones." : "Primero deben aprobarse los 7 documentos iniciales."}
        </p>
      </div>

      {data.expediente.seleccion_habilitada && (
        <Bloque titulo="Bloque 3: Seleccion de empresa" descripcion="El alumno selecciona opciones del padron. El sistema genera la Carta de Exposicion de Motivos y el alumno la sube firmada." validado={porEtapa.seleccion.every((d) => d.estado === "Aprobado")}>
          {porEtapa.seleccion.map((doc) => <DocumentoAlumno key={doc.id_documento} doc={doc} uploading={uploading} onUpload={subir} onOpen={abrir} onDownloadGenerated={descargarGenerado} />)}
        </Bloque>
      )}

      {data.expediente.asignacion_habilitada ? (
        <section className="bg-white rounded-xl border border-green-200 shadow-sm overflow-hidden">
          <div className="px-4 py-3 border-b border-green-100 bg-green-50 flex gap-3">
            <CheckCircle className="w-3.5 h-3.5 text-green-600" />
            <div>
              <h3 className="font-bold text-green-700 text-base">Documentacion de Asignacion Disponible</h3>
              <p className="text-[11px] text-green-600 mt-0.5">Todos tus documentos iniciales fueron validados. Ya puedes consultar la documentacion enviada por coordinacion.</p>
            </div>
          </div>
          <div className="divide-y divide-gray-100">{porEtapa.asignacion.map((doc) => <DocumentoAlumno key={doc.id_documento} doc={doc} uploading={uploading} onUpload={subir} onOpen={abrir} onDownloadGenerated={descargarGenerado} />)}</div>
          <div className="border-t border-blue-100 bg-[#e3f0ff] px-4 py-3">
            <h3 className="font-bold text-[#0d2b5e] text-base">Subir Documentos Firmados</h3>
            <p className="text-[11px] text-blue-700 mt-0.5">Descarga los documentos enviados por coordinacion, llenalos y subelos nuevamente en formato PDF.</p>
          </div>
          <div className="divide-y divide-gray-100">{porEtapa.firmados.map((doc) => <DocumentoAlumno key={doc.id_documento} doc={doc} uploading={uploading} onUpload={subir} onOpen={abrir} onDownloadGenerated={descargarGenerado} />)}</div>
        </section>
      ) : (
        <div className="bg-gray-50 border border-gray-200 rounded-xl p-3 flex gap-3">
          <Clock className="w-3.5 h-3.5 text-gray-400" />
          <div>
            <div className="font-semibold text-gray-700 text-[11px]">Documentacion de asignacion aun no disponible</div>
            <div className="text-gray-500 text-[11px] mt-0.5">La carta de colaboracion, carta de presentacion y carta de asignacion estaran disponibles cuando coordinacion habilite la asignacion.</div>
          </div>
        </div>
      )}
    </div>
  );
}

function Bloque({ titulo, descripcion, validado, children }: { titulo: string; descripcion: string; validado: boolean; children: React.ReactNode }) {
  return (
    <section className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
      <div className={`px-4 py-3 border-b flex gap-3 ${validado ? "bg-green-50 border-green-100" : "bg-white border-gray-100"}`}>
        {validado ? <CheckCircle className="w-3.5 h-3.5 text-green-600" /> : <Lock className="w-3.5 h-3.5 text-[#1565c0]" />}
        <div>
          <h3 className={`font-bold text-base ${validado ? "text-green-700" : "text-[#0d2b5e]"}`}>{titulo}</h3>
          <p className={`text-[11px] mt-0.5 ${validado ? "text-green-600" : "text-gray-500"}`}>{descripcion}</p>
        </div>
      </div>
      <div className="divide-y divide-gray-100">{children}</div>
    </section>
  );
}

function DocumentoAlumno({ doc, uploading, onUpload, onOpen, onDownloadGenerated }: { doc: DocumentoFlujoAlumno; uploading: number | null; onUpload: (doc: DocumentoFlujoAlumno, file?: File) => void; onOpen: (doc: DocumentoFlujoAlumno) => void; onDownloadGenerated: (doc: DocumentoFlujoAlumno) => void }) {
  const cfg = estadoConfig(doc);
  const Icon = cfg.icon;
  const puedeSubir = doc.habilitado && !doc.generado_por_sistema && doc.estado !== "Aprobado";

  return (
    <div className={`px-4 py-4 flex flex-col lg:flex-row lg:items-center gap-3 ${doc.habilitado ? "" : "opacity-55"}`}>
      <div className="flex items-start gap-3 flex-1">
        <div className="w-9 h-9 bg-[#e3f0ff] rounded-xl flex items-center justify-center flex-shrink-0"><FileText className="w-3.5 h-3.5 text-[#1565c0]" /></div>
        <div>
          <div className="font-semibold text-gray-800 text-sm">{doc.nombre}</div>
          <div className="text-[11px] text-gray-500 mt-0.5 leading-relaxed">{doc.descripcion}</div>
          <div className="text-[11px] text-gray-500 mt-1"><span className="font-semibold text-gray-700">Instrucciones:</span> {doc.instrucciones}</div>
          {doc.codigo_generacion && (
            <div className="text-[11px] text-[#1565c0] mt-1 font-semibold">
              Documento oficial generado por el sistema. Descargalo, firmalo y sube aqui el PDF firmado.
            </div>
          )}
          <div className="text-[11px] text-[#1565c0] mt-0.5"><span className="font-semibold">Nomenclatura:</span> {doc.nomenclatura}</div>
          {doc.nombre_archivo && (
            <div className="mt-1 rounded-xl border border-blue-200 bg-blue-50 px-2.5 py-1.5">
              <div className="text-[10px] font-bold uppercase tracking-wide text-[#1565c0]">Archivo enviado</div>
              <div className="mt-0.5 flex items-start gap-2">
                <FileText className="mt-0.5 h-3.5 w-3.5 flex-shrink-0 text-[#0d2b5e]" />
                <div className="min-w-0">
                  <div className="break-words text-xs font-bold text-[#0d2b5e]">{doc.nombre_archivo}</div>
                  <div className="text-[11px] text-blue-700">Fecha de carga: {fecha(doc.fecha_carga)}</div>
                </div>
              </div>
            </div>
          )}
          {!doc.habilitado && <div className="text-[11px] text-red-600 mt-1 font-medium">Este bloque aun no esta habilitado.</div>}
          {doc.estado === "Aprobado" && !doc.generado_por_sistema && <div className="text-[11px] text-green-700 mt-1 font-medium">Documento aprobado. Puedes verlo, pero ya no reemplazarlo.</div>}
        </div>
      </div>
      <div className="flex flex-col sm:flex-row sm:items-center gap-3">
        <span className={`inline-flex items-center justify-center gap-1.5 text-[11px] px-3 py-1.5 rounded-full font-semibold ${cfg.color}`}><Icon className="w-3.5 h-3.5" />{cfg.label}</span>
        {doc.codigo_generacion && (
          <button
            type="button"
            onClick={() => onDownloadGenerated(doc)}
            disabled={!doc.puede_descargar_generado}
            className="inline-flex min-w-[190px] items-center justify-center gap-2 rounded-xl bg-[#0d2b5e] px-3 py-2 text-[11px] font-bold text-white shadow-sm ring-1 ring-[#0d2b5e]/20 hover:bg-[#1565c0] disabled:cursor-not-allowed disabled:bg-gray-200 disabled:text-gray-500"
          >
            <Download className="h-3.5 w-3.5" />
            Descargar documento oficial
          </button>
        )}
        {doc.nombre_archivo && (
          <button
            onClick={() => onOpen(doc)}
            className="inline-flex min-w-[150px] items-center justify-center gap-2 rounded-xl bg-[#1565c0] px-3 py-2 text-[11px] font-bold text-white shadow-sm ring-1 ring-[#1565c0]/20 hover:bg-[#0d2b5e] focus:outline-none focus:ring-2 focus:ring-[#1565c0] focus:ring-offset-2"
          >
            <Eye className="h-3.5 w-3.5" />
            Ver documento
          </button>
        )}
        {puedeSubir && (
          <label className="inline-flex items-center justify-center gap-2 px-3 py-1.5 bg-[#0d2b5e] text-white rounded-xl text-[11px] font-semibold hover:bg-[#1565c0] cursor-pointer">
            {uploading === doc.id_documento ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Upload className="w-3.5 h-3.5" />}
            {doc.nombre_archivo ? "Reemplazar" : "Seleccionar archivo"}
            <input type="file" accept="application/pdf,.pdf" className="hidden" onChange={(event) => onUpload(doc, event.target.files?.[0])} />
          </label>
        )}
      </div>
    </div>
  );
}
