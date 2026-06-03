import { useState, useEffect, useMemo } from "react";
import {
  Search,
  ClipboardCheck,
  FileText,
  CheckCircle,
  Clock,
  XCircle,
  Eye,
  Loader2,
  AlertTriangle,
  Download,
  CheckSquare,
  Square,
} from "lucide-react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { pdf } from "@react-pdf/renderer";
import {
  useSyllabusInReview,
  type SyllabusReview,
} from "../hooks/syllabus-review-query";
import { syllabusPDFService } from "../../syllabus/services/syllabus-pdf-service";
import { SyllabusPDFDocument } from "../../syllabus/components/SyllabusPDFDocument";

type SyllabusStatus = "ASIGNADO" | "EN_PROCESO" | "VALIDADO" | "PENDIENTE";
type FilterStatus = "ALL" | SyllabusStatus;

function normalizeStatus(status?: string | null): SyllabusStatus {
  const value = String(status || "").trim().toUpperCase();

  if (value === "VALIDADO" || value === "APROBADO") {
    return "VALIDADO";
  }

  if (
    value === "ANALIZANDO" ||
    value === "PENDIENTE" ||
    value === "EN_REVISION" ||
    value === "EN REVISIÓN" ||
    value === "PENDIENTE_REVISION" ||
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

function getSyllabusKey(syllabus: SyllabusReview, index?: number) {
  const parts = [
    syllabus.syllabusId ?? syllabus.id ?? "sin-silabo",
    syllabus.docenteId ?? "sin-docente",
    syllabus.courseCode ?? "sin-codigo",
    syllabus.teacherName ?? "sin-docente-nombre",
    syllabus.submittedDate ?? "sin-fecha",
  ];

  if (typeof index === "number") {
    parts.push(index);
  }

  return parts.map((part) => String(part).trim()).join("-");
}

function getSyllabusIdForExport(syllabus: SyllabusReview): number | null {
  const rawId = syllabus.syllabusId ?? syllabus.id;

  if (rawId === null || rawId === undefined || String(rawId).trim() === "") {
    return null;
  }

  const numericId = Number(rawId);

  if (Number.isNaN(numericId)) {
    return null;
  }

  return numericId;
}

function sanitizeFileName(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9-_ ]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .toLowerCase();
}

function delay(ms: number) {
  return new Promise((resolve) => window.setTimeout(resolve, ms));
}

export default function ReviewSyllabusList() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedStatus, setSelectedStatus] = useState<FilterStatus>("ALL");
  const [selectedSyllabusKeys, setSelectedSyllabusKeys] = useState<string[]>(
    [],
  );
  const [isExportingPdf, setIsExportingPdf] = useState(false);

  const {
    data: syllabusListFromAPI,
    isLoading,
    isError,
    refetch,
  } = useSyllabusInReview();

  useEffect(() => {
    const refreshParam = searchParams.get("refresh");

    if (refreshParam) {
      refetch();

      const newSearchParams = new URLSearchParams(searchParams);
      newSearchParams.delete("refresh");

      window.history.replaceState(
        {},
        "",
        `${window.location.pathname}${
          newSearchParams.toString() ? "?" + newSearchParams.toString() : ""
        }`,
      );
    }
  }, [searchParams, refetch]);

  const syllabusList = useMemo(() => {
    return Array.isArray(syllabusListFromAPI) ? syllabusListFromAPI : [];
  }, [syllabusListFromAPI]);

  const statusConfig: Record<
    SyllabusStatus,
    { label: string; color: string; textColor: string; bgColor: string }
  > = {
    ASIGNADO: {
      label: "Asignado",
      color: "bg-blue-500",
      textColor: "text-blue-700",
      bgColor: "bg-blue-50",
    },
    EN_PROCESO: {
      label: "En proceso",
      color: "bg-yellow-500",
      textColor: "text-yellow-700",
      bgColor: "bg-yellow-50",
    },
    VALIDADO: {
      label: "Validado",
      color: "bg-green-500",
      textColor: "text-green-700",
      bgColor: "bg-green-50",
    },
    PENDIENTE: {
      label: "Pendiente",
      color: "bg-red-500",
      textColor: "text-red-700",
      bgColor: "bg-red-50",
    },
  };

  const filteredSyllabi = useMemo(() => {
    const searchLower = searchTerm.toLowerCase();

    return syllabusList.filter((syllabus) => {
      if (!syllabus || typeof syllabus !== "object") {
        return false;
      }

      const courseName = syllabus.courseName?.toLowerCase() || "";
      const courseCode = syllabus.courseCode || "";
      const teacherName = syllabus.teacherName?.toLowerCase() || "";
      const normalizedStatus = normalizeStatus(syllabus.status);

      const matchesSearch =
        !searchTerm ||
        courseName.includes(searchLower) ||
        courseCode.toLowerCase().includes(searchLower) ||
        teacherName.includes(searchLower);

      const matchesStatus =
        selectedStatus === "ALL" || normalizedStatus === selectedStatus;

      return matchesSearch && matchesStatus;
    });
  }, [syllabusList, selectedStatus, searchTerm]);

  const visibleKeys = useMemo(
    () =>
      filteredSyllabi
        .map((syllabus, index) => getSyllabusKey(syllabus, index))
        .filter(Boolean),
    [filteredSyllabi],
  );

  const selectedVisibleCount = visibleKeys.filter((key) =>
    selectedSyllabusKeys.includes(key),
  ).length;

  const allVisibleSelected =
    visibleKeys.length > 0 && selectedVisibleCount === visibleKeys.length;

  const hasSelectedSyllabi = selectedSyllabusKeys.length > 0;

  const totalValidado = syllabusList.filter(
    (syllabus) => normalizeStatus(syllabus?.status) === "VALIDADO",
  ).length;

  const totalEnProceso = syllabusList.filter(
    (syllabus) => normalizeStatus(syllabus?.status) === "EN_PROCESO",
  ).length;

  const totalPendiente = syllabusList.filter(
    (syllabus) => normalizeStatus(syllabus?.status) === "PENDIENTE",
  ).length;

  const toggleSyllabusSelection = (
    syllabus: SyllabusReview,
    index: number,
  ) => {
    const key = getSyllabusKey(syllabus, index);

    if (!key) return;

    setSelectedSyllabusKeys((prev) =>
      prev.includes(key)
        ? prev.filter((item) => item !== key)
        : [...prev, key],
    );
  };

  const toggleSelectVisible = () => {
    if (allVisibleSelected) {
      setSelectedSyllabusKeys((prev) =>
        prev.filter((key) => !visibleKeys.includes(key)),
      );
      return;
    }

    setSelectedSyllabusKeys((prev) =>
      Array.from(new Set([...prev, ...visibleKeys])),
    );
  };

  const handleReviewSyllabus = (syllabus: SyllabusReview) => {
    const routeId =
      syllabus.id && String(syllabus.id).trim() !== ""
        ? syllabus.id
        : String(syllabus.syllabusId || "");

    const url = `/coordinator/review-syllabus/${routeId}?docenteId=${
      syllabus.docenteId
    }&syllabusId=${syllabus.syllabusId}&courseName=${encodeURIComponent(
      syllabus.courseName,
    )}&courseCode=${encodeURIComponent(
      syllabus.courseCode,
    )}&teacherName=${encodeURIComponent(syllabus.teacherName)}`;

    if (!routeId) {
      return;
    }

    navigate(url);
  };

  const downloadSyllabusPdf = async (
    syllabus: SyllabusReview,
    index: number,
  ) => {
    const syllabusId = getSyllabusIdForExport(syllabus);

    if (!syllabusId) {
      throw new Error(
        `No se encontró ID de sílabo para ${syllabus.courseName}`,
      );
    }

    const data = await syllabusPDFService.fetchCompleteSyllabus(syllabusId);
    const blob = await pdf(<SyllabusPDFDocument data={data} />).toBlob();

    const courseCode = sanitizeFileName(syllabus.courseCode || "sin-codigo");
    const courseName = sanitizeFileName(syllabus.courseName || "silabo");
    const fileIndex = String(index + 1).padStart(2, "0");

    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.download = `${fileIndex}-${courseCode}-${courseName}.pdf`;

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    URL.revokeObjectURL(url);
  };

  const exportSyllabi = async (
    syllabiToExport: SyllabusReview[],
    emptyMessage: string,
  ) => {
    if (syllabiToExport.length === 0) {
      alert(emptyMessage);
      return;
    }

    try {
      setIsExportingPdf(true);

      for (let index = 0; index < syllabiToExport.length; index += 1) {
        await downloadSyllabusPdf(syllabiToExport[index], index);

        if (syllabiToExport.length > 1) {
          await delay(250);
        }
      }
    } catch (error) {
      alert(
        error instanceof Error
          ? error.message
          : "Error al exportar los sílabos.",
      );
    } finally {
      setIsExportingPdf(false);
    }
  };

  const handleExportAllSyllabi = async () => {
    await exportSyllabi(
      syllabusList,
      "No hay sílabos disponibles para exportar.",
    );
  };

  const handleExportSelectedSyllabi = async () => {
    const selectedSyllabi = filteredSyllabi.filter((syllabus, index) =>
      selectedSyllabusKeys.includes(getSyllabusKey(syllabus, index)),
    );

    await exportSyllabi(
      selectedSyllabi,
      "Seleccione al menos un sílabo para exportar.",
    );
  };

  if (isLoading && !syllabusList.length) {
    return (
      <div className="min-h-[calc(100vh-72px)] bg-gray-50 flex items-center justify-center">
        <div className="bg-white border border-gray-100 rounded-2xl shadow-md px-8 py-6 flex items-center gap-3 text-gray-600">
          <Loader2 className="animate-spin text-red-600" size={22} />
          Cargando sílabos...
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-72px)] bg-gray-50 px-8 py-8">
      <div className="max-w-6xl mx-auto">
        <div className="mb-7">
          <h1 className="text-3xl font-bold text-gray-900">
            Revisión de Sílabos
          </h1>

          <p className="text-sm text-gray-500 mt-1">
            Revisa, filtra, valida y exporta los sílabos enviados por los
            docentes.
          </p>
        </div>

        {(isError ||
          !syllabusListFromAPI ||
          syllabusListFromAPI.length === 0) && (
          <div className="mb-6 bg-yellow-50 border border-yellow-200 rounded-2xl px-5 py-4 flex items-start gap-3">
            <AlertTriangle className="text-yellow-600 mt-0.5" size={20} />

            <p className="text-sm text-yellow-700">
              {isError
                ? "No se pudieron cargar los sílabos desde el servidor."
                : "El servidor no devolvió datos."}
            </p>
          </div>
        )}

        <div className="bg-white rounded-2xl border border-gray-100 shadow-xl overflow-hidden">
          <div className="px-8 py-6 border-b border-gray-100 bg-gradient-to-r from-red-50 via-white to-white">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-red-600 text-white flex items-center justify-center shadow-md">
                  <ClipboardCheck size={30} />
                </div>

                <div>
                  <h2 className="text-xl font-bold text-gray-900">
                    Bandeja de Revisión
                  </h2>

                  <p className="text-sm text-gray-500 mt-1">
                    Consulta el estado de cada sílabo y accede al detalle para
                    revisarlo.
                  </p>
                </div>
              </div>

              <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                <button
                  type="button"
                  onClick={handleExportSelectedSyllabi}
                  disabled={isExportingPdf || !hasSelectedSyllabi}
                  className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-gray-900 px-5 text-sm font-bold text-white shadow-sm transition-colors hover:bg-gray-800 disabled:cursor-not-allowed disabled:bg-gray-300 disabled:text-gray-500"
                >
                  {isExportingPdf ? (
                    <>
                      <Loader2 className="h-5 w-5 animate-spin" />
                      Exportando...
                    </>
                  ) : (
                    <>
                      <Download className="h-5 w-5" />
                      Exportar seleccionados ({selectedSyllabusKeys.length})
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={handleExportAllSyllabi}
                  disabled={isExportingPdf || syllabusList.length === 0}
                  className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-red-600 px-5 text-sm font-bold text-white shadow-sm transition-colors hover:bg-red-700 disabled:cursor-not-allowed disabled:bg-gray-300 disabled:text-gray-500"
                >
                  {isExportingPdf ? (
                    <>
                      <Loader2 className="h-5 w-5 animate-spin" />
                      Exportando...
                    </>
                  ) : (
                    <>
                      <Download className="h-5 w-5" />
                      Exportar todos
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>

          <div className="p-8">
            <section className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
              <div className="bg-blue-600 text-white rounded-xl p-5 shadow-md flex justify-between items-center">
                <div>
                  <p className="text-sm font-medium opacity-90">Total</p>

                  <h2 className="text-3xl font-bold mt-1">
                    {syllabusList.length}
                  </h2>
                </div>

                <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center">
                  <FileText size={26} />
                </div>
              </div>

              <div className="bg-green-600 text-white rounded-xl p-5 shadow-md flex justify-between items-center">
                <div>
                  <p className="text-sm font-medium opacity-90">Validados</p>

                  <h2 className="text-3xl font-bold mt-1">{totalValidado}</h2>
                </div>

                <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center">
                  <CheckCircle size={26} />
                </div>
              </div>

              <div className="bg-yellow-500 text-white rounded-xl p-5 shadow-md flex justify-between items-center">
                <div>
                  <p className="text-sm font-medium opacity-90">En proceso</p>

                  <h2 className="text-3xl font-bold mt-1">
                    {totalEnProceso}
                  </h2>
                </div>

                <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center">
                  <Clock size={26} />
                </div>
              </div>

              <div className="bg-red-600 text-white rounded-xl p-5 shadow-md flex justify-between items-center">
                <div>
                  <p className="text-sm font-medium opacity-90">Pendientes</p>

                  <h2 className="text-3xl font-bold mt-1">
                    {totalPendiente}
                  </h2>
                </div>

                <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center">
                  <XCircle size={26} />
                </div>
              </div>
            </section>

            <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
              <div className="relative flex-1">
                <Search
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
                  size={20}
                />

                <input
                  type="text"
                  placeholder="Buscar por curso, código o docente..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full h-12 pl-12 pr-4 bg-gray-50 border border-gray-200 rounded-xl shadow-sm text-sm text-gray-700 placeholder:text-gray-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                />
              </div>

              <div className="rounded-xl bg-gray-100 px-4 py-3 text-sm font-semibold text-gray-600">
                Seleccionados: {selectedSyllabusKeys.length}
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

                {(Object.keys(statusConfig) as SyllabusStatus[]).map((key) => {
                  const cfg = statusConfig[key];

                  const count = syllabusList.filter(
                    (syllabus) => normalizeStatus(syllabus?.status) === key,
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
                })}
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-gray-100 shadow-md overflow-hidden">
              <div className="overflow-hidden">
                <table className="w-full table-fixed text-sm">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-200 text-xs uppercase tracking-wide text-gray-700">
                      <th className="px-4 py-4 text-center font-bold w-[6%]">
                        <button
                          type="button"
                          onClick={toggleSelectVisible}
                          disabled={filteredSyllabi.length === 0}
                          className="inline-flex items-center justify-center text-gray-600 hover:text-red-600 disabled:cursor-not-allowed disabled:text-gray-300"
                          title={
                            allVisibleSelected
                              ? "Quitar selección visible"
                              : "Seleccionar visibles"
                          }
                        >
                          {allVisibleSelected ? (
                            <CheckSquare size={18} />
                          ) : (
                            <Square size={18} />
                          )}
                        </button>
                      </th>

                      <th className="px-4 py-4 text-left font-bold w-[12%]">
                        Código
                      </th>

                      <th className="px-4 py-4 text-left font-bold w-[26%]">
                        Curso
                      </th>

                      <th className="px-4 py-4 text-left font-bold w-[22%]">
                        Docente
                      </th>

                      <th className="px-4 py-4 text-left font-bold w-[13%]">
                        Enviado
                      </th>

                      <th className="px-4 py-4 text-left font-bold w-[15%]">
                        Estado
                      </th>

                      <th className="px-4 py-4 text-center font-bold w-[12%]">
                        Acción
                      </th>
                    </tr>
                  </thead>

                  <tbody>
                    {filteredSyllabi.map((syllabus, index) => {
                      const normalizedStatus = normalizeStatus(syllabus.status);
                      const cfg = statusConfig[normalizedStatus];
                      const rowKey = getSyllabusKey(syllabus, index);
                      const isSelected =
                        selectedSyllabusKeys.includes(rowKey);

                      return (
                        <tr
                          key={rowKey}
                          className={`border-b border-gray-100 last:border-b-0 transition-colors ${
                            isSelected ? "bg-red-50/40" : "hover:bg-gray-50"
                          }`}
                        >
                          <td className="px-4 py-5 text-center">
                            <button
                              type="button"
                              onClick={() =>
                                toggleSyllabusSelection(syllabus, index)
                              }
                              className={`inline-flex h-8 w-8 items-center justify-center rounded-lg transition-colors ${
                                isSelected
                                  ? "bg-red-600 text-white hover:bg-red-700"
                                  : "bg-gray-50 text-gray-500 hover:bg-red-50 hover:text-red-600"
                              }`}
                              title={
                                isSelected
                                  ? "Quitar de exportación"
                                  : "Seleccionar para exportar"
                              }
                            >
                              {isSelected ? (
                                <CheckSquare size={16} />
                              ) : (
                                <Square size={16} />
                              )}
                            </button>
                          </td>

                          <td className="px-4 py-5 font-semibold text-gray-800">
                            {syllabus.courseCode || "N/A"}
                          </td>

                          <td className="px-4 py-5">
                            <div className="line-clamp-2 font-bold text-gray-900">
                              {syllabus.courseName || "Sin nombre"}
                            </div>
                          </td>

                          <td className="px-4 py-5 text-gray-700">
                            <div className="line-clamp-1">
                              {syllabus.teacherName || "No asignado"}
                            </div>
                          </td>

                          <td className="px-4 py-5 text-gray-700">
                            {syllabus.submittedDate
                              ? new Date(
                                  syllabus.submittedDate,
                                ).toLocaleDateString()
                              : "N/A"}
                          </td>

                          <td className="px-4 py-5">
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

                          <td className="px-4 py-5">
                            <div className="flex items-center justify-center">
                              <button
                                type="button"
                                onClick={() => handleReviewSyllabus(syllabus)}
                                className="w-9 h-9 flex items-center justify-center text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-xl transition-colors"
                                title="Revisar sílabo"
                              >
                                <Eye size={18} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {filteredSyllabi.length === 0 && (
                <div className="text-center py-12">
                  <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <Search className="text-gray-400" size={30} />
                  </div>

                  <p className="text-gray-500">
                    No se encontraron sílabos que coincidan con tu búsqueda.
                  </p>
                </div>
              )}
            </div>

            <p className="mt-4 text-xs text-gray-500">
              Selecciona uno o más sílabos para exportarlos, o usa la opción de
              exportar todos.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}