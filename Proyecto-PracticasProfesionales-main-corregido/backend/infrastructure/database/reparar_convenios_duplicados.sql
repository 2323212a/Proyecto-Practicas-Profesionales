-- Reparacion idempotente de convenios duplicados y empresas bloqueadas.
-- Ejecutar sobre la base practicas_profesionales solo si se desea reparar
-- manualmente. La aplicacion también ejecuta estas correcciones al iniciar.

START TRANSACTION;

-- Conserva como actual el convenio marcado más reciente. Si ninguno estaba
-- marcado, toma el convenio más reciente de la empresa.
UPDATE convenio c
JOIN (
    SELECT
        id_empresa,
        COALESCE(
            MAX(CASE WHEN es_actual = 1 THEN id_convenio END),
            MAX(id_convenio)
        ) AS id_convenio_actual
    FROM convenio
    GROUP BY id_empresa
) actual ON actual.id_empresa = c.id_empresa
SET c.es_actual = CASE
    WHEN c.id_convenio = actual.id_convenio_actual THEN 1
    ELSE 0
END;

-- Los convenios reemplazados se conservan como historial, pero ya no cuentan
-- como vigentes.
UPDATE convenio
SET estado_convenio = 'Vencido',
    renovacion_solicitada = 0
WHERE es_actual = 0
  AND estado_convenio = 'Vigente';

UPDATE convenio
SET estado_convenio = 'Vencido'
WHERE es_actual = 1
  AND estado_convenio = 'Vigente'
  AND fecha_fin < CURRENT_DATE();

-- Un convenio vigente demuestra que el trámite efectivo es Convenio.
UPDATE empresa e
JOIN convenio c ON c.id_empresa = e.id_empresa
SET e.tipo_tramite = 'Convenio'
WHERE c.es_actual = 1
  AND c.estado_convenio = 'Vigente'
  AND c.fecha_inicio <= CURRENT_DATE()
  AND c.fecha_fin >= CURRENT_DATE()
  AND (e.tipo_tramite IS NULL OR e.tipo_tramite <> 'Convenio');

-- Activa empresas que ya cumplieron documentación legal y convenio vigente.
UPDATE empresa e
JOIN convenio c ON c.id_empresa = e.id_empresa
SET e.estado_empresa = 'Activa'
WHERE e.estado_empresa = 'Pendiente'
  AND c.es_actual = 1
  AND c.estado_convenio = 'Vigente'
  AND c.fecha_inicio <= CURRENT_DATE()
  AND c.fecha_fin >= CURRENT_DATE()
  AND EXISTS (
      SELECT 1
      FROM tipo_documento_empresa t
      WHERE t.activo = 1
        AND t.obligatorio = 1
        AND t.etapa = 'Documentacion'
  )
  AND NOT EXISTS (
      SELECT 1
      FROM tipo_documento_empresa t
      LEFT JOIN documento_empresa d
        ON d.id_empresa = e.id_empresa
       AND d.id_tipo_documento_empresa = t.id_tipo_documento_empresa
      WHERE t.activo = 1
        AND t.obligatorio = 1
        AND t.etapa = 'Documentacion'
        AND (
            d.id_documento_empresa IS NULL
            OR d.estado_documento <> 'Aprobado'
        )
  );

COMMIT;

SELECT
    e.id_empresa,
    e.nombre_empresa,
    e.estado_empresa,
    e.tipo_tramite,
    c.id_convenio,
    c.version,
    c.estado_convenio,
    c.es_actual,
    c.fecha_inicio,
    c.fecha_fin
FROM empresa e
LEFT JOIN convenio c ON c.id_empresa = e.id_empresa
ORDER BY e.id_empresa, c.es_actual DESC, c.id_convenio DESC;
