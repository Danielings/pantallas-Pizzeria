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

export default Router;
