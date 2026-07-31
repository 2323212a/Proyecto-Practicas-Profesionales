-- Renombra los documentos de elegibilidad conservando IDs y archivos asociados.
UPDATE tipo_documento_alumno
SET
  nombre = 'Historial academico (Comprobante con materias)',
  descripcion = 'Historial academico del alumno con las materias cursadas.',
  instrucciones = 'Solicitar en SYSWEB el Historial academico (Comprobante con materias). El documento debe ser claro, legible, estar completo y no contener sombras, reflejos, recortes o paginas borrosas.'
WHERE nombre = 'Comprobante con materias'
  AND etapa = 'Elegibilidad';

UPDATE tipo_documento_alumno
SET
  nombre = 'Constancia de Vigencia de Derechos',
  descripcion = 'Constancia que acredita que el alumno cuenta con vigencia de derechos para continuar el tramite.',
  instrucciones = 'Descargar la Constancia de Vigencia de Derechos en el portal del IMSS. El documento debe ser claro, legible, estar completo y no contener sombras, reflejos, recortes o paginas borrosas.'
WHERE nombre = 'Vigencia de Derechos'
  AND etapa = 'Elegibilidad';

UPDATE tipo_documento_alumno
SET activo = 0
WHERE nombre IN ('Comprobante de materias SYSWEB', 'Vigencia de derechos IMSS')
  AND etapa = 'Elegibilidad';
