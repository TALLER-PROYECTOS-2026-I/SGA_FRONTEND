import {
  useMethodologicalStrategiesQuery,
  useDidacticResourcesQuery,
  useUpdateMethodologicalStrategies,
  useUpdateDidacticResources,
} from "../hooks/fifth-step-query";

import type {
  MethodologicalStrategy,
  DidacticResource,
} from "../hooks/fifth-step-query";

import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Step } from "./step";
import { CoordinatorCommentsBanner } from "./coordinator-comments-banner";
import { useSteps } from "../contexts/steps-context-provider";
import { useSyllabusContext } from "../contexts/syllabus-context";
import { useFinalizeSyllabus } from "../hooks/use-finalize-syllabus";
import { usePermissionsContext } from "../hooks/use-permissions-context";
import { useSyllabusEditLock } from "../hooks/use-syllabus-edit-lock";
import { useReviewMode } from "../../coordinator/contexts/review-mode-context";
import {
  X,
  Plus,
  BookOpenCheck,
  Boxes,
  Loader2,
  Info,
  FileText,
  AlertTriangle,
} from "lucide-react";
import { toast } from "sonner";
import { useIsDraftCreateMode } from "../create-draft/is-draft-create";
import { useCreateDraft } from "../create-draft/create-draft-context";

function normalizeItem(item: { titulo: string; descripcion: string }) {
  return {
    titulo: item.titulo.trim(),
    descripcion: item.descripcion.trim(),
  };
}

function isEmptyItem(item: { titulo: string; descripcion: string }) {
  return !item.titulo.trim() && !item.descripcion.trim();
}

function isIncompleteItem(item: { titulo: string; descripcion: string }) {
  const hasTitle = item.titulo.trim().length > 0;
  const hasDescription = item.descripcion.trim().length > 0;

  return (hasTitle && !hasDescription) || (!hasTitle && hasDescription);
}

function validateItems(
  items: { titulo: string; descripcion: string }[],
  label: string,
) {
  const normalized = items.map(normalizeItem);

  if (normalized.length === 0 || normalized.every(isEmptyItem)) {
    throw new Error(`Debe registrar al menos un elemento en ${label}.`);
  }

  const incompleteIndex = normalized.findIndex(isIncompleteItem);

  if (incompleteIndex >= 0) {
    throw new Error(
      `Complete título y descripción en ${label}, registro ${incompleteIndex + 1}.`,
    );
  }

  return normalized.filter((item) => !isEmptyItem(item));
}

export default function FifthStep() {
  const { nextStep } = useSteps();
  const { syllabusId } = useSyllabusContext();
  const { isDraftCreateMode } = useIsDraftCreateMode();
  const { draft, setFifthStepData } = useCreateDraft();
  const [searchParams] = useSearchParams();
  const {
    hasEditPermissionForSection,
    getCommentsForSection,
    isDisapprovedCorrection,
  } = usePermissionsContext();
  const coordinatorComments = getCommentsForSection(5);
  const { isReviewMode } = useReviewMode();

  const resolvedSyllabusId = useMemo(() => {
    const querySyllabusId = searchParams.get("syllabusId");
    if (querySyllabusId) {
      const parsed = Number(querySyllabusId);
      if (Number.isFinite(parsed) && parsed > 0) return parsed;
    }

    const fromContext = Number(syllabusId);
    if (Number.isFinite(fromContext) && fromContext > 0) {
      return fromContext;
    }

    const params = new URLSearchParams(window.location.search);
    const fromQuery = Number(params.get("syllabusId") || params.get("id"));

    if (Number.isFinite(fromQuery) && fromQuery > 0) {
      return fromQuery;
    }

    return null;
  }, [syllabusId, searchParams]);

  const { isLockedByState, isResolvingState } =
    useSyllabusEditLock(resolvedSyllabusId);

  const [methodologicalStrategies, setMethodologicalStrategies] = useState<
    MethodologicalStrategy[] | undefined
  >(undefined);

  const [didacticResources, setDidacticResources] = useState<
    DidacticResource[] | undefined
  >(undefined);

  const querySyllabusId =
    isDraftCreateMode || !resolvedSyllabusId
      ? null
      : String(resolvedSyllabusId);

  const { data: serverStrategies, isLoading: loadingStrategies } =
    useMethodologicalStrategiesQuery(querySyllabusId);

  const { data: serverResources, isLoading: loadingResources } =
    useDidacticResourcesQuery(querySyllabusId);

  const saveStrategiesMutation = useUpdateMethodologicalStrategies();
  const saveResourcesMutation = useUpdateDidacticResources();

  const isSaving =
    saveStrategiesMutation.isPending || saveResourcesMutation.isPending;

  const canEdit =
    !isReviewMode &&
    hasEditPermissionForSection(5) &&
    !isLockedByState &&
    !isResolvingState;

  const inputsDisabled =
    !canEdit ||
    isSaving ||
    (!isDraftCreateMode && (loadingStrategies || loadingResources)) ||
    isResolvingState;

  const persistFifthStep = async () => {
    if (!canEdit) {
      throw new Error("No tienes permiso para editar esta sección.");
    }

    const normalizedId = resolvedSyllabusId
      ? String(resolvedSyllabusId).trim()
      : "";
    const isValidId = normalizedId !== "" && /^\d+$/.test(normalizedId);

    if (!isValidId) {
      throw new Error("ID del syllabus no válido");
    }

    if (
      methodologicalStrategies === undefined ||
      didacticResources === undefined
    ) {
      throw new Error("Esperando datos del servidor...");
    }

    const strategiesToSave = validateItems(
      methodologicalStrategies,
      "estrategias metodológicas",
    );

    const resourcesToSave = validateItems(
      didacticResources,
      "recursos didácticos",
    );

    await Promise.all([
      saveStrategiesMutation.mutateAsync({
        syllabusId: normalizedId,
        estrategias: strategiesToSave,
      }),
      saveResourcesMutation.mutateAsync({
        syllabusId: normalizedId,
        recursos: resourcesToSave,
      }),
    ]);
  };

  const { isLastStep, finalizeSyllabus } = useFinalizeSyllabus({
    syllabusId: resolvedSyllabusId,
    onBeforeFinalize: async () => {
      await persistFifthStep();
      toast.success("Datos guardados correctamente");
    },
  });

  useEffect(() => {
    if (!isDraftCreateMode) return;

    if (draft.methodologicalStrategies) {
      setMethodologicalStrategies(draft.methodologicalStrategies);
    } else {
      setMethodologicalStrategies([{ titulo: "", descripcion: "" }]);
    }

    if (draft.didacticResources) {
      setDidacticResources(draft.didacticResources);
    } else {
      setDidacticResources([{ titulo: "", descripcion: "" }]);
    }
  }, [
    isDraftCreateMode,
    draft.methodologicalStrategies,
    draft.didacticResources,
  ]);

  useEffect(() => {
    if (isDraftCreateMode) return;
    if (serverStrategies !== undefined) {
      setMethodologicalStrategies(
        serverStrategies.length > 0
          ? serverStrategies
          : [{ titulo: "", descripcion: "" }],
      );
    }
  }, [serverStrategies, isDraftCreateMode]);

  useEffect(() => {
    if (isDraftCreateMode) return;
    if (serverResources !== undefined) {
      setDidacticResources(
        serverResources.length > 0
          ? serverResources
          : [{ titulo: "", descripcion: "" }],
      );
    }
  }, [serverResources, isDraftCreateMode]);

  const addStrategy = () => {
    if (!canEdit) return;

    setMethodologicalStrategies((s) => [
      ...(s || []),
      { titulo: "", descripcion: "" },
    ]);
  };

  const removeStrategy = (index: number) => {
    if (!canEdit) return;

    const confirmed = window.confirm(
      "¿Deseas eliminar esta estrategia metodológica?",
    );

    if (!confirmed) return;

    setMethodologicalStrategies((s) => {
      const next = (s || []).filter((_, i) => i !== index);
      return next.length > 0 ? next : [{ titulo: "", descripcion: "" }];
    });
  };

  const updateStrategy = (
    index: number,
    field: "titulo" | "descripcion",
    value: string,
  ) => {
    if (!canEdit) return;

    setMethodologicalStrategies((s) =>
      (s || []).map((st, i) => (i === index ? { ...st, [field]: value } : st)),
    );
  };

  const addResource = () => {
    if (!canEdit) return;

    setDidacticResources((r) => [
      ...(r || []),
      { titulo: "", descripcion: "" },
    ]);
  };

  const removeResource = (index: number) => {
    if (!canEdit) return;

    const confirmed = window.confirm(
      "¿Deseas eliminar este recurso didáctico?",
    );

    if (!confirmed) return;

    setDidacticResources((r) => {
      const next = (r || []).filter((_, i) => i !== index);
      return next.length > 0 ? next : [{ titulo: "", descripcion: "" }];
    });
  };

  const updateResource = (
    index: number,
    field: "titulo" | "descripcion",
    value: string,
  ) => {
    if (!canEdit) return;

    setDidacticResources((r) =>
      (r || []).map((res, i) =>
        i === index ? { ...res, [field]: value } : res,
      ),
    );
  };

  const handleNextStep = async () => {
    if (!canEdit) {
      nextStep();
      return;
    }

    if (isLastStep) {
      await finalizeSyllabus();
      return;
    }

    if (isDraftCreateMode) {
      try {
        if (
          methodologicalStrategies === undefined ||
          didacticResources === undefined
        ) {
          throw new Error(
            "Complete estrategias y recursos antes de continuar.",
          );
        }

        const strategiesToSave = validateItems(
          methodologicalStrategies,
          "estrategias metodológicas",
        );

        const resourcesToSave = validateItems(
          didacticResources,
          "recursos didácticos",
        );

        setFifthStepData({
          methodologicalStrategies: strategiesToSave,
          didacticResources: resourcesToSave,
        });
        nextStep();
      } catch (err) {
        toast.error(
          err instanceof Error ? err.message : "Revise los datos del paso 5",
        );
      }
      return;
    }

    try {
      await persistFifthStep();
      toast.success("Datos guardados correctamente");
      nextStep();
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Error desconocido";

      toast.error(`Error al guardar: ${errorMessage}`);
    }
  };

  const totalStrategies = methodologicalStrategies?.length ?? 0;
  const totalResources = didacticResources?.length ?? 0;

  const disabledInputClass =
    "disabled:bg-gray-100 disabled:text-gray-500 disabled:cursor-not-allowed disabled:opacity-70";

  const inputClass = `w-full h-11 rounded-xl px-4 bg-gray-50 border border-gray-200 text-sm text-gray-700 placeholder:text-gray-400 outline-none transition-all focus:bg-white focus:ring-2 focus:ring-red-500 focus:border-transparent ${disabledInputClass}`;

  const textareaClass = `w-full min-h-[110px] rounded-xl px-4 py-3 bg-gray-50 border border-gray-200 text-sm text-gray-700 placeholder:text-gray-400 resize-y outline-none transition-all focus:bg-white focus:ring-2 focus:ring-red-500 focus:border-transparent ${disabledInputClass}`;

  return (
    <Step step={5} onNextStep={handleNextStep}>
      <div className="bg-white rounded-2xl border border-gray-100 shadow-xl overflow-hidden">
        <div className="px-8 py-6 border-b border-gray-100 bg-gradient-to-r from-red-50 via-white to-white">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-red-600 text-white flex items-center justify-center shadow-md">
              <span className="text-2xl font-bold">5</span>
            </div>

            <div>
              <h2 className="text-2xl font-bold text-gray-900">
                Estrategias y Recursos
              </h2>

              <p className="text-sm text-gray-500 mt-1">
                Registra las estrategias metodológicas y los recursos didácticos
                del sílabo.
              </p>
            </div>

            <div className="ml-auto hidden md:flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-50 text-blue-700 border border-blue-100 text-xs font-bold">
              Metodología académica
            </div>
          </div>
        </div>

        <div className="p-8">
          <CoordinatorCommentsBanner
            stepNumber={5}
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
                  {isReviewMode
                    ? "Estás revisando este paso en modo coordinador. Puedes consultar las estrategias y recursos, pero no modificarlos."
                    : isDisapprovedCorrection
                      ? "Esta sección no tiene observaciones del coordinador, por eso permanece bloqueada."
                      : "No tienes permiso para editar esta sección. Puedes revisar las estrategias y recursos, pero no modificarlos."}
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
                    Completa ambas secciones antes de continuar. Los datos se
                    guardarán al avanzar al siguiente paso.
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <div className="px-4 py-2 rounded-xl bg-white border border-gray-100 shadow-sm">
                  <p className="text-xs font-semibold text-gray-400 uppercase">
                    Estrategias
                  </p>

                  <p className="text-xl font-bold text-gray-900">
                    {totalStrategies}
                  </p>
                </div>

                <div className="px-4 py-2 rounded-xl bg-white border border-gray-100 shadow-sm">
                  <p className="text-xs font-semibold text-gray-400 uppercase">
                    Recursos
                  </p>

                  <p className="text-xl font-bold text-gray-900">
                    {totalResources}
                  </p>
                </div>

                <div className="px-4 py-2 rounded-xl bg-white border border-gray-100 shadow-sm">
                  <p className="text-xs font-semibold text-gray-400 uppercase">
                    Total
                  </p>

                  <p className="text-xl font-bold text-gray-900">
                    {totalStrategies + totalResources}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {(loadingStrategies || loadingResources || isResolvingState) && (
            <div className="mb-6 rounded-xl border border-blue-100 bg-blue-50 px-4 py-3 text-sm text-blue-700 flex items-center gap-2">
              <Loader2 size={18} className="animate-spin" />
              Cargando estrategias y recursos...
            </div>
          )}

          {isSaving && (
            <div className="mb-6 rounded-xl border border-blue-100 bg-blue-50 px-4 py-3 text-sm text-blue-700 flex items-center gap-2">
              <Loader2 size={18} className="animate-spin" />
              Guardando datos...
            </div>
          )}

          <div className="space-y-7">
            <section className="bg-white rounded-2xl border border-gray-100 shadow-md overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-100 bg-gray-50">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                  <div className="flex items-start gap-3">
                    <div className="w-11 h-11 rounded-xl bg-red-600 text-white flex items-center justify-center shadow-sm">
                      <BookOpenCheck size={22} />
                    </div>

                    <div>
                      <h3 className="text-lg font-bold text-gray-900">
                        5. Estrategias Metodológicas
                      </h3>

                      <p className="text-sm text-gray-500 mt-1">
                        Define las estrategias que guiarán el proceso de
                        enseñanza y aprendizaje.
                      </p>
                    </div>
                  </div>

                  <span className="inline-flex items-center justify-center px-3 py-1 rounded-full text-xs font-bold bg-white text-gray-700 border border-gray-100">
                    {totalStrategies} registro
                    {totalStrategies === 1 ? "" : "s"}
                  </span>
                </div>
              </div>

              <div className="p-6">
                {loadingStrategies && (
                  <div className="mb-4 rounded-xl border border-blue-100 bg-blue-50 px-4 py-3 text-sm text-blue-700 flex items-center gap-2">
                    <Loader2 size={18} className="animate-spin" />
                    Cargando estrategias desde servidor...
                  </div>
                )}

                {methodologicalStrategies === undefined ? (
                  <div className="text-center py-10 rounded-2xl border border-dashed border-gray-200 bg-gray-50">
                    <div className="w-14 h-14 rounded-2xl bg-gray-100 flex items-center justify-center mx-auto mb-3">
                      <FileText className="text-gray-400" size={26} />
                    </div>

                    <p className="text-sm font-semibold text-gray-700">
                      Cargando datos...
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {methodologicalStrategies.map((strategy, index) => (
                      <div
                        key={index}
                        className="rounded-2xl border border-gray-100 bg-gray-50 p-4"
                      >
                        <div className="flex items-start gap-4">
                          <div className="w-10 h-10 rounded-xl bg-red-50 text-red-700 flex items-center justify-center font-bold text-sm shrink-0">
                            {index + 1}
                          </div>

                          <div className="flex-1 space-y-4">
                            <div>
                              <label className="block text-sm font-bold text-gray-900 mb-2">
                                Título
                              </label>

                              <input
                                type="text"
                                value={strategy.titulo}
                                onChange={(e) =>
                                  updateStrategy(
                                    index,
                                    "titulo",
                                    e.target.value,
                                  )
                                }
                                placeholder="Ingrese el título de la estrategia..."
                                className={inputClass}
                                disabled={inputsDisabled}
                              />
                            </div>

                            <div>
                              <label className="block text-sm font-bold text-gray-900 mb-2">
                                Descripción
                              </label>

                              <textarea
                                value={strategy.descripcion}
                                onChange={(e) =>
                                  updateStrategy(
                                    index,
                                    "descripcion",
                                    e.target.value,
                                  )
                                }
                                placeholder="Ingrese la descripción de la estrategia..."
                                rows={4}
                                className={textareaClass}
                                disabled={inputsDisabled}
                              />
                            </div>
                          </div>

                          <button
                            type="button"
                            onClick={() => removeStrategy(index)}
                            className="w-10 h-10 flex items-center justify-center text-red-600 bg-red-50 hover:bg-red-100 rounded-xl transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                            disabled={
                              inputsDisabled ||
                              methodologicalStrategies.length <= 1
                            }
                            title="Eliminar estrategia"
                          >
                            <X size={19} />
                          </button>
                        </div>
                      </div>
                    ))}

                    <button
                      type="button"
                      onClick={addStrategy}
                      disabled={inputsDisabled}
                      className="w-full h-12 flex items-center justify-center gap-2 rounded-xl border border-red-100 bg-red-50 text-red-700 hover:bg-red-100 transition-colors font-semibold text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <Plus size={18} />
                      Agregar estrategia metodológica
                    </button>
                  </div>
                )}
              </div>
            </section>

            <section className="bg-white rounded-2xl border border-gray-100 shadow-md overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-100 bg-gray-50">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                  <div className="flex items-start gap-3">
                    <div className="w-11 h-11 rounded-xl bg-red-600 text-white flex items-center justify-center shadow-sm">
                      <Boxes size={22} />
                    </div>

                    <div>
                      <h3 className="text-lg font-bold text-gray-900">
                        6. Recursos Didácticos
                      </h3>

                      <p className="text-sm text-gray-500 mt-1">
                        Registra los recursos, materiales o herramientas de
                        apoyo para el desarrollo del curso.
                      </p>
                    </div>
                  </div>

                  <span className="inline-flex items-center justify-center px-3 py-1 rounded-full text-xs font-bold bg-white text-gray-700 border border-gray-100">
                    {totalResources} registro
                    {totalResources === 1 ? "" : "s"}
                  </span>
                </div>
              </div>

              <div className="p-6">
                {loadingResources && (
                  <div className="mb-4 rounded-xl border border-blue-100 bg-blue-50 px-4 py-3 text-sm text-blue-700 flex items-center gap-2">
                    <Loader2 size={18} className="animate-spin" />
                    Cargando recursos desde servidor...
                  </div>
                )}

                {didacticResources === undefined ? (
                  <div className="text-center py-10 rounded-2xl border border-dashed border-gray-200 bg-gray-50">
                    <div className="w-14 h-14 rounded-2xl bg-gray-100 flex items-center justify-center mx-auto mb-3">
                      <FileText className="text-gray-400" size={26} />
                    </div>

                    <p className="text-sm font-semibold text-gray-700">
                      Cargando datos...
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {didacticResources.map((resource, index) => (
                      <div
                        key={index}
                        className="rounded-2xl border border-gray-100 bg-gray-50 p-4"
                      >
                        <div className="flex items-start gap-4">
                          <div className="w-10 h-10 rounded-xl bg-red-50 text-red-700 flex items-center justify-center font-bold text-sm shrink-0">
                            {index + 1}
                          </div>

                          <div className="flex-1 space-y-4">
                            <div>
                              <label className="block text-sm font-bold text-gray-900 mb-2">
                                Título
                              </label>

                              <input
                                type="text"
                                value={resource.titulo}
                                onChange={(e) =>
                                  updateResource(
                                    index,
                                    "titulo",
                                    e.target.value,
                                  )
                                }
                                placeholder="Ingrese el título del recurso..."
                                className={inputClass}
                                disabled={inputsDisabled}
                              />
                            </div>

                            <div>
                              <label className="block text-sm font-bold text-gray-900 mb-2">
                                Descripción
                              </label>

                              <textarea
                                value={resource.descripcion}
                                onChange={(e) =>
                                  updateResource(
                                    index,
                                    "descripcion",
                                    e.target.value,
                                  )
                                }
                                placeholder="Ingrese la descripción del recurso..."
                                rows={4}
                                className={textareaClass}
                                disabled={inputsDisabled}
                              />
                            </div>
                          </div>

                          <button
                            type="button"
                            onClick={() => removeResource(index)}
                            className="w-10 h-10 flex items-center justify-center text-red-600 bg-red-50 hover:bg-red-100 rounded-xl transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                            disabled={
                              inputsDisabled || didacticResources.length <= 1
                            }
                            title="Eliminar recurso"
                          >
                            <X size={19} />
                          </button>
                        </div>
                      </div>
                    ))}

                    <button
                      type="button"
                      onClick={addResource}
                      disabled={inputsDisabled}
                      className="w-full h-12 flex items-center justify-center gap-2 rounded-xl border border-red-100 bg-red-50 text-red-700 hover:bg-red-100 transition-colors font-semibold text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <Plus size={18} />
                      Agregar recurso didáctico
                    </button>
                  </div>
                )}
              </div>
            </section>
          </div>
        </div>
      </div>
    </Step>
  );
}
