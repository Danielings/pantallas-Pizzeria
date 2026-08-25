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
import verificarToken from "../middleware/verificarToken.js";
import esCajero from "../middleware/esCajero.js";

const router = Router();

router.get("/obtener-pedidos-cocina", obtenerPedidosCocina);
router.get("/obtener-pedidos-horno", obtenerPedidosHorno);
router.get("/obtener-pedidos-despacho", obtenerPedidosDespacho);
router.get("/obtener-pedidos-mesero", obtenerPedidosMesero);
router.get("/obtener-pedidos-pendiente", obtenerPedidosPendiente);
router.get("/obtener-contador-cajero", verificarToken, obtenerContadorCajero);
router.put("/actualizar-estado-pedido/:id_venta", actualizarEstadoPedido);
router.get("/entregas", verificarToken, obtenerEntregas);
router.put(
  "/entregas/:id_venta/completar",
  verificarToken,
  esCajero,
  actualizarEntrega,
);

export default router;
