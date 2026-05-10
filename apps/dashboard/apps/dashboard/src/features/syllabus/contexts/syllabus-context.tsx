/* eslint-disable react-refresh/only-export-components */
import React, { createContext, useContext, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";

export type SyllabusMode = "create" | "edit";

export interface GeneralData {
  nombreAsignatura: string;
  codigoAsignatura: string;
  departamentoAcademico: string;
  escuelaProfesional: string;
  programaAcademico: string;
  semestreAcademico: string;
  ciclo: string;
}

interface SyllabusContextType {
  cursoCodigo: string | null;
  syllabusId: number | null;
  setSyllabusId: (id: number | null) => void;
  mode: SyllabusMode;
  courseName: string;
  setCourseName: (name: string) => void;
  generalData: GeneralData | null;
  setGeneralData: (data: GeneralData) => void;
}

const SyllabusContext = createContext<SyllabusContextType | undefined>(
  undefined,
);

export const useSyllabusContext = () => {
  const context = useContext(SyllabusContext);

  if (!context) {
    throw new Error(
      "useSyllabusContext must be used within a SyllabusProvider",
    );
  }

  return context;
};

interface SyllabusProviderProps {
  children: React.ReactNode;
}

export const SyllabusProvider: React.FC<SyllabusProviderProps> = ({
  children,
}) => {
  const [searchParams] = useSearchParams();

  const [courseName, setCourseName] = useState<string>("");
  const [generalData, setGeneralData] = useState<GeneralData | null>(null);
  const [syllabusIdState, setSyllabusIdState] = useState<number | null>(null);

  const cursoCodigo = useMemo(() => searchParams.get("codigo"), [searchParams]);

  const syllabusIdFromUrl = useMemo(() => {
    const id = searchParams.get("id");
    return id ? parseInt(id, 10) : null;
  }, [searchParams]);

  const syllabusId = syllabusIdState ?? syllabusIdFromUrl;

  const setSyllabusId = (id: number | null) => {
    setSyllabusIdState(id);
  };

  const mode = useMemo(() => {
    const modeParam = searchParams.get("mode");
    return (modeParam === "edit" ? "edit" : "create") as SyllabusMode;
  }, [searchParams]);

  const value = useMemo(
    () => ({
      cursoCodigo,
      syllabusId,
      setSyllabusId,
      mode,
      courseName,
      setCourseName,
      generalData,
      setGeneralData,
    }),
    [cursoCodigo, syllabusId, mode, courseName, generalData],
  );

  return (
    <SyllabusContext.Provider value={value}>
      {children}
    </SyllabusContext.Provider>
  );
};