import { useContext } from "react";
import { PermissionsContext } from "../contexts/permissions-context-definition";

export const usePermissionsContext = () => {
  const context = useContext(PermissionsContext);
  if (!context) {
    throw new Error(
      "usePermissionsContext must be used within PermissionsProvider",
    );
  }
  return context;
};
