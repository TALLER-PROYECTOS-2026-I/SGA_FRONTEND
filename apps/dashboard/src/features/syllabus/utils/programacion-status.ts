import type { SemanaProgramacion, UnidadProgramacion } from "../hooks/fourth-step-query";

export type ProgramacionStatus = "PENDIENTE" | "EN_PROCESO" | "COMPLETADO";

export const PROGRAMACION_STATUS_LABELS: Record<ProgramacionStatus, string> = {
  PENDIENTE: "Pendiente",
  EN_PROCESO: "En proceso",
  COMPLETADO: "Completado",
};

export const PROGRAMACION_STATUS_STYLES: Record<
  ProgramacionStatus,
  { badge: string; dot: string }
> = {
  PENDIENTE: {
    badge: "bg-red-50 text-red-700 border-red-200",
    dot: "bg-red-500",
  },
  EN_PROCESO: {
    badge: "bg-yellow-50 text-yellow-800 border-yellow-200",
    dot: "bg-yellow-500",
  },
  COMPLETADO: {
    badge: "bg-green-50 text-green-700 border-green-200",
    dot: "bg-green-500",
  },
};

export function isSemanaProgramacionCompleta(semana: SemanaProgramacion) {
  if (semana.esEvento) {
    return Boolean(semana.eventoDescripcion?.trim());
  }

  const totalHoras =
    Number(semana.horasLectivasTeoria || 0) +
    Number(semana.horasLectivasPractica || 0) +
    Number(semana.horasNoLectivasTeoria || 0) +
    Number(semana.horasNoLectivasPractica || 0);

  return (
    semana.contenidosConceptuales.trim().length > 0 &&
    semana.contenidosProcedimentales.trim().length > 0 &&
    semana.actividadesAprendizaje.trim().length > 0 &&
    totalHoras > 0
  );
}

export function getProgramacionStatus(
  unidades: UnidadProgramacion[],
): ProgramacionStatus {
  const unidadesConSemanas = unidades.filter(
    (unidad) => unidad.semanas.length > 0,
  );

  if (unidadesConSemanas.length === 0) {
    return "PENDIENTE";
  }

  const allWeeksComplete = unidadesConSemanas.every((unidad) => {
    const hasCapacidad = unidad.capacidadesText.trim().length > 0;

    return (
      hasCapacidad &&
      unidad.semanas.every((semana) => isSemanaProgramacionCompleta(semana))
    );
  });

  return allWeeksComplete ? "COMPLETADO" : "EN_PROCESO";
}
