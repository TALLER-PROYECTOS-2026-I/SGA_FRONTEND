import React from "react";
interface Semana {
  numeroSemana: number;
}
interface Props {
  value: string;
  onChange: (value: string) => void;
  semanas: Semana[];
  className?: string;
}
export const WeekSelector: React.FC<Props> = ({
  value,
  onChange,
  semanas,
  className,
}) => {
  return (
    <div className="relative">
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={`bg-black text-white px-8 py-3 pl-10 pr-12 rounded-full font-medium text-base appearance-none cursor-pointer min-w-[200px] focus:outline-none focus:ring-2 focus:ring-blue-500 ${className ?? ""}`}
      >
        <option value="">Seleccionar semana</option>
        {semanas.map((s) => (
          <option key={s.numeroSemana} value={s.numeroSemana}>
            Semana {s.numeroSemana}
          </option>
        ))}
      </select>
      <div className="absolute inset-y-0 right-0 flex items-center pr-4 pointer-events-none">
        <svg
          className="w-5 h-5 text-white"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 9l-7 7-7-7"
          />
        </svg>
      </div>
    </div>
  );
};
