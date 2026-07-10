import { useState } from "react";
import { useNavigate } from "react-router";
import { Building2, CheckCircle, AlertCircle } from "lucide-react";
import { registrarSolicitudUnidad } from "../../../infrastructure/coord-unidades/coordUnidadesApi";

export function RegistroEmpresa() {
  const navigate = useNavigate();
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({
    nombre_empresa: "",
    rfc: "",
    giro: "",
    domicilio: "",
    telefono: "",
    correo_contacto: "",
  });

  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  const handleEnviar = async () => {
    try {
      setLoading(true);
      setError(null);
      await registrarSolicitudUnidad(form);
      setSubmitted(true);
      setTimeout(() => navigate("/"), 3000);
    } catch (err: any) {
      if (err.response?.status === 409) {
        setError(err.response?.data?.detail || "Error en la solicitud");
      } else if (err.response?.status === 400) {
        setError("Por favor completa todos los campos correctamente");
      } else {
        setError("Error al enviar la solicitud. Intenta nuevamente.");
      }
    } finally {
      setLoading(false);
    }
  };

  if (submitted)
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="bg-white rounded-3xl shadow-sm border border-gray-200 p-12 max-w-md text-center">
          <CheckCircle className="w-20 h-20 text-green-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-[#0d2b5e] mb-2">Solicitud enviada correctamente</h2>
          <p className="text-gray-500 text-sm mb-4">
            Tu solicitud de registro fue enviada. El coordinador revisará tu información y te notificará en los próximos días hábiles.
          </p>
          <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 text-left text-sm text-yellow-800">
            <strong>Estado:</strong> Pendiente de autorización
          </div>
          <p className="text-gray-400 text-xs mt-4">Serás redirigido a la página principal en 3 segundos...</p>
        </div>
      </div>
    );

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold text-[#0d2b5e]">Solicitud de Registro - Unidad Receptora</h1>
        <p className="text-gray-500 text-sm mt-1">Completa el formulario para registrar tu empresa como unidad receptora de prácticas profesionales</p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-2xl p-4 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold text-red-700 text-sm">{error}</p>
          </div>
        </div>
      )}

      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="bg-[#0d2b5e] px-6 py-4 flex items-center gap-3">
          <Building2 className="w-5 h-5 text-white" />
          <h3 className="font-bold text-white">Datos de la Empresa</h3>
        </div>
        <div className="p-6 space-y-5">
          <div className="grid md:grid-cols-2 gap-5">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Nombre de la Empresa *</label>
              <input
                type="text"
                value={form.nombre_empresa}
                onChange={set("nombre_empresa")}
                placeholder="Nombre oficial"
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-[#1565c0] text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">RFC *</label>
              <input
                type="text"
                value={form.rfc}
                onChange={set("rfc")}
                placeholder="Ej: ABC123456XYZ"
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-[#1565c0] text-sm"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Giro / Sector *</label>
            <select
              value={form.giro}
              onChange={set("giro")}
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-[#1565c0] text-sm bg-white"
            >
              <option value="">Selecciona...</option>
              {[
                "Tecnologías de la Información",
                "Salud y Medicina",
                "Educación",
                "Finanzas y Contabilidad",
                "Ingeniería y Construcción",
                "Gobierno y Sector Público",
                "Comercio y Servicios",
                "Otro",
              ].map((g) => (
                <option key={g}>{g}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Domicilio *</label>
            <textarea
              value={form.domicilio}
              onChange={set("domicilio")}
              placeholder="Calle, número, colonia, ciudad, estado, código postal"
              rows={2}
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-[#1565c0] text-sm resize-none"
            />
          </div>

          <div className="grid md:grid-cols-2 gap-5">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Teléfono *</label>
              <input
                type="tel"
                value={form.telefono}
                onChange={set("telefono")}
                placeholder="961 123 4567"
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-[#1565c0] text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Correo Electrónico *</label>
              <input
                type="email"
                value={form.correo_contacto}
                onChange={set("correo_contacto")}
                placeholder="contacto@empresa.com"
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-[#1565c0] text-sm"
              />
            </div>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 text-sm text-blue-700">
            Al enviar esta solicitud, aceptas que la UNACH verifique la información. El proceso de autorización puede tardar 3 a 5 días hábiles.
          </div>

          <div className="flex gap-3">
            <button
              onClick={handleEnviar}
              disabled={loading}
              className="flex-1 py-3.5 bg-[#0d2b5e] text-white rounded-xl font-bold hover:bg-[#1565c0] transition-colors shadow-lg text-sm disabled:bg-gray-400"
            >
              {loading ? "Enviando..." : "Enviar Solicitud"}
            </button>
            <button
              onClick={() => navigate("/")}
              className="flex-1 py-3.5 border-2 border-gray-200 text-[#0d2b5e] rounded-xl font-bold hover:bg-gray-50 transition-colors text-sm"
            >
              Cancelar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
