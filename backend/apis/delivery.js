import express from "express";
import pool from "../config/bd.js";

const Router = express.Router();

Router.get("/buscar-delivery", async (req, res) => {
  const { q } = req.query;
  const searchTerm = q ? q.trim() : "";

  try {
    const [rows] = await pool.query(
      `SELECT id_delivery as id, nombre as name, digitos as phone 
       FROM delivery 
       WHERE digitos = ? OR nombre LIKE ?`,
      [searchTerm, `%${searchTerm}%`],
    );

    if (rows.length > 0) {
      res.json({ success: true, delivery: rows[0] });
    } else {
      res.json({ success: false, message: "Delivery no encontrado" });
    }
  } catch (error) {
    console.error("Error buscando delivery:", error);
    res.status(500).json({ success: false, error: error.message });
  }
});

Router.post("/registrar-delivery", async (req, res) => {
  try {
    const { name, phone } = req.body;

    if (!name || !phone) {
      return res.status(400).json({
        success: false,
        message: "El nombre y el teléfono son requeridos.",
      });
    }

    const [result] = await pool.query(
      "INSERT INTO delivery (digitos, nombre) VALUES (?, ?)",
      [phone, name],
    );

    const deliveryData = {
      id: result.insertId,
      name,
      phone,
    };

    res.status(201).json({
      success: true,
      message: "Delivery registrado con éxito",
      delivery: {
        id: "id_generado_en_bd",
        name,
        phone,
      },
    });
  } catch (error) {
    console.error("Error al registrar el nuevo delivery:", error);
    res.status(500).json({
      success: false,
      message: "Error interno del servidor al guardar el repartidor.",
    });
  }
});

export default Router;
