import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { UseQueryOptions } from "@tanstack/react-query";

export interface SyllabusReview {
  id: string;
  courseName: string;
  courseCode: string;
  teacherName: string;
  docenteId: number;
  syllabusId: number;
  status: "ANALIZANDO" | "VALIDADO" | "DESAPROBADO" | "ASIGNADO";
  submittedDate: string;
}

export interface ReviewData {
  [fieldId: string]: {
    status: "approved" | "rejected" | null;
    comment: string;
  };
}

export interface ApproveRejectRequest {
  syllabusId: number;
  estado: "VALIDADO" | "DESAPROBADO";
  reviewData: ReviewData;
}

// Función para mapear fieldIds a números de sección
function mapFieldToSections(fieldId: string): number[] {
  const mapping: Record<string, number[]> = {
    "step-1": [1],
    "step-2": [2],
    "step-3": [3],
    "step-4": [4],
    "step-5": [5, 6], // Sección 5 incluye subsección 6
    "step-6": [7],
    "step-7": [8],
  };
  return mapping[fieldId] || [0];
}

class SyllabusReviewManager {
  async fetchAllInReview(baseUrl?: string): Promise<SyllabusReview[]> {
    const apiBase =
      baseUrl ??
      import.meta.env.VITE_API_BASE_URL ??
      "http://localhost:7071/api";
    const url = `${apiBase}/syllabus/revision`;
    const res = await fetch(url);
    if (!res.ok) {
      const t = await res.text();
      throw new Error(`${res.status} ${t}`);
    }
    const json = await res.json();
    const rawData = Array.isArray(json) ? json : (json?.data ?? []);

    console.log("🔍 [API] Raw backend data count:", rawData.length);

    // Buscar todos los DESAPROBADO para ver duplicados
    const desaprobados = rawData.filter(
      (item: Record<string, unknown>) => item.estadoRevision === "DESAPROBADO",
    );
    console.log("🔍 [API] DESAPROBADO items count:", desaprobados.length);
    console.log(
      "🔍 [API] DESAPROBADO items detail:",
      JSON.stringify(
        desaprobados.map((item: Record<string, unknown>) => ({
          id: item.id,
          silaboId: item.silaboId,
          courseName: item.cursoNombre,
          estadoRevision: item.estadoRevision,
          asignadoADocenteId: item.asignadoADocenteId,
        })),
        null,
        2,
      ),
    );

    // Mapear datos del backend al formato esperado de forma defensiva.
    return rawData.map((item: Record<string, unknown>) => {
      // Intentar localizar un id útil en varios campos posibles
      const possibleId =
        item.id ??
        item._id ??
        item.syllabusId ??
        item.silaboId ??
        item.silaboID ??
        item.idRevision ??
        "";

      const idStr = String(possibleId ?? "");

      // Para syllabusId preferimos campos numéricos conocidos
      const possibleSyllabusId =
        item.syllabusId ??
        item.silaboId ??
        item.id ??
        item.silaboID ??
        item.idSyllabus ??
        0;

      const syllabusIdNum = Number(possibleSyllabusId) || 0;

      const mapped = {
        id: idStr,
        courseName:
          (item.cursoNombre as string) ||
          (item.courseName as string) ||
          "Sin nombre",
        courseCode:
          (item.cursoCodigo as string) || (item.courseCode as string) || "N/A",
        teacherName:
          (item.nombreDocente as string) ||
          (item.teacherName as string) ||
          "No asignado",
        docenteId: Number(item.asignadoADocenteId ?? item.docenteId ?? 0) || 0,
        syllabusId: syllabusIdNum, // número identificador del sílabo
        // Mapear estados del backend a estados del frontend
        status: (() => {
          const backendStatus = String(item.estadoRevision);
          // Mapeo: backend → frontend
          if (backendStatus === "APROBADO") return "VALIDADO";
          if (backendStatus === "DESAPROBADO") return "DESAPROBADO";
          if (backendStatus === "ASIGNADO") return "ASIGNADO";
          if (backendStatus === "ANALIZANDO") return "ANALIZANDO";
          // Fallback por defecto
          return "ANALIZANDO";
        })() as SyllabusReview["status"],
        submittedDate: (item.createdAt as string) || new Date().toISOString(),
      } as SyllabusReview;

      return mapped;
    }) as SyllabusReview[];
  }

  async fetchReviewData(
    syllabusId: number,
    baseUrl?: string,
  ): Promise<ReviewData | null> {
    const apiBase =
      baseUrl ??
      import.meta.env.VITE_API_BASE_URL ??
      "http://localhost:7071/api";
    const url = `${apiBase}/syllabus/${syllabusId}/revision`;
    const res = await fetch(url);
    if (res.status === 404) {
      // No hay datos de revisión guardados
      return null;
    }
    if (!res.ok) {
      const t = await res.text();
      throw new Error(`${res.status} ${t}`);
    }
    return (await res.json()) as ReviewData;
  }

  async saveReviewData(
    syllabusId: number,
    reviewData: ReviewData,
    baseUrl?: string,
  ): Promise<void> {
    const apiBase =
      baseUrl ??
      import.meta.env.VITE_API_BASE_URL ??
      "http://localhost:7071/api";
    const url = `${apiBase}/syllabus/${syllabusId}/revision`;
    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(reviewData),
    });
    if (!res.ok) {
      const t = await res.text();
      throw new Error(`${res.status} ${t}`);
    }
  }

  async approveSyllabus(
    data: ApproveRejectRequest,
    baseUrl?: string,
  ): Promise<void> {
    const apiBase =
      baseUrl ??
      import.meta.env.VITE_API_BASE_URL ??
      "http://localhost:7071/api";

    // Determinar el endpoint según el estado
    const isDisapprove = data.estado === "DESAPROBADO";
    const endpoint = isDisapprove ? "desaprobar" : "aprobar";
    const url = `${apiBase}/syllabus/${data.syllabusId}/${endpoint}`;

    let body: Record<string, unknown>;

    if (isDisapprove) {
      // Para desaprobar, construir el payload con observaciones
      const observacionesArray: Array<{
        numeroSeccion: number;
        nombreSeccion: string;
        comentario: string;
        estado?: string; // Opcional porque el backend usa "RECHAZADO" automáticamente
      }> = [];

      Object.entries(data.reviewData || {}).forEach(([fieldId, value]) => {
        if (value.status === "rejected" && value.comment?.trim()) {
          const sections = mapFieldToSections(fieldId);
          sections.forEach((numeroSeccion) => {
            observacionesArray.push({
              numeroSeccion,
              nombreSeccion: fieldId,
              comentario: value.comment || "",
              // No enviamos estado - el backend usa "RECHAZADO" automáticamente
            });
          });
        }
      });

      body = {
        silaboId: data.syllabusId,
        observaciones: observacionesArray,
      };
    } else {
      // Para aprobar, enviar el payload original
      body = {
        estado: data.estado,
        reviewData: data.reviewData,
      };
    }

    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const t = await res.text();
      throw new Error(`${res.status} ${t}`);
    }
  }
}

export const syllabusReviewManager = new SyllabusReviewManager();

// Hook para obtener todos los sílabos en revisión
export const useSyllabusInReview = (
  options?: UseQueryOptions<SyllabusReview[], Error>,
) => {
  return useQuery<SyllabusReview[], Error>({
    queryKey: ["syllabus", "in-review"],
    queryFn: () => syllabusReviewManager.fetchAllInReview(),
    staleTime: 0, // Considerar datos obsoletos inmediatamente para forzar refetch
    refetchOnMount: "always", // Siempre refetch al montar el componente
    refetchOnWindowFocus: true, // Refetch cuando vuelves a la ventana
    refetchInterval: false, // No hacer polling automático
    retry: false, // No reintentar en caso de error (como 403)
    ...options,
  });
};

// Hook para obtener datos de revisión de un sílabo específico
export const useReviewData = (
  syllabusId: number | null | undefined,
  options?: UseQueryOptions<ReviewData | null, Error>,
) => {
  return useQuery<ReviewData | null, Error>({
    queryKey: ["syllabus", syllabusId, "review-data"],
    queryFn: () => syllabusReviewManager.fetchReviewData(syllabusId as number),
    enabled: syllabusId !== null && syllabusId !== undefined,
    retry: false,
    staleTime: 10_000, // 10 segundos
    ...options,
  });
};

// Hook para guardar datos de revisión
export const useSaveReviewData = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      syllabusId,
      reviewData,
    }: {
      syllabusId: number;
      reviewData: ReviewData;
    }) => syllabusReviewManager.saveReviewData(syllabusId, reviewData),
    onSuccess: (_data, variables) => {
      // Invalidar la caché de review data para el sílabo específico
      queryClient.invalidateQueries({
        queryKey: ["syllabus", variables.syllabusId, "review-data"],
      });
    },
  });
};

// Hook para aprobar o desaprobar sílabo
export const useApproveSyllabus = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: ApproveRejectRequest) =>
      syllabusReviewManager.approveSyllabus(data),
    onSuccess: async () => {
      // 1. Cancelar cualquier refetch en progreso para evitar sobrescribir con datos viejos
      await queryClient.cancelQueries({
        queryKey: ["syllabus", "in-review"],
      });

      // 2. Eliminar los datos del caché para forzar fetch fresco
      queryClient.removeQueries({
        queryKey: ["syllabus", "in-review"],
      });

      // 3. Forzar refetch inmediato de los datos actualizados con tipo 'all'
      // para asegurar que todas las instancias se actualicen
      await queryClient.refetchQueries({
        queryKey: ["syllabus", "in-review"],
        type: "all", // Refetch todas las queries, activas e inactivas
      });
    },
  });
};
