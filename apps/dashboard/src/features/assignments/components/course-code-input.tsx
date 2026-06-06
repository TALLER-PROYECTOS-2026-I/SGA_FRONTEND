interface CourseCodeInputProps {
  courseCode: string;
}

export default function CourseCodeInput({ courseCode }: CourseCodeInputProps) {
  return (
    <div>
      <label className="block text-sm font-bold text-gray-900 mb-2">
        3. Código de Asignatura
      </label>

      <input
        type="text"
        value={courseCode}
        readOnly
        placeholder="Selecciona una asignatura"
        className="w-full h-12 border border-gray-200 rounded-xl px-4 bg-gray-50 text-sm text-gray-700 font-semibold outline-none"
      />
    </div>
  );
}
