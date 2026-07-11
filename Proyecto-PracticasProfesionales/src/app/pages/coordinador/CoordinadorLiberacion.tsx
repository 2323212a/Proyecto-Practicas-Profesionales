import { useEffect, useMemo, useState } from "react";
import { AlertTriangle, CheckCircle, Download, FileText, Search, Upload, XCircle } from "lucide-react";
import { gestionLiberacionUseCase } from "../../dependencies";
import type { AlumnoLiberacion, LiberacionResponse } from "../../../domain/coordinador/Liberacion";

const API_URL = "http://127.0.0.1:8000";

const requisitoLabel: Record<string, string> = {
  expediente_aprobado: "Expediente aprobado",
  horas_completas: "Horas completas",
  reportes_aprobados: "Reportes aprobados",
  evaluacion_docente: "Evaluacion docente",
  evaluacion_empresa: "Evaluacion empresa",
  evaluacion_alumno_empresa: "Evaluacion alumno a empresa",
  incidencias_cerradas: "Incidencias cerradas",
};

function archivoABase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export function CoordinadorLiberacion() {
  const [datos, setDatos] = useState<LiberacionResponse | null>(null);
  const [busqueda, setBusqueda] = useState("");
  const [estado, setEstado] = useState("Todos");
  const [error, setError] = useState("");
  const [cargando, setCargando] = useState(true);
  const [anexando, setAnexando] = useState<number | null>(null);
  const [archivos, setArchivos] = useState<Record<number, File | null>>({});

  async function cargar() {
    try {
      setCargando(true);
      setError("");
      setDatos(await gestionLiberacionUseCase.listar());
    } catch (err) {
      console.error(err);
      setError("No se pudieron cargar los candidatos a liberacion.");
    } finally {
      setCargando(false);
    }
  }

  useEffect(() => {
    void cargar();
  }, []);

  const alumnos = useMemo(() => {
    const q = busqueda.toLowerCase();
    return (datos?.alumnos ?? []).filter((alumno) => {
      const texto = [alumno.alumno, alumno.matricula ?? "", alumno.carrera, alumno.empresa, alumno.vacante].join(" ").toLowerCase();
      const estadoAlumno = alumno.liberacion ? "Liberado" : alumno.listo_liberacion ? "Listo" : "Bloqueado";
      return texto.includes(q) && (estado === "Todos" || estado === estadoAlumno);
    });
  }, [busqueda, datos, estado]);

  async function anexarDocumento(alumno: AlumnoLiberacion) {
    const archivo = archivos[alumno.id_asignacion];
    if (!archivo) {
      setError("Selecciona el documento de liberacion antes de continuar.");
      return;
    }

    const permitidos = [
      "application/pdf",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ];
    if (!permitidos.includes(archivo.type)) {
      setError("Solo se permiten archivos PDF, DOC o DOCX.");
      return;
    }

    try {
      setAnexando(alumno.id_asignacion);
      setError("");
      const contenido = await archivoABase64(archivo);
      await gestionLiberacionUseCase.anexarDocumento(alumno.id_asignacion, {
        nombre_archivo: archivo.name,
        contenido_base64: contenido,
        mime_type: archivo.type,
      });
      setArchivos((actuales) => ({ ...actuales, [alumno.id_asignacion]: null }));
      await cargar();
    } catch (err) {
      console.error(err);
      setError("No se pudo anexar el documento de liberacion. Revisa los requisitos faltantes.");
    } finally {
      setAnexando(null);
    }
  }

  const resumen = datos?.resumen ?? { total: 0, listos: 0, bloqueados: 0, liberados: 0 };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-[#0d2b5e]">Liberacion de Practicas</h1>
        <p className="text-gray-500 mt-1">Validacion final y anexo de constancia institucional.</p>
      </div>

      {error && <div className="bg-orange-50 border border-orange-200 rounded-xl px-4 py-3 text-sm text-orange-700">{error}</div>}

      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5">
        <div className="grid md:grid-cols-2 gap-4">
          <select value={estado} onChange={(e) => setEstado(e.target.value)} className="border rounded-xl px-4 py-3">
            <option>Todos</option>
            <option>Listo</option>
            <option>Bloqueado</option>
            <option>Liberado</option>
          </select>
          <div className="relative">
            <Search className="absolute left-3 top-3.5 w-4 h-4 text-gray-400" />
            <input value={busqueda} onChange={(e) => setBusqueda(e.target.value)} placeholder="Buscar alumno..." className="w-full border rounded-xl pl-10 pr-4 py-3" />
          </div>
        </div>
      </div>

      <div className="grid md:grid-cols-4 gap-4">
        {[
          ["Total", resumen.total, "bg-blue-50 border-blue-200 text-blue-700"],
          ["Listos", resumen.listos, "bg-green-50 border-green-200 text-green-700"],
          ["Bloqueados", resumen.bloqueados, "bg-orange-50 border-orange-200 text-orange-700"],
          ["Liberados", resumen.liberados, "bg-purple-50 border-purple-200 text-purple-700"],
        ].map(([label, value, color]) => (
          <div key={label} className={`${color} border rounded-2xl p-5`}>
            <p className="text-sm text-gray-600">{label}</p>
            <p className="text-3xl font-bold mt-2">{value}</p>
          </div>
        ))}
      </div>

      <div className="space-y-4">
        {cargando && <div className="bg-white rounded-2xl border p-10 text-center text-gray-400">Cargando liberaciones...</div>}
        {!cargando && alumnos.map((alumno) => {
          const estadoTexto = alumno.liberacion ? "Liberado" : alumno.listo_liberacion ? "Listo para liberar" : "Bloqueado";
          return (
            <div key={alumno.id_asignacion} className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
              <div className="flex flex-col xl:flex-row xl:items-start xl:justify-between gap-4">
                <div>
                  <h3 className="font-bold text-lg text-[#0d2b5e]">{alumno.alumno}</h3>
                  <p className="text-sm text-gray-500">{alumno.matricula ?? "Sin matricula"} - {alumno.carrera}</p>
                  <p className="text-sm text-gray-400">{alumno.empresa} - {alumno.vacante}</p>
                </div>
                <span className={`px-3 py-1 rounded-full text-xs font-semibold w-fit ${alumno.liberacion ? "bg-purple-100 text-purple-700" : alumno.listo_liberacion ? "bg-green-100 text-green-700" : "bg-orange-100 text-orange-700"}`}>{estadoTexto}</span>
              </div>

              <div className="grid md:grid-cols-4 gap-4 mt-5">
                <div className="border rounded-xl p-4"><p className="text-xs text-gray-500">Horas</p><p className="text-2xl font-bold text-[#0d2b5e] mt-1">{alumno.horas_aprobadas}/{alumno.horas_meta}</p></div>
                <div className="border rounded-xl p-4"><p className="text-xs text-gray-500">Reportes pendientes</p><p className="text-2xl font-bold text-[#0d2b5e] mt-1">{alumno.reportes_pendientes}</p></div>
                <div className="border rounded-xl p-4"><p className="text-xs text-gray-500">Reportes rechazados</p><p className="text-2xl font-bold text-[#0d2b5e] mt-1">{alumno.reportes_rechazados}</p></div>
                <div className="border rounded-xl p-4"><p className="text-xs text-gray-500">Incidencias abiertas</p><p className="text-2xl font-bold text-[#0d2b5e] mt-1">{alumno.incidencias_abiertas}</p></div>
              </div>

              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-3 mt-5">
                {Object.entries(alumno.requisitos).map(([clave, ok]) => (
                  <div key={clave} className={`border rounded-xl px-3 py-2 flex items-center gap-2 ${ok ? "bg-green-50 border-green-100" : "bg-orange-50 border-orange-100"}`}>
                    {ok ? <CheckCircle className="w-4 h-4 text-green-600" /> : <XCircle className="w-4 h-4 text-orange-600" />}
                    <span className={`text-sm ${ok ? "text-green-700" : "text-orange-700"}`}>{requisitoLabel[clave] ?? clave}</span>
                  </div>
                ))}
              </div>

              {alumno.liberacion && (
                <div className="mt-5 bg-purple-50 border border-purple-100 rounded-xl p-4 text-sm text-purple-700 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                  <span>Liberacion emitida el {alumno.liberacion.fecha_liberacion ?? "sin fecha"} - Documento: {alumno.liberacion.documento_nombre ?? "Sin archivo"}</span>
                  {alumno.liberacion.documento_url && (
                    <a href={`${API_URL}${alumno.liberacion.documento_url}`} target="_blank" rel="noreferrer" className="bg-purple-600 text-white rounded-xl px-3 py-2 text-xs font-semibold flex items-center gap-2 w-fit">
                      <Download className="w-4 h-4" />
                      Descargar
                    </a>
                  )}
                </div>
              )}

              <div className="flex flex-wrap gap-3 mt-5">
                <button className="border border-blue-200 text-[#1565c0] rounded-xl px-4 py-2 text-sm font-semibold flex items-center gap-2">
                  <FileText className="w-4 h-4" />
                  Ver requisitos
                </button>
                {!alumno.liberacion && alumno.listo_liberacion && (
                  <div className="flex flex-col sm:flex-row gap-2">
                    <label className="border border-gray-200 rounded-xl px-4 py-2 text-sm text-gray-600 flex items-center gap-2 cursor-pointer">
                      <Upload className="w-4 h-4 text-[#1565c0]" />
                      <span>{archivos[alumno.id_asignacion]?.name ?? "Seleccionar constancia"}</span>
                      <input
                        type="file"
                        accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                        className="hidden"
                        onChange={(event) => setArchivos((actuales) => ({ ...actuales, [alumno.id_asignacion]: event.target.files?.[0] ?? null }))}
                      />
                    </label>
                    <button onClick={() => anexarDocumento(alumno)} disabled={anexando === alumno.id_asignacion || !archivos[alumno.id_asignacion]} className="bg-green-600 text-white rounded-xl px-4 py-2 text-sm font-semibold flex items-center gap-2 disabled:opacity-50">
                      <CheckCircle className="w-4 h-4" />
                      {anexando === alumno.id_asignacion ? "Anexando..." : "Anexar y liberar"}
                    </button>
                  </div>
                )}
                {!alumno.listo_liberacion && (
                  <div className="border border-orange-200 text-orange-600 rounded-xl px-4 py-2 text-sm font-semibold flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4" />
                    {alumno.faltantes.length} requisito(s) faltante(s)
                  </div>
                )}
              </div>
            </div>
          );
        })}
        {!cargando && alumnos.length === 0 && <div className="bg-white rounded-2xl border p-10 text-center text-gray-400">No hay alumnos con los filtros seleccionados.</div>}
      </div>
    </div>
  );
}
