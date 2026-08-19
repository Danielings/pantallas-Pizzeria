import { Router } from "express";

import {
  obtenerClientes,
  registrarClientes,
  editarCliente,
  buscarClientes,
} from "../controllers/clientes.controller.js";
import verificarToken from "../middleware/verificarToken.js";
import esAdmin from "../middleware/esAdmin.js";

const router = Router();

router.get("/buscar-clientes", buscarClientes);
router.get("/obtener-clientes", obtenerClientes);
router.post("/registrar-clientes", registrarClientes);
router.put("/editar-cliente/:id", verificarToken, esAdmin, editarCliente);

export default router;
