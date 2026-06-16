import { useState } from "react";
import {
  Upload,
  Eye,
  RefreshCw,
  CheckCircle,
  Clock,
  XCircle,
  FileText,
  AlertCircle,
} from "lucide-react";

type DS =
  | "aprobado"
  | "pendiente"
  | "rechazado"
  | "en_revision";

interface Doc {
  id: number;
  nombre: string;
  descripcion: string;
  instrucciones: string;
  nomenclatura: string;
  estado: DS;
  archivo?: string;
  fecha?: string;
  motivo?: string;
}

const docsIni: Doc[] = [
  {
    id: 1,
    nombre: "Historial Académico",
    descripcion:
      "Documento donde se valida que el alumno cumple con las materias necesarias para iniciar el proceso de prácticas profesionales.",
    instrucciones:
      "Debe subirse en formato PDF, ser legible y mostrar claramente el avance académico del alumno.",
    nomenclatura: "historial_academico_matricula.pdf",
    estado: "aprobado",
  },
  {
    id: 2,
    nombre: "Vigencia de Derechos",
    descripcion:
      "Documento que acredita que el alumno cuenta con vigencia de derechos activa para continuar con el proceso.",
    instrucciones:
      "Debe estar actualizado, completo, legible y subirse únicamente en formato PDF.",
    nomenclatura: "vigencia_derechos_matricula.pdf",
    estado: "aprobado",
  },
  {
    id: 3,
    nombre: "Carta Compromiso",
    descripcion:
      "Documento firmado por el alumno donde acepta cumplir con las responsabilidades del programa de prácticas profesionales.",
    instrucciones:
      "Debe estar completamente llenada, firmada, ser legible y subirse únicamente en formato PDF.",
    nomenclatura: "carta_compromiso_matricula.pdf",
    estado: "aprobado",
  },
  {
    id: 4,
    nombre: "Carta de Exoneración",
    descripcion:
      "Documento donde se deslinda a la institución de responsabilidades externas durante el desarrollo de las prácticas.",
    instrucciones:
      "Debe estar firmada, sin tachaduras, completamente llenada y en formato PDF.",
    nomenclatura: "carta_exoneracion_matricula.pdf",
    estado: "aprobado",
  },
  {
    id: 5,
    nombre: "Carta de Exposición de Motivos",
    descripcion:
      "Carta donde el alumno explica de manera formal los motivos para realizar sus prácticas profesionales.",
    instrucciones:
      "Debe redactarse con claridad, estar completa, ser legible y guardarse en formato PDF.",
    nomenclatura: "exposicion_motivos_matricula.pdf",
    estado: "aprobado",
  },
  {
    id: 6,
    nombre: "Credencial del Alumno",
    descripcion:
      "Copia digital de la credencial vigente del alumno.",
    instrucciones:
      "La credencial debe verse completa, clara, sin recortes importantes y en formato PDF.",
    nomenclatura: "credencial_alumno_matricula.pdf",
    estado: "aprobado",
  },
  {
    id: 7,
    nombre: "Credencial del Tutor",
    descripcion:
      "Copia digital de la identificación o credencial del tutor responsable.",
    instrucciones:
      "El documento debe ser claro, legible, completo y subirse en formato PDF.",
    nomenclatura: "credencial_tutor_matricula.pdf",
    estado: "aprobado",
  },
];
const docsAsignacion: Doc[] = [
  {
    id: 101,
    nombre: "Carta de Colaboración",
    descripcion:
      "Documento emitido por coordinación para formalizar la colaboración entre la institución y la unidad receptora.",
    instrucciones:
      "Este documento será enviado por el coordinador cuando el expediente inicial esté completamente validado.",
    nomenclatura: "carta_colaboracion_matricula.pdf",
    estado: "aprobado",
    archivo: "carta_colaboracion_215A10234.pdf",
    fecha: "04 jun 2026",
  },
  {
    id: 102,
    nombre: "Carta de Presentación",
    descripcion:
      "Documento oficial emitido por la institución para presentar al alumno ante la unidad receptora.",
    instrucciones:
      "Este documento será generado y enviado por coordinación después de aprobar la documentación inicial.",
    nomenclatura: "carta_presentacion_matricula.pdf",
    estado: "aprobado",
    archivo: "carta_presentacion_215A10234.pdf",
    fecha: "04 jun 2026",
  },
  {
    id: 103,
    nombre: "Carta de Asignación",
    descripcion:
      "Documento que confirma la asignación del alumno a una unidad receptora para realizar sus prácticas profesionales.",
    instrucciones:
      "Este documento será enviado por coordinación una vez que el alumno tenga autorización para iniciar prácticas.",
    nomenclatura: "carta_asignacion_matricula.pdf",
    estado: "aprobado",
    archivo: "carta_asignacion_215A10234.pdf",
    fecha: "04 jun 2026",
  },
];

const cfg: Record<
  DS,
  { label: string; color: string; icon: any }
> = {
  aprobado: {
    label: "Aprobado",
    color: "bg-green-100 text-green-700",
    icon: CheckCircle,
  },
  pendiente: {
    label: "Pendiente",
    color: "bg-gray-100 text-gray-500",
    icon: Clock,
  },
  rechazado: {
    label: "Rechazado",
    color: "bg-red-100 text-red-700",
    icon: XCircle,
  },
  en_revision: {
    label: "En Revisión",
    color: "bg-yellow-100 text-yellow-700",
    icon: Clock,
  },
};

export function CargaDocumentos() {
  const [docs, setDocs] = useState<Doc[]>(docsIni);
  const [uploading, setUploading] = useState<number | null>(
    null,
  );
  const [preview, setPreview] = useState<Doc | null>(null);

  const upload = (id: number) => {
    const doc = docs.find((d) => d.id === id);

    setUploading(id);

    setTimeout(() => {
      setDocs((prev) =>
        prev.map((d) =>
          d.id === id
            ? {
                ...d,
                estado: "en_revision",
                archivo:
                  doc?.nomenclatura || `documento_${id}.pdf`,
                fecha: "03 jun 2026",
                motivo: undefined,
              }
            : d,
        ),
      );

      setUploading(null);
    }, 1500);
  };

  const aprobados = docs.filter(
    (d) => d.estado === "aprobado",
  ).length;
  const enRevision = docs.filter(
    (d) => d.estado === "en_revision",
  ).length;
  const pendientes = docs.filter(
    (d) => d.estado === "pendiente" || d.estado === "rechazado",
  ).length;

  const expedienteCompleto = docs.every(
    (d) => d.estado === "aprobado",
  );
  const documentosBaseAprobados = docs
    .filter((d) => d.id === 1 || d.id === 2)
    .every((d) => d.estado === "aprobado");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[#0d2b5e]">
          Carga de Documentos
        </h1>
        <p className="text-gray-500 text-sm mt-1">
          Gestión del expediente digital para prácticas
          profesionales.
        </p>
      </div>

      <div className="bg-[#e3f0ff] border border-blue-200 rounded-2xl p-5 flex gap-4">
        <AlertCircle className="w-6 h-6 text-[#1565c0] flex-shrink-0 mt-0.5" />
        <div>
          <div className="font-semibold text-[#0d2b5e] text-sm">
            Indicaciones generales
          </div>
          <div className="text-blue-700 text-xs mt-1 leading-relaxed">
            Todos los documentos deben subirse en formato PDF,
            estar completos, ser legibles, claros, sin
            tachaduras y respetar la nomenclatura indicada para
            cada archivo.
          </div>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="bg-green-50 border border-green-200 rounded-xl p-4 text-center">
          <div className="text-2xl font-bold text-green-700">
            {aprobados}
          </div>
          <div className="text-xs text-green-600 mt-1">
            Aprobados
          </div>
        </div>

        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 text-center">
          <div className="text-2xl font-bold text-yellow-700">
            {enRevision}
          </div>
          <div className="text-xs text-yellow-600 mt-1">
            En Revisión
          </div>
        </div>

        <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 text-center">
          <div className="text-2xl font-bold text-gray-600">
            {pendientes}
          </div>
          <div className="text-xs text-gray-500 mt-1">
            Pendientes
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-2">
          <FileText className="w-5 h-5 text-[#1565c0]" />
          <h3 className="font-bold text-[#0d2b5e]">
            Expediente Documental
          </h3>
          <span className="ml-auto text-xs text-gray-400">
            {aprobados}/{docs.length}
          </span>
        </div>

        <div className="divide-y divide-gray-100">
          {docs.map((doc) => {
            const c = cfg[doc.estado];
            const Icon = c.icon;
            const bloqueado =
              doc.id > 2 && !documentosBaseAprobados;

            return (
              <div
                key={doc.id}
                className="px-6 py-5 flex flex-col sm:flex-row sm:items-center gap-4"
              >
                <div className="flex items-start gap-3 flex-1">
                  <div className="w-10 h-10 bg-[#e3f0ff] rounded-xl flex items-center justify-center flex-shrink-0">
                    <FileText className="w-5 h-5 text-[#1565c0]" />
                  </div>

                  <div>
                    <div className="font-semibold text-gray-800 text-sm">
                      {doc.nombre}
                    </div>

                    <div className="text-xs text-gray-500 mt-0.5 leading-relaxed">
                      {doc.descripcion}
                    </div>

                    <div className="text-xs text-gray-500 mt-2 leading-relaxed">
                      <span className="font-semibold text-gray-700">
                        Instrucciones:
                      </span>{" "}
                      {doc.instrucciones}
                    </div>

                    <div className="text-xs text-[#1565c0] mt-1">
                      <span className="font-semibold">
                        Nomenclatura:
                      </span>{" "}
                      {doc.nomenclatura}
                    </div>
                    {bloqueado && (
                    <div className="text-xs text-red-600 mt-2 font-medium">
                    Primero deben aprobarse el Historial Académico y la Vigencia de Derechos.
                    </div>
                      )}

                    {doc.archivo && (
                      <div className="text-xs text-blue-500 mt-1">
                        📎 {doc.archivo} · {doc.fecha}
                      </div>
                    )}

                    {doc.estado === "rechazado" &&
                      doc.motivo && (
                        <div className="flex items-center gap-1 text-xs text-red-600 mt-1">
                          <AlertCircle className="w-3 h-3" />
                          Motivo: {doc.motivo}
                        </div>
                      )}
                  </div>
                </div>

                <div className="flex items-center gap-3 flex-shrink-0">
                  <span
                    className={`inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full font-semibold ${c.color}`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    {c.label}
                  </span>

                  {doc.archivo && (
                    <button
                      onClick={() => setPreview(doc)}
                      className="p-2 text-gray-400 hover:text-[#1565c0] hover:bg-blue-50 rounded-lg transition-colors"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                  )}

                 {(doc.estado === "pendiente" || doc.estado === "rechazado") && (
  <button
    onClick={() => upload(doc.id)}
    disabled={uploading === doc.id || bloqueado}
    className="flex items-center gap-2 px-4 py-2 bg-[#0d2b5e] text-white rounded-lg text-xs font-semibold hover:bg-[#1565c0] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
  >
    {uploading === doc.id ? (
      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
    ) : (
      <Upload className="w-3.5 h-3.5" />
    )}

    {bloqueado
      ? "Bloqueado"
      : doc.estado === "rechazado"
        ? "Reemplazar"
        : "Subir"}
  </button>
)}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {expedienteCompleto ? (
        <div className="bg-white rounded-2xl border border-green-200 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-green-100 bg-green-50 flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-green-600" />
            <div>
              <h3 className="font-bold text-green-700">
                Documentación de Asignación Disponible
              </h3>
              <p className="text-xs text-green-600 mt-0.5">
                Todos tus documentos iniciales fueron validados.
                Ya puedes consultar la documentación enviada por
                coordinación.
              </p>
            </div>
          </div>

          <div className="divide-y divide-gray-100">
            {docsAsignacion.map((doc) => (
              <div
                key={doc.id}
                className="px-6 py-5 flex flex-col sm:flex-row sm:items-center gap-4"
              >
                <div className="flex items-start gap-3 flex-1">
                  <div className="w-10 h-10 bg-green-50 rounded-xl flex items-center justify-center flex-shrink-0">
                    <FileText className="w-5 h-5 text-green-600" />
                  </div>

                  <div>
                    <div className="font-semibold text-gray-800 text-sm">
                      {doc.nombre}
                    </div>

                    <div className="text-xs text-gray-500 mt-0.5 leading-relaxed">
                      {doc.descripcion}
                    </div>

                    <div className="text-xs text-blue-500 mt-1">
                      📎 {doc.archivo} · {doc.fecha}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3 flex-shrink-0">
                  <span className="inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full font-semibold bg-green-100 text-green-700">
                    <CheckCircle className="w-3.5 h-3.5" />
                    Enviado por coordinación
                  </span>

                  <button
                    onClick={() => setPreview(doc)}
                    className="p-2 text-gray-400 hover:text-[#1565c0] hover:bg-blue-50 rounded-lg transition-colors"
                  >
                    <Eye className="w-4 h-4" />
                  </button>

                  <button className="px-4 py-2 bg-[#0d2b5e] text-white rounded-lg text-xs font-semibold hover:bg-[#1565c0] transition-colors">
                    Descargar
                  </button>
                </div>
              </div>
            ))}
          </div>
          <div className="border-t border-green-100 bg-white">
            <div className="px-6 py-4 bg-[#e3f0ff] border-b border-blue-100">
              <h3 className="font-bold text-[#0d2b5e]">
                Subir Documentos Firmados
              </h3>
              <p className="text-xs text-blue-700 mt-1">
                Descarga los documentos enviados por
                coordinación, llénalos y súbelos nuevamente en
                formato PDF.
              </p>
            </div>

            <div className="divide-y divide-gray-100">
              {[
                {
                  id: 201,
                  nombre: "Carta de Colaboración Firmada",
                  descripcion:
                    "Sube la carta de colaboración ya firmada y completamente llenada.",
                  nomenclatura:
                    "carta_colaboracion_firmada_matricula.pdf",
                },
                {
                  id: 202,
                  nombre: "Carta de Presentación Firmada",
                  descripcion:
                    "Sube la carta de presentación ya firmada por las partes correspondientes.",
                  nomenclatura:
                    "carta_presentacion_firmada_matricula.pdf",
                },
                {
                  id: 203,
                  nombre: "Carta de Asignación Firmada",
                  descripcion:
                    "Sube la carta de asignación ya firmada para continuar con el proceso.",
                  nomenclatura:
                    "carta_asignacion_firmada_matricula.pdf",
                },
              ].map((doc) => (
                <div
                  key={doc.id}
                  className="px-6 py-5 flex flex-col sm:flex-row sm:items-center gap-4"
                >
                  <div className="flex items-start gap-3 flex-1">
                    <div className="w-10 h-10 bg-[#e3f0ff] rounded-xl flex items-center justify-center flex-shrink-0">
                      <Upload className="w-5 h-5 text-[#1565c0]" />
                    </div>

                    <div>
                      <div className="font-semibold text-gray-800 text-sm">
                        {doc.nombre}
                      </div>

                      <div className="text-xs text-gray-500 mt-0.5">
                        {doc.descripcion}
                      </div>

                      <div className="text-xs text-[#1565c0] mt-1">
                        <span className="font-semibold">
                          Nomenclatura:
                        </span>{" "}
                        {doc.nomenclatura}
                      </div>

                      <div className="text-xs text-gray-500 mt-1">
                        Formato permitido: PDF. El documento
                        debe ser claro, legible y estar
                        completamente lleno.
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row gap-3 sm:items-center">
                    <input
                      type="file"
                      accept=".pdf"
                      className="block w-full text-xs text-gray-600
            file:mr-3 file:py-2 file:px-3
            file:rounded-lg file:border-0
            file:text-xs file:font-semibold
            file:bg-[#0d2b5e] file:text-white
            hover:file:bg-[#1565c0]"
                    />

                    <span className="inline-flex items-center justify-center gap-1.5 text-xs px-3 py-1.5 rounded-full font-semibold bg-gray-100 text-gray-500">
                      <Clock className="w-3.5 h-3.5" />
                      Pendiente
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-gray-50 border border-gray-200 rounded-2xl p-5 flex gap-4">
          <Clock className="w-6 h-6 text-gray-400 flex-shrink-0 mt-0.5" />
          <div>
            <div className="font-semibold text-gray-700 text-sm">
              Documentación de asignación aún no disponible
            </div>
            <div className="text-gray-500 text-xs mt-1 leading-relaxed">
              La carta de colaboración, carta de presentación y
              carta de asignación estarán disponibles cuando
              todos los documentos iniciales estén aprobados por
              coordinación.
            </div>
          </div>
        </div>
      )}

      {preview && (
        <div
          className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4"
          onClick={() => setPreview(null)}
        >
          <div
            className="bg-white rounded-2xl shadow-2xl max-w-lg w-full p-8"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-3 mb-6">
              <FileText className="w-8 h-8 text-[#1565c0]" />
              <div>
                <div className="font-bold text-[#0d2b5e]">
                  {preview.nombre}
                </div>
                <div className="text-xs text-gray-400">
                  {preview.archivo}
                </div>
              </div>
            </div>

            <div className="bg-gray-100 rounded-xl h-48 flex items-center justify-center mb-6">
              <div className="text-center text-gray-400">
                <FileText className="w-12 h-12 mx-auto mb-2 opacity-50" />
                <div className="text-sm">
                  Vista previa del documento
                </div>
              </div>
            </div>

            <div className="flex gap-3">
              <button className="flex-1 py-2.5 bg-[#0d2b5e] text-white rounded-xl text-sm font-semibold hover:bg-[#1565c0] transition-colors">
                Descargar
              </button>

              <button
                onClick={() => setPreview(null)}
                className="flex-1 py-2.5 border-2 border-gray-200 text-gray-600 rounded-xl text-sm font-semibold hover:bg-gray-50 transition-colors"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}