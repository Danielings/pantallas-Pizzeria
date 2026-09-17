import db from "../config/turso.js";

// Verificar si hay pedidos pendientes en la cola de trabajo
export const verificarPedidosPendientes = async (req, res) => {
  const { id_sucursal } = req.user;
  try {
    const results = await db.execute({
      sql: `
      SELECT COUNT(DISTINCT v.id_venta) AS total
      FROM ventas v
      WHERE DATE(v.fecha_hora) = DATE('now', '-4 hours')
        AND v.estado != 'Rechazado'
        AND EXISTS (
        SELECT 1 FROM venta_detalle vd
        WHERE vd.id_venta = v.id_venta
          AND vd.estado != 'Completado' 
          AND vd.estado != 'Cerrado'
          AND vd.estado != 'Cancelado'
          AND v.id_sucursal = ?
      );`,
      args: [id_sucursal],
    });
    const total = results.rows[0].total;
    return res.status(200).json({ pendientes: total, bloqueado: total > 0 });
  } catch (error) {
    console.error("Error al verificar pedidos pendientes:", error);
    return res.status(500).json({ mensaje: "Error interno del servidor" });
  }
};

// Verificar si existe un cierre pendiente de un "día lógico" anterior
// El día lógico corta a las 5:00 AM local (UTC-4) => fecha_hora se ajusta con '-9 hours'
// Consulta ultra-ligera con LIMIT 1: solo comprueba la existencia de al menos 1 venta.
export const verificarCierrePendiente = async (req, res) => {
  const { id_sucursal } = req.user;
  try {
    const results = await db.execute({
      sql: `
        SELECT 1
        FROM ventas
        WHERE estado = 'Completado'
          AND DATE(fecha_hora, '-9 hours') < DATE('now', '-9 hours')
          AND id_sucursal = ?
        LIMIT 1`,
      args: [id_sucursal],
    });
    return res.status(200).json({ pendiente: results.rows.length > 0 });
  } catch (error) {
    console.error("Error al verificar cierre pendiente:", error);
    return res.status(500).json({ mensaje: "Error interno del servidor" });
  }
};

export const obtenerResumenDia = async (req, res) => {
  const { id_sucursal } = req.user;
  try {
    // 1. Determinar el día lógico a mostrar: si hay un cierre pendiente de un
    //    día anterior se muestra ESE día; si no, el día lógico actual.
    //    Día lógico: corte 5:00 AM local (UTC-4) => aplicar '-9 hours' sobre UTC.
    const diaRow = await db.execute({
      sql: `
        SELECT COALESCE(
          (SELECT DATE(MIN(fecha_hora), '-9 hours')
             FROM ventas
            WHERE estado = 'Completado'
              AND DATE(fecha_hora, '-9 hours') < DATE('now', '-9 hours')
              AND id_sucursal = ?),
          DATE('now', '-9 hours')
        ) AS fecha_meta`,
      args: [id_sucursal],
    });

    const fechaMeta = String(diaRow.rows[0].fecha_meta);
    const [anioMeta, mesMeta, diaMeta] = fechaMeta.split("-");
    const dateLabel = `${diaMeta}/${mesMeta}/${anioMeta}`;

    // Filtro común: todas las consultas usan el MISMO día lógico (-9 hours).
    const conDia = "DATE(fecha_hora, '-9 hours') = ?";

    // 2. Obtener total ventas y cantidad de órdenes
    const ventasHoy = await db.execute({
      sql: `SELECT 
        COUNT(*) AS total_ordenes,
        IFNULL(SUM(monto_total_usd), 0) AS ventas_totales
       FROM ventas 
       WHERE ${conDia} AND estado = 'Completado' AND id_sucursal = ?`,
      args: [fechaMeta, id_sucursal],
    });

    const total_ordenes = Number(ventasHoy.rows[0].total_ordenes);
    const ventas_totales = Number(ventasHoy.rows[0].ventas_totales);

    // 3. Ticket promedio
    const ticket_promedio =
      total_ordenes > 0 ? ventas_totales / total_ordenes : 0;

    // 4. Anulaciones (Reemplazado pool por db.execute y arreglado .rows)
    const anulacionesHoy = await db.execute({
      sql: `SELECT IFNULL(SUM(monto_total_usd), 0) AS total_anulaciones
       FROM ventas
       WHERE ${conDia} AND estado = 'Rechazado' AND id_sucursal = ?`,
      args: [fechaMeta, id_sucursal],
    });
    const anulaciones = Number(anulacionesHoy.rows[0].total_anulaciones);

    // 5. Desglose de pagos
    const queryPagos = `SELECT 
        vp.metodo_pago,
        vp.referencia,
        IFNULL(SUM(vp.monto_usd), 0) AS total_usd,
        IFNULL(SUM(vp.monto_bs), 0) AS total_bs
       FROM ventas_pagos vp
       INNER JOIN ventas v ON v.id_venta = vp.id_venta
       WHERE DATE(v.fecha_hora, '-9 hours') = ?
         AND v.estado = 'Completado'
         AND v.id_sucursal = ?
       GROUP BY vp.metodo_pago, vp.referencia`;

    const pagosHoy = await db.execute({
      sql: queryPagos,
      args: [fechaMeta, id_sucursal],
    });

    let efectivo_usd = 0;
    let efectivo_bs = 0;
    let punto_de_venta_bs = 0;
    let transferencia_bs = 0;
    let binance_usd = 0;

    // Iteramos sobre pagosHoy.rows
    pagosHoy.rows.forEach((p) => {
      const metodo = String(p.metodo_pago).toLowerCase();
      const ref = p.referencia ? String(p.referencia).toUpperCase() : "";

      if (metodo.includes("efectivo")) {
        if (ref === "BS") {
          efectivo_bs += Number(p.total_bs);
        } else {
          efectivo_usd += Number(p.total_usd);
        }
      } else if (metodo.includes("punto") || metodo.includes("tarjeta")) {
        punto_de_venta_bs += Number(p.total_bs);
      } else if (metodo.includes("binance") || metodo.includes("zelle")) {
        binance_usd += Number(p.total_usd);
      } else {
        transferencia_bs += Number(p.total_bs);
      }
    });

    // Obtener la tasa de cambio activa
    let tasa_cambio = 1.0;
    const tasaRows = await db.execute({
      sql: "SELECT tasa_sistema FROM configuracion_tasa WHERE id_config = 1",
    });
    if (tasaRows.rows.length > 0) {
      tasa_cambio = Number(tasaRows.rows[0].tasa_sistema);
    }

    const salidas_efectivo = 15.0;
    const propinas = ventas_totales * 0.05;

    const efectivo_bs_en_usd = tasa_cambio > 0 ? efectivo_bs / tasa_cambio : 0;
    const punto_de_venta_en_usd =
      tasa_cambio > 0 ? punto_de_venta_bs / tasa_cambio : 0;
    const transferencia_en_usd =
      tasa_cambio > 0 ? transferencia_bs / tasa_cambio : 0;

    const total_divisa = Number(
      (
        efectivo_usd +
        binance_usd +
        efectivo_bs_en_usd +
        punto_de_venta_en_usd +
        transferencia_en_usd
      ).toFixed(2),
    );

    // 6. Transacciones (Sintaxis de fecha strftime y JSON nativo de SQLite)
    const transacciones = await db.execute({
      sql: `SELECT 
        v.id_venta,
        strftime('%I:%M %p', v.fecha_hora) AS hora,
        v.monto_total_usd,
        v.monto_total_bs,
        v.despacho,
        c.nombre AS nombre_cliente,
        (
          SELECT json_group_array(
            json_object(
              'metodo_pago', vp.metodo_pago,
              'referencia', vp.referencia,
              'monto_usd', vp.monto_usd,
              'monto_bs', vp.monto_bs
            )
          )
          FROM ventas_pagos vp
          WHERE vp.id_venta = v.id_venta
        ) AS pagos
       FROM ventas v
       LEFT JOIN clientes c ON c.id_cliente = v.id_cliente
       WHERE DATE(v.fecha_hora, '-9 hours') = ?
         AND v.estado = 'Completado'
         AND v.id_sucursal = ?
       ORDER BY v.fecha_hora DESC`,
      args: [fechaMeta, id_sucursal],
    });

    const transaccionesProcesadas = transacciones.rows.map((t) => {
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

    // 7. Reembolsos del día (snapshot capturado en reembolsarVenta)
    const reembolsosHoy = await db.execute({
      sql: `SELECT monto_total_usd, monto_total_bs, detalles_json
       FROM reembolsos
       WHERE DATE(fecha_hora, '-9 hours') = ?
         AND id_sucursal = ?`,
      args: [fechaMeta, id_sucursal],
    });

    let total_reembolsado_usd = 0;
    let total_reembolsado_bs = 0;
    let total_pizzas_devueltas = 0;
    const productosReembolso = new Map();

    for (const row of reembolsosHoy.rows) {
      total_reembolsado_usd += Number(row.monto_total_usd || 0);
      total_reembolsado_bs += Number(row.monto_total_bs || 0);

      let detalles = [];
      try {
        detalles =
          typeof row.detalles_json === "string"
            ? JSON.parse(row.detalles_json)
            : row.detalles_json || [];
      } catch (e) {
        console.error("Error al parsear detalles del reembolso:", e);
      }

      for (const d of detalles) {
        const nombre = d.nombre_producto || d.tipo_producto || "Producto";
        const cantidad = Number(d.cantidad || 0);
        const monto = Number(d.monto_total || 0);
        const actual = productosReembolso.get(nombre) || {
          nombre,
          cantidad: 0,
          monto: 0,
        };
        actual.cantidad += cantidad;
        actual.monto += monto;
        productosReembolso.set(nombre, actual);

        if (d.tipo_producto === "Pizza") {
          total_pizzas_devueltas += cantidad;
        }
      }
    }

    const reembolsos = {
      total_usd: Number(total_reembolsado_usd.toFixed(2)),
      total_bs: Number(total_reembolsado_bs.toFixed(2)),
      total_pizzas_devueltas,
      cantidad_reembolsos: reembolsosHoy.rows.length,
      productos: Array.from(productosReembolso.values())
        .sort((a, b) => b.cantidad - a.cantidad)
        .map((p) => ({
          nombre: p.nombre,
          cantidad: p.cantidad,
          monto: Number(p.monto.toFixed(2)),
        })),
    };

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
        punto_de_venta_bs,
        transferencia_bs,
        binance_usd,
      },
      salidas_efectivo,
      transacciones: transaccionesProcesadas,
      reembolsos,
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
    monto_binance_usd,
    total_usdt,
    num_ordenes,
  } = req.body;
  const { id_sucursal } = req.user;

  if (!pin || !String(pin).trim()) {
    return res
      .status(400)
      .json({ success: false, mensaje: "La clave de cierre es obligatoria." });
  }

  const LIMITE_CIERRES_DIARIOS = 3;
  let tx = null;

  try {
    const usuarioEjecutor = Number(req.user?.id);

    const adminRows = await db.execute({
      sql: `SELECT u.id_usuario 
            FROM usuarios u
            INNER JOIN pin p ON u.id_usuario = p.id_usuario
            WHERE u.id_usuario = ?
              AND (u.rol = 'admin' OR u.rol = 'cashier') 
              AND u.estado = 'Activo' 
              AND p.pin = ? 
            LIMIT 1`,
      args: [usuarioEjecutor, String(pin).trim()],
    });

    if (adminRows.rows.length === 0) {
      return res
        .status(401)
        .json({ success: false, mensaje: "Clave de cierre incorrecta" });
    }

    const cierresHoy = await db.execute({
      sql: `SELECT COUNT(*) as totalCierres 
            FROM cierres_caja 
            WHERE DATE(fecha_hora) = DATE('now', '-4 hours')`,
    });

    const totalCierresRealizados = Number(cierresHoy.rows[0].totalCierres);

    if (totalCierresRealizados >= LIMITE_CIERRES_DIARIOS) {
      return res.status(403).json({
        success: false,
        mensaje: `Límite alcanzado: Ya se han realizado los ${LIMITE_CIERRES_DIARIOS} cierres permitidos para hoy.`,
        cierres_restantes: 0,
      });
    }

    tx = await db.transaction("write");

    const insertResult = await tx.execute({
      sql: `INSERT INTO cierres_caja (
              id_usuario,
              fecha_hora,
              monto_efectivo_usd,
              monto_efectivo_bs,
              monto_punto_bs,
              monto_pago_movil_bs,
              monto_binance_usd,
              total_usdt,
              num_ordenes,
              id_sucursal
            ) VALUES (?, datetime('now', '-4 hours'), ?, ?, ?, ?, ?, ?, ?, ?)`,
      args: [
        usuarioEjecutor,
        Number(monto_efectivo_usd || 0),
        Number(monto_efectivo_bs || 0),
        Number(monto_punto_bs || 0),
        Number(monto_pago_movil_bs || 0),
        Number(monto_binance_usd || 0),
        Number(total_usdt || 0),
        Number(num_ordenes || 0),
        Number(id_sucursal || 0),
      ],
    });

    await tx.execute({
      sql: `UPDATE ventas
            SET estado = 'Cerrado'
            WHERE estado IN ('Pendiente', 'Completado')`,
    });

    await tx.execute({
      sql: `UPDATE venta_detalle
            SET estado = 'Cerrado'
            WHERE estado <> 'Cerrado'`,
    });

    await tx.commit();

    const cierresRestantes =
      LIMITE_CIERRES_DIARIOS - (totalCierresRealizados + 1);

    return res.status(200).json({
      ok: true,
      success: true,
      mensaje: `Cierre de caja realizado exitosamente. Te quedan ${cierresRestantes} cierres disponibles por hoy.`,
      id_cierre: Number(insertResult.lastInsertRowid),
      cierres_restantes: cierresRestantes,
    });
  } catch (error) {
    if (tx) {
      try {
        await tx.rollback();
      } catch (rollbackErr) {
        console.error("Error ejecutando rollback en Turso:", rollbackErr);
      }
    }

    console.error("Error al cerrar caja:", error);
    return res.status(500).json({
      success: false,
      mensaje: "Error interno del servidor al realizar el cierre de caja.",
    });
  }
};

// Obtener historial de cierres y métricas para el panel de administración
export const obtenerHistorialCierres = async (req, res) => {
  try {
    const mesMetrics = await db.execute({
      sql: `SELECT 
        COUNT(*) AS cantidad_cierres,
        IFNULL(SUM(total_usdt), 0) AS total_usd,
        IFNULL(AVG(total_usdt), 0) AS promedio_usd
       FROM cierres_caja 
       WHERE strftime('%Y-%m', fecha_hora) = strftime('%Y-%m', 'now', '-4 hours')`,
    });

    const cantidad_cierres = Number(mesMetrics.rows[0].cantidad_cierres);
    const total_usd = Number(mesMetrics.rows[0].total_usd);
    const promedio_usd = Number(mesMetrics.rows[0].promedio_usd);

    const lastClosureYesterday = await db.execute({
      sql: `SELECT 
        strftime('%I:%M %p', fecha_hora) AS hora, 
        DATE(fecha_hora) AS fecha
       FROM cierres_caja 
      WHERE DATE(fecha_hora) < DATE('now', '-4 hours')
       ORDER BY fecha_hora DESC 
       LIMIT 1`,
    });

    const rowsAyer = lastClosureYesterday.rows;
    let ultima_hora_ayer = "Ninguno";

    if (rowsAyer.length > 0) {
      const fechaPartes = String(rowsAyer[0].fecha).split("-");
      const fechaFormateada = `${fechaPartes[2]}/${fechaPartes[1]}`;
      ultima_hora_ayer = `${rowsAyer[0].hora} (${fechaFormateada})`;
    }

    const cierresResult = await db.execute({
      sql: `SELECT c.*, u.nombre_completo AS usuario_nombre, s.sucursal, s.direccion AS sucursal_direccion
       FROM cierres_caja c
       INNER JOIN usuarios u ON c.id_usuario = u.id_usuario
       LEFT JOIN sucursal s ON c.id_sucursal = s.id_sucursal
       ORDER BY c.fecha_hora DESC`,
    });

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
      cierres: cierresResult.rows,
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
    const cajero = await db.execute({
      sql: `SELECT u.id_usuario, u.nombre_completo, u.email, p.pin 
       FROM usuarios u
       LEFT JOIN pin p ON u.id_usuario = p.id_usuario
       WHERE rol = 'cashier' AND estado = 'Activo'`,
    });
    const cajeros = cajero.rows || [];
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
    const user = await db.execute({
      sql: `SELECT id_usuario FROM usuarios WHERE id_usuario = ? AND rol = 'cashier'`,
      args: [id_usuario],
    });

    if (user.rows.length === 0) {
      return res
        .status(404)
        .json({ success: false, mensaje: "Cajero no encontrado" });
    }

    // Validar que el PIN no esté en uso por otro cajero
    if (pin) {
      const pinDuplicado = await db.execute({
        sql: `SELECT p.id_pin FROM pin p WHERE p.pin = ? AND p.id_usuario != ?`,
        args: [String(pin), id_usuario],
      });

      if (pinDuplicado.rows.length > 0) {
        return res.status(409).json({
          success: false,
          mensaje:
            "Ese PIN ya está en uso por otro cajero. Elige uno diferente.",
        });
      }
    }

    const pinExistente = await db.execute({
      sql: `SELECT id_pin FROM pin WHERE id_usuario = ?`,
      args: [id_usuario],
    });

    if (pinExistente.rows.length > 0) {
      await db.execute({
        sql: `UPDATE pin SET pin = ? WHERE id_usuario = ?`,
        args: [pin || null, id_usuario],
      });
    } else {
      await db.execute({
        sql: `INSERT INTO pin (id_usuario, pin) VALUES (?, ?)`,
        args: [id_usuario, pin || null],
      });
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
