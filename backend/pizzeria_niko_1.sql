-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Servidor: 127.0.0.1
-- Tiempo de generación: 30-07-2026 a las 22:07:30
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
  `descripcion` text NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_spanish_ci;

--
-- Volcado de datos para la tabla `bebidas`
--

INSERT INTO `bebidas` (`id_bebida`, `nombre`, `precio`, `descripcion`) VALUES
(1, 'Pepsi', 2, '2 litros');

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
(2, '123456', 'gol', 123456, '');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `delivery`
--

CREATE TABLE `delivery` (
  `id_delivery` int(11) NOT NULL,
  `digitos` int(11) NOT NULL,
  `nombre` text NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_spanish_ci;

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
(6, 11, 2);

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `extras`
--

CREATE TABLE `extras` (
  `id_extras` int(11) NOT NULL,
  `nombre` text NOT NULL,
  `precio` float NOT NULL,
  `id_categoria_pizza` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_spanish_ci;

--
-- Volcado de datos para la tabla `extras`
--

INSERT INTO `extras` (`id_extras`, `nombre`, `precio`, `id_categoria_pizza`) VALUES
(1, 'Extra Pepperoni', 2, 2),
(2, 'Jalapeños', 3, 1);

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `heladeria`
--

CREATE TABLE `heladeria` (
  `id_heladeria` int(11) NOT NULL,
  `nombre` text NOT NULL,
  `precio` float NOT NULL,
  `descripcion` text NOT NULL
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
  `estado` enum('Activo','Inactivo') NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_spanish_ci;

--
-- Volcado de datos para la tabla `pizza`
--

INSERT INTO `pizza` (`id_pizza`, `nombre`, `precio`, `descripcion`, `id_categoria_pizza`, `estado`) VALUES
(3, 'Pepe', 3, 'Quesito', 2, 'Activo');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `sucursal`
--

CREATE TABLE `sucursal` (
  `id_sucursal` int(11) NOT NULL,
  `sucursal` text NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_spanish_ci;

--
-- Volcado de datos para la tabla `sucursal`
--

INSERT INTO `sucursal` (`id_sucursal`, `sucursal`) VALUES
(1, 'sucur');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `usuarios`
--

CREATE TABLE `usuarios` (
  `id_usuario` int(11) NOT NULL,
  `email` text NOT NULL,
  `password` text NOT NULL,
  `id_sucursal` int(11) NOT NULL,
  `rol` enum('Administrador','Cocinero','Pizzero','Cajero','Mesero') NOT NULL,
  `estado` enum('Activo','Inactivo') NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_spanish_ci;

--
-- Volcado de datos para la tabla `usuarios`
--

INSERT INTO `usuarios` (`id_usuario`, `email`, `password`, `id_sucursal`, `rol`, `estado`) VALUES
(1, 'a@a.com', '', 1, 'Administrador', 'Activo');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `ventas`
--

CREATE TABLE `ventas` (
  `id_venta` int(11) NOT NULL,
  `id_cliente` int(11) NOT NULL,
  `id_usuario` int(11) NOT NULL,
  `id_delivery` int(11) DEFAULT NULL,
  `fecha_hora` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `tasa_cambio` float NOT NULL,
  `monto_total_usd` float NOT NULL,
  `monto_total_bs` float NOT NULL,
  `despacho` enum('Local','Llevar','Delivery','Pick Up') NOT NULL,
  `estado` enum('Completado','Pendiente','Rechazado') NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_spanish_ci;

--
-- Volcado de datos para la tabla `ventas`
--

INSERT INTO `ventas` (`id_venta`, `id_cliente`, `id_usuario`, `id_delivery`, `fecha_hora`, `tasa_cambio`, `monto_total_usd`, `monto_total_bs`, `despacho`, `estado`) VALUES
(5, 1, 1, NULL, '2026-07-30 19:03:07', 744.23, 13.5, 10047.1, 'Local', 'Completado'),
(6, 1, 1, NULL, '2026-07-30 19:07:10', 744.23, 28, 20838.3, 'Llevar', 'Completado'),
(7, 1, 1, NULL, '2026-07-30 19:08:29', 744.23, 36, 26792.2, 'Local', 'Completado'),
(11, 1, 1, NULL, '2026-07-30 19:17:14', 744.23, 16.5, 12279.7, 'Local', 'Completado'),
(12, 1, 1, NULL, '2026-07-30 19:57:03', 744.23, 13.5, 10047.1, 'Local', 'Completado'),
(13, 2, 1, NULL, '2026-07-30 19:57:46', 744.23, 13, 9674.94, 'Local', 'Completado');

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
(15, 13, 'Punto', 13, 9674.94, NULL);

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
  `estado` enum('Pendiente','Preparado','Horno','Completado') NOT NULL DEFAULT 'Pendiente'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_spanish_ci;

--
-- Volcado de datos para la tabla `venta_detalle`
--

INSERT INTO `venta_detalle` (`id_detalle`, `id_venta`, `tipo_producto`, `id_producto_origen`, `cantidad`, `monto_total`, `nota`, `estado`) VALUES
(1, 5, 'Pizza', 6, 1, 13.5, '', 'Pendiente'),
(2, 6, 'Pizza', 5, 1, 13, '', 'Pendiente'),
(3, 6, 'Bebida', 3, 1, 1.5, '', 'Completado'),
(4, 6, 'Pizza', 6, 1, 13.5, '', 'Pendiente'),
(5, 7, 'Pizza', 5, 1, 13, '', 'Pendiente'),
(6, 7, 'Pizza', 7, 1, 17, '', 'Pendiente'),
(7, 7, 'Bebida', 8, 1, 6, '', 'Completado'),
(11, 11, 'Pizza', 2, 1, 16.5, 'Mucho queso', 'Pendiente'),
(12, 12, 'Pizza', 6, 1, 13.5, '', 'Pendiente'),
(13, 13, 'Pizza', 5, 1, 13, '', 'Pendiente');

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
-- Indices de la tabla `clientes`
--
ALTER TABLE `clientes`
  ADD PRIMARY KEY (`id_cliente`);

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
-- AUTO_INCREMENT de la tabla `clientes`
--
ALTER TABLE `clientes`
  MODIFY `id_cliente` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT de la tabla `delivery`
--
ALTER TABLE `delivery`
  MODIFY `id_delivery` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de la tabla `detalle_venta_extras`
--
ALTER TABLE `detalle_venta_extras`
  MODIFY `id_detalle_extra` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=7;

--
-- AUTO_INCREMENT de la tabla `extras`
--
ALTER TABLE `extras`
  MODIFY `id_extras` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT de la tabla `heladeria`
--
ALTER TABLE `heladeria`
  MODIFY `id_heladeria` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de la tabla `pizza`
--
ALTER TABLE `pizza`
  MODIFY `id_pizza` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT de la tabla `sucursal`
--
ALTER TABLE `sucursal`
  MODIFY `id_sucursal` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT de la tabla `usuarios`
--
ALTER TABLE `usuarios`
  MODIFY `id_usuario` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT de la tabla `ventas`
--
ALTER TABLE `ventas`
  MODIFY `id_venta` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=14;

--
-- AUTO_INCREMENT de la tabla `ventas_pagos`
--
ALTER TABLE `ventas_pagos`
  MODIFY `id_pago` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=16;

--
-- AUTO_INCREMENT de la tabla `venta_detalle`
--
ALTER TABLE `venta_detalle`
  MODIFY `id_detalle` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=14;

--
-- Restricciones para tablas volcadas
--

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
