// Si usas express.Router()
import express from "express";
import pool from "../config/bd.js"; // Asegúrate de que la ruta sea correcta
const router = express.Router();

router.get("/pizzas", async (req, res) => {
  try {
    const [rows] = await pool.execute(`
      SELECT p.*, c.categoria AS categoria_nombre 
      FROM pizza p 
      LEFT JOIN categoria_pizza c ON p.id_categoria_pizza = c.id_categoria_pizza
    `);

    const pizzas = rows.map((pizza) => ({
      id: pizza.id_pizza,
      name: pizza.nombre,
      price: pizza.precio,
      description: pizza.descripcion,
      category: "pizzas",
      size: pizza.categoria_nombre || "Normal",
      pizzaCategory: pizza.categoria_nombre || null, // <-- Aquí guardamos el tamaño/categoría (ej. "Familiar")
      url: pizza.url || null,
      estado: pizza.estado || "Activo",
    }));

    res.json({ success: true, data: pizzas });
  } catch (error) {
    console.error("Error obteniendo pizzas:", error);
    res
      .status(500)
      .json({ success: false, message: "Error interno del servidor" });
  }
});

// ─── API PARA BEBIDAS ───
router.get("/bebidas", async (req, res) => {
  try {
    const [rows] = await pool.execute("SELECT * FROM bebidas");

    const bebidas = rows.map((bebida) => ({
      id: bebida.id_bebida, // <-- Basado en tu imagen, la columna es id_bebida
      name: bebida.nombre,
      price: bebida.precio,
      description: bebida.descripcion,
      category: "drinks",
      url: bebida.url || null,
      estado: bebida.estado || "Activo",
    }));

    res.json({ success: true, data: bebidas });
  } catch (error) {
    console.error("Error obteniendo bebidas:", error);
    res
      .status(500)
      .json({ success: false, message: "Error interno del servidor" });
  }
});

// ─── API PARA HELADERÍA ───
router.get("/heladeria", async (req, res) => {
  try {
    const [rows] = await pool.execute("SELECT * FROM heladeria");

    const helados = rows.map((helado) => ({
      id: helado.id_helado, // <-- Asegúrate de que coincida con la columna ID de tu tabla heladeria
      name: helado.nombre,
      price: helado.precio,
      description: helado.descripcion,
      category: "icecream",
      url: helado.url || null,
      estado: helado.estado || "Activo",
    }));

    res.json({ success: true, data: helados });
  } catch (error) {
    console.error("Error obteniendo helados:", error);
    res
      .status(500)
      .json({ success: false, message: "Error interno del servidor" });
  }
});

router.get("/extras", async (req, res) => {
  try {
    const [rows] = await pool.execute(`
      SELECT e.*, c.categoria AS categoria_nombre 
      FROM extras e
      LEFT JOIN categoria_pizza c ON e.id_categoria_pizza = c.id_categoria_pizza
    `);

    const extras = rows.map((extra) => ({
      id: extra.id_extras,
      id_categoria_pizza: extra.id_categoria_pizza,
      name: extra.nombre,
      price: extra.precio,
      category: "extras",
      size: extra.categoria_nombre || "Normal",
      extraCategory: extra.categoria_nombre || null,
      estado: extra.estado || "Activo",
    }));

    res.json({ success: true, data: extras });
  } catch (error) {
    console.error("Error obteniendo extras:", error);
    res
      .status(500)
      .json({ success: false, message: "Error interno del servidor" });
  }
});
export default router;
