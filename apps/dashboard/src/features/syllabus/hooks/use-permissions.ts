import { useQuery } from "@tanstack/react-query";
import { authFetch } from "../../../common/utils/auth-fetch";
import {
  sectionsToUiSteps,
  SECTION_TO_UI_STEP,
} from "../utils/section-permissions";

export interface PermissionSection {
  numeroSeccion: number;
}

export const FULL_STEPS = [1, 2, 3, 4, 5, 6, 7, 8];

export const SECTION_TO_STEP_MAP: Record<number, number> = {
  1: 1, // Datos generales
  2: 2, // Sumilla
  3: 3, // Competencias
  4: 4, // Programación del contenido
  5: 5, // Estrategias metodológicas
  6: 5, // Recursos didácticos
  7: 6, // Evaluación del aprendizaje
  8: 7, // Fuentes de consulta
  9: 8, // Aportes / resultados
};

class PermissionsManager {
  getApiBase(baseUrl?: string): string {
    return (
      baseUrl ??
      import.meta.env.VITE_API_BASE_URL ??
      "http://localhost:7071/api"
    ).replace(/\/+$/, "");
  }

  async fetchPermissions(
    userId: number,
    syllabusId?: number | null,
    baseUrl?: string,
  ): Promise<PermissionSection[]> {
    const apiBase = this.getApiBase(baseUrl);

    const query = syllabusId
      ? `?silaboId=${encodeURIComponent(String(syllabusId))}`
      : "";

    const url = `${apiBase}/permisos/${encodeURIComponent(
      String(userId),
    )}${query}`;

    const res = await authFetch(url, {
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (!res.ok) {
      throw new Error(`Error ${res.status}: Failed to fetch permissions`);
    }

    const data: PermissionSection[] = await res.json();
    return Array.isArray(data) ? data : [];
  }

  sectionsToSteps(sections: PermissionSection[]): number[] {
    if (!sections || sections.length === 0) {
      return FULL_STEPS;
    }

    const steps = new Set<number>();

    sections.forEach((section) => {
      const step = SECTION_TO_STEP_MAP[section.numeroSeccion];

      if (step) {
        steps.add(step);
      }
    });

    const result = Array.from(steps).sort((a, b) => a - b);

    return result.length > 0 ? result : FULL_STEPS;
  }

  hasPermissionForSection(
    sections: PermissionSection[] | undefined,
    sectionNumber: number,
  ): boolean {
    if (!sections || sections.length === 0) {
      return true;
    }

    return sections.some((section) => section.numeroSeccion === sectionNumber);
  }
}

const permissionsManager = new PermissionsManager();

export const usePermissions = (
  userId: number | null,
  syllabusId?: number | null,
) => {
  const isValidId = userId !== null && userId > 0;

  const query = useQuery<PermissionSection[], Error>({
    queryKey: ["permissions", userId, syllabusId ?? "sin-silabo"],
    queryFn: () => permissionsManager.fetchPermissions(userId!, syllabusId),
    enabled: isValidId,
    retry: false,
    staleTime: 10 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
  });

  const allowedSteps = query.data
    ? permissionsManager.sectionsToSteps(query.data)
    : FULL_STEPS;

  const hasEditPermissionForSection = (sectionNumber: number): boolean => {
    return permissionsManager.hasPermissionForSection(
      query.data,
      sectionNumber,
    );
  };

  return {
    ...query,
    rawPermissions: query.data ?? [],
    allowedSteps,
    isStepAllowed: (step: number) => allowedSteps.includes(step),
    hasEditPermissionForSection,
  };
};