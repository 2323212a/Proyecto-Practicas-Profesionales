import { useState } from "react";
import {
  Users,
  Search,
  Filter,
  Clock,
  CheckCircle,
  AlertCircle,
  Eye,
  Star,
  FileText,
  CalendarDays,
} from "lucide-react";

type Alumno = {
  id: number;
  nombre: string;
  matricula: string;
  carrera: string;
  semestre: string;
  proyecto: string;
  horas: number;
  totalHoras: number;
  estado: "Activo" | "Por evaluar" | "Finalizado";
  asesor: string;
  inicio: string;
  fin: string;
};

export function AlumnosUnidad() {
  const [q, setQ] = useState("");
  const [filtro, setFiltro] = useState("todos");

  const alumnos: Alumno[] = [
    {
      id: 1,
      nombre: "María García López",
      matricula: "215A10234",
      carrera: "Ing. Sistemas",
      semestre: "7° Semestre",
      proyecto: "Módulo de Control Documental",
      horas: 320,
      totalHoras: 480,
      estado: "Por evaluar",
      asesor: "Mtro. Daniel Pérez Castillo",
      inicio: "01 mayo 2026",
      fin: "31 agosto 2026",
    },
    {
      id: 2,
      nombre: "Juan Pérez Núñez",
      matricula: "216B20145",
      carrera: "Ing. Sistemas",
      semestre: "7° Semestre",
      proyecto: "Portal de Seguimiento Interno",
      horas: 280,
      totalHoras: 480,
      estado: "Por evaluar",
      asesor: "Lic. Fernanda Torres Gómez",
      inicio: "01 mayo 2026",
      fin: "31 agosto 2026",
    },
    {
      id: 3,
      nombre: "Rosa Díaz Morales",
      matricula: "214C30067",
      carrera: "Administración",
      semestre: "8° Semestre",
      proyecto: "Organización de Procesos Administrativos",
      horas: 400,
      totalHoras: 480,
      estado: "Activo",
      asesor: "Ing. Alejandro Méndez Ruiz",
      inicio: "01 mayo 2026",
      fin: "31 agosto 2026",
    },
    {
      id: 4,
      nombre: "Oscar Gonzalez",
      matricula: "215D40189",
      carrera: "Ing. Desarrollo de Software",
      semestre: "7° Semestre",
      proyecto: "Sistema de Gestión Documental",
      horas: 360,
      totalHoras: 480,
      estado: "Activo",
      asesor: "Mtro. Daniel Pérez Castillo",
      inicio: "01 mayo 2026",
      fin: "31 agosto 2026",
    },
    {
      id: 5,
      nombre: "Brayan Hernandez",
      matricula: "216E50234",
      carrera: "Ing. Desarrollo de Software",
      semestre: "7° Semestre",
      proyecto: "Portal de Prácticas Profesionales",
      horas: 440,
      totalHoras: 480,
      estado: "Por evaluar",
      asesor: "Lic. Fernanda Torres Gómez",
      inicio: "01 mayo 2026",
      fin: "31 agosto 2026",
    },
    {
      id: 6,
      nombre: "Javier Molina",
      matricula: "213F60321",
      carrera: "Inteligencia Artificial",
      semestre: "8° Semestre",
      proyecto: "Análisis de Datos Empresariales",
      horas: 150,
      totalHoras: 480,
      estado: "Activo",
      asesor: "Ing. Alejandro Méndez Ruiz",
      inicio: "10 mayo 2026",
      fin: "31 agosto 2026",
    },
  ];

  const estadoColor: Record<string, string> = {
    Activo: "bg-blue-100 text-blue-700",
    "Por evaluar": "bg-yellow-100 text-yellow-700",
    Finalizado: "bg-green-100 text-green-700",
  };

  const alumnosFiltrados = alumnos.filter((a) => {
    const coincideBusqueda =
      a.nombre.toLowerCase().includes(q.toLowerCase()) ||
      a.matricula.toLowerCase().includes(q.toLowerCase()) ||
      a.carrera.toLowerCase().includes(q.toLowerCase()) ||
      a.proyecto.toLowerCase().includes(q.toLowerCase());

    const coincideFiltro = filtro === "todos" || a.estado === filtro;

    return coincideBusqueda && coincideFiltro;
  });

  const alumnosActivos = alumnos.filter((a) => a.estado === "Activo").length;
  const porEvaluar = alumnos.filter((a) => a.estado === "Por evaluar").length;
  const totalHoras = alumnos.reduce((acc, a) => acc + a.horas, 0);
  const promedioAvance = Math.round(
    alumnos.reduce((acc, a) => acc + (a.horas / a.totalHoras) * 100, 0) /
      alumnos.length,
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[#0d2b5e]">
          Alumnos en Prácticas
        </h1>
        <p className="text-gray-500 text-sm mt-1">
          Seguimiento de alumnos asignados a la unidad receptora.
        </p>
      </div>

      <div className="bg-gradient-to-r from-blue-600 to-blue-500 rounded-2xl p-6 text-white flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="font-bold text-xl">
            Alumnos asignados a TechSoft Chiapas
          </div>
          <div className="text-blue-100 text-sm mt-1">
            Periodo Mayo–Agosto 2026 · 6 alumnos registrados
          </div>
        </div>

        <div className="bg-white/20 px-4 py-2 rounded-xl">
          <div className="text-white font-bold text-sm">UNIDAD ACTIVA</div>
        </div>
      </div>

      <div className="grid grid-cols-2 xl:grid-cols-4 gap-5">
        {[
          {
            label: "Alumnos activos",
            value: alumnosActivos,
            icon: Users,
            color: "bg-blue-50 text-blue-600",
          },
          {
            label: "Por evaluar",
            value: porEvaluar,
            icon: Star,
            color: "bg-yellow-50 text-yellow-600",
          },
          {
            label: "Horas acumuladas",
            value: totalHoras.toLocaleString(),
            icon: Clock,
            color: "bg-orange-50 text-orange-600",
          },
          {
            label: "Avance promedio",
            value: `${promedioAvance}%`,
            icon: CheckCircle,
            color: "bg-green-50 text-green-600",
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
            <div className="text-gray-500 text-sm mt-0.5">{item.label}</div>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5 flex flex-col lg:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar por nombre, matrícula, carrera o proyecto..."
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
            <option value="Activo">Activo</option>
            <option value="Por evaluar">Por evaluar</option>
            <option value="Finalizado">Finalizado</option>
          </select>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-2">
          <Users className="w-5 h-5 text-[#1565c0]" />
          <h3 className="font-bold text-[#0d2b5e]">
            Lista de Alumnos Asignados
          </h3>
          <span className="ml-auto text-xs text-gray-400">
            {alumnosFiltrados.length} resultados
          </span>
        </div>

        <div className="divide-y divide-gray-100">
          {alumnosFiltrados.map((a) => {
            const avance = Math.round((a.horas / a.totalHoras) * 100);

            return (
              <div key={a.id} className="px-6 py-5 hover:bg-gray-50">
                <div className="flex flex-col xl:flex-row xl:items-center gap-5">
                  <div className="flex items-start gap-4 flex-1">
                    <div className="w-11 h-11 bg-[#e3f0ff] rounded-xl flex items-center justify-center text-[#1565c0] font-bold flex-shrink-0">
                      {a.nombre.charAt(0)}
                    </div>

                    <div className="flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <h4 className="font-bold text-gray-800 text-sm">
                          {a.nombre}
                        </h4>

                        <span
                          className={`text-xs px-3 py-1 rounded-full font-semibold ${
                            estadoColor[a.estado]
                          }`}
                        >
                          {a.estado}
                        </span>
                      </div>

                      <div className="text-xs text-gray-500 mt-1">
                        Matrícula: {a.matricula} · {a.carrera} · {a.semestre}
                      </div>

                      <div className="text-xs text-[#1565c0] mt-1 font-medium">
                        Proyecto: {a.proyecto}
                      </div>

                      <div className="grid md:grid-cols-2 gap-3 mt-3">
                        <div className="flex items-center gap-2 text-xs text-gray-500">
                          <FileText className="w-4 h-4 text-[#1565c0]" />
                          Asesor: {a.asesor}
                        </div>

                        <div className="flex items-center gap-2 text-xs text-gray-500">
                          <CalendarDays className="w-4 h-4 text-[#1565c0]" />
                          {a.inicio} — {a.fin}
                        </div>
                      </div>

                      <div className="mt-4">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs text-gray-500">
                            Avance de horas
                          </span>
                          <span className="text-xs font-semibold text-[#1565c0]">
                            {a.horas}/{a.totalHoras} hrs · {avance}%
                          </span>
                        </div>

                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-[#1565c0] h-2 rounded-full"
                            style={{ width: `${avance}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2 xl:flex-col xl:w-36">
                    <button className="flex items-center justify-center gap-2 px-4 py-2 bg-[#0d2b5e] text-white rounded-lg text-xs font-semibold hover:bg-[#1565c0] transition-colors">
                      <Eye className="w-3.5 h-3.5" />
                      Ver perfil
                    </button>

                    <button className="flex items-center justify-center gap-2 px-4 py-2 border border-gray-200 text-gray-600 rounded-lg text-xs font-semibold hover:bg-gray-50 transition-colors">
                      <Star className="w-3.5 h-3.5" />
                      Evaluar
                    </button>
                  </div>
                </div>
              </div>
            );
          })}

          {alumnosFiltrados.length === 0 && (
            <div className="px-6 py-10 text-center">
              <AlertCircle className="w-8 h-8 text-gray-300 mx-auto mb-2" />
              <div className="text-sm text-gray-500">
                No se encontraron alumnos con los filtros seleccionados.
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}