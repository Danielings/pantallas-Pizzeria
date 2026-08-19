import bcrypt from "bcrypt";
import pool from "../config/bd.js";

//----------------------Delivery

export const buscarDelivery = async (req, res) => {
  const { q } = req.query;
  const searchTerm = q ? q.trim() : "";

  try {
    const [rows] = await pool.query(
      `SELECT id_delivery as id, nombre as name, digitos as phone 
       FROM delivery 
       WHERE digitos = ? OR nombre LIKE ?`,
      [searchTerm, `%${searchTerm}%`],
    );

    if (rows.length > 0) {
      res.json({ success: true, delivery: rows[0] });
    } else {
      res.json({ success: false, message: "Delivery no encontrado" });
    }
  } catch (error) {
    console.error("Error buscando delivery:", error);
    res.status(500).json({ success: false, error: error.message });
  }
};

export const registrarDelivery = async (req, res) => {
  try {
    const { name, phone } = req.body;

    if (!name || !phone) {
      return res.status(400).json({
        success: false,
        message: "El nombre y el teléfono son requeridos.",
      });
    }

    const [result] = await pool.query(
      "INSERT INTO delivery (digitos, nombre) VALUES (?, ?)",
      [phone, name],
    );

    const deliveryData = {
      id: result.insertId,
      name,
      phone,
    };

    res.status(201).json({
      success: true,
      message: "Delivery registrado con éxito",
      delivery: {
        id: result.insertId,
        name,
        phone,
      },
    });
  } catch (error) {
    console.error("Error al registrar el nuevo delivery:", error);
    res.status(500).json({
      success: false,
      message: "Error interno del servidor al guardar el repartidor.",
    });
  }
};

//-------------------------Usuarios
export const registrarUsuario = async (req, res) => {
  try {
    const { name, nombre_completo, email, password, id_sucursal, rol } =
      req.body;

    const nameTrim = String(name || nombre_completo || "").trim();
    const emailTrim = String(email || "")
      .trim()
      .toLowerCase();
    const passwordTrim = String(password || "").trim();

    if (!nameTrim || !emailTrim || !passwordTrim) {
      return res.status(400).json({
        success: false,
        message: "El nombre, email y la contraseña son obligatorios.",
      });
    }

    if (passwordTrim.length < 6) {
      return res.status(400).json({
        success: false,
        message: "La contraseña debe tener al menos 6 caracteres.",
      });
    }

    if (!id_sucursal && id_sucursal !== 0) {
      return res.status(400).json({
        success: false,
        message: "La sucursal es obligatoria.",
      });
    }

    const [existingUser] = await pool.query(
      "SELECT u.id_usuario, s.id_sucursal FROM usuarios u LEFT JOIN sucursal s ON u.id_sucursal = s.id_sucursal WHERE u.email = ? AND s.id_sucursal = ? LIMIT 1",
      [emailTrim, id_sucursal],
    );

    if (existingUser.length > 0) {
      return res.status(409).json({
        success: false,
        message: "Ya existe un usuario con ese correo.",
      });
    }

    const passwordHash = await bcrypt.hash(passwordTrim, 10);

    const estadoActivo = "Activo";
    const [result] = await pool.query(
      "INSERT INTO usuarios (nombre_completo, email, password, id_sucursal, rol, estado) VALUES (?, ?, ?, ?, ?, ?)",
      [
        nameTrim,
        emailTrim,
        passwordHash,
        Number(id_sucursal),
        rol,
        estadoActivo,
      ],
    );

    res.status(201).json({
      success: true,
      message: "Usuario registrado correctamente.",
      usuario: {
        id_usuario: result.insertId,
        nombre_completo: nameTrim,
        email: emailTrim,
        id_sucursal: Number(id_sucursal),
        rol,
        estado: estadoActivo,
      },
    });
  } catch (error) {
    console.error("Error al registrar usuario:", error);
    res.status(500).json({
      success: false,
      message: "No se pudo registrar el usuario.",
      error: error.message,
    });
  }
};

export const obtenerUsuarios = async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT 
        id_usuario AS id, 
        nombre_completo AS name, 
        email, 
        rol AS role, 
        id_sucursal AS branchId 
      FROM usuarios 
      WHERE estado = 'Activo'
    `);

    res.json({ success: true, data: rows });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Error en servidor" });
  }
};

export const eliminarUsuario = async (req, res) => {
  const { id } = req.params;

  try {
    const [result] = await pool.query(
      "UPDATE usuarios SET estado = 'Inactivo' WHERE id_usuario = ?",
      [id],
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: "Usuario no encontrado",
      });
    }

    res.json({
      success: true,
      message: "Usuario inactivado correctamente",
    });
  } catch (error) {
    console.error("Error al inactivar usuario:", error);
    res.status(500).json({
      success: false,
      message: "Ocurrió un error al intentar eliminar el usuario",
    });
  }
};
