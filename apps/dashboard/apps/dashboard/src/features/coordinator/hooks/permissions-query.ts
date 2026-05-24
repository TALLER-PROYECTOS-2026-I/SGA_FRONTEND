import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { UseQueryOptions } from "@tanstack/react-query";

export interface Permission {
  numeroSeccion: number;
}

export interface PermissionsResponse {
  silaboId: number;
  docenteId: number;
  permisos: Permission[];
}

function getApiBase(baseUrl?: string) {
  return (
    baseUrl ??
    import.meta.env.VITE_API_BASE_URL ??
    "http://localhost:7071/api"
  ).replace(/\/+$/, "");
}

async function readErrorMessage(response: Response) {
  const text = await response.text().catch(() => "");

  if (!text) {
    return `Error HTTP ${response.status}`;
  }

  try {
    const json = JSON.parse(text) as {
      name?: string;
      message?: string;
      error?: string;
    };

    return json.message || json.error || text;
  } catch {
    return text;
  }
}

class PermissionsManager {
  async fetchByDocente(docenteId: number | string, baseUrl?: string) {
    const apiBase = getApiBase(baseUrl);
    const url = `${apiBase}/permisos/${encodeURIComponent(String(docenteId))}`;

    const res = await fetch(url);

    if (!res.ok) {
      throw new Error(await readErrorMessage(res));
    }

    const json = await res.json();
    return json as Permission[];
  }

  async savePermissions(
    data: PermissionsResponse,
    baseUrl?: string,
  ): Promise<void> {
    const apiBase = getApiBase(baseUrl);
    const url = `${apiBase}/permisos`;

    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        silaboId: Number(data.silaboId),
        docenteId: Number(data.docenteId),
        permisos: Array.isArray(data.permisos) ? data.permisos : [],
      }),
    });

    if (!res.ok) {
      throw new Error(await readErrorMessage(res));
    }
  }
}

export const permissionsManager = new PermissionsManager();

export const usePermissions = (
  docenteId: number | string | null | undefined,
  options?: UseQueryOptions<Permission[], Error>,
) => {
  return useQuery<Permission[], Error>({
    queryKey: ["permissions", docenteId],
    queryFn: () =>
      permissionsManager.fetchByDocente(docenteId as number | string),
    enabled: docenteId !== null && docenteId !== undefined,
    retry: false,
    staleTime: 30_000,
    refetchOnMount: true,
    refetchOnWindowFocus: false,
    ...options,
  });
};

export const useSavePermissions = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: PermissionsResponse) =>
      permissionsManager.savePermissions(data),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["permissions", variables.docenteId],
      });
    },
  });
};