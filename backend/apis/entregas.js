import express from "express";
import pool from "../config/bd.js";

const router = express.Router();

// GET /api/entregas - Fetch delivery and pickup orders from DB
router.get("/entregas", async (req, res) => {
  try {
    const [ventas] = await pool.query(
      `SELECT DISTINCT
        v.id_venta,
        v.fecha_hora,
        v.despacho,
        v.monto_total_usd,
        v.estado,
        c.nombre AS nombre_cliente,
        c.telefono AS telefono_cliente,
        c.descripcion AS direccion_cliente
      FROM ventas v
      LEFT JOIN clientes c ON c.id_cliente = v.id_cliente
      WHERE v.despacho IN ('Delivery', 'Pick Up')
        AND DATE(v.fecha_hora) = CURDATE()
      ORDER BY v.fecha_hora ASC`
    );

    const ordenes = await Promise.all(
      ventas.map(async (venta) => {
        const [detalles] = await pool.query(
          `SELECT 
            vd.id_detalle,
            vd.cantidad,
            vd.tipo_producto,
            CASE 
              WHEN vd.tipo_producto = 'Pizza' THEN p.nombre
              WHEN vd.tipo_producto = 'Bebida' THEN b.nombre
              WHEN vd.tipo_producto = 'Helado' THEN h.nombre
            END AS nombre_producto
          FROM venta_detalle vd
          LEFT JOIN pizza p ON vd.tipo_producto = 'Pizza' AND p.id_pizza = vd.id_producto_origen
          LEFT JOIN bebidas b ON vd.tipo_producto = 'Bebida' AND b.id_bebida = vd.id_producto_origen
          LEFT JOIN heladeria h ON vd.tipo_producto = 'Helado' AND h.id_heladeria = vd.id_producto_origen
          WHERE vd.id_venta = ?`,
          [venta.id_venta]
        );

        const items = detalles.map(det => ({
          name: det.nombre_producto || det.tipo_producto,
          quantity: det.cantidad,
          type: det.tipo_producto
        }));

        return {
          id: venta.id_venta,
          type: venta.despacho === 'Delivery' ? 'delivery' : 'pickup',
          customerName: venta.nombre_cliente || 'Desconocido',
          address: venta.direccion_cliente || '',
          phone: venta.telefono_cliente || '',
          items: items,
          total: venta.monto_total_usd,
          orderedAt: venta.fecha_hora,
          status: 'ready' // For frontend mock display of "delivered" button
        };
      })
    );

    res.json(ordenes);
  } catch (error) {
    console.error("Error fetching entregas:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
