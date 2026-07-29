import express from "express";
import pool from "./config/bd.js";
import cors from "cors";
import agregarProductos from "./apis/agregarProductos.js";

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

app.listen(3001, () => {
  console.log("Escuchandoo, oh oh");
});
