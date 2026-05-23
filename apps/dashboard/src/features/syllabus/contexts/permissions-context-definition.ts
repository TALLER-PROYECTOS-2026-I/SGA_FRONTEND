import { createContext } from "react";

export interface PermissionsProviderProps {
  /** Recibe el número de paso UI (1–8), no la sección backend. */
  hasEditPermissionForSection: (uiStep: number) => boolean;
  allowedSteps: number[];
  commentsByStep?: Record<number, string[]>;
  isDisapprovedCorrection?: boolean;
  rejectedUiSteps?: number[];
}

export interface PermissionsContextType extends PermissionsProviderProps {
  getCommentsForSection: (uiStep: number) => string[];
  canEditUiStep: (uiStep: number) => boolean;
}

export const PermissionsContext = createContext<
  PermissionsContextType | undefined
>(undefined);
