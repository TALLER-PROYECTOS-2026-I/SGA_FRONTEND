import { useSteps } from "../contexts/steps-context-provider";
import { useReviewMode } from "../../coordinator/contexts/review-mode-context";
import { ReviewButtons } from "../../coordinator/components/review-buttons";

type StepProps = {
  step: number;
  onNextStep: () => void;
  children: React.ReactNode;
  hideControls?: boolean;
};

// Mapeo de nombres de pasos para los IDs de revisión
const stepNames: Record<number, string> = {
  1: "Datos generales",
  2: "Contenidos Conceptuales", // <-- Actualizado según tu HU
  3: "Fórmulas de Calificación",
  4: "Programación del contenido",
  5: "Estrategias metodológicas y recursos didácticos",
  6: "Evaluación de aprendizaje",
  7: "Fuentes de consulta",
  8: "Resultados (outcomes)",
};

export const Step = ({
  step,
  children,
  onNextStep,
  hideControls = false,
}: StepProps) => {
  const { currentStep } = useSteps();
  const { isReviewMode, onFieldReview, onFieldComment, reviewData } = useReviewMode();

  // EL CAMBIO VISUAL MÁGICO: 
  // Si el paso es "del futuro", lo ocultamos. Si es el actual o del pasado, lo mostramos.
  if (step > currentStep) return null;

  const isCurrentActive = currentStep === step;

  // ID único para la revisión
  const stepFieldId = `step-${step}`;
  const fieldReviewData = reviewData?.[stepFieldId];

  return (
    <div className="flex flex-col justify-center mb-8">
      {/* Si es un paso anterior, lo mostramos pero le bajamos un poco la opacidad para que resalte el activo */}
      <div className={`w-full transition-opacity duration-300 ${!isCurrentActive ? "opacity-70 pointer-events-none" : ""}`}>
        {children}
      </div>

      {isReviewMode && (
        <div className="mt-6 pt-6 border-t-2 border-gray-300">
          <div className="flex items-center justify-between bg-gray-50 p-4 rounded-lg">
            <div className="flex items-center gap-3">
              <span className="text-sm font-semibold text-gray-700">Revisión del paso completo:</span>
              <span className="text-sm text-gray-600">{stepNames[step] || `Paso ${step}`}</span>
            </div>
            <ReviewButtons
              fieldId={stepFieldId}
              onStatusChange={onFieldReview}
              onCommentChange={onFieldComment}
              initialStatus={fieldReviewData?.status || null}
              initialComment={fieldReviewData?.comment || ""}
            />
          </div>
        </div>
      )}

      {/* LOS BOTONES SOLO APARECEN EN EL PASO ACTIVO */}
      {isCurrentActive && !hideControls && (
        <div className="flex justify-between mt-4 border-t pt-4">
          <button 
            onClick={() => window.history.back()} 
            className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 bg-white hover:bg-gray-50 font-medium"
          >
            ← Anterior
          </button>
          <button 
            onClick={onNextStep} 
            className="px-6 py-2 bg-[#b91c1c] text-white rounded-md hover:bg-red-800 font-medium flex items-center gap-2 transition-transform hover:scale-105"
          >
            Siguiente →
          </button>
        </div>
      )}
    </div>
  );
};