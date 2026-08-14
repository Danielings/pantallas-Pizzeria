import { Router } from "express";
import {
  cerrarCaja,
  obtenerResumenDia,
  verificarPedidosPendientes,
} from "../controllers/cierre.controller.js";

const router = Router();

router.get("/cierre/resumen-dia", obtenerResumenDia);
router.get("/cierre/pedidos-pendientes", verificarPedidosPendientes);
router.post("/cierre-caja", cerrarCaja);

export default router;
