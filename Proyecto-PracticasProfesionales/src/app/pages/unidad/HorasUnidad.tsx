import { useState } from "react";
import {
  Clock,
  Users,
  CheckCircle,
  AlertCircle,
  CalendarDays,
  FileText,
  Search,
  Filter,
  Eye,
  Download,
} from "lucide-react";

type RegistroHora = {
  id: number;
  alumno: string;
  matricula: string;
  carrera: string;
  proyecto: string;
  periodo: string;
  horasRegistradas: number;
  horasRequeridas: number;
  ultimaActualizacion: string;
  estado: "Validado" | "En revisión" | "Pendiente";
  reporte: string;
};

export function HorasUnidad() {
  const [q, setQ] = useState("");
  const [filtro, setFiltro] = useState("todos");

  const registros: RegistroHora[] = [
    {
      id: 1,
      alumno: "María García López",
      matricula: "215A10234",
      carrera: "Ing. Sistemas",
      proyecto: "Módulo de Control Documental",
      periodo: "Mayo–Agosto 2026",
      horasRegistradas: 320,
      horasRequeridas: 480,
      ultimaActualizacion: "03 junio 2026",
      estado: "En revisión",
      reporte: "reporte_horas_maria_03jun.pdf",
    },
    {
      id: 2,
      alumno: "Juan Pérez Núñez",
      matricula: "216B20145",
      carrera: "Ing. Sistemas",
      proyecto: "Portal de Seguimiento Interno",
      periodo: "Mayo–Agosto 2026",
      horasRegistradas: 280,
      horasRequeridas: 480,
      ultimaActualizacion: "02 junio 2026",
      estado: "Pendiente",
      reporte: "reporte_horas_juan_02jun.pdf",
    },
    {
      id: 3,
      alumno: "Rosa Díaz Morales",
      matricula: "214C30067",
      carrera: "Administración",
      proyecto: "Organización de Procesos Administrativos",
      periodo: "Mayo–Agosto 2026",
      horasRegistradas: 400,
      horasRequeridas: 480,
      ultimaActualizacion: "01 junio 2026",
      estado: "Validado",
      reporte: "reporte_horas_rosa_01jun.pdf",
    },
    {
      id: 4,
      alumno: "Oscar Gonzalez",
      matricula: "215D40189",
      carrera: "Ing. Desarrollo de Software",
      proyecto: "Sistema de Gestión Documental",
      periodo: "Mayo–Agosto 2026",
      horasRegistradas: 360,
      horasRequeridas: 480,
      ultimaActualizacion: "04 junio 2026",
      estado: "Validado",
      reporte: "reporte_horas_oscar_04jun.pdf",
    },
    {
      id: 5,
      alumno: "Brayan Hernandez",
      matricula: "216E50234",
      carrera: "Ing. Desarrollo de Software",
      proyecto: "Portal de Prácticas Profesionales",
      periodo: "Mayo–Agosto 2026",
      horasRegistradas: 440,
      horasRequeridas: 480,
      ultimaActualizacion: "04 junio 2026",
      estado: "En revisión",
      reporte: "reporte_horas_brayan_04jun.pdf",
    },
    {
      id: 6,
      alumno: "Javier Molina",
      matricula: "213F60321",
      carrera: "Inteligencia Artificial",
      proyecto: "Análisis de Datos Empresariales",
      periodo: "Mayo–Agosto 2026",
      horasRegistradas: 150,
      horasRequeridas: 480,
      ultimaActualizacion: "30 mayo 2026",
      estado: "Pendiente",
      reporte: "reporte_horas_javier_30may.pdf",
    },
  ];

  const estadoColor: Record<string, string> = {
    Validado: "bg-green-100 text-green-700",
    "En revisión": "bg-yellow-100 text-yellow-700",
    Pendiente: "bg-gray-100 text-gray-600",
  };

  const registrosFiltrados = registros.filter((r) => {
    const busqueda =
      r.alumno.toLowerCase().includes(q.toLowerCase()) ||
      r.matricula.toLowerCase().includes(q.toLowerCase()) ||
      r.carrera.toLowerCase().includes(q.toLowerCase()) ||
      r.proyecto.toLowerCase().includes(q.toLowerCase());

    const filtroEstado = filtro === "todos" || r.estado === filtro;

    return busqueda && filtroEstado;
  });

  const totalHoras = registros.reduce((acc, r) => acc + r.horasRegistradas, 0);
  const validados = registros.filter((r) => r.estado === "Validado").length;
  const enRevision = registros.filter((r) => r.estado === "En revisión").length;
  const pendientes = registros.filter((r) => r.estado === "Pendiente").length;

  const avancePromedio = Math.round(
    registros.reduce(
      (acc, r) => acc + (r.horasRegistradas / r.horasRequeridas) * 100,
      0,
    ) / registros.length,
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[#0d2b5e]">
          Registro de Horas
        </h1>
        <p className="text-gray-500 text-sm mt-1">
          Seguimiento de horas acumuladas por los alumnos asignados a la unidad
          receptora.
        </p>
      </div>

      <div className="bg-gradient-to-r from-orange-600 to-orange-500 rounded-2xl p-6 text-white flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="font-bold text-xl">
            Control de horas de prácticas profesionales
          </div>
          <div className="text-orange-100 text-sm mt-1">
            TechSoft Chiapas S.A. de C.V. · Periodo Mayo–Agosto 2026
          </div>
        </div>

        <div className="bg-white/20 px-4 py-2 rounded-xl">
          <div className="text-white font-bold text-sm">
            {totalHoras.toLocaleString()} HORAS
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 xl:grid-cols-4 gap-5">
        {[
          {
            label: "Horas registradas",
            value: totalHoras.toLocaleString(),
            icon: Clock,
            color: "bg-orange-50 text-orange-600",
          },
          {
            label: "Promedio avance",
            value: `${avancePromedio}%`,
            icon: CheckCircle,
            color: "bg-green-50 text-green-600",
          },
          {
            label: "En revisión",
            value: enRevision,
            icon: AlertCircle,
            color: "bg-yellow-50 text-yellow-600",
          },
          {
            label: "Pendientes",
            value: pendientes,
            icon: FileText,
            color: "bg-gray-50 text-gray-600",
          },
        ].map((item) => (
          <div
            key={item.label}
            className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5"
          >
            <div
              className={`w-10 h-10 ${item.color} rounded-xl flex items-center justify-center mb-3`}
            >
              <item.icon className="w-5 h-5" />
            </div>

            <div className="text-2xl font-bold text-[#0d2b5e]">
              {item.value}
            </div>

            <div className="text-gray-500 text-sm mt-0.5">
              {item.label}
            </div>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5 flex flex-col lg:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />

          <input
            type="text"
            placeholder="Buscar por alumno, matrícula, carrera o proyecto..."
            value={q}
            onChange={(e) => setQ(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#1565c0]"
          />
        </div>

        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-gray-400" />

          <select
            value={filtro}
            onChange={(e) => setFiltro(e.target.value)}
            className="px-4 py-2.5 border border-gray-200 rounded-xl text-sm bg-white focus:outline-none focus:border-[#1565c0]"
          >
            <option value="todos">Todos</option>
            <option value="Validado">Validado</option>
            <option value="En revisión">En revisión</option>
            <option value="Pendiente">Pendiente</option>
          </select>
        </div>
      </div>

      <div className="grid xl:grid-cols-3 gap-6">
        <div className="xl:col-span-2 bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-2">
            <Clock className="w-5 h-5 text-[#1565c0]" />
            <h3 className="font-bold text-[#0d2b5e]">
              Horas por Alumno
            </h3>
            <span className="ml-auto text-xs text-gray-400">
              {registrosFiltrados.length} resultados
            </span>
          </div>

          <div className="divide-y divide-gray-100">
            {registrosFiltrados.map((r) => {
              const avance = Math.round(
                (r.horasRegistradas / r.horasRequeridas) * 100,
              );

              return (
                <div key={r.id} className="px-6 py-5 hover:bg-gray-50">
                  <div className="flex flex-col xl:flex-row xl:items-center gap-5">
                    <div className="flex items-start gap-4 flex-1">
                      <div className="w-11 h-11 bg-[#e3f0ff] rounded-xl flex items-center justify-center text-[#1565c0] font-bold flex-shrink-0">
                        {r.alumno.charAt(0)}
                      </div>

                      <div className="flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <h4 className="font-bold text-gray-800 text-sm">
                            {r.alumno}
                          </h4>

                          <span
                            className={`text-xs px-3 py-1 rounded-full font-semibold ${
                              estadoColor[r.estado]
                            }`}
                          >
                            {r.estado}
                          </span>
                        </div>

                        <div className="text-xs text-gray-500 mt-1">
                          Matrícula: {r.matricula} · {r.carrera}
                        </div>

                        <div className="text-xs text-[#1565c0] mt-1 font-medium">
                          Proyecto: {r.proyecto}
                        </div>

                        <div className="grid md:grid-cols-2 gap-3 mt-3">
                          <div className="flex items-center gap-2 text-xs text-gray-500">
                            <CalendarDays className="w-4 h-4 text-[#1565c0]" />
                            Periodo: {r.periodo}
                          </div>

                          <div className="flex items-center gap-2 text-xs text-gray-500">
                            <FileText className="w-4 h-4 text-[#1565c0]" />
                            Última actualización: {r.ultimaActualizacion}
                          </div>
                        </div>

                        <div className="mt-4">
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-xs text-gray-500">
                              Avance de horas
                            </span>

                            <span className="text-xs font-semibold text-[#1565c0]">
                              {r.horasRegistradas}/{r.horasRequeridas} hrs ·{" "}
                              {avance}%
                            </span>
                          </div>

                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div
                              className="bg-[#1565c0] h-2 rounded-full"
                              style={{ width: `${avance}%` }}
                            />
                          </div>
                        </div>

                        <div className="text-xs text-[#1565c0] mt-2">
                          📎 {r.reporte}
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-2 xl:flex-col xl:w-36">
                      <button className="flex items-center justify-center gap-2 px-4 py-2 bg-[#0d2b5e] text-white rounded-lg text-xs font-semibold hover:bg-[#1565c0] transition-colors">
                        <Eye className="w-3.5 h-3.5" />
                        Revisar
                      </button>

                      <button className="flex items-center justify-center gap-2 px-4 py-2 border border-gray-200 text-gray-600 rounded-lg text-xs font-semibold hover:bg-gray-50 transition-colors">
                        <Download className="w-3.5 h-3.5" />
                        Descargar
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}

            {registrosFiltrados.length === 0 && (
              <div className="px-6 py-10 text-center">
                <AlertCircle className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                <div className="text-sm text-gray-500">
                  No se encontraron registros de horas con los filtros
                  seleccionados.
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
            <h3 className="font-bold text-[#0d2b5e] mb-4">
              Resumen de Validación
            </h3>

            <div className="space-y-3">
              {[
                {
                  label: "Registros validados",
                  value: validados,
                  color: "bg-green-50 text-green-700",
                },
                {
                  label: "Registros en revisión",
                  value: enRevision,
                  color: "bg-yellow-50 text-yellow-700",
                },
                {
                  label: "Registros pendientes",
                  value: pendientes,
                  color: "bg-gray-50 text-gray-600",
                },
              ].map((item) => (
                <div
                  key={item.label}
                  className={`p-4 rounded-xl flex items-center justify-between ${item.color}`}
                >
                  <span className="text-sm font-semibold">
                    {item.label}
                  </span>
                  <span className="text-xl font-bold">{item.value}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
            <h3 className="font-bold text-[#0d2b5e] mb-4">
              Fechas de Corte
            </h3>

            <div className="space-y-3">
              {[
                {
                  titulo: "Reporte parcial 1",
                  fecha: "15 junio 2026",
                  estado: "Próximo",
                },
                {
                  titulo: "Reporte parcial 2",
                  fecha: "15 julio 2026",
                  estado: "Próximo",
                },
                {
                  titulo: "Reporte final",
                  fecha: "20 agosto 2026",
                  estado: "Pendiente",
                },
              ].map((f) => (
                <div
                  key={f.titulo}
                  className="p-4 rounded-xl border border-gray-100 bg-gray-50"
                >
                  <div className="font-semibold text-sm text-gray-800">
                    {f.titulo}
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    Fecha límite: {f.fecha}
                  </div>
                  <span className="inline-block mt-2 text-xs px-2.5 py-1 rounded-full font-semibold bg-blue-100 text-blue-700">
                    {f.estado}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-[#e3f0ff] border border-blue-200 rounded-2xl p-5">
            <div className="font-bold text-[#0d2b5e] text-sm">
              Indicaciones
            </div>
            <p className="text-blue-700 text-xs mt-2 leading-relaxed">
              La unidad receptora puede consultar los reportes de horas
              registrados por los alumnos. La validación final será realizada
              por coordinación una vez que los reportes sean revisados.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}