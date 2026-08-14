-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Servidor: 127.0.0.1
-- Tiempo de generación: 14-08-2026 a las 16:57:04
-- Versión del servidor: 10.4.32-MariaDB
-- Versión de PHP: 8.2.12

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Base de datos: `pizzeria_niko_1`
--

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `bebidas`
--

CREATE TABLE `bebidas` (
  `id_bebida` int(11) NOT NULL,
  `nombre` text NOT NULL,
  `precio` float NOT NULL,
  `descripcion` text NOT NULL,
  `estado` enum('Activo','Inactivo') NOT NULL,
  `url` varchar(255) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_spanish_ci;

--
-- Volcado de datos para la tabla `bebidas`
--

INSERT INTO `bebidas` (`id_bebida`, `nombre`, `precio`, `descripcion`, `estado`, `url`) VALUES
(1, 'Pepsi', 2, '2 litros', 'Activo', '');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `categoria_pizza`
--

CREATE TABLE `categoria_pizza` (
  `id_categoria_pizza` int(11) NOT NULL,
  `categoria` text NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_spanish_ci;

--
-- Volcado de datos para la tabla `categoria_pizza`
--

INSERT INTO `categoria_pizza` (`id_categoria_pizza`, `categoria`) VALUES
(1, 'Normal'),
(2, 'Familiar'),
(3, 'Gigante');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `cierres_caja`
--

CREATE TABLE `cierres_caja` (
  `id_cierre` int(11) NOT NULL,
  `id_usuario` int(11) NOT NULL,
  `fecha_hora` datetime DEFAULT current_timestamp(),
  `monto_efectivo_usd` decimal(10,2) DEFAULT 0.00,
  `monto_efectivo_bs` decimal(12,2) DEFAULT 0.00,
  `monto_punto_bs` decimal(12,2) DEFAULT 0.00,
  `monto_pago_movil_bs` decimal(12,2) DEFAULT 0.00,
  `total_usdt` decimal(10,2) DEFAULT 0.00,
  `num_ordenes` int(11) DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Volcado de datos para la tabla `cierres_caja`
--

INSERT INTO `cierres_caja` (`id_cierre`, `id_usuario`, `fecha_hora`, `monto_efectivo_usd`, `monto_efectivo_bs`, `monto_punto_bs`, `monto_pago_movil_bs`, `total_usdt`, `num_ordenes`) VALUES
(1, 4, '2026-08-14 10:11:54', 0.00, 0.00, 3855.36, 1542.14, 7.00, 2),
(2, 4, '2026-08-14 10:20:13', 0.00, 0.00, 0.00, 0.00, 0.00, 0),
(3, 4, '2026-08-14 10:21:59', 0.00, 0.00, 3855.36, 1542.14, 7.00, 2),
(4, 4, '2026-08-14 10:22:10', 0.00, 0.00, 3855.36, 1542.14, 7.00, 2),
(5, 4, '2026-08-14 10:22:41', 0.00, 0.00, 3855.36, 1542.14, 7.00, 2);

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `clientes`
--

CREATE TABLE `clientes` (
  `id_cliente` int(11) NOT NULL,
  `cedula` text NOT NULL,
  `nombre` text NOT NULL,
  `telefono` int(11) NOT NULL,
  `descripcion` text NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_spanish_ci;

--
-- Volcado de datos para la tabla `clientes`
--

INSERT INTO `clientes` (`id_cliente`, `cedula`, `nombre`, `telefono`, `descripcion`) VALUES
(1, '12345678', 'a', 11, 'd'),
(2, '123456', 'gol', 123456, ''),
(3, '1234567', 'ii', 123, '');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `configuracion_tasa`
--

CREATE TABLE `configuracion_tasa` (
  `id_config` int(11) NOT NULL,
  `tasa_api` float NOT NULL,
  `tasa_sistema` float NOT NULL,
  `anclado` tinyint(1) NOT NULL DEFAULT 0,
  `fecha_actualizacion` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_spanish_ci;

--
-- Volcado de datos para la tabla `configuracion_tasa`
--

INSERT INTO `configuracion_tasa` (`id_config`, `tasa_api`, `tasa_sistema`, `anclado`, `fecha_actualizacion`) VALUES
(1, 771.071, 771.071, 0, '2026-08-14 13:37:19');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `delivery`
--

CREATE TABLE `delivery` (
  `id_delivery` int(11) NOT NULL,
  `digitos` int(11) NOT NULL,
  `nombre` text NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_spanish_ci;

--
-- Volcado de datos para la tabla `delivery`
--

INSERT INTO `delivery` (`id_delivery`, `digitos`, `nombre`) VALUES
(1, 1234, 'gg'),
(2, 1236, 'ggg'),
(3, 1235, 'jfdd'),
(4, 1237, 'asd'),
(5, 1238, 'asd'),
(6, 7777, 'ff');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `detalle_venta_extras`
--

CREATE TABLE `detalle_venta_extras` (
  `id_detalle_extra` int(11) NOT NULL,
  `id_detalle` int(11) NOT NULL,
  `id_extra` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_spanish_ci;

--
-- Volcado de datos para la tabla `detalle_venta_extras`
--

INSERT INTO `detalle_venta_extras` (`id_detalle_extra`, `id_detalle`, `id_extra`) VALUES
(6, 11, 2),
(7, 17, 3),
(8, 20, 2),
(9, 19, 3),
(12, 21, 3),
(13, 21, 4),
(14, 22, 3),
(15, 22, 4),
(17, 26, 3),
(18, 26, 1),
(19, 27, 6),
(20, 28, 6),
(21, 29, 3),
(22, 30, 4),
(23, 55, 6);

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `extras`
--

CREATE TABLE `extras` (
  `id_extras` int(11) NOT NULL,
  `nombre` text NOT NULL,
  `precio` float NOT NULL,
  `id_categoria_pizza` int(11) NOT NULL,
  `estado` enum('Activo','Inactivo') NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_spanish_ci;

--
-- Volcado de datos para la tabla `extras`
--

INSERT INTO `extras` (`id_extras`, `nombre`, `precio`, `id_categoria_pizza`, `estado`) VALUES
(1, 'Extra Pepperonii', 4, 3, 'Activo'),
(2, 'Jalapeños', 3, 1, 'Activo'),
(3, 'Chiwi', 2, 1, 'Activo'),
(4, 'Jesse Heiman', 1, 1, 'Activo'),
(5, 'Extra', 2, 1, 'Activo'),
(6, 'qs', 2, 3, 'Activo');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `heladeria`
--

CREATE TABLE `heladeria` (
  `id_heladeria` int(11) NOT NULL,
  `nombre` text NOT NULL,
  `precio` float NOT NULL,
  `descripcion` text NOT NULL,
  `estado` enum('Activo','Inactivo') NOT NULL,
  `url` varchar(255) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_spanish_ci;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `pizza`
--

CREATE TABLE `pizza` (
  `id_pizza` int(11) NOT NULL,
  `nombre` text NOT NULL,
  `precio` float NOT NULL,
  `descripcion` text NOT NULL,
  `id_categoria_pizza` int(11) NOT NULL,
  `estado` enum('Activo','Inactivo') NOT NULL,
  `url` varchar(255) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_spanish_ci;

--
-- Volcado de datos para la tabla `pizza`
--

INSERT INTO `pizza` (`id_pizza`, `nombre`, `precio`, `descripcion`, `id_categoria_pizza`, `estado`, `url`) VALUES
(3, 'Pepe', 5, 'Quesito', 1, 'Activo', 'https://res.cloudinary.com/di9z6ke80/image/upload/f_auto,q_auto/v1/pizzas/cij3iflcavd8fxwmysho?_a=BAMAPqWO0'),
(4, 'Pizza con Doble Queso', 3, '', 2, 'Activo', 'https://res.cloudinary.com/di9z6ke80/image/upload/f_auto,q_auto/v1/pizzas/ztkm0nzj3bnv7gn40jel?_a=BAMAPqWO0'),
(5, 'Qs', 3, 's', 3, 'Activo', 'https://res.cloudinary.com/di9z6ke80/image/upload/f_auto,q_auto/v1/pizzas/ezgppgevx60si6qtftzz?_a=BAMAPqWO0'),
(6, 'pizzita', 7, 'Queso y Chiwi', 2, 'Activo', 'https://res.cloudinary.com/di9z6ke80/image/upload/f_auto,q_auto/v1/pizzas/wvk54kuuak0p6opm8irk?_a=BAMAPqWO0'),
(7, 'Pizza new', 2, 'Queso  y peperoni', 3, 'Activo', NULL);

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `sucursal`
--

CREATE TABLE `sucursal` (
  `id_sucursal` int(11) NOT NULL,
  `sucursal` text NOT NULL,
  `direccion` text NOT NULL,
  `estado` enum('Activo','Inactivo') NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_spanish_ci;

--
-- Volcado de datos para la tabla `sucursal`
--

INSERT INTO `sucursal` (`id_sucursal`, `sucursal`, `direccion`, `estado`) VALUES
(1, 'sucur', '', 'Activo'),
(2, 'Laberinto', 'Carrera 1', 'Activo'),
(3, 'Sucursal Oeste', 'Av 1', 'Activo');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `usuarios`
--

CREATE TABLE `usuarios` (
  `id_usuario` int(11) NOT NULL,
  `nombre_completo` text NOT NULL,
  `email` text NOT NULL,
  `password` text NOT NULL,
  `pin` text DEFAULT NULL,
  `id_sucursal` int(11) NOT NULL,
  `rol` enum('admin','chef','cashier','mesero','despachador') NOT NULL,
  `estado` enum('Activo','Inactivo') NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_spanish_ci;

--
-- Volcado de datos para la tabla `usuarios`
--

INSERT INTO `usuarios` (`id_usuario`, `nombre_completo`, `email`, `password`, `pin`, `id_sucursal`, `rol`, `estado`) VALUES
(1, 'juancito', 'admin@pizzeria.com', '$2b$10$QFXgzNNcDUjVlxzv7LTnzOrHsTHHVhd29uyYolLl18TGjtxgZLMza', NULL, 1, 'admin', 'Activo'),
(2, 'nn', 'nuevo@pizzeria.com', '$2b$10$QFXgzNNcDUjVlxzv7LTnzOrHsTHHVhd29uyYolLl18TGjtxgZLMza', NULL, 1, 'despachador', 'Activo'),
(3, 'María López', 'maria@pizzeria.com', '$2b$10$1B6DBxnyh8FMAzE093tP0OuiwCkXdD1u21KqEi9PxmnG0sgnEN3TS', NULL, 1, 'chef', 'Activo'),
(4, 'Carlos Rodríguez', 'carlos@pizzeria.com', '$2b$10$8kLDMPcK64RveiKjkU4NeeW0UpU5P8FHMKPQj5Q8vBbQxIUkkN0CO', '123', 1, 'cashier', 'Activo'),
(5, 'Sofia Torres', 'sofia@pizzeria.com', '$2b$10$qDN/.t0bL/5jQnEWPpDP8ehAD8wAbIYEaVgriCvr08sfv/7ONXbjK', NULL, 1, 'mesero', 'Activo'),
(6, 'Laura Jiménez', 'laura@pizzeria.com', '$2b$10$BzxMXWPl7NSMaWxbb/ASiuK5PO1BTvD0hy9AvQfenwAXwPdOtH3La', NULL, 1, 'despachador', 'Activo'),
(17, 'Jorge Curioso', 'jorge@pizzeria.com', '$2b$10$jsWCMjqSasUQkLxIGNrO6eTgtNwkNetr8jyzeeNNTgPggSpqX908O', NULL, 2, 'mesero', 'Activo'),
(18, 'Mick Jagger', 'jagger', '$2b$10$vjW4Mu2pF8VoXDOCmVKnhuWy9kJbFh01Jc8APRmm2g3rizv2KS52G', NULL, 2, 'despachador', 'Inactivo'),
(19, 'Mick Jagger', 'jagger@pizzeria.com', '$2b$10$vEsu84ObGeFHg10STsahTui.rM51sTZBSSKo1fLjGE9LMbL7lzajW', NULL, 2, 'chef', 'Activo'),
(20, 'Mick Jagger', 'jagger@pizzeria.com', '$2b$10$Ssg2/j7zTfOlzolNSiNuv.pc4jxyWa2FweXnZbn7A12Ecya5Ijrry', NULL, 1, 'chef', 'Activo');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `ventas`
--

CREATE TABLE `ventas` (
  `id_venta` int(11) NOT NULL,
  `id_cliente` int(11) NOT NULL,
  `id_usuario` int(11) NOT NULL,
  `id_delivery` int(11) DEFAULT NULL,
  `fecha_hora` timestamp NOT NULL DEFAULT current_timestamp(),
  `tasa_cambio` float NOT NULL,
  `monto_total_usd` float NOT NULL,
  `monto_total_bs` float NOT NULL,
  `despacho` enum('Local','Llevar','Delivery','Pick Up') NOT NULL,
  `estado` enum('Completado','Pendiente','Rechazado','Cerrado') NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_spanish_ci;

--
-- Volcado de datos para la tabla `ventas`
--

INSERT INTO `ventas` (`id_venta`, `id_cliente`, `id_usuario`, `id_delivery`, `fecha_hora`, `tasa_cambio`, `monto_total_usd`, `monto_total_bs`, `despacho`, `estado`) VALUES
(5, 1, 1, NULL, '2026-07-30 19:03:07', 744.23, 13.5, 10047.1, 'Local', 'Cerrado'),
(6, 1, 1, NULL, '2026-07-30 19:07:10', 744.23, 28, 20838.3, 'Llevar', 'Cerrado'),
(7, 1, 1, NULL, '2026-07-30 19:08:29', 744.23, 36, 26792.2, 'Local', 'Cerrado'),
(11, 1, 1, NULL, '2026-07-30 19:17:14', 744.23, 16.5, 12279.7, 'Local', 'Cerrado'),
(12, 1, 1, NULL, '2026-07-30 19:57:03', 744.23, 13.5, 10047.1, 'Local', 'Cerrado'),
(13, 2, 1, NULL, '2026-07-30 19:57:46', 744.23, 13, 9674.94, 'Local', 'Cerrado'),
(14, 1, 1, NULL, '2026-07-31 14:30:42', 745.64, 15, 11184.6, 'Local', 'Cerrado'),
(15, 1, 1, NULL, '2026-07-31 20:01:16', 745.64, 5, 3728.19, 'Local', 'Cerrado'),
(16, 1, 1, NULL, '2026-08-02 01:09:22', 748.79, 12.8, 9584.47, 'Local', 'Cerrado'),
(17, 1, 1, NULL, '2026-08-02 16:03:29', 748.79, 8, 5990.29, 'Llevar', 'Cerrado'),
(18, 1, 1, NULL, '2026-08-02 15:59:36', 748.79, 16, 11980.6, 'Local', 'Cerrado'),
(19, 3, 1, NULL, '2026-08-02 22:58:20', 748.79, 7, 5241.5, 'Local', 'Cerrado'),
(20, 1, 1, NULL, '2026-08-02 23:54:23', 748.79, 9, 6739.08, '', 'Cerrado'),
(21, 1, 1, NULL, '2026-08-02 23:54:40', 748.79, 5, 3743.93, 'Local', 'Cerrado'),
(22, 2, 1, NULL, '2026-08-02 23:55:44', 748.79, 21.8, 16323.5, 'Local', 'Cerrado'),
(23, 3, 1, NULL, '2026-08-03 00:33:21', 748.79, 5, 3743.93, 'Local', 'Cerrado'),
(24, 2, 1, NULL, '2026-08-03 12:03:10', 748.79, 8, 5990.29, 'Local', 'Cerrado'),
(25, 3, 1, NULL, '2026-08-06 21:47:08', 755.9, 6, 4535.4, 'Local', 'Cerrado'),
(26, 3, 1, NULL, '2026-08-06 21:47:46', 755.9, 5, 3779.5, 'Llevar', 'Cerrado'),
(27, 3, 1, NULL, '2026-08-06 22:09:54', 755.9, 2, 1511.8, 'Local', 'Cerrado'),
(28, 3, 1, NULL, '2026-08-06 22:10:10', 755.9, 3, 2267.7, 'Local', 'Cerrado'),
(29, 3, 1, NULL, '2026-08-07 12:16:46', 755.9, 5, 3779.5, 'Local', 'Cerrado'),
(30, 1, 1, NULL, '2026-08-07 12:32:40', 755.9, 3, 2267.7, 'Llevar', 'Cerrado'),
(31, 1, 1, NULL, '2026-08-07 14:06:14', 755.9, 5, 3779.5, 'Llevar', 'Cerrado'),
(32, 3, 1, NULL, '2026-08-08 20:17:52', 757.54, 5, 3787.7, 'Pick Up', 'Cerrado'),
(33, 3, 1, NULL, '2026-08-08 20:20:09', 757.54, 5, 3787.7, 'Delivery', 'Cerrado'),
(34, 3, 1, NULL, '2026-08-10 08:55:09', 757.54, 5, 3787.7, 'Local', 'Cerrado'),
(35, 3, 1, NULL, '2026-08-10 08:55:26', 757.54, 5, 3787.7, 'Pick Up', 'Cerrado'),
(36, 3, 1, 1, '2026-08-10 08:55:44', 757.54, 5, 3787.7, 'Delivery', 'Cerrado'),
(37, 3, 1, NULL, '2026-08-10 09:53:40', 757.54, 5, 3787.7, 'Delivery', 'Cerrado'),
(38, 3, 1, NULL, '2026-08-10 09:55:56', 757.54, 5, 3787.7, 'Delivery', 'Cerrado'),
(39, 2, 1, NULL, '2026-08-10 09:57:53', 757.54, 5, 3787.7, 'Delivery', 'Cerrado'),
(40, 3, 1, NULL, '2026-08-10 10:01:51', 757.54, 5, 3787.7, 'Delivery', 'Cerrado'),
(41, 3, 1, NULL, '2026-08-10 10:03:03', 757.54, 5, 3787.7, 'Delivery', 'Cerrado'),
(42, 3, 1, NULL, '2026-08-10 10:03:27', 757.54, 5, 3787.7, 'Delivery', 'Cerrado'),
(43, 3, 1, NULL, '2026-08-10 10:09:38', 757.54, 5, 3787.7, 'Delivery', 'Cerrado'),
(44, 3, 1, NULL, '2026-08-10 10:11:45', 757.54, 5, 3787.7, 'Delivery', 'Cerrado'),
(45, 3, 1, NULL, '2026-08-10 10:36:45', 757.54, 5, 3787.7, 'Local', 'Cerrado'),
(46, 3, 1, NULL, '2026-08-10 10:40:55', 757.54, 5, 3787.7, 'Llevar', 'Cerrado'),
(47, 3, 1, 1, '2026-08-10 10:41:18', 757.54, 5, 3787.7, 'Delivery', 'Cerrado'),
(48, 3, 1, 1, '2026-08-10 10:47:14', 757.54, 5, 3787.7, 'Delivery', 'Cerrado'),
(49, 2, 1, 6, '2026-08-10 10:48:25', 757.54, 5, 3787.7, 'Pick Up', 'Cerrado'),
(50, 1, 1, NULL, '2026-08-10 12:24:09', 760, 5, 3800, 'Local', 'Cerrado'),
(51, 1, 1, NULL, '2026-08-10 22:23:02', 760, 5, 3800, 'Local', 'Cerrado'),
(52, 3, 1, NULL, '2026-08-13 20:14:31', 766.86, 5, 3834.3, 'Local', 'Cerrado'),
(53, 3, 1, NULL, '2026-08-14 13:38:15', 771.07, 5, 3855.36, 'Local', 'Cerrado'),
(54, 3, 1, NULL, '2026-08-14 13:38:44', 771.07, 2, 1542.14, 'Llevar', 'Cerrado');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `ventas_pagos`
--

CREATE TABLE `ventas_pagos` (
  `id_pago` int(11) NOT NULL,
  `id_venta` int(11) NOT NULL,
  `metodo_pago` enum('Punto','Pago_Movil','Efectivo') NOT NULL,
  `monto_usd` float NOT NULL,
  `monto_bs` float NOT NULL,
  `referencia` text DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_spanish_ci;

--
-- Volcado de datos para la tabla `ventas_pagos`
--

INSERT INTO `ventas_pagos` (`id_pago`, `id_venta`, `metodo_pago`, `monto_usd`, `monto_bs`, `referencia`) VALUES
(5, 5, 'Punto', 13.5, 10047.1, NULL),
(6, 6, 'Efectivo', 14.56, 10838.3, NULL),
(7, 6, 'Punto', 13.44, 10000, NULL),
(8, 7, 'Pago_Movil', 20.16, 15000, NULL),
(9, 7, 'Punto', 15.84, 11792.2, NULL),
(13, 11, 'Punto', 16.5, 12279.7, NULL),
(14, 12, 'Punto', 13.5, 10047.1, NULL),
(15, 13, 'Punto', 13, 9674.94, NULL),
(16, 14, 'Punto', 15, 11184.6, NULL),
(17, 15, 'Punto', 5, 3728.19, NULL),
(18, 16, 'Punto', 12.8, 9584.47, NULL),
(19, 17, 'Punto', 5, 3743.93, NULL),
(20, 18, 'Punto', 10, 7487.86, NULL),
(21, 18, '', 6, 4492.72, NULL),
(22, 19, 'Punto', 5, 3743.93, NULL),
(23, 17, '', 3, 2246.36, NULL),
(24, 19, '', 2, 1497.57, '444'),
(25, 19, '', 3, 2246.36, NULL),
(26, 19, 'Punto', 1, 748.79, NULL),
(27, 20, 'Efectivo', 9, 6739.08, NULL),
(28, 21, 'Punto', 5, 3743.93, NULL),
(29, 22, 'Pago_Movil', 1.45, 1082.04, NULL),
(30, 22, 'Punto', 13.35, 10000, NULL),
(31, 22, 'Punto', 3, 2246.36, NULL),
(32, 23, 'Punto', 3, 2246.36, NULL),
(33, 22, 'Punto', 4, 2995.15, NULL),
(34, 23, 'Punto', 2, 1497.57, NULL),
(35, 24, 'Punto', 8, 5990.29, NULL),
(36, 25, 'Punto', 6, 4535.4, NULL),
(37, 26, 'Efectivo', 5, 3779.5, NULL),
(38, 27, 'Punto', 2, 1511.8, NULL),
(39, 28, 'Punto', 3, 2267.7, NULL),
(40, 29, 'Punto', 5, 3779.5, NULL),
(41, 30, 'Punto', 3, 2267.7, NULL),
(42, 31, 'Punto', 5, 3779.5, NULL),
(43, 32, 'Punto', 5, 3787.7, NULL),
(44, 33, 'Punto', 5, 3787.7, NULL),
(45, 34, 'Punto', 5, 3787.7, NULL),
(46, 35, 'Punto', 5, 3787.7, NULL),
(47, 36, 'Punto', 5, 3787.7, NULL),
(48, 37, 'Punto', 5, 3787.7, NULL),
(49, 38, 'Punto', 5, 3787.7, NULL),
(50, 39, 'Pago_Movil', 5, 3787.7, NULL),
(51, 40, 'Punto', 5, 3787.7, NULL),
(52, 41, 'Pago_Movil', 5, 3787.7, NULL),
(53, 42, 'Punto', 5, 3787.7, NULL),
(54, 43, 'Punto', 5, 3787.7, NULL),
(55, 44, 'Punto', 5, 3787.7, NULL),
(56, 45, 'Punto', 5, 3787.7, NULL),
(57, 46, 'Punto', 5, 3787.7, NULL),
(58, 47, 'Punto', 5, 3787.7, NULL),
(59, 48, 'Punto', 5, 3787.7, NULL),
(60, 49, 'Punto', 5, 3787.7, NULL),
(61, 50, 'Punto', 0.99, 750, NULL),
(62, 50, 'Pago_Movil', 4.01, 3050, NULL),
(63, 51, 'Punto', 5, 3800, NULL),
(64, 52, 'Efectivo', 5, 3834.3, NULL),
(65, 53, 'Punto', 5, 3855.36, 'Bs'),
(66, 54, 'Pago_Movil', 2, 1542.14, 'Bs');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `venta_detalle`
--

CREATE TABLE `venta_detalle` (
  `id_detalle` int(11) NOT NULL,
  `id_venta` int(11) NOT NULL,
  `tipo_producto` enum('Pizza','Bebida','Helado') NOT NULL,
  `id_producto_origen` int(11) NOT NULL,
  `cantidad` int(11) NOT NULL,
  `monto_total` float NOT NULL,
  `nota` text DEFAULT NULL,
  `estado` enum('Pendiente','Preparado','Horno','Completado','Mesero','Despacho','pDespacho','Cerrado') NOT NULL DEFAULT 'Pendiente'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_spanish_ci;

--
-- Volcado de datos para la tabla `venta_detalle`
--

INSERT INTO `venta_detalle` (`id_detalle`, `id_venta`, `tipo_producto`, `id_producto_origen`, `cantidad`, `monto_total`, `nota`, `estado`) VALUES
(1, 5, 'Pizza', 6, 1, 13.5, '', 'Cerrado'),
(2, 6, 'Pizza', 5, 1, 13, '', 'Cerrado'),
(3, 6, 'Bebida', 3, 1, 1.5, '', 'Cerrado'),
(4, 6, 'Pizza', 6, 1, 13.5, '', 'Cerrado'),
(5, 7, 'Pizza', 5, 1, 13, '', 'Cerrado'),
(6, 7, 'Pizza', 7, 1, 17, '', 'Cerrado'),
(7, 7, 'Bebida', 8, 1, 6, '', 'Cerrado'),
(11, 11, 'Pizza', 3, 1, 16.5, 'Mucho queso', 'Cerrado'),
(12, 12, 'Pizza', 6, 1, 13.5, '', 'Cerrado'),
(13, 13, 'Pizza', 5, 1, 13, '', 'Cerrado'),
(14, 14, 'Pizza', 6, 1, 13.5, '', 'Cerrado'),
(15, 14, 'Bebida', 3, 1, 1.5, '', 'Cerrado'),
(16, 15, 'Pizza', 3, 1, 5, '', 'Cerrado'),
(17, 16, 'Pizza', 3, 1, 8, '', 'Cerrado'),
(18, 16, 'Pizza', 4, 1, 4.8, '', 'Cerrado'),
(19, 17, 'Pizza', 3, 1, 8, '', 'Cerrado'),
(20, 18, 'Pizza', 3, 2, 16, '', 'Cerrado'),
(21, 19, 'Pizza', 4, 1, 7, 'sd', 'Cerrado'),
(22, 20, 'Pizza', 3, 1, 9, '', 'Cerrado'),
(23, 21, 'Pizza', 3, 1, 5, '45', 'Cerrado'),
(24, 22, 'Pizza', 3, 1, 5, 'sin pitillo', 'Cerrado'),
(25, 22, 'Bebida', 1, 1, 2, 'sin pitillo', 'Cerrado'),
(26, 22, 'Pizza', 4, 1, 9.8, '', 'Cerrado'),
(27, 22, 'Pizza', 5, 1, 5, '', 'Cerrado'),
(28, 23, 'Pizza', 5, 1, 5, '', 'Cerrado'),
(29, 24, 'Pizza', 3, 1, 8, '', 'Cerrado'),
(30, 25, 'Pizza', 3, 1, 6, '', 'Cerrado'),
(31, 26, 'Pizza', 3, 1, 5, '', 'Cerrado'),
(32, 27, 'Bebida', 1, 1, 2, '', 'Cerrado'),
(33, 28, 'Pizza', 5, 1, 3, '', 'Cerrado'),
(34, 29, 'Pizza', 3, 1, 5, '', 'Cerrado'),
(35, 30, 'Pizza', 5, 1, 3, '', 'Cerrado'),
(36, 31, 'Pizza', 3, 1, 5, '', 'Cerrado'),
(37, 32, 'Pizza', 3, 1, 5, '', 'Cerrado'),
(38, 33, 'Pizza', 3, 1, 5, '', 'Cerrado'),
(39, 34, 'Pizza', 3, 1, 5, '', 'Cerrado'),
(40, 35, 'Pizza', 3, 1, 5, '', 'Cerrado'),
(41, 36, 'Pizza', 3, 1, 5, '', 'Cerrado'),
(42, 37, 'Pizza', 3, 1, 5, '', 'Cerrado'),
(43, 38, 'Pizza', 3, 1, 5, '', 'Cerrado'),
(44, 39, 'Pizza', 3, 1, 5, '', 'Cerrado'),
(45, 40, 'Pizza', 3, 1, 5, '', 'Cerrado'),
(46, 41, 'Pizza', 3, 1, 5, '', 'Cerrado'),
(47, 42, 'Pizza', 3, 1, 5, '', 'Cerrado'),
(48, 43, 'Pizza', 3, 1, 5, '', 'Cerrado'),
(49, 44, 'Pizza', 3, 1, 5, '', 'Cerrado'),
(50, 45, 'Pizza', 3, 1, 5, '', 'Cerrado'),
(51, 46, 'Pizza', 3, 1, 5, '', 'Cerrado'),
(52, 47, 'Pizza', 3, 1, 5, '', 'Cerrado'),
(53, 48, 'Pizza', 3, 1, 5, '', 'Cerrado'),
(54, 49, 'Pizza', 3, 1, 5, '', 'Cerrado'),
(55, 50, 'Pizza', 5, 1, 5, '', 'Cerrado'),
(56, 51, 'Pizza', 3, 1, 5, '', 'Cerrado'),
(57, 52, 'Pizza', 3, 1, 5, '', 'Cerrado'),
(58, 53, 'Pizza', 3, 1, 5, '', 'Cerrado'),
(59, 54, 'Bebida', 1, 1, 2, '', 'Cerrado');

--
-- Índices para tablas volcadas
--

--
-- Indices de la tabla `bebidas`
--
ALTER TABLE `bebidas`
  ADD PRIMARY KEY (`id_bebida`);

--
-- Indices de la tabla `categoria_pizza`
--
ALTER TABLE `categoria_pizza`
  ADD PRIMARY KEY (`id_categoria_pizza`);

--
-- Indices de la tabla `cierres_caja`
--
ALTER TABLE `cierres_caja`
  ADD PRIMARY KEY (`id_cierre`),
  ADD KEY `fk_cierre_usuario` (`id_usuario`);

--
-- Indices de la tabla `clientes`
--
ALTER TABLE `clientes`
  ADD PRIMARY KEY (`id_cliente`);

--
-- Indices de la tabla `configuracion_tasa`
--
ALTER TABLE `configuracion_tasa`
  ADD PRIMARY KEY (`id_config`);

--
-- Indices de la tabla `delivery`
--
ALTER TABLE `delivery`
  ADD PRIMARY KEY (`id_delivery`);

--
-- Indices de la tabla `detalle_venta_extras`
--
ALTER TABLE `detalle_venta_extras`
  ADD PRIMARY KEY (`id_detalle_extra`),
  ADD KEY `id_detalle` (`id_detalle`),
  ADD KEY `id_extra` (`id_extra`);

--
-- Indices de la tabla `extras`
--
ALTER TABLE `extras`
  ADD PRIMARY KEY (`id_extras`),
  ADD KEY `id_categoria_pizza` (`id_categoria_pizza`);

--
-- Indices de la tabla `heladeria`
--
ALTER TABLE `heladeria`
  ADD PRIMARY KEY (`id_heladeria`);

--
-- Indices de la tabla `pizza`
--
ALTER TABLE `pizza`
  ADD PRIMARY KEY (`id_pizza`),
  ADD KEY `id_categoria_pizza` (`id_categoria_pizza`);

--
-- Indices de la tabla `sucursal`
--
ALTER TABLE `sucursal`
  ADD PRIMARY KEY (`id_sucursal`);

--
-- Indices de la tabla `usuarios`
--
ALTER TABLE `usuarios`
  ADD PRIMARY KEY (`id_usuario`),
  ADD KEY `id_sucursal` (`id_sucursal`);

--
-- Indices de la tabla `ventas`
--
ALTER TABLE `ventas`
  ADD PRIMARY KEY (`id_venta`),
  ADD KEY `id_cliente` (`id_cliente`),
  ADD KEY `id_usuario` (`id_usuario`),
  ADD KEY `id_delivery` (`id_delivery`);

--
-- Indices de la tabla `ventas_pagos`
--
ALTER TABLE `ventas_pagos`
  ADD PRIMARY KEY (`id_pago`),
  ADD KEY `id_venta` (`id_venta`);

--
-- Indices de la tabla `venta_detalle`
--
ALTER TABLE `venta_detalle`
  ADD PRIMARY KEY (`id_detalle`),
  ADD KEY `id_venta` (`id_venta`),
  ADD KEY `id_producto_origen` (`id_producto_origen`);

--
-- AUTO_INCREMENT de las tablas volcadas
--

--
-- AUTO_INCREMENT de la tabla `bebidas`
--
ALTER TABLE `bebidas`
  MODIFY `id_bebida` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT de la tabla `categoria_pizza`
--
ALTER TABLE `categoria_pizza`
  MODIFY `id_categoria_pizza` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT de la tabla `cierres_caja`
--
ALTER TABLE `cierres_caja`
  MODIFY `id_cierre` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=6;

--
-- AUTO_INCREMENT de la tabla `clientes`
--
ALTER TABLE `clientes`
  MODIFY `id_cliente` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT de la tabla `configuracion_tasa`
--
ALTER TABLE `configuracion_tasa`
  MODIFY `id_config` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT de la tabla `delivery`
--
ALTER TABLE `delivery`
  MODIFY `id_delivery` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=7;

--
-- AUTO_INCREMENT de la tabla `detalle_venta_extras`
--
ALTER TABLE `detalle_venta_extras`
  MODIFY `id_detalle_extra` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=24;

--
-- AUTO_INCREMENT de la tabla `extras`
--
ALTER TABLE `extras`
  MODIFY `id_extras` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=7;

--
-- AUTO_INCREMENT de la tabla `heladeria`
--
ALTER TABLE `heladeria`
  MODIFY `id_heladeria` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de la tabla `pizza`
--
ALTER TABLE `pizza`
  MODIFY `id_pizza` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=8;

--
-- AUTO_INCREMENT de la tabla `sucursal`
--
ALTER TABLE `sucursal`
  MODIFY `id_sucursal` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT de la tabla `usuarios`
--
ALTER TABLE `usuarios`
  MODIFY `id_usuario` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=21;

--
-- AUTO_INCREMENT de la tabla `ventas`
--
ALTER TABLE `ventas`
  MODIFY `id_venta` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=55;

--
-- AUTO_INCREMENT de la tabla `ventas_pagos`
--
ALTER TABLE `ventas_pagos`
  MODIFY `id_pago` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=67;

--
-- AUTO_INCREMENT de la tabla `venta_detalle`
--
ALTER TABLE `venta_detalle`
  MODIFY `id_detalle` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=60;

--
-- Restricciones para tablas volcadas
--

--
-- Filtros para la tabla `cierres_caja`
--
ALTER TABLE `cierres_caja`
  ADD CONSTRAINT `fk_cierre_usuario` FOREIGN KEY (`id_usuario`) REFERENCES `usuarios` (`id_usuario`) ON UPDATE CASCADE;

--
-- Filtros para la tabla `detalle_venta_extras`
--
ALTER TABLE `detalle_venta_extras`
  ADD CONSTRAINT `dve_ibfk_1` FOREIGN KEY (`id_detalle`) REFERENCES `venta_detalle` (`id_detalle`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `dve_ibfk_2` FOREIGN KEY (`id_extra`) REFERENCES `extras` (`id_extras`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Filtros para la tabla `extras`
--
ALTER TABLE `extras`
  ADD CONSTRAINT `extras_ibfk_1` FOREIGN KEY (`id_categoria_pizza`) REFERENCES `categoria_pizza` (`id_categoria_pizza`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Filtros para la tabla `pizza`
--
ALTER TABLE `pizza`
  ADD CONSTRAINT `pizza_ibfk_1` FOREIGN KEY (`id_categoria_pizza`) REFERENCES `categoria_pizza` (`id_categoria_pizza`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Filtros para la tabla `usuarios`
--
ALTER TABLE `usuarios`
  ADD CONSTRAINT `usuarios_ibfk_1` FOREIGN KEY (`id_sucursal`) REFERENCES `sucursal` (`id_sucursal`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Filtros para la tabla `ventas`
--
ALTER TABLE `ventas`
  ADD CONSTRAINT `ventas_ibfk_1` FOREIGN KEY (`id_cliente`) REFERENCES `clientes` (`id_cliente`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `ventas_ibfk_2` FOREIGN KEY (`id_usuario`) REFERENCES `usuarios` (`id_usuario`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `ventas_ibfk_3` FOREIGN KEY (`id_delivery`) REFERENCES `delivery` (`id_delivery`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Filtros para la tabla `ventas_pagos`
--
ALTER TABLE `ventas_pagos`
  ADD CONSTRAINT `vp_ibfk_1` FOREIGN KEY (`id_venta`) REFERENCES `ventas` (`id_venta`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Filtros para la tabla `venta_detalle`
--
ALTER TABLE `venta_detalle`
  ADD CONSTRAINT `vd_ibfk_1` FOREIGN KEY (`id_venta`) REFERENCES `ventas` (`id_venta`) ON DELETE CASCADE ON UPDATE CASCADE;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
