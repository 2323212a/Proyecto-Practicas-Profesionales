import { useEffect, useState } from "react";
import { Users, Search, Plus, Edit2, Trash2, UserX } from "lucide-react";
import { obtenerUsuarios } from "../../../infrastructure/usuarios/usuariosApi";
import { crearUsuario } from "../../../infrastructure/usuarios/usuariosApi";
import {cambiarEstadoUsuario,} from "../../../infrastructure/usuarios/usuariosApi";
import {eliminarUsuario} from "../../../infrastructure/usuarios/usuariosApi";


type Usuario = {
  id_usuario: number;
  id_rol: number;
  nombre: string;
  apellido_paterno?: string | null;
  apellido_materno?: string | null;
  correo: string;
  estado: string;
};

const roles: Record<number, string> = {
  1: "Alumno",
  2: "Administrador",
  3: "Coordinador de Prácticas",
  4: "Coord. Unidades Receptoras",
  5: "Unidad Receptora",
  6: "Asesor Interno",
  7: "Dirección",
};

const rolC: Record<string, string> = {
  Alumno: "bg-blue-100 text-blue-700",
  Administrador: "bg-red-100 text-red-700",
  "Coordinador de Prácticas": "bg-purple-100 text-purple-700",
  "Coord. Unidades Receptoras": "bg-indigo-100 text-indigo-700",
  "Unidad Receptora": "bg-green-100 text-green-700",
  "Asesor Interno": "bg-teal-100 text-teal-700",
  Dirección: "bg-orange-100 text-orange-700",
};

export function GestionUsuarios() {
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [q, setQ] = useState("");
  const [showCreate, setShowCreate] = useState(false);

  useEffect(() => {
    cargarUsuarios();
  }, []);

  const [nuevoUsuario, setNuevoUsuario] = useState({
  nombre: "",
  apellido_paterno: "",
  apellido_materno: "",
  correo: "",
  password: "",
  id_rol: 1,
  });

  async function handleCrearUsuario() {
  try {
    await crearUsuario(nuevoUsuario);

    setShowCreate(false);

    setNuevoUsuario({
      nombre: "",
      apellido_paterno: "",
      apellido_materno: "",
      correo: "",
      password: "",
      id_rol: 1,
    });

    await cargarUsuarios();
  } catch (error) {
    console.error(error);
    alert("Error al crear usuario");
  }
  }

  async function cargarUsuarios() {
    const data = await obtenerUsuarios();
    setUsuarios(data);
  }

  const filtrados = usuarios.filter((u) => {
    const nombreCompleto = `${u.nombre} ${u.apellido_paterno ?? ""} ${
      u.apellido_materno ?? ""
    }`;

    const rol = roles[u.id_rol] ?? "Sin rol";

    return (
      nombreCompleto.toLowerCase().includes(q.toLowerCase()) ||
      u.correo.toLowerCase().includes(q.toLowerCase()) ||
      rol.toLowerCase().includes(q.toLowerCase())
    );
  });

  async function handleCambiarEstado(id: number) {
  try {
    await cambiarEstadoUsuario(id);
    await cargarUsuarios();
  } catch (error) {
    console.error(error);
    alert("Error al cambiar estado");
  }
  }

  async function handleEliminarUsuario(id: number) {
  const confirmar = window.confirm(
    "¿Deseas eliminar este usuario?"
  );

  if (!confirmar) return;

  try {
    await eliminarUsuario(id);
    await cargarUsuarios();
  } catch (error) {
    console.error(error);
    alert("Error al eliminar usuario");
  }

}

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#0d2b5e]">
            Gestión de Usuarios
          </h1>
          <p className="text-gray-500 text-sm mt-1">
            {usuarios.length} usuarios en el sistema
          </p>
        </div>

        <button
          onClick={() => setShowCreate(true)}
          className="flex items-center gap-2 px-5 py-2.5 bg-[#0d2b5e] text-white rounded-xl text-sm font-semibold hover:bg-[#1565c0] transition-colors shadow"
        >
          <Plus className="w-4 h-4" />
          Crear Usuario
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar usuario, correo o rol..."
            value={q}
            onChange={(e) => setQ(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#1565c0]"
          />
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-2">
          <Users className="w-5 h-5 text-[#1565c0]" />
          <h3 className="font-bold text-[#0d2b5e]">
            Directorio de Usuarios
          </h3>
          <span className="ml-auto text-xs text-gray-400">
            {filtrados.length} resultados
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                {["Nombre", "Correo", "Rol", "Estado", "Acciones"].map((h) => (
                  <th
                    key={h}
                    className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>

            <tbody className="divide-y divide-gray-100">
              {filtrados.map((u) => {
                const nombreCompleto = `${u.nombre} ${
                  u.apellido_paterno ?? ""
                } ${u.apellido_materno ?? ""}`.trim();

                const rol = roles[u.id_rol] ?? "Sin rol";
                const estadoActivo = u.estado === "Activo";

                return (
                  <tr key={u.id_usuario} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-[#e3f0ff] rounded-lg flex items-center justify-center text-[#1565c0] font-bold text-sm">
                          {u.nombre.charAt(0)}
                        </div>
                        <span className="text-sm font-medium text-gray-800">
                          {nombreCompleto}
                        </span>
                      </div>
                    </td>

                    <td className="px-6 py-4 text-sm text-gray-500">
                      {u.correo}
                    </td>

                    <td className="px-6 py-4">
                      <span
                        className={`text-xs px-3 py-1 rounded-full font-semibold ${
                          rolC[rol] || "bg-gray-100 text-gray-600"
                        }`}
                      >
                        {rol}
                      </span>
                    </td>

                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex items-center gap-1 text-xs px-3 py-1 rounded-full font-semibold ${
                          estadoActivo
                            ? "bg-green-100 text-green-700"
                            : "bg-gray-100 text-gray-500"
                        }`}
                      >
                        <span
                          className={`w-1.5 h-1.5 rounded-full ${
                            estadoActivo ? "bg-green-500" : "bg-gray-400"
                          }`}
                        />
                        {estadoActivo ? "Activo" : "Inactivo"}
                      </span>
                    </td>

                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <button className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg">
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>

                      <button
                        onClick={() => handleCambiarEstado(u.id_usuario)}
                        className="p-1.5 text-gray-400 hover:text-yellow-600 hover:bg-yellow-50 rounded-lg"
                        >
                        <UserX className="w-3.5 h-3.5" />
                         </button>

                        <button
                          onClick={() => handleEliminarUsuario(u.id_usuario)}
                          className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

{showCreate && (
  <div
    className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4"
    onClick={() => setShowCreate(false)}
  >
    <div
      className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-8"
      onClick={(e) => e.stopPropagation()}
    >
      <h3 className="font-bold text-xl text-[#0d2b5e] mb-6">
        Crear Nuevo Usuario
      </h3>

      <div className="space-y-4">
        <input
          type="text"
          placeholder="Nombre"
          value={nuevoUsuario.nombre}
          onChange={(e) =>
            setNuevoUsuario({
              ...nuevoUsuario,
              nombre: e.target.value,
            })
          }
          className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl text-sm"
        />

        <input
          type="text"
          placeholder="Apellido paterno"
          value={nuevoUsuario.apellido_paterno}
          onChange={(e) =>
            setNuevoUsuario({
              ...nuevoUsuario,
              apellido_paterno: e.target.value,
            })
          }
          className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl text-sm"
        />

        <input
          type="text"
          placeholder="Apellido materno"
          value={nuevoUsuario.apellido_materno}
          onChange={(e) =>
            setNuevoUsuario({
              ...nuevoUsuario,
              apellido_materno: e.target.value,
            })
          }
          className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl text-sm"
        />

        <input
          type="email"
          placeholder="Correo institucional"
          value={nuevoUsuario.correo}
          onChange={(e) =>
            setNuevoUsuario({
              ...nuevoUsuario,
              correo: e.target.value,
            })
          }
          className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl text-sm"
        />

        <input
          type="password"
          placeholder="Contraseña"
          value={nuevoUsuario.password}
          onChange={(e) =>
            setNuevoUsuario({
              ...nuevoUsuario,
              password: e.target.value,
            })
          }
          className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl text-sm"
        />

        <select
          value={nuevoUsuario.id_rol}
          onChange={(e) =>
            setNuevoUsuario({
              ...nuevoUsuario,
              id_rol: Number(e.target.value),
            })
          }
          className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl text-sm bg-white"
        >
          {Object.entries(roles).map(([id, nombre]) => (
            <option key={id} value={id}>
              {nombre}
            </option>
          ))}
        </select>
      </div>

      <div className="flex gap-3 mt-6">
        <button
          onClick={handleCrearUsuario}
          className="flex-1 py-2.5 bg-[#0d2b5e] text-white rounded-xl text-sm font-bold hover:bg-[#1565c0]"
        >
          Crear Usuario
        </button>

        <button
          onClick={() => setShowCreate(false)}
          className="flex-1 py-2.5 border-2 border-gray-200 text-gray-600 rounded-xl text-sm font-bold hover:bg-gray-50"
        >
          Cancelar
        </button>
      </div>
    </div>
  </div>
)}
    </div>
  );
}