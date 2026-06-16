import { useState } from "react";
import { Users, Search, Plus, Edit2, Trash2, UserX } from "lucide-react";

const ini = [
  { id: 1, nombre: "María García López", correo: "maria@unach.mx", rol: "Alumno", estado: "activo" },
  { id: 2, nombre: "Dr. Roberto Méndez", correo: "roberto@unach.mx", rol: "Coordinador de Prácticas", estado: "activo" },
  { id: 3, nombre: "Lic. Ana Torres", correo: "ana@unach.mx", rol: "Coord. Unidades Receptoras", estado: "activo" },
  { id: 4, nombre: "M.C. Pedro Ruiz", correo: "pedro@unach.mx", rol: "Asesor Interno", estado: "activo" },
  { id: 5, nombre: "TechSoft Chiapas", correo: "techsoft@empresa.mx", rol: "Unidad Receptora", estado: "activo" },
  { id: 6, nombre: "Carlos López Ramos", correo: "carlos@unach.mx", rol: "Alumno", estado: "activo" },
  { id: 7, nombre: "Laura Martínez Cruz", correo: "laura@unach.mx", rol: "Alumno", estado: "inactivo" },
  { id: 8, nombre: "Dirección General", correo: "direccion@unach.mx", rol: "Dirección", estado: "activo" },

  { id: 9, nombre: "Oscar Gonzalez", correo: "oscar@unach.mx", rol: "Alumno", estado: "activo" },
  { id: 10, nombre: "Javier Molina", correo: "javier@unach.mx", rol: "Alumno", estado: "activo" },
  { id: 11, nombre: "Brayan Hernandez", correo: "brayan@unach.mx", rol: "Alumno", estado: "activo" },
];

const rolC: Record<string, string> = {
  Alumno: "bg-blue-100 text-blue-700",
  "Coordinador de Prácticas": "bg-purple-100 text-purple-700",
  "Coord. Unidades Receptoras": "bg-indigo-100 text-indigo-700",
  "Asesor Interno": "bg-teal-100 text-teal-700",
  "Unidad Receptora": "bg-green-100 text-green-700",
  Dirección: "bg-orange-100 text-orange-700",
  Administrador: "bg-red-100 text-red-700",
};

const ordenRoles: Record<string, number> = {
  Administrador: 1,
  Dirección: 2,
  "Coordinador de Prácticas": 3,
  "Coord. Unidades Receptoras": 4,
  "Asesor Interno": 5,
  "Unidad Receptora": 6,
  Alumno: 7,
};

export function GestionUsuarios() {
  const [usuarios, setUsuarios] = useState(ini);
  const [q, setQ] = useState("");
  const [showCreate, setShowCreate] = useState(false);

  const filtrados = usuarios
    .filter(
      (u) =>
        u.nombre.toLowerCase().includes(q.toLowerCase()) ||
        u.correo.toLowerCase().includes(q.toLowerCase()) ||
        u.rol.toLowerCase().includes(q.toLowerCase()),
    )
    .sort((a, b) => {
      const ordenRol = ordenRoles[a.rol] - ordenRoles[b.rol];

      if (ordenRol !== 0) return ordenRol;

      return a.nombre.localeCompare(b.nombre);
    });

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
              {filtrados.map((u) => (
                <tr key={u.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-[#e3f0ff] rounded-lg flex items-center justify-center text-[#1565c0] font-bold text-sm">
                        {u.nombre.charAt(0)}
                      </div>
                      <span className="text-sm font-medium text-gray-800">
                        {u.nombre}
                      </span>
                    </div>
                  </td>

                  <td className="px-6 py-4 text-sm text-gray-500">
                    {u.correo}
                  </td>

                  <td className="px-6 py-4">
                    <span
                      className={`text-xs px-3 py-1 rounded-full font-semibold ${
                        rolC[u.rol] || "bg-gray-100 text-gray-600"
                      }`}
                    >
                      {u.rol}
                    </span>
                  </td>

                  <td className="px-6 py-4">
                    <span
                      className={`inline-flex items-center gap-1 text-xs px-3 py-1 rounded-full font-semibold ${
                        u.estado === "activo"
                          ? "bg-green-100 text-green-700"
                          : "bg-gray-100 text-gray-500"
                      }`}
                    >
                      <span
                        className={`w-1.5 h-1.5 rounded-full ${
                          u.estado === "activo" ? "bg-green-500" : "bg-gray-400"
                        }`}
                      />
                      {u.estado === "activo" ? "Activo" : "Inactivo"}
                    </span>
                  </td>

                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <button className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg">
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>

                      <button
                        onClick={() =>
                          setUsuarios((p) =>
                            p.map((x) =>
                              x.id === u.id
                                ? {
                                    ...x,
                                    estado:
                                      x.estado === "activo"
                                        ? "inactivo"
                                        : "activo",
                                  }
                                : x,
                            ),
                          )
                        }
                        className="p-1.5 text-gray-400 hover:text-yellow-600 hover:bg-yellow-50 rounded-lg"
                      >
                        <UserX className="w-3.5 h-3.5" />
                      </button>

                      <button
                        onClick={() =>
                          setUsuarios((p) => p.filter((x) => x.id !== u.id))
                        }
                        className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
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
              {[
                { l: "Nombre completo", t: "text", p: "Nombre completo" },
                { l: "Correo institucional", t: "email", p: "usuario@unach.mx" },
              ].map((f) => (
                <div key={f.l}>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    {f.l}
                  </label>
                  <input
                    type={f.t}
                    placeholder={f.p}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-[#1565c0] text-sm"
                  />
                </div>
              ))}

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Rol
                </label>
                <select className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-[#1565c0] text-sm bg-white">
                  {[
                    "Alumno",
                    "Coordinador de Prácticas",
                    "Coord. Unidades Receptoras",
                    "Unidad Receptora",
                    "Asesor Interno",
                    "Dirección",
                    "Administrador",
                  ].map((r) => (
                    <option key={r}>{r}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowCreate(false)}
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