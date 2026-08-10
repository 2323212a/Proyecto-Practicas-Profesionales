import { useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  Building2,
  CheckCircle2,
  Filter,
  RotateCcw,
  Save,
  Search,
  Users,
  XCircle,
} from "lucide-react";

import { gestionConfirmacionAsignacionesUseCase } from "../../dependencies";
import type { AlumnoConfirmacion, AsesorInterno } from "../../../domain/coordinador/ConfirmacionAsignacion";
import { getApiErrorMessage } from "../../../shared/utils/apiError";

import type { StatCard } from "../../../shared/types/ui";
type EstadoFiltro = "pendientes" | "asignados" | "todos" | "rezagados";

export function CoordinadorAsignaciones() {
  const [alumnos, setAlumnos] = useState<AlumnoConfirmacion[]>([]);
  const [asesores, setAsesores] = useState<AsesorInterno[]>([]);
  const [convocatoria, setConvocatoria] = useState<string | null>(null);
  const [busqueda, setBusqueda] = useState("");
  const [estadoFiltro, setEstadoFiltro] = useState<EstadoFiltro>("pendientes");
  const [selecciones, setSelecciones] = useState<Record<number, string>>({});
  const [reasignaciones, setReasignaciones] = useState<Record<number, string>>({});
  const [motivosReasignacion, setMotivosReasignacion] = useState<Record<number, string>>({});
  const [motivosRezagado, setMotivosRezagado] = useState<Record<number, string>>({});
  const [asesoresSeleccionados, setAsesoresSeleccionados] = useState<Record<number, string>>({});
  const [secretariaAcademica, setSecretariaAcademica] = useState("");
  const [guardandoSecretaria, setGuardandoSecretaria] = useState(false);
  const [mensajeSecretaria, setMensajeSecretaria] = useState("");
  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState<number | null>(null);
  const [reasignando, setReasignando] = useState<number | null>(null);
  const [rechazando, setRechazando] = useState<number | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    void cargarDatos();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps -- initial fetch; subsequent refreshes are explicit after actions.

  async function cargarDatos() {
    try {
      setCargando(true);
      setError("");
      const data = await gestionConfirmacionAsignacionesUseCase.listar();
      setAlumnos(data.alumnos);
      setAsesores(data.asesores);
      setConvocatoria(data.convocatoria);
      setSecretariaAcademica(data.secretaria_academica ?? "");
      setSelecciones(crearSeleccionesIniciales(data.alumnos));
    } catch (err) {
      console.error(err);
      setError("No se pudieron cargar las solicitudes de asignacion.");
    } finally {
      setCargando(false);
    }
  }

  function crearSeleccionesIniciales(lista: AlumnoConfirmacion[]) {
    return Object.fromEntries(
      lista
        .filter((alumno) => !alumno.ya_asignado)
        .map((alumno) => {
          const primeraPreferencia = alumno.preferencias.find(
            (preferencia) =>
              preferencia.estado_empresa === "Activa" &&
              preferencia.estado_seleccion === "Pendiente" &&
              preferencia.vacantes.length > 0
          );
          const primeraVacante = primeraPreferencia?.vacantes[0];

          return [
            alumno.id_alumno,
            primeraPreferencia && primeraVacante
              ? `${primeraPreferencia.id_empresa}:${primeraVacante.id_vacante}`
              : "",
          ];
        })
    );
  }

  const resumen = useMemo(() => {
    const pendientes = alumnos.filter((alumno) => !alumno.ya_asignado);
    return {
      total: alumnos.length,
      asignados: alumnos.filter((alumno) => alumno.ya_asignado).length,
      pendientes: pendientes.length,
      rezagados: pendientes.filter((alumno) => alumno.es_rezagado).length,
    };
  }, [alumnos]);

  const filtrados = useMemo(() => {
    const q = busqueda.trim().toLowerCase();

    return alumnos.filter((alumno) => {
      const coincideBusqueda =
        alumno.nombre.toLowerCase().includes(q) ||
        alumno.matricula.toLowerCase().includes(q) ||
        alumno.carrera.toLowerCase().includes(q) ||
        alumno.periodo_practica.toLowerCase().includes(q) ||
        alumno.preferencias.some((preferencia) =>
          preferencia.empresa.toLowerCase().includes(q)
        );

      const coincideEstado =
        estadoFiltro === "todos" ||
        (estadoFiltro === "pendientes" && !alumno.ya_asignado) ||
        (estadoFiltro === "asignados" && alumno.ya_asignado) ||
        (estadoFiltro === "rezagados" && alumno.es_rezagado);

      return coincideBusqueda && coincideEstado;
    });
  }, [alumnos, busqueda, estadoFiltro]);

  function tieneOpciones(alumno: AlumnoConfirmacion) {
    return alumno.preferencias.some(
      (preferencia) =>
        preferencia.estado_seleccion === "Pendiente" &&
        preferencia.estado_empresa === "Activa" && preferencia.vacantes.length > 0
    );
  }

  function limpiarFiltros() {
    setBusqueda("");
    setEstadoFiltro("pendientes");
  }

  async function guardarSecretariaAcademica() {
    const nombre = secretariaAcademica.trim().replace(/\s+/g, " ");
    if (nombre.length < 3) {
      setMensajeSecretaria("Ingresa el nombre completo de la persona encargada.");
      return;
    }

    try {
      setGuardandoSecretaria(true);
      setMensajeSecretaria("");
      const respuesta = await gestionConfirmacionAsignacionesUseCase.actualizarSecretariaAcademica(nombre);
      setSecretariaAcademica(respuesta.secretaria_academica);
      setMensajeSecretaria("Nombre actualizado. Las cartas compromiso se generaran con este dato.");
    } catch (err: unknown) {
      console.error(err);
      setMensajeSecretaria(getApiErrorMessage(err, "No se pudo actualizar el nombre de Secretaria Academica."));
    } finally {
      setGuardandoSecretaria(false);
    }
  }

  async function confirmar(alumno: AlumnoConfirmacion) {
    const valor = selecciones[alumno.id_alumno];
    if (!valor) return;

    const [idEmpresa, idVacante] = valor.split(":").map(Number);
    const esAsignacionRezagado = alumno.es_rezagado && !tieneOpciones(alumno);
    const motivo = (motivosRezagado[alumno.id_alumno] ?? "").trim();
    if (esAsignacionRezagado && motivo.length < 3) {
      alert("Escribe el motivo u observación para asignar al alumno rezagado.");
      return;
    }
    if (esAsignacionRezagado && !asesoresSeleccionados[alumno.id_alumno]) {
      alert("Selecciona un asesor interno para el alumno rezagado.");
      return;
    }

    try {
      setGuardando(alumno.id_alumno);
      await gestionConfirmacionAsignacionesUseCase.confirmar({
        id_alumno: alumno.id_alumno,
        id_empresa: idEmpresa,
        id_vacante: idVacante,
        id_asesor: asesoresSeleccionados[alumno.id_alumno]
          ? Number(asesoresSeleccionados[alumno.id_alumno])
          : null,
        tipo_asignacion: esAsignacionRezagado ? "Rezagado" : "Normal",
        motivo: esAsignacionRezagado ? motivo : null,
      });
      await cargarDatos();
    } catch (err: unknown) {
      console.error(err);
      alert(getApiErrorMessage(err, "No se pudo confirmar la asignacion del alumno."));
    } finally {
      setGuardando(null);
    }
  }

  async function rechazarSeleccion(idSeleccion: number) {
    const observaciones = window.prompt(
      "Motivo del rechazo",
      "La opcion no fue aceptada para esta asignacion."
    );
    if (observaciones === null) return;

    try {
      setRechazando(idSeleccion);
      await gestionConfirmacionAsignacionesUseCase.rechazar(idSeleccion, {
        observaciones: observaciones.trim() || "Solicitud rechazada por coordinacion.",
      });
      await cargarDatos();
    } catch (err: unknown) {
      console.error(err);
      alert(getApiErrorMessage(err, "No se pudo rechazar la solicitud."));
    } finally {
      setRechazando(null);
    }
  }

  async function cambiarEmpresa(alumno: AlumnoConfirmacion) {
    if (!alumno.id_asignacion) return;
    const idVacante = Number(reasignaciones[alumno.id_asignacion] ?? "");
    const motivo = (motivosReasignacion[alumno.id_asignacion] ?? "").trim();

    if (!idVacante) {
      alert("Selecciona la nueva vacante para la reasignacion.");
      return;
    }
    if (motivo.length < 3) {
      alert("Escribe el motivo del cambio de empresa.");
      return;
    }

    try {
      setReasignando(alumno.id_asignacion);
      await gestionConfirmacionAsignacionesUseCase.cambiarEmpresa(alumno.id_asignacion, {
        id_vacante_nueva: idVacante,
        motivo,
        id_asesor: asesoresSeleccionados[alumno.id_alumno]
          ? Number(asesoresSeleccionados[alumno.id_alumno])
          : null,
        notificar_alumno: true,
        regenerar_documentos: true,
      });
      setReasignaciones((actuales) => ({ ...actuales, [alumno.id_asignacion as number]: "" }));
      setMotivosReasignacion((actuales) => ({ ...actuales, [alumno.id_asignacion as number]: "" }));
      await cargarDatos();
    } catch (err: unknown) {
      console.error(err);
      alert(getApiErrorMessage(err, "No se pudo cambiar la empresa asignada."));
    } finally {
      setReasignando(null);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[#0d2b5e]">
          Asignacion de Alumnos
        </h1>
        <p className="text-gray-500 text-sm mt-1">
          Confirma la empresa y vacante a partir de las preferencias guardadas
          por cada alumno.
        </p>
      </div>

      {error && (
        <div className="bg-orange-50 border border-orange-200 rounded-xl px-4 py-3 text-sm text-orange-700">
          {error}
        </div>
      )}

      <div className="bg-[#0d2b5e] rounded-2xl p-6 text-white">
        <div className="flex flex-col xl:flex-row xl:items-center xl:justify-between gap-5">
          <div>
            <h2 className="text-xl font-bold">
              {convocatoria ?? "Convocatoria sin seleccionar"}
            </h2>
            <p className="text-blue-200 text-sm mt-1">
              Al confirmar se crea la asignacion formal y se ocupa un cupo de la vacante.
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {([
              ["Alumnos", resumen.total, Users],
              ["Pendientes", resumen.pendientes, AlertTriangle],
              ["Asignados", resumen.asignados, CheckCircle2],
              ["Rezagados", resumen.rezagados, Building2],
            ] satisfies StatCard[]).map(([titulo, valor, Icon]) => (
              <div
                key={titulo}
                className="bg-white/10 rounded-xl px-4 py-3 min-w-32"
              >
                <Icon className="w-4 h-4 mb-2 text-blue-100" />
                <div className="text-xl font-bold">
                  {cargando ? "..." : valor}
                </div>
                <div className="text-xs text-blue-100">{titulo}</div>
              </div>
            ))}
          </div>
        </div>
      </div>



      <div className="bg-white rounded-2xl border border-blue-200 shadow-sm p-5">
        <div className="flex flex-col lg:flex-row lg:items-end gap-4">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <Users className="w-5 h-5 text-[#1565c0]" />
              <h3 className="font-bold text-[#0d2b5e]">Encargado de Secretaria Academica</h3>
            </div>
            <p className="text-sm text-gray-500 mb-3">
              Este nombre aparecera como responsable de Secretaria Academica en los documentos generados por el sistema.
            </p>
            <label className="block text-xs font-semibold text-gray-600 mb-1.5">Nombre completo</label>
            <input
              value={secretariaAcademica}
              onChange={(event) => {
                setSecretariaAcademica(event.target.value);
                setMensajeSecretaria("");
              }}
              maxLength={150}
              placeholder="Ej. Paola Lopez Hernandez"
              className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-[#1565c0] focus:ring-2 focus:ring-blue-100"
            />
          </div>

          <button
            type="button"
            onClick={guardarSecretariaAcademica}
            disabled={guardandoSecretaria || secretariaAcademica.trim().length < 3}
            className="bg-[#1565c0] text-white rounded-xl px-5 py-2.5 text-sm font-semibold flex items-center justify-center gap-2 disabled:bg-gray-300 lg:min-w-48"
          >
            <Save className="w-4 h-4" />
            {guardandoSecretaria ? "Guardando..." : "Guardar responsable"}
          </button>
        </div>

        {mensajeSecretaria && (
          <div className="mt-3 flex items-center gap-2 text-sm text-[#0d2b5e] bg-blue-50 border border-blue-100 rounded-xl px-3 py-2">
            <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
            {mensajeSecretaria}
          </div>
        )}
      </div>

      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-[#1565c0]" />
            <h3 className="font-bold text-[#0d2b5e] text-sm">
              Filtros de revision
            </h3>
          </div>
          <button
            onClick={limpiarFiltros}
            className="flex items-center gap-1 text-xs text-gray-500 hover:text-[#1565c0]"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Limpiar filtros
          </button>
        </div>

        <div className="grid md:grid-cols-[1fr_240px] gap-3">
          <label className="border rounded-xl px-3 py-2 flex items-center gap-2">
            <Search className="w-4 h-4 text-gray-400" />
            <input
              value={busqueda}
              onChange={(event) => setBusqueda(event.target.value)}
              className="outline-none text-sm w-full"
              placeholder="Buscar alumno, matricula, carrera, periodo o empresa..."
            />
          </label>

          <select
            value={estadoFiltro}
            onChange={(event) => setEstadoFiltro(event.target.value as EstadoFiltro)}
            className="border rounded-xl px-3 py-2 text-sm outline-none"
          >
            <option value="pendientes">Pendientes</option>
            <option value="asignados">Asignados</option>
            <option value="rezagados">Alumnos rezagados</option>
            <option value="todos">Todos</option>
          </select>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
          <h3 className="font-bold text-[#0d2b5e]">
            {estadoFiltro === "rezagados" ? "Alumnos rezagados" : "Solicitudes de asignacion"}
          </h3>
          <span className="text-xs text-gray-500">
            {filtrados.length} registros
          </span>
        </div>
        {estadoFiltro === "rezagados" && (
          <div className="px-5 py-3 border-b border-orange-100 bg-orange-50 text-sm text-orange-800">
            Alumnos con expediente aprobado que aún no tienen asignación activa.
          </div>
        )}

        {cargando ? (
          <div className="px-5 py-10 text-sm text-gray-500">
            Cargando solicitudes...
          </div>
        ) : filtrados.length === 0 ? (
          <div className="px-5 py-10 text-sm text-gray-500">
            No hay alumnos con los filtros seleccionados.
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {filtrados.map((alumno) => (
              <div
                key={alumno.id_alumno}
                className="p-5 grid xl:grid-cols-[1.1fr_1.6fr_1fr] gap-5"
              >
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <h4 className="font-bold text-[#0d2b5e]">
                      {alumno.nombre}
                    </h4>
                    {alumno.ya_asignado && (
                      <span className="text-xs px-2 py-1 rounded-full bg-green-50 text-green-700">
                        Asignado
                      </span>
                    )}
                    {alumno.es_rezagado && (
                      <span className="text-xs px-2 py-1 rounded-full bg-orange-50 text-orange-700">
                        Rezagado
                      </span>
                    )}
                  </div>
                  <div className="text-sm text-gray-500">
                    {alumno.matricula}
                  </div>
                  <div className="text-sm text-gray-500">{alumno.carrera}</div>
                  <div className="text-sm text-gray-500">Periodo: {alumno.periodo_practica}</div>
                  <div className="text-xs mt-3 text-gray-400">
                    Estado: {alumno.estado_alumno}
                  </div>
                  {alumno.es_rezagado && alumno.motivo_rezago && (
                    <div className="text-xs mt-2 text-orange-700">{alumno.motivo_rezago}</div>
                  )}
                </div>

                <div>
                  {alumno.ya_asignado ? (
                    <div className="border border-green-100 bg-green-50 rounded-xl px-4 py-3 text-sm space-y-3">
                      <div>
                        <div className="font-semibold text-green-800">
                          {alumno.empresa_asignada}
                        </div>
                        <div className="text-green-700 mt-1">
                          {alumno.vacante_asignada}
                        </div>
                      </div>

                      {alumno.id_asignacion && (
                        <div className="border-t border-green-100 pt-3 space-y-2">
                          <div className="text-xs font-semibold text-green-900">
                            Reasignación extraordinaria
                          </div>
                          <div className="text-xs text-amber-700 bg-amber-50 border border-amber-100 rounded-lg px-3 py-2">
                            Esta acción cancelará la asignación actual y creará una nueva asignación extraordinaria.
                          </div>
                          {alumno.vacantes_disponibles.length > 0 ? (
                            <>
                              <select
                                value={reasignaciones[alumno.id_asignacion] ?? ""}
                                onChange={(event) =>
                                  setReasignaciones((actuales) => ({
                                    ...actuales,
                                    [alumno.id_asignacion as number]: event.target.value,
                                  }))
                                }
                                className="w-full border border-green-200 rounded-xl px-3 py-2 text-xs outline-none bg-white"
                              >
                                <option value="">Seleccionar nueva vacante</option>
                                {alumno.vacantes_disponibles.map((vacante) => (
                                  <option key={vacante.id_vacante} value={vacante.id_vacante}>
                                    {vacante.empresa} - {vacante.titulo} - {vacante.convocatoria ?? "Sin convocatoria"} - {vacante.tipo_practica ?? "Sin tipo"} ({vacante.cupos_disponibles} de {vacante.cupos})
                                  </option>
                                ))}
                              </select>

                              <input
                                value={motivosReasignacion[alumno.id_asignacion] ?? ""}
                                onChange={(event) =>
                                  setMotivosReasignacion((actuales) => ({
                                    ...actuales,
                                    [alumno.id_asignacion as number]: event.target.value,
                                  }))
                                }
                                placeholder="Motivo obligatorio"
                                className="w-full border border-green-200 rounded-xl px-3 py-2 text-xs outline-none bg-white"
                              />
                            </>
                          ) : (
                            <div className="text-xs text-green-700">
                              No hay vacantes compatibles con cupo disponible.
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  ) : alumno.preferencias.length === 0 ? (
                    <div className="border border-orange-100 bg-orange-50 rounded-xl px-4 py-3 text-sm text-orange-700">
                      El alumno aun no guarda preferencias de empresa.
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {alumno.preferencias.map((preferencia) => (
                        <div
                          key={preferencia.id_seleccion}
                          className="border rounded-xl px-4 py-3"
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <div className="text-sm font-semibold text-[#0d2b5e]">
                                {preferencia.prioridad}. {preferencia.empresa}
                              </div>
                              <div className="text-xs text-gray-500 mt-1">
                                {preferencia.estado_seleccion !== "Pendiente"
                                  ? preferencia.observaciones ?? "Solicitud revisada"
                                  : preferencia.estado_empresa === "Activa"
                                  ? `${preferencia.vacantes.length} vacantes compatibles`
                                  : "Empresa no activa"}
                              </div>
                            </div>
                            <div className="flex flex-col items-end gap-2">
                              <span
                                className={`text-xs px-2 py-1 rounded-full ${
                                  preferencia.estado_seleccion === "Aprobada"
                                    ? "bg-green-50 text-green-700"
                                    : preferencia.estado_seleccion === "Rechazada"
                                      ? "bg-red-50 text-red-700"
                                      : "bg-yellow-50 text-yellow-700"
                                }`}
                              >
                                {preferencia.estado_seleccion}
                              </span>
                              <span
                                className={`text-xs px-2 py-1 rounded-full ${
                                  preferencia.estado_empresa === "Activa"
                                    ? "bg-green-50 text-green-700"
                                    : "bg-gray-100 text-gray-500"
                                }`}
                              >
                                {preferencia.estado_empresa}
                              </span>
                            </div>
                          </div>
                          {!alumno.ya_asignado && preferencia.estado_seleccion === "Pendiente" && (
                            <button
                              onClick={() => rechazarSeleccion(preferencia.id_seleccion)}
                              disabled={rechazando === preferencia.id_seleccion}
                              className="mt-3 border border-red-200 text-red-600 rounded-lg px-3 py-2 text-xs font-semibold flex items-center gap-2 disabled:opacity-50"
                            >
                              <XCircle className="w-3.5 h-3.5" />
                              {rechazando === preferencia.id_seleccion ? "Rechazando..." : "Rechazar opcion"}
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="flex flex-col justify-center gap-3">
                  {alumno.ya_asignado && alumno.id_asignacion && (
                    <>
                      <select
                        value={asesoresSeleccionados[alumno.id_alumno] ?? ""}
                        onChange={(event) =>
                          setAsesoresSeleccionados((actuales) => ({
                            ...actuales,
                            [alumno.id_alumno]: event.target.value,
                          }))
                        }
                        className="border rounded-xl px-3 py-2 text-sm outline-none"
                      >
                        <option value="">Conservar asesor actual</option>
                        {asesores.map((asesor) => (
                          <option key={asesor.id_asesor} value={asesor.id_asesor}>
                            {asesor.nombre}
                          </option>
                        ))}
                      </select>

                      <button
                        onClick={() => cambiarEmpresa(alumno)}
                        disabled={
                          !reasignaciones[alumno.id_asignacion] ||
                          !motivosReasignacion[alumno.id_asignacion]?.trim() ||
                          reasignando === alumno.id_asignacion
                        }
                        className="bg-[#1565c0] text-white rounded-xl px-4 py-2.5 text-sm font-semibold flex items-center justify-center gap-2 disabled:bg-gray-300"
                      >
                        <RotateCcw className="w-4 h-4" />
                        {reasignando === alumno.id_asignacion ? "Reasignando..." : "Reasignar alumno"}
                      </button>
                    </>
                  )}

                  {!alumno.ya_asignado && (
                    <>
                      <select
                        value={selecciones[alumno.id_alumno] ?? ""}
                        onChange={(event) =>
                          setSelecciones((actuales) => ({
                            ...actuales,
                            [alumno.id_alumno]: event.target.value,
                          }))
                        }
                        className="border rounded-xl px-3 py-2 text-sm outline-none"
                        disabled={!tieneOpciones(alumno) && alumno.vacantes_disponibles.length === 0}
                      >
                        <option value="">
                          {tieneOpciones(alumno) ? "Seleccionar por prioridad" : "Asignación manual de rezagado"}
                        </option>
                        {tieneOpciones(alumno)
                          ? alumno.preferencias.flatMap((preferencia) =>
                              preferencia.estado_seleccion !== "Pendiente"
                                ? []
                                : preferencia.vacantes.map((vacante) => (
                                    <option
                                      key={`${preferencia.id_empresa}:${vacante.id_vacante}`}
                                      value={`${preferencia.id_empresa}:${vacante.id_vacante}`}
                                    >
                                      {preferencia.prioridad}. {preferencia.empresa} -{" "}
                                      {vacante.titulo} ({vacante.cupos_disponibles} de {vacante.cupos})
                                    </option>
                                  ))
                            )
                          : alumno.vacantes_disponibles.map((vacante) => (
                              <option
                                key={`rezagado:${vacante.id_vacante}`}
                                value={`${vacante.id_empresa}:${vacante.id_vacante}`}
                              >
                                {vacante.empresa} - {vacante.titulo} ({vacante.cupos_disponibles} de {vacante.cupos})
                              </option>
                            ))}
                      </select>

                      {alumno.es_rezagado && !tieneOpciones(alumno) && (
                        <textarea
                          value={motivosRezagado[alumno.id_alumno] ?? ""}
                          onChange={(event) =>
                            setMotivosRezagado((actuales) => ({
                              ...actuales,
                              [alumno.id_alumno]: event.target.value,
                            }))
                          }
                          maxLength={1000}
                          rows={3}
                          placeholder="Motivo u observación obligatoria"
                          className="border rounded-xl px-3 py-2 text-sm outline-none resize-none"
                        />
                      )}

                      <select
                        value={asesoresSeleccionados[alumno.id_alumno] ?? ""}
                        onChange={(event) =>
                          setAsesoresSeleccionados((actuales) => ({
                            ...actuales,
                            [alumno.id_alumno]: event.target.value,
                          }))
                        }
                        className="border rounded-xl px-3 py-2 text-sm outline-none"
                      >
                        <option value="">Sin asesor asignado</option>
                        {asesores.map((asesor) => (
                          <option key={asesor.id_asesor} value={asesor.id_asesor}>
                            {asesor.nombre}
                          </option>
                        ))}
                      </select>

                      <button
                        onClick={() => confirmar(alumno)}
                        disabled={
                          !selecciones[alumno.id_alumno] ||
                          (alumno.es_rezagado &&
                            !tieneOpciones(alumno) &&
                            (!motivosRezagado[alumno.id_alumno]?.trim() ||
                              !asesoresSeleccionados[alumno.id_alumno])) ||
                          guardando === alumno.id_alumno
                        }
                        className="bg-[#1565c0] text-white rounded-xl px-4 py-2.5 text-sm font-semibold flex items-center justify-center gap-2 disabled:bg-gray-300"
                      >
                        <Save className="w-4 h-4" />
                        {guardando === alumno.id_alumno
                          ? "Confirmando..."
                          : alumno.es_rezagado && !tieneOpciones(alumno)
                            ? "Asignar rezagado"
                            : "Confirmar asignacion"}
                      </button>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
