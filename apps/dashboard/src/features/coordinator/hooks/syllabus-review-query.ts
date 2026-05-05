import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { UseQueryOptions } from "@tanstack/react-query";

export type SyllabusReviewStatus = "EN_REVISIÓN";

export interface SyllabusReview {
  id: string;
  courseName: string;
  courseCode: string;
  teacherName: string;
  docenteId: number;
  syllabusId: number;
  status: SyllabusReviewStatus;
  academicPeriod: string;
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

interface DatosGeneralesResponse {
  semestreAcademico?: string;
  semestre_academico?: string;
  periodoAcademico?: string;
  periodo_academico?: string;
  data?: {
    semestreAcademico?: string;
    semestre_academico?: string;
    periodoAcademico?: string;
    periodo_academico?: string;
  };
}

function mapFieldToSections(fieldId: string): number[] {
  const mapping: Record<string, number[]> = {
    "step-1": [1],
    "step-2": [2],
    "step-3": [3],
    "step-4": [4],
    "step-5": [5, 6],
    "step-6": [7],
    "step-7": [8],
  };

  return mapping[fieldId] || [0];
}

function isInReviewStatus(value: unknown) {
  const status = String(value ?? "").trim().toUpperCase();

  return (
    status === "EN_REVISIÓN" ||
    status === "EN_REVISION" ||
    status === "ANALIZANDO"
  );
}

function getAcademicPeriodFromItem(item: Record<string, unknown>) {
  return (
    (item.periodoAcademico as string) ||
    (item.periodo_academico as string) ||
    (item.semestreAcademico as string) ||
    (item.semestre_academico as string) ||
    (item.academicPeriod as string) ||
    (item.periodo as string) ||
    ""
  );
}

function getAcademicPeriodFromDatosGenerales(data: DatosGeneralesResponse) {
  return (
    data.semestreAcademico ||
    data.semestre_academico ||
    data.periodoAcademico ||
    data.periodo_academico ||
    data.data?.semestreAcademico ||
    data.data?.semestre_academico ||
    data.data?.periodoAcademico ||
    data.data?.periodo_academico ||
    ""
  );
}

class SyllabusReviewManager {
  private getApiBase(baseUrl?: string) {
    return (
      baseUrl ??
      import.meta.env.VITE_API_BASE_URL ??
      "http://localhost:7071/api"
    );
  }

  private async fetchAcademicPeriodFromGeneralData(
    syllabusId: number,
    baseUrl?: string,
  ): Promise<string> {
    if (!syllabusId) return "";

    const apiBase = this.getApiBase(baseUrl);
    const url = `${apiBase}/syllabus/${syllabusId}/datos-generales`;

    try {
      const res = await fetch(url, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!res.ok) {
        return "";
      }

      const json = (await res.json()) as DatosGeneralesResponse;
      return getAcademicPeriodFromDatosGenerales(json);
    } catch {
      return "";
    }
  }

  async fetchAllInReview(baseUrl?: string): Promise<SyllabusReview[]> {
    const apiBase = this.getApiBase(baseUrl);
    const url = `${apiBase}/syllabus/revision`;

    const res = await fetch(url);

    if (!res.ok) {
      const t = await res.text();
      throw new Error(`${res.status} ${t}`);
    }

    const json = await res.json();
    const rawData = Array.isArray(json) ? json : json?.data ?? [];

    const mappedSyllabi: SyllabusReview[] = rawData
      .filter((item: Record<string, unknown>) =>
        isInReviewStatus(
          item.estadoRevision ??
            item.estado_revision ??
            item.status ??
            item.estado,
        ),
      )
      .map((item: Record<string, unknown>) => {
        const possibleId =
          item.id ??
          item._id ??
          item.idRevision ??
          item.syllabusId ??
          item.silaboId ??
          item.silabo_id ??
          item.silaboID ??
          "";

        const possibleSyllabusId =
          item.syllabusId ??
          item.silaboId ??
          item.silabo_id ??
          item.silaboID ??
          item.idSyllabus ??
          item.id ??
          0;

        return {
          id: String(possibleId ?? ""),

          courseName:
            (item.cursoNombre as string) ||
            (item.curso_nombre as string) ||
            (item.courseName as string) ||
            "Sin nombre",

          courseCode:
            (item.cursoCodigo as string) ||
            (item.curso_codigo as string) ||
            (item.courseCode as string) ||
            "N/A",

          teacherName:
            (item.nombreDocente as string) ||
            (item.docenteNombre as string) ||
            (item.docente_nombre as string) ||
            (item.docente as string) ||
            (item.correoDocente as string) ||
            (item.correo_docente as string) ||
            (item.correo as string) ||
            (item.teacherName as string) ||
            (item.teacherEmail as string) ||
            "No asignado",

          docenteId:
            Number(
              item.asignadoADocenteId ??
                item.asignado_a_docente_id ??
                item.docenteId ??
                item.docente_id ??
                0,
            ) || 0,

          syllabusId: Number(possibleSyllabusId) || 0,

          status: "EN_REVISIÓN" as const,

          academicPeriod: getAcademicPeriodFromItem(item),

          submittedDate:
            (item.fechaEnvio as string) ||
            (item.fecha_envio as string) ||
            (item.updatedAt as string) ||
            (item.updated_at as string) ||
            (item.createdAt as string) ||
            (item.created_at as string) ||
            new Date().toISOString(),
        };
      });

    const enrichedSyllabi = await Promise.all(
      mappedSyllabi.map(async (syllabus) => {
        if (syllabus.academicPeriod) {
          return syllabus;
        }

        const academicPeriod =
          await this.fetchAcademicPeriodFromGeneralData(
            syllabus.syllabusId,
            baseUrl,
          );

        return {
          ...syllabus,
          academicPeriod: academicPeriod || "No informado",
        };
      }),
    );

    return enrichedSyllabi;
  }

  async fetchReviewData(
    syllabusId: number,
    baseUrl?: string,
  ): Promise<ReviewData | null> {
    const apiBase = this.getApiBase(baseUrl);
    const url = `${apiBase}/syllabus/${syllabusId}/revision`;

    const res = await fetch(url);

    if (res.status === 404) {
      return null;
    }

    if (!res.ok) {
      const t = await res.text();
      throw new Error(`${res.status} ${t}`);
    }

    return (await res.json()) as ReviewData;
  }

  async saveReviewData(
    syllabusId: number,
    reviewData: ReviewData,
    baseUrl?: string,
  ): Promise<void> {
    const apiBase = this.getApiBase(baseUrl);
    const url = `${apiBase}/syllabus/${syllabusId}/revision`;

    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(reviewData),
    });

    if (!res.ok) {
      const t = await res.text();
      throw new Error(`${res.status} ${t}`);
    }
  }

  async approveSyllabus(
    data: ApproveRejectRequest,
    baseUrl?: string,
  ): Promise<void> {
    const apiBase = this.getApiBase(baseUrl);

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

          sections.forEach((numeroSeccion) => {
            observacionesArray.push({
              numeroSeccion,
              nombreSeccion: fieldId,
              comentario: value.comment || "",
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

    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const t = await res.text();
      throw new Error(`${res.status} ${t}`);
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
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["syllabus", variables.syllabusId, "review-data"],
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