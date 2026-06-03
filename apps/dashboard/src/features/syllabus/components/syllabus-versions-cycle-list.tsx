import { useMemo, useState } from "react";
import {
  BookOpenCheck,
  CalendarClock,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Eye,
  Layers,
  Lock,
} from "lucide-react";
import type {
  SyllabusVersionsCycle,
  VersionedSyllabusCourse,
} from "../hooks/syllabus-versions-query";

interface SyllabusVersionsCycleListProps {
  cycles: SyllabusVersionsCycle[];
  selectedSyllabusId?: number | null;
  onSelectCourse: (course: VersionedSyllabusCourse) => void;
}

function formatCourseTitle(course: VersionedSyllabusCourse) {
  return course.cursoNombre || "Sílabo sin nombre";
}

function formatDate(value?: string | null) {
  if (!value) return "Sin fecha";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Sin fecha";
  }

  return date.toLocaleDateString();
}

function getStatusLabel(value?: string | null) {
  if (!value) return "Sin sílabo";

  return String(value)
    .replaceAll("_", " ")
    .toLowerCase()
    .replace(/^\w/, (letter) => letter.toUpperCase());
}

function getStatusClass(value?: string | null) {
  const status = String(value ?? "").toUpperCase();

  if (status.includes("APROBADO") || status.includes("VALIDADO")) {
    return "border-green-100 bg-green-50 text-green-700";
  }

  if (status.includes("REVISION") || status.includes("ANALIZANDO")) {
    return "border-yellow-100 bg-yellow-50 text-yellow-700";
  }

  if (status.includes("DESAPROBADO") || status.includes("RECHAZADO")) {
    return "border-red-100 bg-red-50 text-red-700";
  }

  if (status.includes("ASIGNADO")) {
    return "border-blue-100 bg-blue-50 text-blue-700";
  }

  if (status.includes("BORRADOR")) {
    return "border-gray-100 bg-gray-50 text-gray-700";
  }

  return "border-gray-100 bg-gray-50 text-gray-600";
}

function getCycleSortValue(cycle?: string | number | null) {
  const parsed = Number(String(cycle ?? "").trim());
  return Number.isFinite(parsed) ? parsed : 999;
}

export function SyllabusVersionsCycleList({
  cycles,
  selectedSyllabusId,
  onSelectCourse,
}: SyllabusVersionsCycleListProps) {
  const sortedCycles = useMemo(() => {
    return [...cycles].sort(
      (a, b) => getCycleSortValue(a.ciclo) - getCycleSortValue(b.ciclo),
    );
  }, [cycles]);

  const [expandedCycles, setExpandedCycles] = useState<string[]>([]);

  const toggleCycle = (cycleKey: string) => {
    setExpandedCycles((current) =>
      current.includes(cycleKey)
        ? current.filter((item) => item !== cycleKey)
        : [...current, cycleKey],
    );
  };

  const expandAll = () => {
    setExpandedCycles(sortedCycles.map((cycle) => cycle.nombre));
  };

  const collapseAll = () => {
    setExpandedCycles([]);
  };

  if (sortedCycles.length === 0) {
    return (
      <div className="rounded-2xl border border-gray-100 bg-white p-8 text-center shadow-sm">
        <BookOpenCheck size={34} className="mx-auto text-gray-400" />
        <p className="mt-3 text-sm font-semibold text-gray-700">
          No se encontraron cursos para el periodo seleccionado.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap justify-end gap-2">
        <button
          type="button"
          onClick={expandAll}
          className="rounded-xl border border-gray-200 bg-white px-3 py-2 text-xs font-bold text-gray-700 shadow-sm hover:bg-gray-50"
        >
          Expandir ciclos
        </button>

        <button
          type="button"
          onClick={collapseAll}
          className="rounded-xl border border-gray-200 bg-white px-3 py-2 text-xs font-bold text-gray-700 shadow-sm hover:bg-gray-50"
        >
          Contraer ciclos
        </button>
      </div>

      {sortedCycles.map((cycle) => {
        const cycleKey = cycle.nombre;
        const isExpanded = expandedCycles.includes(cycleKey);
        const coursesWithVersions = cycle.cursos.filter(
          (course) => course.versionsCount > 0,
        ).length;

        return (
          <section
            key={cycleKey}
            className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-md"
          >
            <button
              type="button"
              onClick={() => toggleCycle(cycleKey)}
              className="flex w-full items-center justify-between gap-4 border-b border-gray-100 bg-gray-50 px-5 py-4 text-left transition hover:bg-gray-100"
            >
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-600 text-white">
                  <Layers size={19} />
                </div>

                <div>
                  <div className="flex items-center gap-2">
                    {isExpanded ? (
                      <ChevronDown size={18} className="text-gray-700" />
                    ) : (
                      <ChevronRight size={18} className="text-gray-700" />
                    )}

                    <h2 className="font-bold text-gray-900">{cycle.nombre}</h2>
                  </div>

                  <p className="mt-1 text-sm text-gray-500">
                    {cycle.cursos.length} curso
                    {cycle.cursos.length === 1 ? "" : "s"} registrados ·{" "}
                    {coursesWithVersions} con historial
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap items-center justify-end gap-2">
                <span className="rounded-xl bg-white px-3 py-2 text-xs font-bold text-gray-700 shadow-sm">
                  {cycle.cursos.length} cursos
                </span>

                <span className="rounded-xl border border-blue-100 bg-blue-50 px-3 py-2 text-xs font-bold text-blue-700">
                  {coursesWithVersions} historiales
                </span>
              </div>
            </button>

            {isExpanded && (
              <div className="divide-y divide-gray-100">
                {cycle.cursos.map((course) => {
                  const hasVersions = course.versionsCount > 0;
                  const selected =
                    course.syllabusId !== null &&
                    selectedSyllabusId === course.syllabusId;

                  return (
                    <div
                      key={`${cycle.nombre}-${course.cursoCodigo}-${course.cursoNombre}`}
                      className={`w-full px-5 py-4 transition ${
                        selected ? "bg-red-50" : "bg-white"
                      }`}
                    >
                      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            {course.cursoCodigo && (
                              <span className="rounded-lg border border-gray-100 bg-white px-2 py-1 text-xs font-bold text-red-700">
                                {course.cursoCodigo}
                              </span>
                            )}

                            <span className="break-words text-sm font-bold text-gray-900">
                              {formatCourseTitle(course)}
                            </span>

                            <span
                              className={`rounded-lg border px-2.5 py-1 text-xs font-bold ${getStatusClass(
                                course.estadoRevision,
                              )}`}
                            >
                              {getStatusLabel(course.estadoRevision)}
                            </span>
                          </div>

                          <p className="mt-2 text-xs text-gray-500">
                            {course.programaAcademico ||
                              course.escuelaProfesional ||
                              "Programa no registrado"}
                          </p>
                        </div>

                        <div className="flex flex-wrap items-center gap-2 text-xs text-gray-600">
                          <span className="inline-flex items-center gap-1 rounded-lg border border-gray-100 bg-white px-2.5 py-1.5 font-semibold">
                            <CalendarClock size={14} />
                            {formatDate(course.latestVersion?.modifiedAt)}
                          </span>

                          {hasVersions ? (
                            <span className="inline-flex items-center gap-1 rounded-lg border border-blue-100 bg-blue-50 px-2.5 py-1.5 font-bold text-blue-700">
                              <CheckCircle2 size={14} />
                              {course.versionsCount} versión
                              {course.versionsCount === 1 ? "" : "es"}
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 rounded-lg border border-gray-100 bg-gray-50 px-2.5 py-1.5 font-bold text-gray-500">
                              <Lock size={14} />
                              Sin versiones guardadas
                            </span>
                          )}

                          <button
                            type="button"
                            onClick={() => onSelectCourse(course)}
                            disabled={!hasVersions}
                            className={`inline-flex items-center gap-1 rounded-lg px-3 py-1.5 font-bold shadow-sm transition ${
                              hasVersions
                                ? "bg-red-600 text-white hover:bg-red-700"
                                : "cursor-not-allowed bg-gray-100 text-gray-400"
                            }`}
                          >
                            <Eye size={14} />
                            Ver
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </section>
        );
      })}
    </div>
  );
}