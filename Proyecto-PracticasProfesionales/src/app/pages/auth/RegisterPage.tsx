import { useState } from "react";
import { useNavigate } from "react-router";
import { GraduationCap, Eye, EyeOff, ArrowLeft, CheckCircle } from "lucide-react";

export function RegisterPage() {
  const navigate = useNavigate();
  const [showPwd, setShowPwd] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [form, setForm] = useState({ nombre:"", matricula:"", correo:"", telefono:"", password:"", confirm:"" });
  const set = (k:string) => (e:React.ChangeEvent<HTMLInputElement>) => setForm(f=>({...f,[k]:e.target.value}));

  if (submitted) return (
    <div className="min-h-screen bg-gradient-to-br from-[#0d2b5e] via-[#1565c0] to-[#1976d2] flex items-center justify-center px-4">
      <div className="bg-white rounded-3xl shadow-2xl p-10 max-w-md w-full text-center">
        <CheckCircle className="w-20 h-20 text-green-500 mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-[#0d2b5e] mb-2">¡Registro exitoso!</h2>
        <p className="text-gray-500 text-sm mb-6">Tu cuenta ha sido creada. Recibirás un correo de confirmación en tu cuenta institucional.</p>
        <button onClick={()=>navigate("/login")} className="w-full py-3 bg-[#0d2b5e] text-white rounded-xl font-bold hover:bg-[#1565c0] transition-colors">Ir al Inicio de Sesión</button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0d2b5e] via-[#1565c0] to-[#1976d2] flex flex-col">
      <div className="px-6 py-5 flex items-center justify-between">
        <button onClick={()=>navigate("/")} className="flex items-center gap-2 text-white/80 hover:text-white transition-colors text-sm"><ArrowLeft className="w-4 h-4" />Regresar</button>
        <div className="flex items-center gap-2 text-white"><GraduationCap className="w-6 h-6" /><span className="font-bold text-sm">UNACH — Prácticas Profesionales</span></div>
      </div>
      <div className="flex-1 flex items-center justify-center px-4 pb-12">
        <div className="w-full max-w-md">
          <div className="bg-white rounded-3xl shadow-2xl overflow-hidden">
            <div className="bg-[#0d2b5e] px-8 py-8 text-center">
              <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center mx-auto mb-4"><GraduationCap className="w-9 h-9 text-white" /></div>
              <h1 className="text-white font-bold text-2xl">Crear Cuenta</h1>
              <p className="text-blue-200 text-sm mt-1">Sistema Integral de Prácticas Profesionales</p>
            </div>
            <div className="px-8 py-8 space-y-5">
              {[{l:"Nombre Completo",k:"nombre",t:"text",p:"Ej. Juan Pérez García"},{l:"Matrícula",k:"matricula",t:"text",p:"Ej. 215A10234"},{l:"Correo Institucional",k:"correo",t:"email",p:"usuario@unach.mx"},{l:"Teléfono",k:"telefono",t:"tel",p:"Ej. 961 123 4567"}].map(f=>(
                <div key={f.k}><label className="block text-sm font-semibold text-gray-700 mb-2">{f.l}</label><input type={f.t} value={(form as any)[f.k]} onChange={set(f.k)} placeholder={f.p} className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-[#1565c0] text-sm" /></div>
              ))}
              <div><label className="block text-sm font-semibold text-gray-700 mb-2">Contraseña</label><div className="relative"><input type={showPwd?"text":"password"} value={form.password} onChange={set("password")} placeholder="Mínimo 8 caracteres" className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-[#1565c0] text-sm pr-12" /><button type="button" onClick={()=>setShowPwd(!showPwd)} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400">{showPwd?<EyeOff className="w-4 h-4" />:<Eye className="w-4 h-4" />}</button></div></div>
              <div><label className="block text-sm font-semibold text-gray-700 mb-2">Confirmar Contraseña</label><div className="relative"><input type={showConfirm?"text":"password"} value={form.confirm} onChange={set("confirm")} placeholder="Repite tu contraseña" className={`w-full px-4 py-3 border-2 rounded-xl focus:outline-none text-sm pr-12 ${form.confirm&&form.confirm!==form.password?"border-red-400":"border-gray-200 focus:border-[#1565c0]"}`} /><button type="button" onClick={()=>setShowConfirm(!showConfirm)} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400">{showConfirm?<EyeOff className="w-4 h-4" />:<Eye className="w-4 h-4" />}</button></div>{form.confirm&&form.confirm!==form.password&&<p className="text-red-500 text-xs mt-1">Las contraseñas no coinciden</p>}</div>
              <button onClick={()=>setSubmitted(true)} className="w-full py-3.5 bg-[#0d2b5e] text-white rounded-xl font-bold hover:bg-[#1565c0] transition-colors shadow-lg">Crear Cuenta</button>
              <div className="text-center border-t border-gray-100 pt-4"><span className="text-sm text-gray-500">¿Ya tienes cuenta? </span><button onClick={()=>navigate("/login")} className="text-sm text-[#1565c0] font-semibold hover:underline">Inicia sesión</button></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
