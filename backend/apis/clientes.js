import express from "express";
import pool from "../config/bd.js";

const Router = express.Router();

// La columna telefono es INT, así que guardamos solo dígitos.
const sanitizePhone = (phone) => {
  const digits = String(phone || "").replace(/\D/g, "");
  return digits ? parseInt(digits, 10) : 0;
};

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

Router.get("/obtener-clientes", async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT c.id_cliente AS id, c.cedula, c.nombre AS name, c.telefono AS phone, c.descripcion,
              COUNT(v.id_venta) AS orders,
              COALESCE(SUM(v.monto_total_usd), 0) AS total,
              MAX(v.fecha_hora) AS lastVisit
       FROM clientes c
       LEFT JOIN ventas v ON c.id_cliente = v.id_cliente
       GROUP BY c.id_cliente
       ORDER BY c.nombre ASC`,
    );

    res.json({ success: true, data: rows });
  } catch (error) {
    console.error("Error obteniendo clientes:", error);
    res.status(500).json({ success: false, error: error.message });
  }
});

Router.post("/registrar-clientes", async (req, res) => {
  const { cedula, name, phone, descripcion } = req.body;
  const cedulaTrim = String(cedula || "").trim();

  if (!cedulaTrim || !String(name || "").trim()) {
    return res
      .status(400)
      .json({ success: false, message: "La cédula y el nombre son obligatorios" });
  }

  try {
    const [existing] = await pool.query(
      `SELECT id_cliente FROM clientes WHERE cedula = ?`,
      [cedulaTrim],
    );

    if (existing.length > 0) {
      return res.status(400).json({
        success: false,
        message: "Ya existe un cliente registrado con esa cédula",
      });
    }

    const [result] = await pool.query(
      `INSERT INTO clientes (cedula, nombre, telefono, descripcion) VALUES (?, ?, ?, ?)`,
      [cedulaTrim, String(name).trim(), sanitizePhone(phone), descripcion || ""],
    );

    res.status(201).json({
      success: true,
      cliente: {
        id: result.insertId,
        cedula: cedulaTrim,
        name: String(name).trim(),
        phone: sanitizePhone(phone),
        descripcion: descripcion || "",
        orders: 0,
        total: 0,
        lastVisit: null,
      },
    });
  } catch (error) {
    console.error("Error registrando cliente:", error);
    res.status(500).json({ success: false, error: error.message });
  }
});

Router.put("/editar-cliente/:id", async (req, res) => {
  const { id } = req.params;
  const { cedula, name, phone, descripcion } = req.body;
  const cedulaTrim = String(cedula || "").trim();

  if (!cedulaTrim || !String(name || "").trim()) {
    return res
      .status(400)
      .json({ success: false, message: "La cédula y el nombre son obligatorios" });
  }

  try {
    const [existing] = await pool.query(
      `SELECT id_cliente FROM clientes WHERE cedula = ? AND id_cliente != ?`,
      [cedulaTrim, id],
    );

    if (existing.length > 0) {
      return res.status(400).json({
        success: false,
        message: "Ya existe otro cliente con esa cédula",
      });
    }

    const [result] = await pool.query(
      `UPDATE clientes SET cedula = ?, nombre = ?, telefono = ?, descripcion = ? WHERE id_cliente = ?`,
      [cedulaTrim, String(name).trim(), sanitizePhone(phone), descripcion || "", id],
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: "Cliente no encontrado" });
    }

    res.json({
      success: true,
      cliente: {
        id,
        cedula: cedulaTrim,
        name: String(name).trim(),
        phone: sanitizePhone(phone),
        descripcion: descripcion || "",
      },
    });
  } catch (error) {
    console.error("Error editando cliente:", error);
    res.status(500).json({ success: false, error: error.message });
  }
});

Router.delete("/eliminar-cliente/:id", async (req, res) => {
  const { id } = req.params;

  try {
    const [ventas] = await pool.query(
      `SELECT COUNT(*) AS total FROM ventas WHERE id_cliente = ?`,
      [id],
    );

    if (ventas[0].total > 0) {
      return res.status(400).json({
        success: false,
        message: `El cliente tiene ${ventas[0].total} venta(s) asociadas y no puede eliminarse.`,
      });
    }

    const [result] = await pool.query(`DELETE FROM clientes WHERE id_cliente = ?`, [id]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: "Cliente no encontrado" });
    }

    res.json({ success: true, message: "Cliente eliminado correctamente" });
  } catch (error) {
    console.error("Error eliminando cliente:", error);
    res.status(500).json({ success: false, error: error.message });
  }
});

export default Router;
