import express from "express";
import pool from "../config/bd.js";
// Asegúrate de importar cloudinary y tu middleware de multer configurado en memoria
import { v2 as cloudinary } from "cloudinary";
import multer from "multer"; // Ajusta esta ruta a tu middleware
import dotenv from "dotenv";

dotenv.config();

const Router = express.Router();

cloudinary.config({
  cloud_name: process.env.CLOUD_NAME,
  api_key: process.env.API_KEY,
  api_secret: process.env.API_SECRET,
  secure: true,
});
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });
// 1. Función auxiliar para procesar y subir la imagen a Cloudinary
const uploadImageToCloudinary = async (file, folderName = "img") => {
  if (!file) return null; // Si no hay imagen, retorna null

  const fileBase64 = `data:${file.mimetype};base64,${file.buffer.toString("base64")}`;

  const uploadResult = await cloudinary.uploader.upload(fileBase64, {
    folder: folderName,
  });

  return cloudinary.url(uploadResult.public_id, {
    fetch_format: "auto",
    quality: "auto",
  });
};
// ─── ACTUALIZAR PIZZA ──────────────────────────────────────────────────
Router.put("/pizzas/:id", upload.single("imagen"), async (req, res) => {
  const { id } = req.params;
  const { name, price, description, size } = req.body;

  try {
    // 1. Mapear el tamaño a su respectivo ID de categoría
    let id_categoria_pizza = 1;
    if (size === "Familiar") id_categoria_pizza = 2;
    if (size === "Gigante") id_categoria_pizza = 3;

    // 2. Obtener la imagen actual de la base de datos por si no se envía una nueva
    const [existing] = await pool.query(
      "SELECT url FROM pizza WHERE id_pizza = ?",
      [id],
    );
    let imageUrl = existing.length > 0 ? existing[0].url : null;

    // 3. Si el usuario subió una nueva imagen, subirla a Cloudinary
    if (req.file) {
      imageUrl = await uploadImageToCloudinary(req.file, "pizzas");
    }

    // 4. Actualizar en la base de datos
    await pool.query(
      `UPDATE pizza 
       SET nombre = ?, precio = ?, descripcion = ?, id_categoria_pizza = ?, url = ? 
       WHERE id_pizza = ?`,
      [name, price, description, id_categoria_pizza, imageUrl, id],
    );

    res.json({
      success: true,
      message: "Pizza actualizada correctamente",
      url: imageUrl,
    });
  } catch (error) {
    console.error("Error al actualizar pizza:", error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// ─── ACTUALIZAR BEBIDA ─────────────────────────────────────────────────
Router.put("/bebidas/:id", upload.single("imagen"), async (req, res) => {
  const { id } = req.params;
  const { name, price, description } = req.body;

  try {
    // Verificar si la tabla usa 'id_bebida' o 'id'. Ajusta según tu estructura SQL.
    const [existing] = await pool.query(
      "SELECT url FROM bebidas WHERE id_bebida = ?",
      [id],
    );
    let imageUrl = existing.length > 0 ? existing[0].url : null;

    if (req.file) {
      imageUrl = await uploadImageToCloudinary(req.file, "bebidas");
    }

    await pool.query(
      `UPDATE bebidas 
       SET nombre = ?, precio = ?, descripcion = ?, url = ? 
       WHERE id_bebida = ?`,
      [name, price, description, imageUrl, id],
    );

    res.json({
      success: true,
      message: "Bebida actualizada correctamente",
      url: imageUrl,
    });
  } catch (error) {
    console.error("Error al actualizar bebida:", error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// ─── ACTUALIZAR HELADO ─────────────────────────────────────────────────
Router.put("/heladeria/:id", upload.single("imagen"), async (req, res) => {
  const { id } = req.params;
  const { name, price, description } = req.body;

  try {
    // Ajusta 'id_helado' o 'id' según tu columna ID en la BD de heladería
    const [existing] = await pool.query(
      "SELECT url FROM heladeria WHERE id_helado = ?",
      [id],
    );
    let imageUrl = existing.length > 0 ? existing[0].url : null;

    if (req.file) {
      imageUrl = await uploadImageToCloudinary(req.file, "helados");
    }

    await pool.query(
      `UPDATE heladeria 
       SET nombre = ?, precio = ?, descripcion = ?, url = ? 
       WHERE id_helado = ?`,
      [name, price, description, imageUrl, id],
    );

    res.json({
      success: true,
      message: "Helado actualizado correctamente",
      url: imageUrl,
    });
  } catch (error) {
    console.error("Error al actualizar helado:", error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// registrar extras
Router.put("/extras/:id", upload.none(), async (req, res) => {
  const { id } = req.params;
  const { name, price, size } = req.body;

  try {
    let id_categoria_pizza = 1;
    if (size === "Familiar") id_categoria_pizza = 2;
    if (size === "Gigante") id_categoria_pizza = 3;

    const [result] = await pool.query(
      `UPDATE extras 
       SET nombre = ?, precio = ?, id_categoria_pizza = ? 
       WHERE id_extras = ?`,
      [name, price, id_categoria_pizza, id],
    );

    res.status(200).json({
      success: true,
      message: "Extra actualizado",
    });
  } catch (error) {
    console.error("Error al actualizar extra:", error);
    res.status(500).json({ success: false, message: error.message });
  }
});

export default Router;
