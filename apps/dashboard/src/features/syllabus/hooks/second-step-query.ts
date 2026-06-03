import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { authFetch } from "../../../common/utils/auth-fetch";

export interface SumillaResponse {
  id?: number;
  silaboId?: number;
  sumilla?: string;
  contenido?: string;
  palabrasClave?: string;
  version?: number;
  esActual?: boolean;
}

export interface SumillaData {
  sumilla: string;
}

interface ApiErrorResponse {
  message?: string;
  error?: string;
  [key: string]: unknown;
}

class SecondStepManager {
  private getApiBase(baseUrl?: string): string {
    const apiBase =
      baseUrl ??
      import.meta.env.VITE_API_BASE_URL ??
      "http://localhost:7071/api";

    return apiBase.replace(/\/+$/, "");
  }

  private normalizeSumillaResponse(response: unknown): SumillaResponse | null {
    if (!response || typeof response !== "object") {
      return null;
    }

    const responseObject = response as {
      success?: boolean;
      content?: unknown;
      data?: unknown;
      sumilla?: string;
      contenido?: string;
      id?: number;
    };

    if (responseObject.sumilla || responseObject.contenido) {
      const text = responseObject.sumilla ?? responseObject.contenido ?? "";
      return {
        id: responseObject.id,
        sumilla: text,
        contenido: responseObject.contenido ?? text,
      };
    }

    let data: unknown =
      responseObject.content ?? responseObject.data ?? responseObject;

    if (Array.isArray(data)) {
      if (data.length === 0) return null;
      data = data[0];
    }

    if (!data || typeof data !== "object") {
      return null;
    }

    const item = data as SumillaResponse;
    const sumillaText = item.sumilla ?? item.contenido ?? "";

    if (!sumillaText.trim() && !item.id) {
      return null;
    }

    return {
      ...item,
      sumilla: sumillaText,
      contenido: item.contenido ?? sumillaText,
    };
  }

  private buildPayload(data: SumillaData) {
    return {
      sumilla: data.sumilla,
      contenido: data.sumilla,
    };
  }

  private async parseErrorResponse(res: Response) {
    const text = await res.text();

    try {
      const json = JSON.parse(text) as ApiErrorResponse;
      return json?.message || json?.error || JSON.stringify(json);
    } catch {
      return text || `Error ${res.status}`;
    }
  }

  async fetchSumilla(
    syllabusId: number,
    baseUrl?: string,
  ): Promise<SumillaResponse | null> {
    const apiBase = this.getApiBase(baseUrl);
    const url = `${apiBase}/syllabus/${syllabusId}/sumilla`;

    const res = await authFetch(url);

    if (res.status === 404) {
      return null;
    }

    if (!res.ok) {
      const errorMessage = await this.parseErrorResponse(res);
      throw new Error(errorMessage);
    }

    const response = await res.json();
    return this.normalizeSumillaResponse(response);
  }

  async createSumilla(
    syllabusId: number,
    data: SumillaData,
    baseUrl?: string,
  ): Promise<{ message: string }> {
    const apiBase = this.getApiBase(baseUrl);
    const url = `${apiBase}/syllabus/${syllabusId}/sumilla`;

    const res = await authFetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(this.buildPayload(data)),
    });

    if (!res.ok) {
      const errorMessage = await this.parseErrorResponse(res);
      throw new Error(errorMessage);
    }

    return res.json();
  }

  async updateSumilla(
    syllabusId: number,
    data: SumillaData,
    baseUrl?: string,
  ): Promise<{ message: string }> {
    const apiBase = this.getApiBase(baseUrl);
    const url = `${apiBase}/syllabus/${syllabusId}/sumilla`;

    const res = await authFetch(url, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(this.buildPayload(data)),
    });

    if (!res.ok) {
      const errorMessage = await this.parseErrorResponse(res);
      throw new Error(errorMessage);
    }

    return res.json();
  }
}

export const secondStepManager = new SecondStepManager();

export const useSumilla = (syllabusId: number | null) => {
  const isValidId = syllabusId !== null && syllabusId > 0;

  return useQuery<SumillaResponse | null, Error>({
    queryKey: ["syllabus", syllabusId, "sumilla"],
    queryFn: () => secondStepManager.fetchSumilla(syllabusId!),
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

export const useSaveSumilla = () => {
  const queryClient = useQueryClient();

  return useMutation<
    { message: string },
    Error,
    { syllabusId: number; data: SumillaData; isCreating: boolean }
  >({
    mutationFn: ({ syllabusId, data, isCreating }) => {
      if (isCreating) {
        return secondStepManager.createSumilla(syllabusId, data);
      }

      return secondStepManager.updateSumilla(syllabusId, data);
    },
    onSuccess: async (_, variables) => {
      await queryClient.invalidateQueries({
        queryKey: ["syllabus", variables.syllabusId, "sumilla"],
      });

      await queryClient.refetchQueries({
        queryKey: ["syllabus", variables.syllabusId, "sumilla"],
        type: "all",
      });
    },
  });
};
