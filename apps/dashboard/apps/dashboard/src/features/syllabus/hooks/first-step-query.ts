import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

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
  creditosTotales?: number;
}

interface ApiErrorResponse {
  message?: string;
  error?: string;
  [key: string]: unknown;
}

class SyllabusManager {
  async fetchGeneral(
    syllabusId: string | number,
    baseUrl?: string,
  ): Promise<SyllabusGeneral | null> {
    const apiBase =
      baseUrl ??
      import.meta.env.VITE_API_BASE_URL ??
      "http://localhost:7071/api";
    const url = `${apiBase}/syllabus/${encodeURIComponent(syllabusId)}/datos-generales`;

    const res = await fetch(url);
    if (res.status === 404) {
      return null;
    }
    if (!res.ok) {
      const t = await res.text();
      throw new Error(`${res.status} ${t}`);
    }

    const response = await res.json();

    // El backend puede retornar los datos directamente o dentro de { data: {...} }
    if (response.data) {
      return response.data as SyllabusGeneral;
    }
    return response as SyllabusGeneral;
  }

  async createSyllabus(
    data: DatosGeneralesData,
    baseUrl?: string,
  ): Promise<{ message: string; syllabusId: number }> {
    const apiBase =
      baseUrl ??
      import.meta.env.VITE_API_BASE_URL ??
      "http://localhost:7071/api";
    const url = `${apiBase}/syllabus/`;

    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });

    if (!res.ok) {
      const text = await res.text();
      try {
        const json = JSON.parse(text) as ApiErrorResponse;
        const apiMessage = json?.message || json?.error;
        if (apiMessage) throw new Error(apiMessage);
        throw new Error(JSON.stringify(json));
      } catch (parseError) {
        throw new Error(text || `Error ${res.status}` + parseError);
      }
    }

    return res.json();
  }

  async updateDatosGenerales(
    syllabusId: number,
    data: DatosGeneralesData,
    baseUrl?: string,
  ): Promise<{ message: string }> {
    const apiBase =
      baseUrl ??
      import.meta.env.VITE_API_BASE_URL ??
      "http://localhost:7071/api";
    const url = `${apiBase}/syllabus/${syllabusId}/datos-generales`;

    const res = await fetch(url, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });

    if (!res.ok) {
      const text = await res.text();
      try {
        const json = JSON.parse(text) as ApiErrorResponse;
        const apiMessage = json?.message || json?.error;
        if (apiMessage) throw new Error(apiMessage);
        throw new Error(JSON.stringify(json));
      } catch (parseError) {
        throw new Error(text || `Error ${res.status}` + parseError);
      }
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
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
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
      } else {
        return syllabusManager.updateDatosGenerales(syllabusId, data);
      }
    },
    onSuccess: (_, variables) => {
      if (variables.syllabusId) {
        queryClient.invalidateQueries({
          queryKey: ["syllabus", variables.syllabusId, "datos-generales"],
        });
      }
    },
  });
};
