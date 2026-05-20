import type {
  SemanaUnidad,
  UnidadDidactica,
} from "../../types/complete-syllabus";
import { cleanPdfText, type PdfScalarInput } from "./format-pdf-value";

const ACCENT_REPLACEMENTS: Record<string, string> = {
  á: "a",
  à: "a",
  ä: "a",
  â: "a",
  Á: "a",
  À: "a",
  Ä: "a",
  Â: "a",
  é: "e",
  è: "e",
  ë: "e",
  ê: "e",
  É: "e",
  È: "e",
  Ë: "e",
  Ê: "e",
  í: "i",
  ì: "i",
  ï: "i",
  î: "i",
  Í: "i",
  Ì: "i",
  Ï: "i",
  Î: "i",
  ó: "o",
  ò: "o",
  ö: "o",
  ô: "o",
  Ó: "o",
  Ò: "o",
  Ö: "o",
  Ô: "o",
  ú: "u",
  ù: "u",
  ü: "u",
  û: "u",
  Ú: "u",
  Ù: "u",
  Ü: "u",
  Û: "u",
  ñ: "n",
  Ñ: "n",
};

const normalizeChar = (char: string): string =>
  ACCENT_REPLACEMENTS[char] ?? char.toLowerCase();

const isAsciiLetterOrDigit = (char: string): boolean => {
  const code = char.charCodeAt(0);
  const isNumber = code >= 48 && code <= 57;
  const isLowercaseLetter = code >= 97 && code <= 122;

  return isNumber || isLowercaseLetter;
};

const compactAlphaNumeric = (value: string): string => {
  let result = "";

  for (const char of value) {
    const normalizedChar = normalizeChar(char);

    if (isAsciiLetterOrDigit(normalizedChar)) {
      result += normalizedChar;
    }
  }

  return result;
};

const collapseWhitespace = (value: string): string => {
  const parts: string[] = [];
  let current = "";

  for (const char of value) {
    if (char.trim() === "") {
      if (current) {
        parts.push(current);
        current = "";
      }
    } else {
      current += char;
    }
  }

  if (current) {
    parts.push(current);
  }

  return parts.join(" ");
};

const normalizeEqualsSpacing = (value: string): string =>
  value
    .split("=")
    .map((part) => part.trim())
    .join(" = ");

export function normalizeText(value?: PdfScalarInput) {
  return compactAlphaNumeric(cleanPdfText(value).trim());
}

export function markOption(current: string | undefined | null, option: string) {
  return normalizeText(current) === normalizeText(option) ? "X" : " ";
}

export function formatTwoDigits(value?: PdfScalarInput) {
  const num = Number(value ?? 0);
  if (!Number.isFinite(num) || num <= 0) {
    return " ";
  }

  return String(num).padStart(2, "0");
}

export function toNumber(value?: PdfScalarInput) {
  const num = Number(value ?? 0);
  return Number.isFinite(num) ? num : 0;
}

export function roman(value?: number) {
  const map: Record<number, string> = {
    1: "I",
    2: "II",
    3: "III",
    4: "IV",
    5: "V",
    6: "VI",
    7: "VII",
    8: "VIII",
    9: "IX",
    10: "X",
  };

  return map[value || 0] || String(value || "");
}

export function joinLabelValue(label?: string | null, value?: string | null) {
  const cleanLabel = cleanPdfText(label).trim();
  const cleanValue = cleanPdfText(value).trim();

  if (cleanLabel && cleanValue) {
    return `${cleanLabel}: ${cleanValue}`;
  }

  return cleanLabel || cleanValue;
}

export function strategyText(
  estrategia: Readonly<{ nombre?: string; descripcion?: string }>,
) {
  const nombre = cleanPdfText(estrategia.nombre).trim();
  const descripcion = cleanPdfText(estrategia.descripcion).trim();

  if (nombre && descripcion) {
    return `${nombre}: ${descripcion}`;
  }

  return nombre || descripcion;
}

export function resourceNoteText(
  nota: Readonly<{ nombre?: string; descripcion?: string }>,
) {
  return joinLabelValue(nota.nombre, nota.descripcion);
}

export function resourceText(
  recurso: Readonly<{
    destino?: string;
    recursoNombre?: string;
    observaciones?: string;
  }>,
) {
  const main = joinLabelValue(recurso.destino, recurso.recursoNombre);
  const observaciones = cleanPdfText(recurso.observaciones).trim();

  if (main && observaciones) {
    return `${main} - ${observaciones}`;
  }

  return main || observaciones;
}

export function textToBullets(value?: string | null) {
  const text = cleanPdfText(value).trim();

  if (!text) {
    return "-";
  }

  const lines = text
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);

  if (lines.length === 0) {
    return "-";
  }

  return lines
    .map((line) => {
      if (line.startsWith("-") || line.startsWith("•")) {
        return line;
      }

      return `- ${line}`;
    })
    .join("\n");
}

export function formatBulletText(value?: string | null) {
  return textToBullets(value);
}

export function cleanFormulaExpression(
  label: string,
  expression?: string | null,
) {
  const value = String(expression ?? "").trim();

  if (!value) {
    return "";
  }

  const normalized = normalizeEqualsSpacing(
    collapseWhitespace(value.toUpperCase()),
  );
  const labelPrefix = `${label.toUpperCase()} =`;

  if (normalized.startsWith(labelPrefix)) {
    return value;
  }

  return `${label} = ${value}`;
}

export function getWeeks(unidad: UnidadDidactica) {
  if (unidad.semanas && unidad.semanas.length > 0) {
    return unidad.semanas;
  }

  return [
    {
      id: unidad.id,
      silaboUnidadId: unidad.id,
      semana: unidad.numero,
      contenidosConceptuales: unidad.contenidosConceptuales,
      contenidosProcedimentales: unidad.contenidosProcedimentales,
      actividadesAprendizaje: unidad.actividadesAprendizaje,
      horasLectivasTeoria: unidad.horasLectivasTeoria,
      horasLectivasPractica: unidad.horasLectivasPractica,
      horasNoLectivasTeoria: unidad.horasNoLectivasTeoria,
      horasNoLectivasPractica: unidad.horasNoLectivasPractica,
    },
  ];
}

export function isEventWeek(semana: SemanaUnidad) {
  return cleanPdfText(semana.actividadesAprendizaje)
    .trim()
    .toUpperCase()
    .startsWith("[EVENTO]");
}
