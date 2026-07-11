import { useEffect, useState } from "react";
import {
  Eye,
  ListChecks,
  Route,
  Shield,
  Users,
} from "lucide-react";

import { listarRolesUseCase } from "../../dependencies";
import { gestionUsuariosUseCase } from "../../dependencies";

type Rol = {
  id_rol: number;
  nombre: string;
  descripcion?: string | null;
};

type Usuario = {
  id_usuario: number;
  id_rol: number;
};

type RolAcceso = {
  inicio: string;
  modulos: string[];
  acciones: string[];
  alcance: string;
};

const ACCESOS_POR_ROL: Record<number, RolAcceso> = {
  1: {
    inicio: "/alumno",
    modulos: [
      "Documentación",
      "Padrón empresarial",
      "Reportes",
      "Horas acumuladas",
      "Evaluación empresa",
      "Notificaciones",
      "Perfil",
    ],
    acciones: ["Consultar", "Subir documentos", "Registrar horas", "Enviar reportes"],
    alcance: "Acceso personal a su expediente y seguimiento de práctica.",
  },
  2: {
    inicio: "/admin",
    modulos: ["Usuarios", "Roles y accesos", "Catálogos", "Reportes", "Configuración"],
    acciones: ["Crear", "Editar", "Desactivar", "Eliminar", "Configurar", "Consultar"],
    alcance: "Administración general del sistema y catálogos institucionales.",
  },
  3: {
    inicio: "/coordinador",
    modulos: [
      "Gestión de alumnos",
      "Revisión de documentos",
      "Asignaciones",
      "Seguimiento",
      "Liberación",
      "Notificaciones",
    ],
    acciones: ["Validar", "Asignar", "Aprobar", "Rechazar", "Liberar", "Dar seguimiento"],
    alcance: "Operación académica de prácticas profesionales.",
  },
  4: {
    inicio: "/coord-unidades",
    modulos: ["Empresas", "Convenios", "Vacantes", "Padrón empresarial", "Notificaciones"],
    acciones: ["Validar empresas", "Gestionar convenios", "Publicar vacantes", "Aprobar padrón"],
    alcance: "Control de unidades receptoras, convenios y oferta disponible.",
  },
  5: {
    inicio: "/unidad",
    modulos: ["Perfil empresa", "Plan de trabajo", "Alumnos", "Convenios", "Horas", "Evaluaciones"],
    acciones: ["Actualizar perfil", "Registrar plan", "Validar horas", "Evaluar alumnos"],
    alcance: "Seguimiento operativo de alumnos asignados a la unidad receptora.",
  },
  6: {
    inicio: "/asesor",
    modulos: ["Alumnos asignados", "Reportes", "Observaciones"],
    acciones: ["Consultar", "Revisar reportes", "Registrar observaciones", "Dar seguimiento"],
    alcance: "Acompañamiento académico de alumnos asignados.",
  },
  7: {
    inicio: "/direccion",
    modulos: ["Dashboard ejecutivo", "Estadísticas", "Reportes"],
    acciones: ["Consultar", "Filtrar", "Exportar reportes"],
    alcance: "Consulta ejecutiva y análisis institucional.",
  },
};

export function AdminRolesPermisos() {
  const [roles, setRoles] = useState<Rol[]>([]);
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [rolDetalle, setRolDetalle] = useState<Rol | null>(null);

  useEffect(() => {
    cargarDatos();
  }, []);

  async function cargarDatos() {
    try {
      const rolesData = await listarRolesUseCase.execute();
      const usuariosData = await gestionUsuariosUseCase.listar();

      setRoles(rolesData);
      setUsuarios(usuariosData);
    } catch (error) {
      console.error(error);
    }
  }

  function obtenerCantidadUsuarios(idRol: number) {
    return usuarios.filter((usuario) => usuario.id_rol === idRol).length;
  }

  function obtenerAccesos(idRol: number) {
    return ACCESOS_POR_ROL[idRol] ?? {
      inicio: "Sin ruta asignada",
      modulos: [],
      acciones: [],
      alcance: "Este rol no tiene una configuración de acceso registrada.",
    };
  }

  const totalUsuarios = usuarios.length;
  const modulosCubiertos = new Set(
    roles.flatMap((rol) => obtenerAccesos(rol.id_rol).modulos)
  ).size;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[#0d2b5e]">
          Roles y Accesos
        </h1>

        <p className="text-gray-500 text-sm mt-1">
          Consulta qué puede ver y hacer cada tipo de usuario dentro del sistema.
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <div className="bg-blue-600 rounded-2xl p-5 text-white">
          <Shield className="w-7 h-7 mb-3 opacity-80" />
          <div className="text-2xl font-bold">{roles.length}</div>
          <div className="text-white/80 text-sm">Roles registrados</div>
        </div>

        <div className="bg-green-600 rounded-2xl p-5 text-white">
          <Users className="w-7 h-7 mb-3 opacity-80" />
          <div className="text-2xl font-bold">{totalUsuarios}</div>
          <div className="text-white/80 text-sm">Usuarios activos</div>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-50 text-[#1565c0] flex items-center justify-center">
            <Route className="w-5 h-5" />
          </div>
          <div>
            <h2 className="font-bold text-[#0d2b5e]">
              Mapa de accesos por rol
            </h2>
            <p className="text-sm text-gray-500">
              {modulosCubiertos} módulos cubiertos por los roles configurados.
            </p>
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {roles.map((rol) => {
          const accesos = obtenerAccesos(rol.id_rol);

          return (
            <div
              key={rol.id_rol}
              className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm"
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h3 className="font-bold text-lg text-[#0d2b5e]">
                    {rol.nombre}
                  </h3>

                  <p className="text-sm text-gray-500 mt-1">
                    {accesos.alcance}
                  </p>
                </div>

                <Shield className="w-8 h-8 text-[#1565c0] flex-shrink-0" />
              </div>

              <div className="mt-4 flex flex-wrap gap-2">
                <span className="bg-blue-50 border border-blue-100 text-[#1565c0] px-3 py-1 rounded-full text-xs">
                  ID Rol: {rol.id_rol}
                </span>

                <span className="bg-green-50 border border-green-100 text-green-700 px-3 py-1 rounded-full text-xs">
                  {obtenerCantidadUsuarios(rol.id_rol)} usuarios
                </span>

                <span className="bg-gray-50 border border-gray-200 text-gray-600 px-3 py-1 rounded-full text-xs">
                  Inicio: {accesos.inicio}
                </span>
              </div>

              <div className="mt-5">
                <h4 className="font-semibold text-[#0d2b5e] mb-3">
                  Accesos principales
                </h4>

                <div className="flex flex-wrap gap-2">
                  {accesos.modulos.slice(0, 4).map((modulo) => (
                    <span
                      key={modulo}
                      className="bg-slate-50 border border-slate-200 text-slate-700 px-3 py-1 rounded-full text-xs"
                    >
                      {modulo}
                    </span>
                  ))}

                  {accesos.modulos.length > 4 && (
                    <span className="bg-slate-50 border border-slate-200 text-slate-500 px-3 py-1 rounded-full text-xs">
                      +{accesos.modulos.length - 4} más
                    </span>
                  )}
                </div>
              </div>

              <div className="mt-5 flex justify-end">
                <button
                  onClick={() => setRolDetalle(rol)}
                  className="border border-gray-200 rounded-xl px-4 py-2 text-sm font-semibold text-gray-600 flex items-center gap-2 hover:bg-gray-50"
                >
                  <Eye className="w-4 h-4" />
                  Ver detalle
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {rolDetalle && (
        <div
          className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4"
          onClick={() => setRolDetalle(null)}
        >
          <div
            className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full p-8"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <h3 className="font-bold text-xl text-[#0d2b5e]">
                  {rolDetalle.nombre}
                </h3>
                <p className="text-sm text-gray-500 mt-1">
                  {obtenerAccesos(rolDetalle.id_rol).alcance}
                </p>
              </div>
              <Shield className="w-8 h-8 text-[#1565c0]" />
            </div>

            <div className="grid md:grid-cols-2 gap-6 mt-6">
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <Route className="w-4 h-4 text-[#1565c0]" />
                  <h4 className="font-bold text-[#0d2b5e]">Módulos</h4>
                </div>

                <div className="space-y-2">
                  {obtenerAccesos(rolDetalle.id_rol).modulos.map((modulo) => (
                    <div
                      key={modulo}
                      className="border border-gray-200 rounded-xl px-3 py-2 text-sm text-gray-700"
                    >
                      {modulo}
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <div className="flex items-center gap-2 mb-3">
                  <ListChecks className="w-4 h-4 text-[#1565c0]" />
                  <h4 className="font-bold text-[#0d2b5e]">Acciones</h4>
                </div>

                <div className="space-y-2">
                  {obtenerAccesos(rolDetalle.id_rol).acciones.map((accion) => (
                    <div
                      key={accion}
                      className="border border-gray-200 rounded-xl px-3 py-2 text-sm text-gray-700"
                    >
                      {accion}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="mt-6 flex items-center justify-between border-t border-gray-100 pt-4">
              <span className="text-sm text-gray-500">
                Ruta inicial: {obtenerAccesos(rolDetalle.id_rol).inicio}
              </span>

              <button
                onClick={() => setRolDetalle(null)}
                className="px-4 py-2 rounded-xl bg-[#0d2b5e] text-white text-sm font-semibold hover:bg-[#1565c0]"
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
