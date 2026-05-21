import { useState, useCallback } from "react";
import { useSyllabusMode } from "./use-syllabus-mode";

interface SyllabusServiceResponse {
  success: boolean;
  message: string;
  data: {
    id: number;
    [key: string]: unknown;
  };
}

interface SectionData {
  [key: string]: unknown;
}

export const useSyllabusAutoSave = () => {
  const { syllabusId, codigo, updateUrlWithId } = useSyllabusMode();
  const [currentSyllabusId, setCurrentSyllabusId] = useState<number | null>(
    syllabusId,
  );
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const saveSection = useCallback(
    async (sectionData: SectionData): Promise<number> => {
      setIsSaving(true);
      setSaveError(null);

      try {
        if (currentSyllabusId) {
          console.log(`🔄 PUT /api/syllabus/${currentSyllabusId}`, sectionData);

          const response = await fetch(
            `${import.meta.env.VITE_API_URL}/api/syllabus/${currentSyllabusId}`,
            {
              method: "PUT",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${localStorage.getItem("token")}`,
              },
              body: JSON.stringify(sectionData),
            },
          );

          if (!response.ok) {
            throw new Error("Error al actualizar sílabo");
          }

          await response.json();
          console.log("✅ Sílabo actualizado");
          return currentSyllabusId;
        } else {
          console.log("📤 POST /api/syllabus", { codigo, ...sectionData });

          const response = await fetch(
            `${import.meta.env.VITE_API_URL}/api/syllabus`,
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${localStorage.getItem("token")}`,
              },
              body: JSON.stringify({
                codigo,
                estado: "BORRADOR",
                ...sectionData,
              }),
            },
          );

          if (!response.ok) {
            throw new Error("Error al crear sílabo");
          }

          const result: SyllabusServiceResponse = await response.json();
          const newId = result.data.id;

          setCurrentSyllabusId(newId);
          updateUrlWithId(newId);

          console.log(`✅ Sílabo creado con ID: ${newId}`);
          return newId;
        }
      } catch (error) {
        const errorMsg =
          error instanceof Error ? error.message : "Error al guardar";
        setSaveError(errorMsg);
        console.error("❌ Error:", errorMsg);
        throw error;
      } finally {
        setIsSaving(false);
      }
    },
    [currentSyllabusId, codigo, updateUrlWithId],
  );

  const finalizeSyllabus = useCallback(async () => {
    if (!currentSyllabusId) {
      throw new Error("No hay sílabo para finalizar");
    }

    setIsSaving(true);
    setSaveError(null);

    try {
      console.log(`🏁 PUT /api/syllabus/${currentSyllabusId}/finalize`);

      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/api/syllabus/${currentSyllabusId}/finalize`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
          body: JSON.stringify({
            estado: "PENDIENTE_REVISION",
          }),
        },
      );

      if (!response.ok) {
        throw new Error("Error al finalizar sílabo");
      }

      console.log("✅ Sílabo enviado a revisión");
    } catch (error) {
      const errorMsg =
        error instanceof Error ? error.message : "Error al finalizar";
      setSaveError(errorMsg);
      console.error("❌ Error:", errorMsg);
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
  };
};
