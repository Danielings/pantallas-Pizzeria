import db from "../config/turso.js";
import axios from "axios";
import { emitPusherEvent } from "../config/pusher.js";

const TASA_API_URL = "https://ve.dolarapi.com/v1/dolares/oficial";

const tieneIdProductoValido = (detalle) => {
  const id = Number(detalle?.id_producto_origen);
  return Number.isInteger(id) && id > 0;
};

const validarDetallesNuevos = (detalles) =>
  detalles.every(
    (detalle) => detalle?.id_detalle || tieneIdProductoValido(detalle),
  );

// ---- Procesar venta
export const procesarVenta = async (req, res) => {
  const {
    id_cliente,
    id_usuario,
    id_delivery,
    despacho,
    tasa_cambio,
    monto_total_usd,
    monto_total_bs,
    pagos,
    detalles,
  } = req.body;
  const { id_sucursal } = req.user;

  if (!Array.isArray(detalles) || !validarDetallesNuevos(detalles)) {
    return res.status(400).json({
      success: false,
      message: "Cada producto debe tener un id_producto_origen válido.",
    });
  }

  let tx;

  try {
    tx = await db.transaction("write");

    const resultVenta = await tx.execute({
      sql: `INSERT INTO ventas 
      (id_cliente, id_usuario, id_delivery, despacho, estado, fecha_hora, tasa_cambio, monto_total_usd, monto_total_bs, id_sucursal) 
      VALUES (?, ?, ?, ?, 'Completado', datetime('now', 'localtime'), ?, ?, ?, ?)`,
      args: [
        id_cliente,
        id_usuario,
        id_delivery || null,
        despacho,
        tasa_cambio,
        monto_total_usd,
        monto_total_bs,
        id_sucursal,
      ],
    });

    const id_venta = Number(resultVenta.lastInsertRowid);

    for (const pago of pagos || []) {
      await tx.execute({
        sql: `INSERT INTO ventas_pagos 
        (id_venta, metodo_pago, monto_usd, monto_bs, referencia) 
        VALUES (?, ?, ?, ?, ?)`,
        args: [
          id_venta,
          pago.metodo,
          pago.monto_usd,
          pago.monto_bs,
          pago.referencia || null,
        ],
      });
    }

    for (const item of detalles) {
      let estadoInicial = "Pendiente";

      if (item.tipo_producto === "Bebida" || item.tipo_producto === "Helado") {
        estadoInicial = "Completado";
      }

      const resultDetalle = await tx.execute({
        sql: `INSERT INTO venta_detalle 
        (id_venta, tipo_producto, id_producto_origen, cantidad, monto_total, nota, estado) 
        VALUES (?, ?, ?, ?, ?, ?, ?)`,
        args: [
          id_venta,
          item.tipo_producto,
          item.id_producto_origen,
          item.cantidad,
          item.monto_total,
          item.nota,
          estadoInicial,
        ],
      });

      const id_detalle = Number(resultDetalle.lastInsertRowid);

      if (item.extras && item.extras.length > 0) {
        for (const id_extra of item.extras) {
          await tx.execute({
            sql: `INSERT INTO detalle_venta_extras (id_detalle, id_extra) VALUES (?, ?)`,
            args: [id_detalle, id_extra],
          });
        }
      }
    }

    await tx.commit();

    emitPusherEvent("pizzeria-orders", "pedido_creado", {
      id_venta,
      sucursal_id: id_sucursal,
      tipo_evento: "pedido_creado",
      timestamp: Date.now(),
    });

    res.status(201).json({
      success: true,
      message: "Venta procesada exitosamente",
      id_venta: id_venta,
    });
  } catch (error) {
    if (tx) await tx.rollback();
    console.error("Error al procesar la venta:", error);
    res.status(500).json({
      success: false,
      message: "Error procesando la venta",
      error: error.message,
    });
  }
};

// ---- Registra Delivery/Pick Up pendiente de cobro
export const registrarPedidoPendiente = async (req, res) => {
  const {
    id_cliente,
    id_usuario,
    id_delivery,
    despacho,
    tasa_cambio,
    monto_total_usd,
    monto_total_bs,
    monto_pendiente,
    pagos = [],
    detalles = [],
  } = req.body;
  const { id_sucursal } = req.user;
  if (
    !id_cliente ||
    !id_usuario ||
    !["Delivery", "Pick Up"].includes(despacho)
  ) {
    return res.status(400).json({
      success: false,
      message: "Cliente, usuario y despacho Delivery/Pick Up son obligatorios.",
    });
  }

  if (!Array.isArray(detalles) || detalles.length === 0) {
    return res.status(400).json({
      success: false,
      message: "El pedido debe contener al menos un detalle.",
    });
  }

  if (!validarDetallesNuevos(detalles)) {
    return res.status(400).json({
      success: false,
      message: "Cada producto debe tener un id_producto_origen válido.",
    });
  }

  let tx;

  try {
    tx = await db.transaction("write");

    const resultVenta = await tx.execute({
      sql: `INSERT INTO ventas
       (id_cliente, id_usuario, id_delivery, despacho, estado, fecha_hora, tasa_cambio, monto_total_usd, monto_total_bs, id_sucursal)
       VALUES (?, ?, ?, ?, 'Pendiente', datetime('now', 'localtime'), ?, ?, ?, ?)`,
      args: [
        id_cliente,
        id_usuario,
        id_delivery || null,
        despacho,
        tasa_cambio || 0,
        monto_total_usd || 0,
        monto_total_bs || 0,
        id_sucursal,
      ],
    });

    const id_venta = Number(resultVenta.lastInsertRowid);

    for (const pago of pagos) {
      await tx.execute({
        sql: `INSERT INTO ventas_pagos
         (id_venta, metodo_pago, monto_usd, monto_bs, referencia)
         VALUES (?, ?, ?, ?, ?)`,
        args: [
          id_venta,
          pago.metodo,
          pago.monto_usd || 0,
          pago.monto_bs || 0,
          pago.referencia || null,
        ],
      });
    }

    for (const item of detalles) {
      const estadoInicial =
        item.tipo_producto === "Bebida" || item.tipo_producto === "Helado"
          ? "Completado"
          : "Pendiente";

      const resultDetalle = await tx.execute({
        sql: `INSERT INTO venta_detalle
         (id_venta, tipo_producto, id_producto_origen, cantidad, monto_total, nota, estado)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        args: [
          id_venta,
          item.tipo_producto,
          item.id_producto_origen,
          item.cantidad,
          item.monto_total,
          item.nota || "",
          estadoInicial,
        ],
      });

      if (Array.isArray(item.extras)) {
        for (const id_extra of item.extras) {
          await tx.execute({
            sql: `INSERT INTO detalle_venta_extras (id_detalle, id_extra) VALUES (?, ?)`,
            args: [Number(resultDetalle.lastInsertRowid), id_extra],
          });
        }
      }
    }

    const estadoNotificaciones = "Pendiente";
    await tx.execute({
      sql: `INSERT INTO notificaciones
       (id_venta, id_cliente, id_usuario, monto_restante, fecha_hora, estado)
      VALUES (?, ?, ?, ?, datetime('now', 'localtime'), ?)`,
      args: [
        id_venta,
        id_cliente,
        id_usuario,
        monto_pendiente || 0,
        estadoNotificaciones,
      ],
    });

    await tx.commit();

    emitPusherEvent("pizzeria-notifications", "notificacion_pendiente_creada", {
      id_venta,
      id_cliente,
      id_usuario,
      sucursal_id: id_sucursal,
      tipo_evento: "notificacion_pendiente_creada",
      timestamp: Date.now(),
    });

    return res.status(201).json({
      success: true,
      message: "Pedido pendiente registrado exitosamente",
      id_venta,
    });
  } catch (error) {
    if (tx) await tx.rollback();
    console.error("Error al registrar el pedido pendiente:", error);
    return res.status(500).json({
      success: false,
      message: "Error registrando el pedido pendiente",
      error: error.message,
    });
  }
};

// ---- Completar venta pendiente
export const completarVentaPendiente = async (req, res) => {
  const { id_venta } = req.params;
  const {
    id_usuario,
    pagos = [],
    detalles = [],
    monto_total_usd,
    monto_total_bs,
  } = req.body;
  if (!Array.isArray(detalles) || !validarDetallesNuevos(detalles)) {
    return res.status(400).json({
      success: false,
      message: "Cada producto nuevo debe tener un id_producto_origen válido.",
    });
  }

  let tx;
  try {
    tx = await db.transaction("write");

    const ventas = await tx.execute({
      sql: "SELECT id_venta FROM ventas WHERE id_venta = ? AND estado = 'Pendiente'",
      args: [id_venta],
    });

    if (!ventas.rows.length) {
      await tx.rollback();
      return res
        .status(404)
        .json({ success: false, message: "Venta pendiente no encontrada." });
    }

    for (const pago of pagos) {
      await tx.execute({
        sql: `INSERT INTO ventas_pagos (id_venta, metodo_pago, monto_usd, monto_bs, referencia)
         VALUES (?, ?, ?, ?, ?)`,
        args: [
          id_venta,
          pago.metodo,
          pago.monto_usd || 0,
          pago.monto_bs || 0,
          pago.referencia || null,
        ],
      });
    }

    for (const detalle of detalles) {
      if (detalle.id_detalle) {
        await tx.execute({
          sql: `UPDATE venta_detalle
           SET cantidad = ?, monto_total = ?, nota = ?
           WHERE id_detalle = ? AND id_venta = ?`,
          args: [
            detalle.cantidad,
            detalle.monto_total,
            detalle.nota || "",
            detalle.id_detalle,
            id_venta,
          ],
        });
        continue;
      }

      const estadoDetalle =
        detalle.tipo_producto === "Bebida" || detalle.tipo_producto === "Helado"
          ? "Completado"
          : "Pendiente";

      const resultDetalle = await tx.execute({
        sql: `INSERT INTO venta_detalle
         (id_venta, tipo_producto, id_producto_origen, cantidad, monto_total, nota, estado)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        args: [
          id_venta,
          detalle.tipo_producto,
          detalle.id_producto_origen,
          detalle.cantidad,
          detalle.monto_total,
          detalle.nota || "",
          estadoDetalle,
        ],
      });

      for (const idExtra of detalle.extras || []) {
        await tx.execute({
          sql: `INSERT INTO detalle_venta_extras (id_detalle, id_extra) VALUES (?, ?)`,
          args: [Number(resultDetalle.lastInsertRowid), idExtra],
        });
      }
    }

    const estadoNotificacionesListo = "Listo";
    await tx.execute({
      sql: `UPDATE ventas
       SET id_usuario = ?, estado = 'Completado', monto_total_usd = ?, monto_total_bs = ?
       WHERE id_venta = ?`,
      args: [
        id_usuario || 1,
        monto_total_usd || 0,
        monto_total_bs || 0,
        id_venta,
      ],
    });

    await tx.execute({
      sql: "UPDATE notificaciones SET estado = ? WHERE id_venta = ?",
      args: [estadoNotificacionesListo, id_venta],
    });

    await tx.commit();

    emitPusherEvent("pizzeria-orders", "pedido_actualizado", {
      id_venta,
      sucursal_id: req.user?.id_sucursal || null,
      tipo_evento: "pedido_actualizado",
      timestamp: Date.now(),
    });
    emitPusherEvent(
      "pizzeria-notifications",
      "notificacion_pendiente_resuelta",
      {
        id_venta,
        sucursal_id: req.user?.id_sucursal || null,
        tipo_evento: "notificacion_pendiente_resuelta",
        timestamp: Date.now(),
      },
    );

    return res.json({ success: true, message: "Venta pendiente completada." });
  } catch (error) {
    if (tx) await tx.rollback();
    console.error("Error completando venta pendiente:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// ---- Editar venta
export const editarVenta = async (req, res) => {
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

  if (
    Array.isArray(detalles_actualizados) &&
    !validarDetallesNuevos(detalles_actualizados)
  ) {
    return res.status(400).json({
      success: false,
      message: "Cada producto nuevo debe tener un id_producto_origen válido.",
    });
  }

  let tx;
  try {
    tx = await db.transaction("write");

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
      await tx.execute({
        sql: `UPDATE ventas SET ${updates.join(", ")} WHERE id_venta = ?`,
        args: params,
      });
    }

    if (Array.isArray(detalles_actualizados)) {
      for (const item of detalles_actualizados) {
        if (item.id_detalle) {
          await tx.execute({
            sql: `UPDATE venta_detalle
             SET tipo_producto = ?, id_producto_origen = ?, cantidad = ?, monto_total = ?, nota = ?
             WHERE id_detalle = ?`,
            args: [
              item.tipo_producto,
              item.id_producto_origen,
              item.cantidad,
              item.monto_total,
              item.nota || "",
              item.id_detalle,
            ],
          });

          await tx.execute({
            sql: `DELETE FROM detalle_venta_extras WHERE id_detalle = ?`,
            args: [item.id_detalle],
          });

          if (Array.isArray(item.extras) && item.extras.length > 0) {
            for (const id_extra of item.extras) {
              await tx.execute({
                sql: `INSERT INTO detalle_venta_extras (id_detalle, id_extra) VALUES (?, ?)`,
                args: [item.id_detalle, id_extra],
              });
            }
          }
        } else {
          const resultDetalle = await tx.execute({
            sql: `INSERT INTO venta_detalle
             (id_venta, tipo_producto, id_producto_origen, cantidad, monto_total, nota, estado)
             VALUES (?, ?, ?, ?, ?, ?, 'Pendiente')`,
            args: [
              id_venta,
              item.tipo_producto,
              item.id_producto_origen,
              item.cantidad,
              item.monto_total,
              item.nota || "",
            ],
          });

          const id_detalle = Number(resultDetalle.lastInsertRowid);
          if (Array.isArray(item.extras) && item.extras.length > 0) {
            for (const id_extra of item.extras) {
              await tx.execute({
                sql: `INSERT INTO detalle_venta_extras (id_detalle, id_extra) VALUES (?, ?)`,
                args: [id_detalle, id_extra],
              });
            }
          }
        }
      }
    }

    if (info_pago) {
      await tx.execute({
        sql: `INSERT INTO ventas_pagos
         (id_venta, metodo_pago, monto_usd, monto_bs, referencia)
         VALUES (?, ?, ?, ?, ?)`,
        args: [
          id_venta,
          info_pago.metodo,
          info_pago.monto_usd,
          info_pago.monto_bs || 0,
          info_pago.referencia || null,
        ],
      });
    }

    await tx.commit();

    emitPusherEvent("pizzeria-orders", "pedido_actualizado", {
      id_venta,
      sucursal_id: null,
      tipo_evento: "pedido_actualizado",
      timestamp: Date.now(),
    });

    res.status(200).json({
      success: true,
      message: "Pedido actualizado correctamente",
    });
  } catch (error) {
    if (tx) await tx.rollback();
    console.error("Error al actualizar el pedido:", error);
    res.status(500).json({
      success: false,
      message: "Error actualizando el pedido",
      error: error.message,
    });
  }
};

//-----Reembolsar venta
export const reembolsarVenta = async (req, res) => {
  const { id_venta } = req.body;

  if (!id_venta) {
    return res.status(400).json({
      success: false,
      message: "El id_venta es obligatorio para procesar el reembolso.",
    });
  }

  let tx;
  try {
    tx = await db.transaction("write");

    await tx.execute({
      sql: `UPDATE ventas 
       SET estado = 'Reembolsado', monto_total_usd = 0, monto_total_bs = 0 
       WHERE id_venta = ?`,
      args: [id_venta],
    });

    await tx.execute({
      sql: `UPDATE ventas_pagos 
       SET monto_usd = 0, monto_bs = 0 
       WHERE id_venta = ?`,
      args: [id_venta],
    });

    await tx.execute({
      sql: `UPDATE venta_detalle 
       SET estado = 'Cancelado', monto_total = 0 
       WHERE id_venta = ?`,
      args: [id_venta],
    });

    await tx.commit();

    emitPusherEvent("pizzeria-orders", "pedido_actualizado", {
      id_venta,
      sucursal_id: null,
      tipo_evento: "pedido_actualizado",
      timestamp: Date.now(),
    });

    res.status(200).json({
      success: true,
      message: "Reembolso procesado correctamente",
    });
  } catch (error) {
    if (tx) await tx.rollback();
    console.error("Error al procesar el reembolso:", error);
    res.status(500).json({
      success: false,
      message: "Error al procesar el reembolso",
      error: error.message,
    });
  }
};

// ---- Obtener métodos de pago
export const obtenerMetodosPago = async (req, res) => {
  try {
    const clientes = (req.query.clientes || "")
      .split(",")
      .map((id) => Number(id.trim()))
      .filter((id) => Number.isInteger(id) && id > 0);

    const params = [];
    let filtro = "";
    if (clientes.length) {
      filtro = `WHERE v.id_cliente IN (${clientes.map(() => "?").join(", ")})`;
      params.push(...clientes);
    }

    const result = await db.execute({
      sql: `SELECT vp.metodo_pago AS metodo,
              COUNT(*)              AS cantidad,
              COUNT(DISTINCT vp.id_venta) AS ventas,
              SUM(vp.monto_usd)        AS total_usd,
              SUM(vp.monto_bs)         AS total_bs
       FROM ventas_pagos vp
       INNER JOIN ventas v ON v.id_venta = vp.id_venta
       ${filtro}
       GROUP BY vp.metodo_pago
       ORDER BY cantidad DESC`,
      args: params,
    });

    res.json({ success: true, data: result.rows });
  } catch (error) {
    console.error("Error al obtener métodos de pago:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// ---- Obtener ventas del día
export const obtenerVentasHoy = async (req, res) => {
  const { id_sucursal } = req.user;
  try {
    const query = `SELECT 
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
      WHERE DATE(v.fecha_hora) = DATE('now', 'localtime')
        AND v.estado = 'Completado'
        AND v.id_sucursal = ?
      ORDER BY v.fecha_hora DESC`;

    const result = await db.execute({ sql: query, args: [id_sucursal] });
    const ventas = result.rows;

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
};

// ---- Obtener pedidos activos
export const obtenerPedidosActivos = async (req, res) => {
  const { id_sucursal } = req.user;
  try {
    const query = `SELECT DISTINCT
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
      WHERE DATE(v.fecha_hora) = DATE('now', 'localtime')
        AND v.id_sucursal = ?
        AND EXISTS (
          SELECT 1 FROM venta_detalle vd
          WHERE vd.id_venta = v.id_venta
            AND vd.estado != 'Completado'
            AND vd.estado != 'Cerrado'
            AND vd.estado != 'Cancelado'
        )
      ORDER BY v.fecha_hora DESC`;
    const result = await db.execute({ sql: query, args: [id_sucursal] });
    const ventas = result.rows;

    const pedidos = await Promise.all(
      ventas.map(async (venta) => {
        const detallesResult = await db.execute({
          sql: `SELECT 
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
          args: [venta.id_venta],
        });
        const detalles = detallesResult.rows;

        const detallesConExtras = await Promise.all(
          detalles.map(async (det) => {
            const extrasResult = await db.execute({
              sql: `SELECT e.id_extras AS id, e.nombre AS name, e.precio AS price
               FROM detalle_venta_extras dve
               JOIN extras e ON e.id_extras = dve.id_extra
               WHERE dve.id_detalle = ?`,
              args: [det.id_detalle],
            });
            return { ...det, extras: extrasResult.rows };
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
};

//-----------Tasa

// ---- Obtener tasa de cambio desde API externa
export const obtenerTasaExterna = async () => {
  const { data } = await axios.get(TASA_API_URL, { timeout: 10000 });
  const tasa = Number(data?.promedio);

  if (!Number.isFinite(tasa) || tasa <= 0) {
    throw new Error("La API externa devolvió una tasa inválida.");
  }

  return tasa;
};

// ---- Actualizar tasa de cambio (con fallback si la API falla)
export const actualizarTasaDesdeApi = async () => {
  try {
    const tasaApi = await obtenerTasaExterna();
    const current = await db.execute({
      sql: "SELECT anclado, tasa_sistema FROM configuracion_tasa WHERE id_config = 1",
    });
    const rows = current.rows;

    if (!rows.length) {
      await db.execute({
        sql: "INSERT INTO configuracion_tasa (id_config, tasa_api, tasa_sistema, anclado) VALUES (1, ?, ?, 0)",
        args: [tasaApi, tasaApi],
      });
    } else if (rows[0].anclado) {
      const tasaSistemaActual = Number(rows[0].tasa_sistema);

      if (tasaApi > tasaSistemaActual) {
        await db.execute({
          sql: "UPDATE configuracion_tasa SET tasa_api = ?, tasa_sistema = ? WHERE id_config = 1",
          args: [tasaApi, tasaApi],
        });
      } else {
        await db.execute({
          sql: "UPDATE configuracion_tasa SET tasa_api = ? WHERE id_config = 1",
          args: [tasaApi],
        });
      }
    } else {
      await db.execute({
        sql: "UPDATE configuracion_tasa SET tasa_api = ?, tasa_sistema = ? WHERE id_config = 1",
        args: [tasaApi, tasaApi],
      });
    }

    return tasaApi;
  } catch (error) {
    console.warn(
      "No se pudo conectar a la API externa de tasas. Se usará el último valor registrado:",
      error.message,
    );
    const registro = await obtenerRegistro();
    return registro?.tasa_sistema || 0;
  }
};

// ---- Obtener registro de la tasa desde la base de datos
export const obtenerRegistro = async () => {
  const result = await db.execute({
    sql: "SELECT id_config, tasa_api, tasa_sistema, anclado, fecha_actualizacion FROM configuracion_tasa WHERE id_config = 1",
  });
  return result.rows[0];
};

// ---- Obtener la tasa para las peticiones de las rutas
export const obtenerTasaDesdeBD = async (_req, res) => {
  try {
    await actualizarTasaDesdeApi();
    const data = await obtenerRegistro();
    if (!data) {
      return res.status(404).json({
        success: false,
        message: "La configuración de la tasa no está inicializada.",
      });
    }
    return res.json({ success: true, data });
  } catch (error) {
    console.error("Error obteniendo la tasa:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// ---- Editar tasa y anclarla
export const editarYAnclarTasa = async (req, res) => {
  const tasaManual = Number(req.body?.tasa_manual);
  if (!Number.isFinite(tasaManual) || tasaManual <= 0) {
    return res.status(400).json({
      success: false,
      message: "tasa_manual debe ser un número mayor que cero.",
    });
  }

  try {
    await db.execute({
      sql: "UPDATE configuracion_tasa SET tasa_sistema = ?, anclado = 1 WHERE id_config = 1",
      args: [tasaManual],
    });
    return res.json({ success: true, data: await obtenerRegistro() });
  } catch (error) {
    console.error("Error anclando la tasa:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// ---- Desanclar tasa
export const desanclarTasa = async (_req, res) => {
  try {
    await db.execute({
      sql: "UPDATE configuracion_tasa SET tasa_sistema = tasa_api, anclado = 0 WHERE id_config = 1",
    });
    return res.json({ success: true, data: await obtenerRegistro() });
  } catch (error) {
    console.error("Error quitando el anclaje de la tasa:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};
