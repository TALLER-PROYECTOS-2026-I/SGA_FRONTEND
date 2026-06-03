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

/** @deprecated Usar SECTION_TO_UI_STEP de utils/section-permissions */
export const SECTION_TO_STEP_MAP = SECTION_TO_UI_STEP;

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
      return [];
    }

    const sectionNumbers = sections
      .map((section) => Number(section.numeroSeccion))
      .filter((numeroSeccion) => !Number.isNaN(numeroSeccion));

    return sectionsToUiSteps(sectionNumbers);
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
    staleTime: 0,
    gcTime: 0,
    refetchOnMount: "always",
    refetchOnWindowFocus: false,
  });

  const allowedSteps = query.data
    ? permissionsManager.sectionsToSteps(query.data)
    : [];

  const hasEditPermissionForSection = (stepNumber: number): boolean => {
    return allowedSteps.includes(stepNumber);
  };

  return {
    ...query,
    rawPermissions: query.data ?? [],
    allowedSteps,
    isStepAllowed: (step: number) => allowedSteps.includes(step),
    hasEditPermissionForSection,
  };
};