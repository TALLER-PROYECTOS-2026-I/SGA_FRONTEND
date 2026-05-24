import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  authFetch,
  getHttpErrorFallback,
  readApiErrorMessage,
} from "../../../common/utils/auth-fetch";

// Datos Generales del Sílabo (Paso 1)
export interface SyllabusGeneral {
  nombreAsignatura?: string;
  departamentoAcademico?: string;
  escuelaProfesional?: string;
  programaAcademico?: string;
  semestreAcademico?: string;
  tipoAsignatura?: string;
  tipoEstudios?: string;
  modalidad?: string;
  codigoAsignatura?: string;
  ciclo?: string;
  requisitos?: string;
  creditosTeoria?: number;
  creditosPractica?: number;
  creditosTotales?: number;
  docentes?: string;
  horasTeoria?: number;
  horasPractica?: number;
  horasTotales?: number;
  /** Estado de revisión del sílabo (p. ej. para bloquear edición en HU17). */
  estadoRevision?: string | null;
}

export interface DatosGeneralesData {
  nombreAsignatura?: string;
  departamentoAcademico?: string;
  escuelaProfesional?: string;
  programaAcademico?: string;
  codigoAsignatura?: string;
  semestreAcademico?: string;
  tipoAsignatura?: string;
  tipoEstudios?: string;
  modalidad?: string;
  ciclo?: string;
  requisitos?: string;
  horasTeoria?: number;
  horasPractica?: number;
  horasLaboratorio?: number;
  horasTotales?: number;
  creditosTotales?: number;
  cursoNombre?: string;
  cursoCodigo?: string;
  tipoDeEstudios?: string;
  modalidadDeAsignatura?: string;
}

interface ApiErrorResponse {
  message?: string;
  error?: string;
  id?: number;
  syllabusId?: number;
  [key: string]: unknown;
}

export class SyllabusCreateConflictError extends Error {
  readonly status = 409;

  constructor(message: string) {
    super(message);
    this.name = "SyllabusCreateConflictError";
  }
}

export function getApiBase(baseUrl?: string): string {
  const apiBase =
    baseUrl ?? import.meta.env.VITE_API_BASE_URL ?? "http://localhost:7071/api";

  return apiBase.replace(/\/+$/, "");
}

class SyllabusManager {
  private getApiBase(baseUrl?: string): string {
    return getApiBase(baseUrl);
  }

  private normalizeGeneralResponse(response: unknown): SyllabusGeneral | null {
    if (!response || typeof response !== "object") {
      return null;
    }

    const responseObject = response as {
      success?: boolean;
      data?: unknown;
    };

    let data: unknown =
      responseObject.data !== undefined ? responseObject.data : response;

    if (
      data &&
      typeof data === "object" &&
      "data" in data &&
      (data as { data?: unknown }).data !== undefined
    ) {
      data = (data as { data: unknown }).data;
    }

    if (!data || typeof data !== "object") {
      return null;
    }

    return data as SyllabusGeneral;
  }

  async fetchGeneral(
    syllabusId: string | number,
    baseUrl?: string,
  ): Promise<SyllabusGeneral | null> {
    const apiBase = this.getApiBase(baseUrl);
    const url = `${apiBase}/syllabus/${encodeURIComponent(syllabusId)}/datos-generales`;

    const res = await authFetch(url);
    if (res.status === 404) {
      return null;
    }
    if (!res.ok) {
      const t = await res.text();
      throw new Error(`${res.status} ${t}`);
    }

    const response = await res.json();
    return this.normalizeGeneralResponse(response);
  }

  async createSyllabus(
    data: DatosGeneralesData,
    baseUrl?: string,
  ): Promise<{ message: string; syllabusId: number }> {
    const apiBase = this.getApiBase(baseUrl);
    const url = `${apiBase}/syllabus/`;

    const res = await authFetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });

    if (!res.ok) {
      throw new Error(
        await readApiErrorMessage(res, getHttpErrorFallback(res.status)),
      );
    }

    const json = (await res.json()) as ApiErrorResponse & {
      message?: string;
    };

    return {
      message: json.message ?? "Sílabo creado",
      syllabusId: Number(json.syllabusId ?? json.id),
    };
  }

  async createSyllabusRaw(
    payload: Record<string, unknown>,
    baseUrl?: string,
  ): Promise<{ syllabusId: number }> {
    const apiBase = this.getApiBase(baseUrl);
    const url = `${apiBase}/syllabus`;

    const res = await authFetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const errorMessage = await readApiErrorMessage(
        res,
        getHttpErrorFallback(res.status),
      );

      if (res.status === 409) {
        throw new SyllabusCreateConflictError(errorMessage);
      }

      throw new Error(errorMessage);
    }

    const json = (await res.json()) as ApiErrorResponse;
    const syllabusId = Number(json.syllabusId ?? json.id);

    if (!Number.isFinite(syllabusId) || syllabusId <= 0) {
      throw new Error(
        "No se recibió un identificador válido del sílabo creado.",
      );
    }

    return { syllabusId };
  }

  async updateDatosGenerales(
    syllabusId: number,
    data: DatosGeneralesData,
    baseUrl?: string,
  ): Promise<{ message: string }> {
    const apiBase = this.getApiBase(baseUrl);
    const url = `${apiBase}/syllabus/${syllabusId}/datos-generales`;

    const res = await authFetch(url, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });

    if (!res.ok) {
      throw new Error(
        await readApiErrorMessage(res, getHttpErrorFallback(res.status)),
      );
    }

    return res.json();
  }
}

export const syllabusManager = new SyllabusManager();

export const useSyllabusGeneral = (syllabusId: string | number | null) => {
  const normalizedId =
    typeof syllabusId === "string" ? syllabusId.trim() : syllabusId;
  const isValidId =
    normalizedId !== null &&
    normalizedId !== "" &&
    (typeof normalizedId === "number" ||
      (typeof normalizedId === "string" && /^\d+$/.test(normalizedId)));

  return useQuery<SyllabusGeneral | null, Error>({
    queryKey: ["syllabus", isValidId ? normalizedId : null, "datos-generales"],
    queryFn: () => syllabusManager.fetchGeneral(normalizedId!),
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

export const useSaveDatosGenerales = () => {
  const queryClient = useQueryClient();

  return useMutation<
    { message: string; syllabusId?: number },
    Error,
    { syllabusId: number | null; data: DatosGeneralesData; isCreating: boolean }
  >({
    mutationFn: ({ syllabusId, data, isCreating }) => {
      if (isCreating || !syllabusId) {
        return syllabusManager.createSyllabus(data);
      }

      return syllabusManager.updateDatosGenerales(syllabusId, data);
    },
    onSuccess: async (_, variables) => {
      const id = variables.syllabusId;

      if (id) {
        await queryClient.invalidateQueries({
          queryKey: ["syllabus", id, "datos-generales"],
        });

        await queryClient.refetchQueries({
          queryKey: ["syllabus", id, "datos-generales"],
          type: "all",
        });
      }
    },
  });
};

