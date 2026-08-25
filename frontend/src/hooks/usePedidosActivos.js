import { useQuery } from "@tanstack/react-query";
import { useApp } from "../context/AppContext";

const API_BASE = "http://localhost:3001/api";

export function usePedidosActivos() {
  const { currentUser } = useApp();
  return useQuery({
    queryKey: ["pedidosActivos"],
    refetchInterval: 60_000,
    refetchIntervalInBackground: false,
    enabled: !!currentUser,
    queryFn: async () => {
      try {
        const res = await fetch(`${API_BASE}/obtener-pedidos-activos`, {
          credentials: "include",
        });
        const json = await res.json();
        return json.success ? json.data : [];
      } catch (err) {
        console.error("Error al cargar pedidos activos:", err);
        return [];
      }
    },
  });
}
