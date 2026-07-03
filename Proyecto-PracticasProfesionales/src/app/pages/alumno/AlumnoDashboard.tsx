import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { Clock, FileText, Bell, ChevronRight } from "lucide-react";

export function AlumnoDashboard() {
  const navigate = useNavigate();
  const [data, setData] = useState<any>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    const token =
      localStorage.getItem("token") ||
      localStorage.getItem("access_token");

    if (!token) {
      setError("No hay token. Inicia sesión otra vez.");
      return;
    }

    fetch("http://localhost:8000/alumno/dashboard", {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
      .then(async (res) => {
        const json = await res.json();

        if (!res.ok) {
          console.error("Error del backend:", json);
          throw new Error(json.detail || "Error al cargar dashboard");
        }

        console.log("Dashboard alumno:", json);
        setData(json);
      })
      .catch((err) => {
        console.error(err);
        setError(err.message);
      });
  }, []);

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-xl">
        {error}
      </div>
    );
  }

  if (!data?.alumno) {
    return <p className="text-gray-500">Cargando dashboard...</p>;
  }

  const widgets = [
    {
      l: "Estado General",
      v: data.proceso.estado_general,
      bg: "bg-blue-50",
      tc: "text-blue-600",
      d: "Estado del expediente",
    },
    {
      l: "Horas Acumuladas",
      v: `${data.horas.acumuladas} / ${data.horas.total}`,
      bg: "bg-green-50",
      tc: "text-green-600",
      d: `${data.horas.porcentaje}% completado`,
    },
    {
      l: "Docs Validados",
      v: `${data.documentos.aprobados} / ${data.documentos.total}`,
      bg: "bg-purple-50",
      tc: "text-purple-600",
      d: `${data.documentos.pendientes} pendientes`,
    },
    {
      l: "Pendientes",
      v: data.documentos.pendientes,
      bg: "bg-orange-50",
      tc: "text-orange-600",
      d: "Requieren atención",
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[#0d2b5e]">
          Dashboard del Alumno
        </h1>
        <p className="text-gray-500 text-sm mt-1">
          Bienvenid@, {data.alumno.nombre_completo}
        </p>
      </div>

      <div className="bg-gradient-to-r from-[#0d2b5e] to-[#1565c0] rounded-2xl p-6 text-white flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="text-blue-200 text-sm mb-1">
            Estado de tu proceso
          </div>
          <div className="font-bold text-xl">
            Expediente {data.proceso.estado_general}
          </div>
          <div className="text-blue-200 text-sm mt-1">
            Empresa: {data.proceso.empresa} · Periodo: {data.proceso.periodo}
          </div>
        </div>

        <div className="bg-yellow-400 text-yellow-900 px-4 py-2 rounded-xl font-bold text-sm flex-shrink-0">
          {data.proceso.estado_general}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5">
        {widgets.map((w) => (
          <div
            key={w.l}
            className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5"
          >
            <div
              className={`w-10 h-10 ${w.bg} rounded-xl flex items-center justify-center mb-3`}
            >
              <div
                className={`w-4 h-4 rounded-full ${w.tc.replace(
                  "text-",
                  "bg-"
                )}`}
              />
            </div>
            <div className="text-2xl font-bold text-[#0d2b5e]">
              {w.v}
            </div>
            <div className="text-gray-500 text-sm mt-0.5">
              {w.l}
            </div>
            <div className="text-xs text-gray-400 mt-1">
              {w.d}
            </div>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-[#0d2b5e]">
            Progreso de Horas Practicadas
          </h3>
          <span className="text-sm text-gray-500">
            {data.horas.acumuladas} de {data.horas.total} horas
          </span>
        </div>

        <div className="w-full bg-gray-200 rounded-full h-4 overflow-hidden">
          <div
            className="bg-gradient-to-r from-[#1565c0] to-[#1976d2] h-4 rounded-full"
            style={{ width: `${data.horas.porcentaje}%` }}
          />
        </div>

        <div className="flex justify-between text-xs text-gray-400 mt-2">
          <span>0 hrs</span>
          <span className="text-[#1565c0] font-semibold">
            {data.horas.porcentaje}% completado
          </span>
          <span>{data.horas.total} hrs</span>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
          <h3 className="font-bold text-[#0d2b5e] mb-4">
            Accesos Rápidos
          </h3>

          <div className="space-y-3">
            {[
              {
                l: "Carga de Documentos",
                I: FileText,
                p: "/alumno/documentos",
                s: `${data.documentos.pendientes} pendientes`,
                sc: "bg-orange-100 text-orange-700",
              },
              {
                l: "Notificaciones",
                I: Bell,
                p: "/alumno/notificaciones",
                s: "Ver avisos",
                sc: "bg-red-100 text-red-700",
              },
              {
                l: "Horas Acumuladas",
                I: Clock,
                p: "/alumno/horas",
                s: `${data.horas.acumuladas} hrs`,
                sc: "bg-blue-100 text-blue-700",
              },
            ].map((item) => (
              <button
                key={item.l}
                onClick={() => navigate(item.p)}
                className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 transition-colors group"
              >
                <div className="w-9 h-9 bg-[#e3f0ff] rounded-lg flex items-center justify-center">
                  <item.I className="w-4 h-4 text-[#1565c0]" />
                </div>

                <span className="text-sm font-medium text-gray-700 flex-1 text-left">
                  {item.l}
                </span>

                <span
                  className={`text-xs px-2.5 py-1 rounded-full font-semibold ${item.sc}`}
                >
                  {item.s}
                </span>

                <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-gray-600" />
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}