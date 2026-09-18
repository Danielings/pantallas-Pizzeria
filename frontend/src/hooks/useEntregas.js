import { useQuery, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import { useEffect } from "react";
import { subscribeToPusher } from "../lib/pusherClient";

export function useEntregas() {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ["entregas"],
    staleTime: 5000,
    refetchOnWindowFocus: true,
    refetchOnMount: true,
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
    const refreshEntregas = () => {
      queryClient.invalidateQueries({ queryKey: ["entregas"] });
      queryClient.refetchQueries({ queryKey: ["entregas"] });
    };

    const unsubscribeOrders = subscribeToPusher({
      channelName: "pizzeria-orders",
      events: {
        pedido_actualizado: refreshEntregas,
        pedido_creado: refreshEntregas,
        nuevo_pedido: refreshEntregas,
      },
    });

    const unsubscribeKitchen = subscribeToPusher({
      channelName: "pizzeria-kitchen",
      events: {
        pedido_estado_cambiado: refreshEntregas,
      },
    });

    return () => {
      unsubscribeOrders();
      unsubscribeKitchen();
    };
  }, [queryClient]);

  return query;
}
