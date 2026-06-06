import { getSemesterName } from "../../../common/utils/academic-period";

interface AcademicPeriodInputProps {
  academicPeriod: string;
}

export default function AcademicPeriodInput({
  academicPeriod,
}: AcademicPeriodInputProps) {
  return (
    <div>
      <label className="block text-sm font-bold text-gray-900 mb-2">
        4. Periodo Académico
      </label>

      <input
        type="text"
        value={academicPeriod}
        readOnly
        className="w-full h-12 border border-gray-200 rounded-xl px-4 bg-gray-50 text-sm text-gray-700 font-semibold outline-none"
      />

      <p className="text-xs text-gray-500 mt-2 leading-relaxed">
        {academicPeriod && getSemesterName(academicPeriod)} - Periodo generado
        automáticamente según el ciclo académico actual de la USMP
      </p>
    </div>
  );
}
