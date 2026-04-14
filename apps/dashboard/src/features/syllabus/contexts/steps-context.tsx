import React from "react";
import { useStepper } from "../hooks/use-steps";
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
      <div className="flex flex-col w-full h-full">
        {/* Aquí renderizamos directamente los hijos (tu nuevo Header y los Pasos) sin la barra vieja */}
        <div className="flex-1 w-full pb-5">
          {renderedSteps.length > 0 ? renderedSteps : children}
        </div>
      </div>
    </StepsContext.Provider>
  );
};

export default StepsProvider;