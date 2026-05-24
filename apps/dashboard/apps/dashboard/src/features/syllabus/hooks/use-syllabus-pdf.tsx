import { useState } from "react";
import { pdf } from "@react-pdf/renderer";
import { syllabusPDFService } from "../services/syllabus-pdf-service";
import type { CompleteSyllabus } from "../types/complete-syllabus";
import { SyllabusPDFDocument } from "../components/SyllabusPDFDocument";

interface UseSyllabusPDFOptions {
  onSuccess?: () => void;
  onError?: (error: Error) => void;
}

/**
 * Hook para generar PDFs de sílabos usando @react-pdf/renderer
 *
 * @param options - Opciones de configuración
 * @returns Funciones para generar y previsualizar PDFs
 */
export function useSyllabusPDF(options: UseSyllabusPDFOptions = {}) {
  const { onSuccess, onError } = options;

  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [syllabusData, setSyllabusData] = useState<CompleteSyllabus | null>(
    null,
  );

  /**
   * Genera y descarga el PDF del sílabo
   */
  const generatePDF = async (syllabusId: number, filename?: string) => {
    setIsGenerating(true);
    setError(null);

    try {
      console.log(`📥 Obteniendo datos del sílabo ${syllabusId}...`);

      // 1. Obtener datos completos del sílabo
      const data = await syllabusPDFService.fetchCompleteSyllabus(syllabusId);
      setSyllabusData(data);

      console.log(`📄 Generando PDF con @react-pdf/renderer...`);

      // 2. Generar PDF usando @react-pdf/renderer
      const blob = await pdf(<SyllabusPDFDocument data={data} />).toBlob();

      // 3. Descargar el archivo
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = filename || `silabo-${syllabusId}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      console.log("✅ PDF generado y descargado exitosamente");
      onSuccess?.();
    } catch (err) {
      const errorObj = err instanceof Error ? err : new Error(String(err));
      setError(errorObj);
      console.error("❌ Error al generar PDF:", errorObj);
      onError?.(errorObj);
    } finally {
      setIsGenerating(false);
    }
  };

  /**
   * Genera el PDF y retorna el blob (sin descargar)
   */
  const generateBlob = async (syllabusId: number): Promise<Blob> => {
    console.log(`📥 Obteniendo datos del sílabo ${syllabusId}...`);

    const data = await syllabusPDFService.fetchCompleteSyllabus(syllabusId);
    setSyllabusData(data);

    console.log(`📄 Generando PDF blob...`);
    const blob = await pdf(<SyllabusPDFDocument data={data} />).toBlob();

    return blob;
  };

  /**
   * Abre una vista previa del PDF en una nueva ventana
   */
  const previewPDF = async (syllabusId: number) => {
    setIsGenerating(true);
    setError(null);

    try {
      console.log(`📥 Obteniendo datos del sílabo ${syllabusId}...`);

      const data = await syllabusPDFService.fetchCompleteSyllabus(syllabusId);
      setSyllabusData(data);

      console.log(`🔍 Generando vista previa del PDF...`);

      const blob = await pdf(<SyllabusPDFDocument data={data} />).toBlob();
      const url = URL.createObjectURL(blob);

      window.open(url, "_blank");

      console.log("✅ Vista previa abierta exitosamente");
      onSuccess?.();
    } catch (err) {
      const errorObj = err instanceof Error ? err : new Error(String(err));
      setError(errorObj);
      console.error("❌ Error al generar vista previa:", errorObj);
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
