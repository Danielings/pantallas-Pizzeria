import express from "express";
import pool from "./config/bd.js";
import cors from "cors";
import agregarProductos from "./apis/agregarProductos.js";
import ventas from "./apis/ventas.js";
import clientes from "./apis/clientes.js";

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

app.listen(3001, () => {
  console.log("Escuchandoo, oh oh");
});
