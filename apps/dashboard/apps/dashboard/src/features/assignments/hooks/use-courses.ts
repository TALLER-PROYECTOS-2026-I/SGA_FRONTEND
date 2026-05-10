import { useQuery } from "@tanstack/react-query";

export interface Course {
  id: string;
  name: string;
  code: string;
  ciclo?: string;
  escuela?: string;
}

interface CourseBackendResponse {
  id: number;
  name: string;
  code: string;
  ciclo?: string;
  escuela?: string;
}

interface ApiResponse {
  success: boolean;
  message: string;
  data: CourseBackendResponse[];
}

async function fetchCourses(): Promise<Course[]> {
  const apiBase =
    import.meta.env.VITE_API_BASE_URL ?? "http://localhost:7071/api";
  const url = `${apiBase}/assignments/courses`;

  const res = await fetch(url, {
    credentials: "include", // Importante para enviar cookies (sessionSGA)
    headers: {
      "Content-Type": "application/json",
    },
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Error ${res.status}: ${text}`);
  }

  const response: ApiResponse = await res.json();

  // Verificar que la respuesta sea exitosa y tenga datos
  if (!response.success || !Array.isArray(response.data)) {
    throw new Error(response.message || "Error al obtener cursos");
  }

  // Mapear del formato del backend al formato del frontend
  return response.data.map((course) => ({
    id: course.id.toString(),
    name: course.name,
    code: course.code,
    ciclo: course.ciclo,
    escuela: course.escuela,
  }));
}

export function useCourses() {
  return useQuery<Course[], Error>({
    queryKey: ["assignments", "courses"],
    queryFn: fetchCourses,
    staleTime: 5 * 60 * 1000, // 5 minutos
    gcTime: 10 * 60 * 1000, // 10 minutos
    refetchOnWindowFocus: false,
    retry: 1,
  });
}
