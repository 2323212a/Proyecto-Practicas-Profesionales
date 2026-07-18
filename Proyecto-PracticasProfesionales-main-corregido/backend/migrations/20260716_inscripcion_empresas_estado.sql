ALTER TABLE configuracion_sistema
ADD COLUMN inscripcion_empresas_estado ENUM('Abierta','Cerrada')
NOT NULL DEFAULT 'Abierta';
