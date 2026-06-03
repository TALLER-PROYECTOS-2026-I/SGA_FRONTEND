import { useEffect, useMemo, useRef, useState, type MouseEvent } from "react";
import { useSearchParams } from "react-router-dom";
import { toast } from "sonner";
import { useSteps } from "../contexts/steps-context-provider";
import { useSyllabusContext } from "../contexts/syllabus-context";
import {
  useCreateProgramacion,
  useDeleteProgramacion,
  useGetProgramacion,
  useUpdateProgramacion,
} from "../hooks/fourth-step-query";
import type {
  CreateProgramacionBody,
  SemanaProgramacion,
  SemanaProgramacionApi,
  UnidadProgramacion,
} from "../hooks/fourth-step-query";
import { Step } from "./step";
import { ProgramacionStatusBadge } from "./programacion-status-badge";
import { CoordinatorCommentsBanner } from "./coordinator-comments-banner";
import { getProgramacionStatus } from "../utils/programacion-status";
import { usePermissionsContext } from "../hooks/use-permissions-context";
import { useSyllabusEditLock } from "../hooks/use-syllabus-edit-lock";
import { useReviewMode } from "../../coordinator/contexts/review-mode-context";
import { useIsDraftCreateMode } from "../create-draft/is-draft-create";
import { useCreateDraft } from "../create-draft/create-draft-context";
import {
  AlertTriangle,
  BookOpen,
  CalendarDays,
  Clock,
  Info,
  Layers,
  Loader2,
  Plus,
  Save,
  Star,
  Trash2,
} from "lucide-react";

const weekSelectButtonClass = (isSelected: boolean) =>
  isSelected
    ? "border-blue-400 bg-blue-50 text-blue-900 shadow-md ring-1 ring-blue-200"
    : "border-gray-200 bg-white text-gray-900 hover:border-blue-200 hover:bg-blue-50/40";

const weekCardClass = (isSelected: boolean) =>
  isSelected
    ? "border-blue-400 bg-blue-50 shadow-md ring-1 ring-blue-200"
    : "border-gray-200 bg-white hover:border-blue-200 hover:bg-blue-50/40";

const weekEventStarButtonClass = (esEvento: boolean) =>
  esEvento
    ? "w-9 h-9 rounded-lg flex items-center justify-center shrink-0 bg-red-500 text-white hover:bg-red-600"
    : "w-9 h-9 rounded-lg flex items-center justify-center shrink-0 bg-gray-100 text-gray-400 hover:bg-gray-200";

const EVENT_PREFIX = "[EVENTO]";

function encodeActividadSemana(semana: SemanaProgramacion) {
  if (semana.esEvento) {
    const descripcion = semana.eventoDescripcion?.trim() || "Evento especial";
    return `${EVENT_PREFIX} ${descripcion}`;
  }

  return semana.actividadesAprendizaje?.trim() || "";
}

function decodeEventoFromActividad(value: unknown) {
  const text = String(value ?? "").trim();

  if (text.startsWith(EVENT_PREFIX)) {
    return {
      esEvento: true,
      eventoDescripcion:
        text.replace(EVENT_PREFIX, "").trim() || "Evento especial",
      actividadesAprendizaje: "",
    };
  }

  return {
    esEvento: false,
    eventoDescripcion: "",
    actividadesAprendizaje: text,
  };
}

function mapSemanaToApiPayload(semana: SemanaProgramacion): SemanaProgramacionApi {
  return {
    semana: semana.semana,
    contenidosConceptuales: semana.esEvento
      ? ""
      : semana.contenidosConceptuales.trim(),
    contenidosProcedimentales: semana.esEvento
      ? ""
      : semana.contenidosProcedimentales.trim(),
    actividadesAprendizaje: encodeActividadSemana(semana),
    horasLectivasTeoria: semana.esEvento
      ? 0
      : Number(semana.horasLectivasTeoria ?? 0),
    horasLectivasPractica: semana.esEvento
      ? 0
      : Number(semana.horasLectivasPractica ?? 0),
    horasNoLectivasTeoria: semana.esEvento
      ? 0
      : Number(semana.horasNoLectivasTeoria ?? 0),
    horasNoLectivasPractica: semana.esEvento
      ? 0
      : Number(semana.horasNoLectivasPractica ?? 0),
  };
}

function toRoman(num: number) {
  const romans: Record<number, string> = {
    1: "I",
    2: "II",
    3: "III",
    4: "IV",
  };

  return romans[num] ?? String(num);
}

function formatWeekLabel(semana: number) {
  return `Semana ${String(semana).padStart(2, "0")}`;
}

function getUnidadLabel(unidad: UnidadProgramacion) {
  const roman = toRoman(unidad.numero);
  const titulo = unidad.titulo?.trim();

  return titulo ? `Unidad ${roman} - ${titulo}` : `Unidad ${roman}`;
}

function getAllWeekNumbers(unidades: UnidadProgramacion[]) {
  return unidades.flatMap((unidad) =>
    unidad.semanas.map((semana) => Number(semana.semana)),
  );
}

function getNextWeekNumber(unidades: UnidadProgramacion[]) {
  const used = getAllWeekNumbers(unidades);
  const max = used.length > 0 ? Math.max(...used) : 0;
  const next = max + 1;

  return next <= 16 ? next : null;
}

function createEmptyWeek(semana: number): SemanaProgramacion {
  return {
    semana,
    contenidosConceptuales: "",
    contenidosProcedimentales: "",
    actividadesAprendizaje: "",
    horasLectivasTeoria: 0,
    horasLectivasPractica: 0,
    horasNoLectivasTeoria: 0,
    horasNoLectivasPractica: 0,
    esEvento: false,
    eventoDescripcion: "",
  };
}

function createEmptyUnidad(numero: number): UnidadProgramacion {
  return {
    numero,
    titulo: "",
    capacidadesText: "",
    semanas: [],
  };
}

function normalizeUnitsFromApi(data: unknown[]): UnidadProgramacion[] {
  if (!Array.isArray(data) || data.length === 0) {
    return [createEmptyUnidad(1)];
  }

  return data
    .map((raw, index) => {
      const unidad = raw as Record<string, unknown>;
      const rawSemanas = Array.isArray(unidad.semanas) ? unidad.semanas : [];

      const semanas = rawSemanas
        .map((rawSemana) => {
          const semanaItem = rawSemana as Record<string, unknown>;
          const decodedEvento = decodeEventoFromActividad(
            semanaItem.actividadesAprendizaje ?? semanaItem.actividad ?? "",
          );

          return {
            id: semanaItem.id as number | string | undefined,
            semana: Number(
              semanaItem.semana ??
                semanaItem.numeroSemana ??
                semanaItem.numero ??
                0,
            ),
            contenidosConceptuales: String(
              semanaItem.contenidosConceptuales ??
                semanaItem.contenidoConceptual ??
                "",
            ),
            contenidosProcedimentales: String(
              semanaItem.contenidosProcedimentales ??
                semanaItem.desarrolloTema ??
                "",
            ),
            actividadesAprendizaje: decodedEvento.actividadesAprendizaje,
            esEvento: decodedEvento.esEvento,
            eventoDescripcion: decodedEvento.eventoDescripcion,
            horasLectivasTeoria: Number(semanaItem.horasLectivasTeoria ?? 0),
            horasLectivasPractica: Number(
              semanaItem.horasLectivasPractica ?? 0,
            ),
            horasNoLectivasTeoria: Number(
              semanaItem.horasNoLectivasTeoria ?? 0,
            ),
            horasNoLectivasPractica: Number(
              semanaItem.horasNoLectivasPractica ?? 0,
            ),
          };
        })
        .filter((semana) => semana.semana > 0)
        .sort((a, b) => a.semana - b.semana);

      const fallbackConceptual = String(unidad.contenidosConceptuales ?? "");
      const fallbackProcedimental = String(
        unidad.contenidosProcedimentales ?? "",
      );
      const fallbackActividad = String(unidad.actividadesAprendizaje ?? "");

      if (
        semanas.length === 0 &&
        (fallbackConceptual || fallbackProcedimental || fallbackActividad)
      ) {
        const inicio = Number(unidad.semanaInicio ?? 1);
        const decodedFallback = decodeEventoFromActividad(fallbackActividad);

        semanas.push({
          id: undefined,
          semana: inicio > 0 ? inicio : 1,
          contenidosConceptuales: fallbackConceptual,
          contenidosProcedimentales: fallbackProcedimental,
          actividadesAprendizaje: decodedFallback.actividadesAprendizaje,
          esEvento: decodedFallback.esEvento,
          eventoDescripcion: decodedFallback.eventoDescripcion,
          horasLectivasTeoria: Number(unidad.horasLectivasTeoria ?? 0),
          horasLectivasPractica: Number(unidad.horasLectivasPractica ?? 0),
          horasNoLectivasTeoria: Number(unidad.horasNoLectivasTeoria ?? 0),
          horasNoLectivasPractica: Number(
            unidad.horasNoLectivasPractica ?? 0,
          ),
        });
      }

      return {
        id: unidad.id as number | string | undefined,
        numero: Number(unidad.numero ?? index + 1),
        titulo: String(unidad.titulo ?? "").trim(),
        capacidadesText: String(
          unidad.capacidadesText ??
            unidad.capacidad ??
            unidad.capacidades ??
            "",
        ).trim(),
        semanaInicio: semanas[0]?.semana ?? (unidad.semanaInicio as number) ?? null,
        semanaFin:
          semanas[semanas.length - 1]?.semana ??
          (unidad.semanaFin as number) ??
          null,
        semanas,
      };
    })
    .sort((a, b) => a.numero - b.numero);
}

export function validateUnidadesBeforeSave(unidades: UnidadProgramacion[]) {
  if (!unidades.length) {
    throw new Error("Debe registrar al menos una unidad.");
  }

  const unidadesConSemanas = unidades.filter(
    (unidad) => unidad.semanas.length > 0,
  );

  if (!unidadesConSemanas.length) {
    throw new Error("Debe registrar al menos una semana en la programación.");
  }

  const usedWeeks = new Set<number>();

  unidadesConSemanas.forEach((unidad) => {
    if (!unidad.titulo.trim()) {
      throw new Error(`Ingrese el nombre de la unidad ${unidad.numero}.`);
    }

    if (!unidad.capacidadesText.trim()) {
      throw new Error(`Ingrese la capacidad de la unidad ${unidad.numero}.`);
    }

    unidad.semanas.forEach((semana) => {
      if (usedWeeks.has(semana.semana)) {
        throw new Error(`La semana ${semana.semana} está duplicada.`);
      }

      usedWeeks.add(semana.semana);

      if (semana.esEvento) {
        if (!semana.eventoDescripcion?.trim()) {
          throw new Error(
            `Ingrese la descripción del evento en la semana ${semana.semana}.`,
          );
        }
        return;
      }

      if (!semana.contenidosConceptuales.trim()) {
        throw new Error(
          `Ingrese el contenido conceptual de la semana ${semana.semana}.`,
        );
      }

      if (!semana.contenidosProcedimentales.trim()) {
        throw new Error(
          `Ingrese el contenido procedimental de la semana ${semana.semana}.`,
        );
      }

      if (!semana.actividadesAprendizaje.trim()) {
        throw new Error(
          `Ingrese las actividades de aprendizaje de la semana ${semana.semana}.`,
        );
      }

      const horas = [
        semana.horasLectivasTeoria,
        semana.horasLectivasPractica,
        semana.horasNoLectivasTeoria,
        semana.horasNoLectivasPractica,
      ];

      horas.forEach((hora) => {
        if (
          !Number.isFinite(Number(hora)) ||
          Number(hora) < 0 ||
          Number(hora) > 24
        ) {
          throw new Error(`Revise las horas de la semana ${semana.semana}.`);
        }
      });

      const totalHoras = horas.reduce(
        (acc, hora) => acc + Number(hora || 0),
        0,
      );

      if (totalHoras <= 0) {
        throw new Error(
          `Ingrese al menos una hora en la semana ${semana.semana}.`,
        );
      }
    });
  });
}

export function buildPayloadFromUnidad(
  silaboId: number,
  unidad: UnidadProgramacion,
): CreateProgramacionBody {
  const semanasOrdenadas = [...unidad.semanas].sort(
    (a, b) => a.semana - b.semana,
  );

  const semanaInicio = semanasOrdenadas[0]?.semana;
  const semanaFin = semanasOrdenadas[semanasOrdenadas.length - 1]?.semana;

  const totals = semanasOrdenadas.reduce(
    (acc, semana) => {
      if (semana.esEvento) return acc;

      return {
        horasLectivasTeoria:
          acc.horasLectivasTeoria + Number(semana.horasLectivasTeoria || 0),
        horasLectivasPractica:
          acc.horasLectivasPractica + Number(semana.horasLectivasPractica || 0),
        horasNoLectivasTeoria:
          acc.horasNoLectivasTeoria + Number(semana.horasNoLectivasTeoria || 0),
        horasNoLectivasPractica:
          acc.horasNoLectivasPractica +
          Number(semana.horasNoLectivasPractica || 0),
      };
    },
    {
      horasLectivasTeoria: 0,
      horasLectivasPractica: 0,
      horasNoLectivasTeoria: 0,
      horasNoLectivasPractica: 0,
    },
  );

  const contenidosConceptuales = semanasOrdenadas
    .map((semana) => {
      if (semana.esEvento) return "";

      const text = semana.contenidosConceptuales.trim();
      return text ? `${formatWeekLabel(semana.semana)}:\n${text}` : "";
    })
    .filter(Boolean)
    .join("\n\n");

  const contenidosProcedimentales = semanasOrdenadas
    .map((semana) => {
      if (semana.esEvento) return "";

      const text = semana.contenidosProcedimentales.trim();
      return text ? `${formatWeekLabel(semana.semana)}:\n${text}` : "";
    })
    .filter(Boolean)
    .join("\n\n");

  const actividadesAprendizaje = semanasOrdenadas
    .map((semana) => {
      const encoded = encodeActividadSemana(semana);
      return encoded ? `${formatWeekLabel(semana.semana)}:\n${encoded}` : "";
    })
    .filter(Boolean)
    .join("\n\n");

  return {
    silaboId,
    numero: unidad.numero,
    titulo: unidad.titulo.trim() || `Unidad ${unidad.numero}`,
    capacidadesText: unidad.capacidadesText.trim(),
    semanaInicio,
    semanaFin,
    contenidosConceptuales,
    contenidosProcedimentales,
    actividadesAprendizaje,
    ...totals,
    semanas: semanasOrdenadas.map((semana) => mapSemanaToApiPayload(semana)),
  };
}

export default function FourthStep() {
  const { cursoCodigo, syllabusId, courseName, generalData } =
    useSyllabusContext();
  const { nextStep } = useSteps();
  const { isDraftCreateMode } = useIsDraftCreateMode();
  const { draft, setFourthStepData } = useCreateDraft();
  const [searchParams] = useSearchParams();
  const {
    hasEditPermissionForSection,
    getCommentsForSection,
    isDisapprovedCorrection,
  } = usePermissionsContext();
  const coordinatorComments = getCommentsForSection(4);
  const { isReviewMode } = useReviewMode();

  const resolvedSyllabusId = useMemo(() => {
    const querySyllabusId = searchParams.get("syllabusId");
    if (querySyllabusId) {
      const parsed = Number(querySyllabusId);
      if (Number.isFinite(parsed) && parsed > 0) return parsed;
    }

    const fromContext = Number(syllabusId);
    if (Number.isFinite(fromContext) && fromContext > 0) {
      return fromContext;
    }

    const params = new URLSearchParams(window.location.search);
    const fromQuery = Number(params.get("syllabusId") || params.get("id"));

    if (Number.isFinite(fromQuery) && fromQuery > 0) {
      return fromQuery;
    }

    return null;
  }, [syllabusId, searchParams]);

  const { isLockedByState, isResolvingState } = useSyllabusEditLock(
    resolvedSyllabusId,
  );

  const canEdit =
    !isReviewMode &&
    hasEditPermissionForSection(4) &&
    !isLockedByState &&
    !isResolvingState;

  const querySyllabusId =
    isDraftCreateMode || !resolvedSyllabusId
      ? null
      : String(resolvedSyllabusId);

  const { data, isLoading, isFetching } = useGetProgramacion(querySyllabusId);

  const createProgramacion = useCreateProgramacion();
  const updateProgramacion = useUpdateProgramacion();
  const deleteProgramacion = useDeleteProgramacion();

  const [unidades, setUnidades] = useState<UnidadProgramacion[]>([
    createEmptyUnidad(1),
  ]);
  const [selectedUnidadIndex, setSelectedUnidadIndex] = useState(0);
  const [selectedSemanaIndex, setSelectedSemanaIndex] = useState<number | null>(
    null,
  );
  const loadedUnitIdsRef = useRef<Set<number>>(new Set());
  const hasHydratedDraftRef = useRef(false);

  const progBusy =
    createProgramacion.isPending ||
    updateProgramacion.isPending ||
    deleteProgramacion.isPending;

  const inputsDisabled =
    !canEdit ||
    progBusy ||
    (!isDraftCreateMode && (isLoading || isFetching));

  const selectedUnidad = unidades[selectedUnidadIndex];
  const selectedSemana =
    selectedSemanaIndex !== null && selectedUnidad
      ? selectedUnidad.semanas[selectedSemanaIndex]
      : null;

  const nextWeekAvailable = getNextWeekNumber(unidades);
  const totalSemanas = getAllWeekNumbers(unidades).length;
  const programacionStatus = useMemo(
    () => getProgramacionStatus(unidades),
    [unidades],
  );

  useEffect(() => {
    if (!isDraftCreateMode || hasHydratedDraftRef.current) return;

    if (draft.unidades?.length) {
      setUnidades(draft.unidades);
      setSelectedUnidadIndex(0);
      setSelectedSemanaIndex(null);
      hasHydratedDraftRef.current = true;
    }
  }, [isDraftCreateMode, draft.unidades]);

  useEffect(() => {
    if (isDraftCreateMode) return;
    if (isLoading || isFetching) return;

    const normalized = normalizeUnitsFromApi(data ?? []);
    setUnidades(normalized);
    setSelectedUnidadIndex(0);
    setSelectedSemanaIndex(null);
    loadedUnitIdsRef.current = new Set(
      normalized
        .map((u) => Number(u.id))
        .filter((id) => Number.isFinite(id) && id > 0),
    );
  }, [data, isLoading, isFetching, isDraftCreateMode]);

  const updateUnidades = (
    updater: (prev: UnidadProgramacion[]) => UnidadProgramacion[],
  ) => {
    if (!canEdit) return;
    setUnidades(updater);
  };

  const selectSemana = (unidadIndex: number, semanaIndex: number) => {
    setSelectedUnidadIndex(unidadIndex);
    setSelectedSemanaIndex(semanaIndex);
  };

  const updateSemanaEvento = (
    unidadIndex: number,
    semanaIndex: number,
    esEvento: boolean,
    eventoDescripcion: string,
  ) => {
    updateUnidades((prev) => {
      const copy = [...prev];
      const unidad = { ...copy[unidadIndex] };
      const semanas = [...unidad.semanas];
      semanas[semanaIndex] = {
        ...semanas[semanaIndex],
        esEvento,
        eventoDescripcion,
      };
      unidad.semanas = semanas;
      copy[unidadIndex] = unidad;
      return copy;
    });
  };

  const toggleSemanaEvento = (
    unidadIndex: number,
    semanaIndex: number,
    e: MouseEvent<HTMLButtonElement>,
  ) => {
    e.stopPropagation();
    if (!canEdit || inputsDisabled) return;

    const semana = unidades[unidadIndex]?.semanas[semanaIndex];
    if (!semana) return;

    if (!semana.esEvento) {
      const desc = window.prompt(
        "Descripción del evento especial:",
        semana.eventoDescripcion || "",
      );
      if (desc === null) return;
      const trimmed = desc.trim();
      if (!trimmed) {
        toast.error("Ingrese la descripción del evento.");
        return;
      }
      updateSemanaEvento(unidadIndex, semanaIndex, true, trimmed);
      return;
    }

    updateSemanaEvento(unidadIndex, semanaIndex, false, "");
  };

  const handleAddUnidad = () => {
    if (!canEdit) return;

    const last = unidades[unidades.length - 1];

    if (last && unidades.length > 0) {
      if (last.semanas.length > 0 && !last.titulo.trim()) {
        toast.error(
          "Ingrese el nombre de la unidad anterior antes de agregar otra.",
        );
        return;
      }

      if (last.semanas.length > 0 && !last.capacidadesText.trim()) {
        toast.error(
          "Ingrese la capacidad de la unidad anterior antes de agregar otra.",
        );
        return;
      }

      if (last.semanas.length === 0) {
        toast.error("Agregue al menos una semana a la unidad anterior.");
        return;
      }
    }

    const nextNumero = unidades.length + 1;
    const newUnidad = createEmptyUnidad(nextNumero);

    setUnidades((prev) => [...prev, newUnidad]);
    setSelectedUnidadIndex(unidades.length);
    setSelectedSemanaIndex(null);
  };

  const handleDeleteUnidad = async (index: number) => {
    if (!canEdit) return;

    const unidad = unidades[index];

    if (unidades.length === 1) {
      const hasData =
        unidad.titulo.trim().length > 0 ||
        unidad.capacidadesText.trim().length > 0 ||
        unidad.semanas.length > 0;

      if (hasData) {
        const confirmed = window.confirm(
          "¿Deseas eliminar esta unidad y todas sus semanas?",
        );
        if (!confirmed) return;
      }

      if (unidad.id && resolvedSyllabusId) {
        try {
          await deleteProgramacion.mutateAsync({
            silaboId: resolvedSyllabusId,
            unidadId: unidad.id,
          });
          loadedUnitIdsRef.current.delete(Number(unidad.id));
        } catch (error) {
          toast.error(
            error instanceof Error
              ? error.message
              : "Error al eliminar la unidad",
          );
          return;
        }
      }

      setUnidades([createEmptyUnidad(1)]);
      setSelectedUnidadIndex(0);
      setSelectedSemanaIndex(null);
      return;
    }

    const confirmed = window.confirm(
      "¿Deseas eliminar esta unidad y todas sus semanas?",
    );

    if (!confirmed) return;

    if (unidad.id && resolvedSyllabusId) {
      try {
        await deleteProgramacion.mutateAsync({
          silaboId: resolvedSyllabusId,
          unidadId: unidad.id,
        });
        loadedUnitIdsRef.current.delete(Number(unidad.id));
      } catch (error) {
        toast.error(
          error instanceof Error ? error.message : "Error al eliminar la unidad",
        );
        return;
      }
    }

    const next = unidades
      .filter((_, i) => i !== index)
      .map((item, i) => ({
        ...item,
        numero: i + 1,
      }));

    const newSelected = Math.min(selectedUnidadIndex, next.length - 1);

    setUnidades(next);
    setSelectedUnidadIndex(newSelected);
    setSelectedSemanaIndex(null);
  };

  const handleAddSemana = () => {
    if (!canEdit || !selectedUnidad) return;

    const next = getNextWeekNumber(unidades);

    if (next === null) {
      toast.error("Ya se registraron las 16 semanas.");
      return;
    }

    if (!selectedUnidad.titulo.trim()) {
      toast.error("Ingrese el nombre de la unidad antes de agregar semanas.");
      return;
    }

    if (!selectedUnidad.capacidadesText.trim()) {
      toast.error("Ingrese la capacidad de la unidad antes de agregar semanas.");
      return;
    }

    const newIndex = selectedUnidad.semanas.length;

    updateUnidades((prev) => {
      const copy = [...prev];
      const unidad = { ...copy[selectedUnidadIndex] };
      unidad.semanas = [...unidad.semanas, createEmptyWeek(next)];
      copy[selectedUnidadIndex] = unidad;
      return copy;
    });

    setSelectedSemanaIndex(newIndex);
  };

  const handleDeleteSemana = (unidadIndex: number, semanaIndex: number) => {
    if (!canEdit) return;

    const confirmed = window.confirm("¿Deseas eliminar esta semana?");

    if (!confirmed) return;

    updateUnidades((prev) => {
      const copy = [...prev];
      const unidad = { ...copy[unidadIndex] };
      unidad.semanas = unidad.semanas.filter((_, i) => i !== semanaIndex);
      copy[unidadIndex] = unidad;
      return copy;
    });

    if (
      unidadIndex === selectedUnidadIndex &&
      selectedSemanaIndex === semanaIndex
    ) {
      setSelectedSemanaIndex(null);
    } else if (
      unidadIndex === selectedUnidadIndex &&
      selectedSemanaIndex !== null &&
      selectedSemanaIndex > semanaIndex
    ) {
      setSelectedSemanaIndex(selectedSemanaIndex - 1);
    }
  };

  const updateUnidadTitulo = (value: string) => {
    if (!canEdit) return;

    setUnidades((prev) => {
      const next = [...prev];
      const unidad = { ...next[selectedUnidadIndex] };
      unidad.titulo = value.slice(0, 120);
      next[selectedUnidadIndex] = unidad;
      return next;
    });
  };

  const updateUnidadCapacidad = (value: string) => {
    if (!canEdit) return;

    setUnidades((prev) => {
      const next = [...prev];
      const unidad = { ...next[selectedUnidadIndex] };
      unidad.capacidadesText = value.slice(0, 1000);
      next[selectedUnidadIndex] = unidad;
      return next;
    });
  };

  const handleGuardarCapacidad = () => {
    if (!canEdit || !selectedUnidad) return;

    if (!selectedUnidad.titulo.trim()) {
      toast.error(
        `Ingrese el nombre de la unidad ${selectedUnidad.numero}.`,
      );
      return;
    }

    if (!selectedUnidad.capacidadesText.trim()) {
      toast.error(
        `Ingrese la capacidad de la unidad ${selectedUnidad.numero}.`,
      );
      return;
    }

    toast.success("Datos de la unidad guardados");
  };

  const handleUnidadSelectChange = (index: number) => {
    setSelectedUnidadIndex(index);
    setSelectedSemanaIndex(null);
  };

  const updateSelectedSemanaField = <K extends keyof SemanaProgramacion>(
    field: K,
    value: SemanaProgramacion[K],
  ) => {
    if (selectedSemanaIndex === null) return;

    updateUnidades((prev) => {
      const copy = [...prev];
      const unidad = { ...copy[selectedUnidadIndex] };
      const semanas = [...unidad.semanas];
      semanas[selectedSemanaIndex] = {
        ...semanas[selectedSemanaIndex],
        [field]: value,
      };
      unidad.semanas = semanas;
      copy[selectedUnidadIndex] = unidad;
      return copy;
    });
  };

  const handleSaveSemana = () => {
    if (!canEdit || !selectedSemana) return;

    try {
      if (selectedSemana.esEvento) {
        if (!selectedSemana.eventoDescripcion?.trim()) {
          throw new Error("Ingrese la descripción del evento especial.");
        }
      } else {
        if (!selectedSemana.contenidosConceptuales.trim()) {
          throw new Error("Ingrese el contenido conceptual.");
        }

        if (!selectedSemana.contenidosProcedimentales.trim()) {
          throw new Error("Ingrese el contenido procedimental.");
        }

        if (!selectedSemana.actividadesAprendizaje.trim()) {
          throw new Error("Ingrese las actividades de aprendizaje.");
        }

        const horas = [
          selectedSemana.horasLectivasTeoria,
          selectedSemana.horasLectivasPractica,
          selectedSemana.horasNoLectivasTeoria,
          selectedSemana.horasNoLectivasPractica,
        ];

        horas.forEach((hora) => {
          if (
            !Number.isFinite(Number(hora)) ||
            Number(hora) < 0 ||
            Number(hora) > 24
          ) {
            throw new Error("Revise las horas (0 a 24 por campo).");
          }
        });

        const total = horas.reduce((acc, h) => acc + Number(h || 0), 0);

        if (total <= 0) {
          throw new Error("Ingrese al menos una hora.");
        }
      }

      toast.success(`${formatWeekLabel(selectedSemana.semana)} guardada`);
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Revise los datos de la semana",
      );
    }
  };

  const persistProgramacion = async () => {
    if (!canEdit) {
      throw new Error("No tienes permiso para editar esta sección.");
    }

    if (!resolvedSyllabusId) {
      throw new Error(
        "Id del sílabo no encontrado. Completa el primer paso antes de continuar.",
      );
    }

    validateUnidadesBeforeSave(unidades);

    const unidadesAGuardar = unidades.filter((u) => u.semanas.length > 0);
    const currentIds = new Set<number>();

    for (const unidad of unidadesAGuardar) {
      const payload = buildPayloadFromUnidad(resolvedSyllabusId, unidad);

      if (unidad.id) {
        await updateProgramacion.mutateAsync({
          id: String(unidad.id),
          payload,
        });
        currentIds.add(Number(unidad.id));
      } else {
        const created = await createProgramacion.mutateAsync(payload);
        const createdId = Number(created?.id);
        if (Number.isFinite(createdId) && createdId > 0) {
          currentIds.add(createdId);
        }
      }
    }

    const toDelete = [...loadedUnitIdsRef.current].filter(
      (id) => !currentIds.has(id),
    );

    for (const id of toDelete) {
      await deleteProgramacion.mutateAsync({
        silaboId: resolvedSyllabusId,
        unidadId: id,
      });
    }

    loadedUnitIdsRef.current = currentIds;
  };

  const handleSave = async () => {
    if (!canEdit) {
      nextStep();
      return;
    }

    if (isDraftCreateMode) {
      try {
        validateUnidadesBeforeSave(unidades);
        setFourthStepData(unidades);
        nextStep();
      } catch (error) {
        toast.error(
          error instanceof Error
            ? error.message
            : "Revise la programación antes de continuar",
        );
      }
      return;
    }

    try {
      await persistProgramacion();
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

  const disabledInputClass =
    "disabled:bg-gray-100 disabled:text-gray-500 disabled:cursor-not-allowed disabled:opacity-70";

  if ((!isDraftCreateMode && isLoading) || isResolvingState) {
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
                Organiza unidades dinámicas y el contenido por semana.
              </p>
              <div className="mt-3 md:hidden">
                <ProgramacionStatusBadge status={programacionStatus} />
              </div>
            </div>
            <div className="ml-auto hidden md:flex flex-col items-end gap-2">
              <ProgramacionStatusBadge status={programacionStatus} />
              <span className="text-xs font-semibold text-gray-500">
                Unidades y semanas
              </span>
            </div>
          </div>
        </div>

        <div className="p-8">
          <CoordinatorCommentsBanner
            stepNumber={4}
            comments={coordinatorComments}
          />

          {!canEdit && (
            <div className="mb-6 rounded-2xl border border-yellow-200 bg-yellow-50 p-5 flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-yellow-500 text-white flex items-center justify-center shrink-0">
                <AlertTriangle size={20} />
              </div>
              <div>
                <p className="text-sm font-bold text-yellow-800">
                  Modo solo lectura
                </p>
                <p className="text-sm text-yellow-700 mt-1">
                  {isReviewMode
                    ? "Estás revisando este paso en modo coordinador. Puedes consultar la programación, pero no modificarla."
                    : isDisapprovedCorrection
                      ? "Esta sección no tiene observaciones del coordinador, por eso permanece bloqueada."
                      : "No tienes permiso para editar esta sección. Puedes revisar la programación del contenido, pero no modificarla."}
                </p>
              </div>
            </div>
          )}

          <div className="mb-7 rounded-2xl border border-gray-100 bg-gray-50 p-5">
            <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center shrink-0">
                  <BookOpen size={20} />
                </div>
                <div>
                  <h3 className="font-bold text-gray-900">
                    Resumen de la asignatura
                  </h3>
                  <p className="text-sm text-gray-600 mt-1">
                    {generalData?.nombreAsignatura ||
                      courseName ||
                      "Sin nombre de asignatura"}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    Código:{" "}
                    {generalData?.codigoAsignatura ||
                      cursoCodigo ||
                      "—"}
                    {generalData?.programaAcademico
                      ? ` · ${generalData.programaAcademico}`
                      : ""}
                    {generalData?.semestreAcademico
                      ? ` · ${generalData.semestreAcademico}`
                      : ""}
                  </p>
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <div className="px-4 py-2 rounded-xl bg-white border border-gray-100 shadow-sm">
                  <p className="text-xs font-semibold text-gray-400 uppercase">
                    Unidades
                  </p>
                  <p className="text-xl font-bold text-gray-900">
                    {unidades.length}
                  </p>
                </div>
                <div className="px-4 py-2 rounded-xl bg-white border border-gray-100 shadow-sm">
                  <p className="text-xs font-semibold text-gray-400 uppercase">
                    Semanas
                  </p>
                  <p className="text-xl font-bold text-gray-900">
                    {totalSemanas}
                  </p>
                </div>
                <div className="px-4 py-2 rounded-xl bg-white border border-gray-100 shadow-sm">
                  <p className="text-xs font-semibold text-gray-400 uppercase">
                    Máximo
                  </p>
                  <p className="text-xl font-bold text-gray-900">16</p>
                </div>
                <div className="px-4 py-2 rounded-xl bg-white border border-gray-100 shadow-sm min-w-[140px]">
                  <p className="text-xs font-semibold text-gray-400 uppercase mb-1">
                    Estado
                  </p>
                  <ProgramacionStatusBadge
                    status={programacionStatus}
                    showDot={false}
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="mb-7 rounded-2xl border border-blue-100 bg-blue-50 p-5 flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center shrink-0">
              <Info size={20} />
            </div>
            <div>
              <h3 className="font-bold text-gray-900">Recomendación</h3>
              <p className="text-sm text-blue-800 mt-1">
                Seleccione una unidad, registre su capacidad y agregue semanas
                con contenido conceptual, desarrollo del tema y horas. Los datos
                se guardan al avanzar con Siguiente.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-[360px_1fr] gap-6">
            <div className="space-y-4">
              <button
                type="button"
                onClick={handleAddUnidad}
                disabled={inputsDisabled}
                className={`w-full h-11 rounded-xl bg-red-600 text-white text-sm font-bold flex items-center justify-center gap-2 shadow-sm transition-all hover:bg-red-700 ${disabledInputClass}`}
              >
                <Plus size={18} />
                Agregar unidad
              </button>

              {selectedUnidad && (
                <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-md">
                  <div className="flex items-start justify-between gap-3 mb-5">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-red-600 text-white flex items-center justify-center shrink-0">
                        <CalendarDays size={20} />
                      </div>
                      <div>
                        <h3 className="text-lg font-bold text-gray-900">
                          Registro semanal
                        </h3>
                        <p className="text-xs text-gray-500 mt-0.5">
                          Unidad, nombre, capacidad y semanas
                        </p>
                      </div>
                    </div>
                    <ProgramacionStatusBadge status={programacionStatus} />
                  </div>

                  <div className="space-y-5">
                    <div>
                      <label className="block text-sm font-bold text-gray-900 mb-2">
                        Unidad
                      </label>
                      <select
                        value={selectedUnidadIndex}
                        onChange={(e) =>
                          handleUnidadSelectChange(Number(e.target.value))
                        }
                        disabled={inputsDisabled && !isReviewMode}
                        className={`w-full h-12 rounded-xl px-4 bg-gray-50 border border-gray-200 text-sm font-semibold text-gray-700 outline-none transition-all focus:bg-white focus:ring-2 focus:ring-red-500 focus:border-transparent ${disabledInputClass}`}
                      >
                        {unidades.map((unidad, uIdx) => (
                          <option key={`unidad-opt-${uIdx}`} value={uIdx}>
                            {getUnidadLabel(unidad)}
                          </option>
                        ))}
                      </select>
                      {canEdit && unidades.length > 1 && (
                        <button
                          type="button"
                          onClick={() => void handleDeleteUnidad(selectedUnidadIndex)}
                          disabled={inputsDisabled}
                          className={`mt-2 text-xs font-semibold text-red-600 hover:text-red-700 disabled:opacity-50 ${disabledInputClass}`}
                        >
                          Eliminar unidad seleccionada
                        </button>
                      )}
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <label className="block text-sm font-bold text-gray-900">
                          Nombre de la unidad
                        </label>
                        <span className="text-xs font-semibold text-gray-400">
                          {selectedUnidad.titulo.length}/120
                        </span>
                      </div>
                      <input
                        type="text"
                        value={selectedUnidad.titulo}
                        onChange={(e) => updateUnidadTitulo(e.target.value)}
                        maxLength={120}
                        placeholder="Ejemplo: Gestión de recursos de TI"
                        disabled={inputsDisabled}
                        className={`w-full h-12 rounded-xl px-4 bg-gray-50 border border-gray-200 text-sm text-gray-700 placeholder:text-gray-400 outline-none transition-all focus:bg-white focus:ring-2 focus:ring-red-500 focus:border-transparent ${disabledInputClass}`}
                      />
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <label className="block text-sm font-bold text-gray-900">
                          Capacidad
                        </label>
                        <span className="text-xs font-semibold text-gray-400">
                          {selectedUnidad.capacidadesText.length}/1000
                        </span>
                      </div>
                      <textarea
                        value={selectedUnidad.capacidadesText}
                        onChange={(e) => updateUnidadCapacidad(e.target.value)}
                        maxLength={1000}
                        placeholder="Ingrese la capacidad de la unidad..."
                        disabled={inputsDisabled}
                        rows={5}
                        className={`w-full min-h-[120px] rounded-xl px-4 py-3 bg-gray-50 border border-gray-200 text-sm text-gray-700 placeholder:text-gray-400 resize-y outline-none transition-all focus:bg-white focus:ring-2 focus:ring-red-500 focus:border-transparent ${disabledInputClass}`}
                      />
                      <button
                        type="button"
                        onClick={handleGuardarCapacidad}
                        disabled={inputsDisabled}
                        className={`mt-2 text-sm font-bold text-blue-600 hover:text-blue-700 disabled:opacity-50 disabled:cursor-not-allowed ${disabledInputClass}`}
                      >
                        Guardar
                      </button>
                    </div>

                    <button
                      type="button"
                      onClick={handleAddSemana}
                      disabled={
                        inputsDisabled ||
                        nextWeekAvailable === null ||
                        !selectedUnidad.titulo.trim() ||
                        !selectedUnidad.capacidadesText.trim()
                      }
                      className={`w-full h-12 rounded-xl text-sm font-bold flex items-center justify-center gap-2 shadow-sm transition-all ${
                        inputsDisabled ||
                        nextWeekAvailable === null ||
                        !selectedUnidad.titulo.trim() ||
                        !selectedUnidad.capacidadesText.trim()
                          ? "bg-gray-200 text-gray-500 cursor-not-allowed"
                          : "bg-red-600 text-white hover:bg-red-700"
                      } ${disabledInputClass}`}
                    >
                      <Plus size={18} />
                      Agregar semana
                      {nextWeekAvailable === null
                        ? " (Máximo alcanzado)"
                        : nextWeekAvailable !== null
                          ? ` (${formatWeekLabel(nextWeekAvailable)})`
                          : ""}
                    </button>

                    <div>
                      <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">
                        Semanas en esta unidad
                      </p>
                      {selectedUnidad.semanas.length === 0 ? (
                        <p className="text-xs text-gray-400 px-2 py-3 rounded-xl border border-dashed border-gray-200 bg-gray-50 text-center">
                          Sin semanas registradas
                        </p>
                      ) : (
                        <div className="space-y-2">
                          {selectedUnidad.semanas.map((semana, sIdx) => {
                            const isSelectedSemana = selectedSemanaIndex === sIdx;

                            return (
                              <div
                                key={`semana-${semana.semana}-${sIdx}`}
                                className="flex items-center gap-1"
                              >
                                <button
                                  type="button"
                                  onClick={() =>
                                    selectSemana(selectedUnidadIndex, sIdx)
                                  }
                                  disabled={progBusy}
                                  className={`flex-1 rounded-xl border px-4 py-3 text-left transition-all ${weekSelectButtonClass(isSelectedSemana)} ${progBusy ? "opacity-50 cursor-not-allowed" : ""}`}
                                >
                                  <span
                                    className={`text-sm ${isSelectedSemana ? "font-bold" : "font-semibold"}`}
                                  >
                                    {formatWeekLabel(semana.semana)}
                                  </span>
                                </button>
                                <button
                                  type="button"
                                  onClick={(e) =>
                                    toggleSemanaEvento(
                                      selectedUnidadIndex,
                                      sIdx,
                                      e,
                                    )
                                  }
                                  disabled={inputsDisabled}
                                  className={`${weekEventStarButtonClass(Boolean(semana.esEvento))} ${disabledInputClass}`}
                                  title={
                                    semana.esEvento
                                      ? "Quitar evento especial"
                                      : "Marcar evento especial"
                                  }
                                  aria-pressed={Boolean(semana.esEvento)}
                                >
                                  <Star
                                    size={18}
                                    className={semana.esEvento ? "fill-current" : ""}
                                  />
                                </button>
                                {canEdit && (
                                  <button
                                    type="button"
                                    onClick={() =>
                                      handleDeleteSemana(selectedUnidadIndex, sIdx)
                                    }
                                    disabled={inputsDisabled}
                                    className={`h-10 w-10 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 flex items-center justify-center shrink-0 ${disabledInputClass}`}
                                    title="Eliminar semana"
                                  >
                                    <Trash2 size={14} />
                                  </button>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="space-y-6">
              {selectedUnidad ? (
                <>

                  <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
                    <div className="flex items-start justify-between gap-3 mb-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-red-50 text-red-600 flex items-center justify-center shrink-0">
                          <CalendarDays size={20} />
                        </div>
                        <div>
                          <h3 className="font-bold text-gray-900">
                            Lista de programación semanal
                          </h3>
                          <p className="text-xs text-gray-500">
                            Contenidos, actividades y horas registradas.
                          </p>
                        </div>
                      </div>
                      <span className="text-xs font-semibold text-gray-400 shrink-0 text-right">
                        {getUnidadLabel(selectedUnidad)}
                      </span>
                    </div>


                    {selectedUnidad.semanas.length === 0 ? (
                      <p className="text-sm text-gray-500 text-center py-6 border border-dashed border-gray-200 rounded-xl">
                        No hay semanas registradas. Use &quot;Agregar semana&quot;
                        para comenzar.
                      </p>
                    ) : (
                      <div className="space-y-3 max-h-[420px] overflow-y-auto pr-1">
                        {selectedUnidad.semanas.map((semana, sIdx) => {
                          const isSelected = selectedSemanaIndex === sIdx;

                          return (
                            <div
                              key={`prog-semana-${semana.semana}-${sIdx}`}
                              className={`flex gap-3 rounded-2xl border p-5 transition-all ${weekCardClass(isSelected)}`}
                            >
                              <button
                                type="button"
                                onClick={() =>
                                  selectSemana(selectedUnidadIndex, sIdx)
                                }
                                disabled={progBusy}
                                className={`flex-1 min-w-0 text-left ${progBusy ? "opacity-50 cursor-not-allowed" : ""}`}
                              >
                                <div className="flex items-center justify-between gap-3 flex-wrap">
                                  <h4
                                    className={`font-bold ${isSelected ? "text-blue-900" : "text-gray-900"}`}
                                  >
                                    {formatWeekLabel(semana.semana)}
                                  </h4>
                                  <div className="flex flex-wrap items-center gap-2">
                                    {semana.esEvento &&
                                    semana.eventoDescripcion?.trim() ? (
                                      <span className="inline-flex items-center gap-1 rounded-full bg-red-500 px-3 py-1 text-xs font-bold text-white">
                                        <Star
                                          size={12}
                                          className="fill-current shrink-0"
                                        />
                                        {semana.eventoDescripcion}
                                      </span>
                                    ) : null}
                                    {isSelected ? (
                                      <span className="inline-flex items-center rounded-full bg-blue-500 px-3 py-1 text-xs font-bold text-white">
                                        Semana seleccionada
                                      </span>
                                    ) : null}
                                  </div>
                                </div>
                                <p className="mt-3 text-sm italic text-gray-500 line-clamp-2">
                                  {semana.esEvento
                                    ? semana.eventoDescripcion?.trim() ||
                                      "Evento especial"
                                    : semana.contenidosConceptuales?.trim()
                                      ? semana.contenidosConceptuales
                                      : "Sin contenido registrado"}
                                </p>
                                {!semana.esEvento &&
                                semana.contenidosProcedimentales?.trim() ? (
                                  <p className="mt-2 text-xs text-gray-400 line-clamp-1">
                                    {semana.contenidosProcedimentales}
                                  </p>
                                ) : null}
                                {!semana.esEvento &&
                                semana.actividadesAprendizaje?.trim() ? (
                                  <p className="mt-1 text-xs text-gray-400 line-clamp-1">
                                    {semana.actividadesAprendizaje}
                                  </p>
                                ) : null}
                              </button>
                              <button
                                type="button"
                                onClick={(e) =>
                                  toggleSemanaEvento(
                                    selectedUnidadIndex,
                                    sIdx,
                                    e,
                                  )
                                }
                                disabled={inputsDisabled}
                                className={`${weekEventStarButtonClass(Boolean(semana.esEvento))} self-start ${disabledInputClass}`}
                                title={
                                  semana.esEvento
                                    ? "Quitar evento especial"
                                    : "Marcar evento especial"
                                }
                                aria-pressed={Boolean(semana.esEvento)}
                              >
                                <Star
                                  size={18}
                                  className={semana.esEvento ? "fill-current" : ""}
                                />
                              </button>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  {selectedSemana ? (
                    <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm space-y-5">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                          <CalendarDays size={20} />
                        </div>
                        <div>
                          <h3 className="font-bold text-gray-900">
                            {formatWeekLabel(selectedSemana.semana)}
                          </h3>
                          <p className="text-xs text-gray-500">
                            Contenidos y distribución horaria
                          </p>
                        </div>
                      </div>

                      {selectedSemana.esEvento ? (
                        <div>
                          <label className="block text-sm font-bold text-gray-900 mb-2">
                            Evento especial
                          </label>
                          <input
                            type="text"
                            value={selectedSemana.eventoDescripcion}
                            onChange={(e) =>
                              updateSelectedSemanaField(
                                "eventoDescripcion",
                                e.target.value,
                              )
                            }
                            disabled={inputsDisabled}
                            placeholder="Descripción del evento especial..."
                            className={`w-full h-11 rounded-xl px-4 bg-gray-50 border border-gray-200 text-sm text-gray-700 placeholder:text-gray-400 outline-none transition-all focus:bg-white focus:ring-2 focus:ring-red-500 focus:border-transparent ${disabledInputClass}`}
                          />
                        </div>
                      ) : null}

                      {!selectedSemana.esEvento ? (
                      <>
                      <div>
                        <label className="block text-sm font-bold text-gray-900 mb-2">
                          Contenido conceptual
                        </label>
                        <textarea
                          value={selectedSemana.contenidosConceptuales}
                          onChange={(e) =>
                            updateSelectedSemanaField(
                              "contenidosConceptuales",
                              e.target.value,
                            )
                          }
                          disabled={inputsDisabled}
                          rows={4}
                          maxLength={800}
                          placeholder="Describa los contenidos conceptuales de la semana..."
                          className={`w-full min-h-[110px] rounded-xl px-4 py-3 bg-gray-50 border border-gray-200 text-sm text-gray-700 placeholder:text-gray-400 resize-y outline-none transition-all focus:bg-white focus:ring-2 focus:ring-red-500 focus:border-transparent ${disabledInputClass}`}
                        />
                        <p className="mt-1 text-xs text-gray-400 text-right">
                          {selectedSemana.contenidosConceptuales.length}/800
                        </p>
                      </div>

                      <div>
                        <label className="block text-sm font-bold text-gray-900 mb-2">
                          Contenido procedimental
                        </label>
                        <textarea
                          value={selectedSemana.contenidosProcedimentales}
                          onChange={(e) =>
                            updateSelectedSemanaField(
                              "contenidosProcedimentales",
                              e.target.value,
                            )
                          }
                          disabled={inputsDisabled}
                          rows={4}
                          maxLength={800}
                          placeholder="Describa los contenidos procedimentales de la semana..."
                          className={`w-full min-h-[110px] rounded-xl px-4 py-3 bg-gray-50 border border-gray-200 text-sm text-gray-700 placeholder:text-gray-400 resize-y outline-none transition-all focus:bg-white focus:ring-2 focus:ring-red-500 focus:border-transparent ${disabledInputClass}`}
                        />
                        <p className="mt-1 text-xs text-gray-400 text-right">
                          {selectedSemana.contenidosProcedimentales.length}/800
                        </p>
                      </div>

                      <div>
                        <label className="block text-sm font-bold text-gray-900 mb-2">
                          Actividades de aprendizaje
                        </label>
                        <textarea
                          value={selectedSemana.actividadesAprendizaje}
                          onChange={(e) =>
                            updateSelectedSemanaField(
                              "actividadesAprendizaje",
                              e.target.value,
                            )
                          }
                          disabled={inputsDisabled}
                          rows={4}
                          maxLength={800}
                          placeholder="Describa las actividades de aprendizaje de la semana..."
                          className={`w-full min-h-[110px] rounded-xl px-4 py-3 bg-gray-50 border border-gray-200 text-sm text-gray-700 placeholder:text-gray-400 resize-y outline-none transition-all focus:bg-white focus:ring-2 focus:ring-red-500 focus:border-transparent ${disabledInputClass}`}
                        />
                        <p className="mt-1 text-xs text-gray-400 text-right">
                          {selectedSemana.actividadesAprendizaje.length}/800
                        </p>
                      </div>

                      <div>
                        <div className="flex items-center gap-2 mb-3">
                          <Clock size={18} className="text-gray-500" />
                          <h4 className="text-sm font-bold text-gray-900">
                            Distribución horaria
                          </h4>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-xs font-semibold text-gray-500 mb-1">
                              Horas lectivas — teoría
                            </label>
                            <input
                              type="number"
                              min={0}
                              max={24}
                              value={selectedSemana.horasLectivasTeoria}
                              onChange={(e) =>
                                updateSelectedSemanaField(
                                  "horasLectivasTeoria",
                                  Number(e.target.value),
                                )
                              }
                              disabled={inputsDisabled}
                              className={`w-full h-11 rounded-xl px-4 bg-gray-50 border border-gray-200 text-sm text-gray-700 outline-none transition-all focus:bg-white focus:ring-2 focus:ring-red-500 focus:border-transparent ${disabledInputClass}`}
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-semibold text-gray-500 mb-1">
                              Horas lectivas — práctica
                            </label>
                            <input
                              type="number"
                              min={0}
                              max={24}
                              value={selectedSemana.horasLectivasPractica}
                              onChange={(e) =>
                                updateSelectedSemanaField(
                                  "horasLectivasPractica",
                                  Number(e.target.value),
                                )
                              }
                              disabled={inputsDisabled}
                              className={`w-full h-11 rounded-xl px-4 bg-gray-50 border border-gray-200 text-sm text-gray-700 outline-none transition-all focus:bg-white focus:ring-2 focus:ring-red-500 focus:border-transparent ${disabledInputClass}`}
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-semibold text-gray-500 mb-1">
                              Horas no lectivas — teoría
                            </label>
                            <input
                              type="number"
                              min={0}
                              max={24}
                              value={selectedSemana.horasNoLectivasTeoria}
                              onChange={(e) =>
                                updateSelectedSemanaField(
                                  "horasNoLectivasTeoria",
                                  Number(e.target.value),
                                )
                              }
                              disabled={inputsDisabled}
                              className={`w-full h-11 rounded-xl px-4 bg-gray-50 border border-gray-200 text-sm text-gray-700 outline-none transition-all focus:bg-white focus:ring-2 focus:ring-red-500 focus:border-transparent ${disabledInputClass}`}
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-semibold text-gray-500 mb-1">
                              Horas no lectivas — práctica
                            </label>
                            <input
                              type="number"
                              min={0}
                              max={24}
                              value={selectedSemana.horasNoLectivasPractica}
                              onChange={(e) =>
                                updateSelectedSemanaField(
                                  "horasNoLectivasPractica",
                                  Number(e.target.value),
                                )
                              }
                              disabled={inputsDisabled}
                              className={`w-full h-11 rounded-xl px-4 bg-gray-50 border border-gray-200 text-sm text-gray-700 outline-none transition-all focus:bg-white focus:ring-2 focus:ring-red-500 focus:border-transparent ${disabledInputClass}`}
                            />
                          </div>
                        </div>
                      </div>
                      </>
                      ) : null}

                      <button
                        type="button"
                        onClick={handleSaveSemana}
                        disabled={inputsDisabled}
                        className={`w-full h-11 rounded-xl bg-red-600 text-white text-sm font-bold flex items-center justify-center gap-2 shadow-sm transition-all hover:bg-red-700 ${disabledInputClass}`}
                      >
                        <Save size={18} />
                        Guardar semana
                      </button>
                    </div>
                  ) : (
                    <div className="rounded-2xl border border-dashed border-gray-200 bg-gray-50 p-8 text-center">
                      <CalendarDays
                        size={32}
                        className="mx-auto text-gray-300 mb-3"
                      />
                      <p className="text-sm font-semibold text-gray-600">
                        Seleccione una semana
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        Elija una semana del panel izquierdo o agregue una
                        nueva.
                      </p>
                    </div>
                  )}
                </>
              ) : (
                <div className="rounded-2xl border border-dashed border-gray-200 bg-gray-50 p-8 text-center">
                  <Layers size={32} className="mx-auto text-gray-300 mb-3" />
                  <p className="text-sm font-semibold text-gray-600">
                    Seleccione una unidad
                  </p>
                </div>
              )}
            </div>
          </div>

          {progBusy && (
            <div className="mt-6 rounded-xl border border-blue-100 bg-blue-50 px-4 py-3 text-sm text-blue-700 flex items-center gap-2">
              <Loader2 size={18} className="animate-spin" />
              Guardando programación del contenido...
            </div>
          )}
        </div>
      </div>
    </Step>
  );
}
