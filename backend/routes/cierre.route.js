import { Router } from "express";
import {
  cerrarCaja,
  obtenerResumenDia,
  verificarPedidosPendientes,
  obtenerHistorialCierres,
  obtenerCajeros,
  actualizarPinCajero,
} from "../controllers/cierre.controller.js";
import verificarToken from "../middleware/verificarToken.js";

const router = Router();

router.get("/cierre/resumen-dia", obtenerResumenDia);
router.get("/cierre/pedidos-pendientes", verificarPedidosPendientes);
router.get("/cierre/historial", obtenerHistorialCierres);
router.get("/cierre/cajeros", obtenerCajeros);
router.put("/cierre/cajero-pin", verificarToken, actualizarPinCajero);
router.post("/cierre-caja", verificarToken, cerrarCaja);

export default router;
