import { useNavigate } from "react-router";
import { Users, Shield, Settings, BarChart3, ClipboardList, TrendingUp } from "lucide-react";

export function AdminDashboard() {
  const navigate = useNavigate();
  return (
    <div className="space-y-6">
      <div><h1 className="text-2xl font-bold text-[#0d2b5e]">Dashboard Administrativo</h1><p className="text-gray-500 text-sm mt-1">Panel de control del sistema · Administrador General</p></div>
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-5">
        {[{l:"Usuarios Totales",v:"1,482",I:Users,c:"bg-blue-50 text-blue-600",t:"+12 esta semana"},{l:"Roles Activos",v:"7",I:Shield,c:"bg-purple-50 text-purple-600",t:"Todos funcionando"},{l:"Catálogos",v:"24",I:ClipboardList,c:"bg-green-50 text-green-600",t:"2 requieren actualización"},{l:"Reportes generados",v:"156",I:BarChart3,c:"bg-orange-50 text-orange-600",t:"Este mes"}].map(w=>(
          <div key={w.l} className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5"><div className={`w-10 h-10 ${w.c} rounded-xl flex items-center justify-center mb-3`}><w.I className="w-5 h-5" /></div><div className="text-2xl font-bold text-[#0d2b5e]">{w.v}</div><div className="text-gray-500 text-sm mt-0.5">{w.l}</div><div className="text-xs text-gray-400 mt-1 flex items-center gap-1"><TrendingUp className="w-3 h-3" />{w.t}</div></div>
        ))}
      </div>
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
        {[{I:Users,l:"Gestión de Usuarios",d:"Crear, editar, eliminar y desactivar usuarios del sistema",p:"/admin/usuarios",g:"from-blue-600 to-blue-500"},{I:Shield,l:"Roles y Permisos",d:"Administrar roles de acceso y permisos por módulo",p:"/admin/usuarios",g:"from-purple-600 to-purple-500"},{I:ClipboardList,l:"Catálogos",d:"Gestionar catálogos: carreras, giros, periodos y más",p:"/admin/usuarios",g:"from-green-600 to-green-500"},{I:BarChart3,l:"Reportes",d:"Generar y descargar reportes estadísticos del sistema",p:"/admin/usuarios",g:"from-orange-500 to-orange-400"},{I:Settings,l:"Configuración",d:"Parámetros generales del sistema y notificaciones",p:"/admin/usuarios",g:"from-gray-700 to-gray-600"}].map(m=>(
          <button key={m.l} onClick={()=>navigate(m.p)} className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 text-left hover:shadow-md transition-shadow group">
            <div className={`w-12 h-12 bg-gradient-to-br ${m.g} rounded-2xl flex items-center justify-center mb-4`}><m.I className="w-6 h-6 text-white" /></div>
            <div className="font-bold text-[#0d2b5e] mb-1 group-hover:text-[#1565c0] transition-colors">{m.l}</div>
            <div className="text-gray-500 text-xs leading-relaxed">{m.d}</div>
          </button>
        ))}
      </div>
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
        <h3 className="font-bold text-[#0d2b5e] mb-4">Estado del Sistema</h3>
        <div className="grid md:grid-cols-3 gap-4">
          {[{l:"Servidor principal",s:"Operativo",c:"text-green-600",d:"bg-green-500"},{l:"Base de datos",s:"Operativo",c:"text-green-600",d:"bg-green-500"},{l:"Servicio de correo",s:"Operativo",c:"text-green-600",d:"bg-green-500"},{l:"Almacenamiento",s:"78% usado",c:"text-yellow-600",d:"bg-yellow-500"},{l:"Backup automático",s:"Último: hoy 03:00",c:"text-green-600",d:"bg-green-500"},{l:"Sesiones activas",s:"124 usuarios",c:"text-blue-600",d:"bg-blue-500"}].map(s=>(
            <div key={s.l} className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl"><div className={`w-2.5 h-2.5 rounded-full ${s.d} flex-shrink-0`} /><div><div className="text-xs text-gray-500">{s.l}</div><div className={`text-sm font-semibold ${s.c}`}>{s.s}</div></div></div>
          ))}
        </div>
      </div>
    </div>
  );
}
