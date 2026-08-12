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

const router = Router();

// Rutas de Pizzas
router.get("/pizzas", obtenerPizzas);
router.post("/pizzas", upload.single("imagen"), crearPizza);
router.put("/pizzas/:id", upload.single("imagen"), actualizarPizza);

// Rutas de Bebidas
router.get("/bebidas", obtenerBebidas);
router.post("/bebidas", upload.single("imagen"), crearBebida);
router.put("/bebidas/:id", upload.single("imagen"), actualizarBebida);

// Rutas de Heladería
router.get("/heladeria", obtenerHelados);
router.post("/heladeria", upload.single("imagen"), crearHelado);
router.put("/heladeria/:id", upload.single("imagen"), actualizarHelado);

// Rutas de Extras
router.get("/extras", obtenerExtras);
router.post("/extras", upload.none(), crearExtra);
router.put("/extras/:id", upload.none(), actualizarExtra);

export default router;
