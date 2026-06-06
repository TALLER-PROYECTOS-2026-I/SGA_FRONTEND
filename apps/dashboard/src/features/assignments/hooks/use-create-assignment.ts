import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  authFetch,
  getApiBaseUrl,
  readApiErrorMessage,
} from "../../../common/utils/auth-fetch";

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
  const url = `${getApiBaseUrl()}/assignments/`;

  const res = await authFetch(url, {
    method: "POST",
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
    response.success = true;
  }

  return response;
}

async function unassignTeacher(
  syllabusId: number,
): Promise<CreateAssignmentResponse> {
  const res = await authFetch(`${getApiBaseUrl()}/assignments/${syllabusId}`, {
    method: "DELETE",
  });

  if (!res.ok) {
    throw new Error(
      await readApiErrorMessage(res, "No se pudo desasignar el docente."),
    );
  }

  return res.json();
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

export function useUnassignTeacher() {
  const queryClient = useQueryClient();

  return useMutation<CreateAssignmentResponse, Error, number>({
    mutationFn: unassignTeacher,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["assignments"] });
    },
  });
}
