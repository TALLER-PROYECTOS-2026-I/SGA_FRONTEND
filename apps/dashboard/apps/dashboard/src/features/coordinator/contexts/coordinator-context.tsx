/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useState } from "react";
import type { ReactNode } from "react";

type ViewMode = "MICRO" | "MACRO";

interface CoordinatorContextType {
  viewMode: ViewMode;
  setViewMode: (mode: ViewMode) => void;
  selectedDocenteId: number | null;
  setSelectedDocenteId: (id: number | null) => void;
  selectedSilaboId: number | null;
  setSelectedSilaboId: (id: number | null) => void;
  selectedDocenteName: string | null;
  setSelectedDocenteName: (name: string | null) => void;
  selectedDocenteEmail: string | null;
  setSelectedDocenteEmail: (email: string | null) => void;
  selectedCourseName: string | null;
  setSelectedCourseName: (name: string | null) => void;
  selectedCourseCode: string | null;
  setSelectedCourseCode: (code: string | null) => void;
}

const CoordinatorContext = createContext<CoordinatorContextType | undefined>(
  undefined,
);

export function CoordinatorProvider({ children }: { children: ReactNode }) {
  const [viewMode, setViewModeState] = useState<ViewMode>(() => {
    const saved = localStorage.getItem("coordinatorViewMode");
    return (saved as ViewMode) || "MICRO";
  });
  const [selectedDocenteId, setSelectedDocenteId] = useState<number | null>(
    null,
  );
  const [selectedSilaboId, setSelectedSilaboId] = useState<number | null>(null);
  const [selectedDocenteName, setSelectedDocenteName] = useState<string | null>(
    null,
  );
  const [selectedDocenteEmail, setSelectedDocenteEmail] = useState<
    string | null
  >(null);
  const [selectedCourseName, setSelectedCourseName] = useState<string | null>(
    null,
  );
  const [selectedCourseCode, setSelectedCourseCode] = useState<string | null>(
    null,
  );

  const setViewMode = (mode: ViewMode) => {
    setViewModeState(mode);
    localStorage.setItem("coordinatorViewMode", mode);
  };

  return (
    <CoordinatorContext.Provider
      value={{
        viewMode,
        setViewMode,
        selectedDocenteId,
        setSelectedDocenteId,
        selectedSilaboId,
        setSelectedSilaboId,
        selectedDocenteName,
        setSelectedDocenteName,
        selectedDocenteEmail,
        setSelectedDocenteEmail,
        selectedCourseName,
        setSelectedCourseName,
        selectedCourseCode,
        setSelectedCourseCode,
      }}
    >
      {children}
    </CoordinatorContext.Provider>
  );
}

export function useCoordinator() {
  const context = useContext(CoordinatorContext);
  if (context === undefined) {
    throw new Error("useCoordinator must be used within a CoordinatorProvider");
  }
  return context;
}
