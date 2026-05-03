import { useState, useEffect } from "react";
import { useSaveSumilla, useSumilla } from "../hooks/second-step-query";
import { useSteps } from "../contexts/steps-context-provider";
import { useSyllabusContext } from "../contexts/syllabus-context";
import { useReviewMode } from "../../coordinator/contexts/review-mode-context";
import { Step } from "./step";
import { toast } from "sonner";
import type { SumillaResponse } from "../../coordinator/hooks/syllabus-section-data-query";

/**
 * Paso 2: Formulario de Sumilla con validaciones básicas
 *
 * Lógica de modo:
 * - mode="edit": Consume GET para cargar sumilla existente
 *   - Si GET retorna data: usa PUT para actualizar
 *   - Si GET retorna null (404): usa POST para crear
 * - mode="create": Valida si existe data
 *   - Si GET retorna data: usa PUT para actualizar
 *   - Si GET retorna null: usa POST para crear nuevo registro
 * - mode="review": Carga datos del contexto de revisión (solo lectura con posibilidad de comentarios)
 */
export default function SecondStep() {
  const { nextStep } = useSteps();
  const { syllabusId, mode, courseName } = useSyllabusContext();
  const { isReviewMode, sectionData } = useReviewMode();
  const [summary, setSummary] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [apiError, setApiError] = useState("");

  // Load existing sumilla via query (solo en modo normal, no en revisión)
  const { data, isLoading, isError, error } = useSumilla(
    isReviewMode ? null : syllabusId,
  );
  const saveSumilla = useSaveSumilla();

  // Determina si debe crear (POST) o actualizar (PUT)
  // - En mode="edit": siempre consumir GET primero
  //   - Si GET retorna data: usar PUT
  //   - Si GET retorna null (404): usar POST
  // - En mode="create":
  //   - Si GET retorna data (ya existe): usar PUT
  //   - Si GET retorna null: usar POST
  const isCreating = mode === "edit" ? !data : !data;

  // Efecto para cargar datos desde el API (modo normal)
  useEffect(() => {
    if (isReviewMode) return; // No cargar desde API en modo revisión

    if (isError) {
      const errorMsg = error?.message ?? "Error cargando sumilla";
      // 404 es esperado cuando no existe sumilla aún, no mostrar error
      if (!errorMsg.includes("404")) {
        toast.error("Error al cargar sumilla", {
          description: errorMsg,
        });
      }
      return;
    }
    if (!data) return;
    if (data?.sumilla) {
      setSummary(data.sumilla);
      try {
        localStorage.setItem("datos_sumilla", data.sumilla);
      } catch {
        /* ignore */
      }
    }
  }, [data, isError, error, isReviewMode]);

  // Efecto para cargar datos desde el contexto de revisión
  useEffect(() => {
    if (!isReviewMode || !sectionData) return;

    const reviewData = sectionData as SumillaResponse;
    if (reviewData.content && reviewData.content.length > 0) {
      setSummary(reviewData.content[0].sumilla);
    }
  }, [isReviewMode, sectionData]);

  const validateAndNext = async () => {
    const newErrors: Record<string, string> = {};
    if (!summary.trim()) newErrors.summary = "Campo obligatorio";
    setErrors(newErrors);
    if (Object.keys(newErrors).length === 0) {
      setApiError("");
      const id = syllabusId;
      if (!id) {
        toast.error("Error", {
          description:
            "Id del sílabo no encontrado. Completa el primer paso antes de continuar.",
        });
        return;
      }
      try {
        await saveSumilla.mutateAsync({
          syllabusId: id,
          data: { sumilla: summary },
          isCreating,
        });

        // Mensaje diferenciado según la operación realizada
        const successMessage = isCreating
          ? "Sumilla creada exitosamente"
          : "Sumilla actualizada exitosamente";

        toast.success(successMessage);
        nextStep();
      } catch (err: unknown) {
        // Parsear error estructurado del backend
        if (err instanceof Error) {
          try {
            // Intentar parsear el mensaje como JSON
            const errorData = JSON.parse(err.message);

            if (errorData.data && Array.isArray(errorData.data)) {
              // Mostrar cada error de validación
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
            // Si no es JSON, mostrar el mensaje directamente
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
    } else {
      // enfocar primer campo con error
      if (newErrors.summary) {
        const el = document.querySelector(
          'textarea[name="summary"]',
        ) as HTMLElement | null;
        if (el && typeof el.focus === "function") el.focus();
      }
    }
  };

  return (
    <Step step={2} onNextStep={validateAndNext}>
      <div className="w-full">
        {isLoading && (
          <div className="mb-4 text-sm text-gray-700">Cargando sumilla...</div>
        )}

        <div className="mb-4">
          <div className="flex items-center gap-3 mb-2">
            <div className="text-lg font-bold text-black">1.</div>
            <h3 className="text-lg font-medium text-black">Datos Generales</h3>
            <div className="ml-2 w-6 h-6 rounded-full bg-blue-600 flex items-center justify-center text-white text-xs font-bold">
              i
            </div>
          </div>
          <div className="w-full h-12 rounded-md px-4 flex items-center text-lg bg-blue-50 border border-blue-100">
            {courseName || ""}
          </div>
        </div>

        <div className="mb-2">
          <div className="flex items-center gap-3">
            <div className="text-lg font-bold text-black">2.</div>
            <h3 className="text-lg font-medium text-black">Sumilla</h3>
            <div className="ml-2 w-6 h-6 rounded-full bg-blue-600 flex items-center justify-center text-white text-xs font-bold">
              i
            </div>
          </div>
        </div>

        <div>
          <textarea
            name="summary"
            value={summary}
            onChange={(e) => setSummary(e.target.value)}
            placeholder="Escribe la sumilla aquí..."
            rows={8}
            disabled={isLoading}
            className={`w-full min-h-[160px] rounded-lg px-4 py-4 bg-white border resize-vertical focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.summary ? "border-red-500" : "border-gray-300"} ${isLoading ? "opacity-50 cursor-not-allowed bg-gray-100" : ""}`}
          />
          {errors.summary && (
            <div className="text-red-600 text-sm mt-1">{errors.summary}</div>
          )}
        </div>

        {apiError && (
          <div className="text-red-600 text-sm mt-3">{apiError}</div>
        )}

        {saveSumilla.isPending && (
          <div className="text-sm text-blue-600 mt-3">Guardando sumilla...</div>
        )}
      </div>
    </Step>
  );
}
