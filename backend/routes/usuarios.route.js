import { Router } from "express";

import {
  obtenerClientes,
  registrarClientes,
  editarCliente,
  buscarClientes,
  buscarDelivery,
  registrarDelivery,
  registrarUsuario,
} from "../controllers/usuarios.controller.js";

const router = Router();

router.get("/buscar-clientes", buscarClientes);
router.get("/obtener-clientes", obtenerClientes);
router.post("/registrar-clientes", registrarClientes);
router.put("/editar-cliente/:id", editarCliente);

router.get("/buscar-delivery", buscarDelivery);
router.post("/registrar-delivery", registrarDelivery);

router.post("/registrar-usuario", registrarUsuario);

export default router;
