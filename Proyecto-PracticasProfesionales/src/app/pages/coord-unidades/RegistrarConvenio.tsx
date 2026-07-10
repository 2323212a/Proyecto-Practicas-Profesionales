import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { useNavigate } from "react-router";
import {
  ArrowLeft,
  Building2,
  CalendarDays,
  FileText,
  Save,
  Upload,
} from "lucide-react";
import {
  crearConvenio,
  listarEmpresas,
  type EmpresaApi,
} from "../../../infrastructure/coord-unidades/coordUnidadesApi";

const tiposConvenio = [
  "Nuevo convenio",
  "Renovacion",
  "Convenio vigente",
  "Convenio vencido",
];

export function RegistrarConvenio() {
  const navigate = useNavigate();
  const [empresas, setEmpresas] = useState<EmpresaApi[]>([]);
  const [cargandoEmpresas, setCargandoEmpresas] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({
    id_empresa: "",
    fecha_inicio: "",
    fecha_fin: "",
    documento_convenio: "",
    tipo_convenio: "Nuevo convenio",
    observaciones: "",
  });

  useEffect(() => {
    async function cargarEmpresas() {
      try {
        const data = await listarEmpresas();
        setEmpresas(data || []);
      } catch {
        setError("No se pudieron cargar las empresas.");
      } finally {
        setCargandoEmpresas(false);
      }
    }

    cargarEmpresas();
  }, []);

  const actualizarCampo = (
    campo: keyof typeof form,
    valor: string,
  ) => {
    setForm((actual) => ({
      ...actual,
      [campo]: valor,
    }));
  };

  const enviar = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);

    if (!form.id_empresa) {
      setError("Selecciona una empresa.");
      return;
    }

    if (!form.fecha_inicio || !form.fecha_fin) {
      setError("Captura la fecha de inicio y la fecha de fin.");
      return;
    }

    if (form.fecha_fin < form.fecha_inicio) {
      setError("La fecha de fin no puede ser anterior a la fecha de inicio.");
      return;
    }

    if (!form.documento_convenio.trim()) {
      setError("Captura el nombre o ruta del documento del convenio.");
      return;
    }

    try {
      setGuardando(true);
      await crearConvenio({
        id_empresa: Number(form.id_empresa),
        fecha_inicio: form.fecha_inicio,
        fecha_fin: form.fecha_fin,
        documento_convenio: form.documento_convenio.trim(),
        tipo_convenio: form.tipo_convenio,
        observaciones: form.observaciones.trim(),
      });
      navigate("/coord-unidades/convenios");
    } catch {
      setError("No se pudo registrar el convenio.");
    } finally {
      setGuardando(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#0d2b5e]">
            Registrar convenio
          </h1>
          <p className="text-gray-500 text-sm mt-1">
            Captura los datos requeridos para crear el convenio de una unidad
            receptora.
          </p>
        </div>

        <button
          type="button"
          onClick={() => navigate("/coord-unidades/convenios")}
          className="border border-gray-200 text-gray-600 rounded-xl px-4 py-2 text-sm font-semibold flex items-center gap-2 w-fit"
        >
          <ArrowLeft className="w-4 h-4" />
          Volver
        </button>
      </div>

      <form
        onSubmit={enviar}
        className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 space-y-6"
      >
        <div className="grid lg:grid-cols-2 gap-5">
          <label className="space-y-2">
            <span className="text-sm font-semibold text-[#0d2b5e] flex items-center gap-2">
              <Building2 className="w-4 h-4 text-[#1565c0]" />
              Empresa
            </span>
            <select
              value={form.id_empresa}
              onChange={(e) => actualizarCampo("id_empresa", e.target.value)}
              className="w-full border rounded-xl px-3 py-2 text-sm bg-white"
              disabled={cargandoEmpresas}
            >
              <option value="">
                {cargandoEmpresas ? "Cargando empresas..." : "Selecciona una empresa"}
              </option>
              {empresas.map((empresa) => (
                <option key={empresa.id_empresa} value={empresa.id_empresa}>
                  {empresa.nombre_empresa} - {empresa.rfc}
                </option>
              ))}
            </select>
          </label>

          <label className="space-y-2">
            <span className="text-sm font-semibold text-[#0d2b5e] flex items-center gap-2">
              <FileText className="w-4 h-4 text-[#1565c0]" />
              Tipo de convenio
            </span>
            <select
              value={form.tipo_convenio}
              onChange={(e) => actualizarCampo("tipo_convenio", e.target.value)}
              className="w-full border rounded-xl px-3 py-2 text-sm bg-white"
            >
              {tiposConvenio.map((tipo) => (
                <option key={tipo}>{tipo}</option>
              ))}
            </select>
          </label>

          <label className="space-y-2">
            <span className="text-sm font-semibold text-[#0d2b5e] flex items-center gap-2">
              <CalendarDays className="w-4 h-4 text-[#1565c0]" />
              Fecha de inicio
            </span>
            <input
              type="date"
              value={form.fecha_inicio}
              onChange={(e) => actualizarCampo("fecha_inicio", e.target.value)}
              className="w-full border rounded-xl px-3 py-2 text-sm"
            />
          </label>

          <label className="space-y-2">
            <span className="text-sm font-semibold text-[#0d2b5e] flex items-center gap-2">
              <CalendarDays className="w-4 h-4 text-[#1565c0]" />
              Fecha de fin
            </span>
            <input
              type="date"
              value={form.fecha_fin}
              onChange={(e) => actualizarCampo("fecha_fin", e.target.value)}
              className="w-full border rounded-xl px-3 py-2 text-sm"
            />
          </label>
        </div>

        <label className="space-y-2 block">
          <span className="text-sm font-semibold text-[#0d2b5e] flex items-center gap-2">
            <Upload className="w-4 h-4 text-[#1565c0]" />
            Documento convenio
          </span>
          <input
            value={form.documento_convenio}
            onChange={(e) => actualizarCampo("documento_convenio", e.target.value)}
            className="w-full border rounded-xl px-3 py-2 text-sm"
            placeholder="Ej. convenio_empresa_2026.pdf"
          />
        </label>

        <label className="space-y-2 block">
          <span className="text-sm font-semibold text-[#0d2b5e]">
            Observaciones
          </span>
          <textarea
            value={form.observaciones}
            onChange={(e) => actualizarCampo("observaciones", e.target.value)}
            className="w-full border rounded-xl px-3 py-2 text-sm min-h-28 resize-none"
            placeholder="Notas internas, condiciones del convenio o comentarios de revision."
          />
        </label>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 text-sm">
            {error}
          </div>
        )}

        <div className="flex flex-col sm:flex-row justify-end gap-3">
          <button
            type="button"
            onClick={() => navigate("/coord-unidades/convenios")}
            className="border border-gray-200 text-gray-600 rounded-xl px-4 py-2 text-sm font-semibold"
          >
            Cancelar
          </button>

          <button
            type="submit"
            disabled={guardando}
            className="bg-[#1565c0] disabled:bg-blue-300 text-white rounded-xl px-4 py-2 text-sm font-semibold flex items-center justify-center gap-2"
          >
            <Save className="w-4 h-4" />
            {guardando ? "Registrando..." : "Guardar convenio"}
          </button>
        </div>
      </form>
    </div>
  );
}
