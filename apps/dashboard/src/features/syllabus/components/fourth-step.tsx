import { useEffect, useState } from "react";
import { toast } from "sonner";
import { useSteps } from "../contexts/steps-context-provider";
import { useSyllabusContext } from "../contexts/syllabus-context";
import {
  useCreateProgramacion,
  useGetProgramacion,
  useUpdateProgramacion,
} from "../hooks/fourth-step-query";
import type {
  CreateProgramacionBody,
  ProgramacionResponse,
  UpdateProgramacionBody,
} from "../hooks/fourth-step-query";
import { WeekSelector } from "../../../common/week-selector";
import { Step } from "./step";

interface Unidad {
  id?: string | number;
  numero?: number;
  titulo?: string;
  semanaInicio?: number;
  semanaFin?: number;
  semanas?: Array<{ numeroSemana: number; horasDisponibles?: number }>;
  contenidosConceptuales?: string;
  contenidosProcedimentales?: string;
  actividadesAprendizaje?: string[] | string;
  horasLectivasTeoria?: number;
  horasLectivasPractica?: number;
  horasNoLectivasTeoria?: number;
  horasNoLectivasPractica?: number;
  capacidadesText?: string;
  silaboId?: number;
  [key: string]: unknown;
}

const unitWeekRanges: Record<number, [number, number]> = {
  1: [1, 4],
  2: [5, 8],
  3: [9, 12],
  4: [13, 16],
};

const DEFAULT_WEEKS = Array.from({ length: 16 }, (_, index) => ({
  numeroSemana: index + 1,
}));

const parseConceptualesPorSemana = (
  text?: string,
): Record<string, string[]> => {
  if (!text) return {};

  const result: Record<string, string[]> = {};
  const blocks = text.split(/\n\s*\n/).filter(Boolean);

  blocks.forEach((block) => {
    const lines = block
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean);

    if (lines.length === 0) return;

    const match = lines[0].match(/^Semana\s+(\d+):?$/i);

    if (match) {
      result[match[1]] = lines.slice(1);
    } else {
      result["1"] = [...(result["1"] ?? []), ...lines];
    }
  });

  return result;
};

const serializeConceptualesPorSemana = (
  listasPorSemana: Record<string, string[]>,
): string => {
  return Object.entries(listasPorSemana)
    .sort(([a], [b]) => Number(a) - Number(b))
    .filter(([, lista]) => lista.length > 0)
    .map(([semana, lista]) => `Semana ${semana}:\n${lista.join("\n")}`)
    .join("\n\n");
};

export default function FourthStep() {
  const { cursoCodigo, syllabusId, mode, courseName, generalData } =
    useSyllabusContext();
  const { nextStep } = useSteps();

  const silaboId = syllabusId ? Number(syllabusId) : 0;

  const { data, isLoading } = useGetProgramacion(
    syllabusId ? String(syllabusId) : "",
  );

  const createProgramacion = useCreateProgramacion();
  const updateProgramacion = useUpdateProgramacion();

  const [selectedUnidad, setSelectedUnidad] = useState<number>(1);
  const [selectedSemana, setSelectedSemana] = useState<string>("1");
  const [programacionForm, setProgramacionForm] = useState<
    Partial<ProgramacionResponse>
  >({});

  const [contenidoInput, setContenidoInput] = useState("");
  const [listasPorSemana, setListasPorSemana] = useState<
    Record<string, string[]>
  >({});
  const [editingIndex, setEditingIndex] = useState<number | null>(null);

  const listaConceptuales = listasPorSemana[selectedSemana] ?? [];

  useEffect(() => {
    if (!Array.isArray(data) || data.length === 0) return;

    const first = data[0] as Unidad;
    const unidadNumero = Number(first.numero) || 1;
    const semanaInicio = String(
      first.semanaInicio ?? unitWeekRanges[unidadNumero]?.[0] ?? 1,
    );

    setProgramacionForm(first);
    setSelectedUnidad(unidadNumero);
    setSelectedSemana(semanaInicio);
    setListasPorSemana(
      parseConceptualesPorSemana(first.contenidosConceptuales),
    );
  }, [data]);

  const weeksForSelectedUnit = (() => {
    const range = unitWeekRanges[selectedUnidad];

    if (!range) return DEFAULT_WEEKS;

    const weeks = [];

    for (let week = range[0]; week <= range[1]; week++) {
      weeks.push({ numeroSemana: week });
    }

    return weeks;
  })();

  const handleSemanaChange = (nuevaSemana: string) => {
    setSelectedSemana(nuevaSemana);
    setContenidoInput("");
    setEditingIndex(null);
  };

  const handleAddContenido = () => {
    const value = contenidoInput.trim();

    if (!value) {
      toast.error("Ingrese un contenido conceptual");
      return;
    }

    if (editingIndex !== null) {
      const nuevaLista = [...listaConceptuales];
      nuevaLista[editingIndex] = value;

      setListasPorSemana((prev) => ({
        ...prev,
        [selectedSemana]: nuevaLista,
      }));

      setEditingIndex(null);
    } else {
      setListasPorSemana((prev) => ({
        ...prev,
        [selectedSemana]: [...(prev[selectedSemana] ?? []), value],
      }));
    }

    setContenidoInput("");
  };

  const handleEditContenido = (index: number) => {
    setContenidoInput(listaConceptuales[index]);
    setEditingIndex(index);

    setTimeout(() => {
      const textarea = document.querySelector(
        'textarea[placeholder="Ingrese el contenido conceptual..."]',
      ) as HTMLTextAreaElement | null;

      textarea?.focus();
    }, 0);
  };

  const handleDeleteContenido = (index: number) => {
    const nuevaLista = listaConceptuales.filter((_, i) => i !== index);

    setListasPorSemana((prev) => ({
      ...prev,
      [selectedSemana]: nuevaLista,
    }));

    if (editingIndex === index) {
      setContenidoInput("");
      setEditingIndex(null);
    }

    toast.success("Contenido eliminado de la lista");
  };

  const getCurrentUnidad = (): Unidad => {
    if (Array.isArray(data) && data.length > 0) {
      const found = data.find(
        (item) => Number((item as Unidad).numero) === selectedUnidad,
      );

      if (found) return found as Unidad;

      return data[0] as Unidad;
    }

    return {
      numero: selectedUnidad,
      titulo: `Unidad ${selectedUnidad}`,
      semanaInicio: unitWeekRanges[selectedUnidad]?.[0] ?? 1,
      semanaFin: unitWeekRanges[selectedUnidad]?.[1] ?? 16,
    };
  };

  const handleSave = async () => {
    if (!silaboId || Number.isNaN(silaboId)) {
      toast.error(
        "Id del sílabo no encontrado. Completa el primer paso antes de continuar.",
      );
      return;
    }

    const unidad = getCurrentUnidad();
    const range = unitWeekRanges[selectedUnidad] ?? [1, 16];
    const contenidosConceptuales =
      serializeConceptualesPorSemana(listasPorSemana);

    const updatePayload: Partial<UpdateProgramacionBody> = {
      silaboId,
      numero: selectedUnidad,
      titulo: unidad.titulo || `Unidad ${selectedUnidad}`,
      capacidadesText: unidad.capacidadesText || "",
      semanaInicio: range[0],
      semanaFin: range[1],
      contenidosConceptuales,
      contenidosProcedimentales: unidad.contenidosProcedimentales || "",
      actividadesAprendizaje: Array.isArray(unidad.actividadesAprendizaje)
        ? unidad.actividadesAprendizaje.join(" , ")
        : unidad.actividadesAprendizaje || "",
      horasLectivasTeoria: Number(unidad.horasLectivasTeoria ?? 0),
      horasLectivasPractica: Number(unidad.horasLectivasPractica ?? 0),
      horasNoLectivasTeoria: Number(unidad.horasNoLectivasTeoria ?? 0),
      horasNoLectivasPractica: Number(unidad.horasNoLectivasPractica ?? 0),
    };

    const createBody: CreateProgramacionBody = {
      silaboId,
      numero: selectedUnidad,
      titulo: unidad.titulo || `Unidad ${selectedUnidad}`,
      capacidadesText: unidad.capacidadesText || "",
      semanaInicio: range[0],
      semanaFin: range[1],
      contenidosConceptuales,
      contenidosProcedimentales: unidad.contenidosProcedimentales || "",
      actividadesAprendizaje: Array.isArray(unidad.actividadesAprendizaje)
        ? unidad.actividadesAprendizaje.join(" , ")
        : unidad.actividadesAprendizaje || "",
      horasLectivasTeoria: Number(unidad.horasLectivasTeoria ?? 0),
      horasLectivasPractica: Number(unidad.horasLectivasPractica ?? 0),
      horasNoLectivasTeoria: Number(unidad.horasNoLectivasTeoria ?? 0),
      horasNoLectivasPractica: Number(unidad.horasNoLectivasPractica ?? 0),
    };

    try {
      const hasProgramacion = Array.isArray(data) && data.length > 0;
      const shouldCreate = mode === "create" && !hasProgramacion;

      if (shouldCreate || !unidad.id) {
        await createProgramacion.mutateAsync(createBody);
      } else {
        await updateProgramacion.mutateAsync({
          id: String(unidad.id),
          payload: updatePayload,
        });
      }

      toast.success("Contenidos conceptuales guardados correctamente");
      nextStep();
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Error guardando programación",
      );
    }
  };

  if (isLoading) {
    return <div>Cargando...</div>;
  }

  return (
    <Step step={4} onNextStep={handleSave}>
      <div className="w-full max-w-6xl mx-auto p-6">
        <div className="mb-6 border rounded-lg bg-white">
          <div className="flex items-center justify-between px-4 py-3 border-b">
            <div>
              <h3 className="font-bold text-lg">1. Datos Generales</h3>
              <p className="text-sm text-gray-700">
                {generalData?.nombreAsignatura || courseName || "Sin nombre de asignatura"}
                {generalData?.codigoAsignatura || cursoCodigo
                  ? ` | COD: ${generalData?.codigoAsignatura || cursoCodigo}`
                  : ""}
              </p>
            </div>

            <button className="text-gray-600 hover:text-black" type="button">
              👁
            </button>
          </div>
        </div>

        <h2 className="text-xl font-bold mb-4">2. Contenidos Conceptuales</h2>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div>
            <label className="block text-sm font-medium mb-2">
              Selecciona una semana
            </label>

            <WeekSelector
              value={selectedSemana}
              onChange={handleSemanaChange}
              semanas={DEFAULT_WEEKS}
              className="w-full px-4 py-2 text-sm"
            />

            <label className="block text-sm font-medium mt-6 mb-2">
              Contenidos Conceptuales
            </label>

            <div className="relative">
              <textarea
                maxLength={400}
                value={contenidoInput}
                onChange={(event) => setContenidoInput(event.target.value)}
                placeholder="Ingrese el contenido conceptual..."
                className="w-full p-3 border rounded-lg resize-none min-h-[140px]"
                rows={6}
              />

              <button
                type="button"
                onClick={handleAddContenido}
                className="absolute right-3 bottom-8 w-9 h-9 rounded-full bg-gray-300 hover:bg-gray-400 text-white text-xl flex items-center justify-center"
                title={editingIndex !== null ? "Guardar edición" : "Agregar"}
              >
                {editingIndex !== null ? "✓" : "+"}
              </button>
            </div>

            <div className="text-xs text-gray-500 text-right">
              {contenidoInput.length}/400
            </div>

            {editingIndex !== null && (
              <p className="text-xs text-blue-600 text-right mt-1">
                Editando contenido #{editingIndex + 1}. Presiona ✓ para
                guardar.
              </p>
            )}
          </div>

          <div>
            <div className="border rounded-lg bg-white min-h-[280px]">
              <div className="flex justify-between items-center px-4 py-3 border-b">
                <h3 className="font-semibold text-sm">
                  1. Lista de Contenidos conceptuales
                </h3>

                <span className="text-xs font-medium text-gray-600">
                  Semana {selectedSemana || "1"}
                </span>
              </div>

              <div className="p-4 space-y-3">
                {listaConceptuales.length === 0 ? (
                  <p className="text-sm text-gray-500 text-center py-10">
                    Aún no hay contenidos conceptuales registrados.
                  </p>
                ) : (
                  listaConceptuales.map((contenido, index) => (
                    <div
                      key={`${selectedSemana}-${contenido}-${index}`}
                      className="flex items-center justify-between gap-3 border rounded-lg px-4 py-3 bg-gray-50"
                    >
                      <span className="text-sm text-gray-800">
                        {contenido}
                      </span>

                      <div className="flex gap-2 text-gray-500">
                        <button
                          type="button"
                          className="hover:text-blue-600"
                          onClick={() => handleEditContenido(index)}
                        >
                          ✎
                        </button>

                        <button
                          type="button"
                          className="hover:text-red-600"
                          onClick={() => handleDeleteContenido(index)}
                        >
                          🗑
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </Step>
  );
}