import { useState, useEffect, useMemo } from "react";
import { useSteps } from "../contexts/steps-context-provider";
import { useSyllabusContext } from "../contexts/syllabus-context";
import { useReviewMode } from "../../coordinator/contexts/review-mode-context";
import { Step } from "./step";
import { useSyllabusGeneral } from "../hooks/first-step-query";
import type { SyllabusGeneral } from "../hooks/first-step-query";
import type { DatosGenerales } from "../../coordinator/hooks/syllabus-section-data-query";

const API_BASE =
  import.meta.env.VITE_API_BASE_URL ?? "http://localhost:7071/api";

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

      const parsed = JSON.parse(raw) as Partial<
        Record<keyof FormState, string>
      >;

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

  const renderInput = (name: string) => (
    <>
      <input
        name={name}
        value={String(form[name] ?? "")}
        onChange={(e) => updateField(name, e.target.value)}
        disabled={isReadOnly}
        className={`w-full rounded-md px-3 py-2 border ${
          isReadOnly
            ? "bg-gray-100 border-gray-300"
            : "bg-white border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
        } ${errors[name] ? "border-red-500" : ""}`}
      />

      {errors[name] && (
        <div className="text-red-600 text-sm mt-1">{errors[name]}</div>
      )}
    </>
  );

  return (
    <Step step={1} onNextStep={validateAndNext}>
      <div className="bg-white rounded-md overflow-visible shadow-sm">
        <div className="bg-white px-4 py-4">
          <div className="flex items-center gap-3">
            <div className="text-lg font-bold text-black">1.</div>

            <h2 className="text-lg font-semibold text-black">
              Datos Generales
            </h2>

            <div className="ml-2 w-6 h-6 rounded-full bg-blue-600 flex items-center justify-center text-white text-xs font-bold">
              i
            </div>
          </div>
        </div>

        <div className="p-6">
          {isLoading && !isCreateMode && (
            <div className="mb-4 text-sm text-gray-700">
              Cargando datos generales...
            </div>
          )}

          {apiError && (
            <div className="mb-4 text-sm text-red-600">
              Error cargando datos: {apiError}
            </div>
          )}

          <div className="mb-6">
            {isCreateMode ? (
              <input
                name="nombreAsignatura"
                value={form.nombreAsignatura}
                onChange={(e) =>
                  updateField("nombreAsignatura", e.target.value)
                }
                placeholder="Nombre de la asignatura"
                disabled={isCreating}
                className={`w-full h-12 rounded-md px-4 flex items-center text-lg bg-white border ${
                  errors.nombreAsignatura ? "border-red-500" : "border-blue-100"
                } focus:outline-none focus:ring-2 focus:ring-blue-500`}
              />
            ) : (
              <div className="w-full h-12 rounded-md px-4 flex items-center text-lg bg-blue-50 border border-blue-100">
                {form.nombreAsignatura || "Sin nombre de asignatura"}
              </div>
            )}

            {errors.nombreAsignatura && (
              <div className="text-red-600 text-sm mt-1">
                {errors.nombreAsignatura}
              </div>
            )}
          </div>

          <div className="grid gap-4">
            {fields.map(([label, name]) => (
              <div key={name}>
                <div className="grid grid-cols-[250px_24px_1fr] items-start gap-2 py-2 border-b last:border-b-0">
                  <div className="text-sm text-gray-700 flex items-center">
                    <div className="px-3 py-2 bg-gray-100 border border-gray-300 rounded w-full text-center">
                      {label}
                    </div>
                  </div>

                  <div className="text-gray-400 flex items-center justify-left">
                    -
                  </div>

                  <div className="pr-2">
                    {name === "requisitos" ? (
                      isCreateMode ? (
                        <>
                          <textarea
                            name="requisitos"
                            value={form.requisitos}
                            onChange={(e) =>
                              updateField("requisitos", e.target.value)
                            }
                            placeholder="Requisitos"
                            disabled={isCreating}
                            className={`w-full min-h-[44px] rounded-md px-3 py-2 border bg-white ${
                              errors.requisitos
                                ? "border-red-500"
                                : "border-gray-300"
                            } focus:outline-none focus:ring-2 focus:ring-blue-500`}
                          />

                          {errors.requisitos && (
                            <div className="text-red-600 text-sm mt-1">
                              {errors.requisitos}
                            </div>
                          )}
                        </>
                      ) : (
                        <div className="w-full min-h-[44px] rounded-md px-3 py-2 bg-gray-100 text-left whitespace-pre-line border border-gray-300">
                          {String(form.requisitos ?? "")
                            .split(",")
                            .map((req) => req.trim())
                            .filter(Boolean)
                            .join("\n")}
                        </div>
                      )
                    ) : name === "creditos" ? (
                      <div>
                        <div className="flex gap-2">
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
                                className={`flex-1 rounded-md px-3 py-2 border bg-white text-center ${
                                  errors.creditosTeoria
                                    ? "border-red-500"
                                    : "border-gray-300"
                                }`}
                              />

                              <input
                                type="number"
                                min="0"
                                step="1"
                                name="creditosPractica"
                                value={form.creditosPractica}
                                onChange={(e) =>
                                  updateField(
                                    "creditosPractica",
                                    e.target.value,
                                  )
                                }
                                placeholder="Práctica"
                                disabled={isCreating}
                                className={`flex-1 rounded-md px-3 py-2 border bg-white text-center ${
                                  errors.creditosPractica
                                    ? "border-red-500"
                                    : "border-gray-300"
                                }`}
                              />

                              <input
                                name="creditosTotal"
                                value={form.creditosTotal}
                                disabled
                                className="flex-1 rounded-md px-3 py-2 bg-gray-100 border border-gray-300 text-center"
                              />
                            </>
                          ) : (
                            <>
                              <div className="flex-1 rounded-md px-3 py-2 bg-gray-100 border border-gray-300 text-center">
                                Teoría (
                                {String(form.creditosTeoria || "0").padStart(
                                  2,
                                  "0",
                                )}
                                )
                              </div>

                              <div className="flex-1 rounded-md px-3 py-2 bg-gray-100 border border-gray-300 text-center">
                                Práctica (
                                {String(form.creditosPractica || "0").padStart(
                                  2,
                                  "0",
                                )}
                                )
                              </div>

                              <div className="flex-1 rounded-md px-3 py-2 bg-gray-100 border border-gray-300 text-center">
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
                          <div className="text-red-600 text-sm mt-1">
                            {errors.creditosTeoria ||
                              errors.creditosPractica ||
                              errors.creditosTotal}
                          </div>
                        )}
                      </div>
                    ) : name === "horas" ? (
                      <div>
                        <div className="flex gap-2">
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
                                className={`flex-1 rounded-md px-3 py-2 border bg-white text-center ${
                                  errors.horasTeoria
                                    ? "border-red-500"
                                    : "border-gray-300"
                                }`}
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
                                className={`flex-1 rounded-md px-3 py-2 border bg-white text-center ${
                                  errors.horasPractica
                                    ? "border-red-500"
                                    : "border-gray-300"
                                }`}
                              />

                              <input
                                name="horasTotal"
                                value={totalHours}
                                disabled
                                className="flex-1 rounded-md px-3 py-2 bg-gray-100 border border-gray-300 text-center"
                              />
                            </>
                          ) : (
                            <>
                              <div className="flex-1 rounded-md px-3 py-2 bg-gray-100 border border-gray-300 text-center">
                                Teoría (
                                {String(form.horasTeoria || "0").padStart(
                                  2,
                                  "0",
                                )}
                                )
                              </div>

                              <div className="flex-1 rounded-md px-3 py-2 bg-gray-100 border border-gray-300 text-center">
                                Práctica (
                                {String(form.horasPractica || "0").padStart(
                                  2,
                                  "0",
                                )}
                                )
                              </div>

                              <div className="flex-1 rounded-md px-3 py-2 bg-gray-100 border border-gray-300 text-center">
                                Total horas (
                                {String(totalHours || 0).padStart(2, "0")})
                              </div>
                            </>
                          )}
                        </div>

                        {(errors.horasTeoria || errors.horasPractica) && (
                          <div className="text-red-600 text-sm mt-1">
                            {errors.horasTeoria || errors.horasPractica}
                          </div>
                        )}
                      </div>
                    ) : name === "docentes" ? (
                      isCreateMode ? (
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
                            className={`w-full rounded-md px-3 py-2 border bg-white ${
                              errors.docentes
                                ? "border-red-500"
                                : "border-gray-300"
                            }`}
                          />

                          {docenteSearch.trim() && !form.docentes && (
                            <div className="absolute z-50 mt-1 w-full max-h-56 overflow-y-auto rounded-md border border-gray-300 bg-white shadow-lg">
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
                                      className="w-full px-3 py-2 text-left hover:bg-blue-50"
                                    >
                                      <div className="font-medium text-gray-900">
                                        {nombre}
                                      </div>

                                      {correo && (
                                        <div className="text-xs text-gray-500">
                                          {correo}
                                        </div>
                                      )}
                                    </button>
                                  );
                                })
                              ) : (
                                <div className="px-3 py-2 text-sm text-gray-500">
                                  No se encontraron docentes.
                                </div>
                              )}
                            </div>
                          )}

                          {errors.docentes && (
                            <div className="text-red-600 text-sm mt-1">
                              {errors.docentes}
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="w-full rounded-md px-3 py-2 bg-gray-100 border border-gray-300 text-left">
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
                            className={`w-full rounded-md px-3 py-2 border bg-white ${
                              errors.tipoEstudios
                                ? "border-red-500"
                                : "border-gray-300"
                            }`}
                          >
                            <option value="">
                              Seleccione tipo de estudios
                            </option>
                            <option value="general">General</option>
                            <option value="especifica">Específica</option>
                            <option value="especialidad">Especialidad</option>
                          </select>

                          {errors.tipoEstudios && (
                            <div className="text-red-600 text-sm mt-1">
                              {errors.tipoEstudios}
                            </div>
                          )}
                        </>
                      ) : (
                        <div className="flex gap-2">
                          <div className="flex-1 rounded-md px-3 py-2 bg-gray-100 border border-gray-300 text-center">
                            General (
                            {form.tipoEstudios?.toLowerCase() === "general"
                              ? "X"
                              : " "}
                            )
                          </div>

                          <div className="flex-1 rounded-md px-3 py-2 bg-gray-100 border border-gray-300 text-center">
                            Específica (
                            {["especifica", "específica"].includes(
                              form.tipoEstudios?.toLowerCase(),
                            )
                              ? "X"
                              : " "}
                            )
                          </div>

                          <div className="flex-1 rounded-md px-3 py-2 bg-gray-100 border border-gray-300 text-center">
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
                            className={`w-full rounded-md px-3 py-2 border bg-white ${
                              errors.modalidad
                                ? "border-red-500"
                                : "border-gray-300"
                            }`}
                          >
                            <option value="">Seleccione modalidad</option>
                            <option value="presencial">Presencial</option>
                            <option value="semipresencial">
                              Semipresencial
                            </option>
                            <option value="aDistancia">A distancia</option>
                          </select>

                          {errors.modalidad && (
                            <div className="text-red-600 text-sm mt-1">
                              {errors.modalidad}
                            </div>
                          )}
                        </>
                      ) : (
                        <div className="flex gap-2">
                          <div className="flex-1 rounded-md px-3 py-2 bg-gray-100 border border-gray-300 text-center">
                            Presencial (
                            {form.modalidad?.toLowerCase() === "presencial"
                              ? "X"
                              : " "}
                            )
                          </div>

                          <div className="flex-1 rounded-md px-3 py-2 bg-gray-100 border border-gray-300 text-center">
                            Semipresencial (
                            {form.modalidad?.toLowerCase() === "semipresencial"
                              ? "X"
                              : " "}
                            )
                          </div>

                          <div className="flex-1 rounded-md px-3 py-2 bg-gray-100 border border-gray-300 text-center">
                            A distancia (
                            {form.modalidad === "aDistancia" ||
                            form.modalidad?.toLowerCase() === "a distancia"
                              ? "X"
                              : " "}
                            )
                          </div>
                        </div>
                      )
                    ) : (
                      renderInput(name)
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </Step>
  );
}
