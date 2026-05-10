import { createContext } from "react";

export interface PermissionsContextType {
  hasEditPermissionForSection: (sectionNumber: number) => boolean;
  allowedSteps: number[];
}

export const PermissionsContext = createContext<
  PermissionsContextType | undefined
>(undefined);
