import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { UseQueryOptions } from "@tanstack/react-query";
import {
  authFetch,
  getHttpErrorFallback,
  readApiErrorMessage,
} from "../../../common/utils/auth-fetch";

export interface SyllabusReview {
  id: string;
  courseName: string;
  courseCode: string;
  teacherName: string;
  docenteId: number;
  syllabusId: number;
  status: "ANALIZANDO" | "VALIDADO" | "DESAPROBADO" | "ASIGNADO";
  submittedDate: string;
}

export interface ReviewData {
  [fieldId: string]: {
    status: "approved" | "rejected" | null;
    comment: string;
  };
}

export interface ApproveRejectRequest {
  syllabusId: number;
  estado: "VALIDADO" | "DESAPROBADO";
  reviewData: ReviewData;
}

interface BackendRevisionSection {
  id?: number;
  numeroSeccion: number;
  nombreSeccion: string;
  estado?: string | null;
  comentariosCount?: number | null;
  comentario?: string | null;
  mensaje?: string | null;
  comentarios?: Array<{
    mensaje?: string | null;
    comentario?: string | null;
  }>;
}

interface BackendRevisionResponse {
  success?: boolean;
  data?: {
    silaboId?: number;
    secciones?: BackendRevisionSection[];
    totalSecciones?: number;
    seccionesRevisadas?: number;
    seccionesPendientes?: number;
  };
  silaboId?: number;
  secciones?: BackendRevisionSection[];
}

export const SECTION_NAME_MAP: Record<number, string> = {
  1: "Datos generales",
  2: "Sumilla",
  3: "Competencias y componentes",
  4: "Programación del contenido",
  5: "Estrategias metodológicas",
  6: "Recursos didácticos",
  7: "Evaluación del aprendizaje",
  8: "Fuentes de consulta",
  9: "Aporte de la asignatura",
};

const SECTION_TO_STEP_FIELD_MAP: Record<number, string> = {
  1: "step-1",
  2: "step-2",
  3: "step-3",
  4: "step-4",
  5: "step-5",
  6: "step-5",
  7: "step-6",
  8: "step-7",
  9: "step-8",
};

function normalizeApiBase(baseUrl?: string): string {
  return (
    baseUrl ??
    import.meta.env.VITE_API_BASE_URL ??
    "http://localhost:7071/api"
  ).replace(/\/+$/, "");
}

function normalizeBackendStatus(
  estado: unknown,
): "approved" | "rejected" | null {
  const value = String(estado ?? "")
    .trim()
    .toUpperCase();

  if (
    value === "REVISADO" ||
    value === "APROBADO" ||
    value === "APPROVED" ||
    value === "VALIDADO"
  ) {
    return "approved";
  }

  if (
    value === "RECHAZADO" ||
    value === "DESAPROBADO" ||
    value === "REJECTED"
  ) {
    return "rejected";
  }

  return null;
}

function normalizeFrontendStatus(
  status: "approved" | "rejected" | null,
): "REVISADO" | "RECHAZADO" | "PENDIENTE" {
  if (status === "approved") return "REVISADO";
  if (status === "rejected") return "RECHAZADO";
  return "PENDIENTE";
}

function getCommentFromBackend(section: BackendRevisionSection): string {
  if (typeof section.comentario === "string") {
    return section.comentario;
  }

  if (typeof section.mensaje === "string") {
    return section.mensaje;
  }

  const firstComment = section.comentarios?.[0];

  if (typeof firstComment?.mensaje === "string") {
    return firstComment.mensaje;
  }

  if (typeof firstComment?.comentario === "string") {
    return firstComment.comentario;
  }

  return "";
}

// Mapea campos del frontend a secciones reales del backend.
// Importante:
// step-5 visual cubre sección 5 y 6.
// step-8 visual corresponde a sección 9.
function mapFieldToSections(fieldId: string): number[] {
  const mapping: Record<string, number[]> = {
    "step-1": [1],
    "step-2": [2],
    "step-3": [3],
    "step-4": [4],
    "step-5": [5, 6],
    "step-6": [7],
    "step-7": [8],
    "step-8": [9],
  };

  if (mapping[fieldId]) {
    return mapping[fieldId];
  }

  const match = fieldId.match(/^step-(\d+)/);

  if (!match) {
    return [0];
  }

  const step = Number(match[1]);

  const stepToSectionMap: Record<number, number[]> = {
    1: [1],
    2: [2],
    3: [3],
    4: [4],
    5: [5, 6],
    6: [7],
    7: [8],
    8: [9],
  };

  return stepToSectionMap[step] ?? [0];
}

function fieldRelatesToSection(
  fieldId: string,
  sectionNumber: number,
): boolean {
  return mapFieldToSections(fieldId).includes(sectionNumber);
}

function getSectionReviewStatus(
  reviewData: ReviewData,
  sectionNumber: number,
): "approved" | "rejected" | null {
  const relatedEntries = Object.entries(reviewData || {}).filter(([fieldId]) =>
    fieldRelatesToSection(fieldId, sectionNumber),
  );

  if (relatedEntries.length === 0) {
    return null;
  }

  if (relatedEntries.some(([, value]) => value.status === "rejected")) {
    return "rejected";
  }

  if (relatedEntries.every(([, value]) => value.status === "approved")) {
    return "approved";
  }

  return null;
}

function getSectionComment(
  reviewData: ReviewData,
  sectionNumber: number,
): string {
  const comments = new Set<string>();

  Object.entries(reviewData || {}).forEach(([fieldId, value]) => {
    if (!fieldRelatesToSection(fieldId, sectionNumber)) return;

    const comment = String(value.comment ?? "").trim();
    if (comment) {
      comments.add(comment);
    }
  });

  return Array.from(comments).join("\n");
}

export function reviewDataToBackendSections(reviewData: ReviewData) {
  const sections: Array<{
    numeroSeccion: number;
    nombreSeccion: string;
    estado: "REVISADO" | "RECHAZADO" | "PENDIENTE";
    comentario?: string;
  }> = [];

  for (let sectionNumber = 1; sectionNumber <= 9; sectionNumber += 1) {
    const status = getSectionReviewStatus(reviewData, sectionNumber);
    const comentario = getSectionComment(reviewData, sectionNumber);

    sections.push({
      numeroSeccion: sectionNumber,
      nombreSeccion:
        SECTION_NAME_MAP[sectionNumber] ?? `Sección ${sectionNumber}`,
      estado: normalizeFrontendStatus(status),
      ...(comentario ? { comentario } : {}),
    });
  }

  return sections;
}

export function getPendingSectionNumbers(reviewData: ReviewData): number[] {
  const pending: number[] = [];

  for (let sectionNumber = 1; sectionNumber <= 9; sectionNumber += 1) {
    const status = getSectionReviewStatus(reviewData, sectionNumber);
    if (status === null) {
      pending.push(sectionNumber);
    }
  }

  return pending;
}

async function readReviewApiError(response: Response): Promise<string> {
  return readApiErrorMessage(response, getHttpErrorFallback(response.status));
}

function backendRevisionToReviewData(
  payload: BackendRevisionResponse,
): ReviewData {
  const rawSections = payload.data?.secciones ?? payload.secciones ?? [];

  if (!Array.isArray(rawSections) || rawSections.length === 0) {
    return {};
  }

  const reviewData: ReviewData = {};

  rawSections.forEach((section) => {
    const numeroSeccion = Number(section.numeroSeccion);

    if (!numeroSeccion || Number.isNaN(numeroSeccion)) {
      return;
    }

    const fieldId = SECTION_TO_STEP_FIELD_MAP[numeroSeccion];

    if (!fieldId) {
      return;
    }

    const current = reviewData[fieldId];

    const status = normalizeBackendStatus(section.estado);
    const comment = getCommentFromBackend(section);

    // Si una sección compartida, como step-5, tiene parte rechazada,
    // mantenemos rechazado como prioridad.
    if (current?.status === "rejected") {
      reviewData[fieldId] = {
        status: "rejected",
        comment: current.comment || comment,
      };
      return;
    }

    reviewData[fieldId] = {
      status,
      comment: current?.comment || comment,
    };
  });

  return reviewData;
}

class SyllabusReviewManager {
  async fetchAllInReview(baseUrl?: string): Promise<SyllabusReview[]> {
    const apiBase = normalizeApiBase(baseUrl);
    const url = `${apiBase}/syllabus/revision`;

    const res = await authFetch(url);

    if (!res.ok) {
      const t = await res.text();
      throw new Error(`${res.status} ${t}`);
    }

    const json = await res.json();
    const rawData = Array.isArray(json) ? json : (json?.data ?? []);

    return rawData.map((item: Record<string, unknown>) => {
      const possibleId =
        item.id ??
        item._id ??
        item.syllabusId ??
        item.silaboId ??
        item.silaboID ??
        item.idRevision ??
        "";

      const idStr = String(possibleId ?? "");

      const possibleSyllabusId =
        item.syllabusId ??
        item.silaboId ??
        item.id ??
        item.silaboID ??
        item.idSyllabus ??
        0;

      const syllabusIdNum = Number(possibleSyllabusId) || 0;

      const backendStatus = String(item.estadoRevision ?? "");

      const status = (() => {
        if (backendStatus === "APROBADO") return "VALIDADO";
        if (backendStatus === "VALIDADO") return "VALIDADO";
        if (backendStatus === "DESAPROBADO") return "DESAPROBADO";
        if (backendStatus === "ASIGNADO") return "ASIGNADO";
        if (backendStatus === "ANALIZANDO") return "ANALIZANDO";
        return "ANALIZANDO";
      })() as SyllabusReview["status"];

      return {
        id: idStr,
        courseName:
          (item.cursoNombre as string) ||
          (item.courseName as string) ||
          "Sin nombre",
        courseCode:
          (item.cursoCodigo as string) || (item.courseCode as string) || "N/A",
        teacherName:
          (item.nombreDocente as string) ||
          (item.teacherName as string) ||
          "No asignado",
        docenteId: Number(item.asignadoADocenteId ?? item.docenteId ?? 0) || 0,
        syllabusId: syllabusIdNum,
        status,
        submittedDate: (item.createdAt as string) || new Date().toISOString(),
      };
    }) as SyllabusReview[];
  }

  async fetchReviewData(
    syllabusId: number,
    baseUrl?: string,
  ): Promise<ReviewData | null> {
    const apiBase = normalizeApiBase(baseUrl);
    const url = `${apiBase}/syllabus/${syllabusId}/revision`;

    const res = await authFetch(url);

    if (res.status === 404) {
      return null;
    }

    if (!res.ok) {
      throw new Error(await readReviewApiError(res));
    }

    const json = (await res.json()) as BackendRevisionResponse;

    return backendRevisionToReviewData(json);
  }

  async saveReviewData(
    syllabusId: number,
    reviewData: ReviewData,
    baseUrl?: string,
  ): Promise<void> {
    const apiBase = normalizeApiBase(baseUrl);
    const url = `${apiBase}/syllabus/${syllabusId}/revision`;

    const secciones = reviewDataToBackendSections(reviewData);

    const res = await authFetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        secciones,
      }),
    });

    if (!res.ok) {
      throw new Error(await readReviewApiError(res));
    }
  }

  async approveSyllabus(
    data: ApproveRejectRequest,
    baseUrl?: string,
  ): Promise<void> {
    const apiBase = normalizeApiBase(baseUrl);

    const isDisapprove = data.estado === "DESAPROBADO";
    const endpoint = isDisapprove ? "desaprobar" : "aprobar";
    const url = `${apiBase}/syllabus/${data.syllabusId}/${endpoint}`;

    let body: Record<string, unknown>;

    if (isDisapprove) {
      const observacionesArray: Array<{
        numeroSeccion: number;
        nombreSeccion: string;
        comentario: string;
      }> = [];

      Object.entries(data.reviewData || {}).forEach(([fieldId, value]) => {
        if (value.status === "rejected" && value.comment?.trim()) {
          const sections = mapFieldToSections(fieldId);

          sections
            .filter((numeroSeccion) => numeroSeccion > 0)
            .forEach((numeroSeccion) => {
              observacionesArray.push({
                numeroSeccion,
                nombreSeccion: SECTION_NAME_MAP[numeroSeccion] ?? fieldId,
                comentario: value.comment.trim(),
              });
            });
        }
      });

      body = {
        silaboId: data.syllabusId,
        observaciones: observacionesArray,
      };
    } else {
      body = {
        estado: data.estado,
        reviewData: data.reviewData,
      };
    }

    const res = await authFetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      throw new Error(await readReviewApiError(res));
    }
  }
}

export const syllabusReviewManager = new SyllabusReviewManager();

export const useSyllabusInReview = (
  options?: UseQueryOptions<SyllabusReview[], Error>,
) => {
  return useQuery<SyllabusReview[], Error>({
    queryKey: ["syllabus", "in-review"],
    queryFn: () => syllabusReviewManager.fetchAllInReview(),
    staleTime: 0,
    refetchOnMount: "always",
    refetchOnWindowFocus: true,
    refetchInterval: false,
    retry: false,
    ...options,
  });
};

export const useReviewData = (
  syllabusId: number | null | undefined,
  options?: UseQueryOptions<ReviewData | null, Error>,
) => {
  return useQuery<ReviewData | null, Error>({
    queryKey: ["syllabus", syllabusId, "review-data"],
    queryFn: () => syllabusReviewManager.fetchReviewData(syllabusId as number),
    enabled: syllabusId !== null && syllabusId !== undefined,
    retry: false,
    staleTime: 10_000,
    ...options,
  });
};

export const useSaveReviewData = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      syllabusId,
      reviewData,
    }: {
      syllabusId: number;
      reviewData: ReviewData;
    }) => syllabusReviewManager.saveReviewData(syllabusId, reviewData),

    onSuccess: async (_data, variables) => {
      await queryClient.invalidateQueries({
        queryKey: ["syllabus", variables.syllabusId, "review-data"],
      });

      await queryClient.invalidateQueries({
        queryKey: ["syllabus", "in-review"],
      });
    },
  });
};

export const useApproveSyllabus = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: ApproveRejectRequest) =>
      syllabusReviewManager.approveSyllabus(data),

    onSuccess: async () => {
      await queryClient.cancelQueries({
        queryKey: ["syllabus", "in-review"],
      });

      queryClient.removeQueries({
        queryKey: ["syllabus", "in-review"],
      });

      await queryClient.refetchQueries({
        queryKey: ["syllabus", "in-review"],
        type: "all",
      });
    },
  });
};
