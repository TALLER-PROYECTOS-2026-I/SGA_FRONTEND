import { useQuery } from "@tanstack/react-query";
import React from "react";
import { authService } from "../services/auth-service";
import { SessionContext } from "./session-context";

const API_BASE =
  import.meta.env.VITE_API_BASE_URL ?? "http://localhost:7071/api";

export const SessionProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const [token, setToken] = React.useState<string | undefined>();
  const [shouldFetch, setShouldFetch] = React.useState(false);

  React.useLayoutEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const tokenFromUrl = urlParams.get("token");
    const mailToken = urlParams.get("mailToken");

    if (tokenFromUrl && mailToken) {
      setToken(tokenFromUrl);
      sessionStorage.setItem("token", tokenFromUrl);
      sessionStorage.setItem("mailToken", mailToken);
      const clear = window.location.origin + window.location.pathname;
      window.history.replaceState({}, document.title, clear);
    } else {
      const savedToken = sessionStorage.getItem("token");
      if (savedToken) {
        setToken(savedToken);
      }
    }
    setShouldFetch(true);
  }, []);

  const getSession = useQuery({
    queryKey: ["session", token],
    queryFn: () => authService.fetchSession(token),
    enabled: shouldFetch,
    retry: false,
    staleTime: 5 * 60 * 1000,
  });

  // Query para obtener el perfil completo del docente
  const getTeacherProfile = useQuery({
    queryKey: ["teacher-profile", getSession.data?.user?.id],
    queryFn: async () => {
      const userId = getSession.data?.user?.id;
      if (!userId) return null;

      const response = await fetch(`${API_BASE}/teacher/${userId}`);
      if (!response.ok) return null;

      const data = await response.json();
      return data.data || data;
    },
    enabled: !!getSession.data?.user?.id,
    retry: 1,
    staleTime: 5 * 60 * 1000,
  });

  React.useEffect(() => {
    if (getSession.isError && shouldFetch) {
      sessionStorage.removeItem("token");
      sessionStorage.removeItem("mailToken");
      console.log("❌ Sesión inválida - tokens eliminados");
    }
  }, [getSession.isError, shouldFetch]);

  // Combinar nombre y apellido para obtener el nombre completo
  const getUserWithFullName = () => {
    const sessionUser = getSession.data?.user;
    if (!sessionUser) return undefined;

    const profileData = getTeacherProfile.data;
    if (profileData) {
      const nombre = (profileData.nombre || profileData.Nombre || "").trim();
      const apellido = (
        profileData.apellido ||
        profileData.Apellido ||
        ""
      ).trim();

      // Combinar nombre y apellido para el nombre completo
      const fullName =
        nombre && apellido
          ? `${nombre} ${apellido}`
          : nombre || apellido || sessionUser.name;

      return {
        ...sessionUser,
        name: fullName,
      };
    }

    return sessionUser;
  };

  return (
    <SessionContext.Provider
      value={{
        user: getUserWithFullName(),
        isLoading: getSession.isLoading || getTeacherProfile.isLoading,
        isError: getSession.isError,
      }}
    >
      {children}
    </SessionContext.Provider>
  );
};
