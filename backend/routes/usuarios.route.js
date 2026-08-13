import { Router } from "express";

import {
  obtenerClientes,
  registrarClientes,
  editarCliente,
  buscarClientes,
  buscarDelivery,
  registrarDelivery,
  registrarUsuario,
  registrarSucursal,
  obtenerSucursal,
  obtenerUsuarios,
  eliminarUsuario,
} from "../controllers/usuarios.controller.js";

const router = Router();

router.get("/buscar-clientes", buscarClientes);
router.get("/obtener-clientes", obtenerClientes);
router.post("/registrar-clientes", registrarClientes);
router.put("/editar-cliente/:id", editarCliente);

router.get("/buscar-delivery", buscarDelivery);
router.post("/registrar-delivery", registrarDelivery);

router.post("/registrar-usuario", registrarUsuario);
router.get("/usuarios", obtenerUsuarios);
router.put("/eliminar-usuario/:id", eliminarUsuario);

router.post("/registrar-sucursal", registrarSucursal);
router.get("/sucursales", obtenerSucursal);

export default router;
