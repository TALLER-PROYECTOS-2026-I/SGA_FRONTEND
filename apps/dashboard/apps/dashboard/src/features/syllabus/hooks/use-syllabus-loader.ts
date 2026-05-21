import { useState, useEffect } from "react";
import { useSyllabusMode } from "./use-syllabus-mode";
import {
  syllabusService,
  type SyllabusData,
} from "../services/syllabus-service";

export const useSyllabusLoader = () => {
  const { syllabusId } = useSyllabusMode();
  const [syllabusData, setSyllabusData] = useState<SyllabusData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      setLoadError(null);

      try {
        if (syllabusId) {
          console.log(`📥 Cargando sílabo ID: ${syllabusId}`);
          const data = await syllabusService.fetchSyllabus(syllabusId);
          setSyllabusData(data);
          console.log("✅ Datos cargados");
        } else {
          console.log("✅ Modo crear nuevo - sin datos previos");
        }
      } catch (error) {
        const errorMsg =
          error instanceof Error ? error.message : "Error al cargar datos";
        setLoadError(errorMsg);
        console.error("❌ Error:", errorMsg);
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [syllabusId]);

  return {
    syllabusData,
    isLoading,
    loadError,
    setSyllabusData,
  };
};
