import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { authFetch } from "../../../common/utils/auth-fetch";

export interface MethodologicalStrategy {
  titulo: string;
  descripcion: string;
}

export interface DidacticResource {
  titulo: string;
  descripcion: string;
}

interface MethodologicalStrategiesResponse {
  message: string;
  data: {
    items: MethodologicalStrategy[];
  };
}

interface DidacticResourcesResponse {
  message: string;
  data: {
    items: DidacticResource[];
  };
}

const API_BASE = (
  import.meta.env.VITE_API_BASE_URL ?? "http://localhost:7071/api"
).replace(/\/+$/, "");

// ==================== GET APIs ====================

async function fetchMethodologicalStrategies(
  syllabusId: string,
): Promise<MethodologicalStrategy[]> {
  const url = `${API_BASE}/syllabus/${syllabusId}/estrategias_metodologicas`;
  const res = await authFetch(url, {
    method: "GET",
    credentials: "include",
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Error ${res.status}: ${text}`);
  }

  const response: MethodologicalStrategiesResponse = await res.json();
  return response.data?.items || [];
}

async function fetchDidacticResources(
  syllabusId: string,
): Promise<DidacticResource[]> {
  const url = `${API_BASE}/syllabus/${syllabusId}/recursos_didacticos_notas`;
  const res = await authFetch(url, {
    method: "GET",
    credentials: "include",
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Error ${res.status}: ${text}`);
  }

  const response: DidacticResourcesResponse = await res.json();
  return response.data?.items || [];
}

// ==================== PUT APIs ====================

export async function updateMethodologicalStrategiesForSyllabus(
  syllabusId: string,
  estrategias: MethodologicalStrategy[],
): Promise<void> {
  const url = `${API_BASE}/syllabus/${syllabusId}/estrategias_metodologicas`;
  const res = await authFetch(url, {
    method: "PUT",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ estrategias_metodologicas: estrategias }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Error ${res.status}: ${text}`);
  }
}

export async function updateDidacticResourcesForSyllabus(
  syllabusId: string,
  recursos: DidacticResource[],
): Promise<void> {
  const url = `${API_BASE}/syllabus/${syllabusId}/recursos_didacticos_notas`;
  const res = await authFetch(url, {
    method: "PUT",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ recursos_didacticos_notas: recursos }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Error ${res.status}: ${text}`);
  }
}

// ==================== React Query Hooks ====================

export function useMethodologicalStrategiesQuery(syllabusId: string | null) {
  return useQuery({
    queryKey: ["methodological-strategies", syllabusId],
    queryFn: () => fetchMethodologicalStrategies(syllabusId!),
    enabled: !!syllabusId,
    staleTime: 0,
    gcTime: 0,
    refetchOnMount: "always",
    refetchOnWindowFocus: false,
  });
}

export function useDidacticResourcesQuery(syllabusId: string | null) {
  return useQuery({
    queryKey: ["didactic-resources", syllabusId],
    queryFn: () => fetchDidacticResources(syllabusId!),
    enabled: !!syllabusId,
    staleTime: 0,
    gcTime: 0,
    refetchOnMount: "always",
    refetchOnWindowFocus: false,
  });
}

export function useUpdateMethodologicalStrategies() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      syllabusId,
      estrategias,
    }: {
      syllabusId: string;
      estrategias: MethodologicalStrategy[];
    }) => updateMethodologicalStrategiesForSyllabus(syllabusId, estrategias),
    onSuccess: async (_, variables) => {
      await queryClient.invalidateQueries({
        queryKey: ["methodological-strategies", variables.syllabusId],
      });

      await queryClient.refetchQueries({
        queryKey: ["methodological-strategies", variables.syllabusId],
        type: "all",
      });
    },
  });
}

export function useUpdateDidacticResources() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      syllabusId,
      recursos,
    }: {
      syllabusId: string;
      recursos: DidacticResource[];
    }) => updateDidacticResourcesForSyllabus(syllabusId, recursos),
    onSuccess: async (_, variables) => {
      await queryClient.invalidateQueries({
        queryKey: ["didactic-resources", variables.syllabusId],
      });

      await queryClient.refetchQueries({
        queryKey: ["didactic-resources", variables.syllabusId],
        type: "all",
      });
    },
  });
}
