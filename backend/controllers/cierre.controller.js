import pool from "../config/bd.js";

// Verificar si hay pedidos pendientes en la cola de trabajo
export const verificarPedidosPendientes = async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT COUNT(DISTINCT v.id_venta) AS total
      FROM ventas v
      WHERE DATE(v.fecha_hora) = CURDATE()
        AND v.estado != 'Rechazado'
        AND EXISTS (
        SELECT 1 FROM venta_detalle vd
        WHERE vd.id_venta = v.id_venta
          AND vd.estado != 'Completado' 
          AND vd.estado != 'Cerrado'
      );`,
    );
    const total = rows[0].total;
    return res.status(200).json({ pendientes: total, bloqueado: total > 0 });
  } catch (error) {
    console.error("Error al verificar pedidos pendientes:", error);
    return res.status(500).json({ mensaje: "Error interno del servidor" });
  }
};

export const obtenerResumenDia = async (req, res) => {
  try {
    // 1. Verificar si hay ventas hoy. Si no las hay, tomamos la última fecha con ventas para mostrar datos reales.
    let dateCondition = "DATE(fecha_hora) = CURDATE()";
    let dateLabel = new Date().toLocaleDateString("es-ES", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    });

    const [checkHoy] = await pool.query(
      `SELECT COUNT(*) AS c FROM ventas WHERE DATE(fecha_hora) = CURDATE() AND estado = 'Completado'`,
    );

    if (checkHoy[0].c === 0) {
      const [lastDateRow] = await pool.query(
        `SELECT DATE(fecha_hora) AS last_date FROM ventas WHERE estado = 'Completado' ORDER BY fecha_hora DESC LIMIT 1`,
      );
      if (lastDateRow.length > 0) {
        const lastDate = lastDateRow[0].last_date;
        // Convert to YYYY-MM-DD
        const formattedDate = new Date(lastDate).toISOString().split("T")[0];
        dateCondition = `DATE(fecha_hora) = '${formattedDate}'`;
        dateLabel = new Date(lastDate).toLocaleDateString("es-ES", {
          year: "numeric",
          month: "2-digit",
          day: "2-digit",
        });
      }
    }

    // 2. Obtener total ventas y cantidad de órdenes
    const [ventasHoy] = await pool.query(
      `SELECT 
        COUNT(*) AS total_ordenes,
        IFNULL(SUM(monto_total_usd), 0) AS ventas_totales
       FROM ventas 
       WHERE ${dateCondition} AND estado = 'Completado'`,
    );

    const total_ordenes = ventasHoy[0].total_ordenes;
    const ventas_totales = Number(ventasHoy[0].ventas_totales);

    // 3. Ticket promedio
    const ticket_promedio =
      total_ordenes > 0 ? ventas_totales / total_ordenes : 0;

    // 4. Anulaciones (ventas con estado 'Rechazado')
    const [anulacionesHoy] = await pool.query(
      `SELECT IFNULL(SUM(monto_total_usd), 0) AS total_anulaciones
       FROM ventas
       WHERE ${dateCondition} AND estado = 'Rechazado'`,
    );
    const anulaciones = Number(anulacionesHoy[0].total_anulaciones);

    // 5. Desglose de pagos
    const [pagosHoy] = await pool.query(
      `SELECT 
        vp.metodo_pago,
        vp.referencia,
        IFNULL(SUM(vp.monto_usd), 0) AS total_usd,
        IFNULL(SUM(vp.monto_bs), 0) AS total_bs
       FROM ventas_pagos vp
       INNER JOIN ventas v ON v.id_venta = vp.id_venta
       WHERE DATE(v.fecha_hora) = (SELECT DATE(v2.fecha_hora) FROM ventas v2 WHERE ${dateCondition} LIMIT 1) 
         AND v.estado = 'Completado'
       GROUP BY vp.metodo_pago, vp.referencia`,
    );

    let efectivo_usd = 0;
    let efectivo_bs = 0;
    let punto_de_venta_bs = 0; // Punto de Venta opera en Bs.
    let transferencia_bs = 0; // Pago Móvil / Transferencia opera en Bs.

    pagosHoy.forEach((p) => {
      const metodo = p.metodo_pago.toLowerCase();
      const ref = p.referencia ? p.referencia.toUpperCase() : "";

      if (metodo.includes("efectivo")) {
        if (ref === "BS") {
          efectivo_bs += Number(p.total_bs);
        } else {
          efectivo_usd += Number(p.total_usd);
        }
      } else if (metodo.includes("punto") || metodo.includes("tarjeta")) {
        punto_de_venta_bs += Number(p.total_bs);
      } else {
        // Pago_Movil, transferencia, etc.
        transferencia_bs += Number(p.total_bs);
      }
    });

    // Obtener la tasa de cambio activa del sistema
    let tasa_cambio = 1.0;
    const [tasaRows] = await pool.query(
      "SELECT tasa_sistema FROM configuracion_tasa WHERE id_config = 1",
    );
    if (tasaRows.length > 0) {
      tasa_cambio = Number(tasaRows[0].tasa_sistema);
    }

    const salidas_efectivo = 15.0;
    const propinas = ventas_totales * 0.05;

    // Convertir todos los montos en Bs. a USD usando la tasa activa
    const efectivo_bs_en_usd = tasa_cambio > 0 ? efectivo_bs / tasa_cambio : 0;
    const punto_de_venta_en_usd =
      tasa_cambio > 0 ? punto_de_venta_bs / tasa_cambio : 0;
    const transferencia_en_usd =
      tasa_cambio > 0 ? transferencia_bs / tasa_cambio : 0;

    // Total general en divisa (USDT) — suma todos los canales convertidos
    const total_divisa = Number(
      (
        efectivo_usd +
        efectivo_bs_en_usd +
        punto_de_venta_en_usd +
        transferencia_en_usd
      ).toFixed(2),
    );

    // 6. Transacciones recientes de la fecha seleccionada
    const [transacciones] = await pool.query(
      `SELECT 
        v.id_venta,
        DATE_FORMAT(v.fecha_hora, '%h:%i %p') AS hora,
        v.monto_total_usd,
        v.despacho,
        c.nombre AS nombre_cliente
       FROM ventas v
       LEFT JOIN clientes c ON c.id_cliente = v.id_cliente
       WHERE DATE(v.fecha_hora) = (SELECT DATE(v2.fecha_hora) FROM ventas v2 WHERE ${dateCondition} LIMIT 1)
         AND v.estado = 'Completado'
       ORDER BY v.fecha_hora DESC
       LIMIT 5`,
    );

    const resumen = {
      fecha_consulta: dateLabel,
      tasa_cambio,
      total_divisa,
      ventas_totales,
      total_ordenes,
      ticket_promedio,
      anulaciones,
      propinas,
      desglose_pagos: {
        efectivo_usd,
        efectivo_bs,
        punto_de_venta_bs, // en Bs.
        transferencia_bs, // en Bs.
      },
      salidas_efectivo,
      transacciones,
    };

    return res.status(200).json(resumen);
  } catch (error) {
    console.error("Error al obtener resumen real de cierre de caja:", error);
    return res.status(500).json({ mensaje: "Error interno del servidor" });
  }
};

export const cerrarCaja = async (req, res) => {
  const {
    pin,
    id_usuario,
    monto_efectivo_usd,
    monto_efectivo_bs,
    monto_punto_bs,
    monto_pago_movil_bs,
    total_usdt,
    num_ordenes,
  } = req.body;

  if (!pin || !String(pin).trim()) {
    return res
      .status(400)
      .json({ success: false, mensaje: "La clave de cierre es obligatoria." });
  }

  let connection;

  try {
    connection = await pool.getConnection();

    const [adminRows] = await connection.execute(
      `SELECT id_usuario 
       FROM usuarios 
       WHERE (rol = 'admin' OR rol = 'cashier') 
         AND estado = 'Activo' 
         AND pin = ? 
       LIMIT 1`,
      [String(pin).trim()],
    );

    if (!adminRows || adminRows.length === 0) {
      connection.release();
      return res
        .status(401)
        .json({ success: false, mensaje: "Clave de cierre incorrecta" });
    }

    const usuarioEjecutor = Number(id_usuario || adminRows[0].id_usuario || 0);

    await connection.beginTransaction();

    const [insertResult] = await connection.execute(
      `INSERT INTO cierres_caja (
        id_usuario,
        fecha_hora,
        monto_efectivo_usd,
        monto_efectivo_bs,
        monto_punto_bs,
        monto_pago_movil_bs,
        total_usdt,
        num_ordenes
      ) VALUES (?, NOW(), ?, ?, ?, ?, ?, ?)`,
      [
        usuarioEjecutor,
        Number(monto_efectivo_usd || 0),
        Number(monto_efectivo_bs || 0),
        Number(monto_punto_bs || 0),
        Number(monto_pago_movil_bs || 0),
        Number(total_usdt || 0),
        Number(num_ordenes || 0),
      ],
    );

    await connection.execute(
      `UPDATE ventas
       SET estado = 'Cerrado'
       WHERE estado IN ('Pendiente', 'Completado')`,
    );

    await connection.execute(
      `UPDATE venta_detalle
       SET estado = 'Cerrado'
       WHERE estado <> 'Cerrado'`,
    );

    await connection.commit();

    return res.status(200).json({
      ok: true,
      success: true,
      mensaje: "Cierre de caja realizado exitosamente",
      id_cierre: insertResult.insertId,
    });
  } catch (error) {
    if (connection) {
      try {
        await connection.rollback();
      } catch (rollbackErr) {
        console.error("Error ejecutando rollback:", rollbackErr);
      }
    }

    console.error("Error al cerrar caja:", error);
    return res.status(500).json({
      success: false,
      mensaje: "Error interno del servidor al realizar el cierre de caja.",
    });
  } finally {
    if (connection) connection.release();
  }
};
