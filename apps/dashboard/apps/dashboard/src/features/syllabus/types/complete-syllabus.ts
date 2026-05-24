// Tipos para el sílabo completo según el backend

export interface DatosGenerales {
  nombreAsignatura?: string;
  departamentoAcademico?: string;
  escuelaProfesional?: string;
  programaAcademico?: string;
  semestreAcademico?: string;
  tipoAsignatura?: string;
  tipoEstudios?: string;
  modalidad?: string;
  codigoAsignatura?: string;
  ciclo?: string;
  requisitos?: string;
  creditosTeoria?: number;
  creditosPractica?: number;
  creditosTotales?: number;
  docentes?: string;
  horasTeoria?: number;
  horasPractica?: number;
  horasTotales?: number;
  areaCurricular?: string | null;
}

export interface CompetenciaCurso {
  id: number;
  codigo: string;
  descripcion: string;
  orden: number;
}

export interface ComponenteCompetencia {
  id: number;
  silaboId: number;
  grupo: "COMP" | "PROC" | "ACT";
  codigo: string;
  descripcion: string;
  orden: number;
}

export interface ResultadoAprendizaje {
  id: number;
  silaboId: number;
  descripcion: string;
  orden: number;
}

export interface SemanaUnidad {
  id: number;
  silaboUnidadId: number;
  semana: number;
  contenidosConceptuales?: string;
  contenidosProcedimentales?: string;
  actividadesAprendizaje?: string;
  horasLectivasTeoria?: number;
  horasLectivasPractica?: number;
  horasNoLectivasTeoria?: number;
  horasNoLectivasPractica?: number;
  creadoEn?: string;
  actualizadoEn?: string;
}

export interface UnidadDidactica {
  id: number;
  silaboId: number;
  numero: number;
  titulo: string;
  capacidadesText?: string;
  contenidosConceptuales?: string;
  contenidosProcedimentales?: string;
  actividadesAprendizaje?: string;
  horasLectivasTeoria?: number;
  horasLectivasPractica?: number;
  horasNoLectivasTeoria?: number;
  horasNoLectivasPractica?: number;
  semanas?: SemanaUnidad[];
}

export interface EstrategiaMetodologica {
  nombre: string;
  descripcion: string;
}

export interface NotaRecurso {
  nombre: string;
  descripcion: string;
}

export interface RecursoDidactico {
  id: number;
  recursoId: number;
  recursoNombre: string;
  destino: string;
  observaciones?: string;
}

export interface RecursosDidacticos {
  notas?: NotaRecurso[];
  recursos?: RecursoDidactico[];
}

export interface PlanEvaluacionItem {
  id: number;
  silaboId: number;
  componenteNombre: string;
  instrumentoNombre: string;
  semana: number;
  fecha?: string | null;
  instrucciones?: string;
  rubricaUrl?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface VariableFormula {
  codigo: string;
  nombre: string;
  tipo: string;
  descripcion: string;
  orden: number;
}

export interface Subformula {
  variableCodigo: string;
  expresion: string;
}

export interface VariablePlanMapping {
  variableCodigo: string;
  planEvaluacionOfertaId: number;
}

export interface FormulaEvaluacion {
  id: number;
  silaboId: number;
  nombreRegla: string;
  variableFinalCodigo: string;
  expresionFinal: string;
  activo: boolean;
  variables?: VariableFormula[];
  subformulas?: Subformula[];
  variablePlanMappings?: VariablePlanMapping[];
  planesEvaluacion?: PlanEvaluacionItem[];
}

export interface EvaluacionAprendizaje {
  planEvaluacion?: PlanEvaluacionItem[];
  formulaEvaluacion?: FormulaEvaluacion;
  // Campos antiguos para compatibilidad
  descripcion?: string;
  formulaPF?: string;
  componentesPF?: ComponenteEvaluacion[];
  descripcionPE?: string;
  formulaPE?: string;
  componentesPE?: ComponenteEvaluacion[];
}

export interface FuenteInformacion {
  id: number;
  tipo: "LIBRO" | "ART" | "WEB" | "OTRO";
  autores: string;
  anio?: number;
  titulo: string;
  editorial?: string;
  ciudad?: string | null;
  isbn?: string | null;
  url?: string | null;
  notas?: string | null;
}

export interface AporteResultadoPrograma {
  silaboId?: number;
  resultadoCodigo: string;
  resultadoDescripcion: string;
  aporteValor: "K" | "R" | "";
}

export interface ComponenteEvaluacion {
  codigo: string;
  descripcion: string;
}

export interface EvaluacionAprendizaje {
  descripcion?: string;
  formulaPF?: string;
  componentesPF?: ComponenteEvaluacion[];
  descripcionPE?: string;
  formulaPE?: string;
  componentesPE?: ComponenteEvaluacion[];
}

export interface CompleteSyllabus {
  datosGenerales: DatosGenerales;
  sumilla: string | null;
  competenciasCurso: CompetenciaCurso[];
  componentesConceptuales: ComponenteCompetencia[];
  componentesProcedimentales: ComponenteCompetencia[];
  componentesActitudinales: ComponenteCompetencia[];
  resultadosAprendizaje: ResultadoAprendizaje[];
  unidadesDidacticas: UnidadDidactica[];
  estrategiasMetodologicas: EstrategiaMetodologica[];
  recursosDidacticos: RecursosDidacticos;
  evaluacionAprendizaje: EvaluacionAprendizaje;
  fuentes: FuenteInformacion[];
  aportesResultadosPrograma: AporteResultadoPrograma[];
}
