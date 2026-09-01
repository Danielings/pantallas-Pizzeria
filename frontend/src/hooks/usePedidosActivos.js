import { useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useApp } from "../context/AppContext";
import { subscribeToPusher } from "../lib/pusherClient";

const API_BASE = "http://localhost:3001/api";

export function usePedidosActivos() {
  const { currentUser } = useApp();
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!currentUser) return undefined;

    const unsubscribe = subscribeToPusher({
      channelName: "pizzeria-orders",
      events: {
        pedido_creado: () => {
          queryClient.invalidateQueries({ queryKey: ["pedidosActivos"] });
        },
        pedido_actualizado: () => {
          queryClient.invalidateQueries({ queryKey: ["pedidosActivos"] });
        },
      },
    });

    return () => unsubscribe();
  }, [currentUser, queryClient]);

  return useQuery({
    queryKey: ["pedidosActivos"],
    staleTime: 15_000,
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
