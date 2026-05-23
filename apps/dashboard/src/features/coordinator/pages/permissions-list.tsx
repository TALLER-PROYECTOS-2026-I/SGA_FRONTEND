import { useState, useEffect } from "react";
import {
  Search,
  KeyRound,
  FileText,
  CheckCircle,
  Clock,
  XCircle,
  Eye,
  Loader2,
  ListFilter,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useSession } from "../../auth/hooks/use-session";
import type { Assignment } from "../../assignments/hooks/assignments-query";
import { useAllAssignments } from "../../assignments/hooks/assignments-query";
import { useCoordinator } from "../contexts/coordinator-context";
import { getRoleName } from "../../../common/constants/roles";

type AssignmentStatus = "APROBADO" | "EN_PROCESO" | "PENDIENTE" | "ASIGNADO";

type FilterStatus = "ALL" | AssignmentStatus;

function normalizeStatus(status?: string | null): AssignmentStatus {
  const value = String(status || "")
    .trim()
    .toUpperCase();

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

  if (value === "ASIGNADO" || value === "NUEVO") {
    return "ASIGNADO";
  }

  return "ASIGNADO";
}

export default function PermissionsList() {
  const { user, isLoading: sessionLoading } = useSession();
  const navigate = useNavigate();

  useEffect(() => {
    if (!sessionLoading && user) {
      const roleName = getRoleName(user.role);

      if (roleName !== "coordinadora_academica") {
        navigate("/");
      }
    }
  }, [user, sessionLoading, navigate]);

  const {
    data: assignments = [],
    isLoading,
    isError,
    error,
  } = useAllAssignments();

  const {
    setSelectedDocenteId,
    setSelectedSilaboId,
    setSelectedDocenteName,
    setSelectedDocenteEmail,
    setSelectedCourseName,
    setSelectedCourseCode,
  } = useCoordinator();

  const [searchTerm, setSearchTerm] = useState("");
  const [searchFilter, setSearchFilter] = useState<"curso" | "area">("curso");
  const [showFilterDropdown, setShowFilterDropdown] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState<FilterStatus>("ALL");

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
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;

      if (!target.closest(".filter-dropdown-container")) {
        setShowFilterDropdown(false);
      }
    };

    if (showFilterDropdown) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showFilterDropdown]);

  const normalize = (text?: string | null): string =>
    String(text ?? "")
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .trim();

  const filteredAssignments = assignments.filter((assignment: Assignment) => {
    const normalizedSearch = normalize(searchTerm);
    const status = normalizeStatus(assignment.estadoRevision);

    let matchesSearch = true;

    if (normalizedSearch !== "") {
      if (searchFilter === "curso") {
        const courseText = `${assignment.cursoNombre ?? ""} ${
          assignment.cursoCodigo ?? ""
        }`;

        matchesSearch = normalize(courseText).includes(normalizedSearch);
      } else {
        matchesSearch = normalize(assignment.areaCurricular ?? "").includes(
          normalizedSearch,
        );
      }
    }

    const matchesStatus = selectedStatus === "ALL" || status === selectedStatus;

    return matchesSearch && matchesStatus;
  });

  const totalAprobados = assignments.filter(
    (assignment) => normalizeStatus(assignment.estadoRevision) === "APROBADO",
  ).length;

  const totalEnProceso = assignments.filter(
    (assignment) => normalizeStatus(assignment.estadoRevision) === "EN_PROCESO",
  ).length;

  const totalPendientes = assignments.filter(
    (assignment) => normalizeStatus(assignment.estadoRevision) === "PENDIENTE",
  ).length;

  const handleOpenPermission = (assignment: Assignment) => {
    setSelectedDocenteId(assignment.docenteId);
    setSelectedSilaboId(assignment.syllabusId ?? null);
    setSelectedDocenteName(assignment.nombreDocente ?? "Docente");
    setSelectedDocenteEmail(assignment.docenteEmail ?? null);
    setSelectedCourseName(assignment.cursoNombre);
    setSelectedCourseCode(assignment.cursoCodigo);

    navigate(
      `/coordinator/permissions/manage?courseName=${encodeURIComponent(
        assignment.cursoNombre,
      )}&teacherName=${encodeURIComponent(
        assignment.nombreDocente || "Docente",
      )}&courseCode=${encodeURIComponent(
        assignment.cursoCodigo,
      )}&teacherEmail=${encodeURIComponent(assignment.docenteEmail || "")}`,
    );
  };

  if (sessionLoading || isLoading) {
    return (
      <div className="min-h-[calc(100vh-72px)] bg-gray-50 flex items-center justify-center">
        <div className="bg-white border border-gray-100 rounded-2xl shadow-md px-8 py-6 flex items-center gap-3 text-gray-600">
          <Loader2 className="animate-spin text-red-600" size={22} />
          Cargando asignaciones...
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="min-h-[calc(100vh-72px)] bg-gray-50 flex items-center justify-center px-8">
        <div className="bg-white border border-red-100 rounded-2xl shadow-md px-8 py-6 text-red-600 max-w-xl text-center">
          Error: {error?.message}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-72px)] bg-gray-50 px-8 py-8">
      <div className="max-w-6xl mx-auto">
        <div className="mb-7">
          <h1 className="text-3xl font-bold text-gray-900">Asignaturas</h1>

          <p className="text-sm text-gray-500 mt-1">
            Gestiona permisos por docente, curso y área curricular.
          </p>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 shadow-xl overflow-hidden">
          <div className="px-8 py-6 border-b border-gray-100 bg-gradient-to-r from-red-50 via-white to-white">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-red-600 text-white flex items-center justify-center shadow-md">
                <KeyRound size={30} />
              </div>

              <div>
                <h2 className="text-xl font-bold text-gray-900">
                  Activar permisos
                </h2>

                <p className="text-sm text-gray-500 mt-1">
                  Selecciona una asignatura para administrar el alcance de
                  edición del sílabo.
                </p>
              </div>
            </div>
          </div>

          <div className="p-8">
            <section className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
              <div className="bg-blue-600 text-white rounded-xl p-5 shadow-md flex justify-between items-center">
                <div>
                  <p className="text-sm font-medium opacity-90">Total cursos</p>

                  <h2 className="text-3xl font-bold mt-1">
                    {assignments.length}
                  </h2>
                </div>

                <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center">
                  <FileText size={26} />
                </div>
              </div>

              <div className="bg-green-600 text-white rounded-xl p-5 shadow-md flex justify-between items-center">
                <div>
                  <p className="text-sm font-medium opacity-90">Aprobados</p>

                  <h2 className="text-3xl font-bold mt-1">{totalAprobados}</h2>
                </div>

                <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center">
                  <CheckCircle size={26} />
                </div>
              </div>

              <div className="bg-yellow-500 text-white rounded-xl p-5 shadow-md flex justify-between items-center">
                <div>
                  <p className="text-sm font-medium opacity-90">En proceso</p>

                  <h2 className="text-3xl font-bold mt-1">{totalEnProceso}</h2>
                </div>

                <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center">
                  <Clock size={26} />
                </div>
              </div>

              <div className="bg-red-600 text-white rounded-xl p-5 shadow-md flex justify-between items-center">
                <div>
                  <p className="text-sm font-medium opacity-90">Pendientes</p>

                  <h2 className="text-3xl font-bold mt-1">{totalPendientes}</h2>
                </div>

                <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center">
                  <XCircle size={26} />
                </div>
              </div>
            </section>

            <div className="grid grid-cols-1 lg:grid-cols-[1fr_auto] gap-4 mb-6">
              <div className="relative filter-dropdown-container">
                <Search
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
                  size={20}
                />

                <input
                  type="text"
                  placeholder={`Buscar por ${
                    searchFilter === "curso"
                      ? "nombre de curso o código"
                      : "área curricular"
                  }...`}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  onClick={() => setShowFilterDropdown(true)}
                  className="w-full h-12 pl-12 pr-32 bg-gray-50 border border-gray-200 rounded-xl shadow-sm text-sm text-gray-700 placeholder:text-gray-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                />

                <button
                  type="button"
                  onClick={() => setShowFilterDropdown((prev) => !prev)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white border border-gray-100 text-xs font-bold text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  <ListFilter size={14} />
                  {searchFilter === "curso" ? "Curso" : "Área"}
                </button>

                {showFilterDropdown && (
                  <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-gray-100 rounded-xl shadow-xl z-50 overflow-hidden">
                    <div className="px-4 py-3 border-b border-gray-100 bg-gray-50">
                      <span className="text-xs font-bold text-gray-600 uppercase">
                        Filtrar por
                      </span>
                    </div>

                    <button
                      type="button"
                      onMouseDown={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setSearchFilter("curso");
                        setShowFilterDropdown(false);
                        setSearchTerm("");
                      }}
                      className={`w-full text-left px-4 py-4 hover:bg-red-50 transition-colors flex items-center gap-3 ${
                        searchFilter === "curso" ? "bg-red-50" : ""
                      }`}
                    >
                      <span
                        className={`w-3 h-3 rounded-full ${
                          searchFilter === "curso"
                            ? "bg-red-500"
                            : "bg-gray-300"
                        }`}
                      />

                      <span
                        className={`text-sm font-semibold ${
                          searchFilter === "curso"
                            ? "text-red-700"
                            : "text-gray-700"
                        }`}
                      >
                        Nombre de curso o código
                      </span>
                    </button>

                    <button
                      type="button"
                      onMouseDown={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setSearchFilter("area");
                        setShowFilterDropdown(false);
                        setSearchTerm("");
                      }}
                      className={`w-full text-left px-4 py-4 hover:bg-red-50 transition-colors flex items-center gap-3 ${
                        searchFilter === "area" ? "bg-red-50" : ""
                      }`}
                    >
                      <span
                        className={`w-3 h-3 rounded-full ${
                          searchFilter === "area" ? "bg-red-500" : "bg-gray-300"
                        }`}
                      />

                      <span
                        className={`text-sm font-semibold ${
                          searchFilter === "area"
                            ? "text-red-700"
                            : "text-gray-700"
                        }`}
                      >
                        Área curricular
                      </span>
                    </button>
                  </div>
                )}
              </div>

              <div className="flex items-center px-4 h-12 rounded-xl bg-gray-100 text-sm font-semibold text-gray-600">
                Mostrando {filteredAssignments.length} de {assignments.length}
              </div>
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

                {(Object.keys(statusConfig) as AssignmentStatus[]).map(
                  (key) => {
                    const cfg = statusConfig[key];

                    const count = assignments.filter(
                      (assignment) =>
                        normalizeStatus(assignment.estadoRevision) === key,
                    ).length;

                    const isSelected = selectedStatus === key;

                    return (
                      <button
                        type="button"
                        key={key}
                        onClick={() => setSelectedStatus(key)}
                        className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold border transition-all ${
                          isSelected
                            ? `${cfg.color} text-white border-transparent shadow-sm`
                            : `${cfg.bgColor} ${cfg.textColor} border-transparent hover:shadow-sm`
                        }`}
                      >
                        <span
                          className={`w-2 h-2 rounded-full ${
                            isSelected ? "bg-white" : cfg.color
                          }`}
                        />

                        {cfg.label}

                        <span
                          className={`text-xs px-2 py-0.5 rounded-full ${
                            isSelected
                              ? "bg-white/20 text-white"
                              : "bg-white/70 text-gray-800"
                          }`}
                        >
                          {count}
                        </span>
                      </button>
                    );
                  },
                )}
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-gray-100 shadow-md overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-200 text-xs uppercase tracking-wide text-gray-700">
                      <th className="px-6 py-4 text-left font-bold w-[16%]">
                        Código
                      </th>

                      <th className="px-6 py-4 text-left font-bold w-[30%]">
                        Curso
                      </th>

                      <th className="px-6 py-4 text-left font-bold w-[24%]">
                        Docente
                      </th>

                      <th className="px-6 py-4 text-left font-bold w-[16%]">
                        Estado
                      </th>

                      <th className="px-6 py-4 text-center font-bold w-[14%]">
                        Acción
                      </th>
                    </tr>
                  </thead>

                  <tbody>
                    {filteredAssignments.map(
                      (assignment: Assignment, index: number) => {
                        const normalizedStatus = normalizeStatus(
                          assignment.estadoRevision,
                        );

                        const cfg = statusConfig[normalizedStatus];

                        return (
                          <tr
                            key={`${assignment.cursoCodigo}-${
                              assignment.syllabusId ?? "sin-id"
                            }-${
                              assignment.docenteId ?? "sin-docente"
                            }-${index}`}
                            className="border-b border-gray-100 last:border-b-0 hover:bg-gray-50 transition-colors"
                          >
                            <td className="px-6 py-5 font-semibold text-gray-800">
                              {assignment.cursoCodigo || "N/A"}
                            </td>

                            <td className="px-6 py-5">
                              <div className="font-bold text-gray-900">
                                {assignment.cursoNombre}
                              </div>

                              {assignment.areaCurricular && (
                                <div className="text-xs text-gray-500 mt-1">
                                  Área: {assignment.areaCurricular}
                                </div>
                              )}
                            </td>

                            <td className="px-6 py-5 text-gray-700">
                              {assignment.nombreDocente || "No asignado"}
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
                              <div className="flex items-center justify-center">
                                <button
                                  type="button"
                                  onClick={() =>
                                    handleOpenPermission(assignment)
                                  }
                                  className="w-9 h-9 flex items-center justify-center text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-xl transition-colors"
                                  title="Gestionar permisos"
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
                <div className="text-center py-12">
                  <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <Search className="text-gray-400" size={30} />
                  </div>

                  <p className="text-lg font-semibold text-gray-700 mb-1">
                    No se encontraron asignaciones
                  </p>

                  <p className="text-sm text-gray-500">
                    Buscando "{searchTerm}" en{" "}
                    {searchFilter === "curso"
                      ? "Nombre de Curso"
                      : "Área Curricular"}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
