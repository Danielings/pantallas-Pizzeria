import pool from "../config/bd.js";
import { emitPusherEvent } from "../config/pusher.js";

//--------------------------Pedidos

export const obtenerPedidosCocina = async (req, res) => {
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
};

export const obtenerPedidosHorno = async (req, res) => {
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
};

export const obtenerPedidosDespacho = async (req, res) => {
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
};

export const obtenerPedidosMesero = async (req, res) => {
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
    console.error("Error al obtener pedidos del mesero:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

export const obtenerPedidosPendiente = async (req, res) => {
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
};

export const obtenerContadorCajero = async (req, res) => {
  const { id_sucursal } = req.user;
  try {
    let query = `SELECT COUNT(vd.id_detalle) AS total
       FROM venta_detalle vd
       JOIN ventas v ON vd.id_venta = v.id_venta
       WHERE vd.estado != 'Completado' AND vd.estado != 'Cerrado' AND v.estado != 'Reembolsado'
         AND DATE(v.fecha_hora) = CURDATE()
         AND v.id_sucursal = ?`;
    let paparemericano = [id_sucursal];
    const [result] = await pool.query(query, paparemericano);

    res.json({
      success: true,
      total: result[0].total,
    });
  } catch (error) {
    console.error("Error al obtener pedidos del cajero:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

export const actualizarEstadoPedido = async (req, res) => {
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
  } else if (status === "pending") {
    nuevoEstado = "Pendiente";
    estadoAnterior = "Horno";
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

    emitPusherEvent("pizzeria-kitchen", "pedido_estado_cambiado", {
      id_venta,
      estado: nuevoEstado,
      tipo_evento: "pedido_estado_cambiado",
      timestamp: Date.now(),
    });

    emitPusherEvent("pizzeria-orders", "pedido_actualizado", {
      id_venta,
      estado: nuevoEstado,
      tipo_evento: "pedido_actualizado",
      timestamp: Date.now(),
    });

    res.json({
      success: true,
      message: `Pedido actualizado a '${nuevoEstado}' exitosamente.`,
    });
  } catch (error) {
    console.error("Error al actualizar el pedido:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

//-----------------------------Entregas

export const obtenerEntregas = async (req, res) => {
  const { id_sucursal } = req.user;
  try {
    let query = `SELECT DISTINCT
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
      WHERE v.despacho IN ('Delivery', 'Pick Up', 'Local', 'Llevar')
        AND DATE(v.fecha_hora) = CURDATE()
        AND v.estado != 'Reembolsado'
        AND v.id_sucursal = ?
      ORDER BY v.fecha_hora ASC`;

    let paparamericano = [id_sucursal];
    const [ventas] = await pool.query(query, paparamericano);

    const ordenes = await Promise.all(
      ventas.map(async (venta) => {
        const [detalles] = await pool.query(
          `SELECT 
            vd.id_detalle,
            vd.cantidad,
            vd.tipo_producto,
            vd.estado AS estado_detalle,
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
          [venta.id_venta],
        );

        const items = detalles.map((det) => ({
          name: det.nombre_producto || det.tipo_producto,
          quantity: det.cantidad,
          type: det.tipo_producto,
          status: det.estado_detalle,
        }));

        const estaCerrada =
          detalles.length > 0 &&
          detalles.every((det) => det.estado_detalle === "Cerrado");

        if (estaCerrada) return null;

        // La orden solo está lista para entregar cuando TODOS los ítems están en estado "Despacho"
        const todosEnDespacho =
          detalles.length > 0 &&
          detalles.every((det) => det.estado_detalle === "Despacho");

        const estaEntregada =
          detalles.length > 0 &&
          detalles.every(
            (det) =>
              det.estado_detalle === "Completado" ||
              det.estado_detalle === "Cerrado",
          );

        return {
          id: venta.id_venta,
          type:
            venta.despacho === "Delivery"
              ? "delivery"
              : venta.despacho === "Pick Up"
                ? "pickup"
                : venta.despacho === "Local"
                  ? "local"
                  : "llevar",
          customerName: venta.nombre_cliente || "Desconocido",
          address: venta.direccion_cliente || "",
          phone: venta.telefono_cliente || "",
          items: items,
          total: venta.monto_total_usd,
          orderedAt: venta.fecha_hora,
          status: estaEntregada
            ? "delivered"
            : todosEnDespacho
              ? "ready"
              : "preparing",
        };
      }),
    );

    const ordenesFiltradas = ordenes.filter((o) => o !== null);

    res.json(ordenesFiltradas);
  } catch (error) {
    console.error("Error fetching entregas:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const actualizarEntrega = async (req, res) => {
  const { id_venta } = req.params;

  try {
    const [result] = await pool.query(
      `UPDATE venta_detalle 
       SET estado = 'Completado' 
       WHERE id_venta = ?`,
      [id_venta],
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: "No se encontraron detalles para este pedido.",
      });
    }

    res.json({
      success: true,
      message: "Pedido entregado exitosamente.",
    });
  } catch (error) {
    console.error("Error al completar el pedido:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};
