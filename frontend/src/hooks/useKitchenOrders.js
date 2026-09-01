import { useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useApp } from "../context/AppContext";
import { subscribeToPusher } from "../lib/pusherClient";

const API_BASE = "http://localhost:3001/api";

const adaptVenta = (venta, status) => ({
  id: venta.codigo_orden,
  db_id: venta.id_venta,
  status,
  createdAt: venta.fecha_hora,
  orderType: venta.despacho,
  table: venta.despacho,
  customerName: venta.nombre_cliente,
  phoneLastDigits: venta.digitos_delivery || "",
  items: (venta.detalles || []).map((detalle) => ({
    id_detalle: detalle.id_detalle,
    name: detalle.nombre_producto,
    qty: detalle.cantidad,
    note: detalle.nota,
    size: detalle.categoria_pizza,
    category: "pizzas",
    extras: detalle.extras || [],
  })),
});

const fetchKitchen = async (endpoint, status) => {
  try {
    const res = await fetch(`${API_BASE}/${endpoint}`, {
      credentials: "include",
    });
    const json = await res.json();
    return json.success
      ? (json.data || []).map((v) => adaptVenta(v, status))
      : [];
  } catch (err) {
    console.error(`Error al cargar ${endpoint}:`, err);
    return [];
  }
};

export function useKitchenOrders() {
  const queryClient = useQueryClient();
  const { currentUser } = useApp();

  useEffect(() => {
    if (!currentUser) return undefined;

    const unsubscribeKitchen = subscribeToPusher({
      channelName: "pizzeria-kitchen",
      events: {
        pedido_estado_cambiado: () => {
          queryClient.invalidateQueries({ queryKey: ["kitchenOrders"] });
        },
        pedido_actualizado: () => {
          queryClient.invalidateQueries({ queryKey: ["kitchenOrders"] });
        },
      },
    });

    const unsubscribeOrders = subscribeToPusher({
      channelName: "pizzeria-orders",
      events: {
        pedido_actualizado: () => {
          queryClient.invalidateQueries({ queryKey: ["kitchenOrders"] });
        },
        pedido_creado: () => {
          queryClient.invalidateQueries({ queryKey: ["kitchenOrders"] });
        },
      },
    });

    return () => {
      unsubscribeKitchen();
      unsubscribeOrders();
    };
  }, [currentUser, queryClient]);

  const query = useQuery({
    queryKey: ["kitchenOrders"],
    staleTime: 15_000,
    enabled: !!currentUser,
    queryFn: async () => {
      const [pending, preparing, delivered, ready, waiter_pending] =
        await Promise.all([
          fetchKitchen("obtener-pedidos-cocina", "pending"),
          fetchKitchen("obtener-pedidos-horno", "preparing"),
          fetchKitchen("obtener-pedidos-despacho", "delivered"),
          fetchKitchen("obtener-pedidos-pendiente", "ready"),
          fetchKitchen("obtener-pedidos-mesero", "waiter_pending"),
        ]);
      return [
        ...pending,
        ...preparing,
        ...delivered,
        ...ready,
        ...waiter_pending,
      ];
    },
  });

  const updateOrderStatusMutation = useMutation({
    mutationFn: async ({ id, status }) => {
      const orders = queryClient.getQueryData(["kitchenOrders"]) || [];
      const order = orders.find((o) => o.id === id);

      if (order && order.db_id) {
        const res = await fetch(
          `${API_BASE}/actualizar-estado-pedido/${order.db_id}`,
          {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ status }),
            credentials: "include",
          },
        );
        const json = await res.json();
        if (!json.success) {
          throw new Error(json.message || "Error al actualizar el estado");
        }
      }
      return { id, status };
    },
    onSuccess: async ({ id, status }) => {
      queryClient.setQueryData(["kitchenOrders"], (old = []) =>
        old.map((o) => (o.id === id ? { ...o, status } : o)),
      );
      await queryClient.invalidateQueries({ queryKey: ["kitchenOrders"] });
    },
  });

  const updateOrderStatus = (id, status) =>
    updateOrderStatusMutation.mutateAsync({ id, status });

  const archiveOrder = async (id) => {
    queryClient.setQueryData(["kitchenOrders"], (old = []) =>
      old.filter((o) => o.id !== id),
    );
    await queryClient.invalidateQueries({ queryKey: ["kitchenOrders"] });
  };

  const updateOrder = async (order) => {
    queryClient.setQueryData(["kitchenOrders"], (old = []) =>
      old.map((o) => (o.id === order.id ? { ...o, ...order } : o)),
    );
    await queryClient.invalidateQueries({ queryKey: ["kitchenOrders"] });
  };

  return {
    orders: query.data ?? [],
    isLoading: query.isLoading,
    refetch: query.refetch,
    updateOrderStatus,
    archiveOrder,
    updateOrder,
  };
}
