import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { authFetch } from "../../../common/utils/auth-fetch";

const getApiBase = (baseUrl?: string): string => {
  return (
    baseUrl ??
    import.meta.env.VITE_API_BASE_URL ??
    "http://localhost:7071/api"
  ).replace(/\/+$/, "");
};

export type SemanaProgramacion = {
  id?: number | string;
  semana: number;
  contenidosConceptuales: string;
  contenidosProcedimentales: string;
  actividadesAprendizaje: string;
  horasLectivasTeoria: number;
  horasLectivasPractica: number;
  horasNoLectivasTeoria: number;
  horasNoLectivasPractica: number;
  esEvento?: boolean;
  eventoDescripcion?: string;
};

export type SemanaProgramacionApi = {
  semana: number;
  contenidosConceptuales: string;
  contenidosProcedimentales: string;
  actividadesAprendizaje: string;
  horasLectivasTeoria: number;
  horasLectivasPractica: number;
  horasNoLectivasTeoria: number;
  horasNoLectivasPractica: number;
};

export type UnidadProgramacion = {
  id?: number | string;
  numero: number;
  titulo: string;
  capacidadesText: string;
  semanaInicio?: number | null;
  semanaFin?: number | null;
  semanas: SemanaProgramacion[];
};

export {
  getProgramacionStatus,
  isSemanaProgramacionCompleta,
  type ProgramacionStatus,
} from "../utils/programacion-status";

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
  semanas?: SemanaProgramacionApi[];
}

export type UpdateProgramacionBody = CreateProgramacionBody;

export interface ProgramacionResponse {
  id?: string | number;
  silaboId?: number;
  numero?: number;
  titulo?: string;
  capacidadesText?: string;
  semanaInicio?: number | null;
  semanaFin?: number | null;
  contenidosConceptuales?: string | null;
  contenidosProcedimentales?: string | null;
  actividadesAprendizaje?: string | null;
  horasLectivasTeoria?: number | null;
  horasLectivasPractica?: number | null;
  horasNoLectivasTeoria?: number | null;
  horasNoLectivasPractica?: number | null;
  semanas?: SemanaProgramacion[];
  [key: string]: unknown;
}

async function buildError(res: Response): Promise<Error> {
  const text = await res.text();

  try {
    const body = JSON.parse(text);

    return new Error(
      body?.message ||
        body?.error ||
        JSON.stringify(body) ||
        `Error ${res.status}`,
    );
  } catch {
    return new Error(text || `Error ${res.status}`);
  }
}

export const useGetProgramacion = (syllabusId: string | null) => {
  return useQuery<ProgramacionResponse[]>({
    queryKey: ["syllabus", syllabusId, "unidades"],
    queryFn: async () => {
      const apiBase = getApiBase();

      const res = await authFetch(
        `${apiBase}/syllabus/${encodeURIComponent(syllabusId!)}/unidades`,
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
    staleTime: 0,
    gcTime: 0,
    refetchOnMount: "always",
    refetchOnWindowFocus: false,
    retry: false,
    throwOnError: false,
  });
};

export async function postProgramacionUnit(
  payload: CreateProgramacionBody,
): Promise<ProgramacionResponse> {
  const apiBase = getApiBase();
  const silaboId = Number(payload.silaboId);

  const cleanPayload: CreateProgramacionBody = {
    ...payload,
    silaboId,
    numero: Number(payload.numero),
    titulo: payload.titulo.trim(),
    capacidadesText: payload.capacidadesText || "",
    semanaInicio: payload.semanaInicio,
    semanaFin: payload.semanaFin,
    contenidosConceptuales: payload.contenidosConceptuales || "",
    contenidosProcedimentales: payload.contenidosProcedimentales || "",
    actividadesAprendizaje: payload.actividadesAprendizaje || "",
    horasLectivasTeoria: Number(payload.horasLectivasTeoria ?? 0),
    horasLectivasPractica: Number(payload.horasLectivasPractica ?? 0),
    horasNoLectivasTeoria: Number(payload.horasNoLectivasTeoria ?? 0),
    horasNoLectivasPractica: Number(payload.horasNoLectivasPractica ?? 0),
    semanas: payload.semanas ?? [],
  };

  const res = await authFetch(`${apiBase}/syllabus/${silaboId}/unidades`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(cleanPayload),
  });

  if (!res.ok) {
    throw await buildError(res);
  }

  return (await res.json()) as ProgramacionResponse;
}

export const useCreateProgramacion = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: postProgramacionUnit,
    onSuccess: async (_, variables) => {
      const key = String(variables.silaboId);

      await queryClient.invalidateQueries({
        queryKey: ["syllabus", key, "unidades"],
      });

      await queryClient.refetchQueries({
        queryKey: ["syllabus", key, "unidades"],
        type: "all",
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
      payload: UpdateProgramacionBody;
    }) => {
      const apiBase = getApiBase();
      const syllabusId = Number(payload.silaboId);

      if (!syllabusId || Number.isNaN(syllabusId)) {
        throw new Error("ID del sílabo inválido");
      }

      const cleanPayload: UpdateProgramacionBody = {
        ...payload,
        silaboId: syllabusId,
        numero: Number(payload.numero),
        titulo: String(payload.titulo).trim(),
        capacidadesText: String(payload.capacidadesText || ""),
        semanas: payload.semanas ?? [],
      };

      const res = await authFetch(
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
    onSuccess: async (_, variables) => {
      if (variables.payload.silaboId) {
        const key = String(variables.payload.silaboId);

        await queryClient.invalidateQueries({
          queryKey: ["syllabus", key, "unidades"],
        });

        await queryClient.refetchQueries({
          queryKey: ["syllabus", key, "unidades"],
          type: "all",
        });
      }
    },
  });
};

export const useDeleteProgramacion = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      silaboId,
      unidadId,
    }: {
      silaboId: number;
      unidadId: string | number;
    }) => {
      const apiBase = getApiBase();

      const res = await authFetch(
        `${apiBase}/syllabus/${silaboId}/unidades/${encodeURIComponent(String(unidadId))}`,
        {
          method: "DELETE",
        },
      );

      if (!res.ok) {
        throw await buildError(res);
      }
    },
    onSuccess: async (_, variables) => {
      const key = String(variables.silaboId);

      await queryClient.invalidateQueries({
        queryKey: ["syllabus", key, "unidades"],
      });
    },
  });
};
