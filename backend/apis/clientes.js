import express from "express";
import pool from "../config/bd.js";

const Router = express.Router();

Router.get("/buscar-clientes", async (req, res) => {
  const { q } = req.query;
  const searchTerm = q ? q.trim() : "";

  try {
    const [rows] = await pool.query(
      `SELECT c.id_cliente as id, c.cedula, c.nombre as name, c.telefono as phone, 
              COUNT(v.id_venta) as orders
       FROM clientes c
       LEFT JOIN ventas v ON c.id_cliente = v.id_cliente
       WHERE c.cedula = ? OR c.nombre LIKE ?
       GROUP BY c.id_cliente`,
      [searchTerm, `%${searchTerm}%`],
    );

    if (rows.length > 0) {
      res.json({ success: true, cliente: rows[0] });
    } else {
      res.json({ success: false, message: "Cliente no encontrado" });
    }
  } catch (error) {
    console.error("Error buscando cliente:", error);
    res.status(500).json({ success: false, error: error.message });
  }
});

Router.post("/registrar-clientes", async (req, res) => {
  const { cedula, name, phone } = req.body;

  try {
    const [result] = await pool.query(
      `INSERT INTO clientes (cedula, nombre, telefono) VALUES (?, ?, ?)`,
      [cedula, name, phone || ""],
    );

    res.status(201).json({
      success: true,
      cliente: {
        id: result.insertId,
        cedula,
        name,
        phone,
        orders: 0,
      },
    });
  } catch (error) {
    console.error("Error registrando cliente:", error);
    res.status(500).json({ success: false, error: error.message });
  }
});

export default Router;
