import { Router } from "express";
import {
  obtenerNotificacionPendiente,
  obtenerNotificacionesPendientes,
  conectarNotificacionesSSE,
} from "../controllers/notificaciones.controller.js";

const router = Router();

router.get("/notificaciones-pendientes", obtenerNotificacionesPendientes);
router.get(
  "/notificaciones-pendientes/:id_venta",
  obtenerNotificacionPendiente,
);
router.get("/notificaciones-sse", conectarNotificacionesSSE);

export default router;
