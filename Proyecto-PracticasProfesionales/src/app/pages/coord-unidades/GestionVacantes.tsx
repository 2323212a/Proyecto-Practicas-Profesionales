import { useMemo, useState } from "react";
import {
  Briefcase,
  Search,
  CheckCircle2,
  AlertTriangle,
  Eye,
  FileText,
  Building2,
  MapPin,
  Users,
  Filter,
  RotateCcw,
  ClipboardList,
  Clock,
  XCircle,
} from "lucide-react";

const solicitudes = [
  {
    empresa: "TechSoft Chiapas",
    area: "Desarrollo Web",
    carrera: "Desarrollo y Tec. Software",
    vacantes: 6,
    modalidad: "Presencial",
    responsable: "Lic. Gabriela Reyes",
    convenio: "Vigente",
    estado: "Aprobada",
    plan: "Validado",
    observacion: "Plan de trabajo completo y acorde a la carrera.",
  },
  {
    empresa: "DataLab MX",
    area: "Análisis de Datos",
    carrera: "IA y Ciencia de Datos",
    vacantes: 4,
    modalidad: "Híbrida",
    responsable: "Mtra. Ana Ruiz",
    convenio: "En actualización",
    estado: "En revisión",
    plan: "En revisión",
    observacion:
      "Revisar actividades propuestas para alumnos de IA y Ciencia de Datos.",
  },
  {
    empresa: "Innovatek",
    area: "Software Empresarial",
    carrera: "Sistemas Computacionales",
    vacantes: 3,
    modalidad: "Presencial",
    responsable: "C.P. Jorge Méndez",
    convenio: "Vence pronto",
    estado: "Corrección",
    plan: "Con observaciones",
    observacion:
      "Falta especificar responsable directo y actividades por semana.",
  },
];

const estadoColor: Record<string, string> = {
  Aprobada: "bg-green-100 text-green-700",
  "En revisión": "bg-yellow-100 text-yellow-700",
  Corrección: "bg-orange-100 text-orange-700",
};

const convenioColor: Record<string, string> = {
  Vigente: "bg-green-100 text-green-700",
  "En actualización": "bg-blue-100 text-blue-700",
  "Vence pronto": "bg-orange-100 text-orange-700",
};

const planColor: Record<string, string> = {
  Validado: "bg-green-100 text-green-700",
  "En revisión": "bg-yellow-100 text-yellow-700",
  "Con observaciones": "bg-orange-100 text-orange-700",
};

export function GestionVacantes() {
  const [busqueda, setBusqueda] = useState("");
  const [modalidad, setModalidad] = useState("Todas");
  const [estado, setEstado] = useState("Todos");
  const [convenio, setConvenio] = useState("Todos");

  const filtradas = useMemo(() => {
    return solicitudes.filter((s) => {
      const coincideBusqueda =
        s.empresa.toLowerCase().includes(busqueda.toLowerCase()) ||
        s.area.toLowerCase().includes(busqueda.toLowerCase()) ||
        s.carrera.toLowerCase().includes(busqueda.toLowerCase());

      const coincideModalidad =
        modalidad === "Todas" || s.modalidad === modalidad;

      const coincideEstado = estado === "Todos" || s.estado === estado;

      const coincideConvenio =
        convenio === "Todos" || s.convenio === convenio;

      return (
        coincideBusqueda &&
        coincideModalidad &&
        coincideEstado &&
        coincideConvenio
      );
    });
  }, [busqueda, modalidad, estado, convenio]);

  const limpiarFiltros = () => {
    setBusqueda("");
    setModalidad("Todas");
    setEstado("Todos");
    setConvenio("Todos");
  };

  const resumen = {
    total: solicitudes.length,
    aprobadas: solicitudes.filter((s) => s.estado === "Aprobada").length,
    revision: solicitudes.filter((s) => s.estado === "En revisión").length,
    correccion: solicitudes.filter((s) => s.estado === "Corrección").length,
  };

  const puedePublicarse = (s: (typeof solicitudes)[number]) =>
    s.estado === "Aprobada" &&
    s.plan === "Validado" &&
    s.convenio === "Vigente";

  return (
    <div className="space-y-6">
      <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#0d2b5e]">
            Revisión de Vacantes
          </h1>
          <p className="text-gray-500 text-sm mt-1">
            Validación de vacantes, plan de trabajo, modalidad, cupo y convenio
            antes de publicar la empresa en el padrón.
          </p>
        </div>

        <button className="bg-[#1565c0] text-white rounded-xl px-4 py-2 text-sm font-semibold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4" />
          Publicar aprobadas
        </button>
      </div>

      <div className="grid grid-cols-2 xl:grid-cols-4 gap-3">
        {[
          ["Solicitudes", resumen.total, ClipboardList],
          ["Aprobadas", resumen.aprobadas, CheckCircle2],
          ["En revisión", resumen.revision, Clock],
          ["Con corrección", resumen.correccion, AlertTriangle],
        ].map(([label, value, Icon]: any) => (
          <div
            key={label}
            className="bg-white rounded-xl border border-gray-200 px-4 py-3 flex items-center gap-3"
          >
            <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center text-gray-500">
              <Icon className="w-4 h-4" />
            </div>
            <div>
              <div className="text-lg font-bold text-[#0d2b5e]">{value}</div>
              <div className="text-xs text-gray-500">{label}</div>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-[#1565c0]" />
            <h3 className="font-bold text-[#0d2b5e] text-sm">
              Filtros de revisión
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

        <div className="grid md:grid-cols-4 gap-4">
          <div className="border rounded-xl px-3 py-2 flex items-center gap-2">
            <Search className="w-4 h-4 text-gray-400" />
            <input
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              className="outline-none text-sm w-full"
              placeholder="Buscar empresa, área o carrera..."
            />
          </div>

          <select
            value={modalidad}
            onChange={(e) => setModalidad(e.target.value)}
            className="border rounded-xl px-3 py-2 text-sm bg-white"
          >
            <option>Todas</option>
            <option>Presencial</option>
            <option>Híbrida</option>
            <option>Remota</option>
          </select>

          <select
            value={estado}
            onChange={(e) => setEstado(e.target.value)}
            className="border rounded-xl px-3 py-2 text-sm bg-white"
          >
            <option>Todos</option>
            <option>Aprobada</option>
            <option>En revisión</option>
            <option>Corrección</option>
          </select>

          <select
            value={convenio}
            onChange={(e) => setConvenio(e.target.value)}
            className="border rounded-xl px-3 py-2 text-sm bg-white"
          >
            <option>Todos</option>
            <option>Vigente</option>
            <option>En actualización</option>
            <option>Vence pronto</option>
          </select>
        </div>
      </div>

      <div className="grid xl:grid-cols-3 gap-5">
        {filtradas.map((s) => {
          const publicable = puedePublicarse(s);

          return (
            <div
              key={s.empresa}
              className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6"
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h3 className="font-bold text-[#0d2b5e]">{s.empresa}</h3>
                  <p className="text-sm text-gray-500 mt-1">{s.area}</p>
                  <p className="text-xs text-gray-400 mt-1">{s.carrera}</p>
                </div>

                <span
                  className={`px-3 py-1 rounded-full text-xs font-semibold ${estadoColor[s.estado]}`}
                >
                  {s.estado}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3 mt-5">
                <div className="border rounded-xl p-3">
                  <div className="flex items-center gap-2 text-xs text-gray-500">
                    <Users className="w-4 h-4" />
                    Vacantes
                  </div>
                  <p className="font-bold text-[#0d2b5e] mt-1">
                    {s.vacantes} espacios
                  </p>
                </div>

                <div className="border rounded-xl p-3">
                  <div className="flex items-center gap-2 text-xs text-gray-500">
                    <MapPin className="w-4 h-4" />
                    Modalidad
                  </div>
                  <p className="font-bold text-[#0d2b5e] mt-1">
                    {s.modalidad}
                  </p>
                </div>
              </div>

              <div className="mt-4 border rounded-xl p-4">
                <div className="flex items-center gap-2 text-xs text-gray-500">
                  <FileText className="w-4 h-4" />
                  Plan de trabajo
                </div>

                <div className="mt-2 flex items-center justify-between gap-3">
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-semibold ${planColor[s.plan]}`}
                  >
                    {s.plan}
                  </span>

                  <button className="text-[#1565c0] text-xs font-semibold flex items-center gap-1">
                    <Eye className="w-3 h-3" />
                    Ver plan
                  </button>
                </div>
              </div>

              <div className="mt-4 border rounded-xl p-4">
                <div className="flex items-center gap-2 text-xs text-gray-500">
                  <Building2 className="w-4 h-4" />
                  Convenio
                </div>

                <span
                  className={`inline-block mt-2 px-3 py-1 rounded-full text-xs font-semibold ${convenioColor[s.convenio]}`}
                >
                  {s.convenio}
                </span>
              </div>

              <div
                className={`mt-4 rounded-xl p-4 border ${
                  publicable
                    ? "bg-green-50 border-green-200"
                    : "bg-orange-50 border-orange-200"
                }`}
              >
                <p
                  className={`text-xs font-semibold mb-1 ${
                    publicable ? "text-green-700" : "text-orange-700"
                  }`}
                >
                  {publicable
                    ? "Lista para padrón"
                    : "No publicable todavía"}
                </p>

                <p
                  className={`text-sm ${
                    publicable ? "text-green-700" : "text-orange-700"
                  }`}
                >
                  {publicable
                    ? "La vacante cumple convenio, plan de trabajo y validación."
                    : s.observacion}
                </p>
              </div>

              <div className="flex flex-wrap gap-2 mt-5">
                <button className="border border-blue-200 text-[#1565c0] rounded-xl px-3 py-2 text-xs font-semibold flex items-center gap-1">
                  <Eye className="w-3 h-3" />
                  Revisar
                </button>

                {!publicable && (
                  <button className="border border-orange-200 text-orange-600 rounded-xl px-3 py-2 text-xs font-semibold flex items-center gap-1">
                    <AlertTriangle className="w-3 h-3" />
                    Solicitar cambios
                  </button>
                )}

                {s.estado !== "Aprobada" && (
                  <button className="bg-green-600 text-white rounded-xl px-3 py-2 text-xs font-semibold flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" />
                    Aprobar vacante
                  </button>
                )}

                {s.estado === "Aprobada" && !publicable && (
                  <button className="border border-red-200 text-red-600 rounded-xl px-3 py-2 text-xs font-semibold flex items-center gap-1">
                    <XCircle className="w-3 h-3" />
                    Retener padrón
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {filtradas.length === 0 && (
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-10 text-center text-gray-400">
          No hay vacantes que coincidan con los filtros seleccionados.
        </div>
      )}

      <div className="bg-blue-50 border border-blue-200 rounded-2xl p-5 flex items-start gap-3">
        <Briefcase className="w-5 h-5 text-[#1565c0] mt-0.5" />
        <p className="text-sm text-[#0d2b5e]">
          Una vacante solo debe pasar al padrón cuando el convenio esté vigente,
          el plan de trabajo esté validado, la modalidad sea clara y existan
          espacios disponibles para la carrera correspondiente.
        </p>
      </div>
    </div>
  );
}