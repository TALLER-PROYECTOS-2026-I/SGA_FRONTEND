import {
  useNavigate,
  useSearchParams,
  useParams,
  useLocation,
} from "react-router-dom";
import {
  ArrowLeft,
  Check,
  X,
  MessageSquare,
  ClipboardCheck,
  CheckCircle,
  XCircle,
  MessageCircle,
  FileText,
  Loader2,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useApproveSyllabus } from "../hooks/syllabus-review-query";
import { toast } from "sonner";
import { ReviewConfirmationModal } from "../components/review-confirmation-modal";
import { Button } from "../../../common/components/ui/button";

interface ReviewItem {
  status: "approved" | "rejected" | null;
  comment: string;
}

interface SectionSummary {
  id: string;
  name: string;
  hasApproved: boolean;
  hasRejected: boolean;
  hasComments: boolean;
}

const sectionDefinitions = [
  { id: "1", name: "Datos generales" },
  { id: "2", name: "Sumilla" },
  { id: "3", name: "Competencias y componentes" },
  { id: "4", name: "Programación del contenido" },
  { id: "5", name: "Estrategias metodológicas" },
  { id: "6", name: "Recursos didácticos" },
  { id: "7", name: "Evaluación de aprendizaje" },
  { id: "8", name: "Fuentes de consulta" },
  { id: "9", name: "Resultados (outcomes)" },
];

export default function ReviewSyllabusSummary() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const [sections, setSections] = useState<SectionSummary[]>([]);
  const [reviewData, setReviewData] = useState<Record<string, ReviewItem>>({});
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState<"approved" | "rejected">(
    "approved",
  );

  const approveMutation = useApproveSyllabus();

  const courseName = searchParams.get("courseName") || "Curso sin nombre";
  const courseCode = searchParams.get("courseCode") || "Código no disponible";
  const teacherName =
    searchParams.get("teacherName") || "Docente no disponible";
  const syllabusId = searchParams.get("syllabusId");

  useEffect(() => {
    const savedData = sessionStorage.getItem(`reviewData_${id}`);

    if (savedData) {
      try {
        const parsedData: Record<string, ReviewItem> = JSON.parse(savedData);
        setReviewData(parsedData);

        const getSections = (fieldId: string): string[] => {
          if (fieldId === "step-1") return ["1"];
          if (fieldId === "step-2") return ["2"];
          if (fieldId === "step-3") return ["3"];
          if (fieldId === "step-4") return ["4"];
          if (fieldId === "step-5") return ["5", "6"];
          if (fieldId === "step-6") return ["7"];
          if (fieldId === "step-7") return ["8"];
          if (fieldId === "step-8") return ["9"];

          if (
            fieldId === "nombreAsignatura" ||
            fieldId.startsWith("codigo-") ||
            fieldId.startsWith("ciclo-") ||
            fieldId.startsWith("creditos-") ||
            fieldId.startsWith("horas-") ||
            fieldId.startsWith("prerequisitos-") ||
            fieldId.startsWith("docente-")
          ) {
            return ["1"];
          }

          if (fieldId === "sumilla") return ["2"];

          if (
            fieldId.startsWith("competencia-") ||
            fieldId.startsWith("componente-") ||
            fieldId.startsWith("contenido-actitudinal-")
          ) {
            return ["3"];
          }

          if (fieldId.startsWith("unit-") && fieldId.includes("-week-")) {
            return ["4"];
          }

          if (fieldId.startsWith("strategy-")) return ["5"];

          if (fieldId.startsWith("resource-")) return ["6"];

          if (
            fieldId === "evaluation-main-formula" ||
            fieldId.startsWith("evaluation-")
          ) {
            return ["7"];
          }

          if (
            fieldId.startsWith("bibliography-") ||
            fieldId.startsWith("electronic-resource-")
          ) {
            return ["8"];
          }

          if (fieldId.startsWith("outcome-")) return ["9"];

          return [];
        };

        const processedSections = sectionDefinitions.map((section) => {
          const sectionFields = Object.entries(parsedData).filter(([fieldId]) =>
            getSections(fieldId).includes(section.id),
          );

          if (sectionFields.length === 0) {
            return {
              ...section,
              hasApproved: false,
              hasRejected: false,
              hasComments: false,
            };
          }

          const allApproved = sectionFields.every(
            ([, data]) => data.status === "approved",
          );

          const hasRejected = sectionFields.some(
            ([, data]) => data.status === "rejected",
          );

          const hasComments = sectionFields.some(
            ([, data]) => data.comment && data.comment.trim() !== "",
          );

          return {
            ...section,
            hasApproved: allApproved && !hasRejected,
            hasRejected,
            hasComments,
          };
        });

        setSections(processedSections);
      } catch (error) {
        console.error("Error al cargar datos de revisión:", error);

        setSections(
          sectionDefinitions.map((s) => ({
            ...s,
            hasApproved: false,
            hasRejected: false,
            hasComments: false,
          })),
        );
      }
    } else {
      setSections(
        sectionDefinitions.map((s) => ({
          ...s,
          hasApproved: false,
          hasRejected: false,
          hasComments: false,
        })),
      );
    }
  }, [id, location.key]);

  const summaryStats = useMemo(() => {
    const approved = sections.filter((section) => section.hasApproved).length;
    const rejected = sections.filter((section) => section.hasRejected).length;
    const comments = sections.filter((section) => section.hasComments).length;
    const pending = sections.length - approved - rejected;

    return {
      approved,
      rejected,
      comments,
      pending,
      total: sections.length,
    };
  }, [sections]);

  const hasRejections = sections.some((section) => section.hasRejected);

  const handleGoBack = () => {
    navigate(-1);
  };

  const handleFinalize = async () => {
    if (!syllabusId) {
      toast.error("No se pudo identificar el sílabo");
      return;
    }

    const hasRejections = sections.some((section) => section.hasRejected);
    const estado = hasRejections ? "DESAPROBADO" : "VALIDADO";

    if (hasRejections) {
      const rejectedFields = Object.entries(reviewData).filter(
        ([, v]) => v.status === "rejected",
      );

      const missingComments = rejectedFields.some(([, v]) => {
        return !(v.comment && v.comment.trim().length > 0);
      });

      if (missingComments) {
        toast.error(
          "Por favor ingrese comentarios para los puntos marcados con 'X' antes de finalizar la desaprobación.",
        );
        return;
      }
    }

    try {
      await approveMutation.mutateAsync({
        syllabusId: parseInt(syllabusId),
        estado,
        reviewData,
      });

      setModalType(hasRejections ? "rejected" : "approved");
      setShowModal(true);

      if (hasRejections) {
        toast.success("Revisión registrada. Se envió notificación al docente.");
      } else {
        toast.success("Revisión registrada. Sílabo aprobado.");
      }
    } catch (error) {
      console.error("Error al finalizar revisión:", error);
      toast.error("Error al finalizar la revisión. Intente nuevamente.");
    }
  };

  const handleCloseModal = () => {
    setShowModal(false);
    sessionStorage.removeItem(`reviewData_${id}`);
    navigate("/coordinator/review-syllabus?refresh=" + Date.now());
  };

  return (
    <div className="min-h-[calc(100vh-72px)] bg-gray-50 px-8 py-8">
      <div className="max-w-6xl mx-auto">
        <div className="mb-7">
          <button
            type="button"
            onClick={handleGoBack}
            className="mb-5 h-10 px-4 bg-white border border-gray-200 text-gray-700 rounded-xl hover:bg-gray-100 transition-colors flex items-center gap-2 text-sm font-semibold shadow-sm"
          >
            <ArrowLeft size={17} />
            Volver a revisión
          </button>

          <h1 className="text-3xl font-bold text-gray-900">
            Resumen de Sílabo en Revisión
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Revisa el resultado final por secciones antes de finalizar.
          </p>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 shadow-xl overflow-hidden">
          <div className="px-8 py-6 border-b border-gray-100 bg-gradient-to-r from-red-50 via-white to-white">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
              <div className="flex items-start gap-4">
                <div className="w-14 h-14 rounded-2xl bg-red-600 text-white flex items-center justify-center shadow-md">
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

              <div
                className={`rounded-xl px-4 py-3 border text-sm font-bold ${
                  hasRejections
                    ? "bg-red-50 text-red-700 border-red-100"
                    : "bg-green-50 text-green-700 border-green-100"
                }`}
              >
                {hasRejections
                  ? "Resultado: Desaprobado"
                  : "Resultado: Validado"}
              </div>
            </div>
          </div>

          <div className="p-8">
            <section className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-7">
              <div className="bg-green-600 text-white rounded-xl p-5 shadow-md flex justify-between items-center">
                <div>
                  <p className="text-sm font-medium opacity-90">Aprobadas</p>
                  <h2 className="text-3xl font-bold mt-1">
                    {summaryStats.approved}
                  </h2>
                </div>

                <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center">
                  <CheckCircle size={26} />
                </div>
              </div>

              <div className="bg-red-600 text-white rounded-xl p-5 shadow-md flex justify-between items-center">
                <div>
                  <p className="text-sm font-medium opacity-90">Rechazadas</p>
                  <h2 className="text-3xl font-bold mt-1">
                    {summaryStats.rejected}
                  </h2>
                </div>

                <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center">
                  <XCircle size={26} />
                </div>
              </div>

              <div className="bg-blue-600 text-white rounded-xl p-5 shadow-md flex justify-between items-center">
                <div>
                  <p className="text-sm font-medium opacity-90">Comentarios</p>
                  <h2 className="text-3xl font-bold mt-1">
                    {summaryStats.comments}
                  </h2>
                </div>

                <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center">
                  <MessageCircle size={26} />
                </div>
              </div>

              <div className="bg-gray-800 text-white rounded-xl p-5 shadow-md flex justify-between items-center">
                <div>
                  <p className="text-sm font-medium opacity-90">Secciones</p>
                  <h2 className="text-3xl font-bold mt-1">
                    {summaryStats.total}
                  </h2>
                </div>

                <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center">
                  <FileText size={26} />
                </div>
              </div>
            </section>

            <div className="bg-white rounded-2xl border border-gray-100 shadow-md overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-100 bg-gray-50">
                <h3 className="text-lg font-bold text-gray-900">
                  Resultado por secciones
                </h3>
                <p className="text-sm text-gray-500 mt-1">
                  Estado final de cada apartado revisado del sílabo.
                </p>
              </div>

              <div className="divide-y divide-gray-100">
                {sections.map((section) => {
                  const sectionState = section.hasRejected
                    ? "rejected"
                    : section.hasApproved
                      ? "approved"
                      : "pending";

                  return (
                    <div
                      key={section.id}
                      className="px-6 py-4 flex flex-col md:flex-row md:items-center md:justify-between gap-4 hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex items-center gap-4">
                        <div
                          className={`w-11 h-11 rounded-xl flex items-center justify-center font-bold text-sm ${
                            sectionState === "approved"
                              ? "bg-green-50 text-green-700 border border-green-100"
                              : sectionState === "rejected"
                                ? "bg-red-50 text-red-700 border border-red-100"
                                : "bg-gray-100 text-gray-600 border border-gray-200"
                          }`}
                        >
                          {section.id}
                        </div>

                        <div>
                          <h4 className="font-bold text-gray-900">
                            {section.name}
                          </h4>
                          <p className="text-xs text-gray-500 mt-1">
                            Sección {section.id} del sílabo académico
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 md:min-w-[260px] md:justify-end">
                        {section.hasRejected ? (
                          <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold bg-red-50 text-red-700 border border-red-100">
                            <X size={15} />
                            Rechazada
                          </span>
                        ) : section.hasApproved ? (
                          <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold bg-green-50 text-green-700 border border-green-100">
                            <Check size={15} />
                            Aprobada
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold bg-gray-100 text-gray-600 border border-gray-200">
                            Sin marcar
                          </span>
                        )}

                        {section.hasComments && (
                          <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold bg-blue-50 text-blue-700 border border-blue-100">
                            <MessageSquare size={15} />
                            Comentario
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="flex items-center justify-between pt-6 mt-8 border-t border-gray-100">
              <Button
                type="button"
                variant="outline"
                onClick={handleGoBack}
                className="h-11 px-6 rounded-xl gap-2 font-semibold"
              >
                <ArrowLeft size={18} />
                <span>Atrás</span>
              </Button>

              <Button
                type="button"
                variant="destructive"
                onClick={handleFinalize}
                disabled={approveMutation.isPending}
                size="lg"
                className="h-11 px-8 rounded-xl font-semibold"
              >
                {approveMutation.isPending ? (
                  <>
                    <Loader2 size={18} className="animate-spin mr-2" />
                    Finalizando...
                  </>
                ) : (
                  "Finalizar"
                )}
              </Button>
            </div>

            <ReviewConfirmationModal
              isOpen={showModal}
              type={modalType}
              onClose={handleCloseModal}
            />
          </div>
        </div>
      </div>
    </div>
  );
}