import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import {
  Award,
  Bell,
  Building2,
  ChevronRight,
  ClipboardList,
  Clock,
  FileCheck,
  Users,
  CheckCircle,
} from "lucide-react";
import { Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";

import { apiClient } from "../../../infrastructure/api/apiClient";

type DashboardData = {
  metricas: {
    total_alumnos: number;
    alumnos_en_revision: number;
    docs_revisados: number;
    empresas_disponibles: number;
    expedientes_aprobados: number;
  };
  estado_documentos: { name: string; value: number; color: string }[];
  expedientes_por_revisar: {
    id_alumno: number;
    nombre: string;
    matricula: string;
    carrera?: string | null;
    estado_expediente?: string | null;
    revision: number;
    observados: number;
  }[];
};

export function CoordinadorDashboard() {
  const navigate = useNavigate();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const cargar = async () => {
      try {
        setLoading(true);
        setError("");
        const response = await apiClient.get<DashboardData>("/coordinador/documentos/dashboard");
        setData(response.data);
      } catch (err) {
        console.error(err);
        setError("No se pudo cargar el dashboard del coordinador.");
      } finally {
        setLoading(false);
      }
    };

    cargar();
  }, []);

  const metricas = data?.metricas ?? {
    total_alumnos: 0,
    alumnos_en_revision: 0,
    docs_revisados: 0,
    empresas_disponibles: 0,
    expedientes_aprobados: 0,
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[#0d2b5e]">Dashboard - Coordinador de Practicas</h1>
        <p className="text-gray-500 text-sm mt-1">Datos reales de expedientes, alumnos y documentos registrados.</p>
      </div>

      {error ? <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl p-4 text-sm">{error}</div> : null}
      {loading ? <div className="text-sm text-gray-500">Cargando indicadores...</div> : null}

      <div className="grid grid-cols-2 xl:grid-cols-4 gap-5">
        {[
          { l: "Alumnos registrados", v: metricas.total_alumnos, I: Users, c: "bg-blue-50 text-blue-600", t: "Desde base de datos" },
          { l: "Alumnos en revision", v: metricas.alumnos_en_revision, I: Clock, c: "bg-orange-50 text-orange-600", t: "Con documentos pendientes" },
          { l: "Docs revisados", v: metricas.docs_revisados, I: FileCheck, c: "bg-indigo-50 text-indigo-600", t: "Aprobados u observados" },
          { l: "Expedientes aprobados", v: metricas.expedientes_aprobados, I: CheckCircle, c: "bg-green-50 text-green-600", t: "7 docs iniciales aprobados" },
        ].map((w) => (
          <div key={w.l} className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5">
            <div className={`w-10 h-10 ${w.c} rounded-xl flex items-center justify-center mb-3`}><w.I className="w-5 h-5" /></div>
            <div className="text-2xl font-bold text-[#0d2b5e]">{w.v}</div>
            <div className="text-gray-600 text-sm mt-0.5">{w.l}</div>
            <div className="text-xs text-gray-400 mt-1">{w.t}</div>
          </div>
        ))}
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
          <h3 className="font-bold text-[#0d2b5e] mb-4">Estado de documentos</h3>
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie data={data?.estado_documentos ?? []} cx="50%" cy="50%" outerRadius={80} dataKey="value">
                {(data?.estado_documentos ?? []).map((entry) => <Cell key={entry.name} fill={entry.color} />)}
              </Pie>
              <Tooltip contentStyle={{ borderRadius: "12px", border: "1px solid #e5e7eb" }} />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-[#0d2b5e]">Expedientes por revisar</h3>
            <button onClick={() => navigate("/coordinador/alumnos")} className="text-xs text-[#1565c0] hover:underline">Ver todos</button>
          </div>
          <div className="space-y-3">
            {(data?.expedientes_por_revisar ?? []).map((alumno) => (
              <button key={alumno.id_alumno} className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 text-left" onClick={() => navigate("/coordinador/documentos")}>
                <div className="w-9 h-9 bg-[#e3f0ff] rounded-xl flex items-center justify-center font-bold text-[#1565c0] text-sm">{alumno.nombre.charAt(0)}</div>
                <div className="flex-1">
                  <div className="text-sm font-semibold text-gray-800">{alumno.nombre}</div>
                  <div className="text-xs text-gray-400">{alumno.matricula} - {alumno.carrera ?? "Carrera no registrada"}</div>
                </div>
                <span className="text-xs px-2.5 py-1 rounded-full font-semibold bg-yellow-100 text-yellow-700">{alumno.revision} en revision</span>
                <ChevronRight className="w-4 h-4 text-gray-400" />
              </button>
            ))}
            {!data?.expedientes_por_revisar.length && <div className="text-sm text-gray-400">No hay expedientes pendientes.</div>}
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
        <h3 className="font-bold text-[#0d2b5e] mb-5">Accesos rapidos del proceso</h3>
        <div className="grid md:grid-cols-3 xl:grid-cols-6 gap-4">
          {[
            { title: "Alumnos", subtitle: "Gestion y estados", icon: Users, path: "/coordinador/alumnos", style: "bg-[#0d2b5e] text-white" },
            { title: "Documentos", subtitle: "Validacion inicial", icon: FileCheck, path: "/coordinador/documentos", style: "bg-white text-[#0d2b5e] border-2 border-[#0d2b5e]" },
            { title: "Asignaciones", subtitle: "Padron y empresas", icon: ClipboardList, path: "/coordinador/asignaciones", style: "bg-blue-50 text-[#1565c0] border border-blue-200" },
            { title: "Seguimiento", subtitle: "Avance de practicas", icon: Clock, path: "/coordinador/seguimiento", style: "bg-purple-50 text-purple-700 border border-purple-200" },
            { title: "Liberacion", subtitle: "Cierre de expediente", icon: Award, path: "/coordinador/liberacion", style: "bg-green-50 text-green-700 border border-green-200" },
            { title: "Notificaciones", subtitle: "Pendientes criticos", icon: Bell, path: "/coordinador/notificaciones", style: "bg-orange-50 text-orange-700 border border-orange-200" },
          ].map((item) => (
            <button key={item.title} onClick={() => navigate(item.path)} className={`${item.style} rounded-2xl p-5 flex flex-col items-start gap-3 hover:shadow-md transition-all text-left`}>
              <item.icon className="w-6 h-6" />
              <div><div className="font-bold">{item.title}</div><div className="text-xs opacity-70 mt-0.5">{item.subtitle}</div></div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}