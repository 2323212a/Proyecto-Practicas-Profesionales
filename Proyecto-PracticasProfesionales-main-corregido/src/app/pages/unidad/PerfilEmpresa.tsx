import { useEffect, useState } from "react";
import {
  BadgeCheck,
  Briefcase,
  Building2,
  CalendarDays,
  CheckCircle,
  FileText,
  Mail,
  MapPin,
  Phone,
  User,
} from "lucide-react";

import type { PerfilUnidadResponse } from "../../../domain/unidad/UnidadDashboard";
import { obtenerPerfilUnidad } from "../../../infrastructure/unidad/unidadDashboardApi";

function empresaHabilitada(estado?: string | null) {
  return ["Activa", "Aprobada"].includes(estado ?? "");
}

function estadoVisualConvenio(convenio: PerfilUnidadResponse["convenios"][number]) {
  if (!convenio.es_actual) {
    return { etiqueta: "Historico", clase: "bg-gray-100 text-gray-600" };
  }
  if (convenio.estado_convenio === "Vigente") {
    return { etiqueta: "Vigente actual", clase: "bg-green-100 text-green-700" };
  }
  if (convenio.estado_convenio === "Pendiente") {
    return { etiqueta: "Pendiente", clase: "bg-yellow-100 text-yellow-700" };
  }
  return { etiqueta: convenio.estado_convenio, clase: "bg-red-100 text-red-700" };
}

export function PerfilEmpresa() {
  const [datos, setDatos] = useState<PerfilUnidadResponse | null>(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    void cargar();
  }, []);

  async function cargar() {
    try {
      setCargando(true);
      setError("");
      setDatos(await obtenerPerfilUnidad());
    } catch (err) {
      console.error(err);
      setError("No se pudo cargar el perfil de empresa.");
    } finally {
      setCargando(false);
    }
  }

  const empresa = datos?.empresa;
  const habilitada = empresaHabilitada(empresa?.estado_empresa);
  const datosEmpresa = [
    { label: "Razon social", value: empresa?.nombre_empresa ?? "Sin nombre", icon: Building2 },
    { label: "RFC", value: empresa?.rfc ?? "Sin RFC", icon: FileText },
    { label: "Correo", value: empresa?.correo_contacto ?? "Sin correo", icon: Mail },
    { label: "Telefono", value: empresa?.telefono ?? "Sin telefono", icon: Phone },
    { label: "Direccion", value: empresa?.domicilio ?? "Sin domicilio", icon: MapPin },
    { label: "Giro", value: empresa?.giro ?? "Sin giro", icon: Briefcase },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[#0d2b5e]">Perfil de Empresa</h1>
        <p className="text-gray-500 text-sm mt-1">
          Informacion general de la unidad receptora registrada en el sistema.
        </p>
      </div>

      {error && (
        <div className="bg-orange-50 border border-orange-200 rounded-xl px-4 py-3 text-sm text-orange-700">
          {error}
        </div>
      )}

      <div className={`${habilitada ? "bg-gradient-to-r from-green-600 to-green-500" : "bg-gradient-to-r from-orange-500 to-orange-400"} rounded-2xl p-6 text-white flex flex-col md:flex-row md:items-center justify-between gap-4`}>
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center">
            <Building2 className="w-9 h-9 text-white" />
          </div>

          <div>
            <div className="font-bold text-xl">{empresa?.nombre_empresa ?? "Unidad receptora"}</div>
            <div className="text-white/80 text-sm mt-1">
              {habilitada
                ? "Empresa habilitada como unidad receptora"
                : "Empresa en revisión o seguimiento"}
            </div>
            <div className="text-white/80 text-xs mt-1">Giro: {empresa?.giro ?? "Sin giro registrado"}</div>
          </div>
        </div>

        <div className="bg-white/20 px-4 py-2 rounded-xl flex items-center gap-2">
          <BadgeCheck className="w-4 h-4" />
          <div className="text-white font-bold text-sm">{empresa?.estado_empresa ?? "SIN ESTADO"}</div>
        </div>
      </div>

      <div className="grid grid-cols-2 xl:grid-cols-4 gap-5">
        {[
          { label: "Estado", value: empresa?.estado_empresa ?? "Sin estado", icon: CheckCircle, color: "bg-green-50 text-green-600" },
          { label: "Alumnos asignados", value: datos?.resumen.alumnos_asignados ?? 0, icon: User, color: "bg-blue-50 text-blue-600" },
          { label: "Convenios vigentes", value: datos?.resumen.convenios_vigentes ?? 0, icon: FileText, color: "bg-purple-50 text-purple-600" },
          { label: "Planes disponibles", value: datos?.resumen.planes_disponibles ?? 0, icon: Briefcase, color: "bg-orange-50 text-orange-600" },
        ].map((item) => (
          <div key={item.label} className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5">
            <div className={`w-10 h-10 ${item.color} rounded-xl flex items-center justify-center mb-3`}>
              <item.icon className="w-5 h-5" />
            </div>
            <div className="text-2xl font-bold text-[#0d2b5e]">{cargando ? "..." : item.value}</div>
            <div className="text-gray-500 text-sm mt-0.5">{item.label}</div>
          </div>
        ))}
      </div>

      <div className="grid xl:grid-cols-3 gap-6">
        <div className="xl:col-span-2 bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
          <h3 className="font-bold text-[#0d2b5e] mb-4">Datos generales</h3>
          <div className="grid md:grid-cols-2 gap-4">
            {datosEmpresa.map((d) => (
              <div key={d.label} className="p-4 rounded-xl border border-gray-100 bg-gray-50">
                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 bg-[#e3f0ff] rounded-lg flex items-center justify-center flex-shrink-0">
                    <d.icon className="w-4 h-4 text-[#1565c0]" />
                  </div>
                  <div>
                    <div className="text-xs text-gray-400 font-medium">{d.label}</div>
                    <div className="text-sm text-gray-800 font-semibold mt-0.5">{d.value}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
          <h3 className="font-bold text-[#0d2b5e] mb-4">Estado del registro</h3>
          <div className="space-y-4">
            <div className={`${habilitada ? "bg-green-50 border-green-100" : "bg-orange-50 border-orange-100"} p-4 rounded-xl border`}>
              <div className={`${habilitada ? "text-green-700" : "text-orange-700"} flex items-center gap-2 font-semibold text-sm`}>
                <CheckCircle className="w-4 h-4" />
                {empresa?.estado_empresa ?? "Sin estado"}
              </div>
              <p className={`${habilitada ? "text-green-600" : "text-orange-600"} text-xs mt-2 leading-relaxed`}>
                Este estado se actualiza desde la revision documental de coordinacion de unidades receptoras.
              </p>
            </div>

            <div>
              <div className="text-xs text-gray-400 mb-1">Tipo de tramite</div>
              <div className="text-sm font-semibold text-gray-700">{empresa?.tipo_tramite ?? "Sin definir"}</div>
            </div>

            <div>
              <div className="text-xs text-gray-400 mb-1">Convenios registrados</div>
              <div className="text-sm font-semibold text-gray-700">{datos?.convenios.length ?? 0}</div>
            </div>

            <div>
              <div className="text-xs text-gray-400 mb-1">Vacantes registradas</div>
              <div className="text-sm font-semibold text-gray-700">{datos?.vacantes.length ?? 0}</div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid xl:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
          <h3 className="font-bold text-[#0d2b5e] mb-4">Responsables de la empresa</h3>
          <div className="space-y-3">
            {(datos?.responsables ?? []).map((r) => (
              <div key={r.id_responsable} className="p-4 rounded-xl border border-gray-100 hover:bg-gray-50">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 bg-[#e3f0ff] rounded-xl flex items-center justify-center text-[#1565c0] font-bold">
                    {r.nombre.charAt(0)}
                  </div>
                  <div>
                    <div className="font-semibold text-sm text-gray-800">{r.nombre}</div>
                    <div className="text-xs text-gray-500 mt-0.5">{r.cargo}</div>
                    <div className="text-xs text-[#1565c0] mt-1">{r.correo ?? "Sin correo"}</div>
                    {r.telefono && <div className="text-xs text-gray-500 mt-1">{r.telefono}</div>}
                  </div>
                </div>
              </div>
            ))}
            {!cargando && (datos?.responsables ?? []).length === 0 && (
              <div className="text-sm text-gray-500">No hay responsables registrados.</div>
            )}
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
          <h3 className="font-bold text-[#0d2b5e] mb-4">Planes disponibles</h3>
          <div className="space-y-3">
            {(datos?.vacantes ?? []).map((vacante) => (
              <div key={vacante.id_vacante} className="p-3 rounded-xl bg-blue-50 border border-blue-100">
                <div className="text-sm text-[#0d2b5e] font-semibold">{vacante.titulo}</div>
                <div className="text-xs text-gray-500 mt-1">
                  {vacante.periodo ?? "Sin periodo"} - {vacante.cupos} cupo(s) - {vacante.estado_vacante}
                </div>
              </div>
            ))}
            {!cargando && (datos?.vacantes ?? []).length === 0 && (
              <div className="text-sm text-gray-500">No hay planes registrados.</div>
            )}
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-2">
          <FileText className="w-5 h-5 text-[#1565c0]" />
          <h3 className="font-bold text-[#0d2b5e]">Convenios registrados</h3>
        </div>

        <div className="divide-y divide-gray-100">
          {(datos?.convenios ?? []).map((c) => {
            const estado = estadoVisualConvenio(c);
            return (
              <div key={c.id_convenio} className="px-6 py-5 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-gray-50">
                <div>
                  <div className="font-semibold text-sm text-gray-800">
                    Convenio #{c.id_convenio}
                  </div>
                  <div className="text-xs text-gray-400 mt-1 flex items-center gap-1">
                    <CalendarDays className="w-3.5 h-3.5" />
                    {c.fecha_inicio} - {c.fecha_fin}
                  </div>
                </div>
                <span className={`w-fit text-xs px-3 py-1 rounded-full font-semibold ${estado.clase}`}>
                  {estado.etiqueta}
                </span>
              </div>
            );
          })}
          {!cargando && (datos?.convenios ?? []).length === 0 && (
            <div className="px-6 py-8 text-sm text-gray-500">No hay convenios registrados.</div>
          )}
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
        <h3 className="font-bold text-[#0d2b5e] mb-4">Descripcion de la empresa</h3>
        <p className="text-sm text-gray-600 leading-relaxed">
          {empresa?.giro
            ? `${empresa.nombre_empresa} esta registrada con giro: ${empresa.giro}.`
            : "No hay una descripcion extendida registrada para esta empresa."}
        </p>
      </div>
    </div>
  );
}
