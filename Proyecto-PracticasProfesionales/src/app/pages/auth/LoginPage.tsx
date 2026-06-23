import { login } from "../../../infrastructure/auth/authApi";
import { useState } from "react";
import { useNavigate } from "react-router";
import {
  GraduationCap,
  Eye,
  EyeOff,
  LogIn,
  ArrowLeft,
} from "lucide-react";


const ROLES = [
  { value: "alumno", label: "Alumno", path: "/alumno" },
  { value: "admin", label: "Administrador", path: "/admin" },
  {
    value: "coordinador",
    label: "Coordinador de Prácticas",
    path: "/coordinador",
  },
  {
    value: "coord-unidades",
    label: "Coordinador de Unidades Receptoras",
    path: "/coord-unidades",
  },
  {
    value: "unidad",
    label: "Unidad Receptora",
    path: "/unidad",
  },
  { value: "asesor", label: "Asesor Interno", path: "/asesor" },
  {
    value: "direccion",
    label: "Dirección / Secretaría",
    path: "/direccion",
  },
];

export function LoginPage() {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [role, setRole] = useState("alumno");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showRecovery, setShowRecovery] = useState(false);
  const [recoveryEmail, setRecoveryEmail] = useState("");
  const [recoverySent, setRecoverySent] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleLogin = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await login({
        correo: email,
        password: password,
      });

      localStorage.setItem(
        "token",
        response.access_token
      );

      localStorage.setItem(
        "usuario",
        JSON.stringify(response)
      );

      switch (response.id_rol) {
        case 1:
          navigate("/alumno");
          break;

        case 2:
          navigate("/admin");
          break;

        case 3:
          navigate("/coordinador");
          break;

        case 4:
          navigate("/coord-unidades");
          break;

        case 5:
          navigate("/unidad");
          break;

        case 6:
          navigate("/asesor");
          break;

        case 7:
          navigate("/direccion");
          break;

        default:
          setError("Rol no reconocido");
      }
    } catch (err) {
      setError("Correo o contraseña incorrectos");
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
          <GraduationCap className="w-6 h-6" />
          <span className="font-bold text-sm">
            UNACH — Prácticas Profesionales
          </span>
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center px-4 pb-12">
        <div className="w-full max-w-md">
          <div className="bg-white rounded-3xl shadow-2xl overflow-hidden">
            <div className="bg-[#0d2b5e] px-8 py-8 text-center">
              <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <GraduationCap className="w-9 h-9 text-white" />
              </div>

              <h1 className="text-white font-bold text-2xl">
                Iniciar Sesión
              </h1>

              <p className="text-blue-200 text-sm mt-1">
                Sistema Integral de Prácticas Profesionales
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
                      Contraseña
                    </label>

                    <div className="relative">
                      <input
                        type={showPassword ? "text" : "password"}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="••••••••"
                        className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-[#1565c0] text-sm pr-12 transition-colors"
                      />

                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      >
                        {showPassword ? (
                          <EyeOff className="w-4 h-4" />
                        ) : (
                          <Eye className="w-4 h-4" />
                        )}
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
                      value={role}
                      onChange={(e) => setRole(e.target.value)}
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-[#1565c0] text-sm bg-white transition-colors"
                    >
                      {ROLES.map((r) => (
                        <option key={r.value} value={r.value}>
                          {r.label}
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
                    {loading ? "Ingresando..." : "Iniciar Sesión"}
                  </button>

                  <button
                    onClick={() => setShowRecovery(true)}
                    className="w-full text-center text-sm text-[#1565c0] hover:underline"
                  >
                    ¿Olvidaste tu contraseña?
                  </button>

                  <div className="border-t border-gray-100 pt-4 text-center">
                    <span className="text-sm text-gray-500">
                      ¿Problemas de acceso? Contacta a tu coordinador.
                    </span>
                  </div>
                </div>
              ) : (
                <div className="space-y-5">
                  <div className="text-center">
                    <h2 className="font-bold text-xl text-[#0d2b5e]">
                      Recuperar Contraseña
                    </h2>

                    <p className="text-gray-500 text-sm mt-1">
                      Ingresa tu correo institucional para recibir un enlace de
                      recuperación.
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
                        ✓ Correo enviado
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
                    ← Volver al inicio de sesión
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