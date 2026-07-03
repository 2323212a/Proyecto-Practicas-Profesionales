import {
  Building2,
  FileText,
  Eye,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Briefcase,
  ClipboardList,
  User,
  Mail,
  Phone,
  MapPin,
} from "lucide-react";

const documentos = [
  ["Información de la empresa", "Validado"],
  ["Documento constitutivo", "Validado"],
  ["Constancia fiscal", "En revisión"],
  ["Comprobante de domicilio", "Observación"],
  ["Identificación del representante", "Validado"],
];

const vacantes = [
  ["Desarrollo Web", "2 vacantes", "Presencial"],
  ["Soporte Técnico", "1 vacante", "Híbrida"],
];

export function ExpedienteEmpresa() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[#0d2b5e]">
          Expediente de Empresa
        </h1>
        <p className="text-gray-500 text-sm mt-1">
          Revisión documental, convenio, vacantes y plan de trabajo de la unidad receptora.
        </p>
      </div>

      <div className="bg-[#0d2b5e] text-white rounded-2xl p-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-5">
          <div>
            <h2 className="text-xl font-bold">DevSolutions Chiapas</h2>
            <p className="text-blue-200 text-sm mt-1">
              Nueva afiliación · Solicitud recibida el 03 jun 2026
            </p>
          </div>

          <span className="bg-yellow-100 text-yellow-700 px-4 py-2 rounded-full text-sm font-semibold w-fit">
            En revisión
          </span>
        </div>

        <div className="grid md:grid-cols-4 gap-4 mt-6">
          {[
            ["Tipo", "Nueva afiliación", Building2],
            ["Convenio", "Pendiente", FileText],
            ["Vacantes", "3", Briefcase],
            ["Estado", "Documentación en revisión", ClipboardList],
          ].map(([label, value, Icon]: any) => (
            <div key={label} className="bg-white/10 rounded-xl p-4">
              <Icon className="w-5 h-5 text-blue-200 mb-2" />
              <div className="font-bold">{value}</div>
              <div className="text-blue-200 text-sm">{label}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
            <h3 className="font-bold text-[#0d2b5e] mb-5">
              Información general
            </h3>

            <div className="grid md:grid-cols-2 gap-4">
              {[
                ["Representante", "Ing. Marco Flores", User],
                ["Correo", "marco@dev.mx", Mail],
                ["Teléfono", "961 123 4567", Phone],
                ["Ubicación", "Tuxtla Gutiérrez, Chiapas", MapPin],
              ].map(([label, value, Icon]: any) => (
                <div key={label} className="border rounded-xl p-4 flex gap-3">
                  <Icon className="w-5 h-5 text-[#1565c0]" />
                  <div>
                    <p className="text-xs text-gray-500">{label}</p>
                    <p className="font-medium text-gray-800">{value}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
            <h3 className="font-bold text-[#0d2b5e] mb-5">
              Documentación empresarial
            </h3>

            <div className="space-y-3">
              {documentos.map(([doc, estado]) => (
                <div
                  key={doc}
                  className="border border-gray-200 rounded-xl p-4 flex flex-col md:flex-row md:items-center md:justify-between gap-3"
                >
                  <div className="flex items-center gap-3">
                    <FileText className="w-5 h-5 text-[#1565c0]" />
                    <div>
                      <p className="font-medium text-gray-800">{doc}</p>
                      <p className="text-xs text-gray-400">Archivo PDF cargado</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-semibold ${
                        estado === "Validado"
                          ? "bg-green-100 text-green-700"
                          : estado === "En revisión"
                            ? "bg-yellow-100 text-yellow-700"
                            : "bg-orange-100 text-orange-700"
                      }`}
                    >
                      {estado}
                    </span>

                    <button className="border border-blue-200 text-[#1565c0] rounded-lg px-3 py-1.5 text-xs font-semibold flex items-center gap-1">
                      <Eye className="w-3 h-3" />
                      Ver
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="grid lg:grid-cols-2 gap-6">
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
              <h3 className="font-bold text-[#0d2b5e] mb-5">
                Vacantes ofertadas
              </h3>

              <div className="space-y-3">
                {vacantes.map((v) => (
                  <div key={v[0]} className="border rounded-xl p-4">
                    <h4 className="font-semibold text-[#0d2b5e]">{v[0]}</h4>
                    <p className="text-sm text-gray-500 mt-1">
                      {v[1]} · Modalidad {v[2]}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
              <h3 className="font-bold text-[#0d2b5e] mb-5">
                Plan de trabajo
              </h3>

              <div className="space-y-3 text-sm text-gray-700">
                <p>• Desarrollo de módulos web internos.</p>
                <p>• Soporte técnico a usuarios.</p>
                <p>• Documentación de procesos digitales.</p>
                <p>• Participación en pruebas funcionales.</p>
              </div>

              <button className="mt-5 border border-blue-200 text-[#1565c0] rounded-xl px-4 py-2 text-sm font-semibold">
                Ver plan completo
              </button>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
            <h3 className="font-bold text-[#0d2b5e] mb-5">
              Observaciones
            </h3>

            <textarea
              className="w-full border rounded-xl p-3 text-sm min-h-32"
              defaultValue="El comprobante de domicilio requiere actualización. La constancia fiscal se encuentra en revisión."
            />

            <button className="mt-4 w-full border border-orange-200 text-orange-600 rounded-xl py-2 text-sm font-semibold">
              Registrar observación
            </button>
          </div>

          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
            <h3 className="font-bold text-[#0d2b5e] mb-5">
              Decisión del expediente
            </h3>

            <div className="space-y-3">
              <button className="w-full bg-green-600 text-white rounded-xl py-2 text-sm font-semibold flex items-center justify-center gap-2">
                <CheckCircle2 className="w-4 h-4" />
                Aprobar empresa
              </button>

              <button className="w-full border border-orange-200 text-orange-600 rounded-xl py-2 text-sm font-semibold flex items-center justify-center gap-2">
                <AlertTriangle className="w-4 h-4" />
                Solicitar corrección
              </button>

              <button className="w-full border border-red-200 text-red-600 rounded-xl py-2 text-sm font-semibold flex items-center justify-center gap-2">
                <XCircle className="w-4 h-4" />
                Rechazar solicitud
              </button>
            </div>

            <div className="mt-5 bg-blue-50 border border-blue-200 rounded-xl p-4">
              <p className="text-sm text-[#0d2b5e]">
                Si la empresa es aprobada, podrá continuar con el registro o actualización del convenio y posteriormente publicarse en el padrón.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}