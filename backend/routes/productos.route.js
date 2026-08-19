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

const router = Router();

// Rutas de Pizzas
router.get("/pizzas", obtenerPizzas);
router.post("/pizzas", upload.single("imagen"), verificarToken, crearPizza);
router.put(
  "/pizzas/:id",
  upload.single("imagen"),
  verificarToken,
  actualizarPizza,
);

// Rutas de Bebidas
router.get("/bebidas", obtenerBebidas);
router.post("/bebidas", upload.single("imagen"), verificarToken, crearBebida);
router.put(
  "/bebidas/:id",
  upload.single("imagen"),
  verificarToken,
  actualizarBebida,
);

// Rutas de Heladería
router.get("/heladeria", obtenerHelados);
router.post("/heladeria", upload.single("imagen"), verificarToken, crearHelado);
router.put(
  "/heladeria/:id",
  upload.single("imagen"),
  verificarToken,
  actualizarHelado,
);

// Rutas de Extras
router.get("/extras", obtenerExtras);
router.post("/extras", upload.none(), verificarToken, crearExtra);
router.put("/extras/:id", upload.none(), verificarToken, actualizarExtra);

export default router;
