import {
  Upload,
  Database,
  GraduationCap,
  CalendarDays,
  CheckCircle2,
  AlertTriangle,
  FileSpreadsheet,
  Settings,
} from "lucide-react";

const catalogos = [
  {
    titulo: "Carreras",
    descripcion: "Catálogo de programas educativos de la ETDA C-I.",
    registros: 5,
    icono: GraduationCap,
  },
  {
    titulo: "Convocatorias",
    descripcion: "Periodos activos e históricos de prácticas profesionales.",
    registros: 3,
    icono: CalendarDays,
  },
  {
    titulo: "Estados del proceso",
    descripcion: "Estados utilizados para clasificar alumnos y prácticas.",
    registros: 6,
    icono: Settings,
  },
];

const carreras = [
  "Sistemas Computacionales",
  "Ing. en Semiconductores",
  "IA y Ciencia de Datos",
  "Arquitectura de Sistemas IA",
  "Desarrollo y Tec. Software",
];

export function AdminCatalogos() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[#0d2b5e]">
          Catálogos
        </h1>
        <p className="text-gray-500 text-sm mt-1">
          Administración de catálogos base y carga masiva de alumnos al sistema.
        </p>
      </div>

      <div className="grid md:grid-cols-3 gap-4">
        {[
          ["Alumnos importados", "844", Database, "bg-blue-600"],
          ["Registros válidos", "832", CheckCircle2, "bg-green-600"],
          ["Registros con error", "12", AlertTriangle, "bg-orange-500"],
        ].map(([titulo, valor, Icon, color]: any) => (
          <div key={titulo} className={`${color} rounded-2xl p-5 text-white`}>
            <Icon className="w-7 h-7 mb-3 opacity-80" />
            <div className="text-2xl font-bold">{valor}</div>
            <div className="text-white/80 text-sm">{titulo}</div>
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
          <h3 className="font-bold text-[#0d2b5e] mb-2">
            Carga masiva de alumnos
          </h3>
          <p className="text-sm text-gray-500 mb-5">
            Importa alumnos desde un archivo Excel o CSV y valida que coincidan con los campos de la base de datos.
          </p>

          <div className="border-2 border-dashed border-blue-200 rounded-2xl p-8 text-center bg-blue-50/40">
            <FileSpreadsheet className="w-12 h-12 text-[#1565c0] mx-auto mb-3" />

            <h4 className="font-bold text-[#0d2b5e]">
              Seleccionar archivo de alumnos
            </h4>

            <p className="text-sm text-gray-500 mt-1">
              Formatos permitidos: .xlsx, .csv
            </p>

            <button className="mt-5 bg-[#1565c0] text-white rounded-xl px-5 py-2 text-sm font-semibold inline-flex items-center gap-2">
              <Upload className="w-4 h-4" />
              Subir archivo
            </button>
          </div>

          <div className="mt-6 grid md:grid-cols-3 gap-4">
            <button className="border rounded-xl p-4 text-left hover:bg-blue-50">
              <h4 className="font-semibold text-[#0d2b5e]">
                1. Validar archivo
              </h4>
              <p className="text-sm text-gray-500 mt-1">
                Revisa columnas, matrícula, correo y carrera.
              </p>
            </button>

            <button className="border rounded-xl p-4 text-left hover:bg-blue-50">
              <h4 className="font-semibold text-[#0d2b5e]">
                2. Corregir errores
              </h4>
              <p className="text-sm text-gray-500 mt-1">
                Marca registros incompletos o duplicados.
              </p>
            </button>

            <button className="border rounded-xl p-4 text-left hover:bg-blue-50">
              <h4 className="font-semibold text-[#0d2b5e]">
                3. Importar alumnos
              </h4>
              <p className="text-sm text-gray-500 mt-1">
                Guarda los registros en la base de datos.
              </p>
            </button>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
          <h3 className="font-bold text-[#0d2b5e] mb-4">
            Campos requeridos
          </h3>

          <div className="space-y-3">
            {[
              "Matrícula",
              "Nombre completo",
              "Correo institucional",
              "Carrera",
              "Semestre",
              "Grupo",
              "Estado",
            ].map((campo) => (
              <div key={campo} className="flex items-center gap-2 text-sm">
                <CheckCircle2 className="w-4 h-4 text-green-600" />
                <span className="text-gray-700">{campo}</span>
              </div>
            ))}
          </div>

          <div className="mt-5 bg-orange-50 border border-orange-200 rounded-xl p-4">
            <p className="text-sm text-orange-700">
              Si existen conflictos con la base de datos, se debe verificar que la información coincida con los atributos esperados.
            </p>
          </div>
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-5">
        {catalogos.map((cat) => (
          <div
            key={cat.titulo}
            className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm"
          >
            <cat.icono className="w-9 h-9 text-[#1565c0] mb-4" />

            <h3 className="font-bold text-[#0d2b5e]">
              {cat.titulo}
            </h3>

            <p className="text-sm text-gray-500 mt-2">
              {cat.descripcion}
            </p>

            <div className="mt-4 text-sm font-semibold text-[#1565c0]">
              {cat.registros} registros
            </div>

            <button className="mt-5 w-full border border-blue-200 text-[#1565c0] rounded-xl py-2 text-sm font-semibold">
              Administrar
            </button>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
        <h3 className="font-bold text-[#0d2b5e] mb-5">
          Carreras registradas
        </h3>

        <div className="grid md:grid-cols-2 gap-3">
          {carreras.map((carrera) => (
            <div
              key={carrera}
              className="border rounded-xl px-4 py-3 text-sm text-gray-700 flex items-center justify-between"
            >
              <span>{carrera}</span>
              <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-xs">
                Activa
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}