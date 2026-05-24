import { useState, useEffect, useMemo } from "react";
import { useSteps } from "../contexts/steps-context-provider";
import { useSyllabusContext } from "../contexts/syllabus-context";
import { toast } from "sonner";
import { useReviewMode } from "../../coordinator/contexts/review-mode-context";
import { Step } from "./step";
import {
  useSyllabusGeneral,
  useSaveDatosGenerales,
  type DatosGeneralesData,
  type SyllabusGeneral,
} from "../hooks/first-step-query";
import { usePermissionsContext } from "../hooks/use-permissions-context";
import { useSyllabusEditLock } from "../hooks/use-syllabus-edit-lock";
import { AlertTriangle } from "lucide-react";
import { CoordinatorCommentsBanner } from "./coordinator-comments-banner";
import { CurriculumContextInline } from "./curriculum-context-inline";
import type { DatosGenerales } from "../../coordinator/hooks/syllabus-section-data-query";
import { useCreateDraft } from "../create-draft/create-draft-context";
import {
  debugDraftCreateMode,
  useIsDraftCreateMode,
} from "../create-draft/is-draft-create";
import {
  draftGeneralDataToContextGeneralData,
  draftGeneralDataToFormState,
  mapFormToDraftGeneralData,
} from "../create-draft/mappers";

const getCurrentSemester = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1;

  return month <= 6 ? `${year}-I` : `${year}-II`;
};

const INSTITUTIONAL_DEFAULTS = {
  departamentoAcademico: "Departamento de Ingeniería",
  escuelaProfesional: "Ingeniería de Computación y Sistemas",
  programaAcademico: "Ingeniería de Computación y Sistemas",
} as const;

const fixedGeneralFields = new Set([
  "departamentoAcademico",
  "escuelaProfesional",
  "programaAcademico",
  "semestreAcademico",
]);

type FormState = {
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
  [key: string]: string;
};

function buildDatosGeneralesPutPayload(
  form: FormState,
  horasTeoria: number,
  horasPractica: number,
  creditosTeoria: number,
  creditosPractica: number,
) {
  return {
    cursoNombre: form.nombreAsignatura,
    cursoCodigo: form.codigoAsignatura,
    departamentoAcademico: form.departamentoAcademico,
    escuelaProfesional: form.escuelaProfesional,
    programaAcademico: form.programaAcademico,
    semestreAcademico: form.semestreAcademico,
    tipoAsignatura: form.tipoAsignatura,
    tipoDeEstudios: form.tipoEstudios,
    modalidadDeAsignatura: form.modalidad,
    ciclo: form.ciclo,
    requisitos: form.requisitos,
    horasTeoria,
    horasPractica,
    horasLaboratorio: 0,
    horasTotales: horasTeoria + horasPractica,
    creditosTotales: creditosTeoria + creditosPractica,
  };
}

const createEmptyForm = (): FormState => ({
  nombreAsignatura: "",
  departamentoAcademico: INSTITUTIONAL_DEFAULTS.departamentoAcademico,
  escuelaProfesional: INSTITUTIONAL_DEFAULTS.escuelaProfesional,
  programaAcademico: INSTITUTIONAL_DEFAULTS.programaAcademico,
  semestreAcademico: getCurrentSemester(),
  tipoAsignatura: "",
  tipoEstudios: "",
  modalidad: "",
  codigoAsignatura: "",
  ciclo: "",
  requisitos: "",
  creditosTeoria: "",
  creditosPractica: "",
  creditosTotal: "",
  docentes: "",
  horasTeoria: "",
  horasPractica: "",
});

function hydrateFormFromGeneralData(
  json: SyllabusGeneral | DatosGenerales,
): FormState {
  const creditosTeoria = Number(json.creditosTeoria ?? 0);
  const creditosPractica = Number(json.creditosPractica ?? 0);
  const creditosTotales =
    "creditosTotales" in json && json.creditosTotales != null
      ? Number(json.creditosTotales)
      : creditosTeoria + creditosPractica;

  return {
    ...createEmptyForm(),
    nombreAsignatura: json.nombreAsignatura ?? "",
    departamentoAcademico: json.departamentoAcademico ?? "",
    escuelaProfesional: json.escuelaProfesional ?? "",
    programaAcademico: json.programaAcademico ?? "",
    semestreAcademico: json.semestreAcademico ?? getCurrentSemester(),
    tipoAsignatura: json.tipoAsignatura ?? "",
    tipoEstudios: json.tipoEstudios ?? "",
    modalidad: json.modalidad ?? "",
    codigoAsignatura: json.codigoAsignatura ?? "",
    ciclo: json.ciclo ?? "",
    requisitos: json.requisitos ?? "",
    creditosTeoria:
      json.creditosTeoria != null ? String(json.creditosTeoria) : "",
    creditosPractica:
      json.creditosPractica != null ? String(json.creditosPractica) : "",
    creditosTotal: String(creditosTotales),
    docentes: json.docentes ?? "",
    horasTeoria: json.horasTeoria != null ? String(json.horasTeoria) : "",
    horasPractica: json.horasPractica != null ? String(json.horasPractica) : "",
  };
}

export default function FirstStep() {
  const { nextStep } = useSteps();
  const {
    hasEditPermissionForSection,
    getCommentsForSection,
    isDisapprovedCorrection,
  } = usePermissionsContext();
  const coordinatorComments = getCommentsForSection(1);
  const saveDatosGenerales = useSaveDatosGenerales();

  const { setCourseName, setGeneralData, mode } = useSyllabusContext();
  const { draft, setGeneralData: setDraftGeneralData } = useCreateDraft();
  const { isDraftCreateMode, resolvedSyllabusId } = useIsDraftCreateMode();

  const { isReviewMode, sectionData } = useReviewMode();

  const { isLockedByState, isResolvingState } =
    useSyllabusEditLock(resolvedSyllabusId);

  const isCreateMode = mode === "create";

  const canEdit =
    isCreateMode ||
    (!isReviewMode &&
      hasEditPermissionForSection(1) &&
      !isLockedByState &&
      !isResolvingState);

  const isReadOnly = !canEdit;

  const draftKey = resolvedSyllabusId
    ? `syllabus:general:${resolvedSyllabusId}`
    : "syllabus:general:create";

  const [form, setForm] = useState<FormState>(() => createEmptyForm());
  const [hasHydrated, setHasHydrated] = useState(false);

  const [apiError, setApiError] = useState("");
  const [totalHours, setTotalHours] = useState(0);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isCreating, setIsCreating] = useState(false);

  const { data, isLoading, isFetching, isError, error } = useSyllabusGeneral(
    isDraftCreateMode ? null : resolvedSyllabusId,
  );

  const inputsDisabled =
    isReadOnly ||
    isCreating ||
    isLoading ||
    isFetching ||
    isResolvingState ||
    saveDatosGenerales.isPending;

  useEffect(() => {
    if (isDraftCreateMode) return;

    setHasHydrated(false);
    setApiError("");
    setErrors({});
  }, [resolvedSyllabusId, isDraftCreateMode]);

  useEffect(() => {
    if (!isDraftCreateMode) return;

    if (!draft.generalData) {
      setForm(createEmptyForm());
      setTotalHours(0);
      setErrors({});
      setApiError("");
      setHasHydrated(true);
      return;
    }

    if (hasHydrated) return;

    const hydrated = draftGeneralDataToFormState(draft.generalData);
    const horasTeoria = Number(hydrated.horasTeoria || 0);
    const horasPractica = Number(hydrated.horasPractica || 0);

    setTotalHours(horasTeoria + horasPractica);
    setForm(hydrated);

    if (hydrated.nombreAsignatura) {
      setCourseName(hydrated.nombreAsignatura);
    }

    setGeneralData(draftGeneralDataToContextGeneralData(draft.generalData));
    setHasHydrated(true);
  }, [
    isDraftCreateMode,
    hasHydrated,
    draft.generalData,
    setCourseName,
    setGeneralData,
  ]);

  useEffect(() => {
    if (isDraftCreateMode) return;

    if (isError) {
      setApiError(error?.message ?? "Error fetching syllabus");
      return;
    }

    if (!data || hasHydrated) return;

    const hydrated = hydrateFormFromGeneralData(data);
    const horasTeoria = Number(hydrated.horasTeoria || 0);
    const horasPractica = Number(hydrated.horasPractica || 0);
    const horasTotales = Number(
      data.horasTotales ?? horasTeoria + horasPractica,
    );

    setTotalHours(horasTotales);
    setForm(hydrated);

    if (hydrated.nombreAsignatura) {
      setCourseName(hydrated.nombreAsignatura);
    }

    setHasHydrated(true);
  }, [data, isError, error, isDraftCreateMode, hasHydrated, setCourseName]);

  useEffect(() => {
    if (!isReviewMode || !sectionData) return;

    const json = sectionData as DatosGenerales;
    const hydrated = hydrateFormFromGeneralData(json);
    const hasContent = Boolean(
      hydrated.nombreAsignatura.trim() ||
        hydrated.departamentoAcademico.trim() ||
        hydrated.codigoAsignatura.trim(),
    );

    if (!hasContent) return;

    const horasTeoria = Number(hydrated.horasTeoria || 0);
    const horasPractica = Number(hydrated.horasPractica || 0);

    setTotalHours(horasTeoria + horasPractica);
    setForm(hydrated);

    if (hydrated.nombreAsignatura) {
      setCourseName(hydrated.nombreAsignatura);
    }

    setHasHydrated(true);
  }, [isReviewMode, sectionData, setCourseName]);

  useEffect(() => {
    const teoria = Number(form.creditosTeoria || 0);
    const practica = Number(form.creditosPractica || 0);
    const totalCreditos = teoria + practica;

    if (form.creditosTotal !== String(totalCreditos)) {
      setForm((prev) => ({
        ...prev,
        creditosTotal: String(totalCreditos),
      }));
    }
  }, [form.creditosTeoria, form.creditosPractica, form.creditosTotal]);

  useEffect(() => {
    const teoria = Number(form.horasTeoria || 0);
    const practica = Number(form.horasPractica || 0);

    setTotalHours(teoria + practica);
  }, [form.horasTeoria, form.horasPractica]);

  const fields: Array<[string, string]> = useMemo(
    () => [
      ["Departamento Académico", "departamentoAcademico"],
      ["Escuela Profesional", "escuelaProfesional"],
      ["Programa académico", "programaAcademico"],
      ["Semestre Académico", "semestreAcademico"],
      ["Tipo de asignatura", "tipoAsignatura"],
      ["Tipo de estudios", "tipoEstudios"],
      ["Modalidad de la asignatura", "modalidad"],
      ["Código de la asignatura", "codigoAsignatura"],
      ["Ciclo", "ciclo"],
      ["Requisitos curriculares", "requisitos"],
      ["Cantidad de horas", "horas"],
      ["Cantidad de Créditos", "creditos"],
      ["Docente(s)", "docentes"],
    ],
    [],
  );

  const assignedTeacherDisplay = form.docentes.trim()
    ? `Docente asignado: ${form.docentes.trim()}`
    : "Pendiente de asignación por director.";

  const updateField = (name: string, value: string) => {
    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));

    if (name === "nombreAsignatura") {
      setCourseName(value);
    }

    setErrors((prev) => ({
      ...prev,
      [name]: "",
    }));
  };

  const clearField = (name: string) => {
    updateField(name, "");
  };

  const ClearButton = ({
    fieldName,
    visible,
  }: {
    fieldName: string;
    visible: boolean;
  }) => {
    if (!visible) return null;

    return (
      <button
        type="button"
        onClick={() => clearField(fieldName)}
        className="absolute right-3 top-1/2 -translate-y-1/2 h-7 w-7 rounded-full text-gray-400 hover:text-red-600 hover:bg-red-50 flex items-center justify-center transition-colors"
        title="Limpiar campo"
      >
        ×
      </button>
    );
  };

  const validate = () => {
    const e: Record<string, string> = {};

    const required: Array<keyof FormState> = [
      "nombreAsignatura",
      "departamentoAcademico",
      "escuelaProfesional",
      "programaAcademico",
      "semestreAcademico",
      "tipoAsignatura",
      "tipoEstudios",
      "modalidad",
      "codigoAsignatura",
      "ciclo",
      "creditosTeoria",
      "creditosPractica",
      "horasTeoria",
      "horasPractica",
    ];

    for (const k of required) {
      if (!String(form[k] ?? "").trim()) {
        e[String(k)] = "Campo obligatorio";
      }
    }

    const numericFields: Array<keyof FormState> = [
      "creditosTeoria",
      "creditosPractica",
      "horasTeoria",
      "horasPractica",
    ];

    for (const k of numericFields) {
      const v = String(form[k] ?? "").trim();

      if (!v) continue;

      if (Number.isNaN(Number(v))) {
        e[String(k)] = "Debe ser un número";
        continue;
      }

      if (Number(v) < 0) {
        e[String(k)] = "Debe ser un número mayor o igual a 0";
      }
    }

    setErrors(e);
    return e;
  };

  const persistStep1 = async () => {
    const e = validate();

    if (Object.keys(e).length > 0) {
      const firstKey = Object.keys(e)[0];
      const el = document.querySelector(
        `[name="${firstKey}"]`,
      ) as HTMLElement | null;

      if (el && typeof el.focus === "function") {
        el.focus();
      }

      throw new Error(
        e[firstKey] || "Corrija los errores del formulario antes de guardar.",
      );
    }

    const horasTeoria = Number(form.horasTeoria || 0);
    const horasPractica = Number(form.horasPractica || 0);
    const creditosTeoria = Number(form.creditosTeoria || 0);
    const creditosPractica = Number(form.creditosPractica || 0);
    const draftPayload = {
      ...form,
      totalHours: horasTeoria + horasPractica,
    };

    localStorage.setItem(draftKey, JSON.stringify(draftPayload));

    setCourseName(form.nombreAsignatura);

    setGeneralData(
      draftGeneralDataToContextGeneralData(mapFormToDraftGeneralData(form)),
    );

    if (isDraftCreateMode) {
      return;
    }

    if (resolvedSyllabusId && !isReadOnly) {
      await saveDatosGenerales.mutateAsync({
        syllabusId: resolvedSyllabusId,
        data: buildDatosGeneralesPutPayload(
          form,
          horasTeoria,
          horasPractica,
          creditosTeoria,
          creditosPractica,
        ) as DatosGeneralesData,
        isCreating: false,
      });

      setHasHydrated(false);
    }
  };

  const validateAndNext = async () => {
    if (isReviewMode) {
      nextStep();
      return;
    }

    if (!canEdit) {
      nextStep();
      return;
    }

    if (isDraftCreateMode) {
      debugDraftCreateMode(true, "first-step validateAndNext");

      const e = validate();
      if (Object.keys(e).length > 0) {
        const firstKey = Object.keys(e)[0];
        const el = document.querySelector(
          `[name="${firstKey}"]`,
        ) as HTMLElement | null;

        if (el && typeof el.focus === "function") {
          el.focus();
        }

        toast.error(
          e[firstKey] ||
            "Corrija los errores del formulario antes de continuar.",
        );
        return;
      }

      if (import.meta.env.DEV) {
        console.debug("[CREATE DRAFT] step1 next - saving draft only");
      }

      try {
        setIsCreating(true);
        const generalData = mapFormToDraftGeneralData(form);
        setDraftGeneralData(generalData);
        setCourseName(form.nombreAsignatura);
        setGeneralData(draftGeneralDataToContextGeneralData(generalData));
        nextStep();
      } finally {
        setIsCreating(false);
      }

      return;
    }

    try {
      setIsCreating(true);
      await persistStep1();
      nextStep();
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Error al guardar los datos generales";
      toast.error(message);
    } finally {
      setIsCreating(false);
    }
  };

  const inputClass = (hasError?: boolean, disabled?: boolean) =>
    `w-full h-11 rounded-xl px-4 border text-sm transition-all outline-none ${
      disabled
        ? "bg-gray-100 border-gray-200 text-gray-600 cursor-not-allowed"
        : "bg-gray-50 border-gray-200 text-gray-700 focus:bg-white focus:ring-2 focus:ring-red-500 focus:border-transparent"
    } ${hasError ? "border-red-500 focus:ring-red-500" : ""}`;

  const textareaClass = (hasError?: boolean, disabled?: boolean) =>
    `w-full min-h-[88px] rounded-xl px-4 py-3 border text-sm resize-none transition-all outline-none ${
      disabled
        ? "bg-gray-100 border-gray-200 text-gray-600 cursor-not-allowed"
        : "bg-gray-50 border-gray-200 text-gray-700 focus:bg-white focus:ring-2 focus:ring-red-500 focus:border-transparent"
    } ${hasError ? "border-red-500 focus:ring-red-500" : ""}`;

  const readonlyBoxClass =
    "w-full min-h-11 rounded-xl px-4 py-3 bg-gray-100 border border-gray-200 text-sm text-gray-700 flex items-center";

  const errorText = (name: string) =>
    errors[name] ? (
      <div className="text-red-600 text-xs font-medium mt-1">
        {errors[name]}
      </div>
    ) : null;

  const renderInput = (name: string) => {
    const value = String(form[name] ?? "");
    const disabled =
      inputsDisabled || (isCreateMode && fixedGeneralFields.has(name));
    const canClear = !disabled && value.trim() !== "";

    return (
      <>
        <div className="relative">
          <input
            name={name}
            value={value}
            onChange={(e) => updateField(name, e.target.value)}
            disabled={disabled}
            className={`${inputClass(Boolean(errors[name]), disabled)} ${
              canClear ? "pr-10" : ""
            }`}
          />

          <ClearButton fieldName={name} visible={canClear} />
        </div>

        {errorText(name)}
      </>
    );
  };

  return (
    <Step step={1} onNextStep={validateAndNext}>
      <div className="bg-white rounded-2xl border border-gray-100 shadow-xl overflow-visible">
        <div className="px-8 py-6 border-b border-gray-100 bg-gradient-to-r from-red-50 via-white to-white">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-red-600 text-white flex items-center justify-center shadow-md">
              <span className="text-2xl font-bold">1</span>
            </div>

            <div>
              <h2 className="text-2xl font-bold text-gray-900">
                Datos Generales
              </h2>
              <p className="text-sm text-gray-500 mt-1">
                Registra la información principal de la asignatura y del sílabo.
              </p>
            </div>

            <div className="ml-auto hidden md:flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-50 text-blue-700 border border-blue-100 text-xs font-bold">
              Información inicial
            </div>
          </div>
        </div>

        <div className="p-8 pb-24">
          {(isLoading || isFetching) && !isCreateMode && (
            <div className="mb-5 rounded-xl border border-blue-100 bg-blue-50 px-4 py-3 text-sm text-blue-700">
              Cargando datos generales...
            </div>
          )}

          {apiError && (
            <div className="mb-5 rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700">
              Error cargando datos: {apiError}
            </div>
          )}

          <CoordinatorCommentsBanner
            stepNumber={1}
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
                      ? "Estás revisando esta sección en modo coordinador. Puedes consultar los datos generales, pero no modificarlos."
                      : isDisapprovedCorrection
                        ? "Esta sección no tiene observaciones del coordinador, por eso permanece bloqueada."
                        : "No tienes permiso para editar esta sección. Puedes revisar los datos generales, pero no modificarlos."}
                  </p>
                </div>
              </div>
            </div>
          )}

          <div className="mb-8">
            <label className="block text-sm font-bold text-gray-900 mb-2">
              Nombre de la asignatura
            </label>

            {canEdit ? (
              <div className="relative">
                <input
                  name="nombreAsignatura"
                  value={form.nombreAsignatura}
                  onChange={(e) =>
                    updateField("nombreAsignatura", e.target.value)
                  }
                  placeholder="Nombre de la asignatura"
                  disabled={inputsDisabled}
                  className={`w-full h-12 rounded-xl px-4 pr-10 border text-base font-semibold transition-all outline-none ${
                    errors.nombreAsignatura
                      ? "border-red-500 focus:ring-red-500"
                      : "border-gray-200 focus:ring-red-500"
                  } bg-gray-50 focus:bg-white focus:ring-2 focus:border-transparent`}
                />

                <ClearButton
                  fieldName="nombreAsignatura"
                  visible={
                    !inputsDisabled && form.nombreAsignatura.trim() !== ""
                  }
                />
              </div>
            ) : (
              <div className="w-full h-12 rounded-xl px-4 flex items-center text-base font-semibold bg-blue-50 border border-blue-100 text-blue-900">
                {form.nombreAsignatura || "Sin nombre de asignatura"}
              </div>
            )}

            {errorText("nombreAsignatura")}
          </div>

          <div className="mb-6 rounded-xl border border-blue-100 bg-blue-50 px-5 py-4 text-sm text-blue-800">
            Los datos institucionales se generan automáticamente. El director
            asignará el docente responsable después de crear el sílabo.
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-2 gap-x-8 gap-y-6">
            {fields.map(([label, name]) => (
              <div
                key={name}
                className={
                  name === "requisitos" || name === "docentes"
                    ? "xl:col-span-2"
                    : ""
                }
              >
                {name !== "requisitos" && (
                  <label className="block text-sm font-bold text-gray-900 mb-2">
                    {label}
                  </label>
                )}

                {name === "requisitos" ? (
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-bold text-gray-900 mb-2">
                        Requisitos curriculares
                      </label>

                      <CurriculumContextInline
                        syllabusId={resolvedSyllabusId}
                        courseName={form.nombreAsignatura}
                        disabled={inputsDisabled}
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-bold text-gray-900 mb-2">
                        Requisitos adicionales
                      </label>

                      {canEdit ? (
                        <div className="relative">
                          <textarea
                            name="requisitos"
                            value={form.requisitos}
                            onChange={(e) =>
                              updateField("requisitos", e.target.value)
                            }
                            placeholder="Ingrese requisitos adicionales si corresponde..."
                            disabled={inputsDisabled}
                            className={`${textareaClass(
                              Boolean(errors.requisitos),
                              inputsDisabled,
                            )} ${form.requisitos.trim() && !inputsDisabled ? "pr-12" : ""}`}
                          />

                          {form.requisitos.trim() && !inputsDisabled && (
                            <button
                              type="button"
                              onClick={() => clearField("requisitos")}
                              className="absolute right-3 top-3 h-7 w-7 rounded-full text-gray-400 hover:text-red-600 hover:bg-red-50 flex items-center justify-center transition-colors"
                              title="Limpiar requisitos adicionales"
                            >
                              ×
                            </button>
                          )}
                        </div>
                      ) : (
                        <div className={readonlyBoxClass}>
                          {form.requisitos.trim()
                            ? form.requisitos
                            : "Sin requisitos adicionales"}
                        </div>
                      )}

                      {errorText("requisitos")}
                    </div>
                  </div>
                ) : name === "creditos" ? (
                  <div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      {canEdit ? (
                        <>
                          <input
                            type="number"
                            min="0"
                            step="1"
                            name="creditosTeoria"
                            value={form.creditosTeoria}
                            onChange={(e) =>
                              updateField("creditosTeoria", e.target.value)
                            }
                            placeholder="Teoría"
                            disabled={inputsDisabled}
                            className={inputClass(
                              Boolean(errors.creditosTeoria),
                              inputsDisabled,
                            )}
                          />

                          <input
                            type="number"
                            min="0"
                            step="1"
                            name="creditosPractica"
                            value={form.creditosPractica}
                            onChange={(e) =>
                              updateField("creditosPractica", e.target.value)
                            }
                            placeholder="Práctica"
                            disabled={inputsDisabled}
                            className={inputClass(
                              Boolean(errors.creditosPractica),
                              inputsDisabled,
                            )}
                          />

                          <input
                            name="creditosTotal"
                            value={form.creditosTotal}
                            readOnly
                            tabIndex={-1}
                            className="w-full h-11 rounded-xl px-4 border border-gray-200 bg-gray-100 text-sm text-gray-700 text-center font-semibold cursor-not-allowed outline-none"
                          />
                        </>
                      ) : (
                        <>
                          <div className={readonlyBoxClass}>
                            Teoría (
                            {String(form.creditosTeoria || "0").padStart(
                              2,
                              "0",
                            )}
                            )
                          </div>

                          <div className={readonlyBoxClass}>
                            Práctica (
                            {String(form.creditosPractica || "0").padStart(
                              2,
                              "0",
                            )}
                            )
                          </div>

                          <div className={readonlyBoxClass}>
                            Total créditos (
                            {String(form.creditosTotal || "0").padStart(2, "0")}
                            )
                          </div>
                        </>
                      )}
                    </div>

                    {(errors.creditosTeoria ||
                      errors.creditosPractica ||
                      errors.creditosTotal) && (
                      <div className="text-red-600 text-xs font-medium mt-1">
                        {errors.creditosTeoria ||
                          errors.creditosPractica ||
                          errors.creditosTotal}
                      </div>
                    )}
                  </div>
                ) : name === "horas" ? (
                  <div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      {canEdit ? (
                        <>
                          <input
                            type="number"
                            min="0"
                            step="1"
                            name="horasTeoria"
                            value={form.horasTeoria}
                            onChange={(e) =>
                              updateField("horasTeoria", e.target.value)
                            }
                            placeholder="Teoría"
                            disabled={inputsDisabled}
                            className={inputClass(
                              Boolean(errors.horasTeoria),
                              inputsDisabled,
                            )}
                          />

                          <input
                            type="number"
                            min="0"
                            step="1"
                            name="horasPractica"
                            value={form.horasPractica}
                            onChange={(e) =>
                              updateField("horasPractica", e.target.value)
                            }
                            placeholder="Práctica"
                            disabled={inputsDisabled}
                            className={inputClass(
                              Boolean(errors.horasPractica),
                              inputsDisabled,
                            )}
                          />

                          <input
                            name="horasTotal"
                            value={totalHours}
                            readOnly
                            tabIndex={-1}
                            className="w-full h-11 rounded-xl px-4 border border-gray-200 bg-gray-100 text-sm text-gray-700 text-center font-semibold cursor-not-allowed outline-none"
                          />
                        </>
                      ) : (
                        <>
                          <div className={readonlyBoxClass}>
                            Teoría (
                            {String(form.horasTeoria || "0").padStart(2, "0")})
                          </div>

                          <div className={readonlyBoxClass}>
                            Práctica (
                            {String(form.horasPractica || "0").padStart(2, "0")}
                            )
                          </div>

                          <div className={readonlyBoxClass}>
                            Total horas (
                            {String(totalHours || 0).padStart(2, "0")})
                          </div>
                        </>
                      )}
                    </div>

                    {(errors.horasTeoria || errors.horasPractica) && (
                      <div className="text-red-600 text-xs font-medium mt-1">
                        {errors.horasTeoria || errors.horasPractica}
                      </div>
                    )}
                  </div>
                ) : name === "docentes" ? (
                  isCreateMode ? (
                    <div className="rounded-xl border border-gray-100 bg-gray-50 px-4 py-3 text-sm text-gray-600">
                      El docente será asignado posteriormente por el director.
                    </div>
                  ) : (
                    <div className={readonlyBoxClass}>
                      {assignedTeacherDisplay}
                    </div>
                  )
                ) : name === "tipoEstudios" ? (
                  canEdit ? (
                    <>
                      <select
                        name="tipoEstudios"
                        value={form.tipoEstudios}
                        onChange={(e) =>
                          updateField("tipoEstudios", e.target.value)
                        }
                        disabled={inputsDisabled}
                        className={inputClass(
                          Boolean(errors.tipoEstudios),
                          inputsDisabled,
                        )}
                      >
                        <option value="">Seleccione tipo de estudios</option>
                        <option value="general">General</option>
                        <option value="especifica">Específica</option>
                        <option value="especialidad">Especialidad</option>
                      </select>

                      {errorText("tipoEstudios")}
                    </>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      <div className={readonlyBoxClass}>
                        General (
                        {form.tipoEstudios?.toLowerCase() === "general"
                          ? "X"
                          : " "}
                        )
                      </div>

                      <div className={readonlyBoxClass}>
                        Específica (
                        {["especifica", "específica"].includes(
                          form.tipoEstudios?.toLowerCase(),
                        )
                          ? "X"
                          : " "}
                        )
                      </div>

                      <div className={readonlyBoxClass}>
                        Especialidad (
                        {form.tipoEstudios?.toLowerCase() === "especialidad"
                          ? "X"
                          : " "}
                        )
                      </div>
                    </div>
                  )
                ) : name === "modalidad" ? (
                  canEdit ? (
                    <>
                      <select
                        name="modalidad"
                        value={form.modalidad}
                        onChange={(e) =>
                          updateField("modalidad", e.target.value)
                        }
                        disabled={inputsDisabled}
                        className={inputClass(
                          Boolean(errors.modalidad),
                          inputsDisabled,
                        )}
                      >
                        <option value="">Seleccione modalidad</option>
                        <option value="presencial">Presencial</option>
                        <option value="semipresencial">Semipresencial</option>
                        <option value="aDistancia">A distancia</option>
                      </select>

                      {errorText("modalidad")}
                    </>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      <div className={readonlyBoxClass}>
                        Presencial (
                        {form.modalidad?.toLowerCase() === "presencial"
                          ? "X"
                          : " "}
                        )
                      </div>

                      <div className={readonlyBoxClass}>
                        Semipresencial (
                        {form.modalidad?.toLowerCase() === "semipresencial"
                          ? "X"
                          : " "}
                        )
                      </div>

                      <div className={readonlyBoxClass}>
                        A distancia (
                        {form.modalidad === "aDistancia" ||
                        form.modalidad?.toLowerCase() === "a distancia"
                          ? "X"
                          : " "}
                        )
                      </div>
                    </div>
                  )
                ) : name === "semestreAcademico" ? (
                  <>
                    <input
                      name="semestreAcademico"
                      value={form.semestreAcademico}
                      readOnly
                      tabIndex={-1}
                      className="w-full h-11 rounded-xl px-4 border border-gray-200 bg-gray-100 text-sm text-gray-700 cursor-not-allowed outline-none"
                    />

                    <p className="text-xs text-gray-400 mt-1">
                      El semestre académico se genera automáticamente.
                    </p>

                    {errorText("semestreAcademico")}
                  </>
                ) : name === "tipoAsignatura" ? (
                  canEdit ? (
                    <>
                      <select
                        name="tipoAsignatura"
                        value={form.tipoAsignatura}
                        onChange={(e) =>
                          updateField("tipoAsignatura", e.target.value)
                        }
                        disabled={inputsDisabled}
                        className={inputClass(
                          Boolean(errors.tipoAsignatura),
                          inputsDisabled,
                        )}
                      >
                        <option value="">Seleccione tipo de asignatura</option>
                        <option value="Obligatoria">Obligatoria</option>
                        <option value="Electiva">Electiva</option>
                      </select>

                      {errorText("tipoAsignatura")}
                    </>
                  ) : (
                    <div className={readonlyBoxClass}>
                      {form.tipoAsignatura || "Sin tipo de asignatura"}
                    </div>
                  )
                ) : name === "ciclo" ? (
                  canEdit ? (
                    <>
                      <select
                        name="ciclo"
                        value={form.ciclo}
                        onChange={(e) => updateField("ciclo", e.target.value)}
                        disabled={inputsDisabled}
                        className={inputClass(
                          Boolean(errors.ciclo),
                          inputsDisabled,
                        )}
                      >
                        <option value="">Seleccione ciclo</option>
                        <option value="I">I</option>
                        <option value="II">II</option>
                        <option value="III">III</option>
                        <option value="IV">IV</option>
                        <option value="V">V</option>
                        <option value="VI">VI</option>
                        <option value="VII">VII</option>
                        <option value="VIII">VIII</option>
                        <option value="IX">IX</option>
                        <option value="X">X</option>
                      </select>

                      {errorText("ciclo")}
                    </>
                  ) : (
                    <div className={readonlyBoxClass}>
                      {form.ciclo || "Sin ciclo"}
                    </div>
                  )
                ) : (
                  renderInput(name)
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </Step>
  );
}
