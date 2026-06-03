import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";

const GRAPH_PHOTO_URL = "https://graph.microsoft.com/v1.0/me/photo/$value";

function getMailToken() {
  return (
    sessionStorage.getItem("mailToken") ||
    localStorage.getItem("mailToken") ||
    sessionStorage.getItem("graphToken") ||
    localStorage.getItem("graphToken") ||
    ""
  );
}

export const useUserPhoto = () => {
  const token = getMailToken();

  const query = useQuery<string | null>({
    queryKey: ["userPhoto", token],
    enabled: Boolean(token),
    queryFn: async () => {
      if (!token) {
        return null;
      }

      try {
        const response = await fetch(GRAPH_PHOTO_URL, {
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: "image/jpeg",
          },
        });

        /*
          401 = token vencido o sin permiso para Microsoft Graph.
          403 = token válido, pero sin permiso para leer foto.
          404 = usuario sin foto configurada.

          En estos casos NO debe romper la app.
          Solo devolvemos null para que use el avatar con iniciales.
        */
        if (
          response.status === 401 ||
          response.status === 403 ||
          response.status === 404
        ) {
          return null;
        }

        if (!response.ok) {
          return null;
        }

        const blob = await response.blob();

        if (!blob || blob.size === 0) {
          return null;
        }

        return URL.createObjectURL(blob);
      } catch {
        return null;
      }
    },
    staleTime: 1000 * 60 * 10,
    gcTime: 1000 * 60 * 10,
    retry: false,
    refetchOnWindowFocus: false,
  });

  useEffect(() => {
    return () => {
      if (query.data && query.data.startsWith("blob:")) {
        URL.revokeObjectURL(query.data);
      }
    };
  }, [query.data]);

  return {
    ...query,
    data: query.data ?? null,
  };
};