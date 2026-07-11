import { useEffect, useState } from "react";
import type { ChangeEvent } from "react";
import {
  AlertCircle,
  CheckCircle,
  Download,
  FileText,
  ShieldCheck,
  Upload,
  XCircle,
} from "lucide-react";

import { gestionDocumentacionEmpresaUseCase } from "../../dependencies";
import type { DocumentacionEmpresaResponse, RequisitoEmpresa } from "../../../domain/empresa/DocumentacionEmpresa";

type UsuarioSesion = {
  perfil?: {
    id_empresa?: number;
  };
};

const estadoColor: Record<string, string> = {
  Aprobado: "bg-green-100 text-green-700",
  Pendiente: "bg-yellow-100 text-yellow-700",
  Rechazado: "bg-red-100 text-red-700",
  Faltante: "bg-gray-100 text-gray-600",
};

function obtenerIdEmpresa() {
  const raw = localStorage.getItem("usuario");
  if (!raw) return null;

  try {
    const usuario = JSON.parse(raw) as UsuarioSesion;
    return usuario.perfil?.id_empresa ?? null;
  } catch {
    return null;
  }
}

function archivoABase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result).split(",", 2)[1] ?? "");
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

function urlArchivo(url: string) {
  return `http://127.0.0.1:8000${url}`;
}

export function ConveniosUnidad() {
  const [datos, setDatos] = useState<DocumentacionEmpresaResponse | null>(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");
  const [subiendo, setSubiendo] = useState<number | null>(null);

  const idEmpresa = obtenerIdEmpresa();

  useEffect(() => {
    void cargar();
  }, []);

  async function cargar() {
    if (!idEmpresa) {
      setError("No se encontro la empresa asociada a esta sesion.");
      setCargando(false);
      return;
    }

    try {
      setCargando(true);
      setError("");
      const respuesta = await gestionDocumentacionEmpresaUseCase.listarEmpresa(idEmpresa);
      setDatos(respuesta);
    } catch (err) {
      console.error(err);
      setError("No se pudo cargar la documentacion de la empresa.");
    } finally {
      setCargando(false);
    }
  }

  async function subirDocumento(requisito: RequisitoEmpresa, event: ChangeEvent<HTMLInputElement>) {
    const archivo = event.target.files?.[0];
    if (!archivo || !idEmpresa) return;

    try {
      setSubiendo(requisito.id_tipo_documento_empresa);
      setError("");
      const contenido = await archivoABase64(archivo);
      await gestionDocumentacionEmpresaUseCase.subirDocumento(idEmpresa, {
        id_tipo_documento_empresa: requisito.id_tipo_documento_empresa,
        nombre_archivo: archivo.name,
        contenido_base64: contenido,
        mime_type: archivo.type || "application/pdf",
      });
      await cargar();
    } catch (err) {
      console.error(err);
      setError("No se pudo subir el documento. Revisa que sea un PDF valido.");
    } finally {
      setSubiendo(null);
      event.target.value = "";
    }
  }

  if (cargando) {
    return (
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-10 text-center text-gray-500">
        Cargando documentacion empresarial...
      </div>
    );
  }

  const resumen = datos?.resumen;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[#0d2b5e]">Documentacion de Alta</h1>
        <p className="text-gray-500 text-sm mt-1">
          Descarga formatos institucionales y carga los documentos requeridos para validar la unidad receptora.
        </p>
      </div>

      {error && (
        <div className="bg-orange-50 border border-orange-200 rounded-xl px-4 py-3 text-sm text-orange-700">
          {error}
        </div>
      )}

      <div className="bg-gradient-to-r from-green-600 to-green-500 rounded-2xl p-6 text-white flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="font-bold text-xl">{datos?.empresa.nombre_empresa ?? "Empresa"}</div>
          <div className="text-green-100 text-sm mt-1">
            RFC: {datos?.empresa.rfc ?? "Sin RFC"} · Estado: {datos?.empresa.estado_empresa ?? "Pendiente"}
          </div>
        </div>

        <div className="bg-white/20 px-4 py-2 rounded-xl flex items-center gap-2">
          <ShieldCheck className="w-4 h-4" />
          <div className="text-white font-bold text-sm">
            {datos?.empresa.estado_empresa === "Activa" ? "PADRON ACTIVO" : "EN VALIDACION"}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 xl:grid-cols-4 gap-5">
        {[
          ["Aprobados", resumen?.aprobados ?? 0, CheckCircle, "bg-green-50 text-green-600"],
          ["Pendientes", resumen?.pendientes ?? 0, AlertCircle, "bg-yellow-50 text-yellow-600"],
          ["Rechazados", resumen?.rechazados ?? 0, XCircle, "bg-red-50 text-red-600"],
          ["Faltantes", resumen?.faltantes ?? 0, FileText, "bg-gray-50 text-gray-600"],
        ].map(([label, value, Icon, color]: any) => (
          <div key={label} className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5">
            <div className={`w-10 h-10 ${color} rounded-xl flex items-center justify-center mb-3`}>
              <Icon className="w-5 h-5" />
            </div>
            <div className="text-2xl font-bold text-[#0d2b5e]">{value}</div>
            <div className="text-gray-500 text-sm mt-0.5">{label}</div>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-2">
          <FileText className="w-5 h-5 text-[#1565c0]" />
          <h3 className="font-bold text-[#0d2b5e]">Requisitos Documentales</h3>
        </div>

        <div className="divide-y divide-gray-100">
          {datos?.documentos.map((requisito) => {
            const estado = requisito.documento?.estado_documento ?? "Faltante";

            return (
              <div key={requisito.id_tipo_documento_empresa} className="px-6 py-5 hover:bg-gray-50">
                <div className="flex flex-col xl:flex-row xl:items-start gap-5">
                  <div className="flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h4 className="font-bold text-gray-800 text-sm">{requisito.nombre}</h4>
                      <span className={`text-xs px-3 py-1 rounded-full font-semibold ${estadoColor[estado]}`}>
                        {estado}
                      </span>
                    </div>

                    <p className="text-xs text-gray-500 mt-2 leading-relaxed">
                      {requisito.descripcion ?? "Documento requerido para el expediente de la empresa."}
                    </p>

                    {requisito.documento?.observaciones && (
                      <div className="mt-3 text-xs text-red-700 bg-red-50 border border-red-100 rounded-xl px-4 py-3">
                        Observaciones: {requisito.documento.observaciones}
                      </div>
                    )}

                    <div className="text-xs text-gray-400 mt-3">
                      Archivo actual: {requisito.documento?.nombre_archivo ?? "Sin documento cargado"}
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2 xl:flex-col xl:w-44">
                    <button
                      onClick={() => requisito.formato && window.open(urlArchivo(requisito.formato.url), "_blank")}
                      disabled={!requisito.formato}
                      className="flex items-center justify-center gap-2 px-4 py-2 border border-blue-200 text-[#1565c0] rounded-lg text-xs font-semibold hover:bg-blue-50 disabled:opacity-50"
                    >
                      <Download className="w-3.5 h-3.5" />
                      Formato
                    </button>

                    <label className="flex items-center justify-center gap-2 px-4 py-2 bg-[#0d2b5e] text-white rounded-lg text-xs font-semibold hover:bg-[#1565c0] cursor-pointer">
                      <Upload className="w-3.5 h-3.5" />
                      {subiendo === requisito.id_tipo_documento_empresa ? "Subiendo..." : "Subir PDF"}
                      <input
                        type="file"
                        accept="application/pdf"
                        className="hidden"
                        disabled={subiendo === requisito.id_tipo_documento_empresa}
                        onChange={(event) => subirDocumento(requisito, event)}
                      />
                    </label>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
