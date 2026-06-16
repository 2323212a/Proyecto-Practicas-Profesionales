import {
  FileText,
  CalendarDays,
  CheckCircle,
  Clock,
  AlertCircle,
  Download,
  Eye,
  Building2,
  BadgeCheck,
  ShieldCheck,
} from "lucide-react";

export function ConveniosUnidad() {
  const convenios = [

    {
      id: 1,
      folio: "UN-2026-0021",
      nombre: "Convenio Específico de Prácticas Profesionales",
      tipo: "Convenio Específico",
      inicio: "01 mayo 2026",
      fin: "31 diciembre 2026",
      estado: "Vigente",
      responsable: "Dr. Roberto Méndez",
      archivo: "convenio_practicas_UN-2026-0021.pdf",
      descripcion:
        "Documento que permite la asignación de alumnos para realizar prácticas profesionales durante el periodo Mayo–Agosto 2026.",
    },
 
  ];

  const requisitos = [
    {
      nombre: "RFC de la empresa",
      estado: "Validado",
    },
    {
      nombre: "Identificación del representante legal",
      estado: "Validado",
    },
    {
      nombre: "Comprobante de domicilio",
      estado: "Validado",
    },
    {
      nombre: "Acta constitutiva",
      estado: "Validado",
    },
    {
      nombre: "Formato de registro de unidad receptora",
      estado: "Validado",
    },
  ];

  const proximosVencimientos = [
    {
      documento: "Carta de Intención de Colaboración",
      fecha: "15 marzo 2026",
      estado: "Requiere renovación",
    },
    {
      documento: "Convenio General de Colaboración",
      fecha: "31 diciembre 2026",
      estado: "Vigente",
    },
  ];

  const estadoColor: Record<string, string> = {
    Vigente: "bg-green-100 text-green-700",
    "Por renovar": "bg-yellow-100 text-yellow-700",
    Vencido: "bg-red-100 text-red-700",
  };

  const vigentes = convenios.filter((c) => c.estado === "Vigente").length;
  const porRenovar = convenios.filter((c) => c.estado === "Por renovar").length;
  const validados = requisitos.filter((r) => r.estado === "Validado").length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[#0d2b5e]">
          Convenios
        </h1>
        <p className="text-gray-500 text-sm mt-1">
          Consulta y seguimiento de convenios registrados con la unidad receptora.
        </p>
      </div>

      <div className="bg-gradient-to-r from-green-600 to-green-500 rounded-2xl p-6 text-white flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="font-bold text-xl">
            Convenios de TechSoft Chiapas S.A. de C.V.
          </div>
          <div className="text-green-100 text-sm mt-1">
            Unidad receptora certificada · Convenio activo hasta diciembre 2026
          </div>
        </div>

        <div className="bg-white/20 px-4 py-2 rounded-xl flex items-center gap-2">
          <BadgeCheck className="w-4 h-4" />
          <div className="text-white font-bold text-sm">REGISTRO VIGENTE</div>
        </div>
      </div>

      <div className="grid grid-cols-2 xl:grid-cols-4 gap-5">
        {[
          {
            label: "Convenios registrados",
            value: convenios.length,
            icon: FileText,
            color: "bg-blue-50 text-blue-600",
          },
          {
            label: "Convenios vigentes",
            value: vigentes,
            icon: CheckCircle,
            color: "bg-green-50 text-green-600",
          },
          {
            label: "Por renovar",
            value: porRenovar,
            icon: Clock,
            color: "bg-yellow-50 text-yellow-600",
          },
          {
            label: "Requisitos validados",
            value: `${validados}/${requisitos.length}`,
            icon: ShieldCheck,
            color: "bg-purple-50 text-purple-600",
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

      <div className="grid xl:grid-cols-3 gap-6">
        <div className="xl:col-span-2 bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-2">
            <FileText className="w-5 h-5 text-[#1565c0]" />
            <h3 className="font-bold text-[#0d2b5e]">
              Documentos de Convenio
            </h3>
          </div>

          <div className="divide-y divide-gray-100">
            {convenios.map((c) => (
              <div key={c.id} className="px-6 py-5 hover:bg-gray-50">
                <div className="flex flex-col xl:flex-row xl:items-center gap-5">
                  <div className="flex items-start gap-4 flex-1">
                    <div className="w-11 h-11 bg-[#e3f0ff] rounded-xl flex items-center justify-center flex-shrink-0">
                      <FileText className="w-5 h-5 text-[#1565c0]" />
                    </div>

                    <div className="flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <h4 className="font-bold text-gray-800 text-sm">
                          {c.nombre}
                        </h4>

                        <span
                          className={`text-xs px-3 py-1 rounded-full font-semibold ${
                            estadoColor[c.estado]
                          }`}
                        >
                          {c.estado}
                        </span>
                      </div>

                      <div className="text-xs text-gray-500 mt-1">
                        Folio: {c.folio} · Tipo: {c.tipo}
                      </div>

                      <p className="text-xs text-gray-500 mt-2 leading-relaxed">
                        {c.descripcion}
                      </p>

                      <div className="grid md:grid-cols-2 gap-3 mt-3">
                        <div className="flex items-center gap-2 text-xs text-gray-500">
                          <CalendarDays className="w-4 h-4 text-[#1565c0]" />
                          {c.inicio} — {c.fin}
                        </div>

                        <div className="flex items-center gap-2 text-xs text-gray-500">
                          <Building2 className="w-4 h-4 text-[#1565c0]" />
                          Validado por: {c.responsable}
                        </div>
                      </div>

                      <div className="text-xs text-[#1565c0] mt-2">
                        📎 {c.archivo}
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2 xl:flex-col xl:w-36">
                    <button className="flex items-center justify-center gap-2 px-4 py-2 bg-[#0d2b5e] text-white rounded-lg text-xs font-semibold hover:bg-[#1565c0] transition-colors">
                      <Eye className="w-3.5 h-3.5" />
                      Ver
                    </button>

                    <button className="flex items-center justify-center gap-2 px-4 py-2 border border-gray-200 text-gray-600 rounded-lg text-xs font-semibold hover:bg-gray-50 transition-colors">
                      <Download className="w-3.5 h-3.5" />
                      Descargar
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
            <h3 className="font-bold text-[#0d2b5e] mb-4">
              Requisitos Validados
            </h3>

            <div className="space-y-3">
              {requisitos.map((r) => (
                <div
                  key={r.nombre}
                  className="flex items-center justify-between p-3 rounded-xl border border-gray-100 hover:bg-gray-50"
                >
                  <div className="flex items-center gap-3">
                    <CheckCircle className="w-4 h-4 text-green-600" />
                    <span className="text-sm text-gray-700">{r.nombre}</span>
                  </div>

                  <span className="text-xs px-2.5 py-1 rounded-full font-semibold bg-green-100 text-green-700">
                    {r.estado}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
            <h3 className="font-bold text-[#0d2b5e] mb-4">
              Próximos Vencimientos
            </h3>

            <div className="space-y-3">
              {proximosVencimientos.map((v) => (
                <div
                  key={v.documento}
                  className="p-4 rounded-xl border border-gray-100 bg-gray-50"
                >
                  <div className="flex items-start gap-3">
                    {v.estado === "Requiere renovación" ? (
                      <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                    ) : (
                      <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                    )}

                    <div>
                      <div className="font-semibold text-sm text-gray-800">
                        {v.documento}
                      </div>

                      <div className="text-xs text-gray-500 mt-1">
                        Vence: {v.fecha}
                      </div>

                      <div
                        className={`text-xs font-semibold mt-2 ${
                          v.estado === "Requiere renovación"
                            ? "text-yellow-700"
                            : "text-green-700"
                        }`}
                      >
                        {v.estado}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <button className="mt-4 w-full py-2.5 bg-[#0d2b5e] text-white rounded-xl text-sm font-semibold hover:bg-[#1565c0] transition-colors">
              Solicitar renovación
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}