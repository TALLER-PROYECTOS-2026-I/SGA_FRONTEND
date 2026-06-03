import { useQuery } from "@tanstack/react-query";
import {
  authFetch,
  getApiBaseUrl,
  readApiErrorMessage,
} from "../../../common/utils/auth-fetch";

export interface SyllabusVersionUser {
  id: number;
  nombre?: string | null;
  correo?: string | null;
}

export interface SyllabusVersionSummary {
  id: number;
  versionId: number;
  versionNumber: number;
  status?: string | null;
  modifiedAt?: string | null;
  modifiedBy?: SyllabusVersionUser | null;
}

export interface VersionedSyllabusCourse {
  syllabusId: number | null;
  cursoCodigo?: string | null;
  cursoNombre?: string | null;
  ciclo?: string | null;
  semestreAcademico?: string | null;
  escuelaProfesional?: string | null;
  programaAcademico?: string | null;
  estadoRevision?: string | null;
  versionsCount: number;
  latestVersion?: SyllabusVersionSummary | null;
  versions: SyllabusVersionSummary[];
}

export interface SyllabusVersionsCycle {
  ciclo?: string | null;
  nombre: string;
  cursos: VersionedSyllabusCourse[];
}

export interface SyllabusVersionsSummaryResponse {
  ciclos: SyllabusVersionsCycle[];
  items: VersionedSyllabusCourse[];
}

export interface SyllabusVersionItem extends SyllabusVersionSummary {
  syllabusId: number;
  createdAt?: string | null;
}

export interface SyllabusVersionSnapshot extends SyllabusVersionItem {
  snapshot: unknown;
}

interface ApiResponse<T> {
  data?: T;
  success?: boolean;
  message?: string;
}

export interface SyllabusVersionsFilters {
  periodo?: string;
  ciclo?: string;
}

function buildQuery(filters?: SyllabusVersionsFilters) {
  const params = new URLSearchParams();

  if (filters?.periodo?.trim()) {
    params.set("periodo", filters.periodo.trim());
  }

  if (filters?.ciclo?.trim()) {
    params.set("ciclo", filters.ciclo.trim());
  }

  const query = params.toString();
  return query ? `?${query}` : "";
}

async function parseApiResponse<T>(
  response: Response,
  fallback: string,
): Promise<T> {
  if (!response.ok) {
    throw new Error(await readApiErrorMessage(response, fallback));
  }

  const json = (await response.json()) as ApiResponse<T> | T;
  const wrapped = json as ApiResponse<T>;

  return wrapped.data !== undefined ? wrapped.data : (json as T);
}

export async function fetchSyllabusVersionsSummary(
  filters?: SyllabusVersionsFilters,
): Promise<SyllabusVersionsSummaryResponse> {
  const response = await authFetch(
    `${getApiBaseUrl()}/syllabus/versions${buildQuery(filters)}`,
  );

  return parseApiResponse<SyllabusVersionsSummaryResponse>(
    response,
    "No se pudieron cargar las versiones de silabos.",
  );
}

export async function fetchSyllabusVersions(
  syllabusId: number,
): Promise<SyllabusVersionItem[]> {
  const response = await authFetch(
    `${getApiBaseUrl()}/syllabus/${syllabusId}/versions`,
  );

  return parseApiResponse<SyllabusVersionItem[]>(
    response,
    "No se pudo cargar el historial de versiones.",
  );
}

export async function fetchSyllabusVersionSnapshot(
  syllabusId: number,
  versionId: number,
): Promise<SyllabusVersionSnapshot> {
  const response = await authFetch(
    `${getApiBaseUrl()}/syllabus/${syllabusId}/versions/${versionId}`,
  );

  return parseApiResponse<SyllabusVersionSnapshot>(
    response,
    "No se pudo cargar la version seleccionada.",
  );
}

export function useSyllabusVersionsSummary(filters?: SyllabusVersionsFilters) {
  return useQuery({
    queryKey: ["syllabus-versions", "summary", filters],
    queryFn: () => fetchSyllabusVersionsSummary(filters),
    staleTime: 2 * 60 * 1000,
  });
}

export function useSyllabusVersions(syllabusId?: number | null) {
  return useQuery({
    queryKey: ["syllabus-versions", syllabusId],
    queryFn: () => fetchSyllabusVersions(Number(syllabusId)),
    enabled: Number.isFinite(Number(syllabusId)) && Number(syllabusId) > 0,
    staleTime: 2 * 60 * 1000,
  });
}

export function useSyllabusVersionSnapshot(
  syllabusId?: number | null,
  versionId?: number | null,
) {
  return useQuery({
    queryKey: ["syllabus-versions", syllabusId, "snapshot", versionId],
    queryFn: () =>
      fetchSyllabusVersionSnapshot(Number(syllabusId), Number(versionId)),
    enabled:
      Number.isFinite(Number(syllabusId)) &&
      Number(syllabusId) > 0 &&
      Number.isFinite(Number(versionId)) &&
      Number(versionId) > 0,
    staleTime: 5 * 60 * 1000,
  });
}
export interface SyllabusDownloadItem {
  syllabusId: number;
  versionId: number;
  versionNumber: number;
  cursoCodigo: string | null;
  cursoNombre: string | null;
  ciclo: string;
  cicloNombre: string;
  periodo: string;
  estado: string | null;
  modifiedAt: string | null;
  createdAt: string | null;
  modifiedBy: {
    id: number;
    nombre: string | null;
    correo: string | null;
  } | null;
  snapshot: unknown;
}

export interface SyllabusDownloadByCycleResponse {
  periodo: string;
  ciclo: string;
  cicloNombre: string;
  totalCursos: number;
  totalDescargables: number;
  syllabi: SyllabusDownloadItem[];
  missingCourses: Array<{
    syllabusId: number | null;
    cursoCodigo: string | null;
    cursoNombre: string | null;
    ciclo: string;
    motivo: string;
  }>;
}

export async function fetchSyllabusDownloadByCycle(filters: {
  periodo: string;
  ciclo: string;
}) {
  const params = new URLSearchParams();

  params.set("periodo", filters.periodo);
  params.set("ciclo", filters.ciclo);

  const response = await authFetch(
    `/api/syllabus/download-by-cycle?${params.toString()}`,
  );

  if (!response.ok) {
    const error = await response.json().catch(() => null);
    throw new Error(
      error?.message ?? "No se pudieron obtener los sílabos del ciclo",
    );
  }

  const result = await response.json();

  return result.data as SyllabusDownloadByCycleResponse;
}