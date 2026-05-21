import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

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
  message: string;
  data: FormulaEvaluacion;
}

// ========================================
// TIPOS PARA RECURSOS DIDÁCTICOS (legacy)
// ========================================
export interface RecursoDidactico {
  id?: number;
  silaboId?: number;
  tipo?: string;
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
  [key: string]: unknown;
}

interface ApiErrorResponse {
  message?: string;
  error?: string;
  [key: string]: unknown;
}

class SixthStepManager {
  getApiBase(baseUrl?: string): string {
    return (
      baseUrl ??
      import.meta.env.VITE_API_BASE_URL ??
      "http://localhost:7071/api"
    );
  }

  async fetchRecursosDidacticos(
    syllabusId: number,
    baseUrl?: string,
  ): Promise<RecursosDidacticosResponse> {
    const apiBase = this.getApiBase(baseUrl);
    const url = `${apiBase}/syllabus/${syllabusId}/recursos-didacticos`;

    const res = await fetch(url);
    if (res.status === 404) {
      return { items: [] };
    }
    if (!res.ok) {
      const t = await res.text();
      throw new Error(`${res.status} ${t}`);
    }

    const response = await res.json();

    // Manejar diferentes formatos de respuesta
    if (response.data) {
      const data = response.data;
      if (Array.isArray(data)) {
        return { items: data };
      }
      if (data.items) {
        return data;
      }
      if (data.recursos) {
        return { items: data.recursos };
      }
      return { items: [] };
    }

    if (Array.isArray(response)) {
      return { items: response };
    }

    if (response.items) {
      return response;
    }

    if (response.recursos) {
      return { items: response.recursos };
    }

    return { items: [] };
  }

  async createRecursosDidacticos(
    syllabusId: number,
    data: RecursosDidacticosData,
    baseUrl?: string,
  ): Promise<{ message: string }> {
    const apiBase = this.getApiBase(baseUrl);
    const url = `${apiBase}/syllabus/${syllabusId}/recursos-didacticos`;

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
      } catch (_parseError) {
        throw new Error(text || `Error ${res.status}` || "error" + _parseError);
      }
    }

    return res.json();
  }

  async updateRecursosDidacticos(
    syllabusId: number,
    data: RecursosDidacticosData,
    baseUrl?: string,
  ): Promise<{ message: string }> {
    const apiBase = this.getApiBase(baseUrl);
    const url = `${apiBase}/syllabus/${syllabusId}/recursos-didacticos`;

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
      } catch (_parseError) {
        throw new Error(text || `Error ${res.status}` || "error" + _parseError);
      }
    }

    return res.json();
  }
}

const sixthStepManager = new SixthStepManager();

export const useRecursosDidacticos = (syllabusId: number | null) => {
  const isValidId = syllabusId !== null && syllabusId > 0;

  return useQuery<RecursosDidacticosResponse, Error>({
    queryKey: ["syllabus", syllabusId, "recursos-didacticos"],
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
      } else {
        return sixthStepManager.updateRecursosDidacticos(syllabusId, data);
      }
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["syllabus", variables.syllabusId, "recursos-didacticos"],
      });
    },
  });
};

// ========================================
// MANAGER Y HOOKS PARA FÓRMULAS DE EVALUACIÓN
// ========================================
class SixthStepFormulaManager {
  getApiBase(baseUrl?: string): string {
    return (
      baseUrl ??
      import.meta.env.VITE_API_BASE_URL ??
      "http://localhost:7071/api"
    );
  }

  async fetchFormula(
    silaboId: number,
    baseUrl?: string,
  ): Promise<FormulaEvaluacion | null> {
    const apiBase = this.getApiBase(baseUrl);
    const url = `${apiBase}/syllabus/${silaboId}/formula_evaluacion`;

    const res = await fetch(url, {
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (res.status === 404) {
      return null;
    }

    if (!res.ok) {
      const text = await res.text();
      throw new Error(`Error ${res.status}: ${text}`);
    }

    const response: FormulaResponse = await res.json();
    return response.data;
  }

  async createFormula(
    formula: FormulaEvaluacionCreate,
    baseUrl?: string,
  ): Promise<FormulaEvaluacion> {
    const apiBase = this.getApiBase(baseUrl);
    const url = `${apiBase}/syllabus/formula_evaluacion`;

    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(formula),
    });

    if (!res.ok) {
      const text = await res.text();
      let errorMessage = `Error ${res.status}`;
      try {
        const json = JSON.parse(text);
        errorMessage = json.message || json.error || errorMessage;
      } catch {
        errorMessage = text || errorMessage;
      }
      throw new Error(errorMessage);
    }

    const response: FormulaResponse = await res.json();
    return response.data;
  }

  async updateFormula(
    silaboId: number,
    formula: FormulaEvaluacionUpdate,
    baseUrl?: string,
  ): Promise<FormulaEvaluacion> {
    const apiBase = this.getApiBase(baseUrl);
    const url = `${apiBase}/syllabus/${silaboId}/formula_evaluacion`;

    const res = await fetch(url, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(formula),
    });

    if (!res.ok) {
      const text = await res.text();
      let errorMessage = `Error ${res.status}`;
      try {
        const json = JSON.parse(text);
        errorMessage = json.message || json.error || errorMessage;
      } catch {
        errorMessage = text || errorMessage;
      }
      throw new Error(errorMessage);
    }

    const response: FormulaResponse = await res.json();
    return response.data;
  }
}

const sixthStepFormulaManager = new SixthStepFormulaManager();

export const useFormulaQuery = (silaboId: number | null) => {
  const isValidId = silaboId !== null && silaboId > 0;

  return useQuery<FormulaEvaluacion | null, Error>({
    queryKey: ["syllabus", silaboId, "formula_evaluacion"],
    queryFn: () => sixthStepFormulaManager.fetchFormula(silaboId!),
    enabled: isValidId,
    retry: false,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
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
    { silaboId: number; formula: FormulaEvaluacionUpdate }
  >({
    mutationFn: ({ silaboId, formula }) =>
      sixthStepFormulaManager.updateFormula(silaboId, formula),
    onSuccess: (data) => {
      queryClient.invalidateQueries({
        queryKey: ["syllabus", data.silaboId, "formula_evaluacion"],
      });
    },
  });
};
