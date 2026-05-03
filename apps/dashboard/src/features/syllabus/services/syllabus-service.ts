export interface SyllabusData {
  id: number;
  codigo: string;
  estado: string;
  [key: string]: unknown;
}

const API_BASE =
  import.meta.env.VITE_API_BASE_URL ?? "http://localhost:7071/api";

const getAuthHeaders = (): Record<string, string> => {
  const token =
    sessionStorage.getItem("token") ?? localStorage.getItem("token");
  return token ? { Authorization: `Bearer ${token}` } : {};
};

export const syllabusService = {
  async fetchSyllabus(syllabusId: number): Promise<SyllabusData> {
    const response = await fetch(`${API_BASE}/syllabus/${syllabusId}`, {
      headers: getAuthHeaders(),
    });

    if (!response.ok) {
      throw new Error("Error al cargar sílabo");
    }

    const result = await response.json();
    return result.data || result;
  },

  async checkDraftByCodigo(codigo: string): Promise<SyllabusData | null> {
    const response = await fetch(
      `${API_BASE}/syllabus/draft?codigo=${encodeURIComponent(codigo)}`,
      {
        headers: getAuthHeaders(),
      },
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
