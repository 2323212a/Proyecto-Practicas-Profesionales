import { useEffect, useMemo, useState } from "react";
import {
  BadgeCheck,
  Calendar,
  GraduationCap,
  Mail,
  School,
  User,
} from "lucide-react";

import { apiClient } from "../../../infrastructure/api/apiClient";

type AlumnoPerfilData = {
  id_usuario: number;
  id_alumno: number;
  id_rol: number;
  nombre: string;
  apellido_paterno?: string | null;
  apellido_materno?: string | null;
  correo: string;
  estado_usuario?: string | null;
  fecha_registro?: string | null;
  matricula: string;
  semestre?: number | null;
  grupo?: string | null;
  creditos_aprobados: number;
  estado_alumno: string;
  id_carrera: number;
  carrera_clave?: string | null;
  carrera_nombre?: string | null;
};

const dato = (value?: string | number | null) => {
  if (value === undefined || value === null || value === "") return "No registrado";
  return String(value);
};

const formatFecha = (value?: string | null) => {
  if (!value) return "No registrada";

  const fecha = new Date(value);
  if (Number.isNaN(fecha.getTime())) return "No registrada";

  return new Intl.DateTimeFormat("es-MX", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  }).format(fecha);
};

export function AlumnoPerfil() {
  const [perfil, setPerfil] = useState<AlumnoPerfilData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const cargarPerfil = async () => {
      try {
        setLoading(true);
        setError("");

        const response = await apiClient.get<AlumnoPerfilData>(
          "/alumnos/me/perfil",
        );

        setPerfil(response.data);
      } catch (err) {
        console.error(err);
        setError(
          "No se pudo cargar la informacion del perfil. Verifica que hayas iniciado sesion como alumno y que el backend este activo.",
        );
      } finally {
        setLoading(false);
      }
    };

    cargarPerfil();
  }, []);

  const nombreCompleto = useMemo(() => {
    if (!perfil) return "Alumno";

    return [
      perfil.nombre,
      perfil.apellido_paterno,
      perfil.apellido_materno,
    ]
      .filter(Boolean)
      .join(" ");
  }, [perfil]);

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-[#0d2b5e]">Mi Perfil</h1>
          <p className="text-gray-500 text-sm mt-1">
            Cargando informacion registrada en la base de datos...
          </p>
        </div>
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
          <div className="h-5 w-52 bg-gray-100 rounded" />
          <div className="mt-5 grid md:grid-cols-2 gap-4">
            {Array.from({ length: 6 }).map((_, index) => (
              <div key={index} className="h-16 bg-gray-100 rounded-xl" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error || !perfil) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-[#0d2b5e]">Mi Perfil</h1>
          <p className="text-gray-500 text-sm mt-1">
            Informacion personal y academica del alumno.
          </p>
        </div>
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-2xl p-5 text-sm">
          {error || "No se encontro informacion del alumno."}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[#0d2b5e]">Mi Perfil</h1>
        <p className="text-gray-500 text-sm mt-1">
          Informacion personal y academica registrada en la base de datos.
        </p>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
          <div className="flex flex-col items-center text-center">
            <div className="w-24 h-24 rounded-full bg-[#0d2b5e] flex items-center justify-center text-white">
              <User className="w-12 h-12" />
            </div>

            <h2 className="mt-4 text-xl font-bold text-[#0d2b5e]">
              {nombreCompleto}
            </h2>

            <p className="text-gray-500 text-sm">
              {dato(perfil.carrera_nombre)}
            </p>
          </div>

          <div className="mt-6 space-y-4">
            <div className="flex items-center gap-3">
              <Mail className="w-4 h-4 text-[#1565c0]" />
              <span className="text-sm break-all">{perfil.correo}</span>
            </div>

            <div className="flex items-center gap-3">
              <GraduationCap className="w-4 h-4 text-[#1565c0]" />
              <span className="text-sm">Matricula: {perfil.matricula}</span>
            </div>

            <div className="flex items-center gap-3">
              <School className="w-4 h-4 text-[#1565c0]" />
              <span className="text-sm">Grupo: {dato(perfil.grupo)}</span>
            </div>
          </div>
        </div>

        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
            <h3 className="font-bold text-[#0d2b5e] mb-4">
              Datos personales
            </h3>

            <div className="grid md:grid-cols-2 gap-4">
              <Info label="Nombre" value={perfil.nombre} />
              <Info label="Apellido paterno" value={perfil.apellido_paterno} />
              <Info label="Apellido materno" value={perfil.apellido_materno} />
              <Info label="Correo" value={perfil.correo} />
              <Info label="Estado de usuario" value={perfil.estado_usuario} />
              <Info label="Fecha de registro" value={formatFecha(perfil.fecha_registro)} />
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
            <h3 className="font-bold text-[#0d2b5e] mb-4">
              Informacion academica
            </h3>

            <div className="grid md:grid-cols-2 gap-4">
              <Info label="Matricula" value={perfil.matricula} />
              <Info label="Carrera" value={perfil.carrera_nombre} />
              <Info label="Clave de carrera" value={perfil.carrera_clave} />
              <Info label="Semestre" value={perfil.semestre ? `${perfil.semestre} semestre` : null} />
              <Info label="Grupo" value={perfil.grupo} />
              <Info label="Creditos aprobados" value={perfil.creditos_aprobados} />
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
            <h3 className="font-bold text-[#0d2b5e] mb-4">Estado general</h3>

            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-gray-500">Estado del alumno</p>
                <span className="inline-flex mt-1 bg-blue-100 text-[#0d2b5e] px-3 py-1 rounded-full text-xs font-semibold">
                  {perfil.estado_alumno}
                </span>
              </div>

              <div className="flex items-center gap-3">
                <Calendar className="w-5 h-5 text-[#1565c0]" />
                <div>
                  <p className="text-xs text-gray-500">Registro</p>
                  <p className="font-medium">{formatFecha(perfil.fecha_registro)}</p>
                </div>
              </div>
            </div>

            <div className="mt-5 space-y-3">
              <div className="flex items-center gap-3">
                <BadgeCheck className="w-5 h-5 text-green-600" />
                <span>Cuenta: {dato(perfil.estado_usuario)}</span>
              </div>

              <div className="flex items-center gap-3">
                <BadgeCheck className="w-5 h-5 text-green-600" />
                <span>Alumno: {perfil.estado_alumno}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function Info({ label, value }: { label: string; value?: string | number | null }) {
  return (
    <div>
      <p className="text-xs text-gray-500">{label}</p>
      <p className="font-medium text-gray-800">{dato(value)}</p>
    </div>
  );
}