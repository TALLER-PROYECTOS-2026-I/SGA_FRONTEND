import { useQuery } from "@tanstack/react-query";

export interface ApprovedSyllabus {
  id: number;
  codigo: string;
  asignatura: string;
  fechaAprobacion?: string;
  ciclo?: string;
  escuela?: string;
  estadoRevision: string;
}

interface SyllabusBackendResponse {
  id: number;
  code: string;
  name: string;
  ciclo?: string;
  escuela?: string;
  estadoRevision: "APROBADO" | "ASIGNADO" | "REPROBADO" | "EN REVISION";
  fechaAprobacion?: string;
}

interface ApiResponse {
  success: boolean;
  message: string;
  data: SyllabusBackendResponse[];
}

async function fetchApprovedSyllabi(): Promise<ApprovedSyllabus[]> {
  const apiBase =
    import.meta.env.VITE_API_BASE_URL ?? "http://localhost:7071/api";
  const url = `${apiBase}/assignments/courses`;

  const res = await fetch(url, {
    credentials: "include", // Para enviar cookie sessionSGA
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
    throw new Error(response.message || "Error al obtener sílabos");
  }

  // Filtrar solo los APROBADOS y mapear
  return response.data
    .filter((silabo) => silabo.estadoRevision === "APROBADO")
    .map((silabo) => ({
      id: silabo.id,
      codigo: silabo.code,
      asignatura: silabo.name,
      ciclo: silabo.ciclo,
      escuela: silabo.escuela,
      estadoRevision: silabo.estadoRevision,
      fechaAprobacion: silabo.fechaAprobacion,
    }));
}

export function useApprovedSyllabi() {
  return useQuery<ApprovedSyllabus[], Error>({
    queryKey: ["syllabi", "approved"],
    queryFn: fetchApprovedSyllabi,
    staleTime: 2 * 60 * 1000, // 2 minutos
    gcTime: 10 * 60 * 1000, // 10 minutos
    refetchOnWindowFocus: false,
    retry: 1,
  });
}
