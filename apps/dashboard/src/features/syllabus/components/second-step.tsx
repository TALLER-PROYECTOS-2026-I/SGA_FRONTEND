import { useState, useEffect } from "react";
import { useSaveSumilla, useSumilla } from "../hooks/second-step-query";
import { useSteps } from "../contexts/steps-context-provider";
import { useSyllabusContext } from "../contexts/syllabus-context";
import { useReviewMode } from "../../coordinator/contexts/review-mode-context";
import { usePermissionsContext } from "../hooks/use-permissions-context";
import { useSyllabusEditLock } from "../hooks/use-syllabus-edit-lock";
import { Step } from "./step";
import { CoordinatorCommentsBanner } from "./coordinator-comments-banner";
import { toast } from "sonner";
import {
  BookOpen,
  FileText,
  Loader2,
  Info,
  X,
  AlertTriangle,
} from "lucide-react";
import { useCreateDraft } from "../create-draft/create-draft-context";
import { useIsDraftCreateMode } from "../create-draft/is-draft-create";

const MIN_SUMMARY_WORDS = 80;

type ReviewSumillaData = {
  sumilla?: string;
  contenido?: string;
  content?: Array<{
    sumilla?: string;
    contenido?: string;
  }>;
};

function validateSummaryText(value: string) {
  const text = value.trim();

  if (!text) {
    return "La sumilla es obligatoria.";
  }

  const words = text.split(/\s+/).filter(Boolean);

  if (words.length < MIN_SUMMARY_WORDS) {
    return `La sumilla debe tener al menos ${MIN_SUMMARY_WORDS} palabras. Actualmente tiene ${words.length}.`;
  }

  return "";
}

/**
 * Paso 2: Sumilla
 *
 * - Modo create/edit: guarda en BD usando POST o PUT.
 * - Modo review: solo muestra datos para revisión, no guarda.
 * - Si no tiene permiso para sección 2, muestra la información pero bloquea edición.
 */
export default function SecondStep() {
  const { nextStep } = useSteps();
  const { courseName } = useSyllabusContext();
  const { isDraftCreateMode, resolvedSyllabusId } = useIsDraftCreateMode();
  const { draft, updateCreateDraft } = useCreateDraft();
  const { isReviewMode, sectionData } = useReviewMode();
  const {
    hasEditPermissionForSection,
    getCommentsForSection,
    isDisapprovedCorrection,
  } = usePermissionsContext();
  const coordinatorComments = getCommentsForSection(2);

  const { isLockedByState, isResolvingState } =
    useSyllabusEditLock(resolvedSyllabusId);

  const canEdit =
    !isReviewMode &&
    hasEditPermissionForSection(2) &&
    !isLockedByState &&
    !isResolvingState;

  const [summary, setSummary] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [apiError, setApiError] = useState("");
  const [hasHydrated, setHasHydrated] = useState(false);

  const {
    data,
    isLoading,
    isFetching,
    isError,
    error,
  } = useSumilla(isDraftCreateMode ? null : resolvedSyllabusId);

  const saveSumilla = useSaveSumilla();

  const hasExistingSumilla = Boolean(
    data &&
      ((data.sumilla || data.contenido || "").trim().length > 0 || data.id),
  );

  const isCreating = !hasExistingSumilla;

  useEffect(() => {
    if (isDraftCreateMode) return;

    setHasHydrated(false);
    setSummary("");
    setErrors({});
    setApiError("");
  }, [resolvedSyllabusId, isDraftCreateMode]);

  useEffect(() => {
    if (!isDraftCreateMode || hasHydrated) return;

    if (draft.sumilla?.trim()) {
      setSummary(draft.sumilla);
    }

    setHasHydrated(true);
  }, [isDraftCreateMode, hasHydrated, draft.sumilla]);

  useEffect(() => {
    if (isDraftCreateMode) return;

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

    if (!data || hasHydrated) return;

    const loadedSummary = data.sumilla || data.contenido || "";

    setSummary(loadedSummary);
    setHasHydrated(true);

    try {
      localStorage.setItem("datos_sumilla", loadedSummary);
    } catch {
      // ignore
    }
  }, [data, isError, error, hasHydrated, isDraftCreateMode]);

  useEffect(() => {
    if (!isReviewMode || !sectionData) return;

    const reviewData = sectionData as ReviewSumillaData;

    const loadedSummary =
      reviewData.sumilla ||
      reviewData.contenido ||
      reviewData.content?.[0]?.sumilla ||
      reviewData.content?.[0]?.contenido ||
      "";

    if (loadedSummary) {
      setSummary(loadedSummary);
      setHasHydrated(true);
    }
  }, [isReviewMode, sectionData]);

  const persistSumillaToServer = async () => {
    if (!canEdit) {
      throw new Error("No tienes permiso para editar la sumilla.");
    }

    if (!resolvedSyllabusId) {
      throw new Error(
        "ID del sílabo no encontrado. Completa el primer paso antes de continuar.",
      );
    }

    await saveSumilla.mutateAsync({
      syllabusId: resolvedSyllabusId,
      data: {
        sumilla: summary.trim(),
      },
      isCreating,
    });

    try {
      localStorage.setItem("datos_sumilla", summary.trim());
    } catch {
      // ignore
    }
  };

  const focusSummaryField = () => {
    const el = document.querySelector(
      'textarea[name="summary"]',
    ) as HTMLElement | null;

    if (el && typeof el.focus === "function") {
      el.focus();
    }
  };

  const validateAndNext = async () => {
    if (isReviewMode) {
      nextStep();
      return;
    }

    if (!canEdit) {
      nextStep();
      return;
    }

    const summaryError = validateSummaryText(summary);

    if (summaryError) {
      setErrors({ summary: summaryError });
      focusSummaryField();
      return;
    }

    setErrors({});
    setApiError("");

    if (isDraftCreateMode) {
      updateCreateDraft({ sumilla: summary.trim() });
      nextStep();
      return;
    }

    if (!resolvedSyllabusId) {
      toast.error("Error", {
        description:
          "ID del sílabo no encontrado. Completa el primer paso antes de continuar.",
      });
      return;
    }

    try {
      await persistSumillaToServer();

      toast.success(
        isCreating
          ? "Sumilla creada exitosamente"
          : "Sumilla actualizada exitosamente",
      );

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
    if (!canEdit) return;

    setSummary("");
    setErrors((prev) => ({ ...prev, summary: "" }));
  };

  const wordCount = summary.trim()
    ? summary.trim().split(/\s+/).filter(Boolean).length
    : 0;

  const charCount = summary.length;
  const wordsRemaining = Math.max(0, MIN_SUMMARY_WORDS - wordCount);
  const meetsMinWords = wordCount >= MIN_SUMMARY_WORDS;

  const isTextareaDisabled =
    isLoading ||
    isFetching ||
    saveSumilla.isPending ||
    isReviewMode ||
    !canEdit ||
    isLockedByState ||
    isResolvingState;

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
          <CoordinatorCommentsBanner
            stepNumber={2}
            comments={coordinatorComments}
          />

          {!canEdit && (
            <div className="mb-6 rounded-xl border border-yellow-300 bg-yellow-50 px-6 py-5 text-yellow-800">
              <div className="flex items-start gap-4">
                <div className="mt-1 flex h-10 w-10 items-center justify-center rounded-xl bg-yellow-500 text-white">
                  <AlertTriangle size={22} />
                </div>

                <div>
                  <p className="font-bold">
                    {isReviewMode ? "Modo revisión" : "Modo solo lectura"}
                  </p>

                  <p className="mt-1 text-sm">
                    {isReviewMode
                      ? "Estás revisando esta sección en modo coordinador. Puedes consultar la sumilla, pero no modificarla."
                      : isDisapprovedCorrection
                        ? "Esta sección no tiene observaciones del coordinador, por eso permanece bloqueada."
                        : "No tienes permiso para editar esta sección. Puedes revisar la sumilla, pero no modificarla."}
                  </p>
                </div>
              </div>
            </div>
          )}

          {(isLoading || isFetching) && (
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
                      if (!canEdit) return;

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

                <p className="text-xs font-semibold text-gray-500 mb-3">
                  Mínimo requerido: {MIN_SUMMARY_WORDS} palabras
                </p>

                <div className="grid grid-cols-2 gap-3">
                  <div
                    className={`rounded-xl border p-4 ${
                      meetsMinWords
                        ? "bg-green-50 border-green-200"
                        : wordCount > 0
                          ? "bg-amber-50 border-amber-200"
                          : "bg-gray-50 border-gray-100"
                    }`}
                  >
                    <p className="text-xs font-semibold text-gray-400 uppercase">
                      Palabras
                    </p>

                    <p
                      className={`text-2xl font-bold mt-1 ${
                        meetsMinWords
                          ? "text-green-700"
                          : wordCount > 0
                            ? "text-amber-700"
                            : "text-gray-900"
                      }`}
                    >
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

                <p
                  className={`text-xs font-medium mt-3 ${
                    meetsMinWords ? "text-green-700" : "text-amber-700"
                  }`}
                >
                  {meetsMinWords
                    ? "Cumple el mínimo requerido."
                    : `Faltan ${wordsRemaining} palabras para cumplir el mínimo.`}
                </p>
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
                      formación del estudiante. Debe tener al menos{" "}
                      {MIN_SUMMARY_WORDS} palabras.
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-yellow-50 rounded-2xl border border-yellow-100 p-5">
                <h3 className="font-bold text-yellow-800 mb-2">
                  Antes de continuar
                </h3>

                <p className="text-sm text-yellow-700 leading-relaxed">
                  Verifica que la sumilla tenga al menos {MIN_SUMMARY_WORDS}{" "}
                  palabras y que sea coherente con los datos generales
                  registrados en el paso anterior.
                </p>
              </div>
            </aside>
          </div>
        </div>
      </div>
    </Step>
  );
}
