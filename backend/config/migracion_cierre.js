import { createClient } from "@libsql/client";
import dotenv from "dotenv";

dotenv.config();

const db = createClient({
  url: process.env.TURSO_DATABASE_URL,
  authToken: process.env.TURSO_AUTH_TOKEN,
});

async function tieneColumna(tabla, columna) {
  const res = await db.execute({ sql: `PRAGMA table_info(${tabla})` });
  return res.rows.some((c) => c.name === columna);
}

// Cierre delivery y cierre general son independientes: cada venta registra
// con cuál(es) cierre(s) ya fue consumida. Sin esto, el primer cierre marcaba
// todo 'Cerrado' y el segundo cierre se mostraba en 0.
const cambios = [
  {
    tabla: "ventas",
    columnas: [
      { nombre: "cierre_general", ddl: "INTEGER NOT NULL DEFAULT 0" },
      { nombre: "cierre_delivery", ddl: "INTEGER NOT NULL DEFAULT 0" },
    ],
  },
];

try {
  for (const { tabla, columnas } of cambios) {
    for (const col of columnas) {
      const existe = await tieneColumna(tabla, col.nombre);
      if (existe) {
        console.log(`[ok] ${tabla}.${col.nombre} ya existe`);
        continue;
      }
      await db.execute({
        sql: `ALTER TABLE ${tabla} ADD COLUMN ${col.nombre} ${col.ddl}`,
      });
      console.log(`[+] ${tabla}.${col.nombre} creada`);
    }
  }
  console.log("Migración de cierre completada.");
} catch (e) {
  console.error("ERROR al migrar:", e.message);
  process.exit(1);
}