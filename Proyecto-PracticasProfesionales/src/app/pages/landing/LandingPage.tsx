import { useNavigate } from "react-router";
import {
  GraduationCap,
  Building2,
  FileText,
  Bell,
  ChevronRight,
  Calendar,
  BookOpen,
  Users,
  Award,
} from "lucide-react";
import unachlogo from "./unachlogo1.JPG";

export function LandingPage() {
  const navigate = useNavigate();
  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-[#0d2b5e] shadow-lg">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
             <div className="w-9 h-9 bg-white rounded-xl flex items-center justify-center flex-shrink-0 overflow-hidden">
  <img
    src={unachlogo}
    alt="UNACH"
    className="w-full h-full object-contain"
  />
</div>
            <div>
              <div className="text-white font-bold text-lg leading-tight">
                UNACH
              </div>
              <div className="text-blue-200 text-xs">
                Universidad Autónoma de Chiapas
              </div>
            </div>
          </div>
          <div className="hidden md:block text-white font-semibold text-base">
            Sistema Integral de Prácticas Profesionales
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => navigate("/login")}
              className="px-5 py-2 bg-[#1565c0] text-white rounded-lg hover:bg-[#1976d2] transition-colors font-medium text-sm shadow"
            >
              Iniciar Sesión
            </button>
          </div>
        </div>
      </nav>

      <div className="bg-gradient-to-br from-[#0d2b5e] via-[#1565c0] to-[#1976d2] text-white py-20 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="max-w-3xl">
            <div className="inline-block bg-white/20 text-white text-xs font-semibold px-4 py-1 rounded-full mb-6 uppercase tracking-wider">
              Ciclo Escolar 2026–2027
            </div>
            <h1 className="text-4xl md:text-5xl font-bold leading-tight mb-6">
              Sistema Integral de
              <br />
              <span className="text-blue-200">
                Prácticas Profesionales
              </span>
            </h1>
            <p className="text-blue-100 text-lg mb-8 leading-relaxed max-w-2xl">
              Plataforma institucional para la gestión,
              seguimiento y control de las prácticas
              profesionales de los estudiantes de la Universidad
              Autónoma de Chiapas.
            </p>
            <div className="flex flex-wrap gap-4">
              <button
                onClick={() => navigate("/login")}
                className="px-8 py-3 bg-white text-[#0d2b5e] rounded-xl font-bold hover:bg-blue-50 transition-colors shadow-lg"
              >
                Acceder al Sistema
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-12 flex flex-col lg:flex-row gap-8">
        <div className="flex-1">
          <h2 className="text-2xl font-bold text-[#0d2b5e] mb-6">
            Convocatorias Activas
          </h2>
          <div className="grid md:grid-cols-2 gap-6 mb-10">
            {[
              {
                t: "Prácticas Profesionales - Modalidad Cuatrimestral",
                p: "Mayo – Agosto 2026",
                d: "Cierre: 15 de abril 2026",
                s: "Activa",
                c: "bg-green-500",
              },
              {
                t: "Prácticas Profesionales - Modalidad Semestral",
                p: "Agosto – Diciembre 2026",
                d: "Cierre: 31 de julio 2026",
                s: "Próxima",
                c: "bg-blue-500",
              },
            ].map((c) => (
              <div
                key={c.t}
                className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden hover:shadow-md transition-shadow"
              >
                <div className={`${c.c} h-2`} />
                <div className="p-6">
                  <div className="flex items-start justify-between mb-3">
                    <h3 className="font-bold text-[#0d2b5e] text-lg leading-tight">
                      {c.t}
                    </h3>
                    <span
                      className={`text-xs px-3 py-1 rounded-full font-semibold ${c.s === "Activa" ? "bg-green-100 text-green-700" : "bg-blue-100 text-blue-700"}`}
                    >
                      {c.s}
                    </span>
                  </div>
                  <div className="text-gray-500 text-sm flex items-center gap-2">
                    <Calendar className="w-3.5 h-3.5" />
                    {c.p}
                  </div>
                  <div className="text-red-500 text-xs font-medium mt-2">
                    {c.d}
                  </div>
                  <button className="mt-4 w-full py-2 bg-[#0d2b5e] text-white rounded-lg text-sm font-medium hover:bg-[#1565c0] transition-colors flex items-center justify-center gap-2">
                    Ver detalles{" "}
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>

       

          <h2 className="text-2xl font-bold text-[#0d2b5e] mb-6">
            Fechas Importantes
          </h2>
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="bg-[#0d2b5e] text-white px-6 py-4 flex items-center gap-2">
              <Calendar className="w-5 h-5" />
              <span className="font-semibold">
                Calendario Oficial 2026
              </span>
            </div>
            <div className="divide-y divide-gray-100">
              {[
                {
                  d: "15 Abr",
                  e: "Cierre de registro Cuatrimestral 2026",
                  s: "Activo",
                },
                {
                  d: "01 May",
                  e: "Inicio de prácticas en perido Cuatrimestral 2026",
                  s: "Activo",
                },
                {
                  d: "15 Jun",
                  e: "Entrega de reporte parcial 1",
                  s: "Próximo",
                },
                {
                  d: "15 Ago",
                  e: "Cierre de registro Semestral 2026",
                  s: "Próximo",
                },
                {
                  d: "15 Diciembre",
                  e: "Fin de prácticas Semestrales 2026",
                  s: "Próximo",
                },
                {
                  d: "20 Ago",
                  e: "Entrega de reporte final Cuatrimestral",
                  s: "Próximo",
                },
              ].map((f) => (
                <div
                  key={f.e}
                  className="px-6 py-4 flex items-center justify-between hover:bg-gray-50"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-14 text-center">
                      <div className="font-bold text-[#0d2b5e] text-sm">
                        {f.d}
                      </div>
                    </div>
                    <div className="text-gray-700 text-sm">
                      {f.e}
                    </div>
                  </div>
                  <span
                    className={`text-xs px-3 py-1 rounded-full font-semibold ${f.s === "Activo" ? "bg-green-100 text-green-600" : "bg-blue-100 text-blue-600"}`}
                  >
                    {f.s}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="w-full lg:w-80 space-y-6">
          {[
            {
              I: (
                <GraduationCap className="w-6 h-6 text-[#1565c0]" />
              ),
              t: "ALUMNO",
              d: "Gestiona tu proceso de prácticas de forma digital. Sube documentos, consulta el estado de tu expediente.",
              e: (
                <div className="text-xs text-gray-500 mt-2">
                  <span className="font-semibold">
                    Requisitos:
                  </span>{" "}
                  Haber cursado el 70% de créditos y estar al
                  corriente en pagos.
                </div>
              ),
              b: "Iniciar Documentación",
              p: "/login",
              c: "bg-[#0d2b5e]",
            },
            {
              I: (
                <Building2 className="w-6 h-6 text-green-600" />
              ),
              t: "EMPRESA NUEVA",
              d: "¿Tu organización desea recibir practicantes? Registra tu empresa y publica ofertas para alumnos UNACH.",
              e: (
                <div className="text-xs text-green-700 bg-green-50 px-3 py-2 rounded-lg mt-2 font-medium">
                  ✓ Convocatoria Verano 2026 activa
                </div>
              ),
              b: "Registrar Unidad",
              p: "/unidad/registro",
              c: "bg-green-600",
            },
            {
              I: (
                <FileText className="w-6 h-6 text-orange-500" />
              ),
              t: "ACTUALIZACIÓN DE DATOS",
              d: "¿Ya estás registrado pero necesitas actualizar tu información? Solicita la actualización de forma segura.",
              e: (
                <div className="text-xs text-orange-700 bg-orange-50 px-3 py-2 rounded-lg mt-2">
                  La actualización requiere autorización del
                  coordinador.
                </div>
              ),
              b: "Actualizar Datos",
              p: "/login",
              c: "bg-orange-500",
            },
          ].map((s) => (
            <div
              key={s.t}
              className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6"
            >
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 bg-gray-100 rounded-xl flex items-center justify-center">
                  {s.I}
                </div>
                <h3 className="font-bold text-[#0d2b5e] text-sm tracking-wide">
                  {s.t}
                </h3>
              </div>
              <p className="text-gray-600 text-xs leading-relaxed">
                {s.d}
              </p>
              {s.e}
              <button
                onClick={() => navigate(s.p)}
                className={`mt-4 w-full py-2.5 ${s.c} text-white rounded-xl text-sm font-semibold hover:opacity-90 transition-opacity`}
              >
                {s.b}
              </button>
            </div>
          ))}
      
        </div>
      </div>

      <footer className="bg-[#0d2b5e] text-white mt-8 py-10 px-6">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between gap-6">
          <div>
            <div className="flex items-center gap-3 mb-3">
              <GraduationCap className="w-8 h-8" />
              <div>
                <div className="font-bold text-lg">UNACH</div>
                <div className="text-blue-300 text-xs">
                  Universidad Autónoma de Chiapas
                </div>
              </div>
            </div>
            <p className="text-blue-200 text-sm">
              Sistema Integral de Prácticas Profesionales ©
              2026
            </p>
          </div>
          <div className="text-blue-300 text-sm">
            <div className="font-semibold text-white mb-2">
              Soporte Técnico
            </div>
            <div>practicas@unach.mx</div>
            <div>(961) 619-1200</div>
          </div>
        </div>
      </footer>
    </div>
  );
}