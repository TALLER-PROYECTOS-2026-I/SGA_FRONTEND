import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  authFetch,
  getApiBaseUrl,
  readApiErrorMessage,
} from "../../../common/utils/auth-fetch";

export type CurriculumCourse = {
  id: number;
  periodo: string;
  codigo: string;
  nombre: string;
  ciclo: number | null;
  creditos: number;
  horasTeoria: number;
  horasPractica: number;
  modalidad: string;
  tipoCurso: string | null;
  areaCurricular: string | null;
  prerrequisitos: string[];
  activo: boolean;
  createdAt: string | null;
  updatedAt: string | null;
};

export type CurriculumCycle = {
  ciclo: number;
  nombre: string;
  cursos: CurriculumCourse[];
};

export type CurriculumMesh = {
  periodo: string;
  ciclos: CurriculumCycle[];
  electivos: CurriculumCourse[];
};

export type CurriculumCourseCreate = {
  periodo?: string;
  codigo: string;
  nombre: string;
  ciclo?: number | null;
  creditos: number;
  horasTeoria?: number;
  horasPractica?: number;
  modalidad?: string;
  tipoCurso?: string | null;
  areaCurricular?: string | null;
  prerrequisitos?: string[];
};

export type CurriculumCourseUpdate = {
  codigo?: string;
  nombre?: string;
  ciclo?: number | null;
  creditos?: number;
  horasTeoria?: number;
  horasPractica?: number;
  modalidad?: string;
  tipoCurso?: string | null;
  areaCurricular?: string | null;
  prerrequisitos?: string[];
};

async function parseApiResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    throw new Error(await readApiErrorMessage(response));
  }

  const json = await response.json();
  return (json?.data ?? json) as T;
}

export async function fetchCurriculumPeriods(): Promise<string[]> {
  const response = await authFetch(`${getApiBaseUrl()}/curriculum/periods`);
  return parseApiResponse<string[]>(response);
}

export async function fetchCurriculumMesh(
  periodo: string,
): Promise<CurriculumMesh> {
  const params = new URLSearchParams({ periodo });
  const response = await authFetch(
    `${getApiBaseUrl()}/curriculum/mesh?${params.toString()}`,
  );

  return parseApiResponse<CurriculumMesh>(response);
}

export async function createCurriculumCourse(
  payload: CurriculumCourseCreate,
): Promise<CurriculumCourse> {
  const response = await authFetch(`${getApiBaseUrl()}/curriculum/courses`, {
    method: "POST",
    body: JSON.stringify(payload),
  });

  return parseApiResponse<CurriculumCourse>(response);
}

export async function updateCurriculumCourse(
  courseId: number,
  payload: CurriculumCourseUpdate,
): Promise<CurriculumCourse> {
  const response = await authFetch(
    `${getApiBaseUrl()}/curriculum/courses/${courseId}`,
    {
      method: "PATCH",
      body: JSON.stringify(payload),
    },
  );

  return parseApiResponse<CurriculumCourse>(response);
}

export async function deleteCurriculumCourse(
  courseId: number,
): Promise<CurriculumCourse> {
  const response = await authFetch(
    `${getApiBaseUrl()}/curriculum/courses/${courseId}`,
    {
      method: "DELETE",
    },
  );

  return parseApiResponse<CurriculumCourse>(response);
}

export function useCurriculumPeriods() {
  return useQuery({
    queryKey: ["curriculum-periods"],
    queryFn: fetchCurriculumPeriods,
  });
}

export function useCurriculumMesh(periodo: string) {
  return useQuery({
    queryKey: ["curriculum-mesh", periodo],
    queryFn: () => fetchCurriculumMesh(periodo),
    enabled: Boolean(periodo),
  });
}

export function useCreateCurriculumCourse(periodo: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createCurriculumCourse,
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: ["curriculum-mesh", periodo],
      });

      void queryClient.invalidateQueries({
        queryKey: ["curriculum-periods"],
      });
    },
  });
}

export function useUpdateCurriculumCourse(periodo: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      courseId,
      payload,
    }: {
      courseId: number;
      payload: CurriculumCourseUpdate;
    }) => updateCurriculumCourse(courseId, payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: ["curriculum-mesh", periodo],
      });
    },
  });
}

export function useDeleteCurriculumCourse(periodo: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteCurriculumCourse,
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: ["curriculum-mesh", periodo],
      });
    },
  });
}
