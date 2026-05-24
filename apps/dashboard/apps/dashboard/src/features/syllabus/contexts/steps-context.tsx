import React from "react";
import { useStepper } from "../hooks/use-steps";
import { cn } from "../../../common/lib/utils";
import { StepsContext } from "./steps-context-provider";

const StepsProvider: React.FC<
  React.PropsWithChildren<{
    totalSteps: number;
    allowedSteps?: number[]; // Steps permitidos según permisos
  }>
> = ({ children, totalSteps, allowedSteps }) => {
  const stepper = useStepper({
    totalSteps,
    allowedSteps, // Pasar allowedSteps al hook para navegación correcta
  });

  // Si no hay allowedSteps, mostrar todos
  const visibleSteps =
    allowedSteps && allowedSteps.length > 0
      ? allowedSteps
      : Array.from({ length: totalSteps }, (_, i) => i + 1);

  const renderedSteps = React.Children.toArray(children).filter((child) => {
    if (!React.isValidElement(child)) return false;
    const childType = child.type as { name?: string };
    return childType.name === "Step";
  });

  return (
    <StepsContext.Provider value={{ ...stepper, allowedSteps: visibleSteps }}>
      <div className="flex flex-col items-center w-full h-full">
        <div className="flex items-center justify-center mb-8">
          {visibleSteps.map((step, index) => (
            <div key={step} className="flex items-center">
              <div
                className={cn(
                  "w-12 h-12 rounded-full flex items-center justify-center text-lg font-semibold transition-all cursor-pointer",
                  step === stepper.currentStep
                    ? "bg-red-500 text-white"
                    : step < stepper.currentStep
                      ? "bg-gray-400 text-white"
                      : "bg-gray-200 text-gray-600 hover:bg-gray-300",
                )}
                onClick={() => stepper.goToStep(step)}
              >
                {step}
              </div>
              {index < visibleSteps.length - 1 && (
                <div
                  className={cn(
                    "w-8 h-1 mx-2",
                    step < stepper.currentStep ? "bg-gray-400" : "bg-gray-200",
                  )}
                />
              )}
            </div>
          ))}
        </div>
        <div className="flex-1 w-full pb-5">
          {renderedSteps.length > 0 ? renderedSteps : children}
        </div>
      </div>
    </StepsContext.Provider>
  );
};

export default StepsProvider;
