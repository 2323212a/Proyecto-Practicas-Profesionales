import { useMemo, useState } from "react";
import {
  Building2,
  Search,
  Users,
  Briefcase,
  AlertTriangle,
  Eye,
  CheckCircle2,
  Filter,
  RotateCcw,
  Star,
  Send,
  ClipboardList,
  Download,
} from "lucide-react";

type Vista = "asignar" | "prioritarios" | "regulares" | "rezagados";

const alumnosRegulares = [
  {
    id: 1,
    nombre: "Brayan Madain Hernandez",
    matricula: "216B20101",
    carrera: "Desarrollo y Tec. Software",
    tipo: "Cuatrimestral",
    fechaValidacion: "2026-06-01 09:15",
    opciones: ["TechSoft Chiapas", "DataLab MX", "Innovatek"],
  },
  {
    id: 2,
    nombre: "Javier Molina",
    matricula: "216B20188",
    carrera: "Desarrollo y Tec. Software",
    tipo: "Cuatrimestral",
    fechaValidacion: "2026-06-01 11:40",
    opciones: ["TechSoft Chiapas", "Innovatek", "Chiapas Digital"],
  },
  {
    id: 3,
    nombre: "Miguel Torres Flores",
    matricula: "216B20245",
    carrera: "IA y Ciencia de Datos",
    tipo: "Cuatrimestral",
    fechaValidacion: "2026-06-02 08:20",
    opciones: ["DataLab MX", "TechSoft Chiapas", "Chiapas Digital"],
  },
];

const alumnosPrioritarios = [
  {
    id: 1,
    nombre: "Andrea López Ruiz",
    matricula: "216P10021",
    carrera: "Desarrollo y Tec. Software",
    tipo: "Cuatrimestral",
    empresaPrioritaria: "TechSoft Chiapas",
  },
  {
    id: 2,
    nombre: "Fernando Gómez Pérez",
    matricula: "216P10044",
    carrera: "Desarrollo y Tec. Software",
    tipo: "Cuatrimestral",
    empresaPrioritaria: "TechSoft Chiapas",
  },
  {
    id: 3,
    nombre: "María José Hernández",
    matricula: "216P10078",
    carrera: "IA y Ciencia de Datos",
    tipo: "Cuatrimestral",
    empresaPrioritaria: "DataLab MX",
  },
];

const alumnosRezagados = [
  {
    id: 1,
    nombre: "Laura Martínez Cruz",
    matricula: "216B20145",
    carrera: "Sistemas Computacionales",
    tipo: "Cuatrimestral",
    motivo: "No seleccionó empresa",
    estado: "Rezagado",
  },
  {
    id: 2,
    nombre: "Patricia Álvarez Mora",
    matricula: "216J00789",
    carrera: "Desarrollo y Tec. Software",
    tipo: "Cuatrimestral",
    motivo: "Opciones sin cupo",
    estado: "Rezagado",
  },
];

const empresas = [
  {
    id: 1,
    nombre: "TechSoft Chiapas",
    area: "Desarrollo web",
    carreras: ["Desarrollo y Tec. Software", "Sistemas Computacionales"],
    tipo: ["Semestral", "Cuatrimestral"],
    vacantes: 2,
    estado: "Activa",
  },
  {
    id: 2,
    nombre: "DataLab MX",
    area: "Análisis de datos",
    carreras: ["IA y Ciencia de Datos", "Sistemas Computacionales"],
    tipo: ["Cuatrimestral"],
    vacantes: 2,
    estado: "Activa",
  },
  {
    id: 3,
    nombre: "Innovatek",
    area: "Software empresarial",
    carreras: ["Desarrollo y Tec. Software", "Sistemas Computacionales"],
    tipo: ["Semestral", "Cuatrimestral"],
    vacantes: 1,
    estado: "Activa",
  },
  {
    id: 4,
    nombre: "Chiapas Digital",
    area: "Soporte tecnológico",
    carreras: ["Sistemas Computacionales", "Desarrollo y Tec. Software"],
    tipo: ["Semestral", "Cuatrimestral"],
    vacantes: 3,
    estado: "Activa",
  },
];

export function CoordinadorAsignaciones() {
  const [vista, setVista] = useState<Vista>("asignar");
  const [busqueda, setBusqueda] = useState("");
  const [carrera, setCarrera] = useState("todas");
  const [tipo, setTipo] = useState("todos");

  const [asignacionesRegulares, setAsignacionesRegulares] = useState<
    Record<number, string>
  >({});

  const [asignacionesRezagados, setAsignacionesRezagados] = useState<
    Record<number, string>
  >({});

  const [prioritariosConfirmados, setPrioritariosConfirmados] = useState<
    Record<number, boolean>
  >({});

  const [mostrarListaPrioritarios, setMostrarListaPrioritarios] =
    useState(false);

  const alumnosRegularesOrdenados = useMemo(() => {
    return [...alumnosRegulares].sort(
      (a, b) =>
        new Date(a.fechaValidacion).getTime() -
        new Date(b.fechaValidacion).getTime()
    );
  }, []);

  const carreras = [
    ...new Set([
      ...alumnosRegulares.map((a) => a.carrera),
      ...alumnosPrioritarios.map((a) => a.carrera),
      ...alumnosRezagados.map((a) => a.carrera),
    ]),
  ];

  const limpiarFiltros = () => {
    setBusqueda("");
    setCarrera("todas");
    setTipo("todos");
  };

  const empresasCompatibles = (alumno: any) => {
    return empresas.filter(
      (e) =>
        e.estado === "Activa" &&
        e.vacantes > 0 &&
        e.carreras.includes(alumno.carrera) &&
        e.tipo.includes(alumno.tipo)
    );
  };

  const filtrarAlumnos = (lista: any[]) => {
    return lista.filter((a) => {
      const coincideBusqueda =
        a.nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
        a.matricula.toLowerCase().includes(busqueda.toLowerCase());

      const coincideCarrera = carrera === "todas" || a.carrera === carrera;
      const coincideTipo = tipo === "todos" || a.tipo === tipo;

      return coincideBusqueda && coincideCarrera && coincideTipo;
    });
  };

  const alumnosRegularesFiltrados = filtrarAlumnos(alumnosRegularesOrdenados);
  const alumnosRezagadosFiltrados = filtrarAlumnos(alumnosRezagados);

  const prioritariosPorEmpresa = alumnosPrioritarios.reduce(
    (acc: Record<string, typeof alumnosPrioritarios>, alumno) => {
      if (!acc[alumno.empresaPrioritaria]) {
        acc[alumno.empresaPrioritaria] = [];
      }

      acc[alumno.empresaPrioritaria].push(alumno);
      return acc;
    },
    {}
  );

  const confirmarAsignacionRegular = (idAlumno: number) => {
    const empresa = asignacionesRegulares[idAlumno];

    if (!empresa) return;

    alert(`Alumno regular asignado a ${empresa}`);
  };

  const confirmarAsignacionRezagado = (idAlumno: number) => {
    const empresa = asignacionesRezagados[idAlumno];

    if (!empresa) return;

    alert(`Alumno rezagado asignado a ${empresa}`);
  };

  const alumnosPrioritariosConfirmados = alumnosPrioritarios.filter(
    (a) => prioritariosConfirmados[a.id]
  );

  const totalVacantes = empresas.reduce((acc, e) => acc + e.vacantes, 0);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[#0d2b5e]">
          Asignación de Alumnos
        </h1>
        <p className="text-gray-500 text-sm mt-1">
          Administración de asignaciones para alumnos prioritarios, regulares y
          rezagados.
        </p>
      </div>

      <div className="bg-[#0d2b5e] rounded-2xl p-6 text-white">
        <div className="flex flex-col xl:flex-row xl:items-center xl:justify-between gap-5">
          <div>
            <h2 className="text-xl font-bold">Convocatoria Verano 2026</h2>
            <p className="text-blue-200 text-sm mt-1">
              El orden de asignación considera prioridad validada y fecha de
              validación de documentos.
            </p>
          </div>

          <span className="bg-blue-100 text-[#0d2b5e] px-4 py-2 rounded-full text-sm font-semibold">
            Proceso de asignación
          </span>
        </div>

        <div className="grid md:grid-cols-4 gap-4 mt-6">
          {[
            ["Prioritarios", alumnosPrioritarios.length, Star],
            ["Regulares", alumnosRegulares.length, Users],
            ["Rezagados", alumnosRezagados.length, AlertTriangle],
            ["Vacantes libres", totalVacantes, Briefcase],
          ].map(([label, value, Icon]: any) => (
            <div key={label} className="bg-white/10 rounded-xl p-4">
              <Icon className="w-5 h-5 text-blue-200 mb-2" />
              <div className="text-2xl font-bold">{value}</div>
              <div className="text-blue-200 text-sm">{label}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
        <h3 className="font-bold text-[#0d2b5e] mb-2">
          Orden sugerido de asignación
        </h3>
        <p className="text-sm text-gray-500">
          Primero se revisan alumnos prioritarios confirmados, después alumnos
          regulares ordenados por fecha de validación y al final rezagados.
        </p>

        <div className="grid md:grid-cols-3 gap-4 mt-6">
          <div className="border rounded-2xl p-5 bg-yellow-50 border-yellow-200">
            <Star className="w-7 h-7 text-yellow-600 mb-3" />
            <h4 className="font-bold text-[#0d2b5e]">
              1. Prioritarios confirmados
            </h4>
            <p className="text-sm text-gray-600 mt-2">
              Alumnos que declararon tener unidad receptora y fueron validados
              por coordinación.
            </p>
          </div>

          <div className="border rounded-2xl p-5 bg-blue-50 border-blue-200">
            <Users className="w-7 h-7 text-[#1565c0] mb-3" />
            <h4 className="font-bold text-[#0d2b5e]">2. Regulares</h4>
            <p className="text-sm text-gray-600 mt-2">
              Se ordenan según la fecha en que validaron todos sus documentos.
            </p>
          </div>

          <div className="border rounded-2xl p-5 bg-orange-50 border-orange-200">
            <AlertTriangle className="w-7 h-7 text-orange-600 mb-3" />
            <h4 className="font-bold text-[#0d2b5e]">3. Rezagados</h4>
            <p className="text-sm text-gray-600 mt-2">
              Alumnos sin asignación normal. Esta vista se conserva para ajustes
              posteriores.
            </p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-4">
        <div className="grid md:grid-cols-4 gap-3">
          {[
            ["asignar", "Asignar", ClipboardList],
            ["prioritarios", "Alumnos prioritarios", Star],
            ["regulares", "Alumnos regulares", Users],
            ["rezagados", "Rezagados", AlertTriangle],
          ].map(([key, label, Icon]: any) => (
            <button
              key={key}
              onClick={() => setVista(key)}
              className={`rounded-xl px-4 py-3 text-sm font-semibold flex items-center justify-center gap-2 ${
                vista === key
                  ? "bg-[#0d2b5e] text-white"
                  : "bg-gray-50 text-gray-600 border border-gray-200 hover:bg-gray-100"
              }`}
            >
              <Icon className="w-4 h-4" />
              {label}
            </button>
          ))}
        </div>
      </div>

      {vista !== "asignar" && (
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-5">
            <div>
              <h3 className="font-bold text-[#0d2b5e]">
                {vista === "prioritarios" && "Alumnos prioritarios"}
                {vista === "regulares" && "Alumnos regulares"}
                {vista === "rezagados" && "Alumnos rezagados"}
              </h3>
              <p className="text-sm text-gray-500 mt-1">
                {vista === "prioritarios" &&
                  "Alumnos que activaron la opción: Yo tengo mi unidad receptora."}
                {vista === "regulares" &&
                  "Alumnos que enviaron y validaron documentos a tiempo."}
                {vista === "rezagados" &&
                  "Alumnos pendientes de asignación o con incidencias."}
              </p>
            </div>

            <button
              onClick={limpiarFiltros}
              className="flex items-center gap-1 text-xs text-gray-500 hover:text-[#1565c0]"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Limpiar filtros
            </button>
          </div>

          <div className="grid md:grid-cols-3 gap-3 mb-5">
            <div className="border rounded-xl px-3 py-2 flex items-center gap-2">
              <Search className="w-4 h-4 text-gray-400" />
              <input
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                className="outline-none text-sm w-full"
                placeholder="Buscar alumno o matrícula..."
              />
            </div>

            <div className="border rounded-xl px-3 py-2 flex items-center gap-2">
              <Filter className="w-4 h-4 text-gray-400" />
              <select
                value={carrera}
                onChange={(e) => setCarrera(e.target.value)}
                className="outline-none text-sm w-full bg-white"
              >
                <option value="todas">Todas las carreras</option>
                {carreras.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>

            <select
              value={tipo}
              onChange={(e) => setTipo(e.target.value)}
              className="border rounded-xl px-3 py-2 text-sm bg-white outline-none"
            >
              <option value="todos">Tipo de práctica</option>
              <option value="Semestral">Semestral</option>
              <option value="Cuatrimestral">Cuatrimestral</option>
            </select>
          </div>

          {vista === "prioritarios" && (
            <div className="space-y-6">
              <div className="bg-yellow-50 border border-yellow-200 rounded-2xl p-5">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                  <div>
                    <h4 className="font-bold text-[#0d2b5e]">
                      Validación de prioridad por empresa
                    </h4>
                    <p className="text-sm text-gray-600 mt-1">
                      Genera una lista con las empresas y alumnos que la marcaron
                      como prioritaria para enviarla a coordinación de unidades.
                    </p>
                  </div>

                  <div className="flex flex-col sm:flex-row gap-2">
                    <button
                      onClick={() => setMostrarListaPrioritarios(true)}
                      className="bg-yellow-500 text-white rounded-xl px-4 py-2 text-sm font-semibold flex items-center justify-center gap-2"
                    >
                      <Send className="w-4 h-4" />
                      Generar lista para coordinación
                    </button>

                    {mostrarListaPrioritarios && (
                      <button className="bg-[#1565c0] text-white rounded-xl px-4 py-2 text-sm font-semibold flex items-center justify-center gap-2">
                        <Download className="w-4 h-4" />
                        Descargar PDF
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {mostrarListaPrioritarios && (
                <div className="border border-gray-200 rounded-2xl p-5">
                  <h4 className="font-bold text-[#0d2b5e] mb-4">
                    Lista para coordinación de unidades
                  </h4>

                  <div className="space-y-4">
                    {Object.entries(prioritariosPorEmpresa).map(
                      ([empresa, alumnos]) => (
                        <div
                          key={empresa}
                          className="bg-gray-50 border border-gray-200 rounded-xl p-4"
                        >
                          <h5 className="font-bold text-[#0d2b5e]">
                            {empresa}
                          </h5>

                          <div className="mt-3 space-y-2">
                            {alumnos.map((a) => (
                              <div
                                key={a.id}
                                className="bg-white border rounded-xl p-3 flex flex-col md:flex-row md:items-center md:justify-between gap-3"
                              >
                                <div>
                                  <p className="font-semibold text-sm text-[#0d2b5e]">
                                    {a.nombre}
                                  </p>
                                  <p className="text-xs text-gray-500">
                                    {a.matricula} · {a.carrera}
                                  </p>
                                </div>

                                <button
                                  onClick={() =>
                                    setPrioritariosConfirmados((prev) => ({
                                      ...prev,
                                      [a.id]: !prev[a.id],
                                    }))
                                  }
                                  className={`rounded-xl px-3 py-2 text-xs font-semibold ${
                                    prioritariosConfirmados[a.id]
                                      ? "bg-green-100 text-green-700"
                                      : "bg-[#1565c0] text-white"
                                  }`}
                                >
                                  {prioritariosConfirmados[a.id]
                                    ? "Prioridad confirmada"
                                    : "Confirmar prioridad"}
                                </button>
                              </div>
                            ))}
                          </div>
                        </div>
                      )
                    )}
                  </div>
                </div>
              )}

              {alumnosPrioritariosConfirmados.length > 0 && (
                <div className="border border-green-200 bg-green-50 rounded-2xl p-5">
                  <h4 className="font-bold text-[#0d2b5e] mb-4">
                    Lista de asignación prioritaria
                  </h4>

                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-left text-gray-500 border-b border-green-200">
                        <th className="py-3">Alumno</th>
                        <th>Empresa prioritaria</th>
                        <th>Estado</th>
                      </tr>
                    </thead>

                    <tbody>
                      {alumnosPrioritariosConfirmados.map((a) => (
                        <tr key={a.id} className="border-b last:border-0">
                          <td className="py-3">
                            <div className="font-medium text-[#0d2b5e]">
                              {a.nombre}
                            </div>
                            <div className="text-xs text-gray-500">
                              {a.matricula}
                            </div>
                          </td>

                          <td className="text-gray-600">
                            {a.empresaPrioritaria}
                          </td>

                          <td>
                            <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-xs font-semibold">
                              Listo para asignar
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {vista === "regulares" && (
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-gray-500 border-b">
                  <th className="py-3">Orden</th>
                  <th>Alumno</th>
                  <th>Fecha validación</th>
                  <th>Opciones elegidas</th>
                  <th>Asignar empresa</th>
                  <th>Acción</th>
                </tr>
              </thead>

              <tbody>
                {alumnosRegularesFiltrados.map((alumno, index) => (
                  <tr key={alumno.id} className="border-b last:border-0">
                    <td className="py-3">
                      <span className="bg-blue-50 text-[#1565c0] px-3 py-1 rounded-full text-xs font-bold">
                        #{index + 1}
                      </span>
                    </td>

                    <td>
                      <div className="font-medium text-[#0d2b5e]">
                        {alumno.nombre}
                      </div>
                      <div className="text-xs text-gray-400">
                        {alumno.matricula}
                      </div>
                    </td>

                    <td className="text-gray-600">
                      {alumno.fechaValidacion}
                    </td>

                    <td>
                      <div className="space-y-1">
                        {alumno.opciones.map((opcion, i) => (
                          <div key={opcion} className="text-xs text-gray-600">
                            {i + 1}. {opcion}
                          </div>
                        ))}
                      </div>
                    </td>

                    <td>
                      <select
                        value={asignacionesRegulares[alumno.id] ?? ""}
                        onChange={(e) =>
                          setAsignacionesRegulares((prev) => ({
                            ...prev,
                            [alumno.id]: e.target.value,
                          }))
                        }
                        className="border rounded-lg px-3 py-1.5 text-xs bg-white"
                      >
                        <option value="">Seleccionar empresa</option>
                        {alumno.opciones.map((empresa) => (
                          <option key={empresa} value={empresa}>
                            {empresa}
                          </option>
                        ))}
                      </select>
                    </td>

                    <td>
                      <button
                        onClick={() => confirmarAsignacionRegular(alumno.id)}
                        disabled={!asignacionesRegulares[alumno.id]}
                        className="bg-[#1565c0] text-white rounded-lg px-3 py-1.5 text-xs font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Asignar
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {vista === "rezagados" && (
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-gray-500 border-b">
                  <th className="py-3">Alumno</th>
                  <th>Carrera</th>
                  <th>Tipo</th>
                  <th>Motivo</th>
                  <th>Asignar empresa</th>
                  <th>Acción</th>
                </tr>
              </thead>

              <tbody>
                {alumnosRezagadosFiltrados.map((alumno) => {
                  const compatibles = empresasCompatibles(alumno);

                  return (
                    <tr key={alumno.id} className="border-b last:border-0">
                      <td className="py-3">
                        <div className="font-medium text-[#0d2b5e]">
                          {alumno.nombre}
                        </div>
                        <div className="text-xs text-gray-400">
                          {alumno.matricula}
                        </div>
                      </td>

                      <td className="text-gray-600">{alumno.carrera}</td>
                      <td className="text-gray-600">{alumno.tipo}</td>

                      <td>
                        <span className="px-3 py-1 rounded-full text-xs bg-orange-100 text-orange-700">
                          {alumno.motivo}
                        </span>
                      </td>

                      <td>
                        <select
                          value={asignacionesRezagados[alumno.id] ?? ""}
                          onChange={(e) =>
                            setAsignacionesRezagados((prev) => ({
                              ...prev,
                              [alumno.id]: e.target.value,
                            }))
                          }
                          className="border rounded-lg px-3 py-1.5 text-xs bg-white"
                        >
                          <option value="">Seleccionar empresa</option>
                          {compatibles.map((e) => (
                            <option key={e.id} value={e.nombre}>
                              {e.nombre} · {e.vacantes} vacantes
                            </option>
                          ))}
                        </select>
                      </td>

                      <td>
                        <button
                          onClick={() => confirmarAsignacionRezagado(alumno.id)}
                          disabled={!asignacionesRezagados[alumno.id]}
                          className="bg-[#1565c0] text-white rounded-lg px-3 py-1.5 text-xs font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          Asignar
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      )}

      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
        <h3 className="font-bold text-[#0d2b5e] mb-5">
          Empresas disponibles
        </h3>

        <div className="grid md:grid-cols-2 xl:grid-cols-4 gap-4">
          {empresas.map((empresa) => (
            <div
              key={empresa.id}
              className="border border-gray-200 rounded-2xl p-5"
            >
              <Building2 className="w-8 h-8 text-[#1565c0] mb-3" />

              <h4 className="font-bold text-[#0d2b5e]">{empresa.nombre}</h4>

              <p className="text-sm text-gray-500 mt-1">{empresa.area}</p>

              <div className="mt-4 space-y-2">
                <span className="inline-block text-xs bg-blue-50 text-[#1565c0] px-3 py-1 rounded-full">
                  {empresa.vacantes} vacantes libres
                </span>

                <div className="text-xs text-gray-500">
                  Carreras: {empresa.carreras.join(", ")}
                </div>

                <div className="text-xs text-gray-500">
                  Tipo: {empresa.tipo.join(", ")}
                </div>
              </div>

              <div className="mt-4">
                <button className="w-full border border-blue-200 text-[#1565c0] rounded-xl py-2 text-xs font-semibold hover:bg-blue-50 flex items-center justify-center gap-1">
                  <Eye className="w-3 h-3" />
                  Ver detalle
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}