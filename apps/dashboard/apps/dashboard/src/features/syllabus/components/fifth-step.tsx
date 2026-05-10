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

import { useEffect, useState } from "react";
import { Step } from "./step";
import { useSteps } from "../contexts/steps-context-provider";
import { useSyllabusContext } from "../contexts/syllabus-context";
import { useFinalizeSyllabus } from "../hooks/use-finalize-syllabus";
import {
  X,
  Plus,
  BookOpenCheck,
  Boxes,
  Loader2,
  Info,
  FileText,
} from "lucide-react";
import { toast } from "sonner";

export default function FifthStep() {
  const { nextStep } = useSteps();
  const { syllabusId } = useSyllabusContext();

  const [methodologicalStrategies, setMethodologicalStrategies] = useState<
    MethodologicalStrategy[] | undefined
  >(undefined);

  const [didacticResources, setDidacticResources] = useState<
    DidacticResource[] | undefined
  >(undefined);

  const { data: serverStrategies, isLoading: loadingStrategies } =
    useMethodologicalStrategiesQuery(syllabusId ? String(syllabusId) : null);

  const { data: serverResources, isLoading: loadingResources } =
    useDidacticResourcesQuery(syllabusId ? String(syllabusId) : null);

  const saveStrategiesMutation = useUpdateMethodologicalStrategies();
  const saveResourcesMutation = useUpdateDidacticResources();

  const { isLastStep, finalizeSyllabus } = useFinalizeSyllabus({
    syllabusId,
    onBeforeFinalize: async () => {
      const normalizedId = syllabusId ? String(syllabusId).trim() : "";
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

      await Promise.all([
        saveStrategiesMutation.mutateAsync({
          syllabusId: normalizedId,
          estrategias: methodologicalStrategies,
        }),
        saveResourcesMutation.mutateAsync({
          syllabusId: normalizedId,
          recursos: didacticResources,
        }),
      ]);

      toast.success("Datos guardados correctamente");
    },
  });

  useEffect(() => {
    if (serverStrategies !== undefined) {
      setMethodologicalStrategies(
        serverStrategies.length > 0
          ? serverStrategies
          : [{ titulo: "", descripcion: "" }],
      );
    }
  }, [serverStrategies]);

  useEffect(() => {
    if (serverResources !== undefined) {
      setDidacticResources(
        serverResources.length > 0
          ? serverResources
          : [{ titulo: "", descripcion: "" }],
      );
    }
  }, [serverResources]);

  const addStrategy = () => {
    setMethodologicalStrategies((s) => [
      ...(s || []),
      { titulo: "", descripcion: "" },
    ]);
  };

  const removeStrategy = (index: number) => {
    setMethodologicalStrategies((s) => (s || []).filter((_, i) => i !== index));
  };

  const updateStrategy = (
    index: number,
    field: "titulo" | "descripcion",
    value: string,
  ) => {
    setMethodologicalStrategies((s) =>
      (s || []).map((st, i) => (i === index ? { ...st, [field]: value } : st)),
    );
  };

  const addResource = () => {
    setDidacticResources((r) => [
      ...(r || []),
      { titulo: "", descripcion: "" },
    ]);
  };

  const removeResource = (index: number) => {
    setDidacticResources((r) => (r || []).filter((_, i) => i !== index));
  };

  const updateResource = (
    index: number,
    field: "titulo" | "descripcion",
    value: string,
  ) => {
    setDidacticResources((r) =>
      (r || []).map((res, i) =>
        i === index ? { ...res, [field]: value } : res,
      ),
    );
  };

  const handleNextStep = async () => {
    if (isLastStep) {
      await finalizeSyllabus();
      return;
    }

    const normalizedId = syllabusId ? String(syllabusId).trim() : "";
    const isValidId = normalizedId !== "" && /^\d+$/.test(normalizedId);

    if (!isValidId) {
      toast.error("ID del syllabus no válido");
      return;
    }

    if (
      methodologicalStrategies === undefined ||
      didacticResources === undefined
    ) {
      toast.error("Esperando datos del servidor...");
      return;
    }

    try {
      await Promise.all([
        saveStrategiesMutation.mutateAsync({
          syllabusId: normalizedId,
          estrategias: methodologicalStrategies,
        }),
        saveResourcesMutation.mutateAsync({
          syllabusId: normalizedId,
          recursos: didacticResources,
        }),
      ]);

      toast.success("Datos guardados correctamente");
      nextStep();
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Error desconocido";
      toast.error(`Error al guardar: ${errorMessage}`);
      console.error("Error guardando datos del paso 5:", err);
    }
  };

  const isSaving =
    saveStrategiesMutation.isPending || saveResourcesMutation.isPending;

  const totalStrategies = methodologicalStrategies?.length ?? 0;
  const totalResources = didacticResources?.length ?? 0;

  const inputClass =
    "w-full h-11 rounded-xl px-4 bg-gray-50 border border-gray-200 text-sm text-gray-700 placeholder:text-gray-400 outline-none transition-all focus:bg-white focus:ring-2 focus:ring-red-500 focus:border-transparent";

  const textareaClass =
    "w-full min-h-[110px] rounded-xl px-4 py-3 bg-gray-50 border border-gray-200 text-sm text-gray-700 placeholder:text-gray-400 resize-y outline-none transition-all focus:bg-white focus:ring-2 focus:ring-red-500 focus:border-transparent";

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
                              />
                            </div>
                          </div>

                          <button
                            type="button"
                            onClick={() => removeStrategy(index)}
                            className="w-10 h-10 flex items-center justify-center text-red-600 bg-red-50 hover:bg-red-100 rounded-xl transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                            disabled={methodologicalStrategies.length <= 1}
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
                      className="w-full h-12 flex items-center justify-center gap-2 rounded-xl border border-red-100 bg-red-50 text-red-700 hover:bg-red-100 transition-colors font-semibold text-sm"
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
                              />
                            </div>
                          </div>

                          <button
                            type="button"
                            onClick={() => removeResource(index)}
                            className="w-10 h-10 flex items-center justify-center text-red-600 bg-red-50 hover:bg-red-100 rounded-xl transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                            disabled={didacticResources.length <= 1}
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
                      className="w-full h-12 flex items-center justify-center gap-2 rounded-xl border border-red-100 bg-red-50 text-red-700 hover:bg-red-100 transition-colors font-semibold text-sm"
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