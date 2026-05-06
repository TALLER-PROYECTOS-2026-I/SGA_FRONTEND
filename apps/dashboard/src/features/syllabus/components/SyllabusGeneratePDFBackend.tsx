import { useState, useEffect, useCallback } from "react";
import { pdf } from "@react-pdf/renderer";
import {
  AlertTriangle,
  CheckCircle2,
  Download,
  RefreshCcw,
} from "lucide-react";
import { SyllabusPDFDocument } from "./SyllabusPDFDocument";
import { syllabusPDFService } from "../services/syllabus-pdf-service";
import type { CompleteSyllabus } from "../types/complete-syllabus";

interface SyllabusGeneratePDFBackendProps {
  syllabusId?: number;
  fileName?: string;
}

function getMissingSections(data: CompleteSyllabus) {
  const missing: string[] = [];

  if (!data.datosGenerales) {
    missing.push("Datos generales");
  }

  if (!data.datosGenerales?.nombreAsignatura) {
    missing.push("Nombre de asignatura");
  }

  if (!data.datosGenerales?.codigoAsignatura) {
    missing.push("Código de asignatura");
  }

  if (!data.sumilla) {
    missing.push("Sumilla");
  }

  if (!data.competenciasCurso || data.competenciasCurso.length === 0) {
    missing.push("Competencias");
  }

  if (!data.unidadesDidacticas || data.unidadesDidacticas.length === 0) {
    missing.push("Programación de contenidos");
  }

  if (!data.evaluacionAprendizaje) {
    missing.push("Evaluación del aprendizaje");
  }

  if (!data.fuentes || data.fuentes.length === 0) {
    missing.push("Fuentes de consulta");
  }

  return missing;
}

export function SyllabusGeneratePDFBackend({
  syllabusId = 1,
  fileName = "silabo-oficial.pdf",
}: SyllabusGeneratePDFBackendProps) {
  const [syllabusData, setSyllabusData] = useState<CompleteSyllabus | null>(
    null,
  );
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  const loadSyllabusData = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const data = await syllabusPDFService.fetchCompleteSyllabus(syllabusId);
      setSyllabusData(data);
    } catch (err) {
      const errorMsg =
        err instanceof Error
          ? err.message
          : "Error al cargar la información del sílabo";
      setError(errorMsg);
    } finally {
      setIsLoading(false);
    }
  }, [syllabusId]);

  useEffect(() => {
    loadSyllabusData();
  }, [loadSyllabusData]);

  const handleDownloadDirect = async () => {
    if (!syllabusData) {
      alert("No hay información disponible para generar el PDF.");
      return;
    }

    setIsGenerating(true);

    try {
      const blob = await pdf(
        <SyllabusPDFDocument data={syllabusData} />,
      ).toBlob();

      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");

      link.href = url;
      link.download = fileName;
      link.click();

      URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Error al generar PDF:", err);
      alert(
        "Error al generar PDF: " + (err instanceof Error ? err.message : ""),
      );
    } finally {
      setIsGenerating(false);
    }
  };

  if (isLoading || !syllabusData) {
    return (
      <div className="flex items-center justify-center rounded-lg border border-gray-200 bg-white p-8">
        <div className="text-center">
          <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-b-2 border-red-600"></div>
          <p className="font-medium text-gray-700">
            Cargando información del sílabo aprobado...
          </p>
          <p className="mt-1 text-sm text-gray-500">Sílabo ID: {syllabusId}</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 p-6">
        <div className="flex items-start gap-3">
          <AlertTriangle className="mt-0.5 h-6 w-6 text-red-600" />

          <div>
            <h3 className="text-lg font-semibold text-red-800">
              Error al cargar información
            </h3>
            <p className="mt-2 text-sm text-red-700">{error}</p>

            <button
              type="button"
              onClick={loadSyllabusData}
              className="mt-4 rounded-md bg-red-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-red-700"
            >
              Reintentar
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!syllabusData || !syllabusData.datosGenerales) {
    return (
      <div className="rounded-lg border border-gray-200 bg-white p-8 text-center text-gray-500">
        No hay datos disponibles para generar el PDF oficial.
      </div>
    );
  }

  const missingSections = getMissingSections(syllabusData);
  const hasMissingSections = missingSections.length > 0;

  return (
    <div className="mx-auto max-w-4xl rounded-lg bg-white p-6 shadow-sm">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900">
          PDF oficial del sílabo aprobado
        </h2>
        <p className="mt-1 text-sm text-gray-600">
          Información consolidada obtenida desde el backend para la generación
          del documento oficial.
        </p>
      </div>

      <div className="mb-6 rounded-lg border border-red-100 bg-red-50 p-5">
        <h3 className="mb-4 flex items-center gap-2 text-lg font-semibold text-red-800">
          <CheckCircle2 className="h-5 w-5" />
          Información del sílabo
        </h3>

        <div className="grid grid-cols-1 gap-4 text-sm md:grid-cols-2">
          <div>
            <span className="font-semibold text-gray-700">Asignatura:</span>
            <p className="text-gray-900">
              {syllabusData.datosGenerales.nombreAsignatura || "N/A"}
            </p>
          </div>

          <div>
            <span className="font-semibold text-gray-700">Código:</span>
            <p className="text-gray-900">
              {syllabusData.datosGenerales.codigoAsignatura || "N/A"}
            </p>
          </div>

          <div>
            <span className="font-semibold text-gray-700">Semestre:</span>
            <p className="text-gray-900">
              {syllabusData.datosGenerales.semestreAcademico || "N/A"}
            </p>
          </div>

          <div>
            <span className="font-semibold text-gray-700">Docente:</span>
            <p className="text-gray-900">
              {syllabusData.datosGenerales.docentes || "N/A"}
            </p>
          </div>

          <div>
            <span className="font-semibold text-gray-700">Créditos:</span>
            <p className="text-gray-900">
              Teoría: {syllabusData.datosGenerales.creditosTeoria || 0} |
              Práctica: {syllabusData.datosGenerales.creditosPractica || 0} |
              Total: {syllabusData.datosGenerales.creditosTotales || 0}
            </p>
          </div>

          <div>
            <span className="font-semibold text-gray-700">
              Unidades didácticas:
            </span>
            <p className="text-gray-900">
              {syllabusData.unidadesDidacticas?.length || 0} unidades
            </p>
          </div>

          <div>
            <span className="font-semibold text-gray-700">Competencias:</span>
            <p className="text-gray-900">
              {syllabusData.competenciasCurso?.length || 0} competencias
            </p>
          </div>

          <div>
            <span className="font-semibold text-gray-700">
              Fuentes de consulta:
            </span>
            <p className="text-gray-900">
              {syllabusData.fuentes?.length || 0} fuentes
            </p>
          </div>
        </div>
      </div>

      {hasMissingSections && (
        <div className="mb-6 rounded-lg border border-yellow-300 bg-yellow-50 p-4">
          <div className="flex gap-3">
            <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-yellow-700" />

            <div>
              <p className="font-semibold text-yellow-800">
                Advertencia de información incompleta
              </p>
              <p className="mt-1 text-sm text-yellow-700">
                El sílabo aprobado tiene secciones incompletas:{" "}
                {missingSections.join(", ")}. Puede verificarse antes de usar el
                documento como versión oficial.
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="flex flex-col gap-4 sm:flex-row">
        <button
          type="button"
          onClick={handleDownloadDirect}
          disabled={isGenerating}
          className={`flex-1 rounded-lg px-6 py-3 font-semibold text-white transition-all ${
            isGenerating
              ? "cursor-not-allowed bg-gray-400"
              : "bg-red-600 hover:bg-red-700 hover:shadow-lg"
          }`}
        >
          {isGenerating ? (
            <span className="flex items-center justify-center">
              <span className="mr-3 h-5 w-5 animate-spin rounded-full border-b-2 border-white"></span>
              Generando PDF oficial...
            </span>
          ) : (
            <span className="flex items-center justify-center gap-2">
              <Download className="h-5 w-5" />
              Descargar PDF oficial
            </span>
          )}
        </button>

        <button
          type="button"
          onClick={loadSyllabusData}
          className="rounded-lg bg-gray-200 px-6 py-3 font-semibold text-gray-800 transition hover:bg-gray-300"
        >
          <span className="flex items-center justify-center gap-2">
            <RefreshCcw className="h-5 w-5" />
            Recargar información
          </span>
        </button>
      </div>

      <div className="mt-6 border-t border-gray-200 pt-4">
        <p className="text-xs text-gray-500">
          La generación del PDF utiliza únicamente información consultada desde
          el backend y no modifica el estado académico del sílabo.
        </p>
      </div>
    </div>
  );
}