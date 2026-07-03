import { useEffect, useMemo, useState, type ReactNode } from "react";
import {
  AlertTriangle,
  Building2,
  CheckCircle2,
  Eye,
  Lock,
  MapPin,
  Briefcase,
  Save,
  Search,
  Star,
  X,
} from "lucide-react";

import { apiClient } from "../../../infrastructure/api/apiClient";

type Empresa = {
  id: number;
  nombre: string;
  area: string;
  modalidad: string;
  ubicacion: string;
  vacantes: number;
  cupoTotal: number;
  horario: string;
  disponible: boolean;
  plan: string[];
  correo?: string;
  telefono?: string;
};

type Preferencia = {
  id_preferencia: number;
  id_empresa: number;
  empresa: string;
  orden_preferencia: number;
  prioritaria: boolean;
  estado_preferencia: "Pendiente" | "Aprobada" | "Rechazada" | "Cancelada";
};

type PadronResponse = {
  habilitado: boolean;
  motivo?: string;
  empresas: Array<{
    id_empresa: number;
    nombre_empresa: string;
    giro?: string | null;
    domicilio?: string | null;
    telefono?: string | null;
    correo_contacto?: string | null;
    titulo?: string | null;
    descripcion?: string | null;
    modalidad?: string | null;
    horario?: string | null;
    cupo_total: number;
    cupo_disponible: number;
  }>;
  preferencias: Preferencia[];
};

export function PadronEmpresarial() {
  const [empresas, setEmpresas] = useState<Empresa[]>([]);
  const [preferencias, setPreferencias] = useState<Preferencia[]>([]);
  const [seleccionadas, setSeleccionadas] = useState<number[]>([]);
  const [detalle, setDetalle] = useState<Empresa | null>(null);
  const [empresaPriorizada, setEmpresaPriorizada] = useState<number | null>(null);
  const [padronHabilitado, setPadronHabilitado] = useState(false);
  const [motivoBloqueo, setMotivoBloqueo] = useState("Primero deben aprobarse los 7 documentos iniciales");
  const [busqueda, setBusqueda] = useState("");
  const [loading, setLoading] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState("");
  const [mensaje, setMensaje] = useState("");

  useEffect(() => {
    cargarDatos();
  }, []);

  const cargarDatos = async () => {
    try {
      setLoading(true);
      setError("");
      setMensaje("");

      const response = await apiClient.get<PadronResponse>("/alumno/padron-empresarial");
      const data = response.data;

      setPadronHabilitado(data.habilitado);
      setMotivoBloqueo(data.motivo || "Primero deben aprobarse los 7 documentos iniciales");
      setPreferencias(data.preferencias || []);

      const empresasAdaptadas: Empresa[] = (data.empresas || []).map((empresa) => ({
        id: empresa.id_empresa,
        nombre: empresa.nombre_empresa,
        area: empresa.giro || empresa.titulo || "Area no especificada",
        modalidad: empresa.modalidad || "Modalidad no registrada",
        ubicacion: empresa.domicilio || "Ubicacion no registrada",
        vacantes: empresa.cupo_disponible || 0,
        cupoTotal: empresa.cupo_total || 0,
        horario: empresa.horario || "Horario no registrado",
        disponible: (empresa.cupo_disponible || 0) > 0,
        correo: empresa.correo_contacto || undefined,
        telefono: empresa.telefono || undefined,
        plan: [
          empresa.titulo || empresa.giro || "Practicas profesionales",
          empresa.descripcion || "Actividades definidas por la unidad receptora",
          empresa.modalidad ? `Modalidad ${empresa.modalidad}` : "Seguimiento de actividades profesionales",
        ],
      }));

      setEmpresas(empresasAdaptadas);
      setSeleccionadas((data.preferencias || []).map((p) => p.id_empresa));
      setEmpresaPriorizada((data.preferencias || []).find((p) => p.prioritaria)?.id_empresa || null);
    } catch (err: any) {
      console.error(err);
      setError(err.response?.data?.detail || "No se pudo cargar el padron empresarial.");
    } finally {
      setLoading(false);
    }
  };

  const tienePreferenciasActivas = preferencias.some((p) => ["Pendiente", "Aprobada"].includes(p.estado_preferencia));
  const preferenciaAprobada = preferencias.find((p) => p.estado_preferencia === "Aprobada");

  const toggleEmpresa = (id: number) => {
    if (!padronHabilitado || tienePreferenciasActivas) return;

    const empresa = empresas.find((e) => e.id === id);
    if (!empresa?.disponible || empresa.vacantes === 0) return;

    if (seleccionadas.includes(id)) {
      setSeleccionadas(seleccionadas.filter((x) => x !== id));
      if (empresaPriorizada === id) setEmpresaPriorizada(null);
      return;
    }

    if (seleccionadas.length >= 3) return;
    setSeleccionadas([...seleccionadas, id]);
  };

  const guardarPreferencias = async () => {
    if (!padronHabilitado || seleccionadas.length === 0 || tienePreferenciasActivas) return;

    try {
      setGuardando(true);
      setError("");
      setMensaje("");
      const payload = {
        preferencias: seleccionadas.map((id) => ({
          id_empresa: id,
          prioritaria: empresaPriorizada === id,
        })),
      };
      const response = await apiClient.post<{ mensaje: string; preferencias: Preferencia[] }>(
        "/alumno/preferencias-empresa",
        payload,
      );
      setMensaje(response.data.mensaje || "Preferencias enviadas a coordinacion.");
      await cargarDatos();
    } catch (err: any) {
      console.error(err);
      setError(err.response?.data?.detail || "No se pudieron guardar las preferencias.");
    } finally {
      setGuardando(false);
    }
  };

  const opciones = useMemo(
    () => seleccionadas.map((id) => empresas.find((e) => e.id === id)).filter(Boolean) as Empresa[],
    [seleccionadas, empresas],
  );

  const empresasFiltradas = useMemo(() => {
    const texto = busqueda.trim().toLowerCase();
    if (!texto) return empresas;
    return empresas.filter((empresa) =>
      [empresa.nombre, empresa.area, empresa.ubicacion, empresa.modalidad].some((value) =>
        value.toLowerCase().includes(texto),
      ),
    );
  }, [busqueda, empresas]);

  if (loading) {
    return <div className="text-sm text-gray-500">Cargando padron empresarial...</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[#0d2b5e]">Padron Empresarial</h1>
        <p className="text-gray-500 text-sm mt-1">
          Consulta empresas disponibles y selecciona hasta 3 opciones para tus practicas profesionales.
        </p>
      </div>

      {error ? <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl p-4 text-sm">{error}</div> : null}
      {mensaje ? <div className="bg-green-50 border border-green-200 text-green-700 rounded-xl p-4 text-sm">{mensaje}</div> : null}

      {!padronHabilitado ? (
        <div className="bg-white rounded-2xl border border-orange-200 shadow-sm p-8">
          <div className="flex flex-col md:flex-row gap-5 md:items-center">
            <div className="w-16 h-16 rounded-2xl bg-orange-100 text-orange-700 flex items-center justify-center flex-shrink-0">
              <Lock className="w-8 h-8" />
            </div>
            <div className="flex-1">
              <h2 className="text-xl font-bold text-[#0d2b5e]">Padron empresarial bloqueado</h2>
              <p className="text-gray-600 text-sm mt-2 leading-relaxed">{motivoBloqueo}.</p>
              <div className="mt-4 bg-orange-50 border border-orange-200 rounded-xl p-4 text-sm text-orange-700">
                Regresa a Carga de Documentos y espera la validacion del Coordinador de Practicas.
              </div>
            </div>
          </div>
        </div>
      ) : (
        <>
          <div className="bg-[#0d2b5e] rounded-2xl p-6 text-white">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-5">
              <div>
                <h2 className="text-xl font-bold">Convocatoria activa</h2>
                <p className="text-blue-200 text-sm mt-1">Empresas con vacantes activas registradas en la base de datos.</p>
              </div>
              <span className="bg-green-100 text-green-700 px-4 py-2 rounded-full text-sm font-semibold w-fit">
                {empresas.reduce((total, empresa) => total + empresa.vacantes, 0)} vacantes disponibles
              </span>
            </div>
          </div>

          {tienePreferenciasActivas ? (
            <div className="bg-white rounded-2xl border border-blue-200 shadow-sm p-6">
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                <div>
                  <h3 className="font-bold text-[#0d2b5e]">Preferencias enviadas</h3>
                  <p className="text-sm text-gray-500 mt-1">
                    {preferenciaAprobada
                      ? `Coordinacion aprobo tu asignacion en ${preferenciaAprobada.empresa}.`
                      : "Tus opciones fueron enviadas al Coordinador de Practicas y estan pendientes de validacion."}
                  </p>
                </div>
                <span className={`px-4 py-2 rounded-full text-sm font-semibold w-fit ${preferenciaAprobada ? "bg-green-100 text-green-700" : "bg-yellow-100 text-yellow-700"}`}>
                  {preferenciaAprobada ? "Aprobada" : "Pendiente de revision"}
                </span>
              </div>
              <div className="grid md:grid-cols-3 gap-3 mt-5">
                {preferencias.map((pref) => (
                  <div key={pref.id_preferencia} className="border border-gray-200 rounded-xl p-4 bg-gray-50">
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-xs font-bold text-[#1565c0]">Opcion {pref.orden_preferencia}</span>
                      {pref.prioritaria ? <Star className="w-4 h-4 text-yellow-500" /> : null}
                    </div>
                    <p className="font-semibold text-[#0d2b5e] text-sm mt-2">{pref.empresa}</p>
                    <p className="text-xs text-gray-500 mt-1">{pref.estado_preferencia}</p>
                  </div>
                ))}
              </div>
            </div>
          ) : null}

          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5">
            <div className="grid md:grid-cols-3 gap-4">
              <div className="border rounded-xl px-3 py-2 flex items-center gap-2">
                <Search className="w-4 h-4 text-gray-400" />
                <input value={busqueda} onChange={(e) => setBusqueda(e.target.value)} className="outline-none text-sm w-full" placeholder="Buscar empresa..." />
              </div>
              <div className="border rounded-xl px-3 py-2 text-sm text-gray-600 flex items-center">{empresas.length} empresas con vacante</div>
              <div className="border rounded-xl px-3 py-2 text-sm text-gray-600 flex items-center">Seleccionadas: {seleccionadas.length}/3</div>
            </div>
          </div>

          <div className="grid lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 grid md:grid-cols-2 gap-5">
              {empresasFiltradas.map((empresa) => {
                const selected = seleccionadas.includes(empresa.id);
                const priorizada = empresaPriorizada === empresa.id;
                const sinCupos = !empresa.disponible || empresa.vacantes === 0;
                const disabled = tienePreferenciasActivas || sinCupos || (!selected && seleccionadas.length >= 3);

                return (
                  <div key={empresa.id} className={`rounded-2xl border shadow-sm p-6 relative ${sinCupos ? "bg-gray-100 border-gray-300 opacity-70" : priorizada ? "bg-yellow-50 border-yellow-300" : "bg-white border-gray-200"}`}>
                    {sinCupos && <div className="absolute top-4 right-4 bg-red-100 text-red-700 px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1"><AlertTriangle className="w-3 h-3" />Sin cupos</div>}
                    {priorizada && <div className="absolute top-4 right-4 bg-yellow-100 text-yellow-700 px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1"><Star className="w-3 h-3" />Priorizada</div>}

                    <div className="flex items-start justify-between gap-4 pr-24">
                      <div><h3 className="font-bold text-[#0d2b5e]">{empresa.nombre}</h3><p className="text-sm text-gray-500 mt-1">{empresa.area}</p></div>
                      {selected && !priorizada && <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-xs font-semibold">Seleccionada</span>}
                    </div>

                    <div className="grid grid-cols-2 gap-3 mt-5">
                      <InfoCard icon={<MapPin className="w-4 h-4" />} label="Ubicacion" value={empresa.ubicacion} />
                      <InfoCard icon={<Briefcase className="w-4 h-4" />} label="Vacantes" value={`${empresa.vacantes}/${empresa.cupoTotal} espacios`} />
                    </div>

                    <div className="mt-4 bg-gray-50 border border-gray-200 rounded-xl p-4">
                      <p className="text-xs font-semibold text-gray-500 mb-1">Plan de trabajo</p>
                      <p className="text-sm text-gray-600">{empresa.plan[0]}, {empresa.plan[1]}.</p>
                    </div>

                    <div className="flex flex-wrap gap-2 mt-5">
                      <button onClick={() => setDetalle(empresa)} className="border border-blue-200 text-[#1565c0] rounded-xl px-3 py-2 text-xs font-semibold flex items-center gap-1"><Eye className="w-3 h-3" />Ver detalles</button>
                      <button disabled={disabled} onClick={() => toggleEmpresa(empresa.id)} className={`rounded-xl px-3 py-2 text-xs font-semibold flex items-center gap-1 ${selected ? "border border-red-200 text-red-600" : disabled ? "bg-gray-200 text-gray-500 cursor-not-allowed" : "bg-[#1565c0] text-white"}`}>
                        {selected ? <><X className="w-3 h-3" />Quitar</> : sinCupos ? <><AlertTriangle className="w-3 h-3" />No disponible</> : <><CheckCircle2 className="w-3 h-3" />Seleccionar</>}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="space-y-6">
              <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 sticky top-24">
                <h3 className="font-bold text-[#0d2b5e] mb-2">Mis opciones</h3>
                <p className="text-sm text-gray-500 mb-5">Selecciona hasta 3 empresas en orden de preferencia.</p>
                <div className="space-y-3">
                  {[0, 1, 2].map((i) => {
                    const empresa = opciones[i];
                    const priorizada = empresa && empresaPriorizada === empresa.id;
                    return <div key={i} className={`border rounded-xl p-4 flex items-center gap-3 ${priorizada ? "bg-yellow-50 border-yellow-300" : "bg-white"}`}><div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${priorizada ? "bg-yellow-100 text-yellow-700" : "bg-blue-50 text-[#1565c0]"}`}>{priorizada ? <Star className="w-4 h-4" /> : i + 1}</div><div className="flex-1">{empresa ? <><p className="font-semibold text-[#0d2b5e] text-sm">{empresa.nombre}</p><p className="text-xs text-gray-500">{empresa.area}</p>{priorizada && <p className="text-xs text-yellow-700 font-semibold mt-1">Empresa priorizada</p>}</> : <p className="text-sm text-gray-400">Opcion pendiente</p>}</div></div>;
                  })}
                </div>

                {seleccionadas.length > 0 && !tienePreferenciasActivas && <div className="mt-5 bg-yellow-50 border border-yellow-200 rounded-2xl p-4"><p className="text-sm font-bold text-[#0d2b5e]">Empresa prioritaria</p><p className="text-xs text-gray-500 mt-1">Marca una opcion si ya tienes relacion directa con esa unidad receptora.</p><div className="space-y-2 mt-4">{opciones.map((empresa) => <button key={empresa.id} onClick={() => setEmpresaPriorizada(empresaPriorizada === empresa.id ? null : empresa.id)} className={`w-full rounded-xl px-4 py-3 text-sm font-semibold flex items-center justify-between border ${empresaPriorizada === empresa.id ? "bg-yellow-100 border-yellow-400 text-yellow-800" : "bg-white border-gray-200 text-gray-600"}`}><span>{empresa.nombre}</span>{empresaPriorizada === empresa.id && <Star className="w-4 h-4" />}</button>)}</div></div>}

                <button onClick={guardarPreferencias} disabled={seleccionadas.length === 0 || guardando || tienePreferenciasActivas} className="mt-5 w-full bg-[#1565c0] text-white rounded-xl py-2 text-sm font-semibold flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"><Save className="w-4 h-4" />{guardando ? "Enviando..." : "Enviar preferencias"}</button>
                <div className="mt-4 bg-blue-50 border border-blue-200 rounded-xl p-4"><p className="text-sm text-[#0d2b5e]">Al enviar tus opciones se reservan temporalmente los cupos y pasan a revision del Coordinador de Practicas.</p></div>
              </div>
            </div>
          </div>
        </>
      )}

      {detalle && <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4"><div className="bg-white rounded-2xl max-w-xl w-full p-6"><div className="flex items-start justify-between gap-4"><div><h3 className="text-xl font-bold text-[#0d2b5e]">{detalle.nombre}</h3><p className="text-sm text-gray-500 mt-1">{detalle.area} - {detalle.modalidad}</p></div><button onClick={() => setDetalle(null)} className="text-gray-400 hover:text-gray-600"><X className="w-5 h-5" /></button></div><div className="grid md:grid-cols-2 gap-4 mt-5"><div className="border rounded-xl p-4"><p className="text-xs text-gray-500">Ubicacion</p><p className="font-semibold text-[#0d2b5e]">{detalle.ubicacion}</p></div><div className="border rounded-xl p-4"><p className="text-xs text-gray-500">Horario</p><p className="font-semibold text-[#0d2b5e]">{detalle.horario}</p></div></div><div className="mt-5"><h4 className="font-bold text-[#0d2b5e]">Plan de trabajo</h4><div className="space-y-2 mt-3">{detalle.plan.map((p) => <div key={p} className="flex items-center gap-2 text-sm text-gray-700"><Building2 className="w-4 h-4 text-[#1565c0]" />{p}</div>)}</div></div><button disabled={!detalle.disponible || detalle.vacantes === 0 || tienePreferenciasActivas} onClick={() => { toggleEmpresa(detalle.id); setDetalle(null); }} className={`mt-6 w-full rounded-xl py-2 text-sm font-semibold ${!detalle.disponible || detalle.vacantes === 0 || tienePreferenciasActivas ? "bg-gray-200 text-gray-500 cursor-not-allowed" : "bg-[#1565c0] text-white"}`}>{!detalle.disponible || detalle.vacantes === 0 ? "No disponible por falta de cupos" : "Seleccionar como opcion"}</button></div></div>}
    </div>
  );
}

function InfoCard({ icon, label, value }: { icon: ReactNode; label: string; value: string }) {
  return <div className="border rounded-xl p-3 bg-white/70"><div className="flex items-center gap-2 text-xs text-gray-500">{icon}{label}</div><p className="font-semibold text-[#0d2b5e] mt-1">{value}</p></div>;
}