import { useSteps } from "../contexts/steps-context-provider";
import { useReviewMode } from "../../coordinator/contexts/review-mode-context";
import { ReviewButtons } from "../../coordinator/components/review-buttons";
import StepControls from "./step-controls";

type StepProps = {
  step: number;
  onNextStep: () => void;
  children: React.ReactNode;
  hideControls?: boolean;
};

// Mapeo de nombres de pasos para los IDs de revisión
const stepNames: Record<number, string> = {
  1: "Datos generales",
  2: "Sumilla",
  3: "Competencias y componentes",
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
  const { isReviewMode, onFieldReview, onFieldComment, reviewData } =
    useReviewMode();

  if (currentStep !== step) return null;

  // ID único para la revisión de este paso completo
  const stepFieldId = `step-${step}`;
  const fieldReviewData = reviewData?.[stepFieldId];

  return (
    <div className="h-full flex flex-col justify-center">
      <div className="h-full w-full">{children}</div>

      {/* Botones de revisión general del paso */}
      {isReviewMode && (
        <div className="mt-6 pt-6 border-t-2 border-gray-300">
          <div className="flex items-center justify-between bg-gray-50 p-4 rounded-lg">
            <div className="flex items-center gap-3">
              <span className="text-sm font-semibold text-gray-700">
                Revisión del paso completo:
              </span>
              <span className="text-sm text-gray-600">
                {stepNames[step] || `Paso ${step}`}
              </span>
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

      <StepControls onNextStep={onNextStep} hideControls={hideControls} />
    </div>
  );
};
