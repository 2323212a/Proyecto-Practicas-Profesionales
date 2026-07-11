import { useState } from "react";
import { CheckCircle, Clock, FileText, Upload, XCircle } from "lucide-react";

export function VigenciaDerechos() {
  const [archivo, setArchivo] = useState<File | null>(null);
  const [estado, setEstado] = useState<"sin_archivo" | "pendiente" | "validado">("sin_archivo");

  const enviarVigencia = () => {
    if (!archivo) return;
    setEstado("pendiente");
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[#0d2b5e]">
          Vigencia de Derechos
        </h1>
        <p className="text-gray-500 text-sm mt-1">
          Sube tu constancia o documento de vigencia para que sea revisado y validado.
        </p>
      </div>

      <div
        className={`rounded-2xl p-6 flex items-center gap-5 ${
          estado === "validado"
            ? "bg-green-50 border border-green-200"
            : estado === "pendiente"
            ? "bg-yellow-50 border border-yellow-200"
            : "bg-red-50 border border-red-200"
        }`}
      >
        {estado === "validado" ? (
          <CheckCircle className="w-12 h-12 text-green-500 flex-shrink-0" />
        ) : estado === "pendiente" ? (
          <Clock className="w-12 h-12 text-yellow-500 flex-shrink-0" />
        ) : (
          <XCircle className="w-12 h-12 text-red-500 flex-shrink-0" />
        )}

        <div className="flex-1">
          <div
            className={`font-bold text-xl ${
              estado === "validado"
                ? "text-green-700"
                : estado === "pendiente"
                ? "text-yellow-700"
                : "text-red-700"
            }`}
          >
            {estado === "validado"
              ? "Vigencia validada"
              : estado === "pendiente"
              ? "Vigencia pendiente de validación"
              : "Vigencia no enviada"}
          </div>

          <div
            className={`text-sm mt-1 ${
              estado === "validado"
                ? "text-green-600"
                : estado === "pendiente"
                ? "text-yellow-600"
                : "text-red-600"
            }`}
          >
            {estado === "validado"
              ? "Tu documento fue revisado y aprobado por coordinación."
              : estado === "pendiente"
              ? "Tu vigencia fue enviada y se encuentra en revisión."
              : "Debes subir tu documento de vigencia para continuar con el proceso."}
          </div>
        </div>

        <span
          className={`text-xs px-4 py-2 rounded-full font-bold ${
            estado === "validado"
              ? "bg-green-100 text-green-700"
              : estado === "pendiente"
              ? "bg-yellow-100 text-yellow-700"
              : "bg-red-100 text-red-700"
          }`}
        >
          {estado === "validado"
            ? "Validado"
            : estado === "pendiente"
            ? "Pendiente"
            : "No validado"}
        </span>
      </div>

      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
        <div className="flex items-center gap-2 mb-4">
          <FileText className="w-5 h-5 text-[#1565c0]" />
          <h3 className="font-bold text-[#0d2b5e]">
            Documento de vigencia
          </h3>
        </div>

        <p className="text-gray-600 text-sm mb-5">
          Adjunta el archivo que compruebe que tus derechos escolares se encuentran vigentes.
        </p>

        <div className="border-2 border-dashed border-gray-300 rounded-2xl bg-gray-50 p-8 text-center">
          <Upload className="w-12 h-12 text-[#1565c0] mx-auto mb-3" />

          <p className="font-semibold text-gray-700 mb-2">
            Selecciona tu archivo
          </p>

          <p className="text-xs text-gray-500 mb-5">
            Formato permitido: PDF
          </p>

          <input
            type="file"
            accept=".pdf"
            onChange={(e) => {
              setArchivo(e.target.files?.[0] || null);
              setEstado("sin_archivo");
            }}
            className="block w-full text-sm text-gray-600
            file:mr-4 file:py-2 file:px-4
            file:rounded-lg file:border-0
            file:text-sm file:font-semibold
            file:bg-[#0d2b5e] file:text-white
            hover:file:bg-[#1565c0]"
          />

          {archivo && (
            <div className="mt-4 text-sm text-gray-700">
              Archivo seleccionado:{" "}
              <span className="font-semibold">{archivo.name}</span>
            </div>
          )}
        </div>

        <button
          onClick={enviarVigencia}
          disabled={!archivo}
          className={`mt-5 w-full py-3 rounded-xl font-semibold transition-colors ${
            archivo
              ? "bg-[#0d2b5e] text-white hover:bg-[#1565c0]"
              : "bg-gray-200 text-gray-400 cursor-not-allowed"
          }`}
        >
          Enviar vigencia para validación
        </button>
      </div>
    </div>
  );
}