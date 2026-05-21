import SearchableSelect from "./searchable-select";

export interface Course {
  id: string;
  name: string;
  code: string;
}

interface CourseSelectProps {
  selectedCourse: Course | null;
  courseSearch: string;
  setCourseSearch: (value: string) => void;
  showCourseDropdown: boolean;
  setShowCourseDropdown: (show: boolean) => void;
  onCourseSelect: (course: Course) => void;
  onClearCourse: () => void;
  courses: Course[];
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
            <div className="font-semibold text-gray-900">{course.name}</div>
            <div className="text-sm text-gray-500">Código: {course.code}</div>
          </div>
        )}
        noResultsText="No se encontraron asignaturas"
      />
    </div>
  );
}