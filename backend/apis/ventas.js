import express from "express";
import pool from "../config/bd.js";

const Router = express.Router();

Router.post("/procesar-venta", async (req, res) => {
  const {
    id_cliente,
    id_usuario,
    despacho,
    tasa_cambio,
    monto_total_usd,
    monto_total_bs,
    pagos,
    detalles,
  } = req.body;

  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    const [resultVenta] = await connection.query(
      `INSERT INTO ventas 
      (id_cliente, id_usuario, despacho, estado, fecha_hora, tasa_cambio, monto_total_usd, monto_total_bs) 
      VALUES (?, ?, ?, 'Completado', NOW(), ?, ?, ?)`,
      [
        id_cliente,
        id_usuario,
        despacho,
        tasa_cambio,
        monto_total_usd,
        monto_total_bs,
      ],
    );

    const id_venta = resultVenta.insertId;

    // Insertar los metoditos de pago
    for (const pago of pagos) {
      await connection.query(
        `INSERT INTO ventas_pagos 
        (id_venta, metodo_pago, monto_usd, monto_bs, referencia) 
        VALUES (?, ?, ?, ?, ?)`,
        [
          id_venta,
          pago.metodo,
          pago.monto_usd,
          pago.monto_bs,
          pago.referencia || null,
        ],
      );
    }

    //  Ahora los detalles de la venta
    for (const item of detalles) {
      let estadoInicial = "Pendiente"; // Para la pizza

      if (item.tipo_producto === "Bebida" || item.tipo_producto === "Helado") {
        estadoInicial = "Completado";
      }

      const [resultDetalle] = await connection.query(
        `INSERT INTO venta_detalle 
        (id_venta, tipo_producto, id_producto_origen, cantidad, monto_total, nota, estado) 
        VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [
          id_venta,
          item.tipo_producto,
          item.id_producto_origen,
          item.cantidad,
          item.monto_total,
          item.nota,
          estadoInicial,
        ],
      );

      const id_detalle = resultDetalle.insertId;

      // Los extras de la pizza y no extras de peliculas, ojo
      if (item.extras && item.extras.length > 0) {
        for (const id_extra of item.extras) {
          await connection.query(
            `INSERT INTO detalle_venta_extras (id_detalle, id_extra) VALUES (?, ?)`,
            [id_detalle, id_extra],
          );
        }
      }
    }

    // Si salio bien, lo guardamos en la bd.
    await connection.commit();

    res.status(201).json({
      success: true,
      message: "Venta procesada exitosamente",
      id_venta: id_venta,
    });
  } catch (error) {
    // Si existe un problema, deshacemos todo lo que se hizo en la transacción, lol
    await connection.rollback();
    console.error("Error al procesar la venta:", error);
    res.status(500).json({
      success: false,
      message: "Error procesando la venta",
      error: error.message,
    });
  } finally {
    // Liberamos la conexion para que no se sature el servidor
    connection.release();
  }
});

Router.put("/editar-venta", async (req, res) => {
  const {
    id_venta,
    nuevo_despacho,
    tasa_cambio,
    monto_total_usd,
    monto_total_bs,
    detalles_actualizados,
    info_pago,
  } = req.body;

  if (!id_venta) {
    return res.status(400).json({
      success: false,
      message: "El id_venta es obligatorio para actualizar el pedido.",
    });
  }

  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    const updates = [];
    const params = [];

    if (nuevo_despacho) {
      updates.push("despacho = ?");
      params.push(nuevo_despacho);
    }

    if (tasa_cambio != null) {
      updates.push("tasa_cambio = ?");
      params.push(tasa_cambio);
    }

    if (monto_total_usd != null) {
      updates.push("monto_total_usd = ?");
      params.push(monto_total_usd);
    }

    if (monto_total_bs != null) {
      updates.push("monto_total_bs = ?");
      params.push(monto_total_bs);
    }

    if (updates.length > 0) {
      params.push(id_venta);
      await connection.query(
        `UPDATE ventas SET ${updates.join(", ")} WHERE id_venta = ?`,
        params,
      );
    }

    if (Array.isArray(detalles_actualizados)) {
      for (const item of detalles_actualizados) {
        if (item.id_detalle) {
          await connection.query(
            `UPDATE venta_detalle
             SET tipo_producto = ?, id_producto_origen = ?, cantidad = ?, monto_total = ?, nota = ?
             WHERE id_detalle = ?`,
            [
              item.tipo_producto,
              item.id_producto_origen,
              item.cantidad,
              item.monto_total,
              item.nota || "",
              item.id_detalle,
            ],
          );

          await connection.query(
            `DELETE FROM detalle_venta_extras WHERE id_detalle = ?`,
            [item.id_detalle],
          );

          if (Array.isArray(item.extras) && item.extras.length > 0) {
            for (const id_extra of item.extras) {
              await connection.query(
                `INSERT INTO detalle_venta_extras (id_detalle, id_extra) VALUES (?, ?)`,
                [item.id_detalle, id_extra],
              );
            }
          }
        } else {
          const [resultDetalle] = await connection.query(
            `INSERT INTO venta_detalle
             (id_venta, tipo_producto, id_producto_origen, cantidad, monto_total, nota, estado)
             VALUES (?, ?, ?, ?, ?, ?, 'Pendiente')`,
            [
              id_venta,
              item.tipo_producto,
              item.id_producto_origen,
              item.cantidad,
              item.monto_total,
              item.nota || "",
            ],
          );

          const id_detalle = resultDetalle.insertId;
          if (Array.isArray(item.extras) && item.extras.length > 0) {
            for (const id_extra of item.extras) {
              await connection.query(
                `INSERT INTO detalle_venta_extras (id_detalle, id_extra) VALUES (?, ?)`,
                [id_detalle, id_extra],
              );
            }
          }
        }
      }
    }

    if (info_pago) {
      await connection.query(
        `INSERT INTO ventas_pagos
         (id_venta, metodo_pago, monto_usd, monto_bs, referencia)
         VALUES (?, ?, ?, ?, ?)`,
        [
          id_venta,
          info_pago.metodo,
          info_pago.monto_usd,
          info_pago.monto_bs || 0,
          info_pago.referencia || null,
        ],
      );
    }

    await connection.commit();

    res.status(200).json({
      success: true,
      message: "Pedido actualizado correctamente",
    });
  } catch (error) {
    await connection.rollback();
    console.error("Error al actualizar el pedido:", error);
    res.status(500).json({
      success: false,
      message: "Error actualizando el pedido",
      error: error.message,
    });
  } finally {
    connection.release();
  }
});

// ─── GET /metodos-pago ────────────────────────────────────────────────────────
// Acepta ?clientes=id1,id2,... para filtrar solo los pagos de esos clientes.
Router.get("/metodos-pago", async (req, res) => {
  try {
    const clientes = (req.query.clientes || "")
      .split(",")
      .map((id) => Number(id.trim()))
      .filter((id) => Number.isInteger(id) && id > 0);

    const params = [];
    let filtro = "";
    if (clientes.length) {
      filtro = "WHERE v.id_cliente IN (?)";
      params.push(clientes);
    }

    const [rows] = await pool.query(
      `SELECT vp.metodo_pago AS metodo,
              COUNT(*)              AS cantidad,
              COUNT(DISTINCT vp.id_venta) AS ventas,
              SUM(vp.monto_usd)        AS total_usd,
              SUM(vp.monto_bs)         AS total_bs
       FROM ventas_pagos vp
       INNER JOIN ventas v ON v.id_venta = vp.id_venta
       ${filtro}
       GROUP BY vp.metodo_pago
       ORDER BY cantidad DESC`,
      params,
    );

    res.json({ success: true, data: rows });
  } catch (error) {
    console.error("Error al obtener métodos de pago:", error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// ─── GET /obtener-ventas-hoy ───────────────────────────────────────────────────
// Devuelve las métricas del día: ingresos totales en USD, cantidad de pizzas
Router.get("/obtener-ventas-hoy", async (req, res) => {
  try {
    // Ventas completadas del día actual
    const [ventas] = await pool.query(
      `SELECT 
        v.id_venta,
        v.monto_total_usd,
        v.monto_total_bs,
        v.despacho,
        v.fecha_hora,
        c.nombre AS nombre_cliente,
        c.cedula  AS cedula_cliente,
        (
          SELECT SUM(vd.cantidad)
          FROM venta_detalle vd
          WHERE vd.id_venta = v.id_venta AND vd.tipo_producto = 'Pizza'
        ) AS pizzas_vendidas
      FROM ventas v
      LEFT JOIN clientes c ON c.id_cliente = v.id_cliente
      WHERE DATE(v.fecha_hora) = CURDATE()
        AND v.estado = 'Completado'
      ORDER BY v.fecha_hora DESC`,
    );

    const totalRevenue = ventas.reduce(
      (s, v) => s + (v.monto_total_usd || 0),
      0,
    );
    const totalPizzas = ventas.reduce(
      (s, v) => s + (Number(v.pizzas_vendidas) || 0),
      0,
    );
    const avgTicket = ventas.length > 0 ? totalRevenue / ventas.length : 0;

    res.json({
      success: true,
      data: {
        ventas,
        totalRevenue,
        totalPizzas,
        avgTicket,
        totalTransactions: ventas.length,
      },
    });
  } catch (error) {
    console.error("Error al obtener ventas del día:", error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// ─── GET /obtener-pedidos-activos ──────────────────────────────────────────────

Router.get("/obtener-pedidos-activos", async (req, res) => {
  try {
    // Ventas que tienen al menos un detalle pendiente/en proceso
    const [ventas] = await pool.query(
      `SELECT DISTINCT
        v.id_venta,
        v.fecha_hora,
        v.despacho,
        v.monto_total_usd,
        v.monto_total_bs,
        v.estado,
        c.id_cliente,
        c.nombre    AS nombre_cliente,
        c.cedula    AS cedula_cliente,
        c.telefono  AS telefono_cliente
      FROM ventas v
      LEFT JOIN clientes c ON c.id_cliente = v.id_cliente
      WHERE DATE(v.fecha_hora) = CURDATE()
        AND EXISTS (
          SELECT 1 FROM venta_detalle vd
          WHERE vd.id_venta = v.id_venta
            AND vd.estado != 'Completado'
        )
      ORDER BY v.fecha_hora DESC`,
    );

    // Para cada venta traemos sus detalles
    const pedidos = await Promise.all(
      ventas.map(async (venta) => {
        const [detalles] = await pool.query(
          `SELECT 
            vd.id_detalle,
            vd.tipo_producto,
            vd.id_producto_origen,
            vd.cantidad,
            vd.monto_total,
            vd.nota,
            vd.estado AS estado_detalle,
            COALESCE(p.nombre, b.nombre, h.nombre) AS nombre_producto,
            p.id_categoria_pizza 
          FROM venta_detalle vd
          LEFT JOIN pizza     p  ON p.id_pizza      = vd.id_producto_origen AND vd.tipo_producto = 'Pizza'
          LEFT JOIN bebidas   b  ON b.id_bebida     = vd.id_producto_origen AND vd.tipo_producto = 'Bebida'
          LEFT JOIN heladeria h  ON h.id_heladeria  = vd.id_producto_origen AND vd.tipo_producto = 'Helado'
          WHERE vd.id_venta = ?`,
          [venta.id_venta],
        );

        // Extras de cada detalle
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

        return { ...venta, detalles: detallesConExtras };
      }),
    );

    res.json({ success: true, data: pedidos });
  } catch (error) {
    console.error("Error al obtener pedidos activos:", error);
    res.status(500).json({ success: false, message: error.message });
  }
});

export default Router;
