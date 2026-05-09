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
import { Step } from "./step";
import {
  BookOpen,
  CalendarDays,
  FileText,
  ListChecks,
  Loader2,
  Pencil,
  Plus,
  Trash2,
  Check,
  Info,
  Clock,
} from "lucide-react";

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

type SemanaEntry = {
  contenidoConceptual: string;
  desarrolloTema: string;
  horasLectivasTeoria: number;
  horasLectivasPractica: number;
  horasNoLectivasTeoria: number;
  horasNoLectivasPractica: number;
};

type EntryForm = {
  contenidoConceptual: string;
  desarrolloTema: string;
  horasLectivasTeoria: string;
  horasLectivasPractica: string;
  horasNoLectivasTeoria: string;
  horasNoLectivasPractica: string;
};

const unitWeekRanges: Record<number, [number, number]> = {
  1: [1, 4],
  2: [5, 8],
  3: [9, 12],
  4: [13, 16],
};

const DEFAULT_WEEKS = Array.from({ length: 16 }, (_, index) => ({
  numeroSemana: index + 1,
}));

const emptyEntryForm = (): EntryForm => ({
  contenidoConceptual: "",
  desarrolloTema: "",
  horasLectivasTeoria: "",
  horasLectivasPractica: "",
  horasNoLectivasTeoria: "",
  horasNoLectivasPractica: "",
});

const getUnidadBySemana = (semana: string) => {
  const value = Number(semana);

  if (value >= 1 && value <= 4) return 1;
  if (value >= 5 && value <= 8) return 2;
  if (value >= 9 && value <= 12) return 3;
  return 4;
};

const toNumber = (value: string | number | undefined) => {
  const parsed = Number(value ?? 0);
  return Number.isNaN(parsed) ? 0 : parsed;
};

const parseConceptualesPorSemana = (
  text?: string,
): Record<string, SemanaEntry[]> => {
  if (!text) return {};

  const result: Record<string, SemanaEntry[]> = {};
  const blocks = text.split(/\n\s*\n/).filter(Boolean);

  blocks.forEach((block) => {
    const lines = block
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean);

    if (lines.length === 0) return;

    const match = lines[0].match(/^Semana\s+(\d+):?$/i);

    if (match) {
      const semana = match[1];

      result[semana] = lines.slice(1).map((line) => ({
        contenidoConceptual: line,
        desarrolloTema: "",
        horasLectivasTeoria: 0,
        horasLectivasPractica: 0,
        horasNoLectivasTeoria: 0,
        horasNoLectivasPractica: 0,
      }));
    } else {
      result["1"] = [
        ...(result["1"] ?? []),
        ...lines.map((line) => ({
          contenidoConceptual: line,
          desarrolloTema: "",
          horasLectivasTeoria: 0,
          horasLectivasPractica: 0,
          horasNoLectivasTeoria: 0,
          horasNoLectivasPractica: 0,
        })),
      ];
    }
  });

  return result;
};

const serializeConceptualesPorSemana = (
  listasPorSemana: Record<string, SemanaEntry[]>,
): string => {
  return Object.entries(listasPorSemana)
    .sort(([a], [b]) => Number(a) - Number(b))
    .filter(([, lista]) => lista.length > 0)
    .map(([semana, lista]) => {
      const conceptos = lista
        .map((item) => item.contenidoConceptual.trim())
        .filter(Boolean);

      return conceptos.length > 0 ? `Semana ${semana}:\n${conceptos.join("\n")}` : "";
    })
    .filter(Boolean)
    .join("\n\n");
};

const serializeProcedimentalesPorSemana = (
  listasPorSemana: Record<string, SemanaEntry[]>,
): string => {
  return Object.entries(listasPorSemana)
    .sort(([a], [b]) => Number(a) - Number(b))
    .filter(([, lista]) => lista.length > 0)
    .map(([semana, lista]) => {
      const procedimientos = lista
        .map((item, index) => {
          if (!item.desarrolloTema.trim()) return "";

          return `${index + 1}. ${item.desarrolloTema.trim()}`;
        })
        .filter(Boolean);

      return procedimientos.length > 0
        ? `Semana ${semana}:\n${procedimientos.join("\n")}`
        : "";
    })
    .filter(Boolean)
    .join("\n\n");
};

const serializeActividadesAprendizaje = (
  listasPorSemana: Record<string, SemanaEntry[]>,
): string => {
  return Object.entries(listasPorSemana)
    .sort(([a], [b]) => Number(a) - Number(b))
    .filter(([, lista]) => lista.length > 0)
    .map(([semana, lista]) => {
      const items = lista
        .map((item, index) => {
          const totalLectivas =
            item.horasLectivasTeoria + item.horasLectivasPractica;
          const totalNoLectivas =
            item.horasNoLectivasTeoria + item.horasNoLectivasPractica;

          return [
            `${index + 1}. ${item.desarrolloTema || item.contenidoConceptual}`,
            `Contenido conceptual: ${item.contenidoConceptual}`,
            `Horas lectivas: Teoría ${item.horasLectivasTeoria}h / Práctica ${item.horasLectivasPractica}h / Total ${totalLectivas}h`,
            `Horas no lectivas: Teoría ${item.horasNoLectivasTeoria}h / Práctica ${item.horasNoLectivasPractica}h / Total ${totalNoLectivas}h`,
          ].join("\n");
        })
        .join("\n\n");

      return `Semana ${semana}:\n${items}`;
    })
    .join("\n\n");
};

const calculateTotals = (listasPorSemana: Record<string, SemanaEntry[]>) => {
  const entries = Object.values(listasPorSemana).flat();

  return entries.reduce(
    (acc, item) => ({
      horasLectivasTeoria: acc.horasLectivasTeoria + item.horasLectivasTeoria,
      horasLectivasPractica:
        acc.horasLectivasPractica + item.horasLectivasPractica,
      horasNoLectivasTeoria:
        acc.horasNoLectivasTeoria + item.horasNoLectivasTeoria,
      horasNoLectivasPractica:
        acc.horasNoLectivasPractica + item.horasNoLectivasPractica,
    }),
    {
      horasLectivasTeoria: 0,
      horasLectivasPractica: 0,
      horasNoLectivasTeoria: 0,
      horasNoLectivasPractica: 0,
    },
  );
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

  const [entryForm, setEntryForm] = useState<EntryForm>(emptyEntryForm());
  const [listasPorSemana, setListasPorSemana] = useState<
    Record<string, SemanaEntry[]>
  >({});
  const [editingIndex, setEditingIndex] = useState<number | null>(null);

  const listaSemana = listasPorSemana[selectedSemana] ?? [];
  const totals = calculateTotals(listasPorSemana);
  const totalContenidos = Object.values(listasPorSemana).flat().length;

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

  const handleSemanaChange = (nuevaSemana: string) => {
    setSelectedSemana(nuevaSemana);
    setSelectedUnidad(getUnidadBySemana(nuevaSemana));
    setEntryForm(emptyEntryForm());
    setEditingIndex(null);
  };

  const updateEntryField = (field: keyof EntryForm, value: string) => {
    setEntryForm((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleAddContenido = () => {
    const contenidoConceptual = entryForm.contenidoConceptual.trim();
    const desarrolloTema = entryForm.desarrolloTema.trim();

    if (!contenidoConceptual) {
      toast.error("Ingrese un contenido conceptual");
      return;
    }

    if (!desarrolloTema) {
      toast.error("Ingrese el desarrollo del tema o actividad");
      return;
    }

    const newEntry: SemanaEntry = {
      contenidoConceptual,
      desarrolloTema,
      horasLectivasTeoria: toNumber(entryForm.horasLectivasTeoria),
      horasLectivasPractica: toNumber(entryForm.horasLectivasPractica),
      horasNoLectivasTeoria: toNumber(entryForm.horasNoLectivasTeoria),
      horasNoLectivasPractica: toNumber(entryForm.horasNoLectivasPractica),
    };

    if (editingIndex !== null) {
      const nuevaLista = [...listaSemana];
      nuevaLista[editingIndex] = newEntry;

      setListasPorSemana((prev) => ({
        ...prev,
        [selectedSemana]: nuevaLista,
      }));

      setEditingIndex(null);
      toast.success("Registro actualizado");
    } else {
      setListasPorSemana((prev) => ({
        ...prev,
        [selectedSemana]: [...(prev[selectedSemana] ?? []), newEntry],
      }));

      toast.success("Registro agregado a la lista");
    }

    setEntryForm(emptyEntryForm());
  };

  const handleEditContenido = (index: number) => {
    const item = listaSemana[index];

    setEntryForm({
      contenidoConceptual: item.contenidoConceptual,
      desarrolloTema: item.desarrolloTema,
      horasLectivasTeoria: String(item.horasLectivasTeoria || ""),
      horasLectivasPractica: String(item.horasLectivasPractica || ""),
      horasNoLectivasTeoria: String(item.horasNoLectivasTeoria || ""),
      horasNoLectivasPractica: String(item.horasNoLectivasPractica || ""),
    });

    setEditingIndex(index);

    setTimeout(() => {
      const textarea = document.querySelector(
        'textarea[placeholder="Ingrese el contenido conceptual..."]',
      ) as HTMLTextAreaElement | null;

      textarea?.focus();
    }, 0);
  };

  const handleDeleteContenido = (index: number) => {
    const nuevaLista = listaSemana.filter((_, i) => i !== index);

    setListasPorSemana((prev) => ({
      ...prev,
      [selectedSemana]: nuevaLista,
    }));

    if (editingIndex === index) {
      setEntryForm(emptyEntryForm());
      setEditingIndex(null);
    }

    toast.success("Registro eliminado de la lista");
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
    const contenidosProcedimentales =
      serializeProcedimentalesPorSemana(listasPorSemana);
    const actividadesAprendizaje =
      serializeActividadesAprendizaje(listasPorSemana);

    const totals = calculateTotals(listasPorSemana);

    const updatePayload: Partial<UpdateProgramacionBody> = {
      silaboId,
      numero: selectedUnidad,
      titulo: unidad.titulo || `Unidad ${selectedUnidad}`,
      capacidadesText: unidad.capacidadesText || "",
      semanaInicio: range[0],
      semanaFin: range[1],
      contenidosConceptuales,
      contenidosProcedimentales,
      actividadesAprendizaje,
      horasLectivasTeoria: totals.horasLectivasTeoria,
      horasLectivasPractica: totals.horasLectivasPractica,
      horasNoLectivasTeoria: totals.horasNoLectivasTeoria,
      horasNoLectivasPractica: totals.horasNoLectivasPractica,
    };

    const createBody: CreateProgramacionBody = {
      silaboId,
      numero: selectedUnidad,
      titulo: unidad.titulo || `Unidad ${selectedUnidad}`,
      capacidadesText: unidad.capacidadesText || "",
      semanaInicio: range[0],
      semanaFin: range[1],
      contenidosConceptuales,
      contenidosProcedimentales,
      actividadesAprendizaje,
      horasLectivasTeoria: totals.horasLectivasTeoria,
      horasLectivasPractica: totals.horasLectivasPractica,
      horasNoLectivasTeoria: totals.horasNoLectivasTeoria,
      horasNoLectivasPractica: totals.horasNoLectivasPractica,
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

      toast.success("Programación del contenido guardada correctamente");
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
    return (
      <Step step={4} onNextStep={handleSave}>
        <div className="bg-white rounded-2xl border border-gray-100 shadow-xl p-8">
          <div className="rounded-xl border border-blue-100 bg-blue-50 px-4 py-3 text-sm text-blue-700 flex items-center gap-2">
            <Loader2 size={18} className="animate-spin" />
            Cargando programación del contenido...
          </div>
        </div>
      </Step>
    );
  }

  return (
    <Step step={4} onNextStep={handleSave}>
      <div className="bg-white rounded-2xl border border-gray-100 shadow-xl overflow-hidden">
        <div className="px-8 py-6 border-b border-gray-100 bg-gradient-to-r from-red-50 via-white to-white">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-red-600 text-white flex items-center justify-center shadow-md">
              <span className="text-2xl font-bold">4</span>
            </div>

            <div>
              <h2 className="text-2xl font-bold text-gray-900">
                Programación del Contenido
              </h2>
              <p className="text-sm text-gray-500 mt-1">
                Organiza los contenidos conceptuales, actividades y horas por
                semana.
              </p>
            </div>

            <div className="ml-auto hidden md:flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-50 text-blue-700 border border-blue-100 text-xs font-bold">
              Planificación semanal
            </div>
          </div>
        </div>

        <div className="p-8">
          <div className="mb-7 rounded-2xl border border-gray-100 bg-gray-50 p-5">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center">
                  <BookOpen size={20} />
                </div>

                <div>
                  <h3 className="font-bold text-gray-900">
                    Asignatura seleccionada
                  </h3>
                  <p className="text-sm text-gray-600 mt-1">
                    {generalData?.nombreAsignatura ||
                      courseName ||
                      "Sin nombre de asignatura"}
                    {generalData?.codigoAsignatura || cursoCodigo
                      ? ` | COD: ${
                          generalData?.codigoAsignatura || cursoCodigo
                        }`
                      : ""}
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <div className="px-4 py-2 rounded-xl bg-white border border-gray-100 shadow-sm">
                  <p className="text-xs font-semibold text-gray-400 uppercase">
                    Unidad
                  </p>
                  <p className="text-xl font-bold text-gray-900">
                    {selectedUnidad}
                  </p>
                </div>

                <div className="px-4 py-2 rounded-xl bg-white border border-gray-100 shadow-sm">
                  <p className="text-xs font-semibold text-gray-400 uppercase">
                    Semana
                  </p>
                  <p className="text-xl font-bold text-gray-900">
                    {selectedSemana}
                  </p>
                </div>

                <div className="px-4 py-2 rounded-xl bg-white border border-gray-100 shadow-sm">
                  <p className="text-xs font-semibold text-gray-400 uppercase">
                    Registros
                  </p>
                  <p className="text-xl font-bold text-gray-900">
                    {totalContenidos}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="mb-6 bg-blue-50 rounded-2xl border border-blue-100 p-5">
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-xl bg-blue-600 text-white flex items-center justify-center shrink-0">
                <Info size={18} />
              </div>

              <div>
                <h3 className="font-bold text-blue-900">Recomendación</h3>
                <p className="text-sm text-blue-700 leading-relaxed mt-1">
                  Selecciona una semana, registra el contenido conceptual, el
                  desarrollo del tema y las horas. Luego agrégalo a la lista.
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-[460px_1fr] gap-7">
            <div className="bg-white rounded-2xl border border-gray-100 shadow-md overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-100 bg-gray-50">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-red-600 text-white flex items-center justify-center">
                    <CalendarDays size={20} />
                  </div>

                  <div>
                    <h3 className="text-lg font-bold text-gray-900">
                      Registro semanal
                    </h3>
                    <p className="text-sm text-gray-500 mt-1">
                      Completa el contenido, actividad y horas.
                    </p>
                  </div>
                </div>
              </div>

              <div className="p-6 space-y-5">
                <div>
                  <label className="block text-sm font-bold text-gray-900 mb-2">
                    Semana
                  </label>

                  <select
                    value={selectedSemana}
                    onChange={(e) => handleSemanaChange(e.target.value)}
                    className="w-full h-12 rounded-xl px-4 bg-gray-50 border border-gray-200 text-sm font-semibold text-gray-700 outline-none transition-all focus:bg-white focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  >
                    {DEFAULT_WEEKS.map((week) => (
                      <option
                        key={week.numeroSemana}
                        value={String(week.numeroSemana)}
                      >
                        Semana {week.numeroSemana}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="block text-sm font-bold text-gray-900">
                      Contenido conceptual
                    </label>

                    <span className="text-xs font-semibold text-gray-400">
                      {entryForm.contenidoConceptual.length}/400
                    </span>
                  </div>

                  <textarea
                    maxLength={400}
                    value={entryForm.contenidoConceptual}
                    onChange={(event) =>
                      updateEntryField("contenidoConceptual", event.target.value)
                    }
                    placeholder="Ingrese el contenido conceptual..."
                    className="w-full min-h-[120px] rounded-2xl px-5 py-4 bg-gray-50 border border-gray-200 text-sm text-gray-700 placeholder:text-gray-400 resize-y outline-none transition-all focus:bg-white focus:ring-2 focus:ring-red-500 focus:border-transparent"
                    rows={4}
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="block text-sm font-bold text-gray-900">
                      Desarrollo del tema / actividad
                    </label>

                    <span className="text-xs font-semibold text-gray-400">
                      {entryForm.desarrolloTema.length}/400
                    </span>
                  </div>

                  <textarea
                    maxLength={400}
                    value={entryForm.desarrolloTema}
                    onChange={(event) =>
                      updateEntryField("desarrolloTema", event.target.value)
                    }
                    placeholder="Ejemplo: Desarrollo del tema, práctica dirigida, resolución de ejercicios..."
                    className="w-full min-h-[120px] rounded-2xl px-5 py-4 bg-gray-50 border border-gray-200 text-sm text-gray-700 placeholder:text-gray-400 resize-y outline-none transition-all focus:bg-white focus:ring-2 focus:ring-red-500 focus:border-transparent"
                    rows={4}
                  />
                </div>

                <div className="rounded-2xl border border-gray-100 bg-gray-50 p-4">
                  <div className="flex items-center gap-2 mb-4">
                    <Clock size={18} className="text-red-600" />
                    <h4 className="font-bold text-gray-900">
                      Distribución de horas
                    </h4>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-gray-600 mb-2">
                        Lectivas - Teoría
                      </label>
                      <input
                        type="number"
                        min="0"
                        value={entryForm.horasLectivasTeoria}
                        onChange={(e) =>
                          updateEntryField(
                            "horasLectivasTeoria",
                            e.target.value,
                          )
                        }
                        placeholder="0"
                        className="w-full h-11 rounded-xl px-4 bg-white border border-gray-200 text-sm outline-none focus:ring-2 focus:ring-red-500"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-gray-600 mb-2">
                        Lectivas - Práctica
                      </label>
                      <input
                        type="number"
                        min="0"
                        value={entryForm.horasLectivasPractica}
                        onChange={(e) =>
                          updateEntryField(
                            "horasLectivasPractica",
                            e.target.value,
                          )
                        }
                        placeholder="0"
                        className="w-full h-11 rounded-xl px-4 bg-white border border-gray-200 text-sm outline-none focus:ring-2 focus:ring-red-500"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-gray-600 mb-2">
                        No lectivas - Teoría
                      </label>
                      <input
                        type="number"
                        min="0"
                        value={entryForm.horasNoLectivasTeoria}
                        onChange={(e) =>
                          updateEntryField(
                            "horasNoLectivasTeoria",
                            e.target.value,
                          )
                        }
                        placeholder="0"
                        className="w-full h-11 rounded-xl px-4 bg-white border border-gray-200 text-sm outline-none focus:ring-2 focus:ring-red-500"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-gray-600 mb-2">
                        No lectivas - Práctica
                      </label>
                      <input
                        type="number"
                        min="0"
                        value={entryForm.horasNoLectivasPractica}
                        onChange={(e) =>
                          updateEntryField(
                            "horasNoLectivasPractica",
                            e.target.value,
                          )
                        }
                        placeholder="0"
                        className="w-full h-11 rounded-xl px-4 bg-white border border-gray-200 text-sm outline-none focus:ring-2 focus:ring-red-500"
                      />
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleAddContenido}
                  className={`w-full h-12 rounded-xl text-white flex items-center justify-center gap-2 shadow-md transition-colors font-bold ${
                    editingIndex !== null
                      ? "bg-green-600 hover:bg-green-700"
                      : "bg-red-600 hover:bg-red-700"
                  }`}
                  title={editingIndex !== null ? "Guardar edición" : "Agregar"}
                >
                  {editingIndex !== null ? (
                    <>
                      <Check size={20} />
                      Guardar edición
                    </>
                  ) : (
                    <>
                      <Plus size={20} />
                      Agregar a la lista
                    </>
                  )}
                </button>

                {editingIndex !== null && (
                  <button
                    type="button"
                    onClick={() => {
                      setEditingIndex(null);
                      setEntryForm(emptyEntryForm());
                    }}
                    className="w-full h-10 rounded-xl bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors font-semibold"
                  >
                    Cancelar edición
                  </button>
                )}
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-gray-100 shadow-md overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-100 bg-gray-50">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-red-600 text-white flex items-center justify-center">
                      <ListChecks size={20} />
                    </div>

                    <div>
                      <h3 className="text-lg font-bold text-gray-900">
                        Lista de programación semanal
                      </h3>
                      <p className="text-sm text-gray-500 mt-1">
                        Contenidos, actividades y horas registradas.
                      </p>
                    </div>
                  </div>

                  <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-white text-gray-700 border border-gray-100">
                    Semana {selectedSemana || "1"}
                  </span>
                </div>
              </div>

              <div className="p-6 h-[520px] overflow-y-auto pr-4 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent">
                {listaSemana.length === 0 ? (
                  <div className="h-full min-h-[420px] flex flex-col items-center justify-center text-center rounded-2xl border border-dashed border-gray-200 bg-gray-50">
                    <div className="w-16 h-16 rounded-2xl bg-gray-100 flex items-center justify-center mb-4">
                      <FileText className="text-gray-400" size={30} />
                    </div>

                    <p className="text-sm font-semibold text-gray-700">
                      Aún no hay registros para esta semana.
                    </p>
                    <p className="text-xs text-gray-400 mt-1">
                      Agrega contenido, actividad y horas desde el panel
                      izquierdo.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {listaSemana.map((item, index) => {
                      const totalLectivas =
                        item.horasLectivasTeoria + item.horasLectivasPractica;
                      const totalNoLectivas =
                        item.horasNoLectivasTeoria +
                        item.horasNoLectivasPractica;

                      return (
                        <div
                          key={`${selectedSemana}-${item.contenidoConceptual}-${index}`}
                          className="rounded-2xl border border-gray-100 bg-gray-50 p-5 hover:bg-white hover:shadow-sm transition-all"
                        >
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex items-start gap-3 flex-1">
                              <div className="w-9 h-9 rounded-xl bg-red-50 text-red-700 flex items-center justify-center font-bold text-sm shrink-0">
                                {index + 1}
                              </div>

                              <div className="flex-1">
                                <p className="text-xs font-bold uppercase text-gray-400">
                                  Contenido conceptual
                                </p>
                                <p className="text-sm text-gray-800 leading-relaxed mt-1">
                                  {item.contenidoConceptual}
                                </p>

                                <p className="text-xs font-bold uppercase text-gray-400 mt-4">
                                  Desarrollo del tema / actividad
                                </p>
                                <p className="text-sm text-gray-800 leading-relaxed mt-1">
                                  {item.desarrolloTema}
                                </p>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-4">
                                  <div className="rounded-xl border border-blue-100 bg-blue-50 p-3">
                                    <p className="text-xs font-bold text-blue-700">
                                      Horas lectivas
                                    </p>
                                    <p className="text-sm text-blue-900 mt-1">
                                      Teoría: {item.horasLectivasTeoria}h /
                                      Práctica: {item.horasLectivasPractica}h
                                    </p>
                                    <p className="text-xs text-blue-700 mt-1">
                                      Total: {totalLectivas}h
                                    </p>
                                  </div>

                                  <div className="rounded-xl border border-yellow-100 bg-yellow-50 p-3">
                                    <p className="text-xs font-bold text-yellow-700">
                                      Horas no lectivas
                                    </p>
                                    <p className="text-sm text-yellow-900 mt-1">
                                      Teoría: {item.horasNoLectivasTeoria}h /
                                      Práctica: {item.horasNoLectivasPractica}h
                                    </p>
                                    <p className="text-xs text-yellow-700 mt-1">
                                      Total: {totalNoLectivas}h
                                    </p>
                                  </div>
                                </div>
                              </div>
                            </div>

                            <div className="flex gap-2 shrink-0">
                              <button
                                type="button"
                                className="w-9 h-9 flex items-center justify-center text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-xl transition-colors"
                                onClick={() => handleEditContenido(index)}
                                title="Editar"
                              >
                                <Pencil size={17} />
                              </button>

                              <button
                                type="button"
                                className="w-9 h-9 flex items-center justify-center text-red-600 bg-red-50 hover:bg-red-100 rounded-xl transition-colors"
                                onClick={() => handleDeleteContenido(index)}
                                title="Eliminar"
                              >
                                <Trash2 size={17} />
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              <div className="px-6 py-4 border-t border-gray-100 bg-gray-50">
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                  <div className="rounded-xl bg-white border border-gray-100 p-3">
                    <p className="text-xs text-gray-400 font-bold">
                      Lect. teoría
                    </p>
                    <p className="text-lg font-bold text-gray-900">
                      {totals.horasLectivasTeoria}h
                    </p>
                  </div>

                  <div className="rounded-xl bg-white border border-gray-100 p-3">
                    <p className="text-xs text-gray-400 font-bold">
                      Lect. práctica
                    </p>
                    <p className="text-lg font-bold text-gray-900">
                      {totals.horasLectivasPractica}h
                    </p>
                  </div>

                  <div className="rounded-xl bg-white border border-gray-100 p-3">
                    <p className="text-xs text-gray-400 font-bold">
                      No lect. teoría
                    </p>
                    <p className="text-lg font-bold text-gray-900">
                      {totals.horasNoLectivasTeoria}h
                    </p>
                  </div>

                  <div className="rounded-xl bg-white border border-gray-100 p-3">
                    <p className="text-xs text-gray-400 font-bold">
                      No lect. práctica
                    </p>
                    <p className="text-lg font-bold text-gray-900">
                      {totals.horasNoLectivasPractica}h
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Step>
  );
}