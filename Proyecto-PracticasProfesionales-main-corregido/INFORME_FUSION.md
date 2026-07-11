# Informe de integración y corrección

## Base y fuente comparadas

- **Base final:** `Proyecto-Practicas-Profesionales-feature-cambios-oscar.zip`.
- **Fuente de cambios:** `Proyecto-PracticasProfesionales2-main (1).zip`.
- **Criterio:** conservar la main de Oscar y fusionar los cambios de Administrador, Coordinación de Unidades Receptoras y Unidad Receptora, incluyendo dependencias compartidas necesarias en backend, frontend y base de datos.

La comparación se realizó sobre árboles limpios. Se excluyeron dependencias instaladas y archivos generados (`node_modules`, entornos virtuales, `dist`, uploads, cachés y metadatos de Git), porque no representan código fuente.

## Resultado de la comparación

La diferencia aparente de decenas de miles de archivos se debía principalmente a dependencias instaladas. Tras normalizar saltos de línea y excluir artefactos generados, se compararon **513 rutas de código y recursos reales**:

- 262 eran idénticas en ambos proyectos y en el resultado.
- 99 requirieron una fusión manual.
- 23 adoptaron directamente la versión fuente.
- 44 conservaron la versión de Oscar por ser más reciente o completa.
- 2 archivos exclusivos de Oscar fueron mejorados.
- 1 archivo nuevo de la fuente fue ampliado durante la integración.
- 76 archivos heredados y duplicados de la arquitectura antigua del backend fueron eliminados.
- Se crearon 5 archivos nuevos necesarios para completar la integración.
- Un archivo fuente se omitió intencionalmente: `modulo_documento.py`, explicado más adelante.

No se copiaron carpetas completas a ciegas. Los archivos compartidos se fusionaron manualmente para evitar regresiones en Alumno, Coordinador de Prácticas, Asesor y Dirección. El inventario completo de conciliación se generó durante la validación final.

## Cambios integrados

### Administrador

- Eliminación lógica de usuarios mediante estado `Inactivo`.
- Bloqueo de inicio de sesión para usuarios inactivos.
- Conservación de dashboard, catálogos, configuración, reportes y auditoría de la main de Oscar.
- Eliminación de una implementación duplicada de estadísticas con diferencia de mayúsculas en la ruta.

### Coordinación de Unidades Receptoras

- Recepción, consulta, aceptación y rechazo de solicitudes de empresas.
- Creación de cuenta al aceptar una solicitud.
- Expediente empresarial y separación entre documentación legal y convenio.
- Configuración de requisitos documentales por etapa.
- Activación, desactivación y eliminación segura de requisitos.
- Carga, reemplazo, consulta y eliminación de formatos.
- Revisión de convenios, versiones, vigencia y solicitudes de renovación.
- Revisión de vacantes, observaciones, rechazo y paso a pre-padrón.
- Liberación controlada del pre-padrón.

### Unidad Receptora

- Registro con tipo de trámite y periodo de participación.
- Validación de RFC y datos obligatorios.
- Documentación legal y bloqueo del convenio hasta completar requisitos.
- Gestión de convenio vigente, historial y renovación.
- Bloqueo de planes de trabajo y vacantes cuando no existe convenio vigente.
- Periodo, tipo de práctica, convocatoria y observaciones en vacantes.
- Conservación de confirmaciones de seguridad de la versión más reciente de Oscar.

### Dependencias compartidas

- Estados de empresa y vacante ampliados.
- Modelo `solicitud_empresa` incorporado.
- Catálogo `tipo_practica` creado y relacionado con vacantes.
- Estado, vacante, revisión y observaciones en selecciones empresariales.
- Validación de convenio vigente durante la asignación.
- Padrón del alumno fusionado sin perder la empresa ya asignada.
- Rutas, contratos, casos de uso y repositorios HTTP actualizados.
- URLs de API centralizadas para respetar `VITE_API_URL`.
- Manejo tipado de errores Axios y tipos compartidos para la interfaz.

## Correcciones adicionales

- Se eliminaron carpetas backend antiguas y duplicadas que convivían con la arquitectura hexagonal y contenían implementaciones contradictorias.
- Se eliminó la conexión MySQL rígida y la clave JWT de respaldo.
- `DATABASE_URL`, `JWT_SECRET_KEY` y CORS ahora se configuran mediante variables de entorno.
- Se corrigió un acoplamiento donde un servicio de aplicación accedía directamente a la sesión de SQLAlchemy.
- Se ajustaron modelos y claves foráneas para tipo de práctica y convocatoria.
- Se corrigieron tipos TypeScript, efectos React, respuestas HTTP y formularios.
- Se eliminaron usos explícitos de `any` y código JSX inalcanzable.
- Se actualizó `seed_data.sql` para el esquema fusionado.
- Se reemplazó el README genérico de Vite por documentación real del proyecto.
- Se cerraron los CRUD heredados que podían consultarse sin autenticación; la auditoría final encontró cero operaciones privadas expuestas.
- Se corrigió el error de llave foránea al eliminar requisitos: primero se eliminan sus formatos y archivos físicos; si existe historial documental, se conserva el requisito y únicamente puede desactivarse.
- La eliminación de empresas y usuarios se convirtió en baja lógica para no romper historial ni relaciones.
- Se dividió el bundle de producción en chunks de React, gráficas, componentes UI y dependencias generales; el archivo principal bajó de 1.16 MB a aproximadamente 437 KB.
- Se agregaron claves foráneas de forma segura solamente cuando los datos heredados son válidos, evitando bloquear el arranque por referencias antiguas inconsistentes.

## Cambio que no se incorporó

La fuente incluía un modelo `modulo_documento` y cambios asociados al sistema documental del Coordinador de Prácticas. No se integró porque:

1. pertenece a un módulo distinto de los tres solicitados;
2. requería sustituir una implementación más reciente de la main de Oscar;
3. incorporarlo parcialmente habría dejado una función sin interfaz completa y con riesgo de regresión.

Esta exclusión fue intencional y no afecta los flujos de Administrador, Coordinación de Unidades Receptoras o Unidad Receptora.

## Migración de base de datos

`backend/infrastructure/database/schema_updates.py` aplica ajustes pequeños e idempotentes al arrancar. Incluye campos nuevos de empresas, convenios, vacantes, selecciones y requisitos empresariales, además de la ampliación de estados `ENUM`.

Se recomienda respaldar la base antes del primer inicio. Para una evolución posterior del proyecto, conviene incorporar Alembic y convertir estas actualizaciones en migraciones versionadas.

## Validaciones ejecutadas

### Frontend

- `npm run typecheck`: aprobado.
- `npm run lint`: aprobado sin errores ni advertencias.
- `npm run build`: aprobado con 2,465 módulos transformados.
- Bundle dividido sin advertencia de chunks mayores a 500 KB.
- `npm audit` completo y de producción: 0 vulnerabilidades reportadas.

### Backend y arquitectura

- Ruff: aprobado sin incidencias.
- Compilación de todos los archivos Python: aprobada.
- SQLAlchemy: 32 tablas y relaciones configuradas correctamente.
- FastAPI: 256 operaciones HTTP registradas.
- Rutas duplicadas: 0.
- Operaciones privadas sin autenticación: 0.
- Script SQL de datos de demostración: 24 sentencias analizadas sintácticamente.
- Contraseña demostrativa verificada contra el hash almacenado.

### Pruebas funcionales aisladas

Se ejecutaron con FastAPI `TestClient` y una base SQLite temporal para no modificar la base real:

- Inicio de sesión de usuario activo y bloqueo de usuario inactivo.
- Baja lógica de usuarios y bloqueo posterior de acceso.
- Solicitud pública de empresa.
- Protección del listado empresarial.
- Aceptación de solicitud y creación de cuenta de Unidad Receptora.
- Inicio de sesión con contraseña temporal.
- Bloqueo de vacantes sin documentación y convenio vigente.
- Activación de empresa con requisitos completos.
- Creación de vacante, paso a pre-padrón y liberación.
- Creación de requisito con formato.
- Eliminación del requisito sin conflicto de llave foránea.
- Eliminación del archivo físico asociado.
- Protección de requisitos con historial documental.
- Desactivación y reactivación de requisitos.

La auditoría de dependencias Python mediante `pip-audit` no pudo consultar PyPI porque el entorno de validación no tuvo resolución de red. No se marca como aprobada ni se oculta esa limitación. Todas las dependencias están fijadas por versión.

La validación automatizada no sustituye una prueba contra la base MySQL real del usuario. Esa prueba requiere sus datos, permisos, estructura existente y un respaldo previo.
