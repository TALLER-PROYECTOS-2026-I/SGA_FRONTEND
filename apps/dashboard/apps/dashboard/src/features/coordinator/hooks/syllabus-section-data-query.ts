import { useQuery } from "@tanstack/react-query";

const API_BASE_URL = "/api";

// Sección 1: Datos Generales
export interface DatosGenerales {
  nombreAsignatura?: string;
  departamentoAcademico?: string;
  escuelaProfesional?: string;
  programaAcademico?: string;
  semestreAcademico?: string;
  tipoAsignatura?: string;
  tipoEstudios?: string;
  modalidad?: string;
  codigoAsignatura?: string;
  ciclo?: string;
  requisitos?: string;
  horasTeoria?: number;
  horasPractica?: number;
  horasLaboratorio?: number;
  horasTeoriaLectivaPresencial?: number;
  horasTeoriaLectivaDistancia?: number;
  horasTeoriaNoLectivaPresencial?: number;
  horasTeoriaNoLectivaDistancia?: number;
  horasPracticaLectivaPresencial?: number;
  horasPracticaLectivaDistancia?: number;
  horasPracticaNoLectivaPresencial?: number;
  creditosTeoria?: number;
  creditosPractica?: number;
  docentes?: string;
}

// Sección 2: Sumilla
export interface SumillaContent {
  sumilla: string;
}

export interface SumillaResponse {
  success: boolean;
  content: SumillaContent[];
}

// Sección 3: Competencias, Componentes y Actitudes
export interface CompetencyItem {
  id: number;
  silaboId: number;
  text: string;
  code: string;
  order: number;
}

export interface CompetenciesResponse {
  items: CompetencyItem[];
}

export interface AttitudeItem {
  id: number;
  silaboId: number;
  text: string;
  order: number;
  code: string;
}

export interface AttitudesResponse {
  items: AttitudeItem[];
}

export interface Section3Data {
  competencies: CompetencyItem[];
  components: string;
  attitudes: AttitudeItem[];
}

export type SectionData =
  | DatosGenerales
  | SumillaResponse
  | Section3Data
  | Record<string, unknown>
  | null;

const emptySectionData: Record<string, unknown> = {
  empty: true,
};

/**
 * Hook para obtener los datos de una sección específica del sílabo.
 * Si el backend responde 404, se interpreta como sección sin datos guardados,
 * no como error crítico de pantalla.
 */
export function useSyllabusSectionData(
  syllabusId: number | null,
  sectionNumber: string | null,
) {
  return useQuery({
    queryKey: ["syllabusSection", syllabusId, sectionNumber],
    queryFn: async (): Promise<SectionData> => {
      if (!syllabusId || !sectionNumber) {
        return null;
      }

      // Sección 3 requiere múltiples peticiones
      if (sectionNumber === "3") {
        const [competenciesRes, attitudesRes] = await Promise.all([
          fetch(`${API_BASE_URL}/syllabus/${syllabusId}/competencies`),
          fetch(`${API_BASE_URL}/syllabus/${syllabusId}/attitudes`),
        ]);

        // Si aún no existen datos, no rompemos la pantalla
        if (competenciesRes.status === 404 || attitudesRes.status === 404) {
          return {
            competencies: [],
            components: "",
            attitudes: [],
          } as Section3Data;
        }

        if (!competenciesRes.ok || !attitudesRes.ok) {
          throw new Error("Error al obtener datos de la sección 3");
        }

        const [competenciesData, attitudesData] = await Promise.all([
          competenciesRes.json() as Promise<CompetenciesResponse>,
          attitudesRes.json() as Promise<AttitudesResponse>,
        ]);

        return {
          competencies: competenciesData?.items || [],
          components: "",
          attitudes: attitudesData?.items || [],
        } as Section3Data;
      }

      const endpointMap: Record<string, string> = {
        "1": "datos-generales",
        "2": "sumilla",
        "4": "unidades",
        "5": "estrategias-metodologicas",
        "6": "recursos-didacticos",
        "7": "evaluacion",
        "8": "bibliografia",
        "9": "cronograma",
      };

      const endpoint = endpointMap[sectionNumber];

      if (!endpoint) {
        throw new Error(
          `Endpoint no definido para la sección ${sectionNumber}`,
        );
      }

      const url = `${API_BASE_URL}/syllabus/${syllabusId}/${endpoint}`;

      const response = await fetch(url, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });

      // Importante:
      // 404 significa que la sección todavía no tiene datos guardados.
      // No lo tratamos como error crítico.
      if (response.status === 404) {
        return emptySectionData;
      }

      if (!response.ok) {
        const errorText = await response.text();

        throw new Error(
          `Error al obtener datos de la sección: ${response.status} - ${errorText}`,
        );
      }

      const result = await response.json();

      if (sectionNumber === "1") {
        return result as DatosGenerales;
      }

      if (sectionNumber === "2") {
        return result as SumillaResponse;
      }

      if (result && typeof result === "object" && "data" in result) {
        return result.data;
      }

      return result;
    },
    enabled: !!syllabusId && !!sectionNumber,
    staleTime: 1000 * 60 * 5,
    retry: (failureCount, error) => {
      const message = error instanceof Error ? error.message : "";

      if (message.includes("404")) {
        return false;
      }

      return failureCount < 1;
    },
  });
}