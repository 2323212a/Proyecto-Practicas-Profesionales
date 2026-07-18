-- Schema limpio de practicas_profesionales
-- Generado desde Dump20260717.sql sin datos/seed.
-- No contiene INSERTs ni usuarios de prueba.

CREATE DATABASE IF NOT EXISTS practicas_profesionales
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE practicas_profesionales;

-- MySQL dump 10.13  Distrib 8.0.43, for Win64 (x86_64)
--
-- Host: localhost    Database: practicas_profesionales
-- ------------------------------------------------------
-- Server version	8.0.43

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!50503 SET NAMES utf8 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for table `alumno`
--

DROP TABLE IF EXISTS `alumno`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `alumno` (
  `id_alumno` int NOT NULL AUTO_INCREMENT,
  `id_usuario` int NOT NULL,
  `nombre` varchar(120) COLLATE utf8mb4_unicode_ci NOT NULL,
  `apellido_paterno` varchar(120) COLLATE utf8mb4_unicode_ci NOT NULL,
  `apellido_materno` varchar(120) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `matricula` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `id_carrera` int NOT NULL,
  `semestre` int NOT NULL,
  `grupo` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `creditos_aprobados` int NOT NULL DEFAULT '0',
  `id_tipo_practica` int DEFAULT NULL,
  `periodo_practica` enum('Semestral','Cuatrimestral') COLLATE utf8mb4_unicode_ci NOT NULL,
  `telefono` varchar(30) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `estado_alumno` enum('Activo','Inactivo','Egresado','Baja') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'Activo',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id_alumno`),
  UNIQUE KEY `id_usuario` (`id_usuario`),
  UNIQUE KEY `matricula` (`matricula`),
  KEY `fk_alumno_carrera` (`id_carrera`),
  KEY `fk_alumno_tipo_practica` (`id_tipo_practica`),
  CONSTRAINT `fk_alumno_carrera` FOREIGN KEY (`id_carrera`) REFERENCES `carrera` (`id_carrera`),
  CONSTRAINT `fk_alumno_tipo_practica` FOREIGN KEY (`id_tipo_practica`) REFERENCES `tipo_practica` (`id_tipo_practica`),
  CONSTRAINT `fk_alumno_usuario` FOREIGN KEY (`id_usuario`) REFERENCES `usuario` (`id_usuario`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `alumno_proceso_practica`
--

DROP TABLE IF EXISTS `alumno_proceso_practica`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `alumno_proceso_practica` (
  `id_alumno_proceso_practica` int NOT NULL AUTO_INCREMENT,
  `id_alumno` int NOT NULL,
  `id_tipo_practica` int NOT NULL,
  `id_convocatoria` int NOT NULL,
  `semestre_al_momento` int DEFAULT NULL,
  `creditos_al_momento` int DEFAULT NULL,
  `periodo` enum('Semestral','Cuatrimestral') COLLATE utf8mb4_unicode_ci NOT NULL,
  `estado` enum('Pendiente','Elegible','Seleccion registrada','Asignado','En seguimiento','Listo para liberacion','Liberado','Cancelado','No acreditado') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'Pendiente',
  `fecha_inicio` date DEFAULT NULL,
  `fecha_fin` date DEFAULT NULL,
  `observaciones` text COLLATE utf8mb4_unicode_ci,
  `creado_por` int DEFAULT NULL,
  `actualizado_por` int DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id_alumno_proceso_practica`),
  KEY `fk_proceso_tipo_practica` (`id_tipo_practica`),
  KEY `fk_proceso_creado_por` (`creado_por`),
  KEY `fk_proceso_actualizado_por` (`actualizado_por`),
  KEY `idx_proceso_alumno` (`id_alumno`),
  KEY `idx_proceso_estado` (`estado`),
  KEY `idx_proceso_convocatoria` (`id_convocatoria`),
  CONSTRAINT `fk_proceso_actualizado_por` FOREIGN KEY (`actualizado_por`) REFERENCES `usuario` (`id_usuario`),
  CONSTRAINT `fk_proceso_alumno` FOREIGN KEY (`id_alumno`) REFERENCES `alumno` (`id_alumno`),
  CONSTRAINT `fk_proceso_convocatoria` FOREIGN KEY (`id_convocatoria`) REFERENCES `convocatoria` (`id_convocatoria`),
  CONSTRAINT `fk_proceso_creado_por` FOREIGN KEY (`creado_por`) REFERENCES `usuario` (`id_usuario`),
  CONSTRAINT `fk_proceso_tipo_practica` FOREIGN KEY (`id_tipo_practica`) REFERENCES `tipo_practica` (`id_tipo_practica`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `asignacion`
--

DROP TABLE IF EXISTS `asignacion`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `asignacion` (
  `id_asignacion` int NOT NULL AUTO_INCREMENT,
  `id_alumno` int NOT NULL,
  `id_empresa` int NOT NULL,
  `id_vacante` int NOT NULL,
  `id_convocatoria` int NOT NULL,
  `id_tipo_practica` int NOT NULL,
  `id_asesor` int DEFAULT NULL,
  `estado_asignacion` enum('Activa','Finalizada','Cancelada') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'Activa',
  `asignacion_activa` tinyint GENERATED ALWAYS AS ((case when (`estado_asignacion` = _utf8mb4'Activa') then 1 else NULL end)) STORED,
  `tipo_asignacion` enum('Normal','Reasignacion','Rezagado') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'Normal',
  `fecha_asignacion` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `asignado_por` int DEFAULT NULL,
  `observaciones` text COLLATE utf8mb4_unicode_ci,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id_asignacion`),
  UNIQUE KEY `uq_asignacion_activa_alumno_convocatoria` (`id_alumno`,`id_convocatoria`,`asignacion_activa`),
  KEY `fk_asignacion_tipo_practica` (`id_tipo_practica`),
  KEY `fk_asignacion_asignado_por` (`asignado_por`),
  KEY `idx_asignacion_alumno` (`id_alumno`),
  KEY `idx_asignacion_empresa` (`id_empresa`),
  KEY `idx_asignacion_vacante` (`id_vacante`),
  KEY `idx_asignacion_convocatoria` (`id_convocatoria`),
  KEY `idx_asignacion_asesor` (`id_asesor`),
  KEY `idx_asignacion_estado` (`estado_asignacion`),
  CONSTRAINT `fk_asignacion_alumno` FOREIGN KEY (`id_alumno`) REFERENCES `alumno` (`id_alumno`),
  CONSTRAINT `fk_asignacion_asesor` FOREIGN KEY (`id_asesor`) REFERENCES `personal_interno` (`id_personal`),
  CONSTRAINT `fk_asignacion_asignado_por` FOREIGN KEY (`asignado_por`) REFERENCES `usuario` (`id_usuario`),
  CONSTRAINT `fk_asignacion_convocatoria` FOREIGN KEY (`id_convocatoria`) REFERENCES `convocatoria` (`id_convocatoria`),
  CONSTRAINT `fk_asignacion_empresa` FOREIGN KEY (`id_empresa`) REFERENCES `empresa` (`id_empresa`),
  CONSTRAINT `fk_asignacion_tipo_practica` FOREIGN KEY (`id_tipo_practica`) REFERENCES `tipo_practica` (`id_tipo_practica`),
  CONSTRAINT `fk_asignacion_vacante` FOREIGN KEY (`id_vacante`) REFERENCES `vacante` (`id_vacante`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `bitacora_auditoria`
--

DROP TABLE IF EXISTS `bitacora_auditoria`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `bitacora_auditoria` (
  `id_bitacora` int NOT NULL AUTO_INCREMENT,
  `id_usuario` int DEFAULT NULL,
  `accion` varchar(150) COLLATE utf8mb4_unicode_ci NOT NULL,
  `modulo` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `descripcion` text COLLATE utf8mb4_unicode_ci,
  `entidad` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `id_entidad` int DEFAULT NULL,
  `fecha` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `ip` varchar(80) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `user_agent` text COLLATE utf8mb4_unicode_ci,
  PRIMARY KEY (`id_bitacora`),
  KEY `idx_bitacora_usuario` (`id_usuario`),
  KEY `idx_bitacora_fecha` (`fecha`),
  KEY `idx_bitacora_entidad` (`entidad`,`id_entidad`),
  KEY `idx_bitacora_modulo` (`modulo`),
  CONSTRAINT `fk_bitacora_usuario` FOREIGN KEY (`id_usuario`) REFERENCES `usuario` (`id_usuario`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `carrera`
--

DROP TABLE IF EXISTS `carrera`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `carrera` (
  `id_carrera` int NOT NULL AUTO_INCREMENT,
  `nombre` varchar(150) COLLATE utf8mb4_unicode_ci NOT NULL,
  `tipo_periodo` enum('Semestral','Cuatrimestral') COLLATE utf8mb4_unicode_ci NOT NULL,
  `estado` enum('Activa','Inactiva') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'Activa',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id_carrera`),
  UNIQUE KEY `nombre` (`nombre`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `configuracion_sistema`
--

DROP TABLE IF EXISTS `configuracion_sistema`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `configuracion_sistema` (
  `id_configuracion` int NOT NULL AUTO_INCREMENT,
  `nombre_sistema` varchar(180) COLLATE utf8mb4_unicode_ci NOT NULL,
  `escuela_facultad` varchar(180) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `correo_institucional` varchar(150) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `secretaria_academica` varchar(180) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `coordinadora_practicas` varchar(180) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `estado_sistema` enum('Activo','Mantenimiento','Suspendido') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'Activo',
  `inscripcion_empresas_estado` enum('Abierta','Cerrada') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'Abierta',
  `ciclo_escolar` varchar(80) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `hero_titulo` varchar(200) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `hero_subtitulo` text COLLATE utf8mb4_unicode_ci,
  `soporte_telefono` varchar(30) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `ultima_actualizacion` datetime DEFAULT NULL,
  PRIMARY KEY (`id_configuracion`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `convenio`
--

DROP TABLE IF EXISTS `convenio`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `convenio` (
  `id_convenio` int NOT NULL AUTO_INCREMENT,
  `id_empresa` int NOT NULL,
  `estado_convenio` enum('Pendiente','Vigente','Por vencer','Vencido','Rechazado') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'Pendiente',
  `fecha_inicio` date DEFAULT NULL,
  `fecha_fin` date DEFAULT NULL,
  `es_actual` tinyint(1) NOT NULL DEFAULT '0',
  `id_empresa_actual` int GENERATED ALWAYS AS ((case when (`es_actual` = 1) then `id_empresa` else NULL end)) STORED,
  `observaciones` text COLLATE utf8mb4_unicode_ci,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id_convenio`),
  UNIQUE KEY `uq_convenio_actual_empresa` (`id_empresa_actual`),
  KEY `idx_convenio_empresa` (`id_empresa`),
  KEY `idx_convenio_estado` (`estado_convenio`),
  CONSTRAINT `fk_convenio_empresa` FOREIGN KEY (`id_empresa`) REFERENCES `empresa` (`id_empresa`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `convocatoria`
--

DROP TABLE IF EXISTS `convocatoria`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `convocatoria` (
  `id_convocatoria` int NOT NULL AUTO_INCREMENT,
  `nombre` varchar(150) COLLATE utf8mb4_unicode_ci NOT NULL,
  `tipo_periodo` enum('Semestral','Cuatrimestral') COLLATE utf8mb4_unicode_ci NOT NULL,
  `estado` enum('Activa','Inactiva','Cerrada') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'Activa',
  `fecha_inicio_general` date DEFAULT NULL,
  `fecha_cierre_general` date DEFAULT NULL,
  `fecha_inicio_empresas` date DEFAULT NULL,
  `fecha_cierre_empresas` date DEFAULT NULL,
  `fecha_inicio_documentos` date DEFAULT NULL,
  `fecha_cierre_documentos` date DEFAULT NULL,
  `fecha_inicio_validacion` date DEFAULT NULL,
  `fecha_cierre_validacion` date DEFAULT NULL,
  `fecha_inicio_seleccion` date DEFAULT NULL,
  `fecha_cierre_seleccion` date DEFAULT NULL,
  `fecha_inicio_asignacion` date DEFAULT NULL,
  `fecha_cierre_asignacion` date DEFAULT NULL,
  `fecha_inicio_practicas` date DEFAULT NULL,
  `fecha_cierre_practicas` date DEFAULT NULL,
  `fecha_inicio_cierre` date DEFAULT NULL,
  `fecha_cierre_cierre` date DEFAULT NULL,
  `observaciones` text COLLATE utf8mb4_unicode_ci,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id_convocatoria`),
  KEY `idx_convocatoria_periodo` (`tipo_periodo`),
  KEY `idx_convocatoria_estado` (`estado`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `documento_alumno`
--

DROP TABLE IF EXISTS `documento_alumno`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `documento_alumno` (
  `id_documento_alumno` int NOT NULL AUTO_INCREMENT,
  `id_expediente` int NOT NULL,
  `id_tipo_documento_alumno` int NOT NULL,
  `nombre_archivo` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `ruta_archivo` varchar(500) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `mime_type` varchar(120) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `estado_documento` enum('Pendiente','Aprobado','Observado','Rechazado') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'Pendiente',
  `generado_por_sistema` tinyint(1) NOT NULL DEFAULT '0',
  `requiere_validacion_automatica` tinyint(1) NOT NULL DEFAULT '0',
  `validacion_automatica_estado` enum('Pendiente','Valido','Invalido','No aplica') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'No aplica',
  `fecha_validacion_automatica` datetime DEFAULT NULL,
  `observaciones` text COLLATE utf8mb4_unicode_ci,
  `fecha_carga` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `fecha_revision` datetime DEFAULT NULL,
  `revisado_por` int DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id_documento_alumno`),
  KEY `fk_documento_alumno_revisado_por` (`revisado_por`),
  KEY `idx_documento_alumno_expediente` (`id_expediente`),
  KEY `idx_documento_alumno_estado` (`estado_documento`),
  KEY `idx_documento_alumno_tipo` (`id_tipo_documento_alumno`),
  CONSTRAINT `fk_documento_alumno_expediente` FOREIGN KEY (`id_expediente`) REFERENCES `expediente_alumno` (`id_expediente`),
  CONSTRAINT `fk_documento_alumno_revisado_por` FOREIGN KEY (`revisado_por`) REFERENCES `usuario` (`id_usuario`),
  CONSTRAINT `fk_documento_alumno_tipo` FOREIGN KEY (`id_tipo_documento_alumno`) REFERENCES `tipo_documento_alumno` (`id_tipo_documento_alumno`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `documento_empresa`
--

DROP TABLE IF EXISTS `documento_empresa`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `documento_empresa` (
  `id_documento_empresa` int NOT NULL AUTO_INCREMENT,
  `id_empresa` int NOT NULL,
  `id_tipo_documento_empresa` int NOT NULL,
  `nombre_archivo` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `ruta_archivo` varchar(500) COLLATE utf8mb4_unicode_ci NOT NULL,
  `estado_documento` enum('Pendiente','Aprobado','Con observaciones','Rechazado') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'Pendiente',
  `observaciones` text COLLATE utf8mb4_unicode_ci,
  `fecha_subida` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `fecha_revision` datetime DEFAULT NULL,
  `revisado_por` int DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id_documento_empresa`),
  KEY `fk_documento_empresa_revisado_por` (`revisado_por`),
  KEY `idx_documento_empresa_empresa` (`id_empresa`),
  KEY `idx_documento_empresa_estado` (`estado_documento`),
  KEY `idx_documento_empresa_tipo` (`id_tipo_documento_empresa`),
  CONSTRAINT `fk_documento_empresa_empresa` FOREIGN KEY (`id_empresa`) REFERENCES `empresa` (`id_empresa`),
  CONSTRAINT `fk_documento_empresa_revisado_por` FOREIGN KEY (`revisado_por`) REFERENCES `usuario` (`id_usuario`),
  CONSTRAINT `fk_documento_empresa_tipo` FOREIGN KEY (`id_tipo_documento_empresa`) REFERENCES `tipo_documento_empresa` (`id_tipo_documento_empresa`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `empresa`
--

DROP TABLE IF EXISTS `empresa`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `empresa` (
  `id_empresa` int NOT NULL AUTO_INCREMENT,
  `nombre_empresa` varchar(180) COLLATE utf8mb4_unicode_ci NOT NULL,
  `rfc` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `giro` varchar(150) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `domicilio` text COLLATE utf8mb4_unicode_ci,
  `telefono` varchar(30) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `correo_contacto` varchar(150) COLLATE utf8mb4_unicode_ci NOT NULL,
  `tipo_tramite` enum('Convenio','Vinculacion') COLLATE utf8mb4_unicode_ci NOT NULL,
  `estado_empresa` enum('Solicitante','Pendiente','Rechazada','Activa','Suspendida','Inactiva') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'Solicitante',
  `fecha_registro` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id_empresa`),
  UNIQUE KEY `rfc` (`rfc`),
  KEY `idx_empresa_estado` (`estado_empresa`),
  KEY `idx_empresa_tipo_tramite` (`tipo_tramite`),
  KEY `idx_empresa_correo_contacto` (`correo_contacto`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `evaluacion_alumno_empresa`
--

DROP TABLE IF EXISTS `evaluacion_alumno_empresa`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `evaluacion_alumno_empresa` (
  `id_evaluacion_alumno_empresa` int NOT NULL AUTO_INCREMENT,
  `id_asignacion` int NOT NULL,
  `id_alumno` int NOT NULL,
  `calificacion` decimal(5,2) DEFAULT NULL,
  `respuestas` json DEFAULT NULL,
  `incidencias_detectadas` json DEFAULT NULL,
  `comentarios` text COLLATE utf8mb4_unicode_ci,
  `fecha_evaluacion` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id_evaluacion_alumno_empresa`),
  UNIQUE KEY `id_asignacion` (`id_asignacion`),
  KEY `idx_eval_alumno_empresa_alumno` (`id_alumno`),
  CONSTRAINT `fk_eval_alumno_empresa_alumno` FOREIGN KEY (`id_alumno`) REFERENCES `alumno` (`id_alumno`),
  CONSTRAINT `fk_eval_alumno_empresa_asignacion` FOREIGN KEY (`id_asignacion`) REFERENCES `asignacion` (`id_asignacion`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `evaluacion_practica`
--

DROP TABLE IF EXISTS `evaluacion_practica`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `evaluacion_practica` (
  `id_evaluacion` int NOT NULL AUTO_INCREMENT,
  `id_asignacion` int NOT NULL,
  `id_usuario_evaluador` int NOT NULL,
  `tipo_evaluacion` enum('Asesor','Empresa') COLLATE utf8mb4_unicode_ci NOT NULL,
  `calificacion` decimal(5,2) DEFAULT NULL,
  `comentarios` text COLLATE utf8mb4_unicode_ci,
  `fecha_evaluacion` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id_evaluacion`),
  UNIQUE KEY `uq_evaluacion_asignacion_tipo` (`id_asignacion`,`tipo_evaluacion`),
  KEY `idx_evaluacion_usuario` (`id_usuario_evaluador`),
  CONSTRAINT `fk_evaluacion_asignacion` FOREIGN KEY (`id_asignacion`) REFERENCES `asignacion` (`id_asignacion`),
  CONSTRAINT `fk_evaluacion_usuario` FOREIGN KEY (`id_usuario_evaluador`) REFERENCES `usuario` (`id_usuario`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `expediente_alumno`
--

DROP TABLE IF EXISTS `expediente_alumno`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `expediente_alumno` (
  `id_expediente` int NOT NULL AUTO_INCREMENT,
  `id_alumno` int NOT NULL,
  `id_convocatoria` int NOT NULL,
  `estado_expediente` enum('Pendiente','En Revision','Aprobado','Rechazado') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'Pendiente',
  `fecha_creacion` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `fecha_actualizacion` datetime DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id_expediente`),
  UNIQUE KEY `uq_expediente_alumno_convocatoria` (`id_alumno`,`id_convocatoria`),
  KEY `fk_expediente_convocatoria` (`id_convocatoria`),
  KEY `idx_expediente_estado` (`estado_expediente`),
  CONSTRAINT `fk_expediente_alumno` FOREIGN KEY (`id_alumno`) REFERENCES `alumno` (`id_alumno`),
  CONSTRAINT `fk_expediente_convocatoria` FOREIGN KEY (`id_convocatoria`) REFERENCES `convocatoria` (`id_convocatoria`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `formato_documento_alumno`
--

DROP TABLE IF EXISTS `formato_documento_alumno`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `formato_documento_alumno` (
  `id_formato_documento_alumno` int NOT NULL AUTO_INCREMENT,
  `id_tipo_documento_alumno` int NOT NULL,
  `nombre_archivo` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `ruta_archivo` varchar(500) COLLATE utf8mb4_unicode_ci NOT NULL,
  `mime_type` varchar(120) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `descripcion` text COLLATE utf8mb4_unicode_ci,
  `activo` tinyint(1) NOT NULL DEFAULT '1',
  `fecha_actualizacion` datetime DEFAULT NULL,
  `subido_por` int DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id_formato_documento_alumno`),
  KEY `fk_formato_alumno_subido_por` (`subido_por`),
  KEY `idx_formato_alumno_tipo` (`id_tipo_documento_alumno`),
  KEY `idx_formato_alumno_activo` (`activo`),
  CONSTRAINT `fk_formato_alumno_subido_por` FOREIGN KEY (`subido_por`) REFERENCES `usuario` (`id_usuario`),
  CONSTRAINT `fk_formato_alumno_tipo` FOREIGN KEY (`id_tipo_documento_alumno`) REFERENCES `tipo_documento_alumno` (`id_tipo_documento_alumno`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `formato_empresa`
--

DROP TABLE IF EXISTS `formato_empresa`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `formato_empresa` (
  `id_formato_empresa` int NOT NULL AUTO_INCREMENT,
  `id_tipo_documento_empresa` int NOT NULL,
  `nombre_archivo` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `ruta_archivo` varchar(500) COLLATE utf8mb4_unicode_ci NOT NULL,
  `version` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `activo` tinyint(1) NOT NULL DEFAULT '1',
  `fecha_subida` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `subido_por` int DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id_formato_empresa`),
  KEY `fk_formato_empresa_subido_por` (`subido_por`),
  KEY `idx_formato_empresa_tipo` (`id_tipo_documento_empresa`),
  KEY `idx_formato_empresa_activo` (`activo`),
  CONSTRAINT `fk_formato_empresa_subido_por` FOREIGN KEY (`subido_por`) REFERENCES `usuario` (`id_usuario`),
  CONSTRAINT `fk_formato_empresa_tipo` FOREIGN KEY (`id_tipo_documento_empresa`) REFERENCES `tipo_documento_empresa` (`id_tipo_documento_empresa`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `horas_practica`
--

DROP TABLE IF EXISTS `horas_practica`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `horas_practica` (
  `id_horas` int NOT NULL AUTO_INCREMENT,
  `id_asignacion` int NOT NULL,
  `fecha` date NOT NULL,
  `horas_realizadas` decimal(5,2) NOT NULL,
  `actividad` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `evidencia_archivo` varchar(500) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `estado_horas` enum('Pendiente','Aprobada','Rechazada') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'Pendiente',
  `observaciones` text COLLATE utf8mb4_unicode_ci,
  `fecha_registro` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `fecha_revision` datetime DEFAULT NULL,
  `revisado_por` int DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id_horas`),
  KEY `fk_horas_revisado_por` (`revisado_por`),
  KEY `idx_horas_asignacion` (`id_asignacion`),
  KEY `idx_horas_estado` (`estado_horas`),
  KEY `idx_horas_fecha` (`fecha`),
  CONSTRAINT `fk_horas_asignacion` FOREIGN KEY (`id_asignacion`) REFERENCES `asignacion` (`id_asignacion`),
  CONSTRAINT `fk_horas_revisado_por` FOREIGN KEY (`revisado_por`) REFERENCES `usuario` (`id_usuario`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `incidencia_practica`
--

DROP TABLE IF EXISTS `incidencia_practica`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `incidencia_practica` (
  `id_incidencia` int NOT NULL AUTO_INCREMENT,
  `id_asignacion` int NOT NULL,
  `id_usuario_reportante` int DEFAULT NULL,
  `reportante` enum('Alumno','Empresa','Asesor','Coordinacion') COLLATE utf8mb4_unicode_ci NOT NULL,
  `tipo_incidencia` varchar(150) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `prioridad` enum('Baja','Media','Alta') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'Media',
  `descripcion` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `estado` enum('Abierta','En seguimiento','Resuelta','Cerrada') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'Abierta',
  `respuesta_coordinacion` text COLLATE utf8mb4_unicode_ci,
  `fecha_reporte` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `fecha_actualizacion` datetime DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id_incidencia`),
  KEY `fk_incidencia_usuario` (`id_usuario_reportante`),
  KEY `idx_incidencia_asignacion` (`id_asignacion`),
  KEY `idx_incidencia_estado` (`estado`),
  KEY `idx_incidencia_prioridad` (`prioridad`),
  CONSTRAINT `fk_incidencia_asignacion` FOREIGN KEY (`id_asignacion`) REFERENCES `asignacion` (`id_asignacion`),
  CONSTRAINT `fk_incidencia_usuario` FOREIGN KEY (`id_usuario_reportante`) REFERENCES `usuario` (`id_usuario`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `liberacion_practica`
--

DROP TABLE IF EXISTS `liberacion_practica`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `liberacion_practica` (
  `id_liberacion` int NOT NULL AUTO_INCREMENT,
  `id_asignacion` int NOT NULL,
  `fecha_liberacion` datetime DEFAULT NULL,
  `documento_liberacion` varchar(500) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `estado_liberacion` enum('Pendiente','Emitida') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'Pendiente',
  `observaciones` text COLLATE utf8mb4_unicode_ci,
  `emitido_por` int DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id_liberacion`),
  UNIQUE KEY `id_asignacion` (`id_asignacion`),
  KEY `fk_liberacion_emitido_por` (`emitido_por`),
  KEY `idx_liberacion_estado` (`estado_liberacion`),
  CONSTRAINT `fk_liberacion_asignacion` FOREIGN KEY (`id_asignacion`) REFERENCES `asignacion` (`id_asignacion`),
  CONSTRAINT `fk_liberacion_emitido_por` FOREIGN KEY (`emitido_por`) REFERENCES `usuario` (`id_usuario`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `notificacion`
--

DROP TABLE IF EXISTS `notificacion`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `notificacion` (
  `id_notificacion` int NOT NULL AUTO_INCREMENT,
  `id_usuario` int NOT NULL,
  `titulo` varchar(150) COLLATE utf8mb4_unicode_ci NOT NULL,
  `mensaje` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `tipo` enum('Info','Exito','Advertencia','Error','Accion') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'Info',
  `categoria` enum('Sistema','Empresa','Alumno','Documento','Convenio','Vinculacion','Vacante','Convocatoria','Asignacion','Seguimiento','Incidencia','Liberacion','Reporte','Evaluacion') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'Sistema',
  `prioridad` enum('Baja','Media','Alta','Critica') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'Media',
  `modulo` varchar(80) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `entidad` varchar(80) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `id_entidad` int DEFAULT NULL,
  `url_destino` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `requiere_accion` tinyint(1) NOT NULL DEFAULT '0',
  `estado_accion` enum('Pendiente','Atendida','Descartada') COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `leida` tinyint(1) NOT NULL DEFAULT '0',
  `fecha_creacion` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `fecha_lectura` datetime DEFAULT NULL,
  `enviada_correo` tinyint(1) NOT NULL DEFAULT '0',
  `fecha_envio_correo` datetime DEFAULT NULL,
  `error_correo` text COLLATE utf8mb4_unicode_ci,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id_notificacion`),
  KEY `idx_notificacion_usuario_leida` (`id_usuario`,`leida`),
  KEY `idx_notificacion_usuario_fecha` (`id_usuario`,`fecha_creacion`),
  KEY `idx_notificacion_categoria` (`categoria`),
  KEY `idx_notificacion_entidad` (`entidad`,`id_entidad`),
  KEY `idx_notificacion_accion` (`requiere_accion`,`estado_accion`),
  CONSTRAINT `fk_notificacion_usuario` FOREIGN KEY (`id_usuario`) REFERENCES `usuario` (`id_usuario`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `observacion_documento_alumno`
--

DROP TABLE IF EXISTS `observacion_documento_alumno`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `observacion_documento_alumno` (
  `id_observacion` int NOT NULL AUTO_INCREMENT,
  `id_documento_alumno` int NOT NULL,
  `id_usuario` int NOT NULL,
  `descripcion` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `tipo_observacion` enum('Documento observado','Corrección solicitada','Documento rechazado','Revisión manual') COLLATE utf8mb4_unicode_ci NOT NULL,
  `fecha_observacion` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id_observacion`),
  KEY `fk_observacion_usuario` (`id_usuario`),
  KEY `idx_observacion_documento` (`id_documento_alumno`),
  CONSTRAINT `fk_observacion_doc_alumno` FOREIGN KEY (`id_documento_alumno`) REFERENCES `documento_alumno` (`id_documento_alumno`),
  CONSTRAINT `fk_observacion_usuario` FOREIGN KEY (`id_usuario`) REFERENCES `usuario` (`id_usuario`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `participacion_empresa_convocatoria`
--

DROP TABLE IF EXISTS `participacion_empresa_convocatoria`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `participacion_empresa_convocatoria` (
  `id_participacion` int NOT NULL AUTO_INCREMENT,
  `id_empresa` int NOT NULL,
  `id_convocatoria` int NOT NULL,
  `estado` enum('Pendiente','Aceptada','Rechazada','Cerrada') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'Pendiente',
  `fecha_solicitud` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `fecha_revision` datetime DEFAULT NULL,
  `revisada_por` int DEFAULT NULL,
  `observaciones` text COLLATE utf8mb4_unicode_ci,
  `motivo_rechazo` text COLLATE utf8mb4_unicode_ci,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id_participacion`),
  UNIQUE KEY `uq_empresa_convocatoria` (`id_empresa`,`id_convocatoria`),
  KEY `fk_participacion_revisada_por` (`revisada_por`),
  KEY `idx_participacion_estado` (`estado`),
  KEY `idx_participacion_convocatoria` (`id_convocatoria`),
  CONSTRAINT `fk_participacion_convocatoria` FOREIGN KEY (`id_convocatoria`) REFERENCES `convocatoria` (`id_convocatoria`),
  CONSTRAINT `fk_participacion_empresa` FOREIGN KEY (`id_empresa`) REFERENCES `empresa` (`id_empresa`),
  CONSTRAINT `fk_participacion_revisada_por` FOREIGN KEY (`revisada_por`) REFERENCES `usuario` (`id_usuario`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `personal_interno`
--

DROP TABLE IF EXISTS `personal_interno`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `personal_interno` (
  `id_personal` int NOT NULL AUTO_INCREMENT,
  `id_usuario` int NOT NULL,
  `nombre` varchar(120) COLLATE utf8mb4_unicode_ci NOT NULL,
  `apellido_paterno` varchar(120) COLLATE utf8mb4_unicode_ci NOT NULL,
  `apellido_materno` varchar(120) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `departamento` varchar(150) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `cargo` varchar(150) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `telefono` varchar(30) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id_personal`),
  UNIQUE KEY `id_usuario` (`id_usuario`),
  CONSTRAINT `fk_personal_usuario` FOREIGN KEY (`id_usuario`) REFERENCES `usuario` (`id_usuario`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `reporte_practica`
--

DROP TABLE IF EXISTS `reporte_practica`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `reporte_practica` (
  `id_reporte` int NOT NULL AUTO_INCREMENT,
  `id_asignacion` int NOT NULL,
  `tipo_reporte` enum('Parcial','Final','Otro') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'Parcial',
  `titulo` varchar(180) COLLATE utf8mb4_unicode_ci NOT NULL,
  `descripcion` text COLLATE utf8mb4_unicode_ci,
  `archivo` varchar(500) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `fecha_entrega` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `estado_reporte` enum('Pendiente','Aprobado','Rechazado') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'Pendiente',
  `calificacion` decimal(5,2) DEFAULT NULL,
  `observacion_asesor` text COLLATE utf8mb4_unicode_ci,
  `fecha_revision` datetime DEFAULT NULL,
  `revisado_por` int DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id_reporte`),
  KEY `fk_reporte_revisado_por` (`revisado_por`),
  KEY `idx_reporte_asignacion` (`id_asignacion`),
  KEY `idx_reporte_estado` (`estado_reporte`),
  KEY `idx_reporte_tipo` (`tipo_reporte`),
  CONSTRAINT `fk_reporte_asignacion` FOREIGN KEY (`id_asignacion`) REFERENCES `asignacion` (`id_asignacion`),
  CONSTRAINT `fk_reporte_revisado_por` FOREIGN KEY (`revisado_por`) REFERENCES `usuario` (`id_usuario`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `responsable_empresa`
--

DROP TABLE IF EXISTS `responsable_empresa`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `responsable_empresa` (
  `id_responsable` int NOT NULL AUTO_INCREMENT,
  `id_empresa` int NOT NULL,
  `id_usuario` int DEFAULT NULL,
  `nombre` varchar(120) COLLATE utf8mb4_unicode_ci NOT NULL,
  `apellido_paterno` varchar(120) COLLATE utf8mb4_unicode_ci NOT NULL,
  `apellido_materno` varchar(120) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `cargo` varchar(150) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `telefono` varchar(30) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `correo` varchar(150) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id_responsable`),
  KEY `idx_responsable_empresa` (`id_empresa`),
  KEY `idx_responsable_usuario` (`id_usuario`),
  CONSTRAINT `fk_responsable_empresa` FOREIGN KEY (`id_empresa`) REFERENCES `empresa` (`id_empresa`),
  CONSTRAINT `fk_responsable_usuario` FOREIGN KEY (`id_usuario`) REFERENCES `usuario` (`id_usuario`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `rol`
--

DROP TABLE IF EXISTS `rol`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `rol` (
  `id_rol` int NOT NULL AUTO_INCREMENT,
  `nombre` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `descripcion` text COLLATE utf8mb4_unicode_ci,
  `activo` tinyint(1) NOT NULL DEFAULT '1',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id_rol`),
  UNIQUE KEY `nombre` (`nombre`)
) ENGINE=InnoDB AUTO_INCREMENT=8 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `seleccion_empresa`
--

DROP TABLE IF EXISTS `seleccion_empresa`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `seleccion_empresa` (
  `id_seleccion` int NOT NULL AUTO_INCREMENT,
  `id_alumno` int NOT NULL,
  `id_convocatoria` int NOT NULL,
  `id_vacante` int NOT NULL,
  `prioridad` int NOT NULL,
  `estado` enum('Registrada','Cancelada') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'Registrada',
  `seleccion_activa` tinyint GENERATED ALWAYS AS ((case when (`estado` = _utf8mb4'Registrada') then 1 else NULL end)) STORED,
  `observaciones` text COLLATE utf8mb4_unicode_ci,
  `fecha_seleccion` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `fecha_revision` datetime DEFAULT NULL,
  `revisado_por` int DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id_seleccion`),
  UNIQUE KEY `uq_seleccion_prioridad_activa` (`id_alumno`,`id_convocatoria`,`prioridad`,`seleccion_activa`),
  UNIQUE KEY `uq_seleccion_vacante_activa` (`id_alumno`,`id_convocatoria`,`id_vacante`,`seleccion_activa`),
  KEY `fk_seleccion_revisado_por` (`revisado_por`),
  KEY `idx_seleccion_alumno` (`id_alumno`),
  KEY `idx_seleccion_convocatoria` (`id_convocatoria`),
  KEY `idx_seleccion_vacante` (`id_vacante`),
  KEY `idx_seleccion_estado` (`estado`),
  CONSTRAINT `fk_seleccion_alumno` FOREIGN KEY (`id_alumno`) REFERENCES `alumno` (`id_alumno`),
  CONSTRAINT `fk_seleccion_convocatoria` FOREIGN KEY (`id_convocatoria`) REFERENCES `convocatoria` (`id_convocatoria`),
  CONSTRAINT `fk_seleccion_revisado_por` FOREIGN KEY (`revisado_por`) REFERENCES `usuario` (`id_usuario`),
  CONSTRAINT `fk_seleccion_vacante` FOREIGN KEY (`id_vacante`) REFERENCES `vacante` (`id_vacante`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `solicitud_empresa`
--

DROP TABLE IF EXISTS `solicitud_empresa`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `solicitud_empresa` (
  `id_solicitud_empresa` int NOT NULL AUTO_INCREMENT,
  `id_empresa` int NOT NULL,
  `tipo_tramite_solicitado` enum('Convenio','Vinculacion') COLLATE utf8mb4_unicode_ci NOT NULL,
  `estado_solicitud` enum('Recibida','En revision','Aceptada','Rechazada') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'Recibida',
  `motivo_rechazo` text COLLATE utf8mb4_unicode_ci,
  `observaciones` text COLLATE utf8mb4_unicode_ci,
  `fecha_solicitud` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `fecha_revision` datetime DEFAULT NULL,
  `revisada_por` int DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id_solicitud_empresa`),
  KEY `fk_solicitud_revisada_por` (`revisada_por`),
  KEY `idx_solicitud_empresa` (`id_empresa`),
  KEY `idx_solicitud_estado` (`estado_solicitud`),
  CONSTRAINT `fk_solicitud_empresa` FOREIGN KEY (`id_empresa`) REFERENCES `empresa` (`id_empresa`),
  CONSTRAINT `fk_solicitud_revisada_por` FOREIGN KEY (`revisada_por`) REFERENCES `usuario` (`id_usuario`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `tipo_documento_alumno`
--

DROP TABLE IF EXISTS `tipo_documento_alumno`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `tipo_documento_alumno` (
  `id_tipo_documento_alumno` int NOT NULL AUTO_INCREMENT,
  `nombre` varchar(180) COLLATE utf8mb4_unicode_ci NOT NULL,
  `descripcion` text COLLATE utf8mb4_unicode_ci,
  `instrucciones` text COLLATE utf8mb4_unicode_ci,
  `etapa` enum('Elegibilidad','Expediente','SeleccionEmpresa','Asignacion','AsignacionFirmada','Liberacion') COLLATE utf8mb4_unicode_ci NOT NULL,
  `bloque` int NOT NULL DEFAULT '1',
  `obligatorio` tinyint(1) NOT NULL DEFAULT '1',
  `activo` tinyint(1) NOT NULL DEFAULT '1',
  `requiere_formato` tinyint(1) NOT NULL DEFAULT '0',
  `requiere_generacion` tinyint(1) NOT NULL DEFAULT '0',
  `codigo_generacion` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id_tipo_documento_alumno`),
  KEY `idx_tipo_doc_alumno_etapa` (`etapa`),
  KEY `idx_tipo_doc_alumno_bloque` (`bloque`),
  KEY `idx_tipo_doc_alumno_activo` (`activo`)
) ENGINE=InnoDB AUTO_INCREMENT=9 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `tipo_documento_empresa`
--

DROP TABLE IF EXISTS `tipo_documento_empresa`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `tipo_documento_empresa` (
  `id_tipo_documento_empresa` int NOT NULL AUTO_INCREMENT,
  `nombre` varchar(180) COLLATE utf8mb4_unicode_ci NOT NULL,
  `descripcion` text COLLATE utf8mb4_unicode_ci,
  `etapa` enum('Documentacion','Convenio','Vinculacion') COLLATE utf8mb4_unicode_ci NOT NULL,
  `obligatorio` tinyint(1) NOT NULL DEFAULT '1',
  `activo` tinyint(1) NOT NULL DEFAULT '1',
  `requiere_formato` tinyint(1) NOT NULL DEFAULT '0',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id_tipo_documento_empresa`),
  KEY `idx_tipo_doc_empresa_etapa` (`etapa`),
  KEY `idx_tipo_doc_empresa_activo` (`activo`)
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `tipo_practica`
--

DROP TABLE IF EXISTS `tipo_practica`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `tipo_practica` (
  `id_tipo_practica` int NOT NULL AUTO_INCREMENT,
  `nombre` varchar(120) COLLATE utf8mb4_unicode_ci NOT NULL,
  `semestre_requerido` int DEFAULT NULL,
  `creditos_minimos` int NOT NULL DEFAULT '0',
  `horas_requeridas` int NOT NULL DEFAULT '0',
  `orden` int DEFAULT NULL,
  `activo` tinyint(1) NOT NULL DEFAULT '1',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id_tipo_practica`),
  UNIQUE KEY `nombre` (`nombre`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `usuario`
--

DROP TABLE IF EXISTS `usuario`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `usuario` (
  `id_usuario` int NOT NULL AUTO_INCREMENT,
  `correo` varchar(150) COLLATE utf8mb4_unicode_ci NOT NULL,
  `password_hash` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `id_rol` int NOT NULL,
  `estado` enum('Activo','Inactivo') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'Activo',
  `debe_cambiar_password` tinyint(1) NOT NULL DEFAULT '0',
  `fecha_cambio_password` datetime DEFAULT NULL,
  `fecha_reset_password` datetime DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id_usuario`),
  UNIQUE KEY `correo` (`correo`),
  KEY `fk_usuario_rol` (`id_rol`),
  CONSTRAINT `fk_usuario_rol` FOREIGN KEY (`id_rol`) REFERENCES `rol` (`id_rol`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `vacante`
--

DROP TABLE IF EXISTS `vacante`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `vacante` (
  `id_vacante` int NOT NULL AUTO_INCREMENT,
  `id_empresa` int NOT NULL,
  `id_convocatoria` int NOT NULL,
  `id_tipo_practica` int NOT NULL,
  `titulo` varchar(180) COLLATE utf8mb4_unicode_ci NOT NULL,
  `descripcion` text COLLATE utf8mb4_unicode_ci,
  `actividades` text COLLATE utf8mb4_unicode_ci,
  `requisitos` text COLLATE utf8mb4_unicode_ci,
  `cupos` int NOT NULL DEFAULT '1',
  `periodo` enum('Semestral','Cuatrimestral') COLLATE utf8mb4_unicode_ci NOT NULL,
  `estado_vacante` enum('Pendiente','Con observaciones','PrePadron','Activa','Rechazada','Cerrada') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'Pendiente',
  `observaciones` text COLLATE utf8mb4_unicode_ci,
  `fecha_creacion` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `fecha_revision` datetime DEFAULT NULL,
  `revisada_por` int DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id_vacante`),
  UNIQUE KEY `uq_vacante_empresa_convocatoria` (`id_empresa`,`id_convocatoria`),
  KEY `fk_vacante_revisada_por` (`revisada_por`),
  KEY `idx_vacante_estado` (`estado_vacante`),
  KEY `idx_vacante_periodo` (`periodo`),
  KEY `idx_vacante_convocatoria` (`id_convocatoria`),
  KEY `idx_vacante_tipo_practica` (`id_tipo_practica`),
  CONSTRAINT `fk_vacante_convocatoria` FOREIGN KEY (`id_convocatoria`) REFERENCES `convocatoria` (`id_convocatoria`),
  CONSTRAINT `fk_vacante_empresa` FOREIGN KEY (`id_empresa`) REFERENCES `empresa` (`id_empresa`),
  CONSTRAINT `fk_vacante_revisada_por` FOREIGN KEY (`revisada_por`) REFERENCES `usuario` (`id_usuario`),
  CONSTRAINT `fk_vacante_tipo_practica` FOREIGN KEY (`id_tipo_practica`) REFERENCES `tipo_practica` (`id_tipo_practica`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `vinculacion_empresa`
--

DROP TABLE IF EXISTS `vinculacion_empresa`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `vinculacion_empresa` (
  `id_vinculacion` int NOT NULL AUTO_INCREMENT,
  `id_empresa` int NOT NULL,
  `estado_vinculacion` enum('Pendiente','Aprobada','Por vencer','Vencida','Rechazada') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'Pendiente',
  `fecha_inicio` date DEFAULT NULL,
  `fecha_fin` date DEFAULT NULL,
  `es_actual` tinyint(1) NOT NULL DEFAULT '0',
  `id_empresa_actual` int GENERATED ALWAYS AS ((case when (`es_actual` = 1) then `id_empresa` else NULL end)) STORED,
  `observaciones` text COLLATE utf8mb4_unicode_ci,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id_vinculacion`),
  UNIQUE KEY `uq_vinculacion_actual_empresa` (`id_empresa_actual`),
  KEY `idx_vinculacion_empresa` (`id_empresa`),
  KEY `idx_vinculacion_estado` (`estado_vinculacion`),
  CONSTRAINT `fk_vinculacion_empresa` FOREIGN KEY (`id_empresa`) REFERENCES `empresa` (`id_empresa`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dump completed on 2026-07-17 16:14:21
