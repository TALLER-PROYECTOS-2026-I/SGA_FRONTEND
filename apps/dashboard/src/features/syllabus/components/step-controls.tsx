import type React from "react";
import { ArrowLeft, ArrowRight, FileCheck, Send } from "lucide-react";
import { useSteps } from "../contexts/steps-context-provider";
import { useIsDraftCreateMode } from "../create-draft/is-draft-create";

const StepControls: React.FC<{
  onNextStep: () => void;
  hideControls?: boolean;
  disableNext?: boolean;
}> = ({ onNextStep, hideControls = false, disableNext = false }) => {
  const { prevStep, isFirst, isLast, currentStep, allowedSteps } = useSteps();
  const { isDraftCreateMode } = useIsDraftCreateMode();

  if (hideControls) {
    return null;
  }

  const lastAllowedStep =
    allowedSteps && allowedSteps.length > 0
      ? Math.max(...allowedSteps)
      : currentStep;

  const isLastAllowedStep = currentStep === lastAllowedStep;

  const isNextDisabled = disableNext || (!isLastAllowedStep && isLast);

  return (
    <div className="mt-8 border-t border-gray-100 pt-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <button
          type="button"
          onClick={prevStep}
          disabled={isFirst}
          className="h-11 px-6 bg-gray-900 text-white rounded-xl hover:bg-gray-800 transition-colors disabled:bg-gray-200 disabled:text-gray-400 disabled:cursor-not-allowed flex items-center justify-center gap-2 font-semibold shadow-sm"
        >
          <ArrowLeft size={18} />
          Atrás
        </button>

        <button
          type="button"
          onClick={onNextStep}
          disabled={isNextDisabled}
          className={`h-11 px-8 rounded-xl transition-colors disabled:bg-gray-300 disabled:text-gray-500 disabled:cursor-not-allowed flex items-center justify-center gap-2 font-semibold shadow-sm ${
            isLastAllowedStep
              ? "bg-green-600 hover:bg-green-700 text-white"
              : "bg-red-600 hover:bg-red-700 text-white"
          }`}
        >
          {isLastAllowedStep ? (
            isDraftCreateMode ? (
              <>
                <FileCheck size={18} />
                Crear sílabo
              </>
            ) : (
              <>
                <Send size={18} />
                Finalizar y Enviar a Revisión
              </>
            )
          ) : (
            <>
              Siguiente
              <ArrowRight size={18} />
            </>
          )}
        </button>
      </div>
    </div>
  );
};

export default StepControls;
