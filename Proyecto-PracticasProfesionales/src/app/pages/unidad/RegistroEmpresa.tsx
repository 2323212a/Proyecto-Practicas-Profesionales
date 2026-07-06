import { useEffect, useState } from "react";
import { Building2, CheckCircle } from "lucide-react";
import { EmpresaApiRepository } from "../../../infrastructure/repositories/EmpresaApiRepository";

export function RegistroEmpresa() {
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    empresa: "",
    responsable: "",
    correo: "",
    telefono: "",
    direccion: "",
    giro: "",
    vacantes: "1",
  });

  const empresaRepository = new EmpresaApiRepository();

  useEffect(() => {
  const cargarEmpresa = async () => {
    const usuario = JSON.parse(localStorage.getItem("usuario") || "{}");

    try {
      const empresas = await empresaRepository.listar();

      const miEmpresa = empresas.find(
        (empresa) => empresa.id_usuario === usuario.id_usuario
      );

      if (miEmpresa) {
        setForm({
          empresa: miEmpresa.nombre_empresa || "",
          responsable: "",
          correo: miEmpresa.correo_contacto || "",
          telefono: miEmpresa.telefono || "",
          direccion: miEmpresa.domicilio || "",
          giro: miEmpresa.giro || "",
          vacantes: "1",
        });
      }
    } catch (error) {
      console.error("Error al cargar empresa:", error);
    }
  };

  cargarEmpresa();
}, []);

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

    const usuario = JSON.parse(localStorage.getItem("usuario") || "{}");

    const data = {
      id_usuario: usuario.id_usuario,
      nombre_empresa: form.empresa,
      rfc: null,
      giro: form.giro,
      domicilio: form.direccion,
      telefono: form.telefono,
      correo_contacto: form.correo,
    };

    const empresas = await empresaRepository.listar();

    const miEmpresa = empresas.find(
      (empresa) => empresa.id_usuario === usuario.id_usuario
    );

    if (miEmpresa) {
      await empresaRepository.actualizar(miEmpresa.id_empresa, data);
    } else {
      await empresaRepository.crear(data);
    }

    setSubmitted(true);
  } catch (error) {
    alert("Error al guardar la empresa");
  } finally {
    setLoading(false);
  }
};

  if (submitted)
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="bg-white rounded-3xl shadow-sm border border-gray-200 p-12 max-w-md text-center">
          <CheckCircle className="w-20 h-20 text-green-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-[#0d2b5e] mb-2">
            Solicitud enviada
          </h2>
          <p className="text-gray-500 text-sm mb-4">
            Tu solicitud de registro fue enviada. El coordinador revisará tu
            información y te notificará en los próximos días hábiles.
          </p>
          <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 text-left text-sm text-yellow-800">
            <strong>Estado:</strong> Pendiente de autorización
          </div>
        </div>
      </div>
    );

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold text-[#0d2b5e]">
          Registro / Actualización de Empresa
        </h1>
        <p className="text-gray-500 text-sm mt-1">
          Formulario para registrar una nueva Unidad Receptora de Prácticas
        </p>
      </div>

      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="bg-[#0d2b5e] px-6 py-4 flex items-center gap-3">
          <Building2 className="w-5 h-5 text-white" />
          <h3 className="font-bold text-white">Datos de la Empresa</h3>
        </div>

        <div className="p-6 space-y-5">
          <div className="grid md:grid-cols-2 gap-5">
            {[
              {
                l: "Nombre de la Empresa *",
                k: "empresa",
                t: "text",
                p: "Nombre oficial",
              },
              {
                l: "Responsable / Contacto *",
                k: "responsable",
                t: "text",
                p: "Nombre del responsable",
              },
            ].map((f) => (
              <div key={f.k}>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  {f.l}
                </label>
                <input
                  type={f.t}
                  value={(form as any)[f.k]}
                  onChange={set(f.k)}
                  placeholder={f.p}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-[#1565c0] text-sm"
                />
              </div>
            ))}
          </div>

          <div className="grid md:grid-cols-2 gap-5">
            {[
              {
                l: "Correo Electrónico *",
                k: "correo",
                t: "email",
                p: "contacto@empresa.com",
              },
              {
                l: "Teléfono *",
                k: "telefono",
                t: "tel",
                p: "961 123 4567",
              },
            ].map((f) => (
              <div key={f.k}>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  {f.l}
                </label>
                <input
                  type={f.t}
                  value={(form as any)[f.k]}
                  onChange={set(f.k)}
                  placeholder={f.p}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-[#1565c0] text-sm"
                />
              </div>
            ))}
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Dirección *
            </label>
            <textarea
              value={form.direccion}
              onChange={set("direccion")}
              placeholder="Calle, colonia, ciudad, estado"
              rows={2}
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-[#1565c0] text-sm resize-none"
            />
          </div>

          <div className="grid md:grid-cols-2 gap-5">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Giro / Sector
              </label>
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
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Número de Vacantes
              </label>
              <input
                type="number"
                min="1"
                value={form.vacantes}
                onChange={set("vacantes")}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-[#1565c0] text-sm"
              />
            </div>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 text-sm text-blue-700">
            Al enviar esta solicitud, aceptas que la UNACH verifique la
            información. El proceso de autorización puede tardar 3 a 5 días
            hábiles.
          </div>

          <button
            onClick={enviarSolicitud}
            disabled={loading}
            className="w-full py-3.5 bg-[#0d2b5e] text-white rounded-xl font-bold hover:bg-[#1565c0] transition-colors shadow-lg text-sm disabled:opacity-60"
          >
            {loading ? "Guardando..." : "Guardar Información"}
          </button>
        </div>
      </div>
    </div>
  );
}