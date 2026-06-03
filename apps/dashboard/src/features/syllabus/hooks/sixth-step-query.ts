import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { authFetch } from "../../../common/utils/auth-fetch";

// ========================================
// TIPOS PARA FÓRMULAS DE EVALUACIÓN
// ========================================

export interface Variable {
  codigo: string;
  nombre: string;
  tipo: "evaluacion" | "examen" | "trabajo" | "calculada" | "final";
  descripcion?: string;
  orden?: number;
}

export interface Subformula {
  variableCodigo: string;
  expresion: string;
}

export interface VariablePlanMapping {
  variableCodigo: string;
  planEvaluacionOfertaId: number;
}

export interface PlanEvaluacion {
  id: number;
  componenteNombre: string;
  instrumentoNombre: string;
  semana: number;
  fecha: string;
  instrucciones: string;
  rubricaUrl: string | null;
}

export interface FormulaEvaluacion {
  id: number;
  silaboId: number;
  nombreRegla: string;
  variableFinalCodigo: string;
  expresionFinal: string;
  activo: boolean;
  variables: Variable[];
  subformulas: Subformula[];
  variablePlanMappings: VariablePlanMapping[];
  planesEvaluacion?: PlanEvaluacion[];
}

export interface FormulaEvaluacionCreate {
  silaboId: number;
  nombreRegla: string;
  variableFinalCodigo: string;
  expresionFinal: string;
  activo: boolean;
  variables: Variable[];
  subformulas: Subformula[];
  variablePlanMappings: VariablePlanMapping[];
}

export interface FormulaEvaluacionUpdate {
  nombreRegla?: string;
  variableFinalCodigo?: string;
  expresionFinal?: string;
  activo?: boolean;
  variables?: Variable[];
  subformulas?: Subformula[];
  variablePlanMappings?: VariablePlanMapping[];
}

export interface FormulaResponse {
  message?: string;
  data?: FormulaEvaluacion | null;
}

// ========================================
// TIPOS PARA RECURSOS DIDÁCTICOS
// ========================================

export interface RecursoDidactico {
  id?: number;
  silaboId?: number;
  tipo?: string;
  titulo?: string;
  descripcion?: string;
  [key: string]: unknown;
}

export interface RecursosDidacticosResponse {
  items?: RecursoDidactico[];
  recursos?: RecursoDidactico[];
  [key: string]: unknown;
}

export interface RecursosDidacticosData {
  recursos?: RecursoDidactico[];
  items?: RecursoDidactico[];
  recursos_didacticos_notas?: RecursoDidactico[];
  [key: string]: unknown;
}

interface ApiErrorResponse {
  message?: string;
  error?: string;
  [key: string]: unknown;
}

// ========================================
// HELPERS
// ========================================

const getApiBase = (baseUrl?: string): string => {
  const apiBase =
    baseUrl ??
    import.meta.env.VITE_API_BASE_URL ??
    import.meta.env.VITE_API_URL ??
    "http://localhost:7071/api";

  return String(apiBase).replace(/\/$/, "");
};

const parseErrorMessage = async (res: Response): Promise<string> => {
  const text = await res.text();

  if (!text) {
    return `Error ${res.status}: ${res.statusText}`;
  }

  try {
    const json = JSON.parse(text) as ApiErrorResponse;
    return json.message || json.error || text;
  } catch {
    return text;
  }
};

const normalizeRecursosResponse = (
  response: unknown,
): RecursosDidacticosResponse => {
  const raw = response as {
    data?: unknown;
    items?: RecursoDidactico[];
    recursos?: RecursoDidactico[];
    recursos_didacticos_notas?: RecursoDidactico[];
  };

  if (Array.isArray(response)) {
    return { items: response as RecursoDidactico[] };
  }

  if (raw?.data) {
    const data = raw.data as {
      items?: RecursoDidactico[];
      recursos?: RecursoDidactico[];
      recursos_didacticos_notas?: RecursoDidactico[];
    };

    if (Array.isArray(raw.data)) {
      return { items: raw.data as RecursoDidactico[] };
    }

    if (data.items) return { items: data.items };
    if (data.recursos) return { items: data.recursos };
    if (data.recursos_didacticos_notas) {
      return { items: data.recursos_didacticos_notas };
    }

    return { items: [] };
  }

  if (raw?.items) return { items: raw.items };
  if (raw?.recursos) return { items: raw.recursos };
  if (raw?.recursos_didacticos_notas) {
    return { items: raw.recursos_didacticos_notas };
  }

  return { items: [] };
};

const normalizeFormulaResponse = (
  response: unknown,
): FormulaEvaluacion | null => {
  const raw = response as {
    data?: FormulaEvaluacion | null;
    id?: number;
  };

  if (!response) return null;

  if (raw.data) {
    return raw.data;
  }

  if (raw.id) {
    return response as FormulaEvaluacion;
  }

  return null;
};

// ========================================
// MANAGER PARA RECURSOS DIDÁCTICOS
// ========================================

class SixthStepManager {
  getApiBase(baseUrl?: string): string {
    return getApiBase(baseUrl);
  }

  async fetchRecursosDidacticos(
    syllabusId: number,
    baseUrl?: string,
  ): Promise<RecursosDidacticosResponse> {
    const apiBase = this.getApiBase(baseUrl);
    const url = `${apiBase}/syllabus/${syllabusId}/recursos_didacticos_notas`;

    const res = await authFetch(url, {
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (res.status === 404) {
      return { items: [] };
    }

    if (!res.ok) {
      throw new Error(await parseErrorMessage(res));
    }

    const response = await res.json();
    return normalizeRecursosResponse(response);
  }

  async createRecursosDidacticos(
    syllabusId: number,
    data: RecursosDidacticosData,
    baseUrl?: string,
  ): Promise<{ message: string }> {
    const apiBase = this.getApiBase(baseUrl);
    const url = `${apiBase}/syllabus/recursos_didacticos_notas`;

    const res = await authFetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        silaboId: syllabusId,
        ...data,
      }),
    });

    if (!res.ok) {
      throw new Error(await parseErrorMessage(res));
    }

    return res.json();
  }

  async updateRecursosDidacticos(
    syllabusId: number,
    data: RecursosDidacticosData,
    baseUrl?: string,
  ): Promise<{ message: string }> {
    const apiBase = this.getApiBase(baseUrl);
    const url = `${apiBase}/syllabus/${syllabusId}/recursos_didacticos_notas`;

    const res = await authFetch(url, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });

    if (!res.ok) {
      throw new Error(await parseErrorMessage(res));
    }

    return res.json();
  }
}

const sixthStepManager = new SixthStepManager();

export const useRecursosDidacticos = (syllabusId: number | null) => {
  const isValidId = syllabusId !== null && syllabusId > 0;

  return useQuery<RecursosDidacticosResponse, Error>({
    queryKey: ["syllabus", syllabusId, "recursos_didacticos_notas"],
    queryFn: () => sixthStepManager.fetchRecursosDidacticos(syllabusId!),
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

export const useSaveRecursosDidacticos = () => {
  const queryClient = useQueryClient();

  return useMutation<
    { message: string },
    Error,
    { syllabusId: number; data: RecursosDidacticosData; isCreating: boolean }
  >({
    mutationFn: ({ syllabusId, data, isCreating }) => {
      if (isCreating) {
        return sixthStepManager.createRecursosDidacticos(syllabusId, data);
      }

      return sixthStepManager.updateRecursosDidacticos(syllabusId, data);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: [
          "syllabus",
          variables.syllabusId,
          "recursos_didacticos_notas",
        ],
      });
    },
  });
};

// ========================================
// MANAGER PARA FÓRMULAS DE EVALUACIÓN
// ========================================

class SixthStepFormulaManager {
  getApiBase(baseUrl?: string): string {
    return getApiBase(baseUrl);
  }

  async fetchFormula(
    silaboId: number,
    baseUrl?: string,
  ): Promise<FormulaEvaluacion | null> {
    const apiBase = this.getApiBase(baseUrl);
    const url = `${apiBase}/syllabus/${silaboId}/formula_evaluacion`;

    const res = await authFetch(url, {
      headers: {
        "Content-Type": "application/json",
      },
    });

    // Si aún no existe fórmula registrada, se devuelve null.
    // Esto evita romper la pantalla cuando el sílabo todavía no tiene evaluación guardada.
    if (res.status === 404) {
      return null;
    }

    if (!res.ok) {
      throw new Error(await parseErrorMessage(res));
    }

    const response = await res.json();
    return normalizeFormulaResponse(response);
  }

  async createFormula(
    formula: FormulaEvaluacionCreate,
    baseUrl?: string,
  ): Promise<FormulaEvaluacion> {
    const apiBase = this.getApiBase(baseUrl);
    const url = `${apiBase}/syllabus/formula_evaluacion`;

    const res = await authFetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(formula),
    });

    if (!res.ok) {
      throw new Error(await parseErrorMessage(res));
    }

    const response = (await res.json()) as FormulaResponse;
    const data = response.data;

    if (!data) {
      throw new Error("El backend no devolvió la fórmula creada");
    }

    return data;
  }

  async updateFormula(
    formulaId: number,
    formula: FormulaEvaluacionUpdate,
    baseUrl?: string,
  ): Promise<FormulaEvaluacion> {
    const apiBase = this.getApiBase(baseUrl);
    const url = `${apiBase}/syllabus/${formulaId}/formula_evaluacion`;

    const res = await authFetch(url, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(formula),
    });

    if (!res.ok) {
      throw new Error(await parseErrorMessage(res));
    }

    const response = (await res.json()) as FormulaResponse;
    const data = response.data;

    if (!data) {
      throw new Error("El backend no devolvió la fórmula actualizada");
    }

    return data;
  }
}

export const sixthStepFormulaManager = new SixthStepFormulaManager();

export const useFormulaQuery = (silaboId: number | null) => {
  const isValidId = silaboId !== null && silaboId > 0;

  return useQuery<FormulaEvaluacion | null, Error>({
    queryKey: ["syllabus", silaboId, "formula_evaluacion"],
    queryFn: () => sixthStepFormulaManager.fetchFormula(silaboId!),
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

export const useCreateFormula = () => {
  const queryClient = useQueryClient();

  return useMutation<FormulaEvaluacion, Error, FormulaEvaluacionCreate>({
    mutationFn: (formula) => sixthStepFormulaManager.createFormula(formula),
    onSuccess: (data) => {
      queryClient.invalidateQueries({
        queryKey: ["syllabus", data.silaboId, "formula_evaluacion"],
      });
    },
  });
};

export const useUpdateFormula = () => {
  const queryClient = useQueryClient();

  return useMutation<
    FormulaEvaluacion,
    Error,
    { formulaId: number; formula: FormulaEvaluacionUpdate }
  >({
    mutationFn: ({ formulaId, formula }) =>
      sixthStepFormulaManager.updateFormula(formulaId, formula),
    onSuccess: (data) => {
      queryClient.invalidateQueries({
        queryKey: ["syllabus", data.silaboId, "formula_evaluacion"],
      });
    },
  });
};