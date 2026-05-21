import { useQuery } from "@tanstack/react-query";

export interface SyllabusSection {
  seccion: number;
}

// Hook para obtener las secciones disponibles de un sílabo en revisión
export const useSyllabusSections = (
  syllabusId: number | null,
  docenteId?: number | null,
) => {
  return useQuery<SyllabusSection[]>({
    queryKey: ["syllabus-sections", syllabusId, docenteId],
    queryFn: async () => {
      if (!syllabusId) {
        throw new Error("syllabusId es requerido");
      }

      // Endpoint: /api/syllabus/revision/{silaboId}?docenteId={docenteId}
      const base = "/api/syllabus/revision";
      const url = docenteId
        ? `${base}/${encodeURIComponent(syllabusId)}?docenteId=${encodeURIComponent(
            String(docenteId),
          )}`
        : `${base}/${encodeURIComponent(syllabusId)}`;

      const response = await fetch(url);

      if (!response.ok) {
        throw new Error("Error al obtener las secciones del sílabo");
      }

      const result = await response.json();

      // respuesta del endpoint

      // Validar que la respuesta tenga la estructura esperada
      if (!result || typeof result !== "object") {
        console.warn("Formato de respuesta inesperado:", result);
        return [];
      }

      // Verificar si la petición fue exitosa
      if (!result.success) {
        throw new Error(result.message || "Error al obtener las secciones");
      }

      // Verificar que exista data.permissions y sea un array
      if (
        result.data &&
        result.data.permissions &&
        Array.isArray(result.data.permissions)
      ) {
        return result.data.permissions;
      }

      console.warn("No se encontraron permisos en la respuesta:", result);
      return [];
    },
    enabled: !!syllabusId && syllabusId > 0,
    staleTime: 1000 * 60 * 5, // 5 minutos
  });
};
