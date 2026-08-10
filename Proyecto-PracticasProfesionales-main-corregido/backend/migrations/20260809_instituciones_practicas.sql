-- Ficha completa de las unidades receptoras.
-- La aplicación mantiene esta tabla sincronizada con empresa mediante el RFC.

CREATE TABLE IF NOT EXISTS instituciones_practicas (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nombre_institucion VARCHAR(255) NOT NULL,
    rfc VARCHAR(13) NOT NULL,
    telefono_institucional VARCHAR(50) NOT NULL,
    correo_institucional VARCHAR(150) NOT NULL,
    tipo_unidad VARCHAR(100) NULL,
    domicilio VARCHAR(255) NULL,
    horario_atencion VARCHAR(100) NULL,
    nombre_contacto VARCHAR(150) NULL,
    cargo_contacto VARCHAR(100) NULL,
    area_contacto VARCHAR(100) NULL,
    telefono_contacto VARCHAR(50) NULL,
    correo_contacto VARCHAR(150) NULL,
    areas_receptoras TEXT NULL,
    numero_estudiantes INT NULL,
    perfil_academico TEXT NULL,
    actividades TEXT NULL,
    horario_practicas VARCHAR(100) NULL,
    modalidad VARCHAR(50) NULL,
    documento_pdf VARCHAR(255) NULL,
    municipio VARCHAR(100) NULL,
    estado VARCHAR(100) NULL,
    estatus VARCHAR(50) DEFAULT 'Activo',
    observaciones TEXT NULL,
    carta_colaboracion VARCHAR(255) NULL
);
