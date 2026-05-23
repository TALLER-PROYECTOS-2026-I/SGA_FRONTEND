import { useQuery } from "@tanstack/react-query";
import {
  isInconsistentNoDocente,
  isPendingAssignment,
} from "./course-assignment-status";

export interface Course {
  id: string;
  name: string;
  code: string;
  ciclo?: string;
  escuela?: string;
  docenteId?: number | null;
  nombreDocente?: string | null;
  estadoRevision?: string | null;
  isPendingAssignment: boolean;
  isInconsistentNoDocente: boolean;
}

interface CourseBackendResponse {
  id: number;
  name: string;
  code: string;
  ciclo?: string;
  escuela?: string;
  docenteId?: number | null;
  nombreDocente?: string | null;
  estadoRevision?: string | null;
}

interface ApiResponse {
  success: boolean;
  message: string;
  data: CourseBackendResponse[];
}

function mapCourse(course: CourseBackendResponse): Course {
  const mapped = {
    id: course.id.toString(),
    name: course.name,
    code: course.code,
    ciclo: course.ciclo,
    escuela: course.escuela,
    docenteId: course.docenteId ?? null,
    nombreDocente: course.nombreDocente ?? null,
    estadoRevision: course.estadoRevision ?? null,
  };

  return {
    ...mapped,
    isPendingAssignment: isPendingAssignment(mapped),
    isInconsistentNoDocente: isInconsistentNoDocente(mapped),
  };
}

async function fetchCourses(options?: {
  sinAsignar?: boolean;
}): Promise<Course[]> {
  const apiBase =
    import.meta.env.VITE_API_BASE_URL ?? "http://localhost:7071/api";
  const params = new URLSearchParams();
  if (options?.sinAsignar) {
    params.set("sinAsignar", "true");
  }
  const query = params.toString();
  const url = `${apiBase}/assignments/courses${query ? `?${query}` : ""}`;

  const res = await fetch(url, {
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
    },
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Error ${res.status}: ${text}`);
  }

  const response: ApiResponse = await res.json();

  if (!response.success || !Array.isArray(response.data)) {
    throw new Error(response.message || "Error al obtener cursos");
  }

  return response.data.map(mapCourse);
}

export function useCourses() {
  return useQuery<Course[], Error>({
    queryKey: ["assignments", "courses", "all"],
    queryFn: () => fetchCourses(),
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    refetchOnWindowFocus: false,
    retry: 1,
  });
}

/** Solo sílabos BORRADOR sin docente (pendientes de asignación). */
export function usePendingCourses() {
  return useQuery<Course[], Error>({
    queryKey: ["assignments", "courses", "pending"],
    queryFn: () => fetchCourses({ sinAsignar: true }),
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    refetchOnWindowFocus: false,
    retry: 1,
  });
}
