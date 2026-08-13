import bcrypt from "bcrypt";
import pool from "../config/bd.js";

const sanitizePhone = (phone) => {
  const digits = String(phone || "").replace(/\D/g, "");
  return digits ? parseInt(digits, 10) : 0;
};

//----------------------Clientes

export const buscarClientes = async (req, res) => {
  const { q } = req.query;
  const searchTerm = q ? q.trim() : "";

  try {
    const [rows] = await pool.query(
      `SELECT c.id_cliente as id, c.cedula, c.nombre as name, c.telefono as phone, 
              COUNT(v.id_venta) as orders
       FROM clientes c
       LEFT JOIN ventas v ON c.id_cliente = v.id_cliente
       WHERE c.cedula = ? OR c.nombre LIKE ?
       GROUP BY c.id_cliente`,
      [searchTerm, `%${searchTerm}%`],
    );

    if (rows.length > 0) {
      res.json({ success: true, cliente: rows[0] });
    } else {
      res.json({ success: false, message: "Cliente no encontrado" });
    }
  } catch (error) {
    console.error("Error buscando cliente:", error);
    res.status(500).json({ success: false, error: error.message });
  }
};

export const obtenerClientes = async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT c.id_cliente AS id, c.cedula, c.nombre AS name, c.telefono AS phone, c.descripcion,
              COUNT(v.id_venta) AS orders,
              COALESCE(SUM(v.monto_total_usd), 0) AS total,
              MAX(v.fecha_hora) AS lastVisit
       FROM clientes c
       LEFT JOIN ventas v ON c.id_cliente = v.id_cliente
       GROUP BY c.id_cliente
       ORDER BY c.nombre ASC`,
    );

    res.json({ success: true, data: rows });
  } catch (error) {
    console.error("Error obteniendo clientes:", error);
    res.status(500).json({ success: false, error: error.message });
  }
};

export const registrarClientes = async (req, res) => {
  const { cedula, name, phone, descripcion } = req.body;
  const cedulaTrim = String(cedula || "").trim();

  if (!cedulaTrim || !String(name || "").trim()) {
    return res.status(400).json({
      success: false,
      message: "La cédula y el nombre son obligatorios",
    });
  }

  try {
    const [existing] = await pool.query(
      `SELECT id_cliente FROM clientes WHERE cedula = ?`,
      [cedulaTrim],
    );

    if (existing.length > 0) {
      return res.status(400).json({
        success: false,
        message: "Ya existe un cliente registrado con esa cédula",
      });
    }

    const [result] = await pool.query(
      `INSERT INTO clientes (cedula, nombre, telefono, descripcion) VALUES (?, ?, ?, ?)`,
      [
        cedulaTrim,
        String(name).trim(),
        sanitizePhone(phone),
        descripcion || "",
      ],
    );

    res.status(201).json({
      success: true,
      cliente: {
        id: result.insertId,
        cedula: cedulaTrim,
        name: String(name).trim(),
        phone: sanitizePhone(phone),
        descripcion: descripcion || "",
        orders: 0,
        total: 0,
        lastVisit: null,
      },
    });
  } catch (error) {
    console.error("Error registrando cliente:", error);
    res.status(500).json({ success: false, error: error.message });
  }
};

export const editarCliente = async (req, res) => {
  const { id } = req.params;
  const { cedula, name, phone, descripcion } = req.body;
  const cedulaTrim = String(cedula || "").trim();

  if (!cedulaTrim || !String(name || "").trim()) {
    return res.status(400).json({
      success: false,
      message: "La cédula y el nombre son obligatorios",
    });
  }

  try {
    const [existing] = await pool.query(
      `SELECT id_cliente FROM clientes WHERE cedula = ? AND id_cliente != ?`,
      [cedulaTrim, id],
    );

    if (existing.length > 0) {
      return res.status(400).json({
        success: false,
        message: "Ya existe otro cliente con esa cédula",
      });
    }

    const [result] = await pool.query(
      `UPDATE clientes SET cedula = ?, nombre = ?, telefono = ?, descripcion = ? WHERE id_cliente = ?`,
      [
        cedulaTrim,
        String(name).trim(),
        sanitizePhone(phone),
        descripcion || "",
        id,
      ],
    );

    if (result.affectedRows === 0) {
      return res
        .status(404)
        .json({ success: false, message: "Cliente no encontrado" });
    }

    res.json({
      success: true,
      cliente: {
        id,
        cedula: cedulaTrim,
        name: String(name).trim(),
        phone: sanitizePhone(phone),
        descripcion: descripcion || "",
      },
    });
  } catch (error) {
    console.error("Error editando cliente:", error);
    res.status(500).json({ success: false, error: error.message });
  }
};

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
    const { name, nombre_completo, password, id_sucursal, rol } = req.body;

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
      "SELECT id_usuario FROM usuarios WHERE email = ? LIMIT 1",
      [emailTrim],
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
//----------------------Sucursales
export const registrarSucursal = async (req, res) => {
  try {
    const { name, direccion } = req.body;
    const nameTrim = String(name || "").trim();
    const direccionTrim = String(direccion || "").trim();

    if (!nameTrim) {
      return res.status(400).json({
        success: false,
        message: "EL nombre de la sucursal es obligatorio.",
      });
    }

    const [existeSucursal] = await pool.query(
      "SELECT id_sucursal FROM sucursal WHERE sucursal = ? LIMIT 1",
      [nameTrim],
    );

    if (existeSucursal.length > 0) {
      return res.status(409).json({
        success: false,
        message: "Ya existe una sucursal  con ese nombre.",
      });
    }

    const estadoActivo = "Activo";

    const [sucursalCreada] = await pool.query(
      "INSERT INTO sucursal (sucursal, direccion, estado) VALUES (?,?,?)",
      [nameTrim, direccionTrim, estadoActivo],
    );

    res.status(201).json({
      success: true,
      message: "La sucursal ha sido creada exisitosamente!",
      sucursal: {
        id_sucursal: sucursalCreada.insertId,
        sucursal: nameTrim,
        direccion: direccionTrim,
        estado: estadoActivo,
      },
    });
  } catch (error) {
    console.error("Error al registrar una sucursal", error);
    res.status(500).json({
      success: false,
      message: "No se pudo registrar la sucursal.",
      error: error.message,
    });
  }
};

export const obtenerSucursal = async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT 
        id_sucursal AS id, 
        sucursal AS name, 
        direccion AS address 
      FROM sucursal
      WHERE estado = 'Activo'
    `);

    res.json({ success: true, data: rows });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Error en servidor" });
  }
};
