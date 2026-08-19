import { Router } from "express";

import {
  buscarDelivery,
  registrarDelivery,
  registrarUsuario,
  registrarSucursal,
  obtenerSucursal,
  obtenerUsuarios,
  eliminarUsuario,
} from "../controllers/usuarios.controller.js";
import verificarToken from "../middleware/verificarToken.js";

const router = Router();

router.get("/buscar-delivery", buscarDelivery);
router.post("/registrar-delivery", registrarDelivery);

router.post("/registrar-usuario", verificarToken, registrarUsuario);
router.get("/usuarios", obtenerUsuarios);
router.put("/eliminar-usuario/:id", verificarToken, eliminarUsuario);

router.post("/registrar-sucursal", verificarToken, registrarSucursal);
router.get("/sucursales", obtenerSucursal);

export default router;
