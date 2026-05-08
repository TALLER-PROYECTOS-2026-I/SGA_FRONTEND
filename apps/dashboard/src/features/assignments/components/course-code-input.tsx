interface CourseCodeInputProps {
  courseCode: string;
}

export default function CourseCodeInput({ courseCode }: CourseCodeInputProps) {
  return (
    <div className="mb-6">
      <label className="block text-sm font-semibold text-slate-700 mb-1.5">
        Código de Asignatura
      </label>
      <input
        type="text"
        value={courseCode}
        readOnly
        placeholder="Selecciona una asignatura"
        className="w-full border border-gray-300 rounded-lg px-4 py-3 bg-gray-50 text-gray-700"
      />
    </div>
  );
}
