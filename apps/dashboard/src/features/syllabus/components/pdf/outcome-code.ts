import { STUDENT_OUTCOMES_CATALOG } from "../../data/student-outcomes-catalog";
import { formatPdfValue, isPdfValueNonEmpty } from "./format-pdf-value";

export type ContributionLevel = "K" | "R" | "-";

const RP_CODE_REGEX = /^RP\s*(\d+)$/i;
const DIGITS_ONLY_REGEX = /^(\d+)$/;

function getStringField(source: unknown, keys: string[]) {
  if (!source) {
    return "";
  }

  const record = source as Record<string, unknown>;

  for (const key of keys) {
    const value = record[key];
    if (isPdfValueNonEmpty(value)) {
      return formatPdfValue(value).trim();
    }
  }

  return "";
}

function getOutcomeCode(aporte: unknown, index: number) {
  return (
    getStringField(aporte, [
      "resultadoCodigo",
      "resultadoProgramaCodigo",
      "codigo",
      "code",
    ]) || `RP${index + 1}`
  );
}

function getOutcomeDescription(aporte: unknown) {
  return getStringField(aporte, [
    "resultadoDescripcion",
    "resultadoProgramaDescripcion",
    "descripcion",
    "description",
  ]);
}

function getOutcomeValue(aporte: unknown) {
  return getStringField(aporte, ["aporteValor", "aporte", "valor", "level"]);
}

export function normalizeOutcomeCode(value: string, fallbackIndex?: number) {
  const raw = formatPdfValue(value).trim().toUpperCase();

  if (!raw) {
    return `RP${(fallbackIndex ?? 0) + 1}`;
  }

  const rpMatch = RP_CODE_REGEX.exec(raw);
  if (rpMatch) {
    return `RP${Number(rpMatch[1])}`;
  }

  const digitMatch = DIGITS_ONLY_REGEX.exec(raw);
  if (digitMatch) {
    return `RP${Number(digitMatch[1])}`;
  }

  return raw;
}

export function formatAporteForPdf(value: string): ContributionLevel | "" {
  const normalized = formatPdfValue(value).trim().toUpperCase();

  if (normalized === "K" || normalized === "R") {
    return normalized;
  }

  return "";
}

export function buildOutcomeRowsForPdf(aportes?: unknown[]) {
  const contributionByCode = new Map<
    string,
    { description: string; value: string }
  >();

  (aportes ?? []).forEach((aporte, index) => {
    const code = normalizeOutcomeCode(getOutcomeCode(aporte, index), index);
    const description = getOutcomeDescription(aporte);
    const value = formatAporteForPdf(getOutcomeValue(aporte));

    const previous = contributionByCode.get(code);

    contributionByCode.set(code, {
      description: description || previous?.description || "",
      value: value || previous?.value || "",
    });
  });

  return STUDENT_OUTCOMES_CATALOG.map((catalogItem) => {
    const saved = contributionByCode.get(catalogItem.code);

    return {
      code: catalogItem.code,
      description: saved?.description?.trim()
        ? saved.description
        : catalogItem.description,
      value: saved?.value ?? "",
    };
  });
}
