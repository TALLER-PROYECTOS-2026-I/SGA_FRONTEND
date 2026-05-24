/**
 * Mapeo oficial: sección backend (1–9) ↔ paso UI (1–8).
 */
export const SECTION_TO_UI_STEP: Record<number, number> = {
  1: 1,
  2: 2,
  3: 3,
  4: 4,
  5: 5,
  6: 5,
  7: 6,
  8: 7,
  9: 8,
};

/** Secciones backend que habilitan un paso del formulario. */
export const UI_STEP_SECTIONS: Record<number, number[]> = {
  1: [1],
  2: [2],
  3: [3],
  4: [4],
  5: [5, 6],
  6: [7],
  7: [8],
  8: [9],
};

export const SECTION_LABELS: Record<number, string> = {
  1: "Datos generales",
  2: "Sumilla",
  3: "Competencias y componentes",
  4: "Programación del contenido",
  5: "Estrategias metodológicas",
  6: "Recursos didácticos",
  7: "Evaluación del aprendizaje",
  8: "Fuentes de consulta",
  9: "Aporte de la asignatura",
};

export function sectionsToUiSteps(sectionNumbers: number[]): number[] {
  const steps = new Set<number>();

  for (const section of sectionNumbers) {
    const numeroSeccion = Number(section);

    if (Number.isNaN(numeroSeccion)) continue;

    const step = SECTION_TO_UI_STEP[numeroSeccion];

    if (step) {
      steps.add(step);
    }
  }

  return Array.from(steps).sort((a, b) => a - b);
}

export function isUiStepEditable(
  uiStep: number,
  editableUiSteps: number[],
): boolean {
  return editableUiSteps.includes(uiStep);
}
