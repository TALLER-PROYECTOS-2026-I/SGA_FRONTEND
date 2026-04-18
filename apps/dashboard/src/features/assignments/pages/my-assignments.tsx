import { useState, useEffect } from "react";
import { Search, Eye, Edit, X, Loader2, Upload, Trash2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useSession } from "../../auth/hooks/use-session";
import { useAssignments, type Assignment } from "../hooks/assignments-query";

type AssignmentStatus = "APROBADO" | "ANALIZANDO" | "DESAPROBADO";
type FilterStatus = "ALL" | AssignmentStatus;

export default function MyAssignments() {
  const { user, isLoading: sessionLoading } = useSession();
  const docenteId = user?.id as number | string | undefined;

  const {
    data: assignments = [],
    isLoading,
    isError,
    error,
    refetch,
  } = useAssignments(docenteId);

  const [searchTerm, setSearchTerm] = useState("");
  const [selectedAssignment, setSelectedAssignment] =
    useState<Assignment | null>(null);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [isLoadingPdf, setIsLoadingPdf] = useState(false);
  const [pdfError, setPdfError] = useState<string | null>(null);

  const [assignmentToDelete, setAssignmentToDelete] =
    useState<Assignment | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const [selectedStatus, setSelectedStatus] = useState<FilterStatus>("ALL");
  const [groupMap, setGroupMap] = useState<Record<string, string>>({});
  const [dateMap, setDateMap] = useState<Record<string, string>>({});

  const navigate = useNavigate();

  const API = import.meta.env.VITE_API_BASE_URL;

  const normalizeStatus = (status?: string): AssignmentStatus | null => {
    if (!status) return null;

    const value = status.toUpperCase().trim();

    if (value === "APROBADO") return "APROBADO";
    if (value === "ANALIZANDO" || value === "PENDIENTE") return "ANALIZANDO";
    if (value === "DESAPROBADO" || value === "RECHAZADO") return "DESAPROBADO";

    return null;
  };

  const getPermissionsByStatus = (status: AssignmentStatus | null) => {
    const isApproved = status === "APROBADO";

    return {
      canView: isApproved,
      canEdit: isApproved,
      canImport: isApproved,
      canDelete: isApproved,
    };
  };

  const statusConfig: Record<
    AssignmentStatus,
    {
      label: string;
      dot: string;
      textColor: string;
      bgColor: string;
      border: string;
    }
  > = {
    APROBADO: {
      label: "Aprobado",
      dot: "bg-green-500",
      textColor: "text-green-700",
      bgColor: "bg-green-50",
      border: "border-green-200",
    },
    ANALIZANDO: {
      label: "Pendiente",
      dot: "bg-yellow-500",
      textColor: "text-yellow-700",
      bgColor: "bg-yellow-50",
      border: "border-yellow-200",
    },
    DESAPROBADO: {
      label: "Rechazado",
      dot: "bg-red-500",
      textColor: "text-red-700",
      bgColor: "bg-red-50",
      border: "border-red-200",
    },
  };

  const getGroupByIndex = (index: number) => {
    const groups = ["A1", "A2", "B1", "B2", "C1", "C2"];
    return groups[index % groups.length];
  };

  const getDateByIndex = (index: number) => {
    const dates = [
      "15/05/2026",
      "20/05/2026",
      "18/05/2026",
      "22/05/2026",
      "17/05/2026",
      "25/05/2026",
    ];
    return dates[index % dates.length];
  };

  useEffect(() => {
    if (assignments.length > 0) {
      const newGroupMap: Record<string, string> = {};
      const newDateMap: Record<string, string> = {};

      assignments.forEach((assignment, index) => {
        if (!newGroupMap[assignment.cursoCodigo]) {
          newGroupMap[assignment.cursoCodigo] = getGroupByIndex(index);
          newDateMap[assignment.cursoCodigo] = getDateByIndex(index);
        }
      });

      setGroupMap(newGroupMap);
      setDateMap(newDateMap);
    }
  }, [assignments]);

  useEffect(() => {
    return () => {
      if (pdfUrl) {
        URL.revokeObjectURL(pdfUrl);
      }
    };
  }, [pdfUrl]);

  const filteredAssignments = assignments.filter((assignment: Assignment) => {
    const group = groupMap[assignment.cursoCodigo] || "";

    const matchesSearch =
      assignment.cursoNombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
      assignment.cursoCodigo.toLowerCase().includes(searchTerm.toLowerCase()) ||
      group.toLowerCase().includes(searchTerm.toLowerCase());

    const normalizedStatus = normalizeStatus(assignment.estadoRevision);

    const matchesStatus =
      selectedStatus === "ALL" || normalizedStatus === selectedStatus;

    return matchesSearch && matchesStatus;
  });

  const handleViewAssignment = async (assignment: Assignment) => {
    setSelectedAssignment(assignment);
    setPdfUrl(null);
    setPdfError(null);

    if (!assignment.syllabusId) {
      setPdfError("No hay sílabo importado disponible para este curso");
      return;
    }

    setIsLoadingPdf(true);

    try {
      const url = `${API}/director/syllabi/${assignment.syllabusId}/signed/latest`;
      setPdfUrl(url);
    } catch (err) {
      setPdfError(
        err instanceof Error ? err.message : "Error al cargar el PDF importado",
      );
    } finally {
      setIsLoadingPdf(false);
    }
  };

  const handleEditAssignment = (
    codigo: string,
    _estado: string,
    syllabusId?: number,
  ) => {
    const mode = "edit";

    const url = syllabusId
      ? `/syllabus?codigo=${codigo}&id=${syllabusId}&mode=${mode}`
      : `/syllabus?codigo=${codigo}&mode=${mode}`;

    navigate(url);
  };

  const handleDeleteAssignment = async (assignment: Assignment) => {
    if (!assignment.syllabusId) {
      setErrorMessage("No se encontró el ID del sílabo");
      setTimeout(() => setErrorMessage(null), 3000);
      return;
    }

    try {
      setIsDeleting(true);
      setErrorMessage(null);
      setSuccessMessage(null);

      const API = import.meta.env.VITE_API_BASE_URL;

      const res = await fetch(`${API}/syllabus/${assignment.syllabusId}`, {
        method: "DELETE",
      });

      let data: { message?: string } | null = null;

      try {
        data = (await res.json()) as { message?: string };
      } catch {
        data = null;
      }

      if (!res.ok) {
        throw new Error(data?.message ?? "Error al eliminar el sílabo");
      }

      setSuccessMessage("Sílabo eliminado correctamente");
      setAssignmentToDelete(null);
      await refetch();

      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (error) {
      console.error(error);
      setErrorMessage(
        error instanceof Error ? error.message : "Error al eliminar el sílabo",
      );
      setTimeout(() => setErrorMessage(null), 3000);
    } finally {
      setIsDeleting(false);
    }
  };

  const closeModal = () => {
    if (pdfUrl) {
      URL.revokeObjectURL(pdfUrl);
    }
    setSelectedAssignment(null);
    setPdfUrl(null);
    setPdfError(null);
  };

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
    <div className="max-w-6xl mx-auto px-6 py-8">
      {errorMessage && (
        <div className="mb-4 rounded-xl border border-red-200 bg-red-50 p-4 text-red-700">
          {errorMessage}
        </div>
      )}

      {successMessage && (
        <div className="mb-4 rounded-xl border border-green-200 bg-green-50 p-4 text-green-700">
          {successMessage}
        </div>
      )}

      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="mb-2 text-5xl font-bold tracking-tight text-slate-900">
            Mis Asignaciones
          </h1>
          <p className="text-2xl text-slate-500">
            Gestiona y revisa tus sílabos asignados
          </p>
        </div>

        {/* 🔥 BOTÓN CREAR */}
        <button
          onClick={() => navigate("/syllabus")}
          className="flex items-center gap-2 rounded-2xl bg-[#b91c1c] px-6 py-3 font-semibold text-white shadow-md transition hover:scale-105 hover:bg-red-800"
        >
          + Crear nuevo sílabo
        </button>
      </div>

      <div className="relative mb-5">
        <Search
          className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
          size={22}
        />
        <input
          type="text"
          placeholder="Buscar por código, asignatura o grupo..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full rounded-2xl border border-slate-200 bg-white py-4 pl-12 pr-4 text-base shadow-sm outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
        />
      </div>

      <div className="mb-8 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="flex flex-wrap items-center gap-3">
          <span className="text-base font-semibold text-slate-700">
            Filtrar por estado:
          </span>

          <button
            onClick={() => setSelectedStatus("ALL")}
            className={`inline-flex items-center gap-2 rounded-xl border px-4 py-2 text-sm font-semibold transition ${
              selectedStatus === "ALL"
                ? "border-red-600 bg-red-600 text-white"
                : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
            }`}
          >
            Todos
            <span
              className={`rounded-full px-2 py-0.5 text-xs ${
                selectedStatus === "ALL"
                  ? "bg-white/20 text-white"
                  : "bg-slate-100 text-slate-700"
              }`}
            >
              {assignments.length}
            </span>
          </button>

          {(Object.keys(statusConfig) as AssignmentStatus[]).map((key) => {
            const cfg = statusConfig[key];
            const count = assignments.filter(
              (a) => normalizeStatus(a.estadoRevision) === key,
            ).length;
            const isSelected = selectedStatus === key;

            return (
              <button
                key={key}
                onClick={() => setSelectedStatus(key)}
                className={`inline-flex items-center gap-2 rounded-xl border px-4 py-2 text-sm font-semibold transition ${
                  isSelected
                    ? `${cfg.bgColor} ${cfg.textColor} ${cfg.border}`
                    : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                }`}
              >
                <span className={`h-3 w-3 rounded-full ${cfg.dot}`} />
                {cfg.label}
                <span className="rounded-full bg-white/70 px-2 py-0.5 text-xs text-slate-700">
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead className="border-b border-slate-200 bg-white">
              <tr className="text-left text-sm font-extrabold uppercase tracking-wide text-slate-700">
                <th className="px-6 py-5">Código</th>
                <th className="px-6 py-5">Asignatura</th>
                <th className="px-6 py-5">Grupo</th>
                <th className="px-6 py-5">Fecha de entrega</th>
                <th className="px-6 py-5">Estado</th>
                <th className="px-6 py-5">Acciones</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100">
              {filteredAssignments.map((assignment: Assignment, index) => {
                const normalizedStatus = normalizeStatus(
                  assignment.estadoRevision,
                );

                const cfg = (normalizedStatus &&
                  statusConfig[normalizedStatus]) ?? {
                  label: assignment.estadoRevision || "Sin estado",
                  dot: "bg-slate-400",
                  textColor: "text-slate-700",
                  bgColor: "bg-slate-50",
                  border: "border-slate-200",
                };

                const group = groupMap[assignment.cursoCodigo] || "";
                const date = dateMap[assignment.cursoCodigo] || "";
                const permissions = getPermissionsByStatus(normalizedStatus);

                const uniqueKey = assignment.syllabusId
                  ? `${assignment.cursoCodigo}-${assignment.syllabusId}`
                  : `${assignment.cursoCodigo}-${index}`;

                return (
                  <tr key={uniqueKey} className="hover:bg-slate-50/70">
                    <td className="px-6 py-5 text-base font-semibold text-slate-800">
                      {assignment.cursoCodigo}
                    </td>

                    <td className="px-6 py-5">
                      <div className="max-w-[320px] text-base font-semibold text-slate-900">
                        {assignment.cursoNombre}
                      </div>
                    </td>

                    <td className="px-6 py-5 text-base text-slate-800">
                      {group}
                    </td>

                    <td className="px-6 py-5 text-base text-slate-500">
                      {date}
                    </td>

                    <td className="px-6 py-5">
                      <div className="inline-flex items-center gap-3">
                        <span
                          className={`h-3.5 w-3.5 rounded-full ${cfg.dot}`}
                        />
                        <span
                          className={`inline-flex items-center rounded-xl border px-4 py-2 text-sm font-semibold ${cfg.bgColor} ${cfg.textColor} ${cfg.border}`}
                        >
                          {cfg.label}
                        </span>
                      </div>
                    </td>

                    <td className="px-6 py-5">
                      <div className="flex items-center gap-3">
                        {permissions.canView ? (
                          <button
                            onClick={() => handleViewAssignment(assignment)}
                            className="rounded-xl bg-blue-50 p-3 text-blue-500 transition hover:bg-blue-100"
                            title="Ver"
                          >
                            <Eye size={18} />
                          </button>
                        ) : (
                          <button
                            disabled
                            className="cursor-not-allowed rounded-xl bg-slate-100 p-3 text-slate-300"
                            title="Ver bloqueado"
                          >
                            <Eye size={18} />
                          </button>
                        )}

                        {permissions.canEdit ? (
                          <button
                            onClick={() =>
                              handleEditAssignment(
                                assignment.cursoCodigo,
                                assignment.estadoRevision,
                                assignment.syllabusId,
                              )
                            }
                            className="rounded-xl bg-green-50 p-3 text-green-600 transition hover:bg-green-100"
                            title="Editar"
                          >
                            <Edit size={18} />
                          </button>
                        ) : (
                          <button
                            disabled
                            className="cursor-not-allowed rounded-xl bg-slate-100 p-3 text-slate-300"
                            title="Editar bloqueado"
                          >
                            <Edit size={18} />
                          </button>
                        )}

                        {permissions.canDelete ? (
                          <button
                            onClick={() => setAssignmentToDelete(assignment)}
                            className="rounded-xl bg-red-50 p-3 text-red-500 transition hover:bg-red-100 disabled:opacity-60"
                            title="Eliminar"
                            disabled={isDeleting}
                          >
                            {isDeleting ? (
                              <Loader2 size={18} className="animate-spin" />
                            ) : (
                              <Trash2 size={18} />
                            )}
                          </button>
                        ) : (
                          <button
                            disabled
                            className="cursor-not-allowed rounded-xl bg-slate-100 p-3 text-slate-300"
                            title="Eliminar bloqueado"
                          >
                            <Trash2 size={18} />
                          </button>
                        )}

                        {permissions.canImport ? (
                          <a
                            href={`/director/importar-silabo-firmado?silaboId=${assignment.syllabusId}&cursoCodigo=${encodeURIComponent(assignment.cursoCodigo)}&cursoNombre=${encodeURIComponent(assignment.cursoNombre)}`}
                            className="rounded-xl bg-purple-50 p-3 text-purple-600 transition hover:bg-purple-100"
                            title="Importar sílabo firmado"
                          >
                            <Upload size={18} />
                          </a>
                        ) : (
                          <button
                            disabled
                            className="cursor-not-allowed rounded-xl bg-slate-100 p-3 text-slate-300"
                            title="Importar bloqueado"
                          >
                            <Upload size={18} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {filteredAssignments.length === 0 && (
        <div className="py-12 text-center text-slate-500">
          No se encontraron asignaciones que coincidan con tu búsqueda.
        </div>
      )}

      <div className="mt-8 rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
        <h3 className="mb-6 text-3xl font-bold text-slate-900">
          Leyenda de Estados
        </h3>

        <div className="grid gap-6 md:grid-cols-3">
          <div className="flex items-start gap-4">
            <span className="mt-1 h-5 w-5 rounded-full bg-green-500" />
            <div>
              <p className="text-xl font-bold text-slate-900">
                Verde - Aprobado
              </p>
              <p className="mt-2 text-lg text-slate-600">
                El sílabo está aprobado por el director
              </p>
            </div>
          </div>

          <div className="flex items-start gap-4">
            <span className="mt-1 h-5 w-5 rounded-full bg-yellow-500" />
            <div>
              <p className="text-xl font-bold text-slate-900">
                Amarillo - Pendiente
              </p>
              <p className="mt-2 text-lg text-slate-600">
                El sílabo está pendiente de aprobación por el director
              </p>
            </div>
          </div>

          <div className="flex items-start gap-4">
            <span className="mt-1 h-5 w-5 rounded-full bg-red-500" />
            <div>
              <p className="text-xl font-bold text-slate-900">
                Rojo - Rechazado
              </p>
              <p className="mt-2 text-lg text-slate-600">
                El sílabo fue rechazado por el director y requiere correcciones
              </p>
            </div>
          </div>
        </div>
      </div>

      {selectedAssignment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 p-4">
          <div className="relative flex h-[90vh] w-full max-w-6xl flex-col overflow-hidden rounded-3xl bg-white shadow-2xl">
            <button
              onClick={closeModal}
              className="absolute right-5 top-5 z-10 rounded-full bg-white p-2 text-slate-500 shadow-md transition hover:text-slate-700"
            >
              <X size={24} />
            </button>

            <div className="border-b border-slate-200 px-8 py-6">
              <h2 className="mb-2 text-3xl font-bold text-slate-900">
                {selectedAssignment.cursoNombre}
              </h2>

              <div className="flex flex-wrap items-center gap-3 text-sm text-slate-500">
                <span>Código: {selectedAssignment.cursoCodigo}</span>
                <span>•</span>
                <span>
                  Estado:{" "}
                  {(() => {
                    const modalStatus = normalizeStatus(
                      selectedAssignment.estadoRevision,
                    );
                    const modalCfg = modalStatus
                      ? statusConfig[modalStatus]
                      : null;

                    return (
                      <span
                        className={`font-semibold ${
                          modalCfg?.textColor || "text-slate-700"
                        }`}
                      >
                        {modalCfg?.label || selectedAssignment.estadoRevision}
                      </span>
                    );
                  })()}
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
                <div className="flex h-full items-center justify-center">
                  <div className="text-center">
                    <Loader2 className="mx-auto mb-4 h-12 w-12 animate-spin text-blue-600" />
                    <p className="text-lg font-medium text-slate-700">
                      Generando vista previa del PDF...
                    </p>
                    <p className="mt-2 text-sm text-slate-500">
                      Esto puede tomar unos segundos
                    </p>
                  </div>
                </div>
              ) : pdfError ? (
                <div className="flex h-full items-center justify-center p-6">
                  <div className="max-w-md text-center">
                    <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-red-100">
                      <X size={32} className="text-red-600" />
                    </div>
                    <p className="mb-2 text-lg font-medium text-red-700">
                      Error al cargar el sílabo
                    </p>
                    <p className="text-sm text-slate-600">{pdfError}</p>
                  </div>
                </div>
              ) : pdfUrl ? (
                <iframe
                  src={pdfUrl}
                  className="h-full w-full"
                  title="Vista previa del PDF"
                />
              ) : (
                <div className="flex h-full items-center justify-center">
                  <div className="text-center text-slate-500">
                    <div className="mb-4">
                      <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-200">
                        <Eye size={32} className="text-slate-400" />
                      </div>
                    </div>
                    <p className="text-lg font-medium">
                      Vista previa del sílabo
                    </p>
                    <p className="mt-2 text-sm">
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

      {assignmentToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 p-4">
          <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl">
            <h3 className="mb-3 text-2xl font-bold text-slate-900">
              Confirmar eliminación
            </h3>

            <p className="mb-6 text-slate-600">
              ¿Deseas eliminar el sílabo de{" "}
              <span className="font-semibold text-slate-900">
                {assignmentToDelete.cursoNombre}
              </span>
              ?
            </p>

            <div className="flex justify-end gap-3">
              <button
                onClick={() => setAssignmentToDelete(null)}
                className="rounded-xl border border-slate-200 px-4 py-2 text-slate-700 hover:bg-slate-50"
                disabled={isDeleting}
              >
                Cancelar
              </button>

              <button
                onClick={() => {
                  if (assignmentToDelete) {
                    handleDeleteAssignment(assignmentToDelete);
                  }
                }}
                disabled={isDeleting}
                className="rounded-xl bg-red-600 px-4 py-2 text-white hover:bg-red-700 disabled:opacity-50"
              >
                {isDeleting ? "Eliminando..." : "Eliminar"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
/*
preuba
*/
