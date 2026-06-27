import { useEffect, useState } from "react";
import {
  Shield,
  Users,
  Edit,
  CheckCircle2,
} from "lucide-react";

import { obtenerRoles } from "../../../infrastructure/roles/rolesApi";
import { obtenerUsuarios } from "../../../infrastructure/usuarios/usuariosApi";

export function AdminRolesPermisos() {
  const [roles, setRoles] = useState<any[]>([]);
  const [usuarios, setUsuarios] = useState<any[]>([]);

  useEffect(() => {
    cargarDatos();
  }, []);

  async function cargarDatos() {
    try {
      const rolesData = await obtenerRoles();
      const usuariosData = await obtenerUsuarios();

      setRoles(rolesData);
      setUsuarios(usuariosData);
    } catch (error) {
      console.error(error);
    }
  }

  function obtenerCantidadUsuarios(idRol: number) {
    return usuarios.filter(
      (usuario) => usuario.id_rol === idRol
    ).length;
  }

  const totalUsuarios = usuarios.length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[#0d2b5e]">
          Roles y Permisos
        </h1>

        <p className="text-gray-500 text-sm mt-1">
          Consulta de roles institucionales y accesos disponibles dentro del sistema.
        </p>
      </div>

      <div className="grid md:grid-cols-3 gap-4">
        <div className="bg-blue-600 rounded-2xl p-5 text-white">
          <Shield className="w-7 h-7 mb-3 opacity-80" />
          <div className="text-2xl font-bold">
            {roles.length}
          </div>
          <div className="text-white/80 text-sm">
            Roles registrados
          </div>
        </div>

        <div className="bg-green-600 rounded-2xl p-5 text-white">
          <Users className="w-7 h-7 mb-3 opacity-80" />
          <div className="text-2xl font-bold">
            {totalUsuarios}
          </div>
          <div className="text-white/80 text-sm">
            Usuarios activos
          </div>
        </div>

        <div className="bg-purple-600 rounded-2xl p-5 text-white">
          <CheckCircle2 className="w-7 h-7 mb-3 opacity-80" />
          <div className="text-2xl font-bold">
            {roles.length}
          </div>
          <div className="text-white/80 text-sm">
            Roles activos
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {roles.map((rol) => (
          <div
            key={rol.id_rol}
            className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm"
          >
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-bold text-lg text-[#0d2b5e]">
                  {rol.nombre}
                </h3>

                <p className="text-sm text-gray-500 mt-1">
                  Rol institucional registrado en el sistema.
                </p>
              </div>

              <Shield className="w-8 h-8 text-[#1565c0]" />
            </div>

            <div className="mt-4">
              <span className="text-sm font-semibold text-[#1565c0]">
                {obtenerCantidadUsuarios(rol.id_rol)} usuarios asignados
              </span>
            </div>

            <div className="mt-5">
              <h4 className="font-semibold text-[#0d2b5e] mb-3">
                Información
              </h4>

              <div className="flex flex-wrap gap-2">
                <span className="bg-blue-50 border border-blue-100 text-[#1565c0] px-3 py-1 rounded-full text-xs">
                  ID Rol: {rol.id_rol}
                </span>

                <span className="bg-green-50 border border-green-100 text-green-700 px-3 py-1 rounded-full text-xs">
                  Activo
                </span>
              </div>
            </div>

            <div className="mt-5 flex justify-end">
              <button className="border border-gray-200 rounded-xl px-4 py-2 text-sm font-semibold text-gray-600 flex items-center gap-2">
                <Edit className="w-4 h-4" />
                Editar rol
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}