import SearchableSelect from "./searchable-select";
import type { Course } from "../hooks/use-courses";

export type { Course };

interface CourseSelectProps {
  selectedCourse: Course | null;
  courseSearch: string;
  setCourseSearch: (value: string) => void;
  showCourseDropdown: boolean;
  setShowCourseDropdown: (show: boolean) => void;
  onCourseSelect: (course: Course) => void;
  onClearCourse: () => void;
  courses: Course[];
  showInconsistentBadge?: boolean;
}

export default function CourseSelect({
  selectedCourse,
  courseSearch,
  setCourseSearch,
  showCourseDropdown,
  setShowCourseDropdown,
  onCourseSelect,
  onClearCourse,
  courses,
  showInconsistentBadge = true,
}: CourseSelectProps) {
  return (
    <div>
      <label className="block text-sm font-bold text-gray-900 mb-2">
        2. Nombre de la Asignatura
      </label>

      <SearchableSelect
        value={courseSearch}
        onChange={setCourseSearch}
        onSelect={onCourseSelect}
        onClear={onClearCourse}
        items={courses}
        selectedItem={selectedCourse}
        showDropdown={showCourseDropdown}
        setShowDropdown={setShowCourseDropdown}
        placeholder="Buscar asignatura..."
        getItemKey={(course) => course.id}
        renderItem={(course) => (
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <div className="font-semibold text-gray-900">{course.name}</div>
              {course.isPendingAssignment && (
                <span className="inline-flex items-center rounded-full bg-amber-100 px-2 py-0.5 text-xs font-semibold text-amber-800">
                  Sin asignar
                </span>
              )}
              {showInconsistentBadge && course.isInconsistentNoDocente && (
                <span className="inline-flex items-center rounded-full bg-gray-200 px-2 py-0.5 text-xs font-semibold text-gray-700">
                  Inconsistente
                </span>
              )}
            </div>
            <div className="text-sm text-gray-500">Código: {course.code}</div>
            {!course.isPendingAssignment &&
              !course.isInconsistentNoDocente &&
              course.nombreDocente && (
                <div className="text-xs text-gray-400 mt-0.5">
                  Docente: {course.nombreDocente}
                </div>
              )}
          </div>
        )}
        noResultsText="No se encontraron asignaturas"
      />

      {selectedCourse?.isPendingAssignment && (
        <p className="mt-2 text-xs text-amber-700 font-medium">
          Este sílabo aún no tiene docente. Al guardar la asignación se
          vinculará al docente seleccionado.
        </p>
      )}
    </div>
  );
}
