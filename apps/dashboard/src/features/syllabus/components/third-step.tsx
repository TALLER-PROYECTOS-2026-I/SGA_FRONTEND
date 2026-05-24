import { useState, useEffect, useMemo, useRef } from "react";
import { useSteps } from "../contexts/steps-context-provider";
import { useSyllabusContext } from "../contexts/syllabus-context";
import { Step } from "./step";
import { CoordinatorCommentsBanner } from "./coordinator-comments-banner";
import {
  X,
  Plus,
  Target,
  BookOpen,
  ListChecks,
  HeartHandshake,
  Loader2,
  Info,
  AlertTriangle,
  Hash,
} from "lucide-react";
import { toast } from "sonner";
import {
  useThirdStepData,
  useUpdateCompetencias,
  useUpdateActitudes,
  useUpdateComponentes,
} from "../hooks/third-step-query";
import { usePermissionsContext } from "../hooks/use-permissions-context";
import { useSyllabusEditLock } from "../hooks/use-syllabus-edit-lock";
import { useReviewMode } from "../../coordinator/contexts/review-mode-context";
import { useIsDraftCreateMode } from "../create-draft/is-draft-create";
import { useCreateDraft } from "../create-draft/create-draft-context";

interface CompetenciaItem {
  id: string;
  text: string;
  code: string;
}

interface ComponenteItem {
  id: string;
  text: string;
  code: string;
}

interface ContenidoActitudinalItem {
  id: string;
  text: string;
  code: string;
}

interface FormData {
  competencias: CompetenciaItem[];
  componentes: ComponenteItem[];
  contenidosActitudinales: ContenidoActitudinalItem[];
}

type SectionKey = keyof FormData;

export default function ThirdStep() {
  const { nextStep } = useSteps();
  const { syllabusId, courseName } = useSyllabusContext();
  const { isDraftCreateMode } = useIsDraftCreateMode();
  const { draft, setThirdStepData } = useCreateDraft();
  const {
    hasEditPermissionForSection,
    getCommentsForSection,
    isDisapprovedCorrection,
  } = usePermissionsContext();
  const coordinatorComments = getCommentsForSection(3);
  const { isReviewMode } = useReviewMode();

  const resolvedSyllabusId = useMemo(() => {
    const params = new URLSearchParams(window.location.search);

    const fromQuery = Number(params.get("syllabusId") || params.get("id"));

    if (Number.isFinite(fromQuery) && fromQuery > 0) {
      return fromQuery;
    }

    const fromContext = Number(syllabusId);

    if (Number.isFinite(fromContext) && fromContext > 0) {
      return fromContext;
    }

    return null;
  }, [syllabusId]);

  const { isLockedByState, isResolvingState } =
    useSyllabusEditLock(resolvedSyllabusId);

  const canEdit =
    !isReviewMode &&
    hasEditPermissionForSection(3) &&
    !isLockedByState &&
    !isResolvingState;

  const {
    data: thirdStepData,
    isLoading,
    isFetching,
  } = useThirdStepData(isDraftCreateMode ? null : resolvedSyllabusId);

  const updateCompetencias = useUpdateCompetencias();
  const updateComponentes = useUpdateComponentes();
  const updateActitudes = useUpdateActitudes();

  const [formData, setFormData] = useState<FormData>({
    competencias: [],
    componentes: [],
    contenidosActitudinales: [],
  });
  const [showCodes, setShowCodes] = useState(false);
  const userChangedCodeVisibilityRef = useRef(false);
  const hasHydratedDraftRef = useRef(false);

  const originalDataRef = useRef<FormData>({
    competencias: [],
    componentes: [],
    contenidosActitudinales: [],
  });

  useEffect(() => {
    if (!isDraftCreateMode || hasHydratedDraftRef.current) return;

    if (draft.competencias) {
      setFormData({
        competencias: draft.competencias.competencias,
        componentes: draft.competencias.componentes,
        contenidosActitudinales: draft.competencias.contenidosActitudinales,
      });
      setShowCodes(draft.competencias.showCodes ?? false);
      originalDataRef.current = JSON.parse(
        JSON.stringify({
          competencias: draft.competencias.competencias,
          componentes: draft.competencias.componentes,
          contenidosActitudinales: draft.competencias.contenidosActitudinales,
        }),
      );
      hasHydratedDraftRef.current = true;
    }
  }, [isDraftCreateMode, draft.competencias]);

  useEffect(() => {
    if (isDraftCreateMode) return;
    if (isLoading || isFetching) return;

    if (thirdStepData) {
      const mappedData = {
        competencias: thirdStepData.competenciasPrincipales.map((item) => ({
          id: String(item.id || `temp-${Date.now()}`),
          text: item.text,
          code: item.code || "",
        })),
        componentes: thirdStepData.componentes.map((item) => ({
          id: String(item.id || `temp-${Date.now()}`),
          text: item.text,
          code: item.code || "",
        })),
        contenidosActitudinales: thirdStepData.actitudinales.map((item) => ({
          id: String(item.id || `temp-${Date.now()}`),
          text: item.text,
          code: item.code || "",
        })),
      };

      setFormData(mappedData);
      originalDataRef.current = JSON.parse(JSON.stringify(mappedData));

      if (!userChangedCodeVisibilityRef.current) {
        const hasAnyCode =
          mappedData.competencias.some((item) => item.code?.trim()) ||
          mappedData.componentes.some((item) => item.code?.trim()) ||
          mappedData.contenidosActitudinales.some((item) =>
            item.code?.trim(),
          );

        setShowCodes(hasAnyCode);
      }
    }
  }, [thirdStepData, isLoading, isFetching]);

  const addItem = (section: keyof FormData) => {
    if (!canEdit) return;

    const newId = `temp-${Date.now()}`;

    let defaultCode = "";

    if (!showCodes) {
      defaultCode = "";
    } else if (section === "componentes") {
      const nextIndex = formData[section].length + 1;
      defaultCode = `g.${nextIndex}`;
    } else if (section === "contenidosActitudinales") {
      const nextIndex = formData[section].length;
      const letter = String.fromCharCode(65 + (nextIndex % 26));
      defaultCode = letter;
    } else {
      defaultCode = "A";
    }

    setFormData((prev) => ({
      ...prev,
      [section]: [...prev[section], { id: newId, text: "", code: defaultCode }],
    }));
  };

  const removeItem = (section: keyof FormData, id: string) => {
    if (!canEdit) return;

    const confirmed = window.confirm(
      "¿Seguro que deseas eliminar este registro?",
    );

    if (!confirmed) return;

    setFormData((prev) => ({
      ...prev,
      [section]: prev[section].filter((item) => item.id !== id),
    }));

    toast.success("Registro eliminado correctamente");
  };

  const updateItem = (section: keyof FormData, id: string, text: string) => {
    if (!canEdit) return;

    setFormData((prev) => ({
      ...prev,
      [section]: prev[section].map((item) =>
        item.id === id ? { ...item, text } : item,
      ),
    }));
  };

  const updateItemCode = (
    section: keyof FormData,
    id: string,
    code: string,
  ) => {
    if (!canEdit) return;

    setFormData((prev) => ({
      ...prev,
      [section]: prev[section].map((item) =>
        item.id === id ? { ...item, code } : item,
      ),
    }));
  };

  const hasRealChanges = (section: keyof FormData): boolean => {
    const current = formData[section];
    const original = originalDataRef.current[section];

    if (current.length !== original.length) return true;

    for (let i = 0; i < current.length; i++) {
      const curr = current[i];
      const orig = original[i];

      if (curr.text !== orig?.text || curr.code !== orig?.code) {
        return true;
      }
    }

    return false;
  };

  const shouldSyncSection = (section: keyof FormData): boolean => {
    if (hasRealChanges(section)) return true;

    return (
      !showCodes && originalDataRef.current[section].some((item) => item.code.trim())
    );
  };

  const codePayload = (code: string) => {
    if (!showCodes) return {};

    return { code: code.trim() };
  };

  const formDataForPersistedState = (): FormData => {
    if (showCodes) return formData;

    return {
      competencias: formData.competencias.map((item) => ({
        ...item,
        code: "",
      })),
      componentes: formData.componentes.map((item) => ({ ...item, code: "" })),
      contenidosActitudinales: formData.contenidosActitudinales.map((item) => ({
        ...item,
        code: "",
      })),
    };
  };

  const handleToggleCodes = () => {
    if (disabledByPermission || isSavingStep) return;

    userChangedCodeVisibilityRef.current = true;
    setShowCodes((current) => !current);
  };

  const validateBeforeSave = () => {
    if (formData.competencias.length === 0) {
      throw new Error("Debe registrar al menos una competencia.");
    }

    if (formData.componentes.length === 0) {
      throw new Error("Debe registrar al menos un componente.");
    }

    const sections = Object.values(formData) as Array<
      Array<CompetenciaItem | ComponenteItem | ContenidoActitudinalItem>
    >;

    const hasEmptyDescription = sections.some((items) =>
      items.some((item) => !item.text.trim()),
    );

    if (hasEmptyDescription) {
      throw new Error("Completa todas las descripciones antes de continuar.");
    }

    if (showCodes) {
      const hasEmptyCode = sections.some((items) =>
        items.some((item) => !item.code.trim()),
      );

      if (hasEmptyCode) {
        throw new Error("Completa el código o desactiva la opción Usar códigos.");
      }
    }
  };

  const runThirdStepPersistence = async (forFooter: boolean) => {
    if (!canEdit) {
      if (forFooter) {
        throw new Error(
          "No tienes permiso para editar competencias y componentes.",
        );
      }

      return;
    }

    if (isLockedByState || isResolvingState) {
      if (forFooter) {
        throw new Error("El sílabo no está disponible para edición.");
      }

      return;
    }

    if (!resolvedSyllabusId) {
      if (forFooter) throw new Error("No se encontró el ID del sílabo");
      toast.error("No se encontró el ID del sílabo");
      return;
    }

    validateBeforeSave();

    const numSyllabusId = Number(resolvedSyllabusId);
    const promises: Promise<{ message?: string }>[] = [];
    let toastId: string | number | undefined;

    try {
      if (shouldSyncSection("competencias")) {
        if (
          !(
            originalDataRef.current.competencias.length === 0 &&
            formData.competencias.length === 0
          )
        ) {
          const competenciasPayload = {
            items: formData.competencias.map((item, index) => {
              const baseItem = {
                text: item.text.trim(),
                ...codePayload(item.code),
                order: index + 1,
              };

              if (!item.id.startsWith("temp-")) {
                return { ...baseItem, id: Number(item.id) };
              }

              return baseItem;
            }),
          };

          promises.push(
            updateCompetencias.mutateAsync({
              syllabusId: numSyllabusId,
              data: competenciasPayload,
            }),
          );
        }
      }

      if (shouldSyncSection("componentes")) {
        if (
          !(
            originalDataRef.current.componentes.length === 0 &&
            formData.componentes.length === 0
          )
        ) {
          const componentesPayload = {
            items: formData.componentes.map((item, index) => {
              const baseItem = {
                text: item.text.trim(),
                ...codePayload(item.code),
                order: index + 1,
              };

              if (!item.id.startsWith("temp-")) {
                return { ...baseItem, id: Number(item.id) };
              }

              return baseItem;
            }),
          };

          promises.push(
            updateComponentes.mutateAsync({
              syllabusId: numSyllabusId,
              data: componentesPayload,
            }),
          );
        }
      }

      if (shouldSyncSection("contenidosActitudinales")) {
        if (
          !(
            originalDataRef.current.contenidosActitudinales.length === 0 &&
            formData.contenidosActitudinales.length === 0
          )
        ) {
          const actitudesPayload = {
            items: formData.contenidosActitudinales.map((item, index) => {
              const baseItem = {
                text: item.text.trim(),
                ...codePayload(item.code),
                order: index + 1,
              };

              if (!item.id.startsWith("temp-")) {
                return { ...baseItem, id: Number(item.id) };
              }

              return baseItem;
            }),
          };

          promises.push(
            updateActitudes.mutateAsync({
              syllabusId: numSyllabusId,
              data: actitudesPayload,
            }),
          );
        }
      }

      if (promises.length > 0) {
        if (!forFooter) {
          toastId = toast.loading("Guardando cambios...");
        }

        const results = await Promise.all(promises);

        if (toastId) {
          toast.dismiss(toastId);
        }

        if (!forFooter) {
          results.forEach((result) => {
            toast.success(result.message || "Cambios guardados correctamente");
          });
        }

        const persistedState = formDataForPersistedState();
        originalDataRef.current = JSON.parse(JSON.stringify(persistedState));
        if (!showCodes) {
          setFormData(persistedState);
        }
      } else if (!forFooter) {
        toast.info("No hay cambios para guardar");
      }
    } catch (error) {
      if (toastId) {
        toast.dismiss(toastId);
      }

      let errorMessage = "Error al guardar los cambios";

      if (error instanceof Error) {
        try {
          const errorObj = JSON.parse(error.message);
          errorMessage = errorObj.message || errorObj.error || error.message;
        } catch {
          errorMessage = error.message;
        }
      }

      throw new Error(errorMessage);
    }
  };

  const handleSubmit = async () => {
    if (isReviewMode) {
      nextStep();
      return;
    }

    if (!canEdit) {
      nextStep();
      return;
    }

    if (isDraftCreateMode) {
      try {
        validateBeforeSave();
        setThirdStepData({
          competencias: formData.competencias,
          componentes: formData.componentes,
          contenidosActitudinales: formData.contenidosActitudinales,
          showCodes,
        });
        nextStep();
      } catch (error) {
        if (error instanceof Error) {
          toast.error(error.message);
        }
      }
      return;
    }

    try {
      await runThirdStepPersistence(false);
      nextStep();
    } catch (error) {
      if (error instanceof Error) {
        toast.error(error.message);
      }
    }
  };

  const totalItems =
    formData.competencias.length +
    formData.componentes.length +
    formData.contenidosActitudinales.length;

  const disabledByPermission =
    !canEdit ||
    isReviewMode ||
    isLockedByState ||
    isResolvingState ||
    (!isDraftCreateMode && (isLoading || isFetching));

  const textAreaClass = `w-full min-h-[90px] rounded-xl px-4 py-3 bg-gray-50 border border-gray-200 text-sm text-gray-700 placeholder:text-gray-400 resize-y outline-none transition-all focus:bg-white focus:ring-2 focus:ring-red-500 focus:border-transparent ${
    disabledByPermission ? "opacity-70 cursor-not-allowed bg-gray-100" : ""
  }`;

  const codeInputClass = `w-full h-11 rounded-xl px-3 bg-gray-50 border border-gray-200 text-sm text-gray-700 text-center font-semibold outline-none transition-all focus:bg-white focus:ring-2 focus:ring-red-500 focus:border-transparent ${
    disabledByPermission ? "opacity-70 cursor-not-allowed bg-gray-100" : ""
  }`;

  const isSavingStep =
    updateCompetencias.isPending ||
    updateComponentes.isPending ||
    updateActitudes.isPending;

  const renderEditableSection = ({
    section,
    title,
    description,
    icon,
    addLabel,
    placeholder,
  }: {
    section: SectionKey;
    title: string;
    description: string;
    icon: React.ReactNode;
    addLabel: string;
    placeholder: string;
  }) => {
    const items = formData[section];

    return (
      <div className="bg-white rounded-2xl border border-gray-100 shadow-md overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 bg-gray-50">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className="w-11 h-11 rounded-xl bg-red-600 text-white flex items-center justify-center shadow-sm">
                {icon}
              </div>

              <div>
                <h3 className="text-lg font-bold text-gray-900">{title}</h3>
                <p className="text-sm text-gray-500 mt-1">{description}</p>
              </div>
            </div>

            <span className="inline-flex items-center justify-center px-3 py-1 rounded-full text-xs font-bold bg-white text-gray-700 border border-gray-100">
              {items.length} registro{items.length === 1 ? "" : "s"}
            </span>
          </div>
        </div>

        <div className="p-6 space-y-4">
          {items.length === 0 && (
            <div className="text-center py-8 rounded-2xl border border-dashed border-gray-200 bg-gray-50">
              <p className="text-sm font-semibold text-gray-700">
                No hay registros agregados.
              </p>
              <p className="text-xs text-gray-400 mt-1">
                Usa el botón inferior para añadir uno nuevo.
              </p>
            </div>
          )}

          {items.map((item, index) => (
            <div
              key={item.id}
              className="rounded-2xl border border-gray-100 bg-gray-50 p-4"
            >
              <div className="flex flex-col lg:flex-row gap-3">
                {showCodes ? (
                  <div className="w-full lg:w-20">
                    <label className="block text-xs font-bold text-gray-500 mb-2">
                      Código
                    </label>
                    <input
                      type="text"
                      value={item.code}
                      onChange={(e) =>
                        updateItemCode(section, item.id, e.target.value)
                      }
                      className={codeInputClass}
                      placeholder="Código"
                      maxLength={10}
                      disabled={disabledByPermission || isSavingStep}
                    />
                  </div>
                ) : null}

                <div className="flex-1">
                  <label className="block text-xs font-bold text-gray-500 mb-2">
                    Descripción
                  </label>
                  <textarea
                    value={item.text}
                    onChange={(e) =>
                      updateItem(section, item.id, e.target.value)
                    }
                    className={textAreaClass}
                    rows={2}
                    placeholder={placeholder}
                    disabled={disabledByPermission || isSavingStep}
                  />
                </div>

                <div className="flex lg:items-end justify-end">
                  <button
                    type="button"
                    onClick={() => removeItem(section, item.id)}
                    className="w-10 h-10 flex items-center justify-center text-red-600 bg-red-50 hover:bg-red-100 rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    disabled={
                      disabledByPermission ||
                      isSavingStep ||
                      ((section === "competencias" ||
                        section === "componentes") &&
                        items.length <= 1)
                    }
                    title="Eliminar"
                  >
                    <X size={19} />
                  </button>
                </div>
              </div>

              <div className="mt-3 text-xs text-gray-400">
                Registro #{index + 1}
              </div>
            </div>
          ))}

          <div className="flex justify-end pt-2">
            <button
              type="button"
              onClick={() => addItem(section)}
              disabled={disabledByPermission || isSavingStep}
              className="h-11 px-5 flex items-center gap-2 rounded-xl border border-red-100 bg-red-50 text-red-700 hover:bg-red-100 transition-colors font-semibold text-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Plus size={18} />
              {addLabel}
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <Step step={3} onNextStep={handleSubmit}>
      <div className="bg-white rounded-2xl border border-gray-100 shadow-xl overflow-hidden">
        <div className="px-8 py-6 border-b border-gray-100 bg-gradient-to-r from-red-50 via-white to-white">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-red-600 text-white flex items-center justify-center shadow-md">
              <span className="text-2xl font-bold">3</span>
            </div>

            <div>
              <h2 className="text-2xl font-bold text-gray-900">
                Competencias y Componentes
              </h2>
              <p className="text-sm text-gray-500 mt-1">
                Define las competencias principales, componentes y contenidos
                actitudinales de la asignatura.
              </p>
            </div>

            <div className="ml-auto hidden md:flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-50 text-blue-700 border border-blue-100 text-xs font-bold">
              Desarrollo académico
            </div>
          </div>
        </div>

        <div className="p-8">
          <CoordinatorCommentsBanner
            stepNumber={3}
            comments={coordinatorComments}
          />

          {!canEdit && (
            <div className="mb-6 rounded-xl border border-yellow-300 bg-yellow-50 px-6 py-5 text-yellow-800">
              <div className="flex items-start gap-4">
                <div className="mt-1 flex h-10 w-10 items-center justify-center rounded-xl bg-yellow-500 text-white">
                  <AlertTriangle size={22} />
                </div>

                <div>
                  <p className="font-bold">
                    {isReviewMode ? "Modo revisión" : "Modo solo lectura"}
                  </p>

                  <p className="mt-1 text-sm">
                    {isReviewMode
                      ? "Estás revisando este paso en modo coordinador. Puedes consultar las competencias y componentes, pero no modificarlos."
                      : isDisapprovedCorrection
                        ? "Esta sección no tiene observaciones del coordinador, por eso permanece bloqueada."
                        : "No tienes permiso para editar esta sección. Puedes revisar la información, pero no modificarla."}
                  </p>
                </div>
              </div>
            </div>
          )}

          <div className="mb-7 rounded-2xl border border-gray-100 bg-gray-50 p-5">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center">
                  <BookOpen size={20} />
                </div>

                <div>
                  <h3 className="font-bold text-gray-900">
                    Asignatura seleccionada
                  </h3>
                  <p className="text-sm text-gray-600 mt-1">
                    {courseName || "Sin nombre de asignatura"}
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <div className="px-4 py-2 rounded-xl bg-white border border-gray-100 shadow-sm">
                  <p className="text-xs font-semibold text-gray-400 uppercase">
                    Total registros
                  </p>
                  <p className="text-xl font-bold text-gray-900">
                    {totalItems}
                  </p>
                </div>

                <div className="px-4 py-2 rounded-xl bg-white border border-gray-100 shadow-sm">
                  <p className="text-xs font-semibold text-gray-400 uppercase">
                    Competencias
                  </p>
                  <p className="text-xl font-bold text-gray-900">
                    {formData.competencias.length}
                  </p>
                </div>

                <div className="px-4 py-2 rounded-xl bg-white border border-gray-100 shadow-sm">
                  <p className="text-xs font-semibold text-gray-400 uppercase">
                    Componentes
                  </p>
                  <p className="text-xl font-bold text-gray-900">
                    {formData.componentes.length}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="mb-6 rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-slate-900 text-white flex items-center justify-center">
                  <Hash size={20} />
                </div>

                <div>
                  <h3 className="font-bold text-gray-900">
                    Códigos en competencias y componentes
                  </h3>
                  <p className="text-sm text-gray-500 mt-1">
                    Activa esta opción solo si el sílabo requiere códigos en
                    competencias, componentes o contenidos actitudinales.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={handleToggleCodes}
                disabled={disabledByPermission || isSavingStep}
                className={`inline-flex items-center justify-center gap-2 rounded-xl border px-4 py-2 text-sm font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-60 ${
                  showCodes
                    ? "border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-100"
                    : "border-gray-200 bg-white text-gray-700 hover:bg-gray-50"
                }`}
              >
                <Hash size={16} />
                {showCodes ? "Ocultar códigos" : "Usar códigos"}
              </button>
            </div>
          </div>

          {!isDraftCreateMode && (isLoading || isFetching) && (
            <div className="mb-6 rounded-xl border border-blue-100 bg-blue-50 px-4 py-3 text-sm text-blue-700 flex items-center gap-2">
              <Loader2 size={18} className="animate-spin" />
              Cargando datos...
            </div>
          )}

          <div className="mb-6 bg-blue-50 rounded-2xl border border-blue-100 p-5">
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-xl bg-blue-600 text-white flex items-center justify-center shrink-0">
                <Info size={18} />
              </div>

              <div>
                <h3 className="font-bold text-blue-900">Recomendación</h3>
                <p className="text-sm text-blue-700 leading-relaxed mt-1">
                  Completa cada registro con una descripción clara. Si el sílabo
                  requiere identificadores, activa la opción de códigos antes de
                  guardar.
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-7">
            {renderEditableSection({
              section: "competencias",
              title: "3.1 Competencia",
              description:
                "Describe las competencias principales que desarrollará el estudiante.",
              icon: <Target size={22} />,
              addLabel: "Agregar competencia",
              placeholder: "Ingrese la competencia...",
            })}

            {renderEditableSection({
              section: "componentes",
              title: "3.2 Componentes",
              description:
                "Registra los componentes asociados a las competencias de la asignatura.",
              icon: <ListChecks size={22} />,
              addLabel: "Agregar componente",
              placeholder: "Ingrese el componente...",
            })}

            {renderEditableSection({
              section: "contenidosActitudinales",
              title: "3.3 Contenidos actitudinales",
              description:
                "Incluye actitudes, valores o disposiciones esperadas en el proceso de aprendizaje.",
              icon: <HeartHandshake size={22} />,
              addLabel: "Agregar contenido actitudinal",
              placeholder: "Ingrese el contenido actitudinal...",
            })}
          </div>
        </div>
      </div>
    </Step>
  );
}
