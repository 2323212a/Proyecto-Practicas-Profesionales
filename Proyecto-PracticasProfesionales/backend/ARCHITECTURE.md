# Arquitectura Hexagonal Del Backend

El backend esta organizado por capas hexagonales:

```text
domain/
  Entidades, excepciones, puertos y reglas de negocio puras.

app/
  Casos de uso y servicios de aplicacion. Orquesta dominio y puertos.

infrastructure/
  Adaptadores tecnicos: SQLAlchemy, MySQL, seguridad, JWT, hashing.

interfaces/
  Adaptadores de entrada: FastAPI routes y schemas Pydantic.
```

## Reglas

- `domain/` no debe importar FastAPI, SQLAlchemy, Pydantic ni MySQL.
- `app/` puede usar dominio y puertos. No debe importar modelos ORM, FastAPI routes ni schemas Pydantic.
- `infrastructure/` implementa persistencia, seguridad y detalles tecnicos.
- `interfaces/api/` contiene rutas HTTP y DTOs de entrada/salida.

## Flujo Esperado

```text
FastAPI route
  -> schema Pydantic
  -> service/use case de app
  -> regla de domain
  -> adaptador infrastructure
  -> base de datos
```

## Estado Actual

La estructura fisica ya esta reorganizada. El dominio contiene entidades, puertos y reglas puras para perfiles, vacantes, asignaciones y horas.

Los servicios de `app/services` ya no consultan SQLAlchemy directamente con `db.query(...)`; la persistencia se hace mediante puertos de dominio implementados por repositorios en:

```text
infrastructure/persistence/repositories/
```

Los modelos SQLAlchemy viven solamente en:

```text
infrastructure/persistence/models/
```

La composicion de dependencias se hace desde la capa de entrada:

```text
interfaces/api/service_factory.py
```

Ese factory crea servicios de aplicacion e inyecta adaptadores concretos:

```text
domain/ports -> infrastructure/persistence/repositories
domain/ports/security.py -> infrastructure/security/password_hasher.py
```

`app/` ya no importa `infrastructure` ni `interfaces`.
