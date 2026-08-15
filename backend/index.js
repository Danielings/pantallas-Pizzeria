import express from "express";
import pool from "./config/bd.js";
import cors from "cors";
import agregarProductos from "./apis/agregarProductos.js";
import ventas from "./apis/ventas.js";
import clientes from "./apis/clientes.js";
import obtenerProductos from "./apis/obtenerProductos.js";
import editarProductos from "./apis/editarProductos.js";
import pedidos from "./apis/pedidos.js";
import entregas from "./apis/entregas.js";
import delivery from "./apis/delivery.js";
import tasaRoutes, { actualizarTasaDesdeApi } from "./apis/tasa.js";
import cron from "node-cron";
import { getTransporter } from "./config/mailer.js";
import recuperarPassword from "./apis/recuperarPassword.js";


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
app.use("/api", agregarProductos);
app.use("/api", ventas);
app.use("/api", clientes);
app.use("/api", obtenerProductos);
app.use("/api", editarProductos);
app.use("/api", pedidos);
app.use("/api", entregas);
app.use("/api", delivery);
app.use("/api", tasaRoutes);
app.use("/api", recuperarPassword);

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
