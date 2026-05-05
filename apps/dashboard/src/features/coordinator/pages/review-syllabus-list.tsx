import { useEffect, useMemo, useState } from "react";
import {
  CalendarDays,
  CheckCircle2,
  Eye,
  FileSearch,
  Filter,
  Search,
} from "lucide-react";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  useSyllabusInReview,
  type SyllabusReview,
} from "../hooks/syllabus-review-query";

function formatDate(value: string) {
  if (!value) return "N/A";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "N/A";
  }

  return date.toLocaleDateString("es-PE", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
}

function formatStatus(status: string) {
  if (status === "EN_REVISIÓN") return "EN REVISIÓN";
  return status.replaceAll("_", " ");
}

function getInitials(name: string) {
  if (!name) return "ND";

  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
}

export default function ReviewSyllabusList() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [searchTerm, setSearchTerm] = useState("");
  const [selectedPeriod, setSelectedPeriod] = useState("ALL");
  const [selectedDate, setSelectedDate] = useState("");

  const {
    data: syllabusListFromAPI,
    isLoading,
    isError,
    error,
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
          newSearchParams.toString() ? `?${newSearchParams.toString()}` : ""
        }`,
      );
    }
  }, [searchParams, refetch]);

  const syllabusList = useMemo(() => {
    return Array.isArray(syllabusListFromAPI) ? syllabusListFromAPI : [];
  }, [syllabusListFromAPI]);

  const periods = useMemo(() => {
    const uniquePeriods = new Set(
      syllabusList
        .map((syllabus) => syllabus.academicPeriod)
        .filter(
          (period) => period && period !== "N/A" && period !== "No informado",
        ),
    );

    return Array.from(uniquePeriods);
  }, [syllabusList]);

  const filteredSyllabi = useMemo(() => {
    const searchLower = searchTerm.trim().toLowerCase();

    return syllabusList.filter((syllabus) => {
      const courseName = syllabus.courseName?.toLowerCase() || "";
      const courseCode = syllabus.courseCode?.toLowerCase() || "";
      const teacherName = syllabus.teacherName?.toLowerCase() || "";
      const academicPeriod = syllabus.academicPeriod?.toLowerCase() || "";
      const submittedDate = syllabus.submittedDate
        ? new Date(syllabus.submittedDate).toISOString().slice(0, 10)
        : "";

      const matchesSearch =
        !searchLower ||
        courseName.includes(searchLower) ||
        courseCode.includes(searchLower) ||
        teacherName.includes(searchLower) ||
        academicPeriod.includes(searchLower);

      const matchesPeriod =
        selectedPeriod === "ALL" || syllabus.academicPeriod === selectedPeriod;

      const matchesDate = !selectedDate || submittedDate === selectedDate;

      return matchesSearch && matchesPeriod && matchesDate;
    });
  }, [syllabusList, searchTerm, selectedPeriod, selectedDate]);

  const handleReviewSyllabus = (syllabus: SyllabusReview) => {
    const routeId =
      syllabus.id && String(syllabus.id).trim() !== ""
        ? syllabus.id
        : String(syllabus.syllabusId || "");

    if (!routeId) return;

    const url = `/coordinator/review-syllabus/${routeId}?docenteId=${
      syllabus.docenteId
    }&syllabusId=${syllabus.syllabusId}&courseName=${encodeURIComponent(
      syllabus.courseName,
    )}&courseCode=${encodeURIComponent(
      syllabus.courseCode,
    )}&teacherName=${encodeURIComponent(syllabus.teacherName)}`;

    navigate(url);
  };

  const clearFilters = () => {
    setSearchTerm("");
    setSelectedPeriod("ALL");
    setSelectedDate("");
  };

  const hasFilters = searchTerm || selectedPeriod !== "ALL" || selectedDate;

  return (
    <div className="min-h-screen bg-[#f7f7f8] px-6 py-8">
      <div className="mx-auto w-full max-w-[1180px]">
        <section className="mb-6">
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-red-100 text-red-700 ring-1 ring-red-200">
              <FileSearch size={24} />
            </div>

            <div>
              <h1 className="text-3xl font-bold tracking-tight text-gray-950">
                Bandeja de Revisión Académica
              </h1>
              <p className="mt-1 text-sm text-gray-600">
                Consulta y revisa los sílabos enviados por los docentes.
              </p>

              <div className="mt-3 flex items-center gap-2 text-sm text-gray-600">
                <CheckCircle2 size={16} className="text-red-700" />
                <span>
                  {syllabusList.length} sílabos pendientes de revisión
                  académica.
                </span>
              </div>
            </div>
          </div>
        </section>

        <section className="mb-5">
          <div className="grid grid-cols-1 gap-3 rounded-xl border border-gray-200 bg-white p-4 shadow-sm md:grid-cols-[1fr_280px_280px_auto]">
            <div className="relative">
              <Search
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                size={18}
              />
              <input
                type="text"
                placeholder="Buscar por curso, código o docente..."
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                className="h-11 w-full rounded-lg border border-gray-300 bg-white py-2 pl-10 pr-4 text-sm text-gray-800 outline-none transition focus:border-red-600 focus:ring-2 focus:ring-red-100"
              />
            </div>

            <select
              value={selectedPeriod}
              onChange={(event) => setSelectedPeriod(event.target.value)}
              className="h-11 w-full rounded-lg border border-gray-300 bg-white px-3 text-sm text-gray-800 outline-none transition focus:border-red-600 focus:ring-2 focus:ring-red-100"
            >
              <option value="ALL">Todos los periodos</option>
              {periods.map((period) => (
                <option key={period} value={period}>
                  {period}
                </option>
              ))}
            </select>

            <div className="relative">
              <CalendarDays
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                size={18}
              />
              <input
                type="date"
                value={selectedDate}
                onChange={(event) => setSelectedDate(event.target.value)}
                className="h-11 w-full rounded-lg border border-gray-300 bg-white py-2 pl-10 pr-3 text-sm text-gray-800 outline-none transition focus:border-red-600 focus:ring-2 focus:ring-red-100"
              />
            </div>

            <button
              type="button"
              onClick={clearFilters}
              disabled={!hasFilters}
              className="inline-flex h-11 items-center justify-center gap-2 rounded-lg border border-gray-300 bg-white px-4 text-sm font-medium text-gray-700 transition hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Filter size={16} />
              Limpiar
            </button>
          </div>

          <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm text-gray-600">
              Mostrando{" "}
              <span className="font-semibold text-gray-900">
                {filteredSyllabi.length}
              </span>{" "}
              de{" "}
              <span className="font-semibold text-gray-900">
                {syllabusList.length}
              </span>{" "}
              sílabos en revisión.
            </p>
          </div>
        </section>

        {isLoading && (
          <div className="rounded-xl border border-gray-200 bg-white p-8 text-center text-sm text-gray-500 shadow-sm">
            Cargando sílabos enviados a revisión...
          </div>
        )}

        {isError && (
          <div className="mb-6 rounded-xl border border-red-200 bg-red-50 p-4">
            <p className="text-sm font-semibold text-red-700">
              No se pudieron cargar los sílabos en revisión.
            </p>
            <p className="mt-1 text-xs text-red-600">
              {error?.message || "Intenta nuevamente en unos minutos."}
            </p>
          </div>
        )}

        {!isLoading && filteredSyllabi.length === 0 && (
          <div className="rounded-xl border border-gray-200 bg-white py-12 text-center text-sm text-gray-500 shadow-sm">
            No se encontraron sílabos en revisión académica.
          </div>
        )}

        {filteredSyllabi.length > 0 && (
          <section className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
            <div className="border-b border-red-800 bg-red-700 px-5 py-4">
              <div className="flex flex-col gap-1 text-white">
                <h2 className="text-base font-semibold">
                  Sílabos en Revisión
                </h2>
                <p className="text-xs text-red-50">
                  {filteredSyllabi.length} sílabos requieren revisión académica.
                </p>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full min-w-[1050px] border-collapse">
                <thead className="bg-gray-50">
                  <tr className="text-left text-[11px] font-bold uppercase tracking-wide text-gray-600">
                    <th className="px-5 py-3">Curso / Código</th>
                    <th className="px-5 py-3">Docente responsable</th>
                    <th className="px-5 py-3">Periodo</th>
                    <th className="px-5 py-3">Estado</th>
                    <th className="px-5 py-3">Fecha de envío</th>
                    <th className="px-5 py-3 text-right">Acciones</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-gray-100">
                  {filteredSyllabi.map((syllabus) => (
                    <tr
                      key={`${syllabus.id}-${syllabus.syllabusId}`}
                      className="transition hover:bg-red-50/40"
                    >
                      <td className="px-5 py-4">
                        <p className="font-semibold text-gray-900">
                          {syllabus.courseName || "Sin nombre"}
                        </p>
                        <p className="mt-1 text-xs text-gray-500">
                          Código: {syllabus.courseCode || "N/A"}
                        </p>
                      </td>

                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-red-100 text-xs font-semibold text-red-700">
                            {getInitials(syllabus.teacherName)}
                          </div>
                          <p className="text-sm font-medium text-gray-800">
                            {syllabus.teacherName || "No asignado"}
                          </p>
                        </div>
                      </td>

                      <td className="px-5 py-4 text-sm text-gray-700">
                        {syllabus.academicPeriod || "No informado"}
                      </td>

                      <td className="px-5 py-4">
                        <span className="inline-flex items-center rounded-full bg-red-50 px-3 py-1 text-xs font-semibold text-red-700 ring-1 ring-red-200">
                          {formatStatus(syllabus.status)}
                        </span>
                      </td>

                      <td className="px-5 py-4">
                        <p className="text-sm font-medium text-gray-800">
                          {formatDate(syllabus.submittedDate)}
                        </p>
                      </td>

                      <td className="px-5 py-4 text-right">
                        <button
                          type="button"
                          onClick={() => handleReviewSyllabus(syllabus)}
                          className="inline-flex items-center justify-center gap-2 rounded-lg bg-red-700 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-red-800"
                        >
                          <Eye size={16} />
                          Revisar
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex items-center gap-2 border-t border-gray-100 bg-gray-50 px-5 py-3 text-xs text-gray-600">
              <CheckCircle2 size={15} className="text-red-700" />
              <span>
                {filteredSyllabi.length} sílabos mostrados. Pendientes de
                revisión académica.
              </span>
            </div>
          </section>
        )}
      </div>
    </div>
  );
} 