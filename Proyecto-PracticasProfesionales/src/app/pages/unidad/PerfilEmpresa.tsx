import { useEffect, useState } from "react";
import {
  Building2,
  Mail,
  Phone,
  MapPin,
  FileText,
  CheckCircle,
  User,
  Briefcase,
  Globe,
  BadgeCheck,
} from "lucide-react";
import { EmpresaApiRepository } from "../../../infrastructure/repositories/EmpresaApiRepository";
import { ResponsableEmpresaApiRepository } from "../../../infrastructure/repositories/ResponsableEmpresaApiRepository";

import type { Empresa } from "../../../domain/empresa/Empresa";
import type { ResponsableEmpresa } from "../../../domain/empresa/ResponsableEmpresa";

export function PerfilEmpresa() {
  const [empresa, setEmpresa] = useState<Empresa | null>(null);
  const [responsables, setResponsables] = useState<ResponsableEmpresa[]>([]);
  const [loading, setLoading] = useState(true);

  const [formResponsable, setFormResponsable] = useState({
    nombre_completo: "",
    cargo: "",
    correo: "",
    telefono: "",
  });

  const empresaRepo = new EmpresaApiRepository();
  const responsableRepo = new ResponsableEmpresaApiRepository();

  const cargarDatos = async () => {
    try {
      const empresas = await empresaRepo.listar();
      const usuario = JSON.parse(localStorage.getItem("usuario") || "{}");

      const miEmpresa = empresas.find(
        (empresa) => empresa.id_usuario === usuario.id_usuario
      );

      if (miEmpresa) {
        setEmpresa(miEmpresa);

        const responsablesEmpresa = await responsableRepo.listarPorEmpresa(
          miEmpresa.id_empresa
        );

        setResponsables(responsablesEmpresa);
      }
    } catch (error) {
      console.error("Error al cargar empresa:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargarDatos();
  }, []);

  const registrarResponsable = async () => {
    if (!empresa) return;

    await responsableRepo.crear({
      id_empresa: empresa.id_empresa,
      nombre_completo: formResponsable.nombre_completo,
      cargo: formResponsable.cargo,
      correo: formResponsable.correo,
      telefono: formResponsable.telefono,
    });

    setFormResponsable({
      nombre_completo: "",
      cargo: "",
      correo: "",
      telefono: "",
    });

    cargarDatos();
  };

  if (loading) {
    return <div className="text-gray-500">Cargando perfil de empresa...</div>;
  }

  if (!empresa) {
    return (
      <div className="bg-white rounded-2xl border border-gray-200 p-6">
        <h1 className="text-2xl font-bold text-[#0d2b5e]">
          Perfil de Empresa
        </h1>
        <p className="text-gray-500 mt-2">
          No hay empresa registrada todavía.
        </p>
      </div>
    );
  }

  const datosEmpresa = [
    { label: "Razón Social", value: empresa.nombre_empresa, icon: Building2 },
    { label: "RFC", value: empresa.rfc || "No registrado", icon: FileText },
    { label: "Correo", value: empresa.correo_contacto || "No registrado", icon: Mail },
    { label: "Teléfono", value: empresa.telefono || "No registrado", icon: Phone },
    { label: "Dirección", value: empresa.domicilio || "No registrado", icon: MapPin },
    { label: "Sitio Web", value: "No registrado", icon: Globe },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[#0d2b5e]">
          Perfil de Empresa
        </h1>
        <p className="text-gray-500 text-sm mt-1">
          Información general de la unidad receptora registrada en el sistema.
        </p>
      </div>

      <div className="bg-gradient-to-r from-green-600 to-green-500 rounded-2xl p-6 text-white flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center">
            <Building2 className="w-9 h-9 text-white" />
          </div>

          <div>
            <div className="font-bold text-xl">{empresa.nombre_empresa}</div>
            <div className="text-green-100 text-sm mt-1">
              Unidad Receptora registrada en el sistema
            </div>
            <div className="text-green-100 text-xs mt-1">
              Giro: {empresa.giro || "No registrado"}
            </div>
          </div>
        </div>

        <div className="bg-white/20 px-4 py-2 rounded-xl flex items-center gap-2">
          <BadgeCheck className="w-4 h-4" />
          <div className="text-white font-bold text-sm">
            {empresa.estado_empresa}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 xl:grid-cols-4 gap-5">
        {[
          {
            label: "Estado",
            value: empresa.estado_empresa,
            icon: CheckCircle,
            color: "bg-green-50 text-green-600",
          },
          {
            label: "Alumnos asignados",
            value: "0",
            icon: User,
            color: "bg-blue-50 text-blue-600",
          },
          {
            label: "Convenios vigentes",
            value: "0",
            icon: FileText,
            color: "bg-purple-50 text-purple-600",
          },
          {
            label: "Planes disponibles",
            value: "0",
            icon: Briefcase,
            color: "bg-orange-50 text-orange-600",
          },
        ].map((item) => (
          <div
            key={item.label}
            className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5"
          >
            <div
              className={`w-10 h-10 ${item.color} rounded-xl flex items-center justify-center mb-3`}
            >
              <item.icon className="w-5 h-5" />
            </div>
            <div className="text-2xl font-bold text-[#0d2b5e]">
              {item.value}
            </div>
            <div className="text-gray-500 text-sm mt-0.5">{item.label}</div>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
        <h3 className="font-bold text-[#0d2b5e] mb-4">Datos Generales</h3>

        <div className="grid md:grid-cols-2 gap-4">
          {datosEmpresa.map((d) => (
            <div
              key={d.label}
              className="p-4 rounded-xl border border-gray-100 bg-gray-50"
            >
              <div className="flex items-start gap-3">
                <div className="w-9 h-9 bg-[#e3f0ff] rounded-lg flex items-center justify-center flex-shrink-0">
                  <d.icon className="w-4 h-4 text-[#1565c0]" />
                </div>

                <div>
                  <div className="text-xs text-gray-400 font-medium">
                    {d.label}
                  </div>
                  <div className="text-sm text-gray-800 font-semibold mt-0.5">
                    {d.value}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
        <h3 className="font-bold text-[#0d2b5e] mb-4">
          Responsables de la Empresa
        </h3>

        <div className="grid md:grid-cols-2 gap-4 mb-6">
          <input
            placeholder="Nombre completo"
            value={formResponsable.nombre_completo}
            onChange={(e) =>
              setFormResponsable({
                ...formResponsable,
                nombre_completo: e.target.value,
              })
            }
            className="px-4 py-3 border-2 border-gray-200 rounded-xl text-sm"
          />

          <input
            placeholder="Cargo"
            value={formResponsable.cargo}
            onChange={(e) =>
              setFormResponsable({
                ...formResponsable,
                cargo: e.target.value,
              })
            }
            className="px-4 py-3 border-2 border-gray-200 rounded-xl text-sm"
          />

          <input
            placeholder="Correo"
            value={formResponsable.correo}
            onChange={(e) =>
              setFormResponsable({
                ...formResponsable,
                correo: e.target.value,
              })
            }
            className="px-4 py-3 border-2 border-gray-200 rounded-xl text-sm"
          />

          <input
            placeholder="Teléfono"
            value={formResponsable.telefono}
            onChange={(e) =>
              setFormResponsable({
                ...formResponsable,
                telefono: e.target.value,
              })
            }
            className="px-4 py-3 border-2 border-gray-200 rounded-xl text-sm"
          />
        </div>

        <button
          onClick={registrarResponsable}
          className="mb-6 px-5 py-3 bg-[#0d2b5e] text-white rounded-xl font-bold hover:bg-[#1565c0]"
        >
          Registrar Responsable
        </button>

        <div className="space-y-3">
          {responsables.length === 0 ? (
            <p className="text-sm text-gray-500">
              No hay responsables registrados.
            </p>
          ) : (
            responsables.map((responsable) => (
              <div
                key={responsable.id_responsable}
                className="p-4 rounded-xl border border-gray-100 bg-gray-50"
              >
                <div className="font-semibold text-[#0d2b5e]">
                  {responsable.nombre_completo}
                </div>
                <div className="text-sm text-gray-500">
                  {responsable.cargo}
                </div>
                <div className="text-sm text-gray-500">
                  {responsable.correo}
                </div>
                <div className="text-sm text-gray-500">
                  {responsable.telefono}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}