import pool from "../config/bd.js";
import { uploadImageToCloudinary } from "../utils/cloudinary.js";

// ----pizzas
export const obtenerPizzas = async (req, res) => {
  const { id_sucursal, rol } = req.user;
  try {
    let query = `
      SELECT p.*, c.categoria AS categoria_nombre
      FROM pizza p
      LEFT JOIN categoria_pizza c ON p.id_categoria_pizza = c.id_categoria_pizza
    `;
    let params = [];

    const esAdmin = rol?.toLowerCase() === "admin";

    if (!esAdmin) {
      query += ` WHERE p.id_sucursal = ?`;
      params.push(id_sucursal);
    }

    const [rows] = await pool.execute(query, params);

    const pizzas = rows.map((pizza) => ({
      id: pizza.id_pizza,
      name: pizza.nombre,
      price: pizza.precio,
      description: pizza.descripcion,
      category: "pizzas",
      size: pizza.categoria_nombre || "Normal",
      pizzaCategory: pizza.categoria_nombre || null, // <-- Aquí guardamos el tamaño/categoría (ej. "Familiar")
      url: pizza.url || null,
      estado: pizza.estado || "Activo",
    }));

    res.json({ success: true, data: pizzas });
  } catch (error) {
    console.error("Error obteniendo pizzas:", error);
    res
      .status(500)
      .json({ success: false, message: "Error interno del servidor" });
  }
};

export const crearPizza = async (req, res) => {
  const { name, price, description, size } = req.body;
  try {
    let id_categoria_pizza =
      size === "Gigante" ? 3 : size === "Familiar" ? 2 : 1;
    const imageUrl = await uploadImageToCloudinary(req.file, "pizzas");

    const [result] = await pool.query(
      `INSERT INTO pizza (nombre, precio, descripcion, id_categoria_pizza, estado, url) VALUES (?, ?, ?, ?, 'Activo', ?)`,
      [name, price, description, id_categoria_pizza, imageUrl],
    );

    res.status(201).json({
      success: true,
      message: "Pizza registrada",
      id: result.insertId,
      url: imageUrl,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const actualizarPizza = async (req, res) => {
  const { id } = req.params;
  const { name, price, description, size } = req.body;
  try {
    let id_categoria_pizza =
      size === "Gigante" ? 3 : size === "Familiar" ? 2 : 1;

    const [existing] = await pool.query(
      "SELECT url FROM pizza WHERE id_pizza = ?",
      [id],
    );
    let imageUrl = existing.length > 0 ? existing[0].url : null;

    if (req.file) imageUrl = await uploadImageToCloudinary(req.file, "pizzas");

    await pool.query(
      `UPDATE pizza SET nombre = ?, precio = ?, descripcion = ?, id_categoria_pizza = ?, url = ? WHERE id_pizza = ?`,
      [name, price, description, id_categoria_pizza, imageUrl, id],
    );

    res.json({
      success: true,
      message: "Pizza actualizada correctamente",
      url: imageUrl,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ----bebidasw

export const obtenerBebidas = async (req, res) => {
  try {
    const [rows] = await pool.execute("SELECT * FROM bebidas");

    const bebidas = rows.map((bebida) => ({
      id: bebida.id_bebida, // <-- Basado en tu imagen, la columna es id_bebida
      name: bebida.nombre,
      price: bebida.precio,
      description: bebida.descripcion,
      category: "drinks",
      url: bebida.url || null,
      estado: bebida.estado || "Activo",
    }));

    res.json({ success: true, data: bebidas });
  } catch (error) {
    console.error("Error obteniendo bebidas:", error);
    res
      .status(500)
      .json({ success: false, message: "Error interno del servidor" });
  }
};

export const crearBebida = async (req, res) => {
  const { name, price, description } = req.body;
  try {
    const imageUrl = await uploadImageToCloudinary(req.file, "bebidas");
    const [result] = await pool.query(
      `INSERT INTO bebidas (nombre, precio, descripcion, estado, url) VALUES (?, ?, ?, 'Activo', ?)`,
      [name, price, description, imageUrl],
    );
    res.status(201).json({
      success: true,
      message: "Bebida registrada",
      id: result.insertId,
      url: imageUrl,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const actualizarBebida = async (req, res) => {
  const { id } = req.params;
  const { name, price, description } = req.body;
  try {
    const [existing] = await pool.query(
      "SELECT url FROM bebidas WHERE id_bebida = ?",
      [id],
    );
    let imageUrl = existing.length > 0 ? existing[0].url : null;

    if (req.file) imageUrl = await uploadImageToCloudinary(req.file, "bebidas");

    await pool.query(
      `UPDATE bebidas SET nombre = ?, precio = ?, descripcion = ?, url = ? WHERE id_bebida = ?`,
      [name, price, description, imageUrl, id],
    );
    res.json({
      success: true,
      message: "Bebida actualizada correctamente",
      url: imageUrl,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// -----helados

export const obtenerHelados = async (req, res) => {
  try {
    const [rows] = await pool.execute("SELECT * FROM heladeria");

    const helados = rows.map((helado) => ({
      id: helado.id_helado, // <-- Asegúrate de que coincida con la columna ID de tu tabla heladeria
      name: helado.nombre,
      price: helado.precio,
      description: helado.descripcion,
      category: "icecream",
      url: helado.url || null,
      estado: helado.estado || "Activo",
    }));

    res.json({ success: true, data: helados });
  } catch (error) {
    console.error("Error obteniendo helados:", error);
    res
      .status(500)
      .json({ success: false, message: "Error interno del servidor" });
  }
};

export const crearHelado = async (req, res) => {
  const { name, price, description } = req.body;
  try {
    const imageUrl = await uploadImageToCloudinary(req.file, "helados");
    const [result] = await pool.query(
      `INSERT INTO heladeria (nombre, precio, descripcion, estado, url) VALUES (?, ?, ?, 'Activo', ?)`,
      [name, price, description, imageUrl],
    );
    res.status(201).json({
      success: true,
      message: "Helado registrado",
      id: result.insertId,
      url: imageUrl,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const actualizarHelado = async (req, res) => {
  const { id } = req.params;
  const { name, price, description } = req.body;
  try {
    const [existing] = await pool.query(
      "SELECT url FROM heladeria WHERE id_helado = ?",
      [id],
    );
    let imageUrl = existing.length > 0 ? existing[0].url : null;

    if (req.file) imageUrl = await uploadImageToCloudinary(req.file, "helados");

    await pool.query(
      `UPDATE heladeria SET nombre = ?, precio = ?, descripcion = ?, url = ? WHERE id_helado = ?`,
      [name, price, description, imageUrl, id],
    );
    res.json({
      success: true,
      message: "Helado actualizado correctamente",
      url: imageUrl,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// -----extras

export const obtenerExtras = async (req, res) => {
  try {
    const [rows] = await pool.execute(`
      SELECT e.*, c.categoria AS categoria_nombre 
      FROM extras e
      LEFT JOIN categoria_pizza c ON e.id_categoria_pizza = c.id_categoria_pizza
    `);

    const extras = rows.map((extra) => ({
      id: extra.id_extras,
      id_categoria_pizza: extra.id_categoria_pizza,
      name: extra.nombre,
      price: extra.precio,
      category: "extras",
      size: extra.categoria_nombre || "Normal",
      extraCategory: extra.categoria_nombre || null,
      estado: extra.estado || "Activo",
    }));

    res.json({ success: true, data: extras });
  } catch (error) {
    console.error("Error obteniendo extras:", error);
    res
      .status(500)
      .json({ success: false, message: "Error interno del servidor" });
  }
};

export const crearExtra = async (req, res) => {
  const { name, price, size } = req.body;
  try {
    let id_categoria_pizza =
      size === "Gigante" ? 3 : size === "Familiar" ? 2 : 1;
    const [result] = await pool.query(
      `INSERT INTO extras (nombre, precio, id_categoria_pizza, estado) VALUES (?, ?, ?, 'Activo')`,
      [name, price, id_categoria_pizza],
    );
    res.status(201).json({
      success: true,
      message: "Extra registrado",
      id: result.insertId,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const actualizarExtra = async (req, res) => {
  const { id } = req.params;
  const { name, price, size } = req.body;
  try {
    let id_categoria_pizza =
      size === "Gigante" ? 3 : size === "Familiar" ? 2 : 1;
    await pool.query(
      `UPDATE extras SET nombre = ?, precio = ?, id_categoria_pizza = ? WHERE id_extras = ?`,
      [name, price, id_categoria_pizza, id],
    );
    res.status(200).json({ success: true, message: "Extra actualizado" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
