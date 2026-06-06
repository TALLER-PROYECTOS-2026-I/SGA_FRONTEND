import { useState } from "react";
import { pdf } from "@react-pdf/renderer";
import { syllabusPDFService } from "../services/syllabus-pdf-service";
import type { CompleteSyllabus } from "../types/complete-syllabus";
import { SyllabusPDFDocument } from "../components/SyllabusPDFDocument";
import { downloadSyllabusPdf } from "../utils/syllabus-pdf-download";

interface UseSyllabusPDFOptions {
  onSuccess?: () => void;
  onError?: (error: Error) => void;
}

/**
 * Hook para generar PDFs de sílabos usando @react-pdf/renderer
 */
export function useSyllabusPDF(options: UseSyllabusPDFOptions = {}) {
  const { onSuccess, onError } = options;

  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [syllabusData, setSyllabusData] = useState<CompleteSyllabus | null>(
    null,
  );

  const generatePDF = async (syllabusId: number, filename?: string) => {
    setIsGenerating(true);
    setError(null);

    try {
      await downloadSyllabusPdf(syllabusId, { filename });
      onSuccess?.();
    } catch (err) {
      const errorObj = err instanceof Error ? err : new Error(String(err));
      setError(errorObj);
      onError?.(errorObj);
    } finally {
      setIsGenerating(false);
    }
  };

  const generateBlob = async (syllabusId: number): Promise<Blob> => {
    const data = await syllabusPDFService.fetchCompleteSyllabus(syllabusId);
    setSyllabusData(data);
    return pdf(<SyllabusPDFDocument data={data} />).toBlob();
  };

  const previewPDF = async (syllabusId: number) => {
    setIsGenerating(true);
    setError(null);

    try {
      const data = await syllabusPDFService.fetchCompleteSyllabus(syllabusId);
      setSyllabusData(data);

      const blob = await pdf(<SyllabusPDFDocument data={data} />).toBlob();
      const url = URL.createObjectURL(blob);
      window.open(url, "_blank");

      setTimeout(() => {
        URL.revokeObjectURL(url);
      }, 2000);

      onSuccess?.();
    } catch (err) {
      const errorObj = err instanceof Error ? err : new Error(String(err));
      setError(errorObj);
      onError?.(errorObj);
    } finally {
      setIsGenerating(false);
    }
  };

  return {
    generatePDF,
    generateBlob,
    previewPDF,
    isGenerating,
    error,
    syllabusData,
  };
}
