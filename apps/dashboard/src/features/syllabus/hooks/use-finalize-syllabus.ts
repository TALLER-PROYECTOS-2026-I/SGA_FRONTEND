import { useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { useSubmitToAnalysis } from "./use-submit-to-analysis";
import { useSteps } from "../contexts/steps-context-provider";

interface UseFinalizeSyllabusOptions {
  syllabusId: number | null;
  onBeforeFinalize?: () => Promise<void>;
}

/**
 * Hook para finalizar el proceso del sílabo desde cualquier step
 * Maneja la confirmación, envío a análisis y navegación
 */
export const useFinalizeSyllabus = ({
  syllabusId,
  onBeforeFinalize,
}: UseFinalizeSyllabusOptions) => {
  const navigate = useNavigate();
  const submitToAnalysis = useSubmitToAnalysis();
  const { currentStep, allowedSteps } = useSteps();

  // Determinar si el step actual es el último permitido
  const isLastStep =
    allowedSteps && allowedSteps.length > 0
      ? currentStep === Math.max(...allowedSteps)
      : false;

  const finalizeSyllabus = useCallback(async () => {
    if (!syllabusId) {
      toast.error("ID del sílabo no encontrado");
      throw new Error("ID del sílabo no encontrado");
    }

    // 1. Ejecutar lógica previa (guardar datos del step actual)
    try {
      if (onBeforeFinalize) {
        await onBeforeFinalize();
      }
    } catch (error) {
      console.error("❌ Error al guardar datos:", error);
      const errorMessage =
        error instanceof Error ? error.message : "Error al guardar datos";
      toast.error("Error al guardar", {
        description: errorMessage,
      });
      throw error;
    }

    // 2. Mostrar confirmación con toast interactivo
    return new Promise<boolean>((resolve) => {
      const toastId = toast("¿Deseas enviar el sílabo a revisión?", {
        description: "Esta acción cambiará el estado a 'ANALIZANDO'",
        duration: Infinity,
        action: {
          label: "✓ Enviar",
          onClick: async () => {
            toast.dismiss(toastId);

            // Mostrar loading
            const loadingToast = toast.loading("Enviando sílabo a revisión...");

            try {
              console.log("📤 Enviando sílabo a análisis...");

              await submitToAnalysis.mutateAsync({ syllabusId });

              toast.dismiss(loadingToast);
              toast.success("¡Sílabo enviado exitosamente!", {
                description: "El coordinador revisará tu sílabo pronto.",
              });

              setTimeout(() => {
                navigate("/mis-asignaciones");
              }, 2000);

              resolve(true);
            } catch (error) {
              toast.dismiss(loadingToast);
              console.error("❌ Error al finalizar:", error);

              const errorMessage =
                error instanceof Error
                  ? error.message
                  : "Error al procesar la solicitud";

              toast.error("Error al enviar sílabo", {
                description: errorMessage,
              });

              resolve(false);
            }
          },
        },
        cancel: {
          label: "Cancelar",
          onClick: () => {
            toast.dismiss(toastId);
            toast.info("Envío cancelado. Los cambios fueron guardados.");
            resolve(false);
          },
        },
      });
    });
  }, [syllabusId, onBeforeFinalize, submitToAnalysis, navigate]);

  return {
    isLastStep,
    finalizeSyllabus,
    canFinalize: isLastStep && !!syllabusId,
  };
};
