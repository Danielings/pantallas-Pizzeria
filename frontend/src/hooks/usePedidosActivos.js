import { useQuery } from "@tanstack/react-query";

const API_BASE = "http://localhost:3001/api";

export function usePedidosActivos() {
  return useQuery({
    queryKey: ["pedidosActivos"],
    staleTime: 15_000,
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
