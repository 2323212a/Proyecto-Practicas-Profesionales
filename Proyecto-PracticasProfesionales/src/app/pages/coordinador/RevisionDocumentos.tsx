import { useState } from "react";
import {
  CheckCircle,
  FileText,
  Eye,
  Bell,
  Send,
  Lock,
  Unlock,
  AlertTriangle,
  Building2,
} from "lucide-react";

type Estado = "pendiente" | "aprobado" | "correccion";

type Bloque =
  | "elegibilidad"
  | "expediente"
  | "seleccion_empresa"
  | "asignacion";

type Documento = {
  id: number;
  bloque: Bloque;
  nombre: string;
  archivo: string;
  estado: Estado;
  descripcion?: string;
  instrucciones?: string;
  nomenclatura?: string;
};

const docsIni: Documento[] = [
  {
    id: 1,
    bloque: "elegibilidad",
    nombre: "Historial académico",
    archivo: "historial_215A10234.pdf",
    estado: "pendiente",
    descripcion:
      "Primer filtro para verificar si el alumno cumple con los créditos y condiciones académicas necesarias.",
    instrucciones:
      "Debe ser legible, estar actualizado y corresponder al alumno.",
    nomenclatura: "historial_matricula.pdf",
  },
  {
    id: 2,
    bloque: "elegibilidad",
    nombre: "Vigencia de derechos",
    archivo: "vigencia_215A10234.pdf",
    estado: "aprobado",
    descripcion:
      "Documento que acredita que el alumno cuenta con vigencia de derechos para continuar el trámite.",
    instrucciones:
      "Debe estar vigente, legible y en formato PDF.",
    nomenclatura: "vigencia_matricula.pdf",
  },
  {
    id: 3,
    bloque: "expediente",
    nombre: "Carta compromiso",
    archivo: "carta_compromiso_matricula.pdf",
    estado: "pendiente",
    descripcion:
      "Documento firmado por el alumno donde acepta cumplir con las responsabilidades del programa de prácticas profesionales.",
    instrucciones:
      "Debe estar llenada, firmada, legible y en formato PDF.",
    nomenclatura: "carta_compromiso_matricula.pdf",
  },
  {
    id: 4,
    bloque: "expediente",
    nombre: "Carta de exoneración",
    archivo: "carta_exoneracion_matricula.pdf",
    estado: "pendiente",
    descripcion:
      "Documento donde el alumno acepta responsabilidades externas durante sus prácticas.",
    instrucciones:
      "Debe incluir firma del alumno y Vo.Bo. del padre o tutor.",
    nomenclatura: "carta_exoneracion_matricula.pdf",
  },
  {
    id: 5,
    bloque: "expediente",
    nombre: "Credencial del alumno",
    archivo: "credencial_alumno_matricula.pdf",
    estado: "pendiente",
    descripcion: "Copia digital de la credencial vigente del alumno.",
    instrucciones: "Debe verse completa, clara y sin recortes importantes.",
    nomenclatura: "credencial_alumno_matricula.pdf",
  },
  {
    id: 6,
    bloque: "expediente",
    nombre: "Credencial del tutor",
    archivo: "credencial_tutor_matricula.pdf",
    estado: "pendiente",
    descripcion:
      "Documento usado para confirmar la identidad del tutor que firma la carta de exoneración.",
    instrucciones: "Debe ser clara, legible y corresponder al tutor firmante.",
    nomenclatura: "credencial_tutor_matricula.pdf",
  },
  {
    id: 7,
    bloque: "seleccion_empresa",
    nombre: "Carta de exposición de motivos",
    archivo: "exposicion_motivos_215A10234.pdf",
    estado: "pendiente",
    descripcion:
      "Documento generado automáticamente después de que el alumno selecciona sus opciones de empresa.",
    instrucciones:
      "El alumno debe descargarlo, firmarlo, escanearlo y subirlo nuevamente.",
    nomenclatura: "exposicion_motivos_matricula.pdf",
  },
  {
    id: 8,
    bloque: "asignacion",
    nombre: "Carta de colaboración",
    archivo: "carta_colaboracion_215A10234.pdf",
    estado: "pendiente",
    descripcion:
      "Documento correspondiente a la formalización de colaboración con la unidad receptora.",
    instrucciones:
      "Se genera o valida una vez confirmada la unidad receptora.",
    nomenclatura: "carta_colaboracion_matricula.pdf",
  },
  {
    id: 9,
    bloque: "asignacion",
    nombre: "Carta de presentación",
    archivo: "carta_presentacion_215A10234.pdf",
    estado: "pendiente",
    descripcion:
      "Documento mediante el cual la institución presenta formalmente al alumno ante la unidad receptora.",
    instrucciones:
      "Se genera con los datos del alumno, carrera, periodo y empresa asignada.",
    nomenclatura: "carta_presentacion_matricula.pdf",
  },
  {
    id: 10,
    bloque: "asignacion",
    nombre: "Carta de asignación",
    archivo: "carta_asignacion_215A10234.pdf",
    estado: "pendiente",
    descripcion:
      "Documento que formaliza la asignación del alumno a una unidad receptora.",
    instrucciones:
      "Debe generarse después de validar la selección de empresa.",
    nomenclatura: "carta_asignacion_matricula.pdf",
  },
];

const motivos = [
  "Documento incorrecto",
  "Baja calidad de imagen",
  "Información incompleta",
  "Nombre de archivo incorrecto",
  "Falta firma",
  "Documento ilegible",
];

export function RevisionDocumentos() {
  const [estados, setEstados] = useState<Record<number, Estado>>(
    Object.fromEntries(docsIni.map((d) => [d.id, d.estado])) as Record<
      number,
      Estado
    >,
  );

  const [corrigiendoId, setCorrigiendoId] = useState<number | null>(null);
  const [motivo, setMotivo] = useState("");
  const [comentario, setComentario] = useState("");
  const [toast, setToast] = useState(false);
  const [seleccionHabilitada, setSeleccionHabilitada] = useState(false);
  const [asignacionHabilitada, setAsignacionHabilitada] = useState(false);

  const docsElegibilidad = docsIni.filter((d) => d.bloque === "elegibilidad");
  const docsExpediente = docsIni.filter((d) => d.bloque === "expediente");
  const docsSeleccion = docsIni.filter((d) => d.bloque === "seleccion_empresa");
  const docsAsignacion = docsIni.filter((d) => d.bloque === "asignacion");

  const elegibilidadValidada = docsElegibilidad.every(
    (d) => estados[d.id] === "aprobado",
  );

  const expedienteValidado = docsExpediente.every(
    (d) => estados[d.id] === "aprobado",
  );

  const seleccionValidada = docsSeleccion.every(
    (d) => estados[d.id] === "aprobado",
  );

  const asignacionValidada = docsAsignacion.every(
    (d) => estados[d.id] === "aprobado",
  );

  const aprobados = Object.values(estados).filter(
    (e) => e === "aprobado",
  ).length;

  const aprobar = (id: number) => {
    setEstados((p) => ({ ...p, [id]: "aprobado" }));
  };

  const solicitarCorreccion = (id: number) => {
    setEstados((p) => ({ ...p, [id]: "correccion" }));
    setCorrigiendoId(null);
    setMotivo("");
    setComentario("");
    setToast(true);
    setTimeout(() => setToast(false), 3000);
  };

  const habilitarSeleccionEmpresa = () => {
    if (!expedienteValidado) return;
    setSeleccionHabilitada(true);
    setToast(true);
    setTimeout(() => setToast(false), 3000);
  };

  const habilitarAsignacion = () => {
    if (!seleccionValidada) return;
    setAsignacionHabilitada(true);
    setToast(true);
    setTimeout(() => setToast(false), 3000);
  };

  const estadoAlumno = asignacionValidada
    ? "Asignado"
    : seleccionValidada
      ? "Listo para documentación de asignación"
      : expedienteValidado
        ? "Apto para seleccionar empresa"
        : elegibilidadValidada
          ? "Integrando expediente"
          : "Pendiente de elegibilidad";

  const renderDocumento = (doc: Documento, bloqueado = false) => {
    const est = estados[doc.id];

    return (
      <div key={doc.id} className="px-6 py-5">
        <div
          className={`flex flex-col sm:flex-row sm:items-center gap-4 ${
            bloqueado ? "opacity-50" : ""
          }`}
        >
          <div className="flex items-start gap-3 flex-1">
            <div className="w-10 h-10 bg-[#e3f0ff] rounded-xl flex items-center justify-center flex-shrink-0">
              <FileText className="w-5 h-5 text-[#1565c0]" />
            </div>

            <div>
              <div className="font-semibold text-gray-800 text-sm">
                {doc.nombre}
              </div>

              {doc.descripcion && (
                <div className="text-xs text-gray-500 mt-1 leading-relaxed">
                  {doc.descripcion}
                </div>
              )}

              {doc.instrucciones && (
                <div className="text-xs text-gray-500 mt-2 leading-relaxed">
                  <span className="font-semibold text-gray-700">
                    Instrucciones:
                  </span>{" "}
                  {doc.instrucciones}
                </div>
              )}

              {doc.nomenclatura && (
                <div className="text-xs text-[#1565c0] mt-1">
                  <span className="font-semibold">Nomenclatura:</span>{" "}
                  {doc.nomenclatura}
                </div>
              )}

              <div className="text-xs text-gray-400 mt-1">📎 {doc.archivo}</div>

              {bloqueado && (
                <div className="text-xs text-red-600 mt-2 font-semibold flex items-center gap-1">
                  <Lock className="w-3.5 h-3.5" />
                  Este bloque aún no está habilitado.
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center gap-3">
            <span
              className={`text-xs px-3 py-1.5 rounded-full font-semibold ${
                est === "aprobado"
                  ? "bg-green-100 text-green-700"
                  : est === "correccion"
                    ? "bg-orange-100 text-orange-700"
                    : "bg-gray-100 text-gray-600"
              }`}
            >
              {est === "aprobado"
                ? "✓ Aprobado"
                : est === "correccion"
                  ? "Corrección solicitada"
                  : "Pendiente"}
            </span>

            <button
              disabled={bloqueado}
              className="p-2 text-gray-400 hover:text-[#1565c0] hover:bg-blue-50 rounded-lg disabled:cursor-not-allowed disabled:hover:bg-transparent"
            >
              <Eye className="w-4 h-4" />
            </button>

            {est !== "aprobado" && (
              <>
                <button
                  onClick={() => aprobar(doc.id)}
                  disabled={bloqueado}
                  className="flex items-center gap-1.5 px-4 py-2 bg-green-600 text-white rounded-lg text-xs font-semibold hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <CheckCircle className="w-3.5 h-3.5" />
                  Aprobar
                </button>

                <button
                  onClick={() => setCorrigiendoId(doc.id)}
                  disabled={bloqueado}
                  className="flex items-center gap-1.5 px-4 py-2 bg-orange-600 text-white rounded-lg text-xs font-semibold hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <AlertTriangle className="w-3.5 h-3.5" />
                  Solicitar corrección
                </button>
              </>
            )}
          </div>
        </div>

        {corrigiendoId === doc.id && !bloqueado && (
          <div className="mt-4 p-4 bg-orange-50 border border-orange-200 rounded-xl">
            <div className="text-sm font-semibold text-orange-700 mb-3">
              Motivo de la corrección:
            </div>

            <div className="grid grid-cols-2 gap-2 mb-3">
              {motivos.map((m) => (
                <label
                  key={m}
                  className="flex items-center gap-2 cursor-pointer p-2 rounded-lg hover:bg-orange-100"
                >
                  <input
                    type="radio"
                    name={`m-${doc.id}`}
                    value={m}
                    checked={motivo === m}
                    onChange={(e) => setMotivo(e.target.value)}
                    className="accent-orange-600"
                  />
                  <span className="text-xs text-orange-700">{m}</span>
                </label>
              ))}
            </div>

            <textarea
              value={comentario}
              onChange={(e) => setComentario(e.target.value)}
              placeholder="Agrega una observación específica para el alumno..."
              className="w-full min-h-[80px] text-sm border border-orange-200 rounded-xl p-3 focus:outline-none focus:border-orange-500 bg-white"
            />

            <div className="flex gap-2 mt-3">
              <button
                onClick={() => solicitarCorreccion(doc.id)}
                disabled={!motivo || !comentario.trim()}
                className="px-4 py-2 bg-orange-600 text-white rounded-lg text-xs font-semibold hover:bg-orange-700 disabled:opacity-50"
              >
                Confirmar corrección
              </button>

              <button
                onClick={() => {
                  setCorrigiendoId(null);
                  setMotivo("");
                  setComentario("");
                }}
                className="px-4 py-2 border border-gray-300 text-gray-600 rounded-lg text-xs font-semibold hover:bg-gray-50"
              >
                Cancelar
              </button>
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderBloque = (
    titulo: string,
    descripcion: string,
    docs: Documento[],
    bloqueado: boolean,
    validado: boolean,
  ) => (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
      <div
        className={`px-6 py-4 border-b flex items-center gap-2 ${
          validado
            ? "bg-green-50 border-green-100"
            : bloqueado
              ? "bg-gray-50 border-gray-100"
              : "bg-white border-gray-100"
        }`}
      >
        {validado ? (
          <Unlock className="w-5 h-5 text-green-600" />
        ) : bloqueado ? (
          <Lock className="w-5 h-5 text-gray-400" />
        ) : (
          <FileText className="w-5 h-5 text-[#1565c0]" />
        )}

        <div>
          <h3
            className={`font-bold ${
              validado
                ? "text-green-700"
                : bloqueado
                  ? "text-gray-500"
                  : "text-[#0d2b5e]"
            }`}
          >
            {titulo}
          </h3>
          <p
            className={`text-xs mt-0.5 ${
              validado
                ? "text-green-600"
                : bloqueado
                  ? "text-gray-400"
                  : "text-gray-500"
            }`}
          >
            {descripcion}
          </p>
        </div>
      </div>

      <div className="divide-y divide-gray-100">
        {docs.map((doc) => renderDocumento(doc, bloqueado))}
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[#0d2b5e]">
          Revisión de Documentos
        </h1>
        <p className="text-gray-500 text-sm mt-1">
          Coordinador de Prácticas Profesionales — Expediente del alumno
        </p>
      </div>

      {toast && (
        <div className="fixed bottom-6 right-6 bg-[#0d2b5e] text-white px-5 py-3 rounded-2xl shadow-2xl flex items-center gap-3 z-50">
          <Bell className="w-4 h-4" />
          <span className="text-sm font-medium">
            {asignacionHabilitada
              ? "Documentación de asignación habilitada"
              : seleccionHabilitada
                ? "Selección de empresa habilitada"
                : "Observación enviada al alumno"}
          </span>
        </div>
      )}

      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 flex items-center gap-5">
        <div className="w-16 h-16 bg-[#0d2b5e] rounded-2xl flex items-center justify-center text-white text-2xl font-bold">
          B
        </div>

        <div className="flex-1">
          <div className="font-bold text-xl text-[#0d2b5e]">
            Brayan Madain Hernandez
          </div>
          <div className="text-gray-500 text-sm">
            Matrícula: 215A10234 · Ing. en Desarrollo de Software · 4° Semestre
          </div>
          <div className="text-gray-400 text-xs mt-1">
            Periodo: Junio–Agosto 2026
          </div>
        </div>

        <div>
          <div className="text-xs text-gray-400 mb-1">Estado del alumno</div>
          <span className="text-sm px-4 py-1.5 rounded-full font-semibold bg-blue-100 text-blue-700">
            {estadoAlumno}
          </span>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5">
        <div className="flex items-center justify-between mb-3">
          <span className="font-semibold text-[#0d2b5e] text-sm">
            Progreso documental
          </span>
          <span className="text-xs text-gray-500">
            {aprobados}/{docsIni.length} aprobados
          </span>
        </div>

        <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
          <div
            className="bg-gradient-to-r from-green-500 to-green-400 h-3 rounded-full transition-all"
            style={{ width: `${(aprobados / docsIni.length) * 100}%` }}
          />
        </div>
      </div>

      {renderBloque(
        "Bloque 1: Elegibilidad académica",
        "Primer filtro: historial académico y vigencia de derechos. Si no se aprueba este bloque, el alumno no puede continuar.",
        docsElegibilidad,
        false,
        elegibilidadValidada,
      )}

      {renderBloque(
        "Bloque 2: Expediente inicial",
        "Documentos personales del alumno. Se habilita únicamente cuando el alumno pasa el filtro académico.",
        docsExpediente,
        !elegibilidadValidada,
        expedienteValidado,
      )}

      <div
        className={`rounded-2xl border shadow-sm p-6 ${
          expedienteValidado
            ? "bg-green-50 border-green-200"
            : "bg-gray-50 border-gray-200"
        }`}
      >
        <div className="flex flex-col md:flex-row md:items-center gap-4 justify-between">
          <div>
            <h3
              className={`font-bold ${
                expedienteValidado ? "text-green-700" : "text-gray-500"
              }`}
            >
              Habilitar selección de empresa
            </h3>
            <p
              className={`text-xs mt-1 ${
                expedienteValidado ? "text-green-600" : "text-gray-400"
              }`}
            >
              {expedienteValidado
                ? "El alumno puede consultar el padrón de empresas, elegir dos opciones y generar la Carta de Exposición de Motivos."
                : "Primero debe aprobarse el expediente inicial del alumno."}
            </p>
          </div>

          <button
            onClick={habilitarSeleccionEmpresa}
            disabled={!expedienteValidado || seleccionHabilitada}
            className="flex items-center justify-center gap-2 px-5 py-3 bg-[#0d2b5e] text-white rounded-xl text-sm font-semibold hover:bg-[#1565c0] disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Building2 className="w-4 h-4" />
            {seleccionHabilitada
              ? "Selección habilitada"
              : "Habilitar selección"}
          </button>
        </div>
      </div>

      {renderBloque(
        "Bloque 3: Selección de empresa",
        "El alumno selecciona dos opciones del padrón. El sistema genera la Carta de Exposición de Motivos y el alumno la sube firmada.",
        docsSeleccion,
        !seleccionHabilitada,
        seleccionValidada,
      )}

      <div
        className={`rounded-2xl border shadow-sm p-6 ${
          seleccionValidada
            ? "bg-green-50 border-green-200"
            : "bg-gray-50 border-gray-200"
        }`}
      >
        <div className="flex flex-col md:flex-row md:items-center gap-4 justify-between">
          <div>
            <h3
              className={`font-bold ${
                seleccionValidada ? "text-green-700" : "text-gray-500"
              }`}
            >
              Habilitar documentación de asignación
            </h3>
            <p
              className={`text-xs mt-1 ${
                seleccionValidada ? "text-green-600" : "text-gray-400"
              }`}
            >
              {seleccionValidada
                ? "La selección de empresa fue validada. Ya pueden generarse los documentos de asignación."
                : "Primero debe aprobarse la Carta de Exposición de Motivos."}
            </p>
          </div>

          <button
            onClick={habilitarAsignacion}
            disabled={!seleccionValidada || asignacionHabilitada}
            className="flex items-center justify-center gap-2 px-5 py-3 bg-[#0d2b5e] text-white rounded-xl text-sm font-semibold hover:bg-[#1565c0] disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Send className="w-4 h-4" />
            {asignacionHabilitada
              ? "Asignación habilitada"
              : "Habilitar asignación"}
          </button>
        </div>
      </div>

      {renderBloque(
        "Bloque 4: Documentación de asignación",
        "Carta de colaboración, carta de presentación y carta de asignación.",
        docsAsignacion,
        !asignacionHabilitada,
        asignacionValidada,
      )}
    </div>
  );
}