export function normalizeEstadoRevision(value?: string | null): string {
  return String(value ?? "")
    .trim()
    .toUpperCase()
    .replace(/\s+/g, "_");
}

export function isPendingAssignment(course: {
  docenteId?: number | null;
  estadoRevision?: string | null;
}): boolean {
  return (
    course.docenteId == null &&
    normalizeEstadoRevision(course.estadoRevision) === "BORRADOR"
  );
}

export function isInconsistentNoDocente(course: {
  docenteId?: number | null;
  estadoRevision?: string | null;
}): boolean {
  return course.docenteId == null && !isPendingAssignment(course);
}
