import { useState, useEffect } from "react";
import { Search, Eye, Edit, X, Loader2, Info } from "lucide-react";
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
    | "EN_REVISIÓN"
    | "ANALIZANDO"
    | "DESAPROBADO"
    | "ASIGNADO"
    | "NUEVO";
  type FilterStatus = "ALL" | AssignmentStatus;
  const [selectedStatus, setSelectedStatus] = useState<FilterStatus>("ALL");
  const navigate = useNavigate();

  const statusConfig: Record<
    string,
    {
      label: string;
      color: string;
      textColor: string;
      bgColor: string;
      borderColor: string;
    }
  > = {
    APROBADO: {
      label: "APROBADO",
      color: "bg-green-500",
      textColor: "text-green-700",
      bgColor: "bg-green-50",
      borderColor: "border-green-200",
    },
    EN_REVISIÓN: {
      label: "EN REVISIÓN",
      color: "bg-blue-500",
      textColor: "text-blue-700",
      bgColor: "bg-blue-50",
      borderColor: "border-blue-200",
    },
    ANALIZANDO: {
      label: "EN REVISIÓN",
      color: "bg-blue-500",
      textColor: "text-blue-700",
      bgColor: "bg-blue-50",
      borderColor: "border-blue-200",
    },
    DESAPROBADO: {
      label: "DESAPROBADO",
      color: "bg-red-500",
      textColor: "text-red-700",
      bgColor: "bg-red-50",
      borderColor: "border-red-200",
    },
    ASIGNADO: {
      label: "ASIGNADO",
      color: "bg-yellow-500",
      textColor: "text-yellow-700",
      bgColor: "bg-yellow-50",
      borderColor: "border-yellow-200",
    },
    NUEVO: {
      label: "ASIGNADO",
      color: "bg-yellow-500",
      textColor: "text-yellow-700",
      bgColor: "bg-yellow-50",
      borderColor: "border-yellow-200",
    },
  };

  // Función segura para formatear fechas desde el backend
  const formatFechaSegura = (fechaStr: string | undefined) => {
    if (!fechaStr) return "Por definir";
    const date = new Date(fechaStr);
    if (isNaN(date.getTime())) return "Por definir";
    return date.toLocaleDateString("es-PE", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  const filteredAssignments = assignments.filter((assignment: Assignment) => {
    const term = searchTerm.toLowerCase();

    const nombre = assignment?.cursoNombre || "";
    const codigo = assignment?.cursoCodigo || "";

    const matchesSearch =
      nombre.toLowerCase().includes(term) ||
      codigo.toLowerCase().includes(term);

    let currentStatus = assignment?.estadoRevision || "NUEVO";
    if (currentStatus === "NUEVO") currentStatus = "ASIGNADO";
    if (currentStatus === "ANALIZANDO") currentStatus = "EN_REVISIÓN";

    const matchesStatus =
      selectedStatus === "ALL" || currentStatus === selectedStatus;

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
    const mode =
      estado === "NUEVO" || estado === "ASIGNADO" ? "create" : "edit";
    const url = syllabusId
      ? `/syllabus?codigo=${codigo}&id=${syllabusId}&mode=${mode}`
      : `/syllabus?codigo=${codigo}&mode=${mode}`;

    navigate(url);
  };

  const closeModal = () => {
    if (pdfUrl) URL.revokeObjectURL(pdfUrl);
    setSelectedAssignment(null);
    setPdfUrl(null);
    setPdfError(null);
  };

  useEffect(() => {
    return () => {
      if (pdfUrl) URL.revokeObjectURL(pdfUrl);
    };
  }, [pdfUrl]);

  if (sessionLoading || isLoading) {
    return (
      <div className="p-6 text-center text-slate-600 flex justify-center items-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600 mr-2" />
        <span>Cargando tus asignaciones...</span>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="p-6 text-center text-red-500 bg-red-50 rounded-lg m-6">
        Error al cargar las asignaciones: {error?.message}
      </div>
    );
  }

  return (
    <div className="p-8 max-w-[1400px] mx-auto bg-slate-50/50 min-h-screen">
      {/* Header & Títulos */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900 mb-1">
          Mis Asignaciones
        </h1>
        <p className="text-slate-600 mb-3">
          Consulta los sílabos de curso asignados a tu usuario
        </p>
        <div className="flex items-center text-sm text-slate-500 mb-6">
          <Info size={16} className="mr-1.5" />
          <span>Tienes {assignments.length} sílabos asignados</span>
        </div>

        {/* Caja de Información */}
        <div className="bg-[#F4F6FF] border-l-4 border-blue-600 p-5 rounded-r-xl mb-8">
          <div className="flex gap-3">
            <Info className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
            <div>
              <h4 className="text-sm font-bold text-blue-900 mb-2">
                HU04: Mis Asignaciones - Información
              </h4>
              <ul className="text-sm text-blue-800 space-y-1.5 list-disc list-inside">
                <li>
                  <strong className="font-semibold">CA2 y RN3:</strong> Cada
                  asignación muestra curso, periodo académico, estado y acciones
                  disponibles
                </li>
                <li>
                  <strong className="font-semibold">RN7:</strong> Si el sílabo
                  está EN_REVISIÓN o APROBADO, no puedes modificarlo
                </li>
                <li>
                  <strong className="font-semibold">RN8:</strong> Si el sílabo
                  está DESAPROBADO, puedes corregirlo
                </li>
                <li>
                  <strong className="font-semibold">RN9:</strong> Si el sílabo
                  está ASIGNADO con edición habilitada, puedes elaborarlo
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* Buscador y Filtros */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm mb-6">
          <div className="relative w-full mb-6">
            <Search
              className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-400"
              size={20}
            />
            <input
              type="text"
              placeholder="Buscar por código o asignatura..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-4 py-3 border border-slate-200 rounded-lg outline-none transition-colors focus:ring-2 focus:ring-blue-500 focus:border-transparent text-slate-700"
            />
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            <span className="text-sm font-semibold text-slate-700 mr-2">
              Filtrar por estado:
            </span>

            <button
              onClick={() => setSelectedStatus("ALL")}
              className={`px-5 py-2 rounded-lg text-sm font-medium transition-all ${
                selectedStatus === "ALL"
                  ? "bg-[#D92D20] text-white shadow-sm"
                  : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50"
              }`}
            >
              Todos
            </button>

            {["ASIGNADO", "EN_REVISIÓN", "DESAPROBADO", "APROBADO"].map(
              (status) => {
                const cfg = statusConfig[status];
                const isSelected = selectedStatus === status;
                return (
                  <button
                    key={status}
                    onClick={() => setSelectedStatus(status as FilterStatus)}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium border transition-all ${
                      isSelected
                        ? `${cfg.bgColor} ${cfg.borderColor} ${cfg.textColor} shadow-sm ring-1 ring-inset ring-${cfg.color.split("-")[1]}-500`
                        : `bg-white border-slate-200 text-slate-600 hover:bg-slate-50`
                    }`}
                  >
                    <div
                      className={`w-2.5 h-2.5 rounded-full ${cfg.color}`}
                    ></div>
                    {cfg.label}
                  </button>
                );
              },
            )}
          </div>
        </div>
      </div>

      {/* Tabla de Asignaciones */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/50 text-xs text-slate-500 uppercase tracking-wider">
                <th className="py-4 px-6 font-bold">Código</th>
                <th className="py-4 px-6 font-bold">Asignatura</th>
                <th className="py-4 px-6 font-bold">Periodo</th>
                <th className="py-4 px-6 font-bold">Fecha de Entrega</th>
                <th className="py-4 px-6 font-bold">Estado</th>
                <th className="py-4 px-6 font-bold">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredAssignments.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-500">
                    No se encontraron asignaciones que coincidan con tu
                    búsqueda.
                  </td>
                </tr>
              ) : (
                filteredAssignments.map((assignment: Assignment) => {
                  let currentStatus = assignment?.estadoRevision || "NUEVO";
                  if (currentStatus === "NUEVO") currentStatus = "ASIGNADO";
                  if (currentStatus === "ANALIZANDO")
                    currentStatus = "EN_REVISIÓN";

                  const cfg = statusConfig[currentStatus] || statusConfig.NUEVO;

                  const data = assignment as unknown as Record<
                    string,
                    string | undefined
                  >;
                  const periodoVal =
                    data.periodo || data.semestreAcademico || "2026-I";

                  // AQUÍ ESTÁ EL CAMBIO: Apuntamos directamente a created_at o createdAt
                  const rawDate = data.created_at || data.createdAt;
                  const fechaEntregaVal = formatFechaSegura(rawDate);

                  return (
                    <tr
                      key={assignment.cursoCodigo || Math.random().toString()}
                      className="hover:bg-slate-50/50 transition-colors group"
                    >
                      <td className="py-4 px-6 font-semibold text-slate-700">
                        {assignment.cursoCodigo}
                      </td>
                      <td className="py-4 px-6 font-medium text-slate-900 max-w-xs">
                        {assignment.cursoNombre}
                      </td>
                      <td className="py-4 px-6 text-slate-600 font-medium">
                        {periodoVal}
                      </td>
                      <td className="py-4 px-6 text-slate-600">
                        {fechaEntregaVal}
                      </td>
                      <td className="py-4 px-6">
                        <div
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md border ${cfg.bgColor} ${cfg.borderColor} ${cfg.textColor}`}
                        >
                          <div
                            className={`w-2 h-2 rounded-full ${cfg.color}`}
                          ></div>
                          <span className="text-xs font-bold tracking-wide">
                            {cfg.label}
                          </span>
                        </div>
                      </td>
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleViewAssignment(assignment)}
                            className="p-2 text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors border border-blue-100"
                            title="Ver Sílabo"
                          >
                            <Eye size={18} />
                          </button>

                          {currentStatus === "DESAPROBADO" && (
                            <button
                              onClick={() =>
                                handleEditAssignment(
                                  assignment.cursoCodigo,
                                  assignment.estadoRevision,
                                  assignment.syllabusId,
                                )
                              }
                              className="p-2 text-orange-600 bg-orange-50 hover:bg-orange-100 rounded-lg transition-colors border border-orange-100"
                              title="Corregir Sílabo"
                            >
                              <Edit size={18} />
                            </button>
                          )}

                          {currentStatus === "ASIGNADO" && (
                            <button
                              onClick={() =>
                                handleEditAssignment(
                                  assignment.cursoCodigo,
                                  assignment.estadoRevision,
                                  assignment.syllabusId,
                                )
                              }
                              className="p-2 text-green-600 bg-green-50 hover:bg-green-100 rounded-lg transition-colors border border-green-100"
                              title="Elaborar Sílabo"
                            >
                              <Edit size={18} />
                            </button>
                          )}

                          {currentStatus === "APROBADO" && (
                            <span className="px-3 py-1.5 bg-slate-100 text-slate-500 text-xs font-medium rounded-lg border border-slate-200">
                              Sílabo Aprobado
                            </span>
                          )}

                          {currentStatus === "EN_REVISIÓN" && (
                            <span className="px-3 py-1.5 bg-slate-100 text-slate-500 text-xs font-medium rounded-lg border border-slate-200">
                              En Revisión Académica
                            </span>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Visor PDF */}
      {selectedAssignment && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl h-[90vh] flex flex-col relative overflow-hidden">
            <button
              onClick={closeModal}
              className="absolute top-4 right-4 z-10 text-slate-500 hover:text-red-500 transition-colors bg-white rounded-full p-2 shadow-md border border-slate-100"
            >
              <X size={20} className="stroke-[2.5]" />
            </button>

            <div className="p-6 border-b border-slate-100 bg-slate-50/50">
              <h2 className="text-xl font-bold text-slate-800 mb-2 pr-10">
                {selectedAssignment.cursoNombre}
              </h2>
              <div className="flex items-center gap-4 text-sm text-slate-600">
                <span className="font-medium text-slate-700">
                  Código: {selectedAssignment.cursoCodigo}
                </span>
                <span className="text-slate-300">•</span>
                <span className="flex items-center gap-1.5">
                  Estado:{" "}
                  <span
                    className={`font-bold ${statusConfig[selectedAssignment.estadoRevision]?.textColor || "text-slate-700"}`}
                  >
                    {statusConfig[selectedAssignment.estadoRevision]?.label ||
                      selectedAssignment.estadoRevision}
                  </span>
                </span>
                {selectedAssignment.syllabusId && (
                  <>
                    <span className="text-slate-300">•</span>
                    <span className="text-slate-500">
                      Sílabo ID: {selectedAssignment.syllabusId}
                    </span>
                  </>
                )}
              </div>
            </div>

            <div className="flex-1 overflow-hidden bg-slate-100/50">
              {isLoadingPdf ? (
                <div className="h-full flex items-center justify-center">
                  <div className="text-center">
                    <Loader2 className="w-10 h-10 text-blue-600 animate-spin mx-auto mb-4" />
                    <p className="text-lg font-bold text-slate-700">
                      Generando vista previa...
                    </p>
                    <p className="text-sm text-slate-500 mt-1">
                      El documento oficial se está procesando
                    </p>
                  </div>
                </div>
              ) : pdfError ? (
                <div className="h-full flex items-center justify-center p-6">
                  <div className="text-center max-w-sm bg-white p-8 rounded-2xl border border-red-100 shadow-sm">
                    <div className="w-16 h-16 bg-red-50 rounded-full mx-auto flex items-center justify-center mb-4">
                      <X size={28} className="text-red-500 stroke-[2.5]" />
                    </div>
                    <p className="text-lg font-bold text-slate-800 mb-2">
                      Error al cargar el sílabo
                    </p>
                    <p className="text-sm text-slate-600">{pdfError}</p>
                  </div>
                </div>
              ) : pdfUrl ? (
                <iframe
                  src={pdfUrl}
                  className="w-full h-full border-0"
                  title="Vista previa del PDF"
                />
              ) : (
                <div className="h-full flex items-center justify-center">
                  <div className="text-center text-slate-500">
                    <div className="w-16 h-16 bg-slate-200 rounded-full mx-auto flex items-center justify-center mb-4">
                      <Eye size={28} className="text-slate-400" />
                    </div>
                    <p className="text-lg font-bold text-slate-700">
                      Vista previa no disponible
                    </p>
                    <p className="text-sm mt-1">
                      {selectedAssignment.syllabusId
                        ? "Cargando documento..."
                        : "El sílabo aún no ha sido generado para este curso"}
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
