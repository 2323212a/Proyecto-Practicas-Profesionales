import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router";
import {
  ArrowLeft,
  Eye,
  EyeOff,
  LogIn,
} from "lucide-react";

import logoInstitucional from "../../../assets/Logo1.png";
import { loginUseCase } from "../../dependencies";
import type { Rol } from "../../../domain/rol/Rol";
import { obtenerRoles } from "../../../infrastructure/roles/rolesApi";

const ROLES_RESPALDO: Rol[] = [
  { id_rol: 1, nombre: "Alumno" },
  { id_rol: 2, nombre: "Administrador" },
  { id_rol: 3, nombre: "Coordinador de Practicas" },
  { id_rol: 4, nombre: "Coordinador de Unidades Receptoras" },
  { id_rol: 5, nombre: "Unidad Receptora" },
  { id_rol: 6, nombre: "Asesor Interno" },
  { id_rol: 7, nombre: "Direccion" },
];

function rutaPorRol(nombre: string | null, idRol: number) {
  const rol = (nombre ?? "").toLowerCase();

  if (rol.includes("alumno") || idRol === 1) return "/alumno";
  if (rol.includes("admin") || idRol === 2) return "/admin";
  if (rol.includes("coordinador de unidades") || idRol === 4) return "/coord-unidades";
  if (rol.includes("coordinador") || idRol === 3) return "/coordinador";
  if (rol.includes("unidad") || rol.includes("empresa") || idRol === 5) return "/unidad";
  if (rol.includes("asesor") || rol.includes("docente") || idRol === 6) return "/asesor";
  if (rol.includes("direccion") || idRol === 7) return "/direccion";

  return null;
}

export function LoginPage() {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [roles, setRoles] = useState<Rol[]>(ROLES_RESPALDO);
  const [idRolSeleccionado, setIdRolSeleccionado] = useState("1");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showRecovery, setShowRecovery] = useState(false);
  const [recoveryEmail, setRecoveryEmail] = useState("");
  const [recoverySent, setRecoverySent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    obtenerRoles()
      .then((data: Rol[]) => {
        if (data.length > 0) {
          setRoles(data);
          setIdRolSeleccionado(String(data[0].id_rol));
        }
      })
      .catch((err) => console.error(err));
  }, []);

  const rolSeleccionado = useMemo(
    () => roles.find((item) => String(item.id_rol) === idRolSeleccionado),
    [idRolSeleccionado, roles],
  );

  const handleLogin = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await loginUseCase.execute({
        correo: email,
        password,
      });

      if (rolSeleccionado && rolSeleccionado.id_rol !== response.id_rol) {
        setError("Las credenciales no corresponden al rol seleccionado");
        return;
      }

      localStorage.setItem("token", response.access_token);
      localStorage.setItem("usuario", JSON.stringify(response));

      const ruta = rutaPorRol(response.rol, response.id_rol);
      if (!ruta) {
        setError("Rol no reconocido");
        return;
      }

      navigate(ruta);
    } catch (err) {
      setError("Correo o contrasena incorrectos");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0d2b5e] via-[#1565c0] to-[#1976d2] flex flex-col">
      <div className="px-6 py-5 flex items-center justify-between">
        <button
          onClick={() => navigate("/")}
          className="flex items-center gap-2 text-white/80 hover:text-white transition-colors text-sm"
        >
          <ArrowLeft className="w-4 h-4" />
          Regresar
        </button>

        <div className="flex items-center gap-2 text-white">
          <div className="w-14 h-14 bg-white rounded-lg overflow-hidden">
            <img
              src={logoInstitucional}
              alt="UNACH"
              className="w-full h-full object-contain"
            />
          </div>
          <span className="font-bold text-sm">UNACH - Practicas Profesionales</span>
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center px-4 pb-12">
        <div className="w-full max-w-md">
          <div className="bg-white rounded-3xl shadow-2xl overflow-hidden">
            <div className="bg-[#0d2b5e] px-8 py-8 text-center">
              <div className="w-28 h-28 bg-white rounded-2xl flex items-center justify-center mx-auto mb-4 overflow-hidden">
                <img
                  src={logoInstitucional}
                  alt="UNACH"
                  className="w-full h-full object-contain"
                />
              </div>

              <h1 className="text-white font-bold text-2xl">Iniciar Sesion</h1>

              <p className="text-blue-200 text-sm mt-1">
                Sistema Integral de Practicas Profesionales
              </p>
            </div>

            <div className="px-8 py-8">
              {!showRecovery ? (
                <div className="space-y-5">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Correo Institucional
                    </label>

                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="usuario@unach.mx"
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-[#1565c0] text-sm transition-colors"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Contrasena
                    </label>

                    <div className="relative">
                      <input
                        type={showPassword ? "text" : "password"}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="********"
                        className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-[#1565c0] text-sm pr-12 transition-colors"
                      />

                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  {error && (
                    <div className="bg-red-50 border border-red-200 text-red-600 text-sm rounded-xl p-3">
                      {error}
                    </div>
                  )}

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Rol / Perfil
                    </label>

                    <select
                      value={idRolSeleccionado}
                      onChange={(e) => setIdRolSeleccionado(e.target.value)}
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-[#1565c0] text-sm bg-white transition-colors"
                    >
                      {roles.map((rol) => (
                        <option key={rol.id_rol} value={rol.id_rol}>
                          {rol.nombre}
                        </option>
                      ))}
                    </select>
                  </div>

                  <button
                    onClick={handleLogin}
                    disabled={loading}
                    className="w-full py-3.5 bg-[#0d2b5e] text-white rounded-xl font-bold hover:bg-[#1565c0] transition-colors flex items-center justify-center gap-2 shadow-lg disabled:opacity-60"
                  >
                    <LogIn className="w-5 h-5" />
                    {loading ? "Ingresando..." : "Iniciar Sesion"}
                  </button>

                  <button
                    onClick={() => setShowRecovery(true)}
                    className="w-full text-center text-sm text-[#1565c0] hover:underline"
                  >
                    Olvidaste tu contrasena?
                  </button>

                  <div className="border-t border-gray-100 pt-4 text-center">
                    <span className="text-sm text-gray-500">
                      Problemas de acceso? Contacta a tu coordinador.
                    </span>
                  </div>
                </div>
              ) : (
                <div className="space-y-5">
                  <div className="text-center">
                    <h2 className="font-bold text-xl text-[#0d2b5e]">
                      Recuperar Contrasena
                    </h2>

                    <p className="text-gray-500 text-sm mt-1">
                      Ingresa tu correo institucional para recibir un enlace de recuperacion.
                    </p>
                  </div>

                  {!recoverySent ? (
                    <>
                      <input
                        type="email"
                        value={recoveryEmail}
                        onChange={(e) => setRecoveryEmail(e.target.value)}
                        placeholder="usuario@unach.mx"
                        className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-[#1565c0] text-sm"
                      />

                      <button
                        onClick={() => setRecoverySent(true)}
                        className="w-full py-3 bg-[#1565c0] text-white rounded-xl font-bold hover:bg-[#1976d2] transition-colors"
                      >
                        Enviar Enlace
                      </button>
                    </>
                  ) : (
                    <div className="bg-green-50 border border-green-200 rounded-xl p-4 text-center">
                      <div className="text-green-700 font-semibold text-sm">
                        Correo enviado
                      </div>

                      <div className="text-green-600 text-xs mt-1">
                        Revisa tu bandeja de entrada.
                      </div>
                    </div>
                  )}

                  <button
                    onClick={() => {
                      setShowRecovery(false);
                      setRecoverySent(false);
                    }}
                    className="w-full text-center text-sm text-gray-500 hover:text-gray-700"
                  >
                    Volver al inicio de sesion
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
