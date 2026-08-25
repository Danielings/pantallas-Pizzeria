import pool from "../config/bd.js";
import axios from "axios";

const TASA_API_URL = "https://ve.dolarapi.com/v1/dolares/oficial";

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

  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    const [resultVenta] = await connection.query(
      `INSERT INTO ventas 
      (id_cliente, id_usuario, id_delivery, despacho, estado, fecha_hora, tasa_cambio, monto_total_usd, monto_total_bs, id_sucursal) 
      VALUES (?, ?, ?, ?, 'Completado', NOW(), ?, ?, ?,?)`,
      [
        id_cliente,
        id_usuario,
        id_delivery || null,
        despacho,
        tasa_cambio,
        monto_total_usd,
        monto_total_bs,
        id_sucursal,
      ],
    );

    const id_venta = resultVenta.insertId;

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

    for (const item of detalles) {
      let estadoInicial = "Pendiente";

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

      if (item.extras && item.extras.length > 0) {
        for (const id_extra of item.extras) {
          await connection.query(
            `INSERT INTO detalle_venta_extras (id_detalle, id_extra) VALUES (?, ?)`,
            [id_detalle, id_extra],
          );
        }
      }
    }

    await connection.commit();

    res.status(201).json({
      success: true,
      message: "Venta procesada exitosamente",
      id_venta: id_venta,
    });
  } catch (error) {
    await connection.rollback();
    console.error("Error al procesar la venta:", error);
    res.status(500).json({
      success: false,
      message: "Error procesando la venta",
      error: error.message,
    });
  } finally {
    connection.release();
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

  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    const [resultVenta] = await connection.query(
      `INSERT INTO ventas
       (id_cliente, id_usuario, id_delivery, despacho, estado, fecha_hora, tasa_cambio, monto_total_usd, monto_total_bs)
       VALUES (?, ?, ?, ?, 'Pendiente', NOW(), ?, ?, ?)`,
      [
        id_cliente,
        id_usuario,
        id_delivery || null,
        despacho,
        tasa_cambio || 0,
        monto_total_usd || 0,
        monto_total_bs || 0,
      ],
    );

    const id_venta = resultVenta.insertId;

    for (const pago of pagos) {
      await connection.query(
        `INSERT INTO ventas_pagos
         (id_venta, metodo_pago, monto_usd, monto_bs, referencia)
         VALUES (?, ?, ?, ?, ?)`,
        [
          id_venta,
          pago.metodo,
          pago.monto_usd || 0,
          pago.monto_bs || 0,
          pago.referencia || null,
        ],
      );
    }

    for (const item of detalles) {
      const estadoInicial =
        item.tipo_producto === "Bebida" || item.tipo_producto === "Helado"
          ? "Completado"
          : "Pendiente";

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
          item.nota || "",
          estadoInicial,
        ],
      );

      if (Array.isArray(item.extras)) {
        for (const id_extra of item.extras) {
          await connection.query(
            `INSERT INTO detalle_venta_extras (id_detalle, id_extra) VALUES (?, ?)`,
            [resultDetalle.insertId, id_extra],
          );
        }
      }
    }

    const estadoNotificaciones = "Pendiente";
    await connection.query(
      `INSERT INTO notificaciones
       (id_venta, id_cliente, id_usuario, monto_restante, fecha_hora, estado)
       VALUES (?, ?, ?, ?, NOW(), ?)`,
      [
        id_venta,
        id_cliente,
        id_usuario,
        monto_pendiente || 0,
        estadoNotificaciones,
      ],
    );

    await connection.commit();

    return res.status(201).json({
      success: true,
      message: "Pedido pendiente registrado exitosamente",
      id_venta,
    });
  } catch (error) {
    await connection.rollback();
    console.error("Error al registrar el pedido pendiente:", error);
    return res.status(500).json({
      success: false,
      message: "Error registrando el pedido pendiente",
      error: error.message,
    });
  } finally {
    connection.release();
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
  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    const [ventas] = await connection.query(
      `SELECT id_venta FROM ventas WHERE id_venta = ? AND estado = 'Pendiente' FOR UPDATE`,
      [id_venta],
    );

    if (!ventas.length) {
      await connection.rollback();
      return res
        .status(404)
        .json({ success: false, message: "Venta pendiente no encontrada." });
    }

    for (const pago of pagos) {
      await connection.query(
        `INSERT INTO ventas_pagos (id_venta, metodo_pago, monto_usd, monto_bs, referencia)
         VALUES (?, ?, ?, ?, ?)`,
        [
          id_venta,
          pago.metodo,
          pago.monto_usd || 0,
          pago.monto_bs || 0,
          pago.referencia || null,
        ],
      );
    }

    for (const detalle of detalles) {
      if (detalle.id_detalle) {
        await connection.query(
          `UPDATE venta_detalle
           SET cantidad = ?, monto_total = ?, nota = ?
           WHERE id_detalle = ? AND id_venta = ?`,
          [
            detalle.cantidad,
            detalle.monto_total,
            detalle.nota || "",
            detalle.id_detalle,
            id_venta,
          ],
        );
        continue;
      }

      const estadoDetalle =
        detalle.tipo_producto === "Bebida" || detalle.tipo_producto === "Helado"
          ? "Completado"
          : "Pendiente";

      const [resultDetalle] = await connection.query(
        `INSERT INTO venta_detalle
         (id_venta, tipo_producto, id_producto_origen, cantidad, monto_total, nota, estado)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [
          id_venta,
          detalle.tipo_producto,
          detalle.id_producto_origen,
          detalle.cantidad,
          detalle.monto_total,
          detalle.nota || "",
          estadoDetalle,
        ],
      );

      for (const idExtra of detalle.extras || []) {
        await connection.query(
          `INSERT INTO detalle_venta_extras (id_detalle, id_extra) VALUES (?, ?)`,
          [resultDetalle.insertId, idExtra],
        );
      }
    }

    const estadoNotificacionesListo = "Listo";
    await connection.query(
      `UPDATE ventas
       SET id_usuario = ?, estado = 'Completado', monto_total_usd = ?, monto_total_bs = ?
       WHERE id_venta = ?`,
      [id_usuario || 1, monto_total_usd || 0, monto_total_bs || 0, id_venta],
    );

    await connection.query(
      "UPDATE notificaciones SET estado = ? WHERE id_venta = ?",
      [estadoNotificacionesListo, id_venta],
    );

    await connection.commit();

    return res.json({ success: true, message: "Venta pendiente completada." });
  } catch (error) {
    await connection.rollback();
    console.error("Error completando venta pendiente:", error);
    return res.status(500).json({ success: false, message: error.message });
  } finally {
    connection.release();
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
};

// ---- Obtener ventas del día
export const obtenerVentasHoy = async (req, res) => {
  const { id_sucursal } = req.user;
  try {
    let query = `SELECT 
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
        AND v.id_sucursal = ?
      ORDER BY v.fecha_hora DESC`;

    let paraparamericano = [id_sucursal];
    const [ventas] = await pool.query(query, paraparamericano);

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
    let query = `SELECT DISTINCT
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
        AND id_sucursal = ?
        AND EXISTS (
          SELECT 1 FROM venta_detalle vd
          WHERE vd.id_venta = v.id_venta
            AND vd.estado != 'Completado'
            AND vd.estado != 'Cerrado'
        )
      ORDER BY v.fecha_hora DESC`;
    let params = [id_sucursal];
    const [ventas] = await pool.query(query, params);

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
    const [rows] = await pool.query(
      "SELECT anclado, tasa_sistema FROM configuracion_tasa WHERE id_config = 1",
    );

    if (!rows.length) {
      await pool.query(
        "INSERT INTO configuracion_tasa (id_config, tasa_api, tasa_sistema, anclado) VALUES (1, ?, ?, 0)",
        [tasaApi, tasaApi],
      );
    } else if (rows[0].anclado) {
      const tasaSistemaActual = Number(rows[0].tasa_sistema);

      if (tasaApi > tasaSistemaActual) {
        await pool.query(
          "UPDATE configuracion_tasa SET tasa_api = ?, tasa_sistema = ? WHERE id_config = 1",
          [tasaApi, tasaApi],
        );
      } else {
        await pool.query(
          "UPDATE configuracion_tasa SET tasa_api = ? WHERE id_config = 1",
          [tasaApi],
        );
      }
    } else {
      await pool.query(
        "UPDATE configuracion_tasa SET tasa_api = ?, tasa_sistema = ? WHERE id_config = 1",
        [tasaApi, tasaApi],
      );
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
  const [rows] = await pool.query(
    "SELECT id_config, tasa_api, tasa_sistema, anclado, fecha_actualizacion FROM configuracion_tasa WHERE id_config = 1",
  );
  return rows[0];
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
    await pool.query(
      "UPDATE configuracion_tasa SET tasa_sistema = ?, anclado = 1 WHERE id_config = 1",
      [tasaManual],
    );
    return res.json({ success: true, data: await obtenerRegistro() });
  } catch (error) {
    console.error("Error anclando la tasa:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// ---- Desanclar tasa
export const desanclarTasa = async (_req, res) => {
  try {
    await pool.query(
      "UPDATE configuracion_tasa SET tasa_sistema = tasa_api, anclado = 0 WHERE id_config = 1",
    );
    return res.json({ success: true, data: await obtenerRegistro() });
  } catch (error) {
    console.error("Error quitando el anclaje de la tasa:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};
