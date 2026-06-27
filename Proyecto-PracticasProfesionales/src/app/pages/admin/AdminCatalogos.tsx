import { useEffect, useState } from "react";
import {
  Upload,
  Database,
  GraduationCap,
  CalendarDays,
  CheckCircle2,
  AlertTriangle,
  FileSpreadsheet,
  Settings,
  Plus,
  Edit2,
  Trash2,
  X,
} from "lucide-react";

import {
  obtenerCarreras,
  obtenerConvocatorias,
  obtenerTiposDocumento,
  validarAlumnosMasivo,
  importarAlumnosMasivo,
  crearCarrera,
  actualizarCarrera,
  eliminarCarrera,
  crearConvocatoria,
  actualizarConvocatoria,
  eliminarConvocatoria,
  crearTipoDocumento,
  actualizarTipoDocumento,
  eliminarTipoDocumento,
} from "../../../infrastructure/catalogos/catalogosApi";

type CatalogoActivo = "carreras" | "convocatorias" | "tipos-documento" | null;

export function AdminCatalogos() {
  const [carreras, setCarreras] = useState<any[]>([]);
  const [convocatorias, setConvocatorias] = useState<any[]>([]);
  const [tiposDocumento, setTiposDocumento] = useState<any[]>([]);

  const [archivo, setArchivo] = useState<File | null>(null);
  const [resultadoValidacion, setResultadoValidacion] = useState<any>(null);
  const [cargando, setCargando] = useState(false);

  const [catalogoActivo, setCatalogoActivo] = useState<CatalogoActivo>(null);
  const [modoEdicion, setModoEdicion] = useState(false);

  const [carreraForm, setCarreraForm] = useState({
    id_carrera: 0,
    clave: "",
    nombre: "",
  });

  const [convocatoriaForm, setConvocatoriaForm] = useState({
    id_convocatoria: 0,
    nombre: "",
    periodo: "",
    fecha_inicio: "",
    fecha_fin: "",
    estado: "Activa",
  });

  const [tipoDocumentoForm, setTipoDocumentoForm] = useState({
    id_tipo_documento: 0,
    nombre_documento: "",
    descripcion: "",
    etapa: "",
    obligatorio: true,
  });

  useEffect(() => {
    cargarCatalogos();
  }, []);

  async function cargarCatalogos() {
    const carrerasData = await obtenerCarreras();
    const convocatoriasData = await obtenerConvocatorias();
    const tiposData = await obtenerTiposDocumento();

    setCarreras(carrerasData);
    setConvocatorias(convocatoriasData);
    setTiposDocumento(tiposData);
  }

  async function handleValidarArchivo() {
    if (!archivo) {
      alert("Selecciona un archivo");
      return;
    }

    try {
      setCargando(true);
      const resultado = await validarAlumnosMasivo(archivo);
      setResultadoValidacion(resultado);
    } catch (error) {
      console.error(error);
      alert("Error al validar archivo");
    } finally {
      setCargando(false);
    }
  }

  async function handleImportarArchivo() {
    if (!archivo) {
      alert("Selecciona un archivo");
      return;
    }

    try {
      setCargando(true);
      const resultado = await importarAlumnosMasivo(archivo);

      alert(`Se importaron ${resultado.importados} alumnos`);

      setResultadoValidacion(null);
      setArchivo(null);
      await cargarCatalogos();
    } catch (error) {
      console.error(error);
      alert("Error al importar archivo");
    } finally {
      setCargando(false);
    }
  }

  function abrirCatalogo(tipo: CatalogoActivo) {
    setCatalogoActivo(tipo);
    setModoEdicion(false);
    limpiarFormularios();
  }

  function cerrarModal() {
    setCatalogoActivo(null);
    setModoEdicion(false);
    limpiarFormularios();
  }

  function limpiarFormularios() {
    setCarreraForm({
      id_carrera: 0,
      clave: "",
      nombre: "",
    });

    setConvocatoriaForm({
      id_convocatoria: 0,
      nombre: "",
      periodo: "",
      fecha_inicio: "",
      fecha_fin: "",
      estado: "Activa",
    });

    setTipoDocumentoForm({
      id_tipo_documento: 0,
      nombre_documento: "",
      descripcion: "",
      etapa: "",
      obligatorio: true,
    });
  }

  async function guardarCarrera() {
    try {
      if (modoEdicion) {
        await actualizarCarrera(carreraForm.id_carrera, {
          clave: carreraForm.clave,
          nombre: carreraForm.nombre,
        });
      } else {
        await crearCarrera({
          clave: carreraForm.clave,
          nombre: carreraForm.nombre,
        });
      }

      limpiarFormularios();
      setModoEdicion(false);
      await cargarCatalogos();
    } catch (error) {
      console.error(error);
      alert("Error al guardar carrera");
    }
  }

  async function guardarConvocatoria() {
    try {
      const data = {
        nombre: convocatoriaForm.nombre,
        periodo: convocatoriaForm.periodo,
        fecha_inicio: convocatoriaForm.fecha_inicio,
        fecha_fin: convocatoriaForm.fecha_fin,
        estado: convocatoriaForm.estado,
      };

      if (modoEdicion) {
        await actualizarConvocatoria(
          convocatoriaForm.id_convocatoria,
          data
        );
      } else {
        await crearConvocatoria(data);
      }

      limpiarFormularios();
      setModoEdicion(false);
      await cargarCatalogos();
    } catch (error) {
      console.error(error);
      alert("Error al guardar convocatoria");
    }
  }

  async function guardarTipoDocumento() {
    try {
      const data = {
        nombre_documento: tipoDocumentoForm.nombre_documento,
        descripcion: tipoDocumentoForm.descripcion,
        etapa: tipoDocumentoForm.etapa,
        obligatorio: tipoDocumentoForm.obligatorio,
      };

      if (modoEdicion) {
        await actualizarTipoDocumento(
          tipoDocumentoForm.id_tipo_documento,
          data
        );
      } else {
        await crearTipoDocumento(data);
      }

      limpiarFormularios();
      setModoEdicion(false);
      await cargarCatalogos();
    } catch (error) {
      console.error(error);
      alert("Error al guardar tipo de documento");
    }
  }

  async function eliminarItem(tipo: CatalogoActivo, id: number) {
    const confirmar = window.confirm("¿Deseas eliminar este registro?");
    if (!confirmar) return;

    try {
      if (tipo === "carreras") {
        await eliminarCarrera(id);
      }

      if (tipo === "convocatorias") {
        await eliminarConvocatoria(id);
      }

      if (tipo === "tipos-documento") {
        await eliminarTipoDocumento(id);
      }

      await cargarCatalogos();
    } catch (error) {
      console.error(error);
      alert("No se pudo eliminar. Puede tener registros relacionados.");
    }
  }

  const catalogos = [
    {
      titulo: "Carreras",
      descripcion: "Catálogo de programas educativos.",
      registros: carreras.length,
      icono: GraduationCap,
      tipo: "carreras" as CatalogoActivo,
    },
    {
      titulo: "Convocatorias",
      descripcion: "Periodos activos e históricos de prácticas profesionales.",
      registros: convocatorias.length,
      icono: CalendarDays,
      tipo: "convocatorias" as CatalogoActivo,
    },
    {
      titulo: "Tipos de Documento",
      descripcion: "Documentación requerida para expedientes.",
      registros: tiposDocumento.length,
      icono: Settings,
      tipo: "tipos-documento" as CatalogoActivo,
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[#0d2b5e]">
          Catálogos
        </h1>
        <p className="text-gray-500 text-sm mt-1">
          Administración de catálogos base y carga masiva de alumnos al sistema.
        </p>
      </div>

      <div className="grid md:grid-cols-3 gap-4">
        {[
          ["Carreras registradas", carreras.length, Database, "bg-blue-600"],
          ["Convocatorias", convocatorias.length, CheckCircle2, "bg-green-600"],
          ["Tipos documento", tiposDocumento.length, AlertTriangle, "bg-orange-500"],
        ].map(([titulo, valor, Icon, color]: any) => (
          <div key={titulo} className={`${color} rounded-2xl p-5 text-white`}>
            <Icon className="w-7 h-7 mb-3 opacity-80" />
            <div className="text-2xl font-bold">{valor}</div>
            <div className="text-white/80 text-sm">{titulo}</div>
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
          <h3 className="font-bold text-[#0d2b5e] mb-2">
            Carga masiva de alumnos
          </h3>

          <p className="text-sm text-gray-500 mb-5">
            Importa alumnos desde un archivo Excel o CSV y valida que coincidan con los campos de la base de datos.
          </p>

          <div className="border-2 border-dashed border-blue-200 rounded-2xl p-8 text-center bg-blue-50/40">
            <FileSpreadsheet className="w-12 h-12 text-[#1565c0] mx-auto mb-3" />

            <h4 className="font-bold text-[#0d2b5e]">
              Seleccionar archivo de alumnos
            </h4>

            <p className="text-sm text-gray-500 mt-1">
              Formatos permitidos: .xlsx, .csv
            </p>

            <div className="mt-5 space-y-3">
              <input
                type="file"
                accept=".xlsx,.csv"
                onChange={(e) => setArchivo(e.target.files?.[0] ?? null)}
                className="block w-full text-sm"
              />

              <button
                onClick={handleValidarArchivo}
                disabled={cargando}
                className="bg-[#1565c0] text-white rounded-xl px-5 py-2 text-sm font-semibold inline-flex items-center gap-2"
              >
                <Upload className="w-4 h-4" />
                {cargando ? "Procesando..." : "Validar Archivo"}
              </button>

              {resultadoValidacion &&
                resultadoValidacion.errores.length === 0 && (
                  <button
                    onClick={handleImportarArchivo}
                    className="ml-3 bg-green-600 text-white rounded-xl px-5 py-2 text-sm font-semibold"
                  >
                    Importar Alumnos
                  </button>
                )}
            </div>

            {resultadoValidacion && (
              <div className="mt-6 border rounded-xl p-4 text-left bg-white">
                <h4 className="font-bold mb-2">
                  Resultado de Validación
                </h4>

                <p>Total: {resultadoValidacion.total}</p>
                <p>Válidos: {resultadoValidacion.validos}</p>
                <p>Errores: {resultadoValidacion.errores.length}</p>

                {resultadoValidacion.errores.length > 0 && (
                  <div className="mt-3 space-y-2">
                    {resultadoValidacion.errores.map(
                      (error: any, index: number) => (
                        <div key={index} className="text-sm text-red-600">
                          Fila {error.fila}: {error.error}
                        </div>
                      )
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
          <h3 className="font-bold text-[#0d2b5e] mb-4">
            Campos requeridos
          </h3>

          <div className="space-y-3">
            {[
              "Matrícula",
              "Nombre completo",
              "Correo institucional",
              "Carrera",
              "Semestre",
              "Grupo",
              "Créditos aprobados",
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
        {catalogos.map((cat) => (
          <div
            key={cat.titulo}
            className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm"
          >
            <cat.icono className="w-9 h-9 text-[#1565c0] mb-4" />

            <h3 className="font-bold text-[#0d2b5e]">
              {cat.titulo}
            </h3>

            <p className="text-sm text-gray-500 mt-2">
              {cat.descripcion}
            </p>

            <div className="mt-4 text-sm font-semibold text-[#1565c0]">
              {cat.registros} registros
            </div>

            <button
              onClick={() => abrirCatalogo(cat.tipo)}
              className="mt-5 w-full border border-blue-200 text-[#1565c0] rounded-xl py-2 text-sm font-semibold"
            >
              Administrar
            </button>
          </div>
        ))}
      </div>

      {catalogoActivo && (
        <div
          className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4"
          onClick={cerrarModal}
        >
          <div
            className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto p-8"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-bold text-xl text-[#0d2b5e]">
                Administrar{" "}
                {catalogoActivo === "carreras" && "Carreras"}
                {catalogoActivo === "convocatorias" && "Convocatorias"}
                {catalogoActivo === "tipos-documento" && "Tipos de Documento"}
              </h3>

              <button
                onClick={cerrarModal}
                className="p-2 text-gray-400 hover:text-red-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {catalogoActivo === "carreras" && (
              <div className="space-y-6">
                <div className="grid md:grid-cols-3 gap-3">
                  <input
                    type="text"
                    placeholder="Clave"
                    value={carreraForm.clave}
                    onChange={(e) =>
                      setCarreraForm({
                        ...carreraForm,
                        clave: e.target.value,
                      })
                    }
                    className="px-4 py-3 border-2 border-gray-200 rounded-xl text-sm"
                  />

                  <input
                    type="text"
                    placeholder="Nombre de la carrera"
                    value={carreraForm.nombre}
                    onChange={(e) =>
                      setCarreraForm({
                        ...carreraForm,
                        nombre: e.target.value,
                      })
                    }
                    className="px-4 py-3 border-2 border-gray-200 rounded-xl text-sm"
                  />

                  <button
                    onClick={guardarCarrera}
                    className="bg-[#0d2b5e] text-white rounded-xl text-sm font-bold"
                  >
                    {modoEdicion ? "Guardar cambios" : "Crear carrera"}
                  </button>
                </div>

                <div className="space-y-3">
                  {carreras.map((carrera) => (
                    <div
                      key={carrera.id_carrera}
                      className="border rounded-xl px-4 py-3 flex items-center justify-between"
                    >
                      <div>
                        <div className="font-semibold text-[#0d2b5e]">
                          {carrera.nombre}
                        </div>
                        <div className="text-xs text-gray-400">
                          Clave: {carrera.clave}
                        </div>
                      </div>

                      <div className="flex gap-2">
                        <button
                          onClick={() => {
                            setModoEdicion(true);
                            setCarreraForm(carrera);
                          }}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>

                        <button
                          onClick={() =>
                            eliminarItem("carreras", carrera.id_carrera)
                          }
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                        >
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
                    onChange={(e) =>
                      setConvocatoriaForm({
                        ...convocatoriaForm,
                        nombre: e.target.value,
                      })
                    }
                    className="px-4 py-3 border-2 border-gray-200 rounded-xl text-sm"
                  />

                  <input
                    type="text"
                    placeholder="Periodo"
                    value={convocatoriaForm.periodo}
                    onChange={(e) =>
                      setConvocatoriaForm({
                        ...convocatoriaForm,
                        periodo: e.target.value,
                      })
                    }
                    className="px-4 py-3 border-2 border-gray-200 rounded-xl text-sm"
                  />

                  <input
                    type="date"
                    value={convocatoriaForm.fecha_inicio}
                    onChange={(e) =>
                      setConvocatoriaForm({
                        ...convocatoriaForm,
                        fecha_inicio: e.target.value,
                      })
                    }
                    className="px-4 py-3 border-2 border-gray-200 rounded-xl text-sm"
                  />

                  <input
                    type="date"
                    value={convocatoriaForm.fecha_fin}
                    onChange={(e) =>
                      setConvocatoriaForm({
                        ...convocatoriaForm,
                        fecha_fin: e.target.value,
                      })
                    }
                    className="px-4 py-3 border-2 border-gray-200 rounded-xl text-sm"
                  />

                  <select
                    value={convocatoriaForm.estado}
                    onChange={(e) =>
                      setConvocatoriaForm({
                        ...convocatoriaForm,
                        estado: e.target.value,
                      })
                    }
                    className="px-4 py-3 border-2 border-gray-200 rounded-xl text-sm bg-white"
                  >
                    <option value="Activa">Activa</option>
                    <option value="Inactiva">Inactiva</option>
                    <option value="Finalizada">Finalizada</option>
                  </select>

                  <button
                    onClick={guardarConvocatoria}
                    className="bg-[#0d2b5e] text-white rounded-xl text-sm font-bold"
                  >
                    {modoEdicion ? "Guardar cambios" : "Crear convocatoria"}
                  </button>
                </div>

                <div className="space-y-3">
                  {convocatorias.map((convocatoria) => (
                    <div
                      key={convocatoria.id_convocatoria}
                      className="border rounded-xl px-4 py-3 flex items-center justify-between"
                    >
                      <div>
                        <div className="font-semibold text-[#0d2b5e]">
                          {convocatoria.nombre}
                        </div>
                        <div className="text-xs text-gray-400">
                          {convocatoria.periodo} | {convocatoria.fecha_inicio} -{" "}
                          {convocatoria.fecha_fin}
                        </div>
                        <div className="text-xs text-green-600 mt-1">
                          {convocatoria.estado}
                        </div>
                      </div>

                      <div className="flex gap-2">
                        <button
                          onClick={() => {
                            setModoEdicion(true);
                            setConvocatoriaForm(convocatoria);
                          }}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>

                        <button
                          onClick={() =>
                            eliminarItem(
                              "convocatorias",
                              convocatoria.id_convocatoria
                            )
                          }
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                        >
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
                    onChange={(e) =>
                      setTipoDocumentoForm({
                        ...tipoDocumentoForm,
                        nombre_documento: e.target.value,
                      })
                    }
                    className="px-4 py-3 border-2 border-gray-200 rounded-xl text-sm"
                  />

                  <input
                    type="text"
                    placeholder="Etapa"
                    value={tipoDocumentoForm.etapa}
                    onChange={(e) =>
                      setTipoDocumentoForm({
                        ...tipoDocumentoForm,
                        etapa: e.target.value,
                      })
                    }
                    className="px-4 py-3 border-2 border-gray-200 rounded-xl text-sm"
                  />

                  <textarea
                    placeholder="Descripción"
                    value={tipoDocumentoForm.descripcion}
                    onChange={(e) =>
                      setTipoDocumentoForm({
                        ...tipoDocumentoForm,
                        descripcion: e.target.value,
                      })
                    }
                    className="md:col-span-2 px-4 py-3 border-2 border-gray-200 rounded-xl text-sm"
                  />

                  <label className="flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={tipoDocumentoForm.obligatorio}
                      onChange={(e) =>
                        setTipoDocumentoForm({
                          ...tipoDocumentoForm,
                          obligatorio: e.target.checked,
                        })
                      }
                    />
                    Obligatorio
                  </label>

                  <button
                    onClick={guardarTipoDocumento}
                    className="bg-[#0d2b5e] text-white rounded-xl text-sm font-bold"
                  >
                    {modoEdicion ? "Guardar cambios" : "Crear tipo"}
                  </button>
                </div>

                <div className="space-y-3">
                  {tiposDocumento.map((tipo) => (
                    <div
                      key={tipo.id_tipo_documento}
                      className="border rounded-xl px-4 py-3 flex items-center justify-between"
                    >
                      <div>
                        <div className="font-semibold text-[#0d2b5e]">
                          {tipo.nombre_documento}
                        </div>
                        <div className="text-xs text-gray-400">
                          {tipo.descripcion}
                        </div>
                        <div className="text-xs text-blue-600 mt-1">
                          {tipo.etapa} |{" "}
                          {tipo.obligatorio ? "Obligatorio" : "Opcional"}
                        </div>
                      </div>

                      <div className="flex gap-2">
                        <button
                          onClick={() => {
                            setModoEdicion(true);
                            setTipoDocumentoForm(tipo);
                          }}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>

                        <button
                          onClick={() =>
                            eliminarItem(
                              "tipos-documento",
                              tipo.id_tipo_documento
                            )
                          }
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                        >
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