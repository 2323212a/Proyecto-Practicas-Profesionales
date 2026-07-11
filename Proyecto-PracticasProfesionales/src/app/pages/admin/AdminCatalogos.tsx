import { useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  CalendarDays,
  CheckCircle2,
  Database,
  Edit2,
  FileSpreadsheet,
  GraduationCap,
  Plus,
  RefreshCw,
  Settings,
  Trash2,
  Upload,
  X,
} from "lucide-react";

import {
  actualizarCarrera,
  actualizarConvocatoria,
  actualizarTipoDocumento,
  crearCarrera,
  crearConvocatoria,
  crearTipoDocumento,
  eliminarCarrera,
  eliminarConvocatoria,
  eliminarTipoDocumento,
  importarAlumnosMasivo,
  obtenerCarreras,
  obtenerConvocatorias,
  obtenerTiposDocumento,
  validarAlumnosMasivo,
} from "../../../infrastructure/catalogos/catalogosApi";

type CatalogoActivo = "carreras" | "convocatorias" | "tipos-documento" | null;

type Carrera = {
  id_carrera: number;
  clave: string;
  nombre: string;
};

type Convocatoria = {
  id_convocatoria: number;
  nombre: string;
  periodo: string;
  fecha_inicio: string;
  fecha_fin: string;
  estado: string;
};

type TipoDocumento = {
  id_tipo_documento: number;
  nombre_documento: string;
  descripcion: string | null;
  etapa: string;
  obligatorio: boolean;
  requiere_formato: boolean;
};

type ResultadoValidacion = {
  total: number;
  validos: number;
  errores: Array<{ fila: number; error: string }>;
};

const carreraInicial: Carrera = {
  id_carrera: 0,
  clave: "",
  nombre: "",
};

const convocatoriaInicial: Convocatoria = {
  id_convocatoria: 0,
  nombre: "",
  periodo: "",
  fecha_inicio: "",
  fecha_fin: "",
  estado: "Activa",
};

const tipoDocumentoInicial: TipoDocumento = {
  id_tipo_documento: 0,
  nombre_documento: "",
  descripcion: "",
  etapa: "",
  obligatorio: true,
  requiere_formato: false,
};

function fechaTexto(fecha: string) {
  if (!fecha) return "Sin fecha";
  const date = new Date(`${fecha}T00:00:00`);
  if (Number.isNaN(date.getTime())) return fecha;
  return new Intl.DateTimeFormat("es-MX", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
}

export function AdminCatalogos() {
  const [carreras, setCarreras] = useState<Carrera[]>([]);
  const [convocatorias, setConvocatorias] = useState<Convocatoria[]>([]);
  const [tiposDocumento, setTiposDocumento] = useState<TipoDocumento[]>([]);
  const [archivo, setArchivo] = useState<File | null>(null);
  const [resultadoValidacion, setResultadoValidacion] = useState<ResultadoValidacion | null>(null);
  const [cargando, setCargando] = useState(false);
  const [mensaje, setMensaje] = useState("");
  const [error, setError] = useState("");
  const [catalogoActivo, setCatalogoActivo] = useState<CatalogoActivo>(null);
  const [modoEdicion, setModoEdicion] = useState(false);
  const [carreraForm, setCarreraForm] = useState<Carrera>(carreraInicial);
  const [convocatoriaForm, setConvocatoriaForm] = useState<Convocatoria>(convocatoriaInicial);
  const [tipoDocumentoForm, setTipoDocumentoForm] = useState<TipoDocumento>(tipoDocumentoInicial);

  useEffect(() => {
    void cargarCatalogos();
  }, []);

  async function cargarCatalogos() {
    try {
      setCargando(true);
      setError("");
      const [carrerasData, convocatoriasData, tiposData] = await Promise.all([
        obtenerCarreras(),
        obtenerConvocatorias(),
        obtenerTiposDocumento(),
      ]);
      setCarreras(carrerasData);
      setConvocatorias(convocatoriasData);
      setTiposDocumento(tiposData);
    } catch (err) {
      console.error(err);
      setError("No se pudieron cargar los catalogos.");
    } finally {
      setCargando(false);
    }
  }

  function limpiarFormularios() {
    setCarreraForm(carreraInicial);
    setConvocatoriaForm(convocatoriaInicial);
    setTipoDocumentoForm(tipoDocumentoInicial);
  }

  function abrirCatalogo(tipo: CatalogoActivo) {
    setCatalogoActivo(tipo);
    setModoEdicion(false);
    limpiarFormularios();
    setMensaje("");
    setError("");
  }

  function cerrarModal() {
    setCatalogoActivo(null);
    setModoEdicion(false);
    limpiarFormularios();
  }

  function iniciarNuevoRegistro() {
    setModoEdicion(false);
    limpiarFormularios();
  }

  async function handleValidarArchivo() {
    if (!archivo) {
      setError("Selecciona un archivo antes de validar.");
      return;
    }

    try {
      setCargando(true);
      setError("");
      setMensaje("");
      const resultado = await validarAlumnosMasivo(archivo);
      setResultadoValidacion(resultado);
      setMensaje("Archivo validado. Revisa el resultado antes de importar.");
    } catch (err) {
      console.error(err);
      setError("No se pudo validar el archivo.");
    } finally {
      setCargando(false);
    }
  }

  async function handleImportarArchivo() {
    if (!archivo) {
      setError("Selecciona un archivo antes de importar.");
      return;
    }

    if (resultadoValidacion?.errores.length) {
      setError("Corrige los errores antes de importar.");
      return;
    }

    try {
      setCargando(true);
      setError("");
      const resultado = await importarAlumnosMasivo(archivo);
      setMensaje(`Se importaron ${resultado.importados ?? 0} alumnos correctamente.`);
      setResultadoValidacion(null);
      setArchivo(null);
      await cargarCatalogos();
    } catch (err) {
      console.error(err);
      setError("No se pudo importar el archivo.");
    } finally {
      setCargando(false);
    }
  }

  async function guardarCarrera() {
    if (!carreraForm.clave.trim() || !carreraForm.nombre.trim()) {
      setError("La clave y el nombre de carrera son obligatorios.");
      return;
    }

    try {
      setCargando(true);
      setError("");
      if (modoEdicion) {
        await actualizarCarrera(carreraForm.id_carrera, {
          clave: carreraForm.clave.trim(),
          nombre: carreraForm.nombre.trim(),
        });
        setMensaje("Carrera actualizada.");
      } else {
        await crearCarrera({
          clave: carreraForm.clave.trim(),
          nombre: carreraForm.nombre.trim(),
        });
        setMensaje("Carrera creada.");
      }
      limpiarFormularios();
      setModoEdicion(false);
      await cargarCatalogos();
    } catch (err) {
      console.error(err);
      setError("No se pudo guardar la carrera.");
    } finally {
      setCargando(false);
    }
  }

  async function guardarConvocatoria() {
    if (
      !convocatoriaForm.nombre.trim() ||
      !convocatoriaForm.periodo.trim() ||
      !convocatoriaForm.fecha_inicio ||
      !convocatoriaForm.fecha_fin
    ) {
      setError("Nombre, periodo, inicio y cierre son obligatorios.");
      return;
    }

    if (convocatoriaForm.fecha_fin < convocatoriaForm.fecha_inicio) {
      setError("La fecha de cierre no puede ser anterior al inicio.");
      return;
    }

    const data = {
      nombre: convocatoriaForm.nombre.trim(),
      periodo: convocatoriaForm.periodo.trim(),
      fecha_inicio: convocatoriaForm.fecha_inicio,
      fecha_fin: convocatoriaForm.fecha_fin,
      estado: convocatoriaForm.estado,
    };

    try {
      setCargando(true);
      setError("");
      if (modoEdicion) {
        await actualizarConvocatoria(convocatoriaForm.id_convocatoria, data);
        setMensaje("Convocatoria actualizada.");
      } else {
        await crearConvocatoria(data);
        setMensaje("Convocatoria creada.");
      }
      limpiarFormularios();
      setModoEdicion(false);
      await cargarCatalogos();
    } catch (err) {
      console.error(err);
      setError("No se pudo guardar la convocatoria.");
    } finally {
      setCargando(false);
    }
  }

  async function guardarTipoDocumento() {
    if (!tipoDocumentoForm.nombre_documento.trim() || !tipoDocumentoForm.etapa.trim()) {
      setError("Nombre y etapa del documento son obligatorios.");
      return;
    }

    const data = {
      nombre_documento: tipoDocumentoForm.nombre_documento.trim(),
      descripcion: tipoDocumentoForm.descripcion?.trim() || undefined,
      etapa: tipoDocumentoForm.etapa.trim(),
      obligatorio: tipoDocumentoForm.obligatorio,
      requiere_formato: tipoDocumentoForm.requiere_formato,
    };

    try {
      setCargando(true);
      setError("");
      if (modoEdicion) {
        await actualizarTipoDocumento(tipoDocumentoForm.id_tipo_documento, data);
        setMensaje("Tipo de documento actualizado.");
      } else {
        await crearTipoDocumento(data);
        setMensaje("Tipo de documento creado.");
      }
      limpiarFormularios();
      setModoEdicion(false);
      await cargarCatalogos();
    } catch (err) {
      console.error(err);
      setError("No se pudo guardar el tipo de documento.");
    } finally {
      setCargando(false);
    }
  }

  async function eliminarItem(tipo: CatalogoActivo, id: number) {
    const confirmar = window.confirm("Deseas eliminar este registro?");
    if (!confirmar) return;

    try {
      setCargando(true);
      setError("");
      if (tipo === "carreras") await eliminarCarrera(id);
      if (tipo === "convocatorias") await eliminarConvocatoria(id);
      if (tipo === "tipos-documento") await eliminarTipoDocumento(id);
      setMensaje("Registro eliminado.");
      await cargarCatalogos();
    } catch (err) {
      console.error(err);
      setError("No se pudo eliminar. Puede tener registros relacionados.");
    } finally {
      setCargando(false);
    }
  }

  const catalogos = useMemo(
    () => [
      {
        titulo: "Carreras",
        descripcion: "Programas educativos registrados en la base de datos.",
        registros: carreras.length,
        icono: GraduationCap,
        tipo: "carreras" as CatalogoActivo,
      },
      {
        titulo: "Convocatorias",
        descripcion: "Periodos activos e historicos de practicas profesionales.",
        registros: convocatorias.length,
        icono: CalendarDays,
        tipo: "convocatorias" as CatalogoActivo,
      },
      {
        titulo: "Tipos de Documento",
        descripcion: "Documentacion requerida para expedientes de alumnos.",
        registros: tiposDocumento.length,
        icono: Settings,
        tipo: "tipos-documento" as CatalogoActivo,
      },
    ],
    [carreras.length, convocatorias.length, tiposDocumento.length],
  );

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#0d2b5e]">Catalogos</h1>
          <p className="text-gray-500 text-sm mt-1">
            Administracion de catalogos base y carga masiva de alumnos al sistema.
          </p>
        </div>
        <button
          onClick={cargarCatalogos}
          disabled={cargando}
          className="border border-blue-200 text-[#1565c0] rounded-xl px-4 py-2 text-sm font-semibold flex items-center gap-2 disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${cargando ? "animate-spin" : ""}`} />
          Actualizar
        </button>
      </div>

      {mensaje && (
        <div className="bg-blue-50 border border-blue-200 rounded-xl px-4 py-3 text-sm text-[#0d2b5e]">
          {mensaje}
        </div>
      )}

      {error && (
        <div className="bg-orange-50 border border-orange-200 rounded-xl px-4 py-3 text-sm text-orange-700">
          {error}
        </div>
      )}

      <div className="grid md:grid-cols-3 gap-4">
        {[
          ["Carreras registradas", carreras.length, Database, "bg-blue-600"],
          ["Convocatorias", convocatorias.length, CheckCircle2, "bg-green-600"],
          ["Tipos documento", tiposDocumento.length, AlertTriangle, "bg-orange-500"],
        ].map(([titulo, valor, Icon, color]: any) => (
          <div key={titulo} className={`${color} rounded-2xl p-5 text-white`}>
            <Icon className="w-7 h-7 mb-3 opacity-80" />
            <div className="text-2xl font-bold">{cargando ? "..." : valor}</div>
            <div className="text-white/80 text-sm">{titulo}</div>
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
          <h3 className="font-bold text-[#0d2b5e] mb-2">Carga masiva de alumnos</h3>
          <p className="text-sm text-gray-500 mb-5">
            Importa alumnos desde Excel o CSV. Primero valida el archivo y despues importa registros validos.
          </p>

          <div className="border-2 border-dashed border-blue-200 rounded-2xl p-8 text-center bg-blue-50/40">
            <FileSpreadsheet className="w-12 h-12 text-[#1565c0] mx-auto mb-3" />
            <h4 className="font-bold text-[#0d2b5e]">Seleccionar archivo de alumnos</h4>
            <p className="text-sm text-gray-500 mt-1">Formatos permitidos: .xlsx, .csv</p>

            <div className="mt-5 flex flex-col md:flex-row items-center justify-center gap-3">
              <input
                type="file"
                accept=".xlsx,.csv"
                onChange={(event) => {
                  setArchivo(event.target.files?.[0] ?? null);
                  setResultadoValidacion(null);
                }}
                className="block w-full md:w-auto text-sm"
              />

              <button
                onClick={handleValidarArchivo}
                disabled={cargando || !archivo}
                className="bg-[#1565c0] text-white rounded-xl px-5 py-2 text-sm font-semibold inline-flex items-center gap-2 disabled:opacity-50"
              >
                <Upload className="w-4 h-4" />
                Validar archivo
              </button>

              {resultadoValidacion && resultadoValidacion.errores.length === 0 && (
                <button
                  onClick={handleImportarArchivo}
                  disabled={cargando}
                  className="bg-green-600 text-white rounded-xl px-5 py-2 text-sm font-semibold disabled:opacity-50"
                >
                  Importar alumnos
                </button>
              )}
            </div>

            {resultadoValidacion && (
              <div className="mt-6 border rounded-xl p-4 text-left bg-white">
                <h4 className="font-bold mb-2 text-[#0d2b5e]">Resultado de validacion</h4>
                <div className="grid md:grid-cols-3 gap-3 text-sm">
                  <div>Total: {resultadoValidacion.total}</div>
                  <div>Validos: {resultadoValidacion.validos}</div>
                  <div>Errores: {resultadoValidacion.errores.length}</div>
                </div>

                {resultadoValidacion.errores.length > 0 && (
                  <div className="mt-3 space-y-2 max-h-52 overflow-y-auto">
                    {resultadoValidacion.errores.map((item) => (
                      <div key={`${item.fila}-${item.error}`} className="text-sm text-red-600">
                        Fila {item.fila}: {item.error}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
          <h3 className="font-bold text-[#0d2b5e] mb-4">Campos requeridos</h3>
          <div className="space-y-3">
            {[
              "Matricula",
              "Nombre completo",
              "Correo institucional",
              "Carrera",
              "Semestre",
              "Grupo",
              "Creditos aprobados",
            ].map((campo) => (
              <div key={campo} className="flex items-center gap-2 text-sm">
                <CheckCircle2 className="w-4 h-4 text-green-600" />
                <span className="text-gray-700">{campo}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-5">
        {catalogos.map((catalogo) => (
          <div key={catalogo.titulo} className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
            <catalogo.icono className="w-9 h-9 text-[#1565c0] mb-4" />
            <h3 className="font-bold text-[#0d2b5e]">{catalogo.titulo}</h3>
            <p className="text-sm text-gray-500 mt-2">{catalogo.descripcion}</p>
            <div className="mt-4 text-sm font-semibold text-[#1565c0]">
              {catalogo.registros} registros
            </div>
            <button
              onClick={() => abrirCatalogo(catalogo.tipo)}
              className="mt-5 w-full border border-blue-200 text-[#1565c0] rounded-xl py-2 text-sm font-semibold hover:bg-blue-50"
            >
              Administrar
            </button>
          </div>
        ))}
      </div>

      {catalogoActivo && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4" onClick={cerrarModal}>
          <div
            className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto p-8"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="font-bold text-xl text-[#0d2b5e]">
                  {catalogoActivo === "carreras" && "Administrar carreras"}
                  {catalogoActivo === "convocatorias" && "Administrar convocatorias"}
                  {catalogoActivo === "tipos-documento" && "Administrar tipos de documento"}
                </h3>
                <p className="text-xs text-gray-500 mt-1">
                  Los cambios se guardan directamente en la base de datos.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={iniciarNuevoRegistro}
                  className="border border-blue-200 text-[#1565c0] rounded-lg px-3 py-2 text-xs font-semibold flex items-center gap-1"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Nuevo
                </button>
                <button onClick={cerrarModal} className="p-2 text-gray-400 hover:text-red-600">
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {catalogoActivo === "carreras" && (
              <div className="space-y-6">
                <div className="grid md:grid-cols-[1fr_2fr_auto] gap-3">
                  <input
                    type="text"
                    placeholder="Clave"
                    value={carreraForm.clave}
                    onChange={(event) => setCarreraForm({ ...carreraForm, clave: event.target.value })}
                    className="px-4 py-3 border-2 border-gray-200 rounded-xl text-sm"
                  />
                  <input
                    type="text"
                    placeholder="Nombre de la carrera"
                    value={carreraForm.nombre}
                    onChange={(event) => setCarreraForm({ ...carreraForm, nombre: event.target.value })}
                    className="px-4 py-3 border-2 border-gray-200 rounded-xl text-sm"
                  />
                  <button onClick={guardarCarrera} disabled={cargando} className="bg-[#0d2b5e] text-white rounded-xl px-5 text-sm font-bold disabled:opacity-50">
                    {modoEdicion ? "Guardar cambios" : "Crear carrera"}
                  </button>
                </div>

                <div className="space-y-3">
                  {carreras.map((carrera) => (
                    <div key={carrera.id_carrera} className="border rounded-xl px-4 py-3 flex items-center justify-between gap-4">
                      <div>
                        <div className="font-semibold text-[#0d2b5e]">{carrera.nombre}</div>
                        <div className="text-xs text-gray-400">Clave: {carrera.clave}</div>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => {
                            setModoEdicion(true);
                            setCarreraForm(carrera);
                          }}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"
                          title="Editar"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button onClick={() => eliminarItem("carreras", carrera.id_carrera)} className="p-2 text-red-600 hover:bg-red-50 rounded-lg" title="Eliminar">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {catalogoActivo === "convocatorias" && (
              <div className="space-y-6">
                <div className="grid md:grid-cols-2 gap-3">
                  <input
                    type="text"
                    placeholder="Nombre"
                    value={convocatoriaForm.nombre}
                    onChange={(event) => setConvocatoriaForm({ ...convocatoriaForm, nombre: event.target.value })}
                    className="px-4 py-3 border-2 border-gray-200 rounded-xl text-sm"
                  />
                  <input
                    type="text"
                    placeholder="Periodo"
                    value={convocatoriaForm.periodo}
                    onChange={(event) => setConvocatoriaForm({ ...convocatoriaForm, periodo: event.target.value })}
                    className="px-4 py-3 border-2 border-gray-200 rounded-xl text-sm"
                  />
                  <input
                    type="date"
                    value={convocatoriaForm.fecha_inicio}
                    onChange={(event) => setConvocatoriaForm({ ...convocatoriaForm, fecha_inicio: event.target.value })}
                    className="px-4 py-3 border-2 border-gray-200 rounded-xl text-sm"
                  />
                  <input
                    type="date"
                    value={convocatoriaForm.fecha_fin}
                    onChange={(event) => setConvocatoriaForm({ ...convocatoriaForm, fecha_fin: event.target.value })}
                    className="px-4 py-3 border-2 border-gray-200 rounded-xl text-sm"
                  />
                  <select
                    value={convocatoriaForm.estado}
                    onChange={(event) => setConvocatoriaForm({ ...convocatoriaForm, estado: event.target.value })}
                    className="px-4 py-3 border-2 border-gray-200 rounded-xl text-sm bg-white"
                  >
                    <option value="Activa">Activa</option>
                    <option value="Inactiva">Inactiva</option>
                    <option value="Finalizada">Finalizada</option>
                  </select>
                  <button onClick={guardarConvocatoria} disabled={cargando} className="bg-[#0d2b5e] text-white rounded-xl text-sm font-bold disabled:opacity-50">
                    {modoEdicion ? "Guardar cambios" : "Crear convocatoria"}
                  </button>
                </div>

                <div className="space-y-3">
                  {convocatorias.map((convocatoria) => (
                    <div key={convocatoria.id_convocatoria} className="border rounded-xl px-4 py-3 flex items-center justify-between gap-4">
                      <div>
                        <div className="font-semibold text-[#0d2b5e]">{convocatoria.nombre}</div>
                        <div className="text-xs text-gray-400">
                          {convocatoria.periodo} | {fechaTexto(convocatoria.fecha_inicio)} - {fechaTexto(convocatoria.fecha_fin)}
                        </div>
                        <div className="text-xs text-green-600 mt-1">{convocatoria.estado}</div>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => {
                            setModoEdicion(true);
                            setConvocatoriaForm(convocatoria);
                          }}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"
                          title="Editar"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button onClick={() => eliminarItem("convocatorias", convocatoria.id_convocatoria)} className="p-2 text-red-600 hover:bg-red-50 rounded-lg" title="Eliminar">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {catalogoActivo === "tipos-documento" && (
              <div className="space-y-6">
                <div className="grid md:grid-cols-2 gap-3">
                  <input
                    type="text"
                    placeholder="Nombre documento"
                    value={tipoDocumentoForm.nombre_documento}
                    onChange={(event) => setTipoDocumentoForm({ ...tipoDocumentoForm, nombre_documento: event.target.value })}
                    className="px-4 py-3 border-2 border-gray-200 rounded-xl text-sm"
                  />
                  <input
                    type="text"
                    placeholder="Etapa"
                    value={tipoDocumentoForm.etapa}
                    onChange={(event) => setTipoDocumentoForm({ ...tipoDocumentoForm, etapa: event.target.value })}
                    className="px-4 py-3 border-2 border-gray-200 rounded-xl text-sm"
                  />
                  <textarea
                    placeholder="Descripcion"
                    value={tipoDocumentoForm.descripcion ?? ""}
                    onChange={(event) => setTipoDocumentoForm({ ...tipoDocumentoForm, descripcion: event.target.value })}
                    className="md:col-span-2 px-4 py-3 border-2 border-gray-200 rounded-xl text-sm"
                  />
                  <label className="flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={tipoDocumentoForm.obligatorio}
                      onChange={(event) => setTipoDocumentoForm({ ...tipoDocumentoForm, obligatorio: event.target.checked })}
                    />
                    Obligatorio
                  </label>
                  <label className="flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={tipoDocumentoForm.requiere_formato}
                      onChange={(event) => setTipoDocumentoForm({ ...tipoDocumentoForm, requiere_formato: event.target.checked })}
                    />
                    Tiene formato descargable
                  </label>
                  <button onClick={guardarTipoDocumento} disabled={cargando} className="bg-[#0d2b5e] text-white rounded-xl text-sm font-bold disabled:opacity-50">
                    {modoEdicion ? "Guardar cambios" : "Crear tipo"}
                  </button>
                </div>

                <div className="space-y-3">
                  {tiposDocumento.map((tipo) => (
                    <div key={tipo.id_tipo_documento} className="border rounded-xl px-4 py-3 flex items-center justify-between gap-4">
                      <div>
                        <div className="font-semibold text-[#0d2b5e]">{tipo.nombre_documento}</div>
                        <div className="text-xs text-gray-400">{tipo.descripcion ?? "Sin descripcion"}</div>
                        <div className="text-xs text-blue-600 mt-1">
                          {tipo.etapa} | {tipo.obligatorio ? "Obligatorio" : "Opcional"} | {tipo.requiere_formato ? "Con formato" : "Sin formato"}
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => {
                            setModoEdicion(true);
                            setTipoDocumentoForm({ ...tipo, descripcion: tipo.descripcion ?? "" });
                          }}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"
                          title="Editar"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button onClick={() => eliminarItem("tipos-documento", tipo.id_tipo_documento)} className="p-2 text-red-600 hover:bg-red-50 rounded-lg" title="Eliminar">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
