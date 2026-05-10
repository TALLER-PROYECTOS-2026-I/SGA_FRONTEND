// Syllabus feature exports

// Components
export { DownloadPDFButton } from "./components/download-pdf-button";
export { SyllabusGeneratePDF } from "./components/SyllabusGeneratePDF";
export { SyllabusGeneratePDFBackend } from "./components/SyllabusGeneratePDFBackend";
export { SyllabusPDFDocument } from "./components/SyllabusPDFDocument";

// Hooks
export { useSyllabusPDF } from "./hooks/use-syllabus-pdf";
export { usePermissionsContext } from "./hooks/use-permissions-context";

// Services
export { syllabusPDFService } from "./services/syllabus-pdf-service";

// Mocks
export { mockSyllabusData } from "./mocks/syllabus-mock-data";

// Types
export type {
  CompleteSyllabus,
  DatosGenerales,
  CompetenciaCurso,
  ComponenteCompetencia,
  ResultadoAprendizaje,
  UnidadDidactica,
  SemanaUnidad,
  RecursoDidactico,
  RecursosDidacticos,
  EstrategiaMetodologica,
  PlanEvaluacionItem,
  FormulaEvaluacion,
  FuenteInformacion,
  AporteResultadoPrograma,
} from "./types/complete-syllabus";
