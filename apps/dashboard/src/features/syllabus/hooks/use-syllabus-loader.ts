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
          const data = await syllabusService.fetchSyllabus(syllabusId);
          setSyllabusData(data);
        }
      } catch (error) {
        const errorMsg =
          error instanceof Error ? error.message : "Error al cargar datos";
        setLoadError(errorMsg);
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
