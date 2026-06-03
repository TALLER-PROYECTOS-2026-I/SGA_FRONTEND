import { useQuery } from "@tanstack/react-query";
import { authFetch } from "../../../common/utils/auth-fetch";
import { SECTION_TO_UI_STEP } from "../utils/section-permissions";

function getApiBase() {
  return (
    import.meta.env.VITE_API_BASE_URL ?? "http://localhost:7071/api"
  ).replace(/\/+$/, "");
}

function normalizeEstado(value: unknown) {
  return String(value ?? "")
    .trim()
    .toUpperCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

function getComment(section: {
  comentario?: string;
  mensaje?: string;
  comentarios?: Array<{ mensaje?: string; comentario?: string }>;
}): string {
  if (typeof section.comentario === "string" && section.comentario.trim()) {
    return section.comentario.trim();
  }

  if (typeof section.mensaje === "string" && section.mensaje.trim()) {
    return section.mensaje.trim();
  }

  const first = section.comentarios?.[0];

  if (typeof first?.mensaje === "string" && first.mensaje.trim()) {
    return first.mensaje.trim();
  }

  if (typeof first?.comentario === "string" && first.comentario.trim()) {
    return first.comentario.trim();
  }

  return "";
}

export function useRejectedSections(syllabusId: number | null) {
  const query = useQuery({
    queryKey: ["syllabus", syllabusId, "rejected-sections"],
    enabled: Boolean(syllabusId),
    retry: false,
    staleTime: 0,
    gcTime: 0,
    refetchOnMount: "always",
    refetchOnWindowFocus: false,
    queryFn: async () => {
      if (!syllabusId) {
        return {
          rejectedSteps: [] as number[],
          commentsByStep: {} as Record<number, string[]>,
        };
      }

      const res = await authFetch(
        `${getApiBase()}/syllabus/${syllabusId}/revision`,
      );

      if (res.status === 404) {
        return {
          rejectedSteps: [] as number[],
          commentsByStep: {} as Record<number, string[]>,
        };
      }

      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || "Error al cargar observaciones");
      }

      const json = await res.json();
      const sections = json?.data?.secciones ?? json?.secciones ?? [];

      const rejectedSet = new Set<number>();
      const commentsByStep: Record<number, string[]> = {};

      if (Array.isArray(sections)) {
        sections.forEach((section: unknown) => {
          const s = section as {
            estado?: unknown;
            numeroSeccion?: unknown;
            comentario?: string;
            mensaje?: string;
            comentarios?: Array<{ mensaje?: string; comentario?: string }>;
          };

          const estado = normalizeEstado(s.estado);

          if (estado !== "RECHAZADO" && estado !== "DESAPROBADO") {
            return;
          }

          const numeroSeccion = Number(s.numeroSeccion);
          const step = SECTION_TO_UI_STEP[numeroSeccion];

          if (!step) return;

          rejectedSet.add(step);

          const comment = getComment(s);

          if (comment) {
            commentsByStep[step] = [...(commentsByStep[step] ?? []), comment];
          }
        });
      }

      return {
        rejectedSteps: Array.from(rejectedSet).sort((a, b) => a - b),
        commentsByStep,
      };
    },
  });

  return {
    ...query,
    rejectedSteps: query.data?.rejectedSteps ?? [],
    commentsByStep: query.data?.commentsByStep ?? {},
    isDisapprovedWithRejections: (query.data?.rejectedSteps ?? []).length > 0,
  };
}
