import React from "react";
import {
  PermissionsContext,
  type PermissionsProviderProps,
} from "./permissions-context-definition";

export const PermissionsProvider: React.FC<
  React.PropsWithChildren<PermissionsProviderProps>
> = ({
  children,
  hasEditPermissionForSection,
  allowedSteps,
  commentsByStep = {},
  isDisapprovedCorrection = false,
  rejectedUiSteps = [],
}) => {
  const getCommentsForSection = (uiStep: number) => {
    return commentsByStep?.[uiStep] ?? [];
  };

  const canEditUiStep = (uiStep: number) => hasEditPermissionForSection(uiStep);

  return (
    <PermissionsContext.Provider
      value={{
        hasEditPermissionForSection,
        allowedSteps,
        commentsByStep,
        getCommentsForSection,
        isDisapprovedCorrection,
        rejectedUiSteps,
        canEditUiStep,
      }}
    >
      {children}
    </PermissionsContext.Provider>
  );
};
