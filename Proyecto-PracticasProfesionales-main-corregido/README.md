# Sistema Integral de Prácticas Profesionales

Aplicación web para administrar prácticas profesionales: alumnos, empresas/unidades receptoras, coordinación de prácticas, coordinación de unidades receptoras, asesores internos, dirección y administración.

## Estado del proyecto

Esta versión está alineada con la **DB limpia**. El código ya no debe crear, reparar ni restaurar columnas/tablas antiguas en tiempo de ejecución.

Reglas importantes:

- `usuario` guarda únicamente acceso, rol y estado.
- Los perfiles viven en `alumno`, `personal_interno` o `responsable_empresa`.
- Asesor interno vive en `personal_interno`.
- `asignacion.id_asesor` apunta a `personal_interno.id_personal`.
- `vacante` usa `cupos`, `periodo`, `id_convocatoria` e `id_tipo_practica`.
- `vacante` no usa `id_carrera`, `modalidad`, `horario`, `cupo_total` ni `cupo_disponible`.
- `empresa` no usa `periodo_participacion`.
- `seleccion_empresa` usa `id_vacante`, no `id_empresa`.
- `bitacora_auditoria` usa `entidad`, `fecha` y `descripcion`.

## Módulos principales

- **Administrador:** usuarios, roles, catálogos, configuración, reportes y bitácora.
- **Coordinador de Prácticas:** documentación, asignaciones, asesores, seguimiento y liberación.
- **Coordinación de Unidades Receptoras:** solicitudes de empresas, expedientes, convenios, vacantes y padrón empresarial.
- **Unidad Receptora:** registro, documentación legal, convenio/vinculación, planes de trabajo, vacantes, horas y evaluaciones.
- **Alumno:** documentos, padrón, selección de vacantes, horas, reportes, evaluación y liberación.
- **Asesor Interno y Dirección:** seguimiento, observaciones, indicadores y reportes.

## Tecnologías

- Frontend: React, TypeScript, Vite, React Router, Axios y Tailwind CSS.
- Backend: FastAPI, SQLAlchemy, Pydantic y MySQL con PyMySQL.
- Documentos: plantillas Word en `backend/templates/documentos`.

## Requisitos

- Node.js 20.19 o superior.
- Python 3.11 o 3.12 recomendado.
- MySQL 8.
- LibreOffice opcional si se requiere conversión de documentos a PDF.

## Configuración

Copia el archivo de ejemplo:

```bash
cp .env.example .env
```

Edita `.env`:

```env
VITE_API_URL=http://127.0.0.1:8000
DATABASE_URL=mysql+pymysql://usuario:contrasena@127.0.0.1:3306/practicas_profesionales
JWT_SECRET_KEY=una-clave-aleatoria-larga-y-segura
CORS_ORIGINS=http://localhost:5173,http://127.0.0.1:5173
```

No subas `.env` al repositorio.

## Base de datos

El proyecto no ejecuta `create_all`, `ensure_runtime_schema` ni seeds automáticos. Primero carga la DB limpia oficial en MySQL y configura la conexión en `.env`.

## Ejecutar backend

```bash
cd backend
python -m venv .venv
.\.venv\Scripts\activate   # Windows PowerShell
pip install -r requirements.txt
python -m uvicorn main:app --reload --port 8000
```

En Linux/WSL:

```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
python -m uvicorn main:app --reload --port 8000
```

## Ejecutar frontend

```bash
npm install
npm run dev
```

## Validaciones útiles

Backend:

```bash
cd backend
python -m compileall -q .
```

Frontend:

```bash
npm run typecheck
```

## Estructura de documentación

- `docs/ESTRUCTURA_PROYECTO.md`: estructura general del proyecto.
- `docs/backend/ARQUITECTURA_BACKEND.md`: arquitectura del backend.

## Archivos generados

No se versionan uploads, reportes generados, builds, entornos virtuales ni dependencias instaladas. Revisa `.gitignore`.
