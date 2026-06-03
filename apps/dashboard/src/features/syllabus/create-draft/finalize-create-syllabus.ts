import { toast } from "sonner";
import {
  SyllabusCreateConflictError,
  syllabusManager,
} from "../hooks/first-step-query";
import { secondStepManager } from "../hooks/second-step-query";
import { thirdStepManager } from "../hooks/third-step-query";
import { postProgramacionUnit } from "../hooks/fourth-step-query";
import {
  updateDidacticResourcesForSyllabus,
  updateMethodologicalStrategiesForSyllabus,
} from "../hooks/fifth-step-query";
import { sixthStepFormulaManager } from "../hooks/sixth-step-query";
import { seventhStepManager } from "../hooks/seventh-step-query";
import { eighthStepManager } from "../hooks/eighth-step-query";
import {
  buildPayloadFromUnidad,
  validateUnidadesBeforeSave,
} from "../components/fourth-step";
import { buildSyllabusCreatePayloadFromGeneralData } from "./mappers";
import { buildThirdStepPayloadsFromDraft } from "./third-step-payload";
import { draftFuentesToCreatePayload } from "./fuentes-mappers";
import type { SyllabusCreateDraft } from "./types";

export class FinalizeSectionError extends Error {
  readonly sectionLabel: string;
  readonly syllabusId: number;

  constructor(sectionLabel: string, message: string, syllabusId: number) {
    super(message);
    this.name = "FinalizeSectionError";
    this.sectionLabel = sectionLabel;
    this.syllabusId = syllabusId;
  }
}

export type FinalizeCreateSyllabusResult = {
  syllabusId: number;
};

const SECTION_LABELS = {
  general: "datos generales",
  sumilla: "sumilla",
  competencias: "competencias, componentes y actitudes",
  programacion: "programación del contenido",
  estrategias: "estrategias y recursos didácticos",
  evaluacion: "evaluación de aprendizaje",
  fuentes: "fuentes de consulta",
  aportes: "aportes de la asignatura",
} as const;

async function runSection<T>(
  sectionLabel: string,
  syllabusId: number,
  fn: () => Promise<T>,
): Promise<T> {
  try {
    return await fn();
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Error desconocido al guardar";

    throw new FinalizeSectionError(sectionLabel, message, syllabusId);
  }
}

function buildContributionsPayload(draft: SyllabusCreateDraft) {
  const outcomes = draft.contributions ?? [];

  return {
    resultados: outcomes.map((outcome, index) => ({
      id: outcome.id,
      code: outcome.code || `RP${index + 1}`,
      resultadoProgramaCodigo: outcome.code || `RP${index + 1}`,
      description: outcome.description,
      resultadoProgramaDescripcion: outcome.description,
      level: outcome.level || ("" as const),
      aporteValor: outcome.level || ("" as const),
    })),
  };
}

export async function finalizeCreateSyllabus(
  draft: SyllabusCreateDraft,
): Promise<FinalizeCreateSyllabusResult> {
  if (!draft.generalData) {
    throw new Error("Faltan datos generales del paso 1.");
  }

  const { syllabusId } = await syllabusManager.createSyllabusRaw(
    buildSyllabusCreatePayloadFromGeneralData(draft.generalData),
  );

  try {
    if (draft.sumilla?.trim()) {
      await runSection(SECTION_LABELS.sumilla, syllabusId, () =>
        secondStepManager.createSumilla(syllabusId, {
          sumilla: draft.sumilla!.trim(),
        }),
      );
    }

    if (draft.competencias) {
      const payloads = buildThirdStepPayloadsFromDraft(draft.competencias);

      await runSection(SECTION_LABELS.competencias, syllabusId, async () => {
        await thirdStepManager.updateCompetencias(
          syllabusId,
          payloads.competencias,
        );
        await thirdStepManager.updateComponentes(
          syllabusId,
          payloads.componentes,
        );
        await thirdStepManager.updateActitudes(syllabusId, payloads.actitudes);
      });
    }

    if (draft.unidades?.length) {
      await runSection(SECTION_LABELS.programacion, syllabusId, async () => {
        validateUnidadesBeforeSave(draft.unidades!);

        const unidadesAGuardar = draft.unidades!.filter(
          (unidad) => unidad.semanas.length > 0,
        );

        for (const unidad of unidadesAGuardar) {
          const payload = buildPayloadFromUnidad(syllabusId, unidad);
          await postProgramacionUnit(payload);
        }
      });
    }

    const estrategias = draft.methodologicalStrategies ?? [];
    const recursos = draft.didacticResources ?? [];

    if (estrategias.length > 0 || recursos.length > 0) {
      await runSection(SECTION_LABELS.estrategias, syllabusId, async () => {
        if (estrategias.length > 0) {
          await updateMethodologicalStrategiesForSyllabus(
            String(syllabusId),
            estrategias,
          );
        }

        if (recursos.length > 0) {
          await updateDidacticResourcesForSyllabus(String(syllabusId), recursos);
        }
      });
    }

    if (draft.formulaEvaluacion) {
      await runSection(SECTION_LABELS.evaluacion, syllabusId, () =>
        sixthStepFormulaManager.createFormula({
          ...draft.formulaEvaluacion!,
          silaboId: syllabusId,
        }),
      );
    }

    if (draft.fuentes) {
      await runSection(SECTION_LABELS.fuentes, syllabusId, async () => {
        const fuentes = draftFuentesToCreatePayload(draft.fuentes!);

        for (const fuente of fuentes) {
          await seventhStepManager.createFuente(syllabusId, fuente);
        }
      });
    }

    if (draft.contributions?.length) {
      await runSection(SECTION_LABELS.aportes, syllabusId, () =>
        eighthStepManager.createResultados(
          syllabusId,
          buildContributionsPayload(draft),
        ),
      );
    }

    return { syllabusId };
  } catch (error) {
    if (error instanceof SyllabusCreateConflictError) {
      throw error;
    }

    if (error instanceof FinalizeSectionError) {
      toast.error(`No se pudo guardar: ${error.sectionLabel}`, {
        description: `${error.message}. El sílabo base fue creado; puede completar las secciones pendientes en modo edición.`,
        duration: 10000,
      });

      throw error;
    }

    toast.error("Error al crear el sílabo", {
      description:
        error instanceof Error
          ? error.message
          : "El sílabo base pudo haberse creado; revise en modo edición.",
    });

    throw error;
  }
}
