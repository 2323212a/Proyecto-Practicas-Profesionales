import {
  User,
  Mail,
  GraduationCap,
  School,
  Building2,
  UserCheck,
  Calendar,
  BadgeCheck,
} from "lucide-react";

export function AlumnoPerfil() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[#0d2b5e]">
          Mi Perfil
        </h1>

        <p className="text-gray-500 text-sm mt-1">
          Información personal, académica y estado actual dentro
          del programa de prácticas profesionales.
        </p>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
          <div className="flex flex-col items-center">
            <div className="w-24 h-24 rounded-full bg-[#0d2b5e] flex items-center justify-center text-white">
              <User className="w-12 h-12" />
            </div>

            <h2 className="mt-4 text-xl font-bold text-[#0d2b5e]">
              Brayan Madain
            </h2>

            <p className="text-gray-500 text-sm">
              Ingeniería en Desarrollo y Tecnologías de Software
            </p>
          </div>

          <div className="mt-6 space-y-4">
            <div className="flex items-center gap-3">
              <Mail className="w-4 h-4 text-[#1565c0]" />
              <span className="text-sm">brayan@unach.mx</span>
            </div>

            <div className="flex items-center gap-3">
              <GraduationCap className="w-4 h-4 text-[#1565c0]" />
              <span className="text-sm">
                Matrícula: A220394
              </span>
            </div>

            <div className="flex items-center gap-3">
              <School className="w-4 h-4 text-[#1565c0]" />
              <span className="text-sm">ETDA C-I</span>
            </div>
          </div>
        </div>

        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
            <h3 className="font-bold text-[#0d2b5e] mb-4">
              Información Académica
            </h3>

            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-gray-500">Carrera</p>
                <p className="font-medium">
                  Ingeniería en Desarrollo y Tecnologías de
                  Software
                </p>
              </div>

              <div>
                <p className="text-xs text-gray-500">
                  Semestre
                </p>
                <p className="font-medium">8° Semestre</p>
              </div>

              <div>
                <p className="text-xs text-gray-500">
                  Tutor Académico
                </p>
                <p className="font-medium">Dr. Juan Pérez</p>
              </div>

              <div>
                <p className="text-xs text-gray-500">
                  Estado Académico
                </p>
                <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-xs">
                  Alumno Regular
                </span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
            <h3 className="font-bold text-[#0d2b5e] mb-4">
              Información de Prácticas
            </h3>

            <div className="grid md:grid-cols-2 gap-4">
              <div className="flex items-center gap-3">
                <Building2 className="w-5 h-5 text-[#1565c0]" />
                <div>
                  <p className="text-xs text-gray-500">
                    Empresa Asignada
                  </p>
                  <p className="font-medium">
                    Pendiente de asignación
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <UserCheck className="w-5 h-5 text-[#1565c0]" />
                <div>
                  <p className="text-xs text-gray-500">
                    Responsable
                  </p>
                  <p className="font-medium">No asignado</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <Calendar className="w-5 h-5 text-[#1565c0]" />
                <div>
                  <p className="text-xs text-gray-500">
                    Periodo
                  </p>
                  <p className="font-medium">Verano 2026</p>
                </div>
              </div>

              <div>
                <p className="text-xs text-gray-500">Estado</p>
                <span className="bg-yellow-100 text-yellow-700 px-3 py-1 rounded-full text-xs">
                  En proceso de asignación
                </span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
            <h3 className="font-bold text-[#0d2b5e] mb-4">
              Estado General
            </h3>

            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <BadgeCheck className="w-5 h-5 text-green-600" />
                <span>Cuenta institucional activa</span>
              </div>

              <div className="flex items-center gap-3">
                <BadgeCheck className="w-5 h-5 text-green-600" />
                <span>
                  Elegible para prácticas profesionales
                </span>
              </div>

              <div className="flex items-center gap-3">
                <BadgeCheck className="w-5 h-5 text-green-600" />
                <span>Sin incidencias registradas</span>
              </div>
            </div>

            <div className="mt-5 bg-blue-50 border border-blue-200 rounded-xl p-4">
              <p className="text-sm text-[#0d2b5e]">
                Actualmente el alumno se encuentra en espera de
                asignación de empresa receptora para iniciar el
                proceso de prácticas profesionales.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}