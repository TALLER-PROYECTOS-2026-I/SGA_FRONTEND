import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

const API_BASE =
  import.meta.env.VITE_API_BASE_URL ?? "http://localhost:7071/api";

// 1. OBTENER (GET) los conceptos de una semana
export const useGetConceptos = (
  silaboId: number | null,
  unidadId: number,
  semana: number,
) => {
  return useQuery({
    queryKey: ["conceptos", silaboId, unidadId, semana],
    queryFn: async () => {
      if (!silaboId) return [];

      const url = `${API_BASE}/syllabus/${silaboId}/unidades/${unidadId}/semanas/${semana}/contenidos-conceptuales`;
      console.log("GET conceptos URL:", url);

      const res = await fetch(url);
      const data = await res.json().catch(() => null);

      console.log("GET conceptos RESP:", res.status, data);

      if (!res.ok) {
        throw new Error(
          data?.message ||
            data?.error ||
            `Error al obtener conceptos (${res.status})`,
        );
      }

      return data?.data || data || [];
    },
    enabled: !!silaboId && !!unidadId && !!semana,
  });
};

// 2. CREAR (POST) un nuevo concepto
export const useCrearConcepto = (
  silaboId: number | null,
  unidadId: number,
  semana: number,
) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (descripcion: string) => {
      const url = `${API_BASE}/syllabus/${silaboId}/unidades/${unidadId}/semanas/${semana}/contenidos-conceptuales`;
      const payload = { descripcion, orden: 1 };

      console.log("POST concepto URL:", url);
      console.log("POST concepto BODY:", payload);

      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json().catch(() => null);

      console.log("POST concepto RESP:", res.status, data);

      if (!res.ok) {
        throw new Error(
          data?.message || data?.error || `Error al crear (${res.status})`,
        );
      }

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["conceptos", silaboId, unidadId, semana],
      });
    },
  });
};

// 3. ELIMINAR (DELETE) un concepto
export const useEliminarConcepto = (
  silaboId: number | null,
  unidadId: number,
  semana: number,
) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (contenidoId: number) => {
      const url = `${API_BASE}/syllabus/${silaboId}/unidades/${unidadId}/semanas/${semana}/contenidos-conceptuales/${contenidoId}`;

      console.log("DELETE concepto URL:", url);

      const res = await fetch(url, {
        method: "DELETE",
      });

      const data = await res.json().catch(() => null);

      console.log("DELETE concepto RESP:", res.status, data);

      if (!res.ok) {
        throw new Error(
          data?.message || data?.error || `Error al eliminar (${res.status})`,
        );
      }

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["conceptos", silaboId, unidadId, semana],
      });
    },
  });
};

// 4. ACTUALIZAR (PUT) un concepto
export const useActualizarConcepto = (
  silaboId: number | null,
  unidadId: number,
  semana: number,
) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      contenidoId,
      descripcion,
    }: {
      contenidoId: number;
      descripcion: string;
    }) => {
      const url = `${API_BASE}/syllabus/${silaboId}/unidades/${unidadId}/semanas/${semana}/contenidos-conceptuales/${contenidoId}`;
      const payload = { descripcion, orden: 1 };

      console.log("PUT concepto URL:", url);
      console.log("PUT concepto BODY:", payload);

      const res = await fetch(url, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json().catch(() => null);

      console.log("PUT concepto RESP:", res.status, data);

      if (!res.ok) {
        throw new Error(
          data?.message || data?.error || `Error al actualizar (${res.status})`,
        );
      }

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["conceptos", silaboId, unidadId, semana],
      });
    },
  });
};
