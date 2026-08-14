import { Router } from "express";
import { obtenerResumenDia, verificarPedidosPendientes } from "../controllers/cierre.controller.js";

const router = Router();

router.get("/cierre/resumen-dia", obtenerResumenDia);
router.get("/cierre/pedidos-pendientes", verificarPedidosPendientes);

export default router;
