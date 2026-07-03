import {
  Building2,
  Mail,
  Phone,
  MapPin,
  FileText,
  CalendarDays,
  CheckCircle,
  User,
  Briefcase,
  Globe,
  BadgeCheck,
} from "lucide-react";

export function PerfilEmpresa() {
  const datosEmpresa = [
    {
      label: "Razón Social",
      value: "TechSoft Chiapas S.A. de C.V.",
      icon: Building2,
    },
    {
      label: "RFC",
      value: "TCH240101AB8",
      icon: FileText,
    },
    {
      label: "Correo",
      value: "contacto@techsoftchiapas.mx",
      icon: Mail,
    },
    {
      label: "Teléfono",
      value: "(961) 123 4567",
      icon: Phone,
    },
    {
      label: "Dirección",
      value: "Blvd. Belisario Domínguez #2045, Tuxtla Gutiérrez, Chiapas",
      icon: MapPin,
    },
    {
      label: "Sitio Web",
      value: "www.techsoftchiapas.mx",
      icon: Globe,
    },
  ];

  const responsables = [
    {
      nombre: "Ing. Alejandro Méndez Ruiz",
      puesto: "Representante Legal",
      correo: "alejandro.mendez@techsoftchiapas.mx",
    },
    {
      nombre: "Lic. Fernanda Torres Gómez",
      puesto: "Responsable de Prácticas",
      correo: "fernanda.torres@techsoftchiapas.mx",
    },
    {
      nombre: "Mtro. Daniel Pérez Castillo",
      puesto: "Supervisor Técnico",
      correo: "daniel.perez@techsoftchiapas.mx",
    },
  ];

  const areas = [
    "Desarrollo Web",
    "Bases de Datos",
    "Soporte Técnico",
    "Análisis de Datos",
    "Automatización de Procesos",
    "Documentación Técnica",
  ];

  const convenios = [
    {
      folio: "UN-2024-0089",
      tipo: "Convenio General",
      inicio: "01 enero 2024",
      fin: "31 diciembre 2026",
      estado: "Vigente",
    },
    {
      folio: "UN-2026-0021",
      tipo: "Convenio Específico de Prácticas",
      inicio: "01 mayo 2026",
      fin: "31 diciembre 2026",
      estado: "Vigente",
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[#0d2b5e]">
          Perfil de Empresa
        </h1>
        <p className="text-gray-500 text-sm mt-1">
          Información general de la unidad receptora registrada en el sistema.
        </p>
      </div>

      <div className="bg-gradient-to-r from-green-600 to-green-500 rounded-2xl p-6 text-white flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center">
            <Building2 className="w-9 h-9 text-white" />
          </div>

          <div>
            <div className="font-bold text-xl">
              TechSoft Chiapas S.A. de C.V.
            </div>
            <div className="text-green-100 text-sm mt-1">
              Empresa certificada como Unidad Receptora UNACH
            </div>
            <div className="text-green-100 text-xs mt-1">
              Giro: Desarrollo de software y consultoría tecnológica
            </div>
          </div>
        </div>

        <div className="bg-white/20 px-4 py-2 rounded-xl flex items-center gap-2">
          <BadgeCheck className="w-4 h-4" />
          <div className="text-white font-bold text-sm">CERTIFICADA</div>
        </div>
      </div>

      <div className="grid grid-cols-2 xl:grid-cols-4 gap-5">
        {[
          {
            label: "Estado",
            value: "Activa",
            icon: CheckCircle,
            color: "bg-green-50 text-green-600",
          },
          {
            label: "Alumnos asignados",
            value: "6",
            icon: User,
            color: "bg-blue-50 text-blue-600",
          },
          {
            label: "Convenios vigentes",
            value: "1",
            icon: FileText,
            color: "bg-purple-50 text-purple-600",
          },
          {
            label: "Planes disponibles",
            value: "3",
            icon: Briefcase,
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
            <div className="text-gray-500 text-sm mt-0.5">{item.label}</div>
          </div>
        ))}
      </div>

      <div className="grid xl:grid-cols-3 gap-6">
        <div className="xl:col-span-2 bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
          <h3 className="font-bold text-[#0d2b5e] mb-4">
            Datos Generales
          </h3>

          <div className="grid md:grid-cols-2 gap-4">
            {datosEmpresa.map((d) => (
              <div
                key={d.label}
                className="p-4 rounded-xl border border-gray-100 bg-gray-50"
              >
                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 bg-[#e3f0ff] rounded-lg flex items-center justify-center flex-shrink-0">
                    <d.icon className="w-4 h-4 text-[#1565c0]" />
                  </div>

                  <div>
                    <div className="text-xs text-gray-400 font-medium">
                      {d.label}
                    </div>
                    <div className="text-sm text-gray-800 font-semibold mt-0.5">
                      {d.value}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
          <h3 className="font-bold text-[#0d2b5e] mb-4">
            Estado del Registro
          </h3>

          <div className="space-y-4">
            <div className="p-4 rounded-xl bg-green-50 border border-green-100">
              <div className="flex items-center gap-2 text-green-700 font-semibold text-sm">
                <CheckCircle className="w-4 h-4" />
                Registro aprobado
              </div>
              <p className="text-xs text-green-600 mt-2 leading-relaxed">
                La empresa fue validada por la coordinación de unidades
                receptoras y puede recibir alumnos para prácticas profesionales.
              </p>
            </div>

            <div>
              <div className="text-xs text-gray-400 mb-1">
                Fecha de aprobación
              </div>
              <div className="text-sm font-semibold text-gray-700">
                12 enero 2026
              </div>
            </div>

            <div>
              <div className="text-xs text-gray-400 mb-1">
                Responsable de validación
              </div>
              <div className="text-sm font-semibold text-gray-700">
                Lic. Ana Torres
              </div>
            </div>

            <button className="w-full py-2.5 bg-[#0d2b5e] text-white rounded-xl text-sm font-semibold hover:bg-[#1565c0] transition-colors">
              Solicitar actualización
            </button>
          </div>
        </div>
      </div>

      <div className="grid xl:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
          <h3 className="font-bold text-[#0d2b5e] mb-4">
            Responsables de la Empresa
          </h3>

          <div className="space-y-3">
            {responsables.map((r) => (
              <div
                key={r.correo}
                className="p-4 rounded-xl border border-gray-100 hover:bg-gray-50"
              >
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 bg-[#e3f0ff] rounded-xl flex items-center justify-center text-[#1565c0] font-bold">
                    {r.nombre.charAt(0)}
                  </div>

                  <div>
                    <div className="font-semibold text-sm text-gray-800">
                      {r.nombre}
                    </div>
                    <div className="text-xs text-gray-500 mt-0.5">
                      {r.puesto}
                    </div>
                    <div className="text-xs text-[#1565c0] mt-1">
                      {r.correo}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
          <h3 className="font-bold text-[#0d2b5e] mb-4">
            Áreas Disponibles para Prácticas
          </h3>

          <div className="grid sm:grid-cols-2 gap-3">
            {areas.map((area) => (
              <div
                key={area}
                className="p-3 rounded-xl bg-blue-50 border border-blue-100 text-sm text-[#0d2b5e] font-semibold"
              >
                {area}
              </div>
            ))}
          </div>

          <div className="mt-5 p-4 rounded-xl bg-gray-50 border border-gray-100">
            <div className="font-semibold text-sm text-gray-800">
              Cupo disponible
            </div>
            <p className="text-xs text-gray-500 mt-1">
              La unidad receptora puede recibir hasta 8 alumnos durante el
              periodo Mayo–Agosto 2026.
            </p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-2">
          <FileText className="w-5 h-5 text-[#1565c0]" />
          <h3 className="font-bold text-[#0d2b5e]">
            Convenios Registrados
          </h3>
        </div>

        <div className="divide-y divide-gray-100">
          {convenios.map((c) => (
            <div
              key={c.folio}
              className="px-6 py-5 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-gray-50"
            >
              <div>
                <div className="font-semibold text-sm text-gray-800">
                  {c.tipo}
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  Folio: {c.folio}
                </div>
                <div className="text-xs text-gray-400 mt-1 flex items-center gap-1">
                  <CalendarDays className="w-3.5 h-3.5" />
                  {c.inicio} — {c.fin}
                </div>
              </div>

              <span className="w-fit text-xs px-3 py-1 rounded-full font-semibold bg-green-100 text-green-700">
                {c.estado}
              </span>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
        <h3 className="font-bold text-[#0d2b5e] mb-4">
          Descripción de la Empresa
        </h3>

        <p className="text-sm text-gray-600 leading-relaxed">
          TechSoft Chiapas S.A. de C.V. es una empresa dedicada al desarrollo de
          software, diseño de soluciones empresariales, automatización de
          procesos y consultoría tecnológica. Como unidad receptora, participa
          en el programa de prácticas profesionales de la Universidad Autónoma
          de Chiapas ofreciendo espacios formativos para estudiantes de áreas
          relacionadas con desarrollo de software, análisis de datos, soporte
          técnico y documentación de sistemas.
        </p>
      </div>
    </div>
  );
}