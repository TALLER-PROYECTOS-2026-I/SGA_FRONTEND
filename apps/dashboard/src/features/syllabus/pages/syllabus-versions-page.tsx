import { useEffect, useMemo, useState } from "react";
import { Navigate } from "react-router-dom";
import { Download, History, Loader2, RefreshCcw, Search } from "lucide-react";
import { getRoleName } from "../../../common/constants/roles";
import { useSession } from "../../auth/hooks/use-session";
import { DownloadSyllabusCycleModal } from "../components/download-syllabus-cycle-modal";
import { SyllabusVersionPanel } from "../components/syllabus-version-panel";
import { SyllabusVersionReadonly } from "../components/syllabus-version-readonly";
import { SyllabusVersionsCycleList } from "../components/syllabus-versions-cycle-list";
import {
  useSyllabusVersionSnapshot,
  useSyllabusVersions,
  useSyllabusVersionsSummary,
  type SyllabusVersionsFilters,
  type VersionedSyllabusCourse,
} from "../hooks/syllabus-versions-query";

export default function SyllabusVersionsPage() {
  const { user, isLoading: isSessionLoading } = useSession();
  const [periodo, setPeriodo] = useState("");
  const [ciclo, setCiclo] = useState("");
  const [appliedFilters, setAppliedFilters] =
    useState<SyllabusVersionsFilters>({});
  const [selectedCourse, setSelectedCourse] =
    useState<VersionedSyllabusCourse | null>(null);
  const [selectedVersionId, setSelectedVersionId] = useState<number | null>(
    null,
  );
  const [isDownloadModalOpen, setIsDownloadModalOpen] = useState(false);

  const roleName = getRoleName(user?.role);
  const canAccess = roleName === "director_escuela";

  const {
    data,
    isLoading: isSummaryLoading,
    isError: isSummaryError,
    error: summaryError,
    refetch,
  } = useSyllabusVersionsSummary(appliedFilters);

  const { data: versions = [], isLoading: isVersionsLoading } =
    useSyllabusVersions(selectedCourse?.syllabusId);

  const { data: selectedVersion, isLoading: isSnapshotLoading } =
    useSyllabusVersionSnapshot(selectedCourse?.syllabusId, selectedVersionId);

  const cycles = data?.ciclos ?? [];
  const totalCourses = data?.items.length ?? 0;

  const totalCoursesWithVersions = useMemo(
    () =>
      (data?.items ?? []).filter((course) => course.versionsCount > 0).length,
    [data?.items],
  );

  const totalVersions = useMemo(
    () =>
      (data?.items ?? []).reduce(
        (total, course) => total + course.versionsCount,
        0,
      ),
    [data?.items],
  );

  const defaultDownloadPeriodo =
    periodo.trim() || appliedFilters.periodo || "2026-I";

  useEffect(() => {
    setSelectedVersionId(null);
  }, [selectedCourse?.syllabusId]);

  if (!isSessionLoading && !canAccess) {
    return <Navigate to="/" replace />;
  }

  const handleApplyFilters = () => {
    setAppliedFilters({
      periodo: periodo.trim() || undefined,
      ciclo: ciclo.trim() || undefined,
    });

    setSelectedCourse(null);
    setSelectedVersionId(null);
  };

  const handleClearFilters = () => {
    setPeriodo("");
    setCiclo("");
    setAppliedFilters({});
    setSelectedCourse(null);
    setSelectedVersionId(null);
  };

  const handleCloseReadonly = () => {
    setSelectedVersionId(null);
  };

  if (isSessionLoading) {
    return (
      <div className="flex items-center gap-2 rounded-2xl border border-blue-100 bg-blue-50 px-4 py-3 text-sm text-blue-700">
        <Loader2 size={18} className="animate-spin" />
        Validando acceso...
      </div>
    );
  }

  return (
    <div className="min-w-0 max-w-full space-y-6 overflow-x-hidden">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
        <div className="min-w-0">
          <p className="text-sm font-semibold text-red-700">HU23 / HU26</p>

          <h1 className="break-words text-2xl font-bold text-gray-900">
            Versiones de Sílabos
          </h1>

          <p className="mt-1 text-sm text-gray-500">
            Consulta el historial de modificación guardado por curso y descarga
            los sílabos actuales por ciclo académico.
          </p>
        </div>

        <div className="flex flex-col gap-3 xl:items-end">
          <button
            type="button"
            onClick={() => setIsDownloadModalOpen(true)}
            className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-red-600 px-5 text-sm font-black text-white shadow-md transition hover:bg-red-700"
          >
            <Download size={17} />
            Descargar
          </button>

          <div className="grid grid-cols-1 gap-3 sm:w-[480px] sm:grid-cols-3">
            <div className="rounded-xl border border-gray-100 bg-white px-4 py-3 shadow-sm">
              <p className="text-xs font-bold uppercase text-gray-400">
                Cursos
              </p>
              <p className="text-2xl font-bold text-gray-900">
                {totalCourses}
              </p>
            </div>

            <div className="rounded-xl border border-gray-100 bg-white px-4 py-3 shadow-sm">
              <p className="text-xs font-bold uppercase text-gray-400">
                Con historial
              </p>
              <p className="text-2xl font-bold text-gray-900">
                {totalCoursesWithVersions}
              </p>
            </div>

            <div className="rounded-xl border border-gray-100 bg-white px-4 py-3 shadow-sm">
              <p className="text-xs font-bold uppercase text-gray-400">
                Versiones
              </p>
              <p className="text-2xl font-bold text-gray-900">
                {totalVersions}
              </p>
            </div>
          </div>
        </div>
      </div>

      <section className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-md">
        <div className="flex items-center gap-3 border-b border-gray-100 bg-gray-50 px-5 py-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-600 text-white">
            <Search size={19} />
          </div>

          <h2 className="font-bold text-gray-900">Filtros</h2>
        </div>

        <div className="grid grid-cols-1 gap-4 p-5 md:grid-cols-[1fr_180px_auto_auto] md:items-end">
          <div>
            <label className="mb-2 block text-sm font-bold text-gray-900">
              Periodo
            </label>

            <input
              value={periodo}
              onChange={(event) => setPeriodo(event.target.value)}
              className="h-11 w-full rounded-xl border border-gray-200 bg-gray-50 px-3 text-sm outline-none focus:border-red-500 focus:ring-2 focus:ring-red-100"
              placeholder="2026-I"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-bold text-gray-900">
              Ciclo
            </label>

            <input
              value={ciclo}
              onChange={(event) => setCiclo(event.target.value)}
              className="h-11 w-full rounded-xl border border-gray-200 bg-gray-50 px-3 text-sm outline-none focus:border-red-500 focus:ring-2 focus:ring-red-100"
              placeholder="8"
            />
          </div>

          <button
            type="button"
            onClick={handleApplyFilters}
            className="flex h-11 items-center justify-center gap-2 rounded-xl bg-red-600 px-4 text-sm font-bold text-white hover:bg-red-700"
          >
            <Search size={17} />
            Buscar
          </button>

          <button
            type="button"
            onClick={handleClearFilters}
            className="flex h-11 items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white px-4 text-sm font-bold text-gray-700 hover:bg-gray-50"
          >
            <RefreshCcw size={17} />
            Limpiar
          </button>
        </div>
      </section>

      {isSummaryLoading && (
        <div className="flex items-center gap-2 rounded-2xl border border-blue-100 bg-blue-50 px-4 py-3 text-sm text-blue-700">
          <Loader2 size={18} className="animate-spin" />
          Cargando versiones...
        </div>
      )}

      {isSummaryError && (
        <div className="flex items-center justify-between gap-4 rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700">
          <span>
            {summaryError instanceof Error
              ? summaryError.message
              : "No se pudieron cargar las versiones."}
          </span>

          <button
            type="button"
            onClick={() => void refetch()}
            className="h-9 rounded-xl bg-red-600 px-3 text-xs font-bold text-white"
          >
            Reintentar
          </button>
        </div>
      )}

      <div className="grid min-w-0 grid-cols-1 gap-6 2xl:grid-cols-[minmax(0,1fr)_420px]">
        <div className="min-w-0 space-y-6">
          {!isSummaryLoading && (
            <SyllabusVersionsCycleList
              cycles={cycles}
              selectedSyllabusId={selectedCourse?.syllabusId}
              onSelectCourse={setSelectedCourse}
            />
          )}
        </div>

        <aside className="min-w-0 space-y-6">
          <SyllabusVersionPanel
            course={selectedCourse}
            versions={versions}
            selectedVersionId={selectedVersionId}
            isLoading={isVersionsLoading}
            onSelectVersion={(version) =>
              setSelectedVersionId(version.versionId)
            }
          />

          <section className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600 text-white">
                <History size={19} />
              </div>

              <div className="min-w-0">
                <h2 className="font-bold text-gray-900">Vista seleccionada</h2>

                <p className="truncate text-sm text-gray-500">
                  {selectedVersionId
                    ? `Versión ${
                        versions.find(
                          (item) => item.versionId === selectedVersionId,
                        )?.versionNumber ?? selectedVersionId
                      }`
                    : "Sin versión seleccionada"}
                </p>
              </div>
            </div>
          </section>
        </aside>
      </div>

      {(selectedVersion || isSnapshotLoading) && (
        <SyllabusVersionReadonly
          version={selectedVersion}
          isLoading={isSnapshotLoading}
          onClose={handleCloseReadonly}
        />
      )}

      <DownloadSyllabusCycleModal
        open={isDownloadModalOpen}
        onClose={() => setIsDownloadModalOpen(false)}
        defaultPeriodo={defaultDownloadPeriodo}
      />
    </div>
  );
}