import { useState, useCallback } from "react";
import { useSyllabusMode } from "./use-syllabus-mode";
import { authFetch } from "../../../common/utils/auth-fetch";

type HttpMethod = "POST" | "PUT";

interface SectionData {
  [key: string]: unknown;
}

type SyllabusSection =
  | "datos-generales"
  | "sumilla"
  | "competencies"
  | "components"
  | "attitudes"
  | "unidades"
  | "estrategias_metodologicas"
  | "recursos_didacticos_notas"
  | "formula_evaluacion"
  | "fuentes"
  | "contribution";

interface SaveSectionOptions {
  section: SyllabusSection;
  data: SectionData;
  method?: HttpMethod;
  itemId?: string | number;
}

interface CreateSyllabusResponse {
  id?: number;
  syllabusId?: number;
  success?: boolean;
  message?: string;
  data?: {
    id?: number;
    syllabusId?: number;
    [key: string]: unknown;
  };
}

const getApiBase = () => {
  const baseUrl =
    import.meta.env.VITE_API_BASE_URL ||
    import.meta.env.VITE_API_URL ||
    "http://localhost:7071/api";

  return String(baseUrl).replace(/\/$/, "");
};

const parseErrorMessage = async (response: Response) => {
  const text = await response.text();

  if (!text) {
    return `Error ${response.status}: ${response.statusText}`;
  }

  try {
    const json = JSON.parse(text) as {
      message?: string;
      error?: string;
      [key: string]: unknown;
    };

    return json.message || json.error || text;
  } catch {
    return text;
  }
};

const isSaveSectionOptions = (
  value: SaveSectionOptions | SectionData,
): value is SaveSectionOptions => {
  return (
    typeof value === "object" &&
    value !== null &&
    "section" in value &&
    "data" in value
  );
};

const getSectionUrl = (
  apiBase: string,
  syllabusId: number,
  section: SyllabusSection,
  itemId?: string | number,
) => {
  switch (section) {
    case "datos-generales":
      return `${apiBase}/syllabus/${syllabusId}/datos-generales`;

    case "sumilla":
      return `${apiBase}/syllabus/${syllabusId}/sumilla`;

    case "competencies":
      return itemId
        ? `${apiBase}/syllabus/${syllabusId}/competencies/${itemId}`
        : `${apiBase}/syllabus/${syllabusId}/competencies`;

    case "components":
      return itemId
        ? `${apiBase}/syllabus/${syllabusId}/components/${itemId}`
        : `${apiBase}/syllabus/${syllabusId}/components`;

    case "attitudes":
      return itemId
        ? `${apiBase}/syllabus/${syllabusId}/attitudes/${itemId}`
        : `${apiBase}/syllabus/${syllabusId}/attitudes`;

    case "unidades":
      return itemId
        ? `${apiBase}/syllabus/${syllabusId}/unidades/${itemId}`
        : `${apiBase}/syllabus/${syllabusId}/unidades`;

    case "estrategias_metodologicas":
      return `${apiBase}/syllabus/${syllabusId}/estrategias_metodologicas`;

    case "recursos_didacticos_notas":
      return `${apiBase}/syllabus/${syllabusId}/recursos_didacticos_notas`;

    case "formula_evaluacion":
      return `${apiBase}/syllabus/${syllabusId}/formula_evaluacion`;

    case "fuentes":
      return itemId
        ? `${apiBase}/syllabus/${syllabusId}/fuentes/${itemId}`
        : `${apiBase}/syllabus/${syllabusId}/fuentes`;

    case "contribution":
      return itemId
        ? `${apiBase}/syllabus/${syllabusId}/contribution/${itemId}`
        : `${apiBase}/syllabus/${syllabusId}/contribution`;

    default:
      throw new Error("Sección de sílabo no soportada");
  }
};

export const useSyllabusAutoSave = () => {
  const { syllabusId, codigo, updateUrlWithId } = useSyllabusMode();

  const [currentSyllabusId, setCurrentSyllabusId] = useState<number | null>(
    syllabusId,
  );

  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [lastSavedAt, setLastSavedAt] = useState<Date | null>(null);

  const createBaseSyllabus = useCallback(
    async (sectionData: SectionData = {}): Promise<number> => {
      const apiBase = getApiBase();

      const response = await authFetch(`${apiBase}/syllabus/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          codigo,
          estadoRevision: "BORRADOR",
          ...sectionData,
        }),
      });

      if (!response.ok) {
        throw new Error(await parseErrorMessage(response));
      }

      const result = (await response.json()) as CreateSyllabusResponse;

      const newId =
        result.id ||
        result.syllabusId ||
        result.data?.id ||
        result.data?.syllabusId;

      if (!newId) {
        throw new Error("El backend no devolvió el ID del sílabo creado");
      }

      setCurrentSyllabusId(newId);
      updateUrlWithId(newId);

      return newId;
    },
    [codigo, updateUrlWithId],
  );

  const saveSection = useCallback(
    async (
      optionsOrData: SaveSectionOptions | SectionData,
    ): Promise<number> => {
      setIsSaving(true);
      setSaveError(null);

      try {
        const apiBase = getApiBase();

        if (!isSaveSectionOptions(optionsOrData)) {
          if (!currentSyllabusId) {
            const newId = await createBaseSyllabus(optionsOrData);
            setLastSavedAt(new Date());
            return newId;
          }

          throw new Error(
            "Para guardar un avance en un sílabo existente debes indicar la sección. Ejemplo: saveSection({ section: 'sumilla', data: { sumilla } })",
          );
        }

        const section = optionsOrData.section;
        const data = optionsOrData.data;
        const method: HttpMethod = optionsOrData.method ?? "PUT";
        const itemId = optionsOrData.itemId;

        let targetSyllabusId = currentSyllabusId;

        if (!targetSyllabusId) {
          targetSyllabusId = await createBaseSyllabus({});
        }

        const url = getSectionUrl(apiBase, targetSyllabusId, section, itemId);

        const response = await authFetch(url, {
          method,
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(data),
        });

        if (!response.ok) {
          throw new Error(await parseErrorMessage(response));
        }

        setLastSavedAt(new Date());
        return targetSyllabusId;
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : "Error al guardar avance";

        setSaveError(errorMessage);
        throw error;
      } finally {
        setIsSaving(false);
      }
    },
    [currentSyllabusId, createBaseSyllabus],
  );

  const finalizeSyllabus = useCallback(async () => {
    if (!currentSyllabusId) {
      throw new Error("No hay sílabo para enviar a revisión");
    }

    setIsSaving(true);
    setSaveError(null);

    try {
      const apiBase = getApiBase();

      const response = await authFetch(
        `${apiBase}/syllabus/${currentSyllabusId}/analizando`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
        },
      );

      if (!response.ok) {
        throw new Error(await parseErrorMessage(response));
      }

      setLastSavedAt(new Date());
    } catch (error) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : "Error al enviar el sílabo a revisión";

      setSaveError(errorMessage);
      throw error;
    } finally {
      setIsSaving(false);
    }
  }, [currentSyllabusId]);

  return {
    syllabusId: currentSyllabusId,
    saveSection,
    finalizeSyllabus,
    isSaving,
    saveError,
    lastSavedAt,
  };
};
