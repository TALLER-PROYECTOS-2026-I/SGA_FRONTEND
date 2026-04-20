import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

const API_BASE = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:7071/api";

// 1. OBTENER (GET) los conceptos de una semana
export const useGetConceptos = (silaboId: number | null, unidadId: number, semana: number) => {
  return useQuery({
    queryKey: ["conceptos", silaboId, unidadId, semana],
    queryFn: async () => {
      if (!silaboId) return [];
      const res = await fetch(`${API_BASE}/syllabus/${silaboId}/unidades/${unidadId}/semanas/${semana}/contenidos-conceptuales`);
      if (!res.ok) throw new Error("Error al obtener conceptos");
      const data = await res.json();
      return data.data || data;
    },
    enabled: !!silaboId && !!unidadId && !!semana, // Solo busca si tenemos los 3 datos
  });
};

// 2. CREAR (POST) un nuevo concepto
export const useCrearConcepto = (silaboId: number | null, unidadId: number, semana: number) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (descripcion: string) => {
      const res = await fetch(`${API_BASE}/syllabus/${silaboId}/unidades/${unidadId}/semanas/${semana}/contenidos-conceptuales`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ descripcion, orden: 1 }),
      });
      if (!res.ok) throw new Error("Error al crear");
      return res.json();
    },
    onSuccess: () => {
      // Recarga la lista automáticamente al guardar
      queryClient.invalidateQueries({ queryKey: ["conceptos", silaboId, unidadId, semana] });
    },
  });
};

// 3. ELIMINAR (DELETE) un concepto
export const useEliminarConcepto = (silaboId: number | null, unidadId: number, semana: number) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (contenidoId: number) => {
      const res = await fetch(`${API_BASE}/syllabus/${silaboId}/unidades/${unidadId}/semanas/${semana}/contenidos-conceptuales/${contenidoId}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Error al eliminar");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["conceptos", silaboId, unidadId, semana] });
    },
  });
};



// 4. ACTUALIZAR (PUT) un concepto
export const useActualizarConcepto = (silaboId: number | null, unidadId: number, semana: number) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ contenidoId, descripcion }: { contenidoId: number, descripcion: string }) => {
      const res = await fetch(`${API_BASE}/syllabus/${silaboId}/unidades/${unidadId}/semanas/${semana}/contenidos-conceptuales/${contenidoId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ descripcion, orden: 1 }),
      });
      if (!res.ok) throw new Error("Error al actualizar");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["conceptos", silaboId, unidadId, semana] });
    },
  });
};
