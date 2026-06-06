import { useMemo, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Check,
  MessageSquare,
  X as XIcon,
  ClipboardCheck,
  CheckCircle,
  XCircle,
  MessageCircle,
  FileText,
} from "lucide-react";

interface SectionReview {
  id: string;
  name: string;
  status: "approved" | "rejected" | "pending";
  hasComments: boolean;
}

export default function ReviewSummary() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [showModal, setShowModal] = useState(false);

  const syllabusData = {
    courseName: "Taller de Proyectos",
    courseCode: "09072108042",
    teacherName: "Norma Birginia Leon Lescano",
  };

  const sectionsReview: SectionReview[] = [
    {
      id: "1",
      name: "Datos Generales",
      status: "approved",
      hasComments: false,
    },
    { id: "2", name: "Sumilla", status: "approved", hasComments: true },
    {
      id: "3",
      name: "Competencias y Componentes",
      status: "approved",
      hasComments: false,
    },
    { id: "4", name: "Unidades", status: "approved", hasComments: true },
    {
      id: "5",
      name: "Estrategias Metodológicas",
      status: "approved",
      hasComments: false,
    },
    {
      id: "6",
      name: "Recursos Didácticos",
      status: "approved",
      hasComments: true,
    },
    {
      id: "7",
      name: "Evaluación del Aprendizaje",
      status: "approved",
      hasComments: false,
    },
    {
      id: "8",
      name: "Fuentes de Consulta",
      status: "approved",
      hasComments: true,
    },
    {
      id: "9",
      name: "Aporte de la Asignatura al logro de resultados",
      status: "approved",
      hasComments: false,
    },
  ];

  const summaryStats = useMemo(() => {
    const approved = sectionsReview.filter(
      (section) => section.status === "approved",
    ).length;

    const rejected = sectionsReview.filter(
      (section) => section.status === "rejected",
    ).length;

    const pending = sectionsReview.filter(
      (section) => section.status === "pending",
    ).length;

    const comments = sectionsReview.filter(
      (section) => section.hasComments,
    ).length;

    return {
      approved,
      rejected,
      pending,
      comments,
      total: sectionsReview.length,
    };
  }, [sectionsReview]);

  const hasRejections = sectionsReview.some(
    (section) => section.status === "rejected",
  );

  const handleFinalize = () => {
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    navigate("/coordinator/review-syllabus");
  };

  const handleGoBack = () => {
    navigate(`/coordinator/review-syllabus/${id}`);
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
                    {syllabusData.courseName}
                  </h2>

                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-2 text-sm text-gray-600">
                    <span>
                      <span className="font-semibold text-gray-900">
                        Código:
                      </span>{" "}
                      {syllabusData.courseCode}
                    </span>

                    <span>
                      <span className="font-semibold text-gray-900">
                        Docente:
                      </span>{" "}
                      {syllabusData.teacherName}
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
                  : "Resultado: Aprobado"}
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
                {sectionsReview.map((section) => {
                  const sectionState = section.status;

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
                        {section.status === "rejected" ? (
                          <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold bg-red-50 text-red-700 border border-red-100">
                            <XIcon size={15} />
                            Rechazada
                          </span>
                        ) : section.status === "approved" ? (
                          <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold bg-green-50 text-green-700 border border-green-100">
                            <Check size={15} />
                            Aprobada
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold bg-gray-100 text-gray-600 border border-gray-200">
                            Pendiente
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
              <button
                type="button"
                onClick={handleGoBack}
                className="h-11 px-6 bg-gray-900 text-white rounded-xl hover:bg-gray-800 transition-colors flex items-center gap-2 font-semibold shadow-sm"
              >
                <ArrowLeft size={18} />
                Atrás
              </button>

              <button
                type="button"
                onClick={handleFinalize}
                className="h-11 px-8 bg-red-600 text-white rounded-xl hover:bg-red-700 transition-colors font-semibold shadow-sm"
              >
                Finalizar
              </button>
            </div>
          </div>
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/45 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full">
            <div className="text-center">
              <div className="w-16 h-16 bg-green-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Check size={34} className="text-green-600" />
              </div>

              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                ¡Revisión Exitosa!
              </h2>

              <p className="text-gray-500 mb-6">
                La revisión del sílabo ha sido completada exitosamente.
              </p>

              <button
                type="button"
                onClick={handleCloseModal}
                className="w-full h-11 bg-red-600 text-white rounded-xl hover:bg-red-700 transition-colors font-semibold shadow-sm"
              >
                Aceptar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
