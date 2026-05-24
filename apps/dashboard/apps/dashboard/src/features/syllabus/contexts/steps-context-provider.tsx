import React from "react";
import { useStepper } from "../hooks/use-steps";

type StepsContextType = ReturnType<typeof useStepper> & {
  allowedSteps?: number[];
};

export const StepsContext = React.createContext({} as StepsContextType);

export const useSteps = () => React.useContext(StepsContext);
