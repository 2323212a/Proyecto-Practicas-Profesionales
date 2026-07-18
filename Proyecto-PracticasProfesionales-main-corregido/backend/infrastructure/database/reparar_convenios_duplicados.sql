-- Reparacion idempotente de convenios duplicados.
-- Conserva un solo convenio actual por empresa y deja los sustituidos como historial.

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

UPDATE convenio
SET estado_convenio = 'Vencido'
WHERE es_actual = 0
  AND estado_convenio = 'Vigente';

UPDATE convenio
SET estado_convenio = 'Vencido'
WHERE es_actual = 1
  AND estado_convenio = 'Vigente'
  AND fecha_fin < CURRENT_DATE();

UPDATE empresa e
JOIN convenio c ON c.id_empresa = e.id_empresa
SET e.tipo_tramite = 'Convenio'
WHERE c.es_actual = 1
  AND c.estado_convenio = 'Vigente'
  AND c.fecha_inicio <= CURRENT_DATE()
  AND c.fecha_fin >= CURRENT_DATE()
  AND e.tipo_tramite <> 'Convenio';

SELECT
    c.id_empresa,
    c.id_convenio,
    c.estado_convenio,
    c.fecha_inicio,
    c.fecha_fin,
    c.es_actual
FROM convenio c
ORDER BY c.id_empresa, c.es_actual DESC, c.fecha_fin DESC, c.id_convenio DESC;
