import { authFetch } from "../../../common/utils/auth-fetch";

export interface SyllabusData {
  id: number;
  codigo: string;
  estado: string;
  [key: string]: unknown;
}

export const syllabusService = {
  async fetchSyllabus(syllabusId: number): Promise<SyllabusData> {
    const response = await authFetch(
      `${import.meta.env.VITE_API_URL}/api/syllabus/${syllabusId}`,
    );

    if (!response.ok) {
      throw new Error("Error al cargar sílabo");
    }

    const result = await response.json();
    return result.data || result;
  },

  async checkDraftByCodigo(codigo: string): Promise<SyllabusData | null> {
    const response = await authFetch(
      `${import.meta.env.VITE_API_URL}/api/syllabus/draft?codigo=${codigo}`,
    );

    if (!response.ok) {
      if (response.status === 404) {
        return null;
      }
      throw new Error("Error al verificar borrador");
    }

    const result = await response.json();
    return result.data || result;
  },
};
