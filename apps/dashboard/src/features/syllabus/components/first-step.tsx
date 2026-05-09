import { useState, useEffect, useMemo } from "react";
import { useSteps } from "../contexts/steps-context-provider";
import { useSyllabusContext } from "../contexts/syllabus-context";
import { useReviewMode } from "../../coordinator/contexts/review-mode-context";
import { Step } from "./step";
import { useSyllabusGeneral } from "../hooks/first-step-query";
import type { SyllabusGeneral } from "../hooks/first-step-query";
import type { DatosGenerales } from "../../coordinator/hooks/syllabus-section-data-query";

const API_BASE = "http://localhost:7071/api";

const getCurrentSemester = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1;

  return month <= 6 ? `${year}-I` : `${year}-II`;
};

type DocenteOption = {
  id: number | string;
  nombre_docente?: string;
  nombreDocente?: string;
  correo?: string;
};

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

const createEmptyForm = (): FormState => ({
  nombreAsignatura: "",
  departamentoAcademico: "",
  escuelaProfesional: "",
  programaAcademico: "",
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

export default function FirstStep() {
  const { nextStep } = useSteps();

  const { syllabusId, setSyllabusId, setCourseName, setGeneralData, mode } =
    useSyllabusContext();

  const { isReviewMode, sectionData } = useReviewMode();

  const isCreateMode = mode === "create";
  const isEditMode = mode === "edit";
  const isReadOnly = isEditMode || isReviewMode;

  const draftKey = syllabusId
    ? `syllabus:general:${syllabusId}`
    : "syllabus:general:create";

  const [form, setForm] = useState<FormState>(() => {
    const emptyForm = createEmptyForm();

    try {
      if (mode === "create") {
        return emptyForm;
      }

      const raw = localStorage.getItem(draftKey);
      if (!raw) return emptyForm;

      const parsed = JSON.parse(raw) as Partial<Record<keyof FormState, string>>;

      return {
        ...emptyForm,
        ...parsed,
      } as FormState;
    } catch {
      return emptyForm;
    }
  });

  const [apiError, setApiError] = useState("");
  const [totalHours, setTotalHours] = useState(0);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [docentesOptions, setDocentesOptions] = useState<DocenteOption[]>([]);
  const [isCreating, setIsCreating] = useState(false);
  const [docenteSearch, setDocenteSearch] = useState("");
  const [selectedDocenteId, setSelectedDocenteId] = useState<string>("");

  const { data, isLoading, isError, error } = useSyllabusGeneral(
    isReviewMode || isCreateMode ? null : syllabusId,
  );

  useEffect(() => {
    const fetchDocentes = async () => {
      try {
        const res = await fetch(`${API_BASE}/teacher`);

        if (!res.ok) {
          throw new Error("No se pudieron cargar los docentes");
        }

        const response = await res.json();

        const lista = Array.isArray(response)
          ? response
          : Array.isArray(response.data)
            ? response.data
            : [];

        setDocentesOptions(lista);
      } catch (error) {
        console.error("Error cargando docentes:", error);
      }
    };

    if (isCreateMode) {
      fetchDocentes();
    }
  }, [isCreateMode]);

  useEffect(() => {
    if (isCreateMode || isReviewMode) return;

    if (isError) {
      setApiError(error?.message ?? "Error fetching syllabus");
      return;
    }

    if (!data) return;

    const json: SyllabusGeneral = data;

    const horasTeoria = Number(json.horasTeoria ?? 0);
    const horasPractica = Number(json.horasPractica ?? 0);
    const horasTotales = Number(
      json.horasTotales ?? horasTeoria + horasPractica,
    );

    setTotalHours(horasTotales);

    if (json.nombreAsignatura) {
      setCourseName(json.nombreAsignatura);
    }

    setForm((s) => ({
      ...s,
      nombreAsignatura: json.nombreAsignatura ?? s.nombreAsignatura,
      departamentoAcademico:
        json.departamentoAcademico ?? s.departamentoAcademico,
      escuelaProfesional: json.escuelaProfesional ?? s.escuelaProfesional,
      programaAcademico: json.programaAcademico ?? s.programaAcademico,
      semestreAcademico: json.semestreAcademico ?? s.semestreAcademico,
      tipoAsignatura: json.tipoAsignatura ?? s.tipoAsignatura,
      tipoEstudios: json.tipoEstudios ?? s.tipoEstudios,
      modalidad: json.modalidad ?? s.modalidad,
      codigoAsignatura: json.codigoAsignatura ?? s.codigoAsignatura,
      ciclo: json.ciclo ?? s.ciclo,
      requisitos: json.requisitos ?? s.requisitos,
      creditosTeoria:
        json.creditosTeoria != null
          ? String(json.creditosTeoria)
          : s.creditosTeoria,
      creditosPractica:
        json.creditosPractica != null
          ? String(json.creditosPractica)
          : s.creditosPractica,
      creditosTotal:
        json.creditosTotales != null
          ? String(json.creditosTotales)
          : s.creditosTotal,
      docentes: json.docentes ?? s.docentes,
      horasTeoria:
        json.horasTeoria != null ? String(json.horasTeoria) : s.horasTeoria,
      horasPractica:
        json.horasPractica != null
          ? String(json.horasPractica)
          : s.horasPractica,
    }));
  }, [data, isError, error, setCourseName, isReviewMode, isCreateMode]);

  useEffect(() => {
    if (!isReviewMode || !sectionData) return;

    const json = sectionData as DatosGenerales;

    const horasTeoria = Number(json.horasTeoria ?? 0);
    const horasPractica = Number(json.horasPractica ?? 0);
    const horasTotales = horasTeoria + horasPractica;

    setTotalHours(horasTotales);

    if (json.nombreAsignatura) {
      setCourseName(json.nombreAsignatura);
    }

    setForm((s) => ({
      ...s,
      nombreAsignatura: json.nombreAsignatura ?? s.nombreAsignatura,
      departamentoAcademico:
        json.departamentoAcademico ?? s.departamentoAcademico,
      escuelaProfesional: json.escuelaProfesional ?? s.escuelaProfesional,
      programaAcademico: json.programaAcademico ?? s.programaAcademico,
      semestreAcademico: json.semestreAcademico ?? s.semestreAcademico,
      tipoAsignatura: json.tipoAsignatura ?? s.tipoAsignatura,
      tipoEstudios: json.tipoEstudios ?? s.tipoEstudios,
      modalidad: json.modalidad ?? s.modalidad,
      codigoAsignatura: json.codigoAsignatura ?? s.codigoAsignatura,
      ciclo: json.ciclo ?? s.ciclo,
      requisitos: json.requisitos ?? s.requisitos,
      creditosTeoria:
        json.creditosTeoria != null
          ? String(json.creditosTeoria)
          : s.creditosTeoria,
      creditosPractica:
        json.creditosPractica != null
          ? String(json.creditosPractica)
          : s.creditosPractica,
      creditosTotal: String(
        Number(json.creditosTeoria ?? 0) + Number(json.creditosPractica ?? 0),
      ),
      docentes: json.docentes ?? s.docentes,
      horasTeoria:
        json.horasTeoria != null ? String(json.horasTeoria) : s.horasTeoria,
      horasPractica:
        json.horasPractica != null
          ? String(json.horasPractica)
          : s.horasPractica,
    }));
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
      ["Requisitos", "requisitos"],
      ["Cantidad de horas", "horas"],
      ["Cantidad de Créditos", "creditos"],
      ["Docente(s)", "docentes"],
    ],
    [],
  );

  const filteredDocentes = docentesOptions.filter((docente) => {
    const nombre = docente.nombre_docente || docente.nombreDocente || "";
    const correo = docente.correo || "";
    const search = docenteSearch.toLowerCase().trim();

    return (
      nombre.toLowerCase().includes(search) ||
      correo.toLowerCase().includes(search)
    );
  });

  const getDocenteLabel = (docenteId: string) => {
    const docente = docentesOptions.find(
      (item) => String(item.id) === String(docenteId),
    );

    if (!docente) return docenteId || "Sin docente";

    return (
      docente.nombre_docente ||
      docente.nombreDocente ||
      docente.correo ||
      `Docente ${docente.id}`
    );
  };

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

    if (name === "docentes") {
      setDocenteSearch("");
      setSelectedDocenteId("");
    }
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
      "docentes",
    ];

    for (const k of required) {
      if (!String(form[k] ?? "").trim()) {
        e[String(k)] = "Campo obligatorio";
      }
    }

    const numericFields: Array<keyof FormState> = [
      "creditosTeoria",
      "creditosPractica",
      "creditosTotal",
      "horasTeoria",
      "horasPractica",
    ];

    for (const k of numericFields) {
      const v = String(form[k] ?? "").trim();

      if (v && Number.isNaN(Number(v))) {
        e[String(k)] = "Debe ser un número";
      }
    }

    setErrors(e);
    return e;
  };

  const validateAndNext = async () => {
    const e = validate();

    if (Object.keys(e).length > 0) {
      const firstKey = Object.keys(e)[0];
      const el = document.querySelector(
        `[name="${firstKey}"]`,
      ) as HTMLElement | null;

      if (el && typeof el.focus === "function") {
        el.focus();
      }

      return;
    }

    try {
      setIsCreating(true);

      const horasTeoria = Number(form.horasTeoria || 0);
      const horasPractica = Number(form.horasPractica || 0);
      const creditosTeoria = Number(form.creditosTeoria || 0);
      const creditosPractica = Number(form.creditosPractica || 0);
      const docenteId = Number(selectedDocenteId || form.docentes);

      console.log("DOCENTE SELECCIONADO FRONT:", docenteId);

      const draft = {
        ...form,
        totalHours: horasTeoria + horasPractica,
      };

      localStorage.setItem(draftKey, JSON.stringify(draft));

      setCourseName(form.nombreAsignatura);

      setGeneralData({
        nombreAsignatura: form.nombreAsignatura,
        codigoAsignatura: form.codigoAsignatura,
        departamentoAcademico: form.departamentoAcademico,
        escuelaProfesional: form.escuelaProfesional,
        programaAcademico: form.programaAcademico,
        semestreAcademico: form.semestreAcademico,
        ciclo: form.ciclo,
      });

      if (mode === "create" && !syllabusId) {
        const res = await fetch(`${API_BASE}/syllabus`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            nombreAsignatura: form.nombreAsignatura,
            codigoAsignatura: form.codigoAsignatura,
            departamentoAcademico: form.departamentoAcademico,
            escuelaProfesional: form.escuelaProfesional,
            programaAcademico: form.programaAcademico,
            areaCurricular: "Formación Especializada",
            semestreAcademico: form.semestreAcademico,
            tipoAsignatura: form.tipoAsignatura,
            tipoEstudios: form.tipoEstudios,
            modalidad: form.modalidad,
            modalidadAsignatura: form.modalidad,
            formatoCurso: "Teórico-práctico",
            ciclo: form.ciclo,
            requisitos: form.requisitos,
            horasTeoria,
            horasPractica,
            horasLaboratorio: 0,
            horasTotales: horasTeoria + horasPractica,
            creditosTeoria,
            creditosPractica,
            creditosTotales: creditosTeoria + creditosPractica,
            estadoRevision: "BORRADOR",
            docenteId,
            asignadoADocenteId: docenteId,
            creadoPorDocenteId: docenteId,
            actualizadoPorDocenteId: docenteId,
            curso_nombre: form.nombreAsignatura,
            curso_codigo: form.codigoAsignatura,
            departamento_academico: form.departamentoAcademico,
            escuela_profesional: form.escuelaProfesional,
            programa_academico: form.programaAcademico,
            area_curricular: "Formación Especializada",
            semestre_academico: form.semestreAcademico,
            tipo_asignatura: form.tipoAsignatura,
            tipo_de_estudios: form.tipoEstudios,
            modalidad_de_asignatura: form.modalidad,
            formato_de_curso: "Teórico-práctico",
            horas_teoria: horasTeoria,
            horas_practica: horasPractica,
            horas_laboratorio: 0,
            creditos_teoria: creditosTeoria,
            creditos_practica: creditosPractica,
            creditos_totales: creditosTeoria + creditosPractica,
            estado_revision: "BORRADOR",
            docente_id: docenteId,
            asignado_a_docente_id: docenteId,
            creado_por_docente_id: docenteId,
          }),
        });

        if (!res.ok) {
          const text = await res.text();
          console.error("ERROR BACKEND CREATE SYLLABUS:", text);
          throw new Error(text || "Error creando sílabo");
        }

        const responseData = await res.json();
        setSyllabusId(Number(responseData.id));
      }

      nextStep();
    } catch (error) {
      console.error(error);
      alert("Error al crear el sílabo");
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
    const disabled = isReadOnly || isCreating;
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
          {isLoading && !isCreateMode && (
            <div className="mb-5 rounded-xl border border-blue-100 bg-blue-50 px-4 py-3 text-sm text-blue-700">
              Cargando datos generales...
            </div>
          )}

          {apiError && (
            <div className="mb-5 rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700">
              Error cargando datos: {apiError}
            </div>
          )}

          <div className="mb-8">
            <label className="block text-sm font-bold text-gray-900 mb-2">
              Nombre de la asignatura
            </label>

            {isCreateMode ? (
              <div className="relative">
                <input
                  name="nombreAsignatura"
                  value={form.nombreAsignatura}
                  onChange={(e) =>
                    updateField("nombreAsignatura", e.target.value)
                  }
                  placeholder="Nombre de la asignatura"
                  disabled={isCreating}
                  className={`w-full h-12 rounded-xl px-4 pr-10 border text-base font-semibold transition-all outline-none ${
                    errors.nombreAsignatura
                      ? "border-red-500 focus:ring-red-500"
                      : "border-gray-200 focus:ring-red-500"
                  } bg-gray-50 focus:bg-white focus:ring-2 focus:border-transparent`}
                />

                <ClearButton
                  fieldName="nombreAsignatura"
                  visible={!isCreating && form.nombreAsignatura.trim() !== ""}
                />
              </div>
            ) : (
              <div className="w-full h-12 rounded-xl px-4 flex items-center text-base font-semibold bg-blue-50 border border-blue-100 text-blue-900">
                {form.nombreAsignatura || "Sin nombre de asignatura"}
              </div>
            )}

            {errorText("nombreAsignatura")}
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
                <label className="block text-sm font-bold text-gray-900 mb-2">
                  {label}
                </label>

                {name === "requisitos" ? (
                  isCreateMode ? (
                    <>
                      <div className="relative">
                        <textarea
                          name="requisitos"
                          value={form.requisitos}
                          onChange={(e) => updateField("requisitos", e.target.value)}
                          placeholder="Requisitos"
                          disabled={isCreating}
                          className={`${textareaClass(
                            Boolean(errors.requisitos),
                            isCreating,
                          )} ${form.requisitos.trim() && !isCreating ? "pr-12" : ""}`}
                        />

                        {form.requisitos.trim() && !isCreating && (
                          <button
                            type="button"
                            onClick={() => clearField("requisitos")}
                            className="absolute right-3 top-3 h-7 w-7 rounded-full text-gray-400 hover:text-red-600 hover:bg-red-50 flex items-center justify-center transition-colors"
                            title="Limpiar requisitos"
                          >
                            ×
                          </button>
                        )}
                      </div>

                      {errorText("requisitos")}
                    </>
                  ) : (
                    <div className="w-full min-h-[88px] rounded-xl px-4 py-3 bg-gray-100 text-left whitespace-pre-line border border-gray-200 text-sm text-gray-700">
                      {String(form.requisitos ?? "")
                        .split(",")
                        .map((req) => req.trim())
                        .filter(Boolean)
                        .join("\n")}
                    </div>
                  )
                ) : name === "creditos" ? (
                  <div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      {isCreateMode ? (
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
                            disabled={isCreating}
                            className={inputClass(
                              Boolean(errors.creditosTeoria),
                              isCreating,
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
                            disabled={isCreating}
                            className={inputClass(
                              Boolean(errors.creditosPractica),
                              isCreating,
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
                            {String(form.creditosTotal || "0").padStart(
                              2,
                              "0",
                            )}
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
                      {isCreateMode ? (
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
                            disabled={isCreating}
                            className={inputClass(
                              Boolean(errors.horasTeoria),
                              isCreating,
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
                            disabled={isCreating}
                            className={inputClass(
                              Boolean(errors.horasPractica),
                              isCreating,
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
                            {String(form.horasPractica || "0").padStart(
                              2,
                              "0",
                            )}
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
                    <div className="relative z-50">
                      <div className="relative">
                        <input
                          name="docentes"
                          value={docenteSearch}
                          onChange={(e) => {
                            setDocenteSearch(e.target.value);
                            setSelectedDocenteId("");
                            updateField("docentes", "");
                          }}
                          placeholder="Buscar docente por nombre o correo..."
                          disabled={isCreating}
                          className={`${inputClass(
                            Boolean(errors.docentes),
                            isCreating,
                          )} ${docenteSearch.trim() ? "pr-10" : ""}`}
                        />

                        {docenteSearch.trim() && !isCreating && (
                          <button
                            type="button"
                            onClick={() => {
                              setDocenteSearch("");
                              setSelectedDocenteId("");
                              updateField("docentes", "");
                            }}
                            className="absolute right-3 top-1/2 -translate-y-1/2 h-7 w-7 rounded-full text-gray-400 hover:text-red-600 hover:bg-red-50 flex items-center justify-center transition-colors"
                            title="Limpiar docente"
                          >
                            ×
                          </button>
                        )}
                      </div>

                      {docenteSearch.trim() && !form.docentes && (
                        <div className="absolute left-0 right-0 top-full z-[9999] mt-2 max-h-72 overflow-y-auto rounded-xl border border-gray-100 bg-white shadow-2xl">
                          {filteredDocentes.length > 0 ? (
                            filteredDocentes.map((docente) => {
                              const nombre =
                                docente.nombre_docente ||
                                docente.nombreDocente ||
                                docente.correo ||
                                "";
                              const correo = docente.correo || "";

                              return (
                                <button
                                  key={docente.id}
                                  type="button"
                                  onClick={() => {
                                    const id = String(docente.id);

                                    setSelectedDocenteId(id);
                                    updateField("docentes", id);
                                    setDocenteSearch(correo || nombre);
                                  }}
                                  className="w-full px-4 py-3 text-left hover:bg-red-50 border-b border-gray-100 last:border-b-0 transition-colors"
                                >
                                  <div className="font-semibold text-gray-900">
                                    {nombre}
                                  </div>

                                  {correo && (
                                    <div className="text-xs text-gray-500 mt-1">
                                      {correo}
                                    </div>
                                  )}
                                </button>
                              );
                            })
                          ) : (
                            <div className="px-4 py-4 text-sm text-gray-500 text-center">
                              No se encontraron docentes.
                            </div>
                          )}
                        </div>
                      )}

                      {errorText("docentes")}
                    </div>
                  ) : (
                    <div className={readonlyBoxClass}>
                      {getDocenteLabel(form.docentes)}
                    </div>
                  )
                ) : name === "tipoEstudios" ? (
                  isCreateMode ? (
                    <>
                      <select
                        name="tipoEstudios"
                        value={form.tipoEstudios}
                        onChange={(e) =>
                          updateField("tipoEstudios", e.target.value)
                        }
                        disabled={isCreating}
                        className={inputClass(
                          Boolean(errors.tipoEstudios),
                          isCreating,
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
                  isCreateMode ? (
                    <>
                      <select
                        name="modalidad"
                        value={form.modalidad}
                        onChange={(e) =>
                          updateField("modalidad", e.target.value)
                        }
                        disabled={isCreating}
                        className={inputClass(
                          Boolean(errors.modalidad),
                          isCreating,
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
                  isCreateMode ? (
                    <>
                      <select
                        name="tipoAsignatura"
                        value={form.tipoAsignatura}
                        onChange={(e) =>
                          updateField("tipoAsignatura", e.target.value)
                        }
                        disabled={isCreating}
                        className={inputClass(
                          Boolean(errors.tipoAsignatura),
                          isCreating,
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
                  isCreateMode ? (
                    <>
                      <select
                        name="ciclo"
                        value={form.ciclo}
                        onChange={(e) => updateField("ciclo", e.target.value)}
                        disabled={isCreating}
                        className={inputClass(Boolean(errors.ciclo), isCreating)}
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