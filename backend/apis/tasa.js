import express from "express";
import axios from "axios";
import pool from "../config/bd.js";

const Router = express.Router();
const TASA_API_URL = "https://api.now.com.ve/price-rate-bcv";

const obtenerTasaExterna = async () => {
  const { data } = await axios.get(TASA_API_URL, { timeout: 10000 });
  const tasa = Number(data?.PriceRateBCV);

  if (!Number.isFinite(tasa) || tasa <= 0) {
    throw new Error("La API externa devolvió una tasa inválida.");
  }

  return tasa;
};

export const actualizarTasaDesdeApi = async () => {
  const tasaApi = await obtenerTasaExterna();
  const [rows] = await pool.query(
    "SELECT anclado FROM configuracion_tasa WHERE id_config = 1",
  );

  if (!rows.length) {
    await pool.query(
      "INSERT INTO configuracion_tasa (id_config, tasa_api, tasa_sistema, anclado) VALUES (1, ?, ?, 0)",
      [tasaApi, tasaApi],
    );
  } else if (rows[0].anclado) {
    await pool.query(
      "UPDATE configuracion_tasa SET tasa_api = ? WHERE id_config = 1",
      [tasaApi],
    );
  } else {
    await pool.query(
      "UPDATE configuracion_tasa SET tasa_api = ?, tasa_sistema = ? WHERE id_config = 1",
      [tasaApi, tasaApi],
    );
  }

  return tasaApi;
};

const obtenerRegistro = async () => {
  const [rows] = await pool.query(
    "SELECT id_config, tasa_api, tasa_sistema, anclado, fecha_actualizacion FROM configuracion_tasa WHERE id_config = 1",
  );
  return rows[0];
};

Router.get("/tasa", async (_req, res) => {
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
});

Router.put("/tasa/anclar", async (req, res) => {
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
});

Router.put("/tasa/desanclar", async (_req, res) => {
  try {
    await pool.query(
      "UPDATE configuracion_tasa SET tasa_sistema = tasa_api, anclado = 0 WHERE id_config = 1",
    );
    return res.json({ success: true, data: await obtenerRegistro() });
  } catch (error) {
    console.error("Error quitando el anclaje de la tasa:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
});

export default Router;
