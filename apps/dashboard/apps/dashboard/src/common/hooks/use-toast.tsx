import { toast as sonnerToast } from "sonner";

/**
 * Hook para usar el sistema de notificaciones Toast con Sonner
 *
 * @example
 * const toast = useToast();
 * toast.success("¡Éxito!", "Operación completada");
 * toast.error("Error", "Algo salió mal");
 */
export function useToast() {
  return {
    success: (title: string, message?: string) => {
      if (message) {
        sonnerToast.success(title, { description: message });
      } else {
        sonnerToast.success(title);
      }
    },
    error: (title: string, message?: string) => {
      if (message) {
        sonnerToast.error(title, { description: message });
      } else {
        sonnerToast.error(title);
      }
    },
    warning: (title: string, message?: string) => {
      if (message) {
        sonnerToast.warning(title, { description: message });
      } else {
        sonnerToast.warning(title);
      }
    },
    info: (title: string, message?: string) => {
      if (message) {
        sonnerToast.info(title, { description: message });
      } else {
        sonnerToast.info(title);
      }
    },
    promise: sonnerToast.promise,
    loading: sonnerToast.loading,
    dismiss: sonnerToast.dismiss,
  };
}
