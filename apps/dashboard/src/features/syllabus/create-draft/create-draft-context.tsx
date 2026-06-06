/* eslint-disable react-refresh/only-export-components */
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { useSearchParams } from "react-router-dom";
import { useSyllabusContext } from "../contexts/syllabus-context";
import {
  clearCreateDraftStorage,
  createEmptyDraft,
  loadCreateDraft,
  saveCreateDraft,
} from "./storage";
import { isDraftCreate, resolveSyllabusIdFromSources } from "./is-draft-create";
import type {
  CreateDraftGeneralData,
  DraftFuentesData,
  DraftStudentOutcome,
  DraftThirdStepData,
  SyllabusCreateDraft,
} from "./types";
import type {
  DidacticResource,
  MethodologicalStrategy,
} from "../hooks/fifth-step-query";
import type { UnidadProgramacion } from "../hooks/fourth-step-query";
import type { FormulaEvaluacionCreate } from "../hooks/sixth-step-query";

type CreateDraftContextValue = {
  draft: SyllabusCreateDraft;
  updateCreateDraft: (patch: Partial<SyllabusCreateDraft>) => void;
  setGeneralData: (generalData: CreateDraftGeneralData) => void;
  setThirdStepData: (data: DraftThirdStepData) => void;
  setFourthStepData: (unidades: UnidadProgramacion[]) => void;
  setFifthStepData: (data: {
    methodologicalStrategies: MethodologicalStrategy[];
    didacticResources: DidacticResource[];
  }) => void;
  setSixthStepData: (formulaEvaluacion: FormulaEvaluacionCreate) => void;
  setSeventhStepData: (fuentes: DraftFuentesData) => void;
  setEighthStepData: (contributions: DraftStudentOutcome[]) => void;
  clearCreateDraft: () => void;
};

const noop = () => undefined;

const FALLBACK_CREATE_DRAFT_VALUE: CreateDraftContextValue = {
  draft: createEmptyDraft(),
  updateCreateDraft: noop,
  setGeneralData: noop,
  setThirdStepData: noop,
  setFourthStepData: noop,
  setFifthStepData: noop,
  setSixthStepData: noop,
  setSeventhStepData: noop,
  setEighthStepData: noop,
  clearCreateDraft: noop,
};

const CreateDraftContext = createContext<CreateDraftContextValue | null>(null);

function shouldStartFreshCreateDraft(
  mode: string,
  syllabusId: number | null,
  searchParams: URLSearchParams,
): boolean {
  const resolvedSyllabusId = resolveSyllabusIdFromSources(
    syllabusId,
    searchParams,
  );

  if (!isDraftCreate({ mode, resolvedSyllabusId })) {
    return false;
  }

  return searchParams.get("resumeDraft") !== "true";
}

function readInitialDraft(startFresh: boolean): SyllabusCreateDraft {
  if (startFresh) {
    clearCreateDraftStorage();
    return createEmptyDraft();
  }

  return loadCreateDraft() ?? createEmptyDraft();
}

export function CreateDraftProvider({ children }: { children: ReactNode }) {
  const { mode, syllabusId } = useSyllabusContext();
  const [searchParams] = useSearchParams();

  const startFresh = shouldStartFreshCreateDraft(
    mode,
    syllabusId,
    searchParams,
  );

  const [draft, setDraft] = useState<SyllabusCreateDraft>(() =>
    readInitialDraft(startFresh),
  );

  useEffect(() => {
    if (!startFresh) return;

    clearCreateDraftStorage();
    setDraft(createEmptyDraft());
  }, [startFresh]);

  const updateCreateDraft = useCallback(
    (patch: Partial<SyllabusCreateDraft>) => {
      setDraft((prev) => {
        const next: SyllabusCreateDraft = {
          ...prev,
          ...patch,
          updatedAt: new Date().toISOString(),
        };
        saveCreateDraft(next);
        return next;
      });
    },
    [],
  );

  const setGeneralData = useCallback(
    (generalData: CreateDraftGeneralData) => {
      updateCreateDraft({ generalData });
    },
    [updateCreateDraft],
  );

  const setThirdStepData = useCallback(
    (competencias: DraftThirdStepData) => {
      updateCreateDraft({ competencias });
    },
    [updateCreateDraft],
  );

  const setFourthStepData = useCallback(
    (unidades: UnidadProgramacion[]) => {
      updateCreateDraft({ unidades });
    },
    [updateCreateDraft],
  );

  const setFifthStepData = useCallback(
    (data: {
      methodologicalStrategies: MethodologicalStrategy[];
      didacticResources: DidacticResource[];
    }) => {
      updateCreateDraft({
        methodologicalStrategies: data.methodologicalStrategies,
        didacticResources: data.didacticResources,
      });
    },
    [updateCreateDraft],
  );

  const setSixthStepData = useCallback(
    (formulaEvaluacion: FormulaEvaluacionCreate) => {
      updateCreateDraft({ formulaEvaluacion });
    },
    [updateCreateDraft],
  );

  const setSeventhStepData = useCallback(
    (fuentes: DraftFuentesData) => {
      updateCreateDraft({ fuentes });
    },
    [updateCreateDraft],
  );

  const setEighthStepData = useCallback(
    (contributions: DraftStudentOutcome[]) => {
      updateCreateDraft({ contributions });
    },
    [updateCreateDraft],
  );

  const clearCreateDraft = useCallback(() => {
    clearCreateDraftStorage();
    setDraft(createEmptyDraft());
  }, []);

  const value = useMemo(
    () => ({
      draft,
      updateCreateDraft,
      setGeneralData,
      setThirdStepData,
      setFourthStepData,
      setFifthStepData,
      setSixthStepData,
      setSeventhStepData,
      setEighthStepData,
      clearCreateDraft,
    }),
    [
      draft,
      updateCreateDraft,
      setGeneralData,
      setThirdStepData,
      setFourthStepData,
      setFifthStepData,
      setSixthStepData,
      setSeventhStepData,
      setEighthStepData,
      clearCreateDraft,
    ],
  );

  return (
    <CreateDraftContext.Provider value={value}>
      {children}
    </CreateDraftContext.Provider>
  );
}

export function useCreateDraft() {
  return useContext(CreateDraftContext) ?? FALLBACK_CREATE_DRAFT_VALUE;
}

export function useHasCreateDraftProvider(): boolean {
  return useContext(CreateDraftContext) !== null;
}
