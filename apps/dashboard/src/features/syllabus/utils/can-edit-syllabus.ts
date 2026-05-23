export type SyllabusStatus =
  | "BORRADOR"
  | "ASIGNADO"
  | "EN_EDICION"
  | "DESAPROBADO"
  | "ANALIZANDO"
  | "EN_REVISION"
  | "REVISION"
  | "APROBADO"
  | "BLOQUEADO"
  | string
  | null
  | undefined;

export type EditAccessType = "READ_ONLY" | "RESTRICTED" | "FULL" | string;

const EDITABLE_STATUSES = ["BORRADOR", "ASIGNADO", "EN_EDICION", "DESAPROBADO"];

const BLOCKED_STATUSES = [
  "ANALIZANDO",
  "EN_REVISION",
  "REVISION",
  "APROBADO",
  "BLOQUEADO",
];

export function normalizeSyllabusStep(step: number) {
  /*
    En la pantalla de permisos existen 9 secciones.
    Pero el proceso del sílabo solo tiene 8 pasos.

    Sección 9: Resultados / outcomes
    corresponde al paso 8 del formulario.
  */
  if (step === 9) return 8;

  return step;
}

export function normalizeAllowedSteps(allowedSteps?: number[] | null) {
  if (!Array.isArray(allowedSteps)) return [];

  return Array.from(
    new Set(
      allowedSteps
        .map((step) => Number(step))
        .filter((step) => !Number.isNaN(step))
        .map(normalizeSyllabusStep)
        .filter((step) => step >= 1 && step <= 8),
    ),
  ).sort((a, b) => a - b);
}

export function getAllowedStepsByAccessType(
  accessType?: EditAccessType | null,
  allowedSteps?: number[] | null,
) {
  const normalizedAccessType = String(accessType || "")
    .trim()
    .toUpperCase();

  if (
    normalizedAccessType === "READ_ONLY" ||
    normalizedAccessType === "SOLO_VER" ||
    normalizedAccessType === "ONLY_VIEW"
  ) {
    return [];
  }

  if (
    normalizedAccessType === "FULL" ||
    normalizedAccessType === "TOTAL" ||
    normalizedAccessType === "FULL_ACCESS"
  ) {
    return [1, 2, 3, 4, 5, 6, 7, 8];
  }

  if (
    normalizedAccessType === "RESTRICTED" ||
    normalizedAccessType === "RESTRINGIDO" ||
    normalizedAccessType === "LIMITED"
  ) {
    const normalizedSteps = normalizeAllowedSteps(allowedSteps);

    return normalizedSteps;
  }

  return normalizeAllowedSteps(allowedSteps);
}

export function canEditSyllabusSection({
  status,
  hasPermission,
  isCreateMode,
  isReviewMode,
}: {
  status: SyllabusStatus;
  hasPermission: boolean;
  isCreateMode: boolean;
  isReviewMode?: boolean;
}) {
  if (isReviewMode) return false;

  if (isCreateMode) return true;

  if (!hasPermission) return false;

  if (!status) return hasPermission;

  const normalizedStatus = String(status).trim().toUpperCase();

  if (BLOCKED_STATUSES.includes(normalizedStatus)) {
    return false;
  }

  return EDITABLE_STATUSES.includes(normalizedStatus);
}

export function canEditStepByAllowedSteps({
  step,
  allowedSteps,
  status,
  isCreateMode,
  isReviewMode,
}: {
  step: number;
  allowedSteps?: number[] | null;
  status?: SyllabusStatus;
  isCreateMode: boolean;
  isReviewMode?: boolean;
}) {
  const normalizedStep = normalizeSyllabusStep(step);
  const normalizedAllowedSteps = normalizeAllowedSteps(allowedSteps);

  return canEditSyllabusSection({
    status,
    hasPermission: normalizedAllowedSteps.includes(normalizedStep),
    isCreateMode,
    isReviewMode,
  });
}
