import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

// Paso 3: Competencias, Componentes y Actitudes

export interface CompetenciaItem {
  id?: number;
  silaboId?: number;
  text: string;
  code?: string;
  order?: number;
  grupo?: string;
  tipo?: string;
  isAttitudinal?: boolean;
}

export interface ComponenteItem {
  id?: number;
  silaboId?: number;
  text: string;
  code?: string;
  order?: number;
  grupo?: string;
  competenciaCodigoRelacionada?: string | null;
  tipo?: string;
  isAttitudinal?: boolean;
}

export interface ActitudItem {
  id?: number;
  silaboId?: number;
  text: string;
  code?: string;
  order?: number;
  grupo?: string;
  tipo?: string;
  isAttitudinal?: boolean;
}

// Respuesta combinada del endpoint /syllabus/{id}/components
export interface ThirdStepCombinedResponse {
  success?: boolean;
  message?: string;
  data?: {
    items?: ComponenteItem[];
    competencias?: ComponenteItem[];
    actitudinales?: ActitudItem[];
  };
  items?: ComponenteItem[];
  competencias?: ComponenteItem[];
  actitudinales?: ActitudItem[];
  total?: number;
  totalCompetencias?: number;
  totalActitudinales?: number;
}

// Respuesta individual de competencias
export interface CompetenciasResponse {
  items: CompetenciaItem[];
}

export interface ComponentesResponse {
  items: ComponenteItem[];
}

export interface ActitudesResponse {
  items: ActitudItem[];
}

export interface CompetenciasData {
  items: Array<{ text: string; code?: string; order?: number }>;
}

export interface ComponentesData {
  items: Array<{ text: string; code?: string; order?: number; grupo?: string }>;
}

export interface ActitudesData {
  items: Array<{ text: string; code?: string; order?: number }>;
}

interface ApiErrorResponse {
  message?: string;
  error?: string;
  [key: string]: unknown;
}

class ThirdStepManager {
  private getApiBase(baseUrl?: string): string {
    const apiBase =
      baseUrl ??
      import.meta.env.VITE_API_BASE_URL ??
      "http://localhost:7071/api";
    return apiBase;
  }

  // ========== DATOS COMBINADOS (Competencias principales + Componentes + Actitudinales) ==========
  async fetchThirdStepData(
    syllabusId: number,
    baseUrl?: string,
  ): Promise<{
    competenciasPrincipales: CompetenciaItem[];
    componentes: ComponenteItem[];
    actitudinales: ActitudItem[];
  }> {
    const apiBase = this.getApiBase(baseUrl);

    // Primero obtener las competencias principales
    const competenciasUrl = `${apiBase}/syllabus/${syllabusId}/competencies`;
    const competenciasRes = await fetch(competenciasUrl);

    let competenciasPrincipales: CompetenciaItem[] = [];
    if (competenciasRes.ok) {
      const competenciasData = await competenciasRes.json();
      if (competenciasData.items) {
        competenciasPrincipales = competenciasData.items;
      } else if (Array.isArray(competenciasData)) {
        competenciasPrincipales = competenciasData;
      }
    }

    // Luego obtener componentes y actitudinales
    const componentesUrl = `${apiBase}/syllabus/${syllabusId}/components`;
    const componentesRes = await fetch(componentesUrl);

    let componentes: ComponenteItem[] = [];
    let actitudinales: ActitudItem[] = [];

    if (componentesRes.ok) {
      const componentesData = await componentesRes.json();

      // Manejar estructura: { success, message, data: { items, competencias, actitudinales } }
      if (componentesData.data) {
        componentes =
          componentesData.data.competencias || componentesData.data.items || [];
        actitudinales = componentesData.data.actitudinales || [];
      } else if (componentesData.competencias) {
        componentes = componentesData.competencias;
        actitudinales = componentesData.actitudinales || [];
      } else if (componentesData.items) {
        componentes = componentesData.items;
      }
    }

    return {
      competenciasPrincipales,
      componentes,
      actitudinales,
    };
  }

  // ========== COMPETENCIAS PRINCIPALES ==========
  async fetchCompetencias(
    syllabusId: number,
    baseUrl?: string,
  ): Promise<CompetenciasResponse> {
    const apiBase = this.getApiBase(baseUrl);
    const url = `${apiBase}/syllabus/${syllabusId}/competencies`;

    const res = await fetch(url);
    if (res.status === 404) {
      return { items: [] };
    }
    if (!res.ok) {
      const t = await res.text();
      throw new Error(`${res.status} ${t}`);
    }
    const response = await res.json();

    // El backend puede retornar { items: [...] } o { data: { items: [...] } }
    if (response.data) {
      return response.data;
    }
    if (response.items) {
      return response;
    }
    // Si retorna un array directamente
    if (Array.isArray(response)) {
      return { items: response };
    }
    return { items: [] };
  }

  async createCompetencias(
    syllabusId: number,
    data: CompetenciasData,
    baseUrl?: string,
  ): Promise<{ message: string; inserted?: number }> {
    const apiBase = this.getApiBase(baseUrl);
    const url = `${apiBase}/syllabus/${syllabusId}/competencies`;

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
        throw new Error(text || `Error ${res.status}` + _parseError);
      }
    }

    return res.json();
  }

  async updateCompetencias(
    syllabusId: number,
    data: CompetenciasData,
    baseUrl?: string,
  ): Promise<{
    ok: boolean;
    created: number;
    updated: number;
    deleted: number;
    message: string;
  }> {
    const apiBase = this.getApiBase(baseUrl);
    const url = `${apiBase}/syllabus/${syllabusId}/competencies`;

    const res = await fetch(url, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });

    if (!res.ok) {
      const text = await res.text();
      if (!text || text.trim() === "") {
        throw new Error(`Error ${res.status}: ${res.statusText}`);
      }
      try {
        const json = JSON.parse(text) as ApiErrorResponse;
        const apiMessage = json?.message || json?.error;
        if (apiMessage) throw new Error(apiMessage);
        throw new Error(JSON.stringify(json));
      } catch (parseError) {
        // Si no se puede parsear como JSON, retornar el texto tal cual
        throw new Error(text || `Error ${res.status}` || "error" + parseError);
      }
    }

    return res.json();
  }

  async deleteCompetencia(
    syllabusId: number,
    competenciaId: number,
    baseUrl?: string,
  ): Promise<{ message: string }> {
    const apiBase = this.getApiBase(baseUrl);
    const url = `${apiBase}/syllabus/${syllabusId}/competencies/${competenciaId}`;

    const res = await fetch(url, { method: "DELETE" });

    if (!res.ok) {
      const text = await res.text();
      throw new Error(text || `Error ${res.status}`);
    }

    return res.json();
  }

  // ========== COMPONENTES ==========
  async fetchComponentes(
    syllabusId: number,
    baseUrl?: string,
  ): Promise<ComponentesResponse> {
    const apiBase = this.getApiBase(baseUrl);
    const url = `${apiBase}/syllabus/${syllabusId}/components`;

    const res = await fetch(url);
    if (res.status === 404) {
      return { items: [] };
    }
    if (!res.ok) {
      const t = await res.text();
      throw new Error(`${res.status} ${t}`);
    }
    const response = await res.json();

    // El backend puede retornar { items: [...] } o { data: { items: [...] } }
    if (response.data) {
      return response.data;
    }
    if (response.items) {
      return response;
    }
    // Si retorna un array directamente
    if (Array.isArray(response)) {
      return { items: response };
    }
    return { items: [] };
  }

  async createComponentes(
    syllabusId: number,
    data: ComponentesData,
    baseUrl?: string,
  ): Promise<{ message: string }> {
    const apiBase = this.getApiBase(baseUrl);
    const url = `${apiBase}/syllabus/${syllabusId}/components`;

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
        throw new Error(text || `Error ${res.status}` + _parseError);
      }
    }

    return res.json();
  }

  async updateComponentes(
    syllabusId: number,
    data: ComponentesData,
    baseUrl?: string,
  ): Promise<{
    ok: boolean;
    created: number;
    updated: number;
    deleted: number;
    message: string;
  }> {
    const apiBase = this.getApiBase(baseUrl);
    const url = `${apiBase}/syllabus/${syllabusId}/components`;

    const res = await fetch(url, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });

    if (!res.ok) {
      const text = await res.text();
      if (!text || text.trim() === "") {
        throw new Error(`Error ${res.status}: ${res.statusText}`);
      }
      try {
        const json = JSON.parse(text) as ApiErrorResponse;
        const apiMessage = json?.message || json?.error;
        if (apiMessage) throw new Error(apiMessage);
        throw new Error(JSON.stringify(json));
      } catch (_parseError) {
        // Si no se puede parsear como JSON, retornar el texto tal cual
        throw new Error(text || `Error ${res.status}` || "error" + _parseError);
      }
    }

    return res.json();
  }

  async deleteComponente(
    syllabusId: number,
    componenteId: number,
    baseUrl?: string,
  ): Promise<{ message: string }> {
    const apiBase = this.getApiBase(baseUrl);
    const url = `${apiBase}/syllabus/${syllabusId}/components/${componenteId}`;

    const res = await fetch(url, { method: "DELETE" });

    if (!res.ok) {
      const text = await res.text();
      throw new Error(text || `Error ${res.status}`);
    }

    return res.json();
  }

  // ========== ACTITUDES ==========
  async fetchActitudes(
    syllabusId: number,
    baseUrl?: string,
  ): Promise<ActitudesResponse> {
    const apiBase = this.getApiBase(baseUrl);
    const url = `${apiBase}/syllabus/${syllabusId}/attitudes`;

    const res = await fetch(url);
    if (res.status === 404) {
      return { items: [] };
    }
    if (!res.ok) {
      const t = await res.text();
      throw new Error(`${res.status} ${t}`);
    }
    const response = await res.json();

    // El backend puede retornar { items: [...] } o { data: { items: [...] } }
    if (response.data) {
      return response.data;
    }
    if (response.items) {
      return response;
    }
    // Si retorna un array directamente
    if (Array.isArray(response)) {
      return { items: response };
    }
    return { items: [] };
  }

  async createActitudes(
    syllabusId: number,
    data: ActitudesData,
    baseUrl?: string,
  ): Promise<{ message: string }> {
    const apiBase = this.getApiBase(baseUrl);
    const url = `${apiBase}/syllabus/${syllabusId}/attitudes`;

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

  async updateActitudes(
    syllabusId: number,
    data: ActitudesData,
    baseUrl?: string,
  ): Promise<{
    ok: boolean;
    created: number;
    updated: number;
    deleted: number;
    message: string;
  }> {
    const apiBase = this.getApiBase(baseUrl);
    const url = `${apiBase}/syllabus/${syllabusId}/attitudes`;

    const res = await fetch(url, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });

    if (!res.ok) {
      const text = await res.text();
      if (!text || text.trim() === "") {
        throw new Error(`Error ${res.status}: ${res.statusText}`);
      }
      try {
        const json = JSON.parse(text) as ApiErrorResponse;
        const apiMessage = json?.message || json?.error;
        if (apiMessage) throw new Error(apiMessage);
        throw new Error(JSON.stringify(json));
      } catch (parseError) {
        // Si no se puede parsear como JSON, retornar el texto tal cual
        throw new Error(text || `Error ${res.status}` || "error" + parseError);
      }
    }

    return res.json();
  }

  async deleteActitud(
    syllabusId: number,
    actitudId: number,
    baseUrl?: string,
  ): Promise<{ message: string }> {
    const apiBase = this.getApiBase(baseUrl);
    const url = `${apiBase}/syllabus/${syllabusId}/attitudes/${actitudId}`;

    const res = await fetch(url, { method: "DELETE" });

    if (!res.ok) {
      const text = await res.text();
      throw new Error(text || `Error ${res.status}`);
    }

    return res.json();
  }
}

const thirdStepManager = new ThirdStepManager();

// ========== HOOKS ==========

// Hook principal para obtener todos los datos del paso 3
export const useThirdStepData = (syllabusId: number | null) => {
  const isValidId = syllabusId !== null && syllabusId > 0;

  return useQuery<
    {
      competenciasPrincipales: CompetenciaItem[];
      componentes: ComponenteItem[];
      actitudinales: ActitudItem[];
    },
    Error
  >({
    queryKey: ["syllabus", syllabusId, "third-step-all"],
    queryFn: () => thirdStepManager.fetchThirdStepData(syllabusId!),
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

export const useCompetencias = (syllabusId: number | null) => {
  const isValidId = syllabusId !== null && syllabusId > 0;
  return useQuery<CompetenciasResponse, Error>({
    queryKey: ["syllabus", syllabusId, "competencies"],
    queryFn: () => thirdStepManager.fetchCompetencias(syllabusId!),
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

export const useComponentes = (syllabusId: number | null) => {
  const isValidId = syllabusId !== null && syllabusId > 0;
  return useQuery<ComponentesResponse, Error>({
    queryKey: ["syllabus", syllabusId, "components"],
    queryFn: () => thirdStepManager.fetchComponentes(syllabusId!),
    enabled: isValidId,
    retry: false,
    throwOnError: false,
  });
};

export const useActitudes = (syllabusId: number | null) => {
  const isValidId = syllabusId !== null && syllabusId > 0;
  return useQuery<ActitudesResponse, Error>({
    queryKey: ["syllabus", syllabusId, "attitudes"],
    queryFn: () => thirdStepManager.fetchActitudes(syllabusId!),
    enabled: isValidId,
    retry: false,
    throwOnError: false,
  });
};

// ========== MUTATIONS ==========

export const useSaveCompetencias = () => {
  const queryClient = useQueryClient();

  return useMutation<
    { message: string; inserted?: number },
    Error,
    { syllabusId: number; data: CompetenciasData }
  >({
    mutationFn: ({ syllabusId, data }) =>
      thirdStepManager.createCompetencias(syllabusId, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["syllabus", variables.syllabusId, "competencies"],
      });
      queryClient.invalidateQueries({
        queryKey: ["syllabus", variables.syllabusId, "third-step-all"],
      });
    },
  });
};

export const useUpdateCompetencias = () => {
  const queryClient = useQueryClient();

  return useMutation<
    {
      ok: boolean;
      created: number;
      updated: number;
      deleted: number;
      message: string;
    },
    Error,
    { syllabusId: number; data: CompetenciasData }
  >({
    mutationFn: ({ syllabusId, data }) =>
      thirdStepManager.updateCompetencias(syllabusId, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["syllabus", variables.syllabusId, "competencies"],
      });
      queryClient.invalidateQueries({
        queryKey: ["syllabus", variables.syllabusId, "third-step-all"],
      });
    },
  });
};

export const useDeleteCompetencia = () => {
  const queryClient = useQueryClient();

  return useMutation<
    { message: string },
    Error,
    { syllabusId: number; competenciaId: number }
  >({
    mutationFn: ({ syllabusId, competenciaId }) =>
      thirdStepManager.deleteCompetencia(syllabusId, competenciaId),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["syllabus", variables.syllabusId, "competencies"],
      });
      queryClient.invalidateQueries({
        queryKey: ["syllabus", variables.syllabusId, "third-step-all"],
      });
    },
  });
};

export const useSaveComponentes = () => {
  const queryClient = useQueryClient();

  return useMutation<
    { message: string },
    Error,
    { syllabusId: number; data: ComponentesData }
  >({
    mutationFn: ({ syllabusId, data }) =>
      thirdStepManager.createComponentes(syllabusId, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["syllabus", variables.syllabusId, "components"],
      });
      queryClient.invalidateQueries({
        queryKey: ["syllabus", variables.syllabusId, "third-step-all"],
      });
    },
  });
};

export const useUpdateComponentes = () => {
  const queryClient = useQueryClient();

  return useMutation<
    {
      ok: boolean;
      created: number;
      updated: number;
      deleted: number;
      message: string;
    },
    Error,
    { syllabusId: number; data: ComponentesData }
  >({
    mutationFn: ({ syllabusId, data }) =>
      thirdStepManager.updateComponentes(syllabusId, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["syllabus", variables.syllabusId, "components"],
      });
      queryClient.invalidateQueries({
        queryKey: ["syllabus", variables.syllabusId, "third-step-all"],
      });
    },
  });
};

export const useDeleteComponente = () => {
  const queryClient = useQueryClient();

  return useMutation<
    { message: string },
    Error,
    { syllabusId: number; componenteId: number }
  >({
    mutationFn: ({ syllabusId, componenteId }) =>
      thirdStepManager.deleteComponente(syllabusId, componenteId),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["syllabus", variables.syllabusId, "components"],
      });
      queryClient.invalidateQueries({
        queryKey: ["syllabus", variables.syllabusId, "third-step-all"],
      });
    },
  });
};

export const useSaveActitudes = () => {
  const queryClient = useQueryClient();

  return useMutation<
    { message: string },
    Error,
    { syllabusId: number; data: ActitudesData }
  >({
    mutationFn: ({ syllabusId, data }) =>
      thirdStepManager.createActitudes(syllabusId, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["syllabus", variables.syllabusId, "attitudes"],
      });
      queryClient.invalidateQueries({
        queryKey: ["syllabus", variables.syllabusId, "third-step-all"],
      });
    },
  });
};

export const useUpdateActitudes = () => {
  const queryClient = useQueryClient();

  return useMutation<
    {
      ok: boolean;
      created: number;
      updated: number;
      deleted: number;
      message: string;
    },
    Error,
    { syllabusId: number; data: ActitudesData }
  >({
    mutationFn: ({ syllabusId, data }) =>
      thirdStepManager.updateActitudes(syllabusId, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["syllabus", variables.syllabusId, "attitudes"],
      });
      queryClient.invalidateQueries({
        queryKey: ["syllabus", variables.syllabusId, "third-step-all"],
      });
    },
  });
};

export const useDeleteActitud = () => {
  const queryClient = useQueryClient();

  return useMutation<
    { message: string },
    Error,
    { syllabusId: number; actitudId: number }
  >({
    mutationFn: ({ syllabusId, actitudId }) =>
      thirdStepManager.deleteActitud(syllabusId, actitudId),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["syllabus", variables.syllabusId, "attitudes"],
      });
      queryClient.invalidateQueries({
        queryKey: ["syllabus", variables.syllabusId, "third-step-all"],
      });
    },
  });
};
