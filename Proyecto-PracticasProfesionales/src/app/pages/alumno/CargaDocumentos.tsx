import { useEffect, useMemo, useState } from "react";
import { AlertCircle, CheckCircle, Clock, Eye, FileText, Lock, RefreshCw, Upload } from "lucide-react";

import { apiClient } from "../../../infrastructure/api/apiClient";

type Etapa = "elegibilidad" | "expediente" | "seleccion_empresa" | "asignacion" | "asignacion_firmada";

type Documento = {
  id_documento: number;
  nombre: string;
  descripcion?: string | null;
  instrucciones?: string | null;
  etapa?: Etapa | string | null;
  nombre_archivo?: string | null;
  estado: "Pendiente" | "Aprobado" | "Observado" | "Rechazado";
  fecha_carga?: string | null;
  generado_por_sistema: boolean;
  habilitado: boolean;
  nomenclatura: string;
  url_archivo?: string | null;
};

type DocumentacionResponse = {
  expediente: {
    expediente_inicial_aprobado: boolean;
    seleccion_habilitada: boolean;
    seleccion_validada: boolean;
    asignacion_habilitada: boolean;
  };
  resumen: { aprobados: number; revision: number; observados: number; pendientes: number; total: number };
  documentos: Documento[];
};

const estadoConfig = (doc: Documento) => {
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
  const [data, setData] = useState<DocumentacionResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState<number | null>(null);
  const [error, setError] = useState("");

  const cargar = async () => {
    try {
      setLoading(true);
      setError("");
      const response = await apiClient.get<DocumentacionResponse>("/alumno/documentacion");
      setData(response.data);
    } catch (err) {
      console.error(err);
      setError("No se pudo cargar tu expediente documental.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargar();
  }, []);

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

  const subir = async (doc: Documento, file?: File) => {
    if (!file) return;
    if (file.type !== "application/pdf" && !file.name.toLowerCase().endsWith(".pdf")) {
      setError("Solo se permiten archivos PDF.");
      return;
    }
    try {
      setUploading(doc.id_documento);
      const formData = new FormData();
      formData.append("archivo", file);
      const response = await apiClient.post<DocumentacionResponse>(`/alumno/documentos/${doc.id_documento}/archivo`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setData(response.data);
      setError("");
    } catch (err: any) {
      console.error(err);
      setError(err.response?.data?.detail ?? "No se pudo subir el PDF.");
    } finally {
      setUploading(null);
    }
  };

  const abrir = async (doc: Documento) => {
    if (!doc.url_archivo) return;
    try {
      const response = await apiClient.get(doc.url_archivo, { responseType: "blob" });
      const url = URL.createObjectURL(response.data);
      window.open(url, "_blank", "noopener,noreferrer");
    } catch (err) {
      console.error(err);
      setError("No se pudo abrir el PDF.");
    }
  };

  if (loading) return <div className="text-sm text-gray-500">Cargando expediente documental...</div>;
  if (!data) return <div className="bg-red-50 border border-red-200 text-red-700 rounded-2xl p-5 text-sm">{error}</div>;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[#0d2b5e]">Carga de Documentos</h1>
        <p className="text-gray-500 text-sm mt-1">Carga tu expediente en PDF siguiendo el flujo por bloques.</p>
      </div>

      {error && <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl p-4 text-sm">{error}</div>}

      <Bloque titulo="Bloque 1: Elegibilidad academica" descripcion="Primer filtro: historial academico y vigencia de derechos. Si no se aprueba este bloque, el alumno no puede continuar." validado={porEtapa.elegibilidad.every((d) => d.estado === "Aprobado")}>
        {porEtapa.elegibilidad.map((doc) => <DocumentoAlumno key={doc.id_documento} doc={doc} uploading={uploading} onUpload={subir} onOpen={abrir} />)}
      </Bloque>

      <Bloque titulo="Bloque 2: Expediente inicial" descripcion="Documentos personales del alumno. Se habilita unicamente cuando el alumno pasa el filtro academico." validado={porEtapa.expediente.length > 0 && porEtapa.expediente.every((d) => d.estado === "Aprobado")}>
        {porEtapa.expediente.map((doc) => <DocumentoAlumno key={doc.id_documento} doc={doc} uploading={uploading} onUpload={subir} onOpen={abrir} />)}
      </Bloque>

      <div className={`rounded-2xl border shadow-sm p-6 ${data.expediente.expediente_inicial_aprobado ? "bg-green-50 border-green-200" : "bg-gray-50 border-gray-200"}`}>
        <h3 className={`font-bold text-xl ${data.expediente.expediente_inicial_aprobado ? "text-green-700" : "text-gray-500"}`}>Habilitar seleccion de empresa</h3>
        <p className={`text-sm mt-2 ${data.expediente.expediente_inicial_aprobado ? "text-green-600" : "text-gray-400"}`}>
          {data.expediente.expediente_inicial_aprobado
            ? "Tu expediente inicial fue validado. Ya puedes consultar el padron de empresas y elegir tus opciones."
            : "Primero deben aprobarse los 7 documentos iniciales."}
        </p>
      </div>

      {data.expediente.seleccion_habilitada && (
        <Bloque titulo="Bloque 3: Seleccion de empresa" descripcion="El alumno selecciona opciones del padron. El sistema genera la Carta de Exposicion de Motivos y el alumno la sube firmada." validado={porEtapa.seleccion.every((d) => d.estado === "Aprobado")}>
          {porEtapa.seleccion.map((doc) => <DocumentoAlumno key={doc.id_documento} doc={doc} uploading={uploading} onUpload={subir} onOpen={abrir} />)}
        </Bloque>
      )}

      {data.expediente.asignacion_habilitada ? (
        <section className="bg-white rounded-2xl border border-green-200 shadow-sm overflow-hidden">
          <div className="px-6 py-5 border-b border-green-100 bg-green-50 flex gap-3">
            <CheckCircle className="w-6 h-6 text-green-600" />
            <div>
              <h3 className="font-bold text-green-700 text-xl">Documentacion de Asignacion Disponible</h3>
              <p className="text-sm text-green-600 mt-1">Todos tus documentos iniciales fueron validados. Ya puedes consultar la documentacion enviada por coordinacion.</p>
            </div>
          </div>
          <div className="divide-y divide-gray-100">{porEtapa.asignacion.map((doc) => <DocumentoAlumno key={doc.id_documento} doc={doc} uploading={uploading} onUpload={subir} onOpen={abrir} />)}</div>
          <div className="border-t border-blue-100 bg-[#e3f0ff] px-6 py-5">
            <h3 className="font-bold text-[#0d2b5e] text-xl">Subir Documentos Firmados</h3>
            <p className="text-sm text-blue-700 mt-1">Descarga los documentos enviados por coordinacion, llenalos y subelos nuevamente en formato PDF.</p>
          </div>
          <div className="divide-y divide-gray-100">{porEtapa.firmados.map((doc) => <DocumentoAlumno key={doc.id_documento} doc={doc} uploading={uploading} onUpload={subir} onOpen={abrir} />)}</div>
        </section>
      ) : (
        <div className="bg-gray-50 border border-gray-200 rounded-2xl p-5 flex gap-4">
          <Clock className="w-6 h-6 text-gray-400" />
          <div>
            <div className="font-semibold text-gray-700 text-sm">Documentacion de asignacion aun no disponible</div>
            <div className="text-gray-500 text-xs mt-1">La carta de colaboracion, carta de presentacion y carta de asignacion estaran disponibles cuando coordinacion habilite la asignacion.</div>
          </div>
        </div>
      )}
    </div>
  );
}

function Bloque({ titulo, descripcion, validado, children }: { titulo: string; descripcion: string; validado: boolean; children: React.ReactNode }) {
  return (
    <section className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
      <div className={`px-6 py-5 border-b flex gap-3 ${validado ? "bg-green-50 border-green-100" : "bg-white border-gray-100"}`}>
        {validado ? <CheckCircle className="w-6 h-6 text-green-600" /> : <Lock className="w-6 h-6 text-[#1565c0]" />}
        <div>
          <h3 className={`font-bold text-xl ${validado ? "text-green-700" : "text-[#0d2b5e]"}`}>{titulo}</h3>
          <p className={`text-sm mt-1 ${validado ? "text-green-600" : "text-gray-500"}`}>{descripcion}</p>
        </div>
      </div>
      <div className="divide-y divide-gray-100">{children}</div>
    </section>
  );
}

function DocumentoAlumno({ doc, uploading, onUpload, onOpen }: { doc: Documento; uploading: number | null; onUpload: (doc: Documento, file?: File) => void; onOpen: (doc: Documento) => void }) {
  const cfg = estadoConfig(doc);
  const Icon = cfg.icon;
  const puedeSubir = doc.habilitado && !doc.generado_por_sistema && doc.estado !== "Aprobado";

  return (
    <div className={`px-6 py-6 flex flex-col lg:flex-row lg:items-center gap-4 ${doc.habilitado ? "" : "opacity-55"}`}>
      <div className="flex items-start gap-4 flex-1">
        <div className="w-12 h-12 bg-[#e3f0ff] rounded-2xl flex items-center justify-center flex-shrink-0"><FileText className="w-6 h-6 text-[#1565c0]" /></div>
        <div>
          <div className="font-semibold text-gray-800 text-base">{doc.nombre}</div>
          <div className="text-sm text-gray-500 mt-1 leading-relaxed">{doc.descripcion}</div>
          <div className="text-sm text-gray-500 mt-2"><span className="font-semibold text-gray-700">Instrucciones:</span> {doc.instrucciones}</div>
          <div className="text-sm text-[#1565c0] mt-1"><span className="font-semibold">Nomenclatura:</span> {doc.nomenclatura}</div>
          {doc.nombre_archivo && <div className="text-sm text-blue-500 mt-1">Archivo: {doc.nombre_archivo} - {fecha(doc.fecha_carga)}</div>}
          {!doc.habilitado && <div className="text-sm text-red-600 mt-2 font-medium">Este bloque aun no esta habilitado.</div>}
        </div>
      </div>
      <div className="flex flex-col sm:flex-row sm:items-center gap-3">
        <span className={`inline-flex items-center justify-center gap-1.5 text-sm px-4 py-2 rounded-full font-semibold ${cfg.color}`}><Icon className="w-4 h-4" />{cfg.label}</span>
        {doc.nombre_archivo && <button onClick={() => onOpen(doc)} className="p-2 text-gray-400 hover:text-[#1565c0] hover:bg-blue-50 rounded-lg"><Eye className="w-4 h-4" /></button>}
        {puedeSubir && (
          <label className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-[#0d2b5e] text-white rounded-xl text-sm font-semibold hover:bg-[#1565c0] cursor-pointer">
            {uploading === doc.id_documento ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
            {doc.nombre_archivo ? "Reemplazar" : "Seleccionar archivo"}
            <input type="file" accept="application/pdf,.pdf" className="hidden" onChange={(event) => onUpload(doc, event.target.files?.[0])} />
          </label>
        )}
      </div>
    </div>
  );
}