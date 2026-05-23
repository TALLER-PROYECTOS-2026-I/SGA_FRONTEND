import { useMemo, useState, type ReactNode } from "react";
import {
  BookOpen,
  CheckCircle,
  ChevronUp,
  Download,
  GraduationCap,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";
import type { Assignment } from "../../assignments/hooks/assignments-query";
import {
  useCurriculumContext,
  type CurriculumContextCourseRef,
  type CurriculumContextData,
} from "../../syllabus/hooks/curriculum-context-query";
import { downloadSyllabusPdf } from "../../syllabus/utils/syllabus-pdf-download";

type AssignedCourseCard = {
  syllabusId: number;
  cursoNombre: string;
  cursoCodigo: string;
  estado: string;
};

type RelatedCourseWithMeta = CurriculumContextCourseRef & {
  ciclo?: string | number | null;
  modalidad?: string | null;
  linea?: string | null;
};

function getStringField(item: unknown, keys: string[]) {
  if (!item || typeof item !== "object") return "";

  const record = item as Record<string, unknown>;
  for (const key of keys) {
    const value = record[key];
    if (value !== null && value !== undefined && String(value).trim()) {
      return String(value);
    }
  }

  return "";
}

function getNumberField(item: unknown, keys: string[]) {
  if (!item || typeof item !== "object") return 0;

  const record = item as Record<string, unknown>;
  for (const key of keys) {
    const value = Number(record[key]);
    if (Number.isFinite(value) && value > 0) {
      return value;
    }
  }

  return 0;
}

function normalizeAssignments(assignments: Assignment[]): AssignedCourseCard[] {
  return assignments
    .map((item) => ({
      syllabusId: getNumberField(item, ["syllabusId", "silaboId", "id"]),
      cursoNombre:
        getStringField(item, [
          "cursoNombre",
          "nombreAsignatura",
          "courseName",
          "asignatura",
        ]) || "Curso sin nombre",
      cursoCodigo: getStringField(item, [
        "cursoCodigo",
        "codigoAsignatura",
        "courseCode",
      ]),
      estado: getStringField(item, ["estadoRevision", "estado"]),
    }))
    .filter((item) => item.syllabusId > 0);
}

function formatStatus(value: string) {
  if (!value.trim()) return "";

  return value
    .replace(/_/g, " ")
    .toLowerCase()
    .replace(/(^|\s)\S/g, (letter) => letter.toUpperCase());
}

function CourseRelationCard({
  course,
  downloadingId,
  onDownload,
  showDownload = true,
}: {
  course: RelatedCourseWithMeta;
  downloadingId: number | null;
  onDownload: (course: RelatedCourseWithMeta) => void;
  showDownload?: boolean;
}) {
  const isDownloading = course.silaboId === downloadingId;
  const metadata = [
    course.ciclo != null ? `Ciclo ${course.ciclo}` : "",
    course.modalidad ?? course.linea ?? "",
  ].filter(Boolean);

  return (
    <div className="rounded-xl border border-gray-100 bg-white p-4 space-y-3 transition-all duration-200 hover:bg-gray-50">
      <p className="text-sm font-semibold text-gray-900">
        {course.nombreMalla}
      </p>

      {course.cursoCodigo ? (
        <p className="text-xs text-gray-500">Código: {course.cursoCodigo}</p>
      ) : null}

      {metadata.length > 0 ? (
        <p className="text-xs text-gray-500">{metadata.join(" · ")}</p>
      ) : null}

      {showDownload && course.disponible && course.silaboId ? (
        <button
          type="button"
          disabled={isDownloading}
          onClick={() => onDownload(course)}
          className="inline-flex items-center gap-1 rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-blue-700 disabled:opacity-60"
        >
          {isDownloading ? (
            <Loader2 size={14} className="animate-spin" />
          ) : (
            <Download size={14} />
          )}
          {isDownloading ? "Descargando..." : "Descargar sílabo"}
        </button>
      ) : showDownload ? (
        <span className="inline-flex items-center rounded-lg border border-amber-200 bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-800">
          Sílabo no disponible
        </span>
      ) : null}
    </div>
  );
}

function CurriculumColumn({
  title,
  emptyText,
  icon,
  tone,
  children,
}: {
  title: string;
  emptyText: string;
  icon: ReactNode;
  tone: "blue" | "indigo" | "green";
  children: ReactNode;
}) {
  const toneClasses = {
    blue: "bg-blue-50 text-blue-700",
    indigo: "bg-indigo-50 text-indigo-700",
    green: "bg-green-50 text-green-700",
  };

  return (
    <div className="min-h-[220px] rounded-2xl bg-white border border-gray-100 p-4">
      <div className="mb-3 flex items-center gap-2">
        <span
          className={`inline-flex h-8 w-8 items-center justify-center rounded-lg ${toneClasses[tone]}`}
        >
          {icon}
        </span>
        <p className="text-xs font-bold text-gray-500 uppercase">{title}</p>
      </div>
      {children || <p className="text-sm text-gray-400">{emptyText}</p>}
    </div>
  );
}

function CurriculumContextResult({
  context,
  selectedCourse,
  downloadingId,
  onDownload,
  onHide,
}: {
  context: CurriculumContextData;
  selectedCourse?: AssignedCourseCard;
  downloadingId: number | null;
  onDownload: (course: RelatedCourseWithMeta) => void;
  onHide: () => void;
}) {
  if (!context.hasCurriculumContext) {
    return (
      <div className="rounded-3xl border border-amber-200 bg-amber-50 p-5 text-sm text-amber-800 shadow-sm">
        {context.message ??
          "No hay contexto curricular registrado para este curso."}
      </div>
    );
  }

  const actualAsCourse: RelatedCourseWithMeta = {
    nombreMalla: context.actual.cursoNombre,
    cursoNombre: context.actual.cursoNombre,
    cursoCodigo: context.actual.cursoCodigo,
    silaboId: context.actual.silaboId,
    disponible: context.actual.disponible,
    ciclo: context.actual.ciclo,
    linea: context.actual.linea,
  };

  return (
    <div className="rounded-3xl border border-blue-100 bg-gradient-to-br from-blue-50 to-white p-5 shadow-sm transition-all duration-200 md:p-6">
      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h3 className="text-base font-bold text-gray-900">
            Cursos previos y posteriores
          </h3>
          <p className="text-sm text-gray-500">
            Contexto curricular de{" "}
            <span className="font-semibold text-gray-700">
              {selectedCourse?.cursoNombre ?? context.actual.cursoNombre}
            </span>
          </p>
        </div>

        <button
          type="button"
          onClick={onHide}
          className="inline-flex items-center gap-1 self-start rounded-lg border border-blue-200 bg-white px-3 py-1.5 text-xs font-semibold text-blue-700 transition-colors hover:bg-blue-50"
        >
          <ChevronUp size={14} />
          Ocultar
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <CurriculumColumn
          title="Cursos previos"
          emptyText="Sin cursos previos registrados."
          icon={<BookOpen size={16} />}
          tone="blue"
        >
          {context.anteriores.length > 0 ? (
            <div className="space-y-2">
              {context.anteriores.map((item) => (
                <CourseRelationCard
                  key={item.nombreMalla}
                  course={item}
                  downloadingId={downloadingId}
                  onDownload={onDownload}
                />
              ))}
            </div>
          ) : null}
        </CurriculumColumn>

        <CurriculumColumn
          title="Curso actual"
          emptyText="Sin curso actual."
          icon={<GraduationCap size={16} />}
          tone="indigo"
        >
          <CourseRelationCard
            course={actualAsCourse}
            downloadingId={downloadingId}
            onDownload={onDownload}
            showDownload={false}
          />
        </CurriculumColumn>

        <CurriculumColumn
          title="Cursos posteriores"
          emptyText="Sin cursos posteriores registrados."
          icon={<CheckCircle size={16} />}
          tone="green"
        >
          {context.posteriores.length > 0 ? (
            <div className="space-y-2">
              {context.posteriores.map((item) => (
                <CourseRelationCard
                  key={item.nombreMalla}
                  course={item}
                  downloadingId={downloadingId}
                  onDownload={onDownload}
                />
              ))}
            </div>
          ) : null}
        </CurriculumColumn>
      </div>
    </div>
  );
}

export function TeacherAssignedCoursesContext({
  assignments,
}: {
  assignments: Assignment[];
}) {
  const [selectedSyllabusId, setSelectedSyllabusId] = useState<number | null>(
    null,
  );
  const [downloadingId, setDownloadingId] = useState<number | null>(null);

  const courses = useMemo(
    () => normalizeAssignments(assignments),
    [assignments],
  );
  const selectedCourse = courses.find(
    (course) => course.syllabusId === selectedSyllabusId,
  );

  const {
    data: context,
    isLoading,
    isError,
  } = useCurriculumContext(
    selectedSyllabusId,
    selectedCourse?.cursoNombre ?? "",
  );

  const handleDownload = async (course: RelatedCourseWithMeta) => {
    if (!course.silaboId) return;

    setDownloadingId(course.silaboId);
    try {
      await downloadSyllabusPdf(course.silaboId, {
        codigo: course.cursoCodigo,
      });
    } catch {
      toast.error("No se pudo descargar el sílabo relacionado.");
    } finally {
      setDownloadingId(null);
    }
  };

  const handleSelectCourse = (syllabusId: number) => {
    setSelectedSyllabusId((current) =>
      current === syllabusId ? null : syllabusId,
    );
  };

  return (
    <section className="rounded-3xl border border-gray-100 bg-white p-6 shadow-sm md:p-8">
      <div className="mb-5 flex items-start gap-3">
        <span className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-blue-50 text-blue-700">
          <BookOpen size={22} />
        </span>
        <div>
          <h2 className="text-xl font-bold text-gray-900">Cursos asignados</h2>
          <p className="text-sm text-gray-500">
            Selecciona un curso para consultar sus cursos previos y posteriores
            según la malla curricular.
          </p>
        </div>
      </div>

      {courses.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-gray-200 bg-gray-50 p-5 text-sm text-gray-500">
          No tienes cursos asignados actualmente.
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {courses.map((course) => {
              const selected = course.syllabusId === selectedSyllabusId;

              return (
                <button
                  key={course.syllabusId}
                  type="button"
                  onClick={() => handleSelectCourse(course.syllabusId)}
                  className={`rounded-xl border p-4 text-left transition-all duration-200 ${
                    selected
                      ? "border-blue-500 bg-blue-50 shadow-md ring-2 ring-blue-100"
                      : "border-gray-200 bg-white hover:border-blue-200 hover:bg-blue-50/40 hover:shadow-sm"
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <h3 className="font-bold text-gray-900">
                      {course.cursoNombre}
                    </h3>
                    <div className="flex shrink-0 flex-col items-end gap-1">
                      <span className="rounded-full bg-blue-50 px-2.5 py-1 text-[11px] font-bold text-blue-700">
                        Asignado
                      </span>
                      {selected ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-blue-600 px-2.5 py-1 text-[11px] font-bold text-white">
                          <CheckCircle size={12} />
                          Seleccionado
                        </span>
                      ) : null}
                    </div>
                  </div>

                  {course.cursoCodigo ? (
                    <p className="mt-2 text-sm text-gray-500">
                      Código: {course.cursoCodigo}
                    </p>
                  ) : null}

                  {course.estado ? (
                    <p className="mt-3 inline-flex rounded-full bg-gray-100 px-3 py-1 text-xs font-semibold text-gray-600">
                      Estado: {formatStatus(course.estado)}
                    </p>
                  ) : null}
                </button>
              );
            })}
          </div>

          <div className="mt-6">
            {!selectedSyllabusId ? (
              <div className="rounded-2xl border border-dashed border-gray-200 bg-gray-50 p-4 text-sm text-gray-500">
                Selecciona un curso para ver sus cursos previos y posteriores.
              </div>
            ) : null}

            {selectedSyllabusId && isLoading ? (
              <div className="rounded-xl border border-blue-100 bg-blue-50 p-5 text-sm text-blue-700 flex items-center gap-2">
                <Loader2 size={18} className="animate-spin" />
                Cargando contexto curricular...
              </div>
            ) : null}

            {selectedSyllabusId && isError ? (
              <div className="rounded-xl border border-red-100 bg-red-50 p-5 text-sm text-red-700">
                No se pudo cargar el contexto curricular.
              </div>
            ) : null}

            {selectedSyllabusId && context ? (
              <CurriculumContextResult
                context={context}
                selectedCourse={selectedCourse}
                downloadingId={downloadingId}
                onDownload={handleDownload}
                onHide={() => setSelectedSyllabusId(null)}
              />
            ) : null}
          </div>
        </>
      )}
    </section>
  );
}
