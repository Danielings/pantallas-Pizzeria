import { Router } from "express";

import {
  registrarSucursal,
  obtenerSucursal,
  actualizarSucursal,
} from "../controllers/sucursal.controller.js";
import verificarToken from "../middleware/verificarToken.js";
import esAdmin from "../middleware/esAdmin.js";

const router = Router();

router.post("/registrar-sucursal", verificarToken, esAdmin, registrarSucursal);
router.get("/sucursales", obtenerSucursal);
router.put("/actualizar-sucursal/:id", verificarToken, esAdmin, actualizarSucursal);

export default router;
