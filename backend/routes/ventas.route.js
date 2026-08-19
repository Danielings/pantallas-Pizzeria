import { Router } from "express";
import {
  procesarVenta,
  registrarPedidoPendiente,
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
router.put("/editar-venta", editarVenta);
router.get("/metodos-pagos", obtenerMetodosPago);

router.get("/obtener-ventas-hoy", obtenerVentasHoy);
router.get("/obtener-pedidos-activos", obtenerPedidosActivos);
router.get("/tasa", obtenerTasaDesdeBD);
router.put("/tasa/anclar", verificarToken, esAdmin, editarYAnclarTasa);
router.put("/tasa/desanclar", verificarToken, esAdmin, desanclarTasa);

export default router;
