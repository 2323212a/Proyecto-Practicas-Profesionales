import { useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  Briefcase,
  Building2,
  CalendarDays,
  CheckCircle2,
  Eye,
  Mail,
  MapPin,
  Phone,
  Save,
  Search,
  Star,
  X,
} from "lucide-react";

import { gestionPadronUseCase } from "../../dependencies";
import type {
  EmpresaAsignadaAlumno,
  EmpresaPadronDisponible,
  VacantePadron,
} from "../../../domain/alumno/Padron";

type EmpresaPadron = {
  id_empresa: number;
  nombre: string;
  giro: string | null;
  domicilio: string | null;
  correo_contacto: string | null;
  telefono: string | null;
  vacantes: VacantePadron[];
  cupo_disponible: number;
  modalidades: string[];
  carreras: string[];
};

function obtenerIdAlumnoSesion() {
  const usuario = localStorage.getItem("usuario");
  if (!usuario) return null;

  try {
    const sesion = JSON.parse(usuario);
    const idAlumno = sesion?.perfil?.id_alumno;
    return typeof idAlumno === "number" ? idAlumno : null;
  } catch {
    return null;
  }
}

export function PadronEmpresarial() {
  const [empresasCatalogo, setEmpresasCatalogo] = useState<EmpresaPadronDisponible[]>([]);
  const [vacantes, setVacantes] = useState<VacantePadron[]>([]);
  const [seleccionadas, setSeleccionadas] = useState<number[]>([]);
  const [detalle, setDetalle] = useState<EmpresaPadron | null>(null);
  const [empresaPriorizada, setEmpresaPriorizada] = useState<number | null>(null);
  const [puedeSeleccionar, setPuedeSeleccionar] = useState(false);
  const [motivoBloqueo, setMotivoBloqueo] = useState<string | null>(null);
  const [estadoAlumno, setEstadoAlumno] = useState("");
  const [empresaAsignada, setEmpresaAsignada] = useState<EmpresaAsignadaAlumno | null>(null);
  const [busqueda, setBusqueda] = useState("");
  const [modalidad, setModalidad] = useState("todas");
  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    cargarPadron();
  }, []);

  async function cargarPadron() {
    const idAlumno = obtenerIdAlumnoSesion();
    if (!idAlumno) {
      setError("No se encontró el perfil de alumno en la sesión actual.");
      setCargando(false);
      return;
    }

    try {
      setCargando(true);
      setError("");
      const data = await gestionPadronUseCase.obtener(idAlumno);
      setPuedeSeleccionar(data.puede_seleccionar);
      setMotivoBloqueo(data.motivo_bloqueo);
      setEstadoAlumno(data.estado_alumno);
      setEmpresaAsignada(data.empresa_asignada);
      setEmpresasCatalogo(data.empresas ?? []);
      setVacantes(data.vacantes);
      const ordenadas = [...data.selecciones]
        .sort((a, b) => a.prioridad - b.prioridad)
        .map((seleccion) => seleccion.id_empresa);
      setSeleccionadas(ordenadas);
    } catch (err) {
      console.error(err);
      setError("No se pudo cargar el padrón empresarial.");
    } finally {
      setCargando(false);
    }
  }

  const empresas = useMemo<EmpresaPadron[]>(() => {
    const mapa = new Map<number, EmpresaPadron>();

    for (const empresa of empresasCatalogo) {
      mapa.set(empresa.id_empresa, {
        id_empresa: empresa.id_empresa,
        nombre: empresa.nombre,
        giro: empresa.giro,
        domicilio: empresa.domicilio,
        correo_contacto: empresa.correo_contacto,
        telefono: empresa.telefono,
        vacantes: [],
        cupo_disponible: 0,
        modalidades: [],
        carreras: [],
      });
    }

    for (const vacante of vacantes) {
      const empresa = mapa.get(vacante.id_empresa) ?? {
        id_empresa: vacante.id_empresa,
        nombre: vacante.empresa,
        giro: vacante.giro,
        domicilio: vacante.domicilio,
        correo_contacto: vacante.correo_contacto,
        telefono: vacante.telefono,
        vacantes: [],
        cupo_disponible: 0,
        modalidades: [],
        carreras: [],
      };

      empresa.vacantes.push(vacante);
      empresa.cupo_disponible += vacante.cupo_disponible;
      empresa.modalidades = [...new Set([...empresa.modalidades, vacante.modalidad])];
      empresa.carreras = [...new Set([...empresa.carreras, vacante.carrera])];
      mapa.set(vacante.id_empresa, empresa);
    }

    return [...mapa.values()].sort((a, b) => a.nombre.localeCompare(b.nombre));
  }, [empresasCatalogo, vacantes]);

  const filtradas = useMemo(() => {
    const q = busqueda.toLowerCase();
    return empresas.filter((empresa) => {
      const coincideBusqueda =
        empresa.nombre.toLowerCase().includes(q) ||
        (empresa.giro ?? "").toLowerCase().includes(q) ||
        empresa.carreras.some((carrera) => carrera.toLowerCase().includes(q));
      const coincideModalidad =
        modalidad === "todas" || empresa.modalidades.includes(modalidad);
      return coincideBusqueda && coincideModalidad;
    });
  }, [empresas, busqueda, modalidad]);

  const toggleEmpresa = (idEmpresa: number) => {
    if (!puedeSeleccionar) return;
    if (seleccionadas.includes(idEmpresa)) {
      setSeleccionadas(seleccionadas.filter((id) => id !== idEmpresa));
      if (empresaPriorizada === idEmpresa) setEmpresaPriorizada(null);
      return;
    }

    const empresa = empresas.find((item) => item.id_empresa === idEmpresa);
    if (!empresa || empresa.cupo_disponible <= 0) return;
    if (seleccionadas.length >= 3) return;
    setSeleccionadas([...seleccionadas, idEmpresa]);
  };

  async function guardarPreferencias() {
    const idAlumno = obtenerIdAlumnoSesion();
    if (!idAlumno) {
      alert("No se encontró el perfil de alumno.");
      return;
    }
    if (seleccionadas.length === 0) {
      alert("Selecciona al menos una empresa.");
      return;
    }
    if (!puedeSeleccionar) {
      alert(motivoBloqueo ?? "Tu expediente debe estar aprobado antes de seleccionar empresa.");
      return;
    }

    try {
      setGuardando(true);
      await gestionPadronUseCase.guardarPreferencias(
        idAlumno,
        seleccionadas.map((idEmpresa, index) => ({
          id_empresa: idEmpresa,
          prioridad: index + 1,
        })),
        empresaPriorizada
      );
      alert("Preferencias guardadas correctamente");
      await cargarPadron();
    } catch (err) {
      console.error(err);
      alert("No se pudieron guardar las preferencias.");
    } finally {
      setGuardando(false);
    }
  }

  const opciones = seleccionadas
    .map((id) => empresas.find((empresa) => empresa.id_empresa === id))
    .filter(Boolean) as EmpresaPadron[];

  if (!cargando && estadoAlumno === "Asignado") {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-[#0d2b5e]">Padrón Empresarial</h1>
          <p className="text-gray-500 text-sm mt-1">
            Consulta la información de tu unidad receptora asignada.
          </p>
        </div>

        {error && (
          <div className="bg-orange-50 border border-orange-200 rounded-xl px-4 py-3 text-sm text-orange-700">
            {error}
          </div>
        )}

        {empresaAsignada ? (
          <section className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
            <div className="bg-[#0d2b5e] px-6 py-7 text-white flex items-start gap-4">
              <div className="w-12 h-12 bg-white/10 rounded-xl flex items-center justify-center flex-shrink-0">
                <Building2 className="w-6 h-6" />
              </div>
              <div>
                <p className="text-blue-200 text-sm">Ya estás asignado a la empresa</p>
                <h2 className="text-2xl font-bold mt-1">{empresaAsignada.nombre}</h2>
                <p className="text-blue-100 text-sm mt-2">
                  {empresaAsignada.giro ?? "Giro empresarial no registrado"}
                </p>
              </div>
            </div>

            <div className="p-6 grid sm:grid-cols-2 gap-4">
              <div className="border border-gray-200 rounded-xl p-4">
                <div className="flex items-center gap-2 text-gray-500 text-sm">
                  <Briefcase className="w-4 h-4 text-[#1565c0]" />
                  Vacante asignada
                </div>
                <p className="font-semibold text-[#0d2b5e] mt-2">
                  {empresaAsignada.vacante ?? "No registrada"}
                </p>
                {(empresaAsignada.modalidad || empresaAsignada.horario) && (
                  <p className="text-sm text-gray-500 mt-1">
                    {[empresaAsignada.modalidad, empresaAsignada.horario]
                      .filter(Boolean)
                      .join(" · ")}
                  </p>
                )}
              </div>

              <div className="border border-gray-200 rounded-xl p-4">
                <div className="flex items-center gap-2 text-gray-500 text-sm">
                  <MapPin className="w-4 h-4 text-[#1565c0]" />
                  Domicilio
                </div>
                <p className="font-semibold text-[#0d2b5e] mt-2">
                  {empresaAsignada.domicilio ?? "No registrado"}
                </p>
              </div>

              <div className="border border-gray-200 rounded-xl p-4">
                <div className="flex items-center gap-2 text-gray-500 text-sm">
                  <Mail className="w-4 h-4 text-[#1565c0]" />
                  Correo de contacto
                </div>
                <p className="font-semibold text-[#0d2b5e] mt-2 break-words">
                  {empresaAsignada.correo_contacto ?? "No registrado"}
                </p>
              </div>

              <div className="border border-gray-200 rounded-xl p-4">
                <div className="flex items-center gap-2 text-gray-500 text-sm">
                  <Phone className="w-4 h-4 text-[#1565c0]" />
                  Teléfono
                </div>
                <p className="font-semibold text-[#0d2b5e] mt-2">
                  {empresaAsignada.telefono ?? "No registrado"}
                </p>
              </div>

              <div className="sm:col-span-2 bg-green-50 border border-green-200 rounded-xl p-4 flex items-center gap-3">
                <CalendarDays className="w-5 h-5 text-green-700 flex-shrink-0" />
                <p className="text-sm text-green-800">
                  Asignación confirmada el{" "}
                  <span className="font-semibold">
                    {new Intl.DateTimeFormat("es-MX", {
                      day: "2-digit",
                      month: "long",
                      year: "numeric",
                    }).format(new Date(`${empresaAsignada.fecha_asignacion}T00:00:00`))}
                  </span>
                </p>
              </div>
            </div>
          </section>
        ) : (
          <div className="bg-orange-50 border border-orange-200 rounded-2xl p-6">
            <h2 className="font-semibold text-orange-800">Asignación en proceso</h2>
            <p className="text-sm text-orange-700 mt-1">
              Tu estado figura como asignado, pero aún no está disponible la información de la empresa.
            </p>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[#0d2b5e]">Padrón Empresarial</h1>
        <p className="text-gray-500 text-sm mt-1">
          Consulta empresas aprobadas y selecciona hasta 3 opciones para tus prácticas profesionales.
        </p>
      </div>

      {error && (
        <div className="bg-orange-50 border border-orange-200 rounded-xl px-4 py-3 text-sm text-orange-700">
          {error}
        </div>
      )}

      <div className="bg-[#0d2b5e] rounded-2xl p-6 text-white">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-5">
          <div>
            <h2 className="text-xl font-bold">Empresas autorizadas</h2>
            <p className="text-blue-200 text-sm mt-1">
              Aparecen empresas activas del padron; las que no tienen cupo no se pueden seleccionar.
            </p>
          </div>

          <span className="bg-green-100 text-green-700 px-4 py-2 rounded-full text-sm font-semibold w-fit">
            {cargando ? "Cargando..." : `${empresas.length} empresas disponibles`}
          </span>
        </div>
      </div>

      {!puedeSeleccionar && !cargando && (
        <div className="bg-orange-50 border border-orange-200 rounded-2xl p-5 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-orange-600 mt-0.5" />
          <div>
            <div className="font-semibold text-orange-700 text-sm">
              Seleccion de empresa bloqueada
            </div>
            <div className="text-orange-700 text-xs mt-1">
              {motivoBloqueo} Estado actual: {estadoAlumno || "Sin estado"}.
            </div>
          </div>
        </div>
      )}

      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5">
        <div className="grid md:grid-cols-2 gap-4">
          <div className="border rounded-xl px-3 py-2 flex items-center gap-2">
            <Search className="w-4 h-4 text-gray-400" />
            <input
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              className="outline-none text-sm w-full"
              placeholder="Buscar empresa, giro o carrera..."
            />
          </div>

          <select
            value={modalidad}
            onChange={(e) => setModalidad(e.target.value)}
            className="border rounded-xl px-3 py-2 text-sm bg-white"
          >
            <option value="todas">Todas las modalidades</option>
            <option value="Presencial">Presencial</option>
            <option value="Virtual">Virtual</option>
            <option value="Hibrida">Híbrida</option>
          </select>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 grid md:grid-cols-2 gap-5">
          {cargando && (
            <div className="md:col-span-2 bg-white rounded-2xl border border-gray-200 shadow-sm p-10 text-center text-gray-400">
              Cargando padrón empresarial...
            </div>
          )}

          {!cargando &&
            filtradas.map((empresa) => {
              const selected = seleccionadas.includes(empresa.id_empresa);
              const priorizada = empresaPriorizada === empresa.id_empresa;
              const sinCupo = empresa.cupo_disponible <= 0;
              const disabled = !puedeSeleccionar || (!selected && (sinCupo || seleccionadas.length >= 3));

              return (
                <div
                  key={empresa.id_empresa}
                  className={`rounded-2xl border shadow-sm p-6 relative ${
                    priorizada
                      ? "bg-yellow-50 border-yellow-300"
                      : "bg-white border-gray-200"
                  }`}
                >
                  {priorizada && (
                    <div className="absolute top-4 right-4 bg-yellow-100 text-yellow-700 px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1">
                      <Star className="w-3 h-3" />
                      Priorizada
                    </div>
                  )}

                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h3 className="font-bold text-[#0d2b5e]">{empresa.nombre}</h3>
                      <p className="text-sm text-gray-500 mt-1">
                        {empresa.giro ?? "Sin giro registrado"}
                      </p>
                    </div>

                    {selected && !priorizada && (
                      <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-xs font-semibold">
                        Seleccionada
                      </span>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-3 mt-5">
                    <div className="border rounded-xl p-3 bg-white/70">
                      <div className="flex items-center gap-2 text-xs text-gray-500">
                        <MapPin className="w-4 h-4" />
                        Ubicación
                      </div>
                      <p className="font-semibold text-[#0d2b5e] mt-1">
                        {empresa.domicilio ?? "No registrada"}
                      </p>
                    </div>

                    <div className="border rounded-xl p-3 bg-white/70">
                      <div className="flex items-center gap-2 text-xs text-gray-500">
                        <Briefcase className="w-4 h-4" />
                        Vacantes
                      </div>
                      <p className="font-semibold text-[#0d2b5e] mt-1">
                        {empresa.cupo_disponible} espacios
                      </p>
                    </div>
                  </div>

                  <div className="mt-4 bg-gray-50 border border-gray-200 rounded-xl p-4">
                    <p className="text-xs font-semibold text-gray-500 mb-1">
                      Vacantes disponibles
                    </p>
                    <p className="text-sm text-gray-600">
                      {empresa.vacantes.length > 0
                        ? empresa.vacantes.map((vacante) => vacante.titulo).join(", ")
                        : "Sin vacantes disponibles por ahora."}
                    </p>
                  </div>

                  <div className="flex flex-wrap gap-2 mt-5">
                    <button
                      onClick={() => setDetalle(empresa)}
                      className="border border-blue-200 text-[#1565c0] rounded-xl px-3 py-2 text-xs font-semibold flex items-center gap-1"
                    >
                      <Eye className="w-3 h-3" />
                      Ver detalles
                    </button>

                    <button
                      disabled={disabled}
                      onClick={() => toggleEmpresa(empresa.id_empresa)}
                      className={`rounded-xl px-3 py-2 text-xs font-semibold flex items-center gap-1 ${
                        selected
                          ? "border border-red-200 text-red-600"
                          : disabled
                            ? "bg-gray-200 text-gray-500 cursor-not-allowed"
                            : "bg-[#1565c0] text-white"
                      }`}
                    >
                      {selected ? (
                        <>
                          <X className="w-3 h-3" />
                          Quitar
                        </>
                      ) : (
                        <>
                          <CheckCircle2 className="w-3 h-3" />
                          {sinCupo ? "Sin cupo" : "Seleccionar"}
                        </>
                      )}
                    </button>
                  </div>
                </div>
              );
            })}

          {!cargando && filtradas.length === 0 && (
            <div className="md:col-span-2 bg-white rounded-2xl border border-gray-200 shadow-sm p-10 text-center text-gray-400">
              No hay empresas disponibles con los filtros seleccionados.
            </div>
          )}
        </div>

        <div className="space-y-6">
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 sticky top-24">
            <h3 className="font-bold text-[#0d2b5e] mb-2">Mis opciones</h3>
            <p className="text-sm text-gray-500 mb-5">
              Selecciona hasta 3 empresas en orden de preferencia.
            </p>

            <div className="space-y-3">
              {[0, 1, 2].map((i) => {
                const empresa = opciones[i];
                const priorizada = empresa && empresaPriorizada === empresa.id_empresa;

                return (
                  <div
                    key={i}
                    className={`border rounded-xl p-4 flex items-center gap-3 ${
                      priorizada ? "bg-yellow-50 border-yellow-300" : "bg-white"
                    }`}
                  >
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                        priorizada
                          ? "bg-yellow-100 text-yellow-700"
                          : "bg-blue-50 text-[#1565c0]"
                      }`}
                    >
                      {priorizada ? <Star className="w-4 h-4" /> : i + 1}
                    </div>

                    <div className="flex-1">
                      {empresa ? (
                        <>
                          <p className="font-semibold text-[#0d2b5e] text-sm">
                            {empresa.nombre}
                          </p>
                          <p className="text-xs text-gray-500">
                            {empresa.vacantes.length} vacante(s)
                          </p>
                          {priorizada && (
                            <p className="text-xs text-yellow-700 font-semibold mt-1">
                              Empresa priorizada
                            </p>
                          )}
                        </>
                      ) : (
                        <p className="text-sm text-gray-400">Opción pendiente</p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {seleccionadas.length > 0 && (
              <div className="mt-5 bg-yellow-50 border border-yellow-200 rounded-2xl p-4">
                <p className="text-sm font-bold text-[#0d2b5e]">
                  ¿Estás priorizado en alguna empresa?
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  Selecciónala antes de guardar. Coordinación validará esa prioridad.
                </p>

                <div className="space-y-2 mt-4">
                  {opciones.map((empresa) => (
                    <button
                      key={empresa.id_empresa}
                      onClick={() =>
                        setEmpresaPriorizada(
                          empresaPriorizada === empresa.id_empresa
                            ? null
                            : empresa.id_empresa
                        )
                      }
                      className={`w-full rounded-xl px-4 py-3 text-sm font-semibold flex items-center justify-between border ${
                        empresaPriorizada === empresa.id_empresa
                          ? "bg-yellow-100 border-yellow-400 text-yellow-800"
                          : "bg-white border-gray-200 text-gray-600"
                      }`}
                    >
                      <span>{empresa.nombre}</span>
                      {empresaPriorizada === empresa.id_empresa && (
                        <Star className="w-4 h-4" />
                      )}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <button
              onClick={guardarPreferencias}
              disabled={guardando || seleccionadas.length === 0 || !puedeSeleccionar}
              className="mt-5 w-full bg-[#1565c0] text-white rounded-xl py-2 text-sm font-semibold flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Save className="w-4 h-4" />
              {guardando ? "Guardando..." : "Guardar preferencias"}
            </button>

            <div className="mt-4 bg-blue-50 border border-blue-200 rounded-xl p-4">
              <p className="text-sm text-[#0d2b5e]">
                Guardar preferencias no descuenta cupos. Coordinación confirmará la asignación final.
              </p>
            </div>
          </div>
        </div>
      </div>

      {detalle && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h3 className="text-xl font-bold text-[#0d2b5e]">{detalle.nombre}</h3>
                <p className="text-sm text-gray-500 mt-1">
                  {detalle.giro ?? "Sin giro registrado"}
                </p>
              </div>

              <button
                onClick={() => setDetalle(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid md:grid-cols-2 gap-4 mt-5">
              <div className="border rounded-xl p-4">
                <p className="text-xs text-gray-500">Ubicación</p>
                <p className="font-semibold text-[#0d2b5e]">
                  {detalle.domicilio ?? "No registrada"}
                </p>
              </div>

              <div className="border rounded-xl p-4">
                <p className="text-xs text-gray-500">Contacto</p>
                <p className="font-semibold text-[#0d2b5e]">
                  {detalle.correo_contacto ?? detalle.telefono ?? "No registrado"}
                </p>
              </div>
            </div>

            <div className="mt-5">
              <h4 className="font-bold text-[#0d2b5e]">Vacantes disponibles</h4>

              <div className="space-y-3 mt-3">
                {detalle.vacantes.length === 0 && (
                  <div className="border rounded-xl p-4 text-sm text-gray-500">
                    Esta empresa esta registrada en el padron, pero no tiene vacantes disponibles por ahora.
                  </div>
                )}
                {detalle.vacantes.map((vacante) => (
                  <div key={vacante.id_vacante} className="border rounded-xl p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-semibold text-[#0d2b5e]">{vacante.titulo}</p>
                        <p className="text-xs text-gray-500 mt-1">{vacante.carrera}</p>
                      </div>
                      <span className="text-xs bg-green-100 text-green-700 px-3 py-1 rounded-full font-semibold">
                        {vacante.cupo_disponible} cupo(s)
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 mt-3">
                      {vacante.descripcion ?? "Sin descripción registrada."}
                    </p>
                    <p className="text-xs text-gray-500 mt-2">
                      {vacante.modalidad} · {vacante.horario ?? "Horario no registrado"}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            <button
              onClick={() => {
                toggleEmpresa(detalle.id_empresa);
                setDetalle(null);
              }}
              disabled={!puedeSeleccionar || (!seleccionadas.includes(detalle.id_empresa) && detalle.cupo_disponible <= 0)}
              className="mt-6 w-full bg-[#1565c0] text-white rounded-xl py-2 text-sm font-semibold disabled:bg-gray-300 disabled:cursor-not-allowed"
            >
              {seleccionadas.includes(detalle.id_empresa)
                ? "Quitar de mis opciones"
                : detalle.cupo_disponible <= 0
                  ? "Sin vacantes disponibles"
                  : "Seleccionar como opción"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
