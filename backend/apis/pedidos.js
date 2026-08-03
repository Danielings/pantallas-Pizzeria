import express from "express";
import pool from "../config/bd.js";

const Router = express.Router();

Router.get("/obtener-pedidos-cocina", async (req, res) => {
  try {
    const [ventas] = await pool.query(
      `SELECT DISTINCT
        v.id_venta,
        v.fecha_hora,
        v.despacho,
        c.nombre AS nombre_cliente,
        c.telefono AS telefono_cliente
      FROM ventas v
      LEFT JOIN clientes c ON c.id_cliente = v.id_cliente
      WHERE DATE(v.fecha_hora) = CURDATE()
        AND EXISTS (
          SELECT 1 FROM venta_detalle vd
          WHERE vd.id_venta = v.id_venta
            AND vd.estado = 'Pendiente'
            AND vd.tipo_producto = 'Pizza'
        )
      ORDER BY v.fecha_hora ASC`,
    );

    const pedidosCocina = await Promise.all(
      ventas.map(async (venta) => {
        const [detalles] = await pool.query(
          `SELECT 
            vd.id_detalle,
            vd.cantidad,
            vd.nota,
            vd.estado AS estado_detalle,
            p.nombre AS nombre_producto
          FROM venta_detalle vd
          LEFT JOIN pizza p ON p.id_pizza = vd.id_producto_origen
          WHERE vd.id_venta = ? 
            AND vd.estado = 'Pendiente' 
            AND vd.tipo_producto = 'Pizza'`,
          [venta.id_venta],
        );

        const detallesConExtras = await Promise.all(
          detalles.map(async (det) => {
            const [extras] = await pool.query(
              `SELECT e.id_extras AS id, e.nombre AS name, e.precio AS price
               FROM detalle_venta_extras dve
               JOIN extras e ON e.id_extras = dve.id_extra
               WHERE dve.id_detalle = ?`,
              [det.id_detalle],
            );
            return { ...det, extras };
          }),
        );

        return {
          ...venta,
          codigo_orden: `ORD-${String(venta.id_venta).padStart(3, "0")}`,
          detalles: detallesConExtras,
        };
      }),
    );

    res.json({ success: true, data: pedidosCocina });
  } catch (error) {
    console.error("Error al obtener pedidos de cocina:", error);
    res.status(500).json({ success: false, message: error.message });
  }
});

Router.put("/preparar-pedido/:id_venta", async (req, res) => {
  const { id_venta } = req.params;

  try {
    const [result] = await pool.query(
      `UPDATE venta_detalle 
       SET estado = 'Horno' 
       WHERE id_venta = ? 
         AND estado = 'Pendiente' 
         AND tipo_producto = 'Pizza'`,
      [id_venta],
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: "No se encontraron pizzas pendientes para esta orden.",
      });
    }

    res.json({
      success: true,
      message: "Pedido enviado al horno exitosamente.",
    });
  } catch (error) {
    console.error("Error al actualizar el pedido a Horno:", error);
    res.status(500).json({ success: false, message: error.message });
  }
});

export default Router;
