import { useSteps } from "../contexts/steps-context-provider";
import { useReviewMode } from "../../coordinator/contexts/review-mode-context";
import { ReviewButtons } from "../../coordinator/components/review-buttons";
import StepControls from "./step-controls";
import { ClipboardCheck } from "lucide-react";

type StepProps = {
  step: number;
  onNextStep: () => void;
  children: React.ReactNode;
  hideControls?: boolean;
  disableNext?: boolean;
};

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
  disableNext = false,
}: StepProps) => {
  const { currentStep } = useSteps();
  const { isReviewMode, onFieldReview, onFieldComment, reviewData } =
    useReviewMode();

  if (currentStep !== step) return null;

  const stepFieldId = `step-${step}`;
  const fieldReviewData = reviewData?.[stepFieldId];

  return (
    <div className="w-full">
      <div className="w-full">{children}</div>

      {isReviewMode && (
        <div className="mt-8 rounded-2xl border border-gray-100 bg-white shadow-md overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 bg-gray-50">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-red-600 text-white flex items-center justify-center shadow-sm">
                <ClipboardCheck size={20} />
              </div>

              <div>
                <h3 className="text-lg font-bold text-gray-900">
                  Revisión del paso completo
                </h3>
                <p className="text-sm text-gray-500 mt-1">
                  {stepNames[step] || `Paso ${step}`}
                </p>
              </div>
            </div>
          </div>

          <div className="p-6">
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

      <StepControls
        onNextStep={onNextStep}
        hideControls={hideControls || isReviewMode}
        disableNext={disableNext}
      />
    </div>
  );
};
