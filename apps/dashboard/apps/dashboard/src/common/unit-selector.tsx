import React from "react";
export interface UnidadOption {
  value: number;
  label: string;
}
interface Props {
  value: number | null;
  onChange: (value: number | null) => void;
  options: UnidadOption[];
}
export const UnitSelector: React.FC<Props> = ({ value, onChange, options }) => (
  <select
    className="border border-gray-300 rounded p-2 w-full"
    value={value ?? ""}
    onChange={(e) => onChange(e.target.value ? Number(e.target.value) : null)}
  >
    <option value="">Selecciona unidad</option>
    {options.map((u) => (
      <option key={u.value} value={u.value}>
        {u.label}
      </option>
    ))}
  </select>
);
