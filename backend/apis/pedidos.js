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
        c.telefono AS telefono_cliente,
        d.digitos AS digitos_delivery
      FROM ventas v
      LEFT JOIN clientes c ON c.id_cliente = v.id_cliente
      LEFT JOIN delivery d ON d.id_delivery = v.id_delivery
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
            p.nombre AS nombre_producto,
            cp.categoria AS categoria_pizza 
          FROM venta_detalle vd
          LEFT JOIN pizza p ON p.id_pizza = vd.id_producto_origen
          LEFT JOIN categoria_pizza cp ON p.id_categoria_pizza = cp.id_categoria_pizza
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

Router.get("/obtener-pedidos-horno", async (req, res) => {
  try {
    const [ventas] = await pool.query(
      `SELECT DISTINCT
        v.id_venta,
        v.fecha_hora,
        v.despacho,
        c.nombre AS nombre_cliente,
        c.telefono AS telefono_cliente,
        d.digitos AS digitos_delivery
      FROM ventas v
      LEFT JOIN clientes c ON c.id_cliente = v.id_cliente
      LEFT JOIN delivery d ON d.id_delivery = v.id_delivery
      WHERE DATE(v.fecha_hora) = CURDATE()
        AND EXISTS (
          SELECT 1 FROM venta_detalle vd
          WHERE vd.id_venta = v.id_venta
            AND vd.estado = 'Horno'
            AND vd.tipo_producto = 'Pizza'
        )
      ORDER BY v.fecha_hora ASC`,
    );

    const pedidosHorno = await Promise.all(
      ventas.map(async (venta) => {
        const [detalles] = await pool.query(
          `SELECT 
            vd.id_detalle,
            vd.cantidad,
            vd.nota,
            vd.estado AS estado_detalle,
            p.nombre AS nombre_producto,
            cp.categoria AS categoria_pizza 
          FROM venta_detalle vd
          LEFT JOIN pizza p ON p.id_pizza = vd.id_producto_origen
          LEFT JOIN categoria_pizza cp ON p.id_categoria_pizza = cp.id_categoria_pizza
          WHERE vd.id_venta = ? 
            AND vd.estado = 'Horno' 
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

    res.json({ success: true, data: pedidosHorno });
  } catch (error) {
    console.error("Error al obtener pedidos de horno:", error);
    res.status(500).json({ success: false, message: error.message });
  }
});

Router.get("/obtener-pedidos-despacho", async (req, res) => {
  try {
    const [ventas] = await pool.query(
      `SELECT DISTINCT
        v.id_venta,
        v.fecha_hora,
        v.despacho,
        c.nombre AS nombre_cliente,
        c.telefono AS telefono_cliente,
        d.digitos AS digitos_delivery
      FROM ventas v
      LEFT JOIN clientes c ON c.id_cliente = v.id_cliente
      LEFT JOIN delivery d ON d.id_delivery = v.id_delivery
      WHERE DATE(v.fecha_hora) = CURDATE()
        AND EXISTS (
          SELECT 1 FROM venta_detalle vd
          WHERE vd.id_venta = v.id_venta
            AND vd.estado = 'Despacho'
            AND vd.tipo_producto = 'Pizza'
        )
      ORDER BY v.fecha_hora ASC`,
    );

    const pedidosCompletado = await Promise.all(
      ventas.map(async (venta) => {
        const [detalles] = await pool.query(
          `SELECT 
            vd.id_detalle,
            vd.cantidad,
            vd.nota,
            vd.estado AS estado_detalle,
            p.nombre AS nombre_producto,
            cp.categoria AS categoria_pizza 
          FROM venta_detalle vd
          LEFT JOIN pizza p ON p.id_pizza = vd.id_producto_origen
          LEFT JOIN categoria_pizza cp ON p.id_categoria_pizza = cp.id_categoria_pizza
          WHERE vd.id_venta = ? 
            AND vd.estado = 'Despacho' 
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

    res.json({ success: true, data: pedidosCompletado });
  } catch (error) {
    console.error("Error al obtener pedidos de horno:", error);
    res.status(500).json({ success: false, message: error.message });
  }
});

Router.get("/obtener-pedidos-mesero", async (req, res) => {
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
            AND vd.estado = 'Mesero'
            AND vd.tipo_producto = 'Pizza'
        )
      ORDER BY v.fecha_hora ASC`,
    );

    const pedidosCompletado = await Promise.all(
      ventas.map(async (venta) => {
        const [detalles] = await pool.query(
          `SELECT 
            vd.id_detalle,
            vd.cantidad,
            vd.nota,
            vd.estado AS estado_detalle,
            p.nombre AS nombre_producto,
            cp.categoria AS categoria_pizza 
          FROM venta_detalle vd
          LEFT JOIN pizza p ON p.id_pizza = vd.id_producto_origen
          LEFT JOIN categoria_pizza cp ON p.id_categoria_pizza = cp.id_categoria_pizza
          WHERE vd.id_venta = ? 
            AND vd.estado = 'Mesero' 
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

    res.json({ success: true, data: pedidosCompletado });
  } catch (error) {
    console.error("Error al obtener pedidos del mesero:", error);
    res.status(500).json({ success: false, message: error.message });
  }
});

Router.get("/obtener-pedidos-pendiente", async (req, res) => {
  try {
    const [ventas] = await pool.query(
      `SELECT DISTINCT
        v.id_venta,
        v.fecha_hora,
        v.despacho,
        c.nombre AS nombre_cliente,
        c.telefono AS telefono_cliente,
        d.digitos AS digitos_delivery
      FROM ventas v
      LEFT JOIN clientes c ON c.id_cliente = v.id_cliente
      LEFT JOIN delivery d ON d.id_delivery = v.id_delivery
      WHERE DATE(v.fecha_hora) = CURDATE()
        AND EXISTS (
          SELECT 1 FROM venta_detalle vd
          WHERE vd.id_venta = v.id_venta
            AND vd.estado = 'pDespacho'
            AND vd.tipo_producto = 'Pizza'
        )
      ORDER BY v.fecha_hora ASC`,
    );

    const pedidosCompletado = await Promise.all(
      ventas.map(async (venta) => {
        const [detalles] = await pool.query(
          `SELECT 
            vd.id_detalle,
            vd.cantidad,
            vd.nota,
            vd.estado AS estado_detalle,
            p.nombre AS nombre_producto,
            cp.categoria AS categoria_pizza 
          FROM venta_detalle vd
          LEFT JOIN pizza p ON p.id_pizza = vd.id_producto_origen
          LEFT JOIN categoria_pizza cp ON p.id_categoria_pizza = cp.id_categoria_pizza
          WHERE vd.id_venta = ? 
            AND vd.estado = 'pDespacho' 
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

    res.json({ success: true, data: pedidosCompletado });
  } catch (error) {
    console.error("Error al obtener pedidos de horno:", error);
    res.status(500).json({ success: false, message: error.message });
  }
});

Router.put("/actualizar-estado-pedido/:id_venta", async (req, res) => {
  const { id_venta } = req.params;
  const { status } = req.body;

  let nuevoEstado = "";
  let estadoAnterior = "";

  if (status === "preparing") {
    nuevoEstado = "Horno";
    estadoAnterior = "Pendiente";
  } else if (status === "ready") {
    nuevoEstado = "pDespacho";
    estadoAnterior = "Horno";
  } else if (status === "delivered") {
    nuevoEstado = "Despacho";
    estadoAnterior = "Horno";
  } else if (status === "waiter_pending") {
    nuevoEstado = "Mesero";
    estadoAnterior = "Despacho";
  } else if (status === "completed") {
    nuevoEstado = "Completado";
    estadoAnterior = "Despacho";
  } else {
    return res.status(400).json({
      success: false,
      message: "Estado de pedido no válido.",
    });
  }

  try {
    // Se elimina el filtro estricto del estado anterior en el WHERE
    const [result] = await pool.query(
      `UPDATE venta_detalle 
       SET estado = ? 
       WHERE id_venta = ? 
         AND tipo_producto = 'Pizza'`,
      [nuevoEstado, id_venta],
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: "No se encontraron pizzas para este pedido.",
      });
    }

    res.json({
      success: true,
      message: `Pedido actualizado a '${nuevoEstado}' exitosamente.`,
    });
  } catch (error) {
    console.error("Error al actualizar el pedido:", error);
    res.status(500).json({ success: false, message: error.message });
  }
});
export default Router;
