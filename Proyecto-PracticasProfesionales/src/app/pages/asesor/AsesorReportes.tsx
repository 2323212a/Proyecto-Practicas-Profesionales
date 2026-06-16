import { useMemo, useState } from "react";
import {
  FileText,
  Search,
  Eye,
  CheckCircle2,
  AlertTriangle,
  MessageSquare,
  Clock,
  Filter,
  RotateCcw,
  Send,
  X,
  Building2,
  User,
} from "lucide-react";

const reportes = [
  {
    alumno: "Brayan Madain Hernandez",
    empresa: "TechSoft Chiapas",
    reporte: "Reporte 2",
    periodo: "15 jun - 28 jun",
    estado: "Pendiente de revisión",
    observacion: "Requiere validación del asesor.",
    archivo: "reporte_2_brayan.pdf",
  },
  {
    alumno: "Javier Molina",
    empresa: "TechSoft Chiapas",
    reporte: "Reporte 2",
    periodo: "15 jun - 28 jun",
    estado: "Pendiente de revisión",
    observacion: "Pendiente de revisión por el asesor.",
    archivo: "reporte_2_javier.pdf",
  },
  {
    alumno: "Laura Martínez Cruz",
    empresa: "Chiapas Digital",
    reporte: "Reporte 2",
    periodo: "15 jun - 28 jun",
    estado: "Con observaciones",
    observacion: "Debe corregir descripción de actividades.",
    archivo: "reporte_2_laura.pdf",
  },
  {
    alumno: "Miguel Torres Flores",
    empresa: "DataLab MX",
    reporte: "Reporte Final",
    periodo: "Cierre",
    estado: "Aprobado",
    observacion: "Reporte final validado.",
    archivo: "reporte_final_miguel.pdf",
  },
];

const estadoColor: Record<string, string> = {
  "Pendiente de revisión": "bg-yellow-100 text-yellow-700",
  "Con observaciones": "bg-orange-100 text-orange-700",
  Aprobado: "bg-green-100 text-green-700",
};

export function AsesorReportes() {
  const [busqueda, setBusqueda] = useState("");
  const [estado, setEstado] = useState("Todos");
  const [tipoReporte, setTipoReporte] = useState("Todos");
  const [correccionAbierta, setCorreccionAbierta] = useState<string | null>(null);
  const [motivo, setMotivo] = useState<Record<string, string>>({});
  const [comentario, setComentario] = useState<Record<string, string>>({});

  const filtrados = useMemo(() => {
    return reportes.filter((r) => {
      const q = busqueda.toLowerCase();

      const coincideBusqueda =
        r.alumno.toLowerCase().includes(q) ||
        r.empresa.toLowerCase().includes(q) ||
        r.reporte.toLowerCase().includes(q);

      const coincideEstado = estado === "Todos" || r.estado === estado;
      const coincideTipo = tipoReporte === "Todos" || r.reporte === tipoReporte;

      return coincideBusqueda && coincideEstado && coincideTipo;
    });
  }, [busqueda, estado, tipoReporte]);

  const resumen = {
    pendientes: reportes.filter((r) => r.estado === "Pendiente de revisión").length,
    observaciones: reportes.filter((r) => r.estado === "Con observaciones").length,
    aprobados: reportes.filter((r) => r.estado === "Aprobado").length,
    total: reportes.length,
  };

  const limpiarFiltros = () => {
    setBusqueda("");
    setEstado("Todos");
    setTipoReporte("Todos");
  };

  const enviarCorreccion = (id: string) => {
    alert("Corrección enviada al alumno.");
    setCorreccionAbierta(null);
    setMotivo((p) => ({ ...p, [id]: "" }));
    setComentario((p) => ({ ...p, [id]: "" }));
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[#0d2b5e]">
          Reportes de Alumnos
        </h1>
        <p className="text-gray-500 text-sm mt-1">
          Revisión académica de reportes, bitácoras y evidencias entregadas
          durante las prácticas profesionales.
        </p>
      </div>

      <div className="grid grid-cols-2 xl:grid-cols-4 gap-3">
        {[
          ["Pendientes", resumen.pendientes, Clock],
          ["Con observaciones", resumen.observaciones, AlertTriangle],
          ["Aprobados", resumen.aprobados, CheckCircle2],
          ["Total reportes", resumen.total, FileText],
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
              Filtros de reportes
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
              placeholder="Buscar alumno, empresa o reporte..."
            />
          </div>

          <select
            value={estado}
            onChange={(e) => setEstado(e.target.value)}
            className="border rounded-xl px-3 py-2 text-sm bg-white"
          >
            <option>Todos</option>
            <option>Pendiente de revisión</option>
            <option>Con observaciones</option>
            <option>Aprobado</option>
          </select>

          <select
            value={tipoReporte}
            onChange={(e) => setTipoReporte(e.target.value)}
            className="border rounded-xl px-3 py-2 text-sm bg-white"
          >
            <option>Todos</option>
            <option>Reporte 1</option>
            <option>Reporte 2</option>
            <option>Reporte Final</option>
          </select>
        </div>
      </div>

      <div className="space-y-4">
        {filtrados.map((r) => {
          const id = `${r.alumno}-${r.reporte}`;

          return (
            <div
              key={id}
              className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5"
            >
              <div className="flex flex-col xl:flex-row xl:items-start xl:justify-between gap-4">
                <div>
                  <h3 className="font-bold text-[#0d2b5e]">{r.reporte}</h3>

                  <div className="flex flex-wrap gap-3 text-sm text-gray-500 mt-1">
                    <span className="flex items-center gap-1">
                      <User className="w-4 h-4" />
                      {r.alumno}
                    </span>

                    <span className="flex items-center gap-1">
                      <Building2 className="w-4 h-4" />
                      {r.empresa}
                    </span>
                  </div>

                  <p className="text-xs text-gray-400 mt-1">
                    Periodo: {r.periodo} · Archivo: {r.archivo}
                  </p>
                </div>

                <span
                  className={`px-3 py-1 rounded-full text-xs font-semibold w-fit ${
                    estadoColor[r.estado]
                  }`}
                >
                  {r.estado}
                </span>
              </div>

              <div className="mt-4 bg-gray-50 border border-gray-200 rounded-xl p-4">
                <div className="flex items-start gap-3">
                  <MessageSquare className="w-5 h-5 text-[#1565c0] mt-0.5" />
                  <p className="text-sm text-gray-600">{r.observacion}</p>
                </div>
              </div>

              <div className="flex flex-wrap gap-2 mt-5">
                <button className="border border-blue-200 text-[#1565c0] rounded-xl px-4 py-2 text-xs font-semibold flex items-center gap-2">
                  <Eye className="w-4 h-4" />
                  Ver reporte
                </button>

                {r.estado !== "Aprobado" && (
                  <>
                    <button className="bg-green-600 text-white rounded-xl px-4 py-2 text-xs font-semibold flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4" />
                      Aprobar
                    </button>

                    <button
                      onClick={() =>
                        setCorreccionAbierta(
                          correccionAbierta === id ? null : id
                        )
                      }
                      className="border border-orange-200 text-orange-600 rounded-xl px-4 py-2 text-xs font-semibold flex items-center gap-2"
                    >
                      <AlertTriangle className="w-4 h-4" />
                      Solicitar corrección
                    </button>
                  </>
                )}
              </div>

              {correccionAbierta === id && (
                <div className="mt-5 bg-orange-50 border border-orange-200 rounded-2xl p-5">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="font-bold text-[#0d2b5e]">
                      Solicitar corrección a {r.alumno}
                    </h4>

                    <button
                      onClick={() => setCorreccionAbierta(null)}
                      className="text-gray-400 hover:text-gray-600"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>

                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-semibold text-gray-600">
                        Motivo
                      </label>

                      <select
                        value={motivo[id] || ""}
                        onChange={(e) =>
                          setMotivo({
                            ...motivo,
                            [id]: e.target.value,
                          })
                        }
                        className="mt-2 w-full border border-gray-300 rounded-xl px-3 py-2 text-sm bg-white outline-none focus:ring-2 focus:ring-orange-300"
                      >
                        <option value="">Selecciona una opción</option>
                        <option value="Descripción incompleta">
                          Descripción incompleta
                        </option>
                        <option value="Actividades no claras">
                          Actividades no claras
                        </option>
                        <option value="Faltan evidencias">
                          Faltan evidencias
                        </option>
                        <option value="Periodo incorrecto">
                          Periodo incorrecto
                        </option>
                        <option value="Formato incorrecto">
                          Formato incorrecto
                        </option>
                      </select>
                    </div>
                  </div>

                  <div className="mt-4">
                    <label className="text-sm font-semibold text-gray-600">
                      Observación para el alumno
                    </label>

                    <textarea
                      value={comentario[id] || ""}
                      onChange={(e) =>
                        setComentario({
                          ...comentario,
                          [id]: e.target.value,
                        })
                      }
                      rows={4}
                      placeholder="Indica claramente qué debe corregir el alumno..."
                      className="mt-2 w-full border border-gray-300 rounded-xl px-3 py-2 text-sm outline-none resize-none focus:ring-2 focus:ring-orange-300"
                    />
                  </div>

                  <div className="flex flex-wrap gap-2 justify-end mt-4">
                    <button
                      onClick={() => setCorreccionAbierta(null)}
                      className="border border-gray-300 text-gray-600 rounded-xl px-4 py-2 text-xs font-semibold"
                    >
                      Cancelar
                    </button>

                    <button
                      onClick={() => enviarCorreccion(id)}
                      disabled={!motivo[id] || !comentario[id]?.trim()}
                      className="bg-orange-600 text-white rounded-xl px-4 py-2 text-xs font-semibold flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <Send className="w-4 h-4" />
                      Enviar corrección
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        })}

        {filtrados.length === 0 && (
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-10 text-center text-gray-400">
            No se encontraron reportes con los filtros seleccionados.
          </div>
        )}
      </div>
    </div>
  );
}