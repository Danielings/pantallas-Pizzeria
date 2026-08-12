import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const envPath = path.resolve(__dirname, "..", ".env");

const result = dotenv.config({ path: envPath, override: true });

if (result.error) {
console.warn("[env] No se encontró .env en:", envPath);
} else {
const count = Object.keys(result.parsed ?? {}).length;
console.log(`[env] ${count} variables cargadas desde .env`);
}

/** Lee variable de entorno y elimina espacios accidentales */
export function env(key) {
const value = process.env[key];
return typeof value === "string" ? value.trim() : value;
}
