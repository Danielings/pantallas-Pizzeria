import express from "express";
import pool from "./config/bd.js";
import cors from "cors";
import productos from "./routes/productos.route.js";
import ventas from "./routes/ventas.route.js";
import pedidos from "./routes/pedidos.route.js";
import usuarios from "./routes/usuarios.route.js";
import { actualizarTasaDesdeApi } from "./controllers/ventas.controller.js";
import cron from "node-cron";
import { getTransporter } from "./config/mailer.js";
import autenticacion from "./routes/autenticacion.route.js";
import cierre from "./routes/cierre.route.js";
import clientes from "./routes/clientes.route.js";

const app = express();
app.use(
  cors({
    origin: "http://localhost:5173",
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"],
    exposedHeaders: ["Content-Disposition"],
  }),
);
app.use(express.json());

// Rutitas
app.use("/api", productos);
app.use("/api", ventas);
app.use("/api", usuarios);
app.use("/api", pedidos);
app.use("/api", autenticacion);
app.use("/api", cierre);
app.use("/api", clientes);

cron.schedule("*/30 * * * *", async () => {
  try {
    await actualizarTasaDesdeApi();
    console.log("Tasa actualizada automáticamente desde la API.");
  } catch (error) {
    console.error("Error actualizando la tasa automáticamente:", error);
  }
});

app.listen(3001, () => {
  console.log("Escuchandoo, oh oh");
});
