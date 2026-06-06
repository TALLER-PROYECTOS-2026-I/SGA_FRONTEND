import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { authFetch } from "../../../common/utils/auth-fetch";

export type AporteValor = "K" | "R" | "";

export interface StudentOutcome {
  id?: number;
  code?: string;
  description?: string;
  level?: AporteValor | string;
  codigo?: string;
  descripcion?: string;
  nivel?: AporteValor | string;
  aporteValor?: AporteValor | string;
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

interface NormalizedContribution {
  id?: number;
  resultadoProgramaCodigo: string;
  resultadoProgramaDescripcion: string;
  aporteValor: "K" | "R";
}

class EighthStepManager {
  getApiBase(baseUrl?: string): string {
    const apiBase =
      baseUrl ??
      import.meta.env.VITE_API_BASE_URL ??
      import.meta.env.VITE_API_URL ??
      "http://localhost:7071/api";

    return String(apiBase).replace(/\/$/, "");
  }

  private getContributionUrl(syllabusId: number, baseUrl?: string): string {
    const apiBase = this.getApiBase(baseUrl);
    return `${apiBase}/syllabus/${syllabusId}/contribution`;
  }

  private getContributionCodigoUrl(
    syllabusId: number,
    codigo: string,
    baseUrl?: string,
  ): string {
    const apiBase = this.getApiBase(baseUrl);
    return `${apiBase}/syllabus/${syllabusId}/contribution/${encodeURIComponent(codigo)}`;
  }

  private getItems(data: ResultadosData): StudentOutcome[] {
    return data.items ?? data.resultados ?? data.outcomes ?? [];
  }

  private normalizeResponse(response: unknown): ResultadosResponse {
    const raw = response as {
      data?: unknown;
      items?: StudentOutcome[];
      resultados?: StudentOutcome[];
      outcomes?: StudentOutcome[];
    };

    if (raw?.data) {
      if (Array.isArray(raw.data)) {
        return { items: raw.data as StudentOutcome[] };
      }

      const data = raw.data as {
        items?: StudentOutcome[];
        resultados?: StudentOutcome[];
        outcomes?: StudentOutcome[];
      };

      if (data.items) return { items: data.items };
      if (data.resultados) return { items: data.resultados };
      if (data.outcomes) return { items: data.outcomes };

      return { items: [] };
    }

    if (Array.isArray(response)) {
      return { items: response as StudentOutcome[] };
    }

    if (raw?.items) return { items: raw.items };
    if (raw?.resultados) return { items: raw.resultados };
    if (raw?.outcomes) return { items: raw.outcomes };

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

  private normalizeAporteValor(item: StudentOutcome): "K" | "R" | null {
    const rawValue = String(
      item.aporteValor ?? item.nivel ?? item.level ?? "",
    ).trim();

    if (rawValue === "K") return "K";
    if (rawValue === "R") return "R";

    return null;
  }

  private normalizeCodigo(item: StudentOutcome, index: number): string {
    const rawCodigo =
      item.resultadoProgramaCodigo ?? item.codigo ?? item.code ?? "";

    const codigo = String(rawCodigo).trim();

    if (
      codigo &&
      codigo !== "-" &&
      codigo !== "K" &&
      codigo !== "R" &&
      codigo !== "CLAVE" &&
      codigo !== "RELACIONADO" &&
      codigo !== "NO_APLICA"
    ) {
      return codigo;
    }

    return `RP${index + 1}`;
  }

  private normalizeDescripcion(item: StudentOutcome): string {
    const descripcion =
      item.resultadoProgramaDescripcion ??
      item.descripcion ??
      item.description ??
      "";

    return String(descripcion).trim();
  }

  private normalizeContributionItems(
    data: ResultadosData,
  ): NormalizedContribution[] {
    const items = this.getItems(data);
    const normalizedItems: NormalizedContribution[] = [];

    items.forEach((item, index) => {
      const aporteValor = this.normalizeAporteValor(item);

      // "-" significa no aplica / sin selección.
      // No se manda al backend para evitar "Datos inválidos".
      if (!aporteValor) {
        return;
      }

      const resultadoProgramaCodigo = this.normalizeCodigo(item, index);
      const resultadoProgramaDescripcion = this.normalizeDescripcion(item);

      if (!resultadoProgramaCodigo || !resultadoProgramaDescripcion) {
        return;
      }

      const normalizedItem: NormalizedContribution = {
        resultadoProgramaCodigo,
        resultadoProgramaDescripcion,
        aporteValor,
      };

      if (typeof item.id === "number" && !Number.isNaN(item.id)) {
        normalizedItem.id = item.id;
      }

      normalizedItems.push(normalizedItem);
    });

    return normalizedItems;
  }

  private buildPayload(
    syllabusId: number,
    item: NormalizedContribution,
  ): Record<string, unknown> {
    return {
      syllabusId,
      silaboId: syllabusId,
      resultadoProgramaCodigo: item.resultadoProgramaCodigo,
      resultadoProgramaDescripcion: item.resultadoProgramaDescripcion,
      aporteValor: item.aporteValor,
    };
  }

  async fetchResultados(
    syllabusId: number,
    baseUrl?: string,
  ): Promise<ResultadosResponse> {
    const url = this.getContributionUrl(syllabusId, baseUrl);

    const res = await authFetch(url, {
      headers: {
        "Content-Type": "application/json",
      },
    });

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
    const validItems = this.normalizeContributionItems(data);

    if (validItems.length === 0) {
      return {
        message:
          "No se enviaron aportes porque solo hay valores sin selección.",
      };
    }

    const currentResponse = await this.fetchResultados(syllabusId, baseUrl);
    const currentItems = this.getItems(currentResponse);

    const newCodesWithAporte = new Set(
      validItems.map((item) => item.resultadoProgramaCodigo),
    );

    for (const [index, current] of currentItems.entries()) {
      const codigo = this.normalizeCodigo(current, index);
      const hadAporte = this.normalizeAporteValor(current);

      if (hadAporte && !newCodesWithAporte.has(codigo)) {
        await this.deleteContribution(syllabusId, codigo, baseUrl);
      }
    }

    for (const item of validItems) {
      const res = await authFetch(
        this.getContributionUrl(syllabusId, baseUrl),
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(this.buildPayload(syllabusId, item)),
        },
      );

      if (!res.ok) {
        throw await this.parseError(res);
      }
    }

    return {
      message: "Aportes guardados correctamente",
    };
  }

  async deleteContribution(
    syllabusId: number,
    codigo: string,
    baseUrl?: string,
  ): Promise<void> {
    const url = this.getContributionCodigoUrl(syllabusId, codigo, baseUrl);

    const res = await authFetch(url, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (res.status === 404) {
      return;
    }

    if (!res.ok) {
      throw await this.parseError(res);
    }
  }

  async updateResultados(
    syllabusId: number,
    data: ResultadosData,
    baseUrl?: string,
  ): Promise<{ message: string }> {
    return this.createResultados(syllabusId, data, baseUrl);
  }
}

export const eighthStepManager = new EighthStepManager();

export const useResultados = (syllabusId: number | null) => {
  const isValidId = syllabusId !== null && syllabusId > 0;

  return useQuery<ResultadosResponse, Error>({
    queryKey: ["syllabus", syllabusId, "contribution"],
    queryFn: () => eighthStepManager.fetchResultados(syllabusId!),
    enabled: isValidId,
    retry: false,
    throwOnError: false,
    staleTime: 0,
    gcTime: 0,
    refetchOnMount: "always",
    refetchOnWindowFocus: false,
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
    onSuccess: async (_, variables) => {
      await queryClient.invalidateQueries({
        queryKey: ["syllabus", variables.syllabusId, "contribution"],
      });

      await queryClient.refetchQueries({
        queryKey: ["syllabus", variables.syllabusId, "contribution"],
        type: "all",
      });
    },
  });
};
