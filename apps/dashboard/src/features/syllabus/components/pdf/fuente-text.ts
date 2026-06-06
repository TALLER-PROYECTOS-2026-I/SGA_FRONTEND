import type { FuenteInformacion } from "../../types/complete-syllabus";
import { cleanPdfText, isPdfValueNonEmpty } from "./format-pdf-value";

function getStringField(source: unknown, keys: string[]) {
  if (!source) {
    return "";
  }

  const record = source as Record<string, unknown>;

  for (const key of keys) {
    const value = record[key];
    if (isPdfValueNonEmpty(value)) {
      return cleanPdfText(value as string | number).trim();
    }
  }

  return "";
}

function shouldAppendUrl(title: string, url: string) {
  if (!url) {
    return false;
  }

  return !title.toLowerCase().includes(url.toLowerCase());
}

function buildAutorAnio(autores: string, anio: string): string {
  if (autores) {
    const anioSuffix = anio ? ` (${anio})` : "";
    return `${autores}${anioSuffix}`;
  }

  if (anio) {
    return `(${anio})`;
  }

  return "";
}

export function fuenteText(fuente: FuenteInformacion) {
  const autores = cleanPdfText(fuente.autores).trim();
  const anio = cleanPdfText(fuente.anio).trim();
  const titulo = cleanPdfText(fuente.titulo).trim();
  const editorial = cleanPdfText(fuente.editorial).trim();
  const ciudad = cleanPdfText(fuente.ciudad).trim();
  const isbn = cleanPdfText(fuente.isbn).trim();
  const notas = cleanPdfText(fuente.notas).trim();
  const url = getStringField(fuente, ["url", "doiUrl"]);
  const autorAnio = buildAutorAnio(autores, anio);
  const parts = [
    autorAnio,
    titulo,
    editorial,
    ciudad,
    isbn ? `ISBN: ${isbn}` : "",
    notas,
    shouldAppendUrl(titulo, url) ? url : "",
  ].filter(isPdfValueNonEmpty);

  return parts.join(". ");
}
