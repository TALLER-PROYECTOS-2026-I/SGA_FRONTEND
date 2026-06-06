import { useState, useEffect, useMemo } from "react";
import { 
  Search, Eye, Edit, X, Loader2, 
  Download, TrendingUp, CheckCircle, 
  Clock, AlertCircle, ArrowUpDown, 
  Info, FileText 
} from "lucide-react";
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
type SortField = "codigo" | "nombre" | "estado";
type SortOrder = "asc" | "desc";

function normalizeStatus(status?: string | null): AssignmentStatus {
  const value = String(status || "").trim().toUpperCase();

  if (value === "APROBADO") return "APROBADO";
  if (value === "ANALIZANDO" || value === "EN_REVISION" || 
      value === "EN REVISIÓN" || value === "PENDIENTE_REVISION" || 
      value === "PENDIENTE" || value === "EN_PROCESO" || value === "EN PROCESO") {
    return "EN_PROCESO";
  }
  if (value === "DESAPROBADO" || value === "RECHAZADO") return "PENDIENTE";
  if (value === "ASIGNADO") return "ASIGNADO";
  if (value === "NUEVO") return "NUEVO";
  return "ASIGNADO";
}

export default function MyAssignments() {
  const { user, isLoading: sessionLoading } = useSession();
  const roleId = Number(user?.role);
  const isCoordinator = roleId === 3;
  const docenteId = isCoordinator ? undefined : (user?.id as number | string | undefined);

  const { data: assignments = [], isLoading, isError, error } = useAssignments(docenteId);

  // Estados existentes
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedAssignment, setSelectedAssignment] = useState<Assignment | null>(null);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [isLoadingPdf, setIsLoadingPdf] = useState(false);
  const [pdfError, setPdfError] = useState<string | null>(null);
  const [selectedStatus, setSelectedStatus] = useState<FilterStatus>("ALL");
  
  // 🆕 Estados para nuevas funcionalidades
  const [sortField, setSortField] = useState<SortField>("nombre");
  const [sortOrder, setSortOrder] = useState<SortOrder>("asc");
  const [currentPage, setCurrentPage] = useState(1);
  const [showConfirmEdit, setShowConfirmEdit] = useState<{
    show: boolean;
    assignment?: Assignment;
  }>({ show: false });
  const itemsPerPage = 10;

  const navigate = useNavigate();

  const statusConfig: Record<AssignmentStatus, { label: string; color: string; textColor: string; bgColor: string; icon: any }> = {
    APROBADO: {
      label: "Aprobado",
      color: "bg-green-500",
      textColor: "text-green-700",
      bgColor: "bg-green-50",
      icon: CheckCircle,
    },
    EN_PROCESO: {
      label: "En proceso",
      color: "bg-yellow-500",
      textColor: "text-yellow-700",
      bgColor: "bg-yellow-50",
      icon: Clock,
    },
    PENDIENTE: {
      label: "Pendiente",
      color: "bg-red-500",
      textColor: "text-red-700",
      bgColor: "bg-red-50",
      icon: AlertCircle,
    },
    ASIGNADO: {
      label: "Asignado",
      color: "bg-blue-500",
      textColor: "text-blue-700",
      bgColor: "bg-blue-50",
      icon: FileText,
    },
    NUEVO: {
      label: "Nuevo",
      color: "bg-purple-500",
      textColor: "text-purple-700",
      bgColor: "bg-purple-50",
      icon: TrendingUp,
    },
  };

  // 🆕 Calcular estadísticas
  const stats = useMemo(() => {
    const counts = {
      total: assignments.length,
      APROBADO: 0,
      EN_PROCESO: 0,
      PENDIENTE: 0,
      ASIGNADO: 0,
      NUEVO: 0,
    };
    
    assignments.forEach(assignment => {
      const status = normalizeStatus(assignment.estadoRevision);
      counts[status]++;
    });
    
    return counts;
  }, [assignments]);

  // 🆕 Filtrar y ordenar asignaciones
  const processedAssignments = useMemo(() => {
    // Primero filtrar
    let filtered = assignments.filter((assignment: Assignment) => {
      const search = searchTerm.toLowerCase();
      const status = normalizeStatus(assignment.estadoRevision);
      const matchesSearch = assignment.cursoNombre.toLowerCase().includes(search) ||
                           assignment.cursoCodigo.toLowerCase().includes(search);
      const matchesStatus = selectedStatus === "ALL" || status === selectedStatus;
      return matchesSearch && matchesStatus;
    });

    // Luego ordenar
    filtered.sort((a, b) => {
      let aVal: string, bVal: string;
      switch (sortField) {
        case "codigo":
          aVal = a.cursoCodigo;
          bVal = b.cursoCodigo;
          break;
        case "estado":
          aVal = normalizeStatus(a.estadoRevision);
          bVal = normalizeStatus(b.estadoRevision);
          break;
        default:
          aVal = a.cursoNombre;
          bVal = b.cursoNombre;
      }
      
      const comparison = aVal.localeCompare(bVal);
      return sortOrder === "asc" ? comparison : -comparison;
    });

    return filtered;
  }, [assignments, searchTerm, selectedStatus, sortField, sortOrder]);

  // 🆕 Paginación
  const totalPages = Math.ceil(processedAssignments.length / itemsPerPage);
  const paginatedAssignments = processedAssignments.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // 🆕 Exportar a CSV
  const handleExportCSV = () => {
    const headers = ["Código", "Asignatura", "Estado", "ID Sílabo", "Docente ID"];
    const rows = processedAssignments.map(a => [
      a.cursoCodigo,
      a.cursoNombre,
      normalizeStatus(a.estadoRevision),
      a.syllabusId || "",
      a.docenteId || ""
    ]);
    
    const csvContent = [headers, ...rows]
      .map(row => row.map(cell => `"${cell}"`).join(","))
      .join("\n");
    
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.href = url;
    link.setAttribute("download", `asignaciones_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // 🆕 Manejar ordenamiento
  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortOrder("asc");
    }
  };

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
      const data = await syllabusPDFService.fetchCompleteSyllabus(assignment.syllabusId);
      const blob = await pdf(<SyllabusPDFDocument data={data} />).toBlob();
      const url = URL.createObjectURL(blob);
      setPdfUrl(url);
    } catch (err) {
      console.error("Error al generar PDF:", err);
      setPdfError(err instanceof Error ? err.message : "Error al cargar el sílabo");
    } finally {
      setIsLoadingPdf(false);
    }
  };

  const handleEditAssignment = (assignment: Assignment) => {
    const normalizedStatus = normalizeStatus(assignment.estadoRevision);
    const mode = normalizedStatus === "NUEVO" ? "create" : "edit";
    const url = assignment.syllabusId
      ? `/syllabus?codigo=${encodeURIComponent(assignment.cursoCodigo)}&id=${assignment.syllabusId}&mode=${mode}`
      : `/syllabus?codigo=${encodeURIComponent(assignment.cursoCodigo)}&mode=${mode}`;
    navigate(url);
    setShowConfirmEdit({ show: false });
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

  // Resetear página cuando cambian los filtros
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, selectedStatus]);

  if (sessionLoading || isLoading) {
    return (
      <div className="p-8 flex items-center justify-center gap-2 text-gray-600">
        <Loader2 className="animate-spin" size={20} />
        Cargando asignaciones...
      </div>
    );
  }

  if (isError) {
    return <div className="p-6 text-center text-red-500">Error: {error?.message}</div>;
  }

  return (
    <div className="min-h-[calc(100vh-72px)] bg-gray-50 px-8 py-8">
      <div className="max-w-7xl mx-auto">
        {/* Header existente */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Mis Asignaciones</h1>
          <p className="text-sm text-gray-500 mt-1">Gestiona y revisa tus sílabos asignados</p>
        </div>

        {/* 🆕 Tarjetas de estadísticas */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
          <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-500 font-medium">Total</p>
                <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
              </div>
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <FileText size={20} className="text-blue-600" />
              </div>
            </div>
          </div>
          {Object.entries(statusConfig).map(([key, config]) => (
            <div key={key} className="bg-white rounded-xl shadow-sm p-4 border border-gray-100">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-gray-500 font-medium">{config.label}</p>
                  <p className="text-2xl font-bold text-gray-900">{stats[key as AssignmentStatus]}</p>
                </div>
                <div className={`w-10 h-10 ${config.bgColor} rounded-lg flex items-center justify-center`}>
                  <config.icon size={20} className={config.textColor} />
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Barra de búsqueda con botón de exportación */}
        <div className="flex gap-4 mb-4">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Buscar por código o asignatura..."
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              className="w-full h-12 pl-12 pr-4 bg-white border border-gray-200 rounded-xl shadow-sm text-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
            />
          </div>
          <button
            onClick={handleExportCSV}
            className="px-4 py-2 bg-green-600 text-white rounded-xl hover:bg-green-700 transition-colors flex items-center gap-2 text-sm font-medium"
          >
            <Download size={18} />
            Exportar CSV
          </button>
        </div>

        {/* Filtros existentes */}
        <div className="bg-white border border-gray-100 rounded-xl shadow-sm px-4 py-4 mb-6">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-semibold text-gray-700 mr-1">Filtrar por estado:</span>
            <button
              type="button"
              onClick={() => setSelectedStatus("ALL")}
              className={`px-4 py-2 rounded-lg text-xs font-semibold transition-all ${
                selectedStatus === "ALL" ? "bg-red-600 text-white shadow-sm" : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              Todos ({stats.total})
            </button>
            {Object.entries(statusConfig).map(([key, config]) => (
              <button
                key={key}
                type="button"
                onClick={() => setSelectedStatus(key as AssignmentStatus)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold border transition-all ${
                  selectedStatus === key
                    ? `${config.bgColor} ${config.textColor} border-current shadow-sm`
                    : "bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100"
                }`}
              >
                <span className={`w-2 h-2 rounded-full ${selectedStatus === key ? config.color : config.color.replace('bg-', 'bg-')}`} />
                {config.label} ({stats[key as AssignmentStatus]})
              </button>
            ))}
          </div>
        </div>

        {/* Tabla con ordenamiento y paginación */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200 text-xs uppercase tracking-wide text-gray-700">
                  <th 
                    className="px-6 py-4 text-left font-bold cursor-pointer hover:bg-gray-100 transition-colors"
                    onClick={() => handleSort("codigo")}
                  >
                    <div className="flex items-center gap-2">
                      Código
                      <ArrowUpDown size={14} className={sortField === "codigo" ? "text-red-500" : "text-gray-400"} />
                    </div>
                  </th>
                  <th 
                    className="px-6 py-4 text-left font-bold cursor-pointer hover:bg-gray-100 transition-colors"
                    onClick={() => handleSort("nombre")}
                  >
                    <div className="flex items-center gap-2">
                      Asignatura
                      <ArrowUpDown size={14} className={sortField === "nombre" ? "text-red-500" : "text-gray-400"} />
                    </div>
                  </th>
                  <th 
                    className="px-6 py-4 text-left font-bold cursor-pointer hover:bg-gray-100 transition-colors"
                    onClick={() => handleSort("estado")}
                  >
                    <div className="flex items-center gap-2">
                      Estado
                      <ArrowUpDown size={14} className={sortField === "estado" ? "text-red-500" : "text-gray-400"} />
                    </div>
                  </th>
                  <th className="px-6 py-4 text-center font-bold">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {paginatedAssignments.map((assignment: Assignment, index: number) => {
                  const status = normalizeStatus(assignment.estadoRevision);
                  const cfg = statusConfig[status];
                  const canEdit = status === "PENDIENTE" || status === "ASIGNADO" || status === "NUEVO";

                  return (
                    <tr key={`${assignment.cursoCodigo}-${assignment.syllabusId ?? "sin-id"}-${index}`} 
                        className="border-b border-gray-100 last:border-b-0 hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-5 font-semibold text-gray-800">{assignment.cursoCodigo || "N/A"}</td>
                      <td className="px-6 py-5">
                        <div className="font-semibold text-gray-900">{assignment.cursoNombre}</div>
                      </td>
                      <td className="px-6 py-5">
                        <div className="inline-flex items-center gap-2">
                          <span className={`w-3 h-3 rounded-full ${cfg.color}`} />
                          <span className={`px-3 py-1 rounded-lg text-xs font-semibold border ${cfg.bgColor} ${cfg.textColor}`}>
                            {cfg.label}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-5">
                        <div className="flex items-center justify-center gap-3">
                          {canEdit && (
                            <div className="relative group">
                              <button
                                type="button"
                                onClick={() => setShowConfirmEdit({ show: true, assignment })}
                                className={`w-9 h-9 flex items-center justify-center rounded-xl transition-colors ${
                                  status === "PENDIENTE" ? "text-red-600 bg-red-50 hover:bg-red-100" : "text-blue-600 bg-blue-50 hover:bg-blue-100"
                                }`}
                              >
                                <Edit size={18} />
                              </button>
                              <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-gray-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap">
                                {status === "PENDIENTE" ? "Editar sílabo pendiente" : "Editar sílabo"}
                              </div>
                            </div>
                          )}
                          <div className="relative group">
                            <button
                              type="button"
                              onClick={() => handleViewAssignment(assignment)}
                              className="w-9 h-9 flex items-center justify-center text-gray-600 bg-gray-50 hover:bg-gray-100 rounded-xl transition-colors"
                            >
                              <Eye size={18} />
                            </button>
                            <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-gray-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap">
                              Ver sílabo
                            </div>
                          </div>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {filteredAssignments.length === 0 && (
            <div className="text-center py-12 text-gray-500">
              No se encontraron asignaciones que coincidan con tu búsqueda.
            </div>
          )}

          {/* 🆕 Paginación */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between px-6 py-4 border-t border-gray-200 bg-gray-50">
              <div className="text-sm text-gray-600">
                Mostrando {((currentPage - 1) * itemsPerPage) + 1} - {Math.min(currentPage * itemsPerPage, processedAssignments.length)} de {processedAssignments.length}
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="px-3 py-1 text-sm bg-white border border-gray-300 rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                >
                  Anterior
                </button>
                <div className="flex gap-1">
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    let pageNum;
                    if (totalPages <= 5) pageNum = i + 1;
                    else if (currentPage <= 3) pageNum = i + 1;
                    else if (currentPage >= totalPages - 2) pageNum = totalPages - 4 + i;
                    else pageNum = currentPage - 2 + i;
                    
                    return (
                      <button
                        key={pageNum}
                        onClick={() => setCurrentPage(pageNum)}
                        className={`px-3 py-1 text-sm rounded-md ${
                          currentPage === pageNum
                            ? "bg-red-600 text-white"
                            : "bg-white border border-gray-300 hover:bg-gray-50"
                        }`}
                      >
                        {pageNum}
                      </button>
                    );
                  })}
                </div>
                <button
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="px-3 py-1 text-sm bg-white border border-gray-300 rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                >
                  Siguiente
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Leyenda de Estados (mejorada con tooltips) */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-xl mt-6 p-6">
          <div className="flex items-center gap-2 mb-5">
            <h2 className="text-lg font-bold text-gray-900">Leyenda de Estados</h2>
            <div className="relative group">
              <Info size={16} className="text-gray-400 cursor-help" />
              <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-gray-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap">
                Los estados determinan las acciones disponibles
              </div>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {Object.entries(statusConfig).map(([key, config]) => (
              <div key={key} className="flex items-start gap-3">
                <span className={`w-4 h-4 rounded-full ${config.color} mt-1`} />
                <div>
                  <p className="text-sm font-bold text-gray-900">{config.label}</p>
                  <p className="text-xs text-gray-500 mt-1">
                    {key === "APROBADO" && "El sílabo está aprobado."}
                    {key === "EN_PROCESO" && "El sílabo está en proceso de revisión o evaluación."}
                    {key === "PENDIENTE" && "El sílabo tiene observaciones pendientes por corregir."}
                    {key === "ASIGNADO" && "El sílabo ha sido asignado pero aún no se ha iniciado."}
                    {key === "NUEVO" && "Es la primera vez que se trabaja en este sílabo."}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Modal de confirmación para edición */}
        {showConfirmEdit.show && showConfirmEdit.assignment && (
          <div className="fixed inset-0 bg-black/45 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4">Confirmar edición</h3>
              <p className="text-gray-600 mb-6">
                ¿Estás seguro de que deseas editar el sílabo de <strong>{showConfirmEdit.assignment.cursoNombre}</strong>?
                {normalizeStatus(showConfirmEdit.assignment.estadoRevision) === "PENDIENTE" && (
                  <span className="block mt-2 text-sm text-red-600">
                    ⚠️ Este sílabo tiene observaciones pendientes que deben ser corregidas.
                  </span>
                )}
              </p>
              <div className="flex gap-3 justify-end">
                <button
                  onClick={() => setShowConfirmEdit({ show: false })}
                  className="px-4 py-2 text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={() => handleEditAssignment(showConfirmEdit.assignment!)}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                >
                  Confirmar edición
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Modal de visualización existente */}
        {selectedAssignment && (
          <div className="fixed inset-0 bg-black/45 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl h-[90vh] flex flex-col relative">
              <button type="button" onClick={closeModal} className="absolute top-4 right-4 z-10 text-gray-500 hover:text-gray-700 transition-colors bg-white rounded-full p-2 shadow-md">
                <X size={24} />
              </button>
              <div className="p-6 border-b border-gray-200">
                <h2 className="text-xl font-bold text-gray-800 mb-2">{selectedAssignment.cursoNombre}</h2>
                <div className="flex items-center gap-4 text-sm text-gray-600">
                  <span>Código: {selectedAssignment.cursoCodigo}</span>
                  <span>•</span>
                  <span>Estado: <span className={`font-medium ${statusConfig[normalizeStatus(selectedAssignment.estadoRevision)].textColor}`}>
                    {statusConfig[normalizeStatus(selectedAssignment.estadoRevision)].label}
                  </span></span>
                  {selectedAssignment.syllabusId && <><span>•</span><span>Sílabo ID: {selectedAssignment.syllabusId}</span></>}
                </div>
              </div>
              <div className="flex-1 overflow-hidden">
                {isLoadingPdf ? (
                  <div className="h-full flex items-center justify-center">
                    <div className="text-center">
                      <Loader2 className="w-12 h-12 text-blue-600 animate-spin mx-auto mb-4" />
                      <p className="text-lg font-medium text-gray-700">Generando vista previa del PDF...</p>
                      <p className="text-sm text-gray-500 mt-2">Esto puede tomar unos segundos</p>
                    </div>
                  </div>
                ) : pdfError ? (
                  <div className="h-full flex items-center justify-center p-6">
                    <div className="text-center max-w-md">
                      <div className="w-16 h-16 bg-red-100 rounded-lg mx-auto flex items-center justify-center mb-4">
                        <X size={32} className="text-red-600" />
                      </div>
                      <p className="text-lg font-medium text-red-700 mb-2">Error al cargar el sílabo</p>
                      <p className="text-sm text-gray-600">{pdfError}</p>
                    </div>
                  </div>
                ) : pdfUrl ? (
                  <iframe src={pdfUrl} className="w-full h-full" title="Vista previa del PDF" />
                ) : (
                  <div className="h-full flex items-center justify-center">
                    <div className="text-center text-gray-500">
                      <div className="mb-4"><div className="w-16 h-16 bg-gray-200 rounded-lg mx-auto flex items-center justify-center"><Eye size={32} className="text-gray-400" /></div></div>
                      <p className="text-lg font-medium">Vista previa del sílabo</p>
                      <p className="text-sm mt-2">{selectedAssignment.syllabusId ? "Cargando..." : "No hay sílabo disponible para este curso"}</p>
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