import { useState, useEffect, useCallback } from "react";
import { pdf } from "@react-pdf/renderer";
import { SyllabusPDFDocument } from "./SyllabusPDFDocument";
import { syllabusPDFService } from "../services/syllabus-pdf-service";
import type { CompleteSyllabus } from "../types/complete-syllabus";
import {
  Download,
  RefreshCw,
  Loader2,
  AlertTriangle,
  FileText,
  BookOpen,
  Hash,
  CalendarDays,
  User,
  GraduationCap,
  Layers,
  CheckCircle,
  Library,
} from "lucide-react";

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
      console.log(`Cargando sílabo ID: ${syllabusId} desde el backend...`);

      const data = await syllabusPDFService.fetchCompleteSyllabus(syllabusId);

      setSyllabusData(data);

      console.log("Datos cargados:", data);
    } catch (err) {
      const errorMsg =
        err instanceof Error
          ? err.message
          : "Error al cargar la información del sílabo";

      setError(errorMsg);
      setSyllabusData(null);

      console.error("Error:", errorMsg);
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
      console.log("Generando PDF oficial...");

      const blob = await pdf(
        <SyllabusPDFDocument data={syllabusData} />,
      ).toBlob();

      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");

      link.href = url;
      link.download = fileName;
      link.click();

      URL.revokeObjectURL(url);

      console.log("PDF descargado exitosamente");
    } catch (err) {
      console.error("Error al generar PDF:", err);

      alert(
        "Error al generar PDF: " + (err instanceof Error ? err.message : ""),
      );
    } finally {
      setIsGenerating(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-[calc(100vh-72px)] bg-gray-50 px-8 py-8 flex items-center justify-center">
        <div className="bg-white rounded-2xl border border-gray-100 shadow-xl p-8 max-w-md w-full text-center">
          <div className="w-16 h-16 rounded-2xl bg-red-50 text-red-600 flex items-center justify-center mx-auto mb-5">
            <Loader2 className="animate-spin" size={32} />
          </div>

          <h2 className="text-xl font-bold text-gray-900">
            Cargando información del sílabo aprobado
          </h2>

          <p className="text-sm text-gray-500 mt-2">
            Estamos obteniendo la información completa desde el backend.
          </p>

          <div className="mt-5 inline-flex items-center gap-2 rounded-xl bg-gray-50 border border-gray-100 px-4 py-2 text-sm font-semibold text-gray-700">
            <FileText size={17} />
            Sílabo ID: {syllabusId}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-[calc(100vh-72px)] bg-gray-50 px-8 py-8 flex items-center justify-center">
        <div className="bg-white rounded-2xl border border-red-100 shadow-xl p-8 max-w-xl w-full">
          <div className="flex items-start gap-4">
            <div className="w-14 h-14 rounded-2xl bg-red-50 text-red-600 flex items-center justify-center shrink-0">
              <AlertTriangle size={30} />
            </div>

            <div>
              <h2 className="text-2xl font-bold text-gray-900">
                Error al cargar información
              </h2>

              <p className="text-sm text-red-600 mt-2 leading-relaxed">
                {error}
              </p>

              <button
                type="button"
                onClick={loadSyllabusData}
                className="mt-5 h-11 px-6 bg-red-600 text-white rounded-xl hover:bg-red-700 transition-colors flex items-center gap-2 font-semibold shadow-sm"
              >
                <RefreshCw size={18} />
                Reintentar
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!syllabusData || !syllabusData.datosGenerales) {
    return (
      <div className="min-h-[calc(100vh-72px)] bg-gray-50 px-8 py-8 flex items-center justify-center">
        <div className="bg-white rounded-2xl border border-gray-100 shadow-xl p-8 max-w-md w-full text-center">
          <div className="w-16 h-16 rounded-2xl bg-gray-100 text-gray-400 flex items-center justify-center mx-auto mb-4">
            <FileText size={32} />
          </div>

          <h2 className="text-xl font-bold text-gray-900">
            No hay datos disponibles
          </h2>

          <p className="text-sm text-gray-500 mt-2">
            No se encontró información suficiente para generar el PDF oficial.
          </p>
        </div>
      </div>
    );
  }

  const datos = syllabusData.datosGenerales;
  const missingSections = getMissingSections(syllabusData);
  const hasMissingSections = missingSections.length > 0;

  const infoCards = [
    {
      label: "Asignatura",
      value: datos.nombreAsignatura || "N/A",
      icon: BookOpen,
    },
    {
      label: "Código",
      value: datos.codigoAsignatura || "N/A",
      icon: Hash,
    },
    {
      label: "Semestre",
      value: datos.semestreAcademico || "N/A",
      icon: CalendarDays,
    },
    {
      label: "Docente",
      value: datos.docentes || "N/A",
      icon: User,
    },
    {
      label: "Créditos",
      value: `Teoría: ${datos.creditosTeoria || 0} | Práctica: ${
        datos.creditosPractica || 0
      } | Total: ${datos.creditosTotales || 0}`,
      icon: GraduationCap,
    },
    {
      label: "Unidades Didácticas",
      value: `${syllabusData.unidadesDidacticas?.length || 0} unidades`,
      icon: Layers,
    },
    {
      label: "Competencias",
      value: `${syllabusData.competenciasCurso?.length || 0} competencias`,
      icon: CheckCircle,
    },
    {
      label: "Fuentes de consulta",
      value: `${syllabusData.fuentes?.length || 0} fuentes`,
      icon: Library,
    },
  ];

  return (
    <div className="min-h-[calc(100vh-72px)] bg-gray-50 px-8 py-8">
      <div className="max-w-6xl mx-auto">
        <div className="mb-7">
          <h1 className="text-3xl font-bold text-gray-900">
            PDF oficial del sílabo aprobado
          </h1>

          <p className="text-sm text-gray-500 mt-1">
            Revisa la información consolidada desde el backend antes de
            descargar el documento oficial.
          </p>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 shadow-xl overflow-hidden">
          <div className="px-8 py-6 border-b border-gray-100 bg-gradient-to-r from-red-50 via-white to-white">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
              <div className="flex items-start gap-4">
                <div className="w-14 h-14 rounded-2xl bg-red-600 text-white flex items-center justify-center shadow-md">
                  <FileText size={30} />
                </div>

                <div>
                  <h2 className="text-2xl font-bold text-gray-900">
                    Documento académico oficial
                  </h2>

                  <div className="flex flex-wrap items-center gap-3 mt-2 text-sm text-gray-600">
                    <span>
                      Datos cargados desde el API para generar el PDF oficial.
                    </span>

                    <span className="inline-flex items-center rounded-full bg-blue-50 border border-blue-100 px-3 py-1 text-xs font-bold text-blue-700">
                      Sílabo ID: {syllabusId}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  onClick={loadSyllabusData}
                  className="h-11 px-5 bg-white border border-gray-200 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors flex items-center gap-2 font-semibold shadow-sm"
                >
                  <RefreshCw size={18} />
                  Recargar información
                </button>

                <button
                  type="button"
                  onClick={handleDownloadDirect}
                  disabled={isGenerating}
                  className="h-11 px-6 bg-red-600 text-white rounded-xl hover:bg-red-700 transition-colors disabled:bg-gray-300 disabled:text-gray-500 disabled:cursor-not-allowed flex items-center gap-2 font-semibold shadow-sm"
                >
                  {isGenerating ? (
                    <>
                      <Loader2 size={18} className="animate-spin" />
                      Generando PDF oficial...
                    </>
                  ) : (
                    <>
                      <Download size={18} />
                      Descargar PDF oficial
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>

          <div className="p-8">
            <section className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 mb-7">
              {infoCards.map((item) => {
                const Icon = item.icon;

                return (
                  <div
                    key={item.label}
                    className="rounded-2xl border border-gray-100 bg-gray-50 p-5"
                  >
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-10 h-10 rounded-xl bg-red-50 text-red-600 flex items-center justify-center">
                        <Icon size={20} />
                      </div>

                      <p className="text-xs font-bold uppercase tracking-wide text-gray-400">
                        {item.label}
                      </p>
                    </div>

                    <p className="text-sm font-semibold text-gray-900 leading-relaxed">
                      {item.value}
                    </p>
                  </div>
                );
              })}
            </section>

            {hasMissingSections && (
              <div className="mb-7 bg-yellow-50 border border-yellow-200 rounded-2xl p-5">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-xl bg-yellow-500 text-white flex items-center justify-center shrink-0">
                    <AlertTriangle size={20} />
                  </div>

                  <div>
                    <h3 className="font-bold text-yellow-900">
                      Advertencia de información incompleta
                    </h3>

                    <p className="text-sm text-yellow-700 mt-1 leading-relaxed">
                      El sílabo aprobado tiene secciones incompletas:{" "}
                      <span className="font-semibold">
                        {missingSections.join(", ")}
                      </span>
                      . Puede verificarse antes de usar el documento como
                      versión oficial.
                    </p>
                  </div>
                </div>
              </div>
            )}

            <div className="bg-blue-50 border border-blue-100 rounded-2xl p-5">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center shrink-0">
                  <FileText size={20} />
                </div>

                <div>
                  <h3 className="font-bold text-blue-900">
                    Información técnica
                  </h3>

                  <p className="text-sm text-blue-700 mt-1 leading-relaxed">
                    Este componente consume datos reales del endpoint{" "}
                    <code className="bg-white/70 px-2 py-1 rounded-lg text-xs font-bold">
                      /api/syllabus/{syllabusId}/complete
                    </code>{" "}
                    y genera el documento usando{" "}
                    <code className="bg-white/70 px-2 py-1 rounded-lg text-xs font-bold">
                      @react-pdf/renderer
                    </code>
                    .
                  </p>
                </div>
              </div>
            </div>

            {isGenerating && (
              <div className="mt-6 bg-red-50 border border-red-100 rounded-2xl p-5">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-red-600 text-white flex items-center justify-center">
                    <Loader2 size={20} className="animate-spin" />
                  </div>

                  <div>
                    <p className="text-sm font-bold text-red-700">
                      Generando documento...
                    </p>
                    <p className="text-sm text-red-600 mt-1">
                      Preparando el PDF académico oficial para descarga.
                    </p>
                  </div>
                </div>
              </div>
            )}

            <div className="mt-7 border-t border-gray-100 pt-4">
              <p className="text-xs text-gray-500">
                La generación del PDF utiliza únicamente información consultada
                desde el backend y no modifica el estado académico del sílabo.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}