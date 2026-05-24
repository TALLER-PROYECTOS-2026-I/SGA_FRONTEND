import React from "react";
import {
  PermissionsContext,
  type PermissionsContextType,
} from "./permissions-context-definition";

export const PermissionsProvider: React.FC<
  React.PropsWithChildren<PermissionsContextType>
> = ({ children, hasEditPermissionForSection, allowedSteps }) => {
  return (
    <PermissionsContext.Provider
      value={{ hasEditPermissionForSection, allowedSteps }}
    >
      {children}
    </PermissionsContext.Provider>
  );
};
