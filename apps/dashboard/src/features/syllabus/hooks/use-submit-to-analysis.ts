import { useMutation, useQueryClient } from "@tanstack/react-query";
import { authFetch } from "../../../common/utils/auth-fetch";

const API_BASE =
  import.meta.env.VITE_API_BASE_URL ?? "http://localhost:7071/api";

interface SubmitToAnalysisParams {
  syllabusId: number;
}

interface SubmitToAnalysisResponse {
  success?: boolean;
  message: string;
  data?: {
    ok: boolean;
    message: string;
    estadoAnterior?: string;
    estadoNuevo?: string;
  };
  ok?: boolean;
  estadoAnterior?: string;
  estadoNuevo?: string;
}

export const useSubmitToAnalysis = () => {
  const queryClient = useQueryClient();

  return useMutation<SubmitToAnalysisResponse, Error, SubmitToAnalysisParams>({
    mutationFn: async ({ syllabusId }) => {
      const normalizedId = Number(syllabusId);

      if (!normalizedId || Number.isNaN(normalizedId)) {
        throw new Error("ID del sílabo no válido");
      }

      const response = await authFetch(
        `${API_BASE}/syllabus/${normalizedId}/analizando`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
        },
      );

      const text = await response.text();

      let payload: SubmitToAnalysisResponse | null = null;

      try {
        payload = text ? JSON.parse(text) : null;
      } catch {
        payload = null;
      }

      if (!response.ok) {
        const errorMessage =
          payload?.message ||
          payload?.data?.message ||
          text ||
          `Error ${response.status} al enviar el sílabo a revisión`;

        throw new Error(errorMessage);
      }

      return (
        payload ?? {
          success: true,
          message: "Sílabo enviado a revisión correctamente",
        }
      );
    },

    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["syllabus", variables.syllabusId],
      });

      queryClient.invalidateQueries({
        queryKey: ["syllabusInReview"],
      });

      queryClient.invalidateQueries({
        queryKey: ["syllabusReview"],
      });

      queryClient.invalidateQueries({
        queryKey: ["my-syllabus"],
      });

      queryClient.invalidateQueries({
        queryKey: ["permissions"],
      });
    },
  });
};
