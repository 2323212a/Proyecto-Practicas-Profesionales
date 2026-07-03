import { useEffect, useMemo, useState, type ReactNode } from "react";
import {
  AlertTriangle,
  Briefcase,
  Building2,
  CheckCircle2,
  ClipboardList,
  RefreshCw,
  Search,
  Star,
  Users,
  XCircle,
} from "lucide-react";

import { apiClient } from "../../../infrastructure/api/apiClient";

type Preferencia = {
  id_preferencia: number;
  id_alumno: number;
  alumno: string;
  matricula?: string | null;
  carrera?: string | null;
  id_empresa: number;
  empresa?: string | null;
  titulo?: string | null;
  orden_preferencia: number;
  prioritaria: boolean;
  estado_preferencia: "Pendiente" | "Aprobada" | "Rechazada" | "Cancelada";
  cupo_disponible: number;
  cupo_total: number;
  fecha_registro?: string | null;
};

type GrupoAlumno = {
  id_alumno: number;
  alumno: string;
  matricula?: string | null;
  carrera?: string | null;
  fecha_registro?: string | null;
  preferencias: Preferencia[];
};

export function CoordinadorAsignaciones() {
  const [preferencias, setPreferencias] = useState<Preferencia[]>([]);
  const [busqueda, setBusqueda] = useState("");
  const [loading, setLoading] = useState(true);
  const [procesando, setProcesando] = useState<number | null>(null);
  const [error, setError] = useState("");
  const [mensaje, setMensaje] = useState("");

  useEffect(() => {
    cargarPreferencias();
  }, []);

  const cargarPreferencias = async () => {
    try {
      setLoading(true);
      setError("");
      const response = await apiClient.get<Preferencia[]>("/coordinador/asignaciones/preferencias");
      setPreferencias(response.data || []);
    } catch (err: any) {
      console.error(err);
      setError(err.response?.data?.detail || "No se pudieron cargar las preferencias de empresa.");
    } finally {
      setLoading(false);
    }
  };

  const validarPreferencia = async (idPreferencia: number, estado: "Aprobada" | "Rechazada") => {
    try {
      setProcesando(idPreferencia);
      setError("");
      setMensaje("");
      await apiClient.patch(`/coordinador/asignaciones/preferencias/${idPreferencia}`, { estado });
      setMensaje(estado === "Aprobada" ? "Asignacion aprobada correctamente." : "Preferencia rechazada y cupo liberado.");
      await cargarPreferencias();
    } catch (err: any) {
      console.error(err);
      setError(err.response?.data?.detail || "No se pudo actualizar la preferencia.");
    } finally {
      setProcesando(null);
    }
  };

  const grupos = useMemo(() => {
    const mapa = new Map<number, GrupoAlumno>();
    preferencias.forEach((pref) => {
      const actual = mapa.get(pref.id_alumno);
      if (actual) {
        actual.preferencias.push(pref);
        return;
      }
      mapa.set(pref.id_alumno, {
        id_alumno: pref.id_alumno,
        alumno: pref.alumno,
        matricula: pref.matricula,
        carrera: pref.carrera,
        fecha_registro: pref.fecha_registro,
        preferencias: [pref],
      });
    });
    return Array.from(mapa.values()).map((grupo) => ({
      ...grupo,
      preferencias: grupo.preferencias.sort((a, b) => a.orden_preferencia - b.orden_preferencia),
    }));
  }, [preferencias]);

  const gruposFiltrados = useMemo(() => {
    const texto = busqueda.trim().toLowerCase();
    if (!texto) return grupos;
    return grupos.filter((grupo) =>
      [grupo.alumno, grupo.matricula || "", grupo.carrera || "", ...grupo.preferencias.map((p) => p.empresa || "")].some((value) =>
        value.toLowerCase().includes(texto),
      ),
    );
  }, [busqueda, grupos]);

  const totalAlumnos = grupos.length;
  const totalPrioritarias = preferencias.filter((pref) => pref.prioritaria).length;
  const totalOpciones = preferencias.length;
  const vacantesReservadas = preferencias.length;

  if (loading) {
    return <div className="text-sm text-gray-500">Cargando asignaciones pendientes...</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[#0d2b5e]">Asignacion de Alumnos</h1>
        <p className="text-gray-500 text-sm mt-1">
          Revisa las preferencias enviadas desde el padron empresarial y valida la empresa asignada.
        </p>
      </div>

      {error ? <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl p-4 text-sm">{error}</div> : null}
      {mensaje ? <div className="bg-green-50 border border-green-200 text-green-700 rounded-xl p-4 text-sm">{mensaje}</div> : null}

      <div className="bg-[#0d2b5e] rounded-2xl p-6 text-white">
        <div className="flex flex-col xl:flex-row xl:items-center xl:justify-between gap-5">
          <div>
            <h2 className="text-xl font-bold">Preferencias pendientes</h2>
            <p className="text-blue-200 text-sm mt-1">
              Al aprobar una opcion, las demas preferencias pendientes del alumno se rechazan y liberan sus cupos.
            </p>
          </div>
          <button onClick={cargarPreferencias} className="bg-white/10 hover:bg-white/20 rounded-xl px-4 py-2 text-sm font-semibold flex items-center gap-2 w-fit">
            <RefreshCw className="w-4 h-4" />
            Actualizar
          </button>
        </div>

        <div className="grid md:grid-cols-4 gap-4 mt-6">
          <Metric icon={<Users className="w-5 h-5 text-blue-200" />} label="Alumnos" value={totalAlumnos} />
          <Metric icon={<ClipboardList className="w-5 h-5 text-blue-200" />} label="Opciones enviadas" value={totalOpciones} />
          <Metric icon={<Star className="w-5 h-5 text-blue-200" />} label="Prioritarias" value={totalPrioritarias} />
          <Metric icon={<Briefcase className="w-5 h-5 text-blue-200" />} label="Cupos reservados" value={vacantesReservadas} />
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="border rounded-xl px-3 py-2 flex items-center gap-2 md:w-96">
            <Search className="w-4 h-4 text-gray-400" />
            <input
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              className="outline-none text-sm w-full"
              placeholder="Buscar alumno, matricula o empresa..."
            />
          </div>
          <span className="text-sm text-gray-500">{gruposFiltrados.length} alumnos por revisar</span>
        </div>
      </div>

      {gruposFiltrados.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-10 text-center">
          <div className="mx-auto w-14 h-14 rounded-2xl bg-blue-50 text-[#1565c0] flex items-center justify-center mb-4">
            <CheckCircle2 className="w-7 h-7" />
          </div>
          <h3 className="font-bold text-[#0d2b5e]">No hay preferencias pendientes</h3>
          <p className="text-sm text-gray-500 mt-2">Cuando un alumno guarde sus opciones del padron empresarial apareceran aqui.</p>
        </div>
      ) : (
        <div className="space-y-5">
          {gruposFiltrados.map((grupo) => (
            <div key={grupo.id_alumno} className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
              <div className="bg-blue-50 border-b border-blue-100 p-5 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                <div>
                  <h3 className="font-bold text-[#0d2b5e]">{grupo.alumno}</h3>
                  <p className="text-sm text-gray-500 mt-1">
                    {grupo.matricula || "Sin matricula"} {grupo.carrera ? `- ${grupo.carrera}` : ""}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <span className="bg-white text-[#1565c0] border border-blue-200 px-3 py-1 rounded-full text-xs font-semibold">
                    {grupo.preferencias.length} opciones
                  </span>
                  {grupo.preferencias.some((p) => p.prioritaria) ? (
                    <span className="bg-yellow-100 text-yellow-700 px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1">
                      <Star className="w-3 h-3" /> Prioritaria
                    </span>
                  ) : null}
                </div>
              </div>

              <div className="divide-y divide-gray-100">
                {grupo.preferencias.map((pref) => (
                  <div key={pref.id_preferencia} className="p-5 flex flex-col xl:flex-row xl:items-center gap-5">
                    <div className="w-12 h-12 rounded-2xl bg-blue-50 text-[#1565c0] flex items-center justify-center font-bold flex-shrink-0">
                      {pref.orden_preferencia}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <h4 className="font-bold text-[#0d2b5e]">{pref.empresa || "Empresa"}</h4>
                        {pref.prioritaria ? <span className="bg-yellow-100 text-yellow-700 px-2 py-1 rounded-full text-xs font-semibold">Prioritaria</span> : null}
                      </div>
                      <p className="text-sm text-gray-500 mt-1">{pref.titulo || "Vacante de practicas profesionales"}</p>
                      <div className="flex flex-wrap gap-3 mt-3 text-xs text-gray-500">
                        <span className="flex items-center gap-1"><Building2 className="w-3.5 h-3.5" /> Empresa #{pref.id_empresa}</span>
                        <span className="flex items-center gap-1"><Briefcase className="w-3.5 h-3.5" /> Cupo disponible: {pref.cupo_disponible}/{pref.cupo_total}</span>
                      </div>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-2 xl:w-auto">
                      <button
                        onClick={() => validarPreferencia(pref.id_preferencia, "Aprobada")}
                        disabled={procesando === pref.id_preferencia}
                        className="bg-green-600 hover:bg-green-700 text-white rounded-xl px-4 py-2 text-sm font-semibold flex items-center justify-center gap-2 disabled:opacity-50"
                      >
                        <CheckCircle2 className="w-4 h-4" />
                        Aprobar
                      </button>
                      <button
                        onClick={() => validarPreferencia(pref.id_preferencia, "Rechazada")}
                        disabled={procesando === pref.id_preferencia}
                        className="bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 rounded-xl px-4 py-2 text-sm font-semibold flex items-center justify-center gap-2 disabled:opacity-50"
                      >
                        <XCircle className="w-4 h-4" />
                        Rechazar
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="bg-orange-50 border border-orange-200 rounded-2xl p-5 flex gap-3">
        <AlertTriangle className="w-5 h-5 text-orange-600 flex-shrink-0 mt-0.5" />
        <p className="text-sm text-orange-700">
          Los cupos se reservan desde que el alumno envia sus preferencias. Si rechazas una opcion, ese cupo vuelve a quedar disponible en el padron empresarial.
        </p>
      </div>
    </div>
  );
}

function Metric({ icon, label, value }: { icon: ReactNode; label: string; value: number }) {
  return (
    <div className="bg-white/10 rounded-xl p-4">
      <div className="mb-2">{icon}</div>
      <div className="text-2xl font-bold">{value}</div>
      <div className="text-blue-200 text-sm">{label}</div>
    </div>
  );
}