import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

// Interfaces para Fuentes Bibliográficas (Paso 7)
export interface Fuente {
  id: number;
  silaboId: number;
  tipo: "LIBRO" | "ART" | "WEB";
  autores: string;
  anio: number;
  titulo: string;
  editorialRevista: string | null;
  ciudad: string | null;
  isbnIssn: string | null;
  doiUrl: string | null;
  notas: string | null;
}

export interface FuenteCreate {
  tipo: "LIBRO" | "ART" | "WEB";
  autores: string;
  anio: number;
  titulo: string;
  editorialRevista?: string;
  ciudad?: string;
  isbnIssn?: string;
  doiUrl?: string;
  notas?: string;
}

export interface FuenteUpdate {
  tipo?: "LIBRO" | "ART" | "WEB";
  autores?: string;
  anio?: number;
  titulo?: string;
  editorialRevista?: string;
  ciudad?: string;
  isbnIssn?: string;
  doiUrl?: string;
  notas?: string;
}

export interface FuentesResponse {
  success: boolean;
  message: string;
  data: Fuente[];
}

export interface FuenteResponse {
  success: boolean;
  message: string;
  data: Fuente;
}

export interface DeleteResponse {
  success: boolean;
  message: string;
}

class SeventhStepManager {
  getApiBase(baseUrl?: string): string {
    return (
      baseUrl ??
      import.meta.env.VITE_API_BASE_URL ??
      "http://localhost:7071/api"
    );
  }

  async fetchFuentes(silaboId: number, baseUrl?: string): Promise<Fuente[]> {
    const apiBase = this.getApiBase(baseUrl);
    const url = `${apiBase}/syllabus/${silaboId}/fuentes`;

    const res = await fetch(url, {
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (res.status === 404) {
      return [];
    }

    if (!res.ok) {
      const text = await res.text();
      throw new Error(`Error ${res.status}: ${text}`);
    }

    const response: FuentesResponse = await res.json();
    return response.data || [];
  }

  async createFuente(
    silaboId: number,
    fuente: FuenteCreate,
    baseUrl?: string,
  ): Promise<Fuente> {
    const apiBase = this.getApiBase(baseUrl);
    const url = `${apiBase}/syllabus/${silaboId}/fuentes`;

    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(fuente),
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

    const response: FuenteResponse = await res.json();
    return response.data;
  }

  async updateFuente(
    silaboId: number,
    fuenteId: number,
    fuente: FuenteUpdate,
    baseUrl?: string,
  ): Promise<Fuente> {
    const apiBase = this.getApiBase(baseUrl);
    const url = `${apiBase}/syllabus/${silaboId}/fuentes/${fuenteId}`;

    const res = await fetch(url, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(fuente),
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

    const response: FuenteResponse = await res.json();
    return response.data;
  }

  async deleteFuente(
    silaboId: number,
    fuenteId: number,
    baseUrl?: string,
  ): Promise<void> {
    const apiBase = this.getApiBase(baseUrl);
    const url = `${apiBase}/syllabus/${silaboId}/fuentes/${fuenteId}`;

    const res = await fetch(url, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
      },
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
  }
}

const seventhStepManager = new SeventhStepManager();

export const useFuentesQuery = (silaboId: number | null) => {
  const isValidId = silaboId !== null && silaboId > 0;

  return useQuery<Fuente[], Error>({
    queryKey: ["syllabus", silaboId, "fuentes"],
    queryFn: () => seventhStepManager.fetchFuentes(silaboId!),
    enabled: isValidId,
    retry: false,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });
};

export const useCreateFuente = () => {
  const queryClient = useQueryClient();

  return useMutation<Fuente, Error, { silaboId: number; fuente: FuenteCreate }>(
    {
      mutationFn: ({ silaboId, fuente }) =>
        seventhStepManager.createFuente(silaboId, fuente),
      onSuccess: (_, variables) => {
        queryClient.invalidateQueries({
          queryKey: ["syllabus", variables.silaboId, "fuentes"],
        });
      },
    },
  );
};

export const useUpdateFuente = () => {
  const queryClient = useQueryClient();

  return useMutation<
    Fuente,
    Error,
    { silaboId: number; fuenteId: number; fuente: FuenteUpdate }
  >({
    mutationFn: ({ silaboId, fuenteId, fuente }) =>
      seventhStepManager.updateFuente(silaboId, fuenteId, fuente),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["syllabus", variables.silaboId, "fuentes"],
      });
    },
  });
};

export const useDeleteFuente = () => {
  const queryClient = useQueryClient();

  return useMutation<void, Error, { silaboId: number; fuenteId: number }>({
    mutationFn: ({ silaboId, fuenteId }) =>
      seventhStepManager.deleteFuente(silaboId, fuenteId),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["syllabus", variables.silaboId, "fuentes"],
      });
    },
  });
};
