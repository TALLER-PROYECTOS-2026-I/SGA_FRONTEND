import { useMutation, useQueryClient } from "@tanstack/react-query";

export interface CreateAssignmentData {
  teacherId: number;
  syllabusId: number;
  courseCode: string;
  academicPeriod: string;
  message?: string;
}

interface CreateAssignmentResponse {
  success: boolean;
  message: string;
  data?: {
    id: number;
    teacherId: number;
    syllabusId: number;
    courseCode: string;
    academicPeriod: string;
    estado: string;
  };
}

interface ValidationError {
  path?: string[];
  message: string;
}

async function createAssignment(
  data: CreateAssignmentData,
): Promise<CreateAssignmentResponse> {
  const apiBase =
    import.meta.env.VITE_API_BASE_URL ?? "http://localhost:7071/api";
  const url = `${apiBase}/assignments/`;

  const res = await fetch(url, {
    method: "POST",
    credentials: "include", // Para enviar cookie sessionSGA
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });

  if (!res.ok) {
    const text = await res.text();
    try {
      const errorJson = JSON.parse(text);
      if (errorJson.data && Array.isArray(errorJson.data)) {
        const validationErrors = (errorJson.data as ValidationError[])
          .map((err) => `${err.path?.join(".")}: ${err.message}`)
          .join(", ");
        throw new Error(`Error de validación: ${validationErrors}`);
      }
      throw new Error(JSON.stringify(errorJson));
    } catch (parseError) {
      if (
        parseError instanceof Error &&
        parseError.message.startsWith("Error de validación")
      ) {
        throw parseError;
      }
      throw new Error(text || `Error ${res.status}`);
    }
  }

  const response: CreateAssignmentResponse = await res.json();

  const isSuccessMessage =
    response.message?.toLowerCase().includes("correctamente") ||
    response.message?.toLowerCase().includes("exitosamente") ||
    response.message?.toLowerCase().includes("creada");

  if (!response.success && !isSuccessMessage) {
    throw new Error(response.message || "Error al crear asignación");
  }
  if (!response.success && isSuccessMessage) {
    console.warn(
      "⚠️ Backend respondió con success: false pero mensaje de éxito. Corrigiendo...",
    );
    response.success = true;
  }

  return response;
}

export function useCreateAssignment() {
  const queryClient = useQueryClient();

  return useMutation<CreateAssignmentResponse, Error, CreateAssignmentData>({
    mutationFn: createAssignment,
    onSuccess: () => {
      // Invalidar cache de asignaciones si existe
      queryClient.invalidateQueries({ queryKey: ["assignments"] });
    },
  });
}
