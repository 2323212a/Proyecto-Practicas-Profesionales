# Estructura del proyecto

```text
backend/
  app/services/                 Servicios de aplicación
  domain/                       Entidades, reglas y puertos
  infrastructure/
    database/                   Conexión a DB y utilidades mínimas
    email/                      Envío de correos
    persistence/models/         Modelos SQLAlchemy de la DB limpia
    persistence/repositories/   Repositorios
    security/                   JWT, hashing y dependencias de auth
  interfaces/api/routes/        Endpoints FastAPI
  interfaces/api/schemas/       DTOs Pydantic
  templates/documentos/         Plantillas Word institucionales

src/
  app/                          Páginas, rutas y layout
  application/                  Casos de uso frontend
  domain/                       Tipos y contratos frontend
  infrastructure/               Clientes HTTP y adaptadores
  shared/                       UI, constantes y utilidades
  styles/                       Estilos globales

docs/
  backend/                      Documentación técnica del backend
  database/                     Esquema limpio de base de datos
```

## Carpetas que no deben versionarse

- `node_modules/`
- `dist/`
- `.venv/`, `venv/`
- `backend/uploads/`
- `backend/generated/`
- archivos `.env`
- reportes PDF generados
- cachés de Python, Vite, pytest, mypy o ruff
