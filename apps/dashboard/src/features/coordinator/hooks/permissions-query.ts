import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { UseQueryOptions } from "@tanstack/react-query";
import { authFetch } from "../../../common/utils/auth-fetch";

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

function normalizePermissionSection(section: Permission): Permission | null {
  const numeroSeccion = Number(section.numeroSeccion);

  if (Number.isNaN(numeroSeccion)) {
    return null;
  }

  return { numeroSeccion };
}

class PermissionsManager {
  async fetchByDocente(
    docenteId: number | string,
    silaboId?: number | string | null,
    baseUrl?: string,
  ) {
    const apiBase = getApiBase(baseUrl);

    const query = silaboId
      ? `?silaboId=${encodeURIComponent(String(silaboId))}`
      : "";

    const url = `${apiBase}/permisos/${encodeURIComponent(
      String(docenteId),
    )}${query}`;

    const res = await authFetch(url);

    if (!res.ok) {
      throw new Error(await readErrorMessage(res));
    }

    const json = await res.json();
    const data = Array.isArray(json) ? json : [];

    return data
      .map((item) => normalizePermissionSection(item))
      .filter((item): item is Permission => item !== null);
  }

  async savePermissions(
    data: PermissionsResponse,
    baseUrl?: string,
  ): Promise<void> {
    const apiBase = getApiBase(baseUrl);
    const url = `${apiBase}/permisos`;

    const permisos = Array.isArray(data.permisos)
      ? data.permisos
          .map((item) => normalizePermissionSection(item))
          .filter((item): item is Permission => item !== null)
      : [];

    const res = await authFetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        silaboId: Number(data.silaboId),
        docenteId: Number(data.docenteId),
        permisos,
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
  silaboId?: number | string | null,
  options?: UseQueryOptions<Permission[], Error>,
) => {
  return useQuery<Permission[], Error>({
    queryKey: ["permissions", docenteId, silaboId ?? "all"],
    queryFn: () =>
      permissionsManager.fetchByDocente(
        docenteId as number | string,
        silaboId,
      ),
    enabled: docenteId !== null && docenteId !== undefined,
    retry: false,
    staleTime: 0,
    gcTime: 0,
    refetchOnMount: "always",
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

      queryClient.invalidateQueries({
        queryKey: ["permissions", variables.docenteId, variables.silaboId],
      });
    },
  });
};