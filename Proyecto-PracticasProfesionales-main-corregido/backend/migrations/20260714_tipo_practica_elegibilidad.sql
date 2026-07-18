ALTER TABLE tipo_practica
ADD COLUMN semestre_requerido INT NULL AFTER nombre;

ALTER TABLE tipo_practica
ADD COLUMN creditos_minimos INT NULL AFTER semestre_requerido;

ALTER TABLE tipo_practica
ADD COLUMN orden INT NULL AFTER creditos_minimos;

UPDATE tipo_practica
SET semestre_requerido = 5,
    creditos_minimos = COALESCE(creditos_minimos, 0),
    orden = 1
WHERE nombre IN (
  'Prácticas 1',
  'Practicas 1',
  'Prácticas Profesionales 1',
  'Practicas Profesionales 1'
);

UPDATE tipo_practica
SET semestre_requerido = 7,
    creditos_minimos = COALESCE(creditos_minimos, 0),
    orden = 2
WHERE nombre IN (
  'Prácticas 2',
  'Practicas 2',
  'Prácticas Profesionales 2',
  'Practicas Profesionales 2'
);

UPDATE tipo_practica
SET semestre_requerido = 9,
    creditos_minimos = COALESCE(creditos_minimos, 0),
    orden = 3
WHERE nombre IN (
  'Residencia',
  'Residencia Profesional'
);
