export default function esCajero(req, res, next) {
  if (req.user.rol !== "cashier") {
    return res
      .status(403)
      .json({ message: "Acceso denegado. Requiere ser Cajero." });
  }
  next();
}
