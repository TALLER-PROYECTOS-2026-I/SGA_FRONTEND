import { useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import { useSyllabusContext } from "../contexts/syllabus-context";
import type { SyllabusMode } from "../contexts/syllabus-context";

export function resolveSyllabusIdFromSources(
  syllabusId: number | null,
  searchParams?: URLSearchParams,
): number | null {
  const params = searchParams ?? new URLSearchParams(window.location.search);

  const fromQuery = Number(params.get("syllabusId") || params.get("id"));
  if (Number.isFinite(fromQuery) && fromQuery > 0) {
    return fromQuery;
  }

  const fromContext = Number(syllabusId);
  if (Number.isFinite(fromContext) && fromContext > 0) {
    return fromContext;
  }

  return null;
}

export function isDraftCreate(params: {
  mode: SyllabusMode | string;
  resolvedSyllabusId: number | null;
}): boolean {
  if (params.mode !== "create") return false;
  return params.resolvedSyllabusId == null;
}

export function useIsDraftCreateMode() {
  const { mode, syllabusId } = useSyllabusContext();
  const [searchParams] = useSearchParams();

  const resolvedSyllabusId = useMemo(
    () => resolveSyllabusIdFromSources(syllabusId, searchParams),
    [syllabusId, searchParams],
  );

  const isDraftCreateMode = useMemo(
    () => isDraftCreate({ mode, resolvedSyllabusId }),
    [mode, resolvedSyllabusId],
  );

  return { isDraftCreateMode, resolvedSyllabusId, mode };
}

export function debugDraftCreateMode(
  isDraftCreateMode: boolean,
  context?: string,
): void {
  if (!import.meta.env.DEV) return;
  console.debug(
    `[CREATE DRAFT] isDraftCreateMode=${isDraftCreateMode}`,
    context ?? "",
  );
}
