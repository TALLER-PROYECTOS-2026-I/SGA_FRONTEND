import type { GeneralData } from "../contexts/syllabus-context";
import type { CreateDraftGeneralData } from "./types";

export type Step1FormState = CreateDraftGeneralData;

export function mapFormToDraftGeneralData(
  form: Step1FormState,
): CreateDraftGeneralData {
  return {
    nombreAsignatura: form.nombreAsignatura,
    departamentoAcademico: form.departamentoAcademico,
    escuelaProfesional: form.escuelaProfesional,
    programaAcademico: form.programaAcademico,
    semestreAcademico: form.semestreAcademico,
    tipoAsignatura: form.tipoAsignatura,
    tipoEstudios: form.tipoEstudios,
    modalidad: form.modalidad,
    codigoAsignatura: form.codigoAsignatura,
    ciclo: form.ciclo,
    requisitos: form.requisitos,
    creditosTeoria: form.creditosTeoria,
    creditosPractica: form.creditosPractica,
    creditosTotal: form.creditosTotal,
    docentes: form.docentes,
    horasTeoria: form.horasTeoria,
    horasPractica: form.horasPractica,
  };
}

export function draftGeneralDataToFormState(
  data: CreateDraftGeneralData,
): Step1FormState {
  return { ...data };
}

export function draftGeneralDataToContextGeneralData(
  data: CreateDraftGeneralData,
): GeneralData {
  return {
    nombreAsignatura: data.nombreAsignatura,
    codigoAsignatura: data.codigoAsignatura,
    departamentoAcademico: data.departamentoAcademico,
    escuelaProfesional: data.escuelaProfesional,
    programaAcademico: data.programaAcademico,
    semestreAcademico: data.semestreAcademico,
    ciclo: data.ciclo,
  };
}

export function buildSyllabusCreatePayloadFromGeneralData(
  general: CreateDraftGeneralData,
): Record<string, unknown> {
  const horasTeoria = Number(general.horasTeoria || 0);
  const horasPractica = Number(general.horasPractica || 0);
  const creditosTeoria = Number(general.creditosTeoria || 0);
  const creditosPractica = Number(general.creditosPractica || 0);
  const rawDocenteId = general.docentes.trim();
  const parsedDocenteId = rawDocenteId ? Number(rawDocenteId) : NaN;
  const docenteId =
    rawDocenteId && Number.isFinite(parsedDocenteId) && parsedDocenteId > 0
      ? parsedDocenteId
      : null;

  const createPayload: Record<string, unknown> = {
    nombreAsignatura: general.nombreAsignatura,
    codigoAsignatura: general.codigoAsignatura,
    departamentoAcademico: general.departamentoAcademico,
    escuelaProfesional: general.escuelaProfesional,
    programaAcademico: general.programaAcademico,
    areaCurricular: "Formación Especializada",
    semestreAcademico: general.semestreAcademico,
    tipoAsignatura: general.tipoAsignatura,
    tipoEstudios: general.tipoEstudios,
    modalidad: general.modalidad,
    modalidadAsignatura: general.modalidad,
    formatoCurso: "Teórico-práctico",
    ciclo: general.ciclo,
    requisitos: general.requisitos,
    horasTeoria,
    horasPractica,
    horasLaboratorio: 0,
    horasTotales: horasTeoria + horasPractica,
    creditosTeoria,
    creditosPractica,
    creditosTotales: creditosTeoria + creditosPractica,
    estadoRevision: "BORRADOR",
    curso_nombre: general.nombreAsignatura,
    curso_codigo: general.codigoAsignatura,
    departamento_academico: general.departamentoAcademico,
    escuela_profesional: general.escuelaProfesional,
    programa_academico: general.programaAcademico,
    area_curricular: "Formación Especializada",
    semestre_academico: general.semestreAcademico,
    tipo_asignatura: general.tipoAsignatura,
    tipo_de_estudios: general.tipoEstudios,
    modalidad_de_asignatura: general.modalidad,
    formato_de_curso: "Teórico-práctico",
    horas_teoria: horasTeoria,
    horas_practica: horasPractica,
    horas_laboratorio: 0,
    creditos_teoria: creditosTeoria,
    creditos_practica: creditosPractica,
    creditos_totales: creditosTeoria + creditosPractica,
    estado_revision: "BORRADOR",
  };

  if (docenteId) {
    createPayload.docenteId = docenteId;
    createPayload.asignadoADocenteId = docenteId;
    createPayload.creadoPorDocenteId = docenteId;
    createPayload.actualizadoPorDocenteId = docenteId;
    createPayload.docente_id = docenteId;
    createPayload.asignado_a_docente_id = docenteId;
    createPayload.creado_por_docente_id = docenteId;
  }

  return createPayload;
}
