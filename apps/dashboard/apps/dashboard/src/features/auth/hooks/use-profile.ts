import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useSession } from "./use-session";

const API_BASE =
  import.meta.env.VITE_API_BASE_URL ?? "http://localhost:7071/api";

export interface ProfileData {
  firstName: string;
  lastName: string;
  profession: string;
  email: string;
  phone: string;
  photo: string | null;
}

interface ProfileResponse {
  nombre?: string;
  Nombre?: string;
  apellido?: string;
  Apellido?: string;
  grado?: string;
  Grado?: string;
  correo?: string;
  Correo?: string;
  telefono?: string;
  Telefono?: string;
  bachiller?: string;
  Bachiller?: string;
}

const formatProfileData = (
  data: ProfileResponse,
  userEmail?: string,
): ProfileData => {
  const nombreBackend = (data.nombre || data.Nombre || "").trim();
  const apellidoBackend = (data.apellido || data.Apellido || "").trim();

  let firstName = "";
  let lastName = "";

  // CASO 1: Backend tiene nombre y apellido separados
  if (nombreBackend && apellidoBackend) {
    firstName = nombreBackend;
    lastName = apellidoBackend;
  }
  // CASO 2: Solo hay nombre completo (necesita división)
  else if (nombreBackend && !apellidoBackend) {
    const palabras = nombreBackend.split(" ").filter(Boolean);

    if (palabras.length === 0) {
      firstName = "";
      lastName = "";
    } else if (palabras.length === 1) {
      // Solo un nombre
      firstName = palabras[0];
      lastName = "";
    } else if (palabras.length === 2) {
      // Nombre y apellido
      firstName = palabras[0];
      lastName = palabras[1];
    } else if (palabras.length === 3) {
      // Asume: Nombre + Apellido Paterno + Apellido Materno
      firstName = palabras[0];
      lastName = palabras.slice(1).join(" ");
    } else {
      // 4+ palabras: Asume primeras 2 son nombres, resto apellidos
      // Ejemplo: "Juan Carlos Pérez García" → "Juan Carlos" + "Pérez García"
      firstName = palabras.slice(0, 2).join(" ");
      lastName = palabras.slice(2).join(" ");
    }
  }
  // CASO 3: Solo hay apellido (raro, pero posible)
  else if (!nombreBackend && apellidoBackend) {
    firstName = "";
    lastName = apellidoBackend;
  }

  return {
    firstName,
    lastName,
    profession:
      data.grado || data.Grado || data.bachiller || data.Bachiller || "",
    email: data.correo || data.Correo || userEmail || "",
    phone: data.telefono || data.Telefono || "",
    photo: null,
  };
};

export function useProfile() {
  const { user } = useSession();
  const queryClient = useQueryClient();

  // 📥 Query para obtener el perfil
  const getProfile = useQuery({
    queryKey: ["profile", user?.id],
    queryFn: async (): Promise<ProfileResponse> => {
      if (!user?.id) throw new Error("No user ID");

      const response = await fetch(`${API_BASE}/teacher/${user.id}`);

      if (!response.ok) {
        throw new Error("Error al cargar perfil");
      }

      const data = await response.json();
      return data.data || data;
    },
    enabled: !!user?.id,
    retry: 1,
    staleTime: 5 * 60 * 1000,
  });

  // 📤 Mutation para actualizar el perfil
  const updateProfileMutation = useMutation({
    mutationFn: async (updatedData: ProfileData) => {
      if (!user?.id) throw new Error("No user ID");

      // Obtener datos actuales del perfil
      const currentProfile = getProfile.data
        ? formatProfileData(getProfile.data, user?.email)
        : null;

      if (!currentProfile) {
        throw new Error("No se pudo cargar el perfil actual");
      }

      // Construir objeto solo con campos modificados
      const updatePayload: Record<string, string> = {};

      // 🔥 COMBINAR nombre y apellido en un solo campo "nombre"
      const nombreCompleto =
        `${updatedData.firstName.trim()} ${updatedData.lastName.trim()}`.trim();
      const nombreActual =
        `${currentProfile.firstName.trim()} ${currentProfile.lastName.trim()}`.trim();

      if (nombreCompleto !== nombreActual) {
        // ✅ Permitir vaciar el nombre (aunque no es recomendable)
        updatePayload.nombre = nombreCompleto;
      }

      // ✅ Profesión: Permitir vaciar (detecta cambio a string vacío)
      if (updatedData.profession !== currentProfile.profession) {
        updatePayload.grado = updatedData.profession.trim();
      }

      // ✅ Teléfono: Permitir vaciar (detecta cambio a string vacío)
      if (updatedData.phone !== currentProfile.phone) {
        updatePayload.telefono = updatedData.phone.trim();
      }

      //El correo NO se puede modificar (el campo está disabled en el frontend)
      // Solo se incluye si el backend lo requiere
      // updatePayload.correo = updatedData.email;

      // Verificar si hay cambios reales
      if (Object.keys(updatePayload).length === 0) {
        throw new Error("No hay cambios para guardar");
      }

      console.log("📤 Enviando al backend:", updatePayload);

      const response = await fetch(`${API_BASE}/teacher/${user.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updatePayload),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Error al actualizar perfil");
      }

      return response.json();
    },
    onSuccess: async () => {
      // Invalida ambas queries para refrescar los datos
      await queryClient.invalidateQueries({ queryKey: ["session"] });
      await queryClient.invalidateQueries({ queryKey: ["profile", user?.id] });
    },
  });

  return {
    // Datos formateados
    profile: getProfile.data
      ? formatProfileData(getProfile.data, user?.email)
      : null,

    // Estados de carga
    isLoading: getProfile.isLoading,
    isError: getProfile.isError,
    error: getProfile.error,

    // Mutación de actualización
    updateProfile: updateProfileMutation.mutate,
    isUpdating: updateProfileMutation.isPending,
    updateError: updateProfileMutation.error,

    // Funciones auxiliares
    refetch: getProfile.refetch,
  };
}
