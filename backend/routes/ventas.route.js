import { Router } from "express";
import {
  procesarVenta,
  registrarPedidoPendiente,
  obtenerNotificacionesPendientes,
  obtenerNotificacionPendiente,
  completarVentaPendiente,
  editarVenta,
  obtenerMetodosPago,
  obtenerVentasHoy,
  obtenerPedidosActivos,
  obtenerTasaExterna,
  actualizarTasaDesdeApi,
  obtenerRegistro,
  obtenerTasaDesdeBD,
  editarYAnclarTasa,
  desanclarTasa,
} from "../controllers/ventas.controller.js";
import verificarToken from "../middleware/verificarToken.js";
import esAdmin from "../middleware/esAdmin.js";

const router = Router();

router.post("/procesar-venta", procesarVenta);
router.post("/registrar-pedido-pendiente", registrarPedidoPendiente);
router.get("/notificaciones-pendientes", obtenerNotificacionesPendientes);
router.get(
  "/notificaciones-pendientes/:id_venta",
  obtenerNotificacionPendiente,
);
router.post("/completar-venta-pendiente/:id_venta", completarVentaPendiente);
router.put("/editar-venta", editarVenta);
router.get("/metodos-pagos", obtenerMetodosPago);

router.get("/obtener-ventas-hoy", obtenerVentasHoy);
router.get("/obtener-pedidos-activos", obtenerPedidosActivos);
router.get("/tasa", obtenerTasaDesdeBD);
router.put("/tasa/anclar", verificarToken, esAdmin, editarYAnclarTasa);
router.put("/tasa/desanclar", verificarToken, esAdmin, desanclarTasa);

export default router;
