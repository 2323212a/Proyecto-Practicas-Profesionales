import { useMemo, useState } from "react";
import {
  Users,
  Search,
  Eye,
  MessageSquare,
  FileText,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Send,
  X,
  Filter,
  RotateCcw,
  Building2,
  GraduationCap,
} from "lucide-react";

const alumnos = [
  {
    nombre: "Brayan Madain Hernandez",
    carrera: "Desarrollo y Tec. Software",
    empresa: "TechSoft Chiapas",
    horasActuales: 320,
    horasMeta: 480,
    reportesEntregados: 3,
    reportesMeta: 5,
    estado: "En seguimiento",
    ultimoReporte: "Reporte parcial 3",
  },
  {
    nombre: "Laura Martínez Cruz",
    carrera: "Sistemas Computacionales",
    empresa: "Chiapas Digital",
    horasActuales: 180,
    horasMeta: 480,
    reportesEntregados: 2,
    reportesMeta: 5,
    estado: "Con observaciones",
    ultimoReporte: "Reporte parcial 2",
  },
  {
    nombre: "Miguel Torres Flores",
    carrera: "IA y Ciencia de Datos",
    empresa: "DataLab MX",
    horasActuales: 480,
    horasMeta: 480,
    reportesEntregados: 5,
    reportesMeta: 5,
    estado: "Listo para cierre",
    ultimoReporte: "Reporte final",
  },
  {
    nombre: "Javier Molina",
    carrera: "Desarrollo y Tec. Software",
    empresa: "TechSoft Chiapas",
    horasActuales: 100,
    horasMeta: 480,
    reportesEntregados: 2,
    reportesMeta: 5,
    estado: "En seguimiento",
    ultimoReporte: "Reporte parcial 2",
  },
];

const estadoColor: Record<string, string> = {
  "En seguimiento": "bg-blue-100 text-blue-700",
  "Con observaciones": "bg-orange-100 text-orange-700",
  "Listo para cierre": "bg-green-100 text-green-700",
};

export function AlumnosAsignados() {
  const [busqueda, setBusqueda] = useState("");
  const [estado, setEstado] = useState("Todos");
  const [empresa, setEmpresa] = useState("Todas");
  const [observacionAbierta, setObservacionAbierta] = useState<string | null>(null);
  const [tipoObservacion, setTipoObservacion] = useState<Record<string, string>>({});
  const [textoObservacion, setTextoObservacion] = useState<Record<string, string>>({});
  const [asuntoOtro, setAsuntoOtro] = useState<Record<string, string>>({});

  const empresas = [...new Set(alumnos.map((a) => a.empresa))];

  const filtrados = useMemo(() => {
    return alumnos.filter((a) => {
      const q = busqueda.toLowerCase();

      const coincideBusqueda =
        a.nombre.toLowerCase().includes(q) ||
        a.carrera.toLowerCase().includes(q) ||
        a.empresa.toLowerCase().includes(q);

      const coincideEstado = estado === "Todos" || a.estado === estado;
      const coincideEmpresa = empresa === "Todas" || a.empresa === empresa;

      return coincideBusqueda && coincideEstado && coincideEmpresa;
    });
  }, [busqueda, estado, empresa]);

  const resumen = {
    total: alumnos.length,
    pendientes: alumnos.filter((a) => a.reportesEntregados < a.reportesMeta).length,
    observaciones: alumnos.filter((a) => a.estado === "Con observaciones").length,
    cierre: alumnos.filter((a) => a.estado === "Listo para cierre").length,
  };

  const limpiarFiltros = () => {
    setBusqueda("");
    setEstado("Todos");
    setEmpresa("Todas");
  };

  const progreso = (actual: number, meta: number) =>
    Math.min(Math.round((actual / meta) * 100), 100);

  const enviarObservacion = (nombre: string) => {
    alert(`Observación registrada para ${nombre}`);
    setObservacionAbierta(null);
    setTipoObservacion((p) => ({ ...p, [nombre]: "" }));
    setTextoObservacion((p) => ({ ...p, [nombre]: "" }));
    setAsuntoOtro((p) => ({ ...p, [nombre]: "" }));
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[#0d2b5e]">
          Alumnos Asignados
        </h1>
        <p className="text-gray-500 text-sm mt-1">
          Seguimiento académico de alumnos asignados al docente asesor.
        </p>
      </div>

      <div className="grid grid-cols-2 xl:grid-cols-4 gap-3">
        {[
          ["Total asignados", resumen.total, Users],
          ["Reportes pendientes", resumen.pendientes, FileText],
          ["Con observaciones", resumen.observaciones, AlertTriangle],
          ["Listos para cierre", resumen.cierre, CheckCircle2],
        ].map(([titulo, valor, Icon]: any) => (
          <div
            key={titulo}
            className="bg-white rounded-xl border border-gray-200 px-4 py-3 flex items-center gap-3"
          >
            <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center text-gray-500">
              <Icon className="w-4 h-4" />
            </div>
            <div>
              <div className="text-lg font-bold text-[#0d2b5e]">{valor}</div>
              <div className="text-xs text-gray-500">{titulo}</div>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-[#1565c0]" />
            <h3 className="font-bold text-[#0d2b5e] text-sm">
              Filtros de seguimiento
            </h3>
          </div>

          <button
            onClick={limpiarFiltros}
            className="flex items-center gap-1 text-xs text-gray-500 hover:text-[#1565c0]"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Limpiar filtros
          </button>
        </div>

        <div className="grid md:grid-cols-3 gap-4">
          <div className="border rounded-xl px-3 py-2 flex items-center gap-2">
            <Search className="w-4 h-4 text-gray-400" />
            <input
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              className="outline-none text-sm w-full"
              placeholder="Buscar alumno, carrera o empresa..."
            />
          </div>

          <select
            value={estado}
            onChange={(e) => setEstado(e.target.value)}
            className="border rounded-xl px-3 py-2 text-sm bg-white"
          >
            <option>Todos</option>
            <option>En seguimiento</option>
            <option>Con observaciones</option>
            <option>Listo para cierre</option>
          </select>

          <select
            value={empresa}
            onChange={(e) => setEmpresa(e.target.value)}
            className="border rounded-xl px-3 py-2 text-sm bg-white"
          >
            <option>Todas</option>
            {empresas.map((e) => (
              <option key={e}>{e}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="space-y-4">
        {filtrados.map((a) => {
          const avanceHoras = progreso(a.horasActuales, a.horasMeta);
          const avanceReportes = progreso(a.reportesEntregados, a.reportesMeta);
          const alertaHoras = avanceHoras < 50 && a.estado !== "Listo para cierre";

          return (
            <div
              key={a.nombre}
              className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5"
            >
              <div className="flex flex-col xl:flex-row xl:items-start xl:justify-between gap-4">
                <div>
                  <h3 className="font-bold text-[#0d2b5e]">{a.nombre}</h3>

                  <div className="flex flex-wrap gap-3 text-sm text-gray-500 mt-1">
                    <span className="flex items-center gap-1">
                      <GraduationCap className="w-4 h-4" />
                      {a.carrera}
                    </span>

                    <span className="flex items-center gap-1">
                      <Building2 className="w-4 h-4" />
                      {a.empresa}
                    </span>
                  </div>
                </div>

                <span
                  className={`px-3 py-1 rounded-full text-xs font-semibold w-fit ${
                    estadoColor[a.estado]
                  }`}
                >
                  {a.estado}
                </span>
              </div>

              {alertaHoras && (
                <div className="mt-4 bg-orange-50 border border-orange-200 rounded-xl p-3 flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 text-orange-600 mt-0.5" />
                  <p className="text-xs text-orange-700">
                    El alumno presenta bajo avance de horas. Se recomienda registrar observación o revisar su situación.
                  </p>
                </div>
              )}

              <div className="grid md:grid-cols-3 gap-4 mt-5">
                <div className="border rounded-xl p-4">
                  <div className="flex items-center gap-2 text-xs text-gray-500">
                    <Clock className="w-4 h-4" />
                    Horas registradas
                  </div>

                  <p className="font-bold text-[#0d2b5e] mt-2">
                    {a.horasActuales}/{a.horasMeta}
                  </p>

                  <div className="mt-2 h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className="h-2 bg-[#1565c0] rounded-full"
                      style={{ width: `${avanceHoras}%` }}
                    />
                  </div>
                </div>

                <div className="border rounded-xl p-4">
                  <div className="flex items-center gap-2 text-xs text-gray-500">
                    <FileText className="w-4 h-4" />
                    Reportes entregados
                  </div>

                  <p className="font-bold text-[#0d2b5e] mt-2">
                    {a.reportesEntregados}/{a.reportesMeta}
                  </p>

                  <div className="mt-2 h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className="h-2 bg-green-500 rounded-full"
                      style={{ width: `${avanceReportes}%` }}
                    />
                  </div>
                </div>

                <div className="border rounded-xl p-4">
                  <div className="flex items-center gap-2 text-xs text-gray-500">
                    <MessageSquare className="w-4 h-4" />
                    Último reporte
                  </div>
                  <p className="font-bold text-[#0d2b5e] mt-2">
                    {a.ultimoReporte}
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap gap-2 mt-5">
                <button className="border border-blue-200 text-[#1565c0] rounded-xl px-4 py-2 text-xs font-semibold flex items-center gap-2">
                  <Eye className="w-4 h-4" />
                  Ver expediente
                </button>

                <button className="border border-purple-200 text-purple-600 rounded-xl px-4 py-2 text-xs font-semibold flex items-center gap-2">
                  <FileText className="w-4 h-4" />
                  Revisar reportes
                </button>

                <button
                  onClick={() =>
                    setObservacionAbierta(
                      observacionAbierta === a.nombre ? null : a.nombre
                    )
                  }
                  className="border border-orange-200 text-orange-600 rounded-xl px-4 py-2 text-xs font-semibold flex items-center gap-2"
                >
                  <MessageSquare className="w-4 h-4" />
                  Registrar observación
                </button>
              </div>

              {observacionAbierta === a.nombre && (
                <div className="mt-5 bg-orange-50 border border-orange-200 rounded-2xl p-5">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="font-bold text-[#0d2b5e]">
                      Registrar observación para {a.nombre}
                    </h4>

                    <button
                      onClick={() => setObservacionAbierta(null)}
                      className="text-gray-400 hover:text-gray-600"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>

                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-semibold text-gray-600">
                        Tipo de observación
                      </label>

                      <select
                        value={tipoObservacion[a.nombre] || ""}
                        onChange={(e) =>
                          setTipoObservacion({
                            ...tipoObservacion,
                            [a.nombre]: e.target.value,
                          })
                        }
                        className="mt-2 w-full border border-gray-300 rounded-xl px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-orange-300 bg-white"
                      >
                        <option value="">Selecciona una opción</option>
                        <option value="Pocas horas">Pocas horas registradas</option>
                        <option value="Falta de reporte">Falta de reporte</option>
                        <option value="Reporte con correcciones">
                          Reporte con correcciones
                        </option>
                        <option value="Incidencia académica">
                          Incidencia académica
                        </option>
                        <option value="Otro">Otro</option>
                      </select>
                    </div>

                    {tipoObservacion[a.nombre] === "Otro" && (
                      <div>
                        <label className="text-sm font-semibold text-gray-600">
                          Asunto
                        </label>

                        <input
                          type="text"
                          value={asuntoOtro[a.nombre] || ""}
                          onChange={(e) =>
                            setAsuntoOtro({
                              ...asuntoOtro,
                              [a.nombre]: e.target.value,
                            })
                          }
                          placeholder="Asunto de la observación..."
                          className="mt-2 w-full border border-gray-300 rounded-xl px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-orange-300"
                        />
                      </div>
                    )}
                  </div>

                  <div className="mt-4">
                    <label className="text-sm font-semibold text-gray-600">
                      Comentario
                    </label>

                    <textarea
                      value={textoObservacion[a.nombre] || ""}
                      onChange={(e) =>
                        setTextoObservacion({
                          ...textoObservacion,
                          [a.nombre]: e.target.value,
                        })
                      }
                      rows={4}
                      placeholder="Describe la observación académica o seguimiento requerido..."
                      className="mt-2 w-full border border-gray-300 rounded-xl px-3 py-2 text-sm outline-none resize-none focus:ring-2 focus:ring-orange-300"
                    />
                  </div>

                  <div className="flex flex-wrap gap-2 justify-end mt-4">
                    <button
                      onClick={() => setObservacionAbierta(null)}
                      className="border border-gray-300 text-gray-600 rounded-xl px-4 py-2 text-xs font-semibold"
                    >
                      Cancelar
                    </button>

                    <button
                      onClick={() => enviarObservacion(a.nombre)}
                      disabled={
                        !tipoObservacion[a.nombre] ||
                        !textoObservacion[a.nombre]?.trim()
                      }
                      className="bg-orange-600 text-white rounded-xl px-4 py-2 text-xs font-semibold flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <Send className="w-4 h-4" />
                      Enviar observación
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        })}

        {filtrados.length === 0 && (
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-10 text-center text-gray-400">
            No se encontraron alumnos con los filtros seleccionados.
          </div>
        )}
      </div>
    </div>
  );
}