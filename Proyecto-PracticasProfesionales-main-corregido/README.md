# Sistema Integral de Prácticas Profesionales

Aplicación web para administrar el proceso de prácticas profesionales de alumnos, empresas receptoras, coordinación académica y personal administrativo.

La versión de este repositorio toma como base la **main de Oscar** e integra de forma selectiva los cambios funcionales de **Administrador**, **Coordinación de Unidades Receptoras** y **Unidad Receptora**, conservando los avances más recientes de Alumno, Coordinador de Prácticas, Asesor y Dirección.

## Módulos principales

- **Administrador:** usuarios, roles, catálogos, configuración, reportes y auditoría.
- **Coordinador de Prácticas:** convocatorias, documentación del alumno, asignaciones, asesores, seguimiento y liberación.
- **Coordinación de Unidades Receptoras:** solicitudes de empresas, expedientes, requisitos documentales, convenios, vacantes y padrón empresarial.
- **Unidad Receptora:** registro, documentación legal, convenios, planes de trabajo, vacantes, horas y evaluaciones.
- **Alumno:** expediente, documentos, selección de empresas/vacantes, horas, reportes, evaluación y liberación.
- **Asesor interno y Dirección:** seguimiento, observaciones, indicadores y reportes.

## Tecnologías

- Frontend: React 19, TypeScript 6, Vite 8, React Router, Axios y Tailwind CSS.
- Backend: FastAPI, SQLAlchemy 2, Pydantic 2 y MySQL mediante PyMySQL.
- Documentos: python-docx, docxtpl y conversión opcional a PDF mediante LibreOffice.

## Requisitos

- Node.js **20.19 o superior**.
- Python **3.11 o 3.12 recomendado**. Python 3.14 puede ocasionar problemas al compilar algunas dependencias.
- MySQL 8.
- LibreOffice solamente si se requiere generar PDF a partir de las plantillas Word.

## Configuración

1. Copia el archivo de ejemplo:

   ```bash
   cp .env.example .env
   ```

2. Edita `.env` con la conexión real a MySQL y una clave JWT segura:

   ```env
  VITE_API_URL=http://127.0.0.1:8001
   DATABASE_URL=mysql+pymysql://usuario:contrasena@127.0.0.1:3306/practicas_profesionales
   JWT_SECRET_KEY=una-clave-aleatoria-larga-y-segura
   CORS_ORIGINS=http://localhost:5173,http://127.0.0.1:5173
   ```

No subas `.env` al repositorio. El archivo ya está excluido mediante `.gitignore`.

## Base de datos

Crea primero una base vacía:

```sql
CREATE DATABASE practicas_profesionales
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;
```

Al iniciar el backend se ejecutan:

1. `Base.metadata.create_all()`, para crear tablas inexistentes.
2. `ensure_runtime_schema()`, para aplicar ajustes idempotentes requeridos por los módulos integrados.

Antes de iniciar esta versión sobre una base existente, realiza un respaldo. El proyecto todavía no utiliza Alembic; las actualizaciones compatibles se encuentran en:

```text
backend/infrastructure/database/schema_updates.py
```

### Datos de demostración

Después de iniciar el backend al menos una vez, selecciona la base correcta y ejecuta:

```bash
mysql -u TU_USUARIO -p practicas_profesionales \
  < backend/infrastructure/database/seed_data.sql
```

El script no contiene `USE ...`, por lo que no fuerza un nombre de base distinto al elegido en el comando. La contraseña demostrativa indicada por el script es `Password123!`.

## Backend

Desde la raíz del proyecto:

```bash
python -m venv backend/.venv
source backend/.venv/bin/activate
pip install --upgrade pip
pip install -r backend/requirements.txt
python -m uvicorn main:app --reload --app-dir backend --port 8001
```

En Windows PowerShell, activa el entorno con:

```powershell
backend\.venv\Scripts\Activate.ps1
```

La API quedará disponible en `http://127.0.0.1:8001` y la documentación interactiva en `/docs`.

## Frontend

En otra terminal, desde la raíz:

```bash
npm ci
npm run dev
```

Vite mostrará la dirección local, normalmente `http://localhost:5173`.

## Validaciones del proyecto

```bash
npm run typecheck
npm run lint
npm run build
python -m compileall -q backend
```

## Estructura relevante

```text
backend/
  app/                       Casos de uso y servicios de aplicación
  domain/                    Entidades y puertos
  infrastructure/            Base de datos, modelos, repositorios y seguridad
  interfaces/api/            Rutas y esquemas de FastAPI
  templates/documentos/      Plantillas Word para documentos del alumno
src/
  app/                       Páginas, componentes, rutas y layouts
  application/               Casos de uso del frontend
  domain/                    Tipos y contratos
  infrastructure/            Implementaciones HTTP de repositorios
  shared/                    Utilidades y tipos compartidos
```

## Archivos que no deben copiarse ni comprimirse

El proyecto puede ocupar cientos de megabytes después de instalarse, principalmente por:

- `node_modules/`
- `backend/.venv/` o `backend/venv/`
- `dist/`
- `backend/uploads/`
- `__pycache__/`
- `.npm-cache/`

Todos son generados localmente y están excluidos por `.gitignore`. El código fuente limpio es mucho más pequeño. La plantilla `backend/templates/documentos/carta_compromiso.docx` sigue siendo uno de los archivos más pesados porque contiene recursos incrustados necesarios para conservar su formato.

## Notas de integración

El detalle de la comparación, decisiones de fusión, archivos nuevos y validaciones se encuentra en [`INFORME_FUSION.md`](INFORME_FUSION.md).
