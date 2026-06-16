import { useState } from "react";
import {
  Building2,
  Search,
  MapPin,
  Briefcase,
  Eye,
  CheckCircle2,
  Save,
  X,
  AlertTriangle,
  Star,
} from "lucide-react";

const empresas = [
  {
    id: 1,
    nombre: "TechSoft Chiapas",
    area: "Desarrollo Web",
    modalidad: "Presencial",
    ubicacion: "Tuxtla Gutiérrez",
    vacantes: 6,
    horario: "08:00 - 14:00",
    disponible: true,
    plan: [
      "Desarrollo de módulos web",
      "Pruebas funcionales",
      "Documentación técnica",
    ],
  },
  {
    id: 2,
    nombre: "DataLab MX",
    area: "IA y Ciencia de Datos",
    modalidad: "Híbrida",
    ubicacion: "Tuxtla Gutiérrez",
    vacantes: 4,
    horario: "09:00 - 15:00",
    disponible: true,
    plan: [
      "Limpieza de datos",
      "Análisis estadístico",
      "Visualización de información",
    ],
  },
  {
    id: 3,
    nombre: "Innovatek",
    area: "Software Empresarial",
    modalidad: "Presencial",
    ubicacion: "Tuxtla Gutiérrez",
    vacantes: 3,
    horario: "08:00 - 14:00",
    disponible: true,
    plan: [
      "Mantenimiento de sistemas",
      "Soporte a usuarios",
      "Pruebas de software",
    ],
  },
  {
    id: 4,
    nombre: "Chiapas Digital",
    area: "Soporte Tecnológico",
    modalidad: "Híbrida",
    ubicacion: "Tuxtla Gutiérrez",
    vacantes: 5,
    horario: "10:00 - 16:00",
    disponible: true,
    plan: [
      "Atención a usuarios",
      "Instalación de software",
      "Documentación de incidencias",
    ],
  },
  {
    id: 5,
    nombre: "Soluciones del Sureste",
    area: "Desarrollo de Software",
    modalidad: "Presencial",
    ubicacion: "Tuxtla Gutiérrez",
    vacantes: 0,
    horario: "09:00 - 15:00",
    disponible: false,
    plan: [
      "Desarrollo de aplicaciones internas",
      "Soporte a sistemas empresariales",
      "Documentación de procesos",
    ],
  },
];

export function PadronEmpresarial() {
  const [seleccionadas, setSeleccionadas] = useState<number[]>([1, 2]);
  const [detalle, setDetalle] = useState<(typeof empresas)[0] | null>(null);
  const [empresaPriorizada, setEmpresaPriorizada] = useState<number | null>(
    null
  );

  const toggleEmpresa = (id: number) => {
    const empresa = empresas.find((e) => e.id === id);

    if (!empresa?.disponible || empresa.vacantes === 0) return;

    if (seleccionadas.includes(id)) {
      setSeleccionadas(seleccionadas.filter((x) => x !== id));

      if (empresaPriorizada === id) {
        setEmpresaPriorizada(null);
      }

      return;
    }

    if (seleccionadas.length >= 3) return;

    setSeleccionadas([...seleccionadas, id]);
  };

  const guardarPreferencias = () => {
    console.log("Empresas seleccionadas:", seleccionadas);
    console.log("Empresa priorizada:", empresaPriorizada);

    alert("Preferencias guardadas correctamente");
  };

  const opciones = seleccionadas
    .map((id) => empresas.find((e) => e.id === id))
    .filter(Boolean);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[#0d2b5e]">
          Padrón Empresarial
        </h1>
        <p className="text-gray-500 text-sm mt-1">
          Consulta empresas disponibles y selecciona hasta 3 opciones para tus
          prácticas profesionales.
        </p>
      </div>

      <div className="bg-[#0d2b5e] rounded-2xl p-6 text-white">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-5">
          <div>
            <h2 className="text-xl font-bold">Convocatoria Verano 2026</h2>
            <p className="text-blue-200 text-sm mt-1">
              Empresas autorizadas por la coordinación y disponibles para
              alumnos.
            </p>
          </div>

          <span className="bg-green-100 text-green-700 px-4 py-2 rounded-full text-sm font-semibold w-fit">
            24 empresas disponibles
          </span>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5">
        <div className="grid md:grid-cols-3 gap-4">
          <div className="border rounded-xl px-3 py-2 flex items-center gap-2">
            <Search className="w-4 h-4 text-gray-400" />
            <input
              className="outline-none text-sm w-full"
              placeholder="Buscar empresa..."
            />
          </div>

          <select className="border rounded-xl px-3 py-2 text-sm">
            <option>Todas las áreas</option>
            <option>Desarrollo Web</option>
            <option>IA y Ciencia de Datos</option>
            <option>Software Empresarial</option>
            <option>Desarrollo de Software</option>
          </select>

          <select className="border rounded-xl px-3 py-2 text-sm">
            <option>Todas las modalidades</option>
            <option>Presencial</option>
            <option>Híbrida</option>
          </select>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 grid md:grid-cols-2 gap-5">
          {empresas.map((empresa) => {
            const selected = seleccionadas.includes(empresa.id);
            const priorizada = empresaPriorizada === empresa.id;
            const sinCupos = !empresa.disponible || empresa.vacantes === 0;
            const disabled =
              sinCupos || (!selected && seleccionadas.length >= 3);

            return (
              <div
                key={empresa.id}
                className={`rounded-2xl border shadow-sm p-6 relative ${
                  sinCupos
                    ? "bg-gray-100 border-gray-300 opacity-60 grayscale"
                    : priorizada
                    ? "bg-yellow-50 border-yellow-300"
                    : "bg-white border-gray-200"
                }`}
              >
                {sinCupos && (
                  <div className="absolute top-4 right-4 bg-red-100 text-red-700 px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1">
                    <AlertTriangle className="w-3 h-3" />
                    Sin cupos
                  </div>
                )}

                {priorizada && (
                  <div className="absolute top-4 right-4 bg-yellow-100 text-yellow-700 px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1">
                    <Star className="w-3 h-3" />
                    Priorizada
                  </div>
                )}

                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h3 className="font-bold text-[#0d2b5e]">
                      {empresa.nombre}
                    </h3>
                    <p className="text-sm text-gray-500 mt-1">
                      {empresa.area}
                    </p>
                  </div>

                  {selected && !priorizada && (
                    <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-xs font-semibold">
                      Seleccionada
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-3 mt-5">
                  <div className="border rounded-xl p-3 bg-white/70">
                    <div className="flex items-center gap-2 text-xs text-gray-500">
                      <MapPin className="w-4 h-4" />
                      Ubicación
                    </div>
                    <p className="font-semibold text-[#0d2b5e] mt-1">
                      {empresa.ubicacion}
                    </p>
                  </div>

                  <div className="border rounded-xl p-3 bg-white/70">
                    <div className="flex items-center gap-2 text-xs text-gray-500">
                      <Briefcase className="w-4 h-4" />
                      Vacantes
                    </div>
                    <p className="font-semibold text-[#0d2b5e] mt-1">
                      {empresa.vacantes} espacios
                    </p>
                  </div>
                </div>

                <div className="mt-4 bg-gray-50 border border-gray-200 rounded-xl p-4">
                  <p className="text-xs font-semibold text-gray-500 mb-1">
                    Plan de trabajo
                  </p>
                  <p className="text-sm text-gray-600">
                    {empresa.plan[0]}, {empresa.plan[1]} y actividades
                    relacionadas.
                  </p>
                </div>

                <div className="flex flex-wrap gap-2 mt-5">
                  <button
                    onClick={() => setDetalle(empresa)}
                    className="border border-blue-200 text-[#1565c0] rounded-xl px-3 py-2 text-xs font-semibold flex items-center gap-1"
                  >
                    <Eye className="w-3 h-3" />
                    Ver detalles
                  </button>

                  <button
                    disabled={disabled}
                    onClick={() => toggleEmpresa(empresa.id)}
                    className={`rounded-xl px-3 py-2 text-xs font-semibold flex items-center gap-1 ${
                      selected
                        ? "border border-red-200 text-red-600"
                        : disabled
                        ? "bg-gray-200 text-gray-500 cursor-not-allowed"
                        : "bg-[#1565c0] text-white"
                    }`}
                  >
                    {selected ? (
                      <>
                        <X className="w-3 h-3" />
                        Quitar
                      </>
                    ) : sinCupos ? (
                      <>
                        <AlertTriangle className="w-3 h-3" />
                        No disponible
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="w-3 h-3" />
                        Seleccionar
                      </>
                    )}
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        <div className="space-y-6">
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 sticky top-24">
            <h3 className="font-bold text-[#0d2b5e] mb-2">Mis opciones</h3>
            <p className="text-sm text-gray-500 mb-5">
              Selecciona hasta 3 empresas en orden de preferencia.
            </p>

            <div className="space-y-3">
              {[0, 1, 2].map((i) => {
                const empresa = opciones[i];
                const priorizada = empresa && empresaPriorizada === empresa.id;

                return (
                  <div
                    key={i}
                    className={`border rounded-xl p-4 flex items-center gap-3 ${
                      priorizada
                        ? "bg-yellow-50 border-yellow-300"
                        : "bg-white"
                    }`}
                  >
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                        priorizada
                          ? "bg-yellow-100 text-yellow-700"
                          : "bg-blue-50 text-[#1565c0]"
                      }`}
                    >
                      {priorizada ? <Star className="w-4 h-4" /> : i + 1}
                    </div>

                    <div className="flex-1">
                      {empresa ? (
                        <>
                          <p className="font-semibold text-[#0d2b5e] text-sm">
                            {empresa.nombre}
                          </p>
                          <p className="text-xs text-gray-500">
                            {empresa.area}
                          </p>
                          {priorizada && (
                            <p className="text-xs text-yellow-700 font-semibold mt-1">
                              Empresa priorizada
                            </p>
                          )}
                        </>
                      ) : (
                        <p className="text-sm text-gray-400">
                          Opción pendiente
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {seleccionadas.length === 3 && (
              <div className="mt-5 bg-yellow-50 border border-yellow-200 rounded-2xl p-4">
                <p className="text-sm font-bold text-[#0d2b5e]">
                  ¿Estás priorizado en alguna empresa?
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  Selecciónala antes de guardar tus preferencias. Si no estás
                  priorizado, deja esta opción sin seleccionar.
                </p>

                <div className="space-y-2 mt-4">
                  {opciones.map((empresa) =>
                    empresa ? (
                      <button
                        key={empresa.id}
                        onClick={() =>
                          setEmpresaPriorizada(
                            empresaPriorizada === empresa.id
                              ? null
                              : empresa.id
                          )
                        }
                        className={`w-full rounded-xl px-4 py-3 text-sm font-semibold flex items-center justify-between border ${
                          empresaPriorizada === empresa.id
                            ? "bg-yellow-100 border-yellow-400 text-yellow-800"
                            : "bg-white border-gray-200 text-gray-600"
                        }`}
                      >
                        <span>{empresa.nombre}</span>

                        {empresaPriorizada === empresa.id && (
                          <Star className="w-4 h-4" />
                        )}
                      </button>
                    ) : null
                  )}
                </div>
              </div>
            )}

            <button
              onClick={guardarPreferencias}
              className="mt-5 w-full bg-[#1565c0] text-white rounded-xl py-2 text-sm font-semibold flex items-center justify-center gap-2"
            >
              <Save className="w-4 h-4" />
              Guardar preferencias
            </button>

            <div className="mt-4 bg-blue-50 border border-blue-200 rounded-xl p-4">
              <p className="text-sm text-[#0d2b5e]">
                Después de guardar tus opciones, coordinación confirmará la
                asignación final.
              </p>
            </div>
          </div>
        </div>
      </div>

      {detalle && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-xl w-full p-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h3 className="text-xl font-bold text-[#0d2b5e]">
                  {detalle.nombre}
                </h3>
                <p className="text-sm text-gray-500 mt-1">
                  {detalle.area} · {detalle.modalidad}
                </p>
              </div>

              <button
                onClick={() => setDetalle(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {!detalle.disponible || detalle.vacantes === 0 ? (
              <div className="mt-5 bg-red-50 border border-red-200 rounded-xl p-4 text-sm text-red-700 font-semibold">
                Esta empresa no puede seleccionarse porque ya no cuenta con
                cupos disponibles.
              </div>
            ) : null}

            <div className="grid md:grid-cols-2 gap-4 mt-5">
              <div className="border rounded-xl p-4">
                <p className="text-xs text-gray-500">Ubicación</p>
                <p className="font-semibold text-[#0d2b5e]">
                  {detalle.ubicacion}
                </p>
              </div>

              <div className="border rounded-xl p-4">
                <p className="text-xs text-gray-500">Horario</p>
                <p className="font-semibold text-[#0d2b5e]">
                  {detalle.horario}
                </p>
              </div>
            </div>

            <div className="mt-5">
              <h4 className="font-bold text-[#0d2b5e]">Plan de trabajo</h4>

              <div className="space-y-2 mt-3">
                {detalle.plan.map((p) => (
                  <div
                    key={p}
                    className="flex items-center gap-2 text-sm text-gray-700"
                  >
                    <Building2 className="w-4 h-4 text-[#1565c0]" />
                    {p}
                  </div>
                ))}
              </div>
            </div>

            <button
              disabled={!detalle.disponible || detalle.vacantes === 0}
              onClick={() => {
                toggleEmpresa(detalle.id);
                setDetalle(null);
              }}
              className={`mt-6 w-full rounded-xl py-2 text-sm font-semibold ${
                !detalle.disponible || detalle.vacantes === 0
                  ? "bg-gray-200 text-gray-500 cursor-not-allowed"
                  : "bg-[#1565c0] text-white"
              }`}
            >
              {!detalle.disponible || detalle.vacantes === 0
                ? "No disponible por falta de cupos"
                : "Seleccionar como opción"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}