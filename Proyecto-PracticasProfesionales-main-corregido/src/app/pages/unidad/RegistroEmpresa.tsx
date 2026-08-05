import { useEffect, useState } from "react";
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
import { gestionConfiguracionUseCase } from "../../dependencies";
import { getApiErrorMessage } from "../../../shared/utils/apiError";

type SolicitudEmpresaForm = {
  nombre_empresa: string;
  rfc: string;
  giro: string;
  giro_otro: string;
  domicilio: string;
  telefono: string;
  correo_contacto: string;
  nombre_responsable: string;
  apellido_paterno_responsable: string;
  apellido_materno_responsable: string;
  cargo_responsable: string;
  tipo_tramite: string;
  id_tipo_unidad_receptora: string;
  descripcion: string;
};

const FORM_INICIAL: SolicitudEmpresaForm = {
  nombre_empresa: "",
  rfc: "",
  giro: "",
  giro_otro: "",
  domicilio: "",
  telefono: "",
  correo_contacto: "",
  nombre_responsable: "",
  apellido_paterno_responsable: "",
  apellido_materno_responsable: "",
  cargo_responsable: "",
  tipo_tramite: "",
  id_tipo_unidad_receptora: "",
  descripcion: "",
};

const GIROS = [
  "Tecnología y desarrollo de software",
  "Servicios profesionales",
  "Educación",
  "Salud",
  "Gobierno / Administración pública",
  "Industria / Manufactura",
  "Comercio",
  "Turismo",
  "Construcción",
  "Agroindustria",
  "Telecomunicaciones",
  "Transporte y logística",
  "Finanzas / Contabilidad",
  "Energía",
  "Investigación",
  "Organización social / ONG",
  "Otro",
];

const inputClass =
  "w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-[#1565c0] text-sm";

export function RegistroEmpresa() {
  const navigate = useNavigate();
  const [submitted, setSubmitted] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState("");
  const [estadoSistema, setEstadoSistema] = useState("Activo");
  const [inscripcionEmpresasEstado, setInscripcionEmpresasEstado] = useState("Abierta");
  const [form, setForm] = useState<SolicitudEmpresaForm>(FORM_INICIAL);
  const [tiposUnidad, setTiposUnidad] = useState<Array<{
    id_tipo_unidad_receptora: number;
    nombre: string;
    descripcion?: string | null;
  }>>([]);

  useEffect(() => {
    gestionConfiguracionUseCase
      .obtener()
      .then((configuracion) => {
        setEstadoSistema(configuracion.estado_sistema);
        setInscripcionEmpresasEstado(configuracion.inscripcion_empresas_estado);
      })
      .catch((err) => console.error(err));
    apiClient
      .get<Array<{ id_tipo_unidad_receptora: number; nombre: string; descripcion?: string | null }>>(
        "/empresas/tipos-unidad-receptora",
      )
      .then(({ data }) => setTiposUnidad(data))
      .catch((err) => console.error(err));
  }, []);

  const registroBloqueado = estadoSistema !== "Activo" || inscripcionEmpresasEstado === "Cerrada";
  const mensajeBloqueo =
    estadoSistema === "Mantenimiento"
      ? "El sistema esta en mantenimiento. Intenta mas tarde."
        : estadoSistema === "Suspendido"
          ? "El sistema se encuentra suspendido temporalmente. Contacta a la administracion."
        : inscripcionEmpresasEstado === "Cerrada"
          ? "El registro de nuevas empresas esta cerrado por calendario de convocatoria."
          : "";

  const set =
    (campo: keyof SolicitudEmpresaForm) =>
    (event: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
      setForm((actual) => ({ ...actual, [campo]: event.target.value }));

  function validar() {
    if (!form.nombre_empresa.trim()) return "El nombre de la empresa es obligatorio.";
    if (!form.rfc.trim()) return "El RFC es obligatorio.";
    if (!form.correo_contacto.trim()) return "El correo de contacto es obligatorio.";
    if (!form.telefono.trim()) return "El telefono de contacto es obligatorio.";
    if (!form.nombre_responsable.trim()) return "El nombre del responsable es obligatorio.";
    if (!form.apellido_paterno_responsable.trim()) return "El apellido paterno del responsable es obligatorio.";
    if (!form.cargo_responsable.trim()) return "El cargo del responsable es obligatorio.";
    if (!form.giro.trim()) return "Selecciona el giro o sector.";
    if (form.giro === "Otro" && !form.giro_otro.trim()) return "Especifica el giro o sector de actividad.";
    if (!form.domicilio.trim()) return "El domicilio fiscal o de operacion es obligatorio.";
    if (!form.tipo_tramite) return "Selecciona el tipo de tramite.";
    if (!form.id_tipo_unidad_receptora) return "Selecciona el tipo de institución u organización.";
    return "";
  }

  async function enviarSolicitud() {
    if (registroBloqueado) {
      setError(
        inscripcionEmpresasEstado === "Cerrada" && estadoSistema === "Activo"
          ? "El registro de nuevas empresas esta cerrado por calendario de convocatoria."
          : "El registro de solicitudes esta temporalmente deshabilitado.",
      );
      return;
    }

    const validacion = validar();
    if (validacion) {
      setError(validacion);
      return;
    }

    try {
      setGuardando(true);
      setError("");
      const nombreCompletoResponsable = [
        form.nombre_responsable.trim(),
        form.apellido_paterno_responsable.trim(),
        form.apellido_materno_responsable.trim(),
      ]
        .filter(Boolean)
        .join(" ");

      await apiClient.post("/empresas/solicitudes", {
        nombre_empresa: form.nombre_empresa.trim(),
        rfc: form.rfc.trim(),
        giro: form.giro === "Otro" ? form.giro_otro.trim() : form.giro.trim(),
        domicilio: form.domicilio.trim(),
        telefono: form.telefono.trim(),
        correo_contacto: form.correo_contacto.trim(),
        nombre_responsable: form.nombre_responsable.trim(),
        apellido_paterno_responsable: form.apellido_paterno_responsable.trim(),
        apellido_materno_responsable: form.apellido_materno_responsable.trim() || null,
        cargo_responsable: form.cargo_responsable.trim(),
        nombre_contacto: nombreCompletoResponsable,
        cargo_contacto: form.cargo_responsable.trim(),
        tipo_tramite: form.tipo_tramite,
        id_tipo_unidad_receptora: Number(form.id_tipo_unidad_receptora),
        descripcion: form.descripcion.trim() || null,
      });
      setSubmitted(true);
      setForm(FORM_INICIAL);
    } catch (err: unknown) {
      console.error(err);
      setError(getApiErrorMessage(err, "No se pudo enviar la solicitud de registro."));
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

        {registroBloqueado && (
          <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 rounded-xl p-4 text-sm">
            <strong>Registro temporalmente deshabilitado.</strong> {mensajeBloqueo}
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

                <Campo label="Nombre(s) del responsable *" icon={User}>
                  <input value={form.nombre_responsable} onChange={set("nombre_responsable")} placeholder="Ej. Juan Carlos" className={inputClass} />
                </Campo>

                <Campo label="Apellido paterno del responsable *" icon={User}>
                  <input value={form.apellido_paterno_responsable} onChange={set("apellido_paterno_responsable")} placeholder="Ej. Perez" className={inputClass} />
                </Campo>

                <Campo label="Apellido materno del responsable" icon={User}>
                  <input value={form.apellido_materno_responsable} onChange={set("apellido_materno_responsable")} placeholder="Ej. Lopez" className={inputClass} />
                </Campo>

                <Campo label="Cargo del responsable *" icon={User}>
                  <input value={form.cargo_responsable} onChange={set("cargo_responsable")} placeholder="Ej. Gerente, Coordinador, RRHH" className={inputClass} />
                </Campo>

                <Campo label="Giro / Sector *" icon={Building2}>
                  <select value={form.giro} onChange={set("giro")} className={`${inputClass} bg-white`}>
                    <option value="">Selecciona...</option>
                    {GIROS.map((giro) => (
                      <option key={giro}>{giro}</option>
                    ))}
                  </select>
                  <p className="text-xs text-gray-500 mt-2">
                    Describe la actividad principal de tu empresa; no determina la documentación legal.
                  </p>
                  {form.giro === "Otro" && (
                    <input
                      value={form.giro_otro}
                      onChange={set("giro_otro")}
                      placeholder="Especifica el giro"
                      className={`${inputClass} mt-3`}
                    />
                  )}
                </Campo>

                <Campo label="Domicilio *" icon={Building2}>
                  <textarea value={form.domicilio} onChange={set("domicilio")} placeholder="Calle, colonia, ciudad, estado" rows={3} className={`${inputClass} resize-none`} />
                </Campo>

                <Campo label="Tipo de tramite *" icon={ClipboardCheck}>
                  <select value={form.tipo_tramite} onChange={set("tipo_tramite")} className={`${inputClass} bg-white`}>
                    <option value="">Selecciona...</option>
                    <option value="Convenio">Convenio</option>
                    <option value="Vinculacion">Vinculacion</option>
                  </select>
                  <p className="text-xs text-gray-500 mt-2">
                    Convenio: para recibir alumnos en practicas o residencia.
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    Vinculacion: para relacion institucional sin publicar vacantes necesariamente.
                  </p>
                </Campo>

                <Campo label="Tipo de institución u organización *" icon={Building2}>
                  <select
                    value={form.id_tipo_unidad_receptora}
                    onChange={set("id_tipo_unidad_receptora")}
                    className={`${inputClass} bg-white`}
                  >
                    <option value="">Selecciona...</option>
                    {tiposUnidad.map((tipo) => (
                      <option
                        key={tipo.id_tipo_unidad_receptora}
                        value={tipo.id_tipo_unidad_receptora}
                      >
                        {tipo.nombre}
                      </option>
                    ))}
                  </select>
                  <p className="text-xs text-gray-500 mt-2">
                    Selecciona la opción que mejor describa legalmente a tu institución. Esta información determina los documentos que deberás presentar.
                  </p>
                  {tiposUnidad.find((tipo) => String(tipo.id_tipo_unidad_receptora) === form.id_tipo_unidad_receptora)?.descripcion && (
                    <p className="text-xs text-blue-700 mt-2 rounded-lg border border-blue-100 bg-blue-50 px-3 py-2">
                      {tiposUnidad.find((tipo) => String(tipo.id_tipo_unidad_receptora) === form.id_tipo_unidad_receptora)?.descripcion}
                    </p>
                  )}
                </Campo>

              </div>

              <Campo label="Descripcion de actividades o ?reas disponibles" icon={FileText}>
                <textarea
                  value={form.descripcion}
                  onChange={set("descripcion")}
                  placeholder="Describe brevemente las ?reas donde podrian integrarse alumnos de practicas."
                  rows={4}
                  className={`${inputClass} resize-none`}
                />
              </Campo>

              <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 text-sm text-blue-700">
                Al enviar la solicitud, la empresa queda en estado Pendiente. Coordinacion puede aprobarla para habilitarla o declinarla si no cumple los requisitos.
              </div>

              <button
                onClick={enviarSolicitud}
                disabled={guardando || registroBloqueado}
                className="w-full py-3.5 bg-[#0d2b5e] text-white rounded-xl font-bold hover:bg-[#1565c0] transition-colors shadow-lg text-sm disabled:opacity-60"
              >
                {registroBloqueado
                  ? "Registro temporalmente deshabilitado"
                  : guardando
                    ? "Enviando solicitud..."
                    : "Enviar solicitud de revisión"}
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
