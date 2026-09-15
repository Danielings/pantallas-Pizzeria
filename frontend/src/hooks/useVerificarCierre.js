import { useQuery } from "@tanstack/react-query";
import axios from "axios";

const API = "http://localhost:3001/api";

export function useVerificarCierre() {
  return useQuery({
    queryKey: ["verificarCierrePendiente"],
    // Evita saturar la API si el cajero minimiza/maximiza el navegador
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    // Cache "fresca" por 5 minutos para no re-consultar sin necesidad
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    queryFn: async () => {
      const { data } = await axios.get(`${API}/cierre/pendiente`, {
        withCredentials: true,
      });
      return Boolean(data.pendiente);
    },
  });
}