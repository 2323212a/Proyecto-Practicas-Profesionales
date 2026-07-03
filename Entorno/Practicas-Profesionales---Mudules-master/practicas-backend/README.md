# Practicas Backend

Proyecto de backend en FastAPI con arquitectura hexagonal para gestión de documentos.

## 1. Instalación usando WSL

1. Abre WSL (por ejemplo Ubuntu):

```bash
wsl
```

2. Navega al directorio del proyecto:

```bash
cd /mnt/c/Users/user/practicas-backend <--- yo lo agregue desde aqui para no tener una direccion grande
```

3. Crea y activa un entorno virtual:

```bash
python3 -m venv venv
source venv/bin/activate
```

4. Instala las dependencias necesarias:

```bash
pip install fastapi uvicorn sqlalchemy pymysql
```

5. Ejecuta la aplicación:

```bash
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

Luego abre `http://localhost:8000/docs` para acceder a la documentación automática de FastAPI.

## 2. Conexión a la base de datos

La conexión a la base de datos está definida en:

- `modules/expedientes/infrastructure/database/connection.py`

Conexión actual:

```python
DATABASE_URL = "mysql+pymysql://root:1234@localhost/practicas_profesionales"
```

Esto significa:

- Usuario: `root`
- Contraseña: `1234`
- Host: `localhost`
- Base de datos: `practicas_profesionales`
- Driver: `pymysql`

Asegúrate de tener MySQL en ejecución y de que la base de datos `practicas_profesionales` exista.

La aplicación crea las tablas automáticamente al iniciar, usando:

- `modules/expedientes/infrastructure/database/models.py`
- `Base.metadata.create_all(bind=engine)` en `main.py`

## 3. Estructura de la arquitectura hexagonal

El proyecto sigue una organización inspirada en la arquitectura hexagonal:

- `modules/expedientes/domain`
  - `entities/documento.py` -> entidad del dominio `Documento`
  - `repositories/documento_repository.py` -> interfaz de repositorio

- `modules/expedientes/application`
  - `use_cases/subir_documento.py` -> caso de uso para subir/crear documento

- `modules/expedientes/infrastructure`
  - `database/connection.py` -> configuración de la conexión a MySQL
  - `database/models.py` -> modelo ORM de SQLAlchemy
  - `repositories/mysql_documento_repository.py` -> implementación del repositorio usando la base de datos

- `modules/expedientes/presentation`
  - `routers/documento_router.py` -> rutas HTTP de FastAPI
  - `schemas/documento_schema.py` -> validaciones y esquemas de entrada

## 4. Funciones implementadas

### Visualizar documentos

Endpoint:

- `GET /documentos`

Descripción:

- Lista todos los documentos existentes.

### Crear / subir documento

Endpoint:

- `POST /documentos`

Datos esperados:

- `id_expediente`: int
- `id_tipo_documento`: int
- `nombre_archivo`: str
- `ruta_archivo`: str
- `generado_por_sistema`: bool

Descripción:

- Crea un nuevo documento con estado inicial `Pendiente`.

### Aprobar documento

Endpoint:

- `PATCH /documentos/{id_documento}/aprobar`

Descripción:

- Cambia el estado del documento a `Aprobado`.
- Solo funciona si el documento está en estado `Pendiente`.

### Rechazar documento

Endpoint:

- `PATCH /documentos/{id_documento}/rechazar`

Descripción:

- Cambia el estado del documento a `Rechazado`.
- Solo funciona si el documento está en estado `Pendiente`.

## 5. Notas adicionales

- El repositorio `MySQLDocumentoRepository` implementa las operaciones principales de persistencia.
- El caso de uso `SubirDocumentoUseCase` delega la creación de documentos al repositorio.
- `documento_router.py` expone la API y controla el flujo de las operaciones.


## psdta:
La base de datos fue creada desde el entorno virtual de wsl ubuntu ya que mis conexión con mysql workbench windows no me funciona o no logro inmplementarlo
