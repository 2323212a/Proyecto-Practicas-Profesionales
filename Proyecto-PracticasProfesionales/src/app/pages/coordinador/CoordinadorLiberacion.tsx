import { Search, Eye, FileText, AlertTriangle, CheckCircle } from "lucide-react";

const alumnos = [
  {
    nombre: "Miguel Torres Flores",
    matricula: "216E50234",
    carrera: "IA y Ciencia de Datos",
    empresa: "DataLab MX",
    horas: "480/480",
    reportes: "5/5",
    evidencias: "Completas",
    estado: "Listo para liberar",
  },
  {
    nombre: "Ana González Ruiz",
    matricula: "215D40189",
    carrera: "Arquitectura de Sistemas IA",
    empresa: "TechSoft Chiapas",
    horas: "460/480",
    reportes: "5/5",
    evidencias: "En revisión",
    estado: "En revisión",
  },
  {
    nombre: "Brayan Madain Hernandez",
    matricula: "214I90678",
    carrera: "Desarrollo y Tec. Software",
    empresa: "Innovatek",
    horas: "430/480",
    reportes: "4/5",
    evidencias: "Pendientes",
    estado: "Pendiente",
  },
];

export function CoordinadorLiberacion() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-[#0d2b5e]">
          Liberación de Prácticas
        </h1>

        <p className="text-gray-500 mt-1">
          Revisión final del expediente antes de concluir las prácticas
          profesionales.
        </p>
      </div>

      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5">
        <div className="grid md:grid-cols-4 gap-4">
          <select className="border rounded-xl px-4 py-3">
            <option>Convocatoria Verano 2026</option>
          </select>

          <select className="border rounded-xl px-4 py-3">
            <option>Todos los estados</option>
            <option>Listo para liberar</option>
            <option>En revisión</option>
            <option>Pendiente</option>
          </select>

          <select className="border rounded-xl px-4 py-3">
            <option>Todas las empresas</option>
          </select>

          <div className="relative">
            <Search className="absolute left-3 top-3.5 w-4 h-4 text-gray-400" />

            <input
              placeholder="Buscar alumno..."
              className="w-full border rounded-xl pl-10 pr-4 py-3"
            />
          </div>
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-4">
        <div className="bg-green-50 border border-green-200 rounded-2xl p-5">
          <p className="text-sm text-gray-600">
            Listos para liberar
          </p>

          <p className="text-3xl font-bold text-green-700 mt-2">
            18
          </p>
        </div>

        <div className="bg-yellow-50 border border-yellow-200 rounded-2xl p-5">
          <p className="text-sm text-gray-600">
            En revisión
          </p>

          <p className="text-3xl font-bold text-yellow-700 mt-2">
            9
          </p>
        </div>

        <div className="bg-orange-50 border border-orange-200 rounded-2xl p-5">
          <p className="text-sm text-gray-600">
            Pendientes
          </p>

          <p className="text-3xl font-bold text-orange-700 mt-2">
            6
          </p>
        </div>
      </div>

      <div className="space-y-4">
        {alumnos.map((a) => (
          <div
            key={a.matricula}
            className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm"
          >
            <div className="flex items-start justify-between">
              <div>
                <h3 className="font-bold text-lg text-[#0d2b5e]">
                  {a.nombre}
                </h3>

                <p className="text-sm text-gray-500">
                  {a.carrera}
                </p>

                <p className="text-sm text-gray-400">
                  {a.empresa}
                </p>
              </div>

              <span
                className={`px-3 py-1 rounded-full text-xs font-semibold ${
                  a.estado === "Listo para liberar"
                    ? "bg-green-100 text-green-700"
                    : a.estado === "En revisión"
                    ? "bg-yellow-100 text-yellow-700"
                    : "bg-orange-100 text-orange-700"
                }`}
              >
                {a.estado}
              </span>
            </div>

            <div className="grid md:grid-cols-3 gap-4 mt-5">
              <div className="border rounded-xl p-4">
                <p className="text-xs text-gray-500">
                  Horas registradas
                </p>

                <p className="text-2xl font-bold text-[#0d2b5e] mt-1">
                  {a.horas}
                </p>
              </div>

              <div className="border rounded-xl p-4">
                <p className="text-xs text-gray-500">
                  Reportes entregados
                </p>

                <p className="text-2xl font-bold text-[#0d2b5e] mt-1">
                  {a.reportes}
                </p>
              </div>

              <div className="border rounded-xl p-4">
                <p className="text-xs text-gray-500">
                  Evidencias finales
                </p>

                <p className="text-2xl font-bold text-[#0d2b5e] mt-1">
                  {a.evidencias}
                </p>
              </div>
            </div>

            <div className="flex flex-wrap gap-3 mt-5">
              <button className="border border-blue-200 text-[#1565c0] rounded-xl px-4 py-2 text-sm font-semibold flex items-center gap-2">
                <Eye className="w-4 h-4" />
                Revisar expediente
              </button>

              <button className="border border-purple-200 text-purple-600 rounded-xl px-4 py-2 text-sm font-semibold flex items-center gap-2">
                <FileText className="w-4 h-4" />
                Ver documentos finales
              </button>

              <button className="border border-orange-200 text-orange-600 rounded-xl px-4 py-2 text-sm font-semibold flex items-center gap-2">
                <AlertTriangle className="w-4 h-4" />
                Solicitar corrección
              </button>

              {a.estado === "Listo para liberar" && (
                <>
                  <button className="bg-green-600 text-white rounded-xl px-4 py-2 text-sm font-semibold flex items-center gap-2">
                    <CheckCircle className="w-4 h-4" />
                    Liberar prácticas
                  </button>

                  <button className="border border-green-200 text-green-700 rounded-xl px-4 py-2 text-sm font-semibold">
                    Generar constancia
                  </button>
                </>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}