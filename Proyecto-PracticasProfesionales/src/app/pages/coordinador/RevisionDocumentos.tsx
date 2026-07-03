import { useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import { AlertTriangle, Building2, CheckCircle, Clock, Eye, FileText, Lock, RefreshCw, Search, Send, Unlock, UserCheck } from "lucide-react";

import { apiClient } from "../../../infrastructure/api/apiClient";

type AlumnoResumen = {
  id_alumno: number;
  nombre: string;
  matricula: string;
  carrera?: string | null;
  estado_alumno?: string | null;
  resumen: { aprobados: number; cargados: number; revision: number; observados: number; total: number };
};

type Documento = {
  id_documento: number;
  nombre: string;
  descripcion?: string | null;
  instrucciones?: string | null;
  etapa?: string | null;
  nombre_archivo?: string | null;
  estado: "Pendiente" | "Aprobado" | "Observado" | "Rechazado";
  generado_por_sistema: boolean;
  habilitado: boolean;
  nomenclatura: string;
};

type Detalle = {
  alumno: { id_alumno: number; nombre: string; apellido_paterno?: string | null; apellido_materno?: string | null; matricula: string; carrera?: string | null; estado_alumno?: string | null };
  expediente: { id_expediente: number; estado: string; expediente_inicial_aprobado: boolean; seleccion_habilitada: boolean; seleccion_validada: boolean; asignacion_habilitada: boolean };
  resumen: { aprobados: number; revision: number; observados: number; pendientes: number; total: number };
  documentos: Documento[];
};

const motivos = ["Documento incorrecto", "Baja calidad de imagen", "Informacion incompleta", "Nombre de archivo incorrecto", "Falta firma", "Documento ilegible"];

const nombreAlumno = (detalle: Detalle) => [detalle.alumno.nombre, detalle.alumno.apellido_paterno, detalle.alumno.apellido_materno].filter(Boolean).join(" ");

const estadoDoc = (doc: Documento) => {
  if (doc.estado === "Aprobado") return { label: "Aprobado", color: "bg-green-100 text-green-700", icon: CheckCircle };
  if (doc.estado === "Observado" || doc.estado === "Rechazado") return { label: "Correccion", color: "bg-orange-100 text-orange-700", icon: AlertTriangle };
  if (doc.nombre_archivo) return { label: "Pendiente", color: "bg-yellow-100 text-yellow-700", icon: Clock };
  return { label: "Sin cargar", color: "bg-gray-100 text-gray-500", icon: Clock };
};

export function RevisionDocumentos() {
  const [alumnos, setAlumnos] = useState<AlumnoResumen[]>([]);
  const [seleccionado, setSeleccionado] = useState<number | null>(null);
  const [detalle, setDetalle] = useState<Detalle | null>(null);
  const [busqueda, setBusqueda] = useState("");
  const [loading, setLoading] = useState(true);
  const [loadingDetalle, setLoadingDetalle] = useState(false);
  const [procesando, setProcesando] = useState<number | null>(null);
  const [accion, setAccion] = useState("");
  const [corrigiendoId, setCorrigiendoId] = useState<number | null>(null);
  const [motivo, setMotivo] = useState("");
  const [comentario, setComentario] = useState("");
  const [error, setError] = useState("");

  const cargarAlumnos = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get<AlumnoResumen[]>("/coordinador/documentos/alumnos");
      setAlumnos(response.data);
      if (!seleccionado && response.data.length) setSeleccionado(response.data[0].id_alumno);
    } catch (err) {
      console.error(err);
      setError("No se pudo cargar la lista de alumnos.");
    } finally {
      setLoading(false);
    }
  };

  const cargarDetalle = async (idAlumno: number) => {
    try {
      setLoadingDetalle(true);
      const response = await apiClient.get<Detalle>(`/coordinador/documentos/alumnos/${idAlumno}`);
      setDetalle(response.data);
    } catch (err) {
      console.error(err);
      setError("No se pudo cargar el expediente del alumno.");
    } finally {
      setLoadingDetalle(false);
    }
  };

  useEffect(() => { cargarAlumnos(); }, []);
  useEffect(() => { if (seleccionado) cargarDetalle(seleccionado); }, [seleccionado]);

  const filtrados = useMemo(() => {
    const q = busqueda.toLowerCase().trim();
    if (!q) return alumnos;
    return alumnos.filter((a) => `${a.nombre} ${a.matricula} ${a.carrera ?? ""}`.toLowerCase().includes(q));
  }, [alumnos, busqueda]);

  const porEtapa = useMemo(() => {
    const docs = detalle?.documentos ?? [];
    return {
      elegibilidad: docs.filter((doc) => doc.etapa === "elegibilidad"),
      expediente: docs.filter((doc) => doc.etapa === "expediente"),
      seleccion: docs.filter((doc) => doc.etapa === "seleccion_empresa"),
      asignacion: docs.filter((doc) => doc.etapa === "asignacion"),
      firmados: docs.filter((doc) => doc.etapa === "asignacion_firmada"),
    };
  }, [detalle]);

  const refrescar = async () => {
    if (seleccionado) await cargarDetalle(seleccionado);
    await cargarAlumnos();
  };

  const cambiarEstado = async (doc: Documento, estado: "Aprobado" | "Observado") => {
    try {
      setProcesando(doc.id_documento);
      await apiClient.patch(`/coordinador/documentos/${doc.id_documento}/estado`, { estado, comentario: estado === "Observado" ? `${motivo}${comentario ? `: ${comentario}` : ""}` : undefined });
      setCorrigiendoId(null);
      setMotivo("");
      setComentario("");
      await refrescar();
    } catch (err: any) {
      console.error(err);
      setError(err.response?.data?.detail ?? "No se pudo actualizar el documento.");
    } finally {
      setProcesando(null);
    }
  };

  const habilitar = async (tipo: "seleccion" | "asignacion") => {
    if (!detalle) return;
    try {
      setAccion(tipo);
      const url = tipo === "seleccion" ? `/coordinador/documentos/alumnos/${detalle.alumno.id_alumno}/habilitar-seleccion` : `/coordinador/documentos/alumnos/${detalle.alumno.id_alumno}/habilitar-asignacion`;
      const response = await apiClient.post<Detalle>(url);
      setDetalle(response.data);
      await cargarAlumnos();
    } catch (err: any) {
      console.error(err);
      setError(err.response?.data?.detail ?? "No se pudo habilitar el siguiente paso.");
    } finally {
      setAccion("");
    }
  };

  const abrir = async (doc: Documento) => {
    if (!doc.nombre_archivo) return;
    try {
      const response = await apiClient.get(`/coordinador/documentos/${doc.id_documento}/archivo`, { responseType: "blob" });
      const url = URL.createObjectURL(response.data);
      window.open(url, "_blank", "noopener,noreferrer");
    } catch (err) {
      console.error(err);
      setError("No se pudo abrir el PDF.");
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[#0d2b5e]">Revision de Documentos</h1>
        <p className="text-gray-500 text-sm mt-1">Coordinador de Practicas Profesionales: revisa por bloques el expediente del alumno.</p>
      </div>

      {error && <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl p-4 text-sm">{error}</div>}

      <div className="grid xl:grid-cols-[350px_1fr] gap-6">
        <aside className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="p-4 border-b border-gray-100"><div className="border rounded-xl px-3 py-2 flex items-center gap-2"><Search className="w-4 h-4 text-gray-400" /><input value={busqueda} onChange={(e) => setBusqueda(e.target.value)} className="outline-none text-sm w-full" placeholder="Buscar alumno..." /></div></div>
          <div className="max-h-[720px] overflow-y-auto divide-y divide-gray-100">
            {loading ? <div className="p-5 text-sm text-gray-500">Cargando alumnos...</div> : filtrados.map((a) => (
              <button key={a.id_alumno} onClick={() => setSeleccionado(a.id_alumno)} className={`w-full text-left p-4 hover:bg-blue-50 ${seleccionado === a.id_alumno ? "bg-blue-50" : ""}`}>
                <div className="font-semibold text-sm text-[#0d2b5e]">{a.nombre}</div>
                <div className="text-xs text-gray-500 mt-1">{a.matricula} - {a.carrera ?? "Carrera no registrada"}</div>
                <div className="mt-3 flex gap-2 text-xs"><span className="bg-green-100 text-green-700 px-2 py-1 rounded-full">{a.resumen.aprobados} aprobados</span><span className="bg-yellow-100 text-yellow-700 px-2 py-1 rounded-full">{a.resumen.revision} revision</span></div>
              </button>
            ))}
          </div>
        </aside>

        <main className="space-y-6">
          {loadingDetalle ? <div className="bg-white rounded-2xl border border-gray-200 p-6 text-sm text-gray-500">Cargando expediente...</div> : !detalle ? <div className="bg-white rounded-2xl border border-gray-200 p-6 text-sm text-gray-500">Selecciona un alumno.</div> : (
            <>
              <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 flex flex-col lg:flex-row lg:items-center gap-5">
                <div className="w-16 h-16 bg-[#0d2b5e] rounded-2xl flex items-center justify-center text-white"><UserCheck className="w-8 h-8" /></div>
                <div className="flex-1"><div className="font-bold text-xl text-[#0d2b5e]">{nombreAlumno(detalle)}</div><div className="text-gray-500 text-sm">Matricula: {detalle.alumno.matricula} - {detalle.alumno.carrera ?? "Carrera no registrada"}</div><div className="text-gray-400 text-xs mt-1">Expediente #{detalle.expediente.id_expediente} - {detalle.expediente.estado}</div></div>
                <span className="text-sm px-4 py-1.5 rounded-full font-semibold bg-blue-100 text-blue-700">{detalle.alumno.estado_alumno ?? "Sin estado"}</span>
              </div>

              <Bloque titulo="Bloque 1: Elegibilidad academica" descripcion="Primer filtro: historial academico y vigencia de derechos. Si no se aprueba este bloque, el alumno no puede continuar." validado={porEtapa.elegibilidad.every((d) => d.estado === "Aprobado")}>
                {porEtapa.elegibilidad.map((doc) => renderDocumento(doc))}
              </Bloque>

              <Bloque titulo="Bloque 2: Expediente inicial" descripcion="Documentos personales del alumno. Se habilita unicamente cuando el alumno pasa el filtro academico." validado={porEtapa.expediente.length > 0 && porEtapa.expediente.every((d) => d.estado === "Aprobado")}>
                {porEtapa.expediente.map((doc) => renderDocumento(doc))}
              </Bloque>

              <PasoCard titulo="Habilitar seleccion de empresa" descripcion="El alumno puede consultar el padron de empresas, elegir sus opciones y generar la Carta de Exposicion de Motivos." activo={detalle.expediente.expediente_inicial_aprobado} completado={detalle.expediente.seleccion_habilitada} onClick={() => habilitar("seleccion")} loading={accion === "seleccion"} icon={<Building2 className="w-4 h-4" />} />

              {detalle.expediente.seleccion_habilitada && <Bloque titulo="Bloque 3: Seleccion de empresa" descripcion="El alumno selecciona opciones del padron. El sistema genera la Carta de Exposicion de Motivos y el alumno la sube firmada." validado={porEtapa.seleccion.every((d) => d.estado === "Aprobado")}>
                {porEtapa.seleccion.map((doc) => renderDocumento(doc))}
              </Bloque>}

              <PasoCard titulo="Habilitar documentacion de asignacion" descripcion="La seleccion de empresa fue validada. Ya pueden generarse los documentos de asignacion." activo={detalle.expediente.seleccion_validada} completado={detalle.expediente.asignacion_habilitada} onClick={() => habilitar("asignacion")} loading={accion === "asignacion"} icon={<Send className="w-4 h-4" />} />

              <Bloque titulo="Bloque 4: Documentacion de asignacion" descripcion="Carta de colaboracion, carta de presentacion y carta de asignacion." validado={detalle.expediente.asignacion_habilitada}>
                {porEtapa.asignacion.map((doc) => renderDocumento(doc, !detalle.expediente.asignacion_habilitada))}
              </Bloque>

              {detalle.expediente.asignacion_habilitada && <Bloque titulo="Documentos firmados por el alumno" descripcion="El alumno descarga, firma y vuelve a cargar los documentos de asignacion." validado={porEtapa.firmados.length > 0 && porEtapa.firmados.every((d) => d.estado === "Aprobado")}>
                {porEtapa.firmados.map((doc) => renderDocumento(doc))}
              </Bloque>}
            </>
          )}
        </main>
      </div>
    </div>
  );

  function renderDocumento(doc: Documento, bloqueado = false) {
    const cfg = estadoDoc(doc);
    const Icon = cfg.icon;
    const cargado = Boolean(doc.nombre_archivo);
    const puedeRevisar = cargado && !bloqueado && !doc.generado_por_sistema;
    return (
      <div key={doc.id_documento} className={`px-6 py-6 ${bloqueado ? "opacity-50" : ""}`}>
        <div className="flex flex-col xl:flex-row xl:items-center gap-4">
          <div className="flex items-start gap-4 flex-1"><div className="w-12 h-12 bg-[#e3f0ff] rounded-2xl flex items-center justify-center flex-shrink-0"><FileText className="w-6 h-6 text-[#1565c0]" /></div><div><div className="font-semibold text-gray-800 text-base">{doc.nombre}</div><div className="text-sm text-gray-500 mt-1">{doc.descripcion}</div><div className="text-sm text-gray-500 mt-2"><span className="font-semibold text-gray-700">Instrucciones:</span> {doc.instrucciones}</div><div className="text-sm text-[#1565c0] mt-1"><span className="font-semibold">Nomenclatura:</span> {doc.nomenclatura}</div><div className="text-sm text-gray-400 mt-1">{doc.nombre_archivo ? doc.nombre_archivo : "Sin archivo cargado"}</div>{bloqueado && <div className="text-sm text-red-600 mt-2 font-semibold">Este bloque aun no esta habilitado.</div>}</div></div>
          <div className="flex flex-col sm:flex-row sm:items-center gap-3"><span className={`inline-flex items-center justify-center gap-1.5 text-sm px-4 py-2 rounded-full font-semibold ${cfg.color}`}><Icon className="w-4 h-4" />{cfg.label}</span><button onClick={() => abrir(doc)} disabled={!cargado} className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-[#1565c0] text-white rounded-xl text-sm font-semibold hover:bg-[#0d2b5e] disabled:bg-gray-200 disabled:text-gray-500 disabled:cursor-not-allowed"><Eye className="w-4 h-4" />Revisar PDF</button>{puedeRevisar && <button onClick={() => cambiarEstado(doc, "Aprobado")} disabled={procesando === doc.id_documento} className="px-4 py-2 bg-green-600 text-white rounded-xl text-sm font-semibold hover:bg-green-700 disabled:opacity-50">Aprobar</button>}{puedeRevisar && <button onClick={() => setCorrigiendoId(doc.id_documento)} className="px-4 py-2 bg-orange-600 text-white rounded-xl text-sm font-semibold hover:bg-orange-700">Solicitar correccion</button>}</div>
        </div>
        {corrigiendoId === doc.id_documento && <div className="mt-4 p-4 bg-orange-50 border border-orange-200 rounded-xl"><div className="text-sm font-semibold text-orange-700 mb-3">Motivo de correccion:</div><div className="grid sm:grid-cols-2 gap-2 mb-3">{motivos.map((m) => <label key={m} className="flex items-center gap-2 cursor-pointer p-2 rounded-lg hover:bg-orange-100"><input type="radio" value={m} checked={motivo === m} onChange={(e) => setMotivo(e.target.value)} className="accent-orange-600" /><span className="text-xs text-orange-700">{m}</span></label>)}</div><textarea value={comentario} onChange={(e) => setComentario(e.target.value)} placeholder="Agrega una observacion especifica para el alumno..." className="w-full min-h-[80px] text-sm border border-orange-200 rounded-xl p-3 focus:outline-none focus:border-orange-500 bg-white" /><div className="flex gap-2 mt-3"><button onClick={() => cambiarEstado(doc, "Observado")} disabled={!motivo} className="px-4 py-2 bg-orange-600 text-white rounded-lg text-xs font-semibold hover:bg-orange-700 disabled:opacity-50">Confirmar correccion</button><button onClick={() => { setCorrigiendoId(null); setMotivo(""); setComentario(""); }} className="px-4 py-2 border border-gray-300 text-gray-600 rounded-lg text-xs font-semibold hover:bg-gray-50">Cancelar</button></div></div>}
      </div>
    );
  }
}

function Bloque({ titulo, descripcion, validado, children }: { titulo: string; descripcion: string; validado: boolean; children: ReactNode }) {
  return <section className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden"><div className={`px-6 py-5 border-b flex gap-3 ${validado ? "bg-green-50 border-green-100" : "bg-white border-gray-100"}`}>{validado ? <Unlock className="w-6 h-6 text-green-600" /> : <Lock className="w-6 h-6 text-[#1565c0]" />}<div><h3 className={`font-bold text-xl ${validado ? "text-green-700" : "text-[#0d2b5e]"}`}>{titulo}</h3><p className={`text-sm mt-1 ${validado ? "text-green-600" : "text-gray-500"}`}>{descripcion}</p></div></div><div className="divide-y divide-gray-100">{children}</div></section>;
}

function PasoCard({ titulo, descripcion, activo, completado, loading, icon, onClick }: { titulo: string; descripcion: string; activo: boolean; completado: boolean; loading: boolean; icon: ReactNode; onClick: () => void }) {
  return <div className={`rounded-2xl border shadow-sm p-6 ${activo || completado ? "bg-green-50 border-green-200" : "bg-gray-50 border-gray-200"}`}><div className="flex flex-col md:flex-row md:items-center gap-4 justify-between"><div><h3 className={`font-bold text-xl ${activo || completado ? "text-green-700" : "text-gray-500"}`}>{titulo}</h3><p className={`text-sm mt-2 ${activo || completado ? "text-green-600" : "text-gray-400"}`}>{descripcion}</p></div><button onClick={onClick} disabled={!activo || completado || loading} className="inline-flex items-center justify-center gap-2 px-5 py-3 bg-[#0d2b5e] text-white rounded-xl text-sm font-semibold hover:bg-[#1565c0] disabled:opacity-50 disabled:cursor-not-allowed">{loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : icon}{completado ? "Habilitado" : titulo}</button></div></div>;
}