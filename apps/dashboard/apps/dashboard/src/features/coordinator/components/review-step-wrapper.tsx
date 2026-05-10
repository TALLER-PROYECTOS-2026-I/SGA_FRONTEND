import React from "react";

interface ReviewStepWrapperProps {
  children: React.ReactNode;
}

/**
 * Este componente envuelve un paso del formulario.
 *
 * NOTA: La lógica de wrapping se hace directamente en los componentes de paso
 * usando ReviewFieldWrapper.
 */
export const ReviewStepWrapper: React.FC<ReviewStepWrapperProps> = ({
  children,
}) => {
  return <>{children}</>;
};
