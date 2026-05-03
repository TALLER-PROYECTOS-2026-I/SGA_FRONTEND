import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

const getApiBase = (baseUrl?: string): string => {
  return (
    baseUrl ?? import.meta.env.VITE_API_BASE_URL ?? "http://localhost:7071/api"
  );
};

export interface CreateProgramacionBody {
  silaboId: number;
  numero: number;
  titulo: string;
  capacidadesText?: string;
  semanaInicio?: number;
  semanaFin?: number;
  contenidosConceptuales?: string;
  contenidosProcedimentales?: string;
  actividadesAprendizaje?: string;
  horasLectivasTeoria?: number;
  horasLectivasPractica?: number;
  horasNoLectivasTeoria?: number;
  horasNoLectivasPractica?: number;
}

export interface UpdateProgramacionBody {
  silaboId?: number;
  numero?: number;
  titulo?: string;
  capacidadesText?: string;
  semanaInicio?: number;
  semanaFin?: number;
  contenidosConceptuales?: string;
  contenidosProcedimentales?: string;
  actividadesAprendizaje?: string;
  horasLectivasTeoria?: number;
  horasLectivasPractica?: number;
  horasNoLectivasTeoria?: number;
  horasNoLectivasPractica?: number;
  [key: string]: unknown;
}

export interface ProgramacionResponse {
  id?: string | number;
  silaboId?: number;
  asignaturaId?: string | number;
  [key: string]: unknown;
}

async function buildError(res: Response): Promise<Error> {
  const text = await res.text();

  try {
    const body = JSON.parse(text);
    console.error("ERROR BACKEND:", body);

    return new Error(
      body?.message ||
        body?.error ||
        JSON.stringify(body) ||
        `Error ${res.status}`,
    );
  } catch {
    console.error("ERROR BACKEND:", text);
    return new Error(text || `Error ${res.status}`);
  }
}

export const useGetProgramacion = (syllabusId: string) => {
  return useQuery<ProgramacionResponse[]>({
    queryKey: ["syllabus", syllabusId, "unidades"],
    queryFn: async () => {
      const apiBase = getApiBase();

      const res = await fetch(
        `${apiBase}/syllabus/${encodeURIComponent(syllabusId)}/unidades`,
      );

      if (res.status === 404) {
        return [];
      }

      if (!res.ok) {
        throw await buildError(res);
      }

      const response = await res.json();

      if (response.data) {
        return Array.isArray(response.data) ? response.data : [];
      }

      return Array.isArray(response) ? response : [];
    },
    enabled: !!syllabusId && syllabusId !== "0",
    staleTime: 1000 * 60 * 5,
    retry: false,
    throwOnError: false,
  });
};

export const useCreateProgramacion = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: CreateProgramacionBody) => {
      const apiBase = getApiBase();

      const cleanPayload: CreateProgramacionBody = {
        silaboId: Number(payload.silaboId),
        numero: Number(payload.numero),
        titulo: payload.titulo || `Unidad ${payload.numero}`,
        capacidadesText: payload.capacidadesText || "",
        semanaInicio: Number(payload.semanaInicio ?? 1),
        semanaFin: Number(payload.semanaFin ?? 16),
        contenidosConceptuales: payload.contenidosConceptuales || "",
        contenidosProcedimentales: payload.contenidosProcedimentales || "",
        actividadesAprendizaje: payload.actividadesAprendizaje || "",
        horasLectivasTeoria: Number(payload.horasLectivasTeoria ?? 0),
        horasLectivasPractica: Number(payload.horasLectivasPractica ?? 0),
        horasNoLectivasTeoria: Number(payload.horasNoLectivasTeoria ?? 0),
        horasNoLectivasPractica: Number(payload.horasNoLectivasPractica ?? 0),
      };

      console.log("POST unidad payload:", cleanPayload);

      const res = await fetch(
        `${apiBase}/syllabus/${cleanPayload.silaboId}/unidades`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(cleanPayload),
        },
      );

      if (!res.ok) {
        throw await buildError(res);
      }

      return (await res.json()) as ProgramacionResponse;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["syllabus", String(variables.silaboId), "unidades"],
      });
    },
  });
};

export const useUpdateProgramacion = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      payload,
    }: {
      id: string;
      payload: Partial<UpdateProgramacionBody>;
    }) => {
      const apiBase = getApiBase();

      const syllabusId = Number(payload.silaboId);

      if (!syllabusId || Number.isNaN(syllabusId)) {
        throw new Error("ID del sílabo inválido");
      }

      const cleanPayload: UpdateProgramacionBody = {
        silaboId: syllabusId,
        numero: Number(payload.numero ?? 1),
        titulo: String(payload.titulo || `Unidad ${payload.numero ?? 1}`),
        capacidadesText: String(payload.capacidadesText || ""),
        semanaInicio: Number(payload.semanaInicio ?? 1),
        semanaFin: Number(payload.semanaFin ?? 16),
        contenidosConceptuales: String(payload.contenidosConceptuales || ""),
        contenidosProcedimentales: String(
          payload.contenidosProcedimentales || "",
        ),
        actividadesAprendizaje: String(payload.actividadesAprendizaje || ""),
        horasLectivasTeoria: Number(payload.horasLectivasTeoria ?? 0),
        horasLectivasPractica: Number(payload.horasLectivasPractica ?? 0),
        horasNoLectivasTeoria: Number(payload.horasNoLectivasTeoria ?? 0),
        horasNoLectivasPractica: Number(payload.horasNoLectivasPractica ?? 0),
      };

      console.log("PUT unidad id:", id);
      console.log("PUT unidad payload:", cleanPayload);

      const res = await fetch(
        `${apiBase}/syllabus/${syllabusId}/unidades/${encodeURIComponent(id)}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(cleanPayload),
        },
      );

      if (!res.ok) {
        throw await buildError(res);
      }

      return (await res.json()) as ProgramacionResponse;
    },
    onSuccess: (_, variables) => {
      if (variables.payload.silaboId) {
        queryClient.invalidateQueries({
          queryKey: [
            "syllabus",
            String(variables.payload.silaboId),
            "unidades",
          ],
        });
      }
    },
  });
};
