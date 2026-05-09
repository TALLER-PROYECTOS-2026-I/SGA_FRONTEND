import { useState, useEffect } from "react";
import { useSaveSumilla, useSumilla } from "../hooks/second-step-query";
import { useSteps } from "../contexts/steps-context-provider";
import { useSyllabusContext } from "../contexts/syllabus-context";
import { useReviewMode } from "../../coordinator/contexts/review-mode-context";
import { Step } from "./step";
import { toast } from "sonner";
import {
  BookOpen,
  FileText,
  Loader2,
  Info,
  X,
} from "lucide-react";

type ReviewSumillaData = {
  sumilla?: string;
  contenido?: string;
  content?: Array<{
    sumilla?: string;
    contenido?: string;
  }>;
};

/**
 * Paso 2: Sumilla
 *
 * - Modo create/edit: guarda en BD usando POST o PUT.
 * - Modo review: solo muestra datos para revisión, no guarda.
 */
export default function SecondStep() {
  const { nextStep } = useSteps();
  const { syllabusId, courseName } = useSyllabusContext();
  const { isReviewMode, sectionData } = useReviewMode();

  const [summary, setSummary] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [apiError, setApiError] = useState("");

  const { data, isLoading, isError, error } = useSumilla(
    isReviewMode ? null : syllabusId,
  );

  const saveSumilla = useSaveSumilla();

  const hasExistingSumilla = Boolean(
    data?.id || data?.sumilla || data?.contenido,
  );

  const isCreating = !hasExistingSumilla;

  useEffect(() => {
    if (isReviewMode) return;

    if (isError) {
      const errorMsg = error?.message ?? "Error cargando sumilla";

      if (!errorMsg.includes("404")) {
        setApiError(errorMsg);

        toast.error("Error al cargar sumilla", {
          description: errorMsg,
        });
      }

      return;
    }

    setApiError("");

    if (!data) return;

    const loadedSummary = data.sumilla || data.contenido || "";

    if (loadedSummary) {
      setSummary(loadedSummary);

      try {
        localStorage.setItem("datos_sumilla", loadedSummary);
      } catch {
        // ignore
      }
    }
  }, [data, isError, error, isReviewMode]);

  useEffect(() => {
    if (!isReviewMode || !sectionData) return;

    const reviewData = sectionData as ReviewSumillaData;

    const loadedSummary =
      reviewData.sumilla ||
      reviewData.contenido ||
      reviewData.content?.[0]?.sumilla ||
      reviewData.content?.[0]?.contenido ||
      "";

    setSummary(loadedSummary);
  }, [isReviewMode, sectionData]);

  const validateAndNext = async () => {
    const newErrors: Record<string, string> = {};

    if (!summary.trim()) {
      newErrors.summary = "Campo obligatorio";
    }

    setErrors(newErrors);

    if (Object.keys(newErrors).length > 0) {
      const el = document.querySelector(
        'textarea[name="summary"]',
      ) as HTMLElement | null;

      if (el && typeof el.focus === "function") {
        el.focus();
      }

      return;
    }

    if (isReviewMode) {
      nextStep();
      return;
    }

    setApiError("");

    if (!syllabusId) {
      toast.error("Error", {
        description:
          "Id del sílabo no encontrado. Completa el primer paso antes de continuar.",
      });
      return;
    }

    try {
      await saveSumilla.mutateAsync({
        syllabusId,
        data: {
          sumilla: summary.trim(),
        },
        isCreating,
      });

      toast.success(
        isCreating
          ? "Sumilla creada exitosamente"
          : "Sumilla actualizada exitosamente",
      );

      try {
        localStorage.setItem("datos_sumilla", summary.trim());
      } catch {
        // ignore
      }

      nextStep();
    } catch (err: unknown) {
      if (err instanceof Error) {
        try {
          const errorData = JSON.parse(err.message);

          if (errorData.data && Array.isArray(errorData.data)) {
            errorData.data.forEach(
              (validationError: { path: string[]; message: string }) => {
                toast.error("Error de validación", {
                  description: validationError.message,
                });
              },
            );
          } else {
            toast.error("Error al guardar", {
              description: errorData.message || err.message,
            });
          }
        } catch {
          toast.error("Error al guardar la sumilla", {
            description: err.message,
          });
        }
      } else {
        toast.error("Error desconocido", {
          description: String(err),
        });
      }
    }
  };

  const handleClearSummary = () => {
    setSummary("");
    setErrors((prev) => ({ ...prev, summary: "" }));
  };

  const wordCount = summary.trim()
    ? summary.trim().split(/\s+/).filter(Boolean).length
    : 0;

  const charCount = summary.length;

  const isTextareaDisabled = isLoading || saveSumilla.isPending || isReviewMode;

  return (
    <Step step={2} onNextStep={validateAndNext}>
      <div className="bg-white rounded-2xl border border-gray-100 shadow-xl overflow-hidden">
        <div className="px-8 py-6 border-b border-gray-100 bg-gradient-to-r from-red-50 via-white to-white">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-red-600 text-white flex items-center justify-center shadow-md">
              <span className="text-2xl font-bold">2</span>
            </div>

            <div>
              <h2 className="text-2xl font-bold text-gray-900">Sumilla</h2>

              <p className="text-sm text-gray-500 mt-1">
                Describe de forma clara el propósito, alcance y contenido
                general de la asignatura.
              </p>
            </div>

            <div className="ml-auto hidden md:flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-50 text-blue-700 border border-blue-100 text-xs font-bold">
              Información académica
            </div>
          </div>
        </div>

        <div className="p-8">
          {isLoading && (
            <div className="mb-5 rounded-xl border border-blue-100 bg-blue-50 px-4 py-3 text-sm text-blue-700 flex items-center gap-2">
              <Loader2 size={18} className="animate-spin" />
              Cargando sumilla...
            </div>
          )}

          {apiError && (
            <div className="mb-5 rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700">
              {apiError}
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-6">
            <div className="space-y-6">
              <div className="rounded-2xl border border-gray-100 bg-gray-50 p-5">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center">
                    <BookOpen size={20} />
                  </div>

                  <div>
                    <h3 className="font-bold text-gray-900">
                      Asignatura seleccionada
                    </h3>

                    <p className="text-xs text-gray-500">
                      Curso asociado al sílabo actual
                    </p>
                  </div>
                </div>

                <div className="w-full min-h-12 rounded-xl px-4 py-3 flex items-center text-base font-semibold bg-white border border-gray-100 text-gray-800">
                  {courseName || "Sin nombre de asignatura"}
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-sm font-bold text-gray-900">
                    Redacción de la sumilla
                  </label>

                  <span
                    className={`text-xs font-semibold ${
                      errors.summary ? "text-red-600" : "text-gray-400"
                    }`}
                  >
                    {charCount} caracteres
                  </span>
                </div>

                <div className="relative">
                  <textarea
                    name="summary"
                    value={summary}
                    onChange={(e) => {
                      setSummary(e.target.value);
                      setErrors((prev) => ({ ...prev, summary: "" }));
                    }}
                    placeholder="Escribe la sumilla aquí..."
                    rows={10}
                    disabled={isTextareaDisabled}
                    className={`w-full min-h-[260px] rounded-2xl px-5 py-4 bg-gray-50 border resize-y text-sm text-gray-700 placeholder:text-gray-400 leading-relaxed outline-none transition-all focus:bg-white focus:ring-2 focus:ring-red-500 focus:border-transparent ${
                      summary.trim() && !isTextareaDisabled ? "pr-12" : ""
                    } ${
                      errors.summary ? "border-red-500" : "border-gray-200"
                    } ${
                      isTextareaDisabled
                        ? "opacity-70 cursor-not-allowed bg-gray-100"
                        : ""
                    }`}
                  />

                  {summary.trim() && !isTextareaDisabled && (
                    <button
                      type="button"
                      onClick={handleClearSummary}
                      className="absolute right-3 top-3 h-8 w-8 rounded-full text-gray-400 hover:text-red-600 hover:bg-red-50 flex items-center justify-center transition-colors"
                      title="Limpiar sumilla"
                    >
                      <X size={18} />
                    </button>
                  )}
                </div>

                {errors.summary && (
                  <div className="text-red-600 text-xs font-medium mt-2">
                    {errors.summary}
                  </div>
                )}

                {saveSumilla.isPending && (
                  <div className="text-sm text-blue-600 mt-3 flex items-center gap-2">
                    <Loader2 size={16} className="animate-spin" />
                    Guardando sumilla...
                  </div>
                )}
              </div>
            </div>

            <aside className="space-y-4">
              <div className="bg-white rounded-2xl border border-gray-100 shadow-md p-5">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-xl bg-red-50 text-red-600 flex items-center justify-center">
                    <FileText size={20} />
                  </div>

                  <div>
                    <h3 className="font-bold text-gray-900">
                      Resumen del texto
                    </h3>

                    <p className="text-xs text-gray-500">
                      Métricas de redacción
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-xl bg-gray-50 border border-gray-100 p-4">
                    <p className="text-xs font-semibold text-gray-400 uppercase">
                      Palabras
                    </p>

                    <p className="text-2xl font-bold text-gray-900 mt-1">
                      {wordCount}
                    </p>
                  </div>

                  <div className="rounded-xl bg-gray-50 border border-gray-100 p-4">
                    <p className="text-xs font-semibold text-gray-400 uppercase">
                      Caracteres
                    </p>

                    <p className="text-2xl font-bold text-gray-900 mt-1">
                      {charCount}
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-blue-50 rounded-2xl border border-blue-100 p-5">
                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 rounded-xl bg-blue-600 text-white flex items-center justify-center shrink-0">
                    <Info size={18} />
                  </div>

                  <div>
                    <h3 className="font-bold text-blue-900">
                      Recomendación
                    </h3>

                    <p className="text-sm text-blue-700 leading-relaxed mt-1">
                      La sumilla debe explicar brevemente la naturaleza de la
                      asignatura, sus contenidos centrales y su aporte a la
                      formación del estudiante.
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-yellow-50 rounded-2xl border border-yellow-100 p-5">
                <h3 className="font-bold text-yellow-800 mb-2">
                  Antes de continuar
                </h3>

                <p className="text-sm text-yellow-700 leading-relaxed">
                  Verifica que la sumilla no esté vacía y que sea coherente con
                  los datos generales registrados en el paso anterior.
                </p>
              </div>
            </aside>
          </div>
        </div>
      </div>
    </Step>
  );
}