import { useState } from "react";
import { useNavigate } from "react-router";
import { Building2, CheckCircle, ArrowLeft } from "lucide-react";
import { EmpresaApiRepository } from "../../../infrastructure/repositories/EmpresaApiRepository";

export function SolicitudEmpresaPublica() {
  const navigate = useNavigate();
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  const [form, setForm] = useState({
    empresa: "",
    responsable: "",
    correo: "",
    telefono: "",
    direccion: "",
    giro: "",
  });

  const set =
    (k: string) =>
    (
      e: React.ChangeEvent<
        HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
      >
    ) =>
      setForm((f) => ({ ...f, [k]: e.target.value }));

  const enviarSolicitud = async () => {
    try {
      setLoading(true);

      const repo = new EmpresaApiRepository();

      await repo.crear({
        id_usuario: null,
        nombre_empresa: form.empresa,
        rfc: null,
        giro: form.giro,
        domicilio: form.direccion,
        telefono: form.telefono,
        correo_contacto: form.correo,
      });

      setSubmitted(true);
    } catch (error) {
      alert("Error al enviar la solicitud");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="bg-white rounded-3xl shadow-sm border border-gray-200 p-12 max-w-md text-center">
          <CheckCircle className="w-20 h-20 text-green-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-[#0d2b5e] mb-2">
            Solicitud enviada
          </h2>
          <p className="text-gray-500 text-sm mb-4">
            Tu solicitud de registro fue enviada. La coordinación revisará la
            información y se pondrá en contacto contigo.
          </p>
          <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 text-sm text-yellow-800 mb-6">
            <strong>Estado:</strong> Pendiente de autorización
          </div>
          <button
            onClick={() => navigate("/")}
            className="w-full py-3 bg-[#0d2b5e] text-white rounded-xl font-bold"
          >
            Volver al inicio
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 px-4 py-8">
      <div className="max-w-2xl mx-auto">
        <button
          onClick={() => navigate("/")}
          className="mb-6 flex items-center gap-2 text-sm text-[#0d2b5e] font-semibold"
        >
          <ArrowLeft className="w-4 h-4" />
          Volver al inicio
        </button>

        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="bg-[#0d2b5e] px-6 py-4 flex items-center gap-3">
            <Building2 className="w-5 h-5 text-white" />
            <h3 className="font-bold text-white">
              Solicitud de Registro de Unidad Receptora
            </h3>
          </div>

          <div className="p-6 space-y-5">
            <div className="grid md:grid-cols-2 gap-5">
              <input
                placeholder="Nombre de la empresa"
                value={form.empresa}
                onChange={set("empresa")}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl text-sm"
              />

              <input
                placeholder="Responsable / Contacto"
                value={form.responsable}
                onChange={set("responsable")}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl text-sm"
              />

              <input
                placeholder="Correo electrónico"
                value={form.correo}
                onChange={set("correo")}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl text-sm"
              />

              <input
                placeholder="Teléfono"
                value={form.telefono}
                onChange={set("telefono")}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl text-sm"
              />
            </div>

            <textarea
              placeholder="Dirección"
              value={form.direccion}
              onChange={set("direccion")}
              rows={2}
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl text-sm resize-none"
            />

            <select
              value={form.giro}
              onChange={set("giro")}
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl text-sm bg-white"
            >
              <option value="">Selecciona giro / sector</option>
              <option>Tecnologías de la Información</option>
              <option>Salud y Medicina</option>
              <option>Educación</option>
              <option>Finanzas y Contabilidad</option>
              <option>Gobierno y Sector Público</option>
              <option>Comercio y Servicios</option>
              <option>Otro</option>
            </select>

            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 text-sm text-blue-700">
              Esta solicitud no crea acceso inmediato al sistema. La
              coordinación deberá revisar y aprobar la información.
            </div>

            <button
              onClick={enviarSolicitud}
              disabled={loading}
              className="w-full py-3.5 bg-[#0d2b5e] text-white rounded-xl font-bold disabled:opacity-60"
            >
              {loading ? "Enviando..." : "Enviar Solicitud"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}