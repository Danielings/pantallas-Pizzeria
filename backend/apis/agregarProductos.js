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

// ─── REGISTRAR LAS PIZZAS ───────────────────────────────────────────────
Router.post("/pizzas", upload.single("imagen"), async (req, res) => {
  const { name, price, description, size } = req.body;

  try {
    let id_categoria_pizza = 1;
    if (size === "Familiar") id_categoria_pizza = 2;
    if (size === "Gigante") id_categoria_pizza = 3;

    // Subir imagen y obtener URL (si viene en la petición)
    const imageUrl = await uploadImageToCloudinary(req.file, "pizzas");

    const [result] = await pool.query(
      `INSERT INTO pizza (nombre, precio, descripcion, id_categoria_pizza, estado, url) 
       VALUES (?, ?, ?, ?, 'Activo', ?)`,
      [name, price, description, id_categoria_pizza, imageUrl],
    );

    res.status(201).json({
      success: true,
      message: "Pizza registrada",
      id: result.insertId,
      url: imageUrl,
    });
  } catch (error) {
    console.error("Error al registrar pizza:", error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// ─── REGISTRAR LAS BEBIDAS ──────────────────────────────────────────────
Router.post("/bebidas", upload.single("imagen"), async (req, res) => {
  const { name, price, description } = req.body;

  try {
    const imageUrl = await uploadImageToCloudinary(req.file, "bebidas");

    const [result] = await pool.query(
      `INSERT INTO bebidas (nombre, precio, descripcion, url) VALUES (?, ?, ?, ?)`,
      [name, price, description, imageUrl],
    );

    res.status(201).json({
      success: true,
      message: "Bebida registrada",
      id: result.insertId,
      url: imageUrl,
    });
  } catch (error) {
    console.error("Error al registrar bebida:", error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// ─── REGISTRAR LOS HELADOS ──────────────────────────────────────────────
Router.post("/heladeria", upload.single("imagen"), async (req, res) => {
  const { name, price, description } = req.body;

  try {
    const imageUrl = await uploadImageToCloudinary(req.file, "helados");

    const [result] = await pool.query(
      `INSERT INTO heladeria (nombre, precio, descripcion, url) VALUES (?, ?, ?, ?)`,
      [name, price, description, imageUrl],
    );

    res.status(201).json({
      success: true,
      message: "Helado registrado",
      id: result.insertId,
      url: imageUrl,
    });
  } catch (error) {
    console.error("Error al registrar helado:", error);
    res.status(500).json({ success: false, message: error.message });
  }
});

export default Router;
