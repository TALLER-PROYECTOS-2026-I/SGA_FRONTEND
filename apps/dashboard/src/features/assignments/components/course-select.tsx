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
    <div className="mb-6">
      <label className="block text-sm font-semibold text-slate-700 mb-1.5">
        Sílabo del Curso <span className="text-red-500">*</span>
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
        placeholder="Buscar un Sílabo"
        getItemKey={(course) => course.id}
        renderItem={(course) => (
          <>
            <div className="font-medium text-gray-800">{course.name}</div>
            <div className="text-sm text-gray-500">Código: {course.code}</div>
          </>
        )}
        noResultsText="No se encontraron asignaturas"
      />
    </div>
  );
}
