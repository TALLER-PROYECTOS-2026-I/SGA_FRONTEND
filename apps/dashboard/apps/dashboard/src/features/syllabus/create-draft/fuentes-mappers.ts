import type { FuenteCreate } from "../hooks/seventh-step-query";
import type { DraftFuentesData } from "./types";

function parseDraftYear(value: string | undefined, required: boolean): number {
  const raw = String(value ?? "").trim();

  if (!raw) {
    if (required) {
      throw new Error("Ingrese el año de publicación.");
    }
    return new Date().getFullYear();
  }

  const year = Number(raw);

  if (!Number.isInteger(year) || year < 1900 || year > 2100) {
    throw new Error("Ingrese un año válido (1900–2100).");
  }

  return year;
}

export function draftFuentesToCreatePayload(
  fuentes: DraftFuentesData,
): FuenteCreate[] {
  const rows: FuenteCreate[] = [];

  for (const biblio of fuentes.bibliographies) {
    rows.push({
      tipo: biblio.tipo,
      autores: biblio.authors.trim(),
      anio: parseDraftYear(biblio.year, true),
      titulo: biblio.title.trim(),
    });
  }

  for (const resource of fuentes.electronicResources) {
    const url = resource.url.trim();
    rows.push({
      tipo: "WEB",
      autores: resource.source.trim(),
      anio: parseDraftYear(resource.year, false),
      titulo: url,
      doiUrl: url,
    });
  }

  return rows;
}
