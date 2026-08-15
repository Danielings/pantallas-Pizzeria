import { Router } from "express";

import {
  obtenerClientes,
  registrarClientes,
  editarCliente,
  buscarClientes,
} from "../controllers/clientes.controller.js";

const router = Router();

router.get("/buscar-clientes", buscarClientes);
router.get("/obtener-clientes", obtenerClientes);
router.post("/registrar-clientes", registrarClientes);
router.put("/editar-cliente/:id", editarCliente);

export default router;
