import { useQuery, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import { useEffect } from "react";
import { subscribeToPusher } from "../lib/pusherClient";

export function useEntregas() {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ["entregas"],
    staleTime: Infinity,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    queryFn: async () => {
      const res = await axios.get("http://localhost:3001/api/entregas", {
        withCredentials: true,
      });

      // Extracción segura para garantizar que React Query almacene un arreglo
      if (Array.isArray(res.data)) return res.data;
      if (res.data?.data && Array.isArray(res.data.data)) return res.data.data;
      if (res.data?.orders && Array.isArray(res.data.orders))
        return res.data.orders;

      return []; // Fallback por defecto si la API devuelve algo inesperado
    },
  });

  useEffect(() => {
    const unsubscribe = subscribeToPusher({
      channelName: "pizzeria-orders",
      events: {
        pedido_actualizado: () => {
          queryClient.invalidateQueries({ queryKey: ["entregas"] });
        },
        nuevo_pedido: () => {
          queryClient.invalidateQueries({ queryKey: ["entregas"] });
        },
      },
    });

    return () => unsubscribe();
  }, [queryClient]);

  return query;
}
