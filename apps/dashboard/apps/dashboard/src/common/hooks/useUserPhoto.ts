import { useQuery } from "@tanstack/react-query";
import { useEffect } from "react";

export const useUserPhoto = () => {
  const query = useQuery({
    queryKey: ["userPhoto"],
    queryFn: async () => {
      const token = sessionStorage.getItem("mailToken");
      if (!token) throw new Error("No hay token en sessionStorage");

      const response = await fetch(
        "https://graph.microsoft.com/v1.0/me/photo/$value",
        {
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: "image/jpeg",
          },
        },
      );

      if (response.status === 404) {
        return null;
      }

      if (!response.ok) {
        throw new Error(
          `Error al obtener la foto de perfil: ${response.status}`,
        );
      }

      const blob = await response.blob();
      return URL.createObjectURL(blob);
    },
    staleTime: 1000 * 60 * 10, // 10 minutos
    gcTime: 1000 * 60 * 10, // Mantener en caché por 10 minutos
    retry: 0, // No reintentamos si falla
    refetchOnWindowFocus: false,
  });

  useEffect(() => {
    return () => {
      if (query.data) {
        URL.revokeObjectURL(query.data);
      }
    };
  }, [query.data]);

  return query;
};
