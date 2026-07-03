import { useState } from "react";
import {
  Star,
  Users,
  CheckCircle,
  Clock,
  AlertCircle,
  Search,
  Filter,
  Eye,
  FileText,
  CalendarDays,
  Save,
} from "lucide-react";

type Evaluacion = {
  id: number;
  alumno: string;
  matricula: string;
  carrera: string;
  proyecto: string;
  periodo: string;
  tipo: "Parcial" | "Final";
  estado: "Pendiente" | "Completada" | "En revisión";
  calificacion?: number;
  fechaLimite: string;
  responsable: string;
  observaciones: string;
};

export function EvaluacionesUnidad() {
  const [q, setQ] = useState("");
  const [filtro, setFiltro] = useState("todos");

  const evaluaciones: Evaluacion[] = [
    {
      id: 1,
      alumno: "María García López",
      matricula: "215A10234",
      carrera: "Ing. Sistemas",
      proyecto: "Módulo de Control Documental",
      periodo: "Mayo–Agosto 2026",
      tipo: "Parcial",
      estado: "Pendiente",
      fechaLimite: "15 junio 2026",
      responsable: "Mtro. Daniel Pérez Castillo",
      observaciones: "Pendiente de capturar evaluación parcial.",
    },
    {
      id: 2,
      alumno: "Juan Pérez Núñez",
      matricula: "216B20145",
      carrera: "Ing. Sistemas",
      proyecto: "Portal de Seguimiento Interno",
      periodo: "Mayo–Agosto 2026",
      tipo: "Parcial",
      estado: "Pendiente",
      fechaLimite: "15 junio 2026",
      responsable: "Lic. Fernanda Torres Gómez",
      observaciones: "El alumno debe entregar reporte de avances.",
    },
    {
      id: 3,
      alumno: "Rosa Díaz Morales",
      matricula: "214C30067",
      carrera: "Administración",
      proyecto: "Organización de Procesos Administrativos",
      periodo: "Mayo–Agosto 2026",
      tipo: "Parcial",
      estado: "Completada",
      calificacion: 95,
      fechaLimite: "15 junio 2026",
      responsable: "Ing. Alejandro Méndez Ruiz",
      observaciones: "Excelente desempeño y buena organización.",
    },
    {
      id: 4,
      alumno: "Oscar Gonzalez",
      matricula: "215D40189",
      carrera: "Ing. Desarrollo de Software",
      proyecto: "Sistema de Gestión Documental",
      periodo: "Mayo–Agosto 2026",
      tipo: "Parcial",
      estado: "Completada",
      calificacion: 98,
      fechaLimite: "15 junio 2026",
      responsable: "Mtro. Daniel Pérez Castillo",
      observaciones: "Buen avance técnico en el sistema documental.",
    },
    {
      id: 5,
      alumno: "Brayan Hernandez",
      matricula: "216E50234",
      carrera: "Ing. Desarrollo de Software",
      proyecto: "Portal de Prácticas Profesionales",
      periodo: "Mayo–Agosto 2026",
      tipo: "Parcial",
      estado: "En revisión",
      calificacion: 90,
      fechaLimite: "15 junio 2026",
      responsable: "Lic. Fernanda Torres Gómez",
      observaciones: "Evaluación capturada, pendiente de validación.",
    },
    {
      id: 6,
      alumno: "Javier Molina",
      matricula: "213F60321",
      carrera: "Inteligencia Artificial",
      proyecto: "Análisis de Datos Empresariales",
      periodo: "Mayo–Agosto 2026",
      tipo: "Final",
      estado: "Pendiente",
      fechaLimite: "20 agosto 2026",
      responsable: "Ing. Alejandro Méndez Ruiz",
      observaciones: "Evaluación final pendiente hasta completar el periodo.",
    },
  ];

  const estadoColor: Record<string, string> = {
    Pendiente: "bg-gray-100 text-gray-600",
    Completada: "bg-green-100 text-green-700",
    "En revisión": "bg-yellow-100 text-yellow-700",
  };

  const evaluacionesFiltradas = evaluaciones.filter((e) => {
    const busqueda =
      e.alumno.toLowerCase().includes(q.toLowerCase()) ||
      e.matricula.toLowerCase().includes(q.toLowerCase()) ||
      e.carrera.toLowerCase().includes(q.toLowerCase()) ||
      e.proyecto.toLowerCase().includes(q.toLowerCase());

    const filtroEstado = filtro === "todos" || e.estado === filtro;

    return busqueda && filtroEstado;
  });

  const pendientes = evaluaciones.filter((e) => e.estado === "Pendiente").length;
  const completadas = evaluaciones.filter(
    (e) => e.estado === "Completada",
  ).length;
  const enRevision = evaluaciones.filter(
    (e) => e.estado === "En revisión",
  ).length;

  const promedio = Math.round(
    evaluaciones
      .filter((e) => typeof e.calificacion === "number")
      .reduce((acc, e) => acc + (e.calificacion || 0), 0) /
      evaluaciones.filter((e) => typeof e.calificacion === "number").length,
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[#0d2b5e]">
          Evaluaciones
        </h1>
        <p className="text-gray-500 text-sm mt-1">
          Captura y seguimiento de evaluaciones de alumnos en prácticas.
        </p>
      </div>

      <div className="bg-gradient-to-r from-yellow-500 to-orange-500 rounded-2xl p-6 text-white flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="font-bold text-xl">
            Evaluaciones de desempeño
          </div>
          <div className="text-yellow-100 text-sm mt-1">
            TechSoft Chiapas S.A. de C.V. · Periodo Mayo–Agosto 2026
          </div>
        </div>

        <div className="bg-white/20 px-4 py-2 rounded-xl">
          <div className="text-white font-bold text-sm">
            PROMEDIO {promedio}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 xl:grid-cols-4 gap-5">
        {[
          {
            label: "Evaluaciones",
            value: evaluaciones.length,
            icon: Star,
            color: "bg-yellow-50 text-yellow-600",
          },
          {
            label: "Completadas",
            value: completadas,
            icon: CheckCircle,
            color: "bg-green-50 text-green-600",
          },
          {
            label: "Pendientes",
            value: pendientes,
            icon: Clock,
            color: "bg-gray-50 text-gray-600",
          },
          {
            label: "En revisión",
            value: enRevision,
            icon: AlertCircle,
            color: "bg-orange-50 text-orange-600",
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
            onChange={(ev) => setQ(ev.target.value)}
            className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#1565c0]"
          />
        </div>

        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-gray-400" />

          <select
            value={filtro}
            onChange={(ev) => setFiltro(ev.target.value)}
            className="px-4 py-2.5 border border-gray-200 rounded-xl text-sm bg-white focus:outline-none focus:border-[#1565c0]"
          >
            <option value="todos">Todos</option>
            <option value="Pendiente">Pendiente</option>
            <option value="Completada">Completada</option>
            <option value="En revisión">En revisión</option>
          </select>
        </div>
      </div>

      <div className="grid xl:grid-cols-3 gap-6">
        <div className="xl:col-span-2 bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-2">
            <Star className="w-5 h-5 text-[#1565c0]" />
            <h3 className="font-bold text-[#0d2b5e]">
              Lista de Evaluaciones
            </h3>
            <span className="ml-auto text-xs text-gray-400">
              {evaluacionesFiltradas.length} resultados
            </span>
          </div>

          <div className="divide-y divide-gray-100">
            {evaluacionesFiltradas.map((e) => (
              <div key={e.id} className="px-6 py-5 hover:bg-gray-50">
                <div className="flex flex-col xl:flex-row xl:items-center gap-5">
                  <div className="flex items-start gap-4 flex-1">
                    <div className="w-11 h-11 bg-[#e3f0ff] rounded-xl flex items-center justify-center text-[#1565c0] font-bold flex-shrink-0">
                      {e.alumno.charAt(0)}
                    </div>

                    <div className="flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <h4 className="font-bold text-gray-800 text-sm">
                          {e.alumno}
                        </h4>

                        <span
                          className={`text-xs px-3 py-1 rounded-full font-semibold ${
                            estadoColor[e.estado]
                          }`}
                        >
                          {e.estado}
                        </span>

                        <span className="text-xs px-3 py-1 rounded-full font-semibold bg-blue-100 text-blue-700">
                          {e.tipo}
                        </span>
                      </div>

                      <div className="text-xs text-gray-500 mt-1">
                        Matrícula: {e.matricula} · {e.carrera}
                      </div>

                      <div className="text-xs text-[#1565c0] mt-1 font-medium">
                        Proyecto: {e.proyecto}
                      </div>

                      <div className="grid md:grid-cols-2 gap-3 mt-3">
                        <div className="flex items-center gap-2 text-xs text-gray-500">
                          <CalendarDays className="w-4 h-4 text-[#1565c0]" />
                          Fecha límite: {e.fechaLimite}
                        </div>

                        <div className="flex items-center gap-2 text-xs text-gray-500">
                          <FileText className="w-4 h-4 text-[#1565c0]" />
                          Responsable: {e.responsable}
                        </div>
                      </div>

                      <p className="text-xs text-gray-500 mt-3 leading-relaxed">
                        {e.observaciones}
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2 xl:flex-col xl:w-40">
                    {typeof e.calificacion === "number" && (
                      <div className="text-center px-4 py-2 rounded-xl bg-green-50 border border-green-100">
                        <div className="text-xs text-green-600">
                          Calificación
                        </div>
                        <div className="text-xl font-bold text-green-700">
                          {e.calificacion}
                        </div>
                      </div>
                    )}

                    <button className="flex items-center justify-center gap-2 px-4 py-2 bg-[#0d2b5e] text-white rounded-lg text-xs font-semibold hover:bg-[#1565c0] transition-colors">
                      <Eye className="w-3.5 h-3.5" />
                      Ver detalle
                    </button>

                    {e.estado === "Pendiente" && (
                      <button className="flex items-center justify-center gap-2 px-4 py-2 border border-gray-200 text-gray-600 rounded-lg text-xs font-semibold hover:bg-gray-50 transition-colors">
                        <Save className="w-3.5 h-3.5" />
                        Capturar
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}

            {evaluacionesFiltradas.length === 0 && (
              <div className="px-6 py-10 text-center">
                <AlertCircle className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                <div className="text-sm text-gray-500">
                  No se encontraron evaluaciones con los filtros seleccionados.
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
            <h3 className="font-bold text-[#0d2b5e] mb-4">
              Criterios de Evaluación
            </h3>

            <div className="space-y-3">
              {[
                { criterio: "Responsabilidad", valor: "20%" },
                { criterio: "Puntualidad", valor: "15%" },
                { criterio: "Calidad del trabajo", valor: "25%" },
                { criterio: "Comunicación", valor: "15%" },
                { criterio: "Cumplimiento de actividades", valor: "25%" },
              ].map((c) => (
                <div
                  key={c.criterio}
                  className="flex items-center justify-between p-3 rounded-xl border border-gray-100 hover:bg-gray-50"
                >
                  <span className="text-sm text-gray-700">{c.criterio}</span>
                  <span className="text-xs px-2.5 py-1 rounded-full font-semibold bg-blue-100 text-blue-700">
                    {c.valor}
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
              Las evaluaciones deben capturarse al finalizar cada periodo de
              seguimiento. La calificación será revisada por coordinación antes
              de integrarse al expediente final del alumno.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}