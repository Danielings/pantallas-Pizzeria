import express from "express";
import pool from "../config/bd.js";

const Router = express.Router();

// Registrar las Pizzas
Router.post("/pizzas", async (req, res) => {
  const { name, price, description, size } = req.body;

  try {
    let id_categoria_pizza = 1;
    if (size === "Familiar") id_categoria_pizza = 2;
    if (size === "Gigante") id_categoria_pizza = 3;

    const [result] = await pool.query(
      `INSERT INTO pizza (nombre, precio, descripcion, id_categoria_pizza, estado) 
       VALUES (?, ?, ?, ?, 'Activo')`,
      [name, price, description, id_categoria_pizza],
    );

    res.status(201).json({
      success: true,
      message: "Pizza registrada",
      id: result.insertId,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Registra las Bebidas
Router.post("/bebidas", async (req, res) => {
  const { name, price, description } = req.body;

  try {
    const [result] = await pool.query(
      `INSERT INTO bebidas (nombre, precio, descripcion) VALUES (?, ?, ?)`,
      [name, price, description],
    );

    res.status(201).json({
      success: true,
      message: "Bebida registrada",
      id: result.insertId,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Registrar los helados
Router.post("/heladeria", async (req, res) => {
  const { name, price, description } = req.body;

  try {
    const [result] = await pool.query(
      `INSERT INTO heladeria (nombre, precio, descripcion) VALUES (?, ?, ?)`,
      [name, price, description],
    );

    res.status(201).json({
      success: true,
      message: "Helado registrado",
      id: result.insertId,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

export default Router;
