import { useMemo } from "react";
import { useSyllabusGeneral } from "./first-step-query";

function normalizeEstadoRevision(value: string): string {
  return String(value ?? "")
    .trim()
    .toUpperCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, "_");
}

const BLOCKED_KEYS = new Set([
  "ANALIZANDO",
  "EN_REVISION",
  "REVISION",
  "APROBADO",
  "BLOQUEADO",
]);

/**
 * Bloquea edición/guardado en UI cuando el sílabo está en un estado no editable (alineado con backend).
 */
export function useSyllabusEditLock(syllabusId: number | null) {
  const { data, isLoading, isFetching } = useSyllabusGeneral(syllabusId);

  const estadoRaw = String(data?.estadoRevision ?? "").trim();
  const estadoKey = estadoRaw ? normalizeEstadoRevision(estadoRaw) : "";

  const isLockedByState = useMemo(() => {
    if (!syllabusId || !estadoKey) return false;
    return BLOCKED_KEYS.has(estadoKey);
  }, [syllabusId, estadoKey]);

  const isResolvingState =
    Boolean(syllabusId) && (isLoading || isFetching) && data === undefined;

  return {
    isLockedByState,
    isResolvingState,
    estadoRevision: data?.estadoRevision ?? null,
  };
}
