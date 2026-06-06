import { useState, useMemo, useEffect } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import {
  ArrowLeft,
  ClipboardCheck,
  CheckCircle,
  XCircle,
  MessageCircle,
  FileText,
  Loader2,
  AlertTriangle,
  Send,
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../../common/components/ui/select";

import { SyllabusProvider } from "../../syllabus/contexts/syllabus-context";
import { StepsContext } from "../../syllabus/contexts/steps-context-provider";
import { PermissionsProvider } from "../../syllabus/contexts/permissions-context";
import { ReviewModeProvider } from "../contexts/review-mode-context";

import { useSyllabusSectionData } from "../hooks/syllabus-section-data-query";
import {
  useReviewData,
  useSaveReviewData,
} from "../hooks/syllabus-review-query";

import FirstStep from "../../syllabus/components/first-step";
import SecondStep from "../../syllabus/components/second-step";
import ThirdStep from "../../syllabus/components/third-step";
import FourthStep from "../../syllabus/components/fourth-step";
import FifthStep from "../../syllabus/components/fifth-step";
import SixthStep from "../../syllabus/components/sixth-step";
import SeventhStep from "../../syllabus/components/seventh-step";
import EighthStep from "../../syllabus/components/eighth-step";
import { error } from "console";

type ReviewStatus = "approved" | "rejected" | null;

type ReviewData = Record<
  string,
  {
    status: ReviewStatus;
    comment: string;
  }
>;

const REVIEW_ALLOWED_STEPS = [1, 2, 3, 4, 5, 6, 7, 8];

export default function ReviewSyllabusDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [selectedSection, setSelectedSection] = useState("1");
  const [reviewData, setReviewData] = useState<ReviewData>({});

  const courseName = searchParams.get("courseName") || "Curso sin nombre";
  const courseCode = searchParams.get("courseCode") || "Código no disponible";
  const teacherName =
    searchParams.get("teacherName") || "Docente no disponible";
  const syllabusId = searchParams.get("syllabusId");

  const parsedSyllabusId = syllabusId ? Number(syllabusId) : null;

  const {
    data: savedReviewData,
    isLoading: reviewDataLoading,
    isError: reviewDataError,
  } = useReviewData(parsedSyllabusId);

  const saveReviewData = useSaveReviewData();

  const shouldLoadSectionData = ["1", "2", "3", "4"].includes(selectedSection);

  const {
    data: sectionData,
    isLoading: sectionDataLoading,
    isError: sectionDataError,
  } = useSyllabusSectionData(
    parsedSyllabusId && shouldLoadSectionData ? parsedSyllabusId : null,
    shouldLoadSectionData ? selectedSection : null,
  );

  useEffect(() => {
    if (savedReviewData && Object.keys(savedReviewData).length > 0) {
      setReviewData(savedReviewData);
      return;
    }

    const savedData = sessionStorage.getItem(`reviewData_${id}`);

    if (savedData) {
      try {
        const parsed = JSON.parse(savedData) as ReviewData;
        setReviewData(parsed);
      } catch {
        console.error("Error:", error);
      }
    }
  }, [savedReviewData, id]);

  useEffect(() => {
    if (Object.keys(reviewData).length === 0) return;

    try {
      sessionStorage.setItem(`reviewData_${id}`, JSON.stringify(reviewData));
    } catch (error) {
      if (
        error instanceof DOMException &&
        error.name === "QuotaExceededError"
      ) {
        alert(
          "No se pueden guardar más cambios. El almacenamiento local está lleno.",
        );
      }
    }
  }, [reviewData, id]);

  const sectionDefinitions = useMemo(
    () => [
      { id: "1", display: "1", name: "Datos generales" },
      { id: "2", display: "2", name: "Sumilla" },
      { id: "3", display: "3", name: "Competencias y componentes" },
      { id: "4", display: "4", name: "Programación del contenido" },
      { id: "5", display: "5", name: "Estrategias metodológicas" },
      { id: "6", display: "5.1", name: "Recursos didácticos" },
      { id: "7", display: "6", name: "Evaluación de aprendizaje" },
      { id: "8", display: "7", name: "Fuentes de consulta" },
      { id: "9", display: "8", name: "Aporte de la asignatura" },
    ],
    [],
  );

  /*
    IMPORTANTE:
    En revisión de coordinador se deben mostrar TODAS las secciones.
    No se debe filtrar por permisos del docente.
    Los permisos del docente sirven para edición docente, no para revisión.
  */
  const availableSections = useMemo(() => {
    return sectionDefinitions;
  }, [sectionDefinitions]);

  useEffect(() => {
    if (availableSections.length === 0) return;

    const availableSectionIds = availableSections.map((section) => section.id);

    if (!availableSectionIds.includes(selectedSection)) {
      setSelectedSection(availableSections[0].id);
    }
  }, [availableSections, selectedSection]);

  const stepperValue = useMemo(() => {
    const sectionToStepMap: Record<string, number> = {
      "1": 1,
      "2": 2,
      "3": 3,
      "4": 4,
      "5": 5,
      "6": 5,
      "7": 6,
      "8": 7,
      "9": 8,
    };

    const currentStep = sectionToStepMap[selectedSection] || 1;

    return {
      currentStep,
      isFirst: currentStep === 1,
      isLast: currentStep === 8,
      nextStep: () => {},
      prevStep: () => {},
      goToStep: () => {},
      reset: () => {},
    };
  }, [selectedSection]);

  const handleFieldReview = (fieldId: string, status: ReviewStatus) => {
    setReviewData((prev) => ({
      ...prev,
      [fieldId]: {
        comment: prev[fieldId]?.comment ?? "",
        status,
      },
    }));
  };

  const handleFieldComment = (fieldId: string, comment: string) => {
    setReviewData((prev) => ({
      ...prev,
      [fieldId]: {
        status: prev[fieldId]?.status ?? null,
        comment,
      },
    }));
  };

  const handleGoBack = () => {
    navigate("/coordinator/review-syllabus");
  };

  const reviewStats = useMemo(() => {
    const fields = Object.values(reviewData);
    const approved = fields.filter((f) => f.status === "approved").length;
    const rejected = fields.filter((f) => f.status === "rejected").length;
    const withComments = fields.filter((f) => f.comment?.trim()).length;
    const total = fields.length;

    return { approved, rejected, withComments, total };
  }, [reviewData]);

  const handleFinalize = async () => {
    if (!syllabusId) {
      alert("No se encontró el ID del sílabo.");
      return;
    }

    const parsedId = Number(syllabusId);

    if (!parsedId || Number.isNaN(parsedId)) {
      alert("ID de sílabo inválido.");
      return;
    }

    try {
      await saveReviewData.mutateAsync({
        syllabusId: parsedId,
        reviewData,
      });

      sessionStorage.setItem(`reviewData_${id}`, JSON.stringify(reviewData));

      navigate(
        `/coordinator/review-syllabus/${id}/summary?courseName=${encodeURIComponent(
          courseName,
        )}&courseCode=${encodeURIComponent(
          courseCode,
        )}&teacherName=${encodeURIComponent(
          teacherName,
        )}&syllabusId=${syllabusId}`,
      );
    } catch (error) {
      alert(
        error instanceof Error
          ? error.message
          : "Error al guardar la revisión del sílabo.",
      );
    }
  };

  const getComponentById = (sectionId: string): React.ReactNode => {
    const componentMap: Record<string, React.ReactNode> = {
      "1": <FirstStep />,
      "2": <SecondStep />,
      "3": <ThirdStep />,
      "4": <FourthStep />,
      "5": <FifthStep />,
      "6": <FifthStep />,
      "7": <SixthStep />,
      "8": <SeventhStep />,
      "9": <EighthStep />,
    };

    return componentMap[sectionId] ?? null;
  };

  const currentSection = availableSections.find(
    (section) => section.id === selectedSection,
  );

  const isSavingReview = saveReviewData.isPending;

  return (
    <SyllabusProvider>
      <PermissionsProvider
        allowedSteps={REVIEW_ALLOWED_STEPS}
        hasEditPermissionForSection={() => false}
      >
        <ReviewModeProvider
          isReviewMode={true}
          onFieldReview={handleFieldReview}
          onFieldComment={handleFieldComment}
          reviewData={reviewData}
          sectionData={sectionData}
          sectionDataLoading={sectionDataLoading}
          sectionDataError={sectionDataError}
        >
          <StepsContext.Provider value={stepperValue}>
            <div className="min-h-[calc(100vh-72px)] bg-gray-50 px-8 py-8">
              <div className="max-w-7xl mx-auto">
                <div className="mb-7">
                  <h1 className="text-3xl font-bold text-gray-900">
                    Revisión de Sílabo
                  </h1>

                  <p className="text-sm text-gray-500 mt-1">
                    Revisa cada sección del sílabo, aprueba campos y agrega
                    observaciones si corresponde.
                  </p>
                </div>

                <div
                  className="bg-white rounded-2xl border border-gray-100 shadow-xl overflow-visible"
                  translate="no"
                >
                  <div className="px-8 py-6 border-b border-gray-100 bg-gradient-to-r from-red-50 via-white to-white rounded-t-2xl">
                    <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
                      <div className="flex items-start gap-4">
                        <div className="w-14 h-14 rounded-2xl bg-red-600 text-white flex items-center justify-center shadow-md shrink-0">
                          <ClipboardCheck size={30} />
                        </div>

                        <div>
                          <h2 className="text-2xl font-bold text-gray-900">
                            {courseName}
                          </h2>

                          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-2 text-sm text-gray-600">
                            <span>
                              <span className="font-semibold text-gray-900">
                                Código:
                              </span>{" "}
                              {courseCode}
                            </span>

                            <span>
                              <span className="font-semibold text-gray-900">
                                Docente:
                              </span>{" "}
                              {teacherName}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                        <div className="bg-white border border-gray-100 rounded-xl px-4 py-3 shadow-sm">
                          <div className="flex items-center gap-2 text-green-600">
                            <CheckCircle size={18} />
                            <span className="text-xs font-bold">Aprobados</span>
                          </div>

                          <p className="text-2xl font-bold text-gray-900 mt-1">
                            {reviewStats.approved}
                          </p>
                        </div>

                        <div className="bg-white border border-gray-100 rounded-xl px-4 py-3 shadow-sm">
                          <div className="flex items-center gap-2 text-red-600">
                            <XCircle size={18} />
                            <span className="text-xs font-bold">
                              Rechazados
                            </span>
                          </div>

                          <p className="text-2xl font-bold text-gray-900 mt-1">
                            {reviewStats.rejected}
                          </p>
                        </div>

                        <div className="bg-white border border-gray-100 rounded-xl px-4 py-3 shadow-sm">
                          <div className="flex items-center gap-2 text-blue-600">
                            <MessageCircle size={18} />
                            <span className="text-xs font-bold">
                              Comentarios
                            </span>
                          </div>

                          <p className="text-2xl font-bold text-gray-900 mt-1">
                            {reviewStats.withComments}
                          </p>
                        </div>

                        <div className="bg-white border border-gray-100 rounded-xl px-4 py-3 shadow-sm">
                          <div className="flex items-center gap-2 text-gray-600">
                            <FileText size={18} />
                            <span className="text-xs font-bold">Total</span>
                          </div>

                          <p className="text-2xl font-bold text-gray-900 mt-1">
                            {reviewStats.total}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="p-8">
                    {reviewDataLoading && (
                      <div className="mb-6 rounded-xl border border-blue-100 bg-blue-50 px-4 py-3 text-sm text-blue-700 flex items-center gap-2">
                        <Loader2 size={18} className="animate-spin" />
                        Cargando revisión guardada...
                      </div>
                    )}

                    {reviewDataError && (
                      <div className="mb-6 rounded-xl border border-yellow-200 bg-yellow-50 px-4 py-3 text-sm text-yellow-700 flex items-center gap-2">
                        <AlertTriangle size={18} />
                        No se pudo cargar una revisión previa. Puedes continuar
                        con una nueva revisión.
                      </div>
                    )}

                    <div className="mb-7 bg-white border border-gray-100 rounded-2xl shadow-md p-5 overflow-visible">
                      <div className="flex flex-col md:flex-row md:items-end gap-4">
                        <div className="flex-1">
                          <label className="block text-sm font-bold text-gray-900 mb-2">
                            Seleccionar sección
                          </label>

                          <Select
                            value={selectedSection}
                            onValueChange={setSelectedSection}
                          >
                            <SelectTrigger
                              className="w-full h-12 rounded-xl border-gray-200 bg-gray-50 text-sm focus:ring-red-500"
                              translate="no"
                              onClick={(event) => event.stopPropagation()}
                            >
                              <SelectValue placeholder="Seleccione una sección" />
                            </SelectTrigger>

                            <SelectContent
                              translate="no"
                              onClick={(event) => event.stopPropagation()}
                            >
                              {availableSections.map((section) => (
                                <SelectItem
                                  key={section.id}
                                  value={section.id}
                                  translate="no"
                                >
                                  <span translate="no">
                                    {section.display}. {section.name}
                                  </span>
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        {currentSection && (
                          <div className="bg-red-50 border border-red-100 rounded-xl px-4 py-3 min-w-[240px]">
                            <p className="text-xs font-semibold text-red-700">
                              Sección actual
                            </p>

                            <p className="text-sm font-bold text-gray-900 mt-1">
                              {currentSection.display}. {currentSection.name}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="bg-white border border-gray-100 rounded-2xl shadow-md overflow-visible">
                      <div className="px-6 py-4 border-b border-gray-100 bg-gray-50 rounded-t-2xl">
                        <h3 className="text-lg font-bold text-gray-900">
                          Contenido de la sección
                        </h3>

                        <p className="text-sm text-gray-500 mt-1">
                          Marca los campos como aprobados o rechazados según la
                          revisión.
                        </p>
                      </div>

                      <div className="p-6 overflow-visible">
                        {sectionDataLoading && (
                          <div className="mb-6 rounded-xl border border-blue-100 bg-blue-50 px-4 py-3 text-sm text-blue-700 flex items-center gap-2">
                            <Loader2 size={18} className="animate-spin" />
                            Cargando datos de la sección...
                          </div>
                        )}

                        {sectionDataError && (
                          <div className="mb-6 rounded-xl border border-yellow-200 bg-yellow-50 px-4 py-3 text-sm text-yellow-700 flex items-center gap-2">
                            <AlertTriangle size={18} />
                            No hay datos guardados para esta sección todavía.
                          </div>
                        )}

                        {currentSection ? (
                          <div className="syllabus-review-readonly overflow-visible">
                            {getComponentById(currentSection.id)}
                          </div>
                        ) : (
                          <div className="text-center py-12 text-gray-500">
                            No hay una sección seleccionada para mostrar.
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pt-6 mt-8 border-t border-gray-100">
                      <button
                        type="button"
                        data-review-button="true"
                        onClick={handleGoBack}
                        disabled={isSavingReview}
                        className="h-11 px-6 bg-gray-900 text-white rounded-xl hover:bg-gray-800 transition-colors flex items-center justify-center gap-2 font-semibold shadow-sm disabled:opacity-60 disabled:cursor-not-allowed"
                      >
                        <ArrowLeft size={18} />
                        Volver
                      </button>

                      <button
                        type="button"
                        data-review-button="true"
                        onClick={handleFinalize}
                        disabled={isSavingReview}
                        className="h-11 px-8 bg-red-600 text-white rounded-xl hover:bg-red-700 transition-colors flex items-center justify-center gap-2 font-semibold shadow-sm disabled:opacity-60 disabled:cursor-not-allowed"
                      >
                        {isSavingReview ? (
                          <>
                            <Loader2 size={18} className="animate-spin" />
                            Guardando...
                          </>
                        ) : (
                          <>
                            <Send size={18} />
                            Finalizar Revisión
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </StepsContext.Provider>
        </ReviewModeProvider>
      </PermissionsProvider>
    </SyllabusProvider>
  );
}
