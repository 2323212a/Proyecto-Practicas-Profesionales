import { useEffect, useMemo, useState, type ReactNode } from "react";
import {
  AlertTriangle,
  Bell,
  CalendarDays,
  CheckCircle2,
  Clock,
  Eye,
  FileText,
  MessageSquare,
  RefreshCw,
  Search,
  Send,
  UserRound,
  Users,
  X,
} from "lucide-react";

import { apiClient } from "../../../infrastructure/api/apiClient";

type SeguimientoAlumno = {
  id_preferencia: number;
  id_alumno: number;
  id_usuario?: number;
  id_asignacion?: number | null;
  alumno: string;
  matricula?: string | null;
  semestre?: number | null;
  grupo?: string | null;
  carrera?: string | null;
  empresa: string;
  vacante?: string | null;
  modalidad?: string | null;
  horario?: string | null;
  periodo: string;
  fecha_inicio: string;
  fecha_fin: string;
  dias_transcurridos: number;
  dias_totales: number;
  reportes_entregados: number;
  reportes_requeridos: number;
  reportes_total: number;
  horas_registradas: number;
  horas_deberia_llevar: number;
  horas_faltantes: number;
  horas_requeridas: number;
  avance: number;
  estado: "Al corriente" | "Con observaciones" | "Requiere seguimiento" | "Listo para liberacion";
};

type SeguimientoResponse = {
  resumen: {
    total: number;
    al_corriente: number;
    con_observaciones: number;
    requiere_seguimiento: number;
    listos_liberacion: number;
  };
  filtros: { empresas: string[]; estados: string[] };
  pendientes: string[];
  alumnos: SeguimientoAlumno[];
};

const estadoColor: Record<string, string> = {
  "Al corriente": "bg-green-100 text-green-700",
  "Con observaciones": "bg-orange-100 text-orange-700",
  "Requiere seguimiento": "bg-red-100 text-red-700",
  "Listo para liberacion": "bg-blue-100 text-blue-700",
};

const formatoFecha = (fecha?: string | null) => {
  if (!fecha) return "Sin fecha";
  return new Date(`${fecha}T00:00:00`).toLocaleDateString("es-MX", { day: "2-digit", month: "short", year: "numeric" });
};

export function CoordinadorSeguimiento() {
  const [datos, setDatos] = useState<SeguimientoResponse | null>(null);
  const [busqueda, setBusqueda] = useState("");
  const [estado, setEstado] = useState("Todos");
  const [empresa, setEmpresa] = useState("Todas");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [mensaje, setMensaje] = useState("");
  const [expediente, setExpediente] = useState<SeguimientoAlumno | null>(null);
  const [observacionAlumno, setObservacionAlumno] = useState<SeguimientoAlumno | null>(null);
  const [tipoObservacion, setTipoObservacion] = useState("Horas faltantes");
  const [textoObservacion, setTextoObservacion] = useState("");
  const [enviando, setEnviando] = useState(false);

  useEffect(() => {
    cargarSeguimiento();
  }, []);

  const cargarSeguimiento = async () => {
    try {
      setLoading(true);
      setError("");
      const response = await apiClient.get<SeguimientoResponse>("/coordinador/seguimiento");
      setDatos(response.data);
    } catch (err: any) {
      console.error(err);
      setError(err.response?.data?.detail || "No se pudo cargar el seguimiento de practicas.");
    } finally {
      setLoading(false);
    }
  };

  const abrirObservacion = (alumno: SeguimientoAlumno) => {
    const sugerencia = alumno.horas_faltantes > 0
      ? `Se detecto que llevas ${alumno.horas_faltantes} horas menos de las esperadas para este punto del periodo. Actualiza tus reportes o verifica tu registro con la unidad receptora.`
      : `Se requiere revisar tu avance de practicas. Por favor atiende los reportes pendientes y confirma tu situacion con coordinacion.`;
    setObservacionAlumno(alumno);
    setTipoObservacion(alumno.horas_faltantes > 0 ? "Horas faltantes" : "Seguimiento general");
    setTextoObservacion(sugerencia);
  };

  const enviarObservacion = async () => {
    if (!observacionAlumno || !textoObservacion.trim()) return;
    try {
      setEnviando(true);
      setError("");
      setMensaje("");
      await apiClient.post(`/coordinador/seguimiento/alumnos/${observacionAlumno.id_alumno}/observaciones`, {
        tipo: tipoObservacion,
        mensaje: textoObservacion,
      });
      setMensaje(`Observacion enviada a ${observacionAlumno.alumno}.`);
      setObservacionAlumno(null);
      setTextoObservacion("");
    } catch (err: any) {
      console.error(err);
      setError(err.response?.data?.detail || "No se pudo enviar la observacion.");
    } finally {
      setEnviando(false);
    }
  };

  const alumnosFiltrados = useMemo(() => {
    const alumnos = datos?.alumnos || [];
    const texto = busqueda.trim().toLowerCase();
    return alumnos.filter((alumno) => {
      const coincideBusqueda = !texto || [alumno.alumno, alumno.matricula || "", alumno.carrera || "", alumno.empresa, alumno.vacante || ""].some((valor) => valor.toLowerCase().includes(texto));
      const coincideEstado = estado === "Todos" || alumno.estado === estado;
      const coincideEmpresa = empresa === "Todas" || alumno.empresa === empresa;
      return coincideBusqueda && coincideEstado && coincideEmpresa;
    });
  }, [busqueda, datos, empresa, estado]);

  if (loading) return <div className="text-sm text-gray-500">Cargando seguimiento de practicas...</div>;

  const resumen = datos?.resumen || { total: 0, al_corriente: 0, con_observaciones: 0, requiere_seguimiento: 0, listos_liberacion: 0 };

  return (
    <div className="space-y-6">
      <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#0d2b5e]">Seguimiento de Practicas</h1>
          <p className="text-gray-500 text-sm mt-1">Revision del avance de alumnos con empresa aprobada desde el padron empresarial.</p>
        </div>
        <button onClick={cargarSeguimiento} className="bg-[#1565c0] text-white rounded-xl px-4 py-2 text-sm font-semibold flex items-center gap-2 w-fit">
          <RefreshCw className="w-4 h-4" />Actualizar
        </button>
      </div>

      {error ? <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl p-4 text-sm">{error}</div> : null}
      {mensaje ? <div className="bg-green-50 border border-green-200 text-green-700 rounded-xl p-4 text-sm">{mensaje}</div> : null}

      <div className="grid grid-cols-2 xl:grid-cols-5 gap-3">
        <ResumenCard label="Asignados" value={resumen.total} icon={<Users className="w-4 h-4" />} />
        <ResumenCard label="Al corriente" value={resumen.al_corriente} icon={<CheckCircle2 className="w-4 h-4" />} />
        <ResumenCard label="Observaciones" value={resumen.con_observaciones} icon={<MessageSquare className="w-4 h-4" />} />
        <ResumenCard label="Seguimiento" value={resumen.requiere_seguimiento} icon={<AlertTriangle className="w-4 h-4" />} />
        <ResumenCard label="Liberacion" value={resumen.listos_liberacion} icon={<FileText className="w-4 h-4" />} />
      </div>

      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5">
        <div className="grid md:grid-cols-4 gap-4">
          <select className="border rounded-xl px-3 py-2 text-sm bg-white"><option>Convocatoria actual</option></select>
          <select value={estado} onChange={(e) => setEstado(e.target.value)} className="border rounded-xl px-3 py-2 text-sm bg-white"><option>Todos</option>{(datos?.filtros.estados || []).map((item) => <option key={item}>{item}</option>)}</select>
          <select value={empresa} onChange={(e) => setEmpresa(e.target.value)} className="border rounded-xl px-3 py-2 text-sm bg-white"><option>Todas</option>{(datos?.filtros.empresas || []).map((item) => <option key={item}>{item}</option>)}</select>
          <div className="border rounded-xl px-3 py-2 flex items-center gap-2"><Search className="w-4 h-4 text-gray-400" /><input value={busqueda} onChange={(e) => setBusqueda(e.target.value)} className="outline-none text-sm w-full" placeholder="Buscar alumno..." /></div>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          {alumnosFiltrados.length === 0 ? <Vacio /> : alumnosFiltrados.map((alumno) => (
            <div key={`${alumno.id_alumno}-${alumno.id_preferencia}`} className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5">
              <div className="flex flex-col xl:flex-row xl:items-start xl:justify-between gap-4">
                <div>
                  <h3 className="font-bold text-[#0d2b5e]">{alumno.alumno}</h3>
                  <p className="text-sm text-gray-500 mt-1">{alumno.carrera || "Carrera no registrada"} - {alumno.empresa}</p>
                  <p className="text-xs text-gray-400 mt-1">Matricula: {alumno.matricula || "Sin matricula"} - {alumno.vacante || "Vacante de practicas"}</p>
                </div>
                <span className={`px-3 py-1 rounded-full text-xs font-semibold w-fit ${estadoColor[alumno.estado]}`}>{alumno.estado}</span>
              </div>

              <div className="grid md:grid-cols-3 gap-4 mt-5">
                <InfoBox icon={<Clock className="w-4 h-4" />} label="Horas lleva / deberia" value={`${alumno.horas_registradas}/${alumno.horas_deberia_llevar}`} />
                <InfoBox icon={<FileText className="w-4 h-4" />} label="Reportes entregados" value={`${alumno.reportes_entregados}/${alumno.reportes_requeridos}`} />
                <div className="border rounded-xl p-4"><div className="text-gray-500 text-xs">Avance general</div><div className="mt-3 bg-gray-200 rounded-full h-2"><div className="bg-[#1565c0] h-2 rounded-full" style={{ width: `${alumno.avance}%` }} /></div><p className="text-xs text-gray-500 mt-2">{alumno.avance}% completado</p></div>
              </div>

              <div className="flex flex-wrap gap-2 mt-5">
                <button onClick={() => setExpediente(alumno)} className="border border-blue-200 text-[#1565c0] rounded-xl px-4 py-2 text-xs font-semibold flex items-center gap-2"><Eye className="w-4 h-4" />Ver expediente</button>
                <button onClick={() => abrirObservacion(alumno)} className="border border-orange-200 text-orange-600 rounded-xl px-4 py-2 text-xs font-semibold flex items-center gap-2"><MessageSquare className="w-4 h-4" />Registrar observacion</button>
                {alumno.estado === "Listo para liberacion" && <button className="bg-green-600 text-white rounded-xl px-4 py-2 text-xs font-semibold flex items-center gap-2"><CheckCircle2 className="w-4 h-4" />Enviar a liberacion</button>}
              </div>
            </div>
          ))}
        </div>

        <div className="space-y-6">
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
            <h3 className="font-bold text-[#0d2b5e] mb-5">Pendientes de atencion</h3>
            <div className="space-y-4">{(datos?.pendientes || []).length === 0 ? <div className="border border-green-200 bg-green-50 rounded-xl p-4 flex gap-3"><CheckCircle2 className="w-5 h-5 text-green-600 mt-0.5" /><p className="text-sm text-green-700">No hay pendientes de seguimiento.</p></div> : datos?.pendientes.map((item) => <div key={item} className="border border-orange-200 bg-orange-50 rounded-xl p-4 flex gap-3"><AlertTriangle className="w-5 h-5 text-orange-600 mt-0.5" /><p className="text-sm text-orange-700">{item}</p></div>)}</div>
          </div>
        </div>
      </div>

      {expediente && <ExpedienteModal alumno={expediente} onClose={() => setExpediente(null)} />}
      {observacionAlumno && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-xl w-full p-6">
            <div className="flex items-start justify-between gap-4 border-b pb-4"><div><h2 className="text-xl font-bold text-[#0d2b5e]">Registrar observacion</h2><p className="text-sm text-gray-500 mt-1">Se enviara como notificacion a {observacionAlumno.alumno}.</p></div><button onClick={() => setObservacionAlumno(null)} className="text-gray-400 hover:text-gray-600"><X className="w-5 h-5" /></button></div>
            <div className="space-y-4 mt-5">
              <div><label className="text-sm font-semibold text-gray-700">Tipo</label><select value={tipoObservacion} onChange={(e) => setTipoObservacion(e.target.value)} className="mt-2 w-full border rounded-xl px-3 py-2 text-sm bg-white"><option>Horas faltantes</option><option>Reporte pendiente</option><option>Seguimiento general</option><option>Correccion requerida</option></select></div>
              <div><label className="text-sm font-semibold text-gray-700">Mensaje para el alumno</label><textarea value={textoObservacion} onChange={(e) => setTextoObservacion(e.target.value)} rows={5} className="mt-2 w-full border rounded-xl px-3 py-2 text-sm resize-none outline-none focus:border-[#1565c0]" /></div>
              <button onClick={enviarObservacion} disabled={enviando || !textoObservacion.trim()} className="w-full bg-[#1565c0] text-white rounded-xl py-2 text-sm font-semibold flex items-center justify-center gap-2 disabled:opacity-50"><Send className="w-4 h-4" />{enviando ? "Enviando..." : "Enviar notificacion"}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function ExpedienteModal({ alumno, onClose }: { alumno: SeguimientoAlumno; onClose: () => void }) {
  return <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4"><div className="bg-white rounded-2xl max-w-4xl w-full p-6 max-h-[90vh] overflow-y-auto"><div className="flex items-start justify-between gap-4 border-b pb-4"><div><h2 className="text-xl font-bold text-[#0d2b5e]">Expediente de seguimiento</h2><p className="text-sm text-gray-500 mt-1">{alumno.alumno} - {alumno.matricula || "Sin matricula"}</p></div><button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X className="w-5 h-5" /></button></div><div className="grid md:grid-cols-3 gap-4 mt-5"><InfoBox icon={<UserRound className="w-4 h-4" />} label="Alumno" value={alumno.alumno} /><InfoBox icon={<FileText className="w-4 h-4" />} label="Carrera" value={alumno.carrera || "Sin carrera"} /><InfoBox icon={<Bell className="w-4 h-4" />} label="Estado" value={alumno.estado} /><InfoBox icon={<CalendarDays className="w-4 h-4" />} label="Inicio" value={formatoFecha(alumno.fecha_inicio)} /><InfoBox icon={<CalendarDays className="w-4 h-4" />} label="Fin estimado" value={formatoFecha(alumno.fecha_fin)} /><InfoBox icon={<Clock className="w-4 h-4" />} label="Dias transcurridos" value={`${alumno.dias_transcurridos}/${alumno.dias_totales}`} /><InfoBox icon={<Clock className="w-4 h-4" />} label="Horas registradas" value={`${alumno.horas_registradas}/${alumno.horas_requeridas}`} /><InfoBox icon={<AlertTriangle className="w-4 h-4" />} label="Horas deberia llevar" value={`${alumno.horas_deberia_llevar}`} /><InfoBox icon={<FileText className="w-4 h-4" />} label="Reportes" value={`${alumno.reportes_entregados}/${alumno.reportes_requeridos}`} /></div><div className="mt-6 border rounded-2xl p-5"><div className="flex items-center justify-between text-sm"><span className="font-semibold text-[#0d2b5e]">Progreso general</span><span className="text-gray-500">{alumno.avance}%</span></div><div className="mt-3 bg-gray-200 rounded-full h-3"><div className="bg-[#1565c0] h-3 rounded-full" style={{ width: `${alumno.avance}%` }} /></div><p className="text-sm text-gray-500 mt-3">Empresa: {alumno.empresa}. Vacante: {alumno.vacante || "Practicas profesionales"}. Modalidad: {alumno.modalidad || "No registrada"}.</p></div></div></div>;
}

function ResumenCard({ label, value, icon }: { label: string; value: number; icon: ReactNode }) {
  return <div className="bg-white rounded-xl border border-gray-200 px-4 py-3 flex items-center gap-3"><div className="w-8 h-8 bg-blue-50 rounded-lg flex items-center justify-center text-[#1565c0]">{icon}</div><div><div className="text-lg font-bold text-[#0d2b5e]">{value}</div><div className="text-xs text-gray-500">{label}</div></div></div>;
}

function InfoBox({ icon, label, value }: { icon: ReactNode; label: string; value: string }) {
  return <div className="border rounded-xl p-4"><div className="flex items-center gap-2 text-gray-500 text-xs">{icon}{label}</div><p className="font-bold text-[#0d2b5e] mt-2">{value}</p></div>;
}

function Vacio() {
  return <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-10 text-center"><div className="mx-auto w-14 h-14 rounded-2xl bg-blue-50 text-[#1565c0] flex items-center justify-center mb-4"><FileText className="w-7 h-7" /></div><h3 className="font-bold text-[#0d2b5e]">Sin alumnos en seguimiento</h3><p className="text-sm text-gray-500 mt-2">Cuando apruebes una empresa en Asignaciones, el alumno aparecera aqui.</p></div>;
}