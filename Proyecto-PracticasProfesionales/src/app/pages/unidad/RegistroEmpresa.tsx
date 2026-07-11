import { useState } from "react";
import type { ChangeEvent, ReactNode } from "react";
import { useNavigate } from "react-router";
import {
  ArrowLeft,
  Building2,
  CheckCircle,
  ClipboardCheck,
  FileText,
  Mail,
  Phone,
  User,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

import { apiClient } from "../../../infrastructure/api/apiClient";

type SolicitudEmpresaForm = {
  nombre_empresa: string;
  rfc: string;
  giro: string;
  domicilio: string;
  telefono: string;
  correo_contacto: string;
  nombre_contacto: string;
  cargo_contacto: string;
  descripcion: string;
};

const FORM_INICIAL: SolicitudEmpresaForm = {
  nombre_empresa: "",
  rfc: "",
  giro: "",
  domicilio: "",
  telefono: "",
  correo_contacto: "",
  nombre_contacto: "",
  cargo_contacto: "",
  descripcion: "",
};

const GIROS = [
  "Tecnologias de la Informacion",
  "Salud y Medicina",
  "Educacion",
  "Finanzas y Contabilidad",
  "Ingenieria y Construccion",
  "Gobierno y Sector Publico",
  "Comercio y Servicios",
  "Investigacion y Desarrollo",
  "Otro",
];

const inputClass =
  "w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-[#1565c0] text-sm";

export function RegistroEmpresa() {
  const navigate = useNavigate();
  const [submitted, setSubmitted] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState<SolicitudEmpresaForm>(FORM_INICIAL);

  const set =
    (campo: keyof SolicitudEmpresaForm) =>
    (event: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
      setForm((actual) => ({ ...actual, [campo]: event.target.value }));

  function validar() {
    if (!form.nombre_empresa.trim()) return "El nombre de la empresa es obligatorio.";
    if (!form.rfc.trim()) return "El RFC es obligatorio.";
    if (!form.correo_contacto.trim()) return "El correo de contacto es obligatorio.";
    if (!form.telefono.trim()) return "El telefono de contacto es obligatorio.";
    if (!form.nombre_contacto.trim()) return "El nombre del contacto es obligatorio.";
    if (!form.cargo_contacto.trim()) return "El cargo del contacto es obligatorio.";
    if (!form.giro.trim()) return "Selecciona el giro o sector.";
    if (!form.domicilio.trim()) return "El domicilio fiscal o de operacion es obligatorio.";
    return "";
  }

  async function enviarSolicitud() {
    const validacion = validar();
    if (validacion) {
      setError(validacion);
      return;
    }

    try {
      setGuardando(true);
      setError("");
      await apiClient.post("/empresas/solicitudes", {
        nombre_empresa: form.nombre_empresa.trim(),
        rfc: form.rfc.trim(),
        giro: form.giro.trim(),
        domicilio: form.domicilio.trim(),
        telefono: form.telefono.trim(),
        correo_contacto: form.correo_contacto.trim(),
        nombre_contacto: form.nombre_contacto.trim(),
        cargo_contacto: form.cargo_contacto.trim(),
        descripcion: form.descripcion.trim() || null,
      });
      setSubmitted(true);
      setForm(FORM_INICIAL);
    } catch (err: any) {
      console.error(err);
      setError(err?.response?.data?.detail ?? "No se pudo enviar la solicitud de registro.");
    } finally {
      setGuardando(false);
    }
  }

  if (submitted) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="bg-white rounded-3xl shadow-sm border border-gray-200 p-10 max-w-lg text-center">
          <CheckCircle className="w-20 h-20 text-green-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-[#0d2b5e] mb-2">Solicitud enviada</h2>
          <p className="text-gray-500 text-sm mb-5">
            Coordinador de Unidades Receptoras revisara la informacion. Si la solicitud es aprobada, la empresa podra ser habilitada en el sistema.
          </p>
          <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 text-left text-sm text-yellow-800 mb-5">
            <strong>Estado inicial:</strong> Pendiente de autorizacion. Esta solicitud no crea una cuenta de acceso automaticamente.
          </div>
          <div className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={() => navigate("/")}
              className="flex-1 border border-gray-200 rounded-xl py-3 text-sm font-semibold text-gray-700"
            >
              Volver al inicio
            </button>
            <button
              onClick={() => navigate("/login")}
              className="flex-1 bg-[#0d2b5e] text-white rounded-xl py-3 text-sm font-semibold"
            >
              Ir a iniciar sesion
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-[#0d2b5e] text-white px-6 py-5">
        <div className="max-w-5xl mx-auto flex items-center justify-between gap-4">
          <button
            onClick={() => navigate("/")}
            className="flex items-center gap-2 text-white/80 hover:text-white text-sm"
          >
            <ArrowLeft className="w-4 h-4" />
            Inicio
          </button>
          <div className="flex items-center gap-2 font-bold">
            <Building2 className="w-5 h-5" />
            Solicitud de Unidad Receptora
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-10 space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-[#0d2b5e]">Registro de empresa nueva</h1>
          <p className="text-gray-500 text-sm mt-2 max-w-3xl">
            Este formulario registra una solicitud para que Coordinador de Unidades Receptoras revise si la empresa es apta para recibir alumnos. La aprobacion es necesaria antes de publicar vacantes o aparecer en el padron.
          </p>
        </div>

        {error && (
          <div className="bg-orange-50 border border-orange-200 text-orange-700 rounded-xl p-4 text-sm">
            {error}
          </div>
        )}

        <div className="grid lg:grid-cols-[1fr_320px] gap-6">
          <section className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="bg-[#0d2b5e] px-6 py-4 flex items-center gap-3">
              <ClipboardCheck className="w-5 h-5 text-white" />
              <h3 className="font-bold text-white">Datos para revision</h3>
            </div>

            <div className="p-6 space-y-6">
              <div className="grid md:grid-cols-2 gap-5">
                <Campo label="Nombre oficial de la empresa *" icon={Building2}>
                  <input value={form.nombre_empresa} onChange={set("nombre_empresa")} placeholder="Razon social o nombre comercial" className={inputClass} />
                </Campo>

                <Campo label="RFC *" icon={FileText}>
                  <input value={form.rfc} onChange={set("rfc")} placeholder="RFC de la empresa" className={`${inputClass} uppercase`} />
                </Campo>

                <Campo label="Correo de contacto *" icon={Mail}>
                  <input type="email" value={form.correo_contacto} onChange={set("correo_contacto")} placeholder="contacto@empresa.com" className={inputClass} />
                </Campo>

                <Campo label="Telefono de contacto *" icon={Phone}>
                  <input value={form.telefono} onChange={set("telefono")} placeholder="961 123 4567" className={inputClass} />
                </Campo>

                <Campo label="Nombre del responsable *" icon={User}>
                  <input value={form.nombre_contacto} onChange={set("nombre_contacto")} placeholder="Persona que atendera la revision" className={inputClass} />
                </Campo>

                <Campo label="Cargo del responsable *" icon={User}>
                  <input value={form.cargo_contacto} onChange={set("cargo_contacto")} placeholder="Ej. Gerente, Coordinador, RRHH" className={inputClass} />
                </Campo>

                <Campo label="Giro / Sector *" icon={Building2}>
                  <select value={form.giro} onChange={set("giro")} className={`${inputClass} bg-white`}>
                    <option value="">Selecciona...</option>
                    {GIROS.map((giro) => (
                      <option key={giro}>{giro}</option>
                    ))}
                  </select>
                </Campo>

                <Campo label="Domicilio *" icon={Building2}>
                  <textarea value={form.domicilio} onChange={set("domicilio")} placeholder="Calle, colonia, ciudad, estado" rows={3} className={`${inputClass} resize-none`} />
                </Campo>
              </div>

              <Campo label="Descripcion de actividades o areas disponibles" icon={FileText}>
                <textarea
                  value={form.descripcion}
                  onChange={set("descripcion")}
                  placeholder="Describe brevemente las areas donde podrian integrarse alumnos de practicas."
                  rows={4}
                  className={`${inputClass} resize-none`}
                />
              </Campo>

              <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 text-sm text-blue-700">
                Al enviar la solicitud, la empresa queda en estado Pendiente. Coordinacion puede aprobarla para habilitarla o declinarla si no cumple los requisitos.
              </div>

              <button
                onClick={enviarSolicitud}
                disabled={guardando}
                className="w-full py-3.5 bg-[#0d2b5e] text-white rounded-xl font-bold hover:bg-[#1565c0] transition-colors shadow-lg text-sm disabled:opacity-60"
              >
                {guardando ? "Enviando solicitud..." : "Enviar solicitud de revision"}
              </button>
            </div>
          </section>

          <aside className="space-y-4">
            {[
              "La solicitud no crea acceso inmediato al sistema.",
              "Coordinacion revisa datos generales y documentacion posterior.",
              "Despues de aprobarse, la empresa puede registrar vacantes.",
              "Solo empresas habilitadas aparecen en el padron de alumnos.",
            ].map((item) => (
              <div key={item} className="bg-white border border-gray-200 rounded-2xl p-4 flex gap-3">
                <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-gray-600">{item}</p>
              </div>
            ))}
          </aside>
        </div>
      </main>
    </div>
  );
}

function Campo({
  label,
  icon: Icon,
  children,
}: {
  label: string;
  icon: LucideIcon;
  children: ReactNode;
}) {
  return (
    <label className="block">
      <span className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
        <Icon className="w-4 h-4 text-[#1565c0]" />
        {label}
      </span>
      {children}
    </label>
  );
}
