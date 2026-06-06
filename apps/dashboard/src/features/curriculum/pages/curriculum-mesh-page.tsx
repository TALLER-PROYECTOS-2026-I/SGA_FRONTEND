import { useMemo, useState } from "react";
import {
  BookOpen,
  ChevronDown,
  ChevronRight,
  Edit3,
  FileDown,
  Loader2,
  Plus,
  RefreshCw,
  Save,
  Table2,
} from "lucide-react";
import { toast } from "sonner";
import { EditCurriculumCourseModal } from "../components/edit-curriculum-course-modal";
import {
  useCreateCurriculumCourse,
  useCurriculumMesh,
  useCurriculumPeriods,
  useDeleteCurriculumCourse,
  useUpdateCurriculumCourse,
  type CurriculumCourse,
  type CurriculumCourseCreate,
  type CurriculumCourseUpdate,
} from "../hooks/curriculum-query";
import { buildCurriculumPrintableHtml } from "../utils/curriculum-printable-board";
import { downloadCurriculumPdf } from "../utils/curriculum-pdf-download";

const DEFAULT_PERIOD = "2026-I";

function formatCycleTitle(cycleName: string) {
  return cycleName.replace("Ciclo", "").trim() ? cycleName : "Ciclo";
}

function CourseListItem({
  course,
  editMode,
  onClick,
}: {
  course: CurriculumCourse;
  editMode: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={!editMode}
      className={`w-full rounded-2xl border bg-white p-4 text-left shadow-sm transition ${
        editMode
          ? "cursor-pointer hover:-translate-y-0.5 hover:border-red-200 hover:shadow-md"
          : "cursor-default"
      }`}
    >
      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-lg bg-gray-100 px-2 py-1 text-xs font-bold text-gray-600">
              {course.codigo}
            </span>

            <span className="rounded-lg bg-red-50 px-2 py-1 text-xs font-bold text-red-600">
              {course.creditos} cr.
            </span>

            <span className="rounded-lg bg-blue-50 px-2 py-1 text-xs font-bold text-blue-700">
              {course.modalidad}
            </span>

            {course.tipoCurso && (
              <span className="rounded-lg bg-green-50 px-2 py-1 text-xs font-bold text-green-700">
                {course.tipoCurso}
              </span>
            )}
          </div>

          <h3 className="mt-3 text-base font-black text-gray-900">
            {course.nombre}
          </h3>

          {course.areaCurricular && (
            <p className="mt-1 text-sm font-semibold text-gray-500">
              Área: {course.areaCurricular}
            </p>
          )}

          {course.prerrequisitos.length > 0 && (
            <p className="mt-2 text-sm text-gray-500">
              <span className="font-bold text-gray-700">Requisitos:</span>{" "}
              {course.prerrequisitos.join(", ")}
            </p>
          )}
        </div>

        {editMode && (
          <span className="inline-flex items-center gap-1 rounded-xl bg-red-50 px-3 py-2 text-xs font-bold text-red-700">
            <Edit3 size={14} />
            Editar
          </span>
        )}
      </div>
    </button>
  );
}

export default function CurriculumMeshPage() {
  const [selectedPeriod, setSelectedPeriod] = useState(DEFAULT_PERIOD);
  const [editMode, setEditMode] = useState(false);
  const [expandedCycles, setExpandedCycles] = useState<number[]>([]);
  const [expandedElectives, setExpandedElectives] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState<CurriculumCourse | null>(
    null,
  );
  const [modalMode, setModalMode] = useState<"create" | "edit">("edit");
  const [defaultCycle, setDefaultCycle] = useState<number | null>(null);
  const [isDownloadingPdf, setIsDownloadingPdf] = useState(false);

  const { data: periods = [], isLoading: isLoadingPeriods } =
    useCurriculumPeriods();

  const {
    data: mesh,
    isLoading: isLoadingMesh,
    isError,
    refetch,
  } = useCurriculumMesh(selectedPeriod);

  const createCourseMutation = useCreateCurriculumCourse(selectedPeriod);
  const updateCourseMutation = useUpdateCurriculumCourse(selectedPeriod);
  const deleteCourseMutation = useDeleteCurriculumCourse(selectedPeriod);

  const periodOptions = useMemo(() => {
    const values = new Set([DEFAULT_PERIOD, ...periods]);
    return Array.from(values);
  }, [periods]);

  const totalCourses = useMemo(() => {
    if (!mesh) return 0;

    return (
      mesh.ciclos.reduce((total, ciclo) => total + ciclo.cursos.length, 0) +
      mesh.electivos.length
    );
  }, [mesh]);

  const cyclesWithCourses = useMemo(() => {
    return mesh?.ciclos.filter((cycle) => cycle.cursos.length > 0) ?? [];
  }, [mesh]);

  const toggleCycle = (cycle: number) => {
    setExpandedCycles((current) =>
      current.includes(cycle)
        ? current.filter((item) => item !== cycle)
        : [...current, cycle],
    );
  };

  const expandAllCycles = () => {
    setExpandedCycles(mesh?.ciclos.map((cycle) => cycle.ciclo) ?? []);
    setExpandedElectives(true);
  };

  const collapseAllCycles = () => {
    setExpandedCycles([]);
    setExpandedElectives(false);
  };

  const handleGeneratePrintableMesh = () => {
    if (!mesh) return;

    const printableWindow = window.open("", "_blank", "width=1600,height=950");

    if (!printableWindow) {
      toast.error("No se pudo abrir la vista imprimible.");
      return;
    }

    printableWindow.document.write(
      buildCurriculumPrintableHtml(mesh, selectedPeriod),
    );

    printableWindow.document.close();
  };

  const handleDownloadPdf = async () => {
    if (!mesh) return;

    try {
      setIsDownloadingPdf(true);
      await downloadCurriculumPdf(mesh, selectedPeriod);
      toast.success("PDF descargado correctamente");
    } catch (error) {
      console.error(error);
      toast.error("No se pudo descargar el PDF");
    } finally {
      setIsDownloadingPdf(false);
    }
  };

  const handleOpenCreateCourse = (cycle: number | null) => {
    setModalMode("create");
    setDefaultCycle(cycle);
    setSelectedCourse(null);
  };

  const handleOpenEditCourse = (course: CurriculumCourse) => {
    setModalMode("edit");
    setDefaultCycle(course.ciclo);
    setSelectedCourse(course);
  };

  const handleCloseModal = () => {
    setSelectedCourse(null);
    setModalMode("edit");
    setDefaultCycle(null);
  };

  const handleSaveCourse = async (
    payload: CurriculumCourseCreate | CurriculumCourseUpdate,
  ) => {
    if (modalMode === "create") {
      await createCourseMutation.mutateAsync({
        ...(payload as CurriculumCourseCreate),
        periodo: selectedPeriod,
      });

      toast.success("Curso creado correctamente");
      handleCloseModal();
      return;
    }

    if (!selectedCourse) return;

    await updateCourseMutation.mutateAsync({
      courseId: selectedCourse.id,
      payload: payload as CurriculumCourseUpdate,
    });

    toast.success("Curso actualizado correctamente");
    handleCloseModal();
  };

  const handleDeleteCourse = async (course: CurriculumCourse) => {
    await deleteCourseMutation.mutateAsync(course.id);

    toast.success("Curso retirado de la malla");
    handleCloseModal();
  };

  const isSaving =
    createCourseMutation.isPending || updateCourseMutation.isPending;

  return (
    <div className="min-h-[calc(100vh-72px)] bg-gray-50 px-6 py-8">
      <div className="mx-auto max-w-7xl">
        <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h1 className="text-3xl font-black text-gray-900">
              Malla Curricular
            </h1>

            <p className="mt-1 text-sm text-gray-500">
              Visualiza los cursos por ciclo, actualiza la información y genera
              el cuadro de malla curricular.
            </p>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <select
              value={selectedPeriod}
              onChange={(event) => {
                setSelectedPeriod(event.target.value);
                setExpandedCycles([]);
                setExpandedElectives(false);
              }}
              disabled={isLoadingPeriods}
              className="h-11 rounded-xl border border-gray-200 bg-white px-4 text-sm font-semibold text-gray-700 shadow-sm outline-none focus:border-red-400 focus:ring-2 focus:ring-red-100"
            >
              {periodOptions.map((period) => (
                <option key={period} value={period}>
                  {period}
                </option>
              ))}
            </select>

            <button
              type="button"
              onClick={() => void refetch()}
              className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white px-4 text-sm font-bold text-gray-700 shadow-sm hover:bg-gray-50"
            >
              <RefreshCw size={17} />
              Actualizar
            </button>

            <button
              type="button"
              onClick={handleGeneratePrintableMesh}
              disabled={!mesh || isLoadingMesh}
              className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-gray-900 px-4 text-sm font-bold text-white shadow-sm hover:bg-black disabled:cursor-not-allowed disabled:bg-gray-300"
            >
              <Table2 size={17} />
              Generar cuadro
            </button>

            <button
              type="button"
              onClick={handleDownloadPdf}
              disabled={!mesh || isLoadingMesh || isDownloadingPdf}
              className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-red-200 bg-white px-4 text-sm font-bold text-red-600 shadow-sm hover:bg-red-50 disabled:cursor-not-allowed disabled:border-gray-200 disabled:bg-gray-100 disabled:text-gray-400"
            >
              {isDownloadingPdf ? (
                <Loader2 size={17} className="animate-spin" />
              ) : (
                <FileDown size={17} />
              )}
              {isDownloadingPdf ? "Generando..." : "Descargar PDF"}
            </button>

            <button
              type="button"
              onClick={() => setEditMode((value) => !value)}
              className={`inline-flex h-11 items-center justify-center gap-2 rounded-xl px-4 text-sm font-bold shadow-sm ${
                editMode
                  ? "bg-red-600 text-white hover:bg-red-700"
                  : "border border-gray-200 bg-white text-gray-700 hover:bg-gray-50"
              }`}
            >
              <Edit3 size={17} />
              {editMode ? "Edición activa" : "Modo edición"}
            </button>
          </div>
        </div>

        <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-4">
          <div className="rounded-2xl bg-blue-600 p-5 text-white shadow-md">
            <p className="text-sm font-bold opacity-90">Periodo</p>
            <p className="mt-2 text-3xl font-black">{selectedPeriod}</p>
          </div>

          <div className="rounded-2xl bg-green-600 p-5 text-white shadow-md">
            <p className="text-sm font-bold opacity-90">Cursos</p>
            <p className="mt-2 text-3xl font-black">{totalCourses}</p>
          </div>

          <div className="rounded-2xl bg-yellow-500 p-5 text-white shadow-md">
            <p className="text-sm font-bold opacity-90">Ciclos</p>
            <p className="mt-2 text-3xl font-black">10</p>
          </div>

          <div className="rounded-2xl bg-red-600 p-5 text-white shadow-md">
            <p className="text-sm font-bold opacity-90">Estado</p>
            <p className="mt-2 text-xl font-black">
              {editMode ? "Editable" : "Lectura"}
            </p>
          </div>
        </div>

        <div className="mb-6 overflow-hidden rounded-3xl border border-gray-100 bg-white shadow-xl">
          <div className="flex flex-col gap-4 border-b border-gray-100 bg-gradient-to-r from-red-50 to-white px-6 py-5 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-red-600 text-white shadow-md">
                <BookOpen size={24} />
              </div>

              <div>
                <h2 className="text-xl font-black text-gray-900">
                  Plan de estudios por ciclos
                </h2>

                <p className="text-sm text-gray-500">
                  Vista ordenada para revisar y modificar cursos antes de
                  generar el cuadro curricular.
                </p>
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={expandAllCycles}
                disabled={!mesh}
                className="rounded-xl border border-gray-200 bg-white px-3 py-2 text-xs font-bold text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Expandir ciclos
              </button>

              <button
                type="button"
                onClick={collapseAllCycles}
                disabled={!mesh}
                className="rounded-xl border border-gray-200 bg-white px-3 py-2 text-xs font-bold text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Contraer ciclos
              </button>
            </div>
          </div>

          {isLoadingMesh && (
            <div className="m-6 flex items-center gap-2 rounded-2xl border border-blue-100 bg-blue-50 px-4 py-3 text-sm font-semibold text-blue-700">
              <Loader2 size={18} className="animate-spin" />
              Cargando malla curricular...
            </div>
          )}

          {isError && (
            <div className="m-6 rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
              No se pudo cargar la malla curricular.
            </div>
          )}

          {mesh && (
            <div className="space-y-4 p-6">
              {cyclesWithCourses.map((cycle) => {
                const isExpanded = expandedCycles.includes(cycle.ciclo);

                return (
                  <section
                    key={cycle.ciclo}
                    className="rounded-3xl border border-gray-100 bg-gray-50 p-5"
                  >
                    <button
                      type="button"
                      onClick={() => toggleCycle(cycle.ciclo)}
                      className="flex w-full flex-col gap-2 text-left sm:flex-row sm:items-center sm:justify-between"
                    >
                      <div>
                        <p className="text-xs font-bold uppercase text-red-600">
                          {formatCycleTitle(cycle.nombre)}
                        </p>

                        <h3 className="flex items-center gap-2 text-xl font-black text-gray-900">
                          {isExpanded ? (
                            <ChevronDown size={22} />
                          ) : (
                            <ChevronRight size={22} />
                          )}
                          {cycle.nombre}
                        </h3>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className="rounded-xl bg-white px-4 py-2 text-sm font-bold text-gray-700 shadow-sm">
                          {cycle.cursos.length} cursos
                        </span>

                        {editMode && (
                          <span
                            role="button"
                            tabIndex={0}
                            onClick={(event) => {
                              event.stopPropagation();
                              handleOpenCreateCourse(cycle.ciclo);
                            }}
                            onKeyDown={(event) => {
                              if (event.key === "Enter" || event.key === " ") {
                                event.stopPropagation();
                                handleOpenCreateCourse(cycle.ciclo);
                              }
                            }}
                            className="inline-flex items-center gap-1 rounded-xl bg-red-600 px-3 py-2 text-xs font-bold text-white shadow-sm hover:bg-red-700"
                          >
                            <Plus size={14} />
                            Agregar
                          </span>
                        )}
                      </div>
                    </button>

                    {isExpanded && (
                      <div className="mt-4 grid grid-cols-1 gap-3 lg:grid-cols-2">
                        {cycle.cursos.map((course) => (
                          <CourseListItem
                            key={course.id}
                            course={course}
                            editMode={editMode}
                            onClick={() => handleOpenEditCourse(course)}
                          />
                        ))}
                      </div>
                    )}
                  </section>
                );
              })}

              {mesh.electivos.length > 0 && (
                <section className="rounded-3xl border border-purple-100 bg-purple-50 p-5">
                  <button
                    type="button"
                    onClick={() => setExpandedElectives((value) => !value)}
                    className="flex w-full flex-col gap-2 text-left sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div>
                      <p className="text-xs font-bold uppercase text-purple-700">
                        Electivas
                      </p>

                      <h3 className="flex items-center gap-2 text-xl font-black text-purple-900">
                        {expandedElectives ? (
                          <ChevronDown size={22} />
                        ) : (
                          <ChevronRight size={22} />
                        )}
                        Electivas de Especialidad y Electivas Libres
                      </h3>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="rounded-xl bg-white px-4 py-2 text-sm font-bold text-purple-700 shadow-sm">
                        {mesh.electivos.length} cursos
                      </span>

                      {editMode && (
                        <span
                          role="button"
                          tabIndex={0}
                          onClick={(event) => {
                            event.stopPropagation();
                            handleOpenCreateCourse(null);
                          }}
                          onKeyDown={(event) => {
                            if (event.key === "Enter" || event.key === " ") {
                              event.stopPropagation();
                              handleOpenCreateCourse(null);
                            }
                          }}
                          className="inline-flex items-center gap-1 rounded-xl bg-purple-700 px-3 py-2 text-xs font-bold text-white shadow-sm hover:bg-purple-800"
                        >
                          <Plus size={14} />
                          Agregar
                        </span>
                      )}
                    </div>
                  </button>

                  {expandedElectives && (
                    <div className="mt-4 grid grid-cols-1 gap-3 lg:grid-cols-2">
                      {mesh.electivos.map((course) => (
                        <CourseListItem
                          key={course.id}
                          course={course}
                          editMode={editMode}
                          onClick={() => handleOpenEditCourse(course)}
                        />
                      ))}
                    </div>
                  )}
                </section>
              )}
            </div>
          )}
        </div>

        <div className="rounded-2xl border border-blue-100 bg-blue-50 p-5">
          <div className="flex items-start gap-3">
            <Save className="mt-0.5 text-blue-700" size={20} />

            <div>
              <p className="font-bold text-blue-900">Indicaciones</p>

              <p className="mt-1 text-sm text-blue-700">
                Activa el modo edición para modificar, agregar o quitar cursos.
                Usa “Generar cuadro” para abrir una vista horizontal lista para
                imprimir o usa “Descargar PDF” para obtener el documento
                directamente.
              </p>
            </div>
          </div>
        </div>
      </div>

      <EditCurriculumCourseModal
        open={modalMode === "create" || Boolean(selectedCourse)}
        mode={modalMode}
        defaultPeriod={selectedPeriod}
        defaultCycle={defaultCycle}
        course={selectedCourse}
        isSaving={isSaving}
        isDeleting={deleteCourseMutation.isPending}
        onClose={handleCloseModal}
        onSave={handleSaveCourse}
        onDelete={handleDeleteCourse}
      />
    </div>
  );
}
