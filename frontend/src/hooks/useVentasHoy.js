import { useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useApp } from "../context/AppContext";
import { subscribeToPusher } from "../lib/pusherClient";

const API_BASE = "http://localhost:3001/api";

export function useVentasHoy() {
  const { currentUser } = useApp();
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!currentUser) return undefined;

    const unsubscribe = subscribeToPusher({
      channelName: "pizzeria-sales",
      events: {
        venta_completada: () => {
          queryClient.invalidateQueries({ queryKey: ["ventasHoy"] });
        },
      },
    });

    return () => unsubscribe();
  }, [currentUser, queryClient]);

  return useQuery({
    queryKey: ["ventasHoy"],
    staleTime: 30_000,
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
