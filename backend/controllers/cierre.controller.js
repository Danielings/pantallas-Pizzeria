import pool from "../config/bd.js";

// Verificar si hay pedidos pendientes en la cola de trabajo
export const verificarPedidosPendientes = async (req, res) => {
  const { id_sucursal } = req.user;
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
          AND vd.estado != 'Cancelado'
          AND v.id_sucursal = ?
      );`,
      [id_sucursal],
    );
    const total = rows[0].total;
    return res.status(200).json({ pendientes: total, bloqueado: total > 0 });
  } catch (error) {
    console.error("Error al verificar pedidos pendientes:", error);
    return res.status(500).json({ mensaje: "Error interno del servidor" });
  }
};

export const obtenerResumenDia = async (req, res) => {
  const { id_sucursal } = req.user;
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
       WHERE ${dateCondition} AND estado = 'Completado' AND id_sucursal = ?`,
      [id_sucursal],
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
       WHERE ${dateCondition} AND estado = 'Rechazado' AND id_sucursal = ?`,
      [id_sucursal],
    );
    const anulaciones = Number(anulacionesHoy[0].total_anulaciones);

    // 5. Desglose de pagos
    let query = `SELECT 
        vp.metodo_pago,
        vp.referencia,
        IFNULL(SUM(vp.monto_usd), 0) AS total_usd,
        IFNULL(SUM(vp.monto_bs), 0) AS total_bs
       FROM ventas_pagos vp
       INNER JOIN ventas v ON v.id_venta = vp.id_venta
       WHERE DATE(v.fecha_hora) = (SELECT DATE(v2.fecha_hora) FROM ventas v2 WHERE ${dateCondition} LIMIT 1) 
         AND v.estado = 'Completado'
         AND v.id_sucursal = ?
       GROUP BY vp.metodo_pago, vp.referencia`;

    let gloria = [id_sucursal];
    const [pagosHoy] = await pool.query(query, gloria);

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

    // 6. Transacciones de la fecha seleccionada con sus desglose de pagos
    const [transacciones] = await pool.query(
      `SELECT 
        v.id_venta,
        DATE_FORMAT(v.fecha_hora, '%h:%i %p') AS hora,
        v.monto_total_usd,
        v.monto_total_bs,
        v.despacho,
        c.nombre AS nombre_cliente,
        (
          SELECT CONCAT('[', GROUP_CONCAT(
            JSON_OBJECT(
              'metodo_pago', vp.metodo_pago,
              'referencia', vp.referencia,
              'monto_usd', vp.monto_usd,
              'monto_bs', vp.monto_bs
            )
          ), ']')
          FROM ventas_pagos vp
          WHERE vp.id_venta = v.id_venta
        ) AS pagos
       FROM ventas v
       LEFT JOIN clientes c ON c.id_cliente = v.id_cliente
       WHERE DATE(v.fecha_hora) = (SELECT DATE(v2.fecha_hora) FROM ventas v2 WHERE ${dateCondition} LIMIT 1)
         AND v.estado = 'Completado'
         AND v.id_sucursal = ?
       ORDER BY v.fecha_hora DESC`,
      [id_sucursal],
    );

    const transaccionesProcesadas = transacciones.map((t) => {
      let pagos = [];
      if (t.pagos) {
        try {
          pagos = typeof t.pagos === "string" ? JSON.parse(t.pagos) : t.pagos;
        } catch (e) {
          console.error("Error al parsear pagos de la transacción:", e);
        }
      }
      return { ...t, pagos };
    });

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
      transacciones: transaccionesProcesadas,
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
    monto_efectivo_usd,
    monto_efectivo_bs,
    monto_punto_bs,
    monto_pago_movil_bs,
    total_usdt,
    num_ordenes,
  } = req.body;
  const { id_sucursal } = req.user;

  if (!pin || !String(pin).trim()) {
    return res
      .status(400)
      .json({ success: false, mensaje: "La clave de cierre es obligatoria." });
  }

  let connection;
  const LIMITE_CIERRES_DIARIOS = 3;

  try {
    connection = await pool.getConnection();

    const usuarioEjecutor = Number(req.user?.id);

    const [adminRows] = await connection.execute(
      `SELECT u.id_usuario 
      FROM usuarios u
      INNER JOIN pin p ON u.id_usuario = p.id_usuario
      WHERE u.id_usuario = ?
        AND (u.rol = 'admin' OR u.rol = 'cashier') 
        AND u.estado = 'Activo' 
        AND p.pin = ? 
      LIMIT 1`,
      [usuarioEjecutor, String(pin).trim()],
    );

    if (!adminRows || adminRows.length === 0) {
      connection.release();
      return res
        .status(401)
        .json({ success: false, mensaje: "Clave de cierre incorrecta" });
    }

    const [cierresHoy] = await connection.execute(
      `SELECT COUNT(*) as totalCierres 
       FROM cierres_caja 
       WHERE DATE(fecha_hora) = CURDATE()`,
    );

    const totalCierresRealizados = cierresHoy[0].totalCierres;

    if (totalCierresRealizados >= LIMITE_CIERRES_DIARIOS) {
      connection.release();
      return res.status(403).json({
        success: false,
        mensaje: `Límite alcanzado: Ya se han realizado los ${LIMITE_CIERRES_DIARIOS} cierres permitidos para hoy.`,
        cierres_restantes: 0,
      });
    }

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
        num_ordenes,
        id_sucursal
      ) VALUES (?, NOW(), ?, ?, ?, ?, ?, ?,?)`,
      [
        usuarioEjecutor,
        Number(monto_efectivo_usd || 0),
        Number(monto_efectivo_bs || 0),
        Number(monto_punto_bs || 0),
        Number(monto_pago_movil_bs || 0),
        Number(total_usdt || 0),
        Number(num_ordenes || 0),
        Number(id_sucursal || 0),
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

    const cierresRestantes =
      LIMITE_CIERRES_DIARIOS - (totalCierresRealizados + 1);

    return res.status(200).json({
      ok: true,
      success: true,
      mensaje: `Cierre de caja realizado exitosamente. Te quedan ${cierresRestantes} cierres disponibles por hoy.`,
      id_cierre: insertResult.insertId,
      cierres_restantes: cierresRestantes,
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

// Obtener historial de cierres y métricas para el panel de administración
export const obtenerHistorialCierres = async (req, res) => {
  try {
    // 1. Métricas del mes actual
    const [mesMetrics] = await pool.query(
      `SELECT 
        COUNT(*) AS cantidad_cierres,
        IFNULL(SUM(total_usdt), 0) AS total_usd,
        IFNULL(AVG(total_usdt), 0) AS promedio_usd
       FROM cierres_caja 
       WHERE MONTH(fecha_hora) = MONTH(CURRENT_DATE()) 
         AND YEAR(fecha_hora) = YEAR(CURRENT_DATE())`,
    );

    const cantidad_cierres = mesMetrics[0].cantidad_cierres;
    const total_usd = Number(mesMetrics[0].total_usd);
    const promedio_usd = Number(mesMetrics[0].promedio_usd);

    // 2. Última hora de cierre del día anterior (o el último cierre antes de hoy)
    const [lastClosureYesterday] = await pool.query(
      `SELECT DATE_FORMAT(fecha_hora, '%h:%i %p') AS hora, DATE(fecha_hora) AS fecha
       FROM cierres_caja 
       WHERE DATE(fecha_hora) < CURDATE() 
       ORDER BY fecha_hora DESC 
       LIMIT 1`,
    );

    const ultima_hora_ayer =
      lastClosureYesterday.length > 0
        ? `${lastClosureYesterday[0].hora} (${new Date(lastClosureYesterday[0].fecha).toLocaleDateString("es-ES", { day: "2-digit", month: "2-digit" })})`
        : "Ninguno";

    // 3. Obtener el listado completo de cierres ordenados por fecha desc por defecto
    const [cierres] = await pool.query(
      `SELECT c.*, u.nombre_completo AS usuario_nombre, s.sucursal, s.direccion AS sucursal_direccion
       FROM cierres_caja c
       INNER JOIN usuarios u ON c.id_usuario = u.id_usuario
       LEFT JOIN sucursal s ON c.id_sucursal = s.id_sucursal
       ORDER BY c.fecha_hora DESC`,
    );

    // Obtener mes actual en español
    const nombre_mes = new Date().toLocaleDateString("es-ES", {
      month: "long",
    });
    const nombre_mes_capitalizado =
      nombre_mes.charAt(0).toUpperCase() + nombre_mes.slice(1);

    return res.status(200).json({
      success: true,
      metrics: {
        mes: nombre_mes_capitalizado,
        cantidad_cierres,
        total_usd,
        promedio_usd,
        ultima_hora_ayer,
      },
      cierres,
    });
  } catch (error) {
    console.error("Error al obtener historial de cierres:", error);
    return res
      .status(500)
      .json({ success: false, mensaje: "Error interno del servidor" });
  }
};

// Obtener cajeros activos para gestionar su PIN de cierre
export const obtenerCajeros = async (req, res) => {
  try {
    const [cajeros] = await pool.query(
      `SELECT u.id_usuario, u.nombre_completo, u.email, p.pin 
       FROM usuarios u
       LEFT JOIN pin p ON u.id_usuario = p.id_usuario
       WHERE rol = 'cashier' AND estado = 'Activo'`,
    );
    return res.status(200).json({ success: true, cajeros });
  } catch (error) {
    console.error("Error al obtener cajeros:", error);
    return res
      .status(500)
      .json({ success: false, mensaje: "Error interno del servidor" });
  }
};

// Actualizar el PIN de cierre de un cajero (debe ser de 4 dígitos)
export const actualizarPinCajero = async (req, res) => {
  const { id_usuario, pin } = req.body;

  if (!id_usuario) {
    return res
      .status(400)
      .json({ success: false, mensaje: "ID de usuario requerido" });
  }

  // Validar PIN de 4 números
  const pinRegex = /^\d{4}$/;
  if (pin !== null && pin !== "" && !pinRegex.test(String(pin))) {
    return res.status(400).json({
      success: false,
      mensaje: "El PIN debe tener exactamente 4 números",
    });
  }

  try {
    const [user] = await pool.query(
      `SELECT id_usuario FROM usuarios WHERE id_usuario = ? AND rol = 'cashier'`,
      [id_usuario],
    );

    if (user.length === 0) {
      return res
        .status(404)
        .json({ success: false, mensaje: "Cajero no encontrado" });
    }

    // Validar que el PIN no esté en uso por otro cajero
    if (pin) {
      const [pinDuplicado] = await pool.query(
        `SELECT p.id_pin FROM pin p WHERE p.pin = ? AND p.id_usuario != ?`,
        [String(pin), id_usuario],
      );

      if (pinDuplicado.length > 0) {
        return res.status(409).json({
          success: false,
          mensaje:
            "Ese PIN ya está en uso por otro cajero. Elige uno diferente.",
        });
      }
    }

    const [pinExistente] = await pool.query(
      `SELECT id_pin FROM pin WHERE id_usuario = ?`,
      [id_usuario],
    );

    if (pinExistente.length > 0) {
      await pool.query(`UPDATE pin SET pin = ? WHERE id_usuario = ?`, [
        pin || null,
        id_usuario,
      ]);
    } else {
      await pool.query(`INSERT INTO pin (id_usuario, pin) VALUES (?, ?)`, [
        id_usuario,
        pin || null,
      ]);
    }

    return res
      .status(200)
      .json({ success: true, mensaje: "PIN actualizado correctamente" });
  } catch (error) {
    console.error("Error al actualizar PIN de cajero:", error);
    return res
      .status(500)
      .json({ success: false, mensaje: "Error interno del servidor" });
  }
};
