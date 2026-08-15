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

const router = Router();

router.get("/buscar-delivery", buscarDelivery);
router.post("/registrar-delivery", registrarDelivery);

router.post("/registrar-usuario", registrarUsuario);
router.get("/usuarios", obtenerUsuarios);
router.put("/eliminar-usuario/:id", eliminarUsuario);

router.post("/registrar-sucursal", registrarSucursal);
router.get("/sucursales", obtenerSucursal);

export default router;
