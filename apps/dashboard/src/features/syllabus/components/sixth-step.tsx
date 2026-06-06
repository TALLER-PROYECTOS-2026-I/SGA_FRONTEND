import { useState, useEffect, useMemo } from "react";
import { Step } from "./step";
import { CoordinatorCommentsBanner } from "./coordinator-comments-banner";
import { useSteps } from "../contexts/steps-context-provider";
import { useSyllabusContext } from "../contexts/syllabus-context";
import { toast } from "sonner";
import {
  useFormulaQuery,
  useCreateFormula,
  useUpdateFormula,
  type FormulaEvaluacionCreate,
} from "../hooks/sixth-step-query";
import { usePermissionsContext } from "../hooks/use-permissions-context";
import { useSyllabusEditLock } from "../hooks/use-syllabus-edit-lock";
import { useReviewMode } from "../../coordinator/contexts/review-mode-context";
import { useIsDraftCreateMode } from "../create-draft/is-draft-create";
import { useCreateDraft } from "../create-draft/create-draft-context";
import {
  useCatalogFormulas,
  type FormulaCatalogItem,
} from "../../formulas/hooks/formulas-query";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../../common/components/ui/select";
import {
  Calculator,
  ClipboardCheck,
  FileText,
  Info,
  Loader2,
  Sigma,
  BookOpen,
  AlertTriangle,
} from "lucide-react";

interface Legend {
  key: string;
  description: string;
}

interface SubFormula {
  variable: string;
  name: string;
  formula: string;
  legend: Legend[];
}

interface SelectableSubFormula extends SubFormula {
  id: string;
}

interface MainFormula {
  id: string;
  name: string;
  formula: string;
  legend: Legend[];
  subFormulas: SubFormula[];
}

const UI_STEP_NUMBER = 6;

const availableFormulas: MainFormula[] = [
  {
    id: "1",
    name: "Fórmula Estándar",
    formula: "PF = (2*PE + PL + EP + EF) / 5",
    legend: [
      { key: "PF", description: "Promedio Final" },
      { key: "PE", description: "Promedio de Evaluaciones" },
      { key: "PL", description: "Promedio de Laboratorios" },
      { key: "EP", description: "Examen Parcial" },
      { key: "EF", description: "Examen Final" },
    ],
    subFormulas: [
      {
        variable: "PE",
        name: "Promedio de Evaluaciones",
        formula: "PE = ((P1+P2+P3+P4−MN) / 3 + W1) / 2",
        legend: [
          {
            key: "P1, P2, P3, P4",
            description: "Evaluaciones de los entregables",
          },
          { key: "MN", description: "Menor nota" },
          { key: "W1", description: "Trabajo final" },
        ],
      },
      {
        variable: "PL",
        name: "Promedio de Laboratorios",
        formula: "PL = (L1+L2+L3+L4) / 4",
        legend: [
          { key: "L1, L2, L3, L4", description: "Notas de laboratorios" },
        ],
      },
    ],
  },
  {
    id: "2",
    name: "Fórmula Alternativa 1",
    formula: "PF = (PE + EP + EF) / 3",
    legend: [
      { key: "PF", description: "Promedio Final" },
      { key: "PE", description: "Promedio de Evaluaciones" },
      { key: "EP", description: "Examen Parcial" },
      { key: "EF", description: "Examen Final" },
    ],
    subFormulas: [
      {
        variable: "PE",
        name: "Promedio de Evaluaciones",
        formula: "PE = (P1+P2+P3+P4) / 4",
        legend: [
          {
            key: "P1, P2, P3, P4",
            description: "Evaluaciones de los entregables",
          },
        ],
      },
    ],
  },
  {
    id: "3",
    name: "Fórmula Alternativa 2",
    formula: "PF = (3*PE + 2*PL + EP + EF) / 7",
    legend: [
      { key: "PF", description: "Promedio Final" },
      { key: "PE", description: "Promedio de Evaluaciones" },
      { key: "PL", description: "Promedio de Laboratorios" },
      { key: "EP", description: "Examen Parcial" },
      { key: "EF", description: "Examen Final" },
    ],
    subFormulas: [
      {
        variable: "PE",
        name: "Promedio de Evaluaciones",
        formula: "PE = ((P1+P2+P3+P4) / 4 + W1) / 2",
        legend: [
          {
            key: "P1, P2, P3, P4",
            description: "Evaluaciones de los entregables",
          },
          { key: "W1", description: "Trabajo final" },
        ],
      },
      {
        variable: "PL",
        name: "Promedio de Laboratorios",
        formula: "PL = ((L1+L2+L3+L4−MN) / 3)",
        legend: [
          { key: "L1, L2, L3, L4", description: "Notas de laboratorios" },
          { key: "MN", description: "Menor nota" },
        ],
      },
    ],
  },
];

const FORMULA_TOKEN_PATTERN = /\b[A-Z][A-Z0-9_]*\b/g;

function ensureFormulaTarget(target: string, expression: string) {
  const trimmed = expression.trim();
  const targetPattern = new RegExp(`^\\s*${target}\\s*=`, "i");

  return targetPattern.test(trimmed) ? trimmed : `${target} = ${trimmed}`;
}

function getStringValue(
  source: Record<string, unknown>,
  keys: string[],
): string | null {
  for (const key of keys) {
    const value = source[key];

    if (typeof value === "string" && value.trim()) {
      return value.trim();
    }
  }

  return null;
}

function legendFromJson(value: unknown): Legend[] {
  if (!Array.isArray(value)) return [];

  return value.flatMap((item) => {
    if (!item || typeof item !== "object") return [];

    const source = item as Record<string, unknown>;
    const key = getStringValue(source, [
      "key",
      "codigo",
      "variable",
      "variableCodigo",
    ]);

    if (!key) return [];

    const description =
      getStringValue(source, [
        "description",
        "descripcion",
        "nombre",
        "name",
      ]) ?? key;

    return [{ key, description }];
  });
}

function inferredLegend(
  expression: string,
  descriptions: Record<string, string> = {},
): Legend[] {
  const tokens = Array.from(
    new Set(expression.match(FORMULA_TOKEN_PATTERN) ?? []),
  );

  return tokens.map((token) => ({
    key: token,
    description: descriptions[token] ?? token,
  }));
}

function mergeLegend(...groups: Legend[][]): Legend[] {
  const byKey = new Map<string, Legend>();

  for (const group of groups) {
    for (const item of group) {
      if (!byKey.has(item.key)) {
        byKey.set(item.key, item);
      }
    }
  }

  return Array.from(byKey.values());
}

function subFormulasFromJson(value: unknown): SubFormula[] {
  if (!Array.isArray(value)) return [];

  return value.flatMap((item) => {
    if (!item || typeof item !== "object") return [];

    const source = item as Record<string, unknown>;
    const variable = getStringValue(source, [
      "variable",
      "variableCodigo",
      "codigo",
    ]);
    const formula = getStringValue(source, ["formula", "expresion"]);

    if (!variable || !formula) return [];

    const name =
      getStringValue(source, ["name", "nombre"]) ?? `Fórmula ${variable}`;

    return [
      {
        variable,
        name,
        formula: ensureFormulaTarget(variable, formula),
        legend: mergeLegend(
          legendFromJson(source.legend),
          inferredLegend(formula),
        ),
      },
    ];
  });
}

function expressionUsesVariable(expression: string, variable: string) {
  return new RegExp(`\\b${variable}\\b`).test(expression);
}

function catalogFormulaToMainFormula(formula: FormulaCatalogItem): MainFormula {
  const expression = ensureFormulaTarget(formula.tipo, formula.expresion);

  const descriptions = {
    PF: "Promedio Final",
    PE: "Promedio de Evaluaciones",
  };

  const catalogSubFormulas = subFormulasFromJson(formula.subformulasJson);
  const subFormulaText = catalogSubFormulas
    .map((subFormula) => subFormula.formula)
    .join(" ");

  return {
    id: `catalog-pf-${formula.id}`,
    name: `${formula.tipo} - ${formula.nombre}`,
    formula: expression,
    legend: mergeLegend(
      legendFromJson(formula.variablesJson),
      inferredLegend(`${expression} ${subFormulaText}`, descriptions),
    ),
    subFormulas: catalogSubFormulas,
  };
}

function catalogFormulaToSelectablePe(
  formula: FormulaCatalogItem,
): SelectableSubFormula {
  const expression = ensureFormulaTarget("PE", formula.expresion);

  const descriptions = {
    PE: "Promedio de Evaluaciones",
  };

  return {
    id: `catalog-pe-${formula.id}`,
    variable: "PE",
    name: formula.nombre,
    formula: expression,
    legend: mergeLegend(
      legendFromJson(formula.variablesJson),
      inferredLegend(expression, descriptions),
    ),
  };
}

function fallbackPeOptionsFromFormulas(
  formulas: MainFormula[],
): SelectableSubFormula[] {
  const peOptions = new Map<string, SelectableSubFormula>();

  for (const formula of formulas) {
    for (const subFormula of formula.subFormulas) {
      if (subFormula.variable.toUpperCase() !== "PE") continue;

      const key = `${subFormula.name}-${subFormula.formula}`;

      if (!peOptions.has(key)) {
        peOptions.set(key, {
          ...subFormula,
          id: `fallback-pe-${peOptions.size + 1}`,
        });
      }
    }
  }

  return Array.from(peOptions.values());
}

function combinePfWithSelectedPe(
  pfFormula: MainFormula | undefined,
  peFormula: SelectableSubFormula | undefined,
): MainFormula | undefined {
  if (!pfFormula) return undefined;

  if (!peFormula) {
    return pfFormula;
  }

  const subFormulasWithoutPe = pfFormula.subFormulas.filter(
    (subFormula) => subFormula.variable.toUpperCase() !== "PE",
  );

  const subFormulas = [peFormula, ...subFormulasWithoutPe];
  const subFormulaText = subFormulas
    .map((subFormula) => subFormula.formula)
    .join(" ");

  return {
    ...pfFormula,
    legend: mergeLegend(
      pfFormula.legend,
      peFormula.legend,
      inferredLegend(`${pfFormula.formula} ${subFormulaText}`),
    ),
    subFormulas,
  };
}

function buildFormulaPayload(
  syllabusId: number,
  formula: MainFormula,
): FormulaEvaluacionCreate {
  return {
    silaboId: syllabusId,
    nombreRegla: formula.name,
    variableFinalCodigo: "PF",
    expresionFinal: formula.formula,
    activo: true,
    variables: formula.legend.map((item, index) => ({
      codigo: item.key,
      nombre: item.description,
      tipo: item.key === "PF" ? ("final" as const) : ("evaluacion" as const),
      descripcion: item.description,
      orden: index + 1,
    })),
    subformulas: formula.subFormulas.map((item) => ({
      variableCodigo: item.variable,
      expresion: item.formula,
    })),
    variablePlanMappings: [],
  };
}

export default function SixthStep() {
  const { nextStep } = useSteps();
  const { syllabusId } = useSyllabusContext();
  const { isDraftCreateMode } = useIsDraftCreateMode();
  const { draft, setSixthStepData } = useCreateDraft();

  const {
    hasEditPermissionForSection,
    getCommentsForSection,
    isDisapprovedCorrection,
  } = usePermissionsContext();

  const { isReviewMode } = useReviewMode();
  const { isLockedByState, isResolvingState } = useSyllabusEditLock(syllabusId);

  const [selectedPfFormula, setSelectedPfFormula] = useState<string>("");
  const [selectedPeFormula, setSelectedPeFormula] = useState<string>("");

  const { data: formulaFromApi, isLoading } = useFormulaQuery(
    isDraftCreateMode ? null : syllabusId,
  );

  const { data: catalogFormulas = [], isError: isCatalogError } =
    useCatalogFormulas();

  const createFormulaMutation = useCreateFormula();
  const updateFormulaMutation = useUpdateFormula();

  const pfFormulasForSelection = useMemo(() => {
    const activePfCatalogFormulas = catalogFormulas.filter(
      (formula) => formula.activo && formula.tipo === "PF",
    );

    if (isCatalogError || activePfCatalogFormulas.length === 0) {
      return availableFormulas;
    }

    return activePfCatalogFormulas.map(catalogFormulaToMainFormula);
  }, [catalogFormulas, isCatalogError]);

  const peFormulasForSelection = useMemo(() => {
    const activePeCatalogFormulas = catalogFormulas.filter(
      (formula) => formula.activo && formula.tipo === "PE",
    );

    if (activePeCatalogFormulas.length > 0) {
      return activePeCatalogFormulas.map(catalogFormulaToSelectablePe);
    }

    return fallbackPeOptionsFromFormulas(availableFormulas);
  }, [catalogFormulas]);

  const selectedPf = pfFormulasForSelection.find(
    (formula) => formula.id === selectedPfFormula,
  );

  const selectedPe = peFormulasForSelection.find(
    (formula) => formula.id === selectedPeFormula,
  );

  const requiresPe =
    selectedPf !== undefined &&
    expressionUsesVariable(selectedPf.formula, "PE");

  const currentFormula = useMemo(() => {
    return combinePfWithSelectedPe(selectedPf, selectedPe);
  }, [selectedPf, selectedPe]);

  const coordinatorComments = getCommentsForSection(UI_STEP_NUMBER);

  const canEdit =
    isDraftCreateMode ||
    (!isReviewMode &&
      hasEditPermissionForSection(UI_STEP_NUMBER) &&
      !isResolvingState &&
      (!isLockedByState || isDisapprovedCorrection));

  useEffect(() => {
    if (!isDraftCreateMode || !draft.formulaEvaluacion) return;

    const matchedPf = pfFormulasForSelection.find((formula) => {
      return (
        formula.name === draft.formulaEvaluacion?.nombreRegla ||
        formula.formula === draft.formulaEvaluacion?.expresionFinal
      );
    });

    if (matchedPf) {
      setSelectedPfFormula(matchedPf.id);
    }

    const draftPe = draft.formulaEvaluacion.subformulas?.find(
      (subFormula) => subFormula.variableCodigo?.toUpperCase() === "PE",
    );

    if (draftPe) {
      const matchedPe = peFormulasForSelection.find((formula) => {
        return formula.formula === ensureFormulaTarget("PE", draftPe.expresion);
      });

      if (matchedPe) {
        setSelectedPeFormula(matchedPe.id);
      }
    }
  }, [
    isDraftCreateMode,
    draft.formulaEvaluacion,
    pfFormulasForSelection,
    peFormulasForSelection,
  ]);

  useEffect(() => {
    if (isDraftCreateMode) return;
    if (!formulaFromApi) return;

    const matchedPf = pfFormulasForSelection.find((formula) => {
      return (
        formula.name === formulaFromApi.nombreRegla ||
        formula.formula === formulaFromApi.expresionFinal
      );
    });

    if (matchedPf) {
      setSelectedPfFormula(matchedPf.id);
    }

    const apiPe = formulaFromApi.subformulas?.find(
      (subFormula) => subFormula.variableCodigo?.toUpperCase() === "PE",
    );

    if (apiPe) {
      const matchedPe = peFormulasForSelection.find((formula) => {
        return formula.formula === ensureFormulaTarget("PE", apiPe.expresion);
      });

      if (matchedPe) {
        setSelectedPeFormula(matchedPe.id);
      }
    }
  }, [
    formulaFromApi,
    isDraftCreateMode,
    pfFormulasForSelection,
    peFormulasForSelection,
  ]);

  useEffect(() => {
    if (!requiresPe) {
      setSelectedPeFormula("");
    }
  }, [requiresPe]);

  const handlePfFormulaChange = (value: string) => {
    if (!canEdit) return;

    setSelectedPfFormula(value);
  };

  const handlePeFormulaChange = (value: string) => {
    if (!canEdit) return;

    setSelectedPeFormula(value);
  };

  const handleSaveFormula = async () => {
    if (!canEdit) {
      return false;
    }

    if (!syllabusId) {
      throw new Error("No se pudo identificar el sílabo.");
    }

    if (!selectedPf || !currentFormula) {
      throw new Error("Selecciona una fórmula de promedio final.");
    }

    if (requiresPe && !selectedPe) {
      throw new Error("Selecciona una fórmula de promedio de evaluaciones.");
    }

    const payload = buildFormulaPayload(Number(syllabusId), currentFormula);

    if (formulaFromApi?.id) {
      await updateFormulaMutation.mutateAsync({
        formulaId: formulaFromApi.id,
        formula: {
          nombreRegla: payload.nombreRegla,
          variableFinalCodigo: payload.variableFinalCodigo,
          expresionFinal: payload.expresionFinal,
          activo: payload.activo,
          variables: payload.variables,
          subformulas: payload.subformulas,
          variablePlanMappings: payload.variablePlanMappings,
        },
      });
    } else {
      await createFormulaMutation.mutateAsync(payload);
    }

    toast.success("Esquema de evaluación guardado correctamente");
    return true;
  };

  const handleNextStep = async () => {
    if (!canEdit) {
      nextStep();
      return;
    }

    if (!selectedPf || !currentFormula) {
      toast.error(
        "Selecciona una fórmula de promedio final antes de continuar.",
      );
      return;
    }

    if (requiresPe && !selectedPe) {
      toast.error(
        "Selecciona una fórmula de promedio de evaluaciones antes de continuar.",
      );
      return;
    }

    if (isDraftCreateMode) {
      setSixthStepData(buildFormulaPayload(0, currentFormula));
      nextStep();
      return;
    }

    try {
      const saved = await handleSaveFormula();

      if (saved) {
        nextStep();
      }
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "No se pudo guardar la evaluación";

      toast.error(message);
    }
  };

  if (!isDraftCreateMode && isLoading) {
    return (
      <Step step={UI_STEP_NUMBER} onNextStep={handleNextStep}>
        <div className="bg-white rounded-2xl border border-gray-100 shadow-xl p-8">
          <div className="rounded-xl border border-blue-100 bg-blue-50 px-4 py-3 text-sm text-blue-700 flex items-center gap-2">
            <Loader2 size={18} className="animate-spin" />
            Cargando esquema de evaluación...
          </div>
        </div>
      </Step>
    );
  }

  return (
    <Step step={UI_STEP_NUMBER} onNextStep={handleNextStep}>
      <div className="bg-white rounded-2xl border border-gray-100 shadow-xl overflow-hidden">
        <div className="px-8 py-6 border-b border-gray-100 bg-gradient-to-r from-red-50 via-white to-white">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-red-600 text-white flex items-center justify-center shadow-md">
              <span className="text-2xl font-bold">6</span>
            </div>

            <div>
              <h2 className="text-2xl font-bold text-gray-900">
                Evaluación del Aprendizaje
              </h2>

              <p className="text-sm text-gray-500 mt-1">
                Selecciona el esquema de evaluación que se utilizará para
                calcular el promedio final de la asignatura.
              </p>
            </div>

            <div className="ml-auto hidden md:flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-50 text-blue-700 border border-blue-100 text-xs font-bold">
              Sistema de evaluación
            </div>
          </div>
        </div>

        <div className="p-8">
          <CoordinatorCommentsBanner
            stepNumber={UI_STEP_NUMBER}
            comments={coordinatorComments}
          />

          {!canEdit && (
            <div className="mb-6 rounded-2xl border border-yellow-200 bg-yellow-50 p-5 flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-yellow-500 text-white flex items-center justify-center shrink-0">
                <AlertTriangle size={20} />
              </div>

              <div>
                <p className="text-sm font-bold text-yellow-800">
                  Modo solo lectura
                </p>

                <p className="text-sm text-yellow-700 mt-1">
                  {isDisapprovedCorrection
                    ? "Esta sección no tiene observaciones del coordinador, por eso permanece bloqueada."
                    : "No tienes permiso para editar esta sección. Puedes revisar el esquema de evaluación, pero no modificarlo."}
                </p>
              </div>
            </div>
          )}

          <div className="mb-7 rounded-2xl border border-gray-100 bg-gray-50 p-5">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center">
                  <Info size={20} />
                </div>

                <div>
                  <h3 className="font-bold text-gray-900">
                    Información del paso
                  </h3>

                  <p className="text-sm text-gray-600 mt-1">
                    El esquema seleccionado define cómo se calculará el promedio
                    final del estudiante.
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <div className="px-4 py-2 rounded-xl bg-white border border-gray-100 shadow-sm">
                  <p className="text-xs font-semibold text-gray-400 uppercase">
                    Esquemas PF
                  </p>

                  <p className="text-xl font-bold text-gray-900">
                    {pfFormulasForSelection.length}
                  </p>
                </div>

                <div className="px-4 py-2 rounded-xl bg-white border border-gray-100 shadow-sm">
                  <p className="text-xs font-semibold text-gray-400 uppercase">
                    Fórmulas PE
                  </p>

                  <p className="text-xl font-bold text-gray-900">
                    {peFormulasForSelection.length}
                  </p>
                </div>

                <div className="px-4 py-2 rounded-xl bg-white border border-gray-100 shadow-sm">
                  <p className="text-xs font-semibold text-gray-400 uppercase">
                    Selección
                  </p>

                  <p className="text-xl font-bold text-gray-900">
                    {currentFormula?.name ?? "—"}
                  </p>
                </div>

                <div className="px-4 py-2 rounded-xl bg-white border border-gray-100 shadow-sm">
                  <p className="text-xs font-semibold text-gray-400 uppercase">
                    Desgloses
                  </p>

                  <p className="text-xl font-bold text-gray-900">
                    {currentFormula?.subFormulas.length ?? 0}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-[380px_1fr] gap-7">
            <aside className="space-y-6">
              <div className="bg-white rounded-2xl border border-gray-100 shadow-md overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-100 bg-gray-50">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-red-600 text-white flex items-center justify-center">
                      <Calculator size={20} />
                    </div>

                    <div>
                      <h3 className="text-lg font-bold text-gray-900">
                        Esquema del Promedio Final
                      </h3>

                      <p className="text-sm text-gray-500 mt-1">
                        Selecciona la fórmula PF del sílabo.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="p-6 space-y-5">
                  <div>
                    <label className="block text-sm font-bold text-gray-900 mb-2">
                      Fórmula PF
                    </label>

                    <Select
                      value={selectedPfFormula || undefined}
                      onValueChange={handlePfFormulaChange}
                      disabled={!canEdit}
                    >
                      <SelectTrigger className="w-full h-12 rounded-xl border-gray-200 bg-gray-50 text-sm focus:ring-red-500 disabled:bg-gray-100 disabled:text-gray-500 disabled:cursor-not-allowed disabled:opacity-70">
                        <SelectValue placeholder="Selecciona una fórmula PF" />
                      </SelectTrigger>

                      <SelectContent>
                        {pfFormulasForSelection.map((formula) => (
                          <SelectItem key={formula.id} value={formula.id}>
                            {formula.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {requiresPe && (
                    <div>
                      <label className="block text-sm font-bold text-gray-900 mb-2">
                        Fórmula PE
                      </label>

                      <Select
                        value={selectedPeFormula || undefined}
                        onValueChange={handlePeFormulaChange}
                        disabled={!canEdit}
                      >
                        <SelectTrigger className="w-full h-12 rounded-xl border-gray-200 bg-gray-50 text-sm focus:ring-red-500 disabled:bg-gray-100 disabled:text-gray-500 disabled:cursor-not-allowed disabled:opacity-70">
                          <SelectValue placeholder="Selecciona una fórmula PE" />
                        </SelectTrigger>

                        <SelectContent>
                          {peFormulasForSelection.map((formula) => (
                            <SelectItem key={formula.id} value={formula.id}>
                              {formula.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>

                      <p className="text-xs text-gray-500 mt-2">
                        Esta fórmula se mostrará como desglose del promedio de
                        evaluaciones.
                      </p>
                    </div>
                  )}

                  {currentFormula && (
                    <div className="rounded-2xl border border-red-100 bg-red-50 p-4">
                      <p className="text-xs font-bold text-red-700 uppercase">
                        Esquema seleccionado
                      </p>

                      <p className="text-sm font-semibold text-gray-900 mt-1">
                        {currentFormula.name}
                      </p>

                      {selectedPe && (
                        <p className="text-xs text-gray-700 mt-2">
                          PE: {selectedPe.name}
                        </p>
                      )}
                    </div>
                  )}
                </div>
              </div>

              <div className="bg-blue-50 rounded-2xl border border-blue-100 p-5">
                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 rounded-xl bg-blue-600 text-white flex items-center justify-center shrink-0">
                    <BookOpen size={18} />
                  </div>

                  <div>
                    <h3 className="font-bold text-blue-900">Recomendación</h3>

                    <p className="text-sm text-blue-700 leading-relaxed mt-1">
                      Selecciona una fórmula PF y, si corresponde, una fórmula
                      PE para que el sílabo muestre ambas fórmulas como en el
                      formato oficial.
                    </p>
                  </div>
                </div>
              </div>
            </aside>

            <section className="space-y-6">
              {currentFormula && (
                <>
                  <div className="bg-white rounded-2xl border border-gray-100 shadow-md overflow-hidden">
                    <div className="px-6 py-4 border-b border-gray-100 bg-gray-50">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-red-600 text-white flex items-center justify-center">
                          <Sigma size={20} />
                        </div>

                        <div>
                          <h3 className="text-lg font-bold text-gray-900">
                            Fórmula Principal
                          </h3>

                          <p className="text-sm text-gray-500 mt-1">
                            Cálculo del promedio final de la asignatura.
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="p-6">
                      <div className="rounded-2xl bg-blue-50 border border-blue-100 px-6 py-6 mb-6">
                        <p className="text-center text-2xl font-bold text-gray-900 tracking-wide">
                          {currentFormula.formula}
                        </p>
                      </div>

                      <div>
                        <h4 className="text-sm font-bold text-gray-900 mb-3">
                          Donde:
                        </h4>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          {currentFormula.legend.map((item) => (
                            <div
                              key={`${currentFormula.id}-${item.key}`}
                              className="rounded-xl border border-gray-100 bg-gray-50 px-4 py-3"
                            >
                              <span className="inline-flex items-center justify-center px-2 py-1 rounded-lg bg-white border border-gray-100 text-xs font-bold text-red-700 mr-2">
                                {item.key}
                              </span>

                              <span className="text-sm text-gray-700">
                                {item.description}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>

                  {currentFormula.subFormulas.length > 0 && (
                    <div className="bg-white rounded-2xl border border-gray-100 shadow-md overflow-hidden">
                      <div className="px-6 py-4 border-b border-gray-100 bg-gray-50">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-red-600 text-white flex items-center justify-center">
                            <ClipboardCheck size={20} />
                          </div>

                          <div>
                            <h3 className="text-lg font-bold text-gray-900">
                              Fórmulas Desglosadas
                            </h3>

                            <p className="text-sm text-gray-500 mt-1">
                              Detalle de los componentes usados en la fórmula
                              principal.
                            </p>
                          </div>
                        </div>
                      </div>

                      <div className="p-6 space-y-5">
                        {currentFormula.subFormulas.map((subFormula, index) => (
                          <div
                            key={`${currentFormula.id}-${subFormula.variable}-${subFormula.formula}`}
                            className="rounded-2xl border border-gray-100 bg-gray-50 p-5"
                          >
                            <div className="flex items-start justify-between gap-4 mb-4">
                              <div>
                                <h4 className="font-bold text-gray-900">
                                  {subFormula.name}
                                </h4>

                                <p className="text-xs text-gray-500 mt-1">
                                  Variable: {subFormula.variable}
                                </p>
                              </div>

                              <span className="inline-flex items-center justify-center px-3 py-1 rounded-full bg-white border border-gray-100 text-xs font-bold text-gray-700">
                                #{index + 1}
                              </span>
                            </div>

                            <div className="bg-white border border-gray-100 rounded-xl p-4 mb-4">
                              <p className="text-center text-lg font-bold text-gray-900">
                                {subFormula.formula}
                              </p>
                            </div>

                            <div>
                              <h5 className="text-sm font-bold text-gray-900 mb-3">
                                Donde:
                              </h5>

                              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                {subFormula.legend.map((item) => (
                                  <div
                                    key={`${subFormula.variable}-${item.key}`}
                                    className="rounded-xl border border-gray-100 bg-white px-4 py-3"
                                  >
                                    <span className="inline-flex items-center justify-center px-2 py-1 rounded-lg bg-red-50 border border-red-100 text-xs font-bold text-red-700 mr-2">
                                      {item.key}
                                    </span>

                                    <span className="text-sm text-gray-700">
                                      {item.description}
                                    </span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              )}

              {!currentFormula && (
                <div className="bg-white rounded-2xl border border-gray-100 shadow-md p-8 text-center">
                  <div className="w-16 h-16 rounded-2xl bg-gray-100 flex items-center justify-center mx-auto mb-4">
                    <FileText className="text-gray-400" size={30} />
                  </div>

                  <p className="text-sm font-semibold text-gray-700">
                    No se ha seleccionado un esquema de evaluación.
                  </p>
                </div>
              )}
            </section>
          </div>
        </div>
      </div>
    </Step>
  );
}