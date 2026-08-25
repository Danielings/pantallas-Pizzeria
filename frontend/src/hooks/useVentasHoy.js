import { useQuery } from "@tanstack/react-query";
import { useApp } from "../context/AppContext";

const API_BASE = "http://localhost:3001/api";

export function useVentasHoy() {
  const { currentUser } = useApp();
  return useQuery({
    queryKey: ["ventasHoy"],
    refetchInterval: 15_000,
    enabled: !!currentUser,
    queryFn: async () => {
      try {
        const res = await fetch(`${API_BASE}/obtener-ventas-hoy`, {
          credentials: "include",
        });
        const json = await res.json();
        return json.success ? json.data : null;
      } catch (err) {
        console.error("Error al cargar ventas del día:", err);
        return null;
      }
    },
  });
}
