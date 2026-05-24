import { useState, useEffect } from "react";
import { Search, Eye, Edit, X, Loader2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useSession } from "../../auth/hooks/use-session";
import { useAssignments, type Assignment } from "../hooks/assignments-query";
import { pdf } from "@react-pdf/renderer";
import { syllabusPDFService } from "../../syllabus/services/syllabus-pdf-service";
import { SyllabusPDFDocument } from "../../syllabus/components/SyllabusPDFDocument";

type AssignmentStatus =
  | "APROBADO"
  | "EN_PROCESO"
  | "PENDIENTE"
  | "ASIGNADO"
  | "NUEVO";

type FilterStatus = "ALL" | AssignmentStatus;

function normalizeStatus(status?: string | null): AssignmentStatus {
  const value = String(status || "").trim().toUpperCase();

  if (value === "APROBADO") {
    return "APROBADO";
  }

  if (
    value === "ANALIZANDO" ||
    value === "EN_REVISION" ||
    value === "EN REVISIÓN" ||
    value === "PENDIENTE_REVISION" ||
    value === "PENDIENTE" ||
    value === "EN_PROCESO" ||
    value === "EN PROCESO"
  ) {
    return "EN_PROCESO";
  }

  if (value === "DESAPROBADO" || value === "RECHAZADO") {
    return "PENDIENTE";
  }

  if (value === "ASIGNADO") {
    return "ASIGNADO";
  }

  if (value === "NUEVO") {
    return "NUEVO";
  }

  return "ASIGNADO";
}

export default function MyAssignments() {
  const { user, isLoading: sessionLoading } = useSession();

  const roleId = Number(user?.role);
  const isCoordinator = roleId === 3;

  const docenteId = isCoordinator
    ? undefined
    : (user?.id as number | string | undefined);

  const {
    data: assignments = [],
    isLoading,
    isError,
    error,
  } = useAssignments(docenteId);

  const [searchTerm, setSearchTerm] = useState("");
  const [selectedAssignment, setSelectedAssignment] =
    useState<Assignment | null>(null);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [isLoadingPdf, setIsLoadingPdf] = useState(false);
  const [pdfError, setPdfError] = useState<string | null>(null);
  const [selectedStatus, setSelectedStatus] = useState<FilterStatus>("ALL");

  const navigate = useNavigate();

  const statusConfig: Record<
    AssignmentStatus,
    { label: string; color: string; textColor: string; bgColor: string }
  > = {
    APROBADO: {
      label: "Aprobado",
      color: "bg-green-500",
      textColor: "text-green-700",
      bgColor: "bg-green-50",
    },
    EN_PROCESO: {
      label: "En proceso",
      color: "bg-yellow-500",
      textColor: "text-yellow-700",
      bgColor: "bg-yellow-50",
    },
    PENDIENTE: {
      label: "Pendiente",
      color: "bg-red-500",
      textColor: "text-red-700",
      bgColor: "bg-red-50",
    },
    ASIGNADO: {
      label: "Asignado",
      color: "bg-blue-500",
      textColor: "text-blue-700",
      bgColor: "bg-blue-50",
    },
    NUEVO: {
      label: "Nuevo",
      color: "bg-purple-500",
      textColor: "text-purple-700",
      bgColor: "bg-purple-50",
    },
  };

  const filteredAssignments = assignments.filter((assignment: Assignment) => {
    const search = searchTerm.toLowerCase();
    const status = normalizeStatus(assignment.estadoRevision);

    const matchesSearch =
      assignment.cursoNombre.toLowerCase().includes(search) ||
      assignment.cursoCodigo.toLowerCase().includes(search);

    const matchesStatus = selectedStatus === "ALL" || status === selectedStatus;

    return matchesSearch && matchesStatus;
  });

  const handleViewAssignment = async (assignment: Assignment) => {
    setSelectedAssignment(assignment);
    setPdfUrl(null);
    setPdfError(null);

    if (!assignment.syllabusId) {
      setPdfError("No hay sílabo disponible para previsualizar");
      return;
    }

    setIsLoadingPdf(true);

    try {
      const data = await syllabusPDFService.fetchCompleteSyllabus(
        assignment.syllabusId,
      );

      const blob = await pdf(<SyllabusPDFDocument data={data} />).toBlob();
      const url = URL.createObjectURL(blob);

      setPdfUrl(url);
    } catch (err) {
      setPdfError(
        err instanceof Error ? err.message : "Error al cargar el sílabo",
      );
    } finally {
      setIsLoadingPdf(false);
    }
  };

  const handleEditAssignment = (
    codigo: string,
    estado: string,
    syllabusId?: number,
  ) => {
    const normalizedStatus = normalizeStatus(estado);
    const mode = normalizedStatus === "NUEVO" ? "create" : "edit";

    const url = syllabusId
      ? `/syllabus?codigo=${encodeURIComponent(codigo)}&id=${syllabusId}&mode=${mode}`
      : `/syllabus?codigo=${encodeURIComponent(codigo)}&mode=${mode}`;

    navigate(url);
  };

  const closeModal = () => {
    if (pdfUrl) {
      URL.revokeObjectURL(pdfUrl);
    }

    setSelectedAssignment(null);
    setPdfUrl(null);
    setPdfError(null);
  };

  useEffect(() => {
    return () => {
      if (pdfUrl) {
        URL.revokeObjectURL(pdfUrl);
      }
    };
  }, [pdfUrl]);

  if (sessionLoading || isLoading) {
    return (
      <div className="p-8 flex items-center justify-center gap-2 text-gray-600">
        <Loader2 className="animate-spin" size={20} />
        Cargando asignaciones...
      </div>
    );
  }

  if (isError) {
    return (
      <div className="p-6 text-center text-red-500">
        Error: {error?.message}
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-72px)] bg-gray-50 px-8 py-8">
      <div className="max-w-5xl mx-auto">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900">
            Mis Asignaciones
          </h1>

          <p className="text-sm text-gray-500 mt-1">
            Gestiona y revisa tus sílabos asignados
          </p>
        </div>

        <div className="relative mb-4">
          <Search
            className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
            size={20}
          />

          <input
            type="text"
            placeholder="Buscar por código o asignatura..."
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
            className="w-full h-12 pl-12 pr-4 bg-white border border-gray-200 rounded-xl shadow-sm text-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
          />
        </div>

        <div className="bg-white border border-gray-100 rounded-xl shadow-sm px-4 py-4 mb-6">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-semibold text-gray-700 mr-1">
              Filtrar por estado:
            </span>

            <button
              type="button"
              onClick={() => setSelectedStatus("ALL")}
              className={`px-4 py-2 rounded-lg text-xs font-semibold transition-all ${
                selectedStatus === "ALL"
                  ? "bg-red-600 text-white shadow-sm"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              Todos
            </button>

            <button
              type="button"
              onClick={() => setSelectedStatus("APROBADO")}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold border transition-all ${
                selectedStatus === "APROBADO"
                  ? "bg-green-600 text-white border-green-600 shadow-sm"
                  : "bg-green-50 text-green-700 border-green-200 hover:bg-green-100"
              }`}
            >
              <span
                className={`w-2 h-2 rounded-full ${
                  selectedStatus === "APROBADO" ? "bg-white" : "bg-green-500"
                }`}
              />
              Aprobado
            </button>

            <button
              type="button"
              onClick={() => setSelectedStatus("EN_PROCESO")}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold border transition-all ${
                selectedStatus === "EN_PROCESO"
                  ? "bg-yellow-500 text-white border-yellow-500 shadow-sm"
                  : "bg-yellow-50 text-yellow-700 border-yellow-200 hover:bg-yellow-100"
              }`}
            >
              <span
                className={`w-2 h-2 rounded-full ${
                  selectedStatus === "EN_PROCESO" ? "bg-white" : "bg-yellow-500"
                }`}
              />
              En proceso
            </button>

            <button
              type="button"
              onClick={() => setSelectedStatus("PENDIENTE")}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold border transition-all ${
                selectedStatus === "PENDIENTE"
                  ? "bg-red-600 text-white border-red-600 shadow-sm"
                  : "bg-red-50 text-red-700 border-red-200 hover:bg-red-100"
              }`}
            >
              <span
                className={`w-2 h-2 rounded-full ${
                  selectedStatus === "PENDIENTE" ? "bg-white" : "bg-red-500"
                }`}
              />
              Pendiente
            </button>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 shadow-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200 text-xs uppercase tracking-wide text-gray-700">
                  <th className="px-6 py-4 text-left font-bold w-[18%]">
                    Código
                  </th>

                  <th className="px-6 py-4 text-left font-bold w-[46%]">
                    Asignatura
                  </th>

                  <th className="px-6 py-4 text-left font-bold w-[20%]">
                    Estado
                  </th>

                  <th className="px-6 py-4 text-center font-bold w-[16%]">
                    Acciones
                  </th>
                </tr>
              </thead>

              <tbody>
                {filteredAssignments.map(
                  (assignment: Assignment, index: number) => {
                    const status = normalizeStatus(assignment.estadoRevision);
                    const cfg = statusConfig[status];

                    const canEdit =
                      status === "PENDIENTE" ||
                      status === "ASIGNADO" ||
                      status === "NUEVO";

                    return (
                      <tr
                        key={`${assignment.cursoCodigo}-${
                          assignment.syllabusId ?? "sin-id"
                        }-${assignment.docenteId ?? "sin-docente"}-${index}`}
                        className="border-b border-gray-100 last:border-b-0 hover:bg-gray-50 transition-colors"
                      >
                        <td className="px-6 py-5 font-semibold text-gray-800">
                          {assignment.cursoCodigo || "N/A"}
                        </td>

                        <td className="px-6 py-5">
                          <div className="font-semibold text-gray-900">
                            {assignment.cursoNombre}
                          </div>
                        </td>

                        <td className="px-6 py-5">
                          <div className="inline-flex items-center gap-2">
                            <span
                              className={`w-3 h-3 rounded-full ${cfg.color}`}
                            />

                            <span
                              className={`px-3 py-1 rounded-lg text-xs font-semibold border ${cfg.bgColor} ${cfg.textColor}`}
                            >
                              {cfg.label}
                            </span>
                          </div>
                        </td>

                        <td className="px-6 py-5">
                          <div className="flex items-center justify-center gap-3">
                            {canEdit && (
                              <button
                                type="button"
                                onClick={() =>
                                  handleEditAssignment(
                                    assignment.cursoCodigo,
                                    assignment.estadoRevision,
                                    assignment.syllabusId,
                                  )
                                }
                                title={
                                  status === "PENDIENTE"
                                    ? "Editar sílabo pendiente"
                                    : "Editar sílabo"
                                }
                                className={`w-9 h-9 flex items-center justify-center rounded-xl transition-colors ${
                                  status === "PENDIENTE"
                                    ? "text-red-600 bg-red-50 hover:bg-red-100"
                                    : "text-blue-600 bg-blue-50 hover:bg-blue-100"
                                }`}
                              >
                                <Edit size={18} />
                              </button>
                            )}

                            <button
                              type="button"
                              onClick={() => handleViewAssignment(assignment)}
                              title="Ver"
                              className="w-9 h-9 flex items-center justify-center text-gray-600 bg-gray-50 hover:bg-gray-100 rounded-xl transition-colors"
                            >
                              <Eye size={18} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  },
                )}
              </tbody>
            </table>
          </div>

          {filteredAssignments.length === 0 && (
            <div className="text-center py-12 text-gray-500">
              No se encontraron asignaciones que coincidan con tu búsqueda.
            </div>
          )}
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 shadow-xl mt-6 p-6">
          <h2 className="text-lg font-bold text-gray-900 mb-5">
            Leyenda de Estados
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="flex items-start gap-3">
              <span className="w-4 h-4 rounded-full bg-green-500 mt-1" />

              <div>
                <p className="text-sm font-bold text-gray-900">
                  Verde - Aprobado
                </p>

                <p className="text-xs text-gray-500 mt-1">
                  El sílabo está aprobado.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <span className="w-4 h-4 rounded-full bg-yellow-500 mt-1" />

              <div>
                <p className="text-sm font-bold text-gray-900">
                  Amarillo - En proceso
                </p>

                <p className="text-xs text-gray-500 mt-1">
                  El sílabo está en proceso de revisión o evaluación.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <span className="w-4 h-4 rounded-full bg-red-500 mt-1" />

              <div>
                <p className="text-sm font-bold text-gray-900">
                  Rojo - Pendiente
                </p>

                <p className="text-xs text-gray-500 mt-1">
                  El sílabo tiene observaciones pendientes por corregir.
                </p>
              </div>
            </div>
          </div>
        </div>

        {selectedAssignment && (
          <div className="fixed inset-0 bg-black/45 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl h-[90vh] flex flex-col relative">
              <button
                type="button"
                onClick={closeModal}
                className="absolute top-4 right-4 z-10 text-gray-500 hover:text-gray-700 transition-colors bg-white rounded-full p-2 shadow-md"
              >
                <X size={24} />
              </button>

              <div className="p-6 border-b border-gray-200">
                <h2 className="text-xl font-bold text-gray-800 mb-2">
                  {selectedAssignment.cursoNombre}
                </h2>

                <div className="flex items-center gap-4 text-sm text-gray-600">
                  <span>Código: {selectedAssignment.cursoCodigo}</span>

                  <span>•</span>

                  <span>
                    Estado:{" "}
                    <span
                      className={`font-medium ${
                        statusConfig[
                          normalizeStatus(selectedAssignment.estadoRevision)
                        ].textColor
                      }`}
                    >
                      {
                        statusConfig[
                          normalizeStatus(selectedAssignment.estadoRevision)
                        ].label
                      }
                    </span>
                  </span>

                  {selectedAssignment.syllabusId && (
                    <>
                      <span>•</span>
                      <span>Sílabo ID: {selectedAssignment.syllabusId}</span>
                    </>
                  )}
                </div>
              </div>

              <div className="flex-1 overflow-hidden">
                {isLoadingPdf ? (
                  <div className="h-full flex items-center justify-center">
                    <div className="text-center">
                      <Loader2 className="w-12 h-12 text-blue-600 animate-spin mx-auto mb-4" />

                      <p className="text-lg font-medium text-gray-700">
                        Generando vista previa del PDF...
                      </p>

                      <p className="text-sm text-gray-500 mt-2">
                        Esto puede tomar unos segundos
                      </p>
                    </div>
                  </div>
                ) : pdfError ? (
                  <div className="h-full flex items-center justify-center p-6">
                    <div className="text-center max-w-md">
                      <div className="w-16 h-16 bg-red-100 rounded-lg mx-auto flex items-center justify-center mb-4">
                        <X size={32} className="text-red-600" />
                      </div>

                      <p className="text-lg font-medium text-red-700 mb-2">
                        Error al cargar el sílabo
                      </p>

                      <p className="text-sm text-gray-600">{pdfError}</p>
                    </div>
                  </div>
                ) : pdfUrl ? (
                  <iframe
                    src={pdfUrl}
                    className="w-full h-full"
                    title="Vista previa del PDF"
                  />
                ) : (
                  <div className="h-full flex items-center justify-center">
                    <div className="text-center text-gray-500">
                      <div className="mb-4">
                        <div className="w-16 h-16 bg-gray-200 rounded-lg mx-auto flex items-center justify-center">
                          <Eye size={32} className="text-gray-400" />
                        </div>
                      </div>

                      <p className="text-lg font-medium">
                        Vista previa del sílabo
                      </p>

                      <p className="text-sm mt-2">
                        {selectedAssignment.syllabusId
                          ? "Cargando..."
                          : "No hay sílabo disponible para este curso"}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}