import { Router } from "express";
import {
  recuperarPassword,
  validarToken,
  restablecerPassword,
} from "../controllers/autenticacion.controller.js";

const router = Router();

router.post("/recuperar-password", recuperarPassword);
router.get("/validar-token", validarToken);
router.post("/restablecer-password", restablecerPassword);

export default router;
