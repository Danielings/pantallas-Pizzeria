import { Router } from "express";
import {
  procesarVenta,
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

const router = Router();

router.post("/procesar-venta", procesarVenta);
router.put("/editar-venta", editarVenta);
router.get("/metodos-pagos", obtenerMetodosPago);

router.get("/obtener-ventas-hoy", obtenerVentasHoy);
router.get("/obtener-pedidos-activos", obtenerPedidosActivos);
router.get("/tasa", obtenerTasaDesdeBD);
router.put("/tasa/anclar", editarYAnclarTasa);
router.put("/tasa/desanclar", desanclarTasa);

export default router;
