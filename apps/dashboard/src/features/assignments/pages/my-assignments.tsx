import { useState, useEffect } from "react";
import { Search, Eye, Edit, X, Loader2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useSession } from "../../auth/hooks/use-session";
import { useAssignments, type Assignment } from "../hooks/assignments-query";
import { pdf } from "@react-pdf/renderer";
import { syllabusPDFService } from "../../syllabus/services/syllabus-pdf-service";
import { SyllabusPDFDocument } from "../../syllabus/components/SyllabusPDFDocument";

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

  type AssignmentStatus =
    | "APROBADO"
    | "ANALIZANDO"
    | "DESAPROBADO"
    | "ASIGNADO"
    | "NUEVO";
  type FilterStatus = "ALL" | AssignmentStatus;
  const [selectedStatus, setSelectedStatus] = useState<FilterStatus>("ALL");
  const navigate = useNavigate();

  // Config visual por estado
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
    ANALIZANDO: {
      label: "Analizando",
      color: "bg-yellow-500",
      textColor: "text-yellow-700",
      bgColor: "bg-yellow-50",
    },
    DESAPROBADO: {
      label: "Desaprobado",
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
    const matchesSearch = assignment.cursoNombre
      .toLowerCase()
      .includes(searchTerm.toLowerCase());
    const matchesStatus =
      selectedStatus === "ALL" || assignment.estadoRevision === selectedStatus;
    return matchesSearch && matchesStatus;
  });

  const handleViewAssignment = async (assignment: Assignment) => {
    setSelectedAssignment(assignment);
    setPdfUrl(null);
    setPdfError(null);

    // Solo generar preview si tiene syllabusId
    if (!assignment.syllabusId) {
      setPdfError("No hay sílabo disponible para previsualizar");
      return;
    }

    setIsLoadingPdf(true);

    try {
      console.log(`📥 Cargando sílabo ID: ${assignment.syllabusId}...`);
      const data = await syllabusPDFService.fetchCompleteSyllabus(
        assignment.syllabusId,
      );

      console.log(`📄 Generando PDF blob...`);
      const blob = await pdf(<SyllabusPDFDocument data={data} />).toBlob();
      const url = URL.createObjectURL(blob);

      setPdfUrl(url);
      console.log("✅ PDF generado exitosamente");
    } catch (err) {
      console.error("❌ Error al generar PDF:", err);
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
    // Si es NUEVO, usar mode=create
    // Si es DESAPROBADO o ASIGNADO, usar mode=edit
    const mode = estado === "NUEVO" ? "create" : "edit";

    const url = syllabusId
      ? `/syllabus?codigo=${codigo}&id=${syllabusId}&mode=${mode}`
      : `/syllabus?codigo=${codigo}&mode=${mode}`;

    navigate(url);
  };

  const closeModal = () => {
    // Limpiar URL del PDF para liberar memoria
    if (pdfUrl) {
      URL.revokeObjectURL(pdfUrl);
    }
    setSelectedAssignment(null);
    setPdfUrl(null);
    setPdfError(null);
  };

  // Limpiar URL del PDF cuando el componente se desmonte
  useEffect(() => {
    return () => {
      if (pdfUrl) {
        URL.revokeObjectURL(pdfUrl);
      }
    };
  }, [pdfUrl]);

  if (sessionLoading || isLoading) {
    return (
      <div className="p-6 text-center text-gray-600">
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
    <div className="p-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-6">
          Mis Asignaciones
        </h1>

        {/* Search Bar */}
        <div className="relative flex-1 max-w-md mb-6">
          <Search
            className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
            size={20}
          />
          <input
            type="text"
            placeholder="Buscar curso..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        {/* Filtros por estado */}
        <div className="flex gap-2 mb-6 flex-wrap">
          {/* Todos */}
          <button
            onClick={() => setSelectedStatus("ALL")}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
              selectedStatus === "ALL"
                ? "bg-blue-500 text-white shadow-md"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
          >
            <span className="text-sm">Todos</span>
            <span className="text-xs bg-white bg-opacity-20 px-2 py-1 rounded-full text-black">
              {assignments.length}
            </span>
          </button>

          {(Object.keys(statusConfig) as AssignmentStatus[]).map((key) => {
            const cfg = statusConfig[key];
            const count = assignments.filter(
              (a) => a.estadoRevision === key,
            ).length;
            const isSelected = selectedStatus === key;
            return (
              <button
                key={key}
                onClick={() => setSelectedStatus(key)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
                  isSelected
                    ? `${cfg.color} text-white shadow-md`
                    : `${cfg.bgColor} ${cfg.textColor} hover:shadow-sm`
                }`}
              >
                <div
                  className={`w-3 h-3 rounded-full ${isSelected ? "bg-white bg-opacity-30" : cfg.color}`}
                ></div>
                <span className="text-sm">{cfg.label}</span>
                <span
                  className={`text-xs px-2 py-1 rounded-full ${isSelected ? "bg-white bg-opacity-20" : "bg-white bg-opacity-60"}`}
                >
                  <span className="text-black">{count}</span>
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Assignments List */}
      <div className="space-y-4">
        {filteredAssignments.map((assignment: Assignment) => (
          <div
            key={assignment.cursoCodigo}
            className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow duration-200"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-3 h-3 bg-gray-400 rounded-full"></div>
                <h3 className="text-lg font-medium text-gray-800">
                  {assignment.cursoNombre}
                </h3>
              </div>

              <div className="flex items-center gap-3">
                {/* Estado con badge coloreado */}
                {(() => {
                  const cfg = statusConfig[
                    assignment.estadoRevision as AssignmentStatus
                  ] ?? {
                    label: assignment.estadoRevision,
                    color: "bg-gray-400",
                    textColor: "text-gray-700",
                    bgColor: "bg-gray-100",
                  };
                  return (
                    <div
                      className={`flex items-center gap-2 px-2 py-1 rounded ${cfg.bgColor} ${cfg.textColor}`}
                    >
                      <div
                        className={`w-3 h-3 rounded-full ${cfg.color}`}
                      ></div>
                      <span className="text-xs font-semibold">{cfg.label}</span>
                    </div>
                  );
                })()}

                {/* Editar solo si está desaprobado, asignado o nuevo */}
                {(assignment.estadoRevision === "DESAPROBADO" ||
                  assignment.estadoRevision === "ASIGNADO" ||
                  assignment.estadoRevision === "NUEVO") && (
                  <button
                    onClick={() =>
                      handleEditAssignment(
                        assignment.cursoCodigo,
                        assignment.estadoRevision,
                        assignment.syllabusId,
                      )
                    }
                    className="p-2 text-blue-500 hover:bg-blue-50 rounded-lg transition-colors"
                  >
                    <Edit size={18} />
                  </button>
                )}

                {/* Ver */}
                <button
                  onClick={() => handleViewAssignment(assignment)}
                  className="p-2 text-gray-500 hover:bg-gray-50 rounded-lg transition-colors"
                >
                  <Eye size={18} />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {filteredAssignments.length === 0 && (
        <div className="text-center py-12 text-gray-500">
          No se encontraron asignaciones que coincidan con tu búsqueda.
        </div>
      )}

      {/* Modal */}
      {selectedAssignment && (
        <div className="fixed inset-0 bg-black/45 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl h-[90vh] flex flex-col relative">
            <button
              onClick={closeModal}
              className="absolute top-4 right-4 z-10 text-gray-500 hover:text-gray-700 transition-colors bg-white rounded-full p-2 shadow-md"
            >
              <X size={24} />
            </button>

            {/* Header */}
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
                    className={`font-medium ${statusConfig[selectedAssignment.estadoRevision as AssignmentStatus]?.textColor || "text-gray-700"}`}
                  >
                    {
                      statusConfig[
                        selectedAssignment.estadoRevision as AssignmentStatus
                      ]?.label
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

            {/* Content */}
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
  );
}
