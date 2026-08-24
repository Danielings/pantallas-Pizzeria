import { Router } from "express";
import { upload } from "../middleware/upload.middleware.js";
import {
  obtenerPizzas,
  crearPizza,
  actualizarPizza,
  obtenerBebidas,
  crearBebida,
  actualizarBebida,
  obtenerHelados,
  crearHelado,
  actualizarHelado,
  obtenerExtras,
  crearExtra,
  actualizarExtra,
} from "../controllers/productos.controller.js";
import verificarToken from "../middleware/verificarToken.js";
import esAdmin from "../middleware/esAdmin.js";

const router = Router();

// Rutas de Pizzas
router.get("/pizzas", verificarToken, obtenerPizzas);
router.post(
  "/pizzas",
  upload.single("imagen"),
  verificarToken,
  esAdmin,
  crearPizza,
);
router.put(
  "/pizzas/:id",
  upload.single("imagen"),
  verificarToken,
  esAdmin,
  actualizarPizza,
);

// Rutas de Bebidas
router.get("/bebidas", verificarToken, obtenerBebidas);
router.post(
  "/bebidas",
  upload.single("imagen"),
  verificarToken,
  esAdmin,
  crearBebida,
);
router.put(
  "/bebidas/:id",
  upload.single("imagen"),
  verificarToken,
  esAdmin,
  actualizarBebida,
);

// Rutas de Heladería
router.get("/heladeria", verificarToken, obtenerHelados);
router.post("/heladeria", upload.single("imagen"), verificarToken, crearHelado);
router.put(
  "/heladeria/:id",
  upload.single("imagen"),
  verificarToken,
  esAdmin,
  actualizarHelado,
);

// Rutas de Extras
router.get("/extras", verificarToken, obtenerExtras);
router.post("/extras", upload.none(), verificarToken, esAdmin, crearExtra);
router.put(
  "/extras/:id",
  upload.none(),
  verificarToken,
  esAdmin,
  actualizarExtra,
);

export default router;
