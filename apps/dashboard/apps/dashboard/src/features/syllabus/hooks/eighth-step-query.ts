import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

export interface StudentOutcome {
  id?: number;
  code?: string;
  description?: string;
  level?: "K" | "R" | "";
  codigo?: string;
  descripcion?: string;
  nivel?: "K" | "R" | "";
  aporteValor?: "K" | "R" | "";
  resultadoProgramaCodigo?: string;
  resultadoProgramaDescripcion?: string;
  [key: string]: unknown;
}

export interface ResultadosResponse {
  items?: StudentOutcome[];
  resultados?: StudentOutcome[];
  outcomes?: StudentOutcome[];
  [key: string]: unknown;
}

export interface ResultadosData {
  items?: StudentOutcome[];
  resultados?: StudentOutcome[];
  outcomes?: StudentOutcome[];
  [key: string]: unknown;
}

interface ApiErrorResponse {
  message?: string;
  error?: string;
  [key: string]: unknown;
}

class EighthStepManager {
  getApiBase(baseUrl?: string): string {
    return (
      baseUrl ??
      import.meta.env.VITE_API_BASE_URL ??
      "http://localhost:7071/api"
    );
  }

  private getContributionUrl(syllabusId: number, baseUrl?: string): string {
    const apiBase = this.getApiBase(baseUrl);
    return `${apiBase}/syllabus/${syllabusId}/contribution`;
  }

  private getItems(data: ResultadosData): StudentOutcome[] {
    return data.items ?? data.resultados ?? data.outcomes ?? [];
  }

  private normalizeResponse(response: any): ResultadosResponse {
    if (response?.data) {
      const data = response.data;

      if (Array.isArray(data)) return { items: data };
      if (data.items) return data;
      if (data.resultados) return { items: data.resultados };
      if (data.outcomes) return { items: data.outcomes };

      return { items: [] };
    }

    if (Array.isArray(response)) return { items: response };
    if (response?.items) return response;
    if (response?.resultados) return { items: response.resultados };
    if (response?.outcomes) return { items: response.outcomes };

    return { items: [] };
  }

  private async parseError(res: Response): Promise<Error> {
    const text = await res.text();

    try {
      const json = JSON.parse(text) as ApiErrorResponse;
      return new Error(
        json.message || json.error || text || `Error ${res.status}`,
      );
    } catch {
      return new Error(text || `Error ${res.status}`);
    }
  }

  async fetchResultados(
    syllabusId: number,
    baseUrl?: string,
  ): Promise<ResultadosResponse> {
    const url = this.getContributionUrl(syllabusId, baseUrl);

    const res = await fetch(url);

    if (res.status === 404) {
      return { items: [] };
    }

    if (!res.ok) {
      throw await this.parseError(res);
    }

    const response = await res.json();
    return this.normalizeResponse(response);
  }

  async createResultados(
    syllabusId: number,
    data: ResultadosData,
    baseUrl?: string,
  ): Promise<{ message: string }> {
    const url = this.getContributionUrl(syllabusId, baseUrl);
    const items = this.getItems(data);

    for (const [index, item] of items.entries()) {
      const rawNivel = item.nivel ?? item.level ?? item.aporteValor ?? "";
      const nivel = rawNivel === "K" || rawNivel === "R" ? rawNivel : "";

      const rawCodigo =
        item.resultadoProgramaCodigo ??
        item.codigo ??
        item.code ??
        "";

      const codigo =
        rawCodigo && rawCodigo !== "K" && rawCodigo !== "R"
          ? String(rawCodigo)
          : `RP${index + 1}`;

      const descripcion =
        item.resultadoProgramaDescripcion ??
        item.descripcion ??
        item.description ??
        "";

      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          syllabusId,
          resultadoProgramaCodigo: codigo,
          resultadoProgramaDescripcion: descripcion,
          aporteValor: nivel,
        }),
      });

      if (!res.ok) {
        throw await this.parseError(res);
      }
    }

    return { message: "Aportes guardados correctamente" };
  }

  async updateResultados(
    syllabusId: number,
    data: ResultadosData,
    baseUrl?: string,
  ): Promise<{ message: string }> {
    return this.createResultados(syllabusId, data, baseUrl);
  }
}

const eighthStepManager = new EighthStepManager();

export const useResultados = (syllabusId: number | null) => {
  const isValidId = syllabusId !== null && syllabusId > 0;

  return useQuery<ResultadosResponse, Error>({
    queryKey: ["syllabus", syllabusId, "contribution"],
    queryFn: () => eighthStepManager.fetchResultados(syllabusId!),
    enabled: isValidId,
    retry: false,
    throwOnError: false,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    refetchOnReconnect: false,
  });
};

export const useSaveResultados = () => {
  const queryClient = useQueryClient();

  return useMutation<
    { message: string },
    Error,
    { syllabusId: number; data: ResultadosData; isCreating: boolean }
  >({
    mutationFn: ({ syllabusId, data }) => {
      return eighthStepManager.createResultados(syllabusId, data);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["syllabus", variables.syllabusId, "contribution"],
      });
    },
  });
};