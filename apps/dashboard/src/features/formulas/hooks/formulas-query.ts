import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  authFetch,
  getApiBaseUrl,
  readApiErrorMessage,
} from "../../../common/utils/auth-fetch";

export type FormulaCatalogTipo = "PE" | "PF";

export interface FormulaCatalogItem {
  id: number;
  tipo: FormulaCatalogTipo;
  nombre: string;
  expresion: string;
  descripcion?: string | null;
  variablesJson?: unknown;
  subformulasJson?: unknown;
  activo: boolean;
  creadoPorDocenteId?: number | null;
  createdAt?: string | null;
  updatedAt?: string | null;
}

export interface FormulaCatalogCreatePayload {
  tipo: FormulaCatalogTipo;
  nombre: string;
  expresion: string;
  descripcion?: string | null;
  variablesJson?: unknown;
  subformulasJson?: unknown;
  activo?: boolean;
}

interface ApiResponse<T> {
  data?: T;
  message?: string;
  success?: boolean;
}

function normalizeFormulasResponse(response: unknown): FormulaCatalogItem[] {
  if (Array.isArray(response)) {
    return response as FormulaCatalogItem[];
  }

  const raw = response as ApiResponse<FormulaCatalogItem[]>;
  return Array.isArray(raw?.data) ? raw.data : [];
}

class FormulasManager {
  async list(tipo?: FormulaCatalogTipo): Promise<FormulaCatalogItem[]> {
    const params = new URLSearchParams();

    if (tipo) {
      params.set("tipo", tipo);
    }

    const query = params.toString();
    const url = `${getApiBaseUrl()}/formulas${query ? `?${query}` : ""}`;
    const response = await authFetch(url);

    if (!response.ok) {
      throw new Error(
        await readApiErrorMessage(
          response,
          "No se pudieron cargar las formulas.",
        ),
      );
    }

    return normalizeFormulasResponse(await response.json());
  }

  async create(
    payload: FormulaCatalogCreatePayload,
  ): Promise<FormulaCatalogItem> {
    const response = await authFetch(`${getApiBaseUrl()}/formulas`, {
      method: "POST",
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      throw new Error(
        await readApiErrorMessage(response, "No se pudo crear la formula."),
      );
    }

    const json = (await response.json()) as ApiResponse<FormulaCatalogItem>;
    return json.data as FormulaCatalogItem;
  }

  async remove(id: number): Promise<FormulaCatalogItem> {
    const response = await authFetch(`${getApiBaseUrl()}/formulas/${id}`, {
      method: "DELETE",
    });

    if (!response.ok) {
      throw new Error(
        await readApiErrorMessage(response, "No se pudo eliminar la formula."),
      );
    }

    const json = (await response.json()) as ApiResponse<FormulaCatalogItem>;
    return json.data as FormulaCatalogItem;
  }
}

export const formulasManager = new FormulasManager();

export function useCatalogFormulas(tipo?: FormulaCatalogTipo) {
  return useQuery({
    queryKey: tipo ? ["formulas", tipo] : ["formulas"],
    queryFn: () => formulasManager.list(tipo),
    retry: 1,
    staleTime: 5 * 60 * 1000,
  });
}

export function useCreateCatalogFormula() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: FormulaCatalogCreatePayload) =>
      formulasManager.create(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["formulas"] });
    },
  });
}

export function useDeleteCatalogFormula() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => formulasManager.remove(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["formulas"] });
    },
  });
}
