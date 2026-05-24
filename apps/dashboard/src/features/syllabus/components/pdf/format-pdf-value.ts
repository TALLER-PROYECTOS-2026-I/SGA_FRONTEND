export type PdfScalarInput = string | number | null | undefined;

export function formatPdfValue(value: unknown): string {
  if (value === null || value === undefined) {
    return "";
  }

  if (
    typeof value === "string" ||
    typeof value === "number" ||
    typeof value === "boolean"
  ) {
    return String(value);
  }

  return "";
}

export function cleanPdfText(value?: PdfScalarInput): string {
  return formatPdfValue(value);
}

export function cleanCatalogPdfValue(value: PdfScalarInput): string {
  const text = formatPdfValue(value).trim();

  if (!text) {
    return "No registrado";
  }

  return text;
}

export function cleanCatalogSumilla(value: string | null | undefined): string {
  if (!value || value.trim() === "") {
    return "Este sílabo aún no tiene sumilla registrada.";
  }

  return value.trim();
}

export function isPdfValueNonEmpty(value: unknown): boolean {
  return formatPdfValue(value).trim().length > 0;
}
