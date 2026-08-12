import { Router } from "express";
import {
  obtenerPedidosCocina,
  obtenerPedidosHorno,
  obtenerPedidosDespacho,
  obtenerPedidosMesero,
  obtenerPedidosPendiente,
  obtenerContadorCajero,
  actualizarEstadoPedido,
  obtenerEntregas,
  actualizarEntrega,
} from "../controllers/pedidos.controller.js";

const router = Router();

router.get("/obtener-pedidos-cocina", obtenerPedidosCocina);
router.get("/obtener-pedidos-horno", obtenerPedidosHorno);
router.get("/obtener-pedidos-despacho", obtenerPedidosDespacho);
router.get("/obtener-pedidos-mesero", obtenerPedidosMesero);
router.get("/obtener-pedidos-pendiente", obtenerPedidosPendiente);
router.get("/obtener-contador-cajero", obtenerContadorCajero);
router.put("/actualizar-estado-pedido/:id_venta", actualizarEstadoPedido);
router.get("/entregas", obtenerEntregas);
router.put("/entregas/:id_venta/completar", actualizarEntrega);

export default router;
