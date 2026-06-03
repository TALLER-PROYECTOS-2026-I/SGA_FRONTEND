import { useQuery } from "@tanstack/react-query";
import { authFetch } from "../../../common/utils/auth-fetch";
import { getApiBase } from "./first-step-query";

export type CurriculumContextCourseRef = {
  nombreMalla: string;
  cursoNombre: string | null;
  cursoCodigo: string | null;
  silaboId: number | null;
  disponible: boolean;
};

export type CurriculumContextData = {
  hasCurriculumContext: boolean;
  actual: {
    silaboId: number | null;
    cursoNombre: string;
    cursoCodigo: string | null;
    ciclo: string | number | null;
    linea: string | null;
    disponible: boolean;
  };
  anteriores: CurriculumContextCourseRef[];
  posteriores: CurriculumContextCourseRef[];
  message: string | null;
};

type CurriculumContextResponse = {
  success?: boolean;
  data?: CurriculumContextData;
};

async function fetchCurriculumContext(
  syllabusId: number | null,
  courseName: string,
): Promise<CurriculumContextData | null> {
  const apiBase = getApiBase();
  const trimmedName = courseName.trim();

  if (syllabusId && syllabusId > 0) {
    const res = await authFetch(
      `${apiBase}/syllabus/${syllabusId}/curriculum-context`,
    );

    if (!res.ok) {
      const text = await res.text();
      throw new Error(text || `Error ${res.status}`);
    }

    const json = (await res.json()) as CurriculumContextResponse;
    return json.data ?? null;
  }

  if (!trimmedName) {
    return null;
  }

  const res = await authFetch(
    `${apiBase}/syllabus/curriculum-context/preview?nombre=${encodeURIComponent(trimmedName)}`,
  );

  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || `Error ${res.status}`);
  }

  const json = (await res.json()) as CurriculumContextResponse;
  return json.data ?? null;
}

export const useCurriculumContext = (
  syllabusId: number | null,
  courseName = "",
) => {
  const trimmedName = courseName.trim();
  const enabled = (syllabusId !== null && syllabusId > 0) || trimmedName.length > 0;

  return useQuery<CurriculumContextData | null, Error>({
    queryKey: ["syllabus", syllabusId, "curriculum-context", trimmedName],
    queryFn: () => fetchCurriculumContext(syllabusId, trimmedName),
    enabled,
    retry: false,
    throwOnError: false,
    staleTime: 0,
    gcTime: 0,
    refetchOnMount: "always",
    refetchOnWindowFocus: false,
  });
};
