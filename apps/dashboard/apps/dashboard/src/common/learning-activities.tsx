import { Plus, X } from "lucide-react";
import { useState } from "react";
export interface ActividadEditable {
  id: number;
  nombre: string;
  horas: 1 | 2 | 3;
}
interface Props {
  actividades: ActividadEditable[];
  onChange: (acts: ActividadEditable[]) => void;
  horasDisponibles: number;
  onLimitExceeded?: (message: string) => void;
}
let nextId = Date.now();
export const LearningActivities: React.FC<Props> = ({
  actividades,
  onChange,
  horasDisponibles,
  onLimitExceeded,
}) => {
  const [nuevaNombre, setNuevaNombre] = useState("");
  const [nuevaHoras, setNuevaHoras] = useState<"1" | "2" | "3">("1");
  const horasUsadas = actividades.reduce((sum, a) => sum + a.horas, 0);
  const puedeAgregar =
    nuevaNombre.trim() && horasUsadas + Number(nuevaHoras) <= horasDisponibles;
  const handleAdd = () => {
    if (!puedeAgregar) return;
    onChange([
      ...actividades,
      {
        id: nextId++,
        nombre: nuevaNombre.trim(),
        horas: Number(nuevaHoras) as 1 | 2 | 3,
      },
    ]);
    setNuevaNombre("");
    setNuevaHoras("1");
  };
  const handleRemove = (id: number) => {
    onChange(actividades.filter((a) => a.id !== id));
  };
  const handleHorasChange = (id: number, horas: 1 | 2 | 3) => {
    const nuevas = actividades.map((a) => (a.id === id ? { ...a, horas } : a));
    const total = nuevas.reduce((s, a) => s + a.horas, 0);
    if (total > horasDisponibles) {
      if (typeof onLimitExceeded === "function") {
        onLimitExceeded(
          "La suma de horas excede las horas disponibles de la semana.",
        );
      }
      return;
    }
    onChange(nuevas);
  };
  return (
    <div className="space-y-4">
      {actividades.map((act) => (
        <div
          key={act.id}
          className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg"
        >
          <input
            type="text"
            value={act.nombre}
            onChange={(e) =>
              onChange(
                actividades.map((a) =>
                  a.id === act.id ? { ...a, nombre: e.target.value } : a,
                ),
              )
            }
            className="flex-1 px-4 py-2 border rounded-md text-sm"
            placeholder="Descripción de la actividad"
          />
          <select
            value={act.horas}
            onChange={(e) => {
              const horas = Number(e.target.value) as 1 | 2 | 3;
              handleHorasChange(act.id, horas);
            }}
            className="px-4 py-2 border rounded-md text-sm"
          >
            <option value={1}>1h</option>
            <option value={2}>2h</option>
            <option value={3}>3h</option>
          </select>
          <button
            onClick={() => handleRemove(act.id)}
            className="text-red-500 hover:text-red-700"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
      ))}
      <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg">
        <input
          type="text"
          value={nuevaNombre}
          onChange={(e) => setNuevaNombre(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && puedeAgregar && handleAdd()}
          className="flex-1 px-4 py-2 border rounded-md text-sm"
          placeholder="Descripción de la actividad"
        />
        <select
          value={nuevaHoras}
          onChange={(e) => setNuevaHoras(e.target.value as "1" | "2" | "3")}
          className="px-4 py-2 border rounded-md text-sm"
        >
          <option value={1}>1h</option>
          <option value={2}>2h</option>
          <option value={3}>3h</option>
        </select>
        <button
          onClick={handleAdd}
          disabled={!puedeAgregar}
          className="bg-blue-600 text-white p-2.5 rounded-full hover:bg-blue-700 disabled:opacity-50"
        >
          <Plus className="h-5 w-5" />
        </button>
      </div>
      <div className="flex justify-end text-sm font-medium">
        <span
          className={
            horasUsadas === horasDisponibles
              ? "text-green-600"
              : "text-orange-600"
          }
        >
          {horasUsadas} / {horasDisponibles} horas
        </span>
      </div>
    </div>
  );
};
