import { useMutation, useQueryClient } from "@tanstack/react-query";

const API_BASE =
  import.meta.env.VITE_API_BASE_URL ?? "http://localhost:7071/api";

interface SubmitToAnalysisParams {
  syllabusId: number;
}

interface SubmitToAnalysisResponse {
  message: string;
  syllabusId: number;
  estado: string;
}

/**
 * Hook para enviar el sílabo a revisión (cambiar estado a ANALIZANDO)
 * Intenta múltiples endpoints en orden:
 * 1. PUT /api/syllabus/{id}/analizando
 * 2. PUT /api/syllabus/{id}/estado (con body: { estado: "ANALIZANDO" })
 * 3. PUT /api/syllabus/{id} (con body: { estado: "ANALIZANDO" })
 */
export const useSubmitToAnalysis = () => {
  const queryClient = useQueryClient();

  return useMutation<SubmitToAnalysisResponse, Error, SubmitToAnalysisParams>({
    mutationFn: async ({ syllabusId }) => {
      const endpoints = [
        {
          url: `${API_BASE}/syllabus/${syllabusId}/analizando`,
          body: undefined,
        },
        {
          url: `${API_BASE}/syllabus/${syllabusId}/estado`,
          body: JSON.stringify({ estado: "ANALIZANDO" }),
        },
        {
          url: `${API_BASE}/syllabus/${syllabusId}`,
          body: JSON.stringify({ estado: "ANALIZANDO" }),
        },
      ];

      let lastError: Error | null = null;

      // Intentar cada endpoint
      for (const endpoint of endpoints) {
        try {
          console.log(`🔄 Intentando: ${endpoint.url}`);

          const response = await fetch(endpoint.url, {
            method: "PUT",
            headers: {
              "Content-Type": "application/json",
            },
            body: endpoint.body,
          });

          if (response.ok) {
            console.log(`✅ Éxito con: ${endpoint.url}`);
            return response.json();
          }

          // Si es 404, intentar siguiente endpoint
          if (response.status === 404) {
            console.log(`⚠️ 404 en: ${endpoint.url}, intentando siguiente...`);
            continue;
          }

          // Si es otro error, lanzar excepción
          const text = await response.text();
          let errorMessage = `Error ${response.status}`;

          try {
            const json = JSON.parse(text);
            errorMessage = json.message || json.error || errorMessage;
          } catch {
            errorMessage = text || errorMessage;
          }

          throw new Error(errorMessage);
        } catch (error) {
          lastError = error instanceof Error ? error : new Error(String(error));

          // Si no es error de red o 404, no intentar siguiente
          const errorMsg =
            error instanceof Error ? error.message : String(error);
          if (!errorMsg.includes("404")) {
            throw error;
          }
        }
      }

      // Si llegamos aquí, ningún endpoint funcionó
      throw (
        lastError ||
        new Error(
          "No se pudo enviar el sílabo a revisión. Endpoint no disponible.",
        )
      );
    },
    onSuccess: (_, variables) => {
      // Invalidar queries relacionadas con el sílabo
      queryClient.invalidateQueries({
        queryKey: ["syllabus", variables.syllabusId],
      });

      // Invalidar lista de sílabos en revisión
      queryClient.invalidateQueries({
        queryKey: ["syllabusInReview"],
      });
    },
  });
};
