import { useQuery } from "@tanstack/react-query";

export interface Teacher {
  id: string;
  name: string;
  email: string;
  grado?: string | null;
  categoria?: string | null;
  categoriaId?: number;
  activo?: boolean;
  ultimoAcceso?: string | null;
}

interface TeacherBackendResponse {
  id: number;
  nombre: string | null;
  correo: string;
  grado: string | null;
  categoria: string | null;
  categoriaId: number;
  activo: boolean;
  ultimoAcceso: string | null;
}

interface ApiResponse {
  success: boolean;
  message: string;
  data: TeacherBackendResponse[];
  total: number;
}

async function fetchTeachers(): Promise<Teacher[]> {
  const apiBase =
    import.meta.env.VITE_API_BASE_URL ?? "http://localhost:7071/api";
  const url = `${apiBase}/teacher/`;

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
    throw new Error(response.message || "Error al obtener profesores");
  }

  // Mapear del formato del backend al formato del frontend
  return response.data.map((teacher) => ({
    id: teacher.id.toString(),
    name: teacher.nombre || "Sin nombre",
    email: teacher.correo,
    grado: teacher.grado,
    categoria: teacher.categoria,
    categoriaId: teacher.categoriaId,
    activo: teacher.activo,
    ultimoAcceso: teacher.ultimoAcceso,
  }));
}

export function useTeachers() {
  return useQuery<Teacher[], Error>({
    queryKey: ["teachers"],
    queryFn: fetchTeachers,
    staleTime: 5 * 60 * 1000, // 5 minutos
    gcTime: 10 * 60 * 1000, // 10 minutos
    refetchOnWindowFocus: false,
    retry: 1,
  });
}
