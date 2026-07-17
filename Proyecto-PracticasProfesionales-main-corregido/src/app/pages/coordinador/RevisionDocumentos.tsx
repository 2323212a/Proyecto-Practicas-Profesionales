import { useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import { useSearchParams } from "react-router";
import {
  AlertTriangle,
  CheckCircle,
  Clock,
  Eye,
  FileText,
  Lock,
  RefreshCw,
  Search,
  Send,
  Unlock,
  UserCheck,
} from "lucide-react";

import { gestionRevisionDocumentalUseCase } from "../../dependencies";
import type { AlumnoResumenRevision, DetalleRevisionAlumno, DocumentoRevisionFlujo } from "../../../domain/documento/RevisionDocumental";
import { getApiErrorMessage } from "../../../shared/utils/apiError";

const motivos = ["Documento incorrecto", "Baja calidad de imagen", "Informacion incompleta", "Nombre de archivo incorrecto", "Falta firma", "Documento ilegible"];

const nombreAlumno = (detalle: DetalleRevisionAlumno) => [detalle.alumno.nombre, detalle.alumno.apellido_paterno, detalle.alumno.apellido_materno].filter(Boolean).join(" ");

const estadoDoc = (doc: DocumentoRevisionFlujo) => {
  if (doc.estado === "Aprobado") return { label: "Aprobado", color: "bg-green-100 text-green-700", icon: CheckCircle };
  if (doc.estado === "Observado" || doc.estado === "Rechazado") return { label: "Correccion", color: "bg-orange-100 text-orange-700", icon: AlertTriangle };
  if (doc.nombre_archivo) return { label: "Pendiente", color: "bg-yellow-100 text-yellow-700", icon: Clock };
  return { label: "Sin cargar", color: "bg-gray-100 text-gray-500", icon: Clock };
};

export function RevisionDocumentos() {
  const [searchParams, setSearchParams] = useSearchParams();
  const alumnoParametro = Number(searchParams.get("alumno"));
  const alumnoInicial = Number.isInteger(alumnoParametro) && alumnoParametro > 0 ? alumnoParametro : null;
  const [alumnos, setAlumnos] = useState<AlumnoResumenRevision[]>([]);
  const [seleccionado, setSeleccionado] = useState<number | null>(alumnoInicial);
  const [detalle, setDetalle] = useState<DetalleRevisionAlumno | null>(null);
  const [busqueda, setBusqueda] = useState("");
  const [loading, setLoading] = useState(true);
  const [loadingDetalle, setLoadingDetalle] = useState(false);
  const [procesando, setProcesando] = useState<number | null>(null);
  const [accion, setAccion] = useState("");
  const [corrigiendoId, setCorrigiendoId] = useState<number | null>(null);
  const [motivo, setMotivo] = useState("");
  const [comentario, setComentario] = useState("");
  const [error, setError] = useState("");

  const cargarAlumnos = async () => {
    try {
      setLoading(true);
      const data = await gestionRevisionDocumentalUseCase.listarAlumnosFlujo();
      setAlumnos(data);
      const seleccionadoExiste = seleccionado !== null && data.some((alumno) => alumno.id_alumno === seleccionado);
      if (!seleccionadoExiste && data.length) {
        const primerAlumno = data[0].id_alumno;
        setSeleccionado(primerAlumno);
        setSearchParams({ alumno: String(primerAlumno) }, { replace: true });
      }
    } catch (err) {
      console.error(err);
      setError("No se pudo cargar la lista de alumnos.");
    } finally {
      setLoading(false);
    }
  };

  const cargarDetalle = async (idAlumno: number) => {
    try {
      setLoadingDetalle(true);
      setDetalle(await gestionRevisionDocumentalUseCase.obtenerDetalleAlumno(idAlumno));
    } catch (err) {
      console.error(err);
      setError("No se pudo cargar el expediente del alumno.");
    } finally {
      setLoadingDetalle(false);
    }
  };

  useEffect(() => { void cargarAlumnos(); }, []); // eslint-disable-line react-hooks/exhaustive-deps -- initial list load; refreshes are explicit.
  useEffect(() => { if (seleccionado) void cargarDetalle(seleccionado); }, [seleccionado]);
  useEffect(() => {
    if (alumnoInicial && alumnoInicial !== seleccionado) setSeleccionado(alumnoInicial);
  }, [alumnoInicial, seleccionado]);

  function seleccionarAlumno(idAlumno: number) {
    setSeleccionado(idAlumno);
    setSearchParams({ alumno: String(idAlumno) }, { replace: true });
  }

  const filtrados = useMemo(() => {
    const q = busqueda.toLowerCase().trim();
    if (!q) return alumnos;
    return alumnos.filter((a) => `${a.nombre} ${a.matricula} ${a.carrera ?? ""}`.toLowerCase().includes(q));
  }, [alumnos, busqueda]);

  const porEtapa = useMemo(() => {
    const docs = detalle?.documentos ?? [];
    return {
      elegibilidad: docs.filter((doc) => doc.etapa === "elegibilidad"),
      expediente: docs.filter((doc) => doc.etapa === "expediente"),
      seleccion: docs.filter((doc) => doc.etapa === "seleccion_empresa"),
      asignacion: docs.filter((doc) => doc.etapa === "asignacion"),
      firmados: docs.filter((doc) => doc.etapa === "asignacion_firmada"),
    };
  }, [detalle]);

  const refrescar = async () => {
    if (seleccionado) await cargarDetalle(seleccionado);
    await cargarAlumnos();
  };

  const cambiarEstado = async (doc: DocumentoRevisionFlujo, estado: "Aprobado" | "Observado") => {
    try {
      setProcesando(doc.id_documento);
      await gestionRevisionDocumentalUseCase.cambiarEstado(doc.id_documento, {
        estado,
        comentario: estado === "Observado" ? `${motivo}${comentario ? `: ${comentario}` : ""}` : undefined,
      });
      setCorrigiendoId(null);
      setMotivo("");
      setComentario("");
      await refrescar();
    } catch (err: unknown) {
      console.error(err);
      setError(getApiErrorMessage(err, "No se pudo actualizar el documento."));
    } finally {
      setProcesando(null);
    }
  };

  const habilitarAsignacion = async () => {
    if (!detalle) return;
  
    try {
      setAccion("asignacion");
  
      const data =
        await gestionRevisionDocumentalUseCase.habilitarAsignacion(
          detalle.alumno.id_alumno
        );
  
      setDetalle(data);
      await cargarAlumnos();
    } catch (err: unknown) {
      console.error(err);

      setError(getApiErrorMessage(err, "No se pudo habilitar la documentación de asignación."));
    } finally {
      setAccion("");
    }
  };

  const abrir = async (doc: DocumentoRevisionFlujo) => {
    if (!doc.nombre_archivo) return;
    try {
      const blob = await gestionRevisionDocumentalUseCase.descargarDocumentoFlujo(doc.id_documento);
      const url = URL.createObjectURL(blob);
      window.open(url, "_blank", "noopener,noreferrer");
    } catch (err) {
      console.error(err);
      setError("No se pudo abrir el PDF.");
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-bold text-[#0d2b5e]">Revision de Documentos</h1>
        <p className="text-gray-500 text-[11px] mt-0.5">Coordinador de Practicas Profesionales: revisa por bloques el expediente del alumno.</p>
      </div>

      {error && <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl p-3 text-[11px]">{error}</div>}

      <div className="grid xl:grid-cols-[350px_1fr] gap-3">
        <aside className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="p-3 border-b border-gray-100"><div className="border rounded-xl px-2.5 py-1.5 flex items-center gap-2"><Search className="w-3.5 h-3.5 text-gray-400" /><input value={busqueda} onChange={(e) => setBusqueda(e.target.value)} className="outline-none text-[11px] w-full" placeholder="Buscar alumno..." /></div></div>
          <div className="max-h-[660px] overflow-y-auto divide-y divide-gray-100">
            {loading ? <div className="p-3 text-[11px] text-gray-500">Cargando alumnos...</div> : filtrados.map((a) => (
              <button key={a.id_alumno} onClick={() => seleccionarAlumno(a.id_alumno)} className={`w-full text-left p-3 hover:bg-blue-50 ${seleccionado === a.id_alumno ? "bg-blue-50" : ""}`}>
                <div className="font-semibold text-[11px] text-[#0d2b5e]">{a.nombre}</div>
                <div className="text-[11px] text-gray-500 mt-0.5">{a.matricula} - {a.carrera ?? "Carrera no registrada"}</div>
                <div className="mt-1 flex gap-2 text-[11px]"><span className="bg-green-100 text-green-700 px-2 py-0.5 rounded-full">{a.resumen.aprobados} aprobados</span><span className="bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded-full">{a.resumen.revision} revision</span></div>
              </button>
            ))}
          </div>
        </aside>

        <main className="space-y-4">
          {loadingDetalle ? <div className="bg-white rounded-xl border border-gray-200 p-3 text-[11px] text-gray-500">Cargando expediente...</div> : !detalle ? <div className="bg-white rounded-xl border border-gray-200 p-3 text-[11px] text-gray-500">Selecciona un alumno.</div> : 
            <>
              <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-3 flex flex-col lg:flex-row lg:items-center gap-3">
                <div className="w-9 h-9 bg-[#0d2b5e] rounded-xl flex items-center justify-center text-white"><UserCheck className="w-3.5 h-3.5" /></div>
                <div className="flex-1"><div className="font-bold text-base text-[#0d2b5e]">{nombreAlumno(detalle)}</div><div className="text-gray-500 text-[11px]">Matricula: {detalle.alumno.matricula} - {detalle.alumno.carrera ?? "Carrera no registrada"}</div><div className="text-gray-400 text-[11px] mt-0.5">Expediente #{detalle.expediente.id_expediente} - {detalle.expediente.estado}</div></div>
                <span className="text-[11px] px-4 py-1.5 rounded-full font-semibold bg-blue-100 text-blue-700">{detalle.alumno.estado_alumno ?? "Sin estado"}</span>
              </div>

              <Bloque titulo="Bloque 1: Elegibilidad academica" descripcion="Primer filtro: historial academico y vigencia de derechos. Si no se aprueba este bloque, el alumno no puede continuar." validado={porEtapa.elegibilidad.every((d) => d.estado === "Aprobado")}>
                {porEtapa.elegibilidad.map((doc) => renderDocumento(doc))}
              </Bloque>

              <Bloque titulo="Bloque 2: Expediente inicial" descripcion="Documentos personales del alumno. Se habilita unicamente cuando el alumno pasa el filtro academico." validado={porEtapa.expediente.length > 0 && porEtapa.expediente.every((d) => d.estado === "Aprobado")}>
                {porEtapa.expediente.map((doc) => renderDocumento(doc))}
              </Bloque>

             <div
                className={`rounded-xl border shadow-sm p-4 ${
                  detalle.expediente.seleccion_habilitada
                    ? "bg-green-50 border-green-200"
                    : "bg-gray-50 border-gray-200"
                }`}
              >
                <div className="flex items-start gap-3">
                  {detalle.expediente.seleccion_habilitada ? (
                    <Unlock className="w-4 h-4 text-green-600 mt-0.5" />
                  ) : (
                    <Lock className="w-4 h-4 text-gray-500 mt-0.5" />
                  )}
              
                  <div>
                    <h3
                      className={`font-bold text-sm ${
                        detalle.expediente.seleccion_habilitada
                          ? "text-green-700"
                          : "text-gray-600"
                      }`}
                    >
                      Selección de empresa
                    </h3>
                    
                    <p
                      className={`text-[11px] mt-1 ${
                        detalle.expediente.seleccion_habilitada
                          ? "text-green-600"
                          : "text-gray-500"
                      }`}
                    >
                      {detalle.expediente.seleccion_habilitada
                        ? "Los documentos iniciales están aprobados. El alumno ya puede seleccionar empresas automáticamente."
                        : "La selección se habilitará automáticamente cuando se aprueben todos los documentos de los bloques 1 y 2."}
                    </p>
                  </div>
                </div>
              </div>
              {detalle.expediente.seleccion_habilitada && <Bloque titulo="Bloque 3: Seleccion de empresa" descripcion="El alumno selecciona opciones del padron. El sistema genera la Carta de Exposicion de Motivos y el alumno la sube firmada." validado={porEtapa.seleccion.every((d) => d.estado === "Aprobado")}>
                {porEtapa.seleccion.map((doc) => renderDocumento(doc))}
              </Bloque>}

              <PasoCard
              titulo="Habilitar documentacion de asignacion"
              descripcion="La seleccion de empresa fue validada. Ya pueden generarse los documentos de asignacion."
              activo={detalle.expediente.seleccion_validada}
              completado={detalle.expediente.asignacion_habilitada}
              onClick={habilitarAsignacion}
              loading={accion === "asignacion"}
              icon={<Send className="w-3.5 h-3.5" />}
              />

              <Bloque titulo="Bloque 4: Documentacion de asignacion" descripcion="Carta de colaboracion, carta de presentacion y carta de asignacion." validado={detalle.expediente.asignacion_habilitada}>
                {porEtapa.asignacion.map((doc) => renderDocumento(doc, !detalle.expediente.asignacion_habilitada))}
              </Bloque>

              {detalle.expediente.asignacion_habilitada && <Bloque titulo="Documentos firmados por el alumno" descripcion="El alumno descarga, firma y vuelve a cargar los documentos de asignacion." validado={porEtapa.firmados.length > 0 && porEtapa.firmados.every((d) => d.estado === "Aprobado")}>
                {porEtapa.firmados.map((doc) => renderDocumento(doc))}
              </Bloque>}
            </>
          }
        </main>
      </div>
    </div>
  );

  function renderDocumento(doc: DocumentoRevisionFlujo, bloqueado = false) {
    const cfg = estadoDoc(doc);
    const Icon = cfg.icon;
    const cargado = Boolean(doc.nombre_archivo);
    const puedeRevisar =
      cargado &&
      !bloqueado &&
      !doc.generado_por_sistema &&
      doc.estado !== "Aprobado";
    return (
      <div key={doc.id_documento} className={`px-4 py-4 ${bloqueado ? "opacity-50" : ""}`}>
        <div className="flex flex-col xl:flex-row xl:items-center gap-3">
          <div className="flex items-start gap-3 flex-1"><div className="w-9 h-9 bg-[#e3f0ff] rounded-xl flex items-center justify-center flex-shrink-0"><FileText className="w-3.5 h-3.5 text-[#1565c0]" /></div><div><div className="font-semibold text-gray-800 text-sm">{doc.nombre}</div><div className="text-[11px] text-gray-500 mt-0.5">{doc.descripcion}</div><div className="text-[11px] text-gray-500 mt-1"><span className="font-semibold text-gray-700">Instrucciones:</span> {doc.instrucciones}</div><div className="text-[11px] text-[#1565c0] mt-0.5"><span className="font-semibold">Nomenclatura:</span> {doc.nomenclatura}</div><div className="text-[11px] text-gray-400 mt-0.5">{doc.nombre_archivo ? doc.nombre_archivo : "Sin archivo cargado"}</div>{bloqueado && <div className="text-[11px] text-red-600 mt-1 font-semibold">Este bloque aun no esta habilitado.</div>}</div></div>
          <div className="flex flex-col sm:flex-row sm:items-center gap-3"><span className={`inline-flex items-center justify-center gap-1.5 text-[11px] px-3 py-1.5 rounded-full font-semibold ${cfg.color}`}><Icon className="w-3.5 h-3.5" />{cfg.label}</span><button title={cargado ? "Abrir el PDF cargado por el alumno" : "El alumno aun no ha subido este documento"} onClick={() => abrir(doc)} disabled={!cargado} className="inline-flex min-w-[160px] items-center justify-center gap-2 px-3 py-2 bg-[#0d2b5e] text-white rounded-xl text-[11px] font-bold shadow-sm ring-1 ring-[#0d2b5e]/10 hover:bg-[#1565c0] hover:shadow-md focus:outline-none focus:ring-2 focus:ring-[#1565c0] focus:ring-offset-2 disabled:min-w-[120px] disabled:bg-gray-100 disabled:text-gray-400 disabled:shadow-none disabled:ring-gray-200 disabled:cursor-not-allowed"><Eye className="w-3.5 h-3.5" />{cargado ? "Ver documento PDF" : "Sin PDF"}</button>{puedeRevisar && <button onClick={() => cambiarEstado(doc, "Aprobado")} disabled={procesando === doc.id_documento} className="px-3 py-1.5 bg-green-600 text-white rounded-xl text-[11px] font-semibold hover:bg-green-700 disabled:opacity-50">Aprobar</button>}{puedeRevisar && <button onClick={() => setCorrigiendoId(doc.id_documento)} className="px-3 py-1.5 bg-orange-600 text-white rounded-xl text-[11px] font-semibold hover:bg-orange-700">Solicitar correccion</button>}</div>
        </div>
        {corrigiendoId === doc.id_documento && <div className="mt-1 p-3 bg-orange-50 border border-orange-200 rounded-xl"><div className="text-[11px] font-semibold text-orange-700 mb-2">Motivo de correccion:</div><div className="grid sm:grid-cols-2 gap-2 mb-2">{motivos.map((m) => <label key={m} className="flex items-center gap-2 cursor-pointer p-2 rounded-lg hover:bg-orange-100"><input type="radio" value={m} checked={motivo === m} onChange={(e) => setMotivo(e.target.value)} className="accent-orange-600" /><span className="text-[11px] text-orange-700">{m}</span></label>)}</div><textarea value={comentario} onChange={(e) => setComentario(e.target.value)} placeholder="Agrega una observacion especifica para el alumno..." className="w-full min-h-[64px] text-[11px] border border-orange-200 rounded-xl p-3 focus:outline-none focus:border-orange-500 bg-white" /><div className="flex gap-2 mt-1"><button onClick={() => cambiarEstado(doc, "Observado")} disabled={!motivo} className="px-3 py-1.5 bg-orange-600 text-white rounded-lg text-[11px] font-semibold hover:bg-orange-700 disabled:opacity-50">Confirmar correccion</button><button onClick={() => { setCorrigiendoId(null); setMotivo(""); setComentario(""); }} className="px-3 py-1.5 border border-gray-300 text-gray-600 rounded-lg text-[11px] font-semibold hover:bg-gray-50">Cancelar</button></div></div>}
      </div>
    );
  }
}

function Bloque({ titulo, descripcion, validado, children }: { titulo: string; descripcion: string; validado: boolean; children: ReactNode }) {
  return <section className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden"><div className={`px-4 py-3 border-b flex gap-3 ${validado ? "bg-green-50 border-green-100" : "bg-white border-gray-100"}`}>{validado ? <Unlock className="w-3.5 h-3.5 text-green-600" /> : <Lock className="w-3.5 h-3.5 text-[#1565c0]" />}<div><h3 className={`font-bold text-base ${validado ? "text-green-700" : "text-[#0d2b5e]"}`}>{titulo}</h3><p className={`text-[11px] mt-0.5 ${validado ? "text-green-600" : "text-gray-500"}`}>{descripcion}</p></div></div><div className="divide-y divide-gray-100">{children}</div></section>;
}

function PasoCard({ titulo, descripcion, activo, completado, loading, icon, onClick }: { titulo: string; descripcion: string; activo: boolean; completado: boolean; loading: boolean; icon: ReactNode; onClick: () => void }) {
  return <div className={`rounded-xl border shadow-sm p-3 ${activo || completado ? "bg-green-50 border-green-200" : "bg-gray-50 border-gray-200"}`}><div className="flex flex-col md:flex-row md:items-center gap-3 justify-between"><div><h3 className={`font-bold text-base ${activo || completado ? "text-green-700" : "text-gray-500"}`}>{titulo}</h3><p className={`text-[11px] mt-1 ${activo || completado ? "text-green-600" : "text-gray-400"}`}>{descripcion}</p></div><button onClick={onClick} disabled={!activo || completado || loading} className="inline-flex items-center justify-center gap-2 px-3 py-2 bg-[#0d2b5e] text-white rounded-xl text-[11px] font-semibold hover:bg-[#1565c0] disabled:opacity-50 disabled:cursor-not-allowed">{loading ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : icon}{completado ? "Habilitado" : titulo}</button></div></div>;
}
