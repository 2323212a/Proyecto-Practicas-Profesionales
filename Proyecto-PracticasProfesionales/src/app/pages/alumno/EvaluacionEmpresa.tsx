import {
  Building2,
  MessageSquare,
  CheckCircle2,
  Send,
  AlertTriangle,
  ClipboardCheck,
} from "lucide-react";

const preguntas = [
  {
    pregunta:
      "¿Las actividades realizadas estuvieron relacionadas con tu carrera?",
    opciones: [
      "Totalmente relacionadas",
      "Parcialmente relacionadas",
      "Poco relacionadas",
      "No tuvieron relación",
    ],
  },
  {
    pregunta:
      "¿La empresa cumplió con el plan de trabajo acordado?",
    opciones: [
      "Sí, completamente",
      "Sí, en su mayoría",
      "Parcialmente",
      "No",
    ],
  },
  {
    pregunta:
      "¿Recibiste orientación y seguimiento por parte de tu responsable directo?",
    opciones: [
      "Siempre",
      "Frecuentemente",
      "Ocasionalmente",
      "Nunca",
    ],
  },
  {
    pregunta:
      "¿Contaste con los recursos y herramientas necesarias para realizar tus actividades?",
    opciones: [
      "Siempre",
      "La mayoría del tiempo",
      "Algunas veces",
      "Nunca",
    ],
  },
  {
    pregunta:
      "¿Consideras que esta experiencia aportó conocimientos relevantes para tu formación profesional?",
    opciones: [
      "Mucho",
      "Moderadamente",
      "Poco",
      "Nada",
    ],
  },
  {
    pregunta:
      "¿Recomendarías esta empresa para futuros practicantes?",
    opciones: [
      "Sí, totalmente",
      "Sí, con observaciones",
      "No estoy seguro",
      "No",
    ],
  },
];

const incidencias = [
  "No se respetó el plan de trabajo",
  "Actividades ajenas a la carrera",
  "Falta de supervisión",
  "Problemas de horario",
  "Falta de recursos o herramientas",
  "Ambiente laboral inadecuado",
  "Incumplimiento de acuerdos",
  "Ninguna incidencia",
];

export function EvaluacionEmpresa() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[#0d2b5e]">
          Evaluación de Empresa
        </h1>

        <p className="text-gray-500 text-sm mt-1">
          Tu evaluación ayudará a determinar si la empresa
          continuará formando parte del padrón institucional
          de unidades receptoras.
        </p>
      </div>

      <div className="bg-[#0d2b5e] rounded-2xl p-6 text-white">
        <div className="flex items-center gap-4">
          <Building2 className="w-10 h-10 text-blue-200" />

          <div>
            <h2 className="text-xl font-bold">
              TechSoft Chiapas
            </h2>

            <p className="text-blue-200 text-sm">
              Desarrollo Web · Verano 2026
            </p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
        <div className="flex items-center gap-2 mb-6">
          <ClipboardCheck className="w-5 h-5 text-[#1565c0]" />

          <h3 className="font-bold text-[#0d2b5e]">
            Cuestionario de evaluación
          </h3>
        </div>

        <div className="space-y-5">
          {preguntas.map((item, index) => (
            <div
              key={index}
              className="border border-gray-200 rounded-xl p-5"
            >
              <h4 className="font-semibold text-[#0d2b5e] mb-4">
                {index + 1}. {item.pregunta}
              </h4>

              <div className="space-y-2">
                {item.opciones.map((opcion) => (
                  <label
                    key={opcion}
                    className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 cursor-pointer"
                  >
                    <input
                      type="radio"
                      name={`pregunta-${index}`}
                      className="text-[#1565c0]"
                    />

                    <span className="text-sm text-gray-700">
                      {opcion}
                    </span>
                  </label>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
        <div className="flex items-center gap-2 mb-5">
          <AlertTriangle className="w-5 h-5 text-orange-600" />

          <h3 className="font-bold text-[#0d2b5e]">
            Incidencias detectadas
          </h3>
        </div>

        <p className="text-sm text-gray-500 mb-4">
          Marca las situaciones que se presentaron durante
          tus prácticas profesionales.
        </p>

        <div className="grid md:grid-cols-2 gap-3">
          {incidencias.map((item) => (
            <label
              key={item}
              className="flex items-center gap-3 p-3 border border-gray-200 rounded-xl hover:bg-gray-50 cursor-pointer"
            >
              <input type="checkbox" />

              <span className="text-sm text-gray-700">
                {item}
              </span>
            </label>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
        <h3 className="font-bold text-[#0d2b5e] mb-4 flex items-center gap-2">
          <MessageSquare className="w-5 h-5 text-[#1565c0]" />
          Comentarios adicionales
        </h3>

        <textarea
          className="w-full border border-gray-200 rounded-xl p-4 text-sm min-h-36 focus:outline-none focus:border-[#1565c0]"
          placeholder="Describe tu experiencia, sugerencias de mejora o cualquier situación relevante que deba conocer la coordinación..."
        />

        <div className="mt-5 bg-blue-50 border border-blue-200 rounded-xl p-4">
          <p className="text-sm text-[#0d2b5e]">
            La información proporcionada será utilizada por
            la Coordinación de Prácticas Profesionales para
            evaluar la calidad de la unidad receptora y su
            permanencia en futuras convocatorias.
          </p>
        </div>
      </div>

      <div className="bg-green-50 border border-green-200 rounded-2xl p-5">
        <div className="flex items-center gap-3">
          <CheckCircle2 className="w-5 h-5 text-green-700" />

          <div>
            <h4 className="font-semibold text-green-800">
              Evaluación institucional
            </h4>

            <p className="text-sm text-green-700 mt-1">
              Las respuestas serán consideradas para la
              renovación de convenios, validación de vacantes
              y permanencia de la empresa dentro del padrón
              institucional.
            </p>
          </div>
        </div>
      </div>

      <div className="flex justify-end">
        <button className="bg-[#1565c0] text-white rounded-xl px-6 py-3 text-sm font-semibold flex items-center gap-2 hover:bg-[#0d4fa8]">
          <Send className="w-4 h-4" />
          Enviar evaluación
        </button>
      </div>
    </div>
  );
}