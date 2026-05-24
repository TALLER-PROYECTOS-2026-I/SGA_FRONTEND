import type {
  DidacticResource,
  MethodologicalStrategy,
} from "../hooks/fifth-step-query";
import type { UnidadProgramacion } from "../hooks/fourth-step-query";
import type { FormulaEvaluacionCreate } from "../hooks/sixth-step-query";

export const CREATE_DRAFT_STORAGE_KEY = "syllabus-create-draft";

export type CreateDraftGeneralData = {
  nombreAsignatura: string;
  departamentoAcademico: string;
  escuelaProfesional: string;
  programaAcademico: string;
  semestreAcademico: string;
  tipoAsignatura: string;
  tipoEstudios: string;
  modalidad: string;
  codigoAsignatura: string;
  ciclo: string;
  requisitos: string;
  creditosTeoria: string;
  creditosPractica: string;
  creditosTotal: string;
  docentes: string;
  horasTeoria: string;
  horasPractica: string;
};

export type DraftThirdStepItem = {
  id: string;
  text: string;
  code: string;
};

export type DraftThirdStepData = {
  competencias: DraftThirdStepItem[];
  componentes: DraftThirdStepItem[];
  contenidosActitudinales: DraftThirdStepItem[];
  showCodes?: boolean;
};

export type DraftBibliography = {
  id: number;
  tipo: "LIBRO" | "ART";
  authors: string;
  year: string;
  title: string;
};

export type DraftElectronicResource = {
  id: number;
  source: string;
  year: string;
  url: string;
};

export type DraftFuentesData = {
  bibliographies: DraftBibliography[];
  electronicResources: DraftElectronicResource[];
};

export type DraftStudentOutcome = {
  id: number;
  code: string;
  description: string;
  level: "K" | "R" | "";
};

export type SyllabusCreateDraft = {
  version: 1;
  generalData: CreateDraftGeneralData | null;
  sumilla?: string | null;
  competencias?: DraftThirdStepData | null;
  unidades?: UnidadProgramacion[] | null;
  methodologicalStrategies?: MethodologicalStrategy[] | null;
  didacticResources?: DidacticResource[] | null;
  formulaEvaluacion?: FormulaEvaluacionCreate | null;
  fuentes?: DraftFuentesData | null;
  contributions?: DraftStudentOutcome[] | null;
  updatedAt: string;
};

