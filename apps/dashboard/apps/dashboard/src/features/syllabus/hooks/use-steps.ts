import React from "react";

interface UseStepperOptions {
  initialStep?: number;
  totalSteps: number;
  allowedSteps?: number[];
}

export function useStepper({
  initialStep = 1,
  totalSteps,
  allowedSteps,
}: UseStepperOptions) {
  const [currentStep, setCurrentStep] = React.useState(initialStep);

  // Si hay allowedSteps, usarlos; sino, crear array secuencial
  const stepsArray = React.useMemo(() => {
    if (allowedSteps && allowedSteps.length > 0) {
      return allowedSteps.sort((a, b) => a - b);
    }
    return Array.from({ length: totalSteps }, (_, i) => i + 1);
  }, [allowedSteps, totalSteps]);

  // Encontrar el índice actual en el array de steps permitidos
  const currentIndex = React.useMemo(() => {
    return stepsArray.indexOf(currentStep);
  }, [stepsArray, currentStep]);

  const nextStep = React.useCallback(() => {
    const nextIndex = currentIndex + 1;
    if (nextIndex < stepsArray.length) {
      setCurrentStep(stepsArray[nextIndex]);
    }
  }, [currentIndex, stepsArray]);

  const prevStep = React.useCallback(() => {
    const prevIndex = currentIndex - 1;
    if (prevIndex >= 0) {
      setCurrentStep(stepsArray[prevIndex]);
    }
  }, [currentIndex, stepsArray]);

  const goToStep = React.useCallback(
    (step: number) => {
      if (stepsArray.includes(step)) {
        setCurrentStep(step);
      }
    },
    [stepsArray],
  );

  const reset = React.useCallback(() => {
    setCurrentStep(initialStep);
  }, [initialStep]);

  // Determinar si es el primero o último step permitido
  const isFirst = currentIndex === 0;
  const isLast = currentIndex === stepsArray.length - 1;

  return {
    currentStep,
    isFirst,
    isLast,
    nextStep,
    prevStep,
    goToStep,
    reset,
  };
}
